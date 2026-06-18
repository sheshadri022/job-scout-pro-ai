---
name: Supabase Auth Migration
description: How Supabase Auth replaced Clerk — env vars, JWT flow, and key gotchas.
---

## Auth flow

1. Frontend: `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)` in `artifacts/job-assistant/src/lib/supabase.ts`
2. `AuthProvider` in `src/contexts/auth.tsx` calls `supabase.auth.onAuthStateChange` and sets session state
3. `setAuthTokenGetter(() => supabase.auth.getSession().then(s => s.data.session?.access_token ?? null))` wires the token into every API call via the custom-fetch layer
4. Backend: `getSupabaseClient()` lazily creates `createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)` and verifies tokens with `supabase.auth.getUser(token)`

## Environment variables

| Var | Side | Source in Supabase |
|---|---|---|
| `SUPABASE_URL` | Backend | Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Settings → API → service_role secret key |
| `DATABASE_URL` | Backend | Settings → Database → Connection string (Transaction mode) |
| `VITE_SUPABASE_URL` | Frontend | Same as SUPABASE_URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Settings → API → anon public key |

**Why:** `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — backend only. `SUPABASE_ANON_KEY` is safe for the browser.

## Graceful degradation

- Frontend shows "Supabase not configured" screen (not a crash) when `VITE_SUPABASE_*` vars are missing
- Backend `requireAuth` returns HTTP 503 (not crash) when `SUPABASE_*` vars are missing
- Supabase client is lazily initialized on first `requireAuth` call

## DB userId

`profiles.user_id` stores Supabase auth UUIDs directly. No Clerk ID mapping.
