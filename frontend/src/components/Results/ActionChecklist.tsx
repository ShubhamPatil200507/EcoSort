import React, { useState } from 'react';
import {
  CheckCircle2, AlertTriangle, ShieldAlert, ArrowRight,
  Sparkles, Info, Layers, CheckSquare, Square
} from 'lucide-react';
import { DisposalRecommendation } from '../../types';

interface ActionChecklistProps {
  recommendation: DisposalRecommendation;
}

export const ActionChecklist: React.FC<ActionChecklistProps> = ({ recommendation }) => {
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-6">
      {/* Primary Action Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              Recommended Action
            </span>
            <p className="text-base sm:text-lg font-bold text-stone-900 mt-0.5 leading-snug">
              {recommendation.primary_action}
            </p>
            <div className="mt-2 text-xs text-stone-600 flex items-center gap-1.5 font-medium">
              <span className="text-stone-400">Route:</span>
              <span className="text-emerald-900 font-semibold">{recommendation.recommended_disposal_route}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Badges / Key Directives */}
      <div className="flex flex-wrap gap-2">
        <div
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border ${
            recommendation.separate_from_regular_trash
              ? 'bg-amber-50 text-amber-900 border-amber-200'
              : 'bg-stone-50 text-stone-700 border-stone-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>
            {recommendation.separate_from_regular_trash
              ? 'Separate from household trash'
              : 'Can go into standard residual bin'}
          </span>
        </div>

        {recommendation.specialized_facility_required && (
          <div className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-50 text-violet-900 border border-violet-200 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-violet-600" />
            <span>Specialized facility required (Drop-off needed)</span>
          </div>
        )}
      </div>

      {/* Preparation Steps Checklist */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-emerald-600" />
          <span>Preparation Checklist Before Disposal</span>
        </h4>
        <div className="space-y-2">
          {recommendation.preparation_steps.map((step, idx) => {
            const isChecked = !!completedSteps[idx];
            return (
              <div
                key={idx}
                onClick={() => toggleStep(idx)}
                className={`p-3 rounded-xl border text-xs flex items-start gap-3 transition-colors cursor-pointer ${
                  isChecked
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                    : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                }`}
              >
                <button
                  type="button"
                  className="mt-0.5 text-emerald-700 shrink-0"
                  aria-label="Toggle step"
                >
                  {isChecked ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                  ) : (
                    <Square className="w-4 h-4 text-stone-400" />
                  )}
                </button>
                <span className={`flex-1 ${isChecked ? 'line-through text-stone-500' : ''}`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Warnings Banner */}
      {recommendation.safety_precautions && recommendation.safety_precautions.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
          <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Safety & Handling Precautions
          </h4>
          <ul className="space-y-1.5 text-xs text-amber-900 list-disc list-inside">
            {recommendation.safety_precautions.map((warn, idx) => (
              <li key={idx} className="leading-relaxed">
                {warn}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Environmental Impact Note */}
      {recommendation.environmental_impact && (
        <div className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-200 text-xs text-teal-950 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Environmental Benefit: </span>
            {recommendation.environmental_impact}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      {recommendation.disclaimer && (
        <p className="text-[11px] text-stone-400 italic">
          * {recommendation.disclaimer}
        </p>
      )}
    </div>
  );
};
