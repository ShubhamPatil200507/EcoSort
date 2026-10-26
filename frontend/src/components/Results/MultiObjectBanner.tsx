import React from 'react';
import { Layers, ArrowRight } from 'lucide-react';
import { DetectedObject } from '../../types';

interface MultiObjectBannerProps {
  detectedObjects: DetectedObject[];
  activeCategory: string;
  onSelectObject: (category: string) => void;
  separationInstructions?: string;
}

export const MultiObjectBanner: React.FC<MultiObjectBannerProps> = ({
  detectedObjects,
  activeCategory,
  onSelectObject,
  separationInstructions,
}) => {
  if (!detectedObjects || detectedObjects.length < 2) return null;

  return (
    <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4 shadow-sm mb-6 animate-fadeIn">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 mt-0.5">
          <Layers className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-200 text-indigo-900 border border-indigo-300">
              Multi-Object Scene Detected ({detectedObjects.length} Streams)
            </span>
            <span className="text-xs text-indigo-700 font-medium">
              Spatial Proposal Decomposition Active
            </span>
          </div>

          <h3 className="text-base font-bold text-gray-900 mt-1">
            Multiple distinct waste items found in this image
          </h3>

          <p className="text-xs text-gray-700 mt-1 leading-relaxed">
            {separationInstructions ||
              'Different waste materials detected across spatial regions. Click any item below to inspect its individual disposal route and authorized recycling centres:'}
          </p>

          {/* Detected Objects Grid */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {detectedObjects.map((obj, idx) => {
              const isActive = obj.category === activeCategory;
              return (
                <button
                  key={`${obj.category}-${idx}`}
                  type="button"
                  onClick={() => onSelectObject(obj.category)}
                  className={`text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-indigo-200/80 bg-white/70 hover:bg-white hover:border-indigo-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-gray-900">
                        {obj.display_name}
                      </span>
                      {isActive && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-100 text-indigo-800">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                      Region: {obj.region_name} • {(obj.confidence * 100).toFixed(0)}% conf
                    </div>
                  </div>
                  <ArrowRight className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
