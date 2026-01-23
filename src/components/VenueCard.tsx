"use client";

import { Venue } from "@/lib/schema";
import { formatDistance } from "@/lib/distance";
import { isOpenNow, getClosingTime } from "@/lib/hours";

interface VenueCardProps {
  venue: Venue;
  distance?: number;
}

const VENUE_TYPE_EMOJI: Record<string, string> = {
  cafe: "☕",
  brewery: "🍺",
  restaurant: "🍽️",
  park: "🌳",
  museum: "🏛️",
  church: "⛪",
  community: "🏠",
  library: "📚",
  other: "📍",
};

export function VenueCard({ venue, distance }: VenueCardProps) {
  const isOpen = isOpenNow(venue.hoursJson);
  const closingTime = getClosingTime(venue.hoursJson);
  const emoji = VENUE_TYPE_EMOJI[venue.venueType || "other"] || "📍";

  const features: string[] = [];
  if (venue.hasPlayArea) features.push("Play area");
  if (venue.hasOutdoorSpace) features.push("Outdoor");
  if (venue.isEnclosed) features.push("Enclosed");
  if (venue.loudOk) features.push("Loud OK");
  if (venue.strollerAccessible) features.push("Stroller OK");
  if (venue.hasHighChairs) features.push("High chairs");

  const ageGroups: string[] = [];
  if (venue.toddlerFriendly) ageGroups.push("Toddlers");
  if (venue.youngKidFriendly) ageGroups.push("Young kids");
  if (venue.teenFriendly) ageGroups.push("Teens");

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">
            {emoji} {venue.name}
          </h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {venue.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
        {distance !== undefined && (
          <span>{formatDistance(distance)}</span>
        )}
        {venue.neighborhood && (
          <>
            {distance !== undefined && <span>·</span>}
            <span>{venue.neighborhood}</span>
          </>
        )}
      </div>

      <div className="mt-2 text-sm">
        {isOpen ? (
          <span className="text-green-600">
            Open now{closingTime && ` until ${closingTime}`}
          </span>
        ) : (
          <span className="text-gray-400">Closed</span>
        )}
      </div>

      {features.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {features.map((feature) => (
            <span
              key={feature}
              className="inline-flex items-center text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
            >
              {feature}
            </span>
          ))}
        </div>
      )}

      {ageGroups.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          Best for: {ageGroups.join(", ")}
        </div>
      )}

      {venue.websiteUrl && (
        <a
          href={venue.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm text-blue-600 hover:underline"
        >
          Visit website →
        </a>
      )}
    </div>
  );
}
