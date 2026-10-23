import { describe, it, expect } from "vitest";
import type { Venue, Event } from "@/lib/schema";
import {
  calculateMinCost,
  formatCost,
  getCostPerPerson,
} from "@/lib/pricing";

describe("pricing calculations", () => {
  it("uses flat_rate as a total cost", () => {
    const item = {
      pricingType: "flat_rate",
      adultPrice: 35,
    } as Venue;

    const party = { toddlers: 1, kids: 1, teens: 0, adults: 2 };
    expect(calculateMinCost(item, party)).toBe(35);
    expect(getCostPerPerson(item, party)).toBeCloseTo(35 / 4, 4);
  });

  it("calculates per_person cost correctly", () => {
    const item = {
      pricingType: "per_person",
      adultPrice: 20,
      childPrice: 10,
      teenPrice: 15,
      toddlerPrice: 0,
    } as Venue;

    const party = { toddlers: 1, kids: 1, teens: 1, adults: 2 };
    expect(calculateMinCost(item, party)).toBe(65);
  });

  it("handles menu pricing as unknown", () => {
    const item = {
      pricingType: "menu",
      adultPrice: 25,
    } as Venue;

    const party = { toddlers: 0, kids: 0, teens: 0, adults: 1 };
    expect(calculateMinCost(item, party)).toBe(-1);
    expect(formatCost(item, party)).toBe("Menu prices");
  });

  it("treats donation events as free", () => {
    const event = {
      pricingType: "donation",
    } as Event;

    const party = { toddlers: 0, kids: 0, teens: 0, adults: 1 };
    expect(calculateMinCost(event, party)).toBe(0);
    expect(formatCost(event, party)).toBe("Free");
  });
});
