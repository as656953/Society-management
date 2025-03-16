import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config();

async function testConnection() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log("Attempting to connect to database...");
    const client = await pool.connect();
    console.log("Successfully connected to database!");

    const result = await client.query("SELECT NOW()");
    console.log("Database time:", result.rows[0].now);

    client.release();
  } catch (err) {
    console.error("Error connecting to database:", err);
  } finally {
    await pool.end();
  }
}

testConnection();
