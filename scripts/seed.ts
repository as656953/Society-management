import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "../shared/schema";
import dotenv from "dotenv";
import { sql } from "drizzle-orm";

dotenv.config();

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  const db = drizzle(pool, { schema });

  try {
    console.log("Starting to seed database...");

    // Create admin user
    const [adminUser] = await db
      .insert(schema.users)
      .values({
        username: "admin",
        password: "admin123", // In production, this should be hashed
        isAdmin: true,
        name: "Admin User",
      })
      .returning();
    console.log("Created admin user:", adminUser);

    // Create towers
    const towers = await db
      .insert(schema.towers)
      .values([{ name: "Tower A" }, { name: "Tower B" }])
      .returning();
    console.log("Created towers:", towers);

    // Create apartments
    const apartments = await db
      .insert(schema.apartments)
      .values([
        {
          number: "A-101",
          towerId: towers[0].id,
          floor: 1,
          type: "2BHK",
          status: "OCCUPIED",
          ownerName: "John Doe",
          contactNumber: "1234567890",
        },
        {
          number: "B-101",
          towerId: towers[1].id,
          floor: 1,
          type: "3BHK",
          status: "AVAILABLE_RENT",
          monthlyRent: "25000",
          contactNumber: "9876543210",
        },
      ])
      .returning();
    console.log("Created apartments:", apartments);

    // Create amenities
    const amenities = await db
      .insert(schema.amenities)
      .values([
        {
          name: "Fitness Center",
          type: "GYM",
          description: "Modern gym with latest equipment",
          maxCapacity: 20,
        },
        {
          name: "Party Hall",
          type: "CLUBHOUSE",
          description: "Spacious hall for events",
          maxCapacity: 100,
        },
        {
          name: "Guest Suite",
          type: "GUEST_HOUSE",
          description: "Comfortable stay for visitors",
          maxCapacity: 2,
        },
      ])
      .returning();
    console.log("Created amenities:", amenities);

    // Update admin user's apartment
    await db
      .update(schema.users)
      .set({ apartmentId: apartments[0].id })
      .where(sql`id = ${adminUser.id}`);
    console.log("Updated admin user's apartment");

    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await pool.end();
  }
}

seed();
