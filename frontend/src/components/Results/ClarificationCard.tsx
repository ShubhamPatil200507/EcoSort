import React, { useState } from 'react';
import { ClarificationPrompt, ClarificationOption } from '../../types';

interface ClarificationCardProps {
  prompt: ClarificationPrompt;
  onResolve: (option: ClarificationOption) => Promise<void>;
  isResolving?: boolean;
}

export const ClarificationCard: React.FC<ClarificationCardProps> = ({
  prompt,
  onResolve,
  isResolving = false,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  const handleSelect = (option: ClarificationOption) => {
    setSelectedOptionId(option.id);
    onResolve(option);
  };

  return (
    <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-md mb-6 animate-fadeIn">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xl shrink-0">
          ?
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-200 text-amber-900 border border-amber-300">
              Agent Clarification Required
            </span>
            {prompt.affects_safety && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-300">
                Safety-Critical
              </span>
            )}
            <span className="text-xs text-amber-700 font-mono">
              [{prompt.clarification_id}]
            </span>
          </div>

          <h3 className="text-lg font-bold text-gray-900 mt-1">
            {prompt.question}
          </h3>
          <p className="text-sm text-gray-700 mt-1 leading-relaxed">
            {prompt.reason}
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {prompt.options.map((option) => {
              const isSelected = selectedOptionId === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={isResolving}
                  onClick={() => handleSelect(option)}
                  className={`text-left p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm'
                      : 'border-amber-200 bg-white hover:border-amber-400 hover:bg-amber-50/50 text-gray-800'
                  } ${isResolving ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="font-semibold text-sm flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center text-xs">
                      {isSelected ? '✓' : ''}
                    </span>
                    {option.label}
                  </div>
                  {option.description && (
                    <p className="text-xs text-gray-500 mt-1.5 pl-6">
                      {option.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {isResolving && (
            <div className="mt-3 text-xs text-amber-800 flex items-center gap-2 font-medium">
              <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full" />
              Evaluating discrete mathematical rules with updated attributes...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
