/**
 * Shared pipeline infrastructure for data importers.
 * Provides upsert, geocoding, classification, and validation utilities.
 */

import { db, venues, events } from "./db";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { SF_NEIGHBORHOODS } from "./distance";
import { normalizeUrl } from "./validation";
import type { NewVenue, NewEvent } from "./schema";

// SF bounding box for validation
const SF_BOUNDS = {
  minLat: 37.7,
  maxLat: 37.82,
  minLng: -122.52,
  maxLng: -122.35,
};

// --- Geocoding ---

const NEIGHBORHOOD_PATTERNS: Record<string, string> = {
  mission: "Mission",
  castro: "Castro",
  "noe valley": "Noe Valley",
  bernal: "Bernal Heights",
  potrero: "Potrero Hill",
  dogpatch: "Dogpatch",
  soma: "SoMa",
  "south of market": "SoMa",
  hayes: "Hayes Valley",
  marina: "Marina",
  "pacific heights": "Pacific Heights",
  "north beach": "North Beach",
  chinatown: "Chinatown",
  "financial district": "Financial District",
  sunset: "Sunset",
  richmond: "Richmond",
  haight: "Haight-Ashbury",
  "inner sunset": "Inner Sunset",
  "outer sunset": "Outer Sunset",
  "glen park": "Glen Park",
  excelsior: "Excelsior",
  bayview: "Bayview",
  "hunters point": "Bayview",
  tenderloin: "Tenderloin",
  presidio: "Presidio",
  "golden gate park": "Golden Gate Park",
  embarcadero: "Embarcadero",
  "visitacion valley": "Visitacion Valley",
};

/** Attempt to geocode an address using neighborhood lookup. Returns { lat, lng, neighborhood } or null. */
export function geocodeAddress(address: string): {
  lat: number;
  lng: number;
  neighborhood: string;
} | null {
  const lower = address.toLowerCase();
  for (const [pattern, neighborhood] of Object.entries(NEIGHBORHOOD_PATTERNS)) {
    if (lower.includes(pattern)) {
      const coords = SF_NEIGHBORHOODS[neighborhood];
      if (coords) {
        return { lat: coords.lat, lng: coords.lng, neighborhood };
      }
    }
  }
  return null;
}

/** Detect neighborhood from lat/lng by finding nearest known neighborhood. */
export function detectNeighborhood(
  lat: number,
  lng: number
): string | null {
  let nearest: string | null = null;
  let minDist = Infinity;

  for (const [name, coords] of Object.entries(SF_NEIGHBORHOODS)) {
    const dist = Math.sqrt(
      (coords.lat - lat) ** 2 + (coords.lng - lng) ** 2
    );
    if (dist < minDist) {
      minDist = dist;
      nearest = name;
    }
  }

  // Only return if reasonably close (within ~1 mile)
  return minDist < 0.02 ? nearest : null;
}

// --- Event type classification ---

const EVENT_TYPE_KEYWORDS: Record<string, string[]> = {
  music: ["concert", "music", "band", "jazz", "symphony", "choir", "sing", "dj"],
  sports: ["sports", "soccer", "baseball", "basketball", "swim", "run", "race", "yoga", "fitness"],
  festival: ["festival", "fair", "fiesta", "carnival", "parade", "block party"],
  market: ["market", "farmers", "flea", "bazaar", "craft fair", "pop-up"],
  art: ["art", "gallery", "painting", "drawing", "sculpture", "exhibit", "museum"],
  community: ["community", "volunteer", "meetup", "neighborhood", "workshop", "class"],
  religious: ["church", "temple", "synagogue", "mosque", "worship", "prayer"],
};

export function classifyEventType(
  name: string,
  description?: string | null
): string {
  const text = `${name} ${description || ""}`.toLowerCase();
  let bestType = "community";
  let bestCount = 0;

  for (const [type, keywords] of Object.entries(EVENT_TYPE_KEYWORDS)) {
    const count = keywords.filter((kw) => text.includes(kw)).length;
    if (count > bestCount) {
      bestCount = count;
      bestType = type;
    }
  }

  return bestType;
}

// --- Age group classification ---

const TODDLER_KEYWORDS = [
  "toddler", "baby", "infant", "stroller", "ages 0", "ages 1", "ages 2",
  "all ages", "young children", "preschool", "pre-k",
];

const KID_KEYWORDS = [
  "kid", "child", "children", "youth", "ages 3", "ages 4", "ages 5",
  "ages 6", "ages 7", "ages 8", "elementary", "all ages", "family",
];

const TEEN_KEYWORDS = [
  "teen", "tween", "young adult", "ages 9", "ages 10", "ages 11",
  "ages 12", "ages 13", "all ages", "middle school", "high school",
];

