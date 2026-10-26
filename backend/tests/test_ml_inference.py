import pytest
from pathlib import Path
from app.ml.classifier import get_classifier
from app.ml.categories import CATEGORIES

SAMPLE_DIR = Path(__file__).resolve().parent.parent / "data" / "sample_images"

def test_inference_on_sample_images():
    classifier = get_classifier()
    # Test electronic waste sample
    with open(SAMPLE_DIR / "e_waste.jpg", "rb") as f:
        data = f.read()
    res = classifier.classify_image(data)
    assert res.status == "success"
    assert res.predicted_category == "e_waste"
    assert res.confidence >= 0.50
    assert res.is_confident is True
    assert len(res.alternative_predictions) > 0
    assert res.inference_time_ms > 0

def test_high_threshold_triggers_low_confidence():
    classifier = get_classifier()
    with open(SAMPLE_DIR / "plastic.jpg", "rb") as f:
        data = f.read()
    # Set an impossible threshold of 1.01
    res = classifier.classify_image(data, threshold=1.01)
    assert res.status == "low_confidence"
    assert res.is_confident is False
    assert "below the" in res.explanation
