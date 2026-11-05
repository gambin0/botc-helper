import { ClaimTrust, GameEvent, Player, ScriptCharacter } from '../../models/game';
import { RoleRegistry } from '../../roles/role-registry';
import { InfoPayload, allInfoSpecs } from '../../rules/info-specs';
import { baseComposition } from '../../rules/setup';
import type { SelfKnowledge, SolverInput } from '../solver';
import { legalRoleLists, worldFits } from './reference-solver';

/**
 * Seeded generators of small random games for checking the engine.
 * The same (seed, index, options) always produces the same game.
 */

export const TOWNSFOLK = [
  'washerwoman', 'librarian', 'investigator', 'chef', 'empath', 'fortuneteller', 'undertaker',
  'ravenkeeper', 'virgin', 'slayer', 'steward', 'noble', 'knight', 'seamstress', 'shugenja',
  'villageidiot', 'balloonist', 'grandmother', 'sage', 'dreamer', 'lycanthrope'
];
export const OUTSIDERS = ['drunk', 'recluse', 'saint', 'butler', 'mutant', 'hermit'];
export const MINIONS = ['poisoner', 'spy', 'scarletwoman', 'baron', 'godfather', 'widow', 'mastermind'];
export const DEMONS = ['imp', 'nodashii', 'vortox', 'fanggu', 'vigormortis'];

/**
 * Pool profiles bias which roles appear, so a campaign can focus on one area.
 * `forced` roles are always added (when they fit); `weights` multiply the odds of a role being picked.
 */
export const PROFILES = {
  mixed: { forced: [], weights: {} },
  tb: { forced: [], weights: {}, only: [
    'washerwoman', 'librarian', 'investigator', 'chef', 'empath', 'fortuneteller', 'undertaker',
    'ravenkeeper', 'virgin', 'slayer', 'drunk', 'recluse', 'saint', 'butler',
    'poisoner', 'spy', 'scarletwoman', 'baron', 'imp'
  ] },
  misregistration: { forced: ['spy', 'recluse'], weights: { spy: 4, recluse: 4 } },
  corruption: { forced: ['poisoner'], weights: { poisoner: 4, widow: 3, nodashii: 3, drunk: 3 } },
  vortox: { forced: ['vortox'], weights: {} },
  lilmonsta: { forced: ['lilmonsta'], weights: {} },
  villageidiot: { forced: ['villageidiot'], weights: { poisoner: 3 } },
  fibbin: { forced: ['fibbin'], weights: {} },
  lycanthrope: { forced: ['lycanthrope'], weights: {} },
  setup: { forced: [], weights: { baron: 5, godfather: 5, balloonist: 4, fanggu: 4, vigormortis: 4, hermit: 4 } },
  executions: { forced: ['scarletwoman', 'saint'], weights: { mastermind: 4 } },
  // Star-passes and the Scarlet Woman: Trouble Brewing with many deaths and Demon-related info.
  demonmoves: {
    forced: ['imp', 'scarletwoman'],
    weights: { slayer: 4, fortuneteller: 4, undertaker: 3, ravenkeeper: 3, poisoner: 2 },
    only: [
      'washerwoman', 'librarian', 'investigator', 'chef', 'empath', 'fortuneteller', 'undertaker',
      'ravenkeeper', 'virgin', 'slayer', 'drunk', 'recluse', 'saint', 'butler',
      'poisoner', 'spy', 'scarletwoman', 'baron', 'imp'
    ],
    deathRate: 0.35
  },
  // The Fang Gu jumping to an Outsider, with Outsider- and Demon-related info.
  fanggu: {
    forced: ['fanggu', 'scarletwoman'],
    weights: { recluse: 3, drunk: 3, saint: 3, librarian: 4, fortuneteller: 4, undertaker: 3, slayer: 3, dreamer: 3 },
    deathRate: 0.35
  }
} satisfies Record<string, { forced: string[]; weights: Record<string, number>; only?: string[]; deathRate?: number }>;

export type ProfileName = keyof typeof PROFILES;

export interface GeneratorOptions {
  minPlayers?: number;
  maxPlayers?: number;
  profile?: ProfileName;
  /** Maximum events per game (default 8). */
  maxEvents?: number;
}

