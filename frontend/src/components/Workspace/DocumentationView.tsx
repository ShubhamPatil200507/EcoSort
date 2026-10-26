import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Code,
  Scale,
  ShieldCheck,
  Cpu,
  Layers,
  AlertTriangle,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { getRegisteredRules } from '../../services/api';
import { RuleDefinition } from '../../types';

export const DocumentationView: React.FC = () => {
  const [activeDocTab, setActiveDocTab] = useState<'architecture' | 'math' | 'statutes' | 'apis' | 'limitations'>('statutes');
  const [rules, setRules] = useState<RuleDefinition[]>([]);

  useEffect(() => {
    getRegisteredRules()
      .then(setRules)
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Doc Header */}
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-black text-[#17231D] tracking-tight">
          Technical Documentation & Statutory Reference
        </h2>
        <p className="text-xs text-[#66736B]">
          Official regulatory citations, mathematical formulations, and engineering architecture
        </p>
      </div>

      {/* Doc Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#E1E7E0]">
        <button
          type="button"
          onClick={() => setActiveDocTab('statutes')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none ${
            activeDocTab === 'statutes'
              ? 'bg-[#174D3A] text-white shadow-xs'
              : 'text-[#66736B] hover:text-[#17231D] hover:bg-stone-100'
          }`}
        >
          Statutory Frameworks & Rules
        </button>

        <button
          type="button"
          onClick={() => setActiveDocTab('math')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none ${
            activeDocTab === 'math'
              ? 'bg-[#174D3A] text-white shadow-xs'
              : 'text-[#66736B] hover:text-[#17231D] hover:bg-stone-100'
          }`}
        >
          Mathematical Model (MILP & EVOI)
        </button>

        <button
          type="button"
          onClick={() => setActiveDocTab('architecture')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none ${
            activeDocTab === 'architecture'
              ? 'bg-[#174D3A] text-white shadow-xs'
              : 'text-[#66736B] hover:text-[#17231D] hover:bg-stone-100'
          }`}
        >
          System Architecture
        </button>

        <button
          type="button"
          onClick={() => setActiveDocTab('apis')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none ${
            activeDocTab === 'apis'
              ? 'bg-[#174D3A] text-white shadow-xs'
              : 'text-[#66736B] hover:text-[#17231D] hover:bg-stone-100'
          }`}
        >
          API Contracts
        </button>

        <button
          type="button"
          onClick={() => setActiveDocTab('limitations')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none ${
            activeDocTab === 'limitations'
              ? 'bg-[#174D3A] text-white shadow-xs'
              : 'text-[#66736B] hover:text-[#17231D] hover:bg-stone-100'
          }`}
        >
          Safety & Limitations
        </button>
      </div>

      {/* Tab 1: Statutory Frameworks */}
      {activeDocTab === 'statutes' && (
        <div className="space-y-4">
          <Card padding="md" className="space-y-3">
            <h3 className="text-sm font-bold text-[#17231D]">
              Governing Statutory Regulations (India Jurisdiction)
            </h3>
            <p className="text-xs text-[#66736B] leading-relaxed">
              Disposal streams are decoupled from raw visual classifications and validated against deterministic rules derived from statutory schedules:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-[#F7F7F2] border border-[#E1E7E0] space-y-1">
                <span className="text-xs font-bold text-[#174D3A] block">
                  CPCB E-Waste Management Rules 2022
                </span>
                <p className="text-[11px] text-[#66736B]">
                  Schedule I & II: Regulates electrical and electronic equipment, PCBs, IC chips, microcontrollers, and solar PV modules. Mandates authorized recycling facilities.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F7F7F2] border border-[#E1E7E0] space-y-1">
                <span className="text-xs font-bold text-[#174D3A] block">
                  Battery Waste Management Rules 2022
                </span>
                <p className="text-[11px] text-[#66736B]">
                  Prohibits co-disposal of lead-acid, lithium-ion, and cylindrical cells with municipal waste due to fire hazard and heavy metal leaching.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F7F7F2] border border-[#E1E7E0] space-y-1">
                <span className="text-xs font-bold text-[#174D3A] block">
                  Solid Waste Management Rules 2016
                </span>
                <p className="text-[11px] text-[#66736B]">
                  Rule 15(g): Mandates segregation at source into biodegradable, non-biodegradable, and domestic hazardous streams.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F7F7F2] border border-[#E1E7E0] space-y-1">
                <span className="text-xs font-bold text-[#174D3A] block">
                  Hazardous and Other Wastes Rules 2016
                </span>
                <p className="text-[11px] text-[#66736B]">
                  Requires manifest documentation and transport to licensed Treatment, Storage, and Disposal Facilities (TSDF).
                </p>
              </div>
            </div>
          </Card>

          {/* Live Rule Registry Table */}
          <Card padding="none" className="overflow-hidden">
            <div className="p-4 border-b border-[#E1E7E0] bg-[#F7F7F2]/40">
              <h4 className="text-xs font-bold text-[#17231D]">
                Active Versioned Rules Registry (v1.2.0)
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F7F2] text-[#66736B] font-bold text-[11px] uppercase tracking-wider border-b border-[#E1E7E0]">
                  <tr>
                    <th className="py-2.5 px-4">Rule ID</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Permitted Streams</th>
                    <th className="py-2.5 px-4">Prohibited Co-Disposal</th>
                    <th className="py-2.5 px-4">Statutory Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1E7E0]">
                  {rules.slice(0, 8).map((r) => (
                    <tr key={r.rule_id} className="hover:bg-[#F7F7F2]/40">
                      <td className="py-2.5 px-4 font-mono font-bold text-[#17231D]">{r.rule_id}</td>
                      <td className="py-2.5 px-4 text-[#17231D]">{r.category.replace('_', ' ')}</td>
                      <td className="py-2.5 px-4 text-[#287A54] font-semibold">{r.permitted_streams.join(', ')}</td>
                      <td className="py-2.5 px-4 text-[#B42318] text-[11px]">{r.prohibited_combinations.join(', ') || 'None'}</td>
                      <td className="py-2.5 px-4 text-[#66736B] text-[11px]">{r.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Mathematical Model */}
      {activeDocTab === 'math' && (
        <Card padding="lg" className="space-y-4">
          <h3 className="text-sm font-bold text-[#17231D]">
            Mathematical Formulations: Mixed-Integer Linear Program & EVOI
          </h3>

          <div className="space-y-3 text-xs leading-relaxed text-[#17231D]">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#174D3A]">
              1. HiGHS Batch Sorting MILP
            </h4>
            <p className="text-[#66736B]">
              Let I be the set of detected items, and J be the set of authorized disposal streams.
              Binary decision variable x_ij in (0, 1) denotes item i assigned to stream j.
              Binary variable y_j in (0, 1) denotes whether stream j is activated for collection.
            </p>
            <pre className="p-3 rounded-xl bg-stone-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
{`Minimize Z = sum_{j in J} (c_j * y_j) + sum_{i in I} sum_{j in J} (penalty_ij * x_ij)

Subject to:
  1. sum_{j in Permitted(i)} x_ij = 1, for all i in I    (Total assignment)
  2. x_ij <= y_j, for all i, j                           (Stream activation)
  3. sum_{i in I} w_i * x_ij <= Cap_j, for all j in J    (Capacity constraint)
  4. x_{i1, j} + x_{i2, j} <= 1 for incompatible pairs   (Co-disposal safety)`}
            </pre>

            <h4 className="font-bold text-xs uppercase tracking-wider text-[#174D3A] pt-3">
              2. Expected Value of Information (EVOI) Active Clarification
            </h4>
            <p className="text-[#66736B]">
              We evaluate candidate items for human query by computing downstream cost reduction:
            </p>
            <pre className="p-3 rounded-xl bg-stone-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
{`EVOI(i) = Cost(Current Optimal Batch) - sum_{c in Classes} P(C_i = c) * Cost(Optimal Batch | C_i = c)
i* = argmax_{i in Ambiguous} EVOI(i)`}
            </pre>
          </div>
        </Card>
      )}

      {/* Tab 3: System Architecture */}
      {activeDocTab === 'architecture' && (
        <Card padding="lg" className="space-y-4">
          <h3 className="text-sm font-bold text-[#17231D]">
            System Architecture & Pipeline Separation
          </h3>
          <p className="text-xs text-[#66736B] leading-relaxed">
            EcoSort enforces strict architectural separation between neural feature extraction, deterministic statutory logic, optimization solvers, and human governance:
          </p>

          <pre className="p-4 rounded-2xl bg-stone-900 text-emerald-400 font-mono text-xs overflow-x-auto">
{`+-----------------------------------------------------------------------------+
|                            USER WORKSPACE (REACT / VITE)                    |
|  - Multi-Object Canvas  - Clarification Studio  - TSP Collection Map        |
+-----------------------------------------------------------------------------+
                                      | HTTP REST JSON
                                      v
+-----------------------------------------------------------------------------+
|                         FASTAPI ASYNCHRONOUS BACKEND                        |
|                                                                             |
|  [CV Pipeline]          [Deterministic Rules]       [Mathematical Solvers]  |
|  - MultiObjectDetector  - VersionedRuleEngine (v1.2) - BatchSortingOptimizer|
|  - MobileNetV3 (10 cls) - Discrete Math Sets & AST   - HiGHS Exact MILP     |
|  - EfficientNet-B0 Opt  - CPCB Schedule Matcher      - TSP Tour Planner     |
|                                                                             |
|  [LLM Consensus Agent]                           [Governance & Retraining]  |
|  - Dual-tier verifier (API + Rule NLP Engine)    - RetrainingManager        |
|  - Anti-Poisoning Dispute Defense                - Model Registry v1.x      |
+-----------------------------------------------------------------------------+`}
          </pre>
        </Card>
      )}

      {/* Tab 4: API Contracts */}
      {activeDocTab === 'apis' && (
        <Card padding="lg" className="space-y-3">
          <h3 className="text-sm font-bold text-[#17231D]">
            Key Backend API Endpoints
          </h3>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-[#F7F7F2] border border-[#E1E7E0] space-y-1">
              <span className="font-mono font-bold text-[#287A54]">POST /api/batch/detect</span>
              <p className="text-[#66736B]">Decomposes image into spatial crops, bounding boxes, and calibrated category confidences.</p>
            </div>
            <div className="p-3 rounded-xl bg-[#F7F7F2] border border-[#E1E7E0] space-y-1">
              <span className="font-mono font-bold text-[#287A54]">POST /api/batch/optimize</span>
              <p className="text-[#66736B]">Executes exact HiGHS Mixed-Integer Linear Program for batch stream assignments under capacity and co-disposal rules.</p>
            </div>
            <div className="p-3 rounded-xl bg-[#F7F7F2] border border-[#E1E7E0] space-y-1">
              <span className="font-mono font-bold text-[#287A54]">POST /api/feedback</span>
              <p className="text-[#66736B]">Autonomous human-in-the-loop correction verified by statutory LLM agent with automated fine-tuning loop.</p>
            </div>
            <div className="p-3 rounded-xl bg-[#F7F7F2] border border-[#E1E7E0] space-y-1">
              <span className="font-mono font-bold text-[#287A54]">POST /api/batch/route-plan</span>
              <p className="text-[#66736B]">Solves shortest Travelling Salesperson Tour visiting verified facilities covering all active streams.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 5: Limitations */}
      {activeDocTab === 'limitations' && (
        <Card padding="lg" className="space-y-3">
          <h3 className="text-sm font-bold text-[#17231D] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#946200]" />
            <span>Operational Boundaries & Safety Caveats</span>
          </h3>
          <ul className="list-disc pl-5 text-xs text-[#66736B] space-y-2 leading-relaxed">
            <li>
              <strong>Decision Support Only:</strong> EcoSort provides research-grade sorting recommendations and does not replace official on-site industrial hazardous waste handling assessments.
            </li>
            <li>
              <strong>Damaged Battery Fire Risks:</strong> Punctured or swollen lithium batteries must never be handled with bare hands or packed together. Immediate isolation in sand or vermiculite is advised under Indian SWM guidelines.
            </li>
            <li>
              <strong>Unverified Centres:</strong> Facilities lacking valid CPCB state board authorization certificates are marked with an explicit unverified badge.
            </li>
          </ul>
        </Card>
      )}
    </div>
  );
};
