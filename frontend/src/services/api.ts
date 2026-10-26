import {
  HealthResponse,
  ClassificationResult,
  DisposalRecommendation,
  ClassificationAndRecommendation,
  NearbyCentresResponse,
  CentreRecord,
  GeocodeResult
} from '../types';

const API_BASE = '/api';

export async function checkHealth(): Promise<HealthResponse> {
  const resp = await fetch(`${API_BASE}/health`);
  if (!resp.ok) {
    throw new Error(`Health check failed with status: ${resp.status}`);
  }
  return resp.json();
}

export async function classifyAndRecommend(
  file: File | Blob,
  threshold?: number
): Promise<ClassificationAndRecommendation> {
  const formData = new FormData();
  const filename = file instanceof File ? file.name : 'camera_capture.jpg';
  formData.append('file', file, filename);

  const url = new URL(`${API_BASE}/classify-and-recommend`, window.location.origin);
  if (threshold !== undefined) {
    url.searchParams.set('threshold', threshold.toString());
  }

  const resp = await fetch(url.toString(), {
    method: 'POST',
    body: formData,
  });

  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.detail || `Classification failed (${resp.status})`);
  }

  return resp.json();
}

export async function classifySample(
  sampleName: string,
  threshold?: number
): Promise<ClassificationAndRecommendation> {
  const url = new URL(`${API_BASE}/classify/sample/${sampleName}`, window.location.origin);
  if (threshold !== undefined) {
    url.searchParams.set('threshold', threshold.toString());
  }

  const resp = await fetch(url.toString(), {
    method: 'POST',
  });

  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.detail || `Sample evaluation failed (${resp.status})`);
  }

  return resp.json();
}

export async function getDisposalRecommendation(
  category: string,
  subtype?: string
): Promise<DisposalRecommendation> {
  const resp = await fetch(`${API_BASE}/recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, subtype }),
  });
  if (!resp.ok) {
    throw new Error(`Failed to load recommendation (${resp.status})`);
  }
  return resp.json();
}

export async function resolveClarification(payload: {
  clarification_id: string;
  option_id: string;
  predicted_category: string;
  subtype?: string;
  confidence?: number;
  attributes: Record<string, any>;
  location_available?: boolean;
  user_lat?: number | null;
  user_lon?: number | null;
}): Promise<ClassificationAndRecommendation> {
  const resp = await fetch(`${API_BASE}/agent/resolve-clarification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.detail || `Clarification resolution failed (${resp.status})`);
  }
  return resp.json();
}

export async function getFullDisposalGuide(): Promise<any[]> {
  const resp = await fetch(`${API_BASE}/recommendations/guide`);
  if (!resp.ok) {
    throw new Error(`Failed to load disposal guide (${resp.status})`);
  }
  return resp.json();
}

export async function getNearbyCentres(
  lat: number,
  lon: number,
  radius: number = 15.0,
  category?: string,
  facilityType?: string
): Promise<NearbyCentresResponse> {
  const url = new URL(`${API_BASE}/centres/nearby`, window.location.origin);
  url.searchParams.set('lat', lat.toString());
  url.searchParams.set('lon', lon.toString());
  url.searchParams.set('radius', radius.toString());
  if (category && category !== 'all') {
    url.searchParams.set('category', category);
  }
  if (facilityType) {
    url.searchParams.set('facility_type', facilityType);
  }

  const resp = await fetch(url.toString());
  if (!resp.ok) {
    throw new Error(`Failed to retrieve nearby centres (${resp.status})`);
  }
  return resp.json();
}

export async function searchCentres(
  query: string,
  radius: number = 15.0,
  category?: string
): Promise<NearbyCentresResponse> {
  const url = new URL(`${API_BASE}/centres/search`, window.location.origin);
  url.searchParams.set('query', query);
  url.searchParams.set('radius', radius.toString());
  if (category && category !== 'all') {
    url.searchParams.set('category', category);
  }

  const resp = await fetch(url.toString());
  if (!resp.ok) {
    throw new Error(`Failed to search centres for "${query}" (${resp.status})`);
  }
  return resp.json();
}

