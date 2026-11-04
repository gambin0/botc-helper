import { DeductionResult, GameEvent, Player, ScriptCharacter } from '../models/game';
import { InfoPayload } from '../rules/info-specs';
import { claimRole } from '../rules/events';
import { normalizeRoleId } from '../rules/role-rules';
import { RoleRegistry } from '../roles/role-registry';
import { DeductionEngine, SolverOptions } from './solver';

/**
 * Bluff stress-test: "if I claim X (and say Y), what can the table deduce?"
 *
 * Solves the game from the table's point of view (the logged evidence,
 * without your private character) before and after the hypothetical claim,
 * and reports what changed.
 *
 * Pure TypeScript: no Angular dependencies.
 */

export interface WhatIfInput {
  characters: readonly ScriptCharacter[];
  players: readonly Player[];
  events: readonly GameEvent[];
  selfPlayerId: string;
  /** Character you would claim. */
  claimRoleId: string;
  /** Information you would say you received, if any. */
  info?: InfoPayload | null;
  night: number;
  options?: SolverOptions;
}

export type WhatIfVerdict = 'contradiction' | 'exposed' | 'reveals' | 'quiet';

export interface PlayerChange {
  playerId: string;
  name: string;
  isSelf: boolean;
  changes: string[];
}

export interface WhatIfResult {
  verdict: WhatIfVerdict;
  headline: string;
  /** Contradictions the claim would create. */
  conflicts: string[];
  /** Other players who already claim the same character. */
  sameClaim: string[];
  /** What becomes provable about each player (you included). */
  changes: PlayerChange[];
  /** What the table could conclude about OTHER players if they believe your claim. */
  ifBelieved: PlayerChange[];
  /** True if a search limit was hit, so the comparison may be incomplete. */
  incomplete: boolean;
}

interface PlayerView {
  roles: Set<string>;
  canBeGood: boolean;
  canBeEvil: boolean;
}

function viewOf(result: DeductionResult, playerId: string): PlayerView {
  const roles = new Set(
    result.possibleRoles.filter(r => r.playerId === playerId && r.status !== 'impossible').map(r => r.roleId)
  );
  const a = result.alignments.find(x => x.playerId === playerId);
  return { roles, canBeGood: a?.canBeGood ?? false, canBeEvil: a?.canBeEvil ?? false };
}

function teamOf(roleId: string, characters: readonly ScriptCharacter[]): string | undefined {
  return RoleRegistry.get(roleId)?.team ?? characters.find(c => normalizeRoleId(c.id) === roleId)?.team;
}

function name(roleId: string, characters: readonly ScriptCharacter[]): string {
  return RoleRegistry.get(roleId)?.name ?? characters.find(c => normalizeRoleId(c.id) === roleId)?.name ?? roleId;
}

function describeChange(before: PlayerView, after: PlayerView, characters: readonly ScriptCharacter[]): string[] {
  const changes: string[] = [];
  if (after.roles.size === 0) return changes; // only happens when inconsistent; reported separately

  if (before.canBeGood && !after.canBeGood) changes.push('can now be proven evil');
  else if (before.canBeEvil && !after.canBeEvil) changes.push('can now be proven good');

  if (before.roles.size > 1 && after.roles.size === 1) {
    changes.push(`must be the ${name([...after.roles][0], characters)}`);
  } else {
    const isDemon = (r: string) => teamOf(r, characters) === 'demon';
    const demonBefore = [...before.roles].some(isDemon);
    const demonAfter = [...after.roles].some(isDemon);
    const onlyDemonAfter = [...after.roles].every(isDemon);
    if (demonBefore && !demonAfter) changes.push('is cleared of being the Demon');
    else if (onlyDemonAfter && ![...before.roles].every(isDemon)) changes.push('must be the Demon');
  }

  const ruledOut = [...before.roles].filter(r => !after.roles.has(r));
  if (ruledOut.length > 0 && changes.length === 0) {
    const names = ruledOut.map(r => name(r, characters));
    changes.push(
      ruledOut.length <= 3
        ? `can no longer be the ${names.join(', ')}`
        : `${ruledOut.length} fewer possible characters`
    );
  }
  return changes;
}

