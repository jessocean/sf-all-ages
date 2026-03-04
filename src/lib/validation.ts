import type { Venue, Event } from "./schema";
import { TYPE_FALLBACK_IMAGES } from "./images";

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  field: string;
  message: string;
  severity: ValidationSeverity;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
}

const MIN_DESCRIPTION_LENGTH = 20;

const PLACEHOLDER_DESCRIPTION_PATTERNS = [
  /lorem ipsum/i,
  /todo/i,
  /fixme/i,
  /placeholder/i,
  /description here/i,
  /\[.*\]/g,
  /tbd/i,
  /coming soon/i,
];

const PLACEHOLDER_IMAGE_PATTERNS = [
  /placehold\.co/i,
  /placeholder/i,
  /picsum\.photos/i,
  /via\.placeholder/i,
  /dummyimage/i,
  /fakeimg/i,
  /lorempixel/i,
];

// San Francisco bounds for sanity checks
const SF_BOUNDS = {
  minLat: 37.6,
  maxLat: 37.85,
  minLng: -122.55,
  maxLng: -122.35,
};

export function normalizeUrl(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(candidate)) {
      candidate = `https://${candidate}`;
    } else if (/^www\./i.test(candidate)) {
      candidate = `https://${candidate}`;
    } else {
      return null;
    }
  }

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function isValidHttpUrl(input?: string | null): boolean {
  if (!input) return false;
  try {
    const url = new URL(input);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isPlaceholderImageUrl(url?: string | null): boolean {
  if (!url) return false;
  return PLACEHOLDER_IMAGE_PATTERNS.some((pattern) => pattern.test(url));
}

export function isGenericVenueImageUrl(url?: string | null): boolean {
  if (!url) return false;
  return Object.values(TYPE_FALLBACK_IMAGES).includes(url);
}

function addIssue(
  issues: ValidationIssue[],
  field: string,
  message: string,
  severity: ValidationSeverity
): void {
  issues.push({ field, message, severity });
}

function validateDescription(
  issues: ValidationIssue[],
  description: string | null | undefined,
  field: string
): void {
  if (!description || !description.trim()) {
    addIssue(issues, field, "Description is required.", "error");
    return;
  }

  const trimmed = description.trim();
  if (trimmed.length < MIN_DESCRIPTION_LENGTH) {
    addIssue(
      issues,
      field,
      `Description is too short (min ${MIN_DESCRIPTION_LENGTH} chars).`,
      "error"
    );
  }

  if (PLACEHOLDER_DESCRIPTION_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    addIssue(issues, field, "Description contains placeholder text.", "error");
  }
}

function validateCoordinates(
  issues: ValidationIssue[],
  latitude: number | null | undefined,
  longitude: number | null | undefined
): void {
  const hasLat = latitude !== null && latitude !== undefined;
  const hasLng = longitude !== null && longitude !== undefined;

  if (hasLat !== hasLng) {
    addIssue(issues, "coordinates", "Latitude and longitude must both be set.", "error");
    return;
  }

  if (hasLat && hasLng) {
    if (
      latitude! < SF_BOUNDS.minLat ||
      latitude! > SF_BOUNDS.maxLat ||
      longitude! < SF_BOUNDS.minLng ||
      longitude! > SF_BOUNDS.maxLng
    ) {
      addIssue(issues, "coordinates", "Coordinates must be within San Francisco.", "error");
    }
  }
}

function validatePricing(
  issues: ValidationIssue[],
  pricingType: string | null | undefined,
  prices: {
    adultPrice?: number | null;
    childPrice?: number | null;
    toddlerPrice?: number | null;
    teenPrice?: number | null;
  },
  pricingNotes: string | null | undefined,
  allowedTypes: string[]
): void {
  if (pricingType && !allowedTypes.includes(pricingType)) {
    addIssue(issues, "pricingType", `Invalid pricing type: ${pricingType}`, "error");
  }

  const priceValues = [
    prices.adultPrice,
    prices.childPrice,
    prices.toddlerPrice,
    prices.teenPrice,
  ].filter((value) => value !== null && value !== undefined) as number[];

  if (priceValues.some((value) => value < 0)) {
    addIssue(issues, "pricing", "Prices cannot be negative.", "error");
  }

  if (pricingType === "free" || pricingType === "donation") {
    if (priceValues.some((value) => value > 0)) {
      addIssue(issues, "pricing", "Free/donation listings should not have prices.", "error");
    }
    return;
  }

  if (pricingType === "per_person" || pricingType === "flat_rate") {
    if (priceValues.length === 0 && !pricingNotes) {
      addIssue(issues, "pricing", "Paid listings must include a price or pricing notes.", "error");
    }
  }
}

function validateUrls(
  issues: ValidationIssue[],
  field: string,
  url?: string | null
): void {
  if (!url) return;
  if (!isValidHttpUrl(url)) {
    addIssue(issues, field, "URL must be a valid http(s) link.", "error");
  }
}

function validateImage(
  issues: ValidationIssue[],
  field: string,
  url?: string | null
): void {
  if (!url) {
    addIssue(issues, field, "Image is missing.", "warning");
    return;
  }

  if (!isValidHttpUrl(url)) {
    addIssue(issues, field, "Image URL must be a valid http(s) link.", "error");
    return;
  }

  if (isPlaceholderImageUrl(url)) {
    addIssue(issues, field, "Image appears to be a placeholder.", "error");
  }

  if (isGenericVenueImageUrl(url)) {
    addIssue(issues, field, "Image appears to be a generic fallback.", "error");
  }
}

export function validateVenueListing(venue: Partial<Venue>): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!venue.name || !venue.name.trim()) {
    addIssue(issues, "name", "Name is required.", "error");
  }

  if (!venue.address || !venue.address.trim()) {
    addIssue(issues, "address", "Address is required.", "error");
  }

  validateDescription(issues, venue.description, "description");
  validateCoordinates(issues, venue.latitude, venue.longitude);
  validateUrls(issues, "websiteUrl", venue.websiteUrl || undefined);
  validateImage(issues, "imageUrl", venue.imageUrl || undefined);

  validatePricing(
    issues,
    venue.pricingType || null,
    {
      adultPrice: venue.adultPrice,
      childPrice: venue.childPrice,
      toddlerPrice: venue.toddlerPrice,
      teenPrice: venue.teenPrice,
    },
    venue.pricingNotes,
    ["free", "per_person", "flat_rate", "menu", "donation"]
  );

  const isValid = !issues.some((issue) => issue.severity === "error");
  return { isValid, issues };
}

export function validateEventListing(event: Partial<Event>): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!event.name || !event.name.trim()) {
    addIssue(issues, "name", "Name is required.", "error");
  }

  if (!event.startTime) {
    addIssue(issues, "startTime", "Start time is required.", "error");
  }

  if (!event.venueId && !event.address) {
    addIssue(issues, "address", "Address is required when no venue is linked.", "error");
  }

  validateDescription(issues, event.description, "description");
  validateUrls(issues, "sourceUrl", event.sourceUrl || undefined);
  validateImage(issues, "imageUrl", event.imageUrl || undefined);

  validatePricing(
    issues,
    event.pricingType || null,
    {
      adultPrice: event.adultPrice,
      childPrice: event.childPrice,
      toddlerPrice: event.toddlerPrice,
      teenPrice: event.teenPrice,
    },
    event.pricingNotes,
    ["free", "per_person", "flat_rate", "donation", "menu"]
  );

  const isValid = !issues.some((issue) => issue.severity === "error");
  return { isValid, issues };
}
