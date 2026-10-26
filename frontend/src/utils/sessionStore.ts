import { StoredSessionRecord } from '../types';

const STORAGE_KEY = 'ecosort_analysis_sessions';

export function getStoredSessions(): StoredSessionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Automatically clean up any legacy single-bottle scans from past records
      const filtered = parsed.filter((s: StoredSessionRecord) => {
        const preview = (s.previewUrl || '').toLowerCase();
        return !preview.includes('plastic.jpg') && !preview.includes('bottle');
      });
      if (filtered.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      }
      return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return [];
  } catch (e) {
    console.warn('Failed to parse stored sessions from localStorage:', e);
    return [];
  }
}

export function saveStoredSession(session: StoredSessionRecord): void {
  try {
    const existing = getStoredSessions();
    const filtered = existing.filter((s) => s.sessionId !== session.sessionId);
    const updated = [session, ...filtered].slice(0, 50); // Keep max 50
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save session to localStorage:', e);
  }
}

export function getStoredSessionById(sessionId: string): StoredSessionRecord | null {
  const sessions = getStoredSessions();
  return sessions.find((s) => s.sessionId === sessionId) || null;
}

export function deleteStoredSession(sessionId: string): void {
  try {
    const existing = getStoredSessions();
    const updated = existing.filter((s) => s.sessionId !== sessionId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to delete session from localStorage:', e);
  }
}

export function clearAllStoredSessions(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear sessions from localStorage:', e);
  }
}

export interface SessionAggregatedStats {
  totalSessions: number;
  totalItemsDetected: number;
  totalItemsReviewed: number;
  totalItemsClarified: number;
  feasibleRatePct: number;
  distinctStreamsEncountered: string[];
}

export function getAggregatedSessionStats(): SessionAggregatedStats {
  const sessions = getStoredSessions();
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalItemsDetected: 0,
      totalItemsReviewed: 0,
      totalItemsClarified: 0,
      feasibleRatePct: 100,
      distinctStreamsEncountered: [],
    };
  }

  let totalItems = 0;
  let totalReviewed = 0;
  let totalClarified = 0;
  let feasibleCount = 0;
  const streamSet = new Set<string>();

  for (const s of sessions) {
    totalItems += s.itemCount || 0;
    totalReviewed += s.reviewedCount || 0;
    totalClarified += s.unresolvedCount || 0;
    if (s.isFeasible) feasibleCount++;
    (s.activeStreams || []).forEach((str) => streamSet.add(str));
  }

  const feasibleRate = sessions.length > 0 ? (feasibleCount / sessions.length) * 100 : 100;

  return {
    totalSessions: sessions.length,
    totalItemsDetected: totalItems,
    totalItemsReviewed: totalReviewed,
    totalItemsClarified: totalClarified,
    feasibleRatePct: Math.round(feasibleRate),
    distinctStreamsEncountered: Array.from(streamSet),
  };
}
