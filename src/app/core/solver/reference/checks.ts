import { DeductionResult } from '../../models/game';
import { getRoleRule, normalizeRoleId } from '../../rules/role-rules';
import { SolverInput, solve } from '../solver';
import { ReferenceResult, referenceSolve, worldFits } from './reference-solver';

/**
 * The two checks, shared by the Vitest suites and the fuzz command line.
 */

export interface PlayerDiff {
  playerId: string;
  /** Possible for the engine, impossible for the reference. */
  engineOnly: string[];
  /** Possible for the reference, impossible for the engine. */
  referenceOnly: string[];
}

export type DiffOutcome =
  | { status: 'agree'; consistent: boolean }
  | { status: 'skipped'; reason: string }
  | {
      status: 'disagree';
      kind: 'consistency' | 'roles';
      engineConsistent: boolean;
      referenceConsistent: boolean;
      players: PlayerDiff[];
    };

export function enginePossible(result: DeductionResult): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const r of result.possibleRoles) {
    if (!out.has(r.playerId)) out.set(r.playerId, new Set());
    if (r.status !== 'impossible') out.get(r.playerId)!.add(r.roleId);
  }
  return out;
}

function roleDiffs(input: SolverInput, engine: Map<string, Set<string>>, ref: Map<string, Set<string>>): PlayerDiff[] {
  const diffs: PlayerDiff[] = [];
  for (const p of input.players) {
    const e = engine.get(p.id) ?? new Set<string>();
    const r = ref.get(p.id) ?? new Set<string>();
    const engineOnly = [...e].filter(x => !r.has(x)).sort();
    const referenceOnly = [...r].filter(x => !e.has(x)).sort();
    if (engineOnly.length || referenceOnly.length) diffs.push({ playerId: p.id, engineOnly, referenceOnly });
  }
  return diffs;
}

/** Compares the engine with the reference on one game (design Decision 6). */
export function differentialCheck(input: SolverInput): DiffOutcome {
  const engine = solve(input);
  if (engine.incomplete) return { status: 'skipped', reason: 'engine search budget ran out' };
  if (input.players.length < 5) return { status: 'skipped', reason: 'fewer than 5 players' };
  const ref: ReferenceResult = referenceSolve(input);
  if (engine.consistent !== ref.consistent) {
    return {
      status: 'disagree',
      kind: 'consistency',
      engineConsistent: engine.consistent,
      referenceConsistent: ref.consistent,
      players: ref.consistent ? roleDiffs(input, enginePossible(engine), ref.possible) : []
    };
  }
  if (!ref.consistent) return { status: 'agree', consistent: false };
  const players = roleDiffs(input, enginePossible(engine), ref.possible);
  if (players.length > 0) {
    return { status: 'disagree', kind: 'roles', engineConsistent: true, referenceConsistent: true, players };
  }
  return { status: 'agree', consistent: true };
}

export type TruthOutcome =
  | { status: 'ok' }
  | { status: 'skipped'; reason: string }
  | { status: 'generator-bug'; reason: string }
  | { status: 'engine-wrong'; engineConsistent: boolean; ruledOut: { playerId: string; roleId: string }[] };

/** Checks the engine never rules out the true grimoire the evidence was generated from. */
export function truthCheck(input: SolverInput, truth: readonly string[]): TruthOutcome {
  if (!worldFits(input, truth)) return { status: 'generator-bug', reason: 'the true grimoire does not fit its own evidence' };
  const engine = solve(input);
  if (engine.incomplete) return { status: 'skipped', reason: 'engine search budget ran out' };
  const possible = enginePossible(engine);
  const seats = [...input.players].sort((a, b) => a.seat - b.seat);
  const ruledOut = seats
    .map((p, i) => ({ playerId: p.id, roleId: truth[i] }))
    .filter(x => !possible.get(x.playerId)?.has(x.roleId));
  if (!engine.consistent || ruledOut.length > 0) {
    return { status: 'engine-wrong', engineConsistent: engine.consistent, ruledOut };
  }
  return { status: 'ok' };
}

/**
 * Shrinks a failing game: drops self-knowledge, events and unused pool
 * roles one at a time while `stillFails` keeps returning true.
 */
