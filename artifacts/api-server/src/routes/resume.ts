import { Router } from "express";
import multer from "multer";
import { inflateSync, inflateRawSync } from "zlib";
import { db, resumesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { UploadResumeBody } from "@workspace/api-zod";
import { openai } from "../lib/openai";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/**
 * Extract plain text from a PDF buffer using Node.js built-in zlib only.
 * Handles FlateDecode streams and standard PDF text operators (Tj / TJ / ' / ").
 * Works with PDFs produced by Word, Google Docs, LibreOffice, most resume builders.
 */
function extractTextFromPdf(buffer: Buffer): string {
  const bytes = buffer.toString("binary");
  let text = "";

  // Find all stream … endstream blocks
  const streamPattern = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let streamMatch: RegExpExecArray | null;

  while ((streamMatch = streamPattern.exec(bytes)) !== null) {
    const raw = Buffer.from(streamMatch[1], "binary");
    let decoded: Buffer | null = null;

    // Try FlateDecode (zlib)
    try { decoded = inflateSync(raw); } catch { /* not zlib */ }
    // Try raw deflate (no zlib header)
    if (!decoded) {
      try { decoded = inflateRawSync(raw); } catch { /* not raw deflate */ }
    }
    // Fall back to raw bytes (uncompressed stream)
    if (!decoded) decoded = raw;

    const s = decoded.toString("binary");

    // --- PDF text operator extraction ---

    // (string) Tj / ' / "
    const tjRe = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*(?:Tj|'|")/g;
    let m: RegExpExecArray | null;
    while ((m = tjRe.exec(s)) !== null) {
      text += decodePdfString(m[1]) + " ";
    }

    // [(string|number) …] TJ
    const tjArrayRe = /\[([\s\S]*?)\]\s*TJ/g;
    while ((m = tjArrayRe.exec(s)) !== null) {
      const inner = m[1];
      const strRe = /\(([^)\\]*(?:\\.[^)\\]*)*)\)/g;
      let sm: RegExpExecArray | null;
      while ((sm = strRe.exec(inner)) !== null) {
        text += decodePdfString(sm[1]);
      }
      text += " ";
    }
  }

  return text.replace(/\s+/g, " ").trim();
}

/** Decode a raw PDF string value (unescape backslash sequences, handle UTF-16BE). */
function decodePdfString(raw: string): string {
  // Check for UTF-16BE BOM (þÿ in latin1 = 0xFE 0xFF)
  if (raw.startsWith("\xfe\xff")) {
    const bytes = Buffer.from(raw, "binary");
    try { return bytes.slice(2).toString("utf16le").split("").reverse().join(""); } catch { /* fallback */ }
  }
  // Standard PDF escape sequences
  return raw
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\")
    .replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
}

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

// POST /api/resume/upload-pdf — upload PDF file, extract text with built-in zlib
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
    const rawText = extractTextFromPdf(req.file.buffer);

    if (rawText.length < 50) {
      res.status(400).json({ error: "Could not extract enough text from this PDF. Try pasting the text directly instead." });
      return;
    }

    const resume = await parseAndSaveResume(req.userId!, rawText);
    res.json(resume);
  } catch (err) {
    req.log.error(err, "Failed to parse PDF");
    res.status(500).json({ error: "Failed to read PDF. Try pasting your resume as plain text instead." });
  }
});

export default router;
