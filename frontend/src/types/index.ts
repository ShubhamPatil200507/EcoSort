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
  name: string;
  facility_type: string;
  address: string;
  city: string;
  pin_code?: string;
  latitude: number;
  longitude: number;
  distance_km?: number;
  distance_text?: string;
  accepted_categories: string[];
  accepted_subtypes?: string[];
  phone?: string;
  email?: string;
  website?: string;
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
  isLoaded: boolean;
  source: 'gps' | 'manual' | 'default' | 'none';
  error?: string;
}

export type NavTab = 'scan' | 'guide' | 'centres' | 'model';
