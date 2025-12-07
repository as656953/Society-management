import { Express } from "express";
import { storage } from "../storage.js";
import { updateProfileSchema, changePasswordSchema, insertVehicleSchema, updateVehicleSchema } from "../../shared/schema.js";
import { ZodError } from "zod";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function registerProfileRoutes(app: Express) {
  // Get current user profile
  app.get("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Don't send password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // Update profile
  app.patch("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const updateData = updateProfileSchema.parse(req.body);

      // Check if email is being changed and if it's already in use
      if (updateData.email && updateData.email !== req.user!.email) {
        const existingUser = await storage.getUserByEmail(updateData.email);
        if (existingUser && existingUser.id !== req.user!.id) {
          return res.status(400).json({ error: "Email already in use" });
        }
      }

      const updatedUser = await storage.updateUser(req.user!.id, updateData);
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json(error.errors);
      } else {
        console.error("Error updating profile:", error);
        res.status(500).json({ error: "Failed to update profile" });
      }
    }
  });

  // Change password (only for local auth users)
  app.patch("/api/profile/password", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      // Check if user has a password (local auth)
      const user = await storage.getUser(req.user!.id);
      if (!user || !user.password) {
        return res.status(400).json({ error: "Cannot change password for Google-only accounts" });
      }

      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

      // Verify current password
      const isValid = await comparePasswords(currentPassword, user.password);
      if (!isValid) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(req.user!.id, { password: hashedPassword });

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json(error.errors);
      } else {
        console.error("Error changing password:", error);
        res.status(500).json({ error: "Failed to change password" });
      }
    }
  });

  // Vehicle routes

  // Get my apartment's vehicles
  app.get("/api/vehicles/my", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    if (!req.user!.apartmentId) {
      return res.status(400).json({ error: "You must have an apartment assigned to view vehicles" });
    }

    try {
      const vehiclesList = await storage.getVehiclesByApartment(req.user!.apartmentId);
      res.json(vehiclesList);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ error: "Failed to fetch vehicles" });
    }
  });

  // Get all vehicles (admin only)
  app.get("/api/vehicles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);

    try {
      const vehiclesList = await storage.getAllVehicles();
      res.json(vehiclesList);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ error: "Failed to fetch vehicles" });
    }
  });

  // Create vehicle
  app.post("/api/vehicles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    if (!req.user!.apartmentId) {
      return res.status(400).json({ error: "You must have an apartment assigned to register a vehicle" });
    }

    try {
      const vehicleData = insertVehicleSchema.parse({
        ...req.body,
        apartmentId: req.user!.apartmentId,
        registeredBy: req.user!.id,
      });

      const vehicle = await storage.createVehicle(vehicleData);
      res.status(201).json(vehicle);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json(error.errors);
      } else {
        console.error("Error creating vehicle:", error);
        res.status(500).json({ error: "Failed to create vehicle" });
      }
    }
  });

  // Update vehicle
  app.patch("/api/vehicles/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const vehicleId = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(vehicleId);

      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      // Check authorization - owner of apartment or admin
      if (!req.user!.isAdmin && vehicle.apartmentId !== req.user!.apartmentId) {
        return res.sendStatus(403);
      }

      const updateData = updateVehicleSchema.parse(req.body);
      const updatedVehicle = await storage.updateVehicle(vehicleId, updateData);
      res.json(updatedVehicle);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json(error.errors);
      } else {
        console.error("Error updating vehicle:", error);
        res.status(500).json({ error: "Failed to update vehicle" });
      }
    }
  });

  // Delete vehicle
  app.delete("/api/vehicles/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const vehicleId = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(vehicleId);

      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      // Check authorization - owner of apartment or admin
      if (!req.user!.isAdmin && vehicle.apartmentId !== req.user!.apartmentId) {
        return res.sendStatus(403);
      }

      await storage.deleteVehicle(vehicleId);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      res.status(500).json({ error: "Failed to delete vehicle" });
    }
  });
}
