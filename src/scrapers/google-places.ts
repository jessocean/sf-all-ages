/**
 * Google Places API (New) enrichment layer.
 * Fills in hours, photos, pricing for venues missing data.
 *
 * Uses Text Search + Place Details. 5,000 free calls/month.
 * Requires GOOGLE_PLACES_API_KEY env var.
 */

import { db, venues } from "@/lib/db";
import { eq, isNull, or } from "drizzle-orm";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACES_API_BASE = "https://places.googleapis.com/v1/places";
const FIELD_MASK =
  "places.id,places.displayName,places.goodForChildren,places.regularOpeningHours,places.priceLevel,places.photos,places.accessibilityOptions";

interface PlacesSearchResult {
  places?: Array<{
    id: string;
    displayName?: { text: string };
    goodForChildren?: boolean;
    regularOpeningHours?: {
      weekdayDescriptions?: string[];
      periods?: Array<{
        open: { day: number; hour: number; minute: number };
        close?: { day: number; hour: number; minute: number };
      }>;
    };
    priceLevel?: string;
    photos?: Array<{ name: string }>;
    accessibilityOptions?: {
      wheelchairAccessibleEntrance?: boolean;
    };
  }>;
}

const PRICE_LEVEL_MAP: Record<string, string> = {
  PRICE_LEVEL_FREE: "free",
  PRICE_LEVEL_INEXPENSIVE: "free", // map inexpensive -> menu for cafes etc
  PRICE_LEVEL_MODERATE: "menu",
  PRICE_LEVEL_EXPENSIVE: "menu",
  PRICE_LEVEL_VERY_EXPENSIVE: "menu",
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Convert Google opening hours periods to our hoursJson format. */
function convertHours(
  periods?: Array<{
    open: { day: number; hour: number; minute: number };
    close?: { day: number; hour: number; minute: number };
  }>
): string | null {
  if (!periods || periods.length === 0) return null;

  const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const result: Record<string, string> = {};

  for (const period of periods) {
    const day = dayNames[period.open.day];
    if (!day) continue;

    const openTime = `${String(period.open.hour).padStart(2, "0")}:${String(period.open.minute).padStart(2, "0")}`;
    const closeTime = period.close
      ? `${String(period.close.hour).padStart(2, "0")}:${String(period.close.minute).padStart(2, "0")}`
      : "23:59";

    result[day] = `${openTime}-${closeTime}`;
  }

  return Object.keys(result).length > 0 ? JSON.stringify(result) : null;
}

/** Get a photo URL from a Google Places photo reference. */
function getPhotoUrl(photoName: string): string {
  return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=640&maxWidthPx=640&key=${API_KEY}`;
}

export async function enrichWithGooglePlaces(): Promise<{
  checked: number;
  enriched: number;
}> {
  if (!API_KEY) {
    console.log(
      "Skipping Google Places enrichment (no GOOGLE_PLACES_API_KEY)"
    );
    return { checked: 0, enriched: 0 };
  }

  console.log("Enriching venues with Google Places API...");

  // Find venues missing hours, images, or pricing
  const needsEnrichment = await db
    .select({
      id: venues.id,
      name: venues.name,
      hoursJson: venues.hoursJson,
      imageUrl: venues.imageUrl,
      pricingType: venues.pricingType,
    })
    .from(venues)
    .where(
      or(isNull(venues.hoursJson), isNull(venues.imageUrl), isNull(venues.pricingType))
    )
    .limit(50); // Cap at 50 per run to stay within free tier

  console.log(`${needsEnrichment.length} venues need enrichment`);

  let enriched = 0;

  for (const venue of needsEnrichment) {
    try {
      // Text Search to find the place
      const searchResponse = await fetch(
        `${PLACES_API_BASE}:searchText`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": API_KEY,
            "X-Goog-FieldMask": FIELD_MASK,
          },
          body: JSON.stringify({
            textQuery: `${venue.name} San Francisco`,
          }),
        }
      );

      if (!searchResponse.ok) {
        console.error(
          `  Google Places search failed for "${venue.name}": ${searchResponse.status}`
        );
        await delay(1000);
        continue;
      }

      const searchData: PlacesSearchResult = await searchResponse.json();
      const place = searchData.places?.[0];

      if (!place) {
        console.log(`  No Google Places result for "${venue.name}"`);
        await delay(500);
        continue;
      }

      // Build update
      const updates: Record<string, unknown> = {};

      if (!venue.hoursJson && place.regularOpeningHours?.periods) {
        const hours = convertHours(place.regularOpeningHours.periods);
        if (hours) updates.hoursJson = hours;
      }

      if (!venue.imageUrl && place.photos && place.photos.length > 0) {
        updates.imageUrl = getPhotoUrl(place.photos[0].name);
      }

      if (!venue.pricingType && place.priceLevel) {
        updates.pricingType =
          PRICE_LEVEL_MAP[place.priceLevel] || null;
      }

      if (place.accessibilityOptions?.wheelchairAccessibleEntrance) {
        updates.strollerAccessible = true;
      }

      if (Object.keys(updates).length > 0) {
        updates.lastVerifiedAt = new Date().toISOString();
        await db
          .update(venues)
          .set(updates)
          .where(eq(venues.id, venue.id));
        enriched++;
        console.log(`  Enriched: ${venue.name}`);
      }

      // Rate limit
      await delay(200);
    } catch (error) {
      console.error(`  Error enriching "${venue.name}":`, error);
    }
  }

  console.log(
    `Google Places: checked ${needsEnrichment.length}, enriched ${enriched}`
  );
  return { checked: needsEnrichment.length, enriched };
}
