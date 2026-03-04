import { NextRequest, NextResponse } from "next/server";
import { db, events } from "@/lib/db";
import { nanoid } from "nanoid";
import {
  normalizeUrl,
  validateEventListing,
  isValidHttpUrl,
} from "@/lib/validation";

// Validate that a URL is reachable
async function validateUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: { "User-Agent": "SF All-Ages Link Validator" },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const id = nanoid();
    const now = new Date().toISOString();

    // Convert datetime-local format to ISO string
    const startTime = body.startTime ? new Date(body.startTime).toISOString() : now;
    const endTime = body.endTime ? new Date(body.endTime).toISOString() : null;

    const rawSourceUrl = body.sourceUrl;
    const rawImageUrl = body.imageUrl;
    const sourceUrl = normalizeUrl(rawSourceUrl) || null;
    const imageUrl = normalizeUrl(rawImageUrl) || null;

    if (rawSourceUrl && !sourceUrl) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: [
            {
              field: "sourceUrl",
              message: "Source URL must be a valid http(s) link.",
              severity: "error",
            },
          ],
        },
        { status: 400 }
      );
    }

    if (rawImageUrl && !imageUrl) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: [
            {
              field: "imageUrl",
              message: "Image URL must be a valid http(s) link.",
              severity: "error",
            },
          ],
        },
        { status: 400 }
      );
    }

    let urlWarning: string | null = null;
    if (sourceUrl && isValidHttpUrl(sourceUrl)) {
      const isValid = await validateUrl(sourceUrl);
      if (!isValid) {
        urlWarning = `Warning: Source URL may be invalid or unreachable: ${sourceUrl}`;
        console.warn(urlWarning);
      }
    }

    const validation = validateEventListing({
      ...body,
      sourceUrl,
      imageUrl,
      startTime,
      endTime,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Validation failed", issues: validation.issues },
        { status: 400 }
      );
    }

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
      imageUrl,
      sourceUrl,
      sourcePlatform: body.sourcePlatform || "manual",
      lastUpdatedAt: now,
      createdAt: now,
      pricingType: body.pricingType || null,
      adultPrice: body.adultPrice || null,
      childPrice: body.childPrice || null,
      toddlerPrice: body.toddlerPrice || null,
      teenPrice: body.teenPrice || null,
      pricingNotes: body.pricingNotes || null,
    });

    return NextResponse.json({
      success: true,
      id,
      urlWarning: urlWarning || undefined,
      issues: validation.issues.length > 0 ? validation.issues : undefined,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
