import { Router } from "express";
import { storage } from "../storage";
import { isAdmin } from "../middleware/auth";
import { towers, apartments } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "../db";

const router = Router();

// Get all towers
router.get("/", async (req, res) => {
  try {
    const allTowers = await db.select().from(towers);
    res.json(allTowers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch towers" });
  }
});

// Add a new tower (admin only)
router.post("/", isAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Tower name is required" });
    }

    const [tower] = await db.insert(towers).values({ name }).returning();
    res.status(201).json(tower);
  } catch (error) {
    res.status(500).json({ error: "Failed to create tower" });
  }
});

// Delete a tower and its apartments (admin only)
router.delete("/:id", isAdmin, async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    // Start a transaction to ensure both operations succeed or fail together
    await db.transaction(async (tx) => {
      // First delete all apartments in this tower
      await tx.delete(apartments).where(eq(apartments.towerId, id));

      // Then delete the tower
      const [deletedTower] = await tx
        .delete(towers)
        .where(eq(towers.id, id))
        .returning();

      if (!deletedTower) {
        throw new Error("Tower not found");
      }

      res.json(deletedTower);
    });
  } catch (error) {
    if (error.message === "Tower not found") {
      res.status(404).json({ error: "Tower not found" });
    } else {
      res.status(500).json({ error: "Failed to delete tower" });
    }
  }
});

// Update a tower (admin only)
router.patch("/:id", isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Tower name is required" });
    }

    const [updatedTower] = await db
      .update(towers)
      .set({ name })
      .where(eq(towers.id, id))
      .returning();

    if (!updatedTower) {
      return res.status(404).json({ error: "Tower not found" });
    }

    res.json(updatedTower);
  } catch (error) {
    res.status(500).json({ error: "Failed to update tower" });
  }
});

export default router;
