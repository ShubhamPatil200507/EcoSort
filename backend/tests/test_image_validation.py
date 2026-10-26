import pytest
from pathlib import Path
from app.ml.classifier import get_classifier

SAMPLE_DIR = Path(__file__).resolve().parent.parent / "data" / "sample_images"

def test_corrupt_image_bytes():
    classifier = get_classifier()
    result = classifier.classify_image(b"not_an_image_corrupt_data")
    assert result.status == "error"
    assert result.is_confident is False
    assert "Invalid image" in result.explanation

def test_unclear_blank_image():
    classifier = get_classifier()
    with open(SAMPLE_DIR / "unclear_blank.jpg", "rb") as f:
        data = f.read()
    result = classifier.classify_image(data)
    assert result.status == "unclear_image"
    assert result.is_confident is False
    assert "flat or blank" in result.explanation
