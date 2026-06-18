# Deployment Guide — Job Scout Pro AI

## 1. GitHub

```bash
# One-time setup (replace YOUR_GITHUB_USERNAME)
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/job-scout-pro-ai.git
git branch -M main
git push -u origin main
```

## 2. Supabase

1. Go to https://supabase.com → create a project (choose a region close to your users)
2. **Settings → API** — copy these values:
   - **Project URL** → `SUPABASE_URL` / `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
   - **service_role secret** key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ keep private
3. **Settings → Database → Connection string** (Transaction mode) → `DATABASE_URL`
4. **SQL Editor → New query** → paste contents of `supabase-schema.sql` → Run

## 3. Render

1. Push code to GitHub (step 1 above)
2. Go to https://render.com → New → Blueprint → connect your repo
   - Render auto-detects `render.yaml` and creates two services
3. Set environment variables in the Render dashboard:

### `job-scout-api` (Web Service)
| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase connection string (Transaction mode) |
| `SUPABASE_URL` | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role secret key |
| `OPENAI_API_KEY` | Your OpenAI API key |

### `job-scout-frontend` (Static Site)
| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | anon public key |
| `VITE_API_URL` | URL of deployed `job-scout-api` (e.g. `https://job-scout-api.onrender.com`) |

> ⚠️ Deploy the API first, copy its URL, then set `VITE_API_URL` on the frontend and redeploy.

4. **Supabase → Authentication → URL Configuration** → add your Render frontend URL to Redirect URLs allowlist

## 4. Replit (dev environment)

Add these in the Secrets panel (lock icon):

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
OPENAI_API_KEY=sk-...
```

Then restart both workflows.
