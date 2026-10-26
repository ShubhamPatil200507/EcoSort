from fastapi import APIRouter
import torch
from pathlib import Path
from app.config import settings
from app.schemas import HealthResponse
from app.ml.categories import CATEGORIES

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthResponse)
async def health_check():
    weights_exist = Path(settings.MODEL_WEIGHTS_PATH).exists()
    device = "cuda" if torch.cuda.is_available() else "cpu"
    
    return HealthResponse(
        status="healthy",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        model_loaded=True,
        model_architecture="MobileNetV3-Small (Fine-Tuned Transfer Learning)",
        device=device,
        supported_categories=CATEGORIES,
        total_categories=len(CATEGORIES)
    )
