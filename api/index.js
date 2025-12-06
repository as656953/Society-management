var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  amenities: () => amenities,
  apartments: () => apartments,
  bookings: () => bookings,
  changePasswordSchema: () => changePasswordSchema,
  checkoutVisitorSchema: () => checkoutVisitorSchema,
  complaintComments: () => complaintComments,
  complaints: () => complaints,
  insertAmenitySchema: () => insertAmenitySchema,
  insertApartmentSchema: () => insertApartmentSchema,
  insertBookingSchema: () => insertBookingSchema,
  insertComplaintCommentSchema: () => insertComplaintCommentSchema,
  insertComplaintSchema: () => insertComplaintSchema,
  insertNoticeSchema: () => insertNoticeSchema,
  insertNotificationSchema: () => insertNotificationSchema,
  insertPreApprovedVisitorSchema: () => insertPreApprovedVisitorSchema,
  insertUserSchema: () => insertUserSchema,
  insertVehicleSchema: () => insertVehicleSchema,
  insertVisitorSchema: () => insertVisitorSchema,
  notices: () => notices,
  notificationPreferences: () => notificationPreferences,
  notifications: () => notifications,
  preApprovedVisitors: () => preApprovedVisitors,
  towers: () => towers,
  updateAmenitySchema: () => updateAmenitySchema,
  updateApartmentSchema: () => updateApartmentSchema,
  updateComplaintSchema: () => updateComplaintSchema,
  updateNotificationPreferencesSchema: () => updateNotificationPreferencesSchema,
  updateProfileSchema: () => updateProfileSchema,
  updateUserRoleSchema: () => updateUserRoleSchema,
  updateUserSchema: () => updateUserSchema,
  updateVehicleSchema: () => updateVehicleSchema,
  users: () => users,
  vehicles: () => vehicles,
  visitors: () => visitors
});
import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  numeric
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users, towers, apartments, amenities, bookings, notices, visitors, preApprovedVisitors, complaints, complaintComments, vehicles, notifications, insertUserSchema, updateUserSchema, updateUserRoleSchema, insertApartmentSchema, updateApartmentSchema, insertBookingSchema, insertVisitorSchema, checkoutVisitorSchema, insertPreApprovedVisitorSchema, insertNoticeSchema, insertComplaintSchema, updateComplaintSchema, insertComplaintCommentSchema, updateProfileSchema, changePasswordSchema, insertVehicleSchema, updateVehicleSchema, insertAmenitySchema, updateAmenitySchema, insertNotificationSchema, notificationPreferences, updateNotificationPreferencesSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    users = pgTable("users", {
      id: serial("id").primaryKey(),
      username: text("username").notNull().unique(),
      password: text("password"),
      // Nullable for Google OAuth users
      isAdmin: boolean("is_admin").default(false).notNull(),
      // Legacy - use 'role' instead
      role: text("role").default("resident").notNull(),
      // 'admin', 'resident', 'guard'
      name: text("name").notNull(),
      apartmentId: integer("apartment_id"),
      residentType: text("resident_type"),
      // 'OWNER' or 'TENANT' - only set when apartmentId is assigned
      phone: text("phone"),
      // User's phone number
      // OAuth fields
      email: text("email").unique(),
      googleId: text("google_id").unique(),
      profilePicture: text("profile_picture"),
      authProvider: text("auth_provider").default("local").notNull()
      // 'local' or 'google'
    });
    towers = pgTable("towers", {
      id: serial("id").primaryKey(),
      name: text("name").notNull()
    });
    apartments = pgTable("apartments", {
      id: serial("id").primaryKey(),
      number: text("number").notNull(),
      towerId: integer("tower_id").notNull(),
      floor: integer("floor").notNull(),
      type: text("type").notNull(),
      // "2BHK" or "3BHK"
      ownerName: text("owner_name"),
      status: text("status").notNull().default("OCCUPIED"),
      // "AVAILABLE_RENT", "AVAILABLE_SALE", "OCCUPIED"
      monthlyRent: numeric("monthly_rent"),
      salePrice: numeric("sale_price"),
      contactNumber: text("contact_number")
    });
    amenities = pgTable("amenities", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      type: text("type").notNull(),
      // "GYM", "GUEST_HOUSE", "CLUBHOUSE"
      description: text("description"),
      maxCapacity: integer("max_capacity"),
      imageUrl: text("image_url"),
      isActive: boolean("is_active").default(true).notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    bookings = pgTable("bookings", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull(),
      amenityId: integer("amenity_id").notNull(),
      startTime: timestamp("start_time").notNull(),
      endTime: timestamp("end_time").notNull(),
      status: text("status").notNull(),
      // "PENDING", "APPROVED", "REJECTED"
      deletedAt: timestamp("deleted_at")
    });
    notices = pgTable("notices", {
      id: serial("id").primaryKey(),
      title: text("title").notNull(),
      content: text("content").notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull(),
      createdBy: integer("created_by").notNull().references(() => users.id),
      priority: text("priority").notNull().default("NORMAL"),
      // "HIGH", "NORMAL", "LOW"
      expiresAt: timestamp("expires_at"),
      isArchived: boolean("is_archived").default(false).notNull()
    });
    visitors = pgTable("visitors", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      mobileNumber: text("mobile_number").notNull(),
      purpose: text("purpose").notNull(),
      // 'personal', 'delivery', 'service', 'maintenance', 'family', 'other'
      apartmentId: integer("apartment_id").notNull(),
      vehicleNumber: text("vehicle_number"),
      photoUrl: text("photo_url"),
      entryTime: timestamp("entry_time").defaultNow().notNull(),
      exitTime: timestamp("exit_time"),
      status: text("status").default("inside").notNull(),
      // 'inside', 'checked_out'
      createdBy: integer("created_by").notNull(),
      // Guard who logged the entry
      notes: text("notes"),
      preApprovedVisitorId: integer("pre_approved_visitor_id")
      // Link to pre-approval if visitor was pre-approved
    });
    preApprovedVisitors = pgTable("pre_approved_visitors", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      mobileNumber: text("mobile_number"),
      purpose: text("purpose").notNull(),
      apartmentId: integer("apartment_id").notNull(),
      expectedDate: timestamp("expected_date").notNull(),
      expectedTimeFrom: text("expected_time_from"),
      // Store as text like "09:00"
      expectedTimeTo: text("expected_time_to"),
      numberOfPersons: integer("number_of_persons").default(1).notNull(),
      status: text("status").default("pending").notNull(),
      // 'pending', 'arrived', 'expired', 'cancelled', 'completed'
      createdBy: integer("created_by").notNull(),
      // Resident who created the pre-approval
      createdAt: timestamp("created_at").defaultNow().notNull(),
      notes: text("notes")
    });
    complaints = pgTable("complaints", {
      id: serial("id").primaryKey(),
      title: text("title").notNull(),
      description: text("description").notNull(),
      category: text("category").notNull(),
      // 'plumbing', 'electrical', 'civil', 'housekeeping', 'security', 'parking', 'noise', 'other'
      priority: text("priority").default("medium").notNull(),
      // 'low', 'medium', 'high', 'urgent'
      status: text("status").default("open").notNull(),
      // 'open', 'in_progress', 'resolved', 'closed', 'rejected'
      apartmentId: integer("apartment_id").notNull(),
      createdBy: integer("created_by").notNull(),
      assignedTo: integer("assigned_to"),
      // Admin who's handling it
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull(),
      resolvedAt: timestamp("resolved_at"),
      resolutionNotes: text("resolution_notes")
    });
    complaintComments = pgTable("complaint_comments", {
      id: serial("id").primaryKey(),
      complaintId: integer("complaint_id").notNull(),
      userId: integer("user_id").notNull(),
      comment: text("comment").notNull(),
      isInternal: boolean("is_internal").default(false).notNull(),
      // Internal notes visible only to admin
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    vehicles = pgTable("vehicles", {
      id: serial("id").primaryKey(),
      apartmentId: integer("apartment_id").notNull(),
      vehicleType: text("vehicle_type").notNull(),
      // 'car', 'bike', 'scooter', 'other'
      vehicleNumber: text("vehicle_number").notNull(),
      makeModel: text("make_model"),
      color: text("color"),
      parkingSlot: text("parking_slot"),
      isPrimary: boolean("is_primary").default(false).notNull(),
      registeredBy: integer("registered_by").notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    notifications = pgTable("notifications", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull(),
      // User who receives the notification
      type: text("type").notNull(),
      // 'booking', 'complaint', 'notice', 'visitor', 'system'
      title: text("title").notNull(),
      message: text("message").notNull(),
      link: text("link"),
      // URL to navigate to when clicked
      isRead: boolean("is_read").default(false).notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    insertUserSchema = createInsertSchema(users).omit({ id: true });
    updateUserSchema = z.object({
      isAdmin: z.boolean()
    });
    updateUserRoleSchema = z.object({
      role: z.enum(["admin", "resident", "guard"])
    });
    insertApartmentSchema = createInsertSchema(apartments);
    updateApartmentSchema = z.object({
      ownerName: z.string().nullable(),
      status: z.enum(["AVAILABLE_RENT", "AVAILABLE_SALE", "OCCUPIED"]),
      monthlyRent: z.string().nullable(),
      salePrice: z.string().nullable(),
      contactNumber: z.string().nullable()
    });
    insertBookingSchema = createInsertSchema(bookings).omit({ id: true }).extend({
      startTime: z.coerce.date(),
      endTime: z.coerce.date()
    });
    insertVisitorSchema = createInsertSchema(visitors).omit({
      id: true,
      entryTime: true,
      exitTime: true,
      status: true
    });
    checkoutVisitorSchema = z.object({
      notes: z.string().optional()
    });
    insertPreApprovedVisitorSchema = createInsertSchema(preApprovedVisitors).omit({
      id: true,
      status: true,
      createdAt: true
    }).extend({
      expectedDate: z.coerce.date()
    });
    insertNoticeSchema = createInsertSchema(notices).omit({
      id: true
    });
    insertComplaintSchema = createInsertSchema(complaints).omit({
      id: true,
      status: true,
      assignedTo: true,
      createdAt: true,
      updatedAt: true,
      resolvedAt: true,
      resolutionNotes: true
    });
    updateComplaintSchema = z.object({
      status: z.enum(["open", "in_progress", "resolved", "closed", "rejected"]).optional(),
      assignedTo: z.number().nullable().optional(),
      resolutionNotes: z.string().optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional()
    });
    insertComplaintCommentSchema = createInsertSchema(complaintComments).omit({
      id: true,
      createdAt: true
    });
    updateProfileSchema = z.object({
      name: z.string().min(1, "Name is required").optional(),
      email: z.string().email("Invalid email").optional().nullable(),
      phone: z.string().optional().nullable(),
      profilePicture: z.string().optional().nullable()
    });
    changePasswordSchema = z.object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: z.string().min(6, "Password must be at least 6 characters"),
      confirmPassword: z.string()
    }).refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"]
    });
    insertVehicleSchema = createInsertSchema(vehicles).omit({
      id: true,
      createdAt: true
    });
    updateVehicleSchema = z.object({
      vehicleType: z.enum(["car", "bike", "scooter", "other"]).optional(),
      vehicleNumber: z.string().min(1).optional(),
      makeModel: z.string().optional().nullable(),
      color: z.string().optional().nullable(),
      parkingSlot: z.string().optional().nullable(),
      isPrimary: z.boolean().optional()
    });
    insertAmenitySchema = createInsertSchema(amenities).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    updateAmenitySchema = z.object({
      name: z.string().min(1).optional(),
      type: z.string().optional(),
      description: z.string().optional().nullable(),
      maxCapacity: z.number().optional().nullable(),
      imageUrl: z.string().optional().nullable(),
      isActive: z.boolean().optional()
    });
    insertNotificationSchema = createInsertSchema(notifications).omit({
      id: true,
      createdAt: true,
      isRead: true
    });
    notificationPreferences = pgTable("notification_preferences", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().unique(),
      // One preference set per user
      // In-app notification preferences
      bookingNotifications: boolean("booking_notifications").default(true).notNull(),
      complaintNotifications: boolean("complaint_notifications").default(true).notNull(),
      visitorNotifications: boolean("visitor_notifications").default(true).notNull(),
      noticeNotifications: boolean("notice_notifications").default(true).notNull(),
      systemNotifications: boolean("system_notifications").default(true).notNull(),
      // Email notification preferences (for future email integration)
      emailBookingNotifications: boolean("email_booking_notifications").default(false).notNull(),
      emailComplaintNotifications: boolean("email_complaint_notifications").default(false).notNull(),
      emailVisitorNotifications: boolean("email_visitor_notifications").default(false).notNull(),
      emailNoticeNotifications: boolean("email_notice_notifications").default(true).notNull(),
      emailEmergencyNotifications: boolean("email_emergency_notifications").default(true).notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    updateNotificationPreferencesSchema = z.object({
      bookingNotifications: z.boolean().optional(),
      complaintNotifications: z.boolean().optional(),
      visitorNotifications: z.boolean().optional(),
      noticeNotifications: z.boolean().optional(),
      systemNotifications: z.boolean().optional(),
      emailBookingNotifications: z.boolean().optional(),
      emailComplaintNotifications: z.boolean().optional(),
      emailVisitorNotifications: z.boolean().optional(),
      emailNoticeNotifications: z.boolean().optional(),
      emailEmergencyNotifications: z.boolean().optional()
    });
  }
});

