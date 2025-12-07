import { Express } from "express";
import { storage } from "../storage.js";
import { db } from "../db.js";
import {
  cleanupLogs,
  bookings,
  visitors,
  complaints,
  notifications,
  notices,
  complaintComments
} from "../../shared/schema.js";
import { eq, and, lt, or, isNotNull } from "drizzle-orm";
import { createNotification, notifyAdmins } from "./notifications.js";
import nodemailer from "nodemailer";

// Helper to get 3 months ago date
function getThreeMonthsAgoDate(): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - 3);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Helper to get current cleanup period info
function getCurrentCleanupPeriod() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();
  const day = now.getDate();

  // Reminder starts on 20th
  const reminderStartDate = new Date(year, now.getMonth(), 20);
  // Cleanup happens on 25th
  const scheduledDate = new Date(year, now.getMonth(), 25);

  const isReminderPeriod = day >= 20 && day < 25;
  const isCleanupDay = day === 25;
  const isPastCleanupDay = day > 25;

  return {
    month,
    year,
    reminderStartDate,
    scheduledDate,
    isReminderPeriod,
    isCleanupDay,
    isPastCleanupDay,
    cutoffDate: getThreeMonthsAgoDate(),
  };
}

// Get data counts for cleanup preview
async function getCleanupPreview(cutoffDate: Date) {
  const threeMonthsAgo = cutoffDate;

  // Count bookings older than 3 months (all statuses except PENDING)
  const oldBookings = await db
    .select()
    .from(bookings)
    .where(
      and(
        lt(bookings.startTime, threeMonthsAgo),
        or(eq(bookings.status, "APPROVED"), eq(bookings.status, "REJECTED"))
      )
    );

  // Count visitors older than 3 months (only checked out)
  const oldVisitors = await db
    .select()
    .from(visitors)
    .where(
      and(
        lt(visitors.entryTime, threeMonthsAgo),
        eq(visitors.status, "checked_out")
      )
    );

  // Count resolved complaints older than 3 months
  const oldComplaints = await db
    .select()
    .from(complaints)
    .where(
      and(
        lt(complaints.createdAt, threeMonthsAgo),
        or(eq(complaints.status, "resolved"), eq(complaints.status, "closed"))
      )
    );

  // Count all notifications older than 3 months
  const oldNotifications = await db
    .select()
    .from(notifications)
    .where(lt(notifications.createdAt, threeMonthsAgo));

  // Count expired notices older than 3 months
  const oldNotices = await db
    .select()
    .from(notices)
    .where(
      and(
        lt(notices.createdAt, threeMonthsAgo),
        or(eq(notices.isArchived, true), isNotNull(notices.expiresAt))
      )
    );

  return {
    bookings: oldBookings.length,
    visitors: oldVisitors.length,
    complaints: oldComplaints.length,
    notifications: oldNotifications.length,
    notices: oldNotices.length,
    cutoffDate: threeMonthsAgo.toISOString(),
  };
}

// Generate CSV content for bookings
async function generateBookingsCSV(cutoffDate: Date): Promise<string> {
  const threeMonthsAgo = cutoffDate;

  const oldBookings = await db
    .select()
    .from(bookings)
    .where(
      and(
        lt(bookings.startTime, threeMonthsAgo),
        or(eq(bookings.status, "APPROVED"), eq(bookings.status, "REJECTED"))
      )
    );

  const allUsers = await storage.getAllUsers();
  const allAmenities = await storage.getAllAmenities();

  const userMap = new Map(allUsers.map((u) => [u.id, u.name]));
  const amenityMap = new Map(allAmenities.map((a) => [a.id, a.name]));

  let csv = "ID,User,Amenity,Start Time,End Time,Status,Created At\n";

  for (const b of oldBookings) {
    const userName = userMap.get(b.userId) || "Unknown";
    const amenityName = amenityMap.get(b.amenityId) || "Unknown";
    csv += `${b.id},"${userName}","${amenityName}","${b.startTime}","${b.endTime}","${b.status}","${b.startTime}"\n`;
  }

  return csv;
}

