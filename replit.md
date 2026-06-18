# Job Scout Pro AI

An AI-powered personal job application assistant that scores jobs against your resume, generates tailored cover letters, and tracks your applications.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/job-assistant run dev` — run the frontend (dynamic port via $PORT)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `OPENAI_API_KEY`, `SESSION_SECRET`, Clerk env vars (auto-injected by Replit Clerk integration)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, wouter (routing), TanStack Query, shadcn/ui, Clerk v6 auth (`@clerk/react`)
- API: Express 5 + `@clerk/express` middleware
- DB: PostgreSQL + Drizzle ORM
- AI: OpenAI `gpt-4o-mini` via `openai` SDK
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/index.ts` — DB schema (profiles, resumes, jobs, job_scores, applications)
- `artifacts/api-server/src/routes/` — all backend routes
- `artifacts/api-server/src/lib/openai.ts` — OpenAI client singleton
- `artifacts/api-server/src/lib/auth.ts` — `requireAuth` middleware using `getAuth(req)`
- `artifacts/job-assistant/src/pages/` — all frontend pages
- `artifacts/job-assistant/src/App.tsx` — routing, Clerk provider, auth token wiring
- `lib/api-client-react/src/` — generated API hooks (Orval), custom-fetch with auth support

## Architecture decisions

- **Contract-first API**: OpenAPI spec → Orval generates React Query hooks + Zod schemas; server validates against the same schemas.
- **Clerk auth**: `clerkMiddleware()` on the Express app reads session tokens from `Authorization: Bearer` header; frontend wires `setAuthTokenGetter(() => getToken())` from `useAuth()` so every API call automatically carries the token.
- **Express 5**: `req.params.id` is typed `string | string[]`; always cast with `String(req.params.id)` before `parseInt`.
- **OpenAI model**: All AI calls use `gpt-4o-mini` (not `gpt-4o` or any `gpt-5-*` alias).
- **Shared proxy routing**: All traffic goes through Replit's proxy at `localhost:80`; API at `/api`, frontend at `/`. Never call service ports directly.

## Product

- **Dashboard** — overview of top job matches, recent activity, application stats
- **Jobs** — browse/search saved jobs, view AI match scores
- **Job Detail** — AI-powered job scoring, cover letter generation, recruiter message drafting, resume tips, interview prep
- **Resume** — paste/edit resume text, get AI improvement tips
- **Applications** — track application status across all jobs
- **Settings** — manage user profile (name, target role, target salary, location)

## User preferences

- Stay on current stack (React+Vite, Express, PostgreSQL, Drizzle) — NOT migrating to Next.js/Supabase/Render.

## Gotchas

- `@clerk/react` v6 has no `SignedIn`/`SignedOut` components — use `useAuth()` hook instead.
- Wouter v3 exports `Router` (not `WouterRouter`). No `Show` component.
- After any change to `lib/*` packages, run `pnpm run typecheck:libs` before leaf artifact checks.
- `pnpm run typecheck` at root is the canonical full check; editor LSP can lag behind.
- Do **not** run `pnpm dev` at workspace root — run individual artifact workflows instead.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
