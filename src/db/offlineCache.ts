import type { Note } from "../sync/types";

/**
 * In-memory store for notes held on the device.
 *
 * While the device is offline, edits are written here and later reconciled
 * with the server by the SyncEngine. Callers always receive copies so the
 * cache cannot be mutated from the outside.
 */
export class OfflineCache {
  private notes = new Map<string, Note>();

  upsert(note: Note): void {
    this.notes.set(note.id, { ...note });
  }

  get(id: string): Note | undefined {
    const note = this.notes.get(id);
    return note ? { ...note } : undefined;
  }

  getAll(): Note[] {
    return [...this.notes.values()].map((note) => ({ ...note }));
  }

  /** Replace the entire cache contents (used to persist a completed sync). */
  replaceAll(notes: Note[]): void {
    this.notes = new Map(notes.map((note) => [note.id, { ...note }]));
  }

  clear(): void {
    this.notes.clear();
  }
}
