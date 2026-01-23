import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "../src/lib/schema";
import { venues, events } from "../src/lib/schema";
import { nanoid } from "nanoid";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client, { schema });

const now = new Date().toISOString();

// Helper to get next occurrence of a day
function getNextDayOccurrence(dayOfWeek: number, hour: number, minute: number): string {
  const date = new Date();
  const currentDay = date.getDay();
  const daysUntil = (dayOfWeek - currentDay + 7) % 7 || 7;
  date.setDate(date.getDate() + daysUntil);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

// Helper for 3rd Friday of month
function getThirdFriday(hour: number, minute: number): string {
  const date = new Date();
  date.setDate(1);
  // Find first Friday
  while (date.getDay() !== 5) {
    date.setDate(date.getDate() + 1);
  }
  // Add 2 weeks for 3rd Friday
  date.setDate(date.getDate() + 14);
  // If it's past, get next month
  if (date < new Date()) {
    date.setMonth(date.getMonth() + 1);
    date.setDate(1);
    while (date.getDay() !== 5) {
      date.setDate(date.getDate() + 1);
    }
    date.setDate(date.getDate() + 14);
  }
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

const newVenues = [
  {
    id: nanoid(),
    name: "St. Gregory of Nyssa Episcopal Church",
    address: "500 De Haro St, San Francisco, CA 94107",
    neighborhood: "Potrero Hill",
    latitude: 37.7614,
    longitude: -122.4014,
    venueType: "church",
    hoursJson: JSON.stringify({ sun: "8:30-12:00" }),
    hasPlayArea: false,
    hasOutdoorSpace: true,
    isEnclosed: true,
    hasHighChairs: false,
    hasChangingTable: true,
    strollerAccessible: true,
    loudOk: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    description: "Progressive Episcopal church known for interactive services with physical movement, dancing, and storytelling. Kids participate alongside adults - no separate children's program. Everyone dances around the altar. Potluck brunch after service.",
    websiteUrl: "https://www.saintgregorys.org",
    status: "active",
    lastVerifiedAt: now,
    createdAt: now,
  },
  {
    id: nanoid(),
    name: "Japanese Tea Garden",
    address: "75 Hagiwara Tea Garden Dr, San Francisco, CA 94118",
    neighborhood: "Golden Gate Park",
    latitude: 37.7702,
    longitude: -122.4701,
    venueType: "park",
    hoursJson: JSON.stringify({
      mon: "9:00-17:30",
      tue: "9:00-17:30",
      wed: "9:00-17:30",
      thu: "9:00-17:30",
      fri: "9:00-17:30",
      sat: "9:00-17:30",
      sun: "9:00-17:30",
    }),
    hasPlayArea: false,
    hasOutdoorSpace: true,
    isEnclosed: true,
    hasHighChairs: false,
    hasChangingTable: false,
    strollerAccessible: false, // Steep paths and many steps
    loudOk: false, // Peaceful garden atmosphere
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    description: "Oldest public Japanese garden in the US. Features koi pond (kids love feeding fish), drum bridge, pagoda, and tea house. Free for SF residents before 10am. Note: many steps and uneven paths - strollers difficult.",
    websiteUrl: "https://www.japaneseteagardensf.com",
    status: "active",
    lastVerifiedAt: now,
    createdAt: now,
  },
  {
    id: nanoid(),
    name: "JFK Drive (Car-Free)",
    address: "JFK Drive, Golden Gate Park, San Francisco, CA",
    neighborhood: "Golden Gate Park",
    latitude: 37.7694,
    longitude: -122.4662,
    venueType: "park",
    hoursJson: JSON.stringify({
      mon: "0:00-23:59",
      tue: "0:00-23:59",
      wed: "0:00-23:59",
      thu: "0:00-23:59",
      fri: "0:00-23:59",
      sat: "0:00-23:59",
      sun: "0:00-23:59",
    }),
    hasPlayArea: true,
    hasOutdoorSpace: true,
    isEnclosed: false,
    hasHighChairs: false,
    hasChangingTable: false,
    strollerAccessible: true,
    loudOk: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    description: "Permanently car-free stretch through Golden Gate Park. Perfect for bikes, scooters, running around. Kids can use the whole road safely. Connects to playgrounds, museums, and meadows.",
    websiteUrl: "https://sfrecpark.org/jfkpromenade",
    status: "active",
    lastVerifiedAt: now,
    createdAt: now,
  },
  {
    id: nanoid(),
    name: "Alemany Farmers' Market",
    address: "100 Alemany Blvd, San Francisco, CA 94110",
    neighborhood: "Bernal Heights",
    latitude: 37.7318,
    longitude: -122.4117,
    venueType: "market",
    hoursJson: JSON.stringify({ sat: "6:00-14:30" }),
    hasPlayArea: false,
    hasOutdoorSpace: true,
    isEnclosed: true, // Enclosed parking lot area
    hasHighChairs: false,
    hasChangingTable: false,
    strollerAccessible: true,
    loudOk: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    description: "San Francisco's oldest farmers market (since 1943). Enclosed area makes it hard for toddlers to escape. Free samples, affordable produce, diverse vendors. Less crowded than Ferry Building. Good for letting kids explore safely.",
    websiteUrl: "https://sfgov.org/realestate/alemany-farmers-market",
    status: "active",
    lastVerifiedAt: now,
    createdAt: now,
  },
  {
    id: nanoid(),
    name: "Cafe de Casa",
    address: "3985 17th St, San Francisco, CA 94114",
    neighborhood: "Castro",
    latitude: 37.7622,
    longitude: -122.4327,
    venueType: "cafe",
    hoursJson: JSON.stringify({
      mon: "8:00-18:00",
      tue: "8:00-18:00",
      wed: "8:00-18:00",
      thu: "8:00-18:00",
      fri: "8:00-18:00",
      sat: "8:00-18:00",
      sun: "8:00-17:00",
    }),
    hasPlayArea: false,
    hasOutdoorSpace: false,
    isEnclosed: true,
    hasHighChairs: true,
    hasChangingTable: false,
    strollerAccessible: true,
    loudOk: false,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    description: "Cozy Brazilian cafe with excellent pao de queijo (cheese bread balls) that toddlers love. High chairs available. Not a run-around space but welcoming to families. Good coffee for parents.",
    websiteUrl: "https://www.cafedecasa.com",
    status: "active",
    lastVerifiedAt: now,
    createdAt: now,
  },
  {
    id: nanoid(),
    name: "San Francisco Main Library - Children's Center",
    address: "100 Larkin St, San Francisco, CA 94102",
    neighborhood: "Civic Center",
    latitude: 37.7785,
    longitude: -122.4156,
    venueType: "library",
    hoursJson: JSON.stringify({
      mon: "10:00-18:00",
      tue: "10:00-18:00",
      wed: "10:00-18:00",
      thu: "10:00-18:00",
      fri: "12:00-18:00",
      sat: "10:00-18:00",
      sun: "12:00-18:00",
    }),
    hasPlayArea: true,
    hasOutdoorSpace: false,
    isEnclosed: true,
    hasHighChairs: false,
    hasChangingTable: true,
    strollerAccessible: true,
    loudOk: true, // Children's section allows more noise
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    description: "Dedicated Children's Center on 2nd floor. Kids can pull books freely and be louder without disturbing others. Regular storytimes, crafts, and programs. Free activities almost daily. Safe space to explore.",
    websiteUrl: "https://sfpl.org/locations/main-library/childrens-center",
    status: "active",
    lastVerifiedAt: now,
    createdAt: now,
  },
  {
    id: nanoid(),
    name: "Reality SF",
    address: "1325 Valencia St, San Francisco, CA 94110",
    neighborhood: "Mission",
    latitude: 37.7512,
    longitude: -122.4208,
    venueType: "church",
    hoursJson: JSON.stringify({ sun: "9:00-13:00" }),
    hasPlayArea: true,
    hasOutdoorSpace: false,
    isEnclosed: true,
    hasHighChairs: false,
    hasChangingTable: true,
    strollerAccessible: true,
    loudOk: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    description: "Multi-site church with nursery and children's programs (Reality Kids). Services at 9am and 11am. Age-appropriate programs while parents attend service. Welcoming community atmosphere.",
    websiteUrl: "https://realitysf.com",
    status: "active",
    lastVerifiedAt: now,
    createdAt: now,
  },
];

const newEvents = [
  {
    id: nanoid(),
    name: "St. Gregory's Sunday Service & Potluck",
    description: "Interactive worship with dancing, movement, and participatory storytelling. Kids join adults - no separate program. Potluck brunch follows service.",
    venueId: null, // Will link after venue insert
    address: "500 De Haro St, San Francisco, CA 94107",
    eventType: "religious",
    startTime: getNextDayOccurrence(0, 8, 30), // Sunday 8:30am
    endTime: getNextDayOccurrence(0, 12, 0),
    isRecurring: true,
    recurrenceRule: "FREQ=WEEKLY;BYDAY=SU",
    hasKidsActivities: true,
    outdoor: false,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://www.saintgregorys.org/worship",
    sourcePlatform: "manual",
    lastUpdatedAt: now,
    createdAt: now,
  },
  {
    id: nanoid(),
    name: "Alemany Farmers' Market",
    description: "SF's oldest farmers market in enclosed lot. Free samples, kid-safe wandering space. Diverse produce at good prices.",
    venueId: null,
    address: "100 Alemany Blvd, San Francisco, CA 94110",
    eventType: "market",
    startTime: getNextDayOccurrence(6, 6, 0), // Saturday 6am
    endTime: getNextDayOccurrence(6, 14, 30),
    isRecurring: true,
    recurrenceRule: "FREQ=WEEKLY;BYDAY=SA",
    hasKidsActivities: false,
    outdoor: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://sfgov.org/realestate/alemany-farmers-market",
    sourcePlatform: "manual",
    lastUpdatedAt: now,
    createdAt: now,
  },
  {
    id: nanoid(),
    name: "Castro Night Market",
    description: "Street market on 18th St with food vendors, live music, art. Family-friendly early evening before it gets rowdy.",
    venueId: null,
    address: "18th St between Hartford and Collingwood, San Francisco, CA",
    eventType: "festival",
    startTime: getThirdFriday(17, 0), // 3rd Friday 5pm
    endTime: getThirdFriday(21, 0),
    isRecurring: true,
    recurrenceRule: "FREQ=MONTHLY;BYDAY=3FR",
    hasKidsActivities: true,
    outdoor: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://www.castronightmarket.com",
    sourcePlatform: "manual",
    lastUpdatedAt: now,
    createdAt: now,
  },
  {
    id: nanoid(),
    name: "SF Main Library Children's Storytime",
    description: "Regular storytimes and activities at the Children's Center. Check website for current schedule.",
    venueId: null,
    address: "100 Larkin St, San Francisco, CA 94102",
    eventType: "community",
    startTime: getNextDayOccurrence(2, 10, 30), // Tuesday 10:30am as example
    endTime: getNextDayOccurrence(2, 11, 30),
    isRecurring: true,
    recurrenceRule: "FREQ=WEEKLY;BYDAY=TU,TH",
    hasKidsActivities: true,
    outdoor: false,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: false,
    sourceUrl: "https://sfpl.org/events",
    sourcePlatform: "manual",
    lastUpdatedAt: now,
    createdAt: now,
  },
  {
    id: nanoid(),
    name: "Reality SF Sunday Services",
    description: "Family-friendly church services with nursery and children's programs. Services at 9am and 11am.",
    venueId: null,
    address: "1325 Valencia St, San Francisco, CA 94110",
    eventType: "religious",
    startTime: getNextDayOccurrence(0, 9, 0), // Sunday 9am
    endTime: getNextDayOccurrence(0, 12, 30),
    isRecurring: true,
    recurrenceRule: "FREQ=WEEKLY;BYDAY=SU",
    hasKidsActivities: true,
    outdoor: false,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://realitysf.com",
    sourcePlatform: "manual",
    lastUpdatedAt: now,
    createdAt: now,
  },
];

async function main() {
  console.log("Adding user-provided venues and events...\n");

  // Insert venues
  console.log("Adding venues...");
  for (const venue of newVenues) {
    try {
      await db.insert(venues).values(venue);
      console.log(`  ✓ Added venue: ${venue.name}`);
    } catch (error) {
      if (String(error).includes("UNIQUE constraint")) {
        console.log(`  - Skipped (exists): ${venue.name}`);
      } else {
        console.error(`  ✗ Error adding ${venue.name}:`, error);
      }
    }
  }

  // Insert events
  console.log("\nAdding events...");
  for (const event of newEvents) {
    try {
      await db.insert(events).values(event);
      console.log(`  ✓ Added event: ${event.name}`);
    } catch (error) {
      if (String(error).includes("UNIQUE constraint")) {
        console.log(`  - Skipped (exists): ${event.name}`);
      } else {
        console.error(`  ✗ Error adding ${event.name}:`, error);
      }
    }
  }

  // Count totals
  const venueCount = await db.select().from(venues);
  const eventCount = await db.select().from(events);

  console.log(`\n✅ Done! Database now has ${venueCount.length} venues and ${eventCount.length} events.`);
}

main().catch(console.error);
