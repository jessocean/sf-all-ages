/**
 * Travel time calculations using OSRM (Open Source Routing Machine) API
 * https://project-osrm.org/
 *
 * Public API: https://router.project-osrm.org
 * Profiles: driving, cycling, walking
 */

export interface TravelTimes {
  driving: number | null; // minutes
  cycling: number | null;
  walking: number | null;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

// Cache for travel time results to avoid redundant API calls
const travelTimeCache = new Map<string, TravelTimes>();

function getCacheKey(from: Coordinates, to: Coordinates): string {
  return `${from.lat.toFixed(4)},${from.lng.toFixed(4)}-${to.lat.toFixed(4)},${to.lng.toFixed(4)}`;
}

/**
 * Get travel time for a specific mode using OSRM
 */
async function fetchTravelTime(
  from: Coordinates,
  to: Coordinates,
  profile: "driving" | "cycling" | "foot"
): Promise<number | null> {
  try {
    // OSRM expects lon,lat format (not lat,lon!)
    const url = `https://router.project-osrm.org/route/v1/${profile}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;

    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.warn(`OSRM API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.code !== "Ok" || !data.routes?.[0]) {
      return null;
    }

    // Duration is in seconds, convert to minutes
    const durationSeconds = data.routes[0].duration;
    return Math.round(durationSeconds / 60);
  } catch (error) {
    console.warn(`Failed to fetch ${profile} travel time:`, error);
    return null;
  }
}

/**
 * Get travel times for all modes
 * Uses OSRM API with fallback to distance-based estimates
 */
export async function getTravelTimes(
  from: Coordinates,
  to: Coordinates,
  distanceMiles?: number
): Promise<TravelTimes> {
  // Check cache first
  const cacheKey = getCacheKey(from, to);
  const cached = travelTimeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch all travel times in parallel
  const [driving, cycling, walking] = await Promise.all([
    fetchTravelTime(from, to, "driving"),
    fetchTravelTime(from, to, "cycling"),
    fetchTravelTime(from, to, "foot"),
  ]);

  const result: TravelTimes = {
    driving,
    cycling,
    walking,
  };

  // If API failed, use distance-based estimates as fallback
  if (distanceMiles !== undefined) {
    if (result.driving === null) {
      // Assume 15 mph average in city
      result.driving = Math.round((distanceMiles / 15) * 60);
    }
    if (result.cycling === null) {
      // Assume 12 mph average
      result.cycling = Math.round((distanceMiles / 12) * 60);
    }
    if (result.walking === null) {
      // Assume 3 mph average
      result.walking = Math.round((distanceMiles / 3) * 60);
    }
  }

  // Cache the result
  travelTimeCache.set(cacheKey, result);

  return result;
}

/**
 * Format travel times for display
 */
export function formatTravelTimes(times: TravelTimes): string {
  const parts: string[] = [];

  if (times.driving !== null) {
    parts.push(`🚗 ${times.driving} min`);
  }
  if (times.cycling !== null) {
    parts.push(`🚴 ${times.cycling} min`);
  }
  if (times.walking !== null && times.walking <= 30) {
    // Only show walking if reasonable (under 30 min)
    parts.push(`🚶 ${times.walking} min`);
  }

  return parts.join(" · ");
}

/**
 * Get the shortest travel time (for ranking purposes)
 */
export function getShortestTravelTime(times: TravelTimes): number {
  const available = [times.driving, times.cycling, times.walking].filter(
    (t): t is number => t !== null
  );

  if (available.length === 0) return Infinity;
  return Math.min(...available);
}

/**
 * Clear the travel time cache
 */
export function clearTravelTimeCache(): void {
  travelTimeCache.clear();
}

/**
 * Get distance-based estimates (no API call)
 * Use when OSRM is unavailable or for initial display
 */
export function getEstimatedTravelTimes(distanceMiles: number): TravelTimes {
  return {
    driving: Math.round((distanceMiles / 15) * 60), // 15 mph city average
    cycling: Math.round((distanceMiles / 12) * 60), // 12 mph average
    walking: Math.round((distanceMiles / 3) * 60), // 3 mph walking
  };
}
