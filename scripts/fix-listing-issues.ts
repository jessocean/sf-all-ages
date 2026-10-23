/**
 * Script to fix listing accuracy issues in the production database.
 * Run with: npx tsx scripts/fix-listing-issues.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { eq, like } from "drizzle-orm";
import * as schema from "../src/lib/schema";
import { findVenueImage } from "../src/lib/images";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const db = drizzle(client, { schema });

// Correct URLs for venues with broken website URLs
const VENUE_URL_FIXES: Record<string, string | null> = {
  "Dolores Park": "https://sfrecpark.org/facilities/facility/details/Mission-Dolores-Park-188",
  "Reality SF": "https://realitysf.com/about/",
  "Julius Kahn Playground": "https://sfrecpark.org/facilities/facility/details/presidiowallplayground-251",
  "Sue Bierman Park": "https://sfrecpark.org/1011/Sue-Bierman-Embarcadero-Plaza-Picnic-Are",
  "Huntington Park": "https://sfrecpark.org/facilities/facility/details/huntingtonpark-438",
  "Moscone Recreation Center Playground": "https://sfrecpark.org/569/Moscone-Recreation-Center---East-Playgro",
  "Glen Canyon Park": "https://sfrecpark.org/facilities/facility/details/glencanyonpark-336",
  "Tartine Manufactory": "https://tartinebakery.com/san-francisco/manufactory",
  "St. Gregory of Nyssa Episcopal Church": "https://saintgregorys.org/",
  "Randall Museum": "https://randallmuseum.org/",
  "House of Air": "https://houseofair.com/san-francisco/",
  "Presidio Tunnel Tops": "https://www.presidio.gov/places/presidio-tunnel-tops",
  "Grace Cathedral": "https://www.gracecathedral.org",
  "Koret Children's Quarter": "https://sf-parks.com/koret-childrens-quarter-and-carousel/",
  "Crocker Amazon Playground": "https://sfrecpark.org/1194/Crocker-Amazon-Playground-Community-Mee",
  "Joe DiMaggio Playground": "https://sfrecpark.org/facilities/facility/details/Joe-DiMaggio-Playground-249",
  "Farmhouse Kitchen Thai": "https://www.farmhousethai.com",
  "Harmonic Brewing": "http://harmonicbrewing.com",
  "Musee Mecanique": "http://www.museemechanique.org/",
  "Seward Street Slides": "https://sfrecpark.org/facilities/facility/details/Seward-Mini-Park-560",
  "Pier 39 Sea Lions": "https://www.pier39.com/the-sea-lions/",
};

// Correct URLs for events with broken source URLs
const EVENT_URL_FIXES: Record<string, string | null> = {
  "St. Gregory's Sunday Service & Potluck": "https://saintgregorys.org/",
  "Randall Museum Animal Discovery": "https://randallmuseum.org/",
  "Baby Rhyme Time - Noe Valley Library": "https://sfpl.org/events",
  "Bilingual Storytime (Spanish/English) - Mission Library": "https://sfpl.org/events",
  "Stonestown Farmers Market": "https://www.agriculturalinstitute.org/stonestown-farmers-market",
  "Divisadero Farmers Market": "https://www.pcfma.org/market/divisadero-farmers-market",
  "Little Learners - California Academy of Sciences": "https://www.calacademy.org/exhibits/curiosity-grove",
  "Golden Gate Park Carousel": "https://sf-parks.com/koret-childrens-quarter-and-carousel/",
  "Open Gym - Moscone Rec Center": "https://sf-parks.com/moscone-recreation-center/",
  "Free First Tuesday - de Young & Legion of Honor": "https://www.famsf.org",
  "Third Friday Free - Children's Creativity Museum": "https://creativity.org",
  "Tot Shabbat - Congregation Sherith Israel": "https://www.sherithisrael.org",
  "Grace Cathedral Yoga on the Labyrinth": "https://gracecathedral.org/yoga",
};

const PLACEHOLDER_PATTERNS = [
  /placehold\.co/i,
  /placeholder/i,
  /picsum\.photos/i,
  /via\.placeholder/i,
  /dummyimage/i,
  /fakeimg/i,
  /lorempixel/i,
];

const STOCK_PHOTO_PATTERNS = [/unsplash\.com/i, /pexels\.com/i, /shutterstock/i, /getty/i, /stock/i];

const VERIFIED_WIKIMEDIA_URLS = new Set([
  "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Japanese_Tea_Garden_%28San_Francisco%29.jpg/960px-Japanese_Tea_Garden_%28San_Francisco%29.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Glide_Memorial_Church.jpg/960px-Glide_Memorial_Church.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/The_Temple_Sherith_Israel.jpg/960px-The_Temple_Sherith_Israel.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/South_end_of_JFK_Drive_underpass%2C_April_2021.jpg/960px-South_end_of_JFK_Drive_underpass%2C_April_2021.jpg",
]);

function needsImageUpdate(url: string | null): boolean {
  if (!url) return true;
  if (PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(url))) return true;
  if (STOCK_PHOTO_PATTERNS.some((pattern) => pattern.test(url))) return true;
  if (url.includes("upload.wikimedia.org") && !VERIFIED_WIKIMEDIA_URLS.has(url)) return true;
  return false;
}

async function fixVenueUrls() {
  console.log("\n=== Fixing Venue Website URLs ===\n");

  for (const [venueName, newUrl] of Object.entries(VENUE_URL_FIXES)) {
    try {
      const result = await db
        .update(schema.venues)
        .set({ websiteUrl: newUrl })
        .where(like(schema.venues.name, `%${venueName}%`));

      console.log(`✓ Fixed URL for: ${venueName}`);
    } catch (error) {
      console.error(`✗ Failed to fix URL for ${venueName}:`, error);
    }
  }
}

async function fixEventUrls() {
  console.log("\n=== Fixing Event Source URLs ===\n");

  for (const [eventName, newUrl] of Object.entries(EVENT_URL_FIXES)) {
    try {
      const result = await db
        .update(schema.events)
        .set({ sourceUrl: newUrl })
        .where(like(schema.events.name, `%${eventName.split(" - ")[0]}%`));

      console.log(`✓ Fixed URL for: ${eventName}`);
    } catch (error) {
      console.error(`✗ Failed to fix URL for ${eventName}:`, error);
    }
  }
}

async function fixImageUrls() {
  console.log("\n=== Fixing Venue Image URLs ===\n");

  // Get all venues
  const venues = await db.select().from(schema.venues);

  for (const venue of venues) {
    if (!needsImageUpdate(venue.imageUrl)) {
      continue;
    }

    const newImageUrl = findVenueImage(venue.name, venue.venueType);

    if (newImageUrl && newImageUrl !== venue.imageUrl) {
      try {
        await db
          .update(schema.venues)
          .set({ imageUrl: newImageUrl })
          .where(eq(schema.venues.id, venue.id));

        console.log(`✓ Fixed image for: ${venue.name}`);
      } catch (error) {
        console.error(`✗ Failed to fix image for ${venue.name}:`, error);
      }
    }
  }
}

async function main() {
  console.log("Starting listing fixes...\n");
  console.log(`Connected to: ${process.env.TURSO_DATABASE_URL}`);

  await fixVenueUrls();
  await fixEventUrls();
  await fixImageUrls();

  console.log("\n=== Done! ===\n");
}

main().catch(console.error);
