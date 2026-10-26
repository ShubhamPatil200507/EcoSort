import React from 'react';
import {
  FlaskConical,
  Scale,
  ShieldCheck,
  Cpu,
  ArrowRight,
  BookOpen,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { AppView } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

interface PublicResearchViewProps {
  onNavigate: (view: AppView) => void;
}

export const PublicResearchView: React.FC<PublicResearchViewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-10 max-w-4xl mx-auto py-8 px-4 text-left">
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#287A54]">
          Academic Methodology
        </span>
        <h2 className="text-3xl font-black text-[#17231D] tracking-tight">
          Research Framework: Decision-Aware Clarification
        </h2>
        <p className="text-sm text-[#66736B] leading-relaxed">
          Why traditional single-image waste classifiers fall short in real-world regulatory environments, and how coupling neural vision with mathematical optimization bridges the gap.
        </p>
      </div>

      {/* Research Question Card */}
      <Card padding="lg" className="border-l-4 border-l-[#287A54] space-y-3 bg-[#EAF4EC]/30">
        <span className="text-xs font-bold uppercase tracking-wider text-[#174D3A] flex items-center gap-1.5">
          <FlaskConical className="w-4 h-4 text-[#287A54]" />
          <span>The Central Research Question</span>
        </span>
        <p className="text-sm font-semibold text-[#17231D] leading-relaxed">
          &ldquo;Can decision-aware clarification based on Expected Value of Information (EVOI) achieve higher batch disposal feasibility with fewer human queries than classical confidence- or entropy-based active query heuristics, specifically by suppressing queries whose resolution cannot alter the optimal disposal stream assignment?&rdquo;
        </p>
      </Card>

      {/* The Fundamental Inadequacy of Independent Classification */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#17231D]">
          The Limits of Isolated Image Classification
        </h3>
        <p className="text-xs text-[#66736B] leading-relaxed">
          Standard waste sorting benchmarks (such as TrashNet or TACO) evaluate models strictly on isolated top-1 accuracy. However, in practice:
        </p>
        <ul className="list-disc pl-5 text-xs text-[#66736B] space-y-2 leading-relaxed">
          <li>
            <strong>Composite Scenes:</strong> Real household waste is discarded in composite batches (e.g. plastic food containers mixed with aluminum beverage cans and disposable batteries).
          </li>
          <li>
            <strong>Asymmetric Penalty:</strong> Misclassifying paper as plastic simply reduces recycling purity; misclassifying a swollen lithium battery as municipal waste introduces dangerous landfill fire hazards.
          </li>
          <li>
            <strong>Irrelevant Ambiguity:</strong> If a household batch already requires an authorized dry-recyclables pickup, querying the user to distinguish between PET (#1) and HDPE (#2) plastic is wasteful if both flow into the same Material Recovery Facility (MRF).
          </li>
        </ul>
      </div>

      {/* EVOI Mathematical Formulation */}
      <Card padding="lg" className="space-y-3">
        <h3 className="text-sm font-bold text-[#17231D]">
          The Expected Value of Information (EVOI) Formulation
        </h3>
        <p className="text-xs text-[#66736B] leading-relaxed">
          EcoSort computes whether querying a specific item $i$ will alter the downstream integer programming cost $Z^*$:
        </p>

        <pre className="p-4 rounded-2xl bg-stone-900 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed">
{`Let C(x) be the optimal integer programming cost of assigning the batch.
EVOI(item i) = C(Current Batch) - sum_{c in Classes} [ P(C_i = c) * C(Batch | C_i = c) ]

Query Item: i* = argmax_{i in Ambiguous} EVOI(i)`}
        </pre>

        <p className="text-[11px] text-[#66736B] leading-relaxed">
          If EVOI(i) = 0, resolving item i cannot change which streams or facilities are required. Therefore, the system automatically suppresses the question, respecting user attention.
        </p>
      </Card>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-[#E1E7E0]">
        <Button variant="secondary" size="md" onClick={() => onNavigate('landing')}>
          Back to Home
        </Button>

        <Button
          variant="forest"
          size="md"
          icon={<FlaskConical className="w-4 h-4" />}
          onClick={() => onNavigate('evaluation')}
        >
          Inspect Benchmark Tables
        </Button>
      </div>
    </div>
  );
};
