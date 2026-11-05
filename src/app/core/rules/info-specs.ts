import { Team } from '../models/game';
import { Alignment } from './role-rules';

/**
 * Information abilities, keyed by the role whose ability produced them.
 *
 * Each spec declares the fields needed to record the info (so the UI can
 * build a form generically) and a `check` that says whether the info is
 * TRUE in a given world. The solver decides separately whether the info had
 * to be true (sober, genuine ability holder) or may be false.
 *
 * Pure TypeScript: no Angular dependencies.
 */

export type InfoField =
  | { key: 'players'; kind: 'players'; count: number; label: string }
  | { key: 'player'; kind: 'player'; label: string }
  | { key: 'roleId' | 'roleId2'; kind: 'role'; label: string; teams?: readonly Team[] }
  | { key: 'count'; kind: 'number'; label: string; min: number; max: number }
  | { key: 'yes'; kind: 'boolean'; label: string; trueLabel: string; falseLabel: string };

export interface InfoPayload {
  type: string;
  players?: string[];
  player?: string;
  roleId?: string;
  roleId2?: string;
  count?: number;
  yes?: boolean;
  /** Librarian: "zero Outsiders are in play". */
  none?: boolean;
}

/** A world as seen by an ability: every player has one definite registration. */
export interface InfoView {
  /** Player IDs in seat order. */
  readonly seats: readonly string[];
  /** Whether the player was alive when this info was received. */
  isAlive(playerId: string): boolean;
  alignment(playerId: string): Alignment;
  team(playerId: string): Team;
  registersAsRole(playerId: string, roleId: string): boolean;
  /** Fortune Teller red herring. */
  isRedHerring(playerId: string): boolean;
}

/** A partially assigned world: each player has a set of possible alignments. */
export interface PartialInfoView {
  readonly seats: readonly string[];
  alignmentOptions(playerId: string): ReadonlySet<Alignment>;
}

export interface InfoSpec {
  roleId: string;
  /** Short prompt for the entry form. */
  prompt: string;
  fields: readonly InfoField[];
  /**
   * Players whose registration matters, or 'all' when the info depends on
   * the whole circle (evaluated once every seat is assigned).
   */
  involved(payload: InfoPayload, sourceId: string, view: Pick<InfoView, 'seats' | 'isAlive'>): string[] | 'all';
  check(payload: InfoPayload, sourceId: string, view: InfoView): boolean;
  /** Optional bounds for 'all' checks so the search can prune early. */
  countRange?(payload: InfoPayload, view: PartialInfoView): [number, number];
  /**
   * True when the outcome was publicly observable (a Slayer kill, a Virgin
   * execution), so it cannot be a lie or the result of poisoning.
   */
  publicWhen?(payload: InfoPayload): boolean;
  /** Label for an alternative "nothing to show" result (Librarian: no Outsiders). */
  noneOption?: string;
  /**
   * The Undertaker: the info is about the player executed the day before, so a
   * genuine Undertaker (even a drunk one) can only name that player. See
   * `namesYesterdaysExecution` in rules/events.ts.
   */
  aboutExecution?: boolean;
  /**
   * The Ravenkeeper and Sage: the info comes when the source dies at night,
   * so a genuine one (even a drunk one) has a death logged that night. See
   * `diedThatNight` in rules/events.ts.
   */
  afterOwnDeath?: boolean;
  describe(payload: InfoPayload, name: (playerId?: string) => string, role: (roleId?: string) => string): string;
}

const players2: InfoField = { key: 'players', kind: 'players', count: 2, label: 'Players shown' };

function pair(p: InfoPayload): [string, string] | null {
  return p.players && p.players.length === 2 ? [p.players[0], p.players[1]] : null;
}

function aliveNeighbours(seats: readonly string[], isAlive: (id: string) => boolean, id: string): string[] {
  const n = seats.length;
  const idx = seats.indexOf(id);
  if (idx < 0 || n < 2) return [];
  const found: string[] = [];
  for (const dir of [1, -1]) {
    for (let step = 1; step < n; step++) {
      const candidate = seats[(((idx + dir * step) % n) + n) % n];
      if (isAlive(candidate)) {
        if (!found.includes(candidate)) found.push(candidate);
        break;
      }
    }
  }
  return found;
}

