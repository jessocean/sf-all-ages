import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "../src/lib/schema";
import type { Venue, Event } from "../src/lib/schema";

// Connect to production database
const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const db = drizzle(client, { schema });

// San Francisco bounding box
const SF_BOUNDS = {
  minLat: 37.6,
  maxLat: 37.85,
  minLng: -122.55,
  maxLng: -122.35,
};

// Track issues for summary
const issues: { type: string; id: string; name: string; details: string }[] = [];

function recordIssue(
  type: string,
  id: string,
  name: string,
  details: string
): void {
  issues.push({ type, id, name, details });
}

// Sites known to block automated requests but work fine in browsers
const BOT_BLOCKING_DOMAINS = [
  "gracecathedral.org",
  "yelp.com",
  "farmhousesf.com",
  "farmhousethai.com",
  "saintgregorys.org",
  "randallmuseum.org",
  "houseofair.com",
];

function isKnownBotBlocker(url: string): boolean {
  return BOT_BLOCKING_DOMAINS.some((domain) => url.includes(domain));
}

// Generate search terms from a venue/event name for content matching
function generateSearchTerms(name: string): string[] {
  // Split into words, filter out common words, normalize
  const stopWords = new Set([
    "the", "a", "an", "of", "in", "at", "for", "and", "or", "to", "is", "on",
    "sf", "san", "francisco", "ca", "california", "-", "&", "branch", "center",
    "recreation", "playground", "park", "library", "manufactory"
  ]);

  const words = name
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^\w\s'-]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  // Also include the full name and significant phrases
  const terms = [...words];

  // Add 2-word phrases for more specific matching
  for (let i = 0; i < words.length - 1; i++) {
    terms.push(`${words[i]} ${words[i + 1]}`);
  }

  return [...new Set(terms)];
}

// Check if page content matches the expected venue/event
async function checkUrlContentMatch(
  url: string,
  expectedName: string,
  expectedAddress?: string | null,
  timeout = 15000
): Promise<{
  reachable: boolean;
  contentMatches: boolean;
  status?: number;
  error?: string;
  matchedTerms?: string[];
  pageTitle?: string;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        reachable: false,
        contentMatches: false,
        status: response.status
      };
    }

    const html = await response.text();
    const lowerHtml = html.toLowerCase();

    // Extract page title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : undefined;

    // Generate search terms from the venue/event name
    const searchTerms = generateSearchTerms(expectedName);

    // Also add address components if available
    if (expectedAddress) {
      const addressParts = expectedAddress
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter(w => w.length > 2 && !["san", "francisco", "ca", "california", "street", "st", "ave", "avenue", "blvd"].includes(w));
      searchTerms.push(...addressParts);
    }

    // Check how many terms match in the page content
    const matchedTerms = searchTerms.filter(term => lowerHtml.includes(term));

    // Consider it a match if at least 2 significant terms match, or 1 if only 1-2 terms exist
    const minMatches = searchTerms.length <= 2 ? 1 : 2;
    const contentMatches = matchedTerms.length >= minMatches;

    return {
      reachable: true,
      contentMatches,
      status: response.status,
      matchedTerms,
      pageTitle,
    };
  } catch (error) {
    return {
      reachable: false,
      contentMatches: false,
      error: String(error)
    };
  }
}

// Check if image URL returns an actual image
async function checkImageUrl(
  url: string,
  timeout = 15000
): Promise<{ ok: boolean; contentType?: string; error?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Range": "bytes=0-1023",
      },
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get("content-type") || "";
    const isImage = contentType.startsWith("image/");

    return {
      ok: (response.ok || response.status === 206) && isImage,
      contentType,
      error: (response.ok || response.status === 206) && !isImage ? `Not an image: ${contentType}` : undefined,
    };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// Check if image is a placeholder (generic) vs actual venue photo