// Generate CSV content for visitors
async function generateVisitorsCSV(cutoffDate: Date): Promise<string> {
  const threeMonthsAgo = cutoffDate;

  const oldVisitors = await db
    .select()
    .from(visitors)
    .where(
      and(
        lt(visitors.entryTime, threeMonthsAgo),
        eq(visitors.status, "checked_out")
      )
    );

  const allApartments = await storage.getApartments();
  const allTowers = await storage.getTowers();

  const towerMap = new Map(allTowers.map((t) => [t.id, t.name]));
  const apartmentMap = new Map(
    allApartments.map((a) => [
      a.id,
      { number: a.number, tower: towerMap.get(a.towerId) },
    ])
  );

  let csv =
    "ID,Name,Mobile,Purpose,Apartment,Tower,Entry Time,Exit Time,Status,Vehicle Number,Notes\n";

  for (const v of oldVisitors) {
    const apt = apartmentMap.get(v.apartmentId);
    csv += `${v.id},"${v.name}","${v.mobileNumber}","${v.purpose}","${apt?.number || ""}","${apt?.tower || ""}","${v.entryTime}","${v.exitTime || ""}","${v.status}","${v.vehicleNumber || ""}","${v.notes || ""}"\n`;
  }

  return csv;
}

// Generate CSV content for complaints
async function generateComplaintsCSV(cutoffDate: Date): Promise<string> {
  const threeMonthsAgo = cutoffDate;

  const oldComplaints = await db
    .select()
    .from(complaints)
    .where(
      and(
        lt(complaints.createdAt, threeMonthsAgo),
        or(eq(complaints.status, "resolved"), eq(complaints.status, "closed"))
      )
    );

  const allUsers = await storage.getAllUsers();
  const allApartments = await storage.getApartments();
  const allTowers = await storage.getTowers();

  const userMap = new Map(allUsers.map((u) => [u.id, u.name]));
  const towerMap = new Map(allTowers.map((t) => [t.id, t.name]));
  const apartmentMap = new Map(
    allApartments.map((a) => [
      a.id,
      { number: a.number, tower: towerMap.get(a.towerId) },
    ])
  );

  let csv =
    "ID,Title,Description,Category,Priority,Status,Apartment,Tower,Created By,Created At,Resolved At,Resolution Notes\n";

  for (const c of oldComplaints) {
    const apt = apartmentMap.get(c.apartmentId);
    const createdBy = userMap.get(c.createdBy) || "Unknown";
    csv += `${c.id},"${c.title}","${c.description?.replace(/"/g, '""') || ""}","${c.category}","${c.priority}","${c.status}","${apt?.number || ""}","${apt?.tower || ""}","${createdBy}","${c.createdAt}","${c.resolvedAt || ""}","${c.resolutionNotes?.replace(/"/g, '""') || ""}"\n`;
  }

  return csv;
}

// Generate CSV content for notifications
async function generateNotificationsCSV(cutoffDate: Date): Promise<string> {
  const threeMonthsAgo = cutoffDate;

  const oldNotifications = await db
    .select()
    .from(notifications)
    .where(lt(notifications.createdAt, threeMonthsAgo));

  const allUsers = await storage.getAllUsers();
  const userMap = new Map(allUsers.map((u) => [u.id, u.name]));

  let csv = "ID,User,Type,Title,Message,Is Read,Created At\n";

  for (const n of oldNotifications) {
    const userName = userMap.get(n.userId) || "Unknown";
    csv += `${n.id},"${userName}","${n.type}","${n.title}","${n.message?.replace(/"/g, '""') || ""}",${n.isRead},"${n.createdAt}"\n`;
  }

  return csv;
}

// Generate CSV content for notices
async function generateNoticesCSV(cutoffDate: Date): Promise<string> {
  const threeMonthsAgo = cutoffDate;

  const oldNotices = await db
    .select()
    .from(notices)
    .where(
      and(
        lt(notices.createdAt, threeMonthsAgo),
        or(eq(notices.isArchived, true), isNotNull(notices.expiresAt))
      )
    );

  const allUsers = await storage.getAllUsers();
  const userMap = new Map(allUsers.map((u) => [u.id, u.name]));

  let csv = "ID,Title,Content,Priority,Created By,Created At,Expires At,Is Archived\n";

  for (const n of oldNotices) {
    const createdBy = userMap.get(n.createdBy) || "Unknown";
    csv += `${n.id},"${n.title}","${n.content?.replace(/"/g, '""') || ""}","${n.priority}","${createdBy}","${n.createdAt}","${n.expiresAt || ""}",${n.isArchived}\n`;
  }

  return csv;
}

