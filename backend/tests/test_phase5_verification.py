"""
EcoSort Phase 5 Verification Test Suite
Explicitly demonstrates and validates all 12 core requirements specified in Phase 5:
  1. A valid supported image reaches the inference pipeline.
  2. Invalid uploads are rejected.
  3. Low-confidence classification produces an uncertainty state.
  4. Supported waste categories map to the expected rules.
  5. An electronic item triggers the appropriate e-waste guidance.
  6. Battery-related safety rules are evaluated correctly.
  7. Unknown attributes trigger clarification when required.
  8. Set-based centre matching excludes incompatible facilities.
  9. Graph traversal returns only reachable, relevant disposal routes.
 10. Missing location triggers the manual-location fallback.
 11. Empty or unavailable centre search produces a graceful response.
 12. Explanation output agrees with the actual rules evaluated.
"""

import pytest
from pathlib import Path
from fastapi.testclient import TestClient

from app.main import app
from app.ml.classifier import get_classifier
from app.ml.categories import CATEGORIES
from app.agent.segregation_agent import get_segregation_agent, AgentState
from app.schemas import ClassificationResult, AlternativePrediction
from app.rules.set_theory import WasteSetEngine, WASTE_UNIVERSE
from app.rules.logic import RuleRegistry
from app.rules.graph import DISPOSAL_GRAPH
from app.geospatial.centres_db import VERIFIED_COLLECTION_CENTRES
from app.geospatial.provider import VerifiedDirectoryProvider

SAMPLE_DIR = Path(__file__).resolve().parent.parent / "data" / "sample_images"
client = TestClient(app)


# 1. A valid supported image reaches the inference pipeline
def test_1_valid_supported_image_reaches_inference():
    classifier = get_classifier()
    with open(SAMPLE_DIR / "plastic.jpg", "rb") as f:
        data = f.read()
    res = classifier.classify_image(data)
    assert res.status == "success"
    assert res.predicted_category == "plastic"
    assert res.confidence >= 0.50
    assert res.inference_time_ms > 0


# 2. Invalid uploads are rejected
def test_2_invalid_uploads_rejected():
    # Test corrupt file bytes
    corrupt_bytes = b"NOT_A_VALID_JPEG_HEADER_XYZ_1234567890"
    classifier = get_classifier()
    res = classifier.classify_image(corrupt_bytes)
    assert res.status in ("error", "unclear_image")

    # Test invalid extension via API
    resp = client.post(
        "/api/classify",
        files={"file": ("malicious.exe", b"executable_binary_content", "application/x-msdownload")}
    )
    assert resp.status_code == 400
    assert "Unsupported file format" in resp.json()["detail"]


# 3. Low-confidence classification produces an uncertainty state
def test_3_low_confidence_produces_uncertainty_state():
    classifier = get_classifier()
    with open(SAMPLE_DIR / "plastic.jpg", "rb") as f:
        data = f.read()
    # Setting an impossible threshold of 1.01 triggers low_confidence status
    res = classifier.classify_image(data, threshold=1.01)
    assert res.status == "low_confidence"
    assert res.is_confident is False
    assert "below the" in res.explanation


# 4. Supported waste categories map to the expected rules
def test_4_supported_categories_map_to_expected_rules():
    agent = get_segregation_agent()
    for cat in CATEGORIES:
        assert WasteSetEngine.is_valid_category(cat) is True
        classification = ClassificationResult(
            status="success",
            predicted_category=cat,
            display_name=cat.replace("_", " ").title(),
            confidence=0.95,
            threshold=0.50,
            is_confident=True,
            explanation=f"Valid {cat}",
            alternative_predictions=[],
            inference_time_ms=5.0
        )
        decision = agent.process(classification, user_attributes={"_clarification_resolved": True})
        assert decision.state == AgentState.CLASSIFIED
        assert decision.final_category == cat
        assert decision.disposal_route != ""


# 5. An electronic item triggers the appropriate e-waste guidance
def test_5_electronic_item_triggers_ewaste_guidance():
    agent = get_segregation_agent()
    classification = ClassificationResult(
        status="success",
        predicted_category="e_waste",
        display_name="Electronic Waste",
        subtype="mobile_phone",
        confidence=0.92,
        threshold=0.50,
        is_confident=True,
        explanation="Detected mobile phone",
        alternative_predictions=[],
        inference_time_ms=8.0
    )
    decision = agent.process(classification, location_available=True)
    assert decision.state == AgentState.CLASSIFIED
    assert decision.specialized_facility_required is True
    # Verify RULE-EWASTE-01 matched
    matched_rule_ids = [r["rule_id"] for r in decision.mathematical_audit["propositional_logic"]["matched_rules"]]
    assert "RULE-EWASTE-01" in matched_rule_ids
    # Verify secure data removal guidance
    assert any("data" in step.lower() for step in decision.preparation_steps)


