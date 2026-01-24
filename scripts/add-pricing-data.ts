import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import * as schema from "../src/lib/schema";
import { venues, events } from "../src/lib/schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client, { schema });

// Venue pricing data based on research
const venuePricing: Record<string, {
  pricingType: string;
  adultPrice?: number;
  childPrice?: number;
  toddlerPrice?: number;
  teenPrice?: number;
  pricingNotes?: string;
  parkingType?: string;
  parkingCost?: number;
  parkingNotes?: string;
}> = {
  // Breweries/Restaurants - estimate based on typical meal cost
  "Fort Point Beer Company - Valencia": {
    pricingType: "menu",
    adultPrice: 25, // Beer + snack
    childPrice: 12, // Kids food
    toddlerPrice: 0,
    teenPrice: 15,
    pricingNotes: "Drinks + food. Kids eat free on some days",
    parkingType: "street",
    parkingNotes: "Street parking on Valencia, metered",
  },
  "Spark Social SF": {
    pricingType: "menu",
    adultPrice: 18, // Food truck meal
    childPrice: 10,
    toddlerPrice: 0,
    teenPrice: 15,
    pricingNotes: "Food truck prices vary",
    parkingType: "paid",
    parkingCost: 3,
    parkingNotes: "Nearby parking garage $3/hr",
  },
  "Park Chalet": {
    pricingType: "menu",
    adultPrice: 30, // Restaurant meal
    childPrice: 12,
    toddlerPrice: 0,
    teenPrice: 20,
    pricingNotes: "Full restaurant menu",
    parkingType: "free",
    parkingNotes: "Free lot at Ocean Beach",
  },
  "Cafe de Casa": {
    pricingType: "menu",
    adultPrice: 12, // Coffee + pastry
    childPrice: 6,
    toddlerPrice: 0,
    teenPrice: 10,
    pricingNotes: "Coffee and Brazilian pastries",
    parkingType: "street",
    parkingNotes: "Street parking in Castro",
  },

  // Free venues (parks, public spaces)
  "Dolores Park": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    parkingType: "street",
    parkingNotes: "Limited street parking, Muni accessible",
  },
  "Presidio Tunnel Tops": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    parkingType: "paid",
    parkingCost: 4,
    parkingNotes: "Presidio parking $4/hr, free with PassPark app after 4pm",
  },
  "JFK Drive (Car-Free)": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    parkingType: "free",
    parkingNotes: "Free parking in Golden Gate Park lots",
  },
  "Stern Grove": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    parkingType: "free",
    parkingNotes: "Free parking, arrives early for concerts",
  },

  // Museums/Attractions
  "Exploratorium": {
    pricingType: "per_person",
    adultPrice: 40,
    childPrice: 30, // Ages 4-17
    toddlerPrice: 0, // Under 4 free
    teenPrice: 30,
    pricingNotes: "Free first Wed of month. SF residents discounted.",
    parkingType: "paid",
    parkingCost: 6,
    parkingNotes: "Pier 15 parking $6/hr, max $36",
  },
  "California Academy of Sciences": {
    pricingType: "per_person",
    adultPrice: 42,
    childPrice: 32, // Ages 4-11
    toddlerPrice: 0, // Under 4 free
    teenPrice: 37, // Ages 12-17
    pricingNotes: "Free for SF residents quarterly. Planetarium extra.",
    parkingType: "paid",
    parkingCost: 7,
    parkingNotes: "Music Concourse Garage $7/hr",
  },
  "Japanese Tea Garden": {
    pricingType: "per_person",
    adultPrice: 15,
    childPrice: 7, // Ages 5-11
    toddlerPrice: 0, // Under 5 free
    teenPrice: 10, // Ages 12-17
    pricingNotes: "Free for SF residents before 10am M-W-F",
    parkingType: "paid",
    parkingCost: 7,
    parkingNotes: "Music Concourse Garage",
  },
  "Ghirardelli Square": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    pricingNotes: "Free to visit, shops/restaurants extra",
    parkingType: "paid",
    parkingCost: 8,
    parkingNotes: "Garage parking ~$8/hr",
  },
  "Ferry Building Marketplace": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    pricingNotes: "Free to browse, food/shops extra",
    parkingType: "paid",
    parkingCost: 5,
    parkingNotes: "Embarcadero lots nearby",
  },

  // Churches
  "Grace Cathedral": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    pricingNotes: "Free to visit, donations welcome",
    parkingType: "street",
    parkingNotes: "Street parking on Nob Hill, challenging",
  },
  "St. Gregory of Nyssa Episcopal Church": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    pricingNotes: "Free, potluck brunch after service",
    parkingType: "street",
    parkingNotes: "Street parking on De Haro St",
  },
  "Reality SF": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    pricingNotes: "Free services, childcare included",
    parkingType: "street",
    parkingNotes: "Street parking in Mission",
  },

  // Music venues
  "SFJAZZ Center": {
    pricingType: "per_person",
    adultPrice: 35, // Family matinee average
    childPrice: 17, // Half price for kids
    toddlerPrice: 0,
    teenPrice: 25,
    pricingNotes: "Family matinees are half-price. Free lobby concerts.",
    parkingType: "paid",
    parkingCost: 5,
    parkingNotes: "Nearby garage on Franklin",
  },

  // Markets
  "Alemany Farmers' Market": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    pricingNotes: "Free entry, pay for purchases",
    parkingType: "free",
    parkingNotes: "Free parking in lot",
  },

  // Library
  "San Francisco Main Library - Children's Center": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    pricingNotes: "Free, library card recommended",
    parkingType: "paid",
    parkingCost: 4,
    parkingNotes: "Civic Center garage nearby",
  },
};

