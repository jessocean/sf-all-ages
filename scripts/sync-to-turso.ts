import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { venues, events, subscriptions } from "../src/lib/schema";

/**
 * Sync local.db data to Turso production database
 *
 * Usage:
 *   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npx tsx scripts/sync-to-turso.ts
 */

// Connect to local SQLite database
const localClient = createClient({
  url: "file:local.db",
});
const localDb = drizzle(localClient);

// Connect to Turso production database
if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error("Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set");
  process.exit(1);
}

const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const tursoDb = drizzle(tursoClient);

async function syncToTurso() {
  console.log("Starting sync from local.db to Turso...\n");

  // Read all data from local database
  console.log("Reading data from local.db...");
  const localVenues = await localDb.select().from(venues);
  const localEvents = await localDb.select().from(events);
  const localSubscriptions = await localDb.select().from(subscriptions);

  console.log(`Found in local.db:`);
  console.log(`  - ${localVenues.length} venues`);
  console.log(`  - ${localEvents.length} events`);
  console.log(`  - ${localSubscriptions.length} subscriptions\n`);

  // Clear existing data in Turso (optional - comment out to merge instead)
  console.log("Clearing existing data in Turso...");
  await tursoDb.delete(events);
  await tursoDb.delete(venues);
  // Note: Not deleting subscriptions to preserve user signups

  // Insert venues first (events reference them)
  console.log("Inserting venues into Turso...");
  if (localVenues.length > 0) {
    // Insert in batches to avoid hitting limits
    const BATCH_SIZE = 50;
    for (let i = 0; i < localVenues.length; i += BATCH_SIZE) {
      const batch = localVenues.slice(i, i + BATCH_SIZE);
      await tursoDb.insert(venues).values(batch);
      console.log(`  Inserted venues ${i + 1}-${Math.min(i + BATCH_SIZE, localVenues.length)}`);
    }
  }

  // Insert events
  console.log("Inserting events into Turso...");
  if (localEvents.length > 0) {
    const BATCH_SIZE = 50;
    for (let i = 0; i < localEvents.length; i += BATCH_SIZE) {
      const batch = localEvents.slice(i, i + BATCH_SIZE);
      await tursoDb.insert(events).values(batch);
      console.log(`  Inserted events ${i + 1}-${Math.min(i + BATCH_SIZE, localEvents.length)}`);
    }
  }

  // Verify the sync
  console.log("\nVerifying sync...");
  const tursoVenues = await tursoDb.select().from(venues);
  const tursoEvents = await tursoDb.select().from(events);

  console.log(`\nTurso now contains:`);
  console.log(`  - ${tursoVenues.length} venues`);
  console.log(`  - ${tursoEvents.length} events`);

  console.log("\nSync complete!");
}

syncToTurso().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
