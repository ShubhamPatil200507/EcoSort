import React, { useState, useEffect } from 'react';
import { Flag, Printer, ArrowLeft, Check, Share2, Sparkles } from 'lucide-react';
import { ClassificationAndRecommendation, ClarificationOption } from '../../types';
import { WasteCard } from './WasteCard';
import { ActionChecklist } from './ActionChecklist';
import { ClarificationCard } from './ClarificationCard';
import { MultiObjectBanner } from './MultiObjectBanner';
import { DiscreteMathAuditView } from './DiscreteMathAuditView';
import { CentresMap } from '../Map/CentresMap';
import { FeedbackModal } from './FeedbackModal';
import { getDisposalRecommendation, resolveClarification } from '../../services/api';
import { useLocation } from '../../context/LocationContext';

interface ResultsDashboardProps {
  data: ClassificationAndRecommendation;
  previewUrl: string;
  onReset: () => void;
}

const CATEGORY_CHIPS = [
  { id: 'plastic', label: '🥤 Plastic' },
  { id: 'paper_cardboard', label: '📦 Cardboard/Paper' },
  { id: 'glass', label: '🍾 Glass' },
  { id: 'metal', label: '🥫 Metal/Can' },
  { id: 'e_waste', label: '📱 E-Waste' },
  { id: 'batteries', label: '🔋 Batteries' },
  { id: 'organic_food', label: '🍎 Food/Organic' },
  { id: 'hazardous', label: '☣️ Hazardous' },
  { id: 'textile', label: '👕 Textile' },
  { id: 'general_residual', label: '🗑️ General Waste' },
];

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  data,
  previewUrl,
  onReset,
}) => {
  const { location } = useLocation();
  const [currentData, setCurrentData] = useState<ClassificationAndRecommendation>(data);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    setCurrentData(data);
  }, [data]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `EcoSort: ${currentData.classification.display_name}`,
        text: `I used EcoSort to classify ${currentData.classification.display_name}. Disposal recommendation: ${currentData.recommendation.primary_action}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `EcoSort Waste Classification:\nItem: ${currentData.classification.display_name}\nRecommended Route: ${currentData.recommendation.primary_action}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSwitchCategory = async (newCategory: string) => {
    if (newCategory === currentData.classification.predicted_category) return;
    setIsSwitching(true);
    try {
      const newRec = await getDisposalRecommendation(newCategory);
      setCurrentData({
        ...currentData,
        classification: {
          ...currentData.classification,
          predicted_category: newCategory,
          display_name: newRec.display_name,
          confidence: 0.95,
          is_confident: true,
          status: 'success',
          explanation: `Manually verified as ${newRec.display_name} by user.`,
        },
        recommendation: newRec,
      });
    } catch (err) {
      console.error('Failed to switch category:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleResolveClarification = async (option: ClarificationOption) => {
    if (!currentData.agent_decision?.clarification_prompt) return;
    setIsResolving(true);
    try {
      const resolved = await resolveClarification({
        clarification_id: currentData.agent_decision.clarification_prompt.clarification_id,
        option_id: option.id,
        predicted_category: currentData.classification.predicted_category,
        subtype: currentData.classification.subtype,
        confidence: currentData.classification.confidence,
        attributes: option.attributes,
        location_available: !!(location.latitude && location.longitude),
        user_lat: location.latitude,
        user_lon: location.longitude,
      });
      setCurrentData(resolved);
    } catch (err) {
      console.error('Clarification resolution failed:', err);
    } finally {
      setIsResolving(false);
    }
  };

  const clarificationPrompt = currentData.agent_decision?.clarification_prompt;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-stone-200">
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Scan Another Item</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-medium rounded-xl transition-colors cursor-pointer"
            title="Share or copy disposal summary"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Share'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-medium rounded-xl transition-colors cursor-pointer hidden sm:flex"
            title="Print disposal card"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFeedbackOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 hover:text-stone-900 text-xs font-medium rounded-xl transition-colors cursor-pointer"
            title="Report an inaccurate classification"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Report Error</span>
          </button>
        </div>
      </div>

      {/* Ambiguity Resolution / Clarification Card */}
      {clarificationPrompt && (
        <ClarificationCard
          prompt={clarificationPrompt}
          onResolve={handleResolveClarification}
          isResolving={isResolving}
        />
      )}

      {/* Multi-Object Scene Banner */}
      {currentData.classification.is_multi_object && currentData.classification.detected_objects && currentData.classification.detected_objects.length > 1 && (
        <MultiObjectBanner
          detectedObjects={currentData.classification.detected_objects}
          activeCategory={currentData.classification.predicted_category}
          onSelectObject={handleSwitchCategory}
          separationInstructions={currentData.agent_decision?.separation_instructions}
        />
      )}

      {/* Quick Category Override / Switcher Bar */}
      <div className="p-3.5 rounded-2xl bg-stone-100/80 border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 text-stone-700 shrink-0">
          <Sparkles className="w-4 h-4 text-emerald-700" />
          <span className="font-bold">Not quite right?</span>
          <span className="text-stone-500 hidden md:inline">Click to switch category:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {CATEGORY_CHIPS.map((chip) => {
            const isActive = chip.id === currentData.classification.predicted_category;
            return (
              <button
                key={chip.id}
                type="button"
                disabled={isSwitching}
                onClick={() => handleSwitchCategory(chip.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white hover:bg-stone-200 text-stone-700 border border-stone-200'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Results Grid: WasteCard & ActionChecklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5">
          <WasteCard
            classification={currentData.classification}
            previewUrl={previewUrl}
          />
        </div>
        <div className="lg:col-span-7">
          <ActionChecklist recommendation={currentData.recommendation} />
        </div>
      </div>

      {/* Discrete Mathematics & Reasoning Audit Panel */}
      <DiscreteMathAuditView
        decision={currentData.agent_decision}
        auditData={currentData.discrete_math_audit}
      />

      {/* Nearby Disposal Centres Section */}
      <div className="pt-2 space-y-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-stone-900">
            Find an Authorized Disposal Centre
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Verified local facilities accepting {currentData.classification.display_name.toLowerCase()} near your selected location.
          </p>
        </div>

        <CentresMap
          key={currentData.classification.predicted_category}
          initialCategory={currentData.classification.predicted_category}
          defaultRadius={25}
        />
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        predictedCategory={currentData.classification.predicted_category}
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </div>
  );
};
