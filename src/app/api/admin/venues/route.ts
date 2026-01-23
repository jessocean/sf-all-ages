import { NextRequest, NextResponse } from "next/server";
import { db, venues } from "@/lib/db";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const id = nanoid();
    const now = new Date().toISOString();

    await db.insert(venues).values({
      id,
      name: body.name,
      address: body.address,
      neighborhood: body.neighborhood || null,
      latitude: body.latitude || null,
      longitude: body.longitude || null,
      venueType: body.venueType || null,
      hoursJson: body.hoursJson || null,
      hasPlayArea: body.hasPlayArea || false,
      hasOutdoorSpace: body.hasOutdoorSpace || false,
      isEnclosed: body.isEnclosed || false,
      hasHighChairs: body.hasHighChairs || false,
      hasChangingTable: body.hasChangingTable || false,
      strollerAccessible: body.strollerAccessible || false,
      loudOk: body.loudOk || false,
      toddlerFriendly: body.toddlerFriendly || false,
      youngKidFriendly: body.youngKidFriendly || false,
      teenFriendly: body.teenFriendly || false,
      description: body.description || null,
      websiteUrl: body.websiteUrl || null,
      status: "active",
      lastVerifiedAt: now,
      createdAt: now,
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error creating venue:", error);
    return NextResponse.json(
      { error: "Failed to create venue" },
      { status: 500 }
    );
  }
}
