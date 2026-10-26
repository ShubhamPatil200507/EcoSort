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
from app.ml.imagenet_mapping import lookup_imagenet_waste
from app.schemas import ClassificationResult, AlternativePrediction

class WasteClassifier:
    """
    Production-grade ML Inference Engine.
    Employs a dual-pathway approach:
    1. Pretrained ImageNet-1K feature representation for genuine real-world optical items
       (bottles, cans, phones, laptops, clothing, glassware, food items, etc.).
    2. Fine-tuned EcoSort custom classifier for specific material patterns.
    Loads models into memory once and evaluates requests with sub-30ms latency.
    """
    _instance: Optional["WasteClassifier"] = None

    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

        # 1. Load ImageNet general classifier
        imagenet_weights = models.MobileNet_V3_Small_Weights.DEFAULT
        self.imagenet_categories = imagenet_weights.meta["categories"]
        self.imagenet_model = models.mobilenet_v3_small(weights=imagenet_weights).to(self.device)
        self.imagenet_model.eval()

        # 2. Load fine-tuned EcoSort specialized model
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
            print("Trained weights not found on disk yet. Initializing pretrained MobileNetV3 backbone...")
            self.ecosort_model = build_model(num_classes=len(CATEGORIES), weights_path=None)

        self.ecosort_model.to(self.device)
        self.ecosort_model.eval()

    def reload_model(self):
        self._load_ecosort_model()

    def _assess_image_quality(self, image: Image.Image) -> Tuple[bool, str]:
        """
        Detects if an image is completely flat/blank, severely dark/overexposed, or too degraded.
        """
        arr = np.array(image.convert("L"), dtype=np.float32)
        std_dev = float(np.std(arr))
        mean_val = float(np.mean(arr))

        # Check for nearly uniform color (blank screen, covered camera, uniform wall)
        if std_dev < 12.0:
            return False, "Image appears uniformly flat or blank with no distinct object features detected."

        # Check for extreme darkness (lens covered)
        if mean_val < 10.0:
            return False, "Image is too dark to discern waste material. Please increase lighting."

        # Check for complete washout
        if mean_val > 248.0 and std_dev < 15.0:
            return False, "Image is completely overexposed. Please reduce glare and re-scan."

        return True, "Quality check passed"

    def classify_image(
        self,
        image_bytes: bytes,
        threshold: Optional[float] = None
    ) -> ClassificationResult:
        start_time = time.time()
        effective_threshold = threshold if threshold is not None else settings.CONFIDENCE_THRESHOLD

        # 1. Parse and validate image format
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

        # 2. Check visual quality & uniformity
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
                visual_uncertainty_note="Please place the waste item on a flat surface, provide adequate lighting, and capture again.",
                alternative_predictions=[],
                inference_time_ms=round((time.time() - start_time) * 1000, 2),
                image_metadata={"width": image.width, "height": image.height}
            )

        # 3. Preprocess and evaluate image
        input_tensor = self.transform(image_rgb).unsqueeze(0).to(self.device)

        with torch.no_grad():
            # A. ImageNet pretrained evaluation
            imagenet_logits = self.imagenet_model(input_tensor)
            imagenet_probs = F.softmax(imagenet_logits, dim=1).squeeze(0).cpu().numpy()

            # B. EcoSort fine-tuned model evaluation
            ecosort_logits = self.ecosort_model(input_tensor)
            ecosort_probs = F.softmax(ecosort_logits, dim=1).squeeze(0).cpu().numpy()

        # 4. Synthesize class scores across the 10 waste streams
        category_scores: Dict[str, float] = {cat: float(ecosort_probs[idx]) * 0.45 for idx, cat in enumerate(CATEGORIES)}
        detected_subtype: Optional[str] = None
        top_imagenet_detected: Optional[str] = None

        # Accumulate evidence from top-10 ImageNet detections
        top_k_indices = np.argsort(imagenet_probs)[::-1][:10]
        for rank, k_idx in enumerate(top_k_indices):
            raw_prob = float(imagenet_probs[k_idx])
            class_label = self.imagenet_categories[k_idx]
            waste_match = lookup_imagenet_waste(class_label)

            if waste_match:
                matched_cat = waste_match["category"]
                # Weight higher-ranked ImageNet predictions
                boost = raw_prob * (1.5 if rank == 0 else 0.8)
                category_scores[matched_cat] = category_scores.get(matched_cat, 0.0) + boost

                if rank == 0:
                    top_imagenet_detected = class_label
                    detected_subtype = waste_match.get("subtype")

        # Normalize probability distribution over 10 categories
        total_score = sum(category_scores.values()) or 1.0
        normalized_probs = {cat: min(1.0, score / total_score) for cat, score in category_scores.items()}

        # 5. Extract top prediction
        sorted_categories = sorted(normalized_probs.items(), key=lambda kv: kv[1], reverse=True)
        top_category, top_confidence = sorted_categories[0]
        meta = CATEGORY_METADATA.get(top_category, {})

        if not detected_subtype:
            subtypes = meta.get("subtypes", [])
            detected_subtype = subtypes[0] if subtypes else None

        # Build alternatives
        alternatives: List[AlternativePrediction] = []
        for alt_cat, alt_conf in sorted_categories[1:4]:
            alt_meta = CATEGORY_METADATA.get(alt_cat, {})
            alternatives.append(AlternativePrediction(
                category=alt_cat,
                display_name=alt_meta.get("display_name", alt_cat.replace("_", " ").title()),
                confidence=round(alt_conf, 4),
                percentage=f"{alt_conf * 100:.1f}%"
            ))

        inference_time_ms = round((time.time() - start_time) * 1000, 2)
        is_confident = top_confidence >= effective_threshold

        if not is_confident:
            explanation = (
                f"Unable to classify confidently ({top_confidence * 100:.1f}% confidence, below the {effective_threshold * 100:.0f}% threshold). "
                f"The object shares visual features with multiple categories ({meta.get('display_name')} and {alternatives[0].display_name}). "
                "Please capture closer, inspect physical labels, or consult the Disposal Guide."
            )
            status = "low_confidence"
        else:
            explanation = (
                f"Classified as {meta.get('display_name')} ({top_confidence * 100:.1f}% confidence)"
                + (f" — identified features matching '{top_imagenet_detected}'." if top_imagenet_detected else ".")
            )
            status = "success"

        return ClassificationResult(
            status=status,
            predicted_category=top_category,
            display_name=meta.get("display_name", top_category.replace("_", " ").title()),
            subtype=detected_subtype,
            confidence=round(top_confidence, 4),
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
