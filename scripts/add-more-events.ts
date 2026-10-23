import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "../src/lib/schema";
import { events } from "../src/lib/schema";
import { nanoid } from "nanoid";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client, { schema });

const now = new Date().toISOString();

// Helper functions for recurring event start times
function getNextDayOccurrence(dayOfWeek: number, hour: number, minute: number): string {
  const date = new Date();
  const currentDay = date.getDay();
  const daysUntil = (dayOfWeek - currentDay + 7) % 7 || 7;
  date.setDate(date.getDate() + daysUntil);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function getEndTime(startTime: string, durationHours: number): string {
  const date = new Date(startTime);
  date.setHours(date.getHours() + durationHours);
  return date.toISOString();
}

// Get Nth weekday of current/next month
function getNthWeekday(n: number, dayOfWeek: number, hour: number, minute: number): string {
  const date = new Date();
  date.setDate(1);

  // Find first occurrence of the day
  while (date.getDay() !== dayOfWeek) {
    date.setDate(date.getDate() + 1);
  }

  // Add weeks to get to Nth occurrence
  date.setDate(date.getDate() + (n - 1) * 7);

  // If it's past, get next month
  if (date < new Date()) {
    date.setMonth(date.getMonth() + 1);
    date.setDate(1);
    while (date.getDay() !== dayOfWeek) {
      date.setDate(date.getDate() + 1);
    }
    date.setDate(date.getDate() + (n - 1) * 7);
  }

  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

// Comprehensive SF family events
const newEvents = [
  // === LIBRARY STORYTIMES ===
  {
    name: "Toddler Storytime - Main Library",
    description: "Songs, stories, and fingerplays for toddlers and caregivers. Ages 18 months to 3 years.",
    address: "100 Larkin St, San Francisco, CA 94102",
    eventType: "community",
    startTime: getNextDayOccurrence(3, 10, 30), // Wednesday
    endTime: getEndTime(getNextDayOccurrence(3, 10, 30), 0.5),
    isRecurring: true,
    recurrenceRule: "FREQ=WEEKLY;BYDAY=WE",
    hasKidsActivities: true,
    outdoor: false,
    toddlerFriendly: true,
    youngKidFriendly: false,
    teenFriendly: false,
    sourceUrl: "https://sfpl.org/events",
    sourcePlatform: "manual",
    pricingType: "free",
  },
  {
    name: "Preschool Storytime - Main Library",
    description: "Stories, songs, and activities for preschoolers ages 3-5 years.",
    address: "100 Larkin St, San Francisco, CA 94102",
    eventType: "community",
    startTime: getNextDayOccurrence(4, 10, 30), // Thursday
    endTime: getEndTime(getNextDayOccurrence(4, 10, 30), 0.5),
    isRecurring: true,
    recurrenceRule: "FREQ=WEEKLY;BYDAY=TH",
    hasKidsActivities: true,
    outdoor: false,
    toddlerFriendly: false,
    youngKidFriendly: true,
    teenFriendly: false,
    sourceUrl: "https://sfpl.org/events",
    sourcePlatform: "manual",
    pricingType: "free",
  },
  {
    name: "Baby Rhyme Time - Noe Valley Library",
    description: "Lapsit program with songs, rhymes, and bounces for babies 0-18 months and caregivers.",
    address: "451 Jersey St, San Francisco, CA 94114",
    eventType: "community",
    startTime: getNextDayOccurrence(2, 10, 15), // Tuesday
    endTime: getEndTime(getNextDayOccurrence(2, 10, 15), 0.5),
    isRecurring: true,
    recurrenceRule: "FREQ=WEEKLY;BYDAY=TU",
    hasKidsActivities: true,
    outdoor: false,
    toddlerFriendly: true,
    youngKidFriendly: false,
    teenFriendly: false,
    sourceUrl: "https://sfpl.org/locations/noe-valley-sally-brunn-branch",
    sourcePlatform: "manual",
    pricingType: "free",
  },
  {
    name: "Bilingual Storytime (Spanish/English) - Mission Library",
    description: "Stories and songs in Spanish and English. All ages welcome.",
    address: "300 Bartlett St, San Francisco, CA 94110",
    eventType: "community",
    startTime: getNextDayOccurrence(6, 11, 0), // Saturday
    endTime: getEndTime(getNextDayOccurrence(6, 11, 0), 0.5),
    isRecurring: true,
    recurrenceRule: "FREQ=WEEKLY;BYDAY=SA",
    hasKidsActivities: true,
    outdoor: false,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: false,
    sourceUrl: "https://sfpl.org/locations/mission-branch",
    sourcePlatform: "manual",
    pricingType: "free",
  },
  {
    name: "STEM Saturday - Main Library",
    description: "Hands-on science and tech activities for kids. Different themes each week.",
    address: "100 Larkin St, San Francisco, CA 94102",
    eventType: "community",
    startTime: getNextDayOccurrence(6, 14, 0), // Saturday 2pm
    endTime: getEndTime(getNextDayOccurrence(6, 14, 0), 1.5),
    isRecurring: true,
    recurrenceRule: "FREQ=WEEKLY;BYDAY=SA",
    hasKidsActivities: true,
    outdoor: false,
    toddlerFriendly: false,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://sfpl.org/events",
    sourcePlatform: "manual",
    pricingType: "free",
  },

  // === FARMERS MARKETS ===
  {
    name: "Stonestown Farmers Market",
    description: "Year-round farmers market with produce, prepared foods, and live music. Spacious and kid-friendly.",
    address: "501 Buckingham Way, San Francisco, CA 94132",
    eventType: "market",
    startTime: getNextDayOccurrence(0, 9, 0), // Sunday 9am
    endTime: getEndTime(getNextDayOccurrence(0, 9, 0), 4),
    isRecurring: true,
    recurrenceRule: "FREQ=WEEKLY;BYDAY=SU",
    hasKidsActivities: false,
    outdoor: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://www.pcfma.org/market/stonestown",
    sourcePlatform: "manual",
    pricingType: "free",
  },
  {
    name: "Heart of the City Farmers Market",
    description: "Affordable produce at UN Plaza. One of SF's most diverse markets.",
    address: "1182 Market St, San Francisco, CA 94102",
    eventType: "market",
    startTime: getNextDayOccurrence(3, 7, 0), // Wednesday 7am
    endTime: getEndTime(getNextDayOccurrence(3, 7, 0), 5.5),
    isRecurring: true,
    recurrenceRule: "FREQ=WEEKLY;BYDAY=WE,SU",
    hasKidsActivities: false,
    outdoor: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://heartofthecity-farmersmar.squarespace.com",
    sourcePlatform: "manual",
    pricingType: "free",
  },
  {
    name: "Noe Valley Farmers Market",
    description: "Neighborhood market with local vendors, baked goods, and community vibe.",
    address: "3861 24th St, San Francisco, CA 94114",
    eventType: "market",
    startTime: getNextDayOccurrence(6, 8, 0), // Saturday 8am
    endTime: getEndTime(getNextDayOccurrence(6, 8, 0), 5),
    isRecurring: true,
    recurrenceRule: "FREQ=WEEKLY;BYDAY=SA",
    hasKidsActivities: false,
    outdoor: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://www.noevalleyfarmersmarket.com",
    sourcePlatform: "manual",
    pricingType: "free",
  },
  {
    name: "Divisadero Farmers Market",
    description: "Lively Sunday market on Divis with great food trucks and produce.",
    address: "Grove St & Divisadero St, San Francisco, CA 94117",
    eventType: "market",
    startTime: getNextDayOccurrence(0, 10, 0), // Sunday 10am
    endTime: getEndTime(getNextDayOccurrence(0, 10, 0), 4),
    isRecurring: true,
    recurrenceRule: "FREQ=WEEKLY;BYDAY=SU",
    hasKidsActivities: false,
    outdoor: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://www.pcfma.org/market/divisadero",
    sourcePlatform: "manual",
    pricingType: "free",
  },

  // === MUSEUM PROGRAMS ===
  {
    name: "Little Learners - California Academy of Sciences",
    description: "Early childhood program with science activities for ages 3-5. Thursdays.",
    address: "55 Music Concourse Dr, San Francisco, CA 94118",
    eventType: "community",
    startTime: getNextDayOccurrence(4, 10, 30), // Thursday
    endTime: getEndTime(getNextDayOccurrence(4, 10, 30), 1),
    isRecurring: true,
    recurrenceRule: "FREQ=WEEKLY;BYDAY=TH",
    hasKidsActivities: true,
    outdoor: false,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: false,
    sourceUrl: "https://www.calacademy.org/exhibits/education",
    sourcePlatform: "manual",
    pricingType: "per_person",
    adultPrice: 45,
    childPrice: 35,
    pricingNotes: "Included with museum admission",
  },
  {
    name: "Family Art Making - de Young Museum",
    description: "Drop-in art activities inspired by current exhibitions. All ages welcome.",
    address: "50 Hagiwara Tea Garden Dr, San Francisco, CA 94118",
    eventType: "community",
    startTime: getNextDayOccurrence(6, 12, 0), // Saturday noon
    endTime: getEndTime(getNextDayOccurrence(6, 12, 0), 3),
    isRecurring: true,
    recurrenceRule: "FREQ=WEEKLY;BYDAY=SA,SU",
    hasKidsActivities: true,
    outdoor: false,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://www.famsf.org/calendar",
    sourcePlatform: "manual",
    pricingType: "free",
    pricingNotes: "Free with museum admission (under 18 free)",
  },
  {
    name: "Animation Workshop - Walt Disney Family Museum",
    description: "Learn animation techniques. Best for ages 6+. Included with admission.",
    address: "104 Montgomery St, San Francisco, CA 94129",
    eventType: "community",
    startTime: getNextDayOccurrence(6, 11, 0), // Saturday
    endTime: getEndTime(getNextDayOccurrence(6, 11, 0), 1),
    isRecurring: true,
    recurrenceRule: "FREQ=WEEKLY;BYDAY=SA,SU",
    hasKidsActivities: true,
    outdoor: false,
    toddlerFriendly: false,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://www.waltdisney.org/education",
    sourcePlatform: "manual",
    pricingType: "per_person",
    adultPrice: 30,
    childPrice: 0,
    pricingNotes: "Included with admission. Under 6 free.",
  },
  {
    name: "Exploratorium After Dark (Teen Night)",
    description: "Monthly adult-free evening for teens 13-17. Music, experiments, exploration.",
    address: "Pier 15, San Francisco, CA 94111",
    eventType: "community",
    startTime: getNthWeekday(3, 4, 18, 0), // 3rd Thursday 6pm
    endTime: getEndTime(getNthWeekday(3, 4, 18, 0), 4),
    isRecurring: true,
    recurrenceRule: "FREQ=MONTHLY;BYDAY=3TH",
    hasKidsActivities: true,
    outdoor: false,
    toddlerFriendly: false,
    youngKidFriendly: false,
    teenFriendly: true,
    sourceUrl: "https://www.exploratorium.edu/visit/calendar/after-dark",
    sourcePlatform: "manual",
    pricingType: "per_person",
    teenPrice: 15,
    pricingNotes: "Teens 13-17 only",
  },

  // === OUTDOOR & NATURE ===
  {
    name: "Junior Rangers - Presidio",
    description: "Monthly nature programs for kids. Hiking, wildlife, hands-on activities.",
    address: "103 Montgomery St, San Francisco, CA 94129",
    eventType: "community",
    startTime: getNthWeekday(2, 6, 10, 0), // 2nd Saturday 10am
    endTime: getEndTime(getNthWeekday(2, 6, 10, 0), 2),
    isRecurring: true,
    recurrenceRule: "FREQ=MONTHLY;BYDAY=2SA",
    hasKidsActivities: true,
    outdoor: true,
    toddlerFriendly: false,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://www.presidio.gov/explore/for-families",
    sourcePlatform: "manual",
    pricingType: "free",
  },
  {
    name: "Crissy Field Family Programs",
    description: "Beach cleanups, nature walks, and environmental education for families.",
    address: "603 Mason St, San Francisco, CA 94129",
    eventType: "community",
    startTime: getNextDayOccurrence(6, 10, 0), // Saturday 10am
    endTime: getEndTime(getNextDayOccurrence(6, 10, 0), 2),
    isRecurring: true,
    recurrenceRule: "FREQ=WEEKLY;BYDAY=SA",
    hasKidsActivities: true,
    outdoor: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://www.parksconservancy.org/programs/crissy-field-center",
    sourcePlatform: "manual",
    pricingType: "free",
  },
  {
    name: "Golden Gate Park Carousel",
    description: "Ride the historic 1914 Herschell-Spillman carousel. Open daily weather permitting.",
    address: "320 Bowling Green Dr, San Francisco, CA 94118",
    eventType: "community",
    startTime: getNextDayOccurrence(6, 10, 0), // Saturday
    endTime: getEndTime(getNextDayOccurrence(6, 10, 0), 6),
    isRecurring: true,
    recurrenceRule: "FREQ=DAILY",
    hasKidsActivities: true,
    outdoor: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://sfrecpark.org/destination/golden-gate-park-carousel/",
    sourcePlatform: "manual",
    pricingType: "per_person",
    childPrice: 4,
    adultPrice: 4,
    pricingNotes: "$4 per ride",
  },
  {
    name: "Stow Lake Boating",
    description: "Rent pedal boats and rowboats on Stow Lake. Feed the ducks and turtles.",
    address: "50 Stow Lake Dr, San Francisco, CA 94118",
    eventType: "community",
    startTime: getNextDayOccurrence(6, 10, 0), // Saturday
    endTime: getEndTime(getNextDayOccurrence(6, 10, 0), 7),
    isRecurring: true,
    recurrenceRule: "FREQ=DAILY",
    hasKidsActivities: true,
    outdoor: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://stowlakeboathouse.com",
    sourcePlatform: "manual",
    pricingType: "flat_rate",
    adultPrice: 35,
    pricingNotes: "$35-45 per hour boat rental",
  },

  // === MUSIC & PERFORMANCE ===
  {
    name: "SF Symphony Family Concerts",
    description: "Kid-friendly 45-minute concerts introducing classical music. Pre-concert activities.",
    address: "201 Van Ness Ave, San Francisco, CA 94102",
    eventType: "music",
    startTime: getNthWeekday(1, 6, 11, 0), // 1st Saturday 11am
    endTime: getEndTime(getNthWeekday(1, 6, 11, 0), 1.5),
    isRecurring: true,
    recurrenceRule: "FREQ=MONTHLY;BYDAY=1SA",
    hasKidsActivities: true,
    outdoor: false,
    toddlerFriendly: false,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://www.sfsymphony.org/Education-Community/Family",
    sourcePlatform: "manual",
    pricingType: "per_person",
    adultPrice: 25,
    childPrice: 15,
  },
  {
    name: "Stern Grove Festival Free Concerts",
    description: "Free summer concert series in eucalyptus grove. Bring blankets and picnics. All ages.",
    address: "19th Ave & Sloat Blvd, San Francisco, CA 94132",
    eventType: "music",
    startTime: getNextDayOccurrence(0, 14, 0), // Sunday 2pm
    endTime: getEndTime(getNextDayOccurrence(0, 14, 0), 2),
    isRecurring: true,
    recurrenceRule: "FREQ=WEEKLY;BYDAY=SU;BYMONTH=6,7,8",
    hasKidsActivities: false,
    outdoor: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://www.sterngrove.org",
    sourcePlatform: "manual",
    pricingType: "free",
    pricingNotes: "June-August only",
  },
  {
    name: "Randall Museum Animal Discovery",
    description: "Meet live animals and learn about Bay Area wildlife. Drop-in program.",
    address: "199 Museum Way, San Francisco, CA 94114",
    eventType: "community",
    startTime: getNextDayOccurrence(6, 11, 0), // Saturday 11am
    endTime: getEndTime(getNextDayOccurrence(6, 11, 0), 1),
    isRecurring: true,
    recurrenceRule: "FREQ=WEEKLY;BYDAY=SA,SU",
    hasKidsActivities: true,
    outdoor: false,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://www.randallmuseum.org/events/",
    sourcePlatform: "manual",
    pricingType: "free",
  },

  // === REC CENTER PROGRAMS ===
  {
    name: "Open Gym - Moscone Rec Center",
    description: "Drop-in gymnasium time for kids. Basketball, games, activities.",
    address: "1800 Chestnut St, San Francisco, CA 94123",
    eventType: "sports",
    startTime: getNextDayOccurrence(6, 9, 0), // Saturday 9am
    endTime: getEndTime(getNextDayOccurrence(6, 9, 0), 3),
    isRecurring: true,
    recurrenceRule: "FREQ=WEEKLY;BYDAY=SA",
    hasKidsActivities: true,
    outdoor: false,
    toddlerFriendly: false,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://sfrecpark.org/destination/moscone-recreation-center/",
    sourcePlatform: "manual",
    pricingType: "free",
  },
  {
    name: "Teen Gaming Night - Mission Rec Center",
    description: "Video games, board games, and snacks for teens. Ages 13-17.",
    address: "2450 Harrison St, San Francisco, CA 94110",
    eventType: "community",
    startTime: getNextDayOccurrence(5, 18, 0), // Friday 6pm
    endTime: getEndTime(getNextDayOccurrence(5, 18, 0), 3),
    isRecurring: true,
    recurrenceRule: "FREQ=WEEKLY;BYDAY=FR",
    hasKidsActivities: true,
    outdoor: false,
    toddlerFriendly: false,
    youngKidFriendly: false,
    teenFriendly: true,
    sourceUrl: "https://sfrecpark.org",
    sourcePlatform: "manual",
    pricingType: "free",
  },

  // === STREET FAIRS & FESTIVALS ===
  {
    name: "Off the Grid - Fort Mason",
    description: "Food truck gathering with picnic areas, lawn games. Family-friendly Friday evenings.",
    address: "2 Marina Blvd, San Francisco, CA 94123",
    eventType: "festival",
    startTime: getNextDayOccurrence(5, 17, 0), // Friday 5pm
    endTime: getEndTime(getNextDayOccurrence(5, 17, 0), 5),
    isRecurring: true,
    recurrenceRule: "FREQ=WEEKLY;BYDAY=FR;BYMONTH=3,4,5,6,7,8,9,10",
    hasKidsActivities: false,
    outdoor: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://offthegrid.com/markets/fort-mason-center",
    sourcePlatform: "manual",
    pricingType: "free",
    pricingNotes: "Free entry, pay for food. Seasonal (Mar-Oct)",
  },
  {
    name: "Sunday Streets - Various",
    description: "Car-free streets for biking, walking, activities. Rotates neighborhoods. Check website for location.",
    address: "Various neighborhoods, San Francisco, CA",
    eventType: "festival",
    startTime: getNextDayOccurrence(0, 11, 0), // Sunday 11am
    endTime: getEndTime(getNextDayOccurrence(0, 11, 0), 5),
    isRecurring: true,
    recurrenceRule: "FREQ=MONTHLY",
    hasKidsActivities: true,
    outdoor: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://sundaystreetssf.com",
    sourcePlatform: "manual",
    pricingType: "free",
    pricingNotes: "Spring through fall only",
  },
  {
    name: "Presidio Picnic",
    description: "Sunday food trucks, lawn games, live music on Presidio Main Post lawn.",
    address: "103 Montgomery St, San Francisco, CA 94129",
    eventType: "festival",
    startTime: getNextDayOccurrence(0, 11, 0), // Sunday 11am
    endTime: getEndTime(getNextDayOccurrence(0, 11, 0), 5),
    isRecurring: true,
    recurrenceRule: "FREQ=WEEKLY;BYDAY=SU;BYMONTH=4,5,6,7,8,9,10",
    hasKidsActivities: true,
    outdoor: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://www.presidio.gov/presidio-picnic",
    sourcePlatform: "manual",
    pricingType: "free",
    pricingNotes: "April-October",
  },

  // === SEASONAL EVENTS ===
  {
    name: "Free First Tuesday - de Young & Legion of Honor",
    description: "First Tuesday of every month, SF residents get free admission.",
    address: "50 Hagiwara Tea Garden Dr, San Francisco, CA 94118",
    eventType: "community",
    startTime: getNthWeekday(1, 2, 9, 30), // 1st Tuesday
    endTime: getEndTime(getNthWeekday(1, 2, 9, 30), 7.75),
    isRecurring: true,
    recurrenceRule: "FREQ=MONTHLY;BYDAY=1TU",
    hasKidsActivities: true,
    outdoor: false,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://www.famsf.org/visit",
    sourcePlatform: "manual",
    pricingType: "free",
    pricingNotes: "SF residents only, show ID",
  },
  {
    name: "Free First Wednesday - Bay Area Discovery Museum",
    description: "First Wednesday of each month, admission is free for all visitors.",
    address: "557 McReynolds Rd, Sausalito, CA 94965",
    eventType: "community",
    startTime: getNthWeekday(1, 3, 9, 0), // 1st Wednesday
    endTime: getEndTime(getNthWeekday(1, 3, 9, 0), 8),
    isRecurring: true,
    recurrenceRule: "FREQ=MONTHLY;BYDAY=1WE",
    hasKidsActivities: true,
    outdoor: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: false,
    sourceUrl: "https://bayareadiscoverymuseum.org/visit",
    sourcePlatform: "manual",
    pricingType: "free",
    pricingNotes: "First Wednesday of month only",
  },
  {
    name: "Third Friday Free - Children's Creativity Museum",
    description: "Third Friday each month, free admission from 1-5pm.",
    address: "221 4th St, San Francisco, CA 94103",
    eventType: "community",
    startTime: getNthWeekday(3, 5, 13, 0), // 3rd Friday 1pm
    endTime: getEndTime(getNthWeekday(3, 5, 13, 0), 4),
    isRecurring: true,
    recurrenceRule: "FREQ=MONTHLY;BYDAY=3FR",
    hasKidsActivities: true,
    outdoor: false,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://creativity.org/visit/",
    sourcePlatform: "manual",
    pricingType: "free",
    pricingNotes: "1-5pm only",
  },

  // === SPORTS & ACTIVE ===
  {
    name: "Little Kickers Soccer - Beach Chalet Fields",
    description: "Free drop-in soccer for young kids on Saturday mornings.",
    address: "1000 Great Highway, San Francisco, CA 94121",
    eventType: "sports",
    startTime: getNextDayOccurrence(6, 9, 0), // Saturday 9am
    endTime: getEndTime(getNextDayOccurrence(6, 9, 0), 1),
    isRecurring: true,
    recurrenceRule: "FREQ=WEEKLY;BYDAY=SA",
    hasKidsActivities: true,
    outdoor: true,
    toddlerFriendly: false,
    youngKidFriendly: true,
    teenFriendly: false,
    sourceUrl: "https://sfrecpark.org",
    sourcePlatform: "manual",
    pricingType: "free",
  },
  {
    name: "Family Bike Ride - JFK Promenade",
    description: "Car-free cycling on JFK Drive. Bring bikes, scooters, skates. Open daily.",
    address: "JFK Drive, Golden Gate Park, San Francisco, CA",
    eventType: "sports",
    startTime: getNextDayOccurrence(6, 9, 0), // Saturday
    endTime: getEndTime(getNextDayOccurrence(6, 9, 0), 8),
    isRecurring: true,
    recurrenceRule: "FREQ=DAILY",
    hasKidsActivities: true,
    outdoor: true,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://sfrecpark.org/jfkpromenade",
    sourcePlatform: "manual",
    pricingType: "free",
  },

  // === RELIGIOUS & COMMUNITY ===
  {
    name: "Tot Shabbat - Congregation Sherith Israel",
    description: "Short, musical Shabbat service for babies, toddlers, and preschoolers.",
    address: "2266 California St, San Francisco, CA 94115",
    eventType: "religious",
    startTime: getNextDayOccurrence(6, 10, 0), // Saturday 10am
    endTime: getEndTime(getNextDayOccurrence(6, 10, 0), 1),
    isRecurring: true,
    recurrenceRule: "FREQ=WEEKLY;BYDAY=SA",
    hasKidsActivities: true,
    outdoor: false,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: false,
    sourceUrl: "https://sherithisrael.org/worship/shabbat",
    sourcePlatform: "manual",
    pricingType: "free",
  },
  {
    name: "Glide Sunday Celebration",
    description: "Joyful, inclusive worship with gospel choir. Dancing encouraged. All welcome.",
    address: "330 Ellis St, San Francisco, CA 94102",
    eventType: "religious",
    startTime: getNextDayOccurrence(0, 9, 0), // Sunday 9am
    endTime: getEndTime(getNextDayOccurrence(0, 9, 0), 2),
    isRecurring: true,
    recurrenceRule: "FREQ=WEEKLY;BYDAY=SU",
    hasKidsActivities: false,
    outdoor: false,
    toddlerFriendly: true,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://www.glide.org/sunday-celebration/",
    sourcePlatform: "manual",
    pricingType: "free",
  },
  {
    name: "Grace Cathedral Yoga on the Labyrinth",
    description: "Family-friendly yoga in the cathedral nave. Walk the labyrinth after. All levels.",
    address: "1100 California St, San Francisco, CA 94108",
    eventType: "community",
    startTime: getNextDayOccurrence(2, 18, 15), // Tuesday 6:15pm
    endTime: getEndTime(getNextDayOccurrence(2, 18, 15), 1.25),
    isRecurring: true,
    recurrenceRule: "FREQ=WEEKLY;BYDAY=TU",
    hasKidsActivities: false,
    outdoor: false,
    toddlerFriendly: false,
    youngKidFriendly: true,
    teenFriendly: true,
    sourceUrl: "https://gracecathedral.org/yoga/",
    sourcePlatform: "manual",
    pricingType: "donation",
    pricingNotes: "Suggested donation $10-20",
  },
];

async function main() {
  console.log("Adding comprehensive event data...\n");

  let added = 0;
  let skipped = 0;

  for (const event of newEvents) {
    try {
      await db.insert(events).values({
        id: nanoid(),
        venueId: null,
        ...event,
        lastUpdatedAt: now,
        createdAt: now,
      });
      console.log(`  + Added: ${event.name}`);
      added++;
    } catch (error) {
      if (String(error).includes("UNIQUE constraint")) {
        console.log(`  - Skipped (exists): ${event.name}`);
        skipped++;
      } else {
        console.error(`  x Error adding ${event.name}:`, error);
      }
    }
  }

  // Count totals
  const eventCount = await db.select().from(events);

  console.log(`\n========================================`);
  console.log(`Added: ${added} events`);
  console.log(`Skipped: ${skipped} (already existed)`);
  console.log(`Total events in database: ${eventCount.length}`);
  console.log(`========================================`);
}

main().catch(console.error);
