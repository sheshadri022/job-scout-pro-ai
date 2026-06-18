import { Router } from "express";
import { db, profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { UpsertProfileBody } from "@workspace/api-zod";

const router = Router();

// GET /api/profile
router.get("/profile", requireAuth, async (req, res) => {
  try {
    const [profile] = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.userId, req.userId!))
      .limit(1);

    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    res.json(profile);
  } catch (err) {
    req.log.error(err, "Failed to get profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/profile
router.put("/profile", requireAuth, async (req, res) => {
  const parsed = UpsertProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const data = parsed.data;

  try {
    const existing = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.userId, req.userId!))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(profilesTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(profilesTable.userId, req.userId!))
        .returning();
      res.json(updated);
    } else {
      const [created] = await db
        .insert(profilesTable)
        .values({ userId: req.userId!, ...data })
        .returning();
      res.json(created);
    }
  } catch (err) {
    req.log.error(err, "Failed to upsert profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
