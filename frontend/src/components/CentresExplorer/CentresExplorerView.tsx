import React, { useState } from 'react';
import { Compass, Search, MapPin, Filter, AlertCircle } from 'lucide-react';
import { CentresMap } from '../Map/CentresMap';
import { useLocation } from '../../context/LocationContext';
import { searchLocation } from '../../services/api';

const WASTE_CATEGORIES = [
  { id: 'all', name: 'All Categories' },
  { id: 'e_waste', name: 'E-Waste' },
  { id: 'batteries', name: 'Batteries' },
  { id: 'plastic', name: 'Plastic' },
  { id: 'paper_cardboard', name: 'Paper & Cardboard' },
  { id: 'glass', name: 'Glass' },
  { id: 'metal', name: 'Metal' },
  { id: 'hazardous', name: 'Hazardous Waste' },
  { id: 'organic_food', name: 'Organic Waste' },
  { id: 'textile', name: 'Textile' },
];

export const CentresExplorerView: React.FC = () => {
  const { location, setManualLocation } = useLocation();
  const [cityInput, setCityInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const handleCitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityInput.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await searchLocation(cityInput);
      if (results.length > 0) {
        setManualLocation(results[0]);
        setCityInput('');
      } else {
        setSearchError(`No coordinates found for "${cityInput}". Try another city or PIN code.`);
      }
    } catch (err: any) {
      setSearchError(err.message || 'Location search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickArea = async (areaQuery: string) => {
    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await searchLocation(areaQuery);
      if (results.length > 0) {
        setManualLocation(results[0]);
      } else {
        setSearchError(`Unable to locate "${areaQuery}".`);
      }
    } catch (err: any) {
      setSearchError(err.message || 'Location search failed');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in">
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
          <Compass className="w-3.5 h-3.5" />
          <span>Geospatial Directory · Pune & National Registries</span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-stone-900">
          Disposal & Recycling Centres Directory
        </h2>
        <p className="text-sm text-stone-500">
          Explore MPCB authorized e-waste recyclers, SWaCH drop-off points, and municipal material recovery facilities in Pune, Pimpri-Chinchwad, and across India.
        </p>
      </div>

      {/* City & Category Filter Bar */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Quick city search */}
          <form onSubmit={handleCitySearch} className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search by Pune area, PIN code, or city (e.g. Aundh, 411007, Kalyani Nagar, Mumbai)..."
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              className="w-full pl-10 pr-24 py-2.5 border border-stone-200 rounded-xl text-xs bg-stone-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <button
              type="submit"
              disabled={isSearching || !cityInput.trim()}
              className="absolute right-1.5 top-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              {isSearching ? 'Locating...' : 'Set Location'}
            </button>
          </form>

          {/* Current active location pill */}
          <div className="flex items-center gap-2 px-3 py-2 bg-stone-100 rounded-xl text-xs text-stone-700 shrink-0">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-semibold">Showing near:</span>
            <span className="truncate max-w-[140px] text-stone-900 font-bold">
              {location.city || 'Your Area'}
            </span>
          </div>
        </div>

        {/* Pune Quick Area Shortcuts */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-[11px] font-bold text-stone-500 mr-1">Pune Hubs:</span>
          {[
            { label: 'Aundh (411007)', query: '411007' },
            { label: 'Baner (411045)', query: '411045' },
            { label: 'Kalyani Nagar (411006)', query: '411006' },
            { label: 'Viman Nagar (411014)', query: '411014' },
            { label: 'Shivajinagar (411016)', query: '411016' },
            { label: 'Sadashiv Peth (411030)', query: '411030' },
            { label: 'Kothrud (411038)', query: '411038' },
            { label: 'Bavdhan (411021)', query: '411021' },
            { label: 'Hadapsar (411013)', query: '411013' },
            { label: 'Wanowrie (411040)', query: '411040' },
            { label: 'Hinjawadi (411057)', query: '411057' },
            { label: 'MIDC Bhosari (411026)', query: '411026' },
            { label: 'Nigdi (411044)', query: '411044' },
            { label: 'Uruli Devachi (412308)', query: '412308' },
          ].map((hub) => (
            <button
              key={hub.query}
              type="button"
              onClick={() => handleQuickArea(hub.query)}
              className="px-2.5 py-1 text-[11px] font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200/60 transition-colors cursor-pointer"
            >
              {hub.label}
            </button>
          ))}
        </div>

        {searchError && (
          <p className="text-xs text-red-600 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {searchError}
          </p>
        )}

        {/* Category Pills */}
        <div className="pt-2 border-t border-stone-100 flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-stone-500 flex items-center gap-1 mr-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Material:</span>
          </span>
          {WASTE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map View Component */}
      <CentresMap initialCategory={activeCategory} defaultRadius={25} />
    </div>
  );
};