/** Small deterministic PRNG (mulberry32). */
export class Rng {
  private a: number;
  constructor(seed: number, index: number) {
    this.a = (Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(index + 1, 0xc2b2ae35)) >>> 0;
    for (let i = 0; i < 4; i++) this.next();
  }
  next(): number {
    this.a = (this.a + 0x6d2b79f5) >>> 0;
    let t = this.a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }
  chance(p: number): boolean {
    return this.next() < p;
  }
  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)];
  }
  shuffle<T>(items: readonly T[]): T[] {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
  /** Picks `count` distinct items, favouring higher weights. */
  weightedSample(items: readonly string[], count: number, weights: Record<string, number>): string[] {
    const left = [...items];
    const out: string[] = [];
    while (out.length < count && left.length > 0) {
      const total = left.reduce((s, id) => s + (weights[id] ?? 1), 0);
      let x = this.next() * total;
      let k = 0;
      for (; k < left.length - 1; k++) {
        x -= weights[left[k]] ?? 1;
        if (x < 0) break;
      }
      out.push(left.splice(k, 1)[0]);
    }
    return out;
  }
}

export function makePlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    gameId: 'g',
    name: `P${i + 1}`,
    seat: i + 1,
    alive: true
  }));
}

const MAX_SEATED_POOL = 10;

/** A role pool with at least the base count of each team for `n` players, plus extras. */
export function generatePool(rng: Rng, n: number, profileName: ProfileName = 'mixed'): ScriptCharacter[] {
  const profile: { forced: string[]; weights: Record<string, number>; only?: string[] } = PROFILES[profileName];
  const allowed = (ids: string[]) => (profile.only ? ids.filter(id => profile.only!.includes(id)) : ids);
  const [T, O, M] = baseComposition(n);
  const teams: [string[], number][] = [
    [allowed(TOWNSFOLK), T],
    [allowed(OUTSIDERS), O],
    [allowed(MINIONS), M],
    [allowed(DEMONS), 1]
  ];

  const pool = new Set<string>();
  const forcedSeated = profile.forced.filter(id => id !== 'fibbin' && id !== 'lilmonsta');
  for (const id of forcedSeated) pool.add(id);
  for (const [ids, base] of teams) {
    const have = ids.filter(id => pool.has(id)).length;
    for (const id of rng.weightedSample(ids.filter(id => !pool.has(id)), Math.max(0, base - have), profile.weights)) {
      pool.add(id);
    }
  }
  const extras = rng.int(1, 3);
  const everyone = teams.flatMap(([ids]) => ids).filter(id => !pool.has(id));
  for (const id of rng.weightedSample(everyone, extras, profile.weights)) {
    if (pool.size < MAX_SEATED_POOL) pool.add(id);
  }

  // Shuffled, so bugs that depend on the order of the pool can show up.
  const ids = rng.shuffle([...pool]);
  const extrasAllowed = !profile.only;
  if (profile.forced.includes('lilmonsta') || (extrasAllowed && rng.chance(0.1))) ids.push('lilmonsta');
  if (profile.forced.includes('fibbin') || (extrasAllowed && rng.chance(0.1))) ids.push('fibbin');
  return RoleRegistry.toScriptCharacters(ids);
}

let eventSeq = 0;
function makeEvent(kind: string, night: number, extra: Partial<GameEvent>): GameEvent {
  return {
    id: `e${++eventSeq}`,
    gameId: 'g',
    night,
    phase: 'day',
    kind,
    payload: {},
    trust: 'asserted',
    createdAt: '',
    ...extra
  };
}

/** A random info payload for `type`, built from that ability's form fields. */
export function randomPayload(rng: Rng, type: string, playerIds: readonly string[], poolIds: readonly string[]): InfoPayload | null {
  const spec = allInfoSpecs().find(s => s.roleId === type);
  if (!spec) return null;
  const payload: InfoPayload = { type };
  if (spec.noneOption && rng.chance(0.15)) return { type, none: true };
  for (const field of spec.fields) {
    switch (field.kind) {
      case 'players':
        payload.players = rng.shuffle(playerIds).slice(0, field.count);
        break;
      case 'player':
        payload.player = rng.pick(playerIds);
        break;
      case 'role': {
        const choices = poolIds.filter(id => !field.teams || field.teams.includes(RoleRegistry.get(id)!.team));
        if (choices.length === 0) return null;
        payload[field.key] = rng.pick(choices);
        break;
      }
      case 'number':
        payload.count = rng.int(field.min, Math.min(field.max, playerIds.length));
        break;
      case 'boolean':
        payload.yes = rng.chance(0.5);
        break;
    }
  }
  return payload;
}

