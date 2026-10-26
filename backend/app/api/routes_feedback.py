from fastapi import APIRouter
from typing import Dict, Any
import logging
from app.schemas import FeedbackRequest

logger = logging.getLogger("ecosort.feedback")

router = APIRouter(tags=["Feedback"])

FEEDBACK_LOGS = []

@router.post("/feedback")
async def submit_prediction_feedback(feedback: FeedbackRequest) -> Dict[str, Any]:
    """
    Collects user feedback for classification refinement and active learning audit.
    """
    entry = {
        "predicted_category": feedback.predicted_category,
        "user_suggested_category": feedback.user_suggested_category,
        "comments": feedback.comments,
        "timestamp": None
    }
    FEEDBACK_LOGS.append(entry)
    logger.info(f"Received feedback: Predicted={feedback.predicted_category}, User={feedback.user_suggested_category}")
    return {
        "status": "success",
        "message": "Thank you for contributing to EcoSort accuracy! Your feedback helps calibrate our classification models."
    }
