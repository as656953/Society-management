import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { neon } from "@neondatabase/serverless";
import pg from "pg";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Use Neon serverless driver in production (Vercel), pg locally
const isProduction = process.env.NODE_ENV === 'production';

// For serverless (Vercel) - use Neon HTTP driver
const sql = isProduction ? neon(process.env.DATABASE_URL) : null;

// For local development - use pg Pool
export const pool = isProduction
  ? null
  : new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Export the appropriate drizzle instance
export const db = isProduction
  ? drizzleNeon(sql!, { schema })
  : drizzlePg(pool!, { schema });
