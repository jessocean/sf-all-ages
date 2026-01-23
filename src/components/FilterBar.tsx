"use client";

import { useState, useEffect } from "react";

export interface Filters {
  location: { lat: number; lng: number } | null;
  showOpenNow: boolean;
  timeWindow: { date: Date; startHour: number; endHour: number } | null;
  ageGroups: {
    toddlers: boolean;
    youngKids: boolean;
    teens: boolean;
  };
  venueTypes: string[];
  eventTypes: string[];
}

interface FilterBarProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  mode: "venues" | "events" | "all";
}

const VENUE_TYPES = [
  { value: "cafe", label: "Cafes" },
  { value: "brewery", label: "Breweries" },
  { value: "restaurant", label: "Restaurants" },
  { value: "park", label: "Parks" },
  { value: "museum", label: "Museums" },
  { value: "church", label: "Religious" },
  { value: "community", label: "Community" },
];

const EVENT_TYPES = [
  { value: "music", label: "Music" },
  { value: "sports", label: "Sports" },
  { value: "festival", label: "Festivals" },
  { value: "market", label: "Markets" },
  { value: "religious", label: "Religious" },
  { value: "art", label: "Art" },
  { value: "community", label: "Community" },
];

export function FilterBar({ filters, onFiltersChange, mode }: FilterBarProps) {
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "granted" | "denied">("idle");

  const requestLocation = () => {
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationStatus("granted");
        onFiltersChange({
          ...filters,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        });
      },
      () => {
        setLocationStatus("denied");
      }
    );
  };

  const toggleAgeGroup = (group: keyof Filters["ageGroups"]) => {
    onFiltersChange({
      ...filters,
      ageGroups: {
        ...filters.ageGroups,
        [group]: !filters.ageGroups[group],
      },
    });
  };

  const toggleVenueType = (type: string) => {
    const newTypes = filters.venueTypes.includes(type)
      ? filters.venueTypes.filter((t) => t !== type)
      : [...filters.venueTypes, type];
    onFiltersChange({ ...filters, venueTypes: newTypes });
  };

  const toggleEventType = (type: string) => {
    const newTypes = filters.eventTypes.includes(type)
      ? filters.eventTypes.filter((t) => t !== type)
      : [...filters.eventTypes, type];
    onFiltersChange({ ...filters, eventTypes: newTypes });
  };

  return (
    <div className="bg-white border-b border-gray-200 py-4">
      <div className="max-w-5xl mx-auto px-4 space-y-4">
        {/* Location */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-gray-500">Location:</span>
          {filters.location ? (
            <span className="text-sm text-green-600">Using your location</span>
          ) : (
            <button
              onClick={requestLocation}
              disabled={locationStatus === "loading"}
              className="text-sm text-blue-600 hover:underline disabled:text-gray-400"
            >
              {locationStatus === "loading" ? "Getting location..." : "Use my location"}
            </button>
          )}
          {locationStatus === "denied" && (
            <span className="text-sm text-red-500">Location access denied</span>
          )}
        </div>

        {/* Time Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-gray-500">When:</span>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={filters.showOpenNow}
              onChange={(e) =>
                onFiltersChange({ ...filters, showOpenNow: e.target.checked })
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Open now</span>
          </label>
        </div>

        {/* Age Groups */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-gray-500">Ages:</span>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={filters.ageGroups.toddlers}
              onChange={() => toggleAgeGroup("toddlers")}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Toddlers (0-3)</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={filters.ageGroups.youngKids}
              onChange={() => toggleAgeGroup("youngKids")}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Young kids (4-8)</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={filters.ageGroups.teens}
              onChange={() => toggleAgeGroup("teens")}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Teens (9+)</span>
          </label>
        </div>

        {/* Venue Types */}
        {(mode === "venues" || mode === "all") && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500 mr-1">Places:</span>
            {VENUE_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => toggleVenueType(type.value)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filters.venueTypes.includes(type.value)
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        )}

        {/* Event Types */}
        {(mode === "events" || mode === "all") && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500 mr-1">Events:</span>
            {EVENT_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => toggleEventType(type.value)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filters.eventTypes.includes(type.value)
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const defaultFilters: Filters = {
  location: null,
  showOpenNow: false,
  timeWindow: null,
  ageGroups: {
    toddlers: true,
    youngKids: true,
    teens: false,
  },
  venueTypes: [],
  eventTypes: [],
};
