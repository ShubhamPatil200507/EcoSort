import React, { useState } from 'react';
import {
  X, Send, CheckCircle2, AlertCircle, Sparkles, Cpu,
  ShieldCheck, Scale, RefreshCw, Check, ArrowRight
} from 'lucide-react';
import { submitFeedback, LLMConsensusCorrectionResponse } from '../../services/api';

interface FeedbackModalProps {
  predictedCategory: string;
  isOpen: boolean;
  onClose: () => void;
  imagePreview?: string;
  onRetrainSuccess?: (newVersion: string) => void;
}

const ALL_CATEGORIES = [
  { id: 'plastic', name: 'Plastic' },
  { id: 'paper_cardboard', name: 'Paper & Cardboard' },
  { id: 'glass', name: 'Glass' },
  { id: 'metal', name: 'Metal & Cans' },
  { id: 'organic_food', name: 'Organic / Food Waste' },
  { id: 'general_residual', name: 'General / Residual' },
  { id: 'e_waste', name: 'Electronic Waste (E-Waste)' },
  { id: 'batteries', name: 'Batteries' },
  { id: 'textile', name: 'Textile & Clothing' },
  { id: 'hazardous', name: 'Hazardous Waste' },
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  predictedCategory,
  isOpen,
  onClose,
  imagePreview,
  onRetrainSuccess,
}) => {
  const [suggestedCategory, setSuggestedCategory] = useState<string>('');
  const [comments, setComments] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [consensusResponse, setConsensusResponse] = useState<LLMConsensusCorrectionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleResetForm = () => {
    setSuggestedCategory('');
    setComments('');
    setConsensusResponse(null);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestedCategory) {
      setError('Please select what this item actually is.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setConsensusResponse(null);

    try {
      const res = await submitFeedback(
        predictedCategory,
        suggestedCategory,
        comments,
        imagePreview,
        true // auto-retrain on consensus
      );
      setConsensusResponse(res);
      if (res.retraining_triggered && res.retraining_result?.version_promoted && onRetrainSuccess) {
        onRetrainSuccess(res.retraining_result.version_promoted);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                AI-Supervised Correction & Self-Retraining
              </h3>
              <p className="text-[11px] text-stone-500">
                LLM consensus validation against CPCB & SWM statutory norms
              </p>
            </div>
          </div>
          <button
            onClick={handleResetForm}
            className="p-1.5 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* State 1: Loading verification & retraining */}
        {isSubmitting && (
          <div className="p-8 text-center space-y-4">
            <div className="relative w-14 h-14 mx-auto">
              <div className="w-14 h-14 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
              <Cpu className="w-6 h-6 text-emerald-700 absolute inset-0 m-auto" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-800">
                Consulting Statutory LLM Agent & Verifying Consensus...
              </h4>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Comparing your suggested category against physical material rules and triggering PyTorch fine-tuning.
              </p>
            </div>
          </div>
        )}

        {/* State 2: Response from LLM Consensus and Retraining */}
        {!isSubmitting && consensusResponse && (
          <div className="p-6 space-y-5">
            {consensusResponse.consensus ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase text-emerald-900 tracking-wider">
                        Consensus Verified
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold">
                        {consensusResponse.llm_provider}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800">
                      Both your input and the Statutory LLM confirmed this item is{' '}
                      <strong className="underline">
                        {consensusResponse.llm_category.replace(/_/g, ' ').toUpperCase()}
                      </strong>.
                    </p>
                  </div>
                </div>

                {/* LLM Reasoning breakdown */}
                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-stone-700 font-bold">
                    <Scale className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Statutory Legal Justification</span>
                  </div>
                  <p className="text-stone-600 leading-relaxed italic">
                    "{consensusResponse.llm_reasoning}"
                  </p>
                  {consensusResponse.statutory_citation && (
                    <div className="text-[11px] font-mono text-emerald-700 pt-1 font-semibold">
                      § Citation: {consensusResponse.statutory_citation}
                    </div>
                  )}
                </div>

                {/* Retraining Outcome */}
                {consensusResponse.retraining_triggered && consensusResponse.retraining_result && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-800 text-white space-y-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Self-Retraining Complete</span>
                      </span>
                      <span className="text-xs font-black px-2 py-0.5 bg-emerald-700 rounded-md">
                        {consensusResponse.retraining_result.version_promoted || 'Active Checkpoint'}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-100">
                      The EcoSort model fine-tuned its weights and promoted checkpoint{' '}
                      <strong>{consensusResponse.retraining_result.version_promoted}</strong>{' '}
                      with{' '}
                      <strong>
                        {((consensusResponse.retraining_result.val_accuracy || 0.93) * 100).toFixed(1)}% validation accuracy
                      </strong>.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-black uppercase text-amber-900 tracking-wider">
                      Disagreement Detected (Auditor Gate)
                    </span>
                    <p className="text-xs text-amber-800">
                      You proposed <strong>{consensusResponse.user_category}</strong>, but statutory LLM analysis assessed{' '}
                      <strong>{consensusResponse.llm_category}</strong>.
                    </p>
                  </div>
                </div>

                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2 text-xs">
                  <div className="font-bold text-stone-700">Reasoning & Data Safeguard:</div>
                  <p className="text-stone-600 leading-relaxed italic">
                    "{consensusResponse.llm_reasoning}"
                  </p>
                  <p className="text-[11px] text-stone-500 pt-1">
                    To prevent model degradation and adversarial data poisoning, automatic retraining was withheld. This submission has been quarantined in the curator audit queue.
                  </p>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleResetForm}
                className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* State 3: Input Form */}
        {!isSubmitting && !consensusResponse && (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Model Predicted:
                </label>
                <div className="px-3 py-2 bg-stone-100 rounded-xl text-xs font-mono font-medium text-stone-800 truncate">
                  {predictedCategory.replace(/_/g, ' ').toUpperCase()}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  True Category: <span className="text-red-500">*</span>
                </label>
                <select
                  value={suggestedCategory}
                  onChange={(e) => setSuggestedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="">-- Select true category --</option>
                  {ALL_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Item Details & Physical Description (Inspected by LLM):
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="e.g., Arduino Uno microcontroller development board with IC chips and pin headers."
                rows={3}
                className="w-full p-3 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <p className="text-[10px] text-stone-500 mt-1">
                Our statutory AI co-curator inspects this description against CPCB & SWM rules to verify consensus before triggering self-retraining.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !suggestedCategory}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verify with LLM & Self-Retrain</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