const KID_FOCUSED_KEYWORDS = [
  "storytime", "story time", "puppet", "children's museum", "kids' concert",
  "children's concert", "preschool", "ages 2-5", "ages 3-5", "for kids",
  "for children", "kids only", "children's", "kids'",
];

export function classifyAgeGroups(
  name: string,
  description?: string | null
): {
  toddlerFriendly: boolean;
  youngKidFriendly: boolean;
  teenFriendly: boolean;
  kidFocused: boolean;
} {
  const text = `${name} ${description || ""}`.toLowerCase();
  return {
    toddlerFriendly: TODDLER_KEYWORDS.some((kw) => text.includes(kw)),
    youngKidFriendly:
      KID_KEYWORDS.some((kw) => text.includes(kw)) || text.includes("family"),
    teenFriendly: TEEN_KEYWORDS.some((kw) => text.includes(kw)),
    kidFocused: KID_FOCUSED_KEYWORDS.some((kw) => text.includes(kw)),
  };
}

// --- Validation & cleaning ---

export function isWithinSF(lat: number, lng: number): boolean {
  return (
    lat >= SF_BOUNDS.minLat &&
    lat <= SF_BOUNDS.maxLat &&
    lng >= SF_BOUNDS.minLng &&
    lng <= SF_BOUNDS.maxLng
  );
}

export function isGenericAddress(address: string): boolean {
  const lower = address.toLowerCase().trim();
  return (
    lower === "san francisco, ca" ||
    lower === "san francisco" ||
    lower === "sf" ||
    lower === "sf, ca"
  );
}

export function validateAndClean(record: {
  name?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  imageUrl?: string | null;
  websiteUrl?: string | null;
  sourceUrl?: string | null;
}): { valid: boolean; reason?: string } {
  if (!record.name || record.name.trim().length < 3) {
    return { valid: false, reason: "Name too short" };
  }

  if (
    record.latitude != null &&
    record.longitude != null &&
    !isWithinSF(record.latitude, record.longitude)
  ) {
    return { valid: false, reason: "Outside SF bounds" };
  }

  // Normalize URLs in place
  if (record.imageUrl) {
    record.imageUrl = normalizeUrl(record.imageUrl);
  }
  if (record.websiteUrl) {
    record.websiteUrl = normalizeUrl(record.websiteUrl);
  }
  if (record.sourceUrl) {
    record.sourceUrl = normalizeUrl(record.sourceUrl);
  }

  return { valid: true };
}

// --- Distance proximity check ---

export function areNearby(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  thresholdMiles: number = 0.1
): boolean {
  // Approximate: 1 degree lat ≈ 69 miles, 1 degree lng ≈ 55 miles at SF latitude
  const dLat = Math.abs(lat1 - lat2) * 69;
  const dLng = Math.abs(lng1 - lng2) * 55;
  return Math.sqrt(dLat * dLat + dLng * dLng) < thresholdMiles;
}

// --- Upsert operations ---

export async function upsertVenue(data: {
  name: string;
  address: string;
  neighborhood?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  venueType?: string | null;
  hoursJson?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  websiteUrl?: string | null;
  status?: string;
  pricingType?: string | null;
  adultPrice?: number | null;
  childPrice?: number | null;
  toddlerPrice?: number | null;
  teenPrice?: number | null;
  pricingNotes?: string | null;
  hasPlayArea?: boolean;
  hasOutdoorSpace?: boolean;
  strollerAccessible?: boolean;
  toddlerFriendly?: boolean;
  youngKidFriendly?: boolean;
  teenFriendly?: boolean;
  kidFocused?: boolean;
  sourcePlatform?: string;
}): Promise<{ id: string; created: boolean }> {
  // Try to find existing venue by name (case-insensitive)
  const existing = await db.query.venues.findFirst({
    where: (v, { eq }) =>
      sql`lower(${v.name}) = lower(${data.name})`,
  });

  if (existing) {
    // Update fields that are currently empty
    const updates: Record<string, unknown> = {};
    if (!existing.latitude && data.latitude) {
      updates.latitude = data.latitude;
      updates.longitude = data.longitude;
    }
    if (!existing.neighborhood && data.neighborhood) {
      updates.neighborhood = data.neighborhood;
    }
    if (!existing.hoursJson && data.hoursJson) {
      updates.hoursJson = data.hoursJson;
    }
    if (!existing.imageUrl && data.imageUrl) {
      updates.imageUrl = data.imageUrl;
    }
    if (!existing.websiteUrl && data.websiteUrl) {
      updates.websiteUrl = data.websiteUrl;
    }
    if (!existing.description && data.description) {
      updates.description = data.description;
    }
    if (!existing.pricingType && data.pricingType) {
      updates.pricingType = data.pricingType;
    }

    if (Object.keys(updates).length > 0) {
      updates.lastVerifiedAt = new Date().toISOString();
      await db.update(venues).set(updates).where(eq(venues.id, existing.id));
    }

    return { id: existing.id, created: false };
  }

  // Create new venue
  const id = nanoid();
  const now = new Date().toISOString();

  await db.insert(venues).values({
    id,
    name: data.name,
    address: data.address,
    neighborhood: data.neighborhood || null,
    latitude: data.latitude || null,
    longitude: data.longitude || null,
    venueType: data.venueType || null,
    hoursJson: data.hoursJson || null,
    description: data.description || null,
    imageUrl: data.imageUrl || null,
    websiteUrl: data.websiteUrl || null,
    status: data.status || "active",
    pricingType: data.pricingType || null,
    adultPrice: data.adultPrice || null,
    childPrice: data.childPrice || null,
    toddlerPrice: data.toddlerPrice || null,
    teenPrice: data.teenPrice || null,
    pricingNotes: data.pricingNotes || null,
    hasPlayArea: data.hasPlayArea || false,
    hasOutdoorSpace: data.hasOutdoorSpace || false,
    strollerAccessible: data.strollerAccessible || false,
    toddlerFriendly: data.toddlerFriendly ?? true,
    youngKidFriendly: data.youngKidFriendly ?? true,
    teenFriendly: data.teenFriendly ?? true,
    kidFocused: data.kidFocused || false,
    lastVerifiedAt: now,
    createdAt: now,
  });

  return { id, created: true };
}