const oneOfTwo = (roleId: string, team: Team, teamLabel: string, noneOption?: string): InfoSpec => ({
  roleId,
  noneOption,
  prompt: `You start knowing that 1 of 2 players is a particular ${teamLabel}.`,
  fields: [players2, { key: 'roleId', kind: 'role', label: `${teamLabel} shown`, teams: [team] }],
  involved: p => (p.none ? 'all' : (p.players ?? [])),
  check: (p, _src, v) => {
    if (p.none) return v.seats.every(id => v.team(id) !== team);
    const ids = pair(p);
    return !!ids && !!p.roleId && ids.some(id => v.registersAsRole(id, p.roleId!));
  },
  describe: (p, name, role) =>
    p.none
      ? `learnt that no ${teamLabel}s are in play`
      : `learnt ${name(p.players?.[0])} or ${name(p.players?.[1])} is the ${role(p.roleId)}`
});

const roleOfPlayer = (roleId: string, prompt: string, teams?: readonly Team[]): InfoSpec => ({
  roleId,
  prompt,
  fields: [
    { key: 'player', kind: 'player', label: 'Player' },
    { key: 'roleId', kind: 'role', label: 'Character shown', teams }
  ],
  involved: p => (p.player ? [p.player] : []),
  check: (p, _src, v) => !!p.player && !!p.roleId && v.registersAsRole(p.player, p.roleId),
  describe: (p, name, role) => `learnt ${name(p.player)} is the ${role(p.roleId)}`
});

