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
  formData.append('file', file);

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
