from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class AlternativePrediction(BaseModel):
    category: str
    display_name: str
    confidence: float
    percentage: str

class ClassificationResult(BaseModel):
    status: str = Field(..., description="success, low_confidence, unclear_image, or error")
    predicted_category: str
    display_name: str
    subtype: Optional[str] = None
    confidence: float = Field(..., ge=0.0, le=1.0)
    threshold: float
    is_confident: bool
    explanation: str
    visual_uncertainty_note: Optional[str] = None
    alternative_predictions: List[AlternativePrediction] = []
    inference_time_ms: float
    image_metadata: Optional[Dict[str, Any]] = None

class DisposalRecommendation(BaseModel):
    category: str
    display_name: str
    subtype: Optional[str] = None
    primary_action: str
    recommended_disposal_route: str
    preparation_steps: List[str]
    safety_precautions: List[str]
    separate_from_regular_trash: bool
    specialized_facility_required: bool
    facility_types_needed: List[str]
    environmental_impact: str
    disclaimer: str

class ClassificationAndRecommendationResponse(BaseModel):
    classification: ClassificationResult
    recommendation: DisposalRecommendation

class CentreRecord(BaseModel):
    id: str
    name: str
    facility_type: str
    address: str
    city: str
    pin_code: Optional[str] = None
    latitude: float
    longitude: float
    distance_km: Optional[float] = None
    distance_text: Optional[str] = None
    accepted_categories: List[str]
    accepted_subtypes: Optional[List[str]] = []
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    verification_status: str
    verification_notes: str
    operating_hours: Optional[str] = None
    source: str
    directions_url: Optional[str] = None

class NearbyCentresResponse(BaseModel):
    query_lat: float
    query_lon: float
    radius_km: float
    waste_category: Optional[str] = None
    facility_type_filter: Optional[str] = None
    total_found: int
    centres: List[CentreRecord]
    provider_used: str
    is_demo: bool

class GeocodeResult(BaseModel):
    latitude: float
    longitude: float
    formatted_address: str
    city: Optional[str] = None
    state: Optional[str] = None
    pin_code: Optional[str] = None
    country: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    model_loaded: bool
    model_architecture: str
    device: str
    supported_categories: List[str]
    total_categories: int

class FeedbackRequest(BaseModel):
    predicted_category: str
    user_suggested_category: str
    comments: Optional[str] = None
    image_reference: Optional[str] = None
