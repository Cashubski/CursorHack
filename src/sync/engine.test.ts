import { describe, it, expect } from "vitest";

import { OfflineCache } from "../db/offlineCache";
import { resolveConflict } from "./conflictResolver";
import { SyncEngine, type RemoteStore } from "./engine";
import type { Note } from "./types";

/**
 * Fake server that reproduces the real backend behaviour behind the bug:
 * when notes are pushed, the server stamps them with its own (newer) clock,
 * but a note's body can be momentarily blank on read-back (eventual
 * consistency / a not-yet-propagated write). A correct sync must never let
 * that transient blank overwrite the real offline edit.
 */
class BlankingRemote implements RemoteStore {
  private readonly blankNoteId: string;
  private readonly serverClock: number;
  private stored: Note[] = [];

  constructor(blankNoteId: string, serverClock: number) {
    this.blankNoteId = blankNoteId;
    this.serverClock = serverClock;
  }

  async push(notes: Note[]): Promise<void> {
    this.stored = notes.map((note) => ({
      ...note,
      // Server assigns its own, newer timestamp on receipt.
      updatedAt: this.serverClock,
      // One note's body has not propagated yet -> comes back blank.
      content: note.id === this.blankNoteId ? "" : note.content,
    }));
  }

  async pull(): Promise<Note[]> {
    return this.stored.map((note) => ({ ...note }));
  }
}

describe("SyncEngine — offline notes survive going back online", () => {
  it("does not blank a note when the server returns an empty, newer copy", async () => {
    // 1. Open the app with wifi off and add a couple of notes.
    const cache = new OfflineCache();
    cache.upsert({ id: "n1", content: "Buy milk", updatedAt: 1_000 });
    cache.upsert({ id: "n2", content: "Call the dentist", updatedAt: 1_000 });

    // 2. Turn wifi back on — the server echoes a newer, blank copy of n2.
    const remote = new BlankingRemote("n2", 5_000);
    const engine = new SyncEngine(cache, remote);

    // 3. Sync.
    const result = await engine.sync();

    // 4. Both notes must still be there with their content intact.
    const byId = new Map(result.map((note) => [note.id, note]));
    expect(byId.get("n1")?.content).toBe("Buy milk");
    expect(byId.get("n2")?.content).toBe("Call the dentist");
    expect(result).toHaveLength(2);
  });
});

describe("resolveConflict", () => {
  it("keeps the local edit when the remote copy is blank, even if newer", () => {
    const local: Note = { id: "n1", content: "Buy milk", updatedAt: 1_000 };
    const remote: Note = { id: "n1", content: "", updatedAt: 9_999 };

    expect(resolveConflict(local, remote).content).toBe("Buy milk");
  });

  it("takes the remote content when it is a genuine newer edit", () => {
    const local: Note = { id: "n1", content: "Buy milk", updatedAt: 1_000 };
    const remote: Note = { id: "n1", content: "Buy oat milk", updatedAt: 2_000 };

    expect(resolveConflict(local, remote)).toEqual(remote);
  });

  it("adopts a blank remote only when the local copy is also empty", () => {
    const local: Note = { id: "n1", content: "", updatedAt: 1_000 };
    const remote: Note = { id: "n1", content: "", updatedAt: 2_000 };

    expect(resolveConflict(local, remote)).toEqual(remote);
  });

  it("returns the side that exists when only one is present", () => {
    const note: Note = { id: "n1", content: "solo", updatedAt: 1_000 };
    expect(resolveConflict(note, undefined)).toEqual(note);
    expect(resolveConflict(undefined, note)).toEqual(note);
  });
});
