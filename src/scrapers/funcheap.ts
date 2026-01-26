import * as cheerio from "cheerio";
import { db, events } from "@/lib/db";
import { nanoid } from "nanoid";

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

// Check robots.txt compliance
async function checkRobotsTxt(): Promise<boolean> {
  try {
    const response = await fetch(`${FUNCHEAP_BASE_URL}/robots.txt`);
    const robotsTxt = await response.text();

    // Basic check - we're accessing public pages, not disallowed paths
    // This is a simplified check - a production scraper would parse this properly
    const disallowedPaths = robotsTxt
      .split("\n")
      .filter((line) => line.toLowerCase().startsWith("disallow:"))
      .map((line) => line.split(":")[1]?.trim());

    // Check if our target path is disallowed
    const isDisallowed = disallowedPaths.some(
      (path) => path && FAMILY_EVENTS_URL.includes(path)
    );

    return !isDisallowed;
  } catch {
    // If we can't fetch robots.txt, proceed cautiously
    console.log("Could not fetch robots.txt, proceeding carefully");
    return true;
  }
}

// Add delay between requests to be respectful
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Parse date strings from Funcheap format
// Format: "Sunday, January 25" (from date headers)
function parseEventDate(dateStr: string): { start: string; end: string | null } {
  const now = new Date();
  const currentYear = now.getFullYear();

  try {
    // Format: "Sunday, January 25" or "Monday, January 27"
    const dateMatch = dateStr.match(/(\w+),\s*(\w+)\s+(\d+)/);

    if (dateMatch) {
      const [, , month, day] = dateMatch;
      // Parse with current year
      const dateBase = new Date(`${month} ${day}, ${currentYear}`);

      // If date is in the past, assume next year
      if (dateBase < now) {
        dateBase.setFullYear(currentYear + 1);
      }

      // Default to 10am start time for events without specific times
      dateBase.setHours(10, 0, 0, 0);

      return { start: dateBase.toISOString(), end: null };
    }

    // Also try the old format: "January 25, 2026 @ 2:00 pm - 4:00 pm"
    const fullDateMatch = dateStr.match(/(\w+ \d+, \d+)/);
    const timeMatch = dateStr.match(/@ (\d+:\d+ [ap]m)(?: - (\d+:\d+ [ap]m))?/i);

    if (fullDateMatch) {
      const dateBase = new Date(fullDateMatch[1]);

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
    // Fall back to now + some offset
  }

  // Default to next day if parsing fails
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return { start: tomorrow.toISOString(), end: null };
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

// Analyze event for kid-friendliness indicators
function analyzeKidFriendliness(text: string): {
  toddlerFriendly: boolean;
  youngKidFriendly: boolean;
  teenFriendly: boolean;
  hasKidsActivities: boolean;
  outdoor: boolean;
  kidFocused: boolean;
} {
  const lowerText = text.toLowerCase();

  // Keywords that suggest toddler-friendliness
  const toddlerKeywords = [
    "toddler",
    "baby",
    "infant",
    "stroller",
    "ages 0",
    "all ages",
    "young children",
  ];

  // Keywords that suggest young kid activities
  const kidActivityKeywords = [
    "craft",
    "art",
    "story",
    "play",
    "hands-on",
    "interactive",
    "workshop",
    "activity",
  ];

  // Keywords that suggest outdoor events
  const outdoorKeywords = [
    "outdoor",
    "park",
    "garden",
    "outside",
    "al fresco",
    "picnic",
    "lawn",
  ];

  // Keywords that indicate kid-focused (primarily for kids, not adults-welcome-with-kids)
  const kidFocusedKeywords = [
    "storytime",
    "story time",
    "puppet",
    "children's museum",
    "kids' concert",
    "children's concert",
    "preschool",
    "ages 2-5",
    "ages 3-5",
    "for kids",
    "for children",
    "kids only",
  ];

  return {
    toddlerFriendly:
      toddlerKeywords.some((kw) => lowerText.includes(kw)) ||
      lowerText.includes("all ages"),
    youngKidFriendly: true, // Default true since we're scraping family events
    teenFriendly: true, // Default true
    hasKidsActivities: kidActivityKeywords.some((kw) => lowerText.includes(kw)),
    outdoor: outdoorKeywords.some((kw) => lowerText.includes(kw)),
    kidFocused: kidFocusedKeywords.some((kw) => lowerText.includes(kw)),
  };
}

// Scrape the main events listing page
async function scrapeEventsList(): Promise<ScrapedEvent[]> {
  const events: ScrapedEvent[] = [];

  try {
    const response = await fetch(FAMILY_EVENTS_URL, {
      headers: {
        "User-Agent":
          "SF All-Ages Social Club Bot (family events aggregator, https://sfallages.com)",
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch Funcheap: ${response.status}`);
      return events;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Funcheap uses div.tanbox for event cards with span.title containing the link
    const eventElements = $("div.tanbox").slice(0, 20); // Limit to 20 events

    for (const el of eventElements.toArray()) {
      try {
        const $el = $(el);

        const name = $el.find("span.title a").first().text().trim();
        const link = $el.find("span.title a").first().attr("href") || "";

        const description =
          $el.find(".storycontent").first().text().trim() || name;

        // Find the preceding date header by walking up the DOM
        let dateText = "";
        let prev = $el.prev();
        while (prev.length && !prev.hasClass("archive_date_title")) {
          prev = prev.prev();
        }
        if (prev.hasClass("archive_date_title")) {
          dateText = prev.find("h3").text().trim();
        }

        if (name && link) {
          const { start, end } = parseEventDate(dateText);
          const analysis = analyzeKidFriendliness(`${name} ${description}`);

          events.push({
            name: name.substring(0, 200), // Limit name length
            description: description.substring(0, 500), // Limit description
            address: "San Francisco, CA",
            startTime: start,
            endTime: end,
            sourceUrl: link.startsWith("http") ? link : `${FUNCHEAP_BASE_URL}${link}`,
            outdoor: analysis.outdoor,
          });
        }

        // Rate limiting between parsing
        await delay(100);
      } catch (parseError) {
        console.error("Error parsing event element:", parseError);
        continue;
      }
    }
  } catch (error) {
    console.error("Error scraping Funcheap:", error);
  }

  return events;
}

// Save scraped events to database
async function saveEvents(scrapedEvents: ScrapedEvent[]): Promise<number> {
  let savedCount = 0;
  const now = new Date().toISOString();

  for (const event of scrapedEvents) {
    try {
      // Check if event already exists by source URL
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
        eventType: "community", // Default type
        startTime: event.startTime,
        endTime: event.endTime,
        isRecurring: false,
        recurrenceRule: null,
        hasKidsActivities: analysis.hasKidsActivities,
        outdoor: event.outdoor,
        toddlerFriendly: analysis.toddlerFriendly,
        youngKidFriendly: analysis.youngKidFriendly,
        teenFriendly: analysis.teenFriendly,
        kidFocused: analysis.kidFocused,
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

// Main scraping function
export async function scrapeFuncheap(): Promise<{ scraped: number; saved: number }> {
  console.log("Starting Funcheap scraper...");

  // Check robots.txt
  const allowed = await checkRobotsTxt();
  if (!allowed) {
    console.log("Scraping not allowed by robots.txt");
    return { scraped: 0, saved: 0 };
  }

  // Respectful delay before starting
  await delay(1000);

  // Scrape events
  const scrapedEvents = await scrapeEventsList();
  console.log(`Scraped ${scrapedEvents.length} events`);

  // Save to database
  const savedCount = await saveEvents(scrapedEvents);
  console.log(`Saved ${savedCount} new events`);

  return { scraped: scrapedEvents.length, saved: savedCount };
}

// Export for CLI usage
if (require.main === module) {
  scrapeFuncheap()
    .then((result) => {
      console.log("Scraping complete:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Scraping failed:", error);
      process.exit(1);
    });
}
