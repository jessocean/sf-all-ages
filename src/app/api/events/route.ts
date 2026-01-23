import { NextResponse } from "next/server";
import { db, events } from "@/lib/db";
import { gte } from "drizzle-orm";

export async function GET() {
  try {
    // Get events starting from now
    const now = new Date().toISOString();

    const upcomingEvents = await db
      .select()
      .from(events)
      .where(gte(events.startTime, now))
      .orderBy(events.startTime);

    return NextResponse.json(upcomingEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
