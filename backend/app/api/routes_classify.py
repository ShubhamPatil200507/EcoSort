from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Query, status
from typing import Optional
from pathlib import Path

from app.config import settings
from app.ml.classifier import get_classifier
from app.recommendations.engine import get_recommendation
from app.schemas import ClassificationResult, ClassificationAndRecommendationResponse

router = APIRouter(tags=["Classification"])

@router.post("/classify", response_model=ClassificationResult)
async def classify_waste_image(
    file: UploadFile = File(...),
    threshold: Optional[float] = Query(None, ge=0.0, le=1.0, description="Optional custom confidence threshold")
):
    # 1. Validate file extension
    filename = file.filename or "upload.jpg"
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # 2. Read and enforce size limits
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    if len(contents) > settings.MAX_UPLOAD_SIZE_BYTES:
        max_mb = settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {max_mb} MB."
        )

    classifier = get_classifier()
    result = classifier.classify_image(contents, threshold=threshold)
    return result

@router.post("/classify-and-recommend", response_model=ClassificationAndRecommendationResponse)
async def classify_and_recommend(
    file: UploadFile = File(...),
    threshold: Optional[float] = Query(None, ge=0.0, le=1.0)
):
    classification = await classify_waste_image(file=file, threshold=threshold)
    recommendation = get_recommendation(
        category=classification.predicted_category,
        subtype=classification.subtype
    )
    return ClassificationAndRecommendationResponse(
        classification=classification,
        recommendation=recommendation
    )

@router.post("/classify/sample/{sample_name}", response_model=ClassificationAndRecommendationResponse)
async def classify_sample_image(
    sample_name: str,
    threshold: Optional[float] = Query(None, ge=0.0, le=1.0)
):
    """
    Convenient endpoint for 1-click test gallery in frontend.
    Evaluates real sample images stored in backend/data/sample_images.
    """
    sample_path = Path("backend/data/sample_images") / f"{sample_name}.jpg"
    if not sample_path.exists():
        # Try without extension
        sample_path = Path("backend/data/sample_images") / sample_name
        if not sample_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Sample '{sample_name}' not found."
            )

    with open(sample_path, "rb") as f:
        contents = f.read()

    classifier = get_classifier()
    classification = classifier.classify_image(contents, threshold=threshold)
    recommendation = get_recommendation(
        category=classification.predicted_category,
        subtype=classification.subtype
    )
    return ClassificationAndRecommendationResponse(
        classification=classification,
        recommendation=recommendation
    )
