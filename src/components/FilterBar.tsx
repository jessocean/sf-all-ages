"use client";

import { PartyInput } from "./PartyInput";
import { LocationInput, UserLocation } from "./LocationInput";
import { TimeFilter, TimeFilterValue } from "./TimeFilter";
import type { Party } from "@/lib/pricing";

export interface Filters {
  location: UserLocation | null;
  party: Party;
  timeFilter: TimeFilterValue;
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
        {/* Party Input */}
        <PartyInput
          party={filters.party}
          onChange={(party) => onFiltersChange({ ...filters, party })}
        />

        {/* Location Input */}
        <LocationInput
          location={filters.location}
          onChange={(location) => onFiltersChange({ ...filters, location })}
        />

        {/* Time Filter */}
        <TimeFilter
          value={filters.timeFilter}
          onChange={(timeFilter) => onFiltersChange({ ...filters, timeFilter })}
        />

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
  party: {
    toddlers: 0,
    kids: 0,
    teens: 0,
    adults: 1,
  },
  timeFilter: {
    option: "now",
  },
  venueTypes: [],
  eventTypes: [],
};
