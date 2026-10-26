import React, { useState } from 'react';
import { RefreshCw, Flag, Printer, ArrowLeft, Check, Share2 } from 'lucide-react';
import { ClassificationAndRecommendation } from '../../types';
import { WasteCard } from './WasteCard';
import { ActionChecklist } from './ActionChecklist';
import { CentresMap } from '../Map/CentresMap';
import { FeedbackModal } from './FeedbackModal';

interface ResultsDashboardProps {
  data: ClassificationAndRecommendation;
  previewUrl: string;
  onReset: () => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  data,
  previewUrl,
  onReset,
}) => {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `EcoSort: ${data.classification.display_name}`,
        text: `I used EcoSort to classify ${data.classification.display_name}. Disposal recommendation: ${data.recommendation.primary_action}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `EcoSort Waste Classification:\nItem: ${data.classification.display_name}\nRecommended Route: ${data.recommendation.primary_action}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
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

      {/* Main Results Grid: WasteCard & ActionChecklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5">
          <WasteCard
            classification={data.classification}
            previewUrl={previewUrl}
          />
        </div>
        <div className="lg:col-span-7">
          <ActionChecklist recommendation={data.recommendation} />
        </div>
      </div>

      {/* Nearby Disposal Centres Section */}
      <div className="pt-4 space-y-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-stone-900">
            Find an Authorized Disposal Centre
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Verified local facilities accepting {data.classification.display_name.toLowerCase()} near your selected location.
          </p>
        </div>

        <CentresMap
          initialCategory={data.classification.predicted_category}
          defaultRadius={25}
        />
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        predictedCategory={data.classification.predicted_category}
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </div>
  );
};
