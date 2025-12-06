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
  notices,
  type Notice,
  visitors,
  type Visitor,
  type InsertVisitor,
  preApprovedVisitors,
  type PreApprovedVisitor,
  type InsertPreApprovedVisitor,
  complaints,
  type Complaint,
  type InsertComplaint,
  complaintComments,
  type ComplaintComment,
  type InsertComplaintComment,
  vehicles,
  type Vehicle,
  type InsertVehicle,
  type InsertAmenity,
  notifications,
  type Notification,
  type InsertNotification,
  notificationPreferences,
  type NotificationPreferences,
  type UpdateNotificationPreferences,
  towers,
  type Tower,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, lt, isNull, isNotNull, desc, gte, lte } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import createMemoryStore from "memorystore";

const PostgresSessionStore = connectPg(session);
const MemoryStore = createMemoryStore(session);

// Use memory store in production (serverless) to avoid connection pool issues
const isProduction = process.env.NODE_ENV === 'production';

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<void>;

  // User-Apartment Assignment
  assignApartment(userId: number, apartmentId: number, residentType: "OWNER" | "TENANT"): Promise<User>;
  removeApartmentAssignment(userId: number): Promise<User>;
  getUsersByApartment(apartmentId: number): Promise<User[]>;
  getUsersWithoutApartment(): Promise<User[]>;

  // Towers
  getTower(id: number): Promise<Tower | undefined>;
  getTowers(): Promise<Tower[]>;

  // Apartments
  getApartments(): Promise<Apartment[]>;
  getApartment(id: number): Promise<Apartment | undefined>;
  getApartmentsByTower(towerId: number): Promise<Apartment[]>;
  updateApartment(id: number, data: Partial<Apartment>): Promise<Apartment>;

  // Amenities
  getAmenities(): Promise<Amenity[]>;
  getAllAmenities(): Promise<Amenity[]>; // includes inactive
  getAmenity(id: number): Promise<Amenity | undefined>;
  createAmenity(amenity: InsertAmenity): Promise<Amenity>;
  updateAmenity(id: number, data: Partial<Amenity>): Promise<Amenity>;
  deleteAmenity(id: number): Promise<void>;

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

  // Notices
  createNotice(notice: Omit<Notice, "id">): Promise<Notice>;
  getNotices(): Promise<Notice[]>;
  getActiveNotices(): Promise<Notice[]>;
  getArchivedNotices(): Promise<Notice[]>;
  deleteNotice(id: number): Promise<void>;
  archiveExpiredNotices(): Promise<void>;

  // Visitors
  createVisitor(visitor: InsertVisitor): Promise<Visitor>;
  getVisitor(id: number): Promise<Visitor | undefined>;
  getActiveVisitors(): Promise<Visitor[]>;
  getAllVisitors(): Promise<Visitor[]>;
  getVisitorsByApartment(apartmentId: number): Promise<Visitor[]>;
  checkoutVisitor(id: number, notes?: string): Promise<Visitor>;
  getTodayVisitors(): Promise<Visitor[]>;

  // Pre-approved Visitors
  createPreApprovedVisitor(visitor: InsertPreApprovedVisitor): Promise<PreApprovedVisitor>;
  getPreApprovedVisitor(id: number): Promise<PreApprovedVisitor | undefined>;
  getPreApprovedVisitorsByApartment(apartmentId: number): Promise<PreApprovedVisitor[]>;
  getPendingPreApprovedVisitors(): Promise<PreApprovedVisitor[]>;
  updatePreApprovedVisitorStatus(id: number, status: string): Promise<PreApprovedVisitor>;
  cancelPreApprovedVisitor(id: number): Promise<void>;
  expireOldPreApprovals(): Promise<PreApprovedVisitor[]>;

  // Complaints
  createComplaint(complaint: InsertComplaint): Promise<Complaint>;
  getComplaint(id: number): Promise<Complaint | undefined>;
  getAllComplaints(): Promise<Complaint[]>;
  getComplaintsByApartment(apartmentId: number): Promise<Complaint[]>;
  getComplaintsByUser(userId: number): Promise<Complaint[]>;
  updateComplaint(id: number, data: Partial<Complaint>): Promise<Complaint>;

  // Complaint Comments
  createComplaintComment(comment: InsertComplaintComment): Promise<ComplaintComment>;
  getComplaintComments(complaintId: number, includeInternal: boolean): Promise<ComplaintComment[]>;

  // Vehicles
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  getVehiclesByApartment(apartmentId: number): Promise<Vehicle[]>;
  getAllVehicles(): Promise<Vehicle[]>;
  updateVehicle(id: number, data: Partial<Vehicle>): Promise<Vehicle>;
  deleteVehicle(id: number): Promise<void>;

  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  markNotificationAsRead(id: number): Promise<Notification>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  deleteNotification(id: number): Promise<void>;
  deleteOldNotifications(daysOld: number): Promise<void>;

  // Notification Preferences
  getNotificationPreferences(userId: number): Promise<NotificationPreferences | undefined>;
  createNotificationPreferences(userId: number): Promise<NotificationPreferences>;
  updateNotificationPreferences(userId: number, data: UpdateNotificationPreferences): Promise<NotificationPreferences>;
  shouldSendNotification(userId: number, type: string): Promise<boolean>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Use MemoryStore in production (serverless), PostgreSQL session store locally
    this.sessionStore = isProduction
      ? new MemoryStore({
          checkPeriod: 86400000, // prune expired entries every 24h
        })
      : new PostgresSessionStore({
          pool: pool!,
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

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.googleId, googleId));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // User-Apartment Assignment Methods
  async assignApartment(userId: number, apartmentId: number, residentType: "OWNER" | "TENANT"): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ apartmentId, residentType })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async removeApartmentAssignment(userId: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ apartmentId: null, residentType: null })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUsersByApartment(apartmentId: number): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.apartmentId, apartmentId));
  }

  async getUsersWithoutApartment(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(isNull(users.apartmentId));
  }

  async getTower(id: number): Promise<Tower | undefined> {
    const [tower] = await db.select().from(towers).where(eq(towers.id, id));
    return tower;
  }

  async getTowers(): Promise<Tower[]> {
    return await db.select().from(towers);
  }

  async getApartments(): Promise<Apartment[]> {
    return await db.select().from(apartments);
  }

  async getApartment(id: number): Promise<Apartment | undefined> {
    const [apartment] = await db
      .select()
      .from(apartments)
      .where(eq(apartments.id, id));
    return apartment;
  }

  async getApartmentsByTower(towerId: number): Promise<Apartment[]> {
    return await db
      .select()
      .from(apartments)
      .where(eq(apartments.towerId, towerId));
  }

  async getAmenities(): Promise<Amenity[]> {
    // Return only active amenities for regular users
    return await db
      .select()
      .from(amenities)
      .where(eq(amenities.isActive, true));
  }

  async getAllAmenities(): Promise<Amenity[]> {
    // Return all amenities including inactive (for admin)
    return await db.select().from(amenities);
  }

  async getAmenity(id: number): Promise<Amenity | undefined> {
    const [amenity] = await db
      .select()
      .from(amenities)
      .where(eq(amenities.id, id));
    return amenity;
  }

  async createAmenity(amenity: InsertAmenity): Promise<Amenity> {
    const [newAmenity] = await db.insert(amenities).values(amenity).returning();
    return newAmenity;
  }

  async updateAmenity(id: number, data: Partial<Amenity>): Promise<Amenity> {
    const [amenity] = await db
      .update(amenities)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(amenities.id, id))
      .returning();
    return amenity;
  }

  async deleteAmenity(id: number): Promise<void> {
    // Soft delete by setting isActive to false
    await db
      .update(amenities)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(amenities.id, id));
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

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async createNotice(notice: Omit<Notice, "id">): Promise<Notice> {
    const [newNotice] = await db.insert(notices).values(notice).returning();
    return newNotice;
  }

  async getNotices(): Promise<Notice[]> {
    // Only return non-archived notices
    return await db
      .select()
      .from(notices)
      .where(eq(notices.isArchived, false));
  }

  async getActiveNotices(): Promise<Notice[]> {
    // Return non-archived, non-expired notices
    const now = new Date();
    const allNotices = await db
      .select()
      .from(notices)
      .where(eq(notices.isArchived, false));

    // Filter out expired notices
    return allNotices.filter(n => !n.expiresAt || new Date(n.expiresAt) > now);
  }

  async getArchivedNotices(): Promise<Notice[]> {
    // Return only archived notices for admin viewing
    return await db
      .select()
      .from(notices)
      .where(eq(notices.isArchived, true));
  }

  async deleteNotice(id: number): Promise<void> {
    await db.delete(notices).where(eq(notices.id, id));
  }

  async archiveExpiredNotices(): Promise<void> {
    const now = new Date();
    // Archive notices that have expired (instead of deleting)
    await db
      .update(notices)
      .set({ isArchived: true })
      .where(
        and(
          isNotNull(notices.expiresAt),
          lt(notices.expiresAt, now),
          eq(notices.isArchived, false)
        )
      );
  }

  // Visitor Methods
  async createVisitor(visitor: InsertVisitor): Promise<Visitor> {
    const [newVisitor] = await db.insert(visitors).values(visitor).returning();
    return newVisitor;
  }

  async getVisitor(id: number): Promise<Visitor | undefined> {
    const [visitor] = await db.select().from(visitors).where(eq(visitors.id, id));
    return visitor;
  }

  async getActiveVisitors(): Promise<Visitor[]> {
    return await db
      .select()
      .from(visitors)
      .where(eq(visitors.status, "inside"))
      .orderBy(desc(visitors.entryTime));
  }

  async getAllVisitors(): Promise<Visitor[]> {
    return await db
      .select()
      .from(visitors)
      .orderBy(desc(visitors.entryTime));
  }

  async getVisitorsByApartment(apartmentId: number): Promise<Visitor[]> {
    return await db
      .select()
      .from(visitors)
      .where(eq(visitors.apartmentId, apartmentId))
      .orderBy(desc(visitors.entryTime));
  }

  async checkoutVisitor(id: number, notes?: string): Promise<Visitor> {
    const updateData: Partial<Visitor> = {
      status: "checked_out",
      exitTime: new Date(),
    };
    if (notes) {
      updateData.notes = notes;
    }
    const [visitor] = await db
      .update(visitors)
      .set(updateData)
      .where(eq(visitors.id, id))
      .returning();

    // If this visitor was from a pre-approval, mark the pre-approval as completed
    if (visitor.preApprovedVisitorId) {
      await db
        .update(preApprovedVisitors)
        .set({ status: "completed" })
        .where(eq(preApprovedVisitors.id, visitor.preApprovedVisitorId));
    }

    return visitor;
  }

  async getTodayVisitors(): Promise<Visitor[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await db
      .select()
      .from(visitors)
      .where(
        and(
          gte(visitors.entryTime, today),
          lt(visitors.entryTime, tomorrow)
        )
      )
      .orderBy(desc(visitors.entryTime));
  }

  // Pre-approved Visitor Methods
  async createPreApprovedVisitor(visitor: InsertPreApprovedVisitor): Promise<PreApprovedVisitor> {
    const [newVisitor] = await db.insert(preApprovedVisitors).values(visitor).returning();
    return newVisitor;
  }

  async getPreApprovedVisitor(id: number): Promise<PreApprovedVisitor | undefined> {
    const [visitor] = await db
      .select()
      .from(preApprovedVisitors)
      .where(eq(preApprovedVisitors.id, id));
    return visitor;
  }

  async getPreApprovedVisitorsByApartment(apartmentId: number): Promise<PreApprovedVisitor[]> {
    return await db
      .select()
      .from(preApprovedVisitors)
      .where(eq(preApprovedVisitors.apartmentId, apartmentId))
      .orderBy(desc(preApprovedVisitors.expectedDate));
  }

  async getPendingPreApprovedVisitors(): Promise<PreApprovedVisitor[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await db
      .select()
      .from(preApprovedVisitors)
      .where(
        and(
          eq(preApprovedVisitors.status, "pending"),
          gte(preApprovedVisitors.expectedDate, today)
        )
      )
      .orderBy(preApprovedVisitors.expectedDate);
  }

  async updatePreApprovedVisitorStatus(id: number, status: string): Promise<PreApprovedVisitor> {
    const [visitor] = await db
      .update(preApprovedVisitors)
      .set({ status })
      .where(eq(preApprovedVisitors.id, id))
      .returning();
    return visitor;
  }

  async cancelPreApprovedVisitor(id: number): Promise<void> {
    await db
      .update(preApprovedVisitors)
      .set({ status: "cancelled" })
      .where(eq(preApprovedVisitors.id, id));
  }

  async expireOldPreApprovals(): Promise<PreApprovedVisitor[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // First, get the pre-approvals that will be expired (for notification purposes)
    const toExpire = await db
      .select()
      .from(preApprovedVisitors)
      .where(
        and(
          eq(preApprovedVisitors.status, "pending"),
          lt(preApprovedVisitors.expectedDate, today)
        )
      );

    // Then update them
    if (toExpire.length > 0) {
      await db
        .update(preApprovedVisitors)
        .set({ status: "expired" })
        .where(
          and(
            eq(preApprovedVisitors.status, "pending"),
            lt(preApprovedVisitors.expectedDate, today)
          )
        );
    }

    return toExpire;
  }

  // Complaint Methods
  async createComplaint(complaint: InsertComplaint): Promise<Complaint> {
    const [newComplaint] = await db.insert(complaints).values(complaint).returning();
    return newComplaint;
  }

  async getComplaint(id: number): Promise<Complaint | undefined> {
    const [complaint] = await db
      .select()
      .from(complaints)
      .where(eq(complaints.id, id));
    return complaint;
  }

  async getAllComplaints(): Promise<Complaint[]> {
    return await db
      .select()
      .from(complaints)
      .orderBy(desc(complaints.createdAt));
  }

  async getComplaintsByApartment(apartmentId: number): Promise<Complaint[]> {
    return await db
      .select()
      .from(complaints)
      .where(eq(complaints.apartmentId, apartmentId))
      .orderBy(desc(complaints.createdAt));
  }

  async getComplaintsByUser(userId: number): Promise<Complaint[]> {
    return await db
      .select()
      .from(complaints)
      .where(eq(complaints.createdBy, userId))
      .orderBy(desc(complaints.createdAt));
  }

  async updateComplaint(id: number, data: Partial<Complaint>): Promise<Complaint> {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    // If status is being set to resolved, set resolvedAt
    if (data.status === "resolved" || data.status === "closed") {
      updateData.resolvedAt = new Date();
    }

    const [complaint] = await db
      .update(complaints)
      .set(updateData)
      .where(eq(complaints.id, id))
      .returning();
    return complaint;
  }

  // Complaint Comment Methods
  async createComplaintComment(comment: InsertComplaintComment): Promise<ComplaintComment> {
    const [newComment] = await db.insert(complaintComments).values(comment).returning();
    return newComment;
  }

  async getComplaintComments(complaintId: number, includeInternal: boolean): Promise<ComplaintComment[]> {
    if (includeInternal) {
      return await db
        .select()
        .from(complaintComments)
        .where(eq(complaintComments.complaintId, complaintId))
        .orderBy(complaintComments.createdAt);
    }

    return await db
      .select()
      .from(complaintComments)
      .where(
        and(
          eq(complaintComments.complaintId, complaintId),
          eq(complaintComments.isInternal, false)
        )
      )
      .orderBy(complaintComments.createdAt);
  }

  // Vehicle Methods
  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [newVehicle] = await db.insert(vehicles).values(vehicle).returning();
    return newVehicle;
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, id));
    return vehicle;
  }

  async getVehiclesByApartment(apartmentId: number): Promise<Vehicle[]> {
    return await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.apartmentId, apartmentId))
      .orderBy(desc(vehicles.createdAt));
  }

  async getAllVehicles(): Promise<Vehicle[]> {
    return await db
      .select()
      .from(vehicles)
      .orderBy(desc(vehicles.createdAt));
  }

  async updateVehicle(id: number, data: Partial<Vehicle>): Promise<Vehicle> {
    const [vehicle] = await db
      .update(vehicles)
      .set(data)
      .where(eq(vehicles.id, id))
      .returning();
    return vehicle;
  }

  async deleteVehicle(id: number): Promise<void> {
    await db.delete(vehicles).where(eq(vehicles.id, id));
  }

  // Notification Methods
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50); // Limit to last 50 notifications
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const result = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );
    return result.length;
  }

  async markNotificationAsRead(id: number): Promise<Notification> {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  async deleteOldNotifications(daysOld: number): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    await db
      .delete(notifications)
      .where(lt(notifications.createdAt, cutoffDate));
  }

  // Notification Preferences Methods
  async getNotificationPreferences(userId: number): Promise<NotificationPreferences | undefined> {
    const [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));
    return prefs;
  }

  async createNotificationPreferences(userId: number): Promise<NotificationPreferences> {
    const [prefs] = await db
      .insert(notificationPreferences)
      .values({ userId })
      .returning();
    return prefs;
  }

  async updateNotificationPreferences(userId: number, data: UpdateNotificationPreferences): Promise<NotificationPreferences> {
    // First, ensure preferences exist (create if not)
    let prefs = await this.getNotificationPreferences(userId);
    if (!prefs) {
      prefs = await this.createNotificationPreferences(userId);
    }

    const [updated] = await db
      .update(notificationPreferences)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(notificationPreferences.userId, userId))
      .returning();
    return updated;
  }

  async shouldSendNotification(userId: number, type: string): Promise<boolean> {
    const prefs = await this.getNotificationPreferences(userId);

    // If no preferences set, default to sending all notifications
    if (!prefs) return true;

    // Map notification type to preference field
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
        return true; // Unknown types default to sending
    }
  }
}

export const storage = new DatabaseStorage();
