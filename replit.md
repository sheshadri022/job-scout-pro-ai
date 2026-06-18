# Job Scout Pro AI

An AI-powered personal job application assistant that scores jobs against your resume, generates tailored cover letters, and tracks your applications.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/job-assistant run dev` — run the frontend (dynamic port via $PORT)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

### Required environment variables
| Variable | Where | Notes |
|---|---|---|
| `DATABASE_URL` | API server | Supabase Postgres connection string |
| `SUPABASE_URL` | API server | e.g. `https://abc123.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | API server | Secret key — never expose to browser |
| `OPENAI_API_KEY` | API server | OpenAI key |
| `VITE_SUPABASE_URL` | Frontend | Same URL as above |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Public anon key |
| `VITE_API_URL` | Frontend | Production only — Render API service URL |

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, wouter (routing), TanStack Query, shadcn/ui
- Auth: Supabase Auth (email/password) — custom forms, `@supabase/supabase-js`
- API: Express 5, Supabase JWT verification via `supabase.auth.getUser(token)`
- DB: PostgreSQL (Supabase) + Drizzle ORM
- AI: OpenAI `gpt-4o-mini`
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (OpenAPI spec → React Query hooks + Zod schemas)
- Build: esbuild (CJS bundle)
- Deployment: Render.com (`render.yaml` at repo root)

## Where things live

- `lib/db/src/schema/index.ts` — DB schema (profiles, resumes, jobs, job_scores, applications)
- `artifacts/api-server/src/routes/` — all backend routes (protected by `requireAuth`)
- `artifacts/api-server/src/lib/supabase.ts` — lazy Supabase admin client (service role)
- `artifacts/api-server/src/lib/auth.ts` — `requireAuth` middleware (verifies Supabase JWT)
- `artifacts/api-server/src/lib/openai.ts` — OpenAI client singleton
- `artifacts/job-assistant/src/lib/supabase.ts` — Supabase anon client (browser)
- `artifacts/job-assistant/src/contexts/auth.tsx` — `AuthProvider` + `useAuth()` hook
- `artifacts/job-assistant/src/pages/sign-in.tsx` — custom email/password sign-in form
- `artifacts/job-assistant/src/pages/sign-up.tsx` — custom email/password sign-up form
- `artifacts/job-assistant/src/pages/` — all other frontend pages
- `render.yaml` — Render deployment config (two services: API + static frontend)

## Architecture decisions

- **Supabase Auth**: Frontend holds the session; `access_token` is sent as `Authorization: Bearer` on every API call (wired via `setAuthTokenGetter` in `AuthProvider`). Backend verifies with `supabase.auth.getUser(token)` using the service role key.
- **Contract-first API**: OpenAPI spec → Orval generates React Query hooks + Zod schemas; server validates against the same schemas.
- **Express 5**: `req.params.id` is typed `string | string[]`; always cast with `String(req.params.id)` before `parseInt`.
- **OpenAI model**: All AI calls use `gpt-4o-mini`.
- **Render deployment**: API is a Web Service; frontend is a Static Site. `VITE_API_URL` must be set to the API's Render URL so the frontend can reach it across domains. `setBaseUrl()` is called at app startup in `main.tsx`.
- **DB userId**: `profiles.user_id` stores the Supabase auth UUID directly — no mapping table needed.

## Product

- **Dashboard** — overview of top job matches, recent activity, application stats
- **Jobs** — browse/search saved jobs, view AI match scores
- **Job Detail** — AI-powered job scoring, cover letter generation, recruiter message drafting, resume tips, interview prep
- **Resume** — paste/edit resume text, get AI improvement tips
- **Applications** — track application status across all jobs
- **Settings** — manage user profile (name, target role, target salary, location)

## User preferences

- Stay on current stack (React+Vite, Express, PostgreSQL, Drizzle) — NOT migrating to Next.js.
- Auth: Supabase Auth (replaced Clerk). Database: Supabase PostgreSQL. Deployment: Render.com.

## Gotchas

- `SUPABASE_SERVICE_ROLE_KEY` must NEVER be exposed to the browser. Only the `SUPABASE_ANON_KEY` goes in `VITE_*` vars.
- If `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are not set, the frontend shows a "Supabase not configured" screen gracefully.
- If `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are not set on the backend, protected routes return HTTP 503.
- Wouter v3 exports `Router` (not `WouterRouter`). No `Show` component.
- After any change to `lib/*` packages, run `pnpm run typecheck:libs` before leaf artifact checks.
- Do **not** run `pnpm dev` at workspace root — run individual artifact workflows instead.
- Supabase schema migration: after changing `lib/db/src/schema/`, run `pnpm --filter @workspace/db run push` against the Supabase DATABASE_URL.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
