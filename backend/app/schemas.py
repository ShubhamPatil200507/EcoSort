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

# --- Clarification & Agent Schemas ---

class ClarificationOptionSchema(BaseModel):
    id: str
    label: str
    description: Optional[str] = None
    target_category: Optional[str] = None
    attributes: Dict[str, Any] = Field(default_factory=dict)

class ClarificationPromptSchema(BaseModel):
    clarification_id: str
    question: str
    reason: str
    candidate_categories: List[str] = Field(default_factory=list)
    options: List[ClarificationOptionSchema] = Field(default_factory=list)
    affects_safety: bool = False

class EvidenceBreakdownSchema(BaseModel):
    image_classifier_evidence: Dict[str, Any] = Field(default_factory=dict)
    user_provided_attributes: Dict[str, Any] = Field(default_factory=dict)
    discrete_rule_conclusions: Dict[str, Any] = Field(default_factory=dict)
    external_facility_info: Dict[str, Any] = Field(default_factory=dict)

class SegregationDecisionSchema(BaseModel):
    state: str = Field(..., description="IMAGE_RECEIVED, CLASSIFYING, NEEDS_CLARIFICATION, RULE_EVALUATION, CLASSIFIED, UNRESOLVED")
    final_category: str
    display_name: str
    subtype: Optional[str] = None
    confidence: float
    is_confident: bool
    explanation: str
    reasons: List[str] = Field(default_factory=list)
    safety_warnings: List[Dict[str, str]] = Field(default_factory=list)
    preparation_steps: List[str] = Field(default_factory=list)
    disposal_route: str
    facility_types_needed: List[str] = Field(default_factory=list)
    separate_from_regular_trash: bool = True
    specialized_facility_required: bool = False
    clarification_prompt: Optional[ClarificationPromptSchema] = None
    unresolved_assumptions: List[str] = Field(default_factory=list)
    evidence_breakdown: Optional[EvidenceBreakdownSchema] = None
    mathematical_audit: Dict[str, Any] = Field(default_factory=dict)

class ClarificationResolutionRequest(BaseModel):
    clarification_id: str
    option_id: str
    predicted_category: str
    subtype: Optional[str] = None
    confidence: float = 0.90
    attributes: Dict[str, Any] = Field(default_factory=dict)
    location_available: bool = False
    user_lat: Optional[float] = None
    user_lon: Optional[float] = None

class ClassificationAndRecommendationResponse(BaseModel):
    classification: ClassificationResult
    recommendation: DisposalRecommendation
    agent_decision: Optional[SegregationDecisionSchema] = None
    discrete_math_audit: Optional[Dict[str, Any]] = None

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
