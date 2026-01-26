import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "../src/lib/schema";
import { venues, events } from "../src/lib/schema";
import { eq, like, or, inArray } from "drizzle-orm";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client, { schema });

// Venues that are primarily kid-focused (kids' museums, playgrounds, etc.)
const kidFocusedVenuePatterns = [
  // Children's museums and kid-specific attractions
  "Children's Creativity Museum",
  "Bay Area Discovery Museum",
  "Children's Fairyland",
  "Randall Museum",
  // Playgrounds (primarily for kids)
  "Koret Children's Quarter",
  "Julius Kahn Playground",
  "Helen Diller Playground",
  "Mountain Lake Playground",
  "Presidio Heights Playground",
  "Glen Canyon Park Playground",
  "Sue Bierman Park Playground",
  "Cow Hollow Playground",
  "Noe Valley Courts & Playground",
  "Lafayette Park Playground",
  // Libraries with children's focus
  "Children's Center",
];

// Event patterns that indicate kid-focused events
const kidFocusedEventPatterns = [
  // Storytime and reading programs
  "Storytime",
  "Story Time",
  "Toddler Time",
  "Baby Rhyme Time",
  "Preschool",
  // Children's museum programs
  "Children's Creativity",
  "Bay Area Discovery Museum",
  "Randall Museum",
  "Children's Fairyland",
  // Other explicitly kid-focused events
  "Kids' Concert",
  "Children's Concert",
  "Puppet",
];

// Venue types that are inherently kid-focused
const kidFocusedVenueTypes = ["playground", "children_museum"];

async function main() {
  console.log("Marking kid-focused venues and events...\n");

  // Mark kid-focused venues by name
  console.log("Updating venues...");
  let venueCount = 0;

  for (const pattern of kidFocusedVenuePatterns) {
    const result = await db
      .update(venues)
      .set({ kidFocused: true })
      .where(like(venues.name, `%${pattern}%`));

    // Check if any rows were affected by querying
    const matched = await db
      .select()
      .from(venues)
      .where(like(venues.name, `%${pattern}%`));

    if (matched.length > 0) {
      console.log(`  ✓ Marked "${pattern}" (${matched.length} matches)`);
      venueCount += matched.length;
    }
  }

  // Also mark by venue type
  const playgrounds = await db
    .select()
    .from(venues)
    .where(eq(venues.venueType, "playground"));

  if (playgrounds.length > 0) {
    await db
      .update(venues)
      .set({ kidFocused: true })
      .where(eq(venues.venueType, "playground"));
    console.log(`  ✓ Marked all playgrounds (${playgrounds.length} venues)`);
    venueCount += playgrounds.length;
  }

  // Mark kid-focused events
  console.log("\nUpdating events...");
  let eventCount = 0;

  for (const pattern of kidFocusedEventPatterns) {
    const matched = await db
      .select()
      .from(events)
      .where(like(events.name, `%${pattern}%`));

    if (matched.length > 0) {
      await db
        .update(events)
        .set({ kidFocused: true })
        .where(like(events.name, `%${pattern}%`));
      console.log(`  ✓ Marked "${pattern}" events (${matched.length} matches)`);
      eventCount += matched.length;
    }
  }

  // Also check event descriptions for kid-focused content
  const descPatterns = ["for kids", "for children", "ages 0-5", "ages 2-5", "preschooler"];
  for (const pattern of descPatterns) {
    const matched = await db
      .select()
      .from(events)
      .where(like(events.description, `%${pattern}%`));

    if (matched.length > 0) {
      await db
        .update(events)
        .set({ kidFocused: true })
        .where(like(events.description, `%${pattern}%`));
      console.log(`  ✓ Marked events with "${pattern}" in description (${matched.length} matches)`);
      eventCount += matched.length;
    }
  }

  // Summary
  const totalKidFocusedVenues = await db
    .select()
    .from(venues)
    .where(eq(venues.kidFocused, true));

  const totalKidFocusedEvents = await db
    .select()
    .from(events)
    .where(eq(events.kidFocused, true));

  console.log(`\n✅ Done!`);
  console.log(`   ${totalKidFocusedVenues.length} venues marked as kid-focused`);
  console.log(`   ${totalKidFocusedEvents.length} events marked as kid-focused`);
}

main().catch(console.error);
