import { describe, it, expect } from "vitest";
import { calculateDistance, getDistanceMiles } from "@/lib/distance";

describe("distance calculations", () => {
  it("returns zero for identical points", () => {
    const dist = calculateDistance(37.7749, -122.4194, 37.7749, -122.4194);
    expect(dist).toBeCloseTo(0, 5);
  });

  it("returns undefined when coordinates are missing", () => {
    expect(getDistanceMiles(null, 37.77, -122.42)).toBeUndefined();
    expect(getDistanceMiles({ lat: 37.77, lng: -122.42 }, null, -122.42)).toBeUndefined();
    expect(getDistanceMiles({ lat: 37.77, lng: -122.42 }, 37.77, null)).toBeUndefined();
  });

  it("calculates distance when coordinates are present", () => {
    const dist = getDistanceMiles(
      { lat: 37.7749, lng: -122.4194 },
      37.8078,
      -122.475
    );
    expect(dist).toBeGreaterThan(0);
  });
});
