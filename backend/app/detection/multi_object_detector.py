import io
import time
import math
import uuid
import base64
import numpy as np
from PIL import Image, ImageOps
import cv2
import torch
from typing import List, Dict, Any, Tuple, Optional

from app.ml.categories import CATEGORIES, CATEGORY_METADATA
from app.ml.classifier import WasteClassifier
from app.schemas import DetectedWasteItem, AlternativePrediction

def calculate_iou(boxA: Dict[str, float], boxB: Dict[str, float]) -> float:
    xA = max(boxA["x"], boxB["x"])
    yA = max(boxA["y"], boxB["y"])
    xB = min(boxA["x"] + boxA["w"], boxB["x"] + boxB["w"])
    yB = min(boxA["y"] + boxA["h"], boxB["y"] + boxB["h"])

    interArea = max(0.0, xB - xA) * max(0.0, yB - yA)
    boxAArea = boxA["w"] * boxA["h"]
    boxBArea = boxB["w"] * boxB["h"]
    denom = boxAArea + boxBArea - interArea
    return interArea / denom if denom > 0 else 0.0

def apply_nms(boxes: List[Dict[str, float]], iou_threshold: float = 0.35) -> List[Dict[str, float]]:
    if not boxes:
        return []
    # Sort boxes by area descending
    sorted_boxes = sorted(boxes, key=lambda b: b["w"] * b["h"], reverse=True)
    selected: List[Dict[str, float]] = []

    for b in sorted_boxes:
        overlap = False
        for s in selected:
            if calculate_iou(b, s) > iou_threshold:
                overlap = True
                break
        if not overlap:
            selected.append(b)
    return selected

