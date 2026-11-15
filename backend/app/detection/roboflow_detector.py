"""
Roboflow Hosted Pretrained Waste Detector Client (EcoSort Cloud Vision Extension)
Connects to Roboflow Universe pre-trained waste detection models via the Inference SDK / REST API.
Enables fine-grained detection of real-world municipal waste items with automatic statutory mapping
and dual-vision local classifier refinement.
"""

import io
import os
import base64
import logging
from typing import List, Dict, Any, Optional
from PIL import Image, ImageOps
import requests
import math

from app.config import settings
from app.ml.categories import CATEGORIES, CATEGORY_METADATA
from app.ml.classifier import WasteClassifier
from app.detection.multi_object_detector import calculate_iou, apply_nms, prepare_square_crop
from app.schemas import DetectedWasteItem, AlternativePrediction

logger = logging.getLogger("ecosort.roboflow")

# Extensive mapping of Roboflow Universe waste classes (TACO, TrashNet, Waste-Detect)
# onto EcoSort's 10 canonical statutory waste streams.
ROBOFLOW_TO_ECOSORT: Dict[str, Dict[str, str]] = {
    # Plastic streams
    "plastic": {"category": "plastic", "subtype": "plastic_packaging"},
    "plastic_bottle": {"category": "plastic", "subtype": "plastic_bottle"},
    "bottle": {"category": "plastic", "subtype": "plastic_bottle"},
    "plastic_bag": {"category": "plastic", "subtype": "plastic_film_bag"},
    "polythene": {"category": "plastic", "subtype": "plastic_film_bag"},
    "wrapper": {"category": "plastic", "subtype": "plastic_wrapper"},
    "plastic_cup": {"category": "plastic", "subtype": "food_container"},
    "cup": {"category": "plastic", "subtype": "food_container"},
    "plastic_container": {"category": "plastic", "subtype": "food_container"},
    "straw": {"category": "plastic", "subtype": "single_use_plastic"},
    "polystyrene": {"category": "plastic", "subtype": "polystyrene_thermocol"},
    "styrofoam": {"category": "plastic", "subtype": "polystyrene_thermocol"},
    "pet_bottle": {"category": "plastic", "subtype": "plastic_bottle"},
    "hdpe": {"category": "plastic", "subtype": "hard_plastic"},

    # Paper & Cardboard streams
    "cardboard": {"category": "paper_cardboard", "subtype": "cardboard_box"},
    "cardboard_box": {"category": "paper_cardboard", "subtype": "cardboard_box"},
    "box": {"category": "paper_cardboard", "subtype": "cardboard_box"},
    "carton": {"category": "paper_cardboard", "subtype": "cardboard_box"},
    "paper": {"category": "paper_cardboard", "subtype": "office_paper"},
    "newspaper": {"category": "paper_cardboard", "subtype": "newspaper_print"},
    "magazine": {"category": "paper_cardboard", "subtype": "printed_magazine"},
    "tetra_pak": {"category": "paper_cardboard", "subtype": "tetra_pak_beverage"},
    "paper_cup": {"category": "paper_cardboard", "subtype": "composite_paper_cup"},

    # Metal streams
    "metal": {"category": "metal", "subtype": "scrap_metal"},
    "can": {"category": "metal", "subtype": "aluminum_beverage_can"},
    "tin_can": {"category": "metal", "subtype": "food_tin_can"},
    "aluminum": {"category": "metal", "subtype": "aluminum_foil"},
    "foil": {"category": "metal", "subtype": "aluminum_foil"},
    "bottle_cap": {"category": "metal", "subtype": "metal_cap"},
    "scrap_metal": {"category": "metal", "subtype": "scrap_metal"},

    # Glass streams
    "glass": {"category": "glass", "subtype": "glass_bottle"},
    "glass_bottle": {"category": "glass", "subtype": "glass_bottle"},
    "jar": {"category": "glass", "subtype": "glass_jar"},
    "broken_glass": {"category": "glass", "subtype": "broken_glassware"},
    "glassware": {"category": "glass", "subtype": "glassware"},

    # Batteries & E-Waste streams
    "battery": {"category": "batteries", "subtype": "dry_cell_alkaline"},
    "batteries": {"category": "batteries", "subtype": "dry_cell_alkaline"},
    "lithium_battery": {"category": "batteries", "subtype": "lithium_ion_cell"},
    "e_waste": {"category": "e_waste", "subtype": "electronic_scrap"},
    "electronics": {"category": "e_waste", "subtype": "computer_peripheral"},
    "cell_phone": {"category": "e_waste", "subtype": "smartphone_mobile"},
    "cable": {"category": "e_waste", "subtype": "wiring_cables"},
    "charger": {"category": "e_waste", "subtype": "charger_adapter"},
    "pcb": {"category": "e_waste", "subtype": "circuit_board"},

    # Organic streams
    "organic": {"category": "organic_food", "subtype": "food_leftovers"},
    "food_waste": {"category": "organic_food", "subtype": "food_leftovers"},
    "fruit": {"category": "organic_food", "subtype": "fruit_vegetable_peel"},
    "vegetable": {"category": "organic_food", "subtype": "fruit_vegetable_peel"},
    "peel": {"category": "organic_food", "subtype": "fruit_vegetable_peel"},
    "banana": {"category": "organic_food", "subtype": "fruit_vegetable_peel"},
    "apple": {"category": "organic_food", "subtype": "fruit_vegetable_peel"},

    # Textile streams
    "textile": {"category": "textile", "subtype": "garment_clothing"},
    "clothes": {"category": "textile", "subtype": "garment_clothing"},
    "cloth": {"category": "textile", "subtype": "cloth_scrap"},
    "shoe": {"category": "textile", "subtype": "footwear"},

    # Hazardous & Residual
    "medical_waste": {"category": "hazardous", "subtype": "biomedical_waste"},
    "mask": {"category": "hazardous", "subtype": "sanitary_waste"},
    "syringe": {"category": "hazardous", "subtype": "biomedical_waste"},
    "sanitary": {"category": "hazardous", "subtype": "sanitary_waste"},
    "trash": {"category": "general_residual", "subtype": "non_recyclable_reject"},
    "garbage": {"category": "general_residual", "subtype": "non_recyclable_reject"},
}


