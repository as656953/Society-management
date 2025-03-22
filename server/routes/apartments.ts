import { Router } from "express";
import { storage } from "../storage";
import { isAdmin } from "../middleware/auth";
import { apartments } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "../db";

const router = Router();

// Get all apartments
router.get("/", async (req, res) => {
  try {
    const { towerId } = req.query;
    let query = db.select().from(apartments);

    if (towerId) {
      query = query.where(eq(apartments.towerId, parseInt(towerId as string)));
    }

    const allApartments = await query;
    res.json(allApartments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch apartments" });
  }
});

// Add a new apartment (admin only)
router.post("/", isAdmin, async (req, res) => {
  try {
    const {
      number,
      towerId,
      type,
      floor,
      monthlyRent,
      salePrice,
      status,
      contactNumber,
    } = req.body;

    if (!number || !towerId || !type || !floor || !status) {
      return res.status(400).json({
        error: "Number, tower ID, type, floor, and status are required",
      });
    }

    const [apartment] = await db
      .insert(apartments)
      .values({
        number,
        towerId,
        type,
        floor,
        monthlyRent: monthlyRent || null,
        salePrice: salePrice || null,
        status,
        contactNumber: contactNumber || null,
      })
      .returning();

    res.status(201).json(apartment);
  } catch (error) {
    res.status(500).json({ error: "Failed to create apartment" });
  }
});

// Delete an apartment (admin only)
router.delete("/:id", isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [deletedApartment] = await db
      .delete(apartments)
      .where(eq(apartments.id, id))
      .returning();

    if (!deletedApartment) {
      return res.status(404).json({ error: "Apartment not found" });
    }

    res.json(deletedApartment);
  } catch (error) {
    res.status(500).json({ error: "Failed to delete apartment" });
  }
});

// Update an apartment (admin only)
router.patch("/:id", isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      number,
      type,
      floor,
      monthlyRent,
      salePrice,
      status,
      contactNumber,
    } = req.body;

    const [updatedApartment] = await db
      .update(apartments)
      .set({
        number,
        type,
        floor,
        monthlyRent: monthlyRent || null,
        salePrice: salePrice || null,
        status,
        contactNumber: contactNumber || null,
      })
      .where(eq(apartments.id, id))
      .returning();

    if (!updatedApartment) {
      return res.status(404).json({ error: "Apartment not found" });
    }

    res.json(updatedApartment);
  } catch (error) {
    res.status(500).json({ error: "Failed to update apartment" });
  }
});

export default router;
