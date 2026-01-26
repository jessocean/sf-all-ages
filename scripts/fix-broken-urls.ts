import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { venues } from "../src/lib/schema";
import { eq, like } from "drizzle-orm";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client);

// Corrected URLs for venues with broken links
const URL_FIXES: Record<string, string> = {
  // sfrecpark.org URLs changed to the new format
  "Dolores Park": "https://sfrecpark.org/770/Mission-Dolores-Park",
  "Koret Children's Quarter": "https://sfrecpark.org/Facilities/Facility/Details/Koret-Childrens-Quarter-Playground-308",
  "Julius Kahn Playground": "https://sfrecpark.org/Facilities/Facility/Details/Julius-Kahn-Playground-307",
  "Mountain Lake Park Playground": "https://sfrecpark.org/770/Mountain-Lake-Park",
  "Crocker Amazon Playground": "https://sfrecpark.org/Facilities/Facility/Details/Crocker-Amazon-Playground-153",
  "Sue Bierman Park": "https://sfrecpark.org/770/Sue-Bierman-Park",
  "Huntington Park": "https://sfrecpark.org/770/Huntington-Park",
  "Moscone Recreation Center Playground": "https://sfrecpark.org/Facilities/Facility/Details/Moscone-Recreation-Center-189",
  "Glen Canyon Park": "https://sfrecpark.org/770/Glen-Canyon-Park",
  "Joe DiMaggio Playground": "https://sfrecpark.org/Facilities/Facility/Details/Joe-DiMaggio-Playground-306",
  "Seward Street Slides": "https://sfrecpark.org/Facilities/Facility/Details/Seward-Mini-Park-235",

  // Library URLs
  "Noe Valley/Sally Brunn Library": "https://sfpl.org/locations/noe-valley",
  "Sunset Branch Library": "https://sfpl.org/locations/sunset",
  "Mission Branch Library": "https://sfpl.org/locations/mission",

  // Other fixes
  "Pier 39 Sea Lions": "https://www.pier39.com/attraction/the-sea-lions/",
  "Ocean Beach": "https://www.parksconservancy.org/parks/ocean-beach",
  "Farmhouse Kitchen Thai": "https://www.farmhousekitchen.com",
  "Tartine Manufactory": "https://tartinebakery.com/san-francisco/manufactory",
  "Harmonic Brewing": "https://www.harmonicbrewing.com",
  "Congregation Sherith Israel": "https://www.sherithisrael.org",

  // These sites block HEAD requests but work fine - keep as is
  // Exploratorium, Grace Cathedral, SFJAZZ Center all work in browser
};

async function fixBrokenUrls() {
  console.log("Fixing broken venue URLs...\n");

  let fixed = 0;

  for (const [venueName, correctUrl] of Object.entries(URL_FIXES)) {
    const result = await db
      .update(venues)
      .set({ websiteUrl: correctUrl })
      .where(like(venues.name, `%${venueName}%`));

    console.log(`✓ Fixed: ${venueName}`);
    fixed++;
  }

  console.log(`\nFixed ${fixed} venue URLs`);
}

async function main() {
  await fixBrokenUrls();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
