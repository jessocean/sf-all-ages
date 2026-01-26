# SF All-Ages Social Club - Issues Found

## Resolved Issues

### 1. Time Filter Day Name Mismatch (FIXED)

**Status**: RESOLVED

**Problem**: The time filter code expected full day names (`saturday`, `sunday`, `monday`, etc.) but the database stores abbreviated day names (`sat`, `sun`, `mon`, etc.).

**Fix Applied**: Added a `DAY_TO_ABBR` mapping and `getDayAbbreviation()` helper function in `src/components/TimeFilter.tsx` to convert full day names to abbreviated format.

---

### 2. Database Sync - Local vs Production Mismatch (FIXED)

**Status**: RESOLVED

**Problem**: The local SQLite database had significantly more data than the production Turso database.

**Fix Applied**:
- Created `scripts/sync-to-turso.ts` script to sync data from local.db to Turso
- Ran sync on 2026-01-25
- Production now contains: 131 venues, 102 events

---

## Verified Working

### Distance Calculator

The Haversine formula implementation is accurate:
- SF City Hall to Golden Gate Bridge: 4.27 mi (correct)
- Embarcadero to Mission: 2.69 mi (correct)
- Same point: 0.00 mi (correct)

**Location**: `src/lib/distance.ts`

### Price Calculator

All pricing calculations are accurate:
- Correctly applies age-specific pricing (adult, child, teen, toddler)
- Handles free venues
- Calculates group totals correctly

**Location**: `src/lib/pricing.ts`

---

## Testing Notes

**Date tested**: 2026-01-25

**Environment**:
- Next.js 14
- SQLite (local) / Turso (production)
- Drizzle ORM

**Hours JSON format in database**:
```json
{
  "mon": "12:00-22:00",
  "tue": "12:00-22:00",
  "wed": "12:00-22:00",
  "thu": "12:00-22:00",
  "fri": "12:00-23:00",
  "sat": "11:00-23:00",
  "sun": "11:00-22:00"
}
```