const SPECS: InfoSpec[] = [
  oneOfTwo('washerwoman', 'townsfolk', 'Townsfolk'),
  oneOfTwo('librarian', 'outsider', 'Outsider', 'Zero Outsiders are in play'),
  oneOfTwo('investigator', 'minion', 'Minion'),
  {
    roleId: 'chef',
    prompt: 'You start knowing how many pairs of evil players there are.',
    fields: [{ key: 'count', kind: 'number', label: 'Evil pairs', min: 0, max: 7 }],
    involved: () => 'all',
    check: (p, _src, v) => {
      const s = v.seats;
      let pairs = 0;
      for (let i = 0; i < s.length; i++) {
        if (v.alignment(s[i]) === 'evil' && v.alignment(s[(i + 1) % s.length]) === 'evil') pairs++;
      }
      return pairs === p.count;
    },
    countRange: (_p, v) => {
      const s = v.seats;
      let min = 0;
      let max = 0;
      for (let i = 0; i < s.length; i++) {
        const a = v.alignmentOptions(s[i]);
        const b = v.alignmentOptions(s[(i + 1) % s.length]);
        if (a.has('evil') && b.has('evil')) {
          max++;
          if (a.size === 1 && b.size === 1) min++;
        }
      }
      return [min, max];
    },
    describe: p => `learnt there ${p.count === 1 ? 'is 1 pair' : `are ${p.count} pairs`} of evil players`
  },
  {
    roleId: 'empath',
    prompt: 'You learn how many of your 2 alive neighbours are evil.',
    fields: [{ key: 'count', kind: 'number', label: 'Evil neighbours', min: 0, max: 2 }],
    involved: (_p, src, v) => aliveNeighbours(v.seats, v.isAlive, src),
    check: (p, src, v) =>
      aliveNeighbours(v.seats, v.isAlive, src).filter(id => v.alignment(id) === 'evil').length === p.count,
    describe: p => `learnt ${p.count} alive neighbour${p.count === 1 ? ' is' : 's are'} evil`
  },
  {
    roleId: 'fortuneteller',
    prompt: 'You choose 2 players and learn if either is the Demon.',
    fields: [players2, { key: 'yes', kind: 'boolean', label: 'Result', trueLabel: 'Yes', falseLabel: 'No' }],
    involved: p => p.players ?? [],
    check: (p, _src, v) => {
      const ids = pair(p);
      if (!ids) return false;
      const sawDemon = ids.some(id => v.team(id) === 'demon' || v.isRedHerring(id));
      return sawDemon === !!p.yes;
    },
    describe: (p, name) =>
      `chose ${name(p.players?.[0])} and ${name(p.players?.[1])}: ${p.yes ? 'YES' : 'no'}`
  },
  { ...roleOfPlayer('undertaker', 'You learn which character died by execution today.'), aboutExecution: true },
  { ...roleOfPlayer('ravenkeeper', 'If you die at night, you choose a player and learn their character.'), afterOwnDeath: true },
  roleOfPlayer('grandmother', 'You start knowing a good player and their character.', ['townsfolk', 'outsider']),
  {
    roleId: 'slayer',
    prompt: 'You publicly choose a player: if they are the Demon, they die.',
    fields: [
      { key: 'player', kind: 'player', label: 'Target' },
      { key: 'yes', kind: 'boolean', label: 'Did the target die?', trueLabel: 'Died', falseLabel: 'Survived' }
    ],
    involved: p => (p.player ? [p.player] : []),
    check: (p, _src, v) => !!p.player && (v.team(p.player) === 'demon') === !!p.yes,
    publicWhen: p => !!p.yes,
    describe: (p, name) => `shot ${name(p.player)}, who ${p.yes ? 'DIED' : 'survived'}`
  },
  {
    roleId: 'virgin',
    prompt: 'The first time you are nominated, if the nominator is a Townsfolk, they are executed.',
    fields: [
      { key: 'player', kind: 'player', label: 'First nominator' },
      { key: 'yes', kind: 'boolean', label: 'Was the nominator executed?', trueLabel: 'Executed', falseLabel: 'Nothing happened' }
    ],
    involved: p => (p.player ? [p.player] : []),
    check: (p, _src, v) => !!p.player && (v.team(p.player) === 'townsfolk') === !!p.yes,
    publicWhen: p => !!p.yes,
    describe: (p, name) =>
      `was first nominated by ${name(p.player)}, who ${p.yes ? 'was EXECUTED' : 'was not executed'}`
  },
  {
    roleId: 'steward',
    prompt: 'You start knowing 1 good player.',
    fields: [{ key: 'player', kind: 'player', label: 'Good player' }],
    involved: p => (p.player ? [p.player] : []),
    check: (p, _src, v) => !!p.player && v.alignment(p.player) === 'good',
    describe: (p, name) => `learnt ${name(p.player)} is good`
  },
  {
    roleId: 'knight',
    prompt: 'You start knowing 2 players that are not the Demon.',
    fields: [players2],
    involved: p => p.players ?? [],
    check: (p, _src, v) => (pair(p) ?? []).every(id => v.team(id) !== 'demon') && !!pair(p),
    describe: (p, name) => `learnt ${name(p.players?.[0])} and ${name(p.players?.[1])} are not the Demon`
  },
  {
    roleId: 'noble',
    prompt: 'You start knowing 3 players, 1 and only 1 of which is evil.',
    fields: [{ key: 'players', kind: 'players', count: 3, label: 'Players shown' }],
    involved: p => p.players ?? [],
    check: (p, _src, v) =>
      (p.players?.length ?? 0) === 3 && p.players!.filter(id => v.alignment(id) === 'evil').length === 1,
    describe: (p, name) => `learnt exactly one of ${(p.players ?? []).map(id => name(id)).join(', ')} is evil`
  },
  {
    roleId: 'seamstress',
    prompt: 'Once per game, choose 2 players (not yourself): learn if they are the same alignment.',
    fields: [players2, { key: 'yes', kind: 'boolean', label: 'Same alignment?', trueLabel: 'Same', falseLabel: 'Different' }],
    involved: p => p.players ?? [],
    check: (p, _src, v) => {
      const ids = pair(p);
      return !!ids && (v.alignment(ids[0]) === v.alignment(ids[1])) === !!p.yes;
    },
    describe: (p, name) =>
      `learnt ${name(p.players?.[0])} and ${name(p.players?.[1])} are ${p.yes ? 'the SAME' : 'DIFFERENT'} alignment${p.yes ? '' : 's'}`
  },
  {
    roleId: 'sage',
    prompt: 'If the Demon kills you, you learn that it is 1 of 2 players.',
    afterOwnDeath: true,
    fields: [players2],
    involved: p => p.players ?? [],
    check: (p, _src, v) => (pair(p) ?? []).some(id => v.team(id) === 'demon'),
    describe: (p, name) => `learnt the Demon is ${name(p.players?.[0])} or ${name(p.players?.[1])}`
  },
  {
    roleId: 'dreamer',
    prompt: 'Each night, choose a player: you learn 1 good and 1 evil character, 1 of which is correct.',
    fields: [
      { key: 'player', kind: 'player', label: 'Player chosen' },
      { key: 'roleId', kind: 'role', label: 'Good character shown', teams: ['townsfolk', 'outsider'] },
      { key: 'roleId2', kind: 'role', label: 'Evil character shown', teams: ['minion', 'demon'] }
    ],
    involved: p => (p.player ? [p.player] : []),
    check: (p, _src, v) =>
      !!p.player && [p.roleId, p.roleId2].some(r => !!r && v.registersAsRole(p.player!, r)),
    describe: (p, name, role) => `learnt ${name(p.player)} is the ${role(p.roleId)} or the ${role(p.roleId2)}`
  }
];

