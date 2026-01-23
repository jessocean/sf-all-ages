import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as cheerio from "cheerio";
import * as schema from "../src/lib/schema";
import { events } from "../src/lib/schema";
import { nanoid } from "nanoid";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
});

const db = drizzle(client, { schema });

const FUNCHEAP_BASE_URL = "https://sf.funcheap.com";
const FAMILY_EVENTS_URL = `${FUNCHEAP_BASE_URL}/category/event/event-types/kids-families/`;

interface ScrapedEvent {
  name: string;
  description: string;
  address: string;
  startTime: string;
  endTime: string | null;
  sourceUrl: string;
  outdoor: boolean;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseEventDate(dateStr: string): { start: string; end: string | null } {
  const now = new Date();

  try {
    // Try common date formats
    const dateMatch = dateStr.match(/(\w+ \d+, \d+)/);
    const timeMatch = dateStr.match(/@ (\d+:\d+ [ap]m)(?: - (\d+:\d+ [ap]m))?/i);

    if (dateMatch) {
      const dateBase = new Date(dateMatch[1]);

      if (timeMatch && timeMatch[1]) {
        const startTime = parseTime(timeMatch[1]);
        dateBase.setHours(startTime.hours, startTime.minutes);

        const endDate = new Date(dateBase);
        if (timeMatch[2]) {
          const endTime = parseTime(timeMatch[2]);
          endDate.setHours(endTime.hours, endTime.minutes);
        }

        return {
          start: dateBase.toISOString(),
          end: timeMatch[2] ? endDate.toISOString() : null,
        };
      }

      return { start: dateBase.toISOString(), end: null };
    }
  } catch {
    // Fall back
  }

  // Default to upcoming weekend
  const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
  const saturday = new Date(now);
  saturday.setDate(now.getDate() + daysUntilSaturday);
  saturday.setHours(12, 0, 0, 0);
  return { start: saturday.toISOString(), end: null };
}

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const match = timeStr.match(/(\d+):(\d+) ([ap]m)/i);
  if (!match) return { hours: 12, minutes: 0 };

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toLowerCase();

  if (period === "pm" && hours !== 12) hours += 12;
  if (period === "am" && hours === 12) hours = 0;

  return { hours, minutes };
}

function analyzeKidFriendliness(text: string): {
  toddlerFriendly: boolean;
  youngKidFriendly: boolean;
  teenFriendly: boolean;
  hasKidsActivities: boolean;
  outdoor: boolean;
} {
  const lowerText = text.toLowerCase();

  const toddlerKeywords = ["toddler", "baby", "infant", "stroller", "ages 0", "all ages"];
  const kidActivityKeywords = ["craft", "art", "story", "play", "hands-on", "interactive", "workshop"];
  const outdoorKeywords = ["outdoor", "park", "garden", "outside", "al fresco", "picnic", "lawn"];

  return {
    toddlerFriendly: toddlerKeywords.some((kw) => lowerText.includes(kw)),
    youngKidFriendly: true,
    teenFriendly: true,
    hasKidsActivities: kidActivityKeywords.some((kw) => lowerText.includes(kw)),
    outdoor: outdoorKeywords.some((kw) => lowerText.includes(kw)),
  };
}

