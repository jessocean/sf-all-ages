/**
 * Post-import data quality gate.
 * Runs validation on all records: staleness, duplicates, bounds, completeness.
 */

import { db, venues, events } from "./db";
import { lt, eq, sql } from "drizzle-orm";
import { isWithinSF, areNearby, isGenericAddress } from "./pipeline";

interface QualityReport {
  staleEventsRemoved: number;
  duplicatesMerged: number;
  outOfBoundsRemoved: number;
  genericAddressFlagged: number;
  incompleteVenues: number;
}

/** Remove events whose startTime is in the past. */
async function removeStaleEvents(): Promise<number> {
  const now = new Date().toISOString();
  const stale = await db
    .select({ id: events.id })
    .from(events)
    .where(lt(events.startTime, now));

  if (stale.length === 0) return 0;

  for (const row of stale) {
    await db.delete(events).where(eq(events.id, row.id));
  }

  return stale.length;
}

/** Remove venues outside SF bounds. */
async function removeOutOfBounds(): Promise<number> {
  const allVenues = await db
    .select({
      id: venues.id,
      latitude: venues.latitude,
      longitude: venues.longitude,
    })
    .from(venues);

  let removed = 0;
  for (const v of allVenues) {
    if (
      v.latitude != null &&
      v.longitude != null &&
      !isWithinSF(v.latitude, v.longitude)
    ) {
      await db.delete(venues).where(eq(venues.id, v.id));
      removed++;
    }
  }

  return removed;
}

/** Merge duplicate venues (same name + nearby coordinates). */
async function mergeDuplicates(): Promise<number> {
  const allVenues = await db
    .select({
      id: venues.id,
      name: venues.name,
      latitude: venues.latitude,
      longitude: venues.longitude,
    })
    .from(venues);

  const toDelete: string[] = [];
  const seen = new Map<string, (typeof allVenues)[0]>();

  for (const v of allVenues) {
    const key = v.name.toLowerCase().trim();
    const existing = seen.get(key);

    if (existing) {
      // Same name -- check proximity if both have coords
      if (
        existing.latitude != null &&
        existing.longitude != null &&
        v.latitude != null &&
        v.longitude != null
      ) {
        if (
          areNearby(
            existing.latitude,
            existing.longitude,
            v.latitude,
            v.longitude,
            0.2
          )
        ) {
          toDelete.push(v.id);
        }
      } else {
        // One missing coords, likely same place
        toDelete.push(v.id);
      }
    } else {
      seen.set(key, v);
    }
  }

  for (const id of toDelete) {
    await db.delete(venues).where(eq(venues.id, id));
  }

  return toDelete.length;
}

/** Flag venues with generic addresses. */
async function flagGenericAddresses(): Promise<number> {
  const allVenues = await db
    .select({ id: venues.id, address: venues.address })
    .from(venues);

  let flagged = 0;
  for (const v of allVenues) {
    if (isGenericAddress(v.address)) {
      await db
        .update(venues)
        .set({ status: "unverified" })
        .where(eq(venues.id, v.id));
      flagged++;
    }
  }

  return flagged;
}

/** Count venues missing critical fields. */
async function countIncomplete(): Promise<number> {
  const allVenues = await db
    .select({
      id: venues.id,
      latitude: venues.latitude,
      longitude: venues.longitude,
      description: venues.description,
      imageUrl: venues.imageUrl,
      hoursJson: venues.hoursJson,
      pricingType: venues.pricingType,
    })
    .from(venues);

  let incomplete = 0;
  for (const v of allVenues) {
    let missing = 0;
    if (v.latitude == null) missing++;
    if (v.longitude == null) missing++;
    if (!v.description) missing++;
    if (!v.imageUrl) missing++;
    if (!v.hoursJson) missing++;
    if (!v.pricingType) missing++;

    if (missing >= 3) incomplete++;
  }

  return incomplete;
}

/** Run all quality checks. */
export async function runDataQuality(): Promise<QualityReport> {
  console.log("Running data quality checks...");

  const staleEventsRemoved = await removeStaleEvents();
  console.log(`  Removed ${staleEventsRemoved} stale events`);

  const outOfBoundsRemoved = await removeOutOfBounds();
  console.log(`  Removed ${outOfBoundsRemoved} out-of-bounds venues`);

  const duplicatesMerged = await mergeDuplicates();
  console.log(`  Merged ${duplicatesMerged} duplicate venues`);

  const genericAddressFlagged = await flagGenericAddresses();
  console.log(`  Flagged ${genericAddressFlagged} generic addresses`);

  const incompleteVenues = await countIncomplete();
  console.log(`  ${incompleteVenues} venues missing 3+ fields`);

  return {
    staleEventsRemoved,
    duplicatesMerged,
    outOfBoundsRemoved,
    genericAddressFlagged,
    incompleteVenues,
  };
}
