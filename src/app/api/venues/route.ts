import { NextResponse } from "next/server";
import { db, venues } from "@/lib/db";
import { eq } from "drizzle-orm";
import { Venue } from "@/lib/schema";

// Normalize name for duplicate comparison
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "") // Remove non-alphanumeric
    .trim();
}

// Deduplicate venues by normalized name + address
function deduplicateVenues(venuesList: Venue[]): Venue[] {
  const seen = new Map<string, Venue>();

  for (const venue of venuesList) {
    // Create a unique key from normalized name + normalized address start
    const addressKey = venue.address
      ? normalizeName(venue.address.split(",")[0]) // Just the street part
      : "";
    const key = `${normalizeName(venue.name)}-${addressKey}`;

    // Keep the first occurrence (or one with more data)
    if (!seen.has(key)) {
      seen.set(key, venue);
    } else {
      // Prefer the venue with more complete data
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
        seen.set(key, venue);
      }
    }
  }

  return Array.from(seen.values());
}

export async function GET() {
  try {
    // Debug: Check if env vars are set
    const hasUrl = !!process.env.TURSO_DATABASE_URL;
    const hasToken = !!process.env.TURSO_AUTH_TOKEN;

    if (!hasUrl || !hasToken) {
      console.error("Missing env vars:", { hasUrl, hasToken });
      return NextResponse.json(
        { error: "Database not configured", hasUrl, hasToken },
        { status: 500 }
      );
    }

    const allVenues = await db
      .select()
      .from(venues)
      .where(eq(venues.status, "active"));

    // Remove duplicates before returning
    const dedupedVenues = deduplicateVenues(allVenues);

    return NextResponse.json(dedupedVenues);
  } catch (error) {
    console.error("Error fetching venues:", error);
    return NextResponse.json(
      { error: "Failed to fetch venues", details: String(error) },
      { status: 500 }
    );
  }
}
