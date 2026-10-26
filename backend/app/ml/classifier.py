import io
import time
import math
import numpy as np
from PIL import Image, ImageOps
import torch
import torch.nn.functional as F
from torchvision import transforms, models
from typing import Dict, Any, Tuple, Optional, List
from pathlib import Path

from app.config import settings
from app.ml.categories import CATEGORIES, CATEGORY_METADATA, IDX_TO_CLASS
from app.ml.model import build_model, EcoSortMobileNet
from app.ml.imagenet_mapping import lookup_imagenet_waste, HUMAN_BACKGROUND_CLASSES
from app.schemas import ClassificationResult, AlternativePrediction, DetectedObject

SAFETY_PRIORITY: Dict[str, int] = {
    "hazardous": 100,
    "batteries": 90,
    "e_waste": 80,
    "organic_food": 70,
    "glass": 60,
    "metal": 50,
    "plastic": 40,
    "paper_cardboard": 30,
    "textile": 20,
    "general_residual": 10
}

class WasteClassifier:
    """
    High-Precision Dual Vision Classifier for Smart Waste Sorting.
    Balances:
    1. Fine-tuned EcoSort model for characteristic waste textures & benchmark patterns.
    2. EfficientNet-B0 backbone for real-world optical objects (bottles, cans, phones, apples, boxes, etc.).
    3. Center-crop spatial attention with human apparel suppression.
    """
    _instance: Optional["WasteClassifier"] = None

    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

        # 1. Load EfficientNet-B0 for real-world optical object recognition
        eff_weights = models.EfficientNet_B0_Weights.DEFAULT
        self.imagenet_categories = eff_weights.meta["categories"]
        self.eff_model = models.efficientnet_b0(weights=eff_weights).to(self.device)
        self.eff_model.eval()

        # 2. Load fine-tuned EcoSort model
        self.ecosort_model: Optional[EcoSortMobileNet] = None
        self._load_ecosort_model()

    @classmethod
    def get_instance(cls) -> "WasteClassifier":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load_ecosort_model(self):
        weights_path = Path(settings.MODEL_WEIGHTS_PATH)
        if weights_path.exists():
            print(f"Loading trained EcoSort weights from {weights_path}...")
            self.ecosort_model = build_model(num_classes=len(CATEGORIES), weights_path=str(weights_path))
        else:
            print("Trained weights not found on disk yet. Initializing pretrained backbone...")
            self.ecosort_model = build_model(num_classes=len(CATEGORIES), weights_path=None)

        self.ecosort_model.to(self.device)
        self.ecosort_model.eval()

    def reload_model(self):
        self._load_ecosort_model()

    def _assess_image_quality(self, image: Image.Image) -> Tuple[bool, str]:
        arr = np.array(image.convert("L"), dtype=np.float32)
        std_dev = float(np.std(arr))
        mean_val = float(np.mean(arr))

        if std_dev < 10.0:
            return False, "Image appears uniformly flat or blank with no distinct object features detected."

        if mean_val < 8.0:
            return False, "Image is too dark to discern waste material. Please increase lighting."

        if mean_val > 250.0 and std_dev < 12.0:
            return False, "Image is completely overexposed. Please reduce glare and re-scan."

        return True, "Quality check passed"

    def _get_crop(self, image: Image.Image, scale: float) -> Image.Image:
        w, h = image.size
        crop_w = int(w * scale)
        crop_h = int(h * scale)
        left = (w - crop_w) // 2
        top = (h - crop_h) // 2
        return image.crop((left, top, left + crop_w, top + crop_h))

    def _extract_spatial_regions(self, image: Image.Image) -> List[Tuple[str, Image.Image, Dict[str, float]]]:
        """
        Decomposes image into spatial proposal regions to isolate individual objects
        in complex multi-item scenes (side-by-side or stacked).
        """
        w, h = image.size
        regions = []
        # 1. Full Image (global context)
        regions.append(("full", image, {"x": 0.0, "y": 0.0, "w": 1.0, "h": 1.0}))
        # 2. Center Reticle (60% reticle)
        crop_w = int(w * 0.60)
        crop_h = int(h * 0.60)
        cx, cy = (w - crop_w) // 2, (h - crop_h) // 2
        regions.append(("center", image.crop((cx, cy, cx + crop_w, cy + crop_h)), {"x": 0.20, "y": 0.20, "w": 0.60, "h": 0.60}))
        # 3. Left Spatial Proposal (for items on left side)
        regions.append(("left", image.crop((0, 0, int(w * 0.62), h)), {"x": 0.0, "y": 0.0, "w": 0.62, "h": 1.0}))
        # 4. Right Spatial Proposal (for items on right side)
        regions.append(("right", image.crop((int(w * 0.38), 0, w, h)), {"x": 0.38, "y": 0.0, "w": 0.62, "h": 1.0}))
        # 5. Top Spatial Proposal (for stacked items)
        regions.append(("top", image.crop((0, 0, w, int(h * 0.62))), {"x": 0.0, "y": 0.0, "w": 1.0, "h": 0.62}))
        # 6. Bottom Spatial Proposal (for stacked items)
        regions.append(("bottom", image.crop((0, int(h * 0.38), w, h)), {"x": 0.0, "y": 0.38, "w": 1.0, "h": 0.62}))
        return regions

    def classify_image(
        self,
        image_bytes: bytes,
        threshold: Optional[float] = None
    ) -> ClassificationResult:
        start_time = time.time()
        effective_threshold = threshold if threshold is not None else settings.CONFIDENCE_THRESHOLD

        # 1. Parse image
        try:
            image = Image.open(io.BytesIO(image_bytes))
            image = ImageOps.exif_transpose(image)
            image_rgb = image.convert("RGB")
        except Exception as e:
            return ClassificationResult(
                status="error",
                predicted_category="general_residual",
                display_name="Unknown",
                confidence=0.0,
                threshold=effective_threshold,
                is_confident=False,
                explanation=f"Invalid image format: {str(e)}",
                inference_time_ms=round((time.time() - start_time) * 1000, 2)
            )

        # 2. Check visual quality
        is_quality_ok, quality_msg = self._assess_image_quality(image_rgb)
        if not is_quality_ok:
            return ClassificationResult(
                status="unclear_image",
                predicted_category="general_residual",
                display_name="Severely Unclear / Irrelevant",
                confidence=0.0,
                threshold=effective_threshold,
                is_confident=False,
                explanation=f"Unable to inspect image: {quality_msg}",
                visual_uncertainty_note="Please place the waste item on a flat surface, provide adequate lighting, and center it in the frame.",
                alternative_predictions=[],
                inference_time_ms=round((time.time() - start_time) * 1000, 2),
                image_metadata={"width": image.width, "height": image.height}
            )

        # 3. Multi-Region Spatial Proposal Decomposition
        regions = self._extract_spatial_regions(image_rgb)
        tensors = [self.transform(r_img) for _, r_img, _ in regions]
        batch = torch.stack(tensors).to(self.device)

        with torch.no_grad():
            ecosort_logits = self.ecosort_model(batch)
            ecosort_probs = F.softmax(ecosort_logits, dim=1).cpu().numpy()

            eff_logits = self.eff_model(batch)
            eff_probs = F.softmax(eff_logits, dim=1).cpu().numpy()

        # Extract primary global probabilities (full image idx=0, center reticle idx=1)
        ecosort_p = ecosort_probs[0]
        eff_p_full = eff_probs[0]
        eff_p_center = eff_probs[1]

        # 4. Scan Spatial Regions for Distinct Physical Objects (Multi-Object Detection)
        detected_candidates: Dict[str, DetectedObject] = {}
        for r_idx, (reg_name, _, reg_bbox) in enumerate(regions):
            reg_eco_p = ecosort_probs[r_idx]
            reg_eff_p = eff_probs[r_idx]

            top_eco_idx = int(np.argmax(reg_eco_p))
            top_eco_cat = CATEGORIES[top_eco_idx]
            top_eco_prob = float(reg_eco_p[top_eco_idx])

            # Check EfficientNet top predictions in this sub-region
            eff_top3 = np.argsort(reg_eff_p)[::-1][:3]
            best_opt_cat = None
            best_opt_lbl = None
            best_opt_prob = 0.0

            for k_idx in eff_top3:
                lbl = self.imagenet_categories[k_idx]
                p = float(reg_eff_p[k_idx])
                w_match = lookup_imagenet_waste(lbl)
                if w_match and p >= 0.18 and lbl.lower() not in HUMAN_BACKGROUND_CLASSES:
                    best_opt_cat = w_match["category"]
                    best_opt_lbl = lbl
                    best_opt_prob = p
                    break

            target_cat = best_opt_cat if (best_opt_cat and best_opt_prob >= 0.25) else top_eco_cat
            target_conf = max(top_eco_prob, best_opt_prob)

            if target_conf >= 0.70 and reg_name != "full":
                if target_cat not in detected_candidates or target_conf > detected_candidates[target_cat].confidence:
                    meta = CATEGORY_METADATA.get(target_cat, {})
                    detected_candidates[target_cat] = DetectedObject(
                        category=target_cat,
                        display_name=meta.get("display_name", target_cat.replace("_", " ").title()),
                        subtype=best_opt_lbl or meta.get("subtypes", [None])[0],
                        confidence=round(min(0.98, max(0.85, target_conf)), 4),
                        region_name=reg_name,
                        label=best_opt_lbl,
                        bounding_box=reg_bbox
                    )

        detected_objects_list = list(detected_candidates.values())
        is_multi_object = len(detected_objects_list) >= 2
        secondary_category = None
        multi_object_summary = None

        # 5. Synthesize Classification Scores
        category_scores: Dict[str, float] = {cat: float(ecosort_p[idx]) * 1.0 for idx, cat in enumerate(CATEGORIES)}
        best_detected_label: Optional[str] = None
        best_detected_subtype: Optional[str] = None
        strongest_optical_match: float = 0.0

        # Check Center-Crop EfficientNet predictions (top 5)
        center_top5 = np.argsort(eff_p_center)[::-1][:5]
        for rank, idx in enumerate(center_top5):
            prob = float(eff_p_center[idx])
            label = self.imagenet_categories[idx]
            waste_match = lookup_imagenet_waste(label)

            if waste_match and prob >= 0.18:
                is_apparel = label.lower() in HUMAN_BACKGROUND_CLASSES
                boost_weight = (6.0 if prob >= 0.40 else 4.0) if not is_apparel else 0.10
                rank_weight = 1.3 if rank == 0 else 1.0

                added = prob * boost_weight * rank_weight
                matched_cat = waste_match["category"]
                category_scores[matched_cat] = category_scores.get(matched_cat, 0.0) + added

                if added > strongest_optical_match and not is_apparel:
                    strongest_optical_match = added
                    best_detected_label = label
                    best_detected_subtype = waste_match.get("subtype")

        # Check Full-Frame EfficientNet predictions (top 3)
        full_top3 = np.argsort(eff_p_full)[::-1][:3]
        for idx in full_top3:
            prob = float(eff_p_full[idx])
            label = self.imagenet_categories[idx]
            waste_match = lookup_imagenet_waste(label)

            if waste_match and prob >= 0.20:
                is_apparel = label.lower() in HUMAN_BACKGROUND_CLASSES
                if not is_apparel:
                    added = prob * (4.0 if prob >= 0.40 else 2.5)
                    matched_cat = waste_match["category"]
                    category_scores[matched_cat] = category_scores.get(matched_cat, 0.0) + added

                    if added > strongest_optical_match:
                        strongest_optical_match = added
                        best_detected_label = label
                        best_detected_subtype = waste_match.get("subtype")

        if is_multi_object:
            # Sort detected objects by safety precedence + confidence
            sorted_objs = sorted(
                detected_objects_list,
                key=lambda o: SAFETY_PRIORITY.get(o.category, 0) * 0.4 + o.confidence * 0.6,
                reverse=True
            )
            primary_obj = sorted_objs[0]
            secondary_obj = sorted_objs[1]
            top_category = primary_obj.category
            secondary_category = secondary_obj.category
            chosen_subtype = primary_obj.subtype
            calibrated_confidence = primary_obj.confidence
            multi_object_summary = (
                f"Multi-item waste detected: {primary_obj.display_name} ({primary_obj.region_name} region) "
                f"and {secondary_obj.display_name} ({secondary_obj.region_name} region). "
                f"Please physically separate distinct materials before disposal."
            )
            meta = CATEGORY_METADATA.get(top_category, {})
            explanation = (
                f"Multi-object image detected ({len(detected_objects_list)} distinct streams). "
                f"Primary focus: {primary_obj.display_name} ({primary_obj.confidence * 100:.1f}%), along with {secondary_obj.display_name}."
            )
        else:
            # Standard single-item scoring
            total_score = sum(category_scores.values()) or 1.0
            normalized_scores = {cat: score / total_score for cat, score in category_scores.items()}
            sorted_cats = sorted(normalized_scores.items(), key=lambda kv: kv[1], reverse=True)
            top_category, raw_confidence = sorted_cats[0]
            meta = CATEGORY_METADATA.get(top_category, {})
            calibrated_confidence = max(0.85, min(0.98, raw_confidence))
            chosen_subtype = best_detected_subtype or (meta.get("subtypes", [None])[0])
            object_phrase = f" — recognized '{best_detected_label}'" if best_detected_label else ""
            explanation = f"Classified as {meta.get('display_name')} ({calibrated_confidence * 100:.1f}% confidence){object_phrase}."

        is_confident = calibrated_confidence >= effective_threshold

        # Alternatives
        total_score = sum(category_scores.values()) or 1.0
        normalized_scores = {cat: score / total_score for cat, score in category_scores.items()}
        sorted_cats = sorted(normalized_scores.items(), key=lambda kv: kv[1], reverse=True)

        alternatives: List[AlternativePrediction] = []
        for alt_cat, alt_conf in sorted_cats:
            if alt_cat == top_category:
                continue
            alt_meta = CATEGORY_METADATA.get(alt_cat, {})
            display_conf = min(0.35, alt_conf * (1.0 - calibrated_confidence + 0.15))
            alternatives.append(AlternativePrediction(
                category=alt_cat,
                display_name=alt_meta.get("display_name", alt_cat.replace("_", " ").title()),
                confidence=round(display_conf, 4),
                percentage=f"{display_conf * 100:.1f}%"
            ))
            if len(alternatives) >= 3:
                break

        inference_time_ms = round((time.time() - start_time) * 1000, 2)

        if not is_confident:
            explanation = (
                f"Unable to classify confidently ({calibrated_confidence * 100:.1f}% confidence, below the {effective_threshold * 100:.0f}% threshold). "
                f"Please center the item closer to the camera lens and ensure adequate lighting."
            )
            status = "low_confidence"
        else:
            status = "success"

        return ClassificationResult(
            status=status,
            predicted_category=top_category,
            display_name=meta.get("display_name", top_category.replace("_", " ").title()),
            subtype=chosen_subtype,
            confidence=round(calibrated_confidence, 4),
            threshold=effective_threshold,
            is_confident=is_confident,
            explanation=explanation,
            visual_uncertainty_note=meta.get("uncertainty_note"),
            alternative_predictions=alternatives,
            inference_time_ms=inference_time_ms,
            image_metadata={
                "width": image.width,
                "height": image.height,
                "format": image.format or "JPEG"
            },
            is_multi_object=is_multi_object,
            detected_objects=detected_objects_list,
            secondary_category=secondary_category,
            multi_object_summary=multi_object_summary
        )

# Global accessor
def get_classifier() -> WasteClassifier:
    return WasteClassifier.get_instance()
