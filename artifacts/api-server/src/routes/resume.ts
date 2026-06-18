import { Router } from "express";
import multer from "multer";
import { inflateSync, inflateRawSync } from "zlib";
import { db, resumesTable, profilesTable, jobsTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { UploadResumeBody } from "@workspace/api-zod";
import { openai } from "../lib/openai";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ─── PDF Text Extraction (zero-dependency, Node.js built-ins only) ─────────────

/** Decode a hex string from a PDF <...> token into readable text. */
function decodeHexString(hex: string): string {
  const clean = hex.replace(/\s/g, "");
  if (!clean || clean.length % 2 !== 0) return "";
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    bytes.push(parseInt(clean.slice(i, i + 2), 16));
  }
  const buf = Buffer.from(bytes);

  // UTF-16BE BOM: 0xFE 0xFF
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
    try { return Buffer.from(buf.slice(2)).swap16().toString("utf16le"); } catch { /* fallback */ }
  }
  // Heuristic: if leading bytes are 0x00 (ASCII in UTF-16BE)
  if (buf.length >= 4 && buf.length % 2 === 0 && buf[0] === 0x00) {
    try { return Buffer.from(buf).swap16().toString("utf16le"); } catch { /* fallback */ }
  }
  // PDFDocEncoding / latin-1
  return buf.toString("latin1");
}

/** Decode a literal PDF string (...)  — unescape backslash sequences, handle UTF-16BE BOM. */
function decodeLiteralString(raw: string): string {
  const buf = Buffer.from(raw, "binary");
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
    try { return Buffer.from(buf.slice(2)).swap16().toString("utf16le"); } catch { /* fallback */ }
  }
  return raw
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\")
    .replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
}

/** Extract text from a single decoded content stream. */
function extractFromStream(s: string): string {
  let text = "";

  // Process tokens: literal strings (...)Tj, hex strings <...>Tj, and TJ arrays
  const tokenRe =
    /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*(?:Tj|'|")|<([0-9a-fA-F\s]+)>\s*(?:Tj|'|")|\[([\s\S]*?)\]\s*TJ/g;
  let m: RegExpExecArray | null;

  while ((m = tokenRe.exec(s)) !== null) {
    if (m[1] !== undefined) {
      // Literal (string) Tj
      const t = decodeLiteralString(m[1]);
      if (t.trim()) text += t;
    } else if (m[2] !== undefined) {
      // Hex <hex> Tj
      const t = decodeHexString(m[2]);
      if (t.trim()) text += t;
    } else if (m[3] !== undefined) {
      // TJ array [ ... ]
      const inner = m[3];
      // Extract all literal and hex strings from the array
      const litRe = /\(([^)\\]*(?:\\.[^)\\]*)*)\)/g;
      const hexRe = /<([0-9a-fA-F\s]+)>/g;
      let sm: RegExpExecArray | null;
      let prev = 0;
      // Interleave literals and hex in order
      const parts: Array<{ pos: number; text: string }> = [];
      while ((sm = litRe.exec(inner)) !== null) {
        parts.push({ pos: sm.index, text: decodeLiteralString(sm[1]) });
      }
      while ((sm = hexRe.exec(inner)) !== null) {
        parts.push({ pos: sm.index, text: decodeHexString(sm[1]) });
      }
      parts.sort((a, b) => a.pos - b.pos);
      for (const p of parts) text += p.text;
      prev;  // suppress unused warning
    }
    // Add a space between text runs (Td/Tm operators would normally move position)
    text += " ";
  }

  return text;
}

/**
 * Extract plain text from a PDF buffer using Node.js built-in zlib.
 * Handles: FlateDecode (zlib/deflate), literal strings, hex strings,
 * UTF-16BE BOM encoding, TJ arrays — covers Word, Google Docs, LibreOffice, most
 * resume builders.
 */
export function extractTextFromPdf(buffer: Buffer): string {
  const bytes = buffer.toString("binary");
  let text = "";

  const streamPattern = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let streamMatch: RegExpExecArray | null;

  while ((streamMatch = streamPattern.exec(bytes)) !== null) {
    const raw = Buffer.from(streamMatch[1], "binary");
    let decoded: Buffer | null = null;

    try { decoded = inflateSync(raw); } catch { /* not zlib */ }
    if (!decoded) { try { decoded = inflateRawSync(raw); } catch { /* not raw deflate */ } }
    if (!decoded) decoded = raw;  // uncompressed

    text += extractFromStream(decoded.toString("binary")) + "\n";
  }

  return text.replace(/\s+/g, " ").trim();
}

// ─── AI Resume Parsing + Career Preference Extraction ─────────────────────────

interface ParsedResume {
  skills: string[];
  experience: string[];
  education: string[];
  certifications: string[];
  projects: string[];
}

interface CareerPreferences {
  suggestedRoles: string[];
  suggestedLocations: string[];
  workMode: string | null;
}

