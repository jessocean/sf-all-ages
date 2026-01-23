import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// Venues (cafes, breweries, parks, etc.)
export const venues = sqliteTable("venues", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  neighborhood: text("neighborhood"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  venueType: text("venue_type"), // cafe, brewery, restaurant, park, museum, church
  hoursJson: text("hours_json"), // JSON: {"mon": "9:00-17:00", ...}

  // Kid-friendly features (boolean flags stored as 0/1)
  hasPlayArea: integer("has_play_area", { mode: "boolean" }).default(false),
  hasOutdoorSpace: integer("has_outdoor_space", { mode: "boolean" }).default(false),
  isEnclosed: integer("is_enclosed", { mode: "boolean" }).default(false),
  hasHighChairs: integer("has_high_chairs", { mode: "boolean" }).default(false),
  hasChangingTable: integer("has_changing_table", { mode: "boolean" }).default(false),
  strollerAccessible: integer("stroller_accessible", { mode: "boolean" }).default(false),
  loudOk: integer("loud_ok", { mode: "boolean" }).default(false), // no need to be quiet

  // Age suitability
  toddlerFriendly: integer("toddler_friendly", { mode: "boolean" }).default(false),
  youngKidFriendly: integer("young_kid_friendly", { mode: "boolean" }).default(false),
  teenFriendly: integer("teen_friendly", { mode: "boolean" }).default(false),

  description: text("description"),
  websiteUrl: text("website_url"),
  status: text("status").default("active"), // active, closed, unverified
  lastVerifiedAt: text("last_verified_at"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

// Events
export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"), // simplified, scannable
  venueId: text("venue_id").references(() => venues.id),
  address: text("address"), // for events without linked venue

  eventType: text("event_type"), // music, sports, religious, festival, market, community
  startTime: text("start_time").notNull(),
  endTime: text("end_time"),
  isRecurring: integer("is_recurring", { mode: "boolean" }).default(false),
  recurrenceRule: text("recurrence_rule"), // iCal RRULE format

  // Kid-friendly features
  hasKidsActivities: integer("has_kids_activities", { mode: "boolean" }).default(false),
  outdoor: integer("outdoor", { mode: "boolean" }).default(false),
  toddlerFriendly: integer("toddler_friendly", { mode: "boolean" }).default(false),
  youngKidFriendly: integer("young_kid_friendly", { mode: "boolean" }).default(false),
  teenFriendly: integer("teen_friendly", { mode: "boolean" }).default(false),

  sourceUrl: text("source_url"),
  sourcePlatform: text("source_platform"), // funcheap, eventbrite, manual, etc.
  lastUpdatedAt: text("last_updated_at"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

// Email subscriptions
export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  frequency: text("frequency").default("weekly"), // weekly, monthly

  // Filters (JSON)
  filtersJson: text("filters_json"), // {"neighborhoods": [], "event_types": [], "age_groups": []}

  verified: integer("verified", { mode: "boolean" }).default(false),
  verificationToken: text("verification_token"),
  unsubscribeToken: text("unsubscribe_token"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

// Type exports
export type Venue = typeof venues.$inferSelect;
export type NewVenue = typeof venues.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
