import { ClaimTrust, GameEvent, Player } from '../../models/game';
import { RoleRegistry } from '../../roles/role-registry';
import { InfoPayload } from '../../rules/info-specs';
import { normalizeRoleId, possibleTrueRolesForBelief } from '../../rules/role-rules';
import { SolverInput } from '../solver';

/**
 * Converts a community logic puzzle, in the format used by
 * github.com/jthemphill/botc-solvers (MIT), into solver input.
 *
 * The puzzles come with their solutions, so they test the engine against
 * answers worked out by people. The conversion is deliberately lossy in one
 * direction only: information the app cannot record (a Juggler's guesses, a
 * Savant's statements, extra puzzle constraints) is dropped, which can only
 * leave more possibilities open. Whatever is kept means the same as in the
 * puzzle, so the solution must stay possible.
 *
 * Pure TypeScript: no Angular dependencies.
 */

export interface PuzzleDoc {
  title: string;
  players: string[];
  script: string[];
  timeline?: { timing: string; type: string; players: string[] }[];
  claims: PuzzleClaim[];
  /** false: characters may repeat (a house rule). */
  uniqueCharacters?: boolean;
  /** 'none': no standard character counts. */
  setup?: string;
}

export interface PuzzleClaim {
  type: string;
  name: string;
  timing?: string;
  possibleActualRoles?: string[];
  [key: string]: unknown;
}

export interface PuzzleSolutions {
  solutions: { roles: Record<string, string> }[];
}

export interface ConvertedPuzzle {
  input: SolverInput;
  /** Player ID → every starting character a solution gives them. */
  answer: Map<string, Set<string>>;
  /** Puzzle details the app has no way to record (dropped). */
  dropped: string[];
}

export class UnsupportedPuzzle extends Error {}

const DAY_DEATHS = new Set(['slayerShot', 'witchCurse', 'nominationDeath', 'doomsayerDeath', 'tinkerDeath']);

function roleId(name: string): string {
  const id = normalizeRoleId(name);
  if (!RoleRegistry.get(id)) throw new UnsupportedPuzzle(`unknown character "${name}"`);
  return id;
}

/** "night_2" → { night: 2, day: false }; "day_3" → { night: 3, day: true }. */
function parseTiming(timing: string | undefined, fallbackNight = 1): { night: number; day: boolean } {
  const m = timing ? /^(night|day)_(\d+)$/.exec(timing) : null;
  if (!m) return { night: fallbackNight, day: false };
  return { night: Number(m[2]), day: m[1] === 'day' };
}

/** When something happens, for putting the log in game order: night N, then day N. */
const order = (t: { night: number; day: boolean }, step: number) => t.night * 10 + (t.day ? 5 : 0) + step;

export function convertPuzzle(doc: PuzzleDoc, solutions: PuzzleSolutions): ConvertedPuzzle {
  if (doc.uniqueCharacters === false) throw new UnsupportedPuzzle('characters may repeat');
  if (doc.setup === 'none') throw new UnsupportedPuzzle('custom character counts');
  if (doc.players.length < 5 || doc.players.length > 15) throw new UnsupportedPuzzle(`${doc.players.length} players`);
  const ids = new Map(doc.players.map((name, i) => [name, `p${i + 1}`]));
  const id = (name: unknown): string => {
    const found = typeof name === 'string' ? ids.get(name) : undefined;
    if (!found) throw new UnsupportedPuzzle(`unknown player "${String(name)}"`);
    return found;
  };
  const characters = RoleRegistry.toScriptCharacters(doc.script.map(roleId));
  const players: Player[] = doc.players.map((name, i) => ({ id: `p${i + 1}`, gameId: 'puzzle', name, seat: i + 1, alive: true }));

  const timed: { at: number; seq: number; event: Omit<GameEvent, 'id'> }[] = [];
  let seq = 0;
  const add = (at: number, kind: string, night: number, extra: Partial<GameEvent>) =>
    timed.push({
      at,
      seq: seq++,
      event: { gameId: 'puzzle', night, phase: 'day', kind, payload: {}, trust: 'asserted' as ClaimTrust, createdAt: '', ...extra }
    });
  const dropped: string[] = [];

  // Deaths and executions. A Virgin's nominator dies by execution, which the
  // puzzles record as a death on nomination.
  const virginExecuted = new Set(
    doc.claims.filter(c => normalizeRoleId(c.type) === 'virgin' && c['executed'] === true).map(c => String(c['nominator']))
  );
  for (const e of doc.timeline ?? []) {
    const t = parseTiming(e.timing);
    for (const name of e.players) {
      if (e.type === 'nominationDeath' && virginExecuted.has(name)) {
        add(order(t, 3), 'execution', t.night, { payload: { playerId: id(name), gameEnded: false } });
      } else if (e.type === 'nightDeath') add(order(t, 0), 'death', t.night, { payload: { playerId: id(name) } });
      else if (e.type === 'execution') add(order(t, 3), 'execution', t.night, { payload: { playerId: id(name), gameEnded: false } });
      else if (DAY_DEATHS.has(e.type)) add(order(t, 2), 'death', t.night, { payload: { playerId: id(name) } });
      else dropped.push(`timeline ${e.type}`);
    }
  }

  // Claims: one per player, plus whatever info the app can record. A player
  // listed under several characters (a Philosopher reporting the ability they
  // gained) claims the Philosopher; otherwise their claim is left out.
  const typesBy = new Map<string, Set<string>>();
  for (const c of doc.claims) typesBy.set(c.name, (typesBy.get(c.name) ?? new Set()).add(roleId(c.type)));
  for (const [name, types] of typesBy) {
    const claim = types.size === 1 ? [...types][0] : types.has('philosopher') ? 'philosopher' : null;
    if (claim) add(0, 'claim', 1, { actorId: id(name), payload: { roleId: claim } });
    else dropped.push(`${name}'s claims (${[...types].join(', ')})`);
  }
  let self: SolverInput['self'] = null;
  for (const c of doc.claims) {
    const source = id(c.name);
    const type = roleId(c.type);
    if (c.name === 'You' && c.possibleActualRoles && !self) {
      const team = RoleRegistry.get(type)!.team;
      const possible = c.possibleActualRoles.map(roleId);
      const belief = possibleTrueRolesForBelief(type, team, new Set(doc.script.map(roleId)));
      if (possible.every(r => belief.includes(r))) self = { playerId: source, roleId: type, certain: possible.length === 1 };
    }
    for (const info of infoFor(c, type, id, dropped)) {
      const t = parseTiming(info.timing, info.night);
      add(order(t, 1), 'info', t.night, { actorId: source, payload: info.payload });
    }
  }

  timed.sort((a, b) => a.at - b.at || a.seq - b.seq);
  const events: GameEvent[] = timed.map((t, i) => ({ ...t.event, id: `e${i + 1}` }));

  const answer = new Map<string, Set<string>>(doc.players.map(name => [id(name), new Set<string>()]));
  for (const s of solutions.solutions) {
    for (const [name, role] of Object.entries(s.roles)) answer.get(id(name))!.add(roleId(role));
  }
  return { input: { characters, players, events, self, options: { assumeGoodPlayersHonest: true } }, answer, dropped };
}

