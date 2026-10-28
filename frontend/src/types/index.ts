export interface AlternativePrediction {
  category: string;
  display_name: string;
  confidence: number;
  percentage: string;
}

export interface DetectedObject {
  category: string;
  display_name: string;
  subtype?: string;
  confidence: number;
  region_name: string;
  label?: string;
  bounding_box?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface ClassificationResult {
  status: 'success' | 'low_confidence' | 'unclear_image' | 'error';
  predicted_category: string;
  display_name: string;
  subtype?: string;
  confidence: number;
  threshold: number;
  is_confident: boolean;
  explanation: string;
  visual_uncertainty_note?: string;
  alternative_predictions: AlternativePrediction[];
  inference_time_ms: number;
  image_metadata?: {
    width: number;
    height: number;
    format: string;
  };
  is_multi_object?: boolean;
  detected_objects?: DetectedObject[];
  secondary_category?: string;
  multi_object_summary?: string;
}

export interface DisposalRecommendation {
  category: string;
  display_name: string;
  subtype?: string;
  primary_action: string;
  recommended_disposal_route: string;
  preparation_steps: string[];
  safety_precautions: string[];
  separate_from_regular_trash: boolean;
  specialized_facility_required: boolean;
  facility_types_needed: string[];
  environmental_impact: string;
  disclaimer: string;
}

// --- Agent & Discrete Mathematics Types ---

export type AgentState =
  | 'IMAGE_RECEIVED'
  | 'CLASSIFYING'
  | 'NEEDS_CLARIFICATION'
  | 'RULE_EVALUATION'
  | 'CLASSIFIED'
  | 'UNRESOLVED';

export interface ClarificationOption {
  id: string;
  label: string;
  description?: string;
  target_category?: string;
  attributes: Record<string, any>;
}

export interface ClarificationPrompt {
  clarification_id: string;
  question: string;
  reason: string;
  candidate_categories: string[];
  options: ClarificationOption[];
  affects_safety: boolean;
}

export interface EvidenceBreakdown {
  image_classifier_evidence: Record<string, any>;
  user_provided_attributes: Record<string, any>;
  discrete_rule_conclusions: Record<string, any>;
  external_facility_info: Record<string, any>;
}

export interface SegregationDecision {
  state: AgentState;
  final_category: string;
  display_name: string;
  subtype?: string;
  confidence: number;
  is_confident: boolean;
  explanation: string;
  reasons: string[];
  safety_warnings: Array<{ rule_id: string; severity: string; warning: string }>;
  preparation_steps: string[];
  disposal_route: string;
  facility_types_needed: string[];
  separate_from_regular_trash: boolean;
  specialized_facility_required: boolean;
  clarification_prompt?: ClarificationPrompt | null;
  unresolved_assumptions: string[];
  evidence_breakdown?: EvidenceBreakdown;
  mathematical_audit?: Record<string, any>;
  is_multi_object?: boolean;
  detected_objects?: DetectedObject[];
  separation_instructions?: string;
}

export interface ClassificationAndRecommendation {
  classification: ClassificationResult;
  recommendation: DisposalRecommendation;
  agent_decision?: SegregationDecision;
  discrete_math_audit?: Record<string, any>;
}

export type VerificationStatus =
  | 'OFFICIALLY_VERIFIED'
  | 'THIRD_PARTY_DIRECTORY'
  | 'GENERAL_SCRAP_UNVERIFIED'
  | 'DEMO_DOCUMENTED_SAMPLE';

export interface CentreRecord {
  id: string;
  facility_id?: string;
  name: string;
  facility_type: string;
  address: string;
  full_address?: string;
  city: string;
  pin_code?: string;
  latitude: number;
  longitude: number;
  coordinates_source?: string;
  distance_km?: number;
  distance_text?: string;
  accepted_categories: string[];
  accepted_subtypes?: string[];
  authorisation_status?: string;
  authorisation_source?: string;
  expiry_date?: string;
  phone?: string;
  email?: string;
  website?: string;
  source_url?: string;
  last_verified_date?: string;
  data_status?: 'verified' | 'partially_verified' | 'stale' | 'unverified';
  verification_status: VerificationStatus;
  verification_notes: string;
  operating_hours?: string;
  source: string;
  directions_url?: string;
}

export interface NearbyCentresResponse {
  query_lat: number;
  query_lon: number;
  radius_km: number;
  waste_category?: string;
  facility_type_filter?: string;
  total_found: number;
  centres: CentreRecord[];
  provider_used: string;
  is_demo: boolean;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formatted_address: string;
  city?: string;
  state?: string;
  pin_code?: string;
  country?: string;
}

export interface HealthResponse {
  status: string;
  app_name: string;
  version: string;
  model_loaded: boolean;
  model_architecture: string;
  device: string;
  supported_categories: string[];
  total_categories: number;
}

export interface LocationState {
  latitude: number | null;
  longitude: number | null;
  formatted_address: string;
  city: string;
  pin_code?: string;
  accuracy?: number;
  isLoaded: boolean;
  source: 'gps' | 'manual' | 'default' | 'none';
  error?: string;
}

export type NavTab = 'scan' | 'batch' | 'guide' | 'centres' | 'model';

// --- Batch Optimization & Multi-Object Types ---

export interface DetectedWasteItem {
  item_id: string;
  bounding_box: { x: number; y: number; w: number; h: number };
  thumbnail?: string;
  predicted_category: string;
  predicted_subtype?: string;
  display_name: string;
  confidence: number;
  calibrated_probabilities: Record<string, number>;
  entropy: number;
  alternatives: AlternativePrediction[];
  material_attributes: Record<string, any>;
  status: string;
  user_corrected_category?: string;
  candidate_streams?: string[];
  rule_validation_status?: string;
}

export interface BatchAnalysisResponse {
  session_id: string;
  status: string;
  item_count: number;
  items: DetectedWasteItem[];
  is_multi_object: boolean;
  processing_time_ms: number;
  image_metadata: Record<string, any>;
}

export interface OptimizerItemAssignment {
  item_id: string;
  original_category: string;
  assigned_stream?: string;
  is_sent_for_review: boolean;
  review_reason?: string;
  assignment_score: number;
  confidence: number;
  rule_ids: string[];
}

export interface BatchOptimizationResponse {
  status: string;
  objective_value: number;
  objective_definition: string;
  solve_time_ms: number;
  assignments: OptimizerItemAssignment[];
  active_streams: string[];
  items_for_review: string[];
  rejected_assignments: Array<{ item_id: string; stream: string; reason: string }>;
  active_constraints: string[];
  is_degenerate: boolean;
  decision_explanation: Record<string, any>;
  before_after_comparison: Record<string, any>;
}

export interface ClarificationQuestionCandidate {
  item_id: string;
  question: string;
  strategy: string;
  priority_score: number;
  confidence: number;
  entropy: number;
  expected_decision_improvement: number;
  plausible_categories: string[];
  options: ClarificationOption[];
  reason: string;
  thumbnail?: string;
}

export interface ClarificationComparisonResult {
  selected_strategy: string;
  question?: ClarificationQuestionCandidate | null;
  strategy_rankings: Record<string, any[]>;
  comparative_notes: string;
}

export interface RouteStop {
  stop_order: number;
  facility_id: string;
  facility_name: string;
  waste_streams_delivered: string[];
  address: string;
  latitude: number;
  longitude: number;
  leg_distance_km: number;
  distance_type: string;
}

export interface MultiStopCollectionPlan {
  total_stops: number;
  total_distance_km: number;
  distance_type: string;
  unserviced_streams: string[];
  stops: RouteStop[];
  route_algorithm: string;
  verification_notes: string;
}

export type AppView =
  | 'landing'
  | 'how-it-works'
  | 'about'
  | 'overview'
  | 'analysis'
  | 'history'
  | 'centres'
  | 'settings';

export type AnalysisStep =
  | 'upload'
  | 'progress'
  | 'review'
  | 'clarification'
  | 'optimization'
  | 'collection'
  | 'results';

export interface StoredSessionRecord {
  sessionId: string;
  createdAt: string;
  previewUrl?: string;
  itemCount: number;
  reviewedCount: number;
  unresolvedCount: number;
  detectedCategories: string[];
  primaryStream?: string;
  solverStatus?: string;
  isFeasible: boolean;
  activeStreams: string[];
  items: DetectedWasteItem[];
  optimizationResult?: BatchOptimizationResponse | null;
  collectionPlan?: MultiStopCollectionPlan | null;
}

export interface RuleDefinition {
  rule_id: string;
  version: string;
  category: string;
  permitted_streams: string[];
  prohibited_combinations: string[];
  required_warnings: string[];
  jurisdiction: string;
  effective_date: string;
  verification_status: string;
  source: string;
}


