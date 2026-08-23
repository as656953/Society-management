/**
 * Seeds a development database with an obviously-fake society.
 *
 * The repo previously had no way to reach a usable application from a clean
 * clone: `db:push` is unsafe, there was no migrate script, and the only account
 * bootstrap was a script that required a user named "admin" to already exist.
 * A stranger following the README reached a login screen and stopped.
 *
 *   npm run db:migrate   # build the schema
 *   npm run db:seed      # fill it, and print the logins
 *
 * Refuses to run against a database that already has users unless --force is
 * passed, so it cannot quietly overwrite real data.
 */
import { db, pool } from "../server/db.js";
import { hashPassword } from "../server/crypto.js";
import {
  users,
  towers,
  apartments,
  amenities,
  notices,
} from "../shared/schema.js";
import { sql } from "drizzle-orm";

const FORCE = process.argv.includes("--force");

const ACCOUNTS = [
  {
    username: "admin",
    password: "demo-admin-pw",
    name: "Asha Menon",
    role: "admin" as const,
    isAdmin: true,
  },
  {
    username: "resident",
    password: "demo-resident-pw",
    name: "Ravi Iyer",
    role: "resident" as const,
    isAdmin: false,
  },
  {
    username: "guard",
    password: "demo-guard-pw",
    name: "Sunil Rao",
    role: "guard" as const,
    isAdmin: false,
  },
];

async function main() {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users);

  if (count > 0 && !FORCE) {
    console.error(
      `Refusing to seed: the database already has ${count} user(s).\n` +
        `This looks like a real database. Re-run with --force only if you are\n` +
        `certain you want to add demo data alongside it.`
    );
    process.exitCode = 1;
    return;
  }

  console.log("Seeding towers...");
  const towerRows = await db
    .insert(towers)
    .values([{ name: "Tower A" }, { name: "Tower B" }, { name: "Tower C" }])
    .returning();

  console.log("Seeding apartments...");
  const apartmentValues = towerRows.flatMap((tower) =>
    [1, 2, 3].flatMap((floor) =>
      [1, 2].map((unit) => ({
        number: `${tower.name.slice(-1)}-${floor}0${unit}`,
        towerId: tower.id,
        floor,
        type: unit === 1 ? ("2BHK" as const) : ("3BHK" as const),
        status: "OCCUPIED" as const,
      }))
    )
  );
  const apartmentRows = await db
    .insert(apartments)
    .values(apartmentValues)
    .returning();

  console.log("Seeding amenities...");
  await db.insert(amenities).values([
    {
      name: "Fitness Centre",
      type: "GYM",
      description: "Cardio and weights. Open 05:00-22:00.",
      maxCapacity: 25,
    },
    {
      name: "Clubhouse",
      type: "CLUBHOUSE",
      description: "Bookable for private events.",
      maxCapacity: 80,
    },
    {
      name: "Guest Suite",
      type: "GUEST_HOUSE",
      description: "Two-bedroom suite for visiting family.",
      maxCapacity: 4,
    },
  ]);

  console.log("Seeding users...");
  const created = [];
  for (const account of ACCOUNTS) {
    const [row] = await db
      .insert(users)
      .values({
        username: account.username,
        password: await hashPassword(account.password),
        name: account.name,
        role: account.role,
        isAdmin: account.isAdmin,
        authProvider: "local",
        // Give the resident a flat so resident-only routes, which require an
        // apartmentId, are reachable straight after seeding.
        apartmentId:
          account.role === "resident" ? apartmentRows[0].id : null,
        residentType: account.role === "resident" ? "OWNER" : null,
      })
      .returning();
    created.push(row);
  }

  const admin = created.find((u) => u.role === "admin")!;

  console.log("Seeding a notice...");
  await db.insert(notices).values({
    title: "Water tank cleaning on Saturday",
    content:
      "Supply will be interrupted between 10:00 and 14:00. Please store what you need.",
    createdBy: admin.id,
    priority: "NORMAL",
  });

  console.log(
    [
      "",
      "Seeded successfully.",
      `  ${towerRows.length} towers, ${apartmentRows.length} apartments, 3 amenities, 1 notice`,
      "",
      "Log in with:",
      ...ACCOUNTS.map(
        (a) => `  ${a.role.padEnd(8)} ${a.username.padEnd(9)} ${a.password}`
      ),
      "",
      "These are demo credentials. Do not use this data anywhere real.",
      "",
    ].join("\n")
  );
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
