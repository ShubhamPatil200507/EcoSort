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

def test_multi_object_composite_image():
    import io
    from PIL import Image
    classifier = get_classifier()
    
    # Create composite with plastic on left and metal on right
    img_left = Image.open(SAMPLE_DIR / "plastic.jpg").resize((300, 300))
    img_right = Image.open(SAMPLE_DIR / "metal.jpg").resize((300, 300))
    composite = Image.new("RGB", (600, 300))
    composite.paste(img_left, (0, 0))
    composite.paste(img_right, (300, 0))
    
    buf = io.BytesIO()
    composite.save(buf, format="JPEG")
    composite_bytes = buf.getvalue()
    
    res = classifier.classify_image(composite_bytes)
    assert res.status == "success"
    assert res.is_multi_object is True
    assert len(res.detected_objects) >= 2
    detected_cats = {o.category for o in res.detected_objects}
    assert "plastic" in detected_cats
    assert "metal" in detected_cats
    assert res.multi_object_summary is not None