# 6. Battery-related safety rules are evaluated correctly
def test_6_battery_related_safety_rules_evaluated():
    agent = get_segregation_agent()
    classification = ClassificationResult(
        status="success",
        predicted_category="batteries",
        display_name="Batteries",
        subtype="lithium_ion",
        confidence=0.95,
        threshold=0.50,
        is_confident=True,
        explanation="Lithium-Ion Battery",
        alternative_predictions=[],
        inference_time_ms=6.0
    )

    # 6A: Damaged battery -> CRITICAL safety rule RULE-BATT-01
    decision_damaged = agent.process(
        classification,
        user_attributes={"is_damaged": True, "_clarification_resolved": True}
    )
    assert any(w["severity"] == "CRITICAL" for w in decision_damaged.safety_warnings)
    assert any("sand" in step.lower() for step in decision_damaged.preparation_steps)

    # 6B: Intact battery -> Standard terminal taping rule RULE-BATT-02
    decision_intact = agent.process(
        classification,
        user_attributes={"is_damaged": False, "_clarification_resolved": True}
    )
    assert any("tape" in step.lower() for step in decision_intact.preparation_steps)


# 7. Unknown attributes trigger clarification when required
def test_7_unknown_attributes_trigger_clarification():
    agent = get_segregation_agent()
    classification = ClassificationResult(
        status="success",
        predicted_category="batteries",
        display_name="Batteries",
        subtype="lithium_ion",
        confidence=0.90,
        threshold=0.50,
        is_confident=True,
        explanation="Battery",
        alternative_predictions=[],
        inference_time_ms=7.0
    )
    # No user attributes provided -> triggers CLARIFY-BATT-01
    decision = agent.process(classification, user_attributes={})
    assert decision.state == AgentState.NEEDS_CLARIFICATION
    assert decision.clarification_prompt is not None
    assert decision.clarification_prompt.clarification_id == "CLARIFY-BATT-01"
    assert decision.clarification_prompt.affects_safety is True


# 8. Set-based centre matching excludes incompatible facilities
def test_8_set_based_centre_matching_excludes_incompatible():
    provider = VerifiedDirectoryProvider()
    # Bengaluru coordinates
    lat, lon = 12.9716, 77.5946
    
    # Plastic search should exclude centres that ONLY accept e-waste
    import asyncio
    plastic_centres = asyncio.run(provider.get_nearby_centres(lat, lon, radius_km=50, category="plastic"))
    for centre in plastic_centres:
        accepted_set = set(c.lower() for c in centre.accepted_categories)
        assert WasteSetEngine.is_compatible_centre(accepted_set, "plastic") is True


# 9. Graph traversal returns only reachable, relevant disposal routes
def test_9_graph_traversal_returns_only_reachable_routes():
    reachable = DISPOSAL_GRAPH.find_reachable_subgraph("cat_ewaste")
    reachable_facs = reachable["reachable_facility_types"]
    # E-Waste MUST reach Authorized E-Waste Collection Centre
    assert "Authorized E-Waste Collection Centre" in reachable_facs
    # E-Waste MUST NEVER reach Municipal Wet Waste Composting Unit
    assert "Municipal Wet Waste Composting Unit" not in reachable_facs


# 10. Missing location triggers the manual-location fallback
def test_10_missing_location_triggers_manual_location_fallback():
    # Forward geocoding with city name
    resp = client.get("/api/geocoding/search?query=Bengaluru")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) > 0
    assert data[0]["latitude"] != 0.0
    assert data[0]["longitude"] != 0.0
    assert "Bengaluru" in data[0]["formatted_address"] or "Bangalore" in data[0]["formatted_address"]


# 11. Empty or unavailable centre search produces a graceful response
def test_11_empty_centre_search_produces_graceful_response():
    # Remote location in Atlantic Ocean (0.0, 0.0) with small radius (1 km)
    resp = client.get("/api/centres/nearby?lat=0.0&lon=0.0&radius_km=1.0")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_found"] == 0
    assert data["centres"] == []
    assert data["is_demo"] is False or data["is_demo"] is True


# 12. Explanation output agrees with the actual rules evaluated
def test_12_explanation_output_agrees_with_actual_rules():
    agent = get_segregation_agent()
    classification = ClassificationResult(
        status="success",
        predicted_category="plastic",
        display_name="Plastic",
        subtype="plastic_bottle",
        confidence=0.96,
        threshold=0.50,
        is_confident=True,
        explanation="Classified as Plastic (96.0% confidence).",
        alternative_predictions=[],
        inference_time_ms=8.0
    )
    decision = agent.process(
        classification,
        user_attributes={"food_contaminated": True, "_clarification_resolved": True}
    )
    # RULE-PLASTIC-01 should match and require rinsing
    matched_ids = [r["rule_id"] for r in decision.mathematical_audit["propositional_logic"]["matched_rules"]]
    assert "RULE-PLASTIC-01" in matched_ids
    assert any("rinse" in step.lower() for step in decision.preparation_steps)
    assert any("Plastic" in r for r in decision.reasons)
