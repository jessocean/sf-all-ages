import { NextResponse } from "next/server";
import { db, venues } from "@/lib/db";
import { eq } from "drizzle-orm";

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

    return NextResponse.json(allVenues);
  } catch (error) {
    console.error("Error fetching venues:", error);
    return NextResponse.json(
      { error: "Failed to fetch venues", details: String(error) },
      { status: 500 }
    );
  }
}