async function aiParseResume(rawText: string): Promise<{ resume: ParsedResume; career: CareerPreferences }> {
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
- suggestedRoles: string[] (2-4 job titles this person should target, based on their experience)
- suggestedLocations: string[] (locations mentioned in resume, or ["Remote"] if unclear)
- workMode: "remote" | "hybrid" | "onsite" | null (preferred mode if inferable, else null)
Return empty arrays for sections not found.`,
      },
      { role: "user", content: rawText.slice(0, 8000) },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const json = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    const parsed = JSON.parse(json);
    return {
      resume: {
        skills: parsed.skills ?? [],
        experience: parsed.experience ?? [],
        education: parsed.education ?? [],
        certifications: parsed.certifications ?? [],
        projects: parsed.projects ?? [],
      },
      career: {
        suggestedRoles: parsed.suggestedRoles ?? [],
        suggestedLocations: parsed.suggestedLocations ?? [],
        workMode: parsed.workMode ?? null,
      },
    };
  } catch {
    return {
      resume: { skills: [], experience: [], education: [], certifications: [], projects: [] },
      career: { suggestedRoles: [], suggestedLocations: [], workMode: null },
    };
  }
}

async function saveResume(userId: string, rawText: string, sections: ParsedResume) {
  const existing = await db.select().from(resumesTable).where(eq(resumesTable.userId, userId)).limit(1);

  if (existing.length > 0) {
    const [r] = await db.update(resumesTable)
      .set({ rawText, ...sections, updatedAt: new Date() })
      .where(eq(resumesTable.userId, userId))
      .returning();
    return r;
  } else {
    const [r] = await db.insert(resumesTable).values({ userId, rawText, ...sections }).returning();
    return r;
  }
}

/** Upsert career preferences into profile — only fills blank fields, never overwrites user's existing data. */
async function syncProfileFromResume(userId: string, career: CareerPreferences) {
  if (!career.suggestedRoles.length && !career.suggestedLocations.length && !career.workMode) return;

  const [existing] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);

  const patch: Record<string, unknown> = { updatedAt: new Date() };

  if (!existing?.preferredRoles?.length && career.suggestedRoles.length) {
    patch.preferredRoles = career.suggestedRoles;
  }
  if (!existing?.preferredLocations?.length && career.suggestedLocations.length) {
    patch.preferredLocations = career.suggestedLocations;
  }
  if (!existing?.workMode && career.workMode) {
    patch.workMode = career.workMode;
  }

  if (Object.keys(patch).length <= 1) return; // only updatedAt — nothing to change

  if (existing) {
    await db.update(profilesTable).set(patch).where(eq(profilesTable.userId, userId));
  } else {
    await db.insert(profilesTable).values({
      userId,
      preferredRoles: (patch.preferredRoles as string[]) ?? [],
      preferredLocations: (patch.preferredLocations as string[]) ?? [],
      workMode: (patch.workMode as string) ?? null,
    });
  }
}

/** Re-score all of this user's saved/pending jobs with the new resume (fire-and-forget). */
async function rescoreJobsInBackground(userId: string, skills: string[], experience: string[]) {
  if (!skills.length) return;
  try {
    const jobs = await db
      .select()
      .from(jobsTable)
      .where(and(eq(jobsTable.userId, userId), inArray(jobsTable.status, ["saved", "to_apply"])))
      .limit(30);

    for (const job of jobs) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          max_completion_tokens: 512,
          messages: [
            {
              role: "system",
              content: `Return ONLY JSON: {"score": number (0-100)}`,
            },
            {
              role: "user",
              content: `JOB: ${job.title} at ${job.company}\nDESC: ${(job.description ?? "").slice(0, 1500)}\nSKILLS: ${skills.join(", ")}\nEXP: ${experience.slice(0, 3).join(" | ")}`,
            },
          ],
        });
        const content = completion.choices[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(content.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim()) as { score?: number };
        const score = typeof parsed.score === "number" ? parsed.score : null;
        if (score !== null) {
          await db.update(jobsTable).set({ score, updatedAt: new Date() }).where(eq(jobsTable.id, job.id));
        }
      } catch { /* skip individual job failures */ }
    }
  } catch { /* non-fatal */ }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get("/resume", requireAuth, async (req, res) => {
  try {
    const [resume] = await db.select().from(resumesTable).where(eq(resumesTable.userId, req.userId!)).limit(1);
    if (!resume) { res.status(404).json({ error: "Resume not found" }); return; }
    res.json(resume);
  } catch (err) {
    req.log.error(err, "Failed to get resume");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/resume", requireAuth, async (req, res) => {
  const parsed = UploadResumeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input — rawText is required (min 50 chars)" });
    return;
  }
  try {
    const { resume: sections, career } = await aiParseResume(parsed.data.rawText);
    const resume = await saveResume(req.userId!, parsed.data.rawText, sections);
    // Fire-and-forget side effects
    syncProfileFromResume(req.userId!, career).catch(() => {});
    rescoreJobsInBackground(req.userId!, sections.skills, sections.experience).catch(() => {});
    res.json(resume);
  } catch (err) {
    req.log.error(err, "Failed to parse/save resume");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/resume/upload-pdf", requireAuth, upload.single("resume"), async (req, res) => {
  if (!req.file) { res.status(400).json({ error: "No PDF file uploaded" }); return; }
  if (req.file.mimetype !== "application/pdf") { res.status(400).json({ error: "File must be a PDF" }); return; }

  try {
    const rawText = extractTextFromPdf(req.file.buffer);

    if (rawText.length < 50) {
      res.status(400).json({
        error: "Could not extract text from this PDF. Please copy-paste your resume text into the box below instead.",
      });
      return;
    }

    const { resume: sections, career } = await aiParseResume(rawText);
    const resume = await saveResume(req.userId!, rawText, sections);
    // Fire-and-forget side effects
    syncProfileFromResume(req.userId!, career).catch(() => {});
    rescoreJobsInBackground(req.userId!, sections.skills, sections.experience).catch(() => {});
    res.json({ ...resume, _careerUpdated: !!(career.suggestedRoles.length || career.suggestedLocations.length) });
  } catch (err) {
    req.log.error(err, "Failed to parse PDF");
    res.status(500).json({ error: "Failed to read PDF. Try pasting your resume as plain text instead." });
  }
});

export default router;
