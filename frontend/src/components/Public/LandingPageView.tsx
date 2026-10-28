import React from 'react';
import {
  ScanLine,
  ArrowRight,
  ShieldCheck,
  Scale,
  Cpu,
  MapPin,
  CheckCircle2,
  Sparkles,
  Layers,
  Compass,
  Zap,
  Leaf
} from 'lucide-react';
import { AppView } from '../../types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

interface LandingPageViewProps {
  onNavigate: (view: AppView) => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="pt-6 sm:pt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left 7 Columns: Messaging */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF4EC] border border-[#287A54]/25 text-xs font-semibold text-[#174D3A]">
                <Sparkles className="w-3.5 h-3.5 text-[#287A54]" />
                <span>Research-driven waste intelligence</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#17231D] tracking-tight leading-[1.1]">
                Know what it is. <br />
                <span className="text-[#287A54]">Know where it belongs.</span>
              </h1>

              <p className="text-sm sm:text-base text-[#66736B] leading-relaxed max-w-xl">
                EcoSort bridges neural vision with mathematical optimization. Decompose complex multi-object scenes, validate statutory disposal rules (CPCB 2022, SWM 2016), and compute exact minimum-stream assignments.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Button
                  variant="forest"
                  size="lg"
                  icon={<ScanLine className="w-5 h-5" />}
                  onClick={() => onNavigate('analysis')}
                  className="shadow-md hover:shadow-lg transition-all"
                >
                  Start Sorting
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => onNavigate('how-it-works')}
                >
                  See How It Works
                </Button>
              </div>

              {/* Verified Trust Tokens */}
              <div className="pt-4 flex flex-wrap items-center gap-5 text-xs text-[#66736B] border-t border-[#E1E7E0]">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#287A54]" />
                  <span>10 Statutory Streams</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#287A54]" />
                  <span>HiGHS Exact MILP Solver</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#287A54]" />
                  <span>Statutory Citations Included</span>
                </span>
              </div>
            </div>

            {/* Right 5 Columns: Truthful Interactive Preview Card */}
            <div className="lg:col-span-5">
              <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E1E7E0] shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E1E7E0]">
                  <span className="text-xs font-bold text-[#17231D] flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#287A54]" />
                    <span>Live Multi-Object Preview</span>
                  </span>
                  <Badge status="validated" label="MILP Optimal" size="sm" />
                </div>

                {/* Illustrative composite frame */}
                <div className="relative rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden h-56 flex items-center justify-center">
                  <img
                    src="/static/samples/multi_waste.jpg"
                    alt="Multi-object recyclable waste preview"
                    className="w-full h-full object-cover opacity-95 transition-opacity"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.dataset.retried) {
                        img.dataset.retried = 'true';
                        img.src = '/static/samples/multi_waste.jpg';
                      }
                    }}
                  />
                  {/* Overlay Boxes for real objects */}
                  <div className="absolute left-[3%] top-[14%] w-[28%] h-[72%] border-2 border-[#287A54] bg-[#287A54]/15 rounded-lg p-1.5 transition-all">
                    <span className="px-1.5 py-0.5 rounded bg-[#287A54] text-white text-[9px] font-bold shadow-xs">
                      #1 Cardboard (98%)
                    </span>
                  </div>
                  <div className="absolute left-[36%] top-[14%] w-[24%] h-[72%] border-2 border-[#174D3A] bg-[#174D3A]/15 rounded-lg p-1.5 transition-all">
                    <span className="px-1.5 py-0.5 rounded bg-[#174D3A] text-white text-[9px] font-bold shadow-xs">
                      #2 Metal Can (92%)
                    </span>
                  </div>
                  <div className="absolute right-[3%] top-[8%] w-[31%] h-[84%] border-2 border-[#285DA8] bg-[#285DA8]/15 rounded-lg p-1.5 transition-all">
                    <span className="px-1.5 py-0.5 rounded bg-[#285DA8] text-white text-[9px] font-bold shadow-xs">
                      #3 E-Waste PCB (85%)
                    </span>
                  </div>
                </div>

                {/* Compact Output Summary */}
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#F7F7F2] border border-[#E1E7E0] flex items-center justify-between">
                    <span className="text-[#66736B]">Prohibited Co-Disposals:</span>
                    <span className="font-bold text-[#287A54]">0 Violations (MILP Enforced)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F7F7F2] border border-[#E1E7E0] flex items-center justify-between">
                    <span className="text-[#66736B]">Assigned Streams:</span>
                    <span className="font-bold text-[#174D3A]">Dry Recyclables & Authorised E-Waste</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('analysis')}
                  className="w-full justify-center"
                >
                  Test with Your Own Photo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Solution (4 Ordered Steps) */}
      <section className="bg-white py-16 border-y border-[#E1E7E0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#287A54]">
              Structured Decision Pipeline
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#17231D] tracking-tight">
              From Visual Image to Verified Disposal Tour
            </h2>
            <p className="text-xs sm:text-sm text-[#66736B]">
              Ordinary classifiers produce isolated labels. EcoSort validates regulations and optimizes multi-stop collection.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-[#F7F7F2] border border-[#E1E7E0] space-y-3">
              <div className="w-9 h-9 rounded-xl bg-[#174D3A] text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="text-sm font-bold text-[#17231D]">Detect Individual Items</h3>
              <p className="text-xs text-[#66736B] leading-relaxed">
                Square letterboxing extracts localized proposals without distortion, returning calibrated probabilities.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F7F7F2] border border-[#E1E7E0] space-y-3">
              <div className="w-9 h-9 rounded-xl bg-[#174D3A] text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="text-sm font-bold text-[#17231D]">Verify Uncertain Items</h3>
              <p className="text-xs text-[#66736B] leading-relaxed">
                Autonomous LLM consensus agent audits user corrections against statutory text to prevent adversarial retraining.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F7F7F2] border border-[#E1E7E0] space-y-3">
              <div className="w-9 h-9 rounded-xl bg-[#174D3A] text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="text-sm font-bold text-[#17231D]">Apply Disposal Rules</h3>
              <p className="text-xs text-[#66736B] leading-relaxed">
                Deterministic rules derived from CPCB 2022 and SWM 2016 block prohibited co-disposals (e.g., batteries in landfills).
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F7F7F2] border border-[#E1E7E0] space-y-3">
              <div className="w-9 h-9 rounded-xl bg-[#174D3A] text-white flex items-center justify-center font-bold text-sm">
                4
              </div>
              <h3 className="text-sm font-bold text-[#17231D]">Plan Collection Route</h3>
              <p className="text-xs text-[#66736B] leading-relaxed">
                HiGHS MILP minimizes required bins, and graph TSP solves the optimal visiting order for certified drop-off centres.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Capabilities */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#287A54]">
            Technical Capabilities
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#17231D] tracking-tight">
            Engineered for Academic Credibility
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card padding="lg" className="space-y-3">
            <div className="w-9 h-9 rounded-xl bg-[#EAF4EC] text-[#174D3A] flex items-center justify-center">
              <Layers className="w-5 h-5 text-[#287A54]" />
            </div>
            <h3 className="text-sm font-bold text-[#17231D]">Multi-Object Saliency</h3>
            <p className="text-xs text-[#66736B] leading-relaxed">
              Hybrid anchor-free YOLOv8 and polarity-invariant Canny edge proposals accurately isolate overlapping items.
            </p>
          </Card>

          <Card padding="lg" className="space-y-3">
            <div className="w-9 h-9 rounded-xl bg-[#F0F5FD] text-[#285DA8] flex items-center justify-center">
              <Scale className="w-5 h-5 text-[#285DA8]" />
            </div>
            <h3 className="text-sm font-bold text-[#17231D]">HiGHS Integer Solver</h3>
            <p className="text-xs text-[#66736B] leading-relaxed">
              Mixed Integer Linear Programming eliminates heuristic guesswork, proving exact optimality across facility capacity limits.
            </p>
          </Card>

          <Card padding="lg" className="space-y-3">
            <div className="w-9 h-9 rounded-xl bg-[#FEF7EC] text-[#946200] flex items-center justify-center">
              <Compass className="w-5 h-5 text-[#946200]" />
            </div>
            <h3 className="text-sm font-bold text-[#17231D]">Geospatial TSP Routing</h3>
            <p className="text-xs text-[#66736B] leading-relaxed">
              Multi-stop Travelling Salesperson tour planning routes active streams to authorized local facilities by distance.
            </p>
          </Card>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#174D3A] text-white p-8 sm:p-12 text-center space-y-6 shadow-xl">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight max-w-xl mx-auto">
            Ready to test decision-aware waste sorting?
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-md mx-auto leading-relaxed">
            Upload your composite waste photo or browse verified collection centres in your area.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              icon={<ScanLine className="w-5 h-5" />}
              onClick={() => onNavigate('analysis')}
              className="bg-emerald-400 hover:bg-emerald-300 text-[#17231D] font-bold"
            >
              Open Analysis Studio
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => onNavigate('centres')}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              Centres Directory
            </Button>
          </div>
        </div>
      </section>

      {/* Comprehensive Public Footer */}
      <footer className="border-t border-[#E1E7E0] bg-white pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 text-xs">
            <div className="space-y-3 sm:col-span-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#174D3A] text-white flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-white" />
                </div>
                <span className="font-extrabold text-sm text-[#17231D]">EcoSort</span>
              </div>
              <p className="text-[11px] text-[#66736B] leading-relaxed">
                Research platform combining neural visual detection with integer programming for regulatory waste sorting.
              </p>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-[#17231D] uppercase text-[10px] tracking-wider block">
                Workspace
              </span>
              <ul className="space-y-1.5 text-[#66736B]">
                <li><button onClick={() => onNavigate('overview')} className="hover:text-[#174D3A] cursor-pointer">Overview</button></li>
                <li><button onClick={() => onNavigate('analysis')} className="hover:text-[#174D3A] cursor-pointer">New Analysis</button></li>
                <li><button onClick={() => onNavigate('history')} className="hover:text-[#174D3A] cursor-pointer">Session History</button></li>
                <li><button onClick={() => onNavigate('centres')} className="hover:text-[#174D3A] cursor-pointer">Centres Directory</button></li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-[#17231D] uppercase text-[10px] tracking-wider block">
                Platform Navigation
              </span>
              <ul className="space-y-1.5 text-[#66736B]">
                <li><button onClick={() => onNavigate('landing')} className="hover:text-[#174D3A] cursor-pointer">Home</button></li>
                <li><button onClick={() => onNavigate('how-it-works')} className="hover:text-[#174D3A] cursor-pointer">How It Works</button></li>
                <li><button onClick={() => onNavigate('centres')} className="hover:text-[#174D3A] cursor-pointer">Centres Directory</button></li>
                <li><button onClick={() => onNavigate('about')} className="hover:text-[#174D3A] cursor-pointer">About EcoSort</button></li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-[#17231D] uppercase text-[10px] tracking-wider block">
                Safety & Compliance
              </span>
              <p className="text-[11px] text-[#66736B] leading-relaxed">
                Indian SWM 2016, PWM 2016, and CPCB E-Waste 2022. Provides sorting decision support; does not replace industrial assessment.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-[#E1E7E0] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#66736B]">
            <span>&copy; {new Date().getFullYear()} EcoSort Platform. All rights reserved.</span>
            <span>Intelligent Waste Classification & Collection Routing</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