// server/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
function getPool() {
  if (!_pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    _pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 1,
      idleTimeoutMillis: 2e4,
      connectionTimeoutMillis: 1e4
    });
  }
  return _pool;
}
function getDb() {
  if (!_db) {
    _db = drizzle(getPool(), { schema: schema_exports });
  }
  return _db;
}
var _pool, _db, pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    _pool = null;
    _db = null;
    pool = new Proxy({}, {
      get(_, prop) {
        return getPool()[prop];
      }
    });
    db = new Proxy({}, {
      get(_, prop) {
        return getDb()[prop];
      }
    });
  }
});

// server/storage.ts
var storage_exports = {};
__export(storage_exports, {
  DatabaseStorage: () => DatabaseStorage,
  storage: () => storage
});
import { eq, and, lt, isNull, isNotNull, desc, gte } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import createMemoryStore from "memorystore";
var PostgresSessionStore, MemoryStore, isProduction, DatabaseStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_schema();
    init_db();
    PostgresSessionStore = connectPg(session);
    MemoryStore = createMemoryStore(session);
    isProduction = process.env.NODE_ENV === "production";
    DatabaseStorage = class {
      sessionStore;
      constructor() {
        this.sessionStore = isProduction ? new MemoryStore({
          checkPeriod: 864e5
          // prune expired entries every 24h
        }) : new PostgresSessionStore({
          pool,
          createTableIfMissing: true
        });
      }
      async getUser(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
      }
      async getUserByUsername(username) {
        const [user] = await db.select().from(users).where(eq(users.username, username));
        return user;
      }
      async getUserByGoogleId(googleId) {
        const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
        return user;
      }
      async getUserByEmail(email) {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        return user;
      }
      async createUser(insertUser) {
        const [user] = await db.insert(users).values(insertUser).returning();
        return user;
      }
      // User-Apartment Assignment Methods
      async assignApartment(userId, apartmentId, residentType) {
        const [user] = await db.update(users).set({ apartmentId, residentType }).where(eq(users.id, userId)).returning();
        return user;
      }
      async removeApartmentAssignment(userId) {
        const [user] = await db.update(users).set({ apartmentId: null, residentType: null }).where(eq(users.id, userId)).returning();
        return user;
      }
      async getUsersByApartment(apartmentId) {
        return await db.select().from(users).where(eq(users.apartmentId, apartmentId));
      }
      async getUsersWithoutApartment() {
        return await db.select().from(users).where(isNull(users.apartmentId));
      }
      async getTower(id) {
        const [tower] = await db.select().from(towers).where(eq(towers.id, id));
        return tower;
      }
      async getTowers() {
        return await db.select().from(towers);
      }
      async getApartments() {
        return await db.select().from(apartments);
      }
      async getApartment(id) {
        const [apartment] = await db.select().from(apartments).where(eq(apartments.id, id));
        return apartment;
      }
      async getApartmentsByTower(towerId) {
        return await db.select().from(apartments).where(eq(apartments.towerId, towerId));
      }
      async getAmenities() {
        return await db.select().from(amenities).where(eq(amenities.isActive, true));
      }
      async getAllAmenities() {
        return await db.select().from(amenities);
      }
      async getAmenity(id) {
        const [amenity] = await db.select().from(amenities).where(eq(amenities.id, id));
        return amenity;
      }
      async createAmenity(amenity) {
        const [newAmenity] = await db.insert(amenities).values(amenity).returning();
        return newAmenity;
      }
      async updateAmenity(id, data) {
        const [amenity] = await db.update(amenities).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(amenities.id, id)).returning();
        return amenity;
      }
      async deleteAmenity(id) {
        await db.update(amenities).set({ isActive: false, updatedAt: /* @__PURE__ */ new Date() }).where(eq(amenities.id, id));
      }
      async createBooking(booking) {
        const [newBooking] = await db.insert(bookings).values(booking).returning();
        return newBooking;
      }
      async getBookingsByUser(userId) {
        return await db.select().from(bookings).where(eq(bookings.userId, userId)).orderBy(bookings.startTime);
      }
      async getBookingsByAmenity(amenityId) {
        return await db.select().from(bookings).where(eq(bookings.amenityId, amenityId));
      }
      async updateApartment(id, data) {
        const [apartment] = await db.update(apartments).set(data).where(eq(apartments.id, id)).returning();
        return apartment;
      }
      async updateUser(id, data) {
        const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
        return user;
      }
      async getAllUsers() {
        return await db.select().from(users);
      }
      async updateBookingStatus(id, status) {
        const [booking] = await db.update(bookings).set({
          status,
          deletedAt: status === "REJECTED" ? /* @__PURE__ */ new Date() : null
        }).where(eq(bookings.id, id)).returning();
        return booking;
      }
      async getAllBookings() {
        return await db.select().from(bookings).where(isNull(bookings.deletedAt));
      }
      async removeExpiredBookings() {
        const twentyFourHoursAgo = /* @__PURE__ */ new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
        await db.update(bookings).set({
          status: "REJECTED",
          deletedAt: /* @__PURE__ */ new Date()
        }).where(
          and(
            eq(bookings.status, "PENDING"),
            lt(bookings.startTime, twentyFourHoursAgo),
            isNull(bookings.deletedAt)
          )
        );
      }
      async deleteUser(id) {
        await db.delete(users).where(eq(users.id, id));
      }
      async createNotice(notice) {
        const [newNotice] = await db.insert(notices).values(notice).returning();
        return newNotice;
      }
      async getNotices() {
        return await db.select().from(notices).where(eq(notices.isArchived, false));
      }
      async getActiveNotices() {
        const now = /* @__PURE__ */ new Date();
        const allNotices = await db.select().from(notices).where(eq(notices.isArchived, false));
        return allNotices.filter((n) => !n.expiresAt || new Date(n.expiresAt) > now);
      }
      async getArchivedNotices() {
        return await db.select().from(notices).where(eq(notices.isArchived, true));
      }
      async deleteNotice(id) {
        await db.delete(notices).where(eq(notices.id, id));
      }
      async archiveExpiredNotices() {
        const now = /* @__PURE__ */ new Date();
        await db.update(notices).set({ isArchived: true }).where(
          and(
            isNotNull(notices.expiresAt),
            lt(notices.expiresAt, now),
            eq(notices.isArchived, false)
          )
        );
      }
      // Visitor Methods
      async createVisitor(visitor) {
        const [newVisitor] = await db.insert(visitors).values(visitor).returning();
        return newVisitor;
      }
      async getVisitor(id) {
        const [visitor] = await db.select().from(visitors).where(eq(visitors.id, id));
        return visitor;
      }
      async getActiveVisitors() {
        return await db.select().from(visitors).where(eq(visitors.status, "inside")).orderBy(desc(visitors.entryTime));
      }
      async getAllVisitors() {
        return await db.select().from(visitors).orderBy(desc(visitors.entryTime));
      }
      async getVisitorsByApartment(apartmentId) {
        return await db.select().from(visitors).where(eq(visitors.apartmentId, apartmentId)).orderBy(desc(visitors.entryTime));
      }
      async checkoutVisitor(id, notes) {
        const updateData = {
          status: "checked_out",
          exitTime: /* @__PURE__ */ new Date()
        };
        if (notes) {
          updateData.notes = notes;
        }
        const [visitor] = await db.update(visitors).set(updateData).where(eq(visitors.id, id)).returning();
        if (visitor.preApprovedVisitorId) {
          await db.update(preApprovedVisitors).set({ status: "completed" }).where(eq(preApprovedVisitors.id, visitor.preApprovedVisitorId));
        }
        return visitor;
      }
      async getTodayVisitors() {
        const today = /* @__PURE__ */ new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return await db.select().from(visitors).where(
          and(
            gte(visitors.entryTime, today),
            lt(visitors.entryTime, tomorrow)
          )
        ).orderBy(desc(visitors.entryTime));
      }
      // Pre-approved Visitor Methods
      async createPreApprovedVisitor(visitor) {
        const [newVisitor] = await db.insert(preApprovedVisitors).values(visitor).returning();
        return newVisitor;
      }
      async getPreApprovedVisitor(id) {
        const [visitor] = await db.select().from(preApprovedVisitors).where(eq(preApprovedVisitors.id, id));
        return visitor;
      }
      async getPreApprovedVisitorsByApartment(apartmentId) {
        return await db.select().from(preApprovedVisitors).where(eq(preApprovedVisitors.apartmentId, apartmentId)).orderBy(desc(preApprovedVisitors.expectedDate));
      }
      async getPendingPreApprovedVisitors() {
        const today = /* @__PURE__ */ new Date();
        today.setHours(0, 0, 0, 0);
        return await db.select().from(preApprovedVisitors).where(
          and(
            eq(preApprovedVisitors.status, "pending"),
            gte(preApprovedVisitors.expectedDate, today)
          )
        ).orderBy(preApprovedVisitors.expectedDate);
      }
      async updatePreApprovedVisitorStatus(id, status) {
        const [visitor] = await db.update(preApprovedVisitors).set({ status }).where(eq(preApprovedVisitors.id, id)).returning();
        return visitor;
      }
      async cancelPreApprovedVisitor(id) {
        await db.update(preApprovedVisitors).set({ status: "cancelled" }).where(eq(preApprovedVisitors.id, id));
      }
      async expireOldPreApprovals() {
        const today = /* @__PURE__ */ new Date();
        today.setHours(0, 0, 0, 0);
        const toExpire = await db.select().from(preApprovedVisitors).where(
          and(
            eq(preApprovedVisitors.status, "pending"),
            lt(preApprovedVisitors.expectedDate, today)
          )
        );
        if (toExpire.length > 0) {
          await db.update(preApprovedVisitors).set({ status: "expired" }).where(
            and(
              eq(preApprovedVisitors.status, "pending"),
              lt(preApprovedVisitors.expectedDate, today)
            )
          );
        }
        return toExpire;
      }
      // Complaint Methods
      async createComplaint(complaint) {
        const [newComplaint] = await db.insert(complaints).values(complaint).returning();
        return newComplaint;
      }
      async getComplaint(id) {
        const [complaint] = await db.select().from(complaints).where(eq(complaints.id, id));
        return complaint;
      }
      async getAllComplaints() {
        return await db.select().from(complaints).orderBy(desc(complaints.createdAt));
      }
      async getComplaintsByApartment(apartmentId) {
        return await db.select().from(complaints).where(eq(complaints.apartmentId, apartmentId)).orderBy(desc(complaints.createdAt));
      }
      async getComplaintsByUser(userId) {
        return await db.select().from(complaints).where(eq(complaints.createdBy, userId)).orderBy(desc(complaints.createdAt));
      }
      async updateComplaint(id, data) {
        const updateData = {
          ...data,
          updatedAt: /* @__PURE__ */ new Date()
        };
        if (data.status === "resolved" || data.status === "closed") {
          updateData.resolvedAt = /* @__PURE__ */ new Date();
        }
        const [complaint] = await db.update(complaints).set(updateData).where(eq(complaints.id, id)).returning();
        return complaint;
      }
      // Complaint Comment Methods
      async createComplaintComment(comment) {
        const [newComment] = await db.insert(complaintComments).values(comment).returning();
        return newComment;
      }
      async getComplaintComments(complaintId, includeInternal) {
        if (includeInternal) {
          return await db.select().from(complaintComments).where(eq(complaintComments.complaintId, complaintId)).orderBy(complaintComments.createdAt);
        }
        return await db.select().from(complaintComments).where(
          and(
            eq(complaintComments.complaintId, complaintId),
            eq(complaintComments.isInternal, false)
          )
        ).orderBy(complaintComments.createdAt);
      }
      // Vehicle Methods
      async createVehicle(vehicle) {
        const [newVehicle] = await db.insert(vehicles).values(vehicle).returning();
        return newVehicle;
      }
      async getVehicle(id) {
        const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
        return vehicle;
      }
      async getVehiclesByApartment(apartmentId) {
        return await db.select().from(vehicles).where(eq(vehicles.apartmentId, apartmentId)).orderBy(desc(vehicles.createdAt));
      }
      async getAllVehicles() {
        return await db.select().from(vehicles).orderBy(desc(vehicles.createdAt));
      }
      async updateVehicle(id, data) {
        const [vehicle] = await db.update(vehicles).set(data).where(eq(vehicles.id, id)).returning();
        return vehicle;
      }
      async deleteVehicle(id) {
        await db.delete(vehicles).where(eq(vehicles.id, id));
      }
      // Notification Methods
      async createNotification(notification) {
        const [newNotification] = await db.insert(notifications).values(notification).returning();
        return newNotification;
      }
      async getNotificationsByUser(userId) {
        return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
      }
      async getUnreadNotificationCount(userId) {
        const result = await db.select().from(notifications).where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false)
          )
        );
        return result.length;
      }
      async markNotificationAsRead(id) {
        const [notification] = await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id)).returning();
        return notification;
      }
      async markAllNotificationsAsRead(userId) {
        await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
      }
      async deleteNotification(id) {
        await db.delete(notifications).where(eq(notifications.id, id));
      }
      async deleteOldNotifications(daysOld) {
        const cutoffDate = /* @__PURE__ */ new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        await db.delete(notifications).where(lt(notifications.createdAt, cutoffDate));
      }
      // Notification Preferences Methods
      async getNotificationPreferences(userId) {
        const [prefs] = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId));
        return prefs;
      }
      async createNotificationPreferences(userId) {
        const [prefs] = await db.insert(notificationPreferences).values({ userId }).returning();
        return prefs;
      }
      async updateNotificationPreferences(userId, data) {
        let prefs = await this.getNotificationPreferences(userId);
        if (!prefs) {
          prefs = await this.createNotificationPreferences(userId);
        }
        const [updated] = await db.update(notificationPreferences).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(notificationPreferences.userId, userId)).returning();
        return updated;
      }
      async shouldSendNotification(userId, type) {
        const prefs = await this.getNotificationPreferences(userId);
        if (!prefs) return true;
        switch (type) {
          case "booking":
            return prefs.bookingNotifications;
          case "complaint":
            return prefs.complaintNotifications;
          case "visitor":
            return prefs.visitorNotifications;
          case "notice":
            return prefs.noticeNotifications;
          case "system":
            return prefs.systemNotifications;
          default:
            return true;
        }
      }
    };
    storage = new DatabaseStorage();
  }
});

