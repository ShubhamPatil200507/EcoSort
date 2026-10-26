import React, { useState } from 'react';
import { X, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { submitFeedback } from '../../services/api';

interface FeedbackModalProps {
  predictedCategory: string;
  isOpen: boolean;
  onClose: () => void;
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
}) => {
  const [suggestedCategory, setSuggestedCategory] = useState<string>('');
  const [comments, setComments] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestedCategory) {
      setError('Please select what this item actually is.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await submitFeedback(predictedCategory, suggestedCategory, comments);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900">
              Report Inaccurate Prediction
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Help us calibrate our computer vision model.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-stone-900">Thank you for your feedback!</p>
            <p className="text-xs text-stone-500">
              Your submission has been logged to retrain and calibrate the EcoSort classifier.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Model Predicted:
              </label>
              <div className="px-3 py-2 bg-stone-100 rounded-xl text-xs font-mono font-medium text-stone-800">
                {predictedCategory.replace(/_/g, ' ').toUpperCase()}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                What is this item actually? <span className="text-red-500">*</span>
              </label>
              <select
                value={suggestedCategory}
                onChange={(e) => setSuggestedCategory(e.target.value)}
                className="w-full px-3 py-2.5 border border-stone-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="">-- Select true category --</option>
                {ALL_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Additional Comments (Optional):
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="e.g., This is a glass bottle with dark amber tint, not an aluminum can."
                rows={3}
                className="w-full p-3 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Submitting...' : 'Send Feedback'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
