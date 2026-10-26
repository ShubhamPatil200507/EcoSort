import io
import pytest
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app
from app.schemas import DetectedWasteItem, BatchOptimizationRequest
from app.detection.multi_object_detector import MultiObjectDetector
from app.rules.versioned_rules import VersionedRuleEngine, VERSIONED_RULES
from app.optimizer.batch_optimizer import BatchSortingOptimizer
from app.optimizer.clarification_engine import ClarificationEngine
from app.geospatial.collection_planner import CollectionRoutePlanner

client = TestClient(app)

def test_versioned_rule_registry_presence():
    """Verify statutory rule registry v1.2.0 is loaded with valid citations."""
    engine = VersionedRuleEngine.get_instance()
    assert len(VERSIONED_RULES) >= 10
    rule = VERSIONED_RULES["RULE-EWASTE-CIRCUIT-01"]
    assert "CPCB" in rule.source
    assert "e_waste_dropoff" in rule.permitted_streams
    assert "municipal_recycling" in rule.ineligible_streams

def test_rule_engine_hazardous_prohibition():
    """Verify hazardous waste is strictly forbidden from municipal recycling."""
    engine = VersionedRuleEngine.get_instance()
    res = engine.evaluate_item("hazardous", subtype="cleaning_solvent", confidence=0.90)
    assert "specialized_hazardous" in res["eligible_streams"]
    assert "municipal_recycling" in res["ineligible_streams"]
    assert "organic_composting" in res["ineligible_streams"]

def test_rule_engine_low_confidence_review_diversion():
    """Verify low-confidence hazardous item is diverted to manual review."""
    engine = VersionedRuleEngine.get_instance()
    res = engine.evaluate_item("batteries", subtype="lithium_ion_battery", confidence=0.45)
    assert res["requires_manual_review"] is True
    assert "Low confidence" in res["review_reason"]

