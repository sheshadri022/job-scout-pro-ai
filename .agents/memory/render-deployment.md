---
name: Render Deployment
description: render.yaml structure, two-service setup, and required env vars for Render.
---

## Structure (render.yaml at repo root)

- **job-scout-api**: Web Service (Node.js), health check `/api/healthz`, port 10000
  - Build: `npm install -g pnpm && pnpm install --frozen-lockfile && pnpm --filter @workspace/api-server run build`
  - Start: `node --enable-source-maps artifacts/api-server/dist/index.mjs`
- **job-scout-frontend**: Static Site (Vite build)
  - Build: `npm install -g pnpm && pnpm install --frozen-lockfile && pnpm --filter @workspace/job-assistant run build`
  - Publish dir: `artifacts/job-assistant/dist`
  - SPA rewrite: `/* → /index.html`

## Critical: cross-domain API calls

Frontend is a static site at a different domain than the API. Set `VITE_API_URL` to the API service's Render URL (e.g. `https://job-scout-api.onrender.com`). `main.tsx` calls `setBaseUrl(apiUrl)` at startup so all generated hooks use the absolute URL.

**Why:** Without `VITE_API_URL`, all `/api/*` fetches hit the frontend's own domain (404).
