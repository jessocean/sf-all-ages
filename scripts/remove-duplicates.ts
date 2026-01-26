import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { venues, events } from "../src/lib/schema";
import { eq } from "drizzle-orm";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client);

// Normalize name for duplicate comparison
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

async function removeDuplicateVenues(): Promise<number> {
  console.log("Checking for duplicate venues...");

  const allVenues = await db.select().from(venues);
  const seen = new Map<string, typeof allVenues[0]>();
  const toDelete: string[] = [];

  for (const venue of allVenues) {
    const addressKey = venue.address
      ? normalizeName(venue.address.split(",")[0])
      : "";
    const key = `${normalizeName(venue.name)}-${addressKey}`;

    if (!seen.has(key)) {
      seen.set(key, venue);
    } else {
      // Keep the one with more data, delete the other
      const existing = seen.get(key)!;
      const existingScore =
        (existing.description?.length || 0) +
        (existing.websiteUrl ? 10 : 0) +
        (existing.latitude ? 5 : 0);
      const newScore =
        (venue.description?.length || 0) +
        (venue.websiteUrl ? 10 : 0) +
        (venue.latitude ? 5 : 0);

      if (newScore > existingScore) {
        // New one is better, delete the existing
        toDelete.push(existing.id);
        seen.set(key, venue);
        console.log(`  Will replace "${existing.name}" with better duplicate`);
      } else {
        // Existing is better, delete new one
        toDelete.push(venue.id);
        console.log(`  Will delete duplicate: "${venue.name}"`);
      }
    }
  }

  // Delete duplicates
  for (const id of toDelete) {
    await db.delete(venues).where(eq(venues.id, id));
  }

  console.log(`Removed ${toDelete.length} duplicate venues`);
  return toDelete.length;
}

async function removeDuplicateEvents(): Promise<number> {
  console.log("Checking for duplicate events...");

  const allEvents = await db.select().from(events);
  const seen = new Map<string, typeof allEvents[0]>();
  const toDelete: string[] = [];

  for (const event of allEvents) {
    const dateKey = event.startTime ? event.startTime.split("T")[0] : "";
    const key = `${normalizeName(event.name)}-${dateKey}`;

    if (!seen.has(key)) {
      seen.set(key, event);
    } else {
      // Keep the one with more data, delete the other
      const existing = seen.get(key)!;
      const existingScore =
        (existing.description?.length || 0) + (existing.sourceUrl ? 10 : 0);
      const newScore =
        (event.description?.length || 0) + (event.sourceUrl ? 10 : 0);

      if (newScore > existingScore) {
        toDelete.push(existing.id);
        seen.set(key, event);
        console.log(`  Will replace "${existing.name}" with better duplicate`);
      } else {
        toDelete.push(event.id);
        console.log(`  Will delete duplicate: "${event.name}"`);
      }
    }
  }

  // Delete duplicates
  for (const id of toDelete) {
    await db.delete(events).where(eq(events.id, id));
  }

  console.log(`Removed ${toDelete.length} duplicate events`);
  return toDelete.length;
}

async function main() {
  console.log("Starting duplicate removal...\n");

  const venuesRemoved = await removeDuplicateVenues();
  console.log("");
  const eventsRemoved = await removeDuplicateEvents();

  console.log(`\nDone! Removed ${venuesRemoved} venue duplicates and ${eventsRemoved} event duplicates.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
