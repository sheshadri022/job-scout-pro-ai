import { Router } from "express";
import { db, jobsTable, resumesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import {
  GenerateCoverLetterBody,
  GenerateRecruiterMessageBody,
  GenerateResumeTipsBody,
  GenerateInterviewPrepBody,
} from "@workspace/api-zod";
import { openai } from "../lib/openai";

const router = Router();

async function getJobAndResume(userId: string, jobId: number) {
  const [job] = await db
    .select()
    .from(jobsTable)
    .where(and(eq(jobsTable.id, jobId), eq(jobsTable.userId, userId)))
    .limit(1);

  const [resume] = await db
    .select()
    .from(resumesTable)
    .where(eq(resumesTable.userId, userId))
    .limit(1);

  return { job, resume };
}

// POST /api/ai/cover-letter
router.post("/ai/cover-letter", requireAuth, async (req, res) => {
  const parsed = GenerateCoverLetterBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  try {
    const { job, resume } = await getJobAndResume(req.userId!, parsed.data.jobId);
    if (!job) { res.status(404).json({ error: "Job not found" }); return; }
    if (!resume) { res.status(400).json({ error: "Upload your resume first" }); return; }

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 2048,
      messages: [
        {
          role: "system",
          content: `You are an expert career coach who writes compelling, authentic cover letters. 
Write a professional cover letter that:
- Addresses the specific role and company
- Highlights the most relevant skills and experience from the resume
- Sounds natural and not generic
- Is 3-4 paragraphs (opening, body x2, closing)
- Does NOT include "[Your Name]" placeholders — leave a blank line for signature`,
        },
        {
          role: "user",
          content: `JOB: ${job.title} at ${job.company}${job.location ? ` (${job.location})` : ""}
DESCRIPTION: ${job.description ?? "(no description)"}

MY SKILLS: ${resume.skills.join(", ")}
MY EXPERIENCE: ${resume.experience.join(" | ")}
MY EDUCATION: ${resume.education.join(" | ")}
MY PROJECTS: ${resume.projects.join(" | ")}`,
        },
      ],
    });

    res.json({ content: completion.choices[0]?.message?.content ?? "" });
  } catch (err) {
    req.log.error(err, "Failed to generate cover letter");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/ai/recruiter-message
router.post("/ai/recruiter-message", requireAuth, async (req, res) => {
  const parsed = GenerateRecruiterMessageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  try {
    const { job, resume } = await getJobAndResume(req.userId!, parsed.data.jobId);
    if (!job) { res.status(404).json({ error: "Job not found" }); return; }
    if (!resume) { res.status(400).json({ error: "Upload your resume first" }); return; }

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 512,
      messages: [
        {
          role: "system",
          content: `Write a short, professional LinkedIn recruiter outreach message (150 words max). 
It should be warm, specific to the role, highlight 1-2 key qualifications, and end with a clear ask.
No fluff. No "I hope this message finds you well."`,
        },
        {
          role: "user",
          content: `JOB: ${job.title} at ${job.company}
TOP SKILLS: ${resume.skills.slice(0, 8).join(", ")}
KEY EXPERIENCE: ${resume.experience[0] ?? ""}`,
        },
      ],
    });

    res.json({ content: completion.choices[0]?.message?.content ?? "" });
  } catch (err) {
    req.log.error(err, "Failed to generate recruiter message");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/ai/resume-tips
router.post("/ai/resume-tips", requireAuth, async (req, res) => {
  const parsed = GenerateResumeTipsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  try {
    const { job, resume } = await getJobAndResume(req.userId!, parsed.data.jobId);
    if (!job) { res.status(404).json({ error: "Job not found" }); return; }
    if (!resume) { res.status(400).json({ error: "Upload your resume first" }); return; }

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 1024,
      messages: [
        {
          role: "system",
          content: `You are an ATS and resume optimization expert. Provide specific, actionable resume improvement suggestions for this job application.
Format as a numbered list of 5-7 concrete suggestions. Each suggestion should be specific — not generic advice.
Focus on: missing keywords, phrasing improvements, skills to highlight, quantification opportunities.`,
        },
        {
          role: "user",
          content: `JOB: ${job.title} at ${job.company}
JOB DESCRIPTION: ${job.description ?? "(no description)"}
CURRENT RESUME SKILLS: ${resume.skills.join(", ")}
CURRENT EXPERIENCE: ${resume.experience.join(" | ")}`,
        },
      ],
    });

    res.json({ content: completion.choices[0]?.message?.content ?? "" });
  } catch (err) {
    req.log.error(err, "Failed to generate resume tips");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/ai/interview-prep
router.post("/ai/interview-prep", requireAuth, async (req, res) => {
  const parsed = GenerateInterviewPrepBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  try {
    const { job, resume } = await getJobAndResume(req.userId!, parsed.data.jobId);
    if (!job) { res.status(404).json({ error: "Job not found" }); return; }
    if (!resume) { res.status(400).json({ error: "Upload your resume first" }); return; }

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 1024,
      messages: [
        {
          role: "system",
          content: `You are an interview coach. Generate likely interview questions for this specific role and candidate.
Include a mix of: technical questions (based on job requirements), behavioral questions (based on experience), and role-specific situational questions.
Format: numbered list of 8-10 questions. After each question, add a brief tip on how to approach it in italics.`,
        },
        {
          role: "user",
          content: `JOB: ${job.title} at ${job.company}
DESCRIPTION: ${job.description ?? "(no description)"}
CANDIDATE SKILLS: ${resume.skills.join(", ")}
CANDIDATE EXPERIENCE: ${resume.experience.join(" | ")}`,
        },
      ],
    });

    res.json({ content: completion.choices[0]?.message?.content ?? "" });
  } catch (err) {
    req.log.error(err, "Failed to generate interview prep");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
