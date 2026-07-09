# PatchPilot

Mobile-first app that turns messy bug reports into structured agent tasks,
dispatches them to a Cursor agent workflow, and gates merge behind a human
review + safety checklist.

Built for the CursorHack iOS app hackathon.

## Screens

1. **Issue intake** (`/intake`) - paste the raw bug report, tag reporter,
   severity, and affected area. A "Load sample" button prefills a demo report.
2. **Engineering brief** (`/brief`) - an AI-structured, fully editable brief
   (title, summary, repro steps, approach, acceptance criteria, likely files,
   risk level).
3. **Agent run status** (`/run`) - a live, mocked Cursor agent pipeline with an
   animated step timeline, elapsed timer, streamed console logs, and a proposed
   diff.
4. **Review + safety checklist** (`/review`) - change summary, a gated safety
   checklist, approve / request-changes, and a mock merge + PR link.

## Tech

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Zustand for cross-screen state

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

## AI brief generation

By default the brief is produced by a deterministic, offline template
synthesizer (`lib/synthesizeBrief.ts`) so the demo never blocks on the network.

To use a real model instead, set `OPENAI_API_KEY` (optionally `OPENAI_MODEL`,
default `gpt-4o-mini`). The `/api/brief` route calls OpenAI and automatically
falls back to the template brief on any error or timeout. Add the key in the
Cloud Agents dashboard Secrets tab, not in this repo.

## Notes

The agent run is intentionally mocked (`lib/mockAgent.ts`) to keep the demo fast
and self-contained, per the v1 goal of prioritising demo clarity over
completeness.
