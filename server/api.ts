import express from "express";
import { DatabaseStorage } from "./storage";
import { Notice } from "@shared/schema";
import { SessionData } from "express-session";

declare module "express-session" {
  interface SessionData {
    user?: {
      id: number;
      isAdmin: boolean;
    };
  }
}

const app = express();
const storage = new DatabaseStorage();

// Middleware
app.use(express.json());

// Notice routes
app.get("/api/notices", async (req: express.Request, res: express.Response) => {
  const notices = await storage.getNotices();
  res.json(notices);
});

app.post(
  "/api/notices",
  async (req: express.Request, res: express.Response) => {
    try {
      console.log("Received notice creation request:", req.body);
      console.log("User session:", req.session);

      if (!req.session.user?.isAdmin) {
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

      const noticeData = {
        title: req.body.title,
        content: req.body.content,
        createdBy: req.session.user.id,
        createdAt: new Date(),
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
  }
);

app.delete(
  "/api/notices/:id",
  async (req: express.Request, res: express.Response) => {
    if (!req.session.user?.isAdmin) {
      res.status(403).json({ error: "Only admins can delete notices" });
      return;
    }

    await storage.deleteNotice(parseInt(req.params.id));
    res.status(204).send();
  }
);
