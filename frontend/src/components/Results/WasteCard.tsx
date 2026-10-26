import React from 'react';
import {
  Package, FileText, Wine, Shield, Apple, Trash2, Cpu,
  BatteryCharging, Shirt, AlertTriangle, AlertCircle, HelpCircle, Sparkles
} from 'lucide-react';
import { ClassificationResult } from '../../types';
import { formatSubtype } from '../../utils/formatters';

interface WasteCardProps {
  classification: ClassificationResult;
  previewUrl: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  batteries: <BatteryCharging className="w-5 h-5 text-red-600" />,
  e_waste: <Cpu className="w-5 h-5 text-violet-600" />,
  plastic: <Package className="w-5 h-5 text-sky-600" />,
  paper_cardboard: <FileText className="w-5 h-5 text-amber-600" />,
  glass: <Wine className="w-5 h-5 text-teal-600" />,
  metal: <Shield className="w-5 h-5 text-slate-600" />,
  organic_food: <Apple className="w-5 h-5 text-green-600" />,
  hazardous: <AlertTriangle className="w-5 h-5 text-orange-600" />,
  textile: <Shirt className="w-5 h-5 text-pink-600" />,
  general_residual: <Trash2 className="w-5 h-5 text-stone-600" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  batteries: 'bg-red-50 text-red-800 border-red-200',
  e_waste: 'bg-violet-50 text-violet-800 border-violet-200',
  plastic: 'bg-sky-50 text-sky-800 border-sky-200',
  paper_cardboard: 'bg-amber-50 text-amber-800 border-amber-200',
  glass: 'bg-teal-50 text-teal-800 border-teal-200',
  metal: 'bg-slate-50 text-slate-800 border-slate-200',
  organic_food: 'bg-green-50 text-green-800 border-green-200',
  hazardous: 'bg-orange-50 text-orange-800 border-orange-200',
  textile: 'bg-pink-50 text-pink-800 border-pink-200',
  general_residual: 'bg-stone-50 text-stone-800 border-stone-200',
};

export const WasteCard: React.FC<WasteCardProps> = ({ classification, previewUrl }) => {
  const icon = CATEGORY_ICONS[classification.predicted_category] || <Trash2 className="w-5 h-5" />;
  const colorBadge = CATEGORY_COLORS[classification.predicted_category] || 'bg-stone-50 text-stone-800 border-stone-200';
  const confidencePercent = (classification.confidence * 100).toFixed(1);

  return (
    <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row gap-5 items-start">
        {/* Scanned Image Preview */}
        <div className="relative w-full sm:w-44 h-44 rounded-2xl overflow-hidden bg-stone-900 border border-stone-200 shadow-xs shrink-0 flex items-center justify-center">
          <img
            src={previewUrl}
            alt="Scanned waste"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-xs rounded-md text-[10px] text-white font-mono">
            {classification.inference_time_ms} ms
          </div>
        </div>

        {/* Identification Summary */}
        <div className="flex-1 space-y-3 w-full">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${colorBadge}`}>
              {icon}
              <span>{classification.display_name}</span>
            </span>

            {classification.subtype && (
              <span className="text-xs px-2.5 py-1 bg-stone-100 text-stone-700 font-medium rounded-lg border border-stone-200">
                {formatSubtype(classification.subtype)}
              </span>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">
              {classification.display_name}
            </h2>
            <p className="text-xs text-stone-600 mt-1">
              {classification.explanation}
            </p>
          </div>

          {/* Confidence Meter */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Model Confidence
              </span>
              <span className="font-bold font-mono text-emerald-700">
                {confidencePercent}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
              <div
                className={`h-full transition-all duration-700 ${
                  classification.confidence >= 0.8
                    ? 'bg-emerald-600'
                    : classification.confidence >= 0.6
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, classification.confidence * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Visual Uncertainty Note */}
      {classification.visual_uncertainty_note && (
        <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl flex items-start gap-2.5 text-xs text-stone-600">
          <HelpCircle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-stone-800">Visual Nuance Note: </span>
            {classification.visual_uncertainty_note}
          </div>
        </div>
      )}

      {/* Alternative Predictions Breakdown */}
      {classification.alternative_predictions && classification.alternative_predictions.length > 0 && (
        <div className="pt-3 border-t border-stone-100 space-y-2">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            Alternative Possibilities
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {classification.alternative_predictions.map((alt, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs flex items-center justify-between"
              >
                <span className="font-medium text-stone-700 truncate pr-2">
                  {alt.display_name}
                </span>
                <span className="font-mono text-stone-500 text-[11px] font-semibold">
                  {alt.percentage}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
