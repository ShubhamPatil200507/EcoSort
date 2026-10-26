import React from 'react';
import { AnalysisStep } from '../../types';
import { Check, ChevronRight } from 'lucide-react';

interface WorkflowBreadcrumbProps {
  currentStep: AnalysisStep;
  onNavigateStep?: (step: AnalysisStep) => void;
  completedSteps?: AnalysisStep[];
}

interface StepMeta {
  key: AnalysisStep;
  label: string;
  shortLabel: string;
}

const STEPS: StepMeta[] = [
  { key: 'upload', label: '1. Capture & Upload', shortLabel: 'Upload' },
  { key: 'review', label: '2. Detection Review', shortLabel: 'Review' },
  { key: 'clarification', label: '3. Clarification', shortLabel: 'Clarify' },
  { key: 'optimization', label: '4. Rules & Optimization', shortLabel: 'Optimize' },
  { key: 'collection', label: '5. Collection Route', shortLabel: 'Centres' },
  { key: 'results', label: '6. Final Report', shortLabel: 'Report' },
];

export const WorkflowBreadcrumb: React.FC<WorkflowBreadcrumbProps> = ({
  currentStep,
  onNavigateStep,
  completedSteps = [],
}) => {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <nav aria-label="Analysis Progress" className="w-full bg-white rounded-2xl border border-[#E1E7E0] p-2.5 sm:p-3 shadow-2xs">
      <ol className="flex items-center justify-between overflow-x-auto no-scrollbar gap-1 sm:gap-2">
        {STEPS.map((step, idx) => {
          const isCurrent = step.key === currentStep;
          const isCompleted = completedSteps.includes(step.key) || idx < currentIndex;
          const isClickable = Boolean(onNavigateStep) && isCompleted && !isCurrent;

          return (
            <React.Fragment key={step.key}>
              <li className="flex items-center shrink-0">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onNavigateStep && onNavigateStep(step.key)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all select-none ${
                    isCurrent
                      ? 'bg-[#174D3A] text-white shadow-xs'
                      : isCompleted
                      ? 'text-[#287A54] hover:bg-[#EAF4EC] cursor-pointer'
                      : 'text-stone-400 cursor-not-allowed'
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? 'bg-white/20 text-white'
                        : isCompleted
                        ? 'bg-[#287A54] text-white'
                        : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {isCompleted && !isCurrent ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                  </span>
                  <span className="hidden md:inline">{step.label}</span>
                  <span className="md:hidden">{step.shortLabel}</span>
                </button>
              </li>

              {idx < STEPS.length - 1 && (
                <li className="shrink-0 text-stone-300" aria-hidden="true">
                  <ChevronRight className="w-4 h-4" />
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};
