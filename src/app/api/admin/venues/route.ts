import { NextRequest, NextResponse } from "next/server";
import { db, venues } from "@/lib/db";
import { nanoid } from "nanoid";
import { findVenueImage, getWikimediaSearchUrl } from "@/lib/images";
import {
  normalizeUrl,
  validateVenueListing,
  isGenericVenueImageUrl,
  isPlaceholderImageUrl,
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

    // Normalize provided URLs
    const rawImageUrl = body.imageUrl;
    const rawWebsiteUrl = body.websiteUrl;
    let imageUrl = normalizeUrl(rawImageUrl) || null;
    let websiteUrl = normalizeUrl(rawWebsiteUrl) || null;

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

    if (rawWebsiteUrl && !websiteUrl) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: [
            {
              field: "websiteUrl",
              message: "Website URL must be a valid http(s) link.",
              severity: "error",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Auto-find image if not provided
    if (!imageUrl) {
      imageUrl = findVenueImage(body.name, body.venueType);
    }

    if (imageUrl && (isGenericVenueImageUrl(imageUrl) || isPlaceholderImageUrl(imageUrl))) {
      imageUrl = null;
    }

    // Validate website URL if provided
    let urlWarning: string | null = null;
    if (websiteUrl && isValidHttpUrl(websiteUrl)) {
      const isValid = await validateUrl(websiteUrl);
      if (!isValid) {
        urlWarning = `Warning: Website URL may be invalid or unreachable: ${websiteUrl}`;
        console.warn(urlWarning);
      }
    }

    const validation = validateVenueListing({
      ...body,
      imageUrl,
      websiteUrl,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Validation failed", issues: validation.issues },
        { status: 400 }
      );
    }

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
      kidFocused: body.kidFocused || false,
      description: body.description || null,
      imageUrl,
      websiteUrl,
      status: "active",
      lastVerifiedAt: now,
      createdAt: now,
      // Pricing
      pricingType: body.pricingType || null,
      adultPrice: body.adultPrice || null,
      childPrice: body.childPrice || null,
      toddlerPrice: body.toddlerPrice || null,
      teenPrice: body.teenPrice || null,
      pricingNotes: body.pricingNotes || null,
      // Parking
      parkingType: body.parkingType || null,
      parkingCost: body.parkingCost || null,
      parkingNotes: body.parkingNotes || null,
    });

    // Return helpful info for manual image finding if none was auto-found
    const response: {
      success: boolean;
      id: string;
      imageUrl: string | null;
      imageSearchUrl?: string;
      urlWarning?: string;
      issues?: typeof validation.issues;
    } = {
      success: true,
      id,
      imageUrl,
    };

    if (!imageUrl) {
      response.imageSearchUrl = getWikimediaSearchUrl(body.name);
    }

    if (urlWarning) {
      response.urlWarning = urlWarning;
    }

    if (validation.issues.length > 0) {
      response.issues = validation.issues;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error creating venue:", error);
    return NextResponse.json(
      { error: "Failed to create venue" },
      { status: 500 }
    );
  }
}
