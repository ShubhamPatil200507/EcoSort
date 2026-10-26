import React, { useState } from 'react';
import { LocationProvider } from './context/LocationContext';
import { Header } from './components/Header/Header';
import { LocationModal } from './components/Location/LocationModal';
import { ScannerContainer } from './components/Scanner/ScannerContainer';
import { ResultsDashboard } from './components/Results/ResultsDashboard';
import { DisposalGuideView } from './components/Guide/DisposalGuideView';
import { CentresExplorerView } from './components/CentresExplorer/CentresExplorerView';
import { ModelTransparencyModal } from './components/ModelTransparency/ModelTransparencyModal';
import { ClassificationAndRecommendation, NavTab } from './types';
import {
  Sparkles, Camera, MapPin, ShieldCheck, ArrowDown,
  Recycle, HeartHandshake, Leaf, Cpu
} from 'lucide-react';

const MainContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('scan');
  const [activeResult, setActiveResult] = useState<ClassificationAndRecommendation | null>(null);
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);
  const [isModelModalOpen, setIsModelModalOpen] = useState<boolean>(false);

  const handleClassificationComplete = (
    result: ClassificationAndRecommendation,
    previewUrl: string
  ) => {
    setActiveResult(result);
    setActivePreviewUrl(previewUrl);
    // Ensure on scan tab
    setCurrentTab('scan');
    // Smooth scroll down to result
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  const handleResetScan = () => {
    setActiveResult(null);
    setActivePreviewUrl(null);
  };

  const handleScrollToScanner = () => {
    setCurrentTab('scan');
    const el = document.getElementById('scanner-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf9] text-stone-800 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Persistent Application Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
        }}
        onOpenModelModal={() => setIsModelModalOpen(true)}
      />

      {/* Main Body View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'scan' && (
          <div className="space-y-10">
            {/* Hero Section if no active scan */}
            {!activeResult && (
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-900 to-stone-900 text-white p-8 sm:p-12 shadow-xl border border-emerald-800">
                <div className="relative z-10 max-w-2xl space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-emerald-200">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Computer Vision Powered Environmental Sorting</span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                    Smart Waste Sorting & Responsible Disposal
                  </h1>

                  <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-xl">
                    Snap or upload any waste item. Our neural network classifies materials instantly and routes you to authorized nearby recycling facilities based on your location.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleScrollToScanner}
                      className="flex items-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-extrabold rounded-2xl shadow-lg hover:shadow-emerald-500/25 transition-all cursor-pointer"
                    >
                      <Camera className="w-5 h-5" />
                      <span>Scan Your Waste</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentTab('guide')}
                      className="flex items-center gap-2 px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-2xl border border-white/20 backdrop-blur-sm transition-colors cursor-pointer"
                    >
                      <span>Explore Disposal Guide</span>
                    </button>
                  </div>
                </div>

                {/* Subtle Decorative Elements */}
                <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
                <div className="absolute right-8 top-8 hidden lg:block opacity-15">
                  <Recycle className="w-64 h-64 text-white" />
                </div>
              </div>
            )}

            {/* If Result Active: Show Dashboard */}
            {activeResult && activePreviewUrl ? (
              <ResultsDashboard
                data={activeResult}
                previewUrl={activePreviewUrl}
                onReset={handleResetScan}
              />
            ) : (
              // Scanner Input Area
              <div id="scanner-section" className="space-y-6 pt-2">
                <div className="text-center max-w-xl mx-auto space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight text-stone-900">
                    Scan or Upload an Item
                  </h2>
                  <p className="text-xs text-stone-500">
                    Point your camera or select an image file to begin instant material classification.
                  </p>
                </div>

                <ScannerContainer onClassificationComplete={handleClassificationComplete} />

                {/* Features Value Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-stone-200">
                  <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-1">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-stone-900">10 Waste Streams</h4>
                    <p className="text-[11px] text-stone-500">
                      Trained on plastics, cardboard, glass, metals, e-waste, lithium batteries, food scraps, and hazardous items.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-1">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center mb-2">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-stone-900">Geospatial Routing</h4>
                    <p className="text-[11px] text-stone-500">
                      Discovers certified municipal MRFs, registered e-waste recyclers, and drop-off stations ranked by distance.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-1">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center mb-2">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-stone-900">Safety & Precautions</h4>
                    <p className="text-[11px] text-stone-500">
                      Step-by-step preparation checklists, fire warnings for damaged batteries, and toxic chemical safety notes.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentTab === 'guide' && <DisposalGuideView />}

        {currentTab === 'centres' && <CentresExplorerView />}
      </main>

      {/* Location Onboarding & Changer Modal */}
      <LocationModal />

      {/* Model Transparency Modal */}
      <ModelTransparencyModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
      />

      {/* Clean Footer */}
      <footer className="mt-16 border-t border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-700 flex items-center justify-center text-white">
              <Leaf className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-stone-800">EcoSort</span>
            <span>• Smart Waste AI Platform</span>
          </div>

          <div className="flex items-center gap-4 text-stone-600">
            <button
              onClick={() => setIsModelModalOpen(true)}
              className="hover:text-emerald-800 hover:underline cursor-pointer"
            >
              Model Architecture & Metrics
            </button>
            <span>•</span>
            <button
              onClick={() => setCurrentTab('guide')}
              className="hover:text-emerald-800 hover:underline cursor-pointer"
            >
              Disposal Guide
            </button>
            <span>•</span>
            <button
              onClick={() => setCurrentTab('centres')}
              className="hover:text-emerald-800 hover:underline cursor-pointer"
            >
              Centres Directory
            </button>
          </div>

          <p className="text-stone-400 text-[11px] text-center sm:text-right">
            Designed for environmental responsibility. Location stored in session only.
          </p>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <LocationProvider>
      <MainContent />
    </LocationProvider>
  );
}

export default App;