class MultiObjectDetector:
    """
    Multi-Object Detection and Localization Engine for Waste Items.
    Decomposes multi-item photographs and live camera frames into distinct
    bounding boxes, generates base64 thumbnails, and performs dual-vision
    calibrated inference per item.
    """
    _instance: Optional["MultiObjectDetector"] = None

    def __init__(self):
        self.classifier = WasteClassifier.get_instance()

    @classmethod
    def get_instance(cls) -> "MultiObjectDetector":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _extract_bounding_boxes(self, img_bgr: np.ndarray) -> List[Dict[str, float]]:
        h_img, w_img = img_bgr.shape[:2]
        total_area = h_img * w_img

        # Preprocessing: convert to grayscale and bilateral filter to preserve edges
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (7, 7), 0)

        # Otsu thresholding + Adaptive thresholding combination
        _, otsu = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        adaptive = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 4)
        combined = cv2.bitwise_or(otsu, adaptive)

        # Morphological operations to close holes and bridge components
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (11, 11))
        closed = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel, iterations=2)
        dilated = cv2.dilate(closed, kernel, iterations=1)

        # Find external contours
        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        candidate_boxes = []
        for cnt in contours:
            area = cv2.contourArea(cnt)
            area_frac = area / total_area
            # Discard tiny speckles (< 2.0%) and full-frame outer borders (> 95%)
            if 0.025 <= area_frac <= 0.95:
                x, y, w, h = cv2.boundingRect(cnt)
                # Ensure reasonable aspect ratio
                aspect = max(w / max(1, h), h / max(1, w))
                if aspect <= 6.0:
                    candidate_boxes.append({
                        "x": round(float(x) / w_img, 4),
                        "y": round(float(y) / h_img, 4),
                        "w": round(float(w) / w_img, 4),
                        "h": round(float(h) / h_img, 4)
                    })

        # Apply Non-Maximum Suppression
        filtered_boxes = apply_nms(candidate_boxes, iou_threshold=0.35)

        # If multiple separate objects were found (2 to 6), return them
        if 2 <= len(filtered_boxes) <= 6:
            # Sort left-to-right, top-to-bottom
            return sorted(filtered_boxes, key=lambda b: (b["y"] // 0.3, b["x"]))

        # Fallback to single centered object proposal
        return [{"x": 0.08, "y": 0.08, "w": 0.84, "h": 0.84}]

    def _infer_material_attributes(self, category: str, subtype: Optional[str]) -> Dict[str, Any]:
        attrs = {
            "is_hazardous": category in ["hazardous", "batteries"],
            "requires_dry_handling": category in ["paper_cardboard", "e_waste", "textile"],
            "potential_moisture_source": category in ["organic_food"],
            "contains_heavy_metals": category in ["e_waste", "batteries"],
            "is_compactable": category in ["plastic", "paper_cardboard", "metal", "textile"],
            "flammability_risk": "high" if category in ["hazardous", "batteries"] else "low"
        }
        if category == "batteries":
            attrs["must_tape_terminals"] = True
            attrs["prohibit_compaction"] = True
        elif category == "e_waste":
            attrs["data_sanitization_needed"] = subtype in ["smartphone_mobile", "computer_peripheral"]
            attrs["detachable_battery_check"] = True
        elif category == "organic_food":
            attrs["compostable"] = True
            attrs["high_biodegradability"] = True
        elif category == "plastic":
            attrs["clean_and_dry_required"] = True
        elif category == "paper_cardboard":
            attrs["clean_and_dry_required"] = True
            attrs["vulnerable_to_organic_contamination"] = True

        return attrs

    def detect_and_classify(self, image_bytes: bytes) -> List[DetectedWasteItem]:
        image_pil = Image.open(io.BytesIO(image_bytes))
        image_pil = ImageOps.exif_transpose(image_pil).convert("RGB")
        w_img, h_img = image_pil.size

        # Convert to OpenCV BGR
        img_np = np.array(image_pil)
        img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

        boxes = self._extract_bounding_boxes(img_bgr)
        items: List[DetectedWasteItem] = []

        for idx, bbox in enumerate(boxes):
            item_id = f"item_{idx + 1}"

            # Calculate pixel crop with 4% padding
            pad_x = int(bbox["w"] * w_img * 0.04)
            pad_y = int(bbox["h"] * h_img * 0.04)
            x1 = max(0, int(bbox["x"] * w_img) - pad_x)
            y1 = max(0, int(bbox["y"] * h_img) - pad_y)
            x2 = min(w_img, int((bbox["x"] + bbox["w"]) * w_img) + pad_x)
            y2 = min(h_img, int((bbox["y"] + bbox["h"]) * h_img) + pad_y)

            crop_pil = image_pil.crop((x1, y1, x2, y2))

            # Generate base64 thumbnail
            thumb_pil = crop_pil.copy()
            thumb_pil.thumbnail((160, 160))
            thumb_buf = io.BytesIO()
            thumb_pil.save(thumb_buf, format="JPEG", quality=85)
            thumb_b64 = f"data:image/jpeg;base64,{base64.b64encode(thumb_buf.getvalue()).decode('utf-8')}"

            # Run inference on crop
            crop_buf = io.BytesIO()
            crop_pil.save(crop_buf, format="JPEG", quality=90)
            res = self.classifier.classify_image(crop_buf.getvalue())

            # Synthesize calibrated full probabilities across all 10 categories
            calibrated_p: Dict[str, float] = {}
            primary_cat = res.predicted_category
            primary_conf = float(res.confidence)

            # Distribute residual among alternatives
            alt_map = {alt.category: alt.confidence for alt in res.alternative_predictions}
            remaining_prob = max(0.02, 1.0 - primary_conf)
            alt_total = sum(alt_map.values()) or 1.0

            for cat in CATEGORIES:
                if cat == primary_cat:
                    calibrated_p[cat] = round(primary_conf, 4)
                elif cat in alt_map:
                    calibrated_p[cat] = round((alt_map[cat] / alt_total) * remaining_prob, 4)
                else:
                    calibrated_p[cat] = round(0.001, 4)

            # Normalize to strictly sum to 1.0
            p_sum = sum(calibrated_p.values())
            calibrated_p = {k: round(v / p_sum, 4) for k, v in calibrated_p.items()}

            # Shannon Entropy: H = -sum(p * log2(p))
            entropy = round(float(-sum(p * math.log2(max(1e-7, p)) for p in calibrated_p.values())), 4)

            # Determine uncertainty status
            status = "uncertain" if (primary_conf < 0.75 or entropy > 1.25) else "detected"

            attrs = self._infer_material_attributes(primary_cat, res.subtype)
            meta = CATEGORY_METADATA.get(primary_cat, {})

            items.append(DetectedWasteItem(
                item_id=item_id,
                bounding_box=bbox,
                thumbnail=thumb_b64,
                predicted_category=primary_cat,
                predicted_subtype=res.subtype,
                display_name=meta.get("display_name", primary_cat.replace("_", " ").title()),
                confidence=round(primary_conf, 4),
                calibrated_probabilities=calibrated_p,
                entropy=entropy,
                alternatives=res.alternative_predictions,
                material_attributes=attrs,
                status=status
            ))

        return items
