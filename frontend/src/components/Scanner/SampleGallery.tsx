import React from 'react';
import { Cpu, BatteryCharging, Package, FileText, Shield, Wine, Apple, AlertTriangle, Shirt, Trash2, ArrowRight } from 'lucide-react';

interface SampleItem {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const SAMPLE_ITEMS: SampleItem[] = [
  {
    id: 'e_waste',
    name: 'Printed Circuit Board',
    category: 'E-Waste',
    description: 'Silicon IC chip with copper traces & gold contact pins',
    icon: <Cpu className="w-5 h-5 text-violet-600" />,
    color: 'border-violet-200 bg-violet-50/50 hover:border-violet-400',
  },
  {
    id: 'batteries',
    name: 'Cylindrical AA Battery',
    category: 'Batteries',
    description: 'Alkaline cell with positive terminal nipple',
    icon: <BatteryCharging className="w-5 h-5 text-red-600" />,
    color: 'border-red-200 bg-red-50/50 hover:border-red-400',
  },
  {
    id: 'plastic',
    name: 'PET Water Bottle',
    category: 'Plastic',
    description: 'Transparent polymer container with screw cap',
    icon: <Package className="w-5 h-5 text-sky-600" />,
    color: 'border-sky-200 bg-sky-50/50 hover:border-sky-400',
  },
  {
    id: 'paper_cardboard',
    name: 'Corrugated Box',
    category: 'Paper & Cardboard',
    description: 'Brown kraft cardboard packaging box with shipping label',
    icon: <FileText className="w-5 h-5 text-amber-600" />,
    color: 'border-amber-200 bg-amber-50/50 hover:border-amber-400',
  },
  {
    id: 'glass',
    name: 'Green Beverage Bottle',
    category: 'Glass',
    description: 'Molded cullet glass container with reflective highlights',
    icon: <Wine className="w-5 h-5 text-teal-600" />,
    color: 'border-teal-200 bg-teal-50/50 hover:border-teal-400',
  },
  {
    id: 'metal',
    name: 'Aluminum Beverage Can',
    category: 'Metal & Cans',
    description: 'Lightweight aluminum soda can with top pull tab',
    icon: <Shield className="w-5 h-5 text-slate-600" />,
    color: 'border-slate-200 bg-slate-50/50 hover:border-slate-400',
  },
  {
    id: 'organic_food',
    name: 'Fresh Apple Core',
    category: 'Organic / Food',
    description: 'Fruit compostable scrap with stem & leaf',
    icon: <Apple className="w-5 h-5 text-green-600" />,
    color: 'border-green-200 bg-green-50/50 hover:border-green-400',
  },
  {
    id: 'hazardous',
    name: 'Household Chemical Can',
    category: 'Hazardous Waste',
    description: 'Solvent canister with warning hazard diamond mark',
    icon: <AlertTriangle className="w-5 h-5 text-orange-600" />,
    color: 'border-orange-200 bg-orange-50/50 hover:border-orange-400',
  },
  {
    id: 'textile',
    name: 'Cotton T-Shirt',
    category: 'Textile',
    description: 'Fabric garment with stitched seams',
    icon: <Shirt className="w-5 h-5 text-pink-600" />,
    color: 'border-pink-200 bg-pink-50/50 hover:border-pink-400',
  },
  {
    id: 'general_residual',
    name: 'Multi-layer Foil Wrapper',
    category: 'General Residual',
    description: 'Composite non-recyclable metallized plastic snack bag',
    icon: <Trash2 className="w-5 h-5 text-stone-600" />,
    color: 'border-stone-200 bg-stone-50/50 hover:border-stone-400',
  },
];

interface SampleGalleryProps {
  onSelectSample: (sampleId: string) => void;
  isProcessing: boolean;
}

export const SampleGallery: React.FC<SampleGalleryProps> = ({ onSelectSample, isProcessing }) => {
  return (
    <div className="space-y-4">
      <div className="text-center max-w-md mx-auto">
        <p className="text-sm font-semibold text-stone-800">
          Try a Instant Benchmark Sample
        </p>
        <p className="text-xs text-stone-500 mt-0.5">
          Don't have an item nearby? Click any representative waste item below to test the trained MobileNetV3 classifier in real time.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 max-w-5xl mx-auto">
        {SAMPLE_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={isProcessing}
            onClick={() => onSelectSample(item.id)}
            className={`p-3.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between group cursor-pointer ${item.color} ${
              isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md hover:-translate-y-0.5'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-white shadow-xs">{item.icon}</div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500">
                  {item.category}
                </span>
              </div>
              <h4 className="text-xs font-bold text-stone-900 group-hover:text-emerald-900 line-clamp-1">
                {item.name}
              </h4>
              <p className="text-[11px] text-stone-500 mt-1 line-clamp-2">
                {item.description}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px] font-semibold text-emerald-800 group-hover:text-emerald-950">
              <span>Classify sample</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
