import { ScriptCharacter } from '../models/game';
import { RoleRegistry } from '../roles/role-registry';
import { getRoleRule, normalizeRoleId } from './role-rules';

/**
 * Character counts by player count. These come from the player count alone;
 * a script only matters through setup-modifying characters (Baron, ...)
 * that might be in play.
 *
 * Pure TypeScript: no Angular dependencies.
 */

export interface Composition {
  townsfolk: number;
  outsiders: number;
  minions: number;
  demons: number;
}

/** [townsfolk, outsiders, minions, demons] for 5 to 15 players. */
const BASE: Record<number, readonly [number, number, number, number]> = {
  5: [3, 0, 1, 1],
  6: [3, 1, 1, 1],
  7: [5, 0, 1, 1],
  8: [5, 1, 1, 1],
  9: [5, 2, 1, 1],
  10: [7, 0, 2, 1],
  11: [7, 1, 2, 1],
  12: [7, 2, 2, 1],
  13: [9, 0, 3, 1],
  14: [9, 1, 3, 1],
  15: [9, 2, 3, 1]
};

export function baseComposition(playerCount: number): readonly [number, number, number, number] {
  return BASE[Math.max(5, Math.min(15, Math.round(playerCount) || 5))];
}

export function compositionFor(playerCount: number): Composition {
  const [townsfolk, outsiders, minions, demons] = baseComposition(playerCount);
  return { townsfolk, outsiders, minions, demons };
}

export interface SetupModifierSummary {
  roleId: string;
  name: string;
  /** e.g. "+2 Outsiders", "+1 or -1 Outsider", "+1 Minion". */
  effect: string;
}

function signed(n: number): string {
  return n >= 0 ? `+${n}` : `−${Math.abs(n)}`;
}

/** Characters in the pool that change the counts if they are in play. */
export function setupModifiers(characters: readonly ScriptCharacter[]): SetupModifierSummary[] {
  const result: SetupModifierSummary[] = [];
  for (const c of characters) {
    const id = normalizeRoleId(c.id);
    const setup = getRoleRule(id).setup;
    if (!setup) continue;
    const effects: string[] = [];
    if (setup.anyOutsiderCount) {
      effects.push('any number of Outsiders');
    } else if (setup.outsiderDelta) {
      const plural = setup.outsiderDelta.some(d => Math.abs(d) > 1);
      effects.push(`${setup.outsiderDelta.map(signed).join(' or ')} Outsider${plural ? 's' : ''}`);
    }
    if (setup.minionDelta) effects.push(`${signed(setup.minionDelta)} Minion${Math.abs(setup.minionDelta) === 1 ? '' : 's'}`);
    if (effects.length === 0) continue;
    result.push({ roleId: id, name: RoleRegistry.get(id)?.name ?? c.name, effect: effects.join(', ') });
  }
  return result;
}
