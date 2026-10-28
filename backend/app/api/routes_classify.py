import re
from fastapi import APIRouter, File, UploadFile, HTTPException, Query, status
from typing import Optional, Dict, Any
from pathlib import Path

from app.config import settings
from app.utils.security import validate_image_bytes, sanitize_safe_name
from app.ml.classifier import get_classifier
from app.recommendations.engine import get_recommendation
from app.agent.segregation_agent import get_segregation_agent, SegregationDecision, AgentState
from app.schemas import (
    ClassificationResult,
    ClassificationAndRecommendationResponse,
    ClarificationResolutionRequest,
    SegregationDecisionSchema
)

router = APIRouter(tags=["Classification"])

SAMPLE_IMAGES_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "sample_images"

@router.post("/classify", response_model=ClassificationResult)
async def classify_waste_image(
    file: UploadFile = File(...),
    threshold: Optional[float] = Query(None, ge=0.0, le=1.0, description="Optional custom confidence threshold")
):
    filename = file.filename or "upload.jpg"
    contents = await file.read()

    # Multi-stage validation: size, magic bytes signature, PIL format integrity, dimensions
    validate_image_bytes(contents, filename)

    classifier = get_classifier()
    result = classifier.classify_image(contents, threshold=threshold)
    return result

@router.post("/classify-and-recommend", response_model=ClassificationAndRecommendationResponse)
async def classify_and_recommend(
    file: UploadFile = File(...),
    threshold: Optional[float] = Query(None, ge=0.0, le=1.0),
    user_lat: Optional[float] = Query(None, ge=-90.0, le=90.0, description="Latitude bounded between -90 and +90"),
    user_lon: Optional[float] = Query(None, ge=-180.0, le=180.0, description="Longitude bounded between -180 and +180")
):
    classification = await classify_waste_image(file=file, threshold=threshold)
    recommendation = get_recommendation(
        category=classification.predicted_category,
        subtype=classification.subtype
    )

    # Run Autonomous Segregation Agent & Discrete Mathematics Engine
    agent = get_segregation_agent()
    decision = agent.process(
        classification=classification,
        location_available=(user_lat is not None and user_lon is not None),
        user_lat=user_lat,
        user_lon=user_lon
    )

    return ClassificationAndRecommendationResponse(
        classification=classification,
        recommendation=recommendation,
        agent_decision=decision.model_dump(),
        discrete_math_audit=decision.mathematical_audit
    )

@router.post("/classify/sample/{sample_name}", response_model=ClassificationAndRecommendationResponse)
async def classify_sample_image(
    sample_name: str,
    threshold: Optional[float] = Query(None, ge=0.0, le=1.0),
    user_lat: Optional[float] = Query(None, ge=-90.0, le=90.0),
    user_lon: Optional[float] = Query(None, ge=-180.0, le=180.0)
):
    """
    Convenient endpoint for 1-click test gallery in frontend.
    Evaluates real sample images stored in data/sample_images.
    Includes strict path traversal prevention.
    """
    safe_base = sanitize_safe_name(sample_name)
    clean_name = safe_base.replace(".jpg", "").replace(".png", "").replace(".webp", "")

    # Restrict to strictly alphanumeric, hyphen, underscore
    if not re.match(r"^[a-zA-Z0-9_\-]+$", clean_name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid sample image name format. Only alphanumeric characters, hyphens, and underscores are allowed."
        )

    base_dir = SAMPLE_IMAGES_DIR.resolve()
    sample_path = (SAMPLE_IMAGES_DIR / f"{clean_name}.jpg").resolve()

    # Enforce that resolved path cannot escape base_dir
    try:
        sample_path.relative_to(base_dir)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Path traversal attempt blocked."
        )

    if not sample_path.exists():
        # Fallback search within local repository data directory
        alt_base = Path("data/sample_images").resolve()
        alt_path = (alt_base / f"{clean_name}.jpg").resolve()
        if alt_path.exists() and alt_path.is_file():
            try:
                alt_path.relative_to(alt_base)
                sample_path = alt_path
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Path traversal attempt blocked."
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Sample '{clean_name}' not found."
            )

    with open(sample_path, "rb") as f:
        contents = f.read()

    classifier = get_classifier()
    classification = classifier.classify_image(contents, threshold=threshold)
    recommendation = get_recommendation(
        category=classification.predicted_category,
        subtype=classification.subtype
    )

    # Run Autonomous Segregation Agent & Discrete Mathematics Engine
    agent = get_segregation_agent()
    decision = agent.process(
        classification=classification,
        location_available=(user_lat is not None and user_lon is not None),
        user_lat=user_lat,
        user_lon=user_lon
    )

    return ClassificationAndRecommendationResponse(
        classification=classification,
        recommendation=recommendation,
        agent_decision=decision.model_dump(),
        discrete_math_audit=decision.mathematical_audit
    )

@router.post("/agent/resolve-clarification", response_model=ClassificationAndRecommendationResponse)
async def resolve_clarification(request: ClarificationResolutionRequest):
    """
    Resolves an ambiguous classification by consuming the user's targeted answer.
    Transitions agent state from NEEDS_CLARIFICATION to CLASSIFIED.
    """
    # Synthesize classification result with clarified attributes
    agent = get_segregation_agent()

    # Determine resolved category
    resolved_category = request.attributes.get("override_category") or request.predicted_category

    # Build dummy or existing classification
    classification = ClassificationResult(
        status="success",
        predicted_category=resolved_category,
        display_name=resolved_category.replace("_", " ").title(),
        subtype=request.subtype,
        confidence=request.confidence,
        threshold=0.50,
        is_confident=True,
        explanation=f"Clarification resolved: {resolved_category.replace('_', ' ').title()} based on user confirmation.",
        inference_time_ms=5.0
    )

    recommendation = get_recommendation(
        category=resolved_category,
        subtype=request.subtype
    )

    # Process through agent with resolved attributes
    user_attrs = request.attributes.copy()
    user_attrs["_clarification_resolved"] = True

    decision = agent.process(
        classification=classification,
        user_attributes=user_attrs,
        location_available=request.location_available,
        user_lat=request.user_lat,
        user_lon=request.user_lon
    )

    return ClassificationAndRecommendationResponse(
        classification=classification,
        recommendation=recommendation,
        agent_decision=decision.model_dump(),
        discrete_math_audit=decision.mathematical_audit
    )
