import pytest
from pathlib import Path
from fastapi.testclient import TestClient

SAMPLE_DIR = Path(__file__).resolve().parent.parent / "data" / "sample_images"

def test_api_health(client: TestClient):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["total_categories"] == 10

def test_api_classify_file(client: TestClient):
    with open(SAMPLE_DIR / "e_waste.jpg", "rb") as f:
        files = {"file": ("e_waste.jpg", f, "image/jpeg")}
        resp = client.post("/api/classify", files=files)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["predicted_category"] == "e_waste"
    assert data["confidence"] >= 0.50

def test_api_classify_invalid_file_extension(client: TestClient):
    files = {"file": ("document.pdf", b"fake pdf content", "application/pdf")}
    resp = client.post("/api/classify", files=files)
    assert resp.status_code == 400
    assert "Unsupported file format" in resp.json()["detail"]

def test_api_recommendations(client: TestClient):
    resp = client.post("/api/recommendations", json={"category": "batteries"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["category"] == "batteries"
    assert data["specialized_facility_required"] is True

def test_api_centres_nearby(client: TestClient):
    resp = client.get("/api/centres/nearby?lat=19.14&lon=73.00&radius=25&category=e_waste")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_found"] > 0
    assert len(data["centres"]) > 0

def test_api_centres_search(client: TestClient):
    resp = client.get("/api/centres/search?query=Mumbai&radius=30")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_found"] > 0

def test_api_feedback(client: TestClient):
    resp = client.post("/api/feedback", json={
        "predicted_category": "plastic",
        "user_suggested_category": "glass",
        "comments": "This was a transparent glass jar."
    })
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"