// server/auth.ts
var auth_exports = {};
__export(auth_exports, {
  setupAuth: () => setupAuth
});
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  if (!stored) return false;
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !await comparePasswords(password, user.password)) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    })
  );
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback"
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            let user = await storage.getUserByGoogleId(profile.id);
            if (user) {
              if (profile.photos?.[0]?.value !== user.profilePicture) {
                user = await storage.updateUser(user.id, {
                  profilePicture: profile.photos?.[0]?.value || null
                });
              }
              return done(null, user);
            }
            const email = profile.emails?.[0]?.value;
            if (email) {
              const existingUser = await storage.getUserByEmail(email);
              if (existingUser) {
                user = await storage.updateUser(existingUser.id, {
                  googleId: profile.id,
                  profilePicture: profile.photos?.[0]?.value || null
                });
                return done(null, user);
              }
            }
            const newUser = await storage.createUser({
              username: email || `google_${profile.id}`,
              name: profile.displayName || "Google User",
              email: email || null,
              googleId: profile.id,
              profilePicture: profile.photos?.[0]?.value || null,
              authProvider: "google",
              password: null
              // No password for Google users
            });
            return done(null, newUser);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
    console.log("Google OAuth strategy initialized");
  } else {
    console.log("Google OAuth credentials not configured - Google login disabled");
  }
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });
  app2.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }
    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password)
    });
    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });
  app2.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
  app2.get("/api/auth/google", passport.authenticate("google", {
    scope: ["profile", "email"]
  }));
  app2.get(
    "/api/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/auth?error=google_auth_failed"
    }),
    (req, res) => {
      res.redirect("/");
    }
  );
  app2.get("/api/auth/google/status", (req, res) => {
    res.json({
      enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
    });
  });
}
var scryptAsync;
var init_auth = __esm({
  "server/auth.ts"() {
    "use strict";
    init_storage();
    scryptAsync = promisify(scrypt);
  }
});

// server/routes/notifications.ts
import { ZodError } from "zod";
function registerNotificationRoutes(app2) {
  app2.get("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const notifications2 = await storage.getNotificationsByUser(req.user.id);
      res.json(notifications2);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });
  app2.get("/api/notifications/unread-count", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const count = await storage.getUnreadNotificationCount(req.user.id);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });
  app2.patch("/api/notifications/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const notificationId = parseInt(req.params.id);
    try {
      const notification = await storage.markNotificationAsRead(notificationId);
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });
  app2.patch("/api/notifications/read-all", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      await storage.markAllNotificationsAsRead(req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ error: "Failed to mark notifications as read" });
    }
  });
  app2.delete("/api/notifications/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const notificationId = parseInt(req.params.id);
    try {
      await storage.deleteNotification(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });
  app2.get("/api/notifications/preferences", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      let prefs = await storage.getNotificationPreferences(req.user.id);
      if (!prefs) {
        prefs = {
          id: 0,
          userId: req.user.id,
          bookingNotifications: true,
          complaintNotifications: true,
          visitorNotifications: true,
          noticeNotifications: true,
          systemNotifications: true,
          emailBookingNotifications: false,
          emailComplaintNotifications: false,
          emailVisitorNotifications: false,
          emailNoticeNotifications: true,
          emailEmergencyNotifications: true,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
      }
      res.json(prefs);
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      res.status(500).json({ error: "Failed to fetch notification preferences" });
    }
  });
  app2.patch("/api/notifications/preferences", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const updateData = updateNotificationPreferencesSchema.parse(req.body);
      const prefs = await storage.updateNotificationPreferences(req.user.id, updateData);
      res.json(prefs);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json(error.errors);
      } else {
        console.error("Error updating notification preferences:", error);
        res.status(500).json({ error: "Failed to update notification preferences" });
      }
    }
  });
}
async function createNotification(data) {
  try {
    const shouldSend = await storage.shouldSendNotification(data.userId, data.type);
    if (!shouldSend) {
      console.log(`Notification skipped for user ${data.userId} - type ${data.type} is disabled`);
      return;
    }
    await storage.createNotification(data);
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}
async function notifyAdmins(type, title, message, link) {
  try {
    const users2 = await storage.getAllUsers();
    const admins = users2.filter((u) => u.role === "admin" || u.isAdmin);
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type,
        title,
        message,
        link: link || null
      });
    }
  } catch (error) {
    console.error("Error notifying admins:", error);
  }
}
async function notifyApartmentResidents(apartmentId, type, title, message, link, excludeUserId) {
  try {
    const residents = await storage.getUsersByApartment(apartmentId);
    for (const resident of residents) {
      if (excludeUserId && resident.id === excludeUserId) continue;
      await createNotification({
        userId: resident.id,
        type,
        title,
        message,
        link: link || null
      });
    }
  } catch (error) {
    console.error("Error notifying apartment residents:", error);
  }
}
var init_notifications = __esm({
  "server/routes/notifications.ts"() {
    "use strict";
    init_storage();
    init_schema();
  }
});

