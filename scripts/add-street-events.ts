import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "../src/lib/schema";
import { events } from "../src/lib/schema";
import { nanoid } from "nanoid";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client, { schema });

const now = new Date().toISOString();

// Helper to get first Thursday of current/next month
function getFirstThursday(hour: number, minute: number): string {
  const date = new Date();
  date.setDate(1);
  // Find first Thursday
  while (date.getDay() !== 4) {
    date.setDate(date.getDate() + 1);
  }
  // If it's past, get next month
  if (date < new Date()) {
    date.setMonth(date.getMonth() + 1);
    date.setDate(1);
    while (date.getDay() !== 4) {
      date.setDate(date.getDate() + 1);
    }
  }
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

const streetEvents = [
  {
    id: nanoid(),
    name: "Sunday Streets Mission (Valencia)",
    description: "Car-free Valencia St from Duboce to 26th St. Live music stages, games, food, cultural performances. Kids can bike/scooter/run freely on the street. One of SF's biggest family-friendly street festivals.",
    venueId: null,
    address: "Valencia St between Duboce Ave and 26th St, San Francisco, CA",
    eventType: "festival",
    startTime: "2025-07-20T10:00:00.000Z", // July 20, 2025 was the 2025 date
    endTime: "2025-07-20T17:00:00.000Z",
    isRecurring: true,
    recurrenceRule: "FREQ=YEARLY", // Once per year, typically summer
    hasKidsActivities: true,
    outdoor: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://sundaystreetssf.com/mission/",
    sourcePlatform: "manual",
    lastUpdatedAt: now,
    createdAt: now,
  },
  {
    id: nanoid(),
    name: "Sunday Streets SOMA",
    description: "Car-free streets in SOMA with active play games, cultural performances, health resources, live music. Safe Streets, Shared Joy theme.",
    venueId: null,
    address: "SOMA, San Francisco, CA",
    eventType: "festival",
    startTime: "2025-10-05T12:00:00.000Z", // October 5, 2025
    endTime: "2025-10-05T16:00:00.000Z",
    isRecurring: true,
    recurrenceRule: "FREQ=YEARLY",
    hasKidsActivities: true,
    outdoor: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://sundaystreetssf.com/soma/",
    sourcePlatform: "manual",
    lastUpdatedAt: now,
    createdAt: now,
  },
  {
    id: nanoid(),
    name: "Downtown First Thursdays",
    description: "Monthly street festival on 2nd St in SOMA. Dance floors, DJs, live music, food vendors, performances. Free and all ages. Streets closed to traffic for safe wandering.",
    venueId: null,
    address: "2nd St between Market and Howard, San Francisco, CA",
    eventType: "festival",
    startTime: getFirstThursday(17, 0), // First Thursday 5pm
    endTime: getFirstThursday(22, 0),
    isRecurring: true,
    recurrenceRule: "FREQ=MONTHLY;BYDAY=1TH", // First Thursday each month
    hasKidsActivities: true,
    outdoor: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://sf.funcheap.com/sfs-new-monthly-block-party-downtown-first-thursdays/",
    sourcePlatform: "manual",
    lastUpdatedAt: now,
    createdAt: now,
  },
];

async function main() {
  console.log("Adding street festival events...\n");

  for (const event of streetEvents) {
    try {
      await db.insert(events).values(event);
      console.log(`  ✓ Added: ${event.name}`);
    } catch (error) {
      if (String(error).includes("UNIQUE constraint")) {
        console.log(`  - Skipped (exists): ${event.name}`);
      } else {
        console.error(`  ✗ Error adding ${event.name}:`, error);
      }
    }
  }

  const eventCount = await db.select().from(events);
  console.log(`\n✅ Done! Database now has ${eventCount.length} events.`);
}

main().catch(console.error);
