import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { venues, events } from "../src/lib/schema";
import { eq } from "drizzle-orm";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client);

// Pricing data for major SF attractions (researched January 2025)
const VENUE_UPDATES: Record<string, {
  pricingType?: string;
  adultPrice?: number;
  childPrice?: number;   // 4-12 years
  toddlerPrice?: number; // 0-3 years
  teenPrice?: number;    // 13-17 years
  pricingNotes?: string;
  imageUrl?: string;
  websiteUrl?: string;
}> = {
  "California Academy of Sciences": {
    pricingType: "per_person",
    adultPrice: 41.95,
    childPrice: 31.95,   // 4-11
    toddlerPrice: 0,     // 3 and under free
    teenPrice: 36.95,    // 12-17
    pricingNotes: "Free for members. Discounts for SF residents.",
    imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
    websiteUrl: "https://www.calacademy.org",
  },
  "Exploratorium": {
    pricingType: "per_person",
    adultPrice: 39.95,
    childPrice: 29.95,   // 4-12
    toddlerPrice: 0,     // 3 and under free
    teenPrice: 29.95,    // 13-17
    pricingNotes: "Free first Wednesday monthly for Bay Area residents.",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    websiteUrl: "https://www.exploratorium.edu",
  },
  "San Francisco Zoo": {
    pricingType: "per_person",
    adultPrice: 28,
    childPrice: 22,      // 4-14
    toddlerPrice: 0,     // 3 and under free
    teenPrice: 22,       // 15-17
    pricingNotes: "Free first Wednesday of month for SF residents.",
    imageUrl: "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=400",
    websiteUrl: "https://www.sfzoo.org",
  },
  "de Young Museum": {
    pricingType: "per_person",
    adultPrice: 17,
    childPrice: 0,       // 17 and under free
    toddlerPrice: 0,
    teenPrice: 0,
    pricingNotes: "Free for 17 and under. Free first Tuesday monthly.",
    imageUrl: "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=400",
    websiteUrl: "https://www.famsf.org/de-young",
  },
  "Walt Disney Family Museum": {
    pricingType: "per_person",
    adultPrice: 35,
    childPrice: 0,       // 5 and under free
    toddlerPrice: 0,
    teenPrice: 25,       // 6-17
    pricingNotes: "Children 5 and under free.",
    imageUrl: "https://images.unsplash.com/photo-1597466599360-3b9775841aec?w=400",
    websiteUrl: "https://www.waltdisney.org",
  },
  "Children's Creativity Museum": {
    pricingType: "per_person",
    adultPrice: 16,
    childPrice: 16,
    toddlerPrice: 0,     // 2 and under free
    teenPrice: 16,
    pricingNotes: "Children under 2 free. Free third Friday monthly.",
    imageUrl: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400",
    websiteUrl: "https://creativity.org",
  },
  "Bay Area Discovery Museum": {
    pricingType: "per_person",
    adultPrice: 17,
    childPrice: 17,
    toddlerPrice: 0,     // Under 1 free
    teenPrice: 17,
    pricingNotes: "Babies under 1 free. Free first Wednesday monthly.",
    imageUrl: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400",
    websiteUrl: "https://bayareadiscoverymuseum.org",
  },
  "Aquarium of the Bay": {
    pricingType: "per_person",
    adultPrice: 28.95,
    childPrice: 18.95,   // 4-12
    toddlerPrice: 0,     // 3 and under free
    teenPrice: 23.95,    // 13-17
    pricingNotes: "Children 3 and under free.",
    imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400",
    websiteUrl: "https://www.aquariumofthebay.org",
  },
  "Randall Museum": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    pricingNotes: "Free admission. Donations welcome.",
    imageUrl: "https://images.unsplash.com/photo-1582845512747-e42001c95638?w=400",
    websiteUrl: "https://www.randallmuseum.org",
  },
  "Musee Mecanique": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    pricingNotes: "Free admission. Games cost $0.25-$1.",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    websiteUrl: "https://museemecanique.com",
  },
  "Cable Car Museum": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    pricingNotes: "Free admission.",
    imageUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400",
    websiteUrl: "https://www.cablecarmuseum.org",
  },
  "Fort Point Beer Company - Valencia": {
    pricingType: "menu",
    imageUrl: "https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=400",
    websiteUrl: "https://www.fortpointbeer.com",
  },
  "Spark Social SF": {
    pricingType: "menu",
    imageUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400",
    websiteUrl: "https://www.sparksocialsf.com",
  },
  "Park Chalet": {
    pricingType: "menu",
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
    websiteUrl: "https://www.parkchalet.com",
  },
  "Beach Chalet": {
    pricingType: "menu",
    imageUrl: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400",
    websiteUrl: "https://www.beachchalet.com",
  },
  "Dolores Park": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    imageUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400",
  },
  "Presidio Tunnel Tops": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    pricingNotes: "Free. Parking fees apply.",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    websiteUrl: "https://www.presidiotunneltops.gov.org",
  },
  "Crissy Field": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    imageUrl: "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=400",
    websiteUrl: "https://www.parksconservancy.org/parks/crissy-field",
  },
  "Ocean Beach": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400",
  },
  "Stern Grove": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    pricingNotes: "Free concerts on summer Sundays.",
    imageUrl: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400",
    websiteUrl: "https://www.sterngrove.org",
  },
  "Ferry Building Marketplace": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    pricingNotes: "Free to enter. Food and shops vary.",
    imageUrl: "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=400",
    websiteUrl: "https://www.ferrybuildingmarketplace.com",
  },
  "Ghirardelli Square": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    pricingNotes: "Free to visit. Restaurants and shops vary.",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
    websiteUrl: "https://www.ghirardellisq.com",
  },
  "SFJAZZ Center": {
    pricingType: "per_person",
    adultPrice: 35,
    childPrice: 15,
    toddlerPrice: 0,
    teenPrice: 15,
    pricingNotes: "Family matinees ~$15. Regular shows vary.",
    imageUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400",
    websiteUrl: "https://www.sfjazz.org",
  },
  "Grace Cathedral": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    pricingNotes: "Free to visit. Donations welcome.",
    imageUrl: "https://images.unsplash.com/photo-1548625149-720134d51a3a?w=400",
    websiteUrl: "https://gracecathedral.org",
  },
  "Urban Putt": {
    pricingType: "per_person",
    adultPrice: 17,
    childPrice: 14,
    toddlerPrice: 0,
    teenPrice: 14,
    pricingNotes: "Per round of mini golf.",
    imageUrl: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400",
    websiteUrl: "https://www.urbanputt.com",
  },
  "House of Air": {
    pricingType: "per_person",
    adultPrice: 28,
    childPrice: 28,
    toddlerPrice: 0,
    teenPrice: 28,
    pricingNotes: "Per hour of jump time.",
    imageUrl: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400",
    websiteUrl: "https://www.houseofair.com",
  },
  "Stow Lake": {
    pricingType: "per_person",
    adultPrice: 30,
    childPrice: 30,
    toddlerPrice: 0,
    teenPrice: 30,
    pricingNotes: "Boat rental ~$30/hour. Walking is free.",
    imageUrl: "https://images.unsplash.com/photo-1501595091296-3aa970afb3ff?w=400",
    websiteUrl: "https://www.stowlakeboathouse.com",
  },
};