export function stressTestClaim(input: WhatIfInput): WhatIfResult {
  const claimRoleId = normalizeRoleId(input.claimRoleId);
  const base = { characters: input.characters, players: input.players, options: input.options, self: null };

  const claim = (trust: GameEvent['trust']): GameEvent => ({
    id: 'what-if-claim',
    gameId: '',
    night: input.night,
    phase: 'day',
    kind: 'claim',
    actorId: input.selfPlayerId,
    payload: { roleId: claimRoleId },
    trust,
    createdAt: ''
  });
  const infoEvents: GameEvent[] = [];
  if (input.info) {
    infoEvents.push({
      id: 'what-if-info',
      gameId: '',
      night: input.night,
      phase: input.night === 1 ? 'first-night' : 'other-night',
      kind: 'info',
      actorId: input.selfPlayerId,
      payload: input.info,
      trust: 'asserted',
      createdAt: ''
    });
  }

  const before = new DeductionEngine({ ...base, events: input.events }).solve();
  const after = new DeductionEngine({ ...base, events: [...input.events, claim('asserted'), ...infoEvents] }).solve();
  const believed = new DeductionEngine({ ...base, events: [...input.events, claim('confirmed'), ...infoEvents] }).solve();
  const names = new Map(input.players.map(p => [p.id, p.name]));

  const sameClaim = [
    ...new Set(
      input.events
        .filter(e => e.kind === 'claim' && e.trust !== 'false' && e.actorId && e.actorId !== input.selfPlayerId)
        .filter(e => claimRole(e) === claimRoleId)
        .map(e => names.get(e.actorId!) ?? 'Someone')
    )
  ];

  const seated = [...input.players].sort((a, b) => a.seat - b.seat);
  const diffAll = (target: DeductionResult, includeSelf: boolean): PlayerChange[] => {
    if (!target.consistent) return [];
    const out: PlayerChange[] = [];
    for (const p of seated) {
      const isSelf = p.id === input.selfPlayerId;
      if (isSelf && !includeSelf) continue;
      let diff = describeChange(viewOf(before, p.id), viewOf(target, p.id), input.characters);
      // Claiming narrows your own possibilities by definition; only report what matters.
      if (isSelf) diff = diff.filter(d => !d.startsWith('can no longer') && !d.includes('fewer possible'));
      if (diff.length > 0) out.push({ playerId: p.id, name: p.name, isSelf, changes: diff });
    }
    return out;
  };
  const changes = diffAll(after, true);
  const ifBelieved = diffAll(believed, false);
  // Narrowing your own possibilities is expected when you claim; it is not news.
  const othersChanged = changes.some(c => !c.isSelf);

  const conflicts = before.consistent && !after.consistent ? after.contradictions.map(c => c.description) : [];
  const self = viewOf(after, input.selfPlayerId);
  const claimName = name(claimRoleId, input.characters);

  let verdict: WhatIfVerdict;
  let headline: string;
  if (conflicts.length > 0) {
    verdict = 'contradiction';
    headline = `Claiming the ${claimName} would contradict the evidence: someone would be caught lying.`;
  } else if (before.consistent && !self.canBeGood) {
    verdict = 'exposed';
    headline = `The table could prove you are evil if you claim the ${claimName}.`;
  } else if (othersChanged) {
    verdict = 'reveals';
    headline = 'The claim fits, but it lets the table prove new things about other players.';
  } else {
    verdict = 'quiet';
    headline = ifBelieved.length > 0
      ? 'The claim fits the evidence. It proves nothing by itself, but see what follows if you are believed.'
      : 'The claim fits the evidence and reveals nothing new.';
  }

  return {
    verdict,
    headline,
    conflicts,
    sameClaim,
    changes,
    ifBelieved,
    incomplete: before.incomplete || after.incomplete || believed.incomplete
  };
}