// server/routes/visitors.ts
import { ZodError as ZodError2 } from "zod";
function registerVisitorRoutes(app2) {
  const isGuardOrAdmin = (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user?.role !== "guard" && req.user?.role !== "admin" && !req.user?.isAdmin) {
      return res.sendStatus(403);
    }
    next();
  };
  const isResident = (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.apartmentId) {
      return res.status(403).json({ error: "You must have an apartment assigned to manage visitors" });
    }
    next();
  };
  app2.post("/api/visitors", isGuardOrAdmin, async (req, res) => {
    try {
      const visitorData = insertVisitorSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      const visitor = await storage.createVisitor(visitorData);
      const apartment = await storage.getApartment(visitor.apartmentId);
      await notifyApartmentResidents(
        visitor.apartmentId,
        "visitor",
        "Visitor Arrived",
        `${visitor.name} (${visitor.purpose}) has arrived at your apartment${apartment ? ` (${apartment.number})` : ""}.`,
        "/visitors"
      );
      res.status(201).json(visitor);
    } catch (error) {
      if (error instanceof ZodError2) {
        res.status(400).json(error.errors);
      } else {
        console.error("Error creating visitor:", error);
        res.status(500).send("Internal server error");
      }
    }
  });
  app2.get("/api/visitors/active", isGuardOrAdmin, async (_req, res) => {
    try {
      const visitors2 = await storage.getActiveVisitors();
      res.json(visitors2);
    } catch (error) {
      console.error("Error fetching active visitors:", error);
      res.status(500).send("Internal server error");
    }
  });
  app2.get("/api/visitors/today", isGuardOrAdmin, async (_req, res) => {
    try {
      const visitors2 = await storage.getTodayVisitors();
      res.json(visitors2);
    } catch (error) {
      console.error("Error fetching today's visitors:", error);
      res.status(500).send("Internal server error");
    }
  });
  app2.get("/api/visitors/apartment/:apartmentId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const apartmentId = parseInt(req.params.apartmentId);
    const isGuard = req.user?.role === "guard" || req.user?.role === "admin" || req.user?.isAdmin;
    const isOwnApartment = req.user?.apartmentId === apartmentId;
    if (!isGuard && !isOwnApartment) {
      return res.sendStatus(403);
    }
    try {
      const visitors2 = await storage.getVisitorsByApartment(apartmentId);
      res.json(visitors2);
    } catch (error) {
      console.error("Error fetching apartment visitors:", error);
      res.status(500).send("Internal server error");
    }
  });
  app2.patch("/api/visitors/:id/checkout", isGuardOrAdmin, async (req, res) => {
    try {
      const visitorId = parseInt(req.params.id);
      const { notes } = checkoutVisitorSchema.parse(req.body);
      const visitor = await storage.getVisitor(visitorId);
      if (!visitor) {
        return res.status(404).json({ error: "Visitor not found" });
      }
      if (visitor.status === "checked_out") {
        return res.status(400).json({ error: "Visitor already checked out" });
      }
      const updatedVisitor = await storage.checkoutVisitor(visitorId, notes);
      res.json(updatedVisitor);
    } catch (error) {
      if (error instanceof ZodError2) {
        res.status(400).json(error.errors);
      } else {
        console.error("Error checking out visitor:", error);
        res.status(500).send("Internal server error");
      }
    }
  });
  app2.get("/api/visitors/:id", isGuardOrAdmin, async (req, res) => {
    try {
      const visitorId = parseInt(req.params.id);
      const visitor = await storage.getVisitor(visitorId);
      if (!visitor) {
        return res.status(404).json({ error: "Visitor not found" });
      }
      res.json(visitor);
    } catch (error) {
      console.error("Error fetching visitor:", error);
      res.status(500).send("Internal server error");
    }
  });
  app2.post("/api/pre-approved-visitors", isResident, async (req, res) => {
    try {
      const visitorData = insertPreApprovedVisitorSchema.parse({
        ...req.body,
        apartmentId: req.user.apartmentId,
        createdBy: req.user.id
      });
      const visitor = await storage.createPreApprovedVisitor(visitorData);
      res.status(201).json(visitor);
    } catch (error) {
      if (error instanceof ZodError2) {
        res.status(400).json(error.errors);
      } else {
        console.error("Error creating pre-approved visitor:", error);
        res.status(500).send("Internal server error");
      }
    }
  });
  app2.get("/api/pre-approved-visitors/my", isResident, async (req, res) => {
    try {
      const visitors2 = await storage.getPreApprovedVisitorsByApartment(req.user.apartmentId);
      res.json(visitors2);
    } catch (error) {
      console.error("Error fetching pre-approved visitors:", error);
      res.status(500).send("Internal server error");
    }
  });
  app2.get("/api/pre-approved-visitors/pending", isGuardOrAdmin, async (_req, res) => {
    try {
      const visitors2 = await storage.getPendingPreApprovedVisitors();
      res.json(visitors2);
    } catch (error) {
      console.error("Error fetching pending pre-approved visitors:", error);
      res.status(500).send("Internal server error");
    }
  });
  app2.get("/api/pre-approved-visitors/apartment/:apartmentId", isGuardOrAdmin, async (req, res) => {
    try {
      const apartmentId = parseInt(req.params.apartmentId);
      const visitors2 = await storage.getPreApprovedVisitorsByApartment(apartmentId);
      res.json(visitors2);
    } catch (error) {
      console.error("Error fetching pre-approved visitors:", error);
      res.status(500).send("Internal server error");
    }
  });
  app2.patch("/api/pre-approved-visitors/:id/status", isGuardOrAdmin, async (req, res) => {
    try {
      const visitorId = parseInt(req.params.id);
      const { status } = req.body;
      if (!["arrived", "expired", "cancelled"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const preApprovedVisitor = await storage.getPreApprovedVisitor(visitorId);
      if (!preApprovedVisitor) {
        return res.status(404).json({ error: "Pre-approved visitor not found" });
      }
      if (status === "arrived") {
        await storage.createVisitor({
          name: preApprovedVisitor.name,
          mobileNumber: preApprovedVisitor.mobileNumber || "N/A",
          purpose: preApprovedVisitor.purpose,
          apartmentId: preApprovedVisitor.apartmentId,
          vehicleNumber: null,
          notes: preApprovedVisitor.notes || `Pre-approved visitor (${preApprovedVisitor.numberOfPersons} person(s))`,
          createdBy: req.user.id,
          preApprovedVisitorId: preApprovedVisitor.id
          // Link to pre-approval
        });
        const apartment = await storage.getApartment(preApprovedVisitor.apartmentId);
        await createNotification({
          userId: preApprovedVisitor.createdBy,
          type: "visitor",
          title: "Pre-Approved Visitor Arrived",
          message: `Your pre-approved visitor ${preApprovedVisitor.name} (${preApprovedVisitor.purpose}) has checked in${apartment ? ` at ${apartment.number}` : ""}.`,
          link: "/visitors"
        });
      }
      const updatedVisitor = await storage.updatePreApprovedVisitorStatus(visitorId, status);
      res.json(updatedVisitor);
    } catch (error) {
      console.error("Error updating pre-approved visitor status:", error);
      res.status(500).send("Internal server error");
    }
  });
  app2.delete("/api/pre-approved-visitors/:id", isResident, async (req, res) => {
    try {
      const visitorId = parseInt(req.params.id);
      const visitor = await storage.getPreApprovedVisitor(visitorId);
      if (!visitor) {
        return res.status(404).json({ error: "Pre-approved visitor not found" });
      }
      if (visitor.apartmentId !== req.user.apartmentId) {
        return res.sendStatus(403);
      }
      await storage.cancelPreApprovedVisitor(visitorId);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error cancelling pre-approved visitor:", error);
      res.status(500).send("Internal server error");
    }
  });
}
var init_visitors = __esm({
  "server/routes/visitors.ts"() {
    "use strict";
    init_storage();
    init_schema();
    init_notifications();
  }
});

// server/routes/complaints.ts
import { ZodError as ZodError3 } from "zod";
function registerComplaintRoutes(app2) {
  const isResident = (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.apartmentId) {
      return res.status(403).json({ error: "You must have an apartment assigned to file complaints" });
    }
    next();
  };
  const isAdmin2 = (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user?.role !== "admin" && !req.user?.isAdmin) {
      return res.sendStatus(403);
    }
    next();
  };
  app2.post("/api/complaints", isResident, async (req, res) => {
    try {
      const complaintData = insertComplaintSchema.parse({
        ...req.body,
        apartmentId: req.user.apartmentId,
        createdBy: req.user.id
      });
      const complaint = await storage.createComplaint(complaintData);
      const apartment = await storage.getApartment(req.user.apartmentId);
      await notifyAdmins(
        "complaint",
        "New Complaint Filed",
        `${req.user.name} from ${apartment?.number || "unknown"} filed a ${complaint.priority} priority ${complaint.category} complaint: ${complaint.title}`,
        "/admin/complaints"
      );
      res.status(201).json(complaint);
    } catch (error) {
      if (error instanceof ZodError3) {
        res.status(400).json(error.errors);
      } else {
        console.error("Error creating complaint:", error);
        res.status(500).send("Internal server error");
      }
    }
  });
  app2.get("/api/complaints", isAdmin2, async (_req, res) => {
    try {
      const complaints2 = await storage.getAllComplaints();
      res.json(complaints2);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      res.status(500).send("Internal server error");
    }
  });
  app2.get("/api/complaints/my", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const complaints2 = await storage.getComplaintsByUser(req.user.id);
      res.json(complaints2);
    } catch (error) {
      console.error("Error fetching my complaints:", error);
      res.status(500).send("Internal server error");
    }
  });
  app2.get("/api/complaints/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const complaintId = parseInt(req.params.id);
      const complaint = await storage.getComplaint(complaintId);
      if (!complaint) {
        return res.status(404).json({ error: "Complaint not found" });
      }
      const isAdminUser = req.user?.role === "admin" || req.user?.isAdmin;
      const isOwner = complaint.createdBy === req.user.id;
      if (!isAdminUser && !isOwner) {
        return res.sendStatus(403);
      }
      res.json(complaint);
    } catch (error) {
      console.error("Error fetching complaint:", error);
      res.status(500).send("Internal server error");
    }
  });
  app2.patch("/api/complaints/:id", isAdmin2, async (req, res) => {
    try {
      const complaintId = parseInt(req.params.id);
      const updateData = updateComplaintSchema.parse(req.body);
      const complaint = await storage.getComplaint(complaintId);
      if (!complaint) {
        return res.status(404).json({ error: "Complaint not found" });
      }
      const oldStatus = complaint.status;
      const updatedComplaint = await storage.updateComplaint(complaintId, updateData);
      if (updateData.status && updateData.status !== oldStatus) {
        const statusMessages = {
          in_progress: "is now being worked on",
          resolved: "has been resolved",
          closed: "has been closed",
          rejected: "has been rejected"
        };
        const message = statusMessages[updateData.status] || `status changed to ${updateData.status}`;
        await createNotification({
          userId: complaint.createdBy,
          type: "complaint",
          title: "Complaint Status Updated",
          message: `Your complaint "${complaint.title}" ${message}.`,
          link: "/complaints"
        });
      }
      res.json(updatedComplaint);
    } catch (error) {
      if (error instanceof ZodError3) {
        res.status(400).json(error.errors);
      } else {
        console.error("Error updating complaint:", error);
        res.status(500).send("Internal server error");
      }
    }
  });
  app2.post("/api/complaints/:id/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const complaintId = parseInt(req.params.id);
      const complaint = await storage.getComplaint(complaintId);
      if (!complaint) {
        return res.status(404).json({ error: "Complaint not found" });
      }
      const isAdminUser = req.user?.role === "admin" || req.user?.isAdmin;
      const isOwner = complaint.createdBy === req.user.id;
      if (!isAdminUser && !isOwner) {
        return res.sendStatus(403);
      }
      const isInternal = isAdminUser && req.body.isInternal === true;
      const commentData = insertComplaintCommentSchema.parse({
        complaintId,
        userId: req.user.id,
        comment: req.body.comment,
        isInternal
      });
      const comment = await storage.createComplaintComment(commentData);
      if (!isInternal) {
        if (isAdminUser) {
          await createNotification({
            userId: complaint.createdBy,
            type: "complaint",
            title: "New Comment on Your Complaint",
            message: `An admin responded to your complaint "${complaint.title}".`,
            link: "/complaints"
          });
        } else {
          await notifyAdmins(
            "complaint",
            "New Comment on Complaint",
            `${req.user.name} added a comment to complaint: ${complaint.title}`,
            "/admin/complaints"
          );
        }
      }
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof ZodError3) {
        res.status(400).json(error.errors);
      } else {
        console.error("Error creating comment:", error);
        res.status(500).send("Internal server error");
      }
    }
  });
  app2.get("/api/complaints/:id/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const complaintId = parseInt(req.params.id);
      const complaint = await storage.getComplaint(complaintId);
      if (!complaint) {
        return res.status(404).json({ error: "Complaint not found" });
      }
      const isAdminUser = req.user?.role === "admin" || req.user?.isAdmin;
      const isOwner = complaint.createdBy === req.user.id;
      if (!isAdminUser && !isOwner) {
        return res.sendStatus(403);
      }
      const comments = await storage.getComplaintComments(complaintId, isAdminUser);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).send("Internal server error");
    }
  });
  app2.get("/api/complaints/stats", isAdmin2, async (_req, res) => {
    try {
      const complaints2 = await storage.getAllComplaints();
      const stats = {
        total: complaints2.length,
        open: complaints2.filter((c) => c.status === "open").length,
        inProgress: complaints2.filter((c) => c.status === "in_progress").length,
        resolved: complaints2.filter((c) => c.status === "resolved").length,
        closed: complaints2.filter((c) => c.status === "closed").length,
        rejected: complaints2.filter((c) => c.status === "rejected").length,
        byCategory: {
          plumbing: complaints2.filter((c) => c.category === "plumbing").length,
          electrical: complaints2.filter((c) => c.category === "electrical").length,
          civil: complaints2.filter((c) => c.category === "civil").length,
          housekeeping: complaints2.filter((c) => c.category === "housekeeping").length,
          security: complaints2.filter((c) => c.category === "security").length,
          parking: complaints2.filter((c) => c.category === "parking").length,
          noise: complaints2.filter((c) => c.category === "noise").length,
          other: complaints2.filter((c) => c.category === "other").length
        },
        byPriority: {
          urgent: complaints2.filter((c) => c.priority === "urgent").length,
          high: complaints2.filter((c) => c.priority === "high").length,
          medium: complaints2.filter((c) => c.priority === "medium").length,
          low: complaints2.filter((c) => c.priority === "low").length
        }
      };
      res.json(stats);
    } catch (error) {
      console.error("Error fetching complaint stats:", error);
      res.status(500).send("Internal server error");
    }
  });
}
var init_complaints = __esm({
  "server/routes/complaints.ts"() {
    "use strict";
    init_storage();
    init_schema();
    init_notifications();
  }
});