/** How often a profile asks for deaths and executions (undefined: the default mix). */
function deathRate(profile: ProfileName | undefined): number | undefined {
  const p = PROFILES[profile ?? 'mixed'];
  return 'deathRate' in p ? p.deathRate : undefined;
}

/** One random event, given who is alive. Returns null if nothing sensible could be made. */
function randomEvent(
  rng: Rng,
  night: number,
  players: readonly string[],
  alive: Set<string>,
  poolIds: string[],
  deaths?: number
): GameEvent | null {
  // With a death rate, pick deaths at that rate and otherwise a claim or info in the usual proportion.
  const roll = deaths === undefined ? rng.next() : rng.chance(deaths) ? 0.8 + 0.2 * rng.next() : 0.8 * rng.next();
  const seatedPool = poolIds.filter(id => id !== 'fibbin' && id !== 'lilmonsta');
  if (roll < 0.35) {
    const trust: ClaimTrust = rng.pick(['asserted', 'asserted', 'asserted', 'asserted', 'asserted', 'asserted', 'asserted', 'confirmed', 'doubted', 'false']);
    const roleId = rng.chance(0.85) ? rng.pick(seatedPool) : rng.pick([...TOWNSFOLK, ...OUTSIDERS]);
    return makeEvent('claim', night, { actorId: rng.pick(players), payload: { roleId }, trust });
  }
  if (roll < 0.8) {
    const infoRoles = allInfoSpecs().map(s => s.roleId);
    const preferred = infoRoles.filter(id => poolIds.includes(id));
    const type = preferred.length > 0 && rng.chance(0.8) ? rng.pick(preferred) : rng.pick(infoRoles);
    const payload = randomPayload(rng, type, players, seatedPool);
    if (!payload) return null;
    return makeEvent('info', night, { actorId: rng.pick(players), payload });
  }
  const living = players.filter(id => alive.has(id));
  if (living.length === 0) return null;
  const target = rng.pick(living);
  if (roll < 0.9) return makeEvent('death', night, { payload: { playerId: target } });
  return makeEvent('execution', night, { payload: { playerId: target, gameEnded: rng.chance(0.15) } });
}

function applyAlive(alive: Set<string>, event: GameEvent): void {
  if (event.kind !== 'death' && event.kind !== 'execution') return;
  alive.delete((event.payload as { playerId: string }).playerId);
}

/** A random game (used by the differential check). Often inconsistent; that is fine. */
export function generateGame(seed: number, index: number, options: GeneratorOptions = {}): SolverInput {
  const rng = new Rng(seed, index);
  eventSeq = 0;
  const n = rng.int(options.minPlayers ?? 5, options.maxPlayers ?? 7);
  const players = makePlayers(n);
  const ids = players.map(p => p.id);
  const characters = generatePool(rng, n, options.profile);
  const poolIds = characters.map(c => c.id);

  let self: SelfKnowledge | null = null;
  if (rng.chance(0.6)) {
    const seated = poolIds.filter(id => id !== 'fibbin' && id !== 'lilmonsta');
    self = { playerId: rng.pick(ids), roleId: rng.pick(seated), certain: rng.chance(0.5) };
  }

  const events: GameEvent[] = [];
  const alive = new Set(ids);
  const count = rng.int(0, options.maxEvents ?? 8);
  let night = 1;
  for (let k = 0; k < count; k++) {
    if (rng.chance(0.3)) night = Math.min(3, night + 1);
    const event = randomEvent(rng, night, ids, alive, poolIds, deathRate(options.profile));
    if (!event) continue;
    applyAlive(alive, event);
    events.push(event);
  }

  return {
    characters,
    players,
    events,
    self,
    options: rng.chance(0.3) ? { assumeGoodPlayersHonest: false } : undefined
  };
}

export interface TrueGame {
  input: SolverInput;
  /** The real starting role of each seat, in seat order. */
  truth: string[];
}

/**
 * A game generated from a known true grimoire (used by the generated-truth
 * check). Each candidate event is kept only if the true grimoire still fits
 * the evidence, so the evidence is always something the rules allow.
 */
