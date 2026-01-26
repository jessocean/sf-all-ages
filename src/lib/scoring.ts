import type { Venue, Event } from "./schema";
import type { Party } from "./pricing";
import { getCostScore } from "./pricing";

export interface ScoredItem {
  item: Venue | Event;
  type: "venue" | "event";
  relevanceScore: number; // 0-100
  distanceMiles?: number;
  matchReasons: string[];
}

/**
 * Scoring weights (must sum to 1.0)
 */
const WEIGHTS = {
  distance: 0.25, // Closer is better
  cost: 0.20, // Cheaper is better
  specialness: 0.30, // Events/limited availability rank higher
  ageMatch: 0.25, // Better age match = higher score
};

/**
 * Calculate distance score (0-100)
 * Closer = higher score
 */
function getDistanceScore(distanceMiles: number): number {
  // 0 miles = 100, 5+ miles = 0
  const score = 100 - distanceMiles * 20;
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate "specialness" score (0-100)
 * Events and limited-time things rank higher than always-open venues
 */
function getSpecialnessScore(item: Venue | Event, type: "venue" | "event"): number {
  if (type === "event") {
    const event = item as Event;
    // One-time events are most special
    if (!event.isRecurring) return 100;
    // Recurring events still rank high
    return 80;
  }

  // Venues
  const venue = item as Venue;

  // Check if venue has limited hours (not always open)
  if (venue.hoursJson) {
    try {
      const hours = JSON.parse(venue.hoursJson);
      // If venue has specific hours, it's somewhat special
      if (Object.keys(hours).length > 0) {
        return 60;
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Parks and always-open venues are least "special"
  if (venue.venueType === "park") {
    return 40;
  }

  return 50; // Default for venues
}

/**
 * Calculate age match score (0-100)
 * How well does this venue/event match the ages in the party?
 */
function getAgeMatchScore(item: Venue | Event, party: Party): number {
  const partyAges: { key: keyof Party; field: keyof Venue | keyof Event }[] = [
    { key: "toddlers", field: "toddlerFriendly" },
    { key: "kids", field: "youngKidFriendly" },
    { key: "teens", field: "teenFriendly" },
  ];

  // Count how many age groups in the party are supported
  let matchingGroups = 0;
  let totalGroupsInParty = 0;

  for (const { key, field } of partyAges) {
    if (party[key] > 0) {
      totalGroupsInParty++;
      // @ts-expect-error - dynamic field access
      if (item[field]) {
        matchingGroups++;
      }
    }
  }

  // Adults are always welcome
  if (party.adults > 0) {
    totalGroupsInParty++;
    matchingGroups++; // Assume adults are always welcome
  }

  if (totalGroupsInParty === 0) return 100; // Empty party matches everything

  return (matchingGroups / totalGroupsInParty) * 100;
}

/**
 * Calculate overall relevance score
 */
export function calculateRelevanceScore(
  item: Venue | Event,
  type: "venue" | "event",
  distanceMiles: number,
  party: Party
): { score: number; reasons: string[] } {
  const reasons: string[] = [];

  // Distance score
  const distanceScore = getDistanceScore(distanceMiles);
  if (distanceMiles < 1) {
    reasons.push("Very close");
  } else if (distanceMiles < 2) {
    reasons.push("Nearby");
  }

  // Cost score
  const costScore = getCostScore(item, party);
  if (costScore === 100) {
    reasons.push("Free");
  } else if (costScore >= 80) {
    reasons.push("Budget-friendly");
  }

  // Specialness score
  const specialnessScore = getSpecialnessScore(item, type);
  if (type === "event") {
    const event = item as Event;
    if (!event.isRecurring) {
      reasons.push("Special event");
    }
  }

  // Age match score
  const ageMatchScore = getAgeMatchScore(item, party);
  if (ageMatchScore === 100) {
    reasons.push("Great for all ages");
  } else if (ageMatchScore >= 75) {
    reasons.push("Good age match");
  }

  // Weighted average
  const score =
    distanceScore * WEIGHTS.distance +
    costScore * WEIGHTS.cost +
    specialnessScore * WEIGHTS.specialness +
    ageMatchScore * WEIGHTS.ageMatch;

  return {
    score: Math.round(score),
    reasons,
  };
}

/**
 * Get a label for the relevance score
 */
export function getScoreLabel(score: number): string | null {
  if (score >= 85) return "Great match";
  if (score >= 70) return "Good match";
  return null;
}

/**
 * Sort items by relevance score (descending), then by distance (ascending)
 */
export function sortByRelevance(items: ScoredItem[]): ScoredItem[] {
  return [...items].sort((a, b) => {
    // Primary: relevance score (higher first)
    if (b.relevanceScore !== a.relevanceScore) {
      return b.relevanceScore - a.relevanceScore;
    }
    // Secondary: distance (closer first), items without distance go last
    const aDist = a.distanceMiles ?? Infinity;
    const bDist = b.distanceMiles ?? Infinity;
    return aDist - bDist;
  });
}
