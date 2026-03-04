/**
 * SFPL (San Francisco Public Library) events scraper.
 * Fetches storytimes, craft programs, teen events from sfpl.org.
 *
 * SFPL uses Communico for their events calendar. We try the JSON API first,
 * then fall back to HTML scraping if needed.
 */

import {
  upsertEvent,
  upsertVenue,
  classifyAgeGroups,
  geocodeAddress,
  validateAndClean,
} from "@/lib/pipeline";

// SFPL branches with known coordinates
const SFPL_BRANCHES: Record<string, { lat: number; lng: number; address: string }> = {
  "Main Library": { lat: 37.7785, lng: -122.4156, address: "100 Larkin St, San Francisco, CA" },
  "Mission Branch": { lat: 37.7575, lng: -122.4180, address: "300 Bartlett St, San Francisco, CA" },
  "Noe Valley Branch": { lat: 37.7508, lng: -122.4313, address: "451 Jersey St, San Francisco, CA" },
  "Glen Park Branch": { lat: 37.7342, lng: -122.4332, address: "2825 Diamond St, San Francisco, CA" },
  "Bernal Heights Branch": { lat: 37.7393, lng: -122.4153, address: "500 Cortland Ave, San Francisco, CA" },
  "Potrero Branch": { lat: 37.7560, lng: -122.4005, address: "1616 20th St, San Francisco, CA" },
  "Sunset Branch": { lat: 37.7535, lng: -122.4956, address: "1305 18th Ave, San Francisco, CA" },
  "Richmond Branch": { lat: 37.7802, lng: -122.4643, address: "351 9th Ave, San Francisco, CA" },
  "Marina Branch": { lat: 37.8004, lng: -122.4362, address: "1890 Chestnut St, San Francisco, CA" },
  "North Beach Branch": { lat: 37.8060, lng: -122.4105, address: "850 Columbus Ave, San Francisco, CA" },
  "Chinatown Branch": { lat: 37.7947, lng: -122.4071, address: "1135 Powell St, San Francisco, CA" },
  "Excelsior Branch": { lat: 37.7250, lng: -122.4246, address: "4400 Mission St, San Francisco, CA" },
  "Bayview Branch": { lat: 37.7302, lng: -122.3882, address: "5075 3rd St, San Francisco, CA" },
};

interface SFPLEvent {
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate?: string;
  url: string;
  category?: string;
}

const FAMILY_CATEGORIES = [
  "children", "kids", "family", "storytime", "story time", "teen",
  "tween", "craft", "lego", "puppet", "toddler", "baby",
];

function isFamilyEvent(event: SFPLEvent): boolean {
  const text = `${event.title} ${event.description} ${event.category || ""}`.toLowerCase();
  return FAMILY_CATEGORIES.some((cat) => text.includes(cat));
}

async function fetchSFPLEvents(): Promise<SFPLEvent[]> {
  // Try Communico JSON endpoint first
  try {
    const response = await fetch(
      "https://sfpl.org/events/calendar?format=json",
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "SF All-Ages Social Club (family events aggregator)",
        },
      }
    );

    if (response.ok) {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        if (Array.isArray(data)) {
          return data.map((item: Record<string, string>) => ({
            title: item.title || "",
            description: item.description || item.body || "",
            location: item.location || item.branch || "",
            startDate: item.start_date || item.date || "",
            endDate: item.end_date || undefined,
            url: item.url || item.link || "",
            category: item.category || item.type || "",
          }));
        }
      }
    }
  } catch {
    // JSON endpoint not available, try HTML
  }

  // Fallback: scrape the HTML calendar page
  try {
    const response = await fetch("https://sfpl.org/events/calendar", {
      headers: {
        "User-Agent": "SF All-Ages Social Club (family events aggregator)",
      },
    });

    if (!response.ok) {
      console.log(`  SFPL returned ${response.status}`);
      return [];
    }

    const html = await response.text();
    const events: SFPLEvent[] = [];

    // Look for JSON-LD structured data
    const jsonLdMatch = html.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
    );

    if (jsonLdMatch) {
      for (const match of jsonLdMatch) {
        try {
          const jsonStr = match
            .replace(/<script type="application\/ld\+json">/, "")
            .replace(/<\/script>/, "");
          const data = JSON.parse(jsonStr);

          if (data["@type"] === "Event") {
            events.push({
              title: data.name || "",
              description: data.description || "",
              location:
                data.location?.name || data.location?.address || "",
              startDate: data.startDate || "",
              endDate: data.endDate || undefined,
              url: data.url || "",
              category: "",
            });
          }
        } catch {
          continue;
        }
      }
    }

    return events;
  } catch (error) {
    console.error("  Failed to fetch SFPL calendar:", error);
    return [];
  }
}

export async function scrapeSFPL(): Promise<{
  fetched: number;
  saved: number;
}> {
  console.log("Fetching SFPL events...");

  const allEvents = await fetchSFPLEvents();
  console.log(`Found ${allEvents.length} SFPL events`);

  const familyEvents = allEvents.filter(isFamilyEvent);
  console.log(`${familyEvents.length} family-friendly events`);

  let saved = 0;

  for (const event of familyEvents) {
    try {
      if (!event.title || !event.startDate) continue;

      const { valid } = validateAndClean({ name: event.title });
      if (!valid) continue;

      // Try to match to known SFPL branch
      let venueId: string | null = null;
      const location = event.location;

      for (const [branchName, branchInfo] of Object.entries(SFPL_BRANCHES)) {
        if (location.toLowerCase().includes(branchName.toLowerCase().replace(" branch", ""))) {
          const result = await upsertVenue({
            name: branchName,
            address: branchInfo.address,
            latitude: branchInfo.lat,
            longitude: branchInfo.lng,
            venueType: "library",
            pricingType: "free",
            strollerAccessible: true,
            toddlerFriendly: true,
            youngKidFriendly: true,
            teenFriendly: true,
            description: `San Francisco Public Library - ${branchName}. Free programs and events for all ages.`,
            sourcePlatform: "sfpl",
          });
          venueId = result.id;
          break;
        }
      }

      const ageGroups = classifyAgeGroups(event.title, event.description);

      // Parse dates
      let startTime: string;
      try {
        const d = new Date(event.startDate);
        startTime = isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
      } catch {
        startTime = new Date().toISOString();
      }

      let endTime: string | null = null;
      if (event.endDate) {
        try {
          const d = new Date(event.endDate);
          endTime = isNaN(d.getTime()) ? null : d.toISOString();
        } catch {
          endTime = null;
        }
      }

      const result = await upsertEvent({
        name: event.title.substring(0, 200),
        description: event.description.substring(0, 500) || null,
        venueId,
        address: venueId ? null : (location || "San Francisco, CA"),
        eventType: "community",
        startTime,
        endTime,
        sourceUrl: event.url || null,
        sourcePlatform: "sfpl",
        pricingType: "free",
        ...ageGroups,
      });

      if (result.created) {
        saved++;
        console.log(`  + ${event.title}`);
      }
    } catch (error) {
      console.error(`  Error: ${event.title}`, error);
    }
  }

  console.log(`SFPL: fetched ${familyEvents.length}, saved ${saved} new`);
  return { fetched: familyEvents.length, saved };
}
