from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any

class AlternativePrediction(BaseModel):
    category: str
    display_name: str
    confidence: float
    percentage: str

class DetectedObject(BaseModel):
    category: str
    display_name: str
    subtype: Optional[str] = None
    confidence: float
    region_name: str  # 'center', 'left', 'right', 'top', 'bottom', 'full'
    label: Optional[str] = None
    bounding_box: Optional[Dict[str, float]] = None

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
    is_multi_object: bool = False
    detected_objects: List[DetectedObject] = []
    secondary_category: Optional[str] = None
    multi_object_summary: Optional[str] = None

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
    is_multi_object: bool = False
    detected_objects: List[DetectedObject] = []
    separation_instructions: Optional[str] = None

class ClarificationResolutionRequest(BaseModel):
    clarification_id: str
    option_id: str
    predicted_category: str
    subtype: Optional[str] = None
    confidence: float = 0.90
    attributes: Dict[str, Any] = Field(default_factory=dict)
    location_available: bool = False
    user_lat: Optional[float] = Field(None, ge=-90.0, le=90.0)
    user_lon: Optional[float] = Field(None, ge=-180.0, le=180.0)

class ClassificationAndRecommendationResponse(BaseModel):
    classification: ClassificationResult
    recommendation: DisposalRecommendation
    agent_decision: Optional[SegregationDecisionSchema] = None
    discrete_math_audit: Optional[Dict[str, Any]] = None

class CentreRecord(BaseModel):
    id: str
    facility_id: Optional[str] = None
    name: str
    facility_type: str
    address: str
    full_address: Optional[str] = None
    city: str
    pin_code: Optional[str] = None
    latitude: float
    longitude: float
    coordinates_source: Optional[str] = "OpenStreetMap / Municipal GeoJSON"
    distance_km: Optional[float] = None
    distance_text: Optional[str] = None
    accepted_categories: List[str]
    accepted_subtypes: Optional[List[str]] = []
    authorisation_status: Optional[str] = None
    authorisation_source: Optional[str] = None
    expiry_date: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    source_url: Optional[str] = None
    last_verified_date: Optional[str] = None
    data_status: Optional[str] = "verified"
    verification_status: str
    verification_notes: str
    operating_hours: Optional[str] = None
    source: str
    directions_url: Optional[str] = None

    def model_post_init(self, __context: Any) -> None:
        if not self.facility_id:
            self.facility_id = self.id
        if not self.full_address:
            self.full_address = self.address

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
    session_id: Optional[str] = None
    item_id: Optional[str] = None
    image_base64: Optional[str] = None
    auto_retrain: bool = True

class LLMConsensusCorrectionResponse(BaseModel):
    status: str
    correction_id: str
    predicted_category: str
    user_category: str
    llm_category: str
    llm_subtype: Optional[str] = None
    consensus: bool
    verification_status: str
    confidence: float
    llm_reasoning: str
    statutory_citation: Optional[str] = None
    llm_provider: str
    retraining_triggered: bool
    retraining_result: Optional[Dict[str, Any]] = None
    message: str

# =========================================================================
# RESEARCH UPGRADE SCHEMAS: Multi-Object, MILP Optimizer, & Clarification
# =========================================================================

class DetectedWasteItem(BaseModel):
    item_id: str
    bounding_box: Dict[str, float] = Field(..., description="Normalized {x, y, w, h} in [0, 1]")
    thumbnail: Optional[str] = None
    predicted_category: str
    predicted_subtype: Optional[str] = None
    display_name: str
    confidence: float
    calibrated_probabilities: Dict[str, float] = Field(default_factory=dict)
    entropy: float = 0.0
    alternatives: List[AlternativePrediction] = Field(default_factory=list)
    material_attributes: Dict[str, Any] = Field(default_factory=dict)
    status: str = Field(default="detected", description="detected, uncertain, user_corrected, needs_review")
    user_corrected_category: Optional[str] = None

class BatchAnalysisResponse(BaseModel):
    session_id: str
    status: str
    item_count: int
    items: List[DetectedWasteItem]
    is_multi_object: bool
    processing_time_ms: float
    image_metadata: Dict[str, Any] = Field(default_factory=dict)

class RuleDefinitionSchema(BaseModel):
    rule_id: str
    version: str
    category: str
    permitted_streams: List[str]
    prohibited_combinations: List[str]
    required_warnings: List[Dict[str, str]]
    jurisdiction: str
    effective_date: str
    verification_status: str
    source: str

class ItemRuleEvaluationSchema(BaseModel):
    item_id: str
    eligible_streams: List[str]
    ineligible_streams: List[str]
    rules_applied: List[str]
    constraints_passed: List[str]
    constraints_failed: List[str]
    warnings: List[Dict[str, str]]
    requires_manual_review: bool
    review_reason: Optional[str] = None

class OptimizerItemAssignment(BaseModel):
    item_id: str
    original_category: str
    assigned_stream: Optional[str] = None
    is_sent_for_review: bool = False
    review_reason: Optional[str] = None
    assignment_score: float = 0.0
    confidence: float = 0.0
    rule_ids: List[str] = Field(default_factory=list)

class BatchOptimizationRequest(BaseModel):
    session_id: Optional[str] = None
    items: List[DetectedWasteItem]
    enforce_incompatibilities: bool = True
    capacity_limits: Optional[Dict[str, int]] = None
    review_penalty: float = 2.0
    stream_deployment_cost: float = 0.5

class BatchOptimizationResponse(BaseModel):
    status: str = Field(..., description="optimal, feasible, infeasible, degenerate_trivial")
    objective_value: float
    objective_definition: str
    solve_time_ms: float
    assignments: List[OptimizerItemAssignment]
    active_streams: List[str]
    items_for_review: List[str]
    rejected_assignments: List[Dict[str, Any]]
    active_constraints: List[str]
    is_degenerate: bool
    decision_explanation: Dict[str, Any]
    before_after_comparison: Dict[str, Any]

class ClarificationQuestionCandidate(BaseModel):
    item_id: str
    question: str
    strategy: str
    priority_score: float
    confidence: float
    entropy: float
    expected_decision_improvement: float
    plausible_categories: List[str]
    options: List[ClarificationOptionSchema]
    reason: str
    thumbnail: Optional[str] = None

class ClarificationComparisonResult(BaseModel):
    selected_strategy: str
    question: Optional[ClarificationQuestionCandidate] = None
    strategy_rankings: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict)
    comparative_notes: str

class RouteStop(BaseModel):
    stop_order: int
    facility_id: str
    facility_name: str
    waste_streams_delivered: List[str]
    address: str
    latitude: float
    longitude: float
    leg_distance_km: float
    distance_type: str = "straight_line_haversine_estimate"

class MultiStopCollectionPlan(BaseModel):
    total_stops: int
    total_distance_km: float
    distance_type: str = "straight_line_haversine_estimate"
    unserviced_streams: List[str] = Field(default_factory=list)
    stops: List[RouteStop] = Field(default_factory=list)
    route_algorithm: str = "exact_tsp_branch_and_bound"
    verification_notes: str

class AuditLogEntryRequest(BaseModel):
    session_id: Optional[str] = "session_unknown"
    item_id: Optional[str] = None
    original_category: Optional[str] = "unknown"
    corrected_category: Optional[str] = None
    new_category: Optional[str] = None
    user_context: Optional[str] = None
    model_config = ConfigDict(extra="allow")

class AuditLogEntryResponse(BaseModel):
    status: str
    audit_id: str
    total_records: int

