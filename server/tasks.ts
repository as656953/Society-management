import { storage } from "./storage";

export async function setupScheduledTasks() {
  // Run cleanup every hour
  setInterval(async () => {
    try {
      await storage.removeExpiredBookings();
      console.log("Cleaned up expired booking requests");
    } catch (error) {
      console.error("Error cleaning up expired booking requests:", error);
    }
  }, 1000 * 60 * 60); // Run every hour
}
