import pytest
from app.ml.categories import CATEGORIES
from app.recommendations.engine import get_recommendation

def test_recommendations_for_all_categories():
    for cat in CATEGORIES:
        rec = get_recommendation(cat)
        assert rec.category == cat
        assert rec.primary_action is not None and len(rec.primary_action) > 0
        assert rec.recommended_disposal_route is not None
        assert len(rec.preparation_steps) > 0
        assert len(rec.safety_precautions) > 0
        assert isinstance(rec.separate_from_regular_trash, bool)
        assert isinstance(rec.specialized_facility_required, bool)
        assert rec.disclaimer is not None

def test_ewaste_special_rules():
    rec = get_recommendation("e_waste")
    assert rec.separate_from_regular_trash is True
    assert rec.specialized_facility_required is True
    assert any("data" in step.lower() for step in rec.preparation_steps)
    assert any("battery" in warn.lower() for warn in rec.safety_precautions)

def test_batteries_special_rules():
    rec = get_recommendation("batteries")
    assert rec.separate_from_regular_trash is True
    assert rec.specialized_facility_required is True
    assert any("tape" in step.lower() for step in rec.preparation_steps)
    assert any("fire" in warn.lower() for warn in rec.safety_precautions)
