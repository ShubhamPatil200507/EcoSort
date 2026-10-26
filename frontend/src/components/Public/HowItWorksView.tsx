import React from 'react';
import {
  ScanLine,
  CheckCircle2,
  ShieldCheck,
  Scale,
  Compass,
  FileText,
  ArrowRight,
  Bot,
  Layers
} from 'lucide-react';
import { AppView } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

interface HowItWorksViewProps {
  onNavigate: (view: AppView) => void;
}

export const HowItWorksView: React.FC<HowItWorksViewProps> = ({ onNavigate }) => {
  const steps = [
    {
      step: 1,
      title: 'Image Capture & Letterbox Normalization',
      desc: 'You upload a single photograph or multi-item composite. The multi-object detector scales the image preserving aspect ratio with edge-median background padding to prevent distortion of elongated batteries or thin circuit boards.',
      icon: <Layers className="w-5 h-5 text-[#287A54]" />,
    },
    {
      step: 2,
      title: 'Spatial Proposal Fusion & Dual-Model Inference',
      desc: 'Anchor-free YOLOv8 proposals are fused with morphological Canny edge saliency. Each isolated proposal passes through fine-tuned MobileNetV3 for material textures and EfficientNet-B0 for real-world optical semantics, outputting calibrated probability distributions.',
      icon: <ScanLine className="w-5 h-5 text-[#287A54]" />,
    },
    {
      step: 3,
      title: 'Item Review & Autonomous LLM Consensus Verification',
      desc: 'Users review the individual crops. If a user corrects a prediction, an independent statutory LLM agent evaluates the physical tokens against official CPCB regulations. Retraining occurs only when consensus is reached, defending against adversarial data poisoning.',
      icon: <Bot className="w-5 h-5 text-[#287A54]" />,
    },
    {
      step: 4,
      title: 'Decision-Aware Clarification (EVOI)',
      desc: 'When items have ambiguous probabilities, the active query engine estimates the Expected Value of Information. Questions are only asked if resolving the ambiguity would change the optimal batch disposal stream or prevent an illegal co-disposal.',
      icon: <Scale className="w-5 h-5 text-[#287A54]" />,
    },
    {
      step: 5,
      title: 'Mixed-Integer Linear Programming (MILP)',
      desc: 'The HiGHS solver solves an exact 0-1 integer program to assign items to permitted streams (v1.2.0 rules) while minimizing disposal stream count, respecting container capacities, and enforcing hard prohibitions (e.g. hazardous with municipal waste).',
      icon: <ShieldCheck className="w-5 h-5 text-[#287A54]" />,
    },
    {
      step: 6,
      title: 'Multi-Stop Travelling Salesperson Tour (TSP)',
      desc: 'A graph-based tour planner selects verified authorized recycling centres and drop-off stations covering all active streams in the batch, calculating the shortest distance route from the user location.',
      icon: <Compass className="w-5 h-5 text-[#287A54]" />,
    },
    {
      step: 7,
      title: 'Audit Logging & Exportable Compliance Record',
      desc: 'The complete session produces an exportable JSON/CSV audit report stamped with software version, model checkpoint, and statutory citations (CPCB 2022, SWM 2016, PWM 2016).',
      icon: <FileText className="w-5 h-5 text-[#287A54]" />,
    },
  ];

  return (
    <div className="space-y-12 max-w-4xl mx-auto py-8 px-4 text-left">
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#287A54]">
          Engineering Workflow
        </span>
        <h2 className="text-3xl font-black text-[#17231D] tracking-tight">
          How EcoSort Solves Multi-Object Waste Sorting
        </h2>
        <p className="text-sm text-[#66736B] leading-relaxed">
          A step-by-step technical explanation of the pipeline from raw photograph to constraint-validated facility collection tour.
        </p>
      </div>

      <div className="space-y-6">
        {steps.map((s) => (
          <Card key={s.step} padding="lg" className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#EAF4EC] text-[#174D3A] flex items-center justify-center font-extrabold text-sm shrink-0">
                {s.step}
              </div>
              <div className="flex items-center gap-2">
                <span className="shrink-0">{s.icon}</span>
                <h3 className="text-base font-bold text-[#17231D]">{s.title}</h3>
              </div>
            </div>

            <p className="text-xs text-[#66736B] leading-relaxed pl-12">
              {s.desc}
            </p>
          </Card>
        ))}
      </div>

      <div className="p-8 rounded-3xl bg-[#174D3A] text-white text-center space-y-4 shadow-md">
        <h3 className="text-xl font-bold text-white">Experience the Pipeline Live</h3>
        <p className="text-xs text-emerald-100 max-w-md mx-auto">
          Test the multi-object detector and integer optimizer on real composite images.
        </p>
        <Button
          variant="primary"
          size="lg"
          icon={<ScanLine className="w-4 h-4" />}
          onClick={() => onNavigate('analysis')}
          className="bg-emerald-400 hover:bg-emerald-300 text-[#17231D] font-bold"
        >
          Open Analysis Studio
        </Button>
      </div>
    </div>
  );
};
