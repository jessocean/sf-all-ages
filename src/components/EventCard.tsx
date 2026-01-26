"use client";

import { Event } from "@/lib/schema";
import { formatDistance } from "@/lib/distance";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import type { Party } from "@/lib/pricing";
import { formatCost } from "@/lib/pricing";
import type { TravelTimes } from "@/lib/travel";
import { formatTravelTimes } from "@/lib/travel";

interface EventCardProps {
  event: Event;
  distance?: number;
  venueName?: string;
  party?: Party;
  travelTimes?: TravelTimes;
  relevanceScore?: number;
  matchReasons?: string[];
}

const EVENT_TYPE_EMOJI: Record<string, string> = {
  music: "🎵",
  sports: "⚽",
  religious: "⛪",
  festival: "🎪",
  market: "🛒",
  community: "🤝",
  art: "🎨",
  food: "🍴",
  outdoor: "🌳",
  other: "📅",
};

function formatEventTime(startTime: string, endTime: string | null): string {
  const start = parseISO(startTime);

  let datePrefix: string;
  if (isToday(start)) {
    datePrefix = "Today";
  } else if (isTomorrow(start)) {
    datePrefix = "Tomorrow";
  } else {
    datePrefix = format(start, "EEE, MMM d");
  }

  const timeStr = format(start, "h:mm a");

  if (endTime) {
    const end = parseISO(endTime);
    return `${datePrefix} ${timeStr} - ${format(end, "h:mm a")}`;
  }

  return `${datePrefix} ${timeStr}`;
}

function getScoreLabel(score: number): string | null {
  if (score >= 85) return "Great match";
  if (score >= 70) return "Good match";
  return null;
}

export function EventCard({
  event,
  distance,
  venueName,
  party,
  travelTimes,
  relevanceScore,
  matchReasons,
}: EventCardProps) {
  const emoji = EVENT_TYPE_EMOJI[event.eventType || "other"] || "📅";

  const features: string[] = [];
  if (event.hasKidsActivities) features.push("Kids activities");
  if (event.outdoor) features.push("Outdoor");

  const ageGroups: string[] = [];
  if (event.toddlerFriendly) ageGroups.push("Toddlers");
  if (event.youngKidFriendly) ageGroups.push("Young kids");
  if (event.teenFriendly) ageGroups.push("Teens");

  // Format cost based on party
  const costDisplay = party ? formatCost(event, party) : null;
  const travelDisplay = travelTimes ? formatTravelTimes(travelTimes) : null;
  const scoreLabel = relevanceScore ? getScoreLabel(relevanceScore) : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors">
      <div className="flex gap-4">
        {/* Image */}
        {event.imageUrl && (
          <div className="flex-shrink-0">
            <img
              src={event.imageUrl}
              alt={event.name}
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
              {emoji} {event.name}
            </h3>
            {scoreLabel && (
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full whitespace-nowrap">
                {scoreLabel}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {event.description}
          </p>
          <div className="mt-2 text-sm font-medium text-gray-900">
            {formatEventTime(event.startTime, event.endTime)}
          </div>
        </div>
      </div>

      {/* Cost and Travel Times */}
      <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
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
      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
        {distance !== undefined && !travelDisplay && (
          <span>{formatDistance(distance)}</span>
        )}
        {(venueName || event.address) && (
          <>
            {distance !== undefined && !travelDisplay && <span>·</span>}
            <span className="truncate">{venueName || event.address}</span>
          </>
        )}
      </div>

      {features.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {features.map((feature) => (
            <span
              key={feature}
              className="inline-flex items-center text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
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

      {event.isRecurring && (
        <div className="mt-2 text-xs text-gray-400">Recurring event</div>
      )}

      {event.sourceUrl && (
        <a
          href={event.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm text-blue-600 hover:underline"
        >
          More info →
        </a>
      )}
    </div>
  );
}
