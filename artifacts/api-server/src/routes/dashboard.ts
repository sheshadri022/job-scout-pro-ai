import { Router } from "express";
import { db, jobsTable } from "@workspace/db";
import { eq, desc, gte, and, isNotNull } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

// GET /api/dashboard/summary
router.get("/dashboard/summary", requireAuth, async (req, res) => {
  try {
    const allJobs = await db
      .select()
      .from(jobsTable)
      .where(eq(jobsTable.userId, req.userId!));

    const totalJobs = allJobs.length;
    const highMatchJobs = allJobs.filter((j) => (j.score ?? 0) >= 70).length;
    const appliedJobs = allJobs.filter((j) => j.status === "applied").length;
    const interviewJobs = allJobs.filter((j) => j.status === "interview").length;
    const offerJobs = allJobs.filter((j) => j.status === "offer").length;
    const savedJobs = allJobs.filter((j) => j.status === "saved").length;

    const scored = allJobs.filter((j) => j.score !== null && j.score !== undefined);
    const averageScore =
      scored.length > 0
        ? scored.reduce((sum, j) => sum + (j.score ?? 0), 0) / scored.length
        : null;

    res.json({ totalJobs, highMatchJobs, appliedJobs, interviewJobs, offerJobs, savedJobs, averageScore });
  } catch (err) {
    req.log.error(err, "Failed to get dashboard summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/dashboard/recent-jobs
router.get("/dashboard/recent-jobs", requireAuth, async (req, res) => {
  try {
    const jobs = await db
      .select()
      .from(jobsTable)
      .where(eq(jobsTable.userId, req.userId!))
      .orderBy(desc(jobsTable.createdAt))
      .limit(6);
    res.json(jobs);
  } catch (err) {
    req.log.error(err, "Failed to get recent jobs");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/dashboard/top-matches
router.get("/dashboard/top-matches", requireAuth, async (req, res) => {
  try {
    const jobs = await db
      .select()
      .from(jobsTable)
      .where(and(eq(jobsTable.userId, req.userId!), isNotNull(jobsTable.score), gte(jobsTable.score, 60)))
      .orderBy(desc(jobsTable.score))
      .limit(6);
    res.json(jobs);
  } catch (err) {
    req.log.error(err, "Failed to get top matches");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
