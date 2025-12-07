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
  password: text("password"), // Nullable for Google OAuth users
  isAdmin: boolean("is_admin").default(false).notNull(), // Legacy - use 'role' instead
  role: text("role").default("resident").notNull(), // 'admin', 'resident', 'guard'
  name: text("name").notNull(),
  apartmentId: integer("apartment_id"),
  residentType: text("resident_type"), // 'OWNER' or 'TENANT' - only set when apartmentId is assigned
  phone: text("phone"), // User's phone number
  // OAuth fields
  email: text("email").unique(),
  googleId: text("google_id").unique(),
  profilePicture: text("profile_picture"),
  authProvider: text("auth_provider").default("local").notNull(), // 'local' or 'google'
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
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

export const notices = pgTable("notices", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id),
  priority: text("priority").notNull().default("NORMAL"), // "HIGH", "NORMAL", "LOW"
  expiresAt: timestamp("expires_at"),
  isArchived: boolean("is_archived").default(false).notNull(),
});

// Visitor entry/exit logs
export const visitors = pgTable("visitors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  mobileNumber: text("mobile_number").notNull(),
  purpose: text("purpose").notNull(), // 'personal', 'delivery', 'service', 'maintenance', 'family', 'other'
  apartmentId: integer("apartment_id").notNull(),
  vehicleNumber: text("vehicle_number"),
  photoUrl: text("photo_url"),
  entryTime: timestamp("entry_time").defaultNow().notNull(),
  exitTime: timestamp("exit_time"),
  status: text("status").default("inside").notNull(), // 'inside', 'checked_out'
  createdBy: integer("created_by").notNull(), // Guard who logged the entry
  notes: text("notes"),
  preApprovedVisitorId: integer("pre_approved_visitor_id"), // Link to pre-approval if visitor was pre-approved
});

// Pre-approved visitors by residents
export const preApprovedVisitors = pgTable("pre_approved_visitors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  mobileNumber: text("mobile_number"),
  purpose: text("purpose").notNull(),
  apartmentId: integer("apartment_id").notNull(),
  expectedDate: timestamp("expected_date").notNull(),
  expectedTimeFrom: text("expected_time_from"), // Store as text like "09:00"
  expectedTimeTo: text("expected_time_to"),
  numberOfPersons: integer("number_of_persons").default(1).notNull(),
  status: text("status").default("pending").notNull(), // 'pending', 'arrived', 'expired', 'cancelled', 'completed'
  createdBy: integer("created_by").notNull(), // Resident who created the pre-approval
  createdAt: timestamp("created_at").defaultNow().notNull(),
  notes: text("notes"),
});

// Complaints table
export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'plumbing', 'electrical', 'civil', 'housekeeping', 'security', 'parking', 'noise', 'other'
  priority: text("priority").default("medium").notNull(), // 'low', 'medium', 'high', 'urgent'
  status: text("status").default("open").notNull(), // 'open', 'in_progress', 'resolved', 'closed', 'rejected'
  apartmentId: integer("apartment_id").notNull(),
  createdBy: integer("created_by").notNull(),
  assignedTo: integer("assigned_to"), // Admin who's handling it
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
  resolutionNotes: text("resolution_notes"),
});