// Event pricing data
const eventPricing: Record<string, {
  pricingType: string;
  adultPrice?: number;
  childPrice?: number;
  toddlerPrice?: number;
  teenPrice?: number;
  pricingNotes?: string;
}> = {
  "Ferry Plaza Farmers Market": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    pricingNotes: "Free entry, pay for purchases",
  },
  "SFJAZZ Family Matinee": {
    pricingType: "per_person",
    adultPrice: 35,
    childPrice: 17,
    toddlerPrice: 0,
    teenPrice: 25,
    pricingNotes: "Half-price tickets for kids",
  },
  "Golden Gate Park Band Concert": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    pricingNotes: "Free outdoor concert",
  },
  "Stern Grove Festival - Sunday Concert": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    pricingNotes: "Free, bring your own blankets",
  },
  "St. Gregory's Sunday Service & Potluck": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    pricingNotes: "Free, potluck brunch after",
  },
  "Alemany Farmers' Market": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    pricingNotes: "Free entry, pay for purchases",
  },
  "Castro Night Market": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    pricingNotes: "Free entry, food/drinks extra",
  },
  "SF Main Library Children's Storytime": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    pricingNotes: "Free library program",
  },
  "Reality SF Sunday Services": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    pricingNotes: "Free, childcare included",
  },
  "Sunday Streets Mission (Valencia)": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    pricingNotes: "Free street festival",
  },
  "Sunday Streets SOMA": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    pricingNotes: "Free street festival",
  },
  "Downtown First Thursdays": {
    pricingType: "free",
    adultPrice: 0,
    childPrice: 0,
    toddlerPrice: 0,
    teenPrice: 0,
    pricingNotes: "Free street party, food/drinks extra",
  },
};

async function main() {
  console.log("Adding pricing data to venues and events...\n");

  // Update venues
  console.log("Updating venue pricing...");
  for (const [name, pricing] of Object.entries(venuePricing)) {
    try {
      const result = await db
        .update(venues)
        .set({
          pricingType: pricing.pricingType,
          adultPrice: pricing.adultPrice,
          childPrice: pricing.childPrice,
          toddlerPrice: pricing.toddlerPrice,
          teenPrice: pricing.teenPrice,
          pricingNotes: pricing.pricingNotes,
          parkingType: pricing.parkingType,
          parkingCost: pricing.parkingCost,
          parkingNotes: pricing.parkingNotes,
        })
        .where(eq(venues.name, name));
      console.log(`  ✓ Updated: ${name}`);
    } catch (error) {
      console.error(`  ✗ Error updating ${name}:`, error);
    }
  }

  // Update events
  console.log("\nUpdating event pricing...");
  for (const [name, pricing] of Object.entries(eventPricing)) {
    try {
      await db
        .update(events)
        .set({
          pricingType: pricing.pricingType,
          adultPrice: pricing.adultPrice,
          childPrice: pricing.childPrice,
          toddlerPrice: pricing.toddlerPrice,
          teenPrice: pricing.teenPrice,
          pricingNotes: pricing.pricingNotes,
        })
        .where(eq(events.name, name));
      console.log(`  ✓ Updated: ${name}`);
    } catch (error) {
      console.error(`  ✗ Error updating ${name}:`, error);
    }
  }

  // Verify
  const allVenues = await db.select().from(venues);
  const venuesWithPricing = allVenues.filter(v => v.pricingType);
  const allEvents = await db.select().from(events);
  const eventsWithPricing = allEvents.filter(e => e.pricingType);

  console.log(`\n✅ Done!`);
  console.log(`   Venues with pricing: ${venuesWithPricing.length}/${allVenues.length}`);
  console.log(`   Events with pricing: ${eventsWithPricing.length}/${allEvents.length}`);
}

main().catch(console.error);
