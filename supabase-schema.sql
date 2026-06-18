-- ============================================================
-- Job Scout Pro AI — Supabase Database Schema
-- ============================================================
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Profiles: one row per authenticated user
CREATE TABLE IF NOT EXISTS profiles (
  id              SERIAL PRIMARY KEY,
  user_id         TEXT NOT NULL UNIQUE,   -- Supabase auth.users.id (UUID)
  full_name       TEXT,
  preferred_roles TEXT[]  NOT NULL DEFAULT '{}',
  preferred_locations TEXT[] NOT NULL DEFAULT '{}',
  expected_salary_min INTEGER,
  expected_salary_max INTEGER,
  work_mode       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ
);

-- Resumes: one row per user (upserted)
CREATE TABLE IF NOT EXISTS resumes (
  id              SERIAL PRIMARY KEY,
  user_id         TEXT NOT NULL UNIQUE,
  raw_text        TEXT NOT NULL,
  skills          TEXT[]  NOT NULL DEFAULT '{}',
  experience      TEXT[]  NOT NULL DEFAULT '{}',
  education       TEXT[]  NOT NULL DEFAULT '{}',
  certifications  TEXT[]  NOT NULL DEFAULT '{}',
  projects        TEXT[]  NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ
);

-- Jobs: saved job listings per user
CREATE TABLE IF NOT EXISTS jobs (
  id          SERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL,
  title       TEXT NOT NULL,
  company     TEXT NOT NULL,
  location    TEXT,
  description TEXT,
  url         TEXT,
  status      TEXT NOT NULL DEFAULT 'saved',
  notes       TEXT,
  score       INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs (user_id);

-- Job scores: AI analysis results per job
CREATE TABLE IF NOT EXISTS job_scores (
  id               SERIAL PRIMARY KEY,
  job_id           INTEGER NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
  score            INTEGER NOT NULL,
  matching_skills  TEXT[]  NOT NULL DEFAULT '{}',
  missing_skills   TEXT[]  NOT NULL DEFAULT '{}',
  experience_gap   TEXT,
  ats_score        INTEGER,
  missing_keywords TEXT[]  NOT NULL DEFAULT '{}',
  reasoning        TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_scores_job_id ON job_scores (job_id);

-- Applications: tracking per job
CREATE TABLE IF NOT EXISTS applications (
  id                SERIAL PRIMARY KEY,
  job_id            INTEGER NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
  user_id           TEXT NOT NULL,
  cover_letter      TEXT,
  recruiter_message TEXT,
  notes             TEXT,
  applied_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications (user_id);

-- ============================================================
-- Row Level Security (optional but recommended)
-- Enable RLS if you ever query Supabase directly from the
-- browser without going through your Express API.
-- The Express API uses the service_role key which bypasses RLS.
-- ============================================================
-- ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE resumes     ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE jobs        ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE job_scores  ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
