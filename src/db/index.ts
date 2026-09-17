import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

// Use WebSocket transport — supports transactions (unlike neon-http)
// This is the recommended driver for serverless + Drizzle transactions.
import WebSocket from "ws";
neonConfig.webSocketConstructor = WebSocket as any;

const globalForDb = globalThis as typeof globalThis & {
  __plannedNeonPool?: Pool;
};

const pool =
  globalForDb.__plannedNeonPool ??
  new Pool({ connectionString: databaseUrl });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__plannedNeonPool = pool;
}

export const db = drizzle(pool);