// Validate that a URL is reachable
async function validateUrl(url: string): Promise<{ valid: boolean; status?: number; redirect?: string }> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: {
        "User-Agent": "SF All-Ages Social Club Link Validator",
      },
    });
    return { valid: response.ok, status: response.status };
  } catch (error) {
    return { valid: false };
  }
}

async function updateVenues() {
  console.log("Updating venue pricing, images, and URLs...\n");

  const allVenues = await db.select().from(venues);
  let updated = 0;
  let urlsChecked = 0;
  let brokenUrls: string[] = [];

  for (const venue of allVenues) {
    const updates = VENUE_UPDATES[venue.name];

    if (updates) {
      // Update with our data
      await db.update(venues)
        .set({
          pricingType: updates.pricingType ?? venue.pricingType,
          adultPrice: updates.adultPrice ?? venue.adultPrice,
          childPrice: updates.childPrice ?? venue.childPrice,
          toddlerPrice: updates.toddlerPrice ?? venue.toddlerPrice,
          teenPrice: updates.teenPrice ?? venue.teenPrice,
          pricingNotes: updates.pricingNotes ?? venue.pricingNotes,
          imageUrl: updates.imageUrl ?? venue.imageUrl,
          websiteUrl: updates.websiteUrl ?? venue.websiteUrl,
        })
        .where(eq(venues.id, venue.id));

      console.log(`✓ Updated: ${venue.name}`);
      updated++;
    }

    // Validate existing URL
    if (venue.websiteUrl) {
      urlsChecked++;
      const result = await validateUrl(venue.websiteUrl);
      if (!result.valid) {
        brokenUrls.push(`${venue.name}: ${venue.websiteUrl} (${result.status || 'unreachable'})`);
      }
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Updated ${updated} venues with pricing/image data`);
  console.log(`Checked ${urlsChecked} URLs`);

  if (brokenUrls.length > 0) {
    console.log(`\n⚠️ Broken URLs found (${brokenUrls.length}):`);
    brokenUrls.forEach(url => console.log(`  - ${url}`));
  } else {
    console.log(`✓ All URLs are valid`);
  }
}

async function main() {
  await updateVenues();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