class RoboflowWasteDetector:
    """
    Cloud-based waste object detector leveraging Roboflow Universe pre-trained models.
    Supports Roboflow Inference SDK or direct HTTPS REST endpoint with automatic local fallback.
    """
    _instance: Optional["RoboflowWasteDetector"] = None

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_id: Optional[str] = None
    ):
        self.api_key = api_key or getattr(settings, "ROBOFLOW_API_KEY", None) or os.getenv("ROBOFLOW_API_KEY")
        self.model_id = model_id or getattr(settings, "ROBOFLOW_MODEL_ID", "waste-detect-2/1")
        self.classifier = WasteClassifier.get_instance()
        self._inference_client = None

        if self.api_key:
            try:
                from inference_sdk import InferenceHTTPClient
                self._inference_client = InferenceHTTPClient(
                    api_url="https://detect.roboflow.com",
                    api_key=self.api_key
                )
                logger.info(f"Initialized Roboflow Inference client for model: {self.model_id}")
            except Exception as e:
                logger.warning(f"Could not initialize InferenceHTTPClient, using REST API: {e}")

    @classmethod
    def get_instance(cls) -> "RoboflowWasteDetector":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _query_roboflow(self, image_pil: Image.Image, conf_thresh: float) -> List[Dict[str, Any]]:
        """Queries the Roboflow hosted inference service."""
        w_img, h_img = image_pil.size
        buf = io.BytesIO()
        image_pil.save(buf, format="JPEG", quality=85)
        raw_bytes = buf.getvalue()

        predictions: List[Dict[str, Any]] = []

        # Strategy 1: InferenceHTTPClient SDK
        if self._inference_client is not None:
            try:
                # Save temporary image for client
                res = self._inference_client.infer(image_pil, model_id=self.model_id)
                if isinstance(res, dict) and "predictions" in res:
                    predictions = res["predictions"]
            except Exception as e:
                logger.warning(f"Roboflow SDK infer error: {e}, attempting direct HTTP REST fallback")

        # Strategy 2: Direct HTTPS REST API
        if not predictions and self.api_key:
            try:
                b64_img = base64.b64encode(raw_bytes).decode("ascii")
                url = f"https://detect.roboflow.com/{self.model_id}?api_key={self.api_key}&confidence={int(conf_thresh * 100)}"
                resp = requests.post(
                    url,
                    data=b64_img,
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                    timeout=5.0
                )
                if resp.status_code == 200:
                    data = resp.json()
                    predictions = data.get("predictions", [])
                else:
                    logger.warning(f"Roboflow API returned status {resp.status_code}: {resp.text}")
            except Exception as e:
                logger.warning(f"Roboflow direct HTTP request failed: {e}")

        # Normalize bounding box predictions
        detected_boxes: List[Dict[str, Any]] = []
        for pred in predictions:
            # Roboflow format: center x, center y, width, height (in pixels)
            cx = float(pred.get("x", 0))
            cy = float(pred.get("y", 0))
            bw = float(pred.get("width", 0))
            bh = float(pred.get("height", 0))
            conf = float(pred.get("confidence", 0.0))
            class_name = str(pred.get("class", "")).lower().replace(" ", "_").replace("-", "_")

            x1 = max(0.0, cx - (bw / 2.0))
            y1 = max(0.0, cy - (bh / 2.0))

            norm_box = {
                "x": round(min(1.0, max(0.0, x1 / w_img)), 4),
                "y": round(min(1.0, max(0.0, y1 / h_img)), 4),
                "w": round(min(1.0, max(0.05, bw / w_img)), 4),
                "h": round(min(1.0, max(0.05, bh / h_img)), 4)
            }

            detected_boxes.append({
                "bbox": norm_box,
                "rf_class": class_name,
                "rf_conf": conf
            })

        return detected_boxes

    def detect_and_classify(
        self,
        image_bytes: bytes,
        conf_thresh: float = 0.25
    ) -> List[DetectedWasteItem]:
        """
        Locates waste items using Roboflow hosted pre-trained model, crops detected regions,
        and applies dual-vision statutory verification.
        """
        image_pil = Image.open(io.BytesIO(image_bytes))
        image_pil = ImageOps.exif_transpose(image_pil).convert("RGB")
        w_img, h_img = image_pil.size

        # If no API key configured, seamlessly fallback to local YOLO detector
        if not self.api_key:
            logger.info("No ROBOFLOW_API_KEY found, delegating to local YOLOWasteDetector.")
            from app.detection.yolo_detector import YOLOWasteDetector
            return YOLOWasteDetector.get_instance().detect_and_classify(image_bytes, conf_thresh=conf_thresh)

        # Query Roboflow API
        detected_boxes = self._query_roboflow(image_pil, conf_thresh=conf_thresh)

        # If Roboflow returned 0 items or failed, fall back to local YOLOv8
        if not detected_boxes:
            logger.info("Roboflow returned 0 detections, falling back to local YOLOWasteDetector.")
            from app.detection.yolo_detector import YOLOWasteDetector
            return YOLOWasteDetector.get_instance().detect_and_classify(image_bytes, conf_thresh=conf_thresh)

        # Apply Non-Maximum Suppression (NMS)
        nms_boxes = apply_nms([d["bbox"] for d in detected_boxes], iou_threshold=0.35)
        filtered = [d for d in detected_boxes if any(calculate_iou(d["bbox"], nb) > 0.85 for nb in nms_boxes)]

        items: List[DetectedWasteItem] = []
        for idx, det in enumerate(filtered):
            item_id = f"item_{idx + 1}"
            bbox = det["bbox"]
            rf_class = det["rf_class"]

            # Pad crop region with 5% margin
            pad_x = int(bbox["w"] * w_img * 0.05)
            pad_y = int(bbox["h"] * h_img * 0.05)
            x1 = max(0, int(bbox["x"] * w_img) - pad_x)
            y1 = max(0, int(bbox["y"] * h_img) - pad_y)
            x2 = min(w_img, int((bbox["x"] + bbox["w"]) * w_img) + pad_x)
            y2 = min(h_img, int((bbox["y"] + bbox["h"]) * h_img) + pad_y)

            crop_pil = image_pil.crop((x1, y1, x2, y2))

            # Generate thumbnail preview
            thumb_pil = crop_pil.copy()
            thumb_pil.thumbnail((160, 160))
            thumb_buf = io.BytesIO()
            thumb_pil.save(thumb_buf, format="JPEG", quality=85)
            thumb_b64 = f"data:image/jpeg;base64,{base64.b64encode(thumb_buf.getvalue()).decode('utf-8')}"

            # Letterbox square pad for classifier consistency
            padded_crop = prepare_square_crop(crop_pil)
            crop_buf = io.BytesIO()
            padded_crop.save(crop_buf, format="JPEG", quality=90)
            clf_res = self.classifier.classify_crop(crop_buf.getvalue())

            # Synthesize category: combine Roboflow domain label with statutory classifier
            rf_match = ROBOFLOW_TO_ECOSORT.get(rf_class)
            if rf_match:
                mapped_cat = rf_match["category"]
                # If local classifier agrees or is highly confident:
                if clf_res.confidence >= 0.60:
                    final_cat = clf_res.predicted_category
                    final_subtype = clf_res.subtype
                    final_conf = clf_res.confidence
                    if mapped_cat == final_cat:
                        final_conf = min(0.99, max(final_conf, det.get("rf_conf", 0.0) * 1.05))
                else:
                    final_cat = mapped_cat
                    final_subtype = clf_res.subtype or rf_match.get("subtype")
                    final_conf = max(det.get("rf_conf", 0.70), clf_res.confidence)
            else:
                final_cat = clf_res.predicted_category
                final_subtype = clf_res.subtype
                final_conf = clf_res.confidence

            # Normalize organic_food -> organic if needed
            if final_cat == "organic_food":
                final_cat = "organic"

            # Calibrate discrete probability distribution and Shannon entropy
            alt_map = {alt.category: alt.confidence for alt in (clf_res.alternative_predictions or [])}
            remaining_prob = max(0.01, 1.0 - final_conf)
            alt_total = sum(alt_map.values()) if alt_map else 1.0

            calibrated_p: Dict[str, float] = {}
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