function isPlaceholderImage(url: string): boolean {
  const placeholderPatterns = [
    /placehold\.co/i,
    /placeholder/i,
    /picsum\.photos/i,
    /via\.placeholder/i,
    /dummyimage/i,
    /fakeimg/i,
    /lorempixel/i,
  ];
  return placeholderPatterns.some(p => p.test(url));
}

// Check if image URL contains venue-identifying information
// (e.g., Wikimedia images often have venue name in URL)
function imageUrlMatchesVenue(imageUrl: string, venueName: string): {
  matches: boolean;
  confidence: "high" | "medium" | "low" | "placeholder";
  reason: string;
} {
  // Placeholder images are explicitly not venue-specific
  if (isPlaceholderImage(imageUrl)) {
    return {
      matches: false,
      confidence: "placeholder",
      reason: "Image is a placeholder, not a real photo of the venue"
    };
  }

  const urlLower = imageUrl.toLowerCase();
  const nameTerms = generateSearchTerms(venueName);

  // Check for venue name in URL (common with Wikimedia)
  const urlMatches = nameTerms.filter(term =>
    urlLower.includes(term.replace(/\s+/g, "_")) ||
    urlLower.includes(term.replace(/\s+/g, "-")) ||
    urlLower.includes(term.replace(/\s+/g, ""))
  );

  if (urlMatches.length >= 2) {
    return {
      matches: true,
      confidence: "high",
      reason: `URL contains venue identifiers: ${urlMatches.join(", ")}`
    };
  }

  if (urlMatches.length === 1) {
    return {
      matches: true,
      confidence: "medium",
      reason: `URL contains: ${urlMatches[0]}`
    };
  }

  // Generic stock photo services
  if (/unsplash\.com|pexels\.com|shutterstock|getty|stock/i.test(urlLower)) {
    return {
      matches: false,
      confidence: "low",
      reason: "Stock photo service - cannot verify venue match"
    };
  }

  // Unknown - can't determine from URL alone
  return {
    matches: true, // Give benefit of doubt
    confidence: "low",
    reason: "Cannot determine venue match from URL - manual verification needed"
  };
}

let allVenues: Venue[] = [];
let allEvents: Event[] = [];

const runListingAccuracy = process.env.RUN_LISTING_ACCURACY_TESTS === "true";
const describeListingAccuracy = runListingAccuracy ? describe : describe.skip;

