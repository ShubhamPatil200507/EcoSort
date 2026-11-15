"""
Anchor-Free YOLO Object Detector with Dual-Vision Refinement (EcoSort Research Upgrade)
Integrates Ultralytics YOLOv8 with the EcoSort statutory classification engine
to achieve real-time multi-object localization and category mapping.
"""

import io
import time
import math
import base64
import numpy as np
from PIL import Image, ImageOps
import cv2
import torch
from pathlib import Path
from typing import List, Dict, Any, Optional

from ultralytics import YOLO

from app.ml.categories import CATEGORIES, CATEGORY_METADATA
from app.ml.classifier import WasteClassifier
from app.detection.multi_object_detector import calculate_iou, apply_nms, prepare_square_crop
from app.schemas import DetectedWasteItem, AlternativePrediction

# COCO to EcoSort Category Bridge
COCO_TO_ECOSORT: Dict[str, Dict[str, str]] = {
    # Plastic
    "bottle": {"category": "plastic", "subtype": "plastic_bottle"},
    "cup": {"category": "plastic", "subtype": "food_container"},
    "bowl": {"category": "plastic", "subtype": "food_container"},

    # Glass
    "wine glass": {"category": "glass", "subtype": "broken_glassware"},
    "vase": {"category": "glass", "subtype": "glass_bottle"},

    # Metal
    "fork": {"category": "metal", "subtype": "scrap_metal"},
    "knife": {"category": "metal", "subtype": "scrap_metal"},
    "spoon": {"category": "metal", "subtype": "scrap_metal"},
    "scissors": {"category": "metal", "subtype": "scrap_metal"},

    # Paper & Cardboard
    "book": {"category": "paper_cardboard", "subtype": "office_paper"},

    # E-Waste
    "cell phone": {"category": "e_waste", "subtype": "smartphone_mobile"},
    "laptop": {"category": "e_waste", "subtype": "computer_peripheral"},
    "mouse": {"category": "e_waste", "subtype": "computer_peripheral"},
    "keyboard": {"category": "e_waste", "subtype": "computer_peripheral"},
    "remote": {"category": "e_waste", "subtype": "computer_peripheral"},
    "tv": {"category": "e_waste", "subtype": "computer_peripheral"},
    "toaster": {"category": "e_waste", "subtype": "computer_peripheral"},
    "microwave": {"category": "e_waste", "subtype": "computer_peripheral"},
    "hair drier": {"category": "e_waste", "subtype": "computer_peripheral"},

    # Organic
    "banana": {"category": "organic_food", "subtype": "fruit_vegetable_peel"},
    "apple": {"category": "organic_food", "subtype": "fruit_vegetable_peel"},
    "orange": {"category": "organic_food", "subtype": "fruit_vegetable_peel"},
    "broccoli": {"category": "organic_food", "subtype": "fruit_vegetable_peel"},
    "carrot": {"category": "organic_food", "subtype": "fruit_vegetable_peel"},
    "sandwich": {"category": "organic_food", "subtype": "food_leftovers"},
    "pizza": {"category": "organic_food", "subtype": "food_leftovers"},
    "donut": {"category": "organic_food", "subtype": "food_leftovers"},
    "cake": {"category": "organic_food", "subtype": "food_leftovers"},
    "hot dog": {"category": "organic_food", "subtype": "food_leftovers"},

    # Textile
    "backpack": {"category": "textile", "subtype": "garment_clothing"},
    "handbag": {"category": "textile", "subtype": "garment_clothing"},
    "suitcase": {"category": "textile", "subtype": "garment_clothing"},
    "tie": {"category": "textile", "subtype": "garment_clothing"}
}

