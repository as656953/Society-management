import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema.js";

// Lazy initialization for serverless
let _pool: pg.Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function getPool(): pg.Pool {
  if (!_pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }

    const connectionString = process.env.DATABASE_URL;

    // Supabase transaction pooler (port 6543) requires sslmode=require in URL
    // but ssl: false in Pool options (it handles SSL at the pgbouncer level)
    const isTransactionPooler = connectionString.includes(":6543");

    // A serverless instance should hold exactly one connection. A long-lived
    // local/most other servers must not: connect-pg-simple checks out a client
    // for the session store, so `max: 1` leaves nothing for query traffic and
    // every request then fails with "timeout exceeded when trying to connect".
    const isServerless = process.env.VERCEL === "1";

    _pool = new pg.Pool({
      connectionString,
      // For transaction pooler, disable SSL in pg client (pgbouncer handles it)
      // For direct connections (port 5432), use SSL
      ssl: isTransactionPooler ? false : { rejectUnauthorized: false },
      max: isServerless ? 1 : 10,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 10000,
    });

    // An idle client erroring (server restart, pooler timeout) emits on the
    // pool. Without a listener Node treats it as unhandled and exits.
    _pool.on("error", (err) => {
      console.error("Unexpected error on idle Postgres client:", err);
    });
  }
  return _pool;
}

function getDb() {
  if (!_db) {
    _db = drizzle(getPool(), { schema });
  }
  return _db;
}

// Export getters for lazy initialization
export const pool = new Proxy({} as pg.Pool, {
  get(_, prop) {
    return (getPool() as any)[prop];
  },
});

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) {
    return (getDb() as any)[prop];
  },
});