/** Steps to the nearest evil player going one way round the circle (Infinity if none). */
function stepsToEvil(seats: readonly string[], from: string, dir: 1 | -1, isEvil: (id: string) => boolean): number {
  const n = seats.length;
  const idx = seats.indexOf(from);
  for (let k = 1; k < n; k++) {
    if (isEvil(seats[(((idx + dir * k) % n) + n) % n])) return k;
  }
  return Infinity;
}

SPECS.push(
  {
    roleId: 'shugenja',
    prompt: 'You start knowing if your closest evil player is clockwise or anti-clockwise. Clockwise means towards higher seat numbers.',
    fields: [{ key: 'yes', kind: 'boolean', label: 'Closest evil player is', trueLabel: 'Clockwise (higher seats)', falseLabel: 'Anti-clockwise (lower seats)' }],
    involved: () => 'all',
    check: (p, src, v) => {
      const isEvil = (id: string) => id !== src && v.alignment(id) === 'evil';
      const cw = stepsToEvil(v.seats, src, 1, isEvil);
      const ccw = stepsToEvil(v.seats, src, -1, isEvil);
      if (cw === ccw) return true; // equidistant: the info is arbitrary
      return (cw < ccw) === !!p.yes;
    },
    describe: p => `learnt their closest evil player is ${p.yes ? 'clockwise' : 'anti-clockwise'}`
  },
  {
    roleId: 'villageidiot',
    prompt: 'Each night, choose a player: you learn their alignment.',
    fields: [
      { key: 'player', kind: 'player', label: 'Player chosen' },
      { key: 'yes', kind: 'boolean', label: 'Alignment shown', trueLabel: 'Evil', falseLabel: 'Good' }
    ],
    involved: p => (p.player ? [p.player] : []),
    check: (p, _src, v) => !!p.player && (v.alignment(p.player) === 'evil') === !!p.yes,
    describe: (p, name) => `learnt ${name(p.player)} is ${p.yes ? 'EVIL' : 'good'}`
  },
  {
    roleId: 'balloonist',
    prompt: 'Each night, you learn a player of a different character type than last night. Enter last night\'s and tonight\'s players.',
    fields: [{ key: 'players', kind: 'players', count: 2, label: 'Shown (1 = last night, 2 = tonight)' }],
    involved: p => p.players ?? [],
    check: (p, _src, v) => {
      const ids = pair(p);
      return !!ids && v.team(ids[0]) !== v.team(ids[1]);
    },
    describe: (p, name) => `was shown ${name(p.players?.[0])} then ${name(p.players?.[1])} (different character types)`
  }
);

const SPEC_MAP = new Map(SPECS.map(s => [s.roleId, s]));

export function getInfoSpec(roleId: string): InfoSpec | undefined {
  return SPEC_MAP.get(roleId);
}

export function allInfoSpecs(): readonly InfoSpec[] {
  return SPECS;
}
