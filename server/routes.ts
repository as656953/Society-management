import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import {
  insertBookingSchema,
  updateApartmentSchema,
  updateUserSchema,
  updateUserRoleSchema,
  insertAmenitySchema,
  updateAmenitySchema,
} from "@shared/schema";
import { ZodError } from "zod";
import { registerVisitorRoutes } from "./routes/visitors";
import { registerComplaintRoutes } from "./routes/complaints";
import { registerProfileRoutes } from "./routes/profile";
import { registerReportRoutes } from "./routes/reports";
import { registerNotificationRoutes, createNotification, notifyAdmins } from "./routes/notifications";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);
  registerVisitorRoutes(app);
  registerComplaintRoutes(app);
  registerProfileRoutes(app);
  registerReportRoutes(app);
  registerNotificationRoutes(app);

  // Get all users (admin only)
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);

    const users = await storage.getAllUsers();
    res.json(users);
  });

  // Update user (admin only)
  app.patch("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);

    try {
      const userId = parseInt(req.params.id);
      const updateData = updateUserSchema.parse(req.body);
      const user = await storage.updateUser(userId, updateData);
      res.json(user);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json(error.errors);
      } else {
        res.status(500).send("Internal server error");
      }
    }
  });

  // Delete user (admin only)
  app.delete("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);

    try {
      const userId = parseInt(req.params.id);

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // If user is deleting their own account, handle session cleanup
      if (userId === req.user.id) {
        // Delete the user first
        await storage.deleteUser(userId);

        // Logout the user
        req.logout((err) => {
          if (err) {
            console.error("Error logging out user:", err);
          }

          // Destroy the session after logout
          req.session.destroy((err) => {
            if (err) {
              console.error("Error destroying session:", err);
            }
            // Send response after session is destroyed
            res.sendStatus(204);
          });
        });
        return;
      }

      // For deleting other users, just delete the user
      await storage.deleteUser(userId);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).send("Internal server error");
    }
  });

  // Update user role (admin only)
  app.patch("/api/users/:id/role", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);

    try {
      const userId = parseInt(req.params.id);
      const { role } = updateUserRoleSchema.parse(req.body);

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Update the role (and sync isAdmin for backwards compatibility)
      const isAdmin = role === "admin";
      const updatedUser = await storage.updateUser(userId, { role, isAdmin });
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json(error.errors);
      } else {
        console.error("Error updating user role:", error);
        res.status(500).send("Internal server error");
      }
    }
  });

  // Assign apartment to user (admin only)
  app.patch("/api/users/:id/apartment", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);

    try {
      const userId = parseInt(req.params.id);
      const { apartmentId, residentType } = req.body;

      if (!apartmentId || typeof apartmentId !== "number") {
        return res.status(400).json({ error: "Valid apartmentId is required" });
      }

      if (!residentType || (residentType !== "OWNER" && residentType !== "TENANT")) {
        return res.status(400).json({ error: "Valid residentType (OWNER or TENANT) is required" });
      }

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if apartment exists
      const apartment = await storage.getApartment(apartmentId);
      if (!apartment) {
        return res.status(404).json({ error: "Apartment not found" });
      }

      // If user was previously assigned as OWNER to a different apartment, clear that apartment's ownerName
      if (user.apartmentId && user.apartmentId !== apartmentId && user.residentType === "OWNER") {
        await storage.updateApartment(user.apartmentId, { ownerName: null });
      }

      const updatedUser = await storage.assignApartment(userId, apartmentId, residentType);

      // If assigning as OWNER, update the apartment's ownerName
      if (residentType === "OWNER") {
        await storage.updateApartment(apartmentId, { ownerName: user.name });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error assigning apartment:", error);
      res.status(500).json({ error: "Failed to assign apartment" });
    }
  });

  // Remove apartment assignment from user (admin only)
  app.delete("/api/users/:id/apartment", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);

    try {
      const userId = parseInt(req.params.id);

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // If user was assigned as OWNER, clear the apartment's ownerName
      if (user.apartmentId && user.residentType === "OWNER") {
        await storage.updateApartment(user.apartmentId, { ownerName: null });
      }

      const updatedUser = await storage.removeApartmentAssignment(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error removing apartment assignment:", error);
      res.status(500).json({ error: "Failed to remove apartment assignment" });
    }
  });

  // Get users without apartment assignment (admin only)
  app.get("/api/users/unassigned", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);

    try {
      const users = await storage.getUsersWithoutApartment();
      res.json(users);
    } catch (error) {
      console.error("Error fetching unassigned users:", error);
      res.status(500).json({ error: "Failed to fetch unassigned users" });
    }
  });

  // Get residents of an apartment (admin or own apartment)
  app.get("/api/apartments/:id/residents", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const apartmentId = parseInt(req.params.id);

      // Allow access if user is admin OR if it's their own apartment
      if (!req.user?.isAdmin && req.user?.apartmentId !== apartmentId) {
        return res.sendStatus(403);
      }

      // Check if apartment exists
      const apartment = await storage.getApartment(apartmentId);
      if (!apartment) {
        return res.status(404).json({ error: "Apartment not found" });
      }

      const residents = await storage.getUsersByApartment(apartmentId);
      res.json(residents);
    } catch (error) {
      console.error("Error fetching apartment residents:", error);
      res.status(500).json({ error: "Failed to fetch apartment residents" });
    }
  });

  // Get all apartments
  app.get("/api/apartments", async (_req, res) => {
    const apartments = await storage.getApartments();
    res.json(apartments);
  });

  // Get apartments by tower
  app.get("/api/towers/:towerId/apartments", async (req, res) => {
    const towerId = parseInt(req.params.towerId);
    const apartments = await storage.getApartmentsByTower(towerId);
    res.json(apartments);
  });

  // Get all amenities (active only for regular users)
  app.get("/api/amenities", async (req, res) => {
    // If admin and includeInactive=true, show all
    if (req.isAuthenticated() && req.user?.isAdmin && req.query.includeInactive === "true") {
      const amenities = await storage.getAllAmenities();
      return res.json(amenities);
    }
    const amenities = await storage.getAmenities();
    res.json(amenities);
  });

  // Get all amenities for admin (includes inactive)
  app.get("/api/amenities/all", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);

    const amenities = await storage.getAllAmenities();
    res.json(amenities);
  });

  // Get specific amenity
  app.get("/api/amenities/:id", async (req, res) => {
    const amenity = await storage.getAmenity(parseInt(req.params.id));
    if (!amenity) return res.status(404).send("Amenity not found");
    res.json(amenity);
  });

  // Create amenity (admin only)
  app.post("/api/amenities", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);

    try {
      const amenityData = insertAmenitySchema.parse(req.body);
      const amenity = await storage.createAmenity(amenityData);
      res.status(201).json(amenity);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json(error.errors);
      } else {
        console.error("Error creating amenity:", error);
        res.status(500).json({ error: "Failed to create amenity" });
      }
    }
  });

  // Update amenity (admin only)
  app.patch("/api/amenities/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);

    try {
      const amenityId = parseInt(req.params.id);
      const updateData = updateAmenitySchema.parse(req.body);

      const existingAmenity = await storage.getAmenity(amenityId);
      if (!existingAmenity) {
        return res.status(404).json({ error: "Amenity not found" });
      }

      const amenity = await storage.updateAmenity(amenityId, updateData);
      res.json(amenity);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json(error.errors);
      } else {
        console.error("Error updating amenity:", error);
        res.status(500).json({ error: "Failed to update amenity" });
      }
    }
  });

  // Delete amenity (admin only - soft delete)
  app.delete("/api/amenities/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);

    try {
      const amenityId = parseInt(req.params.id);

      const existingAmenity = await storage.getAmenity(amenityId);
      if (!existingAmenity) {
        return res.status(404).json({ error: "Amenity not found" });
      }

      await storage.deleteAmenity(amenityId);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting amenity:", error);
      res.status(500).json({ error: "Failed to delete amenity" });
    }
  });

  // Create booking
  app.post("/api/bookings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      // Check if user has an apartment assigned (admins can book without apartment)
      if (!req.user!.isAdmin && !req.user!.apartmentId) {
        return res.status(403).json({
          error: "You must have an apartment assigned to book amenities. Please contact the administrator.",
        });
      }

      const parsedBooking = insertBookingSchema.parse({
        ...req.body,
        userId: req.user!.id,
        status: "PENDING",
      });

      const bookingData = {
        ...parsedBooking,
        deletedAt: parsedBooking.deletedAt ?? null,
      };

      const booking = await storage.createBooking(bookingData);

      // Notify admins about the new booking request
      const amenity = await storage.getAmenity(booking.amenityId);
      const amenityName = amenity?.name || "Amenity";

      // Get apartment info for the notification
      let apartmentInfo = "";
      if (req.user!.apartmentId) {
        const apartment = await storage.getApartment(req.user!.apartmentId);
        if (apartment) {
          const tower = await storage.getTower(apartment.towerId);
          apartmentInfo = ` from ${tower?.name || 'Tower ' + apartment.towerId}, Flat ${apartment.number}`;
        }
      }

      // Format the booking dates properly
      const startDate = new Date(booking.startTime);
      const endDate = new Date(booking.endTime);
      const dateOptions: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      };
      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };

      const formattedStartDate = startDate.toLocaleDateString('en-US', dateOptions);
      const formattedStartTime = startDate.toLocaleTimeString('en-US', timeOptions);
      const formattedEndDate = endDate.toLocaleDateString('en-US', dateOptions);
      const formattedEndTime = endDate.toLocaleTimeString('en-US', timeOptions);

      await notifyAdmins(
        "booking",
        "New Booking Request",
        `${req.user!.name}${apartmentInfo} has requested to book ${amenityName} from ${formattedStartDate} at ${formattedStartTime} to ${formattedEndDate} at ${formattedEndTime}.`,
        "/bookings"
      );

      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json(error.errors);
      } else {
        res.status(500).send("Internal server error");
      }
    }
  });

  // Get user's bookings
  app.get("/api/bookings/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const bookings = await storage.getBookingsByUser(req.user!.id);
    res.json(bookings);
  });

  // Update apartment
  app.patch("/api/apartments/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);

    try {
      const apartmentId = parseInt(req.params.id);
      const updateData = updateApartmentSchema.parse(req.body);
      const apartment = await storage.updateApartment(apartmentId, updateData);
      res.json(apartment);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json(error.errors);
      } else {
        res.status(500).send("Internal server error");
      }
    }
  });

  // Get all bookings (admin only)
  app.get("/api/bookings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);

    const bookings = await storage.getAllBookings();
    res.json(bookings);
  });

  // Update booking status (admin only)
  app.patch("/api/bookings/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);

    try {
      const bookingId = parseInt(req.params.id);
      const { status } = req.body;

      if (status !== "APPROVED" && status !== "REJECTED") {
        return res.status(400).json({ error: "Invalid status" });
      }

      const booking = await storage.updateBookingStatus(bookingId, status);

      // Send notification to the user
      const amenity = await storage.getAmenity(booking.amenityId);
      const amenityName = amenity?.name || "Amenity";

      await createNotification({
        userId: booking.userId,
        type: "booking",
        title: status === "APPROVED" ? "Booking Approved" : "Booking Rejected",
        message: status === "APPROVED"
          ? `Your booking for ${amenityName} has been approved.`
          : `Your booking for ${amenityName} has been rejected.`,
        link: "/my-bookings",
      });

      res.json(booking);
    } catch (error) {
      res.status(500).send("Internal server error");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