describeListingAccuracy("Listing Accuracy Tests", () => {
  beforeAll(async () => {
    allVenues = await db.select().from(schema.venues);
    allEvents = await db.select().from(schema.events);
    console.log(`\nLoaded ${allVenues.length} venues and ${allEvents.length} events from production\n`);
  });

  describe("URL Content Validation", () => {
    it("venue websiteUrls should point to pages about the actual venue", async () => {
      const venuesWithUrls = allVenues.filter((v) => v.websiteUrl);
      const results: {
        venue: Venue;
        result: Awaited<ReturnType<typeof checkUrlContentMatch>>
      }[] = [];

      for (const venue of venuesWithUrls) {
        // Skip known bot-blocking sites
        if (isKnownBotBlocker(venue.websiteUrl!)) {
          continue;
        }

        const result = await checkUrlContentMatch(
          venue.websiteUrl!,
          venue.name,
          venue.address
        );
        results.push({ venue, result });

        if (!result.reachable) {
          recordIssue(
            "unreachable_website_url",
            venue.id,
            venue.name,
            `URL: ${venue.websiteUrl}, Status: ${result.status || result.error}`
          );
        } else if (!result.contentMatches) {
          recordIssue(
            "mismatched_website_url",
            venue.id,
            venue.name,
            `URL ${venue.websiteUrl} does not appear to be about "${venue.name}" (page title: "${result.pageTitle}")`
          );
        }
      }

      const unreachable = results.filter((r) => !r.result.reachable);
      const mismatched = results.filter((r) => r.result.reachable && !r.result.contentMatches);

      if (unreachable.length > 0) {
        console.log("\nUnreachable website URLs:");
        unreachable.forEach(({ venue, result }) => {
          console.log(`  - ${venue.name}: ${venue.websiteUrl} (${result.status || result.error})`);
        });
      }

      if (mismatched.length > 0) {
        console.log("\nWebsite URLs that don't match venue:");
        mismatched.forEach(({ venue, result }) => {
          console.log(`  - ${venue.name}: ${venue.websiteUrl}`);
          console.log(`    Page title: "${result.pageTitle}"`);
          console.log(`    Matched terms: ${result.matchedTerms?.join(", ") || "none"}`);
        });
      }

      expect(unreachable.length).toBe(0);
      expect(mismatched.length).toBe(0);
    }, 300000); // 5 min timeout for all venues

    it("event sourceUrls should point to pages about the actual event", async () => {
      const eventsWithUrls = allEvents.filter((e) => e.sourceUrl);
      const results: {
        event: Event;
        result: Awaited<ReturnType<typeof checkUrlContentMatch>>
      }[] = [];

      for (const event of eventsWithUrls) {
        if (isKnownBotBlocker(event.sourceUrl!)) {
          continue;
        }

        const result = await checkUrlContentMatch(
          event.sourceUrl!,
          event.name,
          event.address
        );
        results.push({ event, result });

        if (!result.reachable) {
          recordIssue(
            "unreachable_source_url",
            event.id,
            event.name,
            `URL: ${event.sourceUrl}, Status: ${result.status || result.error}`
          );
        } else if (!result.contentMatches) {
          recordIssue(
            "mismatched_source_url",
            event.id,
            event.name,
            `URL ${event.sourceUrl} does not appear to be about "${event.name}"`
          );
        }
      }

      const unreachable = results.filter((r) => !r.result.reachable);
      const mismatched = results.filter((r) => r.result.reachable && !r.result.contentMatches);

      if (unreachable.length > 0) {
        console.log("\nUnreachable event source URLs:");
        unreachable.forEach(({ event, result }) => {
          console.log(`  - ${event.name}: ${event.sourceUrl} (${result.status || result.error})`);
        });
      }

      if (mismatched.length > 0) {
        console.log("\nEvent source URLs that don't match event:");
        mismatched.forEach(({ event, result }) => {
          console.log(`  - ${event.name}: ${event.sourceUrl}`);
          console.log(`    Page title: "${result.pageTitle}"`);
          console.log(`    Matched terms: ${result.matchedTerms?.join(", ") || "none"}`);
        });
      }

      expect(unreachable.length).toBe(0);
      expect(mismatched.length).toBe(0);
    }, 300000);
  });

  describe("Image Verification", () => {
    it("venue imageUrls should be valid images", async () => {
      const venuesWithImages = allVenues.filter((v) => v.imageUrl);
      const results: { venue: Venue; result: Awaited<ReturnType<typeof checkImageUrl>> }[] = [];

      for (const venue of venuesWithImages) {
        const result = await checkImageUrl(venue.imageUrl!);
        results.push({ venue, result });

        if (!result.ok) {
          recordIssue(
            "broken_venue_image",
            venue.id,
            venue.name,
            `URL: ${venue.imageUrl}, Error: ${result.error || `Invalid: ${result.contentType}`}`
          );
        }
      }

      const brokenImages = results.filter((r) => !r.result.ok);

      if (brokenImages.length > 0) {
        console.log("\nBroken venue image URLs:");
        brokenImages.forEach(({ venue, result }) => {
          console.log(`  - ${venue.name}: ${venue.imageUrl} (${result.error || result.contentType})`);
        });
      }

      expect(brokenImages.length).toBe(0);
    }, 120000);

    it("venue images should be identifiable as the actual venue (not generic placeholders)", () => {
      const venuesWithImages = allVenues.filter((v) => v.imageUrl);
      const placeholderImages: { venue: Venue; analysis: ReturnType<typeof imageUrlMatchesVenue> }[] = [];
      const lowConfidenceImages: { venue: Venue; analysis: ReturnType<typeof imageUrlMatchesVenue> }[] = [];

      for (const venue of venuesWithImages) {
        const analysis = imageUrlMatchesVenue(venue.imageUrl!, venue.name);

        if (analysis.confidence === "placeholder") {
          placeholderImages.push({ venue, analysis });
          recordIssue(
            "placeholder_venue_image",
            venue.id,
            venue.name,
            `${venue.imageUrl} - ${analysis.reason}`
          );
        } else if (analysis.confidence === "low" && !analysis.matches) {
          lowConfidenceImages.push({ venue, analysis });
          recordIssue(
            "unverifiable_venue_image",
            venue.id,
            venue.name,
            `${venue.imageUrl} - ${analysis.reason}`
          );
        }
      }

      if (placeholderImages.length > 0) {
        console.log("\nVenues with placeholder images (need real photos):");
        placeholderImages.forEach(({ venue, analysis }) => {
          console.log(`  - ${venue.name}: ${analysis.reason}`);
        });
      }

      if (lowConfidenceImages.length > 0) {
        console.log("\nVenues with unverifiable images (may be stock photos):");
        lowConfidenceImages.forEach(({ venue, analysis }) => {
          console.log(`  - ${venue.name}: ${analysis.reason}`);
        });
      }

      // Fail if more than 20% of venues have placeholder images
      const placeholderPercent = (placeholderImages.length / venuesWithImages.length) * 100;
      console.log(`\n${placeholderPercent.toFixed(1)}% of venues have placeholder images`);

      expect(placeholderPercent).toBeLessThan(20);
    });

    it("all event imageUrls should point to actual images", async () => {
      const eventsWithImages = allEvents.filter((e) => e.imageUrl);
      const results: { event: Event; result: Awaited<ReturnType<typeof checkImageUrl>> }[] = [];

      for (const event of eventsWithImages) {
        const result = await checkImageUrl(event.imageUrl!);
        results.push({ event, result });

        if (!result.ok) {
          recordIssue(
            "broken_event_image",
            event.id,
            event.name,
            `URL: ${event.imageUrl}, Error: ${result.error || `Invalid: ${result.contentType}`}`
          );
        }
      }

      const brokenImages = results.filter((r) => !r.result.ok);

      if (brokenImages.length > 0) {
        console.log("\nBroken event image URLs:");
        brokenImages.forEach(({ event, result }) => {
          console.log(`  - ${event.name}: ${event.imageUrl} (${result.error || result.contentType})`);
        });
      }

      expect(brokenImages.length).toBe(0);
    }, 120000);

    it("venues should have images (missing images reduce quality)", () => {
      const venuesWithoutImages = allVenues.filter(
        (v) => !v.imageUrl && v.status === "active"
      );

      if (venuesWithoutImages.length > 0) {
        console.log("\nVenues missing images:");
        venuesWithoutImages.forEach((venue) => {
          console.log(`  - ${venue.name} (${venue.venueType})`);
          recordIssue(
            "missing_venue_image",
            venue.id,
            venue.name,
            "No image URL provided"
          );
        });
      }

      const percentWithImages =
        ((allVenues.length - venuesWithoutImages.length) / allVenues.length) * 100;
      console.log(`\n${percentWithImages.toFixed(1)}% of venues have images`);

      expect(percentWithImages).toBeGreaterThan(50);
    });
  });

  describe("Distance/Coordinate Validation", () => {
    it("all venues should have valid coordinates within SF", () => {
      const venuesWithCoords = allVenues.filter(
        (v) => v.latitude !== null && v.longitude !== null
      );
      const venuesWithoutCoords = allVenues.filter(
        (v) => v.latitude === null || v.longitude === null
      );

      if (venuesWithoutCoords.length > 0) {
        console.log("\nVenues missing coordinates:");
        venuesWithoutCoords.forEach((venue) => {
          console.log(`  - ${venue.name}: ${venue.address}`);
          recordIssue(
            "missing_coordinates",
            venue.id,
            venue.name,
            `Address: ${venue.address}`
          );
        });
      }

      const venuesOutsideSF = venuesWithCoords.filter((v) => {
        const lat = v.latitude!;
        const lng = v.longitude!;
        return (
          lat < SF_BOUNDS.minLat ||
          lat > SF_BOUNDS.maxLat ||
          lng < SF_BOUNDS.minLng ||
          lng > SF_BOUNDS.maxLng
        );
      });

      if (venuesOutsideSF.length > 0) {
        console.log("\nVenues with coordinates outside SF bounds:");
        venuesOutsideSF.forEach((venue) => {
          console.log(`  - ${venue.name}: (${venue.latitude}, ${venue.longitude})`);
          recordIssue(
            "coordinates_outside_sf",
            venue.id,
            venue.name,
            `Lat: ${venue.latitude}, Lng: ${venue.longitude}`
          );
        });
      }

      expect(venuesWithoutCoords.length).toBe(0);
      expect(venuesOutsideSF.length).toBe(0);
    });

    it("coordinates should be plausible (not null island, not transposed)", () => {
      const suspiciousCoords = allVenues.filter((v) => {
        if (v.latitude === null || v.longitude === null) return false;

        const lat = v.latitude;
        const lng = v.longitude;

        if (lat === 0 && lng === 0) return true;
        if (lat < -100) return true;
        if (lng > 0 && lng < 50) return true;

        return false;
      });

      if (suspiciousCoords.length > 0) {
        console.log("\nVenues with suspicious coordinates:");
        suspiciousCoords.forEach((venue) => {
          console.log(`  - ${venue.name}: (${venue.latitude}, ${venue.longitude})`);
          recordIssue(
            "suspicious_coordinates",
            venue.id,
            venue.name,
            `Lat: ${venue.latitude}, Lng: ${venue.longitude}`
          );
        });
      }

      expect(suspiciousCoords.length).toBe(0);
    });
  });

  describe("Pricing Accuracy", () => {
    it("venues marked as free should not have non-zero prices", () => {
      const inconsistentPricing = allVenues.filter((v) => {
        if (v.pricingType !== "free") return false;
        return (
          (v.adultPrice !== null && v.adultPrice > 0) ||
          (v.childPrice !== null && v.childPrice > 0) ||
          (v.toddlerPrice !== null && v.toddlerPrice > 0) ||
          (v.teenPrice !== null && v.teenPrice > 0)
        );
      });

      if (inconsistentPricing.length > 0) {
        console.log("\nVenues marked free but have prices:");
        inconsistentPricing.forEach((venue) => {
          console.log(`  - ${venue.name}: pricingType=free but adult=$${venue.adultPrice}, child=$${venue.childPrice}`);
          recordIssue(
            "inconsistent_free_pricing",
            venue.id,
            venue.name,
            `Marked free but has prices: adult=$${venue.adultPrice}, child=$${venue.childPrice}`
          );
        });
      }

      expect(inconsistentPricing.length).toBe(0);
    });

    it("events marked as free should not have non-zero prices", () => {
      const inconsistentPricing = allEvents.filter((e) => {
        if (e.pricingType !== "free") return false;
        return (
          (e.adultPrice !== null && e.adultPrice > 0) ||
          (e.childPrice !== null && e.childPrice > 0) ||
          (e.toddlerPrice !== null && e.toddlerPrice > 0) ||
          (e.teenPrice !== null && e.teenPrice > 0)
        );
      });

      if (inconsistentPricing.length > 0) {
        console.log("\nEvents marked free but have prices:");
        inconsistentPricing.forEach((event) => {
          console.log(`  - ${event.name}: pricingType=free but adult=$${event.adultPrice}, child=$${event.childPrice}`);
          recordIssue(
            "inconsistent_free_event_pricing",
            event.id,
            event.name,
            `Marked free but has prices: adult=$${event.adultPrice}, child=$${event.childPrice}`
          );
        });
      }

      expect(inconsistentPricing.length).toBe(0);
    });

    it("paid venues should have at least one price set", () => {
      const missingPrices = allVenues.filter((v) => {
        if (v.pricingType !== "per_person" && v.pricingType !== "flat_rate") {
          return false;
        }
        return (v.adultPrice === null || v.adultPrice === 0) && !v.pricingNotes;
      });

      if (missingPrices.length > 0) {
        console.log("\nPaid venues missing price information:");
        missingPrices.forEach((venue) => {
          console.log(`  - ${venue.name}: pricingType=${venue.pricingType} but no prices set`);
          recordIssue(
            "missing_price_for_paid_venue",
            venue.id,
            venue.name,
            `Pricing type: ${venue.pricingType} but no prices or notes`
          );
        });
      }

      expect(missingPrices.length).toBe(0);
    });

    it("venues with pricingType should have a valid type", () => {
      const validTypes = ["free", "per_person", "flat_rate", "menu", null];
      const invalidTypes = allVenues.filter(
        (v) => v.pricingType && !validTypes.includes(v.pricingType)
      );

      if (invalidTypes.length > 0) {
        console.log("\nVenues with invalid pricing types:");
        invalidTypes.forEach((venue) => {
          console.log(`  - ${venue.name}: pricingType="${venue.pricingType}"`);
          recordIssue(
            "invalid_pricing_type",
            venue.id,
            venue.name,
            `Invalid pricing type: ${venue.pricingType}`
          );
        });
      }

      expect(invalidTypes.length).toBe(0);
    });
  });

  describe("Description Quality", () => {
    it("all active venues should have descriptions", () => {
      const missingDescriptions = allVenues.filter(
        (v) => v.status === "active" && (!v.description || v.description.trim() === "")
      );

      if (missingDescriptions.length > 0) {
        console.log("\nActive venues missing descriptions:");
        missingDescriptions.forEach((venue) => {
          console.log(`  - ${venue.name}`);
          recordIssue(
            "missing_description",
            venue.id,
            venue.name,
            "No description provided"
          );
        });
      }

      expect(missingDescriptions.length).toBe(0);
    });

    it("descriptions should be meaningful (not too short)", () => {
      const shortDescriptions = allVenues.filter((v) => {
        if (!v.description) return false;
        return v.description.trim().length < 20;
      });

      if (shortDescriptions.length > 0) {
        console.log("\nVenues with too-short descriptions:");
        shortDescriptions.forEach((venue) => {
          console.log(`  - ${venue.name}: "${venue.description}"`);
          recordIssue(
            "short_description",
            venue.id,
            venue.name,
            `Description too short: "${venue.description}"`
          );
        });
      }

      expect(shortDescriptions.length).toBe(0);
    });

    it("descriptions should not contain placeholder text", () => {
      const placeholderPatterns = [
        /lorem ipsum/i,
        /TODO/i,
        /FIXME/i,
        /placeholder/i,
        /description here/i,
        /\[.*\]/g,
        /TBD/i,
        /coming soon/i,
      ];

      const placeholderDescriptions = allVenues.filter((v) => {
        if (!v.description) return false;
        return placeholderPatterns.some((pattern) => pattern.test(v.description!));
      });

      if (placeholderDescriptions.length > 0) {
        console.log("\nVenues with placeholder descriptions:");
        placeholderDescriptions.forEach((venue) => {
          console.log(`  - ${venue.name}: "${venue.description}"`);
          recordIssue(
            "placeholder_description",
            venue.id,
            venue.name,
            `Placeholder text in description: "${venue.description}"`
          );
        });
      }

      expect(placeholderDescriptions.length).toBe(0);
    });
  });

  describe("Data Completeness", () => {
    it("all venues should have required fields", () => {
      const incompleteVenues = allVenues.filter((v) => !v.name || !v.address);

      if (incompleteVenues.length > 0) {
        console.log("\nVenues missing required fields:");
        incompleteVenues.forEach((venue) => {
          const missing = [];
          if (!venue.name) missing.push("name");
          if (!venue.address) missing.push("address");
          console.log(`  - ID ${venue.id}: missing ${missing.join(", ")}`);
          recordIssue(
            "missing_required_fields",
            venue.id,
            venue.name || "UNKNOWN",
            `Missing: ${missing.join(", ")}`
          );
        });
      }

      expect(incompleteVenues.length).toBe(0);
    });

    it("all events should have required fields", () => {
      const incompleteEvents = allEvents.filter((e) => !e.name || !e.startTime);

      if (incompleteEvents.length > 0) {
        console.log("\nEvents missing required fields:");
        incompleteEvents.forEach((event) => {
          const missing = [];
          if (!event.name) missing.push("name");
          if (!event.startTime) missing.push("startTime");
          console.log(`  - ID ${event.id}: missing ${missing.join(", ")}`);
          recordIssue(
            "missing_event_required_fields",
            event.id,
            event.name || "UNKNOWN",
            `Missing: ${missing.join(", ")}`
          );
        });
      }

      expect(incompleteEvents.length).toBe(0);
    });

    it("events with venueId should reference existing venues", () => {
      const venueIds = new Set(allVenues.map((v) => v.id));
      const orphanedEvents = allEvents.filter(
        (e) => e.venueId && !venueIds.has(e.venueId)
      );

      if (orphanedEvents.length > 0) {
        console.log("\nEvents referencing non-existent venues:");
        orphanedEvents.forEach((event) => {
          console.log(`  - ${event.name}: venueId=${event.venueId}`);
          recordIssue(
            "orphaned_event_venue_reference",
            event.id,
            event.name,
            `References non-existent venue: ${event.venueId}`
          );
        });
      }

      expect(orphanedEvents.length).toBe(0);
    });
  });

  describe("Age Tagging Consistency", () => {
    it("kid-focused venues should have at least one age group marked friendly", () => {
      const inconsistentKidFocused = allVenues.filter((v) => {
        if (!v.kidFocused) return false;
        return !v.toddlerFriendly && !v.youngKidFriendly && !v.teenFriendly;
      });

      if (inconsistentKidFocused.length > 0) {
        console.log("\nKid-focused venues with no age groups marked:");
        inconsistentKidFocused.forEach((venue) => {
          console.log(`  - ${venue.name}`);
          recordIssue(
            "kid_focused_no_age_groups",
            venue.id,
            venue.name,
            "Marked kid-focused but no age groups set as friendly"
          );
        });
      }

      expect(inconsistentKidFocused.length).toBe(0);
    });
  });

  afterAll(() => {
    if (issues.length > 0) {
      console.log("\n" + "=".repeat(60));
      console.log("SUMMARY OF ALL ISSUES");
      console.log("=".repeat(60));

      const byType = issues.reduce((acc, issue) => {
        acc[issue.type] = acc[issue.type] || [];
        acc[issue.type].push(issue);
        return acc;
      }, {} as Record<string, typeof issues>);

      Object.entries(byType).forEach(([type, typeIssues]) => {
        console.log(`\n${type}: ${typeIssues.length} issues`);
        typeIssues.slice(0, 5).forEach((issue) => {
          console.log(`  - ${issue.name}: ${issue.details}`);
        });
        if (typeIssues.length > 5) {
          console.log(`  ... and ${typeIssues.length - 5} more`);
        }
      });

      console.log(`\nTotal issues: ${issues.length}`);
    } else {
      console.log("\n✅ All listings passed validation!");
    }
  });
});
