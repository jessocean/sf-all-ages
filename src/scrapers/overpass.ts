/**
 * OpenStreetMap Overpass API importer.
 * Discovers venues by category within SF bounding box.
 *
 * API: https://overpass-api.de/api/interpreter (free, no auth)
 * Bounding box: 37.7,-122.52,37.82,-122.35
 */

import {
  upsertVenue,
  validateAndClean,
  isWithinSF,
  detectNeighborhood,
} from "@/lib/pipeline";

const OVERPASS_API = "https://overpass-api.de/api/interpreter";
const SF_BBOX = "37.7,-122.52,37.82,-122.35";

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

// Queries grouped by venue type
const QUERIES: { type: string; query: string; kidFocused: boolean }[] = [
  {
    type: "park",
    query: `[out:json][timeout:30];node["leisure"="playground"](${SF_BBOX});out body;`,
    kidFocused: true,
  },
  {
    type: "museum",
    query: `[out:json][timeout:30];nwr["tourism"="museum"](${SF_BBOX});out body center;`,
    kidFocused: false,
  },
  {
    type: "library",
    query: `[out:json][timeout:30];nwr["amenity"="library"](${SF_BBOX});out body center;`,
    kidFocused: false,
  },
  {
    type: "cafe",
    query: `[out:json][timeout:30];node["amenity"="cafe"]["cuisine"="coffee_shop"](${SF_BBOX});out body;`,
    kidFocused: false,
  },
  {
    type: "brewery",
    query: `[out:json][timeout:30];nwr["microbrewery"="yes"](${SF_BBOX});out body center;`,
    kidFocused: false,
  },
];

async function queryOverpass(query: string): Promise<OverpassElement[]> {
  try {
    const response = await fetch(OVERPASS_API, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      console.error(`Overpass returned ${response.status}`);
      return [];
    }

    const data: OverpassResponse = await response.json();
    return data.elements || [];
  } catch (error) {
    console.error("Overpass query failed:", error);
    return [];
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function scrapeOverpass(): Promise<{
  fetched: number;
  saved: number;
}> {
  console.log("Querying OpenStreetMap Overpass API...");

  let totalFetched = 0;
  let totalSaved = 0;

  for (const { type, query, kidFocused } of QUERIES) {
    console.log(`  Querying ${type}...`);

    const elements = await queryOverpass(query);
    console.log(`  Found ${elements.length} ${type} results`);
    totalFetched += elements.length;

    for (const el of elements) {
      try {
        const name = el.tags?.name;
        if (!name) continue;

        const lat = el.lat ?? el.center?.lat;
        const lon = el.lon ?? el.center?.lon;
        if (lat == null || lon == null) continue;
        if (!isWithinSF(lat, lon)) continue;

        const { valid } = validateAndClean({ name, latitude: lat, longitude: lon });
        if (!valid) continue;

        const neighborhood = detectNeighborhood(lat, lon);
        const address = el.tags?.["addr:full"] ||
          [el.tags?.["addr:housenumber"], el.tags?.["addr:street"]]
            .filter(Boolean)
            .join(" ") ||
          `${name}, San Francisco, CA`;

        const website = el.tags?.website || el.tags?.["contact:website"] || null;
        const wheelchair = el.tags?.wheelchair === "yes";

        // Try to parse opening hours (OSM format: "Mo-Fr 09:00-17:00; Sa 10:00-16:00")
        let hoursJson: string | null = null;
        const osmHours = el.tags?.opening_hours;
        if (osmHours) {
          hoursJson = parseOSMHours(osmHours);
        }

        const descriptions: Record<string, string> = {
          park: `Playground in San Francisco. ${wheelchair ? "Wheelchair accessible." : ""}`.trim(),
          museum: `${name} -- museum in San Francisco. ${el.tags?.description || ""}`.trim(),
          library: `${name} -- public library branch. Free programs and events for all ages.`,
          cafe: `${name} -- coffee shop in San Francisco.`,
          brewery: `${name} -- brewery/taproom in San Francisco.`,
        };

        const result = await upsertVenue({
          name,
          address,
          neighborhood,
          latitude: lat,
          longitude: lon,
          venueType: type,
          hoursJson,
          description: descriptions[type] || `${name} in San Francisco.`,
          websiteUrl: website,
          strollerAccessible: wheelchair,
          hasOutdoorSpace: type === "park",
          hasPlayArea: type === "park",
          toddlerFriendly: type === "park" || type === "library",
          youngKidFriendly: true,
          teenFriendly: true,
          kidFocused,
          pricingType: type === "park" || type === "library" ? "free" : null,
          sourcePlatform: "overpass",
        });

        if (result.created) {
          totalSaved++;
          console.log(`    + ${name}`);
        }
      } catch (error) {
        console.error(`    Error: ${el.tags?.name}`, error);
      }
    }

    // Rate limit between queries (Overpass asks for politeness)
    await delay(2000);
  }

  console.log(
    `Overpass: fetched ${totalFetched}, saved ${totalSaved} new`
  );
  return { fetched: totalFetched, saved: totalSaved };
}

/** Best-effort parse of OSM opening_hours into our JSON format. */
function parseOSMHours(osmHours: string): string | null {
  try {
    const dayMap: Record<string, string> = {
      Mo: "mon", Tu: "tue", We: "wed", Th: "thu",
      Fr: "fri", Sa: "sat", Su: "sun",
    };

    const result: Record<string, string> = {};

    // Split by semicolons for multiple rules
    const rules = osmHours.split(";").map((r) => r.trim());

    for (const rule of rules) {
      // Match patterns like "Mo-Fr 09:00-17:00" or "Sa 10:00-16:00"
      const match = rule.match(
        /([A-Za-z]{2})(?:-([A-Za-z]{2}))?\s+(\d{2}:\d{2})-(\d{2}:\d{2})/
      );
      if (!match) continue;

      const startDay = dayMap[match[1]];
      const endDay = match[2] ? dayMap[match[2]] : startDay;
      const timeRange = `${match[3]}-${match[4]}`;

      if (!startDay) continue;

      // Expand day ranges
      const allDays = Object.values(dayMap);
      const startIdx = allDays.indexOf(startDay);
      const endIdx = endDay ? allDays.indexOf(endDay) : startIdx;

      if (startIdx === -1) continue;

      for (
        let i = startIdx;
        i <= (endIdx >= startIdx ? endIdx : endIdx + 7);
        i++
      ) {
        const day = allDays[i % 7];
        result[day] = timeRange;
      }
    }

    return Object.keys(result).length > 0 ? JSON.stringify(result) : null;
  } catch {
    return null;
  }
}
