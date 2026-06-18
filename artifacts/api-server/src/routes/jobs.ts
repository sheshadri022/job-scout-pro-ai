import { Router } from "express";
import { db, jobsTable, jobScoresTable, resumesTable } from "@workspace/db";
import { eq, and, gte, ilike, or } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import {
  CreateJobBody,
  UpdateJobBody,
  ListJobsQueryParams,
} from "@workspace/api-zod";
import { openai } from "../lib/openai";

const router = Router();

// GET /api/jobs
router.get("/jobs", requireAuth, async (req, res) => {
  try {
    const qp = ListJobsQueryParams.safeParse(req.query);
    const { status, minScore, search } = qp.success ? qp.data : {};

    let query = db
      .select()
      .from(jobsTable)
      .where(eq(jobsTable.userId, req.userId!))
      .$dynamic();

    if (status) {
      query = query.where(and(eq(jobsTable.userId, req.userId!), eq(jobsTable.status, status)));
    }
    if (minScore !== undefined) {
      query = query.where(and(eq(jobsTable.userId, req.userId!), gte(jobsTable.score, minScore)));
    }

    let jobs = await query.orderBy(jobsTable.createdAt);

    if (search) {
      const s = search.toLowerCase();
      jobs = jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(s) ||
          j.company.toLowerCase().includes(s) ||
          (j.location ?? "").toLowerCase().includes(s),
      );
    }

    res.json(jobs);
  } catch (err) {
    req.log.error(err, "Failed to list jobs");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/jobs
router.post("/jobs", requireAuth, async (req, res) => {
  const parsed = CreateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  try {
    const [job] = await db
      .insert(jobsTable)
      .values({ ...parsed.data, userId: req.userId!, status: "saved" })
      .returning();
    res.status(201).json(job);
  } catch (err) {
    req.log.error(err, "Failed to create job");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/jobs/:id
router.get("/jobs/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  try {
    const [job] = await db
      .select()
      .from(jobsTable)
      .where(and(eq(jobsTable.id, id), eq(jobsTable.userId, req.userId!)))
      .limit(1);

    if (!job) { res.status(404).json({ error: "Job not found" }); return; }
    res.json(job);
  } catch (err) {
    req.log.error(err, "Failed to get job");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/jobs/:id
router.patch("/jobs/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateJobBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  try {
    const [job] = await db
      .update(jobsTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(jobsTable.id, id), eq(jobsTable.userId, req.userId!)))
      .returning();

    if (!job) { res.status(404).json({ error: "Job not found" }); return; }
    res.json(job);
  } catch (err) {
    req.log.error(err, "Failed to update job");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/jobs/:id
router.delete("/jobs/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  try {
    await db
      .delete(jobsTable)
      .where(and(eq(jobsTable.id, id), eq(jobsTable.userId, req.userId!)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err, "Failed to delete job");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/jobs/:id/score — AI-powered match scoring
router.post("/jobs/:id/score", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  try {
    const [job] = await db
      .select()
      .from(jobsTable)
      .where(and(eq(jobsTable.id, id), eq(jobsTable.userId, req.userId!)))
      .limit(1);

    if (!job) { res.status(404).json({ error: "Job not found" }); return; }

    const [resume] = await db
      .select()
      .from(resumesTable)
      .where(eq(resumesTable.userId, req.userId!))
      .limit(1);

    if (!resume) {
      res.status(400).json({ error: "Upload your resume first before scoring jobs" });
      return;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 2048,
      messages: [
        {
          role: "system",
          content: `You are an expert career coach and ATS specialist. Analyze how well a resume matches a job description.
Return ONLY valid JSON with these keys:
- score: number (0-100 overall match)
- matchingSkills: string[] (skills the candidate has that match)
- missingSkills: string[] (required skills the candidate lacks)
- experienceGap: string | null (brief note on experience level gap, or null)
- atsScore: number (0-100 ATS keyword match estimate)
- missingKeywords: string[] (important keywords missing from resume)
- reasoning: string (2-3 sentence explanation of the score)`,
        },
        {
          role: "user",
          content: `JOB TITLE: ${job.title} at ${job.company}
JOB DESCRIPTION: ${job.description ?? "(no description provided)"}

RESUME SKILLS: ${resume.skills.join(", ")}
RESUME EXPERIENCE: ${resume.experience.join(" | ")}
RESUME EDUCATION: ${resume.education.join(" | ")}
RESUME CERTIFICATIONS: ${resume.certifications.join(", ")}`,
        },
      ],
    });

    let scoreData: {
      score: number;
      matchingSkills: string[];
      missingSkills: string[];
      experienceGap: string | null;
      atsScore: number;
      missingKeywords: string[];
      reasoning: string;
    } = {
      score: 50,
      matchingSkills: [],
      missingSkills: [],
      experienceGap: null,
      atsScore: 50,
      missingKeywords: [],
      reasoning: "Unable to parse AI response.",
    };

    try {
      const content = completion.choices[0]?.message?.content ?? "{}";
      const json = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      scoreData = JSON.parse(json);
    } catch {
      // keep defaults
    }

    // Save score and update job score field
    const [savedScore] = await db
      .insert(jobScoresTable)
      .values({ jobId: id, ...scoreData })
      .returning();

    await db
      .update(jobsTable)
      .set({ score: scoreData.score, updatedAt: new Date() })
      .where(eq(jobsTable.id, id));

    res.json(savedScore);
  } catch (err) {
    req.log.error(err, "Failed to score job");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
