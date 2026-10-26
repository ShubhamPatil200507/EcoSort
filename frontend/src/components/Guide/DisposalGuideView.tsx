import React, { useState, useEffect } from 'react';
import {
  BookOpen, Search, Filter, AlertTriangle, CheckCircle2,
  Layers, Package, FileText, Wine, Shield, Apple, Trash2,
  Cpu, BatteryCharging, Shirt, ChevronDown, ChevronUp
} from 'lucide-react';
import { getFullDisposalGuide } from '../../services/api';

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

export const DisposalGuideView: React.FC = () => {
  const [guideItems, setGuideItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    getFullDisposalGuide()
      .then((data) => {
        setGuideItems(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load guide:', err);
        setIsLoading(false);
      });
  }, []);

  const toggleExpand = (cat: string) => {
    setExpandedCard((prev) => (prev === cat ? null : cat));
  };

  const filteredItems = guideItems.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.primary_action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtypes.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in">
      {/* Title & Introduction */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Waste Sorting Reference</span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-stone-900">
          Responsible Disposal Guide
        </h2>
        <p className="text-sm text-stone-500">
          Standard preparation procedures, hazard precautions, and certified routes for all 10 waste streams.
        </p>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search material, subtype, or rules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-xl text-xs bg-stone-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-emerald-700 text-white'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            All Categories
          </button>
          {guideItems.map((item) => (
            <button
              key={item.category}
              onClick={() => setSelectedCategory(item.category)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors cursor-pointer ${
                selectedCategory === item.category
                  ? 'bg-emerald-700 text-white'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {item.display_name}
            </button>
          ))}
        </div>
      </div>

      {/* Guide Cards Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-stone-500 text-sm">Loading disposal guidelines...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredItems.map((item) => {
            const isExpanded = expandedCard === item.category;
            const icon = CATEGORY_ICONS[item.category] || <Trash2 className="w-5 h-5" />;

            return (
              <div
                key={item.category}
                className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-stone-50 border border-stone-200 shadow-2xs">
                      {icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-stone-900">{item.display_name}</h3>
                      <p className="text-xs text-stone-500 font-medium">
                        {item.recommended_disposal_route}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border ${
                      item.separate_from_regular_trash
                        ? 'bg-amber-50 text-amber-900 border-amber-200'
                        : 'bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    {item.separate_from_regular_trash ? 'Separate Waste' : 'Residual Bin'}
                  </span>
                </div>

                {/* Primary Action Box */}
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 font-medium leading-relaxed">
                  <span className="font-bold text-emerald-900">Direct Action: </span>
                  {item.primary_action}
                </div>

                {/* Subtypes tags */}
                <div className="flex flex-wrap gap-1.5">
                  {item.subtypes.map((sub: string, sIdx: number) => (
                    <span
                      key={sIdx}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-stone-100 text-stone-600 rounded-md border border-stone-200"
                    >
                      {sub.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>

                {/* Expand / Collapse Details Button */}
                <button
                  type="button"
                  onClick={() => toggleExpand(item.category)}
                  className="w-full pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors cursor-pointer"
                >
                  <span>{isExpanded ? 'Hide detailed steps & precautions' : 'View preparation steps & safety advice'}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isExpanded && (
                  <div className="pt-3 space-y-4 text-xs border-t border-stone-100 animate-in fade-in duration-200">
                    {/* Preparation Steps */}
                    <div>
                      <h4 className="font-bold text-stone-900 mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Preparation Steps</span>
                      </h4>
                      <ul className="space-y-1.5 text-stone-600 list-disc list-inside">
                        {item.preparation_steps.map((step: string, idx: number) => (
                          <li key={idx} className="leading-relaxed">
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Safety Warnings */}
                    {item.safety_precautions && item.safety_precautions.length > 0 && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                        <h4 className="font-bold text-amber-950 mb-1 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Safety Warnings</span>
                        </h4>
                        <ul className="space-y-1 text-amber-900 list-disc list-inside">
                          {item.safety_precautions.map((warn: string, idx: number) => (
                            <li key={idx} className="leading-relaxed">
                              {warn}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Environmental Note */}
                    {item.environmental_impact && (
                      <p className="text-stone-500 italic">
                        <span className="font-semibold text-stone-700">Impact: </span>
                        {item.environmental_impact}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
