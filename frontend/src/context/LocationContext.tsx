import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LocationState, GeocodeResult } from '../types';
import { reverseGeocode } from '../services/api';

interface LocationContextType {
  location: LocationState;
  isOnboardingOpen: boolean;
  isLocating: boolean;
  openOnboarding: () => void;
  closeOnboarding: () => void;
  requestBrowserLocation: () => Promise<boolean>;
  setManualLocation: (geo: GeocodeResult) => void;
  skipLocation: () => void;
}

const STORAGE_KEY = 'ecosort_user_location';

const defaultLocation: LocationState = {
  latitude: 18.5204,
  longitude: 73.8567,
  formatted_address: 'Pune, Maharashtra, India',
  city: 'Pune',
  isLoaded: true,
  source: 'default',
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<LocationState>(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Ignore JSON error
      }
    }
    return defaultLocation;
  });

  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    // Show onboarding on first visit if no location has been actively set yet
    return !sessionStorage.getItem(STORAGE_KEY);
  });

  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Sync to session storage whenever changed
  useEffect(() => {
    if (location.isLoaded) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(location));
    }
  }, [location]);

  const requestBrowserLocation = async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by your browser.',
        source: 'none',
      }));
      return false;
    }

    setIsLocating(true);

    const tryGetPosition = (highAccuracy: boolean): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: highAccuracy,
          timeout: highAccuracy ? 12000 : 8000,
          maximumAge: highAccuracy ? 0 : 60000,
        });
      });
    };

    try {
      let position: GeolocationPosition;
      try {
        // Step 1: Attempt precise hardware GPS / Wi-Fi positioning
        position = await tryGetPosition(true);
      } catch (highAccErr: any) {
        // Step 2: Fall back to standard network positioning if high accuracy times out
        if (highAccErr.code !== highAccErr.PERMISSION_DENIED) {
          position = await tryGetPosition(false);
        } else {
          throw highAccErr;
        }
      }

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const accuracy = position.coords.accuracy ? Math.round(position.coords.accuracy) : undefined;

      try {
        const geocoded = await reverseGeocode(lat, lon);
        const newLoc: LocationState = {
          latitude: lat,
          longitude: lon,
          formatted_address: geocoded.formatted_address,
          city: geocoded.city || 'Your Precise Location',
          pin_code: geocoded.pin_code,
          accuracy,
          isLoaded: true,
          source: 'gps',
          error: undefined,
        };
        setLocation(newLoc);
        setIsOnboardingOpen(false);
        setIsLocating(false);
        return true;
      } catch (err) {
        // Geocoding network error, still save exact coordinates
        const newLoc: LocationState = {
          latitude: lat,
          longitude: lon,
          formatted_address: `Coordinates (${lat.toFixed(5)}, ${lon.toFixed(5)})`,
          city: 'Your Precise Location',
          accuracy,
          isLoaded: true,
          source: 'gps',
          error: undefined,
        };
        setLocation(newLoc);
        setIsOnboardingOpen(false);
        setIsLocating(false);
        return true;
      }
    } catch (error: any) {
      setIsLocating(false);
      let errorMsg = 'Unable to retrieve location.';
      if (error.code === error.PERMISSION_DENIED) {
        errorMsg = 'Location permission was denied. Defaulting to Pune (search or pick another city anytime).';
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        errorMsg = 'Device GPS / location is unavailable. Defaulting to Pune.';
      } else if (error.code === error.TIMEOUT) {
        errorMsg = 'Location request timed out. Defaulting to Pune.';
      }

      setLocation((prev) => ({
        ...prev,
        isLoaded: true,
        error: errorMsg,
      }));
      return false;
    }
  };

  const setManualLocation = (geo: GeocodeResult) => {
    const newLoc: LocationState = {
      latitude: geo.latitude,
      longitude: geo.longitude,
      formatted_address: geo.formatted_address,
      city: geo.city || 'Selected Location',
      pin_code: geo.pin_code,
      isLoaded: true,
      source: 'manual',
      error: undefined,
    };
    setLocation(newLoc);
    setIsOnboardingOpen(false);
  };

  const skipLocation = () => {
    // Proceed with default fallback city without blocking
    const skippedLoc: LocationState = {
      ...defaultLocation,
      isLoaded: true,
      source: 'default',
    };
    setLocation(skippedLoc);
    setIsOnboardingOpen(false);
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        isOnboardingOpen,
        isLocating,
        openOnboarding: () => setIsOnboardingOpen(true),
        closeOnboarding: () => setIsOnboardingOpen(false),
        requestBrowserLocation,
        setManualLocation,
        skipLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