// server/routes/profile.ts
import { ZodError as ZodError4 } from "zod";
import { scrypt as scrypt2, randomBytes as randomBytes2, timingSafeEqual as timingSafeEqual2 } from "crypto";
import { promisify as promisify2 } from "util";
async function hashPassword2(password) {
  const salt = randomBytes2(16).toString("hex");
  const buf = await scryptAsync2(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords2(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync2(supplied, salt, 64);
  return timingSafeEqual2(hashedBuf, suppliedBuf);
}
function registerProfileRoutes(app2) {
  app2.get("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });
  app2.patch("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const updateData = updateProfileSchema.parse(req.body);
      if (updateData.email && updateData.email !== req.user.email) {
        const existingUser = await storage.getUserByEmail(updateData.email);
        if (existingUser && existingUser.id !== req.user.id) {
          return res.status(400).json({ error: "Email already in use" });
        }
      }
      const updatedUser = await storage.updateUser(req.user.id, updateData);
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError4) {
        res.status(400).json(error.errors);
      } else {
        console.error("Error updating profile:", error);
        res.status(500).json({ error: "Failed to update profile" });
      }
    }
  });
  app2.patch("/api/profile/password", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || !user.password) {
        return res.status(400).json({ error: "Cannot change password for Google-only accounts" });
      }
      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
      const isValid = await comparePasswords2(currentPassword, user.password);
      if (!isValid) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      const hashedPassword = await hashPassword2(newPassword);
      await storage.updateUser(req.user.id, { password: hashedPassword });
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      if (error instanceof ZodError4) {
        res.status(400).json(error.errors);
      } else {
        console.error("Error changing password:", error);
        res.status(500).json({ error: "Failed to change password" });
      }
    }
  });
  app2.get("/api/vehicles/my", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.apartmentId) {
      return res.status(400).json({ error: "You must have an apartment assigned to view vehicles" });
    }
    try {
      const vehiclesList = await storage.getVehiclesByApartment(req.user.apartmentId);
      res.json(vehiclesList);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ error: "Failed to fetch vehicles" });
    }
  });
  app2.get("/api/vehicles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);
    try {
      const vehiclesList = await storage.getAllVehicles();
      res.json(vehiclesList);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ error: "Failed to fetch vehicles" });
    }
  });
  app2.post("/api/vehicles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.apartmentId) {
      return res.status(400).json({ error: "You must have an apartment assigned to register a vehicle" });
    }
    try {
      const vehicleData = insertVehicleSchema.parse({
        ...req.body,
        apartmentId: req.user.apartmentId,
        registeredBy: req.user.id
      });
      const vehicle = await storage.createVehicle(vehicleData);
      res.status(201).json(vehicle);
    } catch (error) {
      if (error instanceof ZodError4) {
        res.status(400).json(error.errors);
      } else {
        console.error("Error creating vehicle:", error);
        res.status(500).json({ error: "Failed to create vehicle" });
      }
    }
  });
  app2.patch("/api/vehicles/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const vehicleId = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      if (!req.user.isAdmin && vehicle.apartmentId !== req.user.apartmentId) {
        return res.sendStatus(403);
      }
      const updateData = updateVehicleSchema.parse(req.body);
      const updatedVehicle = await storage.updateVehicle(vehicleId, updateData);
      res.json(updatedVehicle);
    } catch (error) {
      if (error instanceof ZodError4) {
        res.status(400).json(error.errors);
      } else {
        console.error("Error updating vehicle:", error);
        res.status(500).json({ error: "Failed to update vehicle" });
      }
    }
  });
  app2.delete("/api/vehicles/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const vehicleId = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      if (!req.user.isAdmin && vehicle.apartmentId !== req.user.apartmentId) {
        return res.sendStatus(403);
      }
      await storage.deleteVehicle(vehicleId);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      res.status(500).json({ error: "Failed to delete vehicle" });
    }
  });
}
var scryptAsync2;
var init_profile = __esm({
  "server/routes/profile.ts"() {
    "use strict";
    init_storage();
    init_schema();
    scryptAsync2 = promisify2(scrypt2);
  }
});

