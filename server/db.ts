import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema.js";

// Lazy initialization for serverless
let _pool: pg.Pool | null = null;
let _sessionPool: pg.Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function poolOptions(max: number): pg.PoolConfig {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?"
    );
  }
  // Supabase transaction pooler (port 6543) requires sslmode=require in the URL
  // but ssl: false here, because pgbouncer terminates TLS itself.
  const isTransactionPooler = connectionString.includes(":6543");
  return {
    connectionString,
    ssl: isTransactionPooler ? false : { rejectUnauthorized: false },
    max,
    idleTimeoutMillis: 20000,
    // Fail fast. A long timeout turns a misconfigured or saturated pool into a
    // request that hangs for ten seconds before erroring, which reads as "the
    // app is broken" rather than "the database is unreachable".
    connectionTimeoutMillis: 5000,
  };
}

function attachErrorLogger(p: pg.Pool, label: string) {
  // An idle client erroring (server restart, pooler timeout) emits on the pool.
  // Without a listener Node treats it as unhandled and exits.
  p.on("error", (err) => {
    console.error(`Unexpected error on idle Postgres client (${label}):`, err);
  });
}

/**
 * A small pool reserved for the session store.
 *
 * connect-pg-simple previously shared the application pool, so every request
 * spent one of its connections on the session lookup before the handler could
 * run. Under concurrency that starves query traffic and every request starts
 * timing out. Session lookups are short and frequent, so they get their own
 * budget.
 */
export function getSessionPool(): pg.Pool {
  if (!_sessionPool) {
    _sessionPool = new pg.Pool(poolOptions(3));
    attachErrorLogger(_sessionPool, "session store");
  }
  return _sessionPool;
}

function getPool(): pg.Pool {
  if (!_pool) {
    // A serverless instance should hold exactly one connection; a long-lived
    // server needs several. The session store no longer draws on this pool.
    const isServerless = process.env.VERCEL === "1";
    _pool = new pg.Pool(poolOptions(isServerless ? 1 : 10));
    attachErrorLogger(_pool, "app");
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
