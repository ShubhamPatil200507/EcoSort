import React, { useState, useEffect } from 'react';
import { Leaf, MapPin, Scan, BookOpen, Compass, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLocation } from '../../context/LocationContext';
import { checkHealth } from '../../services/api';
import { NavTab } from '../../types';

interface HeaderProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenModelModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab, onOpenModelModal }) => {
  const { location, openOnboarding } = useLocation();
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    checkHealth()
      .then(() => setIsOnline(true))
      .catch(() => setIsOnline(false));

    const interval = setInterval(() => {
      checkHealth()
        .then(() => setIsOnline(true))
        .catch(() => setIsOnline(false));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('scan')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 to-teal-600 flex items-center justify-center shadow-md">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-stone-900">EcoSort</span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-full">
                  Smart Waste AI
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden md:block">
                Identify waste & discover local disposal routes
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              onClick={() => onSelectTab('scan')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'scan'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              <Scan className="w-4 h-4" />
              <span>Scan Waste</span>
            </button>
            <button
              onClick={() => onSelectTab('guide')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'guide'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Disposal Guide</span>
            </button>
            <button
              onClick={() => onSelectTab('centres')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'centres'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Nearby Centres</span>
            </button>
          </nav>

          {/* Right Header Elements: Location Pill & Health */}
          <div className="flex items-center gap-2.5">
            {/* Persistent Location Pill */}
            <button
              onClick={openOnboarding}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-xs font-medium text-stone-800 transition-colors cursor-pointer group"
              title="Click to change your location"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="max-w-[120px] sm:max-w-[160px] truncate">
                {location.city || 'Set Location'}
              </span>
              <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold border-l border-stone-300 pl-1.5">
                Change
              </span>
            </button>

            {/* Model Architecture & Transparency Button */}
            <button
              onClick={onOpenModelModal}
              className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 transition-colors"
              title="Model architecture, dataset, & evaluation report"
            >
              <Info className="w-4 h-4" />
            </button>

            {/* Service Status */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
              title={isOnline ? 'EcoSort ML & Geocoding backend active' : 'Backend connection disconnected'}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-600 animate-pulse' : 'bg-red-600'}`} />
              <span>{isOnline ? 'Model Active' : 'Offline'}</span>
            </div>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden border-t border-stone-100 py-2 justify-around">
          <button
            onClick={() => onSelectTab('scan')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium ${
              currentTab === 'scan' ? 'bg-emerald-100 text-emerald-900' : 'text-stone-600'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            Scan
          </button>
          <button
            onClick={() => onSelectTab('guide')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium ${
              currentTab === 'guide' ? 'bg-emerald-100 text-emerald-900' : 'text-stone-600'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Guide
          </button>
          <button
            onClick={() => onSelectTab('centres')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium ${
              currentTab === 'centres' ? 'bg-emerald-100 text-emerald-900' : 'text-stone-600'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Centres
          </button>
        </div>
      </div>
    </header>
  );
};
