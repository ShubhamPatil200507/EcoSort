from fastapi import APIRouter
from typing import Dict, Any
import base64
import logging
from app.schemas import FeedbackRequest, LLMConsensusCorrectionResponse
from app.ml.retraining import RetrainingManager

logger = logging.getLogger("ecosort.feedback")

router = APIRouter(tags=["Feedback"])

FEEDBACK_LOGS = []

@router.post("/feedback", response_model=LLMConsensusCorrectionResponse)
async def submit_prediction_feedback(feedback: FeedbackRequest) -> Dict[str, Any]:
    """
    Collects user feedback for an inaccurate prediction, executes autonomous LLM
    consensus verification against statutory standards, and automatically retrains
    the PyTorch model if consensus is achieved.
    """
    img_bytes = None
    if feedback.image_base64:
        try:
            b64_data = feedback.image_base64
            if "," in b64_data:
                b64_data = b64_data.split(",")[1]
            img_bytes = base64.b64decode(b64_data)
        except Exception:
            pass

    mgr = RetrainingManager.get_instance()
    result = mgr.process_correction_with_llm(
        predicted_category=feedback.predicted_category,
        user_suggested_category=feedback.user_suggested_category,
        user_notes=feedback.comments or "",
        image_bytes=img_bytes,
        session_id=feedback.session_id,
        auto_retrain=feedback.auto_retrain
    )

    FEEDBACK_LOGS.append(result)
    logger.info(
        f"Processed feedback with LLM: Predicted={feedback.predicted_category}, "
        f"User={feedback.user_suggested_category}, LLM={result['llm_category']}, "
        f"Consensus={result['consensus']}, Retrained={result['retraining_triggered']}"
    )

    return result
