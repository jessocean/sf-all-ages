import { describe, it, expect } from "vitest";
import {
  normalizeUrl,
  validateVenueListing,
  validateEventListing,
  isPlaceholderImageUrl,
} from "@/lib/validation";

describe("listing validation", () => {
  it("normalizes bare domains to https", () => {
    expect(normalizeUrl("example.com")).toBe("https://example.com/");
    expect(normalizeUrl("www.example.com/about")).toBe(
      "https://www.example.com/about"
    );
  });

  it("rejects non-http urls", () => {
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeUrl("ftp://example.com/file")).toBeNull();
  });

  it("detects placeholder images", () => {
    expect(isPlaceholderImageUrl("https://placehold.co/600x400")).toBe(true);
    expect(isPlaceholderImageUrl("https://example.com/image.jpg")).toBe(false);
  });

  it("validates a solid venue listing", () => {
    const result = validateVenueListing({
      name: "Test Venue",
      address: "123 Main St, San Francisco, CA",
      description: "A real venue description that is long enough.",
      imageUrl: "https://example.com/venue.jpg",
      websiteUrl: "https://example.com",
      pricingType: "free",
      adultPrice: 0,
      latitude: 37.77,
      longitude: -122.42,
    });

    expect(result.isValid).toBe(true);
    expect(result.issues.length).toBe(0);
  });

  it("flags missing description and placeholder image", () => {
    const result = validateVenueListing({
      name: "Bad Venue",
      address: "123 Main St, San Francisco, CA",
      description: "Short",
      imageUrl: "https://placehold.co/640x480",
      websiteUrl: "https://example.com",
    });

    const messages = result.issues.map((issue) => issue.message);
    expect(messages.some((msg) => msg.includes("Description"))).toBe(true);
    expect(messages.some((msg) => msg.includes("placeholder"))).toBe(true);
    expect(result.isValid).toBe(false);
  });

  it("requires event address when no venue is linked", () => {
    const result = validateEventListing({
      name: "Test Event",
      description: "A valid event description that is sufficiently long.",
      startTime: new Date().toISOString(),
      sourceUrl: "https://example.com/event",
    });

    expect(result.isValid).toBe(false);
    expect(result.issues.some((issue) => issue.field === "address")).toBe(true);
  });
});
