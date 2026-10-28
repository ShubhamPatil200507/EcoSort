import time
import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, File, UploadFile, HTTPException, Query, Body, status

from app.config import settings
from app.utils.security import validate_image_bytes
from app.detection.multi_object_detector import MultiObjectDetector
from app.detection.yolo_detector import YOLOWasteDetector
from app.rules.versioned_rules import VersionedRuleEngine, VERSIONED_RULES
from app.optimizer.batch_optimizer import BatchSortingOptimizer
from app.optimizer.clarification_engine import ClarificationEngine
from app.geospatial.collection_planner import CollectionRoutePlanner
from app.ml.retraining import RetrainingManager
from app.schemas import (
    BatchAnalysisResponse,
    BatchOptimizationRequest,
    BatchOptimizationResponse,
    ClarificationComparisonResult,
    MultiStopCollectionPlan,
    RuleDefinitionSchema,
    AuditLogEntryRequest,
    AuditLogEntryResponse
)

router = APIRouter(prefix="/batch", tags=["Batch Research & Optimization"])

# Bounded in-memory session audit trail storage (max 500 records to prevent memory exhaustion DoS)
MAX_AUDIT_LOG_CAPACITY = 500
AUDIT_LOGS: List[Dict[str, Any]] = []

@router.post("/detect", response_model=BatchAnalysisResponse)
async def detect_batch_objects(
    file: UploadFile = File(...),
    detector_mode: str = Query("hybrid", description="'yolo', 'contour', or 'hybrid'")
):
    """
    Decomposes single or multi-object waste photograph into localized bounding boxes
    with base64 crops, calibrated probabilities, and material attributes.
    Supports Anchor-Free YOLOv8, Contour Saliency, or Hybrid.
    """
    filename = file.filename or "upload.jpg"
    contents = await file.read()

    # Multi-stage security validation: size, magic bytes signature, PIL format integrity, dimensions
    validate_image_bytes(contents, filename)

    t0 = time.time()
    if detector_mode.lower() == "yolo":
        detector = YOLOWasteDetector.get_instance()
        items = detector.detect_and_classify(contents)
    elif detector_mode.lower() == "contour":
        detector = MultiObjectDetector.get_instance()
        items = detector.detect_and_classify(contents)
    else:  # hybrid
        try:
            detector = YOLOWasteDetector.get_instance()
            items = detector.detect_hybrid(contents)
        except Exception:
            detector = MultiObjectDetector.get_instance()
            items = detector.detect_and_classify(contents)

    elapsed_ms = round((time.time() - t0) * 1000, 2)

    session_id = f"session_{uuid.uuid4().hex[:8]}"

    return BatchAnalysisResponse(
        session_id=session_id,
        status="success",
        item_count=len(items),
        items=items,
        is_multi_object=len(items) >= 2,
        processing_time_ms=elapsed_ms,
        image_metadata={"filename": filename, "size_bytes": len(contents)}
    )

@router.post("/optimize", response_model=BatchOptimizationResponse)
async def optimize_batch_assignments(
    request: BatchOptimizationRequest
):
    """
    Executes exact HiGHS Mixed Integer Linear Program (MILP) solving optimal
    batch disposal stream assignments under regulatory and operational constraints.
    """
    optimizer = BatchSortingOptimizer.get_instance()
    response = optimizer.optimize_batch(request)
    return response

@router.post("/clarify", response_model=ClarificationComparisonResult)
async def evaluate_clarification_strategies(
    request: BatchOptimizationRequest,
    strategy: str = Query("decision_aware", description="independent, confidence, entropy, decision_aware")
):
    """
    Compares 4 clarification strategies (Independent, Confidence-based, Entropy-based,
    Decision-Aware EVOI) and returns the optimal strategic clarification prompt.
    """
    engine = ClarificationEngine.get_instance()
    result = engine.evaluate_all_strategies(items=request.items, selected_strategy=strategy)
    return result

@router.post("/route-plan", response_model=MultiStopCollectionPlan)
async def plan_collection_tour(
    active_streams: List[str] = Body(..., embed=True),
    user_lat: float = Query(19.0760, ge=-90.0, le=90.0, description="User origin latitude bounded in [-90, 90]"),
    user_lon: float = Query(72.8777, ge=-180.0, le=180.0, description="User origin longitude bounded in [-180, 180]")
):
    """
    Computes exact graph-based TSP multi-stop collection tour visiting verified facilities
    covering all active streams in the optimized batch.
    """
    planner = CollectionRoutePlanner.get_instance()
    plan = planner.plan_collection_tour(active_streams=active_streams, user_lat=user_lat, user_lon=user_lon)
    return plan

@router.get("/rules", response_model=List[RuleDefinitionSchema])
async def get_registered_rules():
    """
    Returns full versioned statutory rule registry (v1.2.0) with regulatory citations.
    """
    rule_list = []
    for r in VERSIONED_RULES.values():
        rule_list.append(RuleDefinitionSchema(
            rule_id=r.rule_id,
            version=r.version,
            category=r.category,
            permitted_streams=r.permitted_streams,
            prohibited_combinations=r.prohibited_co_disposal,
            required_warnings=r.required_warnings,
            jurisdiction=r.jurisdiction,
            effective_date=r.effective_date,
            verification_status=r.verification_status,
            source=r.source
        ))
    return rule_list

@router.post("/audit-log", response_model=AuditLogEntryResponse)
async def record_user_correction_audit(
    log_entry: AuditLogEntryRequest = Body(...)
):
    """
    Stores user correction and decision outcome in bounded audit trail and retraining queue.
    """
    data_dict = log_entry.model_dump()
    entry = {
        **data_dict,
        "recorded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "model_version": settings.APP_VERSION,
        "rule_engine_version": "1.2.0"
    }

    # Bounded collection: FIFO eviction when exceeding capacity
    if len(AUDIT_LOGS) >= MAX_AUDIT_LOG_CAPACITY:
        AUDIT_LOGS.pop(0)
    AUDIT_LOGS.append(entry)

    # Feed into model retraining verification queue with PENDING status
    try:
        retrain_mgr = RetrainingManager.get_instance()
        retrain_mgr.record_correction(
            session_id=log_entry.session_id or "session_unknown",
            original_prediction=log_entry.original_category or "unknown",
            corrected_label=log_entry.corrected_category or log_entry.new_category or "unknown",
            user_notes=log_entry.user_context
        )
    except Exception:
        pass

    return AuditLogEntryResponse(
        status="recorded",
        audit_id=f"aud_{len(AUDIT_LOGS)}",
        total_records=len(AUDIT_LOGS)
    )

@router.get("/audit-history")
async def get_audit_history():
    """
    Retrieves recorded correction history and batch decision audits.
    """
    return {"total_audits": len(AUDIT_LOGS), "audit_logs": AUDIT_LOGS[-50:]}