export function minimize(input: SolverInput, stillFails: (candidate: SolverInput) => boolean): SolverInput {
  let current = input;
  const attempt = (candidate: SolverInput): boolean => {
    try {
      if (stillFails(candidate)) {
        current = candidate;
        return true;
      }
    } catch {
      // A candidate the reference cannot handle is simply not smaller.
    }
    return false;
  };

  let changed = true;
  while (changed) {
    changed = false;
    if (current.self) changed = attempt({ ...current, self: null }) || changed;
    for (let i = current.events.length - 1; i >= 0; i--) {
      changed = attempt({ ...current, events: current.events.filter((_, k) => k !== i) }) || changed;
    }
    for (let i = current.characters.length - 1; i >= 0; i--) {
      changed = attempt({ ...current, characters: current.characters.filter((_, k) => k !== i) }) || changed;
    }
    if (current.options) changed = attempt({ ...current, options: undefined }) || changed;
  }
  return current;
}

// --- Known-bug filter --------------------------------------------------------
//
// Each recorded engine bug gets a "workaround" transform: a change to the
// input that leaves the correct answer the same but avoids the engine's
// mistake. If a failure goes away under a bug's workaround, the failure is
// attributed to that bug. A failure that no workaround explains is new.

export type KnownBug = 'F-001' | 'F-002';

/** F-002 workaround: list roles that raise the Outsider count before roles that lower it. */
function outsiderRaisersFirst(input: SolverInput): SolverInput[] {
  // Order: always-raising (Baron, Fang Gu), then maybe-raising (Balloonist, Godfather),
  // then lowering (Hermit, Vigormortis). Sort by smallest change, then largest, both descending.
  const deltas = (id: string): [number, number] => {
    const setup = getRoleRule(normalizeRoleId(id)).setup;
    if (setup?.anyOutsiderCount) return [99, 99];
    const d = setup?.outsiderDelta ?? [0];
    return [Math.min(...d), Math.max(...d)];
  };
  const sorted = [...input.characters].sort((a, b) => {
    const [aMin, aMax] = deltas(a.id);
    const [bMin, bMax] = deltas(b.id);
    return bMin - aMin || bMax - aMax;
  });
  return sorted.every((c, i) => c === input.characters[i]) ? [] : [{ ...input, characters: sorted }];
}

/** F-001 workaround: for each Village Idiot, put its info first among the Village Idiot info events. */
function eachVillageIdiotFirst(input: SolverInput): SolverInput[] {
  const isVi = (e: SolverInput['events'][number]) =>
    e.kind === 'info' && normalizeRoleId((e.payload as { type?: string })?.type ?? '') === 'villageidiot';
  const slots = input.events.flatMap((e, i) => (isVi(e) ? [i] : []));
  const actors = [...new Set(slots.map(i => input.events[i].actorId))];
  if (actors.length < 2) return [];
  return actors.map(actor => {
    const vi = slots.map(i => input.events[i]);
    const reordered = [...vi.filter(e => e.actorId === actor), ...vi.filter(e => e.actorId !== actor)];
    const events = [...input.events];
    slots.forEach((slot, k) => (events[slot] = reordered[k]));
    return { ...input, events };
  });
}

const WORKAROUNDS: [KnownBug, (input: SolverInput) => SolverInput[]][] = [
  ['F-002', outsiderRaisersFirst],
  ['F-001', eachVillageIdiotFirst]
];

/**
 * Which recorded engine bug explains this failure, if any: the failure goes
 * away under that bug's workaround (or under both workarounds together).
 * `passes` re-runs the check on a variant and says whether it now passes.
 */
export function explainByKnownBug(input: SolverInput, passes: (variant: SolverInput) => boolean): string | null {
  const safe = (v: SolverInput) => {
    try {
      return passes(v);
    } catch {
      return false;
    }
  };
  for (const [bug, variants] of WORKAROUNDS) {
    if (variants(input).some(safe)) return bug;
  }
  for (const reordered of outsiderRaisersFirst(input)) {
    if (eachVillageIdiotFirst(reordered).some(safe)) return 'F-001+F-002';
  }
  return null;
}

/** Same kind of disagreement (used to keep a minimized case faithful to the original). */
export function sameDisagreement(a: DiffOutcome, b: DiffOutcome): boolean {
  if (a.status !== 'disagree' || b.status !== 'disagree') return false;
  return a.kind === b.kind && a.engineConsistent === b.engineConsistent;
}
