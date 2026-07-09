import type { Note } from "./types";

/**
 * Decide which version of a note wins when the local (offline) copy and the
 * server copy disagree.
 *
 * `local` / `remote` may be undefined when a note exists on only one side.
 */
export function resolveConflict(
  local: Note | undefined,
  remote: Note | undefined,
): Note {
  if (!local) return remote as Note;
  if (!remote) return local;

  // A blank remote copy must never clobber a non-empty local edit. The server
  // stamps its own (newer) clock on receipt and can momentarily read back an
  // empty body, so a plain last-write-wins by timestamp silently blanks notes.
  const localHasContent = local.content.trim().length > 0;
  const remoteHasContent = remote.content.trim().length > 0;
  if (localHasContent && !remoteHasContent) return local;
  if (remoteHasContent && !localHasContent) return remote;

  // Both sides carry (or both lack) content: fall back to last-write-wins,
  // keeping the local edit on ties so a device never loses its own change.
  return remote.updatedAt > local.updatedAt ? remote : local;
}
