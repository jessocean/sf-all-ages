import { NextResponse } from "next/server";
import { db, venues } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allVenues = await db
      .select()
      .from(venues)
      .where(eq(venues.status, "active"));

    return NextResponse.json(allVenues);
  } catch (error) {
    console.error("Error fetching venues:", error);
    return NextResponse.json(
      { error: "Failed to fetch venues" },
      { status: 500 }
    );
  }
}
