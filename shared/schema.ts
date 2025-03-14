import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  numeric,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  name: text("name").notNull(),
  apartmentId: integer("apartment_id"),
});

export const towers = pgTable("towers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const apartments = pgTable("apartments", {
  id: serial("id").primaryKey(),
  number: text("number").notNull(),
  towerId: integer("tower_id").notNull(),
  floor: integer("floor").notNull(),
  type: text("type").notNull(), // "2BHK" or "3BHK"
  ownerName: text("owner_name"),
  status: text("status").notNull().default("OCCUPIED"), // "AVAILABLE_RENT", "AVAILABLE_SALE", "OCCUPIED"
  monthlyRent: numeric("monthly_rent"),
  salePrice: numeric("sale_price"),
  contactNumber: text("contact_number"),
});

export const amenities = pgTable("amenities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "GYM", "GUEST_HOUSE", "CLUBHOUSE"
  description: text("description"),
  maxCapacity: integer("max_capacity"),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amenityId: integer("amenity_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").notNull(), // "PENDING", "APPROVED", "REJECTED"
  deletedAt: timestamp("deleted_at"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const updateUserSchema = z.object({
  isAdmin: z.boolean(),
});
export const insertApartmentSchema = createInsertSchema(apartments);
export const updateApartmentSchema = z.object({
  ownerName: z.string().nullable(),
  status: z.enum(["AVAILABLE_RENT", "AVAILABLE_SALE", "OCCUPIED"]),
  monthlyRent: z
    .string()
    .nullable()
    .transform((val) => (val ? parseFloat(val) : null)),
  salePrice: z
    .string()
    .nullable()
    .transform((val) => (val ? parseFloat(val) : null)),
  contactNumber: z.string().nullable(),
});
export const insertBookingSchema = createInsertSchema(bookings)
  .omit({ id: true })
  .extend({
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
  });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Apartment = typeof apartments.$inferSelect;
export type Amenity = typeof amenities.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
