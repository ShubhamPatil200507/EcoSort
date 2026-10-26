import React from 'react';
import {
  Leaf,
  ShieldCheck,
  Scale,
  Cpu,
  ExternalLink,
  Code2,
  HeartHandshake
} from 'lucide-react';
import { AppView } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

interface AboutProjectViewProps {
  onNavigate: (view: AppView) => void;
}

export const AboutProjectView: React.FC<AboutProjectViewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-10 max-w-4xl mx-auto py-8 px-4 text-left">
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#287A54]">
          Project Identity & Principles
        </span>
        <h2 className="text-3xl font-black text-[#17231D] tracking-tight">
          About EcoSort
        </h2>
        <p className="text-sm text-[#66736B] leading-relaxed">
          An open-source research initiative designed to advance environmental technology through decision-aware machine learning and constraint validation.
        </p>
      </div>

      <div className="space-y-6">
        <Card padding="lg" className="space-y-3">
          <h3 className="text-sm font-bold text-[#17231D] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#287A54]" />
            <span>Primary Product Principle: Truthfulness Over Polish</span>
          </h3>
          <p className="text-xs text-[#66736B] leading-relaxed">
            EcoSort is built on the tenet that environmental tools must be strictly honest. We never fabricate model accuracies, simulate mock routing data as live, or promise that user feedback retrains neural networks unless an actual verified training pipeline and checkpoint registry exist.
          </p>
        </Card>

        <Card padding="lg" className="space-y-3">
          <h3 className="text-sm font-bold text-[#17231D] flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#287A54]" />
            <span>Statutory Grounding</span>
          </h3>
          <p className="text-xs text-[#66736B] leading-relaxed">
            Classification outputs are held accountable to published schedules from the Central Pollution Control Board (CPCB E-Waste Rules 2022), Solid Waste Management Rules 2016, Plastic Waste Management Rules 2016, and Battery Waste Management Rules 2022.
          </p>
        </Card>

        <Card padding="lg" className="space-y-3">
          <h3 className="text-sm font-bold text-[#17231D] flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#287A54]" />
            <span>Open Source & Reproducible</span>
          </h3>
          <p className="text-xs text-[#66736B] leading-relaxed">
            The complete stack — from PyTorch neural transfer learning and YOLO spatial proposals to HiGHS mixed-integer linear programming and React frontends — is distributed under the MIT Open Source License.
          </p>
          <div className="pt-2">
            <a
              href="https://github.com/ShubhamPatil200507/EcoSort"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#287A54] hover:underline"
            >
              <span>Inspect Repository on GitHub</span>
              <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
            </a>
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-[#E1E7E0]">
        <Button variant="secondary" size="md" onClick={() => onNavigate('landing')}>
          Back to Home
        </Button>

        <Button
          variant="forest"
          size="md"
          icon={<Leaf className="w-4 h-4" />}
          onClick={() => onNavigate('overview')}
        >
          Open Application Workspace
        </Button>
      </div>
    </div>
  );
};
