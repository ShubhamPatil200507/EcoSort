from fastapi import APIRouter, File, UploadFile, HTTPException, Query, status
from typing import Optional
from pathlib import Path

from app.config import settings
from app.ml.classifier import get_classifier
from app.recommendations.engine import get_recommendation
from app.schemas import ClassificationResult, ClassificationAndRecommendationResponse

router = APIRouter(tags=["Classification"])

SAMPLE_IMAGES_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "sample_images"

@router.post("/classify", response_model=ClassificationResult)
async def classify_waste_image(
    file: UploadFile = File(...),
    threshold: Optional[float] = Query(None, ge=0.0, le=1.0, description="Optional custom confidence threshold")
):
    # 1. Validate file extension or MIME content type
    filename = file.filename or "upload.jpg"
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    content_type = file.content_type or ""

    # Allow blobs or standard image formats
    is_valid_ext = ext in settings.ALLOWED_EXTENSIONS
    is_valid_mime = content_type.startswith("image/") or content_type == "application/octet-stream"
    is_blob = filename == "blob" or not ext

    if not (is_valid_ext or is_valid_mime or is_blob):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext or content_type}'. Allowed image formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
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
    Evaluates real sample images stored in data/sample_images.
    """
    clean_name = sample_name.replace(".jpg", "").replace(".png", "")
    sample_path = SAMPLE_IMAGES_DIR / f"{clean_name}.jpg"

    if not sample_path.exists():
        # Fallback search
        alt_path = Path("data/sample_images") / f"{clean_name}.jpg"
        if alt_path.exists():
            sample_path = alt_path
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Sample '{clean_name}' not found at {sample_path}."
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
