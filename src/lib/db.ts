import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

// For local development, use a local SQLite file
// For production, use Turso
const isProduction = process.env.NODE_ENV === "production";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

// Re-export schema for convenience
export * from "./schema";
