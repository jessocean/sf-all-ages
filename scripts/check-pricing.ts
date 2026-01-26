import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { venues } from '../src/lib/schema';
import { like, or } from 'drizzle-orm';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const db = drizzle(client);

async function main() {
  const results = await db.select({
    name: venues.name,
    pricingType: venues.pricingType,
    adultPrice: venues.adultPrice,
    childPrice: venues.childPrice,
    toddlerPrice: venues.toddlerPrice,
    teenPrice: venues.teenPrice,
    websiteUrl: venues.websiteUrl,
  }).from(venues).where(
    or(
      like(venues.name, '%Academy%'),
      like(venues.name, '%Exploratorium%'),
      like(venues.name, '%Zoo%'),
      like(venues.name, '%Museum%')
    )
  );
  console.log(JSON.stringify(results, null, 2));
}
main();
