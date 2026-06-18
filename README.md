# Job Scout Pro AI

> Your personal AI-powered job application assistant — score jobs against your resume, generate tailored cover letters, and track every application.

**Live App:** https://job-scout-frontend-42i7.onrender.com  
**API:** https://job-scout-api-723v.onrender.com

---

## Features

- **AI Job Scoring** — paste a job description and get an instant match score against your resume, with matching/missing skills breakdown and ATS keyword analysis
- **Cover Letter Generator** — one-click tailored cover letters based on the job and your resume
- **Recruiter Message Drafts** — AI-written cold outreach messages ready to send
- **Resume Tips** — specific suggestions to improve your resume for each role
- **Interview Prep** — likely interview questions and suggested answers per job
- **Application Tracker** — track status (saved → applied → interviewing → offer) across all jobs
- **Dashboard** — top matches, recent activity, and application stats at a glance

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, Tailwind CSS v4, shadcn/ui |
| Routing | wouter v3 |
| State | TanStack Query v5 |
| Auth | Supabase Auth (email/password) |
| API | Express 5, Node.js 24 |
| Database | PostgreSQL (Supabase) + Drizzle ORM |
| AI | OpenAI `gpt-4o-mini` |
| Validation | Zod v4 + drizzle-zod |
| Package manager | pnpm workspaces (monorepo) |
| Deployment | Render.com (API web service + static site) |

---

## Project Structure

```
job-scout-pro-ai/
├── artifacts/
│   ├── api-server/          # Express API server
│   │   └── src/routes/      # All protected API routes
│   └── job-assistant/       # React + Vite frontend
│       └── src/pages/       # Dashboard, Jobs, Resume, Applications, Settings
├── lib/
│   ├── db/                  # Drizzle ORM schema + client
│   └── api-spec/            # OpenAPI spec + generated hooks/Zod schemas
├── scripts/                 # Shared utility scripts
├── render.yaml              # Render deployment config
└── supabase-schema.sql      # Database schema (run once in Supabase SQL editor)
```

---

## Getting Started (Local Development)

### Prerequisites
- Node.js 20+
- pnpm (`npm install -g pnpm`)
- A [Supabase](https://supabase.com) project
- An [OpenAI](https://platform.openai.com) API key

### 1. Clone & Install

```bash
git clone https://github.com/sheshadri022/job-scout-pro-ai.git
cd job-scout-pro-ai
pnpm install
```

### 2. Set up the Database

Open your Supabase project → SQL Editor → New query, paste and run `supabase-schema.sql`.

### 3. Configure Environment Variables

Create a `.env` file in `artifacts/api-server/`:

```env
PORT=8080
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
OPENAI_API_KEY=your-openai-key
```

Create a `.env` file in `artifacts/job-assistant/`:

```env
PORT=3000
BASE_PATH=/
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:8080
```

### 4. Run

```bash
# Terminal 1 — API server
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend
pnpm --filter @workspace/job-assistant run dev
```

---

## Deployment (Render.com)

The `render.yaml` at the repo root defines both services. To deploy:

1. Connect this repo to [Render](https://render.com)
2. Render will detect `render.yaml` and create both services automatically
3. Add these environment variables in the Render dashboard for the **API service**:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `OPENAI_API_KEY`
4. Add these for the **frontend static site**:
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`

---

## API Endpoints

All routes are protected by Supabase JWT authentication (`Authorization: Bearer <token>`).

| Method | Path | Description |
|---|---|---|
| GET | `/api/healthz` | Health check |
| GET/PUT | `/api/profile` | User profile |
| GET/POST | `/api/resume` | Resume management |
| POST | `/api/resume/analyze` | AI resume improvement tips |
| GET/POST | `/api/jobs` | Job listings |
| GET/PUT/DELETE | `/api/jobs/:id` | Individual job |
| POST | `/api/jobs/:id/score` | AI job scoring |
| POST | `/api/jobs/:id/cover-letter` | AI cover letter |
| POST | `/api/jobs/:id/recruiter-message` | AI recruiter outreach |
| POST | `/api/jobs/:id/resume-tips` | AI resume tips for job |
| POST | `/api/jobs/:id/interview-prep` | AI interview questions |
| GET/POST | `/api/applications` | Application tracking |
| GET/PUT | `/api/applications/:id` | Individual application |

---

## License

MIT