// Complaint comments/updates
export const complaintComments = pgTable("complaint_comments", {
  id: serial("id").primaryKey(),
  complaintId: integer("complaint_id").notNull(),
  userId: integer("user_id").notNull(),
  comment: text("comment").notNull(),
  isInternal: boolean("is_internal").default(false).notNull(), // Internal notes visible only to admin
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Vehicles table
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  apartmentId: integer("apartment_id").notNull(),
  vehicleType: text("vehicle_type").notNull(), // 'car', 'bike', 'scooter', 'other'
  vehicleNumber: text("vehicle_number").notNull(),
  makeModel: text("make_model"),
  color: text("color"),
  parkingSlot: text("parking_slot"),
  isPrimary: boolean("is_primary").default(false).notNull(),
  registeredBy: integer("registered_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // User who receives the notification
  type: text("type").notNull(), // 'booking', 'complaint', 'notice', 'visitor', 'system'
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"), // URL to navigate to when clicked
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const updateUserSchema = z.object({
  isAdmin: z.boolean(),
});
export const updateUserRoleSchema = z.object({
  role: z.enum(["admin", "resident", "guard"]),
});
export const insertApartmentSchema = createInsertSchema(apartments);
export const updateApartmentSchema = z.object({
  ownerName: z.string().nullable(),
  status: z.enum(["AVAILABLE_RENT", "AVAILABLE_SALE", "OCCUPIED"]),
  monthlyRent: z.string().nullable(),
  salePrice: z.string().nullable(),
  contactNumber: z.string().nullable(),
});
export const insertBookingSchema = createInsertSchema(bookings)
  .omit({ id: true })
  .extend({
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
  });

// Visitor schemas
export const insertVisitorSchema = createInsertSchema(visitors).omit({
  id: true,
  entryTime: true,
  exitTime: true,
  status: true,
});
export const checkoutVisitorSchema = z.object({
  notes: z.string().optional(),
});

// Pre-approved visitor schemas
export const insertPreApprovedVisitorSchema = createInsertSchema(preApprovedVisitors).omit({
  id: true,
  status: true,
  createdAt: true,
}).extend({
  expectedDate: z.coerce.date(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Tower = typeof towers.$inferSelect;
export type Apartment = typeof apartments.$inferSelect;
export type Amenity = typeof amenities.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Notice = typeof notices.$inferSelect;
export type InsertNotice = typeof notices.$inferInsert;
export type Visitor = typeof visitors.$inferSelect;
export type InsertVisitor = z.infer<typeof insertVisitorSchema>;
export type PreApprovedVisitor = typeof preApprovedVisitors.$inferSelect;
export type InsertPreApprovedVisitor = z.infer<typeof insertPreApprovedVisitorSchema>;
export type Complaint = typeof complaints.$inferSelect;
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type ComplaintComment = typeof complaintComments.$inferSelect;
export type InsertComplaintComment = z.infer<typeof insertComplaintCommentSchema>;

export const insertNoticeSchema = createInsertSchema(notices).omit({
  id: true,
});

// Complaint schemas
export const insertComplaintSchema = createInsertSchema(complaints).omit({
  id: true,
  status: true,
  assignedTo: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
  resolutionNotes: true,
});

export const updateComplaintSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed", "rejected"]).optional(),
  assignedTo: z.number().nullable().optional(),
  resolutionNotes: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
});

export const insertComplaintCommentSchema = createInsertSchema(complaintComments).omit({
  id: true,
  createdAt: true,
});

// Profile update schema
export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email").optional().nullable(),
  phone: z.string().optional().nullable(),
  profilePicture: z.string().optional().nullable(),
});

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Vehicle schemas
export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  createdAt: true,
});

export const updateVehicleSchema = z.object({
  vehicleType: z.enum(["car", "bike", "scooter", "other"]).optional(),
  vehicleNumber: z.string().min(1).optional(),
  makeModel: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  parkingSlot: z.string().optional().nullable(),
  isPrimary: z.boolean().optional(),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

// Amenity schemas
export const insertAmenitySchema = createInsertSchema(amenities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateAmenitySchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().optional(),
  description: z.string().optional().nullable(),
  maxCapacity: z.number().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export type InsertAmenity = z.infer<typeof insertAmenitySchema>;

// Notification schemas
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  isRead: true,
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Notification preferences table
export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(), // One preference set per user
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
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const updateNotificationPreferencesSchema = z.object({
  bookingNotifications: z.boolean().optional(),
  complaintNotifications: z.boolean().optional(),
  visitorNotifications: z.boolean().optional(),
  noticeNotifications: z.boolean().optional(),
  systemNotifications: z.boolean().optional(),
  emailBookingNotifications: z.boolean().optional(),
  emailComplaintNotifications: z.boolean().optional(),
  emailVisitorNotifications: z.boolean().optional(),
  emailNoticeNotifications: z.boolean().optional(),
  emailEmergencyNotifications: z.boolean().optional(),
});

export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type UpdateNotificationPreferences = z.infer<typeof updateNotificationPreferencesSchema>;

// Storage Management - Monthly Cleanup Tracking
export const cleanupLogs = pgTable("cleanup_logs", {
  id: serial("id").primaryKey(),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(), // 25th of the month
  reminderStartDate: timestamp("reminder_start_date").notNull(), // 20th of the month
  status: text("status").default("pending").notNull(), // 'pending', 'reminded', 'downloaded', 'completed', 'skipped'

  // CSV download tracking
  bookingsCsvDownloaded: boolean("bookings_csv_downloaded").default(false).notNull(),
  visitorsCsvDownloaded: boolean("visitors_csv_downloaded").default(false).notNull(),
  complaintsCsvDownloaded: boolean("complaints_csv_downloaded").default(false).notNull(),
  notificationsCsvDownloaded: boolean("notifications_csv_downloaded").default(false).notNull(),
  noticesCsvDownloaded: boolean("notices_csv_downloaded").default(false).notNull(),

  // Cleanup statistics
  bookingsDeleted: integer("bookings_deleted").default(0),
  visitorsDeleted: integer("visitors_deleted").default(0),
  complaintsDeleted: integer("complaints_deleted").default(0),
  notificationsDeleted: integer("notifications_deleted").default(0),
  noticesDeleted: integer("notices_deleted").default(0),

  // Email tracking
  emailSentAt: timestamp("email_sent_at"),
  emailSentTo: text("email_sent_to"),

  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CleanupLog = typeof cleanupLogs.$inferSelect;
export type InsertCleanupLog = typeof cleanupLogs.$inferInsert;
