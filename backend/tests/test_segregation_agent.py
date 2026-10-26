import pytest
from app.agent.segregation_agent import get_segregation_agent, AgentState
from app.schemas import ClassificationResult, AlternativePrediction

def test_segregation_agent_standard_plastic():
    agent = get_segregation_agent()
    classification = ClassificationResult(
        status="success",
        predicted_category="plastic",
        display_name="Plastic",
        subtype="plastic_bottle",
        confidence=0.95,
        threshold=0.50,
        is_confident=True,
        explanation="Classified as Plastic (95.0% confidence).",
        alternative_predictions=[
            AlternativePrediction(category="metal", display_name="Metal", confidence=0.03, percentage="3.0%")
        ],
        inference_time_ms=12.0
    )

    decision = agent.process(classification, location_available=True)
    assert decision.state == AgentState.CLASSIFIED
    assert decision.final_category == "plastic"
    assert "Curbside Recyclables" in decision.disposal_route
    assert len(decision.reasons) > 0
    assert "set_theory" in decision.mathematical_audit
    assert decision.evidence_breakdown.image_classifier_evidence["confidence"] == 0.95

def test_segregation_agent_battery_triggers_clarification():
    agent = get_segregation_agent()
    classification = ClassificationResult(
        status="success",
        predicted_category="batteries",
        display_name="Batteries",
        subtype="lithium_ion",
        confidence=0.92,
        threshold=0.50,
        is_confident=True,
        explanation="Classified as Batteries.",
        alternative_predictions=[],
        inference_time_ms=15.0
    )

    # When is_damaged attribute is unknown, agent MUST trigger clarification
    decision = agent.process(classification, user_attributes={})
    assert decision.state == AgentState.NEEDS_CLARIFICATION
    assert decision.clarification_prompt is not None
    assert decision.clarification_prompt.clarification_id == "CLARIFY-BATT-01"
    assert len(decision.clarification_prompt.options) >= 2

def test_segregation_agent_battery_damaged_resolution():
    agent = get_segregation_agent()
    classification = ClassificationResult(
        status="success",
        predicted_category="batteries",
        display_name="Batteries",
        subtype="lithium_ion",
        confidence=0.92,
        threshold=0.50,
        is_confident=True,
        explanation="Classified as Batteries.",
        alternative_predictions=[],
        inference_time_ms=15.0
    )

    # With clarification resolved and damaged=True, agent applies CRITICAL rule
    decision = agent.process(
        classification,
        user_attributes={"is_damaged": True, "_clarification_resolved": True}
    )
    assert decision.state == AgentState.CLASSIFIED
    assert decision.specialized_facility_required is True
    # Should trigger RULE-BATT-01 with CRITICAL severity
    assert any(w["severity"] == "CRITICAL" for w in decision.safety_warnings)

def test_segregation_agent_hazardous_chemical_clarification():
    agent = get_segregation_agent()
    classification = ClassificationResult(
        status="success",
        predicted_category="hazardous",
        display_name="Hazardous Household Waste",
        subtype="chemical_bottle",
        confidence=0.88,
        threshold=0.50,
        is_confident=True,
        explanation="Classified as Hazardous.",
        alternative_predictions=[],
        inference_time_ms=14.0
    )

    decision = agent.process(classification, user_attributes={})
    assert decision.state == AgentState.NEEDS_CLARIFICATION
    assert decision.clarification_prompt.clarification_id == "CLARIFY-HAZ-01"
