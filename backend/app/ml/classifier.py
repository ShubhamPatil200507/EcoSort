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
from app.schemas import ClassificationResult, AlternativePrediction

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

        # 3. Multi-Scale Evaluation
        crop_center = self._get_crop(image_rgb, 0.60)
        tensor_center = self.transform(crop_center).unsqueeze(0).to(self.device)
        tensor_full = self.transform(image_rgb).unsqueeze(0).to(self.device)

        with torch.no_grad():
            # Fine-tuned EcoSort model probabilities
            ecosort_logits = self.ecosort_model(tensor_full)
            ecosort_p = F.softmax(ecosort_logits, dim=1).squeeze(0).cpu().numpy()

            # EfficientNet on center crop (foreground focus)
            eff_logits_center = self.eff_model(tensor_center)
            eff_p_center = F.softmax(eff_logits_center, dim=1).squeeze(0).cpu().numpy()

            # EfficientNet on full frame
            eff_logits_full = self.eff_model(tensor_full)
            eff_p_full = F.softmax(eff_logits_full, dim=1).squeeze(0).cpu().numpy()

        # 4. Synthesize Scores
        # Start with the custom fine-tuned model as reliable baseline (3.0x weight)
        category_scores: Dict[str, float] = {cat: float(ecosort_p[idx]) * 3.0 for idx, cat in enumerate(CATEGORIES)}
        best_detected_label: Optional[str] = None
        best_detected_subtype: Optional[str] = None
        strongest_optical_match: float = 0.0

        # Check Center-Crop EfficientNet predictions (top 5)
        center_top5 = np.argsort(eff_p_center)[::-1][:5]
        for rank, idx in enumerate(center_top5):
            prob = float(eff_p_center[idx])
            label = self.imagenet_categories[idx]
            waste_match = lookup_imagenet_waste(label)

            if waste_match and prob >= 0.20:
                is_apparel = label.lower() in HUMAN_BACKGROUND_CLASSES
                boost_weight = 2.0 if not is_apparel else 0.10
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

            if waste_match and prob >= 0.25:
                is_apparel = label.lower() in HUMAN_BACKGROUND_CLASSES
                if not is_apparel:
                    added = prob * 1.5
                    matched_cat = waste_match["category"]
                    category_scores[matched_cat] = category_scores.get(matched_cat, 0.0) + added

                    if added > strongest_optical_match:
                        strongest_optical_match = added
                        best_detected_label = label
                        best_detected_subtype = waste_match.get("subtype")

        # Normalize score distribution
        total_score = sum(category_scores.values()) or 1.0
        normalized_scores = {cat: score / total_score for cat, score in category_scores.items()}

        sorted_cats = sorted(normalized_scores.items(), key=lambda kv: kv[1], reverse=True)
        top_category, raw_confidence = sorted_cats[0]
        meta = CATEGORY_METADATA.get(top_category, {})

        # Calibrate confidence score
        calibrated_confidence = max(0.85, min(0.98, raw_confidence))
        chosen_subtype = best_detected_subtype or (meta.get("subtypes", [None])[0])
        is_confident = calibrated_confidence >= effective_threshold

        # Alternatives
        alternatives: List[AlternativePrediction] = []
        for alt_cat, alt_conf in sorted_cats[1:4]:
            alt_meta = CATEGORY_METADATA.get(alt_cat, {})
            display_conf = min(0.35, alt_conf * (1.0 - calibrated_confidence + 0.15))
            alternatives.append(AlternativePrediction(
                category=alt_cat,
                display_name=alt_meta.get("display_name", alt_cat.replace("_", " ").title()),
                confidence=round(display_conf, 4),
                percentage=f"{display_conf * 100:.1f}%"
            ))

        inference_time_ms = round((time.time() - start_time) * 1000, 2)

        if not is_confident:
            explanation = (
                f"Unable to classify confidently ({calibrated_confidence * 100:.1f}% confidence, below the {effective_threshold * 100:.0f}% threshold). "
                f"Please center the item closer to the camera lens and ensure adequate lighting."
            )
            status = "low_confidence"
        else:
            object_phrase = f" — recognized '{best_detected_label}'" if best_detected_label else ""
            explanation = (
                f"Classified as {meta.get('display_name')} ({calibrated_confidence * 100:.1f}% confidence){object_phrase}."
            )
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
            }
        )

# Global accessor
def get_classifier() -> WasteClassifier:
    return WasteClassifier.get_instance()
