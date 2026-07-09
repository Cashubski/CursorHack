# PatchPilot

A responsive web app that turns messy bug reports into structured agent tasks,
dispatches them to a Cursor agent workflow, and gates every merge behind a
human review + safety checklist. Tasks are persisted to **Supabase** so the
board is shared and durable.

Built for the CursorHack hackathon.

## Highlights

- **Dashboard** (`/`) - live board of every bug-report task with stats
  (total / running / awaiting review / merged), status badges, and one-click
  resume into wherever each task left off.
- **Issue intake** (`/intake`) - paste a raw report, tag reporter, severity, and
  affected area. "Load sample" prefills a realistic demo report.
- **AI engineering brief** (`/brief`) - an editable, structured brief (title,
  summary, repro steps, approach, acceptance criteria, likely files, risk).
- **Agent run status** (`/run`) - a live (mocked) Cursor agent pipeline with an
  animated step timeline, elapsed timer, streamed console logs, and a proposed
  diff.
- **Review + safety checklist** (`/review`) - change summary, a gated safety
  checklist (required checks block merge), approve / request-changes, and a
  mock merge + PR link.

## Tech

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Zustand for cross-screen state
- Supabase (Postgres) for persistence, with an automatic browser
  `localStorage` fallback so the app runs with zero configuration

## Run locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Build

```bash
npm run build
npm run start
```

## Deploy to Vercel

This is a standard Next.js App Router app, so Vercel auto-detects the framework
and build settings. It deploys with **no required environment variables** - if
Supabase/OpenAI keys are absent it degrades to `localStorage` and the offline
template brief, so Preview URLs work immediately.

Recommended hackathon setup:

1. Import the GitHub repo into Vercel (connect Vercel before the event so
   deployments are ready instantly).
2. Enable **Preview Deployments** so every branch and PR gets its own shareable
   URL for parallel review.
3. Disable **Preview Deployment Authentication** (or configure an automation
   bypass) so teammates and AI agents can open Preview URLs without signing in.
4. Optionally add the env vars below in Project Settings -> Environment
   Variables (set them for Preview and Production):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`, `OPENAI_MODEL`

When validating UI from Cursor iOS, ask it explicitly to capture screenshots of
the deployed Preview URL - deployment-specific issues are best verified there
rather than only against a local dev server.

## Supabase setup

The app works out of the box using `localStorage`. To enable shared, persistent
storage:

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor.
   It creates a `tasks` table (JSONB pipeline artifacts) with permissive RLS
   policies suitable for a demo.
3. Set env vars (see [`.env.example`](.env.example)):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (new `sb_publishable_...` key) or the
     legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` - either works.

   Use only a client-safe key here. Never expose the secret / `service_role`
   key; the app operates entirely through RLS-protected client calls.

The header shows a "Supabase" / "Local" indicator so you always know which
backend is active.

## Seed demo data

To populate the board with a few realistic tasks (great for a demo):

```bash
# with Supabase env vars set (or in .env.local)
npm run seed
```

The script (`scripts/seed.mjs`) is safe to re-run - it clears its own prior
rows (reporter prefixed `demo:`) before inserting a fresh set spanning the
briefed / running / review / merged states.

## Realtime board

The dashboard subscribes to task changes so it updates live with no refresh
(open it in two windows and create a report in one). With Supabase this uses
Postgres change streams; without it, it syncs across browser tabs via
`localStorage` events.

To enable Supabase Realtime, ensure the `tasks` table is in the realtime
publication (included in `supabase/schema.sql`):

```sql
alter publication supabase_realtime add table public.tasks;
```

## Local environment

For local development against Supabase, create `.env.local` (gitignored):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon or publishable key>
# optional
OPENAI_API_KEY=<key>
```

## AI brief generation

By default the brief is produced by a deterministic, offline template
synthesizer (`lib/synthesizeBrief.ts`) so the demo never blocks on the network.

To use a real model, set `OPENAI_API_KEY` (optionally `OPENAI_MODEL`, default
`gpt-4o-mini`). The `/api/brief` route calls OpenAI and automatically falls back
to the template brief on any error or timeout. Add secrets in the Cloud Agents
dashboard Secrets tab, not in this repo.

## Notes

The agent run is intentionally mocked (`lib/mockAgent.ts`) to keep the demo fast
and self-contained, per the v1 goal of prioritising demo clarity over
completeness.
