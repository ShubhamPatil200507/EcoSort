import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Compass, MapPin, Navigation, Filter, AlertCircle,
  RefreshCw, CheckCircle2, ChevronRight, ExternalLink
} from 'lucide-react';
import { CentreRecord, VerificationStatus } from '../../types';
import { CentreCard } from './CentreCard';
import { getNearbyCentres } from '../../services/api';
import { useLocation } from '../../context/LocationContext';

interface CentresMapProps {
  initialCategory?: string;
  defaultRadius?: number;
}

const RADIUS_OPTIONS = [5, 10, 25, 50];

export const CentresMap: React.FC<CentresMapProps> = ({
  initialCategory,
  defaultRadius = 25,
}) => {
  const { location, openOnboarding } = useLocation();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const userRadiusCircleRef = useRef<L.Circle | null>(null);

  const [radius, setRadius] = useState<number>(defaultRadius);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [centres, setCentres] = useState<CentreRecord[]>([]);
  const [selectedCentreId, setSelectedCentreId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = location.latitude || 19.0760;
    const initialLon = location.longitude || 72.8777;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: 12,
      zoomControl: true,
    });

    // OpenStreetMap standard tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Fetch centres whenever location, radius, or category changes
  const fetchCentres = async () => {
    if (!location.latitude || !location.longitude) return;

    setIsLoading(true);
    setError(null);

    try {
      const resp = await getNearbyCentres(
        location.latitude,
        location.longitude,
        radius,
        selectedCategory
      );
      setCentres(resp.centres);
      if (resp.centres.length > 0 && !selectedCentreId) {
        setSelectedCentreId(resp.centres[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load nearby collection centres.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCentres();
  }, [location.latitude, location.longitude, radius, selectedCategory]);

  // Update Map Markers and Bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup || !location.latitude || !location.longitude) return;

    // Clear old centre markers
    markersGroup.clearLayers();

    // Remove old user marker and circle
    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
    if (userRadiusCircleRef.current) map.removeLayer(userRadiusCircleRef.current);

    // 1. Draw User Location with blue pulse marker
    const userMarker = L.circleMarker([location.latitude, location.longitude], {
      radius: 9,
      fillColor: '#0284c7',
      color: '#ffffff',
      weight: 3,
      opacity: 1,
      fillOpacity: 0.9,
    }).addTo(map);

    userMarker.bindPopup(`
      <div style="font-family: inherit; font-size: 12px; padding: 2px;">
        <strong style="color: #0369a1;">📍 Your Location</strong><br/>
        <span>${location.formatted_address || 'Detected position'}</span>
      </div>
    `);
    userMarkerRef.current = userMarker;

    // Draw search radius boundary circle
    const radiusCircle = L.circle([location.latitude, location.longitude], {
      radius: radius * 1000,
      color: '#10b981',
      weight: 1.5,
      opacity: 0.6,
      fillColor: '#10b981',
      fillOpacity: 0.05,
      dashArray: '4, 4',
    }).addTo(map);
    userRadiusCircleRef.current = radiusCircle;

    const bounds = L.latLngBounds([[location.latitude, location.longitude]]);

    // 2. Add Centre Markers
    centres.forEach((centre) => {
      const isSelected = centre.id === selectedCentreId;
      const markerColor =
        centre.verification_status === 'OFFICIALLY_VERIFIED' ? '#15803d' : '#0f766e';

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="
            background-color: ${isSelected ? '#b91c1c' : markerColor};
            width: ${isSelected ? '32px' : '26px'};
            height: ${isSelected ? '32px' : '26px'};
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            <div style="
              width: 8px;
              height: 8px;
              background-color: white;
              border-radius: 50%;
              transform: rotate(45deg);
            "></div>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 26],
        popupAnchor: [0, -26],
      });

      const marker = L.marker([centre.latitude, centre.longitude], { icon: customIcon });

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; max-width: 220px; line-height: 1.4;">
          <strong style="font-size: 13px; color: #1e293b;">${centre.name}</strong><br/>
          <span style="color: #64748b;">${centre.facility_type}</span><br/>
          <div style="margin: 4px 0; font-weight: bold; color: #15803d;">${centre.distance_text || ''}</div>
          <p style="margin: 4px 0; color: #475569; font-size: 11px;">${centre.address}</p>
          ${
            centre.directions_url
              ? `<a href="${centre.directions_url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin-top: 6px; padding: 4px 8px; background: #15803d; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 11px;">Get Directions &rarr;</a>`
              : ''
          }
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        setSelectedCentreId(centre.id);
      });

      markersGroup.addLayer(marker);
      bounds.extend([centre.latitude, centre.longitude]);
    });

    // Fit map bounds to encompass user and nearby centres
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [centres, location.latitude, location.longitude, radius, selectedCentreId]);

  const handleCardClick = (centre: CentreRecord) => {
    setSelectedCentreId(centre.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([centre.latitude, centre.longitude], 14, {
        animate: true,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Radius Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-emerald-600" />
            <span>Search Radius:</span>
          </span>
          <div className="flex items-center gap-1">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRadius(r)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  radius === r
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>

        {/* Change location shortcut */}
        <div className="flex items-center gap-2 text-xs text-stone-600">
          <MapPin className="w-3.5 h-3.5 text-stone-400" />
          <span className="font-medium truncate max-w-[150px] sm:max-w-[200px]">
            {location.city || 'Detected Location'}
          </span>
          <button
            type="button"
            onClick={openOnboarding}
            className="text-emerald-700 hover:text-emerald-900 font-bold underline"
          >
            Change
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-950">Centres Retrieval Error</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Map & List Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Interactive Map View */}
        <div className="lg:col-span-7 h-[420px] sm:h-[480px] rounded-3xl overflow-hidden border border-stone-200 shadow-sm relative">
          <div ref={mapContainerRef} className="w-full h-full" />

          {isLoading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-xs z-10 flex items-center justify-center">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-lg border border-stone-200 text-xs font-semibold text-stone-800">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Locating disposal facilities...</span>
              </div>
            </div>
          )}
        </div>

        {/* Ranked Centre Cards List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h4 className="text-sm font-bold text-stone-900">
              Nearby Facilities ({centres.length})
            </h4>
            <span className="text-[11px] text-stone-500">
              Ranked nearest to you
            </span>
          </div>

          {centres.length === 0 && !isLoading ? (
            <div className="p-6 bg-stone-50 border border-dashed border-stone-300 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center mx-auto text-stone-500">
                <MapPin className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-stone-800">
                No matching centres within {radius} km
              </p>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Try widening the search radius to 50 km or check for regional municipal drop-off days.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setRadius(50)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  Expand Radius to 50 km
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
              {centres.map((centre) => (
                <CentreCard
                  key={centre.id}
                  centre={centre}
                  isSelected={centre.id === selectedCentreId}
                  onSelect={() => handleCardClick(centre)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
