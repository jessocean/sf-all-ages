"use client";

import { Venue } from "@/lib/schema";
import { formatDistance } from "@/lib/distance";
import { isOpenNow, getClosingTime } from "@/lib/hours";
import type { Party } from "@/lib/pricing";
import { formatCost, formatParking } from "@/lib/pricing";
import type { TravelTimes } from "@/lib/travel";
import { formatTravelTimes } from "@/lib/travel";

interface VenueCardProps {
  venue: Venue;
  distance?: number;
  party?: Party;
  travelTimes?: TravelTimes;
  relevanceScore?: number;
  matchReasons?: string[];
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

function getScoreLabel(score: number): string | null {
  if (score >= 85) return "Great match";
  if (score >= 70) return "Good match";
  return null;
}

export function VenueCard({
  venue,
  distance,
  party,
  travelTimes,
  relevanceScore,
  matchReasons,
}: VenueCardProps) {
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

  // Format cost based on party
  const costDisplay = party ? formatCost(venue, party) : null;
  const parkingDisplay = formatParking(venue);
  const travelDisplay = travelTimes ? formatTravelTimes(travelTimes) : null;
  const scoreLabel = relevanceScore ? getScoreLabel(relevanceScore) : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors">
      <div className="flex gap-4">
        {/* Image */}
        {venue.imageUrl && (
          <div className="flex-shrink-0">
            <img
              src={venue.imageUrl}
              alt={venue.name}
              className="w-24 h-24 object-cover rounded-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-gray-900 truncate">
              {emoji} {venue.name}
            </h3>
            {scoreLabel && (
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full whitespace-nowrap">
                {scoreLabel}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {venue.description}
          </p>
        </div>
      </div>

      {/* Cost and Travel Times */}
      <div className="flex flex-wrap items-center gap-2 mt-3 text-sm">
        {costDisplay && (
          <span className="text-gray-700 font-medium">{costDisplay}</span>
        )}
        {travelDisplay && (
          <>
            {costDisplay && <span className="text-gray-300">·</span>}
            <span className="text-gray-500">{travelDisplay}</span>
          </>
        )}
      </div>

      {/* Location Info */}
      <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
        {distance !== undefined && !travelDisplay && (
          <span>{formatDistance(distance)}</span>
        )}
        {venue.neighborhood && (
          <>
            {distance !== undefined && !travelDisplay && <span>·</span>}
            <span>{venue.neighborhood}</span>
          </>
        )}
        {parkingDisplay && (
          <>
            <span>·</span>
            <span>{parkingDisplay}</span>
          </>
        )}
      </div>

      {/* Open Status */}
      <div className="mt-2 text-sm">
        {isOpen ? (
          <span className="text-green-600">
            Open now{closingTime && ` until ${closingTime}`}
          </span>
        ) : (
          <span className="text-gray-400">Closed</span>
        )}
      </div>

      {/* Features */}
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

      {/* Age Groups */}
      {ageGroups.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          Best for: {ageGroups.join(", ")}
        </div>
      )}

      {/* Match Reasons */}
      {matchReasons && matchReasons.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {matchReasons.map((reason) => (
            <span
              key={reason}
              className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded"
            >
              {reason}
            </span>
          ))}
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
