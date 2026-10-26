import React, { useState } from 'react';
import { MapPin, Navigation, Search, AlertCircle, ShieldCheck, X, Check } from 'lucide-react';
import { useLocation } from '../../context/LocationContext';
import { searchLocation } from '../../services/api';
import { GeocodeResult } from '../../types';

const POPULAR_LOCATIONS: { name: string; query: string }[] = [
  { name: 'Mumbai', query: 'Mumbai' },
  { name: 'Bengaluru', query: 'Bengaluru' },
  { name: 'New Delhi', query: 'Delhi' },
  { name: 'New York', query: 'New York' },
  { name: 'London', query: 'London' },
  { name: 'San Francisco', query: 'San Francisco' },
  { name: 'Berlin', query: 'Berlin' },
];

export const LocationModal: React.FC = () => {
  const {
    location,
    isOnboardingOpen,
    isLocating,
    closeOnboarding,
    requestBrowserLocation,
    setManualLocation,
    skipLocation,
  } = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  if (!isOnboardingOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await searchLocation(searchQuery);
      if (results.length === 0) {
        setSearchError(`No location results found for "${searchQuery}". Please try another city or PIN code.`);
      } else {
        setSearchResults(results);
      }
    } catch (err: any) {
      setSearchError(err.message || 'Location search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPopular = async (query: string) => {
    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await searchLocation(query);
      if (results.length > 0) {
        setManualLocation(results[0]);
      }
    } catch (err: any) {
      setSearchError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header decoration banner */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-6 text-white text-center relative">
          <button
            onClick={closeOnboarding}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-white/20">
            <MapPin className="w-7 h-7 text-emerald-300" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Let's find the right place for your waste.
          </h2>
          <p className="mt-2 text-sm text-emerald-100 max-w-sm mx-auto">
            Discover nearby recycling facilities and responsible disposal options based on your location.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Error notice if location permission failed */}
          {location.error && (
            <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-950">Location Request Note</p>
                <p className="mt-0.5">{location.error}</p>
              </div>
            </div>
          )}

          {/* Option A: Browser Geolocation Button */}
          <div>
            <button
              onClick={() => requestBrowserLocation()}
              disabled={isLocating}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-150 disabled:opacity-60 cursor-pointer"
            >
              <Navigation className={`w-5 h-5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Detecting your coordinates...' : 'Use my current location'}</span>
            </button>
            <p className="mt-1.5 text-xs text-center text-stone-500">
              Your browser will prompt for permission only after clicking.
            </p>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-stone-200 w-full" />
            <span className="bg-white px-3 text-xs font-medium text-stone-500 uppercase tracking-wider">
              Or enter manually
            </span>
            <div className="border-t border-stone-200 w-full" />
          </div>

          {/* Option B: Manual Search */}
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Enter PIN code or city (e.g. 400053, Mumbai, London)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-24 py-3 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent bg-stone-50"
              />
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="absolute right-1.5 top-1.5 px-3.5 py-1.5 bg-stone-800 hover:bg-stone-900 text-white text-xs font-medium rounded-lg disabled:opacity-50 transition-colors"
              >
                {isSearching ? 'Searching...' : 'Find'}
              </button>
            </div>

            {searchError && (
              <p className="text-xs text-red-600 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {searchError}
              </p>
            )}

            {/* Search results list */}
            {searchResults.length > 0 && (
              <div className="max-h-40 overflow-y-auto divide-y divide-stone-100 border border-stone-200 rounded-xl bg-white shadow-sm">
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setManualLocation(result)}
                    className="w-full text-left p-2.5 hover:bg-emerald-50 flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="truncate pr-2">
                      <p className="font-semibold text-stone-900">{result.city || 'City'}</p>
                      <p className="text-stone-500 truncate">{result.formatted_address}</p>
                    </div>
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 opacity-0 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            )}
          </form>

          {/* Quick city chips */}
          <div>
            <p className="text-xs font-medium text-stone-600 mb-2">Popular regions:</p>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_LOCATIONS.map((loc) => (
                <button
                  key={loc.name}
                  onClick={() => handleSelectPopular(loc.query)}
                  className="px-2.5 py-1 text-xs font-medium bg-stone-100 hover:bg-emerald-100 hover:text-emerald-900 text-stone-700 rounded-lg border border-stone-200 transition-colors"
                >
                  {loc.name}
                </button>
              ))}
            </div>
          </div>

          {/* Privacy and skip footer */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-stone-500 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Location stored in session only; never shared.</span>
            </div>
            <button
              type="button"
              onClick={skipLocation}
              className="text-xs text-stone-500 hover:text-stone-800 underline font-medium"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
