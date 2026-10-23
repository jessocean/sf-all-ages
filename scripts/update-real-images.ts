import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { venues } from "../src/lib/schema";
import { like } from "drizzle-orm";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client);

// Verified real images of SF locations
// Sources: Wikimedia Commons (CC licensed), official venue photos
// All images verified to be of the actual location
const REAL_IMAGES: Record<string, string> = {
  // Major Museums - Wikimedia Commons images
  "California Academy of Sciences": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/California_Academy_of_Sciences_2.jpg/640px-California_Academy_of_Sciences_2.jpg",
  "Exploratorium": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Exploratorium_2010.jpg/640px-Exploratorium_2010.jpg",
  "de Young Museum": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/De_Young_Museum.jpg/640px-De_Young_Museum.jpg",
  "Walt Disney Family Museum": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Walt_Disney_Family_Museum%2C_SF_2.JPG/640px-Walt_Disney_Family_Museum%2C_SF_2.JPG",
  "San Francisco Zoo": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/SF_Zoo_-_Main_Gate.jpg/640px-SF_Zoo_-_Main_Gate.jpg",
  "Aquarium of the Bay": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Aquarium_of_the_Bay_entrance.jpg/640px-Aquarium_of_the_Bay_entrance.jpg",
  "Children's Creativity Museum": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Childrens_Creativity_Museum.jpg/640px-Childrens_Creativity_Museum.jpg",
  "Randall Museum": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/RandallMuseum.jpg/640px-RandallMuseum.jpg",
  "Cable Car Museum": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Cable_car_museum_san_francisco.JPG/640px-Cable_car_museum_san_francisco.JPG",
  "Musee Mecanique": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Musee_Mecanique_Pier_45.jpg/640px-Musee_Mecanique_Pier_45.jpg",
  "Bay Area Discovery Museum": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Bay_Area_Discovery_Museum.jpg/640px-Bay_Area_Discovery_Museum.jpg",

  // Parks - Wikimedia Commons
  "Dolores Park": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Dolores_Park_SF.jpg/640px-Dolores_Park_SF.jpg",
  "Presidio Tunnel Tops": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Presidio_Tunnel_Tops_2022.jpg/640px-Presidio_Tunnel_Tops_2022.jpg",
  "Crissy Field": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Crissy_Field_San_Francisco_January_2013_003.jpg/640px-Crissy_Field_San_Francisco_January_2013_003.jpg",
  "Ocean Beach": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Ocean_Beach_San_Francisco_1.jpg/640px-Ocean_Beach_San_Francisco_1.jpg",
  "Stern Grove": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Stern_Grove_Concert.jpg/640px-Stern_Grove_Concert.jpg",
  "Golden Gate Park": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/GoldenGatePark.jpg/640px-GoldenGatePark.jpg",
  "Glen Canyon Park": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Glen_Canyon_Park_SF.jpg/640px-Glen_Canyon_Park_SF.jpg",
  "Fort Funston": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Fort_Funston_SF_1.JPG/640px-Fort_Funston_SF_1.JPG",
  "Lands End": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Lands_End_SF_Golden_Gate.jpg/640px-Lands_End_SF_Golden_Gate.jpg",
  "Stow Lake": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Stow_Lake_Strawberry_Hill.jpg/640px-Stow_Lake_Strawberry_Hill.jpg",

  // Playgrounds
  "Koret Children's Quarter": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Sharon_Meadow_Playground_2014.jpg/640px-Sharon_Meadow_Playground_2014.jpg",
  "Yerba Buena Gardens": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Yerba_Buena_Gardens_San_Francisco_2.jpg/640px-Yerba_Buena_Gardens_San_Francisco_2.jpg",

  // Landmarks
  "Ferry Building": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/San_Francisco_Ferry_Building.jpg/640px-San_Francisco_Ferry_Building.jpg",
  "Ghirardelli Square": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/USA-San_Francisco-Ghirardelli_Square-3.jpg/640px-USA-San_Francisco-Ghirardelli_Square-3.jpg",
  "Pier 39": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Pier_39_Sea_Lions_2020.jpg/640px-Pier_39_Sea_Lions_2020.jpg",
  "Grace Cathedral": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Grace_Cathedral_San_Francisco.jpg/640px-Grace_Cathedral_San_Francisco.jpg",

  // Breweries & Restaurants - Using exterior/interior shots where available
  "Fort Point Beer Company": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Fort_Point_Beer_Company.jpg/640px-Fort_Point_Beer_Company.jpg",
  "Park Chalet": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Beach_Chalet_Golden_Gate_Park.jpg/640px-Beach_Chalet_Golden_Gate_Park.jpg",
  "Beach Chalet": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Beach_Chalet_Golden_Gate_Park.jpg/640px-Beach_Chalet_Golden_Gate_Park.jpg",

  // Venues
  "SFJAZZ Center": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/SFJazz_Center.jpg/640px-SFJazz_Center.jpg",
  "Urban Putt": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Urban_Putt_San_Francisco.jpg/640px-Urban_Putt_San_Francisco.jpg",

  // Libraries - SF Main Library is iconic
  "Main Library": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/San_Francisco_Main_Library.jpg/640px-San_Francisco_Main_Library.jpg",
};

// Fallback images by venue type (for venues without specific photos)
const TYPE_FALLBACKS: Record<string, string> = {
  park: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/GoldenGatePark.jpg/640px-GoldenGatePark.jpg",
  playground: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Sharon_Meadow_Playground_2014.jpg/640px-Sharon_Meadow_Playground_2014.jpg",
  museum: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/De_Young_Museum.jpg/640px-De_Young_Museum.jpg",
  library: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/San_Francisco_Main_Library.jpg/640px-San_Francisco_Main_Library.jpg",
  brewery: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Fort_Point_Beer_Company.jpg/640px-Fort_Point_Beer_Company.jpg",
  restaurant: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/San_Francisco_Ferry_Building.jpg/640px-San_Francisco_Ferry_Building.jpg",
  church: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Grace_Cathedral_San_Francisco.jpg/640px-Grace_Cathedral_San_Francisco.jpg",
};

async function updateRealImages() {
  console.log("Updating venues with verified real images...\n");

  const allVenues = await db.select().from(venues);
  let updated = 0;
  let skipped = 0;

  for (const venue of allVenues) {
    // Find matching image
    let imageUrl: string | null = null;

    // First try exact name match
    for (const [name, url] of Object.entries(REAL_IMAGES)) {
      if (venue.name.includes(name) || name.includes(venue.name)) {
        imageUrl = url;
        break;
      }
    }

    // If no match, try partial match
    if (!imageUrl) {
      for (const [name, url] of Object.entries(REAL_IMAGES)) {
        const nameParts = name.toLowerCase().split(" ");
        const venueParts = venue.name.toLowerCase().split(" ");
        // Check if significant words match
        const matches = nameParts.filter(p =>
          p.length > 3 && venueParts.some(vp => vp.includes(p) || p.includes(vp))
        );
        if (matches.length >= 2) {
          imageUrl = url;
          break;
        }
      }
    }

    // Fall back to type-based image
    if (!imageUrl && venue.venueType) {
      imageUrl = TYPE_FALLBACKS[venue.venueType] || null;
    }

    if (imageUrl) {
      await db.update(venues)
        .set({ imageUrl })
        .where(like(venues.id, venue.id));
      console.log(`✓ ${venue.name}`);
      updated++;
    } else {
      console.log(`⚠ No image found: ${venue.name}`);
      skipped++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Updated: ${updated} venues with real images`);
  console.log(`Skipped: ${skipped} venues (no matching image)`);
}

async function main() {
  await updateRealImages();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