// server/routes/reports.ts
function registerReportRoutes(app2) {
  app2.get("/api/reports/dashboard", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);
    try {
      const [
        users2,
        apartments2,
        bookings2,
        complaints2,
        visitors2,
        notices2
      ] = await Promise.all([
        storage.getAllUsers(),
        storage.getApartments(),
        storage.getAllBookings(),
        storage.getAllComplaints(),
        storage.getAllVisitors(),
        storage.getActiveNotices()
      ]);
      const totalResidents = users2.filter((u) => u.role === "resident").length;
      const totalGuards = users2.filter((u) => u.role === "guard").length;
      const usersWithApartment = users2.filter((u) => u.apartmentId).length;
      const occupiedApartments = apartments2.filter((a) => a.status === "OCCUPIED").length;
      const forRentApartments = apartments2.filter((a) => a.status === "AVAILABLE_RENT").length;
      const forSaleApartments = apartments2.filter((a) => a.status === "AVAILABLE_SALE").length;
      const occupancyRate = apartments2.length > 0 ? Math.round(occupiedApartments / apartments2.length * 100) : 0;
      const pendingBookings = bookings2.filter((b) => b.status === "PENDING").length;
      const approvedBookings = bookings2.filter((b) => b.status === "APPROVED").length;
      const rejectedBookings = bookings2.filter((b) => b.status === "REJECTED").length;
      const openComplaints = complaints2.filter((c) => c.status === "open").length;
      const inProgressComplaints = complaints2.filter((c) => c.status === "in_progress").length;
      const resolvedComplaints = complaints2.filter((c) => c.status === "resolved" || c.status === "closed").length;
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const visitorsToday = visitors2.filter((v) => new Date(v.entryTime) >= today).length;
      const visitorsInside = visitors2.filter((v) => v.status === "inside").length;
      const weekAgo = /* @__PURE__ */ new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const visitorsThisWeek = visitors2.filter((v) => new Date(v.entryTime) >= weekAgo).length;
      const monthAgo = /* @__PURE__ */ new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const visitorsThisMonth = visitors2.filter((v) => new Date(v.entryTime) >= monthAgo).length;
      res.json({
        users: {
          total: users2.length,
          residents: totalResidents,
          guards: totalGuards,
          admins: users2.filter((u) => u.role === "admin").length,
          withApartment: usersWithApartment,
          withoutApartment: users2.length - usersWithApartment
        },
        apartments: {
          total: apartments2.length,
          occupied: occupiedApartments,
          forRent: forRentApartments,
          forSale: forSaleApartments,
          occupancyRate
        },
        bookings: {
          total: bookings2.length,
          pending: pendingBookings,
          approved: approvedBookings,
          rejected: rejectedBookings
        },
        complaints: {
          total: complaints2.length,
          open: openComplaints,
          inProgress: inProgressComplaints,
          resolved: resolvedComplaints
        },
        visitors: {
          total: visitors2.length,
          today: visitorsToday,
          thisWeek: visitorsThisWeek,
          thisMonth: visitorsThisMonth,
          currentlyInside: visitorsInside
        },
        notices: {
          active: notices2.length
        }
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    }
  });
  app2.get("/api/reports/visitors", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);
    try {
      const visitors2 = await storage.getAllVisitors();
      const apartments2 = await storage.getApartments();
      const towers2 = await storage.getTowers();
      const towerMap = new Map(towers2.map((t) => [t.id, t.name]));
      const apartmentMap = new Map(apartments2.map((a) => [a.id, { ...a, towerName: towerMap.get(a.towerId) }]));
      const byPurpose = {};
      visitors2.forEach((v) => {
        byPurpose[v.purpose] = (byPurpose[v.purpose] || 0) + 1;
      });
      const byTower = {};
      visitors2.forEach((v) => {
        const apt = apartmentMap.get(v.apartmentId);
        const towerName = apt?.towerName || "Unknown";
        byTower[towerName] = (byTower[towerName] || 0) + 1;
      });
      const byHour = {};
      visitors2.forEach((v) => {
        const hour = new Date(v.entryTime).getHours();
        byHour[hour] = (byHour[hour] || 0) + 1;
      });
      const byDayOfWeek = {
        "Sunday": 0,
        "Monday": 0,
        "Tuesday": 0,
        "Wednesday": 0,
        "Thursday": 0,
        "Friday": 0,
        "Saturday": 0
      };
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      visitors2.forEach((v) => {
        const day = days[new Date(v.entryTime).getDay()];
        byDayOfWeek[day] = (byDayOfWeek[day] || 0) + 1;
      });
      const last30Days = [];
      for (let i = 29; i >= 0; i--) {
        const date = /* @__PURE__ */ new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        const count = visitors2.filter((v) => {
          const entryDate = new Date(v.entryTime);
          return entryDate >= date && entryDate < nextDay;
        }).length;
        last30Days.push({
          date: date.toISOString().split("T")[0],
          count
        });
      }
      const checkedOutVisitors = visitors2.filter((v) => v.exitTime);
      let avgDurationMinutes = 0;
      if (checkedOutVisitors.length > 0) {
        const totalMinutes = checkedOutVisitors.reduce((sum, v) => {
          const entry = new Date(v.entryTime).getTime();
          const exit = new Date(v.exitTime).getTime();
          return sum + (exit - entry) / (1e3 * 60);
        }, 0);
        avgDurationMinutes = Math.round(totalMinutes / checkedOutVisitors.length);
      }
      res.json({
        total: visitors2.length,
        checkedOut: checkedOutVisitors.length,
        currentlyInside: visitors2.filter((v) => v.status === "inside").length,
        avgDurationMinutes,
        byPurpose: Object.entries(byPurpose).map(([name, value]) => ({ name, value })),
        byTower: Object.entries(byTower).map(([name, value]) => ({ name, value })),
        byHour: Object.entries(byHour).map(([hour, count]) => ({ hour: parseInt(hour), count })).sort((a, b) => a.hour - b.hour),
        byDayOfWeek: Object.entries(byDayOfWeek).map(([day, count]) => ({ day, count })),
        trend: last30Days
      });
    } catch (error) {
      console.error("Error fetching visitor reports:", error);
      res.status(500).json({ error: "Failed to fetch visitor reports" });
    }
  });
  app2.get("/api/reports/bookings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);
    try {
      const bookings2 = await storage.getAllBookings();
      const amenities2 = await storage.getAmenities();
      const amenityMap = new Map(amenities2.map((a) => [a.id, a.name]));
      const byAmenity = {};
      bookings2.forEach((b) => {
        const name = amenityMap.get(b.amenityId) || "Unknown";
        byAmenity[name] = (byAmenity[name] || 0) + 1;
      });
      const byStatus = {
        "PENDING": 0,
        "APPROVED": 0,
        "REJECTED": 0
      };
      bookings2.forEach((b) => {
        byStatus[b.status] = (byStatus[b.status] || 0) + 1;
      });
      const totalDecided = byStatus["APPROVED"] + byStatus["REJECTED"];
      const approvalRate = totalDecided > 0 ? Math.round(byStatus["APPROVED"] / totalDecided * 100) : 0;
      const byMonth = [];
      for (let i = 5; i >= 0; i--) {
        const date = /* @__PURE__ */ new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleString("default", { month: "short", year: "2-digit" });
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const count = bookings2.filter((b) => {
          const bookingDate = new Date(b.startTime);
          return bookingDate >= monthStart && bookingDate <= monthEnd;
        }).length;
        byMonth.push({ month: monthName, count });
      }
      const popularAmenities = Object.entries(byAmenity).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));
      res.json({
        total: bookings2.length,
        pending: byStatus["PENDING"],
        approved: byStatus["APPROVED"],
        rejected: byStatus["REJECTED"],
        approvalRate,
        byAmenity: Object.entries(byAmenity).map(([name, value]) => ({ name, value })),
        byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
        byMonth,
        popularAmenities
      });
    } catch (error) {
      console.error("Error fetching booking reports:", error);
      res.status(500).json({ error: "Failed to fetch booking reports" });
    }
  });
  app2.get("/api/reports/complaints", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);
    try {
      const complaints2 = await storage.getAllComplaints();
      const byCategory = {};
      complaints2.forEach((c) => {
        byCategory[c.category] = (byCategory[c.category] || 0) + 1;
      });
      const byStatus = {
        "open": 0,
        "in_progress": 0,
        "resolved": 0,
        "closed": 0,
        "rejected": 0
      };
      complaints2.forEach((c) => {
        byStatus[c.status] = (byStatus[c.status] || 0) + 1;
      });
      const byPriority = {
        "low": 0,
        "medium": 0,
        "high": 0,
        "urgent": 0
      };
      complaints2.forEach((c) => {
        byPriority[c.priority] = (byPriority[c.priority] || 0) + 1;
      });
      const totalResolvable = complaints2.length - byStatus["rejected"];
      const resolved = byStatus["resolved"] + byStatus["closed"];
      const resolutionRate = totalResolvable > 0 ? Math.round(resolved / totalResolvable * 100) : 0;
      const resolvedComplaints = complaints2.filter((c) => c.resolvedAt);
      let avgResolutionHours = 0;
      if (resolvedComplaints.length > 0) {
        const totalHours = resolvedComplaints.reduce((sum, c) => {
          const created = new Date(c.createdAt).getTime();
          const resolved2 = new Date(c.resolvedAt).getTime();
          return sum + (resolved2 - created) / (1e3 * 60 * 60);
        }, 0);
        avgResolutionHours = Math.round(totalHours / resolvedComplaints.length);
      }
      const last30Days = [];
      for (let i = 29; i >= 0; i--) {
        const date = /* @__PURE__ */ new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        const count = complaints2.filter((c) => {
          const createdDate = new Date(c.createdAt);
          return createdDate >= date && createdDate < nextDay;
        }).length;
        last30Days.push({
          date: date.toISOString().split("T")[0],
          count
        });
      }
      const openComplaints = complaints2.filter((c) => c.status === "open" || c.status === "in_progress");
      const aging = {
        lessThan24h: 0,
        oneToThreeDays: 0,
        threeToSevenDays: 0,
        moreThanWeek: 0
      };
      const now = Date.now();
      openComplaints.forEach((c) => {
        const hoursOpen = (now - new Date(c.createdAt).getTime()) / (1e3 * 60 * 60);
        if (hoursOpen < 24) aging.lessThan24h++;
        else if (hoursOpen < 72) aging.oneToThreeDays++;
        else if (hoursOpen < 168) aging.threeToSevenDays++;
        else aging.moreThanWeek++;
      });
      res.json({
        total: complaints2.length,
        open: byStatus["open"],
        inProgress: byStatus["in_progress"],
        resolved: byStatus["resolved"] + byStatus["closed"],
        rejected: byStatus["rejected"],
        resolutionRate,
        avgResolutionHours,
        byCategory: Object.entries(byCategory).map(([name, value]) => ({ name, value })),
        byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
        byPriority: Object.entries(byPriority).map(([name, value]) => ({ name, value })),
        trend: last30Days,
        aging
      });
    } catch (error) {
      console.error("Error fetching complaint reports:", error);
      res.status(500).json({ error: "Failed to fetch complaint reports" });
    }
  });
  app2.get("/api/reports/occupancy", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);
    try {
      const apartments2 = await storage.getApartments();
      const towers2 = await storage.getTowers();
      const users2 = await storage.getAllUsers();
      const towerMap = new Map(towers2.map((t) => [t.id, t.name]));
      const byStatus = {
        "OCCUPIED": 0,
        "AVAILABLE_RENT": 0,
        "AVAILABLE_SALE": 0
      };
      apartments2.forEach((a) => {
        byStatus[a.status] = (byStatus[a.status] || 0) + 1;
      });
      const byTower = [];
      towers2.forEach((tower) => {
        const towerApartments = apartments2.filter((a) => a.towerId === tower.id);
        byTower.push({
          tower: tower.name,
          occupied: towerApartments.filter((a) => a.status === "OCCUPIED").length,
          forRent: towerApartments.filter((a) => a.status === "AVAILABLE_RENT").length,
          forSale: towerApartments.filter((a) => a.status === "AVAILABLE_SALE").length,
          total: towerApartments.length
        });
      });
      const byType = {};
      apartments2.forEach((a) => {
        byType[a.type] = (byType[a.type] || 0) + 1;
      });
      const residentsPerApartment = {};
      users2.forEach((u) => {
        if (u.apartmentId) {
          residentsPerApartment[u.apartmentId] = (residentsPerApartment[u.apartmentId] || 0) + 1;
        }
      });
      const occupiedApartmentIds = apartments2.filter((a) => a.status === "OCCUPIED").map((a) => a.id);
      const totalResidents = occupiedApartmentIds.reduce((sum, id) => sum + (residentsPerApartment[id] || 0), 0);
      const avgResidentsPerApartment = occupiedApartmentIds.length > 0 ? (totalResidents / occupiedApartmentIds.length).toFixed(1) : "0";
      const forRentListings = apartments2.filter((a) => a.status === "AVAILABLE_RENT").map((a) => ({
        id: a.id,
        tower: towerMap.get(a.towerId),
        number: a.number,
        floor: a.floor,
        type: a.type,
        rent: a.monthlyRent
      }));
      const forSaleListings = apartments2.filter((a) => a.status === "AVAILABLE_SALE").map((a) => ({
        id: a.id,
        tower: towerMap.get(a.towerId),
        number: a.number,
        floor: a.floor,
        type: a.type,
        price: a.salePrice
      }));
      const occupancyRate = apartments2.length > 0 ? Math.round(byStatus["OCCUPIED"] / apartments2.length * 100) : 0;
      res.json({
        total: apartments2.length,
        occupied: byStatus["OCCUPIED"],
        forRent: byStatus["AVAILABLE_RENT"],
        forSale: byStatus["AVAILABLE_SALE"],
        occupancyRate,
        avgResidentsPerApartment,
        byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
        byTower,
        byType: Object.entries(byType).map(([name, value]) => ({ name, value })),
        forRentListings,
        forSaleListings
      });
    } catch (error) {
      console.error("Error fetching occupancy reports:", error);
      res.status(500).json({ error: "Failed to fetch occupancy reports" });
    }
  });
  app2.get("/api/reports/export/:type", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);
    const { type } = req.params;
    try {
      let csvContent = "";
      let filename = "";
      switch (type) {
        case "visitors": {
          const visitors2 = await storage.getAllVisitors();
          const apartments2 = await storage.getApartments();
          const towers2 = await storage.getTowers();
          const towerMap = new Map(towers2.map((t) => [t.id, t.name]));
          const apartmentMap = new Map(apartments2.map((a) => [a.id, { number: a.number, tower: towerMap.get(a.towerId) }]));
          csvContent = "Name,Mobile,Purpose,Apartment,Tower,Entry Time,Exit Time,Status\n";
          visitors2.forEach((v) => {
            const apt = apartmentMap.get(v.apartmentId);
            csvContent += `"${v.name}","${v.mobileNumber}","${v.purpose}","${apt?.number || ""}","${apt?.tower || ""}","${v.entryTime}","${v.exitTime || ""}","${v.status}"
`;
          });
          filename = "visitors-report.csv";
          break;
        }
        case "bookings": {
          const bookings2 = await storage.getAllBookings();
          const amenities2 = await storage.getAmenities();
          const users2 = await storage.getAllUsers();
          const amenityMap = new Map(amenities2.map((a) => [a.id, a.name]));
          const userMap = new Map(users2.map((u) => [u.id, u.name]));
          csvContent = "User,Amenity,Start Time,End Time,Status\n";
          bookings2.forEach((b) => {
            csvContent += `"${userMap.get(b.userId) || ""}","${amenityMap.get(b.amenityId) || ""}","${b.startTime}","${b.endTime}","${b.status}"
`;
          });
          filename = "bookings-report.csv";
          break;
        }
        case "complaints": {
          const complaints2 = await storage.getAllComplaints();
          const users2 = await storage.getAllUsers();
          const apartments2 = await storage.getApartments();
          const towers2 = await storage.getTowers();
          const userMap = new Map(users2.map((u) => [u.id, u.name]));
          const towerMap = new Map(towers2.map((t) => [t.id, t.name]));
          const apartmentMap = new Map(apartments2.map((a) => [a.id, { number: a.number, tower: towerMap.get(a.towerId) }]));
          csvContent = "Title,Category,Priority,Status,Apartment,Tower,Created By,Created At,Resolved At\n";
          complaints2.forEach((c) => {
            const apt = apartmentMap.get(c.apartmentId);
            csvContent += `"${c.title}","${c.category}","${c.priority}","${c.status}","${apt?.number || ""}","${apt?.tower || ""}","${userMap.get(c.createdBy) || ""}","${c.createdAt}","${c.resolvedAt || ""}"
`;
          });
          filename = "complaints-report.csv";
          break;
        }
        case "apartments": {
          const apartments2 = await storage.getApartments();
          const towers2 = await storage.getTowers();
          const users2 = await storage.getAllUsers();
          const towerMap = new Map(towers2.map((t) => [t.id, t.name]));
          const residentsCount = {};
          users2.forEach((u) => {
            if (u.apartmentId) {
              residentsCount[u.apartmentId] = (residentsCount[u.apartmentId] || 0) + 1;
            }
          });
          csvContent = "Tower,Number,Floor,Type,Status,Owner,Residents,Monthly Rent,Sale Price,Contact\n";
          apartments2.forEach((a) => {
            csvContent += `"${towerMap.get(a.towerId) || ""}","${a.number}","${a.floor}","${a.type}","${a.status}","${a.ownerName || ""}","${residentsCount[a.id] || 0}","${a.monthlyRent || ""}","${a.salePrice || ""}","${a.contactNumber || ""}"
`;
          });
          filename = "apartments-report.csv";
          break;
        }
        default:
          return res.status(400).json({ error: "Invalid report type" });
      }
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting report:", error);
      res.status(500).json({ error: "Failed to export report" });
    }
  });
}
var init_reports = __esm({
  "server/routes/reports.ts"() {
    "use strict";
    init_storage();
  }
});

