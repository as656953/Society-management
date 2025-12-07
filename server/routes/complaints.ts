import type { Express } from "express";
import { storage } from "../storage.js";
import { insertComplaintSchema, updateComplaintSchema, insertComplaintCommentSchema } from "../../shared/schema.js";
import { ZodError } from "zod";
import { createNotification, notifyAdmins } from "./notifications.js";

export function registerComplaintRoutes(app: Express) {
  // Middleware - checks if user is authenticated resident with apartment
  const isResident = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.apartmentId) {
      return res.status(403).json({ error: "You must have an apartment assigned to file complaints" });
    }
    next();
  };

  // Admin middleware
  const isAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user?.role !== "admin" && !req.user?.isAdmin) {
      return res.sendStatus(403);
    }
    next();
  };

  // ==================== COMPLAINT ROUTES ====================

  // Create complaint (resident only)
  app.post("/api/complaints", isResident, async (req, res) => {
    try {
      const complaintData = insertComplaintSchema.parse({
        ...req.body,
        apartmentId: req.user!.apartmentId,
        createdBy: req.user!.id,
      });
      const complaint = await storage.createComplaint(complaintData);

      // Notify admins about new complaint
      const apartment = await storage.getApartment(req.user!.apartmentId!);
      await notifyAdmins(
        "complaint",
        "New Complaint Filed",
        `${req.user!.name} from ${apartment?.number || "unknown"} filed a ${complaint.priority} priority ${complaint.category} complaint: ${complaint.title}`,
        "/admin/complaints"
      );

      res.status(201).json(complaint);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json(error.errors);
      } else {
        console.error("Error creating complaint:", error);
        res.status(500).send("Internal server error");
      }
    }
  });

  // Get all complaints (admin only)
  app.get("/api/complaints", isAdmin, async (_req, res) => {
    try {
      const complaints = await storage.getAllComplaints();
      res.json(complaints);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      res.status(500).send("Internal server error");
    }
  });

  // Get my complaints (resident)
  app.get("/api/complaints/my", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const complaints = await storage.getComplaintsByUser(req.user!.id);
      res.json(complaints);
    } catch (error) {
      console.error("Error fetching my complaints:", error);
      res.status(500).send("Internal server error");
    }
  });

  // Get complaint by ID
  app.get("/api/complaints/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const complaintId = parseInt(req.params.id);
      const complaint = await storage.getComplaint(complaintId);

      if (!complaint) {
        return res.status(404).json({ error: "Complaint not found" });
      }

      // Check if user is admin or the complaint owner
      const isAdminUser = req.user?.role === "admin" || req.user?.isAdmin;
      const isOwner = complaint.createdBy === req.user!.id;

      if (!isAdminUser && !isOwner) {
        return res.sendStatus(403);
      }

      res.json(complaint);
    } catch (error) {
      console.error("Error fetching complaint:", error);
      res.status(500).send("Internal server error");
    }
  });

  // Update complaint (admin only - for status, assignment, resolution)
  app.patch("/api/complaints/:id", isAdmin, async (req, res) => {
    try {
      const complaintId = parseInt(req.params.id);
      const updateData = updateComplaintSchema.parse(req.body);

      const complaint = await storage.getComplaint(complaintId);
      if (!complaint) {
        return res.status(404).json({ error: "Complaint not found" });
      }

      const oldStatus = complaint.status;
      const updatedComplaint = await storage.updateComplaint(complaintId, updateData);

      // Notify resident if status changed
      if (updateData.status && updateData.status !== oldStatus) {
        const statusMessages: Record<string, string> = {
          in_progress: "is now being worked on",
          resolved: "has been resolved",
          closed: "has been closed",
          rejected: "has been rejected",
        };

        const message = statusMessages[updateData.status] || `status changed to ${updateData.status}`;

        await createNotification({
          userId: complaint.createdBy,
          type: "complaint",
          title: "Complaint Status Updated",
          message: `Your complaint "${complaint.title}" ${message}.`,
          link: "/complaints",
        });
      }

      res.json(updatedComplaint);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json(error.errors);
      } else {
        console.error("Error updating complaint:", error);
        res.status(500).send("Internal server error");
      }
    }
  });

  // ==================== COMMENT ROUTES ====================

  // Add comment to complaint
  app.post("/api/complaints/:id/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const complaintId = parseInt(req.params.id);
      const complaint = await storage.getComplaint(complaintId);

      if (!complaint) {
        return res.status(404).json({ error: "Complaint not found" });
      }

      // Check if user is admin or the complaint owner
      const isAdminUser = req.user?.role === "admin" || req.user?.isAdmin;
      const isOwner = complaint.createdBy === req.user!.id;

      if (!isAdminUser && !isOwner) {
        return res.sendStatus(403);
      }

      // Only admins can create internal comments
      const isInternal = isAdminUser && req.body.isInternal === true;

      const commentData = insertComplaintCommentSchema.parse({
        complaintId,
        userId: req.user!.id,
        comment: req.body.comment,
        isInternal,
      });

      const comment = await storage.createComplaintComment(commentData);

      // Notify the other party about new comment (skip internal comments)
      if (!isInternal) {
        if (isAdminUser) {
          // Admin commented - notify the resident
          await createNotification({
            userId: complaint.createdBy,
            type: "complaint",
            title: "New Comment on Your Complaint",
            message: `An admin responded to your complaint "${complaint.title}".`,
            link: "/complaints",
          });
        } else {
          // Resident commented - notify admins
          await notifyAdmins(
            "complaint",
            "New Comment on Complaint",
            `${req.user!.name} added a comment to complaint: ${complaint.title}`,
            "/admin/complaints"
          );
        }
      }

      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json(error.errors);
      } else {
        console.error("Error creating comment:", error);
        res.status(500).send("Internal server error");
      }
    }
  });

  // Get comments for a complaint
  app.get("/api/complaints/:id/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const complaintId = parseInt(req.params.id);
      const complaint = await storage.getComplaint(complaintId);

      if (!complaint) {
        return res.status(404).json({ error: "Complaint not found" });
      }

      // Check if user is admin or the complaint owner
      const isAdminUser = req.user?.role === "admin" || req.user?.isAdmin;
      const isOwner = complaint.createdBy === req.user!.id;

      if (!isAdminUser && !isOwner) {
        return res.sendStatus(403);
      }

      // Admins see internal comments, residents don't
      const comments = await storage.getComplaintComments(complaintId, isAdminUser);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).send("Internal server error");
    }
  });

  // Get complaints statistics (admin only)
  app.get("/api/complaints/stats", isAdmin, async (_req, res) => {
    try {
      const complaints = await storage.getAllComplaints();

      const stats = {
        total: complaints.length,
        open: complaints.filter(c => c.status === "open").length,
        inProgress: complaints.filter(c => c.status === "in_progress").length,
        resolved: complaints.filter(c => c.status === "resolved").length,
        closed: complaints.filter(c => c.status === "closed").length,
        rejected: complaints.filter(c => c.status === "rejected").length,
        byCategory: {
          plumbing: complaints.filter(c => c.category === "plumbing").length,
          electrical: complaints.filter(c => c.category === "electrical").length,
          civil: complaints.filter(c => c.category === "civil").length,
          housekeeping: complaints.filter(c => c.category === "housekeeping").length,
          security: complaints.filter(c => c.category === "security").length,
          parking: complaints.filter(c => c.category === "parking").length,
          noise: complaints.filter(c => c.category === "noise").length,
          other: complaints.filter(c => c.category === "other").length,
        },
        byPriority: {
          urgent: complaints.filter(c => c.priority === "urgent").length,
          high: complaints.filter(c => c.priority === "high").length,
          medium: complaints.filter(c => c.priority === "medium").length,
          low: complaints.filter(c => c.priority === "low").length,
        },
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching complaint stats:", error);
      res.status(500).send("Internal server error");
    }
  });
}
