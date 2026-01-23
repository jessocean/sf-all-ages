import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { venues, events } from "../src/lib/schema";
import { nanoid } from "nanoid";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client);

const now = new Date().toISOString();

// Initial SF venues data - researched family-friendly spots
const venueData = [
  {
    name: "Fort Point Beer Company - Valencia",
    address: "742 Valencia St, San Francisco, CA 94110",
    neighborhood: "Mission",
    latitude: 37.7601,
    longitude: -122.4215,
    venueType: "brewery",
    hoursJson: JSON.stringify({
      mon: "12:00-22:00",
      tue: "12:00-22:00",
      wed: "12:00-22:00",
      thu: "12:00-22:00",
      fri: "12:00-23:00",
      sat: "11:00-23:00",
      sun: "11:00-22:00",
    }),
    hasPlayArea: false,
    hasOutdoorSpace: true,
    isEnclosed: false,
    hasHighChairs: true,
    hasChangingTable: false,
    strollerAccessible: true,
    loudOk: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    description: "Craft brewery with spacious outdoor beer garden. Relaxed atmosphere, great for families during daytime hours.",
    websiteUrl: "https://www.fortpointbeer.com",
  },
  {
    name: "Spark Social SF",
    address: "601 Mission Bay Blvd N, San Francisco, CA 94158",
    neighborhood: "Mission Bay",
    latitude: 37.7714,
    longitude: -122.3930,
    venueType: "restaurant",
    hoursJson: JSON.stringify({
      mon: "11:00-21:00",
      tue: "11:00-21:00",
      wed: "11:00-21:00",
      thu: "11:00-21:00",
      fri: "11:00-22:00",
      sat: "10:00-22:00",
      sun: "10:00-21:00",
    }),
    hasPlayArea: true,
    hasOutdoorSpace: true,
    isEnclosed: true,
    hasHighChairs: true,
    hasChangingTable: true,
    strollerAccessible: true,
    loudOk: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    description: "Food truck park with sandbox and outdoor seating. Multiple food options, games, and a kid-friendly atmosphere.",
    websiteUrl: "https://sparksocialsf.com",
  },
  {
    name: "Park Chalet",
    address: "1000 Great Highway, San Francisco, CA 94121",
    neighborhood: "Outer Sunset",
    latitude: 37.7652,
    longitude: -122.5108,
    venueType: "restaurant",
    hoursJson: JSON.stringify({
      mon: "12:00-21:00",
      tue: "12:00-21:00",
      wed: "12:00-21:00",
      thu: "12:00-21:00",
      fri: "12:00-22:00",
      sat: "11:00-22:00",
      sun: "11:00-21:00",
    }),
    hasPlayArea: false,
    hasOutdoorSpace: true,
    isEnclosed: false,
    hasHighChairs: true,
    hasChangingTable: true,
    strollerAccessible: true,
    loudOk: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    description: "Restaurant with large grassy backyard perfect for kids to run around. Great views of Golden Gate Park.",
    websiteUrl: "https://www.parkchalet.com",
  },
  {
    name: "Ghirardelli Square",
    address: "900 North Point St, San Francisco, CA 94109",
    neighborhood: "Fisherman's Wharf",
    latitude: 37.8058,
    longitude: -122.4228,
    venueType: "other",
    hoursJson: JSON.stringify({
      mon: "10:00-21:00",
      tue: "10:00-21:00",
      wed: "10:00-21:00",
      thu: "10:00-21:00",
      fri: "10:00-22:00",
      sat: "10:00-22:00",
      sun: "10:00-21:00",
    }),
    hasPlayArea: false,
    hasOutdoorSpace: true,
    isEnclosed: false,
    hasHighChairs: true,
    hasChangingTable: true,
    strollerAccessible: true,
    loudOk: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    description: "Historic chocolate factory turned shopping center. Outdoor plazas, chocolate shops, and family-friendly restaurants.",
    websiteUrl: "https://www.ghirardellisq.com",
  },
  {
    name: "Exploratorium",
    address: "Pier 15, San Francisco, CA 94111",
    neighborhood: "Embarcadero",
    latitude: 37.8017,
    longitude: -122.3974,
    venueType: "museum",
    hoursJson: JSON.stringify({
      mon: "closed",
      tue: "10:00-17:00",
      wed: "10:00-17:00",
      thu: "10:00-17:00",
      fri: "10:00-17:00",
      sat: "10:00-17:00",
      sun: "10:00-17:00",
    }),
    hasPlayArea: true,
    hasOutdoorSpace: true,
    isEnclosed: true,
    hasHighChairs: false,
    hasChangingTable: true,
    strollerAccessible: true,
    loudOk: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    description: "Interactive science museum with 650+ hands-on exhibits. Great for curious kids and adults alike.",
    websiteUrl: "https://www.exploratorium.edu",
  },
  {
    name: "California Academy of Sciences",
    address: "55 Music Concourse Dr, San Francisco, CA 94118",
    neighborhood: "Golden Gate Park",
    latitude: 37.7699,
    longitude: -122.4661,
    venueType: "museum",
    hoursJson: JSON.stringify({
      mon: "9:30-17:00",
      tue: "9:30-17:00",
      wed: "9:30-17:00",
      thu: "9:30-17:00",
      fri: "9:30-17:00",
      sat: "9:30-17:00",
      sun: "9:30-17:00",
    }),
    hasPlayArea: true,
    hasOutdoorSpace: true,
    isEnclosed: true,
    hasHighChairs: true,
    hasChangingTable: true,
    strollerAccessible: true,
    loudOk: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    description: "Aquarium, planetarium, and natural history museum under one living roof. Penguins, rainforest, and more.",
    websiteUrl: "https://www.calacademy.org",
  },
  {
    name: "Dolores Park",
    address: "Dolores St & 19th St, San Francisco, CA 94114",
    neighborhood: "Mission",
    latitude: 37.7596,
    longitude: -122.4269,
    venueType: "park",
    hoursJson: JSON.stringify({
      mon: "6:00-22:00",
      tue: "6:00-22:00",
      wed: "6:00-22:00",
      thu: "6:00-22:00",
      fri: "6:00-22:00",
      sat: "6:00-22:00",
      sun: "6:00-22:00",
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
    description: "Iconic SF park with two playgrounds, tennis courts, and great city views. Lively weekend atmosphere.",
    websiteUrl: "https://sfrecpark.org/destination/mission-dolores-park/",
  },
  {
    name: "Presidio Tunnel Tops",
    address: "210 Lincoln Blvd, San Francisco, CA 94129",
    neighborhood: "Presidio",
    latitude: 37.8021,
    longitude: -122.4551,
    venueType: "park",
    hoursJson: JSON.stringify({
      mon: "6:00-22:00",
      tue: "6:00-22:00",
      wed: "6:00-22:00",
      thu: "6:00-22:00",
      fri: "6:00-22:00",
      sat: "6:00-22:00",
      sun: "6:00-22:00",
    }),
    hasPlayArea: true,
    hasOutdoorSpace: true,
    isEnclosed: false,
    hasHighChairs: false,
    hasChangingTable: true,
    strollerAccessible: true,
    loudOk: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    description: "New 14-acre park with nature-based play areas, campfire circle, and stunning Golden Gate Bridge views.",
    websiteUrl: "https://www.presidio.gov/tunnel-tops",
  },
  {
    name: "Grace Cathedral",
    address: "1100 California St, San Francisco, CA 94108",
    neighborhood: "Nob Hill",
    latitude: 37.7918,
    longitude: -122.4126,
    venueType: "church",
    hoursJson: JSON.stringify({
      mon: "8:00-18:00",
      tue: "8:00-18:00",
      wed: "8:00-18:00",
      thu: "8:00-18:00",
      fri: "8:00-18:00",
      sat: "8:00-18:00",
      sun: "8:00-18:00",
    }),
    hasPlayArea: false,
    hasOutdoorSpace: true,
    isEnclosed: true,
    hasHighChairs: false,
    hasChangingTable: false,
    strollerAccessible: true,
    loudOk: false,
    toddlerFriendly: false,
    youngKidFriendly: true,
    teenFriendly: true,
    description: "Beautiful cathedral with labyrinth walks, concerts, and family-friendly events. Hosts yoga on the labyrinth.",
    websiteUrl: "https://gracecathedral.org",
  },
  {
    name: "SFJAZZ Center",
    address: "201 Franklin St, San Francisco, CA 94102",
    neighborhood: "Hayes Valley",
    latitude: 37.7762,
    longitude: -122.4215,
    venueType: "other",
    hoursJson: JSON.stringify({
      mon: "closed",
      tue: "12:00-18:00",
      wed: "12:00-18:00",
      thu: "12:00-18:00",
      fri: "12:00-18:00",
      sat: "12:00-18:00",
      sun: "12:00-18:00",
    }),
    hasPlayArea: false,
    hasOutdoorSpace: false,
    isEnclosed: true,
    hasHighChairs: false,
    hasChangingTable: true,
    strollerAccessible: true,
    loudOk: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    description: "World-class jazz venue with monthly Family Matinee concerts. Half-price, family-friendly shows for budding jazz fans.",
    websiteUrl: "https://www.sfjazz.org",
  },
  {
    name: "Stern Grove",
    address: "19th Ave & Sloat Blvd, San Francisco, CA 94132",
    neighborhood: "Sunset",
    latitude: 37.7326,
    longitude: -122.4760,
    venueType: "park",
    hoursJson: JSON.stringify({
      mon: "6:00-22:00",
      tue: "6:00-22:00",
      wed: "6:00-22:00",
      thu: "6:00-22:00",
      fri: "6:00-22:00",
      sat: "6:00-22:00",
      sun: "6:00-22:00",
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
    description: "Eucalyptus grove hosting free summer concerts. Bring blankets and picnics for Sunday shows.",
    websiteUrl: "https://www.sterngrove.org",
  },
  {
    name: "Ferry Building Marketplace",
    address: "1 Ferry Building, San Francisco, CA 94111",
    neighborhood: "Embarcadero",
    latitude: 37.7955,
    longitude: -122.3937,
    venueType: "other",
    hoursJson: JSON.stringify({
      mon: "10:00-18:00",
      tue: "10:00-18:00",
      wed: "10:00-18:00",
      thu: "10:00-18:00",
      fri: "10:00-18:00",
      sat: "8:00-18:00",
      sun: "11:00-17:00",
    }),
    hasPlayArea: false,
    hasOutdoorSpace: true,
    isEnclosed: true,
    hasHighChairs: true,
    hasChangingTable: true,
    strollerAccessible: true,
    loudOk: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    description: "Historic marketplace with artisan food shops and restaurants. Saturday farmers market is bustling and family-friendly.",
    websiteUrl: "https://www.ferrybuildingmarketplace.com",
  },
];

// Sample upcoming events
const eventData = [
  {
    name: "Stern Grove Festival - Sunday Concert",
    description: "Free outdoor concert in the eucalyptus grove. Bring blankets and picnic. Family-friendly atmosphere.",
    address: "19th Ave & Sloat Blvd, San Francisco, CA 94132",
    eventType: "music",
    startTime: getNextSunday(14, 0), // 2pm Sunday
    endTime: getNextSunday(16, 0), // 4pm Sunday
    hasKidsActivities: false,
    outdoor: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://www.sterngrove.org",
    sourcePlatform: "manual",
  },
  {
    name: "SFJAZZ Family Matinee",
    description: "Kid-friendly jazz concert. Half-price tickets, shorter performance perfect for young audiences.",
    address: "201 Franklin St, San Francisco, CA 94102",
    eventType: "music",
    startTime: getNextSaturday(11, 0), // 11am Saturday
    endTime: getNextSaturday(12, 0), // 12pm Saturday
    hasKidsActivities: true,
    outdoor: false,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://www.sfjazz.org/education/kids-and-family/",
    sourcePlatform: "manual",
  },
  {
    name: "Ferry Plaza Farmers Market",
    description: "San Francisco's largest farmers market. Fresh produce, food vendors, and waterfront views.",
    address: "1 Ferry Building, San Francisco, CA 94111",
    eventType: "market",
    startTime: getNextSaturday(8, 0), // 8am Saturday
    endTime: getNextSaturday(14, 0), // 2pm Saturday
    hasKidsActivities: false,
    outdoor: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://cuesa.org/markets/ferry-plaza-farmers-market",
    sourcePlatform: "manual",
  },
  {
    name: "Golden Gate Park Band Concert",
    description: "Free band concert at the Spreckels Temple of Music. Bring chairs or blankets.",
    address: "Music Concourse Dr, San Francisco, CA 94118",
    eventType: "music",
    startTime: getNextSunday(13, 0), // 1pm Sunday
    endTime: getNextSunday(14, 30), // 2:30pm Sunday
    hasKidsActivities: false,
    outdoor: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://sfrecpark.org/1570/Golden-Gate-Bandshell-Concerts",
    sourcePlatform: "manual",
  },
];

function getNextSaturday(hour: number, minute: number): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilSaturday = dayOfWeek === 6 ? 7 : 6 - dayOfWeek;
  const nextSaturday = new Date(now);
  nextSaturday.setDate(now.getDate() + daysUntilSaturday);
  nextSaturday.setHours(hour, minute, 0, 0);
  return nextSaturday.toISOString();
}

function getNextSunday(hour: number, minute: number): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + daysUntilSunday);
  nextSunday.setHours(hour, minute, 0, 0);
  return nextSunday.toISOString();
}

async function seed() {
  console.log("Seeding database...");

  // Insert venues
  for (const venue of venueData) {
    const id = nanoid();
    await db.insert(venues).values({
      id,
      ...venue,
      status: "active",
      lastVerifiedAt: now,
      createdAt: now,
    });
    console.log(`Added venue: ${venue.name}`);
  }

  // Insert events
  for (const event of eventData) {
    const id = nanoid();
    await db.insert(events).values({
      id,
      ...event,
      venueId: null,
      isRecurring: true,
      recurrenceRule: null,
      lastUpdatedAt: now,
      createdAt: now,
    });
    console.log(`Added event: ${event.name}`);
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
