/**
 * FunCheap RSS Feed importer.
 * Replaces the old HTML scraper with structured RSS data.
 *
 * Feed: https://sf.funcheap.com/feed/
 * Custom fields: funCheap:eventDate, funCheap:startTime, funCheap:endTime,
 *   funCheap:venue, funCheap:venueAddress, funCheap:cost, funCheap:categories
 */

import Parser from "rss-parser";
import {
  upsertEvent,
  upsertVenue,
  classifyEventType,
  classifyAgeGroups,
  geocodeAddress,
  validateAndClean,
  isGenericAddress,
} from "@/lib/pipeline";

// Custom fields from FunCheap's RSS feed
type FunCheapItem = {
  title: string;
  link: string;
  contentSnippet?: string;
  content?: string;
  enclosure?: { url: string };
  categories?: string[];
  "funCheap:eventDate"?: string;
  "funCheap:startTime"?: string;
  "funCheap:endTime"?: string;
  "funCheap:venue"?: string;
  "funCheap:venueAddress"?: string;
  "funCheap:cost"?: string;
  "funCheap:costDetails"?: string;
};

const FAMILY_KEYWORDS = [
  "kids", "family", "families", "children", "all ages",
  "kid-friendly", "toddler", "youth", "storytime", "puppet",
];

function isFamilyEvent(item: FunCheapItem): boolean {
  const text = [
    item.title,
    ...(item.categories || []),
    item.contentSnippet,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return FAMILY_KEYWORDS.some((kw) => text.includes(kw));
}

function parseFunCheapDate(
  eventDate?: string,
  startTime?: string,
  endTime?: string
): { start: string; end: string | null } {
  const now = new Date();

  if (eventDate) {
    try {
      // eventDate format varies: "January 25, 2026" or "2026-01-25"
      const dateBase = new Date(eventDate);
      if (!isNaN(dateBase.getTime())) {
        if (startTime) {
          const timeParts = parseTimeString(startTime);
          if (timeParts) {
            dateBase.setHours(timeParts.hours, timeParts.minutes);
          }
        } else {
          dateBase.setHours(10, 0, 0, 0);
        }

        let endStr: string | null = null;
        if (endTime) {
          const endDate = new Date(dateBase);
          const endParts = parseTimeString(endTime);
          if (endParts) {
            endDate.setHours(endParts.hours, endParts.minutes);
            endStr = endDate.toISOString();
          }
        }

        return { start: dateBase.toISOString(), end: endStr };
      }
    } catch {
      // Fall through
    }
  }

  // Default: tomorrow at 10am
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  return { start: tomorrow.toISOString(), end: null };
}

function parseTimeString(
  timeStr: string
): { hours: number; minutes: number } | null {
  // Handle "2:00 pm", "14:00", "2pm"
  const match12 = timeStr.match(/(\d{1,2}):?(\d{2})?\s*([ap]m)/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2] || "0", 10);
    const period = match12[3].toLowerCase();
    if (period === "pm" && hours !== 12) hours += 12;
    if (period === "am" && hours === 12) hours = 0;
    return { hours, minutes };
  }

  const match24 = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (match24) {
    return {
      hours: parseInt(match24[1], 10),
      minutes: parseInt(match24[2], 10),
    };
  }

  return null;
}

function parseCost(
  costStr?: string
): { pricingType: string; price: number | null } {
  if (!costStr) return { pricingType: "free", price: null };

  const lower = costStr.toLowerCase().trim();
  if (lower === "free" || lower === "free!") {
    return { pricingType: "free", price: null };
  }
  if (lower.includes("donation") || lower.includes("sliding")) {
    return { pricingType: "donation", price: null };
  }

  const priceMatch = lower.match(/\$(\d+(?:\.\d{2})?)/);
  if (priceMatch) {
    return {
      pricingType: "per_person",
      price: parseFloat(priceMatch[1]),
    };
  }

  return { pricingType: "free", price: null };
}

export async function scrapeFuncheapRSS(): Promise<{
  scraped: number;
  saved: number;
}> {
  console.log("Fetching FunCheap RSS feed...");

  const parser = new Parser({
    customFields: {
      item: [
        ["funCheap:eventDate", "funCheap:eventDate"],
        ["funCheap:startTime", "funCheap:startTime"],
        ["funCheap:endTime", "funCheap:endTime"],
        ["funCheap:venue", "funCheap:venue"],
        ["funCheap:venueAddress", "funCheap:venueAddress"],
        ["funCheap:cost", "funCheap:cost"],
        ["funCheap:costDetails", "funCheap:costDetails"],
      ],
    },
  });

  let feed;
  try {
    feed = await parser.parseURL("https://sf.funcheap.com/feed/");
  } catch (error) {
    console.error("Failed to fetch FunCheap RSS:", error);
    return { scraped: 0, saved: 0 };
  }

  const items = (feed.items || []) as unknown as FunCheapItem[];
  console.log(`Found ${items.length} items in RSS feed`);

  // Filter to family-friendly events
  const familyItems = items.filter(isFamilyEvent);
  console.log(`${familyItems.length} family-friendly events`);

  let saved = 0;

  for (const item of familyItems) {
    try {
      const name = (item.title || "").trim();
      if (!name) continue;

      const description = (item.contentSnippet || "").substring(0, 500).trim();
      const { valid } = validateAndClean({ name });
      if (!valid) continue;

      // Parse venue info
      const venueName = (item["funCheap:venue"] as string) || "";
      const venueAddress =
        (item["funCheap:venueAddress"] as string) || "San Francisco, CA";

      // Try to create/link venue if we have a real venue name
      let venueId: string | null = null;
      if (venueName && !isGenericAddress(venueName)) {
        const geo = geocodeAddress(venueAddress);
        const result = await upsertVenue({
          name: venueName,
          address: venueAddress,
          neighborhood: geo?.neighborhood || null,
          latitude: geo?.lat || null,
          longitude: geo?.lng || null,
          venueType: "community",
          sourcePlatform: "funcheap",
        });
        venueId = result.id;
      }

      // Parse dates
      const { start, end } = parseFunCheapDate(
        item["funCheap:eventDate"] as string,
        item["funCheap:startTime"] as string,
        item["funCheap:endTime"] as string
      );

      // Parse cost
      const { pricingType, price } = parseCost(
        item["funCheap:cost"] as string
      );

      // Classify
      const ageGroups = classifyAgeGroups(name, description);
      const eventType = classifyEventType(name, description);

      const result = await upsertEvent({
        name: name.substring(0, 200),
        description: description || null,
        venueId,
        address: venueId ? null : venueAddress,
        eventType,
        startTime: start,
        endTime: end,
        imageUrl: item.enclosure?.url || null,
        sourceUrl: item.link || null,
        sourcePlatform: "funcheap",
        pricingType,
        adultPrice: price,
        outdoor: false,
        ...ageGroups,
      });

      if (result.created) {
        saved++;
        console.log(`  + ${name}`);
      }
    } catch (error) {
      console.error(`  Error processing: ${item.title}`, error);
    }
  }

  console.log(
    `FunCheap RSS: scraped ${familyItems.length}, saved ${saved} new`
  );
  return { scraped: familyItems.length, saved };
}