export function generateTrueGame(seed: number, index: number, options: GeneratorOptions = {}): TrueGame | null {
  const rng = new Rng(seed, index);
  eventSeq = 0;
  const n = rng.int(options.minPlayers ?? 5, options.maxPlayers ?? 7);
  const players = makePlayers(n);
  const ids = players.map(p => p.id);
  const characters = generatePool(rng, n, options.profile);
  const poolIds = characters.map(c => c.id);
  const honest = rng.chance(0.7);

  const base: SolverInput = {
    characters,
    players,
    events: [],
    self: null,
    options: honest ? undefined : { assumeGoodPlayersHonest: false }
  };
  const lists = legalRoleLists(base);
  if (lists.length === 0) return null;
  const truth = rng.shuffle(rng.pick(lists));

  // The Drunk believes it is some Townsfolk that is not in play.
  const notInPlay = poolIds.filter(id => RoleRegistry.get(id)?.team === 'townsfolk' && !truth.includes(id));
  const drunkBelief = notInPlay.length > 0 ? rng.pick(notInPlay) : null;

  let self: SelfKnowledge | null = null;
  if (rng.chance(0.6)) {
    const seat = rng.int(0, n - 1);
    const role = truth[seat];
    if (role === 'drunk') {
      if (drunkBelief) self = { playerId: ids[seat], roleId: drunkBelief, certain: false };
    } else {
      self = { playerId: ids[seat], roleId: role, certain: rng.chance(0.5) };
    }
  }

  const input: SolverInput = { ...base, self };
  const events: GameEvent[] = [];
  const alive = new Set(ids);
  const target = rng.int(2, options.maxEvents ?? 8);
  let night = 1;
  for (let attempt = 0; attempt < target * 6 && events.length < target; attempt++) {
    if (rng.chance(0.25)) night = Math.min(3, night + 1);
    const event = trueEvent(rng, night, ids, alive, poolIds, truth, drunkBelief, deathRate(options.profile));
    if (!event) continue;
    const next = { ...input, events: [...events, event] };
    if (!worldFits(next, truth)) continue;
    applyAlive(alive, event);
    events.push(event);
  }
  return { input: { ...input, events }, truth };
}

/** A candidate event biased towards what real players would report from `truth`. */
function trueEvent(
  rng: Rng,
  night: number,
  ids: readonly string[],
  alive: Set<string>,
  poolIds: string[],
  truth: readonly string[],
  drunkBelief: string | null,
  deaths?: number
): GameEvent | null {
  const seatedPool = poolIds.filter(id => id !== 'fibbin' && id !== 'lilmonsta');
  const roll = deaths === undefined ? rng.next() : rng.chance(deaths) ? 0.85 + 0.15 * rng.next() : 0.85 * rng.next();
  const seat = rng.int(0, ids.length - 1);
  const role = truth[seat];
  const team = RoleRegistry.get(role)!.team;
  const evil = team === 'minion' || team === 'demon';

  if (roll < 0.35) {
    // Claims: good players tell the truth, the Drunk claims its belief, evil players bluff a good role.
    let claimed: string;
    if (role === 'drunk') {
      if (!drunkBelief) return null;
      claimed = drunkBelief;
    } else if (evil) {
      const good = seatedPool.filter(id => ['townsfolk', 'outsider'].includes(RoleRegistry.get(id)!.team));
      claimed = rng.pick(good);
    } else {
      claimed = role;
    }
    const trust: ClaimTrust = rng.chance(0.1) && !evil && role !== 'drunk' ? 'confirmed' : 'asserted';
    return makeEvent('claim', night, { actorId: ids[seat], payload: { roleId: claimed }, trust });
  }
  if (roll < 0.85) {
    // Info: usually from a player who really has an info ability; sometimes a bluff.
    const infoSeats = ids.filter((_, i) => allInfoSpecs().some(s => s.roleId === truth[i]));
    const actor = infoSeats.length > 0 && rng.chance(0.8) ? rng.pick(infoSeats) : ids[seat];
    const actorRole = truth[ids.indexOf(actor)];
    const type = allInfoSpecs().some(s => s.roleId === actorRole) ? actorRole : rng.pick(allInfoSpecs()).roleId;
    const payload = randomPayload(rng, type, ids, seatedPool);
    if (!payload) return null;
    return makeEvent('info', night, { actorId: actor, payload });
  }
  const living = ids.filter(id => alive.has(id));
  if (living.length <= 3) return null;
  const victim = rng.pick(living);
  if (roll < 0.95) return makeEvent('death', night, { payload: { playerId: victim } });
  return makeEvent('execution', night, { payload: { playerId: victim, gameEnded: false } });
}
