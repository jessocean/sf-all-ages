"use client";

import { Event } from "@/lib/schema";
import { formatDistance } from "@/lib/distance";
import { format, isToday, isTomorrow, parseISO } from "date-fns";

interface EventCardProps {
  event: Event;
  distance?: number;
  venueName?: string;
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

export function EventCard({ event, distance, venueName }: EventCardProps) {
  const emoji = EVENT_TYPE_EMOJI[event.eventType || "other"] || "📅";

  const features: string[] = [];
  if (event.hasKidsActivities) features.push("Kids activities");
  if (event.outdoor) features.push("Outdoor");

  const ageGroups: string[] = [];
  if (event.toddlerFriendly) ageGroups.push("Toddlers");
  if (event.youngKidFriendly) ageGroups.push("Young kids");
  if (event.teenFriendly) ageGroups.push("Teens");

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">
            {emoji} {event.name}
          </h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {event.description}
          </p>
        </div>
      </div>

      <div className="mt-3 text-sm font-medium text-gray-900">
        {formatEventTime(event.startTime, event.endTime)}
      </div>

      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
        {distance !== undefined && (
          <span>{formatDistance(distance)}</span>
        )}
        {(venueName || event.address) && (
          <>
            {distance !== undefined && <span>·</span>}
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

      {event.isRecurring && (
        <div className="mt-2 text-xs text-gray-400">
          Recurring event
        </div>
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
