import type { Express } from "express";
import { storage } from "../storage";
import { insertVisitorSchema, checkoutVisitorSchema, insertPreApprovedVisitorSchema } from "@shared/schema";
import { ZodError } from "zod";
import { notifyApartmentResidents, createNotification } from "./notifications";

export function registerVisitorRoutes(app: Express) {
  // Guard middleware - checks if user is guard or admin
  const isGuardOrAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user?.role !== "guard" && req.user?.role !== "admin" && !req.user?.isAdmin) {
      return res.sendStatus(403);
    }
    next();
  };

  // Resident middleware - checks if user is authenticated resident with apartment
  const isResident = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.apartmentId) {
      return res.status(403).json({ error: "You must have an apartment assigned to manage visitors" });
    }
    next();
  };

  // ==================== VISITOR ROUTES (Guard/Admin) ====================

  // Create visitor entry (guard only)
  app.post("/api/visitors", isGuardOrAdmin, async (req, res) => {
    try {
      const visitorData = insertVisitorSchema.parse({
        ...req.body,
        createdBy: req.user!.id,
      });
      const visitor = await storage.createVisitor(visitorData);

      // Notify residents about visitor arrival
      const apartment = await storage.getApartment(visitor.apartmentId);
      await notifyApartmentResidents(
        visitor.apartmentId,
        "visitor",
        "Visitor Arrived",
        `${visitor.name} (${visitor.purpose}) has arrived at your apartment${apartment ? ` (${apartment.number})` : ""}.`,
        "/visitors"
      );

      res.status(201).json(visitor);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json(error.errors);
      } else {
        console.error("Error creating visitor:", error);
        res.status(500).send("Internal server error");
      }
    }
  });

  // Get all active visitors (currently inside)
  app.get("/api/visitors/active", isGuardOrAdmin, async (_req, res) => {
    try {
      const visitors = await storage.getActiveVisitors();
      res.json(visitors);
    } catch (error) {
      console.error("Error fetching active visitors:", error);
      res.status(500).send("Internal server error");
    }
  });

  // Get today's visitors
  app.get("/api/visitors/today", isGuardOrAdmin, async (_req, res) => {
    try {
      const visitors = await storage.getTodayVisitors();
      res.json(visitors);
    } catch (error) {
      console.error("Error fetching today's visitors:", error);
      res.status(500).send("Internal server error");
    }
  });

  // Get visitors by apartment
  app.get("/api/visitors/apartment/:apartmentId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const apartmentId = parseInt(req.params.apartmentId);

    // Check if user is guard/admin or if it's their own apartment
    const isGuard = req.user?.role === "guard" || req.user?.role === "admin" || req.user?.isAdmin;
    const isOwnApartment = req.user?.apartmentId === apartmentId;

    if (!isGuard && !isOwnApartment) {
      return res.sendStatus(403);
    }

    try {
      const visitors = await storage.getVisitorsByApartment(apartmentId);
      res.json(visitors);
    } catch (error) {
      console.error("Error fetching apartment visitors:", error);
      res.status(500).send("Internal server error");
    }
  });

  // Checkout visitor
  app.patch("/api/visitors/:id/checkout", isGuardOrAdmin, async (req, res) => {
    try {
      const visitorId = parseInt(req.params.id);
      const { notes } = checkoutVisitorSchema.parse(req.body);

      const visitor = await storage.getVisitor(visitorId);
      if (!visitor) {
        return res.status(404).json({ error: "Visitor not found" });
      }

      if (visitor.status === "checked_out") {
        return res.status(400).json({ error: "Visitor already checked out" });
      }

      const updatedVisitor = await storage.checkoutVisitor(visitorId, notes);
      res.json(updatedVisitor);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json(error.errors);
      } else {
        console.error("Error checking out visitor:", error);
        res.status(500).send("Internal server error");
      }
    }
  });

  // Get single visitor details
  app.get("/api/visitors/:id", isGuardOrAdmin, async (req, res) => {
    try {
      const visitorId = parseInt(req.params.id);
      const visitor = await storage.getVisitor(visitorId);

      if (!visitor) {
        return res.status(404).json({ error: "Visitor not found" });
      }

      res.json(visitor);
    } catch (error) {
      console.error("Error fetching visitor:", error);
      res.status(500).send("Internal server error");
    }
  });

  // ==================== PRE-APPROVED VISITOR ROUTES (Residents) ====================

  // Create pre-approved visitor (resident)
  app.post("/api/pre-approved-visitors", isResident, async (req, res) => {
    try {
      const visitorData = insertPreApprovedVisitorSchema.parse({
        ...req.body,
        apartmentId: req.user!.apartmentId,
        createdBy: req.user!.id,
      });
      const visitor = await storage.createPreApprovedVisitor(visitorData);
      res.status(201).json(visitor);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json(error.errors);
      } else {
        console.error("Error creating pre-approved visitor:", error);
        res.status(500).send("Internal server error");
      }
    }
  });

  // Get pre-approved visitors for user's apartment
  app.get("/api/pre-approved-visitors/my", isResident, async (req, res) => {
    try {
      const visitors = await storage.getPreApprovedVisitorsByApartment(req.user!.apartmentId!);
      res.json(visitors);
    } catch (error) {
      console.error("Error fetching pre-approved visitors:", error);
      res.status(500).send("Internal server error");
    }
  });

  // Get all pending pre-approved visitors (guard view)
  app.get("/api/pre-approved-visitors/pending", isGuardOrAdmin, async (_req, res) => {
    try {
      const visitors = await storage.getPendingPreApprovedVisitors();
      res.json(visitors);
    } catch (error) {
      console.error("Error fetching pending pre-approved visitors:", error);
      res.status(500).send("Internal server error");
    }
  });

  // Get pre-approved visitors by apartment (guard/admin)
  app.get("/api/pre-approved-visitors/apartment/:apartmentId", isGuardOrAdmin, async (req, res) => {
    try {
      const apartmentId = parseInt(req.params.apartmentId);
      const visitors = await storage.getPreApprovedVisitorsByApartment(apartmentId);
      res.json(visitors);
    } catch (error) {
      console.error("Error fetching pre-approved visitors:", error);
      res.status(500).send("Internal server error");
    }
  });

  // Update pre-approved visitor status (guard marks as arrived)
  app.patch("/api/pre-approved-visitors/:id/status", isGuardOrAdmin, async (req, res) => {
    try {
      const visitorId = parseInt(req.params.id);
      const { status } = req.body;

      if (!["arrived", "expired", "cancelled"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const preApprovedVisitor = await storage.getPreApprovedVisitor(visitorId);
      if (!preApprovedVisitor) {
        return res.status(404).json({ error: "Pre-approved visitor not found" });
      }

      // If marking as arrived, also create a visitor entry linked to the pre-approval
      if (status === "arrived") {
        await storage.createVisitor({
          name: preApprovedVisitor.name,
          mobileNumber: preApprovedVisitor.mobileNumber || "N/A",
          purpose: preApprovedVisitor.purpose,
          apartmentId: preApprovedVisitor.apartmentId,
          vehicleNumber: null,
          notes: preApprovedVisitor.notes || `Pre-approved visitor (${preApprovedVisitor.numberOfPersons} person(s))`,
          createdBy: req.user!.id,
          preApprovedVisitorId: preApprovedVisitor.id, // Link to pre-approval
        });

        // Notify the resident who created the pre-approval
        const apartment = await storage.getApartment(preApprovedVisitor.apartmentId);
        await createNotification({
          userId: preApprovedVisitor.createdBy,
          type: "visitor",
          title: "Pre-Approved Visitor Arrived",
          message: `Your pre-approved visitor ${preApprovedVisitor.name} (${preApprovedVisitor.purpose}) has checked in${apartment ? ` at ${apartment.number}` : ""}.`,
          link: "/visitors",
        });
      }

      const updatedVisitor = await storage.updatePreApprovedVisitorStatus(visitorId, status);
      res.json(updatedVisitor);
    } catch (error) {
      console.error("Error updating pre-approved visitor status:", error);
      res.status(500).send("Internal server error");
    }
  });

  // Cancel pre-approved visitor (resident)
  app.delete("/api/pre-approved-visitors/:id", isResident, async (req, res) => {
    try {
      const visitorId = parseInt(req.params.id);

      const visitor = await storage.getPreApprovedVisitor(visitorId);
      if (!visitor) {
        return res.status(404).json({ error: "Pre-approved visitor not found" });
      }

      // Ensure the visitor belongs to the user's apartment
      if (visitor.apartmentId !== req.user!.apartmentId) {
        return res.sendStatus(403);
      }

      await storage.cancelPreApprovedVisitor(visitorId);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error cancelling pre-approved visitor:", error);
      res.status(500).send("Internal server error");
    }
  });
}
