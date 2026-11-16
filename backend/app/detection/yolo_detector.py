"""
EcoSort Deep Neural Vision Multi-Object Waste Detector (High-Precision Dual-Head Engine)
Fuses high-capacity YOLOv8 Medium macro-object localization with dedicated fine-grained
waste litter proposals, anchored by dual-vision MobileNetV3/EfficientNet-B0 material verification.
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

from app.config import settings
from app.ml.categories import CATEGORIES, CATEGORY_METADATA
from app.ml.classifier import WasteClassifier
from app.detection.multi_object_detector import calculate_iou, apply_nms, prepare_square_crop
from app.schemas import DetectedWasteItem, AlternativePrediction

# Dedicated Waste Litter to EcoSort Category Bridge (Fine-grained TACO Waste Litter)
WASTE_YOLO_TO_ECOSORT: Dict[str, Dict[str, str]] = {
    "aluminium foil": {"category": "metal", "subtype": "aluminum_foil"},
    "bottle cap": {"category": "metal", "subtype": "metal_cap"},
    "bottle": {"category": "plastic", "subtype": "plastic_bottle"},
    "broken glass": {"category": "glass", "subtype": "broken_glassware"},
    "can": {"category": "metal", "subtype": "aluminum_beverage_can"},
    "carton": {"category": "paper_cardboard", "subtype": "cardboard_box"},
    "cigarette": {"category": "hazardous", "subtype": "sanitary_waste"},
    "cup": {"category": "plastic", "subtype": "food_container"},
    "lid": {"category": "plastic", "subtype": "plastic_cap_lid"},
    "other litter": {"category": "general_residual", "subtype": "non_recyclable_reject"},
    "other plastic": {"category": "plastic", "subtype": "hard_plastic"},
    "paper": {"category": "paper_cardboard", "subtype": "office_paper"},
    "plastic bag - wrapper": {"category": "plastic", "subtype": "plastic_wrapper"},
    "plastic container": {"category": "plastic", "subtype": "food_container"},
    "pop tab": {"category": "metal", "subtype": "scrap_metal"},
    "straw": {"category": "plastic", "subtype": "single_use_plastic"},
    "styrofoam piece": {"category": "plastic", "subtype": "polystyrene_thermocol"},
    "unlabeled litter": {"category": "general_residual", "subtype": "non_recyclable_reject"},
}

# COCO to EcoSort Category Bridge (High-Capacity General Object Recognizer)
COCO_TO_ECOSORT: Dict[str, Dict[str, str]] = {
    # Plastic & Containers
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

NON_WASTE_COCO_CLASSES = {
    "person", "chair", "dining table", "bed", "couch", "sofa", "bench",
    "traffic light", "fire hydrant", "stop sign", "parking meter", "bus",
    "train", "truck", "boat", "airplane", "car", "motorcycle", "bicycle"
}


class YOLOWasteDetector:
    """
    EcoSort Deep Neural Vision Multi-Object Detector.
    Fuses high-capacity YOLOv8 Medium macro-object localization with dedicated fine-grained
    litter detection, anchored by dual-vision MobileNetV3/EfficientNet-B0 material verification.
    """
    _instance: Optional["YOLOWasteDetector"] = None

    def __init__(self, model_path: Optional[str] = None):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        # 1. Macro Object Backbone (YOLOv8 Medium for superior capacity and mAP)
        macro_candidates = [
            Path("data/models/yolov8m.pt"),
            Path("backend/data/models/yolov8m.pt"),
            Path(__file__).resolve().parent.parent.parent / "data" / "models" / "yolov8m.pt",
            Path("data/models/yolov8s.pt"),
            Path("backend/data/models/yolov8s.pt"),
            Path("yolov8m.pt"),
            Path("yolov8s.pt"),
            Path("yolov8n.pt"),
            Path("backend/yolov8n.pt")
        ]
        macro_resolved = "yolov8n.pt"
        for c in macro_candidates:
            if c.exists():
                macro_resolved = str(c)
                break

        # 2. Dedicated Fine-Grained Litter Model
        litter_candidates = [
            Path("data/models/yolov8_waste_detector.pt"),
            Path("backend/data/models/yolov8_waste_detector.pt"),
            Path(__file__).resolve().parent.parent.parent / "data" / "models" / "yolov8_waste_detector.pt"
        ]
        litter_resolved = None
        for c in litter_candidates:
            if c.exists():
                litter_resolved = str(c)
                break

        self.macro_model_path = macro_resolved
        self.macro_model = YOLO(macro_resolved)

        self.litter_model = None
        if litter_resolved:
            try:
                self.litter_model = YOLO(litter_resolved)
            except Exception:
                self.litter_model = None

        # For backwards compatibility with single yolo_model reference
        self.yolo_model = self.litter_model or self.macro_model
        self.classifier = WasteClassifier.get_instance()

    @classmethod
    def get_instance(cls) -> "YOLOWasteDetector":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _collect_proposals(self, image_pil: Image.Image, conf_thresh: float) -> List[Dict[str, Any]]:
        w_img, h_img = image_pil.size
        proposals: List[Dict[str, Any]] = []

        # Head A: High-Capacity Macro Detector (YOLOv8 Medium / Small)
        try:
            res_macro = self.macro_model.predict(image_pil, conf=conf_thresh, verbose=False)
            if res_macro and len(res_macro) > 0:
                for b in res_macro[0].boxes:
                    cls_id = int(b.cls[0].cpu().numpy())
                    conf = float(b.conf[0].cpu().numpy())
                    c_name = self.macro_model.names.get(cls_id, "")
                    if c_name.lower() in NON_WASTE_COCO_CLASSES:
                        continue
                    xyxy = b.xyxy[0].cpu().numpy()
                    x1, y1, x2, y2 = xyxy
                    box = {
                        "x": round(float(x1) / w_img, 4),
                        "y": round(float(y1) / h_img, 4),
                        "w": round(float(x2 - x1) / w_img, 4),
                        "h": round(float(y2 - y1) / h_img, 4)
                    }
                    if box["w"] >= 0.02 and box["h"] >= 0.02:
                        proposals.append({
                            "bbox": box,
                            "coco_class": c_name,
                            "coco_conf": conf,
                            "source": "macro"
                        })
        except Exception:
            pass

        # Head B: Fine-Grained Waste Litter Model (TACO benchmark weights)
        if self.litter_model is not None:
            try:
                res_litter = self.litter_model.predict(image_pil, conf=conf_thresh, verbose=False)
                if res_litter and len(res_litter) > 0:
                    for b in res_litter[0].boxes:
                        cls_id = int(b.cls[0].cpu().numpy())
                        conf = float(b.conf[0].cpu().numpy())
                        c_name = self.litter_model.names.get(cls_id, "")
                        xyxy = b.xyxy[0].cpu().numpy()
                        x1, y1, x2, y2 = xyxy
                        box = {
                            "x": round(float(x1) / w_img, 4),
                            "y": round(float(y1) / h_img, 4),
                            "w": round(float(x2 - x1) / w_img, 4),
                            "h": round(float(y2 - y1) / h_img, 4)
                        }
                        if box["w"] >= 0.02 and box["h"] >= 0.02:
                            proposals.append({
                                "bbox": box,
                                "coco_class": c_name,
                                "coco_conf": conf,
                                "source": "litter"
                            })
            except Exception:
                pass

        # Apply Non-Maximum Suppression to merge overlapping boxes from both heads
        proposals.sort(key=lambda p: p["coco_conf"], reverse=True)
        fused: List[Dict[str, Any]] = []
        for p in proposals:
            if not any(calculate_iou(p["bbox"], k["bbox"]) > 0.40 for k in fused):
                fused.append(p)

        return fused

    def _arbitrate_category(
        self,
        coco_class: Optional[str],
        det_conf: float,
        source: str,
        clf_res: Any
    ):
        coco_match = (
            WASTE_YOLO_TO_ECOSORT.get(coco_class.lower())
            or COCO_TO_ECOSORT.get(coco_class.lower())
        ) if coco_class else None

        # Priority 1: High-confidence fine-grained classifier prediction
        # Specialized streams (e_waste, batteries, organic_food, hazardous, metal) detected by classifier
        # should NOT be overridden by a coarse litter guess (e.g. Carton or Bottle).
        if clf_res.confidence >= 0.75:
            if coco_match and coco_match["category"] == clf_res.predicted_category:
                return (
                    clf_res.predicted_category,
                    clf_res.subtype or coco_match["subtype"],
                    min(0.98, max(clf_res.confidence, det_conf * 1.05))
                )
            if clf_res.predicted_category in ["e_waste", "batteries", "organic_food", "hazardous", "metal", "glass"]:
                return (
                    clf_res.predicted_category,
                    clf_res.subtype,
                    clf_res.confidence
                )

        # Priority 2: Unambiguous macroscopic COCO detection (from YOLOv8m)
        if source == "macro" and coco_match and det_conf >= 0.50:
            return (
                coco_match["category"],
                clf_res.subtype or coco_match["subtype"],
                max(det_conf, clf_res.confidence)
            )

        # Priority 3: Coarse waste match validated by classifier
        if coco_match and det_conf >= 0.40:
            c_cat = coco_match["category"]
            if c_cat == "plastic" and clf_res.predicted_category in ["plastic", "glass"]:
                return (
                    clf_res.predicted_category,
                    clf_res.subtype or coco_match["subtype"],
                    max(det_conf, clf_res.confidence)
                )
            if c_cat == "glass" and clf_res.predicted_category in ["glass", "plastic"]:
                return (
                    clf_res.predicted_category,
                    clf_res.subtype or coco_match["subtype"],
                    max(det_conf, clf_res.confidence)
                )
            if c_cat in ["paper_cardboard", "metal"]:
                return (
                    c_cat,
                    clf_res.subtype or coco_match["subtype"],
                    max(det_conf, clf_res.confidence)
                )

        return (
            clf_res.predicted_category,
            clf_res.subtype,
            clf_res.confidence
        )

    def detect_and_classify(self, image_bytes: bytes, conf_thresh: float = 0.25) -> List[DetectedWasteItem]:
        image_pil = Image.open(io.BytesIO(image_bytes))
        image_pil = ImageOps.exif_transpose(image_pil).convert("RGB")
        w_img, h_img = image_pil.size

        # Run dual-head proposal collection
        filtered_detected = self._collect_proposals(image_pil, conf_thresh=conf_thresh)

        # If zero items found, fall back to background-invariant contour saliency decomposition
        if not filtered_detected:
            from app.detection.multi_object_detector import MultiObjectDetector
            return MultiObjectDetector.get_instance().detect_and_classify(image_bytes)

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

            # Synthesize category with Zero-Hallucination Semantic Arbitration
            det_conf = det.get("coco_conf", 0.0)
            det_source = det.get("source", "macro")
            final_cat, final_subtype, final_conf = self._arbitrate_category(coco_class, det_conf, det_source, clf_res)

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
        1. Runs dual-head neural object detector for COCO & dedicated waste litter objects.
        2. Runs background-invariant contour saliency detector for unlisted objects.
        3. Merges spatial bounding boxes using non-maximum suppression without dropping unlisted items.
        4. Applies square-padded letterboxing on each crop to preserve natural aspect ratio.
        5. Runs fine-grained dual-vision classifier on each crop.
        """
        image_pil = Image.open(io.BytesIO(image_bytes))
        image_pil = ImageOps.exif_transpose(image_pil).convert("RGB")
        w_img, h_img = image_pil.size
        img_np = np.array(image_pil)
        img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

        # 1. Dual-head Neural Proposals
        yolo_candidates = self._collect_proposals(image_pil, conf_thresh=conf_thresh)

        # 2. Contour / Saliency Proposals
        from app.detection.multi_object_detector import MultiObjectDetector
        contour_boxes = MultiObjectDetector.get_instance()._extract_bounding_boxes(img_bgr)

        # 3. Fuse Neural & Contour proposals
        fused_candidates: List[Dict[str, Any]] = list(yolo_candidates)
        for c_box in contour_boxes:
            cx = c_box["x"] + c_box["w"] / 2.0
            cy = c_box["y"] + c_box["h"] / 2.0
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

            thumb_pil = crop_pil.copy()
            thumb_pil.thumbnail((160, 160))
            thumb_buf = io.BytesIO()
            thumb_pil.save(thumb_buf, format="JPEG", quality=85)
            thumb_b64 = f"data:image/jpeg;base64,{base64.b64encode(thumb_buf.getvalue()).decode('utf-8')}"

            padded_crop = prepare_square_crop(crop_pil)
            crop_buf = io.BytesIO()
            padded_crop.save(crop_buf, format="JPEG", quality=90)
            clf_res = self.classifier.classify_crop(crop_buf.getvalue())

            # Synthesize category with Zero-Hallucination Semantic Arbitration
            det_conf = det.get("coco_conf", 0.0)
            det_source = det.get("source", "macro")
            final_cat, final_subtype, final_conf = self._arbitrate_category(coco_class, det_conf, det_source, clf_res)

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


# Official Alias
NeuralWasteDetector = YOLOWasteDetector
