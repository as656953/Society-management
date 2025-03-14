import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import {
  insertBookingSchema,
  updateApartmentSchema,
  updateUserSchema,
} from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

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

  // Get all amenities
  app.get("/api/amenities", async (_req, res) => {
    const amenities = await storage.getAmenities();
    res.json(amenities);
  });

  // Get specific amenity
  app.get("/api/amenities/:id", async (req, res) => {
    const amenity = await storage.getAmenity(parseInt(req.params.id));
    if (!amenity) return res.status(404).send("Amenity not found");
    res.json(amenity);
  });

  // Create booking
  app.post("/api/bookings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        userId: req.user!.id,
        status: "PENDING",
      });

      const booking = await storage.createBooking(bookingData);
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
      res.json(booking);
    } catch (error) {
      res.status(500).send("Internal server error");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
