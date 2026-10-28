import React, { useState, useEffect } from 'react';
import {
  History, Search, Trash2, ExternalLink, Calendar,
  Layers, ArrowRight, Download, Filter, RefreshCw
} from 'lucide-react';
import { StoredSessionRecord, AppView } from '../../types';
import { getStoredSessions, deleteStoredSession, clearAllStoredSessions } from '../../utils/sessionStore';
import { getAuditHistory } from '../../services/api';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';

interface AnalysisHistoryViewProps {
  onOpenSession: (session: StoredSessionRecord) => void;
  onNavigateNew: () => void;
}

export const AnalysisHistoryView: React.FC<AnalysisHistoryViewProps> = ({
  onOpenSession,
  onNavigateNew,
}) => {
  const [sessions, setSessions] = useState<StoredSessionRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [backendAudits, setBackendAudits] = useState<any[]>([]);

  useEffect(() => {
    setSessions(getStoredSessions());
    getAuditHistory()
      .then((res) => setBackendAudits(res.audit_logs || []))
      .catch(() => {});
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteStoredSession(id);
    setSessions(getStoredSessions());
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all saved session records?')) {
      clearAllStoredSessions();
      setSessions([]);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.sessionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.detectedCategories.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.primaryStream && s.primaryStream.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'feasible' && s.isFeasible) ||
      (statusFilter === 'infeasible' && !s.isFeasible);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#17231D] tracking-tight">
            Analysis History & Audit Records
          </h2>
          <p className="text-xs text-[#66736B]">
            Review past waste scenes, verified assignments, and backend decision logs
          </p>
        </div>

        {sessions.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 className="w-3.5 h-3.5 text-[#B42318]" />}
            onClick={handleClearAll}
            className="text-[#B42318] hover:bg-red-50"
          >
            Clear Session Cache
          </Button>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-2xl border border-[#E1E7E0] shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by session ID, waste stream, category..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#F7F7F2] border border-[#E1E7E0] text-xs text-[#17231D] placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#287A54]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#F7F7F2] border border-[#E1E7E0] text-xs font-semibold text-[#17231D] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="feasible">Feasible Solutions Only</option>
            <option value="infeasible">Infeasible Solutions Only</option>
          </select>
        </div>
      </div>

      {/* Sessions Grid */}
      {filteredSessions.length === 0 ? (
        <EmptyState
          title={sessions.length === 0 ? 'No Past Analyses Recorded' : 'No Matching Sessions'}
          description={
            sessions.length === 0
              ? 'Complete a waste analysis scan in the Studio to automatically log records into this persistent history.'
              : 'Try clearing your search query or adjusting your status filter.'
          }
          primaryActionLabel="Run a New Analysis"
          onPrimaryAction={onNavigateNew}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map((session) => (
            <div
              key={session.sessionId}
              onClick={() => onOpenSession(session)}
              className="p-4 rounded-2xl bg-white border border-[#E1E7E0] hover:border-[#287A54] transition-all cursor-pointer shadow-xs hover:shadow-sm space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#174D3A]">
                  {session.sessionId}
                </span>
                <Badge
                  status={session.isFeasible ? 'validated' : 'warning'}
                  label={session.isFeasible ? 'Feasible' : 'Infeasible'}
                  size="sm"
                />
              </div>

              <div className="flex items-center gap-3">
                {session.previewUrl ? (
                  <img
                    src={session.previewUrl}
                    alt="Preview"
                    className="w-14 h-14 rounded-xl object-cover border border-[#E1E7E0] shrink-0"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = '/static/samples/multi_waste.jpg';
                    }}
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-[#F7F7F2] border border-[#E1E7E0] flex items-center justify-center shrink-0">
                    <Layers className="w-6 h-6 text-stone-400" />
                  </div>
                )}

                <div className="truncate space-y-0.5">
                  <div className="text-xs font-bold text-[#17231D]">
                    {session.itemCount} physical object{session.itemCount !== 1 ? 's' : ''}
                  </div>
                  <p className="text-[11px] text-[#66736B] truncate">
                    {session.detectedCategories.map((c) => c.replace('_', ' ')).join(', ')}
                  </p>
                  <p className="text-[10px] text-stone-400">
                    {new Date(session.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E1E7E0] flex items-center justify-between">
                <span className="text-[11px] text-[#287A54] font-semibold group-hover:underline flex items-center gap-1">
                  <span>Re-open Studio</span>
                  <ArrowRight className="w-3 h-3" />
                </span>

                <button
                  type="button"
                  onClick={(e) => handleDelete(session.sessionId, e)}
                  className="p-1 rounded text-stone-400 hover:text-[#B42318] hover:bg-red-50 cursor-pointer"
                  title="Delete session record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Persistent Backend Audit Trail */}
      {backendAudits.length > 0 && (
        <Card padding="md" className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E1E7E0]">
            <div>
              <h4 className="text-xs font-bold text-[#17231D]">
                Persistent Backend Decision Audit Trail ({backendAudits.length})
              </h4>
              <p className="text-[11px] text-[#66736B]">
                Immutable server audit log recording user overrides and optimization events
              </p>
            </div>
            <span className="text-[10px] font-mono text-[#287A54]">GET /api/batch/audit-history</span>
          </div>

          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
            {backendAudits.slice(-10).reverse().map((audit, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-[#F7F7F2] border border-[#E1E7E0] text-xs flex items-center justify-between"
              >
                <div className="space-y-0.5 truncate pr-2">
                  <div className="font-semibold text-[#17231D] truncate">
                    {audit.event || 'Audit Event'}: {audit.item_id || audit.session_id}
                  </div>
                  <div className="text-[10px] text-[#66736B] truncate">
                    {audit.new_category ? `Assigned to: ${audit.new_category}` : 'Batch execution recorded'}
                  </div>
                </div>
                <span className="text-[10px] text-stone-400 shrink-0 font-mono">
                  {audit.recorded_at ? new Date(audit.recorded_at).toLocaleTimeString() : 'Recent'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
