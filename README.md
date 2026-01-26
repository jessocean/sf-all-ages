# SF All-Ages Social Club

A Next.js app for discovering family-friendly venues and events in San Francisco.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite (local) / Turso (production)
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS

## Database Architecture

This project uses two database environments:

| Environment | Database | URL | Purpose |
|-------------|----------|-----|---------|
| **Local Dev** | SQLite | `file:local.db` | Development and testing |
| **Production** | Turso | `TURSO_DATABASE_URL` | Live production data |

### Production Database (Turso)

**Turso is the production database.** All data served to users in production comes from Turso.

The Turso database is configured via environment variables:
- `TURSO_DATABASE_URL` - The Turso connection URL
- `TURSO_AUTH_TOKEN` - Authentication token for Turso

### Local Development Database

The `local.db` file is used for local development. Changes made locally do NOT automatically sync to production.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (copy from `.env.example`):
```bash
cp .env.example .env.local
```

3. Push schema to local database:
```bash
npm run db:push
```

4. Seed local database:
```bash
npx tsx scripts/seed.ts
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Database Sync Workflow

### Syncing Local Data to Production

When you've added or modified data in `local.db` and want to push it to production:

```bash
# Load environment variables and run sync script
source .env.local
TURSO_DATABASE_URL=$TURSO_DATABASE_URL TURSO_AUTH_TOKEN=$TURSO_AUTH_TOKEN npx tsx scripts/sync-to-turso.ts
```

This script will:
1. Read all venues and events from `local.db`
2. Clear existing venues/events in Turso (preserves subscriptions)
3. Insert all local data into Turso

### Pushing Schema Changes to Production

```bash
# Push schema to Turso
TURSO_DATABASE_URL=$TURSO_DATABASE_URL TURSO_AUTH_TOKEN=$TURSO_AUTH_TOKEN npm run db:push
```

## Scripts

| Script | Description |
|--------|-------------|
| `scripts/seed.ts` | Seed database with initial data |
| `scripts/sync-to-turso.ts` | Sync local.db to Turso production |
| `scripts/add-more-venues.ts` | Add additional venues |
| `scripts/add-more-events.ts` | Add additional events |
| `scripts/scrape.ts` | Scrape events from external sources |

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── api/            # API routes
│   └── admin/          # Admin interface
├── components/         # React components
├── lib/                # Utilities and database
│   ├── db.ts          # Database connection
│   ├── schema.ts      # Drizzle schema
│   ├── pricing.ts     # Pricing calculations
│   └── distance.ts    # Distance calculations
└── scrapers/          # Event scrapers
```

## Deployment

The app is deployed on Vercel with Turso as the production database. Environment variables must be configured in Vercel project settings.