export async function upsertEvent(data: {
  name: string;
  description?: string | null;
  venueId?: string | null;
  address?: string | null;
  eventType?: string | null;
  startTime: string;
  endTime?: string | null;
  isRecurring?: boolean;
  imageUrl?: string | null;
  sourceUrl?: string | null;
  sourcePlatform: string;
  pricingType?: string | null;
  adultPrice?: number | null;
  childPrice?: number | null;
  toddlerPrice?: number | null;
  teenPrice?: number | null;
  pricingNotes?: string | null;
  hasKidsActivities?: boolean;
  outdoor?: boolean;
  toddlerFriendly?: boolean;
  youngKidFriendly?: boolean;
  teenFriendly?: boolean;
  kidFocused?: boolean;
}): Promise<{ id: string; created: boolean }> {
  // Deduplicate by sourceUrl first (most reliable)
  if (data.sourceUrl) {
    const existing = await db.query.events.findFirst({
      where: (e, { eq }) => eq(e.sourceUrl, data.sourceUrl!),
    });
    if (existing) {
      // Update lastUpdatedAt
      await db
        .update(events)
        .set({ lastUpdatedAt: new Date().toISOString() })
        .where(eq(events.id, existing.id));
      return { id: existing.id, created: false };
    }
  }

  // Also deduplicate by name + date (fuzzy)
  const startDate = data.startTime.split("T")[0];
  const existing = await db.query.events.findFirst({
    where: (e, { and }) =>
      and(
        sql`lower(${e.name}) = lower(${data.name})`,
        sql`${e.startTime} LIKE ${startDate + "%"}`
      ),
  });

  if (existing) {
    await db
      .update(events)
      .set({ lastUpdatedAt: new Date().toISOString() })
      .where(eq(events.id, existing.id));
    return { id: existing.id, created: false };
  }

  const id = nanoid();
  const now = new Date().toISOString();

  await db.insert(events).values({
    id,
    name: data.name,
    description: data.description || null,
    venueId: data.venueId || null,
    address: data.address || null,
    eventType: data.eventType || "community",
    startTime: data.startTime,
    endTime: data.endTime || null,
    isRecurring: data.isRecurring || false,
    imageUrl: data.imageUrl || null,
    sourceUrl: data.sourceUrl || null,
    sourcePlatform: data.sourcePlatform,
    lastUpdatedAt: now,
    createdAt: now,
    pricingType: data.pricingType || null,
    adultPrice: data.adultPrice || null,
    childPrice: data.childPrice || null,
    toddlerPrice: data.toddlerPrice || null,
    teenPrice: data.teenPrice || null,
    pricingNotes: data.pricingNotes || null,
    hasKidsActivities: data.hasKidsActivities || false,
    outdoor: data.outdoor || false,
    toddlerFriendly: data.toddlerFriendly ?? true,
    youngKidFriendly: data.youngKidFriendly ?? true,
    teenFriendly: data.teenFriendly ?? true,
    kidFocused: data.kidFocused || false,
  });

  return { id, created: true };
}
