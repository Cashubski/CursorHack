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

- Document how to run and test the app here as the project grows.
- Prefer commands the agent can run headlessly in the cloud VM (e.g. `npm test`, `npm run build`).
