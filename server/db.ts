import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Create pool with SSL for Supabase connection
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 1, // Limit connections for serverless
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 10000,
});

export const db = drizzle(pool, { schema });
