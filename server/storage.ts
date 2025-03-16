import {
  users,
  type User,
  type InsertUser,
  apartments,
  amenities,
  bookings,
  type Apartment,
  type Amenity,
  type Booking,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, lt, isNull } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Apartments
  getApartments(): Promise<Apartment[]>;
  getApartmentsByTower(towerId: number): Promise<Apartment[]>;
  updateApartment(id: number, data: Partial<Apartment>): Promise<Apartment>;

  // Amenities
  getAmenities(): Promise<Amenity[]>;
  getAmenity(id: number): Promise<Amenity | undefined>;

  // Bookings
  createBooking(booking: Omit<Booking, "id">): Promise<Booking>;
  getBookingsByUser(userId: number): Promise<Booking[]>;
  getBookingsByAmenity(amenityId: number): Promise<Booking[]>;
  updateBookingStatus(
    id: number,
    status: "APPROVED" | "REJECTED"
  ): Promise<Booking>;
  getAllBookings(): Promise<Booking[]>;
  removeExpiredBookings(): Promise<void>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getApartments(): Promise<Apartment[]> {
    return await db.select().from(apartments);
  }

  async getApartmentsByTower(towerId: number): Promise<Apartment[]> {
    return await db
      .select()
      .from(apartments)
      .where(eq(apartments.towerId, towerId));
  }

  async getAmenities(): Promise<Amenity[]> {
    return await db.select().from(amenities);
  }

  async getAmenity(id: number): Promise<Amenity | undefined> {
    const [amenity] = await db
      .select()
      .from(amenities)
      .where(eq(amenities.id, id));
    return amenity;
  }

  async createBooking(booking: Omit<Booking, "id">): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async getBookingsByUser(userId: number): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.userId, userId))
      .orderBy(bookings.startTime);
  }

  async getBookingsByAmenity(amenityId: number): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.amenityId, amenityId));
  }

  async updateApartment(
    id: number,
    data: Partial<Apartment>
  ): Promise<Apartment> {
    const [apartment] = await db
      .update(apartments)
      .set(data)
      .where(eq(apartments.id, id))
      .returning();
    return apartment;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateBookingStatus(
    id: number,
    status: "APPROVED" | "REJECTED"
  ): Promise<Booking> {
    const [booking] = await db
      .update(bookings)
      .set({
        status,
        deletedAt: status === "REJECTED" ? new Date() : null,
      })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async getAllBookings(): Promise<Booking[]> {
    return await db.select().from(bookings).where(isNull(bookings.deletedAt));
  }

  async removeExpiredBookings(): Promise<void> {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    await db
      .update(bookings)
      .set({
        status: "REJECTED",
        deletedAt: new Date(),
      })
      .where(
        and(
          eq(bookings.status, "PENDING"),
          lt(bookings.startTime, twentyFourHoursAgo),
          isNull(bookings.deletedAt)
        )
      );
  }
}

export const storage = new DatabaseStorage();
