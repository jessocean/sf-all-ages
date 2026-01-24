"use client";

import { useState, useRef, useEffect } from "react";
import { SF_NEIGHBORHOODS, SF_CENTER } from "@/lib/distance";

export interface UserLocation {
  lat: number;
  lng: number;
  label: string;
}

interface LocationInputProps {
  location: UserLocation | null;
  onChange: (location: UserLocation | null) => void;
}

const NEIGHBORHOOD_NAMES = Object.keys(SF_NEIGHBORHOODS).sort();

export function LocationInput({ location, onChange }: LocationInputProps) {
  const [inputValue, setInputValue] = useState(location?.label || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredNeighborhoods, setFilteredNeighborhoods] = useState<string[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter neighborhoods based on input
  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = NEIGHBORHOOD_NAMES.filter((name) =>
        name.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredNeighborhoods(filtered);
    } else {
      setFilteredNeighborhoods(NEIGHBORHOOD_NAMES);
    }
  }, [inputValue]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectNeighborhood = (name: string) => {
    const coords = SF_NEIGHBORHOODS[name];
    if (coords) {
      onChange({
        lat: coords.lat,
        lng: coords.lng,
        label: name,
      });
      setInputValue(name);
    }
    setShowDropdown(false);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setShowDropdown(true);
    setLocationError(null);

    // If input is cleared, clear location
    if (!value.trim()) {
      onChange(null);
    }
  };

  const handleUseMyLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          });
        }
      );

      const { latitude, longitude } = position.coords;

      // Find nearest neighborhood for label
      let nearestNeighborhood = "Your location";
      let minDistance = Infinity;

      for (const [name, coords] of Object.entries(SF_NEIGHBORHOODS)) {
        const distance = Math.sqrt(
          Math.pow(coords.lat - latitude, 2) +
            Math.pow(coords.lng - longitude, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestNeighborhood = `Near ${name}`;
        }
      }

      onChange({
        lat: latitude,
        lng: longitude,
        label: nearestNeighborhood,
      });
      setInputValue(nearestNeighborhood);
    } catch (error) {
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location access denied");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location unavailable");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out");
            break;
        }
      } else {
        setLocationError("Could not get location");
      }
    } finally {
      setIsLocating(false);
    }
  };

  const clearLocation = () => {
    onChange(null);
    setInputValue("");
    setLocationError(null);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Where are you?
      </label>
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              placeholder="Enter neighborhood..."
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            {location && (
              <button
                type="button"
                onClick={clearLocation}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear location"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={isLocating}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-gray-700 flex items-center gap-1.5 whitespace-nowrap"
            aria-label="Use my location"
          >
            {isLocating ? (
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            )}
            <span className="hidden sm:inline">
              {isLocating ? "Locating..." : "Use my location"}
            </span>
          </button>
        </div>

        {/* Dropdown */}
        {showDropdown && filteredNeighborhoods.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
          >
            {filteredNeighborhoods.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => selectNeighborhood(name)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {locationError && (
        <p className="text-xs text-red-600">{locationError}</p>
      )}
    </div>
  );
}
