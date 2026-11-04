import { Player, ScriptCharacter } from '../models/game';
import { DeductionEngine } from './solver';

/**
 * Checks whether a role pool can produce a legal starting setup for a
 * player count, before any evidence. Pure TypeScript.
 */
export interface PoolCheck {
  /** A legal setup exists. */
  valid: boolean;
  /** The search budget ran out, so validity is unproven. */
  unknown: boolean;
  warnings: string[];
}

export function checkPool(characters: readonly ScriptCharacter[], playerCount: number): PoolCheck {
  const players: Player[] = Array.from({ length: playerCount }, (_, i) => ({
    id: `seat${i + 1}`, gameId: 'check', name: `Seat ${i + 1}`, seat: i + 1, alive: true
  }));
  const result = new DeductionEngine({ characters, players, events: [] }).solve();
  return {
    valid: result.consistent,
    unknown: result.incomplete,
    // Approximation notes are about deduction quality, not whether the pool works.
    warnings: result.warnings.filter(w => w.startsWith('The role pool'))
  };
}
