import { storage } from "./storage";
import { CronJob } from "cron";

// Helper to create notification (avoiding circular import)
async function sendNotification(userId: number, type: string, title: string, message: string, link?: string) {
  try {
    await storage.createNotification({
      userId,
      type,
      title,
      message,
      link: link || null,
    });
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

export function setupScheduledTasks() {
  // Remove expired bookings every hour
  new CronJob("0 * * * *", async () => {
    try {
      console.log("Running expired bookings cleanup task...");
      await storage.removeExpiredBookings();
      console.log("Expired bookings cleanup completed");
    } catch (error) {
      console.error("Error in expired bookings cleanup task:", error);
    }
  }).start();

  // Archive expired notices every hour
  new CronJob("0 * * * *", async () => {
    try {
      console.log("Running expired notices archive task...");
      await storage.archiveExpiredNotices();
      console.log("Expired notices archive completed");
    } catch (error) {
      console.error("Error in expired notices archive task:", error);
    }
  }).start();

  // Clean up old notifications (older than 30 days) once daily at midnight
  new CronJob("0 0 * * *", async () => {
    try {
      console.log("Running old notifications cleanup task...");
      await storage.deleteOldNotifications(30);
      console.log("Old notifications cleanup completed");
    } catch (error) {
      console.error("Error in old notifications cleanup task:", error);
    }
  }).start();

  // Expire old pre-approvals every hour and notify users
  new CronJob("0 * * * *", async () => {
    try {
      console.log("Running pre-approval expiration task...");
      const expiredVisitors = await storage.expireOldPreApprovals();

      // Send notifications to users whose pre-approvals expired
      for (const visitor of expiredVisitors) {
        await sendNotification(
          visitor.createdBy,
          "visitor",
          "Pre-Approval Expired",
          `Your pre-approval for ${visitor.name} (expected on ${new Date(visitor.expectedDate).toLocaleDateString()}) has expired as the visitor did not arrive.`,
          "/visitors"
        );
      }

      console.log(`Pre-approval expiration completed. Expired ${expiredVisitors.length} pre-approvals.`);
    } catch (error) {
      console.error("Error in pre-approval expiration task:", error);
    }
  }).start();
}
