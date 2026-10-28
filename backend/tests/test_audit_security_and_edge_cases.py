import io
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from app.main import app
from app.geospatial.distance import haversine_distance_km
from app.ml.classifier import get_classifier
from app.api.routes_batch_research import AUDIT_LOGS, MAX_AUDIT_LOG_CAPACITY

client = TestClient(app)

def create_valid_test_jpeg() -> bytes:
    """Creates a tiny valid JPEG image in memory for testing."""
    buf = io.BytesIO()
    img = Image.new("RGB", (64, 64), color=(120, 150, 180))
    img.save(buf, format="JPEG")
    return buf.getvalue()

def test_path_traversal_sample_endpoint_blocked():
    """Verify that path traversal sequences are detected and rejected (HTTP 400, 404, or 405)."""
    traversal_payloads = [
        "../../etc/passwd",
        "../config.py",
        "..%2f..%2fapp",
        "sub/dir/sample",
        "nested/path",
        ";rm -rf /",
    ]
    for payload in traversal_payloads:
        resp = client.post(f"/api/classify/sample/{payload}")
        assert resp.status_code in [400, 404, 405], f"Expected security rejection (400, 404, 405) for payload '{payload}', got {resp.status_code}"

def test_mime_spoofing_magic_bytes_validation():
    """Verify that uploading non-image files with spoofed MIME headers is rejected."""
    fake_jpeg_content = b"#!/bin/bash\necho 'This is not a real jpeg file'\n"
    files = {"file": ("malicious.jpg", fake_jpeg_content, "image/jpeg")}
    resp = client.post("/api/classify", files=files)
    assert resp.status_code == 400
    assert "magic bytes" in resp.json()["detail"].lower()

def test_oversized_file_upload_blocked():
    """Verify that uploads exceeding the 10 MB ceiling are rejected with HTTP 413."""
    oversized_bytes = b"\xFF\xD8\xFF" + b"\x00" * (11 * 1024 * 1024)
    files = {"file": ("giant.jpg", oversized_bytes, "image/jpeg")}
    resp = client.post("/api/classify", files=files)
    assert resp.status_code == 413
    assert "maximum allowed size" in resp.json()["detail"].lower()

def test_empty_file_upload_blocked():
    """Verify that empty 0-byte uploads are rejected with HTTP 400."""
    files = {"file": ("empty.jpg", b"", "image/jpeg")}
    resp = client.post("/api/classify", files=files)
    assert resp.status_code == 400
    assert "empty" in resp.json()["detail"].lower()

def test_coordinate_bounds_enforcement():
    """Verify that latitude and longitude outside [-90, 90] and [-180, 180] are rejected."""
    valid_jpeg = create_valid_test_jpeg()

    # Latitude > 90
    files = {"file": ("test.jpg", valid_jpeg, "image/jpeg")}
    resp = client.post("/api/classify-and-recommend?user_lat=95.5&user_lon=73.8", files=files)
    assert resp.status_code == 422

    # Longitude > 180
    files = {"file": ("test.jpg", valid_jpeg, "image/jpeg")}
    resp = client.post("/api/classify-and-recommend?user_lat=18.5&user_lon=195.0", files=files)
    assert resp.status_code == 422

    # Route plan latitude < -90
    resp = client.post(
        "/api/batch/route-plan?user_lat=-95.0&user_lon=72.8",
        json={"active_streams": ["municipal_recycling"]}
    )
    assert resp.status_code == 422

def test_audit_log_bounded_capacity():
    """Verify that in-memory audit logs have a strict ceiling and do not grow unboundedly."""
    initial_count = len(AUDIT_LOGS)
    # Post an entry
    resp = client.post("/api/batch/audit-log", json={
        "session_id": "audit_test_sess",
        "original_category": "plastic",
        "new_category": "glass",
        "user_context": "Testing bounded audit capacity"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "recorded"
    assert data["total_records"] <= MAX_AUDIT_LOG_CAPACITY

def test_classify_crop_pil_direct():
    """Verify that PIL Image crops can be classified directly without byte encoding round-trip."""
    classifier = get_classifier()
    img = Image.new("RGB", (224, 224), color=(60, 120, 200))
    res = classifier.classify_crop_pil(img)
    assert res is not None
    assert res.predicted_category in [
        "plastic", "paper_cardboard", "metal", "glass",
        "organic_food", "textile", "e_waste", "batteries",
        "hazardous", "general_residual"
    ]
    assert res.inference_time_ms > 0

def test_distance_calculation_lru_cache():
    """Verify that haversine_distance_km computes correctly and uses caching."""
    d1 = haversine_distance_km(18.5204, 73.8567, 18.5583, 73.8073)
    d2 = haversine_distance_km(18.5204, 73.8567, 18.5583, 73.8073)
    assert d1 == d2
    assert 6.0 <= d1 <= 8.0  # Approx 6.7 km between Pune center and Aundh
    # Inspect cache info
    info = haversine_distance_km.cache_info()
    assert info.hits >= 1

def test_valid_image_classify_sample():
    """Verify valid sample classification works cleanly with the enhanced security validator."""
    resp = client.post("/api/classify/sample/plastic")
    assert resp.status_code == 200
    data = resp.json()
    assert "classification" in data
    assert "recommendation" in data
    assert data["classification"]["status"] in ["success", "low_confidence"]
