import { Express } from "express";
import { storage } from "../storage.js";
import type { InsertNotification } from "../../shared/schema.js";
import { updateNotificationPreferencesSchema } from "../../shared/schema.js";
import { ZodError } from "zod";

export function registerNotificationRoutes(app: Express) {
  // Get all notifications for the current user
  app.get("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const notifications = await storage.getNotificationsByUser(req.user!.id);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Get unread notification count
  app.get("/api/notifications/unread-count", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const count = await storage.getUnreadNotificationCount(req.user!.id);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });

  // Mark a notification as read
  app.patch("/api/notifications/:id/read", async (req, res) => {
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

  // Mark all notifications as read
  app.patch("/api/notifications/read-all", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      await storage.markAllNotificationsAsRead(req.user!.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ error: "Failed to mark notifications as read" });
    }
  });

  // Delete a notification
  app.delete("/api/notifications/:id", async (req, res) => {
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

  // Get notification preferences
  app.get("/api/notifications/preferences", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      let prefs = await storage.getNotificationPreferences(req.user!.id);

      // If no preferences exist, return defaults
      if (!prefs) {
        prefs = {
          id: 0,
          userId: req.user!.id,
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
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      res.json(prefs);
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      res.status(500).json({ error: "Failed to fetch notification preferences" });
    }
  });

  // Update notification preferences
  app.patch("/api/notifications/preferences", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const updateData = updateNotificationPreferencesSchema.parse(req.body);
      const prefs = await storage.updateNotificationPreferences(req.user!.id, updateData);
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

// Helper function to create notifications - can be imported by other routes
// Respects user notification preferences
export async function createNotification(data: InsertNotification): Promise<void> {
  try {
    // Check if user has disabled this notification type
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

// Helper to send notification to all admins
export async function notifyAdmins(
  type: string,
  title: string,
  message: string,
  link?: string
): Promise<void> {
  try {
    const users = await storage.getAllUsers();
    const admins = users.filter((u) => u.role === "admin" || u.isAdmin);

    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type,
        title,
        message,
        link: link || null,
      });
    }
  } catch (error) {
    console.error("Error notifying admins:", error);
  }
}

// Helper to send notification to residents of an apartment
export async function notifyApartmentResidents(
  apartmentId: number,
  type: string,
  title: string,
  message: string,
  link?: string,
  excludeUserId?: number
): Promise<void> {
  try {
    const residents = await storage.getUsersByApartment(apartmentId);

    for (const resident of residents) {
      if (excludeUserId && resident.id === excludeUserId) continue;
      await createNotification({
        userId: resident.id,
        type,
        title,
        message,
        link: link || null,
      });
    }
  } catch (error) {
    console.error("Error notifying apartment residents:", error);
  }
}
