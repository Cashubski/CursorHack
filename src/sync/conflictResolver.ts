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

  // Last-write-wins by timestamp.
  return remote.updatedAt >= local.updatedAt ? remote : local;
}
