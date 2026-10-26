import React, { useState } from 'react';
import { SegregationDecision } from '../../types';

interface DiscreteMathAuditViewProps {
  decision?: SegregationDecision;
  auditData?: Record<string, any>;
}

export const DiscreteMathAuditView: React.FC<DiscreteMathAuditViewProps> = ({
  decision,
  auditData,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'logic' | 'sets' | 'graph' | 'evidence' | 'complexity'>('logic');

  const audit = decision?.mathematical_audit || auditData;
  if (!audit) return null;

  const propLogic = audit.propositional_logic;
  const setTheory = audit.set_theory;
  const graphTheory = audit.graph_theory;
  const predLogic = audit.predicate_logic;
  const timing = audit.complexity_profile_ms;
  const evidence = decision?.evidence_breakdown;

  return (
    <div className="bg-white rounded-2xl border border-emerald-900/10 shadow-sm overflow-hidden mt-6 mb-8">
      {/* Header Banner / Accordion Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 bg-slate-900 text-white flex items-center justify-between hover:bg-slate-800 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center font-mono font-bold text-sm">
            ∀x
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm tracking-wide text-white">
                Discrete Mathematics & Reasoning Audit
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                Formal Verification
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Set Theory (∪, ∩) • Propositional Logic (∧, ∨, ¬) • Predicates • Directed DAG Reachability
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span>{isOpen ? 'Collapse' : 'Inspect Audit Log'}</span>
          <span className="text-base">{isOpen ? '▲' : '▼'}</span>
        </div>
      </button>

      {isOpen && (
        <div className="p-5 border-t border-slate-200 bg-slate-50/50">
          {/* Sub-tabs */}
          <div className="flex border-b border-slate-200 gap-2 mb-4 overflow-x-auto text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('logic')}
              className={`pb-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'logic'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Propositional Rules (∧, ∨, →)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sets')}
              className={`pb-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'sets'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Set Theory & Predicates (∈, ⊆, ∩)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('graph')}
              className={`pb-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'graph'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Graph Traversal (DAG)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('evidence')}
              className={`pb-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'evidence'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Evidence Attribution
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('complexity')}
              className={`pb-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'complexity'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Algorithm Complexity (Big-O)
            </button>
          </div>

          {/* TAB 1: Propositional Logic */}
          {activeTab === 'logic' && (
            <div className="space-y-4 text-xs">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Evaluated Propositional Rule Registry
                  </span>
                  <span className="text-slate-500 font-mono">
                    Matched: {propLogic?.matched_rules_count ?? 0} / {propLogic?.evaluated_rules_count ?? 0}
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {(propLogic?.evaluated_log || []).map((rule: any) => (
                    <div key={rule.rule_id} className="py-2.5 flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            rule.matched ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {rule.rule_id}
                          </span>
                          <span className="font-semibold text-slate-800">{rule.name}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                            rule.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                            rule.severity === 'WARNING' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {rule.severity}
                          </span>
                        </div>
                        <div className="font-mono text-[11px] text-slate-600 pl-1">
                          {rule.formula}
                        </div>
                        <div className="text-slate-500 pl-1 text-[11px]">
                          {rule.explanation}
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold shrink-0 ${
                        rule.matched ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {rule.matched ? 'TRUE (MATCHED)' : 'FALSE'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Set Theory & Predicates */}
          {activeTab === 'sets' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                  Set-Theoretic Properties
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600 font-mono">Category Universe (U)</span>
                    <span className="font-mono font-bold text-emerald-700">|U| = 10 streams</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600 font-mono">Target Category w</span>
                    <span className="font-mono font-bold text-slate-800">{setTheory?.category}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600 font-mono">Membership Predicate (w ∈ U)</span>
                    <span className="font-mono font-bold text-emerald-600">{setTheory?.in_universe ? 'TRUE' : 'FALSE'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600 font-mono">Stream Partition</span>
                    <span className="font-mono font-bold text-slate-800 uppercase">{setTheory?.stream_partition}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                  First-Order Predicate Evaluator
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600 font-mono">IsHazardous(w, a)</span>
                    <span className={`font-mono font-bold ${predLogic?.is_hazardous ? 'text-red-600' : 'text-slate-700'}`}>
                      {predLogic?.is_hazardous ? 'TRUE (HAZARDOUS)' : 'FALSE (NON-HAZARDOUS)'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600 font-mono">RequiresSpecialHandling(w, a)</span>
                    <span className={`font-mono font-bold ${predLogic?.requires_special_handling ? 'text-amber-600' : 'text-slate-700'}`}>
                      {predLogic?.requires_special_handling ? 'TRUE' : 'FALSE'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600 font-mono">IsAuthorizedCentreRequired(w)</span>
                    <span className="font-mono font-bold text-slate-800">
                      {predLogic?.is_authorized_centre_required ? 'TRUE (MANDATORY)' : 'FALSE'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Graph Traversal */}
          {activeTab === 'graph' && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs text-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Directed Acyclic Graph (DAG) Reachability Pathway
                </span>
                <span className="text-slate-500 font-mono">
                  Reachable Nodes: {graphTheory?.reachable_nodes_count ?? 0}
                </span>
              </div>

              <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg mb-3 overflow-x-auto">
                <div className="text-slate-400 mb-1">// Traversed Disposal Graph Edges (Category → Condition → Route → Facility):</div>
                {(graphTheory?.traversed_edges || []).map((e: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 py-0.5">
                    <span className="text-slate-500">{idx + 1}.</span>
                    <span className="text-amber-300">{e.from}</span>
                    <span className="text-emerald-500 font-bold">──▶</span>
                    <span className="text-cyan-300">{e.to}</span>
                  </div>
                ))}
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1">
                  Reachable Eligible Facility Types (Graph Sinks):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(graphTheory?.reachable_facility_types || []).map((fac: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200 text-[11px]">
                      {fac}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Evidence Attribution */}
          {activeTab === 'evidence' && evidence && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <h4 className="font-bold text-emerald-900 text-[11px] uppercase tracking-wider mb-2">
                  1. Image Classifier Evidence (Deep Learning)
                </h4>
                <div className="space-y-1 font-mono text-[11px] text-slate-700">
                  <div>Predicted: {evidence.image_classifier_evidence.predicted_category}</div>
                  <div>Confidence: {(evidence.image_classifier_evidence.confidence * 100).toFixed(1)}%</div>
                  <div>Subtype: {evidence.image_classifier_evidence.subtype || 'N/A'}</div>
                  <div>Latency: {evidence.image_classifier_evidence.inference_time_ms} ms</div>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <h4 className="font-bold text-blue-900 text-[11px] uppercase tracking-wider mb-2">
                  2. User Provided Attributes (Context)
                </h4>
                <div className="space-y-1 font-mono text-[11px] text-slate-700">
                  {Object.keys(evidence.user_provided_attributes).length === 0 ? (
                    <div className="text-slate-400 italic">No manual overrides provided.</div>
                  ) : (
                    Object.entries(evidence.user_provided_attributes).map(([k, v]) => (
                      <div key={k}>{k}: {String(v)}</div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <h4 className="font-bold text-purple-900 text-[11px] uppercase tracking-wider mb-2">
                  3. Discrete Rule Conclusions (Mathematical Deductions)
                </h4>
                <div className="space-y-1 font-mono text-[11px] text-slate-700">
                  <div>Matched Rules: {evidence.discrete_rule_conclusions.matched_rules?.join(', ') || 'None'}</div>
                  <div>Graph Traversal: {evidence.discrete_rule_conclusions.graph_reachability}</div>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <h4 className="font-bold text-amber-900 text-[11px] uppercase tracking-wider mb-2">
                  4. External Facility Constraints (Geospatial)
                </h4>
                <div className="space-y-1 font-mono text-[11px] text-slate-700">
                  <div>Location Available: {String(evidence.external_facility_info.location_available)}</div>
                  <div>Eligible Facilities Count: {evidence.external_facility_info.eligible_facility_types?.length ?? 0}</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Complexity Profile */}
          {activeTab === 'complexity' && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs text-xs space-y-3">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Theoretical Asymptotic Complexity & Empirical Timing
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-mono text-[10px]">
                      <th className="py-1.5">Module / Operation</th>
                      <th className="py-1.5">Time Complexity</th>
                      <th className="py-1.5">Space Complexity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                    <tr>
                      <td className="py-1.5 font-bold">Category Universe Membership</td>
                      <td className="py-1.5 text-emerald-700">O(1) average / worst-case</td>
                      <td className="py-1.5">O(1)</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-bold">Centre Set Intersection ({'{w} ∩ A_i'})</td>
                      <td className="py-1.5 text-emerald-700">O(min(|A_i|, 1)) = O(1)</td>
                      <td className="py-1.5">O(1)</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-bold">First-Order Predicate Filtering</td>
                      <td className="py-1.5 text-blue-700">O(N) directory pass</td>
                      <td className="py-1.5">O(K) candidates</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-bold">Graph BFS Reachability Traversal</td>
                      <td className="py-1.5 text-purple-700">O(|V| + |E|)</td>
                      <td className="py-1.5">O(|V|)</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-bold">Haversine Spatial Ranking</td>
                      <td className="py-1.5 text-amber-700">O(K log K) Timsort</td>
                      <td className="py-1.5">O(K)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {timing && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-500 font-mono text-[11px]">
                  <span>Empirical Rule Evaluation: {timing.rule_evaluation_ms ?? 0} ms</span>
                  <span>Empirical Graph Traversal: {timing.graph_traversal_ms ?? 0} ms</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
