import type { OfflineCache } from "../db/offlineCache";
import type { Note } from "./types";
import { resolveConflict } from "./conflictResolver";

/**
 * The remote (server) side of sync. In production this is a network client;
 * tests provide a fake implementation.
 */
export interface RemoteStore {
  /** Send local notes to the server. */
  push(notes: Note[]): Promise<void>;
  /** Fetch the server's current view of all notes. */
  pull(): Promise<Note[]>;
}

/**
 * Reconciles the offline cache with the server.
 *
 * The flow the users hit: notes are added while offline, then wifi is
 * restored and `sync()` runs — pushing local notes, pulling the server view,
 * and merging the two by id through the conflict resolver.
 */
export class SyncEngine {
  constructor(
    private readonly cache: OfflineCache,
    private readonly remote: RemoteStore,
  ) {}

  async sync(): Promise<Note[]> {
    const localNotes = this.cache.getAll();

    await this.remote.push(localNotes);
    const remoteNotes = await this.remote.pull();
    const remoteById = new Map(remoteNotes.map((note) => [note.id, note]));

    const ids = new Set<string>([
      ...localNotes.map((note) => note.id),
      ...remoteById.keys(),
    ]);

    const merged: Note[] = [];
    for (const id of ids) {
      merged.push(resolveConflict(this.cache.get(id), remoteById.get(id)));
    }

    this.cache.replaceAll(merged);
    return this.cache.getAll();
  }
}
