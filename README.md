# CursorHack
Cursor iOS app hackathon

## Development

- `npm install` — install dependencies
- `npm run lint` / `npm run typecheck` — TypeScript type check (no emit)
- `npm test` — run the Vitest suite

The Sync module (`src/sync`, `src/db`) reconciles notes added offline with the
server when connectivity returns.
