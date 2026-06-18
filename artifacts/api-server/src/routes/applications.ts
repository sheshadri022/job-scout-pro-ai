import { Router } from "express";
import { db, applicationsTable, jobsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { CreateApplicationBody, UpdateApplicationBody } from "@workspace/api-zod";

const router = Router();

// GET /api/applications
router.get("/applications", requireAuth, async (req, res) => {
  try {
    const apps = await db
      .select()
      .from(applicationsTable)
      .where(eq(applicationsTable.userId, req.userId!))
      .orderBy(applicationsTable.appliedAt);
    res.json(apps);
  } catch (err) {
    req.log.error(err, "Failed to list applications");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/applications
router.post("/applications", requireAuth, async (req, res) => {
  const parsed = CreateApplicationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  try {
    // Verify job belongs to user
    const [job] = await db
      .select()
      .from(jobsTable)
      .where(and(eq(jobsTable.id, parsed.data.jobId), eq(jobsTable.userId, req.userId!)))
      .limit(1);
    if (!job) { res.status(404).json({ error: "Job not found" }); return; }

    const [app] = await db
      .insert(applicationsTable)
      .values({ ...parsed.data, userId: req.userId! })
      .returning();

    // Mark job as applied
    await db
      .update(jobsTable)
      .set({ status: "applied", updatedAt: new Date() })
      .where(eq(jobsTable.id, parsed.data.jobId));

    res.status(201).json(app);
  } catch (err) {
    req.log.error(err, "Failed to create application");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/applications/:id
router.patch("/applications/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateApplicationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  try {
    const [app] = await db
      .update(applicationsTable)
      .set(parsed.data)
      .where(and(eq(applicationsTable.id, id), eq(applicationsTable.userId, req.userId!)))
      .returning();

    if (!app) { res.status(404).json({ error: "Application not found" }); return; }
    res.json(app);
  } catch (err) {
    req.log.error(err, "Failed to update application");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
