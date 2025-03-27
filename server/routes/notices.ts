import express from "express";
import { storage } from "../storage";
import { isBefore } from "date-fns";

const router = express.Router();

type PriorityLevel = "HIGH" | "NORMAL" | "LOW";

const priorityOrder: Record<PriorityLevel, number> = {
  HIGH: 3,
  NORMAL: 2,
  LOW: 1,
};

router.get("/", async (req, res) => {
  try {
    const notices = await storage.getNotices();
    // Sort notices by priority (HIGH > NORMAL > LOW) and then by creation date
    notices.sort((a, b) => {
      const priorityDiff =
        priorityOrder[b.priority as PriorityLevel] -
        priorityOrder[a.priority as PriorityLevel];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    res.json(notices);
  } catch (error) {
    console.error("Error fetching notices:", error);
    res.status(500).json({ error: "Failed to fetch notices" });
  }
});

router.post("/", async (req, res) => {
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
        content: req.body.content,
      });
      res.status(400).json({ error: "Title and content are required" });
      return;
    }

    const expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : null;
    if (expiresAt && isBefore(expiresAt, new Date())) {
      res.status(400).json({ error: "Expiration date must be in the future" });
      return;
    }

    const now = new Date();
    const noticeData = {
      title: req.body.title,
      content: req.body.content,
      priority: (req.body.priority || "NORMAL") as PriorityLevel,
      expiresAt,
      createdBy: req.user.id,
      createdAt: now,
      updatedAt: now,
    };
    console.log("Creating notice with data:", noticeData);

    const notice = await storage.createNotice(noticeData);
    console.log("Notice created successfully:", notice);
    res.json(notice);
  } catch (error) {
    console.error("Error creating notice:", error);
    res.status(500).json({
      error: "Failed to create notice",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.delete("/:id", async (req, res) => {
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

export default router;