interface PuzzleInfo {
  payload: InfoPayload;
  timing?: string;
  /** Night to use when there is no timing (first-night info, or the Nth of several checks). */
  night: number;
}

function infoFor(c: PuzzleClaim, type: string, id: (name: unknown) => string, dropped: string[]): PuzzleInfo[] {
  const one = (payload: InfoPayload): PuzzleInfo[] => [{ payload, timing: c.timing, night: 1 }];
  const players = (key: string) => (Array.isArray(c[key]) ? (c[key] as unknown[]).map(id) : null);
  const among = players('among');
  switch (type) {
    case 'washerwoman':
    case 'librarian':
    case 'investigator': {
      const shown = (c['role'] ?? c['minionRole']) as string | undefined;
      if (type === 'librarian' && among?.length === 0 && !shown) return one({ type, none: true });
      if (among?.length !== 2 || !shown) break;
      return one({ type, players: among, roleId: roleId(shown) });
    }
    case 'chef':
    case 'empath':
      if (typeof c['count'] !== 'number') break;
      return one({ type, count: c['count'] });
    case 'fortuneteller': {
      const checks = c['checks'] as { left: string; right: string; yes: boolean; timing?: string }[] | undefined;
      if (!checks) break;
      return checks.map((k, i) => ({ payload: { type, players: [id(k.left), id(k.right)], yes: k.yes }, timing: k.timing, night: i + 1 }));
    }
    case 'villageidiot': {
      const checks = c['checks'] as { player: string; good: boolean; timing?: string }[] | undefined;
      if (!checks) break;
      return checks.map((k, i) => ({ payload: { type, player: id(k.player), yes: !k.good }, timing: k.timing, night: i + 1 }));
    }
    case 'undertaker':
    case 'ravenkeeper':
      if (!c['player'] || !c['role']) break;
      return one({ type, player: id(c['player']), roleId: roleId(c['role'] as string) });
    case 'slayer':
      if (!c['target'] || typeof c['killed'] !== 'boolean') break;
      return one({ type, player: id(c['target']), yes: c['killed'] });
    case 'virgin':
      if (!c['nominator'] || typeof c['executed'] !== 'boolean') break;
      return one({ type, player: id(c['nominator']), yes: c['executed'] });
    case 'steward':
      if (!c['goodPlayer']) break;
      return one({ type, player: id(c['goodPlayer']) });
    case 'knight': {
      const p = players('noDemonAmong');
      if (p?.length !== 2) break;
      return one({ type, players: p });
    }
    case 'noble': {
      const p = players('oneEvilAmong');
      if (p?.length !== 3) break;
      return one({ type, players: p });
    }
    case 'sage': {
      const p = players('demonAmong');
      if (p?.length !== 2) break;
      return one({ type, players: p });
    }
    case 'seamstress':
      if (among?.length !== 2 || typeof c['aligned'] !== 'boolean') break;
      return one({ type, players: among, yes: c['aligned'] });
    case 'dreamer': {
      const roles = (c['roles'] as string[] | undefined)?.map(roleId);
      if (!c['player'] || roles?.length !== 2) break;
      const good = roles.find(r => ['townsfolk', 'outsider'].includes(RoleRegistry.get(r)!.team));
      const evil = roles.find(r => ['minion', 'demon'].includes(RoleRegistry.get(r)!.team));
      if (!good || !evil) break;
      return one({ type, player: id(c['player']), roleId: good, roleId2: evil });
    }
    case 'shugenja':
      if (c['evilDirection'] !== 'clockwise' && c['evilDirection'] !== 'anticlockwise') break;
      // Both count clockwise towards higher seat numbers.
      return one({ type, yes: c['evilDirection'] === 'clockwise' });
    case 'balloonist': {
      const pairs = c['differentCharacterTypePairs'] as [string, string][] | undefined;
      if (!pairs) break;
      return pairs.map((p, i) => ({ payload: { type, players: [id(p[0]), id(p[1])] }, timing: c.timing, night: i + 2 }));
    }
    default:
      if (Object.keys(c).some(k => !['type', 'name', 'timing', 'possibleActualRoles'].includes(k))) dropped.push(`${c.type} info`);
      return [];
  }
  dropped.push(`${c.type} info (unrecognised form)`);
  return [];
}
