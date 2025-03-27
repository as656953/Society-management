import { storage } from "./storage";
import { CronJob } from "cron";

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

  // Remove expired notices every hour
  new CronJob("0 * * * *", async () => {
    try {
      console.log("Running expired notices cleanup task...");
      await storage.removeExpiredNotices();
      console.log("Expired notices cleanup completed");
    } catch (error) {
      console.error("Error in expired notices cleanup task:", error);
    }
  }).start();
}
