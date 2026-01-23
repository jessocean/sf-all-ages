import { NextRequest, NextResponse } from "next/server";
import { db, events } from "@/lib/db";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const id = nanoid();
    const now = new Date().toISOString();

    // Convert datetime-local format to ISO string
    const startTime = body.startTime ? new Date(body.startTime).toISOString() : now;
    const endTime = body.endTime ? new Date(body.endTime).toISOString() : null;

    await db.insert(events).values({
      id,
      name: body.name,
      description: body.description || null,
      venueId: body.venueId || null,
      address: body.address || null,
      eventType: body.eventType || null,
      startTime,
      endTime,
      isRecurring: body.isRecurring || false,
      recurrenceRule: body.recurrenceRule || null,
      hasKidsActivities: body.hasKidsActivities || false,
      outdoor: body.outdoor || false,
      toddlerFriendly: body.toddlerFriendly || false,
      youngKidFriendly: body.youngKidFriendly || false,
      teenFriendly: body.teenFriendly || false,
      sourceUrl: body.sourceUrl || null,
      sourcePlatform: body.sourcePlatform || "manual",
      lastUpdatedAt: now,
      createdAt: now,
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
