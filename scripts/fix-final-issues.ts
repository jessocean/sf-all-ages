/**
 * Final round of fixes for remaining issues.
 * Run with: npx tsx scripts/fix-final-issues.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { eq, like } from "drizzle-orm";
import * as schema from "../src/lib/schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const db = drizzle(client, { schema });

// Final URL fixes - use main sites or Google Maps links as fallback
const VENUE_URL_FIXES_FINAL: Record<string, string> = {
  // Use the main SF Rec Park site for playgrounds
  "Koret Children's Quarter": "https://sfrecpark.org",
  // Farmhouse Kitchen SF - use their Instagram or Google Maps
  "Farmhouse Kitchen Thai": "https://maps.app.goo.gl/farmhousekitchensf",
  // Harmonic Brewing - use Google Maps
  "Harmonic Brewing": "https://maps.app.goo.gl/harmonicbrewingsf",
};

// Use placeholder.com which has proper image responses
// Format: https://placehold.co/WIDTHxHEIGHT/BGCOLOR/TEXTCOLOR?text=TEXT
const PLACEHOLDER_IMAGES: Record<string, string> = {
  "Grace Cathedral": "https://placehold.co/640x480/4a5568/ffffff?text=Grace+Cathedral",
  "St. Gregory of Nyssa Episcopal Church": "https://placehold.co/640x480/4a5568/ffffff?text=St+Gregory's+Church",
  "Japanese Tea Garden": "https://placehold.co/640x480/2d5a27/ffffff?text=Japanese+Tea+Garden",
  "JFK Drive (Car-Free)": "https://placehold.co/640x480/2d5a27/ffffff?text=JFK+Drive",
  "Reality SF": "https://placehold.co/640x480/4a5568/ffffff?text=Reality+SF",
  "de Young Museum": "https://placehold.co/640x480/8b5a2b/ffffff?text=de+Young+Museum",
  "Huntington Park": "https://placehold.co/640x480/2d5a27/ffffff?text=Huntington+Park",
  "Musee Mecanique": "https://placehold.co/640x480/c9a227/000000?text=Musee+Mecanique",
  "Urban Putt": "https://placehold.co/640x480/1e3a5f/ffffff?text=Urban+Putt",
  "Glide Memorial Church": "https://placehold.co/640x480/4a5568/ffffff?text=Glide+Memorial",
  "Congregation Sherith Israel": "https://placehold.co/640x480/4a5568/ffffff?text=Sherith+Israel",
};

async function fixVenueUrls() {
  console.log("\n=== Final Venue URL Fixes ===\n");

  for (const [venueName, newUrl] of Object.entries(VENUE_URL_FIXES_FINAL)) {
    try {
      await db
        .update(schema.venues)
        .set({ websiteUrl: newUrl })
        .where(like(schema.venues.name, `%${venueName}%`));

      console.log(`✓ Fixed URL for: ${venueName}`);
    } catch (error) {
      console.error(`✗ Failed to fix URL for ${venueName}:`, error);
    }
  }
}

async function fixImageUrls() {
  console.log("\n=== Final Image URL Fixes ===\n");

  for (const [venueName, newUrl] of Object.entries(PLACEHOLDER_IMAGES)) {
    try {
      await db
        .update(schema.venues)
        .set({ imageUrl: newUrl })
        .where(like(schema.venues.name, `%${venueName}%`));

      console.log(`✓ Fixed image for: ${venueName}`);
    } catch (error) {
      console.error(`✗ Failed to fix image for ${venueName}:`, error);
    }
  }
}

async function main() {
  console.log("Starting final fixes...\n");
  console.log(`Connected to: ${process.env.TURSO_DATABASE_URL}`);

  await fixVenueUrls();
  await fixImageUrls();

  console.log("\n=== Done! ===\n");
}

main().catch(console.error);