// Perform the actual cleanup
async function performCleanup(cutoffDate: Date) {
  const threeMonthsAgo = cutoffDate;
  const results = {
    bookingsDeleted: 0,
    visitorsDeleted: 0,
    complaintsDeleted: 0,
    notificationsDeleted: 0,
    noticesDeleted: 0,
  };

  // Delete old bookings
  const deletedBookings = await db
    .delete(bookings)
    .where(
      and(
        lt(bookings.startTime, threeMonthsAgo),
        or(eq(bookings.status, "APPROVED"), eq(bookings.status, "REJECTED"))
      )
    )
    .returning();
  results.bookingsDeleted = deletedBookings.length;

  // Delete old visitors
  const deletedVisitors = await db
    .delete(visitors)
    .where(
      and(
        lt(visitors.entryTime, threeMonthsAgo),
        eq(visitors.status, "checked_out")
      )
    )
    .returning();
  results.visitorsDeleted = deletedVisitors.length;

  // Get complaint IDs to delete for deleting related comments first
  const complaintsToDelete = await db
    .select({ id: complaints.id })
    .from(complaints)
    .where(
      and(
        lt(complaints.createdAt, threeMonthsAgo),
        or(eq(complaints.status, "resolved"), eq(complaints.status, "closed"))
      )
    );

  // Delete complaint comments first
  for (const c of complaintsToDelete) {
    await db
      .delete(complaintComments)
      .where(eq(complaintComments.complaintId, c.id));
  }

  // Delete old complaints
  const deletedComplaints = await db
    .delete(complaints)
    .where(
      and(
        lt(complaints.createdAt, threeMonthsAgo),
        or(eq(complaints.status, "resolved"), eq(complaints.status, "closed"))
      )
    )
    .returning();
  results.complaintsDeleted = deletedComplaints.length;

  // Delete old notifications
  const deletedNotifications = await db
    .delete(notifications)
    .where(lt(notifications.createdAt, threeMonthsAgo))
    .returning();
  results.notificationsDeleted = deletedNotifications.length;

  // Delete old expired/archived notices
  const deletedNotices = await db
    .delete(notices)
    .where(
      and(
        lt(notices.createdAt, threeMonthsAgo),
        or(eq(notices.isArchived, true), isNotNull(notices.expiresAt))
      )
    )
    .returning();
  results.noticesDeleted = deletedNotices.length;

  return results;
}