class YOLOWasteDetector:
    """
    Anchor-Free YOLOv8 Object Detector for Multi-Item Waste Sorting.
    """
    _instance: Optional["YOLOWasteDetector"] = None

    def __init__(self, model_path: str = "yolov8n.pt"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.yolo_model = YOLO(model_path)
        self.classifier = WasteClassifier.get_instance()

    @classmethod
    def get_instance(cls) -> "YOLOWasteDetector":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def detect_and_classify(self, image_bytes: bytes, conf_thresh: float = 0.25) -> List[DetectedWasteItem]:
        image_pil = Image.open(io.BytesIO(image_bytes))
        image_pil = ImageOps.exif_transpose(image_pil).convert("RGB")
        w_img, h_img = image_pil.size

        # Run YOLO inference
        results = self.yolo_model.predict(image_pil, conf=conf_thresh, verbose=False)
        detected_boxes: List[Dict[str, Any]] = []

        if results and len(results) > 0:
            boxes = results[0].boxes
            for b in boxes:
                xyxy = b.xyxy[0].cpu().numpy()
                cls_id = int(b.cls[0].cpu().numpy())
                conf = float(b.conf[0].cpu().numpy())
                class_name = self.yolo_model.names.get(cls_id, "")

                x1, y1, x2, y2 = xyxy
                norm_box = {
                    "x": round(float(x1) / w_img, 4),
                    "y": round(float(y1) / h_img, 4),
                    "w": round(float(x2 - x1) / w_img, 4),
                    "h": round(float(y2 - y1) / h_img, 4)
                }

                # Ignore human apparel/persons or background items
                if class_name in ["person", "chair", "dining table", "bed", "couch"]:
                    continue

                detected_boxes.append({
                    "bbox": norm_box,
                    "coco_class": class_name,
                    "coco_conf": conf
                })

        # If YOLO found 0 waste items, fall back to contour saliency decomposition
        if not detected_boxes:
            from app.detection.multi_object_detector import MultiObjectDetector
            return MultiObjectDetector.get_instance().detect_and_classify(image_bytes)

        # Apply NMS to remove redundant overlapping boxes
        nms_boxes = apply_nms([d["bbox"] for d in detected_boxes], iou_threshold=0.35)
        filtered_detected = [d for d in detected_boxes if any(calculate_iou(d["bbox"], nb) > 0.85 for nb in nms_boxes)]

        items: List[DetectedWasteItem] = []
        for idx, det in enumerate(filtered_detected):
            item_id = f"item_{idx + 1}"
            bbox = det["bbox"]
            coco_class = det["coco_class"]

            # Crop region with 5% margin
            pad_x = int(bbox["w"] * w_img * 0.05)
            pad_y = int(bbox["h"] * h_img * 0.05)
            x1 = max(0, int(bbox["x"] * w_img) - pad_x)
            y1 = max(0, int(bbox["y"] * h_img) - pad_y)
            x2 = min(w_img, int((bbox["x"] + bbox["w"]) * w_img) + pad_x)
            y2 = min(h_img, int((bbox["y"] + bbox["h"]) * h_img) + pad_y)

            crop_pil = image_pil.crop((x1, y1, x2, y2))

            # Thumbnail
            thumb_pil = crop_pil.copy()
            thumb_pil.thumbnail((160, 160))
            thumb_buf = io.BytesIO()
            thumb_pil.save(thumb_buf, format="JPEG", quality=85)
            thumb_b64 = f"data:image/jpeg;base64,{base64.b64encode(thumb_buf.getvalue()).decode('utf-8')}"

            # Letterbox pad to square to preserve aspect ratio without stretching
            padded_crop = prepare_square_crop(crop_pil)
            crop_buf = io.BytesIO()
            padded_crop.save(crop_buf, format="JPEG", quality=90)
            clf_res = self.classifier.classify_crop(crop_buf.getvalue())

            # Synthesize category: prioritize fine-grained dual-vision classifier
            coco_match = COCO_TO_ECOSORT.get(coco_class) if coco_class else None
            if clf_res.confidence >= 0.65:
                final_cat = clf_res.predicted_category
                final_subtype = clf_res.subtype
                final_conf = clf_res.confidence
                if coco_match and coco_match["category"] == final_cat:
                    final_conf = min(0.98, max(final_conf, det.get("coco_conf", 0.0) * 1.05))
            elif coco_match and det.get("coco_conf", 0.0) >= 0.55:
                final_cat = coco_match["category"]
                final_subtype = clf_res.subtype or coco_match.get("subtype")
                final_conf = max(det["coco_conf"], clf_res.confidence)
            else:
                final_cat = clf_res.predicted_category
                final_subtype = clf_res.subtype
                final_conf = clf_res.confidence

            # Calibrated full probability distribution using classifier's alternatives
            calibrated_p: Dict[str, float] = {}
            alt_map = {alt.category: alt.confidence for alt in clf_res.alternative_predictions}
            remaining_prob = max(0.02, 1.0 - final_conf)
            alt_total = sum(alt_map.values()) or 1.0

            for cat in CATEGORIES:
                if cat == final_cat:
                    calibrated_p[cat] = round(final_conf, 4)
                elif cat in alt_map:
                    calibrated_p[cat] = round((alt_map[cat] / alt_total) * remaining_prob, 4)
                else:
                    calibrated_p[cat] = round(0.001, 4)

            p_sum = sum(calibrated_p.values())
            calibrated_p = {k: round(v / p_sum, 4) for k, v in calibrated_p.items()}

            entropy = round(float(-sum(p * math.log2(max(1e-7, p)) for p in calibrated_p.values())), 4)
            status = "uncertain" if (final_conf < 0.70 or entropy > 1.30) else "detected"

            from app.detection.multi_object_detector import MultiObjectDetector
            attrs = MultiObjectDetector.get_instance()._infer_material_attributes(final_cat, final_subtype)
            meta = CATEGORY_METADATA.get(final_cat, {})

            items.append(DetectedWasteItem(
                item_id=item_id,
                bounding_box=bbox,
                thumbnail=thumb_b64,
                predicted_category=final_cat,
                predicted_subtype=final_subtype,
                display_name=meta.get("display_name", final_cat.replace("_", " ").title()),
                confidence=round(final_conf, 4),
                calibrated_probabilities=calibrated_p,
                entropy=entropy,
                alternatives=clf_res.alternative_predictions,
                material_attributes=attrs,
                status=status
            ))

        return items

    def detect_hybrid(self, image_bytes: bytes, conf_thresh: float = 0.20) -> List[DetectedWasteItem]:
        """
        True Multi-Object Hybrid Fusion Engine:
        1. Runs YOLOv8 anchor-free object detector for known COCO waste objects.
        2. Runs background-invariant contour saliency detector for unlisted objects (batteries, circuit boards, cans, boxes).
        3. Merges spatial bounding boxes using non-maximum suppression without dropping unlisted items.
        4. Applies square-padded letterboxing on each crop to preserve natural aspect ratio.
        5. Runs fine-grained dual-vision classifier on each crop.
        """
        image_pil = Image.open(io.BytesIO(image_bytes))
        image_pil = ImageOps.exif_transpose(image_pil).convert("RGB")
        w_img, h_img = image_pil.size
        img_np = np.array(image_pil)
        img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

        # 1. YOLO Proposals
        yolo_candidates: List[Dict[str, Any]] = []
        try:
            results = self.yolo_model.predict(image_pil, conf=conf_thresh, verbose=False)
            if results and len(results) > 0:
                for b in results[0].boxes:
                    xyxy = b.xyxy[0].cpu().numpy()
                    cls_id = int(b.cls[0].cpu().numpy())
                    conf = float(b.conf[0].cpu().numpy())
                    class_name = self.yolo_model.names.get(cls_id, "")
                    if class_name in ["person", "chair", "dining table", "bed", "couch"]:
                        continue
                    x1, y1, x2, y2 = xyxy
                    norm_box = {
                        "x": round(float(x1) / w_img, 4),
                        "y": round(float(y1) / h_img, 4),
                        "w": round(float(x2 - x1) / w_img, 4),
                        "h": round(float(y2 - y1) / h_img, 4)
                    }
                    if norm_box["w"] >= 0.03 and norm_box["h"] >= 0.03:
                        yolo_candidates.append({
                            "bbox": norm_box,
                            "coco_class": class_name,
                            "coco_conf": conf,
                            "source": "yolo"
                        })
        except Exception:
            pass

        # 2. Contour / Saliency Proposals
        from app.detection.multi_object_detector import MultiObjectDetector
        contour_boxes = MultiObjectDetector.get_instance()._extract_bounding_boxes(img_bgr)

        # 3. Fuse YOLO & Contour proposals
        fused_candidates: List[Dict[str, Any]] = list(yolo_candidates)
        for c_box in contour_boxes:
            cx = c_box["x"] + c_box["w"] / 2.0
            cy = c_box["y"] + c_box["h"] / 2.0
            # Check overlap with existing YOLO boxes
            overlaps = False
            for y_cand in yolo_candidates:
                y_box = y_cand["bbox"]
                iou = calculate_iou(c_box, y_box)
                inside = (y_box["x"] <= cx <= y_box["x"] + y_box["w"]) and (y_box["y"] <= cy <= y_box["y"] + y_box["h"])
                if iou >= 0.30 or inside:
                    overlaps = True
                    break
            if not overlaps:
                fused_candidates.append({
                    "bbox": c_box,
                    "coco_class": None,
                    "coco_conf": 0.0,
                    "source": "contour"
                })

        # Apply NMS on fused candidates to remove duplicates
        candidate_boxes = [d["bbox"] for d in fused_candidates]
        nms_boxes = apply_nms(candidate_boxes, iou_threshold=0.35)
        filtered = [d for d in fused_candidates if any(calculate_iou(d["bbox"], nb) > 0.85 for nb in nms_boxes)]

        if not filtered:
            filtered = [{
                "bbox": {"x": 0.08, "y": 0.08, "w": 0.84, "h": 0.84},
                "coco_class": None,
                "coco_conf": 0.0,
                "source": "fallback"
            }]

        # Sort reading order: top-to-bottom, left-to-right
        sorted_detected = sorted(filtered, key=lambda d: (d["bbox"]["y"] // 0.25, d["bbox"]["x"]))

        items: List[DetectedWasteItem] = []
        for idx, det in enumerate(sorted_detected[:8]):
            item_id = f"item_{idx + 1}"
            bbox = det["bbox"]
            coco_class = det["coco_class"]

            # Crop region with 5% margin
            pad_x = int(bbox["w"] * w_img * 0.05)
            pad_y = int(bbox["h"] * h_img * 0.05)
            x1 = max(0, int(bbox["x"] * w_img) - pad_x)
            y1 = max(0, int(bbox["y"] * h_img) - pad_y)
            x2 = min(w_img, int((bbox["x"] + bbox["w"]) * w_img) + pad_x)
            y2 = min(h_img, int((bbox["y"] + bbox["h"]) * h_img) + pad_y)

            crop_pil = image_pil.crop((x1, y1, x2, y2))

            # Thumbnail
            thumb_pil = crop_pil.copy()
            thumb_pil.thumbnail((160, 160))
            thumb_buf = io.BytesIO()
            thumb_pil.save(thumb_buf, format="JPEG", quality=85)
            thumb_b64 = f"data:image/jpeg;base64,{base64.b64encode(thumb_buf.getvalue()).decode('utf-8')}"

            # Letterbox pad to square to preserve aspect ratio without stretching
            padded_crop = prepare_square_crop(crop_pil)
            crop_buf = io.BytesIO()
            padded_crop.save(crop_buf, format="JPEG", quality=90)
            clf_res = self.classifier.classify_crop(crop_buf.getvalue())

            # Synthesize category: prioritize fine-grained dual-vision classifier
            coco_match = COCO_TO_ECOSORT.get(coco_class) if coco_class else None
            if clf_res.confidence >= 0.65:
                final_cat = clf_res.predicted_category
                final_subtype = clf_res.subtype
                final_conf = clf_res.confidence
                if coco_match and coco_match["category"] == final_cat:
                    final_conf = min(0.98, max(final_conf, det.get("coco_conf", 0.0) * 1.05))
            elif coco_match and det.get("coco_conf", 0.0) >= 0.55:
                final_cat = coco_match["category"]
                final_subtype = clf_res.subtype or coco_match.get("subtype")
                final_conf = max(det["coco_conf"], clf_res.confidence)
            else:
                final_cat = clf_res.predicted_category
                final_subtype = clf_res.subtype
                final_conf = clf_res.confidence

            # Calibrated full probability distribution using classifier's alternatives
            calibrated_p: Dict[str, float] = {}
            alt_map = {alt.category: alt.confidence for alt in clf_res.alternative_predictions}
            remaining_prob = max(0.02, 1.0 - final_conf)
            alt_total = sum(alt_map.values()) or 1.0

            for cat in CATEGORIES:
                if cat == final_cat:
                    calibrated_p[cat] = round(final_conf, 4)
                elif cat in alt_map:
                    calibrated_p[cat] = round((alt_map[cat] / alt_total) * remaining_prob, 4)
                else:
                    calibrated_p[cat] = round(0.001, 4)

            p_sum = sum(calibrated_p.values())
            calibrated_p = {k: round(v / p_sum, 4) for k, v in calibrated_p.items()}

            entropy = round(float(-sum(p * math.log2(max(1e-7, p)) for p in calibrated_p.values())), 4)
            status = "uncertain" if (final_conf < 0.70 or entropy > 1.30) else "detected"

            attrs = MultiObjectDetector.get_instance()._infer_material_attributes(final_cat, final_subtype)
            meta = CATEGORY_METADATA.get(final_cat, {})

            items.append(DetectedWasteItem(
                item_id=item_id,
                bounding_box=bbox,
                thumbnail=thumb_b64,
                predicted_category=final_cat,
                predicted_subtype=final_subtype,
                display_name=meta.get("display_name", final_cat.replace("_", " ").title()),
                confidence=round(final_conf, 4),
                calibrated_probabilities=calibrated_p,
                entropy=entropy,
                alternatives=clf_res.alternative_predictions,
                material_attributes=attrs,
                status=status
            ))

        return items
