/**
 * Shared types for the Sync module.
 */

export interface Note {
  /** Stable identifier, assigned on the device when the note is created. */
  id: string;
  /** The note body as typed by the user. */
  content: string;
  /**
   * Epoch milliseconds for the last edit.
   *
   * Note: the server assigns its own clock when it *receives* a note, so a
   * freshly-received server record can carry a newer `updatedAt` than the
   * offline edit it originated from.
   */
  updatedAt: number;
}