async function scrapeEventsList(): Promise<ScrapedEvent[]> {
  const scrapedEvents: ScrapedEvent[] = [];

  console.log(`Fetching ${FAMILY_EVENTS_URL}...`);

  try {
    const response = await fetch(FAMILY_EVENTS_URL, {
      headers: {
        "User-Agent": "SF All-Ages Social Club Bot (family events aggregator)",
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch Funcheap: ${response.status}`);
      return scrapedEvents;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Try multiple selectors that Funcheap might use
    const eventSelectors = [
      "article.type-tribe_events",
      ".tribe-events-calendar-list__event",
      ".event-card",
      "article.event",
    ];

    let eventElements: ReturnType<typeof $> | null = null;
    for (const selector of eventSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        eventElements = elements;
        console.log(`Found ${elements.length} events using selector: ${selector}`);
        break;
      }
    }

    if (!eventElements || eventElements.length === 0) {
      console.log("No events found with standard selectors, trying alternate approach...");

      // Try to find any links that look like event links
      $("a").each((_, el) => {
        const href = $(el).attr("href") || "";
        const text = $(el).text().trim();

        if (
          href.includes("/event/") &&
          text.length > 10 &&
          text.length < 200 &&
          !text.includes("More")
        ) {
          const { start, end } = parseEventDate("");
          scrapedEvents.push({
            name: text,
            description: text,
            address: "San Francisco, CA",
            startTime: start,
            endTime: end,
            sourceUrl: href.startsWith("http") ? href : `${FUNCHEAP_BASE_URL}${href}`,
            outdoor: false,
          });
        }
      });
    } else {
      for (const el of eventElements.toArray().slice(0, 20)) {
        const $el = $(el);

        const name =
          $el.find("h2 a, h3 a, .tribe-events-calendar-list__event-title a").first().text().trim() ||
          $el.find("h2, h3, .event-title").first().text().trim();

        const link =
          $el.find("h2 a, h3 a, .tribe-events-calendar-list__event-title a").first().attr("href") || "";

        const description =
          $el.find(".tribe-events-calendar-list__event-description, .event-excerpt, p").first().text().trim() ||
          name;

        const dateText =
          $el.find(".tribe-events-calendar-list__event-datetime, .event-date, time").first().text().trim() || "";

        const location =
          $el.find(".tribe-events-calendar-list__event-venue, .event-location, .venue").first().text().trim() ||
          "San Francisco, CA";

        if (name && link) {
          const { start, end } = parseEventDate(dateText);
          const analysis = analyzeKidFriendliness(`${name} ${description}`);

          scrapedEvents.push({
            name: name.substring(0, 200),
            description: description.substring(0, 500),
            address: location.substring(0, 200),
            startTime: start,
            endTime: end,
            sourceUrl: link.startsWith("http") ? link : `${FUNCHEAP_BASE_URL}${link}`,
            outdoor: analysis.outdoor,
          });
        }
      }
    }
  } catch (error) {
    console.error("Error scraping Funcheap:", error);
  }

  return scrapedEvents;
}

async function saveEvents(scrapedEvents: ScrapedEvent[]): Promise<number> {
  let savedCount = 0;
  const now = new Date().toISOString();

  for (const event of scrapedEvents) {
    try {
      // Check for duplicates
      const existing = await db.query.events.findFirst({
        where: (events, { eq }) => eq(events.sourceUrl, event.sourceUrl),
      });

      if (existing) {
        console.log(`Skipping duplicate: ${event.name}`);
        continue;
      }

      const analysis = analyzeKidFriendliness(`${event.name} ${event.description}`);

      await db.insert(events).values({
        id: nanoid(),
        name: event.name,
        description: event.description,
        venueId: null,
        address: event.address,
        eventType: "community",
        startTime: event.startTime,
        endTime: event.endTime,
        isRecurring: false,
        recurrenceRule: null,
        hasKidsActivities: analysis.hasKidsActivities,
        outdoor: event.outdoor || analysis.outdoor,
        toddlerFriendly: analysis.toddlerFriendly,
        youngKidFriendly: analysis.youngKidFriendly,
        teenFriendly: analysis.teenFriendly,
        sourceUrl: event.sourceUrl,
        sourcePlatform: "funcheap",
        lastUpdatedAt: now,
        createdAt: now,
      });

      savedCount++;
      console.log(`Saved: ${event.name}`);
    } catch (error) {
      console.error(`Error saving event ${event.name}:`, error);
    }
  }

  return savedCount;
}

async function main() {
  console.log("Starting event scraper...");

  await delay(1000); // Initial delay

  const scrapedEvents = await scrapeEventsList();
  console.log(`Scraped ${scrapedEvents.length} events`);

  if (scrapedEvents.length > 0) {
    const savedCount = await saveEvents(scrapedEvents);
    console.log(`Saved ${savedCount} new events to database`);
  }

  console.log("Scraping complete!");
}

main().catch(console.error);
