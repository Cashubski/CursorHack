# CursorHack

Cursor iOS app hackathon project.

## Cursor Cloud specific instructions

This repo is configured for [Cursor Cloud Agents](https://cursor.com/docs/cloud-agent). Use the Cursor iOS app, [cursor.com/agents](https://cursor.com/agents), or the Cloud option in the desktop agent dropdown to work on this repo without a local machine.

### Setup

1. Connect GitHub in the [Cloud Agents dashboard](https://cursor.com/dashboard?tab=cloud-agents).
2. Select `Cashubski/CursorHack` when starting a cloud agent.
3. Add any API keys or secrets in the dashboard Secrets tab (not in this repo).

### Development

- Run `npm install` after adding a `package.json`, or `pip install -r requirements.txt` after adding Python deps.
- The cloud `install` command in `.cursor/environment.json` runs automatically on each agent startup.
- Commit changes to a branch; cloud agents push branches for handoff.

### Testing

- Install deps: `npm install`.
- Headless build check (runs type-checking + lint): `npm run build`.
- Run locally: `npm run dev` then open `http://localhost:3000` (dashboard).
- Serve the production build: `npm run start`.
- Manual demo flow: dashboard -> New report -> generate brief -> dispatch to
  agent -> watch the mocked run complete -> approve the safety checklist ->
  merge -> return to dashboard and confirm the task appears with its status.
- Storage: works with zero config via browser `localStorage`. To use Supabase,
  run `supabase/schema.sql` and set `NEXT_PUBLIC_SUPABASE_URL` +
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.example`).
- Optional real AI brief: set `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`)
  as a secret; `/api/brief` falls back to the offline template brief if unset or
  on error.
- Prefer commands the agent can run headlessly in the cloud VM (e.g. `npm run build`).
