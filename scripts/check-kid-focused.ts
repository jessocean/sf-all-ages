import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { venues, events } from "../src/lib/schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client);

async function main() {
  const allVenues = await db.select().from(venues);
  const allEvents = await db.select().from(events);

  console.log("=== Venues that should be kid-focused ===");
  const kidVenuePatterns = ["Playground", "Children", "Randall", "Discovery", "Library"];
  for (const v of allVenues) {
    for (const p of kidVenuePatterns) {
      if (v.name?.toLowerCase().includes(p.toLowerCase())) {
        console.log(`  ${v.name} | kidFocused: ${v.kidFocused}`);
        break;
      }
    }
  }

  console.log("\n=== Events that should be kid-focused ===");
  const kidEventPatterns = ["Storytime", "Story Time", "Toddler", "Baby", "Preschool", "Children"];
  for (const e of allEvents) {
    for (const p of kidEventPatterns) {
      if (e.name?.toLowerCase().includes(p.toLowerCase())) {
        console.log(`  ${e.name} | kidFocused: ${e.kidFocused}`);
        break;
      }
    }
  }

  console.log("\n=== Summary ===");
  const kidVenues = allVenues.filter((v) => v.kidFocused);
  const kidEvents = allEvents.filter((e) => e.kidFocused);
  console.log(`Total venues: ${allVenues.length}, kid-focused: ${kidVenues.length}`);
  console.log(`Total events: ${allEvents.length}, kid-focused: ${kidEvents.length}`);
}

main().catch(console.error);
