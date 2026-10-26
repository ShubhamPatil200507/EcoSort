from fastapi import APIRouter, HTTPException, Query, Body, status
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
import base64

from app.ml.retraining import RetrainingManager
from app.schemas import FeedbackRequest, LLMConsensusCorrectionResponse

router = APIRouter(prefix="/retraining", tags=["Model Retraining & Governance"])

class VerifyCorrectionRequest(BaseModel):
    correction_id: str
    status: str  # VERIFIED or REJECTED
    curator_name: Optional[str] = "Admin Curator"
    notes: Optional[str] = None

class RollbackRequest(BaseModel):
    target_version: str

@router.post("/consensus-correct", response_model=LLMConsensusCorrectionResponse)
async def consensus_correction_and_retrain(
    req: FeedbackRequest
):
    """
    Submits user correction, runs independent LLM statutory analysis,
    verifies consensus, and triggers automated self-retraining if verified.
    """
    img_bytes = None
    if req.image_base64:
        try:
            b64_data = req.image_base64
            if "," in b64_data:
                b64_data = b64_data.split(",")[1]
            img_bytes = base64.b64decode(b64_data)
        except Exception:
            pass

    mgr = RetrainingManager.get_instance()
    res = mgr.process_correction_with_llm(
        predicted_category=req.predicted_category,
        user_suggested_category=req.user_suggested_category,
        user_notes=req.comments or "",
        image_bytes=img_bytes,
        session_id=req.session_id,
        auto_retrain=req.auto_retrain
    )
    return res

@router.get("/corrections")
async def get_corrections(
    status_filter: Optional[str] = Query(None, description="PENDING, VERIFIED, or REJECTED")
):
    """
    Retrieves logged user corrections and their current verification status.
    """
    mgr = RetrainingManager.get_instance()
    return mgr.list_corrections(status_filter=status_filter)

@router.post("/verify")
async def verify_correction(
    req: VerifyCorrectionRequest
):
    """
    Curator verification gate: updates status of a user correction to VERIFIED or REJECTED.
    """
    if req.status.upper() not in ["VERIFIED", "REJECTED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be either 'VERIFIED' or 'REJECTED'."
        )
    mgr = RetrainingManager.get_instance()
    res = mgr.verify_correction(
        correction_id=req.correction_id,
        new_status=req.status,
        curator_name=req.curator_name or "Admin Curator",
        verification_notes=req.notes
    )
    if not res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Correction ID not found.")
    return {"status": "success", "correction": res}

@router.post("/train")
async def trigger_retraining(
    epochs: int = Query(2, ge=1, le=10),
    lr: float = Query(1e-4, ge=1e-5, le=1e-2)
):
    """
    Executes reproducible PyTorch fine-tuning using verified corrections and benchmark data.
    Promotes new model version if validation passes.
    """
    mgr = RetrainingManager.get_instance()
    res = mgr.train_new_version(epochs=epochs, lr=lr)
    return res

@router.get("/versions")
async def get_model_versions():
    """
    Lists registered model versions, accuracy scores, and the currently active checkpoint.
    """
    mgr = RetrainingManager.get_instance()
    return mgr.list_model_versions()

@router.post("/rollback")
async def rollback_model_version(
    req: RollbackRequest
):
    """
    Performs atomic rollback of active model to any previous stable version.
    """
    mgr = RetrainingManager.get_instance()
    try:
        res = mgr.rollback_model(target_version=req.target_version)
        return res
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
