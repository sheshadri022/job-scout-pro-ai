import { Router } from "express";
import multer from "multer";
import { db, resumesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { UploadResumeBody } from "@workspace/api-zod";
import { openai } from "../lib/openai";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

async function parseAndSaveResume(userId: string, rawText: string) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_completion_tokens: 4096,
    messages: [
      {
        role: "system",
        content: `You are a resume parser. Extract structured data from the provided resume text.
Return ONLY valid JSON with these keys:
- skills: string[] (technical and soft skills)
- experience: string[] (each job as "Title at Company (Years)" or similar)
- education: string[] (each degree/institution)
- certifications: string[] (certifications and licenses)
- projects: string[] (notable projects with 1-line description)
Return empty arrays for sections not found.`,
      },
      { role: "user", content: rawText },
    ],
  });

  let parsed_sections: {
    skills: string[];
    experience: string[];
    education: string[];
    certifications: string[];
    projects: string[];
  } = { skills: [], experience: [], education: [], certifications: [], projects: [] };

  try {
    const content = completion.choices[0]?.message?.content ?? "{}";
    const json = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    parsed_sections = JSON.parse(json);
  } catch {
    // fallback to empty arrays
  }

  const existing = await db
    .select()
    .from(resumesTable)
    .where(eq(resumesTable.userId, userId))
    .limit(1);

  let resume;
  if (existing.length > 0) {
    [resume] = await db
      .update(resumesTable)
      .set({
        rawText,
        skills: parsed_sections.skills,
        experience: parsed_sections.experience,
        education: parsed_sections.education,
        certifications: parsed_sections.certifications,
        projects: parsed_sections.projects,
        updatedAt: new Date(),
      })
      .where(eq(resumesTable.userId, userId))
      .returning();
  } else {
    [resume] = await db
      .insert(resumesTable)
      .values({
        userId,
        rawText,
        skills: parsed_sections.skills,
        experience: parsed_sections.experience,
        education: parsed_sections.education,
        certifications: parsed_sections.certifications,
        projects: parsed_sections.projects,
      })
      .returning();
  }

  return resume;
}

// GET /api/resume
router.get("/resume", requireAuth, async (req, res) => {
  try {
    const [resume] = await db
      .select()
      .from(resumesTable)
      .where(eq(resumesTable.userId, req.userId!))
      .limit(1);

    if (!resume) {
      res.status(404).json({ error: "Resume not found" });
      return;
    }
    res.json(resume);
  } catch (err) {
    req.log.error(err, "Failed to get resume");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/resume — upload resume as text
router.post("/resume", requireAuth, async (req, res) => {
  const parsed = UploadResumeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input — rawText is required (min 50 chars)" });
    return;
  }

  try {
    const resume = await parseAndSaveResume(req.userId!, parsed.data.rawText);
    res.json(resume);
  } catch (err) {
    req.log.error(err, "Failed to parse/save resume");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/resume/upload-pdf — upload PDF file
router.post("/resume/upload-pdf", requireAuth, upload.single("resume"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No PDF file uploaded" });
    return;
  }

  if (req.file.mimetype !== "application/pdf") {
    res.status(400).json({ error: "File must be a PDF" });
    return;
  }

  try {
    // Dynamically import pdf-parse to handle CJS compatibility
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfMod = await import("pdf-parse") as any;
    const pdfParse = pdfMod.default ?? pdfMod;
    const data = await pdfParse(req.file.buffer);
    const rawText = data.text.trim();

    if (rawText.length < 50) {
      res.status(400).json({ error: "Could not extract enough text from PDF. Try pasting as text instead." });
      return;
    }

    const resume = await parseAndSaveResume(req.userId!, rawText);
    res.json(resume);
  } catch (err) {
    req.log.error(err, "Failed to parse PDF");
    res.status(500).json({ error: "Failed to extract text from PDF. Try pasting as plain text instead." });
  }
});

export default router;
