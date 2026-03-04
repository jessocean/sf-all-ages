/**
 * Master data sync script.
 * Runs all pipelines in order, then validation.
 *
 * Usage: npx tsx scripts/sync-data.ts
 *        npm run sync
 */

import "dotenv/config";

// Dynamic imports to handle each source independently
async function run() {
  console.log("=== SF All-Ages Data Sync ===\n");
  const startTime = Date.now();
  const results: Record<string, { success: boolean; detail: string }> = {};

  // 1. FunCheap RSS
  try {
    console.log("\n--- FunCheap RSS ---");
    const { scrapeFuncheapRSS } = await import("@/scrapers/funcheap-rss");
    const { scraped, saved } = await scrapeFuncheapRSS();
    results.funcheap = {
      success: true,
      detail: `scraped ${scraped}, saved ${saved} new`,
    };
  } catch (error) {
    console.error("FunCheap RSS failed:", error);
    results.funcheap = { success: false, detail: String(error) };
  }

  // 2. DataSF (Parks & Rec)
  try {
    console.log("\n--- DataSF Parks & Rec ---");
    const { scrapeDataSF } = await import("@/scrapers/datasf");
    const { fetched, saved } = await scrapeDataSF();
    results.datasf = {
      success: true,
      detail: `fetched ${fetched}, saved ${saved} new`,
    };
  } catch (error) {
    console.error("DataSF failed:", error);
    results.datasf = { success: false, detail: String(error) };
  }

  // 3. Overpass (OSM)
  try {
    console.log("\n--- OpenStreetMap Overpass ---");
    const { scrapeOverpass } = await import("@/scrapers/overpass");
    const { fetched, saved } = await scrapeOverpass();
    results.overpass = {
      success: true,
      detail: `fetched ${fetched}, saved ${saved} new`,
    };
  } catch (error) {
    console.error("Overpass failed:", error);
    results.overpass = { success: false, detail: String(error) };
  }

  // 4. Google Places enrichment
  try {
    console.log("\n--- Google Places Enrichment ---");
    const { enrichWithGooglePlaces } = await import(
      "@/scrapers/google-places"
    );
    const { checked, enriched } = await enrichWithGooglePlaces();
    results.googlePlaces = {
      success: true,
      detail: `checked ${checked}, enriched ${enriched}`,
    };
  } catch (error) {
    console.error("Google Places failed:", error);
    results.googlePlaces = { success: false, detail: String(error) };
  }

  // 5. SFPL
  try {
    console.log("\n--- SFPL Events ---");
    const { scrapeSFPL } = await import("@/scrapers/sfpl");
    const { fetched, saved } = await scrapeSFPL();
    results.sfpl = {
      success: true,
      detail: `fetched ${fetched}, saved ${saved} new`,
    };
  } catch (error) {
    console.error("SFPL failed:", error);
    results.sfpl = { success: false, detail: String(error) };
  }

  // 6. Data quality
  try {
    console.log("\n--- Data Quality ---");
    const { runDataQuality } = await import("@/lib/data-quality");
    const report = await runDataQuality();
    results.quality = {
      success: true,
      detail: `stale=${report.staleEventsRemoved}, dupes=${report.duplicatesMerged}, oob=${report.outOfBoundsRemoved}`,
    };
  } catch (error) {
    console.error("Data quality failed:", error);
    results.quality = { success: false, detail: String(error) };
  }

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("\n=== Sync Complete ===");
  console.log(`Time: ${elapsed}s\n`);

  for (const [source, result] of Object.entries(results)) {
    const icon = result.success ? "OK" : "FAIL";
    console.log(`  [${icon}] ${source}: ${result.detail}`);
  }

  const failures = Object.values(results).filter((r) => !r.success).length;
  if (failures > 0) {
    console.log(`\n${failures} source(s) failed.`);
  }

  process.exit(failures > 0 ? 1 : 0);
}

run();
