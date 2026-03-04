/**
 * DataSF Open Data importer.
 * Imports SF Parks & Rec facilities as venues.
 *
 * API: https://data.sfgov.org/resource/ib5c-xgwu.json (SODA API, no auth)
 * Facility types: Children's Play Area, Rec Center, Arts/Activity Center
 */

import {
  upsertVenue,
  validateAndClean,
  isWithinSF,
  detectNeighborhood,
} from "@/lib/pipeline";

interface DataSFRecord {
  facility_name?: string;
  facility_type?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  property_name?: string;
  analysis_neighborhood?: string;
}

const FACILITY_TYPE_MAP: Record<string, string> = {
  "Children's Play Area": "park",
  "Rec Center": "community",
  "Arts/Activity Center": "community",
  "Recreation Building": "community",
  "Athletic Field": "park",
  "Swimming Pool": "community",
};

// Only import these facility types
const IMPORTABLE_TYPES = new Set([
  "Children's Play Area",
  "Rec Center",
  "Arts/Activity Center",
  "Recreation Building",
  "Swimming Pool",
]);

export async function scrapeDataSF(): Promise<{
  fetched: number;
  saved: number;
}> {
  console.log("Fetching DataSF Parks & Rec facilities...");

  const url =
    "https://data.sfgov.org/resource/ib5c-xgwu.json?$limit=500";

  let records: DataSFRecord[];
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      console.error(`DataSF API returned ${response.status}`);
      return { fetched: 0, saved: 0 };
    }

    records = await response.json();
  } catch (error) {
    console.error("Failed to fetch DataSF:", error);
    return { fetched: 0, saved: 0 };
  }

  console.log(`Found ${records.length} facilities`);

  // Filter to importable types
  const importable = records.filter(
    (r) => r.facility_type && IMPORTABLE_TYPES.has(r.facility_type)
  );
  console.log(`${importable.length} importable facilities`);

  let saved = 0;

  for (const record of importable) {
    try {
      const name = record.facility_name || record.property_name;
      if (!name) continue;

      // Build a descriptive name
      const displayName =
        record.property_name && record.property_name !== name
          ? `${name} at ${record.property_name}`
          : name;

      const lat = record.latitude ? parseFloat(record.latitude) : null;
      const lng = record.longitude ? parseFloat(record.longitude) : null;

      // Validate coordinates
      if (lat != null && lng != null && !isWithinSF(lat, lng)) continue;

      const { valid } = validateAndClean({ name: displayName });
      if (!valid) continue;

      const venueType = FACILITY_TYPE_MAP[record.facility_type || ""] || "park";
      const neighborhood =
        record.analysis_neighborhood ||
        (lat != null && lng != null ? detectNeighborhood(lat, lng) : null);

      // Build description based on facility type
      const descriptions: Record<string, string> = {
        "Children's Play Area": `Playground at ${record.property_name || name}. San Francisco Parks & Recreation facility.`,
        "Rec Center": `Recreation center with programs and activities. San Francisco Parks & Recreation facility.`,
        "Arts/Activity Center": `Arts and activity center with classes and programs. San Francisco Parks & Recreation facility.`,
        "Recreation Building": `Community recreation building with meeting space and programs.`,
        "Swimming Pool": `Public swimming pool with lap swim and recreation hours.`,
      };

      const isPlayArea = record.facility_type === "Children's Play Area";
      const isPool = record.facility_type === "Swimming Pool";

      const result = await upsertVenue({
        name: displayName,
        address: record.address || "San Francisco, CA",
        neighborhood,
        latitude: lat,
        longitude: lng,
        venueType,
        description: descriptions[record.facility_type || ""] || `San Francisco Parks & Recreation facility.`,
        status: "unverified",
        pricingType: "free",
        hasPlayArea: isPlayArea,
        hasOutdoorSpace: isPlayArea,
        strollerAccessible: true,
        toddlerFriendly: isPlayArea || isPool,
        youngKidFriendly: true,
        teenFriendly: true,
        kidFocused: isPlayArea,
        sourcePlatform: "datasf",
      });

      if (result.created) {
        saved++;
        console.log(`  + ${displayName}`);
      }
    } catch (error) {
      console.error(`  Error: ${record.facility_name}`, error);
    }
  }

  console.log(`DataSF: fetched ${importable.length}, saved ${saved} new`);
  return { fetched: importable.length, saved };
}
