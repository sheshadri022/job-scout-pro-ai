import { Router } from "express";
import { db, jobsTable, resumesTable, profilesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { getProvider, listProviders } from "../lib/providers";
import { openai } from "../lib/openai";

const router = Router();

// GET /api/discover/providers
router.get("/discover/providers", requireAuth, async (_req, res) => {
  res.json(listProviders());
});

// POST /api/discover/sync — fetch jobs from a provider, auto-score, store
router.post("/discover/sync", requireAuth, async (req, res) => {
  const { provider: providerName = "mock", limit = 20 } = req.body as {
    provider?: string;
    limit?: number;
  };

  try {
    const provider = getProvider(providerName);

    const [profile] = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.userId, req.userId!))
      .limit(1);

    const [resume] = await db
      .select()
      .from(resumesTable)
      .where(eq(resumesTable.userId, req.userId!))
      .limit(1);

    const roles = profile?.preferredRoles?.length ? profile.preferredRoles : ["software engineer"];
    const locations = profile?.preferredLocations?.length ? profile.preferredLocations : ["remote"];
    const scoreThreshold = profile?.scoreThreshold ?? 70;
    const apiKey = profile?.rapidApiKey ?? undefined;

    const listings = await provider.fetchJobs({ roles, locations, limit, apiKey });

    let saved = 0;
    let skipped = 0;

    for (const listing of listings) {
      // Skip duplicates (same source + externalId)
      const existing = await db
        .select({ id: jobsTable.id })
        .from(jobsTable)
        .where(
          and(
            eq(jobsTable.userId, req.userId!),
            eq(jobsTable.source, listing.source),
            eq(jobsTable.externalId, listing.externalId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      // Insert the job
      const [job] = await db
        .insert(jobsTable)
        .values({
          userId: req.userId!,
          title: listing.title,
          company: listing.company,
          location: listing.location,
          description: listing.description.slice(0, 8000),
          url: listing.url,
          status: "saved",
          source: listing.source,
          externalId: listing.externalId,
          reviewStatus: "pending_review",
        })
        .returning();

      // Auto-score if resume exists
      if (resume && job) {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            max_completion_tokens: 1024,
            messages: [
              {
                role: "system",
                content: `You are an ATS/resume matcher. Return ONLY valid JSON with:
- score: number (0-100 overall match)
- matchingSkills: string[] (matching skills)
- missingSkills: string[] (missing skills)
- atsScore: number (0-100 keyword match)
- reasoning: string (1-2 sentence explanation)`,
              },
              {
                role: "user",
                content: `JOB: ${listing.title} at ${listing.company}
DESC: ${listing.description.slice(0, 2000)}
RESUME SKILLS: ${resume.skills.join(", ")}
RESUME EXP: ${resume.experience.slice(0, 3).join(" | ")}`,
              },
            ],
          });

          const content = completion.choices[0]?.message?.content ?? "{}";
          const json = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          const scoreData = JSON.parse(json) as { score?: number };
          const score = typeof scoreData.score === "number" ? scoreData.score : 50;

          await db
            .update(jobsTable)
            .set({
              score,
              reviewStatus: score >= scoreThreshold ? "pending_review" : "skipped",
              updatedAt: new Date(),
            })
            .where(eq(jobsTable.id, job.id));
        } catch {
          // Keep job with no score
        }
      }

      saved++;
    }

    res.json({
      message: `Sync complete`,
      provider: provider.label,
      saved,
      skipped,
      total: listings.length,
    });
  } catch (err) {
    req.log.error(err, "Discover sync failed");
    const msg = err instanceof Error ? err.message : "Sync failed";
    res.status(500).json({ error: msg });
  }
});

// GET /api/discover/queue — pending_review jobs grouped by source, 5 per source
router.get("/discover/queue", requireAuth, async (req, res) => {
  try {
    const jobs = await db
      .select()
      .from(jobsTable)
      .where(and(eq(jobsTable.userId, req.userId!), eq(jobsTable.reviewStatus, "pending_review")))
      .orderBy(desc(jobsTable.score), desc(jobsTable.createdAt));

    // Group by source, max 5 each
    const grouped: Record<string, typeof jobs> = {};
    for (const job of jobs) {
      const src = job.source ?? "manual";
      if (!grouped[src]) grouped[src] = [];
      if (grouped[src].length < 5) grouped[src].push(job);
    }

    res.json(grouped);
  } catch (err) {
    req.log.error(err, "Failed to get discover queue");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/discover/:id/approve — mark job as approved (to_apply)
router.post("/discover/:id/approve", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  try {
    const [job] = await db
      .update(jobsTable)
      .set({ reviewStatus: "approved", status: "to_apply", updatedAt: new Date() })
      .where(and(eq(jobsTable.id, id), eq(jobsTable.userId, req.userId!)))
      .returning();

    if (!job) { res.status(404).json({ error: "Job not found" }); return; }
    res.json(job);
  } catch (err) {
    req.log.error(err, "Failed to approve job");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/discover/:id/skip — skip/dismiss a job
router.post("/discover/:id/skip", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  try {
    const [job] = await db
      .update(jobsTable)
      .set({ reviewStatus: "skipped", updatedAt: new Date() })
      .where(and(eq(jobsTable.id, id), eq(jobsTable.userId, req.userId!)))
      .returning();

    if (!job) { res.status(404).json({ error: "Job not found" }); return; }
    res.json(job);
  } catch (err) {
    req.log.error(err, "Failed to skip job");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
