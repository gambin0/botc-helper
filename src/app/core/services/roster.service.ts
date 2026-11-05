import { Service, inject, signal } from '@angular/core';
import { DatabaseService } from '../storage/database.service';
import { forgetName, rememberName, seatingOf } from '../players/roster';

/**
 * The people you play with, kept on this device: names typed before (for
 * autocomplete) and the last game's seating (to start the next game with
 * the same players).
 */
@Service()
export class RosterService {
  private readonly db = inject(DatabaseService);

  /** Most recent first. */
  readonly knownNames = signal<string[]>(this.db.getKnownPlayerNames());
  readonly lastSeating = signal<(string | null)[]>(this.db.getLastSeating());

  /**
   * Remembers the names at a table. Called when a game ends rather than on
   * every edit, so half-typed names never end up in the list.
   */
  rememberAll(names: readonly string[]): void {
    this.knownNames.update(known => [...names].reverse().reduce((list, name) => rememberName(list, name), known));
    this.db.saveKnownPlayerNames(this.knownNames());
  }

  forget(name: string): void {
    this.knownNames.update(known => forgetName(known, name));
    this.db.saveKnownPlayerNames(this.knownNames());
  }

  /** Records the current seating, unless every seat still has its default name. */
  saveSeating(players: readonly { name: string; seat: number }[]): void {
    const seating = seatingOf(players);
    if (seating.every(name => name === null)) return;
    this.lastSeating.set(seating);
    this.db.saveLastSeating(seating);
  }
}
