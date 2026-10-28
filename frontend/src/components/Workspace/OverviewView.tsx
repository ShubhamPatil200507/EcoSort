import React, { useState, useEffect } from 'react';
import {
  ScanLine,
  ArrowRight,
  ShieldCheck,
  Cpu,
  MapPin,
  CheckCircle2,
  Clock,
  Compass,
  Calendar,
  Layers,
  Sparkles,
  History,
  Settings
} from 'lucide-react';
import { AppView, StoredSessionRecord } from '../../types';
import { getStoredSessions, getAggregatedSessionStats, deleteStoredSession } from '../../utils/sessionStore';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';

interface OverviewViewProps {
  onNavigate: (view: AppView) => void;
  onOpenSession?: (session: StoredSessionRecord) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigate,
  onOpenSession,
}) => {
  const [sessions, setSessions] = useState<StoredSessionRecord[]>([]);
  const [stats, setStats] = useState(getAggregatedSessionStats());

  useEffect(() => {
    const loaded = getStoredSessions();
    setSessions(loaded);
    setStats(getAggregatedSessionStats());
  }, []);

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteStoredSession(id);
    const updated = getStoredSessions();
    setSessions(updated);
    setStats(getAggregatedSessionStats());
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-[#174D3A] text-white p-6 sm:p-10 shadow-md border border-[#10382B]">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Decision-Aware Waste Sorting Workspace</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            Know what it is. Know where it belongs.
          </h2>

          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Upload multi-item waste photographs to separate physical objects, validate disposal rules against statutory frameworks (CPCB, SWM, PWM 2016), and solve optimal batch stream assignments with exact mathematical programming.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="lg"
              icon={<ScanLine className="w-5 h-5" />}
              onClick={() => onNavigate('analysis')}
              className="bg-emerald-400 hover:bg-emerald-300 text-[#17231D] font-bold shadow-md"
            >
              Start a New Analysis
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={() => onNavigate('centres')}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              Explore Collection Centres
            </Button>
          </div>
        </div>

        {/* Subtle Decorative Backdrop */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Real Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card padding="md" className="space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-[#66736B]">
            <span>Sessions Run</span>
            <Calendar className="w-4 h-4 text-[#287A54]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#17231D] tabular-nums">
            {stats.totalSessions}
          </div>
          <p className="text-[11px] text-[#66736B]">Recorded on this system</p>
        </Card>

        <Card padding="md" className="space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-[#66736B]">
            <span>Items Analyzed</span>
            <Layers className="w-4 h-4 text-[#287A54]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#17231D] tabular-nums">
            {stats.totalItemsDetected}
          </div>
          <p className="text-[11px] text-[#66736B]">Detected physical objects</p>
        </Card>

        <Card padding="md" className="space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-[#66736B]">
            <span>Human Reviews</span>
            <Clock className="w-4 h-4 text-[#946200]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#17231D] tabular-nums">
            {stats.totalItemsReviewed}
          </div>
          <p className="text-[11px] text-[#66736B]">User confirmations & overrides</p>
        </Card>

        <Card padding="md" className="space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-[#66736B]">
            <span>Solver Feasibility</span>
            <ShieldCheck className="w-4 h-4 text-[#285DA8]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#17231D] tabular-nums">
            {stats.feasibleRatePct}%
          </div>
          <p className="text-[11px] text-[#66736B]">Exact MILP feasible batches</p>
        </Card>
      </div>

      {/* 4-Step Pipeline Explainer */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#17231D]">How the EcoSort Pipeline Operates</h3>
          <button
            type="button"
            onClick={() => onNavigate('how-it-works')}
            className="text-xs font-semibold text-[#287A54] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Read full walkthrough</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white border border-[#E1E7E0] space-y-2">
            <div className="w-7 h-7 rounded-lg bg-[#EAF4EC] text-[#174D3A] flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h4 className="text-xs font-bold text-[#17231D]">Multi-Object Vision</h4>
            <p className="text-[11px] text-[#66736B] leading-relaxed">
              Square letterboxing and spatial proposal fusion identify separate items without aspect-ratio squashing.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E1E7E0] space-y-2">
            <div className="w-7 h-7 rounded-lg bg-[#EAF4EC] text-[#174D3A] flex items-center justify-center font-bold text-xs">
              2
            </div>
            <h4 className="text-xs font-bold text-[#17231D]">Statutory Rules</h4>
            <p className="text-[11px] text-[#66736B] leading-relaxed">
              Rules v1.2.0 check compatibility, prohibited co-disposals (e.g. hazardous with municipal), and required warnings.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E1E7E0] space-y-2">
            <div className="w-7 h-7 rounded-lg bg-[#EAF4EC] text-[#174D3A] flex items-center justify-center font-bold text-xs">
              3
            </div>
            <h4 className="text-xs font-bold text-[#17231D]">MILP Optimization</h4>
            <p className="text-[11px] text-[#66736B] leading-relaxed">
              HiGHS solver determines minimal disposal streams and respects facility capacity constraints.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E1E7E0] space-y-2">
            <div className="w-7 h-7 rounded-lg bg-[#EAF4EC] text-[#174D3A] flex items-center justify-center font-bold text-xs">
              4
            </div>
            <h4 className="text-xs font-bold text-[#17231D]">Facility TSP Tour</h4>
            <p className="text-[11px] text-[#66736B] leading-relaxed">
              Solves shortest travelling collection route visiting verified collection centres covering all streams.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Analyses Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#17231D]">Recent Analysis Sessions</h3>
            <p className="text-xs text-[#66736B]">Past waste audits and assignments saved in this browser</p>
          </div>

          {sessions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('history')}
            >
              View All History
            </Button>
          )}
        </div>

        {sessions.length === 0 ? (
          <EmptyState
            title="No Past Analyses Recorded"
            description="Start your first waste scan to inspect physical items, validate disposal rules, and compute optimal batch assignments."
            primaryActionLabel="Start Your First Analysis"
            onPrimaryAction={() => onNavigate('analysis')}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {sessions.slice(0, 6).map((session) => (
              <div
                key={session.sessionId}
                onClick={() => onOpenSession && onOpenSession(session)}
                className="group p-4 rounded-2xl bg-white border border-[#E1E7E0] hover:border-[#287A54] transition-all cursor-pointer shadow-xs hover:shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#66736B]">
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
                      alt="Session thumbnail"
                      className="w-12 h-12 rounded-xl object-cover border border-[#E1E7E0] shrink-0"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.onerror = null;
                        target.src = '/static/samples/multi_waste.jpg';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[#F7F7F2] border border-[#E1E7E0] flex items-center justify-center shrink-0">
                      <Layers className="w-5 h-5 text-stone-400" />
                    </div>
                  )}

                  <div className="truncate space-y-0.5">
                    <div className="text-xs font-bold text-[#17231D] truncate">
                      {session.itemCount} physical object{session.itemCount !== 1 ? 's' : ''}
                    </div>
                    <p className="text-[11px] text-[#66736B] truncate">
                      {session.detectedCategories.map((c) => c.replace('_', ' ')).join(', ') || 'General'}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E1E7E0] flex items-center justify-between text-[11px] text-[#66736B]">
                  <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                  <span className="text-[#287A54] font-semibold group-hover:underline flex items-center gap-0.5">
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2">
        <Card
          padding="md"
          className="hover:border-[#287A54] transition-colors cursor-pointer group space-y-2"
          onClick={() => onNavigate('centres')}
        >
          <div className="w-8 h-8 rounded-xl bg-[#EAF4EC] text-[#174D3A] flex items-center justify-center">
            <Compass className="w-4 h-4 text-[#287A54]" />
          </div>
          <h4 className="text-xs font-bold text-[#17231D] group-hover:text-[#287A54] transition-colors">
            Collection Centres Directory
          </h4>
          <p className="text-[11px] text-[#66736B] leading-relaxed">
            Search verified municipal MRFs, authorized e-waste recyclers, and drop-off stations with Haversine distance ranking.
          </p>
        </Card>

        <Card
          padding="md"
          className="hover:border-[#287A54] transition-colors cursor-pointer group space-y-2"
          onClick={() => onNavigate('history')}
        >
          <div className="w-8 h-8 rounded-xl bg-[#F0F5FD] text-[#285DA8] flex items-center justify-center">
            <History className="w-4 h-4 text-[#285DA8]" />
          </div>
          <h4 className="text-xs font-bold text-[#17231D] group-hover:text-[#285DA8] transition-colors">
            Past Analysis Sessions
          </h4>
          <p className="text-[11px] text-[#66736B] leading-relaxed">
            Review past waste scans, re-open completed batches in the Studio, and export audit trails.
          </p>
        </Card>

        <Card
          padding="md"
          className="hover:border-[#287A54] transition-colors cursor-pointer group space-y-2"
          onClick={() => onNavigate('settings')}
        >
          <div className="w-8 h-8 rounded-xl bg-[#FEF7EC] text-[#946200] flex items-center justify-center">
            <Settings className="w-4 h-4 text-[#946200]" />
          </div>
          <h4 className="text-xs font-bold text-[#17231D] group-hover:text-[#946200] transition-colors">
            Settings & System Governance
          </h4>
          <p className="text-[11px] text-[#66736B] leading-relaxed">
            Inspect active model versions, configure image retention preferences, and manage location privacy.
          </p>
        </Card>
      </div>
    </div>
  );
};