// Send cleanup email with CSV attachments
async function sendCleanupEmail(adminEmail: string, month: number, year: number, cutoffDate: Date) {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const monthName = monthNames[month - 1];

  // Generate all CSVs
  const bookingsCSV = await generateBookingsCSV(cutoffDate);
  const visitorsCSV = await generateVisitorsCSV(cutoffDate);
  const complaintsCSV = await generateComplaintsCSV(cutoffDate);
  const notificationsCSV = await generateNotificationsCSV(cutoffDate);
  const noticesCSV = await generateNoticesCSV(cutoffDate);

  // Create email transporter (using environment variables)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const preview = await getCleanupPreview(cutoffDate);

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a1a2e; border-bottom: 2px solid #16213e; padding-bottom: 10px;">
        Monthly Data Backup - ${monthName} ${year}
      </h1>

      <p style="color: #444; font-size: 16px;">
        Dear Administrator,
      </p>

      <p style="color: #444; font-size: 14px;">
        Please find attached the monthly data exports for your Society Management System.
        This data is scheduled for cleanup as it is older than 3 months.
      </p>

      <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #16213e; margin-top: 0;">Data Summary:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px 0; color: #666;">Bookings</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">${preview.bookings} records</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px 0; color: #666;">Visitor Logs</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">${preview.visitors} records</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px 0; color: #666;">Resolved Complaints</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">${preview.complaints} records</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px 0; color: #666;">Notifications</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">${preview.notifications} records</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Expired Notices</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">${preview.notices} records</td>
          </tr>
        </table>
      </div>

      <p style="color: #444; font-size: 14px;">
        <strong>Important:</strong> The automatic cleanup will occur on the 25th of this month.
        Please download and save these attachments for your records.
      </p>

      <p style="color: #888; font-size: 12px; margin-top: 30px;">
        This is an automated message from your Society Management System.
      </p>
    </div>
  `;

  const mailOptions = {
    from: process.env.SMTP_FROM || "noreply@societymanagement.com",
    to: adminEmail,
    subject: `[Society Management] Monthly Data Backup - ${monthName} ${year}`,
    html: emailHtml,
    attachments: [
      {
        filename: `bookings-${monthName.toLowerCase()}-${year}.csv`,
        content: bookingsCSV,
      },
      {
        filename: `visitors-${monthName.toLowerCase()}-${year}.csv`,
        content: visitorsCSV,
      },
      {
        filename: `complaints-${monthName.toLowerCase()}-${year}.csv`,
        content: complaintsCSV,
      },
      {
        filename: `notifications-${monthName.toLowerCase()}-${year}.csv`,
        content: notificationsCSV,
      },
      {
        filename: `notices-${monthName.toLowerCase()}-${year}.csv`,
        content: noticesCSV,
      },
    ],
  };

  await transporter.sendMail(mailOptions);
}

export function registerStorageManagementRoutes(app: Express) {
  // Get storage management status (admin only)
  app.get("/api/storage/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);

    try {
      const period = getCurrentCleanupPeriod();
      const preview = await getCleanupPreview(period.cutoffDate);

      // Get or create current cleanup log
      let [currentLog] = await db
        .select()
        .from(cleanupLogs)
        .where(
          and(
            eq(cleanupLogs.month, period.month),
            eq(cleanupLogs.year, period.year)
          )
        );

      if (!currentLog) {
        // Create a new cleanup log for this month
        [currentLog] = await db
          .insert(cleanupLogs)
          .values({
            month: period.month,
            year: period.year,
            scheduledDate: period.scheduledDate,
            reminderStartDate: period.reminderStartDate,
            status: "pending",
          })
          .returning();
      }

      // Check if all CSVs are downloaded
      const allDownloaded =
        currentLog.bookingsCsvDownloaded &&
        currentLog.visitorsCsvDownloaded &&
        currentLog.complaintsCsvDownloaded &&
        currentLog.notificationsCsvDownloaded &&
        currentLog.noticesCsvDownloaded;

      res.json({
        currentPeriod: {
          month: period.month,
          year: period.year,
          isReminderPeriod: period.isReminderPeriod,
          isCleanupDay: period.isCleanupDay,
          isPastCleanupDay: period.isPastCleanupDay,
          scheduledDate: period.scheduledDate,
          reminderStartDate: period.reminderStartDate,
          cutoffDate: period.cutoffDate,
        },
        preview,
        cleanupLog: currentLog,
        allDownloaded,
        shouldShowReminder: period.isReminderPeriod && !allDownloaded && currentLog.status !== "completed",
      });
    } catch (error) {
      console.error("Error fetching storage status:", error);
      res.status(500).json({ error: "Failed to fetch storage status" });
    }
  });

  // Export CSV for specific data type
  app.get("/api/storage/export/:type", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);

    const { type } = req.params;
    const period = getCurrentCleanupPeriod();

    try {
      let csvContent = "";
      let filename = "";

      switch (type) {
        case "bookings":
          csvContent = await generateBookingsCSV(period.cutoffDate);
          filename = `bookings-cleanup-${period.year}-${String(period.month).padStart(2, "0")}.csv`;
          break;
        case "visitors":
          csvContent = await generateVisitorsCSV(period.cutoffDate);
          filename = `visitors-cleanup-${period.year}-${String(period.month).padStart(2, "0")}.csv`;
          break;
        case "complaints":
          csvContent = await generateComplaintsCSV(period.cutoffDate);
          filename = `complaints-cleanup-${period.year}-${String(period.month).padStart(2, "0")}.csv`;
          break;
        case "notifications":
          csvContent = await generateNotificationsCSV(period.cutoffDate);
          filename = `notifications-cleanup-${period.year}-${String(period.month).padStart(2, "0")}.csv`;
          break;
        case "notices":
          csvContent = await generateNoticesCSV(period.cutoffDate);
          filename = `notices-cleanup-${period.year}-${String(period.month).padStart(2, "0")}.csv`;
          break;
        default:
          return res.status(400).json({ error: "Invalid export type" });
      }

      // Mark as downloaded in cleanup log
      const downloadField = `${type}CsvDownloaded` as keyof typeof cleanupLogs.$inferSelect;
      await db
        .update(cleanupLogs)
        .set({
          [downloadField]: true,
          updatedAt: new Date(),
        } as any)
        .where(
          and(
            eq(cleanupLogs.month, period.month),
            eq(cleanupLogs.year, period.year)
          )
        );

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting cleanup data:", error);
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  // Download all CSVs as a zip-like response (sequential downloads)
  app.get("/api/storage/export-all", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);

    try {
      const period = getCurrentCleanupPeriod();

      // Generate all CSVs
      const exports = {
        bookings: await generateBookingsCSV(period.cutoffDate),
        visitors: await generateVisitorsCSV(period.cutoffDate),
        complaints: await generateComplaintsCSV(period.cutoffDate),
        notifications: await generateNotificationsCSV(period.cutoffDate),
        notices: await generateNoticesCSV(period.cutoffDate),
      };

      // Mark all as downloaded
      await db
        .update(cleanupLogs)
        .set({
          bookingsCsvDownloaded: true,
          visitorsCsvDownloaded: true,
          complaintsCsvDownloaded: true,
          notificationsCsvDownloaded: true,
          noticesCsvDownloaded: true,
          status: "downloaded",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(cleanupLogs.month, period.month),
            eq(cleanupLogs.year, period.year)
          )
        );

      res.json({
        success: true,
        exports,
        message: "All data exported. You can now proceed with cleanup.",
      });
    } catch (error) {
      console.error("Error exporting all data:", error);
      res.status(500).json({ error: "Failed to export all data" });
    }
  });

  // Send email with all CSVs to admin
  app.post("/api/storage/send-email", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);

    try {
      const period = getCurrentCleanupPeriod();
      const adminEmail = req.user.email;

      if (!adminEmail) {
        return res.status(400).json({
          error: "No email configured for your account. Please update your profile with an email address."
        });
      }

      await sendCleanupEmail(adminEmail, period.month, period.year, period.cutoffDate);

      // Update cleanup log
      await db
        .update(cleanupLogs)
        .set({
          emailSentAt: new Date(),
          emailSentTo: adminEmail,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(cleanupLogs.month, period.month),
            eq(cleanupLogs.year, period.year)
          )
        );

      res.json({
        success: true,
        message: `Email sent successfully to ${adminEmail}`,
      });
    } catch (error) {
      console.error("Error sending cleanup email:", error);
      res.status(500).json({
        error: "Failed to send email. Please check SMTP configuration.",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Manually trigger cleanup (admin only)
  app.post("/api/storage/cleanup", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);

    try {
      const period = getCurrentCleanupPeriod();

      // Check if all CSVs are downloaded
      const [currentLog] = await db
        .select()
        .from(cleanupLogs)
        .where(
          and(
            eq(cleanupLogs.month, period.month),
            eq(cleanupLogs.year, period.year)
          )
        );

      if (!currentLog) {
        return res.status(400).json({ error: "No cleanup log found for this month" });
      }

      const allDownloaded =
        currentLog.bookingsCsvDownloaded &&
        currentLog.visitorsCsvDownloaded &&
        currentLog.complaintsCsvDownloaded &&
        currentLog.notificationsCsvDownloaded &&
        currentLog.noticesCsvDownloaded;

      // Allow cleanup if:
      // 1. All CSVs are downloaded, OR
      // 2. User explicitly confirms (force cleanup)
      const { force } = req.body;
      if (!allDownloaded && !force) {
        return res.status(400).json({
          error: "Not all CSVs have been downloaded yet",
          allDownloaded: false,
          downloadStatus: {
            bookings: currentLog.bookingsCsvDownloaded,
            visitors: currentLog.visitorsCsvDownloaded,
            complaints: currentLog.complaintsCsvDownloaded,
            notifications: currentLog.notificationsCsvDownloaded,
            notices: currentLog.noticesCsvDownloaded,
          },
        });
      }

      // Perform the cleanup
      const results = await performCleanup(period.cutoffDate);

      // Update cleanup log
      await db
        .update(cleanupLogs)
        .set({
          status: "completed",
          bookingsDeleted: results.bookingsDeleted,
          visitorsDeleted: results.visitorsDeleted,
          complaintsDeleted: results.complaintsDeleted,
          notificationsDeleted: results.notificationsDeleted,
          noticesDeleted: results.noticesDeleted,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(cleanupLogs.month, period.month),
            eq(cleanupLogs.year, period.year)
          )
        );

      // Notify all admins about the cleanup
      await notifyAdmins(
        "system",
        "Monthly Cleanup Completed",
        `Database cleanup completed. Deleted: ${results.bookingsDeleted} bookings, ${results.visitorsDeleted} visitors, ${results.complaintsDeleted} complaints, ${results.notificationsDeleted} notifications, ${results.noticesDeleted} notices.`,
        "/storage-management"
      );

      res.json({
        success: true,
        message: "Cleanup completed successfully",
        results,
      });
    } catch (error) {
      console.error("Error performing cleanup:", error);
      res.status(500).json({ error: "Failed to perform cleanup" });
    }
  });

  // Skip this month's cleanup (admin only)
  app.post("/api/storage/skip-cleanup", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);

    try {
      const period = getCurrentCleanupPeriod();

      await db
        .update(cleanupLogs)
        .set({
          status: "skipped",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(cleanupLogs.month, period.month),
            eq(cleanupLogs.year, period.year)
          )
        );

      res.json({
        success: true,
        message: "Cleanup skipped for this month. Data will be included in next month's cleanup.",
      });
    } catch (error) {
      console.error("Error skipping cleanup:", error);
      res.status(500).json({ error: "Failed to skip cleanup" });
    }
  });

  // Get cleanup history
  app.get("/api/storage/history", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);

    try {
      const history = await db
        .select()
        .from(cleanupLogs)
        .orderBy(cleanupLogs.year, cleanupLogs.month)
        .limit(12);

      res.json(history);
    } catch (error) {
      console.error("Error fetching cleanup history:", error);
      res.status(500).json({ error: "Failed to fetch cleanup history" });
    }
  });

  // Check and send reminder notification (called by scheduler or on page load)
  app.post("/api/storage/check-reminder", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);

    try {
      const period = getCurrentCleanupPeriod();

      if (!period.isReminderPeriod) {
        return res.json({ reminder: false, message: "Not in reminder period" });
      }

      // Get current cleanup log
      let [currentLog] = await db
        .select()
        .from(cleanupLogs)
        .where(
          and(
            eq(cleanupLogs.month, period.month),
            eq(cleanupLogs.year, period.year)
          )
        );

      if (!currentLog) {
        // Create new log
        [currentLog] = await db
          .insert(cleanupLogs)
          .values({
            month: period.month,
            year: period.year,
            scheduledDate: period.scheduledDate,
            reminderStartDate: period.reminderStartDate,
            status: "pending",
          })
          .returning();
      }

      // Check if all downloaded or already completed
      const allDownloaded =
        currentLog.bookingsCsvDownloaded &&
        currentLog.visitorsCsvDownloaded &&
        currentLog.complaintsCsvDownloaded &&
        currentLog.notificationsCsvDownloaded &&
        currentLog.noticesCsvDownloaded;

      if (allDownloaded || currentLog.status === "completed" || currentLog.status === "skipped") {
        return res.json({ reminder: false, message: "Already completed or all downloads done" });
      }

      // Update status to reminded if not already
      if (currentLog.status === "pending") {
        await db
          .update(cleanupLogs)
          .set({
            status: "reminded",
            updatedAt: new Date(),
          })
          .where(eq(cleanupLogs.id, currentLog.id));

        // Send notification to all admins
        const preview = await getCleanupPreview(period.cutoffDate);
        await notifyAdmins(
          "system",
          "Monthly Data Cleanup Reminder",
          `Monthly cleanup is scheduled for the 25th. Please download your data backups before cleanup. Records to be cleaned: ${preview.bookings} bookings, ${preview.visitors} visitors, ${preview.complaints} complaints, ${preview.notifications} notifications, ${preview.notices} notices.`,
          "/storage-management"
        );
      }

      res.json({
        reminder: true,
        message: "Reminder sent",
        daysUntilCleanup: 25 - new Date().getDate(),
      });
    } catch (error) {
      console.error("Error checking reminder:", error);
      res.status(500).json({ error: "Failed to check reminder" });
    }
  });
}