export async function getAllDirectoryCentres(category?: string): Promise<CentreRecord[]> {
  const url = new URL(`${API_BASE}/centres/directory`, window.location.origin);
  if (category && category !== 'all') {
    url.searchParams.set('category', category);
  }
  const resp = await fetch(url.toString());
  if (!resp.ok) {
    throw new Error(`Failed to fetch centres directory (${resp.status})`);
  }
  return resp.json();
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeocodeResult> {
  const url = new URL(`${API_BASE}/geocoding/reverse`, window.location.origin);
  url.searchParams.set('lat', lat.toString());
  url.searchParams.set('lon', lon.toString());

  const resp = await fetch(url.toString());
  if (!resp.ok) {
    throw new Error(`Reverse geocoding failed (${resp.status})`);
  }
  return resp.json();
}

export async function searchLocation(query: string): Promise<GeocodeResult[]> {
  const url = new URL(`${API_BASE}/geocoding/search`, window.location.origin);
  url.searchParams.set('query', query);

  const resp = await fetch(url.toString());
  if (!resp.ok) {
    throw new Error(`Location search failed (${resp.status})`);
  }
  return resp.json();
}

export async function submitFeedback(
  predictedCategory: string,
  userSuggestedCategory: string,
  comments?: string
): Promise<{ status: string; message: string }> {
  const resp = await fetch(`${API_BASE}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      predicted_category: predictedCategory,
      user_suggested_category: userSuggestedCategory,
      comments: comments,
    }),
  });
  if (!resp.ok) {
    throw new Error(`Failed to submit feedback (${resp.status})`);
  }
  return resp.json();
}

// =========================================================================
// BATCH OPTIMIZATION & RESEARCH API SERVICES
// =========================================================================

export async function detectBatchObjects(
  file: File | Blob,
  detectorMode: string = 'hybrid'
): Promise<import('../types').BatchAnalysisResponse> {
  const formData = new FormData();
  const filename = file instanceof File ? file.name : 'batch_capture.jpg';
  formData.append('file', file, filename);

  const resp = await fetch(`${API_BASE}/batch/detect?detector_mode=${detectorMode}`, {
    method: 'POST',
    body: formData,
  });
  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.detail || `Batch detection failed (${resp.status})`);
  }
  return resp.json();
}

export async function optimizeBatchAssignments(payload: {
  session_id?: string;
  items: import('../types').DetectedWasteItem[];
  capacity_limits?: Record<string, number>;
  enforce_incompatibilities?: boolean;
}): Promise<import('../types').BatchOptimizationResponse> {
  const resp = await fetch(`${API_BASE}/batch/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      enforce_incompatibilities: true,
      ...payload,
    }),
  });
  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.detail || `Batch optimization failed (${resp.status})`);
  }
  return resp.json();
}

export async function evaluateClarification(
  items: import('../types').DetectedWasteItem[],
  strategy: string = 'decision_aware'
): Promise<import('../types').ClarificationComparisonResult> {
  const resp = await fetch(`${API_BASE}/batch/clarify?strategy=${strategy}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.detail || `Clarification evaluation failed (${resp.status})`);
  }
  return resp.json();
}

export async function planCollectionRoute(
  activeStreams: string[],
  userLat: number,
  userLon: number
): Promise<import('../types').MultiStopCollectionPlan> {
  const resp = await fetch(`${API_BASE}/batch/route-plan?user_lat=${userLat}&user_lon=${userLon}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ active_streams: activeStreams }),
  });
  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.detail || `Route planning failed (${resp.status})`);
  }
  return resp.json();
}

export async function recordAuditLog(payload: Record<string, any>): Promise<any> {
  const resp = await fetch(`${API_BASE}/batch/audit-log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return resp.json();
}

// =========================================================================
// MODEL GOVERNANCE & VERIFIED RETRAINING SERVICES
// =========================================================================

export async function getModelVersions(): Promise<{ active_version: string; versions: any[] }> {
  const resp = await fetch(`${API_BASE}/retraining/versions`);
  if (!resp.ok) {
    throw new Error(`Failed to load model registry (${resp.status})`);
  }
  return resp.json();
}

export async function getCorrections(statusFilter?: string): Promise<any[]> {
  const url = statusFilter
    ? `${API_BASE}/retraining/corrections?status_filter=${statusFilter}`
    : `${API_BASE}/retraining/corrections`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to load corrections (${resp.status})`);
  }
  return resp.json();
}

export async function verifyCorrection(
  correctionId: string,
  newStatus: 'VERIFIED' | 'REJECTED',
  notes?: string
): Promise<any> {
  const resp = await fetch(`${API_BASE}/retraining/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      correction_id: correctionId,
      status: newStatus,
      notes,
    }),
  });
  if (!resp.ok) {
    throw new Error(`Failed to verify correction (${resp.status})`);
  }
  return resp.json();
}

export async function triggerModelRetraining(epochs: number = 2, lr: number = 0.0001): Promise<any> {
  const resp = await fetch(`${API_BASE}/retraining/train?epochs=${epochs}&lr=${lr}`, {
    method: 'POST',
  });
  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.detail || `Retraining failed (${resp.status})`);
  }
  return resp.json();
}

export async function rollbackModelVersion(targetVersion: string): Promise<any> {
  const resp = await fetch(`${API_BASE}/retraining/rollback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_version: targetVersion }),
  });
  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.detail || `Rollback failed (${resp.status})`);
  }
  return resp.json();
}