// server/routes.ts
var routes_exports = {};
__export(routes_exports, {
  registerRoutes: () => registerRoutes
});
import { createServer } from "http";
import { ZodError as ZodError5 } from "zod";
async function registerRoutes(app2) {
  setupAuth(app2);
  registerVisitorRoutes(app2);
  registerComplaintRoutes(app2);
  registerProfileRoutes(app2);
  registerReportRoutes(app2);
  registerNotificationRoutes(app2);
  app2.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);
    const users2 = await storage.getAllUsers();
    res.json(users2);
  });
  app2.patch("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);
    try {
      const userId = parseInt(req.params.id);
      const updateData = updateUserSchema.parse(req.body);
      const user = await storage.updateUser(userId, updateData);
      res.json(user);
    } catch (error) {
      if (error instanceof ZodError5) {
        res.status(400).json(error.errors);
      } else {
        res.status(500).send("Internal server error");
      }
    }
  });
  app2.delete("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (userId === req.user.id) {
        await storage.deleteUser(userId);
        req.logout((err) => {
          if (err) {
            console.error("Error logging out user:", err);
          }
          req.session.destroy((err2) => {
            if (err2) {
              console.error("Error destroying session:", err2);
            }
            res.sendStatus(204);
          });
        });
        return;
      }
      await storage.deleteUser(userId);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).send("Internal server error");
    }
  });
  app2.patch("/api/users/:id/role", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);
    try {
      const userId = parseInt(req.params.id);
      const { role } = updateUserRoleSchema.parse(req.body);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const isAdmin2 = role === "admin";
      const updatedUser = await storage.updateUser(userId, { role, isAdmin: isAdmin2 });
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof ZodError5) {
        res.status(400).json(error.errors);
      } else {
        console.error("Error updating user role:", error);
        res.status(500).send("Internal server error");
      }
    }
  });
  app2.patch("/api/users/:id/apartment", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);
    try {
      const userId = parseInt(req.params.id);
      const { apartmentId, residentType } = req.body;
      if (!apartmentId || typeof apartmentId !== "number") {
        return res.status(400).json({ error: "Valid apartmentId is required" });
      }
      if (!residentType || residentType !== "OWNER" && residentType !== "TENANT") {
        return res.status(400).json({ error: "Valid residentType (OWNER or TENANT) is required" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const apartment = await storage.getApartment(apartmentId);
      if (!apartment) {
        return res.status(404).json({ error: "Apartment not found" });
      }
      if (user.apartmentId && user.apartmentId !== apartmentId && user.residentType === "OWNER") {
        await storage.updateApartment(user.apartmentId, { ownerName: null });
      }
      const updatedUser = await storage.assignApartment(userId, apartmentId, residentType);
      if (residentType === "OWNER") {
        await storage.updateApartment(apartmentId, { ownerName: user.name });
      }
      res.json(updatedUser);
    } catch (error) {
      console.error("Error assigning apartment:", error);
      res.status(500).json({ error: "Failed to assign apartment" });
    }
  });
  app2.delete("/api/users/:id/apartment", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (user.apartmentId && user.residentType === "OWNER") {
        await storage.updateApartment(user.apartmentId, { ownerName: null });
      }
      const updatedUser = await storage.removeApartmentAssignment(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error removing apartment assignment:", error);
      res.status(500).json({ error: "Failed to remove apartment assignment" });
    }
  });
  app2.get("/api/users/unassigned", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);
    try {
      const users2 = await storage.getUsersWithoutApartment();
      res.json(users2);
    } catch (error) {
      console.error("Error fetching unassigned users:", error);
      res.status(500).json({ error: "Failed to fetch unassigned users" });
    }
  });
  app2.get("/api/apartments/:id/residents", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const apartmentId = parseInt(req.params.id);
      if (!req.user?.isAdmin && req.user?.apartmentId !== apartmentId) {
        return res.sendStatus(403);
      }
      const apartment = await storage.getApartment(apartmentId);
      if (!apartment) {
        return res.status(404).json({ error: "Apartment not found" });
      }
      const residents = await storage.getUsersByApartment(apartmentId);
      res.json(residents);
    } catch (error) {
      console.error("Error fetching apartment residents:", error);
      res.status(500).json({ error: "Failed to fetch apartment residents" });
    }
  });
  app2.get("/api/apartments", async (_req, res) => {
    const apartments2 = await storage.getApartments();
    res.json(apartments2);
  });
  app2.get("/api/towers/:towerId/apartments", async (req, res) => {
    const towerId = parseInt(req.params.towerId);
    const apartments2 = await storage.getApartmentsByTower(towerId);
    res.json(apartments2);
  });
  app2.get("/api/amenities", async (req, res) => {
    if (req.isAuthenticated() && req.user?.isAdmin && req.query.includeInactive === "true") {
      const amenities3 = await storage.getAllAmenities();
      return res.json(amenities3);
    }
    const amenities2 = await storage.getAmenities();
    res.json(amenities2);
  });
  app2.get("/api/amenities/all", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);
    const amenities2 = await storage.getAllAmenities();
    res.json(amenities2);
  });
  app2.get("/api/amenities/:id", async (req, res) => {
    const amenity = await storage.getAmenity(parseInt(req.params.id));
    if (!amenity) return res.status(404).send("Amenity not found");
    res.json(amenity);
  });
  app2.post("/api/amenities", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);
    try {
      const amenityData = insertAmenitySchema.parse(req.body);
      const amenity = await storage.createAmenity(amenityData);
      res.status(201).json(amenity);
    } catch (error) {
      if (error instanceof ZodError5) {
        res.status(400).json(error.errors);
      } else {
        console.error("Error creating amenity:", error);
        res.status(500).json({ error: "Failed to create amenity" });
      }
    }
  });
  app2.patch("/api/amenities/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);
    try {
      const amenityId = parseInt(req.params.id);
      const updateData = updateAmenitySchema.parse(req.body);
      const existingAmenity = await storage.getAmenity(amenityId);
      if (!existingAmenity) {
        return res.status(404).json({ error: "Amenity not found" });
      }
      const amenity = await storage.updateAmenity(amenityId, updateData);
      res.json(amenity);
    } catch (error) {
      if (error instanceof ZodError5) {
        res.status(400).json(error.errors);
      } else {
        console.error("Error updating amenity:", error);
        res.status(500).json({ error: "Failed to update amenity" });
      }
    }
  });
  app2.delete("/api/amenities/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);
    try {
      const amenityId = parseInt(req.params.id);
      const existingAmenity = await storage.getAmenity(amenityId);
      if (!existingAmenity) {
        return res.status(404).json({ error: "Amenity not found" });
      }
      await storage.deleteAmenity(amenityId);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting amenity:", error);
      res.status(500).json({ error: "Failed to delete amenity" });
    }
  });
  app2.post("/api/bookings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      if (!req.user.isAdmin && !req.user.apartmentId) {
        return res.status(403).json({
          error: "You must have an apartment assigned to book amenities. Please contact the administrator."
        });
      }
      const parsedBooking = insertBookingSchema.parse({
        ...req.body,
        userId: req.user.id,
        status: "PENDING"
      });
      const bookingData = {
        ...parsedBooking,
        deletedAt: parsedBooking.deletedAt ?? null
      };
      const booking = await storage.createBooking(bookingData);
      const amenity = await storage.getAmenity(booking.amenityId);
      const amenityName = amenity?.name || "Amenity";
      let apartmentInfo = "";
      if (req.user.apartmentId) {
        const apartment = await storage.getApartment(req.user.apartmentId);
        if (apartment) {
          const tower = await storage.getTower(apartment.towerId);
          apartmentInfo = ` from ${tower?.name || "Tower " + apartment.towerId}, Flat ${apartment.number}`;
        }
      }
      const startDate = new Date(booking.startTime);
      const endDate = new Date(booking.endTime);
      const dateOptions = {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric"
      };
      const timeOptions = {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      };
      const formattedStartDate = startDate.toLocaleDateString("en-US", dateOptions);
      const formattedStartTime = startDate.toLocaleTimeString("en-US", timeOptions);
      const formattedEndDate = endDate.toLocaleDateString("en-US", dateOptions);
      const formattedEndTime = endDate.toLocaleTimeString("en-US", timeOptions);
      await notifyAdmins(
        "booking",
        "New Booking Request",
        `${req.user.name}${apartmentInfo} has requested to book ${amenityName} from ${formattedStartDate} at ${formattedStartTime} to ${formattedEndDate} at ${formattedEndTime}.`,
        "/bookings"
      );
      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof ZodError5) {
        res.status(400).json(error.errors);
      } else {
        res.status(500).send("Internal server error");
      }
    }
  });
  app2.get("/api/bookings/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const bookings2 = await storage.getBookingsByUser(req.user.id);
    res.json(bookings2);
  });
  app2.patch("/api/apartments/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);
    try {
      const apartmentId = parseInt(req.params.id);
      const updateData = updateApartmentSchema.parse(req.body);
      const apartment = await storage.updateApartment(apartmentId, updateData);
      res.json(apartment);
    } catch (error) {
      if (error instanceof ZodError5) {
        res.status(400).json(error.errors);
      } else {
        res.status(500).send("Internal server error");
      }
    }
  });
  app2.get("/api/bookings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);
    const bookings2 = await storage.getAllBookings();
    res.json(bookings2);
  });
  app2.patch("/api/bookings/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);
    try {
      const bookingId = parseInt(req.params.id);
      const { status } = req.body;
      if (status !== "APPROVED" && status !== "REJECTED") {
        return res.status(400).json({ error: "Invalid status" });
      }
      const booking = await storage.updateBookingStatus(bookingId, status);
      const amenity = await storage.getAmenity(booking.amenityId);
      const amenityName = amenity?.name || "Amenity";
      await createNotification({
        userId: booking.userId,
        type: "booking",
        title: status === "APPROVED" ? "Booking Approved" : "Booking Rejected",
        message: status === "APPROVED" ? `Your booking for ${amenityName} has been approved.` : `Your booking for ${amenityName} has been rejected.`,
        link: "/my-bookings"
      });
      res.json(booking);
    } catch (error) {
      res.status(500).send("Internal server error");
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}
var init_routes = __esm({
  "server/routes.ts"() {
    "use strict";
    init_auth();
    init_storage();
    init_schema();
    init_visitors();
    init_complaints();
    init_profile();
    init_reports();
    init_notifications();
  }
});

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename, __dirname, vite_config_default;
var init_vite_config = __esm({
  async "vite.config.ts"() {
    "use strict";
    __filename = fileURLToPath(import.meta.url);
    __dirname = dirname(__filename);
    vite_config_default = defineConfig({
      plugins: [
        react(),
        runtimeErrorOverlay(),
        themePlugin(),
        ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
          await import("@replit/vite-plugin-cartographer").then(
            (m) => m.cartographer()
          )
        ] : []
      ],
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "client", "src"),
          "@shared": path.resolve(__dirname, "shared")
        }
      },
      root: path.resolve(__dirname, "client"),
      build: {
        outDir: path.resolve(__dirname, "dist/public"),
        emptyOutDir: true
      }
    });
  }
});

