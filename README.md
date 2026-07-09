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
- **Agent run status** (`/run`) - dispatch the brief as a **real Cursor Cloud
  Agent** on your repo (live status polling, real branch + PR), or run a fast
  simulated pipeline for demos. Both share an animated step timeline, elapsed
  timer, and streamed console.
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
   - `CURSOR_API_KEY` (+ optional `CURSOR_TARGET_REPO`, `CURSOR_TARGET_REF`)

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

## Collaboration & GitHub sign-in

When Supabase is configured, PatchPilot becomes multiplayer:

- **Live presence** — the header shows a realtime avatar stack of everyone
  currently in the app (via Supabase Realtime Presence). This works out of the
  box with just the anon/publishable key — guests get a colored avatar.
- **Sign in with GitHub** — real accounts via Supabase Auth. Once signed in, a
  reporter's handle prefills on intake, and approvals/merges are attributed
  ("Approved by @you", "Merged by @you"), so a whole team can share one board.

Presence needs no extra setup. To enable **GitHub sign-in**, wire up the OAuth
app once (values below assume the deployed URL and Supabase project ref
`pcpxipuvrgkqionpqrwr`):

1. GitHub → Settings → Developer settings → **OAuth Apps → New OAuth App**:
   - Homepage URL: `https://patchpilot-psi.vercel.app`
   - Authorization callback URL:
     `https://pcpxipuvrgkqionpqrwr.supabase.co/auth/v1/callback`
2. Copy the **Client ID** and generate a **Client Secret**.
3. Supabase → **Authentication → Providers → GitHub**: enable it and paste the
   Client ID + Secret.
4. Supabase → **Authentication → URL Configuration**: set Site URL to
   `https://patchpilot-psi.vercel.app` and add redirect URLs
   `https://patchpilot-psi.vercel.app/**` (plus `http://localhost:3000/**` for
   local dev). Add Vercel Preview domains too if you want sign-in on previews.

No app env vars are needed — the GitHub credentials live in Supabase. Until the
provider is enabled, the "Sign in" button shows a friendly notice and the rest
of the app (including presence) keeps working.

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

## Real Cursor agent dispatch

Set `CURSOR_API_KEY` (a Cursor user API key from Dashboard -> Integrations ->
API Keys) to unlock the **Dispatch real agent** button on the brief screen. The
server-only routes:

- `POST /api/agent/launch` - builds a scoped prompt from the brief and calls
  `POST /v1/agents` on `CURSOR_TARGET_REPO` (default `Cashubski/CursorHack`,
  branch `CURSOR_TARGET_REF`, default `main`) with `autoCreatePR: true`.
- `GET /api/agent/status` - polls `GET /v1/agents/{id}/runs/{runId}`, maps the
  Cursor run status onto the pipeline, and surfaces the real branch + PR URL.

Both routes are same-origin only and rate limited, and the key never reaches the
browser. When no key is configured the button is hidden and the app runs the
simulation instead. Add the key in the Cloud Agents dashboard Secrets tab (or
Vercel Project Settings), not in this repo.

## Notes

For demos, the **Simulated run** path (`lib/mockAgent.ts`) is fast and fully
self-contained, so a live presentation never blocks on a multi-minute real agent
run or network. The real dispatch path proves the end-to-end integration; keep
both available and choose per situation.