def test_multi_object_detector_single_item():
    """Verify single image produces 1 localized item proposal."""
    det = MultiObjectDetector.get_instance()
    img = Image.new("RGB", (200, 200), (255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    items = det.detect_and_classify(buf.getvalue())
    assert len(items) >= 1
    assert items[0].item_id == "item_1"
    assert items[0].bounding_box["w"] > 0.5

def test_optimizer_milp_optimal_solve():
    """Verify HiGHS MILP solver optimizes multi-item batch with multi-stream options to provable optimality."""
    opt = BatchSortingOptimizer.get_instance()
    items = [
        DetectedWasteItem(item_id="item_1", bounding_box={"x": 0.1, "y": 0.1, "w": 0.3, "h": 0.3}, predicted_category="glass", display_name="Glass Jar", confidence=0.95),
        DetectedWasteItem(item_id="item_2", bounding_box={"x": 0.5, "y": 0.1, "w": 0.3, "h": 0.3}, predicted_category="e_waste", display_name="Electronics", confidence=0.90)
    ]
    req = BatchOptimizationRequest(items=items)
    res = opt.optimize_batch(req)
    assert res.status == "optimal"
    assert res.objective_value > 0.0
    assert len(res.assignments) == 2
    assert res.is_degenerate is False

def test_optimizer_degenerate_single_stream_detection():
    """Verify optimizer correctly identifies and reports degenerate single-stream batches."""
    opt = BatchSortingOptimizer.get_instance()
    # Plastic has exactly 1 permitted stream (municipal_recycling)
    items = [
        DetectedWasteItem(item_id="item_1", bounding_box={"x": 0.1, "y": 0.1, "w": 0.3, "h": 0.3}, predicted_category="plastic", display_name="Plastic Bottle", confidence=0.95)
    ]
    req = BatchOptimizationRequest(items=items)
    res = opt.optimize_batch(req)
    assert res.is_degenerate is True
    assert res.status == "degenerate_trivial"
    assert "Degenerate trivial case" in res.decision_explanation["summary"]

def test_optimizer_capacity_constraints():
    """Verify stream capacity limits enforce deployment bounds."""
    opt = BatchSortingOptimizer.get_instance()
    items = [
        DetectedWasteItem(item_id="item_1", bounding_box={"x": 0.1, "y": 0.1, "w": 0.2, "h": 0.2}, predicted_category="e_waste", display_name="E1", confidence=0.95),
        DetectedWasteItem(item_id="item_2", bounding_box={"x": 0.3, "y": 0.1, "w": 0.2, "h": 0.2}, predicted_category="e_waste", display_name="E2", confidence=0.92),
        DetectedWasteItem(item_id="item_3", bounding_box={"x": 0.5, "y": 0.1, "w": 0.2, "h": 0.2}, predicted_category="e_waste", display_name="E3", confidence=0.90)
    ]
    # Set capacity limit of 2 items on e-waste
    req = BatchOptimizationRequest(items=items, capacity_limits={"e_waste_dropoff": 2})
    res = opt.optimize_batch(req)
    assert res.status == "optimal"
    # Third item should be routed to manual review or alternative
    assigned_ewaste = [a for a in res.assignments if a.assigned_stream == "e_waste_dropoff"]
    assert len(assigned_ewaste) <= 2

def test_clarification_engine_strategies_comparison():
    """Verify all 4 clarification strategies are evaluated and compared."""
    engine = ClarificationEngine.get_instance()
    items = [
        DetectedWasteItem(item_id="item_1", bounding_box={"x": 0.1, "y": 0.1, "w": 0.3, "h": 0.3}, predicted_category="plastic", display_name="Bottle", confidence=0.96, entropy=0.20),
        DetectedWasteItem(item_id="item_2", bounding_box={"x": 0.5, "y": 0.1, "w": 0.3, "h": 0.3}, predicted_category="batteries", display_name="Cell", confidence=0.55, entropy=1.45)
    ]
    res_b = engine.evaluate_all_strategies(items, selected_strategy="confidence")
    assert res_b.question is not None
    assert res_b.question.item_id == "item_2"

    res_a = engine.evaluate_all_strategies(items, selected_strategy="independent")
    assert res_a.question is None  # Strategy A asks 0 questions

def test_collection_route_planner_tsp():
    """Verify exact TSP collection tour is planned with verified stops and haversine labeling."""
    planner = CollectionRoutePlanner.get_instance()
    plan = planner.plan_collection_tour(
        active_streams=["e_waste_dropoff", "municipal_recycling"],
        user_lat=19.0760,
        user_lon=72.8777
    )
    assert plan.total_stops >= 1
    assert plan.total_distance_km > 0.0
    assert plan.distance_type == "straight_line_haversine_estimate"
    assert "CPCB" in plan.verification_notes

def test_api_batch_detect_and_optimize():
    """Integration test: API endpoints for /api/batch/detect and /api/batch/optimize."""
    img = Image.new("RGB", (300, 300), (200, 200, 200))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    # Detect endpoint
    resp = client.post("/api/batch/detect", files={"file": ("test.jpg", buf.getvalue(), "image/jpeg")})
    assert resp.status_code == 200
    det_data = resp.json()
    assert det_data["status"] == "success"
    assert len(det_data["items"]) >= 1

    # Optimize endpoint
    opt_req = {
        "session_id": det_data["session_id"],
        "items": det_data["items"],
        "enforce_incompatibilities": True
    }
    resp_opt = client.post("/api/batch/optimize", json=opt_req)
    assert resp_opt.status_code == 200
    opt_data = resp_opt.json()
    assert opt_data["status"] in ["optimal", "degenerate_trivial"]
    assert len(opt_data["assignments"]) >= 1

def test_api_audit_log():
    """Verify user correction audit log endpoint persists and retrieves records."""
    audit_payload = {
        "item_id": "item_1",
        "original_category": "general_residual",
        "corrected_category": "plastic",
        "user_context": "Clear water bottle with PET 1 stamp"
    }
    resp = client.post("/api/batch/audit-log", json=audit_payload)
    assert resp.status_code == 200
    assert resp.json()["status"] == "recorded"

    resp_hist = client.get("/api/batch/audit-history")
    assert resp_hist.status_code == 200
    assert resp_hist.json()["total_audits"] >= 1

def test_yolo_waste_detector_single_item():
    """Verify Anchor-Free YOLOWasteDetector locates objects and maps categories."""
    from app.detection.yolo_detector import YOLOWasteDetector
    det = YOLOWasteDetector.get_instance()
    img = Image.new("RGB", (250, 250), (255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    items = det.detect_and_classify(buf.getvalue())
    assert len(items) >= 1
    assert items[0].bounding_box["w"] > 0.0

def test_retraining_manager_correction_lifecycle():
    """Verify user correction recording, curator verification gate, and registry."""
    from app.ml.retraining import RetrainingManager
    mgr = RetrainingManager.get_instance()
    
    # 1. Record correction (starts as PENDING)
    rec = mgr.record_correction(
        session_id="test_sess_1",
        original_prediction="general_residual",
        corrected_label="plastic",
        user_notes="PET bottle marked as plastic"
    )
    assert rec["status"] == "PENDING"
    corr_id = rec["correction_id"]

    # 2. Curator verification gate
    verified = mgr.verify_correction(corr_id, new_status="VERIFIED", curator_name="Lead Reviewer")
    assert verified is not None
    assert verified["status"] == "VERIFIED"
    assert verified["verified_by"] == "Lead Reviewer"

    # 3. Model registry check
    versions = mgr.list_model_versions()
    assert "active_version" in versions
    assert len(versions["versions"]) >= 1

def test_api_retraining_endpoints():
    """Integration test for retraining verification and version governance endpoints."""
    # List corrections
    r_list = client.get("/api/retraining/corrections")
    assert r_list.status_code == 200
    assert isinstance(r_list.json(), list)

    # List versions
    r_ver = client.get("/api/retraining/versions")
    assert r_ver.status_code == 200
    ver_data = r_ver.json()
    assert "active_version" in ver_data
    assert len(ver_data["versions"]) >= 1