// server/vite.ts
var vite_exports = {};
__export(vite_exports, {
  log: () => log,
  serveStatic: () => serveStatic,
  setupVite: () => setupVite
});
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";
import { nanoid } from "nanoid";
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    if (url.startsWith("/api")) {
      return next();
    }
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}
var __filename2, __dirname2, viteLogger;
var init_vite = __esm({
  async "server/vite.ts"() {
    "use strict";
    await init_vite_config();
    __filename2 = fileURLToPath2(import.meta.url);
    __dirname2 = dirname2(__filename2);
    viteLogger = createLogger();
  }
});

// server/middleware/auth.ts
var isAdmin;
var init_auth2 = __esm({
  "server/middleware/auth.ts"() {
    "use strict";
    init_storage();
    isAdmin = async (req, res, next) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      try {
        const user = await storage.getUser(req.user.id);
        if (!user || !user.isAdmin) {
          return res.status(403).json({ error: "Forbidden - Admin access required" });
        }
        next();
      } catch (error) {
        console.error("Error in isAdmin middleware:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
    };
  }
});

// server/routes/towers.ts
var towers_exports = {};
__export(towers_exports, {
  default: () => towers_default
});
import { Router } from "express";
import { eq as eq2 } from "drizzle-orm";
var router, towers_default;
var init_towers = __esm({
  "server/routes/towers.ts"() {
    "use strict";
    init_auth2();
    init_schema();
    init_db();
    router = Router();
    router.get("/", async (req, res) => {
      try {
        const allTowers = await db.select().from(towers);
        res.json(allTowers);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch towers" });
      }
    });
    router.post("/", isAdmin, async (req, res) => {
      try {
        const { name } = req.body;
        if (!name) {
          return res.status(400).json({ error: "Tower name is required" });
        }
        const [tower] = await db.insert(towers).values({ name }).returning();
        res.status(201).json(tower);
      } catch (error) {
        res.status(500).json({ error: "Failed to create tower" });
      }
    });
    router.delete("/:id", isAdmin, async (req, res) => {
      const id = parseInt(req.params.id);
      try {
        await db.transaction(async (tx) => {
          await tx.delete(apartments).where(eq2(apartments.towerId, id));
          const [deletedTower] = await tx.delete(towers).where(eq2(towers.id, id)).returning();
          if (!deletedTower) {
            throw new Error("Tower not found");
          }
          res.json(deletedTower);
        });
      } catch (error) {
        if (error instanceof Error && error.message === "Tower not found") {
          res.status(404).json({ error: "Tower not found" });
        } else {
          res.status(500).json({ error: "Failed to delete tower" });
        }
      }
    });
    router.patch("/:id", isAdmin, async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const { name } = req.body;
        if (!name) {
          return res.status(400).json({ error: "Tower name is required" });
        }
        const [updatedTower] = await db.update(towers).set({ name }).where(eq2(towers.id, id)).returning();
        if (!updatedTower) {
          return res.status(404).json({ error: "Tower not found" });
        }
        res.json(updatedTower);
      } catch (error) {
        res.status(500).json({ error: "Failed to update tower" });
      }
    });
    towers_default = router;
  }
});

// server/routes/apartments.ts
var apartments_exports = {};
__export(apartments_exports, {
  default: () => apartments_default
});
import { Router as Router2 } from "express";
import { eq as eq3 } from "drizzle-orm";
var router2, apartments_default;
var init_apartments = __esm({
  "server/routes/apartments.ts"() {
    "use strict";
    init_auth2();
    init_schema();
    init_db();
    router2 = Router2();
    router2.get("/", async (req, res) => {
      try {
        const { towerId } = req.query;
        let allApartments;
        if (towerId) {
          allApartments = await db.select().from(apartments).where(eq3(apartments.towerId, parseInt(towerId)));
        } else {
          allApartments = await db.select().from(apartments);
        }
        res.json(allApartments);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch apartments" });
      }
    });
    router2.post("/", isAdmin, async (req, res) => {
      try {
        const {
          number,
          towerId,
          type,
          floor,
          monthlyRent,
          salePrice,
          status,
          contactNumber
        } = req.body;
        if (!number || !towerId || !type || !floor || !status) {
          return res.status(400).json({
            error: "Number, tower ID, type, floor, and status are required"
          });
        }
        const [apartment] = await db.insert(apartments).values({
          number,
          towerId,
          type,
          floor,
          monthlyRent: monthlyRent || null,
          salePrice: salePrice || null,
          status,
          contactNumber: contactNumber || null
        }).returning();
        res.status(201).json(apartment);
      } catch (error) {
        res.status(500).json({ error: "Failed to create apartment" });
      }
    });
    router2.delete("/:id", isAdmin, async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const [deletedApartment] = await db.delete(apartments).where(eq3(apartments.id, id)).returning();
        if (!deletedApartment) {
          return res.status(404).json({ error: "Apartment not found" });
        }
        res.json(deletedApartment);
      } catch (error) {
        res.status(500).json({ error: "Failed to delete apartment" });
      }
    });
    router2.patch("/:id", isAdmin, async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const {
          number,
          type,
          floor,
          monthlyRent,
          salePrice,
          status,
          contactNumber
        } = req.body;
        const [updatedApartment] = await db.update(apartments).set({
          number,
          type,
          floor,
          monthlyRent: monthlyRent || null,
          salePrice: salePrice || null,
          status,
          contactNumber: contactNumber || null
        }).where(eq3(apartments.id, id)).returning();
        if (!updatedApartment) {
          return res.status(404).json({ error: "Apartment not found" });
        }
        res.json(updatedApartment);
      } catch (error) {
        res.status(500).json({ error: "Failed to update apartment" });
      }
    });
    apartments_default = router2;
  }
});

// server/routes/notices.ts
var notices_exports = {};
__export(notices_exports, {
  default: () => notices_default
});
import express2 from "express";
import { isBefore } from "date-fns";
var router3, priorityOrder, notices_default;
var init_notices = __esm({
  "server/routes/notices.ts"() {
    "use strict";
    init_storage();
    init_notifications();
    router3 = express2.Router();
    priorityOrder = {
      HIGH: 3,
      NORMAL: 2,
      LOW: 1
    };
    router3.get("/", async (req, res) => {
      try {
        const notices2 = await storage.getNotices();
        notices2.sort((a, b) => {
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        res.json(notices2);
      } catch (error) {
        console.error("Error fetching notices:", error);
        res.status(500).json({ error: "Failed to fetch notices" });
      }
    });
    router3.post("/", async (req, res) => {
      try {
        console.log("Received notice creation request:", req.body);
        console.log("User session:", req.session);
        if (!req.isAuthenticated() || !req.user?.isAdmin) {
          console.log("User is not admin");
          res.status(403).json({ error: "Only admins can create notices" });
          return;
        }
        if (!req.body.title || !req.body.content) {
          console.log("Missing required fields:", {
            title: req.body.title,
            content: req.body.content
          });
          res.status(400).json({ error: "Title and content are required" });
          return;
        }
        const expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : null;
        if (expiresAt && isBefore(expiresAt, /* @__PURE__ */ new Date())) {
          res.status(400).json({ error: "Expiration date must be in the future" });
          return;
        }
        const now = /* @__PURE__ */ new Date();
        const noticeData = {
          title: req.body.title,
          content: req.body.content,
          priority: req.body.priority || "NORMAL",
          expiresAt,
          createdBy: req.user.id,
          createdAt: now,
          updatedAt: now,
          isArchived: false
        };
        console.log("Creating notice with data:", noticeData);
        const notice = await storage.createNotice(noticeData);
        console.log("Notice created successfully:", notice);
        const allUsers = await storage.getAllUsers();
        const residents = allUsers.filter((u) => u.role !== "admin" && !u.isAdmin);
        for (const resident of residents) {
          await createNotification({
            userId: resident.id,
            type: "notice",
            title: notice.priority === "HIGH" ? "Important Notice" : "New Notice",
            message: notice.title,
            link: "/"
          });
        }
        res.json(notice);
      } catch (error) {
        console.error("Error creating notice:", error);
        res.status(500).json({
          error: "Failed to create notice",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });
    router3.get("/archived", async (req, res) => {
      try {
        if (!req.isAuthenticated() || !req.user?.isAdmin) {
          res.status(403).json({ error: "Only admins can view archived notices" });
          return;
        }
        const archivedNotices = await storage.getArchivedNotices();
        archivedNotices.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        res.json(archivedNotices);
      } catch (error) {
        console.error("Error fetching archived notices:", error);
        res.status(500).json({ error: "Failed to fetch archived notices" });
      }
    });
    router3.delete("/:id", async (req, res) => {
      try {
        if (!req.isAuthenticated() || !req.user?.isAdmin) {
          res.status(403).json({ error: "Only admins can delete notices" });
          return;
        }
        await storage.deleteNotice(parseInt(req.params.id));
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting notice:", error);
        res.status(500).json({ error: "Failed to delete notice" });
      }
    });
    notices_default = router3;
  }
});

// server/api-source/handler.ts
var app = null;
async function getApp() {
  if (app) return app;
  const express3 = (await import("express")).default;
  const session2 = (await import("express-session")).default;
  const { registerRoutes: registerRoutes2 } = await Promise.resolve().then(() => (init_routes(), routes_exports));
  const { serveStatic: serveStatic2 } = await init_vite().then(() => vite_exports);
  const { storage: storage2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
  const { setupAuth: setupAuth2 } = await Promise.resolve().then(() => (init_auth(), auth_exports));
  const towersRouter = (await Promise.resolve().then(() => (init_towers(), towers_exports))).default;
  const apartmentsRouter = (await Promise.resolve().then(() => (init_apartments(), apartments_exports))).default;
  const noticesRouter = (await Promise.resolve().then(() => (init_notices(), notices_exports))).default;
  app = express3();
  app.use(express3.json());
  app.use(express3.urlencoded({ extended: false }));
  app.use(
    session2({
      secret: process.env.SESSION_SECRET || "your-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 24 * 60 * 60 * 1e3,
        httpOnly: true,
        path: "/"
      },
      store: storage2.sessionStore,
      name: "ssync.sid"
    })
  );
  setupAuth2(app);
  app.use((req, res, next) => {
    const start = Date.now();
    const path3 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson) {
      capturedJsonResponse = bodyJson;
      return originalResJson.call(res, bodyJson);
    };
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path3.startsWith("/api")) {
        let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "\u2026";
        }
        console.log(logLine);
      }
    });
    next();
  });
  app.use("/api/towers", towersRouter);
  app.use("/api/apartments", apartmentsRouter);
  app.use("/api/notices", noticesRouter);
  app.use((err, _req, res, _next) => {
    console.error("Express error:", err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message, error: err.toString() });
  });
  await registerRoutes2(app);
  serveStatic2(app);
  return app;
}
async function handler(req, res) {
  try {
    const expressApp = await getApp();
    return new Promise((resolve, reject) => {
      expressApp(req, res, (err) => {
        if (err) {
          console.error("Handler error:", err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    console.error("Initialization error:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      error: "Server initialization failed",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : void 0
    }));
  }
}
export {
  handler as default
};
