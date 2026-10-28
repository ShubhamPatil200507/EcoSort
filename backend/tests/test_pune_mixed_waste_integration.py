import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.geospatial.centres_db import VERIFIED_COLLECTION_CENTRES
from app.optimizer.batch_optimizer import BatchSortingOptimizer
from app.optimizer.clarification_engine import ClarificationEngine
from app.schemas import DetectedWasteItem, BatchOptimizationRequest

@pytest.mark.asyncio
async def test_pune_collection_centres_nearby():
    """Verify Pune collection centres are retrieved by coordinates with full statutory schema."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Search near central Pune (18.5204, 73.8567) within 20km
        resp = await ac.get("/api/centres/nearby?lat=18.5204&lon=73.8567&radius=20")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_found"] > 0

        pune_facilities = [c for c in data["centres"] if c["city"] in ["Pune", "Pimpri-Chinchwad"]]
        assert len(pune_facilities) >= 5

        # Verify SWaCH Aundh
        swach = next((c for c in pune_facilities if c["id"] == "pune-swach-001"), None)
        assert swach is not None
        assert "e_waste" in swach["accepted_categories"]
        assert swach["verification_status"] == "OFFICIALLY_VERIFIED"
        assert swach["data_status"] == "verified"
        assert swach["last_verified_date"] is not None

        # Verify Green IT Sadashiv Peth with MPCB authorisation
        green_it = next((c for c in pune_facilities if "greenit" in c["id"]), None)
        assert green_it is not None
        assert "batteries" in green_it["accepted_categories"]
        assert "MPCB" in (green_it.get("authorisation_status") or "")
        assert green_it.get("expiry_date") is not None

        # Verify unverified general scrap is labeled accordingly
        rohan = next((c for c in pune_facilities if "rohan" in c["id"]), None)
        if rohan:
            assert rohan["verification_status"] == "GENERAL_SCRAP_UNVERIFIED"
            assert rohan["data_status"] == "stale"

@pytest.mark.asyncio
async def test_pune_pin_search():
    """Verify PIN code searching resolves Pune hubs correctly."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Search Aundh PIN 411007
        resp = await ac.get("/api/centres/search?query=411007&radius=15")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_found"] > 0
        names = [c["name"] for c in data["centres"]]
        assert any("SWaCH" in n or "Aundh" in n for n in names)

def test_mixed_waste_batch_separation():
    """Verify mixed-waste scene allocates distinct items to separate, non-conflated streams."""
    optimizer = BatchSortingOptimizer.get_instance()

    items = [
        DetectedWasteItem(
            item_id="item_01",
            bounding_box={"x": 0.05, "y": 0.1, "w": 0.25, "h": 0.3},
            predicted_category="plastic",
            predicted_subtype="plastic_bottle",
            display_name="Plastic Bottle",
            confidence=0.92,
            calibrated_probabilities={"plastic": 0.92, "metal": 0.05, "glass": 0.03},
            entropy=0.31,
            alternatives=[],
            material_attributes={"recyclable": True},
            status="detected"
        ),
        DetectedWasteItem(
            item_id="item_02",
            bounding_box={"x": 0.35, "y": 0.1, "w": 0.25, "h": 0.3},
            predicted_category="paper_cardboard",
            predicted_subtype="cardboard_box",
            display_name="Cardboard Packaging",
            confidence=0.89,
            calibrated_probabilities={"paper_cardboard": 0.89, "general_residual": 0.11},
            entropy=0.35,
            alternatives=[],
            material_attributes={"recyclable": True},
            status="detected"
        ),
        DetectedWasteItem(
            item_id="item_03",
            bounding_box={"x": 0.65, "y": 0.1, "w": 0.3, "h": 0.35},
            predicted_category="e_waste",
            predicted_subtype="circuit_board",
            display_name="Printed Circuit Board",
            confidence=0.94,
            calibrated_probabilities={"e_waste": 0.94, "metal": 0.04, "plastic": 0.02},
            entropy=0.25,
            alternatives=[],
            material_attributes={"hazardous": True, "electronic": True},
            status="detected"
        ),
        DetectedWasteItem(
            item_id="item_04",
            bounding_box={"x": 0.2, "y": 0.55, "w": 0.2, "h": 0.25},
            predicted_category="batteries",
            predicted_subtype="lithium_ion_battery",
            display_name="Lithium-Ion Battery",
            confidence=0.95,
            calibrated_probabilities={"batteries": 0.95, "hazardous": 0.05},
            entropy=0.20,
            alternatives=[],
            material_attributes={"fire_risk": True, "hazardous": True},
            status="detected"
        ),
        DetectedWasteItem(
            item_id="item_05",
            bounding_box={"x": 0.55, "y": 0.55, "w": 0.2, "h": 0.25},
            predicted_category="organic_food",
            predicted_subtype="fruit_vegetable_peel",
            display_name="Fruit Peels",
            confidence=0.88,
            calibrated_probabilities={"organic_food": 0.88, "general_residual": 0.12},
            entropy=0.37,
            alternatives=[],
            material_attributes={"biodegradable": True},
            status="detected"
        )
    ]

    req = BatchOptimizationRequest(items=items)
    res = optimizer.optimize_batch(req)

    assert res.status in ["optimal", "feasible"]
    assert len(res.active_streams) >= 3  # Must not merge into a single stream

    # Map item assignments
    assigned = {a.item_id: a.assigned_stream for a in res.assignments}

    # Verify dry recyclables (plastic, paper)
    assert assigned["item_01"] == "municipal_recycling"
    assert assigned["item_02"] == "municipal_recycling"

    # Verify electronic waste is separate
    assert assigned["item_03"] == "e_waste_dropoff"

    # Verify battery is separate (never merged into municipal recycling)
    assert assigned["item_04"] == "battery_reclamation"
    assert assigned["item_04"] != assigned["item_01"]

    # Verify organic composting
    assert assigned["item_05"] == "organic_composting"

def test_clarification_evoi_options():
    """Verify clarification engine includes 'I don't know' and 'None of these' options."""
    engine = ClarificationEngine.get_instance()

    ambiguous_item = DetectedWasteItem(
        item_id="ambiguous_01",
        bounding_box={"x": 0.1, "y": 0.1, "w": 0.4, "h": 0.4},
        predicted_category="plastic",
        display_name="Ambiguous Plastic",
        confidence=0.55,
        calibrated_probabilities={"plastic": 0.55, "metal": 0.45},
        entropy=0.69,
        alternatives=[{"category": "metal", "display_name": "Metal", "confidence": 0.45, "percentage": "45.0%"}],
        material_attributes={},
        status="detected"
    )

    result = engine.evaluate_all_strategies([ambiguous_item], selected_strategy="decision_aware")
    assert result.selected_strategy == "decision_aware"
    assert result.question is not None

    opt_ids = [o.id for o in result.question.options]
    assert "opt_dont_know" in opt_ids
    assert "opt_none_of_these" in opt_ids
