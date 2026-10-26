from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from app.schemas import DisposalRecommendation
from app.recommendations.engine import get_recommendation, DISPOSAL_RULES
from app.ml.categories import CATEGORIES, CATEGORY_METADATA

router = APIRouter(tags=["Recommendations"])

class RecommendationRequest(BaseModel):
    category: str
    subtype: Optional[str] = None

@router.post("/recommendations", response_model=DisposalRecommendation)
async def generate_disposal_recommendations(req: RecommendationRequest):
    return get_recommendation(category=req.category, subtype=req.subtype)

@router.get("/recommendations/guide")
async def get_full_disposal_guide() -> List[Dict[str, Any]]:
    """
    Returns the comprehensive disposal guide for all supported waste streams.
    Used by the frontend Disposal Guide tab.
    """
    guide = []
    for cat in CATEGORIES:
        rec = get_recommendation(cat)
        meta = CATEGORY_METADATA.get(cat, {})
        guide.append({
            "category": cat,
            "display_name": rec.display_name,
            "subtypes": meta.get("subtypes", []),
            "color": meta.get("color", "#15803d"),
            "icon": meta.get("icon", "Trash2"),
            "primary_action": rec.primary_action,
            "recommended_disposal_route": rec.recommended_disposal_route,
            "preparation_steps": rec.preparation_steps,
            "safety_precautions": rec.safety_precautions,
            "separate_from_regular_trash": rec.separate_from_regular_trash,
            "specialized_facility_required": rec.specialized_facility_required,
            "facility_types_needed": rec.facility_types_needed,
            "environmental_impact": rec.environmental_impact,
            "disclaimer": rec.disclaimer,
            "uncertainty_note": meta.get("uncertainty_note")
        })
    return guide
