import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "../shared/schema";
import dotenv from "dotenv";

dotenv.config();

const CREATE_USERS_TABLE = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    name TEXT NOT NULL,
    apartment_id INTEGER
  );
`;

const CREATE_TOWERS_TABLE = `
  CREATE TABLE IF NOT EXISTS towers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
  );
`;

const CREATE_APARTMENTS_TABLE = `
  CREATE TABLE IF NOT EXISTS apartments (
    id SERIAL PRIMARY KEY,
    number TEXT NOT NULL,
    tower_id INTEGER NOT NULL,
    floor INTEGER NOT NULL,
    type TEXT NOT NULL,
    owner_name TEXT,
    status TEXT NOT NULL DEFAULT 'OCCUPIED',
    monthly_rent NUMERIC,
    sale_price NUMERIC,
    contact_number TEXT
  );
`;

const CREATE_AMENITIES_TABLE = `
  CREATE TABLE IF NOT EXISTS amenities (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    max_capacity INTEGER
  );
`;

const CREATE_BOOKINGS_TABLE = `
  CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    amenity_id INTEGER NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status TEXT NOT NULL,
    deleted_at TIMESTAMP
  );
`;

async function pushSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  const db = drizzle(pool);

  try {
    console.log("Creating tables...");

    // Create tables in order (respecting foreign key relationships)
    await db.execute(sql.raw(CREATE_USERS_TABLE));
    console.log("Created users table");

    await db.execute(sql.raw(CREATE_TOWERS_TABLE));
    console.log("Created towers table");

    await db.execute(sql.raw(CREATE_APARTMENTS_TABLE));
    console.log("Created apartments table");

    await db.execute(sql.raw(CREATE_AMENITIES_TABLE));
    console.log("Created amenities table");

    await db.execute(sql.raw(CREATE_BOOKINGS_TABLE));
    console.log("Created bookings table");

    console.log("All tables created successfully!");
  } catch (error) {
    console.error("Error creating tables:", error);
  } finally {
    await pool.end();
  }
}

pushSchema();
