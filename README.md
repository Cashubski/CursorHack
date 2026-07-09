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

## Supabase setup

The app works out of the box using `localStorage`. To enable shared, persistent
storage:

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor.
   It creates a `tasks` table (JSONB pipeline artifacts) with permissive RLS
   policies suitable for a demo.
3. Set env vars (see [`.env.example`](.env.example)):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The header shows a "Supabase" / "Local" indicator so you always know which
backend is active.

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
