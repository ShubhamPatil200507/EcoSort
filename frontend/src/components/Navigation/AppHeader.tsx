import React from 'react';
import {
  Menu,
  MapPin,
  ScanLine,
  Leaf,
} from 'lucide-react';
import { AppView } from '../../types';
import { useLocation } from '../../context/LocationContext';
import { Button } from '../common/Button';

interface AppHeaderProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenMobileSidebar?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentView,
  onNavigate,
  onOpenMobileSidebar,
}) => {
  const { location, openOnboarding } = useLocation();

  const isPublicView = ['landing', 'how-it-works', 'about'].includes(currentView);

  if (isPublicView) {
    return (
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E1E7E0] shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand Identity */}
            <button
              type="button"
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-2.5 cursor-pointer text-left rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174D3A]"
              aria-label="EcoSort Home"
            >
              <div className="w-9 h-9 rounded-xl bg-[#174D3A] text-white flex items-center justify-center shadow-xs">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight text-[#17231D]">EcoSort</span>
                <span className="text-[10px] ml-1.5 px-2 py-0.5 rounded-full bg-[#EAF4EC] text-[#174D3A] font-semibold">
                  Intelligent Sorting
                </span>
              </div>
            </button>

            {/* Center: Public Links */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                type="button"
                onClick={() => onNavigate('landing')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  currentView === 'landing'
                    ? 'text-[#174D3A] bg-[#EAF4EC]'
                    : 'text-[#66736B] hover:text-[#17231D] hover:bg-stone-50'
                }`}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => onNavigate('how-it-works')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  currentView === 'how-it-works'
                    ? 'text-[#174D3A] bg-[#EAF4EC]'
                    : 'text-[#66736B] hover:text-[#17231D] hover:bg-stone-50'
                }`}
              >
                How It Works
              </button>
              <button
                type="button"
                onClick={() => onNavigate('about')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  currentView === 'about'
                    ? 'text-[#174D3A] bg-[#EAF4EC]'
                    : 'text-[#66736B] hover:text-[#17231D] hover:bg-stone-50'
                }`}
              >
                About
              </button>
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-2.5">
              <Button
                variant="forest"
                size="sm"
                icon={<ScanLine className="w-4 h-4" />}
                onClick={() => onNavigate('overview')}
              >
                Open Workspace
              </Button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Workspace View Header (with sidebar offset on desktop)
  const viewTitles: Record<string, { title: string; category: string }> = {
    overview: { title: 'Workspace Overview', category: 'System Dashboard' },
    analysis: { title: 'Waste Analysis Studio', category: 'Core Workflow' },
    history: { title: 'Analysis History & Audits', category: 'Persisted Records' },
    centres: { title: 'Collection Centres Directory', category: 'Geospatial Directory' },
    settings: { title: 'Settings & Privacy', category: 'System Configuration' },
  };

  const currentMeta = viewTitles[currentView] || { title: 'EcoSort Workspace', category: 'Workspace' };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E1E7E0] shadow-2xs">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile hamburger & Page Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              className="lg:hidden p-2 rounded-xl text-[#17231D] hover:bg-stone-100 cursor-pointer"
              aria-label="Open sidebar navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#66736B]">
                {currentMeta.category}
              </div>
              <h1 className="text-sm sm:text-base font-bold text-[#17231D] tracking-tight">
                {currentMeta.title}
              </h1>
            </div>
          </div>

          {/* Right: Location, Health, and Action */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Location Pill */}
            <button
              type="button"
              onClick={openOnboarding}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium bg-[#F7F7F2] hover:bg-[#EAF4EC] border border-[#E1E7E0] text-[#17231D] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174D3A]"
              title="Click to change location or view coordinates"
              aria-label="Change current user location"
            >
              <MapPin className="w-3.5 h-3.5 text-[#287A54]" />
              <span className="max-w-[110px] sm:max-w-[160px] truncate">
                {location.isLoaded && location.city ? location.city : 'Pune'}
              </span>
              {location.source === 'gps' && (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                  GPS
                </span>
              )}
            </button>



            {/* Primary Action Button */}
            {currentView !== 'analysis' && (
              <Button
                variant="forest"
                size="sm"
                icon={<ScanLine className="w-3.5 h-3.5" />}
                onClick={() => onNavigate('analysis')}
              >
                New Analysis
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
