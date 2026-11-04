import { DeductionResult, GameEvent, Player, ScriptCharacter } from '../models/game';
import { claimRole } from '../rules/events';
import { getRoleTips } from '../rules/role-tips';
import { normalizeRoleId } from '../rules/role-rules';

/**
 * Suggests good characters an evil player could claim, ranked by how likely
 * the bluff is to survive: whether someone else has claimed it, whether the
 * evidence allows anyone else to actually hold it, and whether the
 * Storyteller showed it as not in play.
 *
 * Pure TypeScript: no Angular dependencies.
 */

export type BluffRating = 'safe' | 'possible' | 'avoid';

export interface BluffSuggestion {
  roleId: string;
  name: string;
  team: 'townsfolk' | 'outsider';
  rating: BluffRating;
  reasons: string[];
  /** How risky the character is to play as a bluff, independent of this game. */
  playNote?: string;
  /** Number of other players who could genuinely hold this character. */
  holders: number;
}

export interface BluffInput {
  characters: readonly ScriptCharacter[];
  players: readonly Player[];
  events: readonly GameEvent[];
  deductions: DeductionResult;
  selfPlayerId: string;
  /** The three not-in-play characters a Demon is shown. */
  demonBluffs?: readonly string[];
}

const ORDER: Record<BluffRating, number> = { safe: 0, possible: 1, avoid: 2 };

export function suggestBluffs(input: BluffInput): BluffSuggestion[] {
  const names = new Map(input.players.map(p => [p.id, p.name]));
  const demonBluffs = new Set((input.demonBluffs ?? []).map(normalizeRoleId));

  // Who has claimed what (ignoring claims known to be false, and your own).
  const claimants = new Map<string, Set<string>>();
  for (const e of input.events) {
    if (e.kind !== 'claim' || e.trust === 'false' || !e.actorId || e.actorId === input.selfPlayerId) continue;
    const role = claimRole(e);
    if (!role) continue;
    if (!claimants.has(role)) claimants.set(role, new Set());
    claimants.get(role)!.add(e.actorId);
  }

  const suggestions: BluffSuggestion[] = [];
  for (const c of input.characters) {
    if (c.team !== 'townsfolk' && c.team !== 'outsider') continue;
    const roleId = normalizeRoleId(c.id);
    const others = input.deductions.possibleRoles.filter(
      r => r.roleId === roleId && r.playerId !== input.selfPlayerId && r.status !== 'impossible'
    );
    const confirmedHolder = others.find(r => r.status === 'confirmed');
    const claimedBy = [...(claimants.get(roleId) ?? [])];
    const reasons: string[] = [];
    let rating: BluffRating;

    if (confirmedHolder) {
      rating = 'avoid';
      reasons.push(`${names.get(confirmedHolder.playerId) ?? 'Someone'} is certainly the ${c.name}.`);
    } else if (claimedBy.length > 0) {
      rating = 'avoid';
      reasons.push(`Already claimed by ${claimedBy.map(id => names.get(id) ?? 'someone').join(', ')}.`);
    } else if (demonBluffs.has(roleId)) {
      rating = 'safe';
      reasons.push('The Storyteller showed you this as not in play.');
    } else if (others.length === 0) {
      rating = 'safe';
      reasons.push('Nobody else can be this character given the evidence.');
    } else {
      rating = 'possible';
      reasons.push(
        `Might be in play: ${others.length} other player${others.length === 1 ? '' : 's'} could hold it and contradict you.`
      );
    }

    const playNote = rating === 'avoid' ? undefined : getRoleTips(roleId, c.team).bluffNote;
    suggestions.push({ roleId, name: c.name, team: c.team, rating, reasons, playNote, holders: others.length });
  }

  return suggestions.sort(
    (a, b) => ORDER[a.rating] - ORDER[b.rating] || a.holders - b.holders || a.name.localeCompare(b.name)
  );
}
