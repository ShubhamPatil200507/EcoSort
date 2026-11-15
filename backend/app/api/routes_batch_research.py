import time
import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, File, UploadFile, HTTPException, Query, Body, status

from app.config import settings
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
    RuleDefinitionSchema
)

router = APIRouter(prefix="/batch", tags=["Batch Research & Optimization"])

# In-memory session audit trail storage (for research audit logging)
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
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    content_type = file.content_type or ""

    is_valid_ext = ext in settings.ALLOWED_EXTENSIONS
    is_valid_mime = content_type.startswith("image/") or content_type == "application/octet-stream"
    is_blob = filename == "blob" or not ext

    if not (is_valid_ext or is_valid_mime or is_blob):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported format '{ext or content_type}'. Supported: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")

    if len(contents) > settings.MAX_UPLOAD_SIZE_BYTES:
        max_mb = settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=f"File exceeds {max_mb} MB.")

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
    user_lat: float = Query(19.0760, description="User origin latitude"),
    user_lon: float = Query(72.8777, description="User origin longitude")
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

@router.post("/audit-log")
async def record_user_correction_audit(
    log_entry: Dict[str, Any] = Body(...)
):
    """
    Stores user correction and decision outcome in audit trail and retraining queue.
    """
    entry = {
        **log_entry,
        "recorded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "model_version": settings.APP_VERSION,
        "rule_engine_version": "1.2.0"
    }
    AUDIT_LOGS.append(entry)

    # Feed into model retraining verification queue with PENDING status
    try:
        retrain_mgr = RetrainingManager.get_instance()
        retrain_mgr.record_correction(
            session_id=log_entry.get("session_id", "session_unknown"),
            original_prediction=log_entry.get("original_category", "unknown"),
            corrected_label=log_entry.get("corrected_category", log_entry.get("new_category", "unknown")),
            user_notes=log_entry.get("user_context")
        )
    except Exception:
        pass

    return {"status": "recorded", "audit_id": f"aud_{len(AUDIT_LOGS)}", "total_records": len(AUDIT_LOGS)}

@router.get("/audit-history")
async def get_audit_history():
    """
    Retrieves recorded correction history and batch decision audits.
    """
    return {"total_audits": len(AUDIT_LOGS), "audit_logs": AUDIT_LOGS[-50:]}
