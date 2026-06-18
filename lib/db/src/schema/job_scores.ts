import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { jobsTable } from "./jobs";

export const jobScoresTable = pgTable("job_scores", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobsTable.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  matchingSkills: text("matching_skills").array().notNull().default([]),
  missingSkills: text("missing_skills").array().notNull().default([]),
  experienceGap: text("experience_gap"),
  atsScore: integer("ats_score"),
  missingKeywords: text("missing_keywords").array().notNull().default([]),
  reasoning: text("reasoning"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertJobScoreSchema = createInsertSchema(jobScoresTable).omit({ id: true, createdAt: true });
export type InsertJobScore = z.infer<typeof insertJobScoreSchema>;
export type JobScore = typeof jobScoresTable.$inferSelect;
