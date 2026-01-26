import { NextResponse } from "next/server";
import { db, events } from "@/lib/db";
import { gte } from "drizzle-orm";
import { Event } from "@/lib/schema";

// Normalize name for duplicate comparison
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "") // Remove non-alphanumeric
    .trim();
}

// Deduplicate events by normalized name + start date
function deduplicateEvents(eventsList: Event[]): Event[] {
  const seen = new Map<string, Event>();

  for (const event of eventsList) {
    // Create a unique key from normalized name + start date (just the date part)
    const dateKey = event.startTime ? event.startTime.split("T")[0] : "";
    const key = `${normalizeName(event.name)}-${dateKey}`;

    // Keep the first occurrence (or one with more data)
    if (!seen.has(key)) {
      seen.set(key, event);
    } else {
      // Prefer the event with more complete data
      const existing = seen.get(key)!;
      const existingScore = (existing.description?.length || 0) + (existing.sourceUrl ? 10 : 0);
      const newScore = (event.description?.length || 0) + (event.sourceUrl ? 10 : 0);
      if (newScore > existingScore) {
        seen.set(key, event);
      }
    }
  }

  return Array.from(seen.values());
}

export async function GET() {
  try {
    // Get events starting from now
    const now = new Date().toISOString();

    const upcomingEvents = await db
      .select()
      .from(events)
      .where(gte(events.startTime, now))
      .orderBy(events.startTime);

    // Remove duplicates before returning
    const dedupedEvents = deduplicateEvents(upcomingEvents);

    return NextResponse.json(dedupedEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
