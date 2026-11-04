import { GameEvent, Team } from '../../models/game';
import { RoleRegistry } from '../../roles/role-registry';
import {
  Alignment,
  Registration,
  RoleRule,
  SEAT_TEAMS,
  getRoleRule,
  normalizeRoleId,
  possibleTrueRolesForBelief,
  registrationsFor,
  teamAlignment
} from '../../rules/role-rules';
import { InfoPayload, InfoSpec, InfoView, getInfoSpec } from '../../rules/info-specs';
import { claimRole, executionEndedGame, infoPayload, targetPlayer } from '../../rules/events';
import { baseComposition } from '../../rules/setup';
import type { SolverInput } from '../solver';

/**
 * Brute-force reference solver.
 *
 * Lists every legal starting grimoire for a (small) game and checks each one
 * against the evidence, following the world semantics written in
 * openspec/changes/add-reference-solver/design.md, Section 4. It is meant to
 * be obviously correct, not fast: it shares the rule data and info checks
 * with the engine but none of the engine's search code.
 *
 * The only shortcut is that per-seat evidence (self-knowledge, claims, a
 * game-ending execution) filters which roles a seat may take while seatings
 * are generated. Everything else is checked on complete grimoires.
 */

export interface ReferenceResult {
  /** True if at least one legal grimoire fits all the evidence. */
  consistent: boolean;
  /** Player ID → role IDs that player holds in at least one fitting grimoire. */
  possible: Map<string, Set<string>>;
  /** How many complete seatings were checked. */
  seatingsChecked: number;
}

/** Hard limit so a bad input fails loudly instead of hanging. */
export const MAX_SEATINGS = 2_000_000;

const BABYSITTER: Registration = { alignment: 'evil', team: 'demon', roleId: 'lilmonsta' };

interface PoolRole {
  id: string;
  team: Team;
  alignment: Alignment;
  regs: readonly Registration[];
  rule: RoleRule;
  maxCopies: number;
}

interface InfoItem {
  kind: 'info';
  seat: number;
  night: number;
  spec: InfoSpec;
  payload: InfoPayload;
  actorId: string;
  alive: boolean[];
  isPublic: boolean;
  vortoxApplies: boolean;
}

interface SaintItem {
  kind: 'saint';
  seat: number;
  night: number;
}

type WorldRule = (world: readonly PoolRole[]) => boolean;

/** The input, compiled once: role pool, per-seat filters and world-level rules. */
export class ReferenceGame {
  readonly seats: string[];
  readonly n: number;
  /** Seatable roles in pool order. */
  readonly pool: PoolRole[] = [];
  private readonly byId = new Map<string, PoolRole>();
  /** Character IDs already read from the input (seated or not). */
  private readonly seen = new Set<string>();
  /** Extra false information allowed across the whole game (Fibbin). */
  fibbinAllowance = 0;
  /** A Demon that no player holds (Lil' Monsta) is in the pool. */
  unseatedDemonInPool = false;
  readonly seatFilters: ((r: PoolRole) => boolean)[][];
  readonly worldRules: WorldRule[] = [];
  readonly items: (InfoItem | SaintItem)[] = [];
  private readonly honest: boolean;

  constructor(readonly input: SolverInput) {
    this.seats = [...input.players].sort((a, b) => a.seat - b.seat).map(p => p.id);
    this.n = this.seats.length;
    this.honest = input.options?.assumeGoodPlayersHonest ?? true;
    this.seatFilters = this.seats.map(() => []);
    this.buildPool();
    this.compileSelf();
    this.compileEvents(input.events);
  }

  // --- Pool (design Decision 3) ---------------------------------------------

  private buildPool(): void {
    for (const c of this.input.characters) {
      const id = normalizeRoleId(c.id);
      if (this.seen.has(id)) continue;
      const rule = getRoleRule(id);
      const team = RoleRegistry.get(id)?.team ?? c.team;
      this.seen.add(id);
      this.fibbinAllowance += rule.gameWideFalseInfo ?? 0;
      if (!SEAT_TEAMS.includes(team)) continue;
      if (rule.unseated) {
        if (team === 'demon') this.unseatedDemonInPool = true;
        continue;
      }
      const role: PoolRole = {
        id,
        team,
        alignment: teamAlignment(team),
        regs: registrationsFor(id, team),
        rule,
        maxCopies: Math.max(1, c.maxCopies ?? rule.maxCopies ?? 1)
      };
      this.byId.set(id, role);
      this.pool.push(role);
    }
  }

  role(id: string): PoolRole | undefined {
    return this.byId.get(normalizeRoleId(id));
  }

  /** Team of any character: the pool first, then the registry. */
  teamOf(roleId: string): Team | null {
    const id = normalizeRoleId(roleId);
    return this.byId.get(id)?.team ?? RoleRegistry.get(id)?.team ?? null;
  }

  private seatOf(playerId: string | null | undefined): number | undefined {
    if (!playerId) return undefined;
    const i = this.seats.indexOf(playerId);
    return i < 0 ? undefined : i;
  }

  /** If `seat` is the Drunk, `believed` is not held by anyone. */
  private drunkRule(seat: number, believed: string): WorldRule {
    return w => w[seat].id !== 'drunk' || !w.some(r => r.id === believed);
  }

  // --- Evidence (design 4a, 4b) ---------------------------------------------

  private compileSelf(): void {
    const self = this.input.self;
    if (!self) return;
    const seat = this.seatOf(self.playerId);
    if (seat === undefined) return;
    const believed = normalizeRoleId(self.roleId);
    const team = this.teamOf(believed);
    if (!team) return;
    if (self.certain) {
      this.seatFilters[seat].push(r => r.id === believed);
    } else {
      const candidates = possibleTrueRolesForBelief(believed, team);
      this.seatFilters[seat].push(r => candidates.includes(r.id));
      this.worldRules.push(this.drunkRule(seat, believed));
    }
  }

  private compileEvents(events: readonly GameEvent[]): void {
    const alive = new Array<boolean>(this.n).fill(true);
    for (const event of events) {
      switch (event.kind) {
        case 'death':
        case 'resurrection': {
          const seat = this.seatOf(targetPlayer(event));
          if (seat !== undefined) alive[seat] = event.kind === 'resurrection';
          break;
        }
        case 'claim':
          this.compileClaim(event);
          break;
        case 'execution':
          this.compileExecution(event, alive);
          break;
        case 'info':
          this.compileInfo(event, alive);
          break;
      }
    }
  }

  private compileClaim(event: GameEvent): void {
    const seat = this.seatOf(event.actorId);
    const claimed = claimRole(event);
    if (seat === undefined || !claimed) return;
    const team = this.teamOf(claimed);
    if (!team) return;
    switch (event.trust) {
      case 'confirmed':
        this.seatFilters[seat].push(r => r.id === claimed);
        break;
      case 'false':
        this.seatFilters[seat].push(r => r.id !== claimed);
        break;
      case 'asserted': {
        if (!this.honest) return;
        const truthful = possibleTrueRolesForBelief(claimed, team);
        this.seatFilters[seat].push(r => r.alignment === 'evil' || truthful.includes(r.id));
        this.worldRules.push(this.drunkRule(seat, claimed));
        break;
      }
    }
  }

  private compileExecution(event: GameEvent, alive: boolean[]): void {
    const seat = this.seatOf(targetPlayer(event));
    if (seat === undefined) return;
    const aliveBefore = alive.filter(Boolean).length;
    alive[seat] = false;

    if (executionEndedGame(event)) {
      if (aliveBefore - 1 <= 2) return;
      const lilMonsta = this.unseatedDemonInPool;
      this.seatFilters[seat].push(
        r => r.team === 'demon' || r.id === 'saint' || (lilMonsta && r.team === 'minion')
      );
      return;
    }

    // The Demon survived its execution: a Scarlet Woman (5+ alive) or a Mastermind saved the game.
    this.worldRules.push(w => {
      if (w[seat].team !== 'demon') return true;
      return w.some((r, i) => i !== seat && ((r.id === 'scarletwoman' && aliveBefore >= 5) || r.id === 'mastermind'));
    });
    // The Saint survived its execution: that is false information about the Saint's ability.
    this.items.push({ kind: 'saint', seat, night: event.night });
  }

  private compileInfo(event: GameEvent, alive: boolean[]): void {
    const payload = infoPayload(event);
    const seat = this.seatOf(event.actorId);
    if (!payload || seat === undefined) return;
    const spec = getInfoSpec(payload.type);
    if (!spec) return;
    const referenced = [...(payload.players ?? []), ...(payload.player ? [payload.player] : [])];
    if (referenced.some(id => this.seatOf(id) === undefined)) return;
    this.items.push({
      kind: 'info',
      seat,
      night: event.night,
      spec,
      payload,
      actorId: event.actorId!,
      alive: [...alive],
      isPublic: spec.publicWhen?.(payload) ?? false,
      vortoxApplies: this.teamOf(spec.roleId) === 'townsfolk' && !spec.publicWhen
    });
  }

  // --- Setup rules (design Decision 3) --------------------------------------

  /** Is this list of seated roles a legal starting setup? */
  legalList(list: readonly PoolRole[]): boolean {
    if (list.length !== this.n) return false;
    const [, O, M] = baseComposition(this.n);
    const count = (t: Team) => list.filter(r => r.team === t).length;
    const distinct = [...new Set(list)];

    // Sum one chosen change per modifier, then clamp once at zero. Clamping
    // after each step would make the result depend on the order of the roles.
    let anyOutsiders = false;
    let totals = new Set([0]);
    let minMinions = M;
    for (const r of distinct) {
      const setup = r.rule.setup;
      if (!setup) continue;
      if (setup.anyOutsiderCount) anyOutsiders = true;
      else if (setup.outsiderDelta) {
        const next = new Set<number>();
        for (const x of totals) for (const d of setup.outsiderDelta) next.add(x + d);
        totals = next;
      }
      minMinions += setup.minionDelta ?? 0;
    }
    const outsiders = new Set([...totals].map(d => Math.max(0, O + d)));
    if (!anyOutsiders && !outsiders.has(count('outsider'))) return false;

    const demons = count('demon');
    const minions = count('minion');
    const countsOk =
      (demons === 1 && minions === minMinions) ||
      (this.unseatedDemonInPool && demons === 0 && minions === minMinions + 1);
    if (!countsOk) return false;

    for (const r of distinct) {
      for (const req of r.rule.setup?.requiresInPlay ?? []) {
        if (!list.some(x => x.id === req)) return false;
      }
    }
    return true;
  }

  /** Every legal role multiset, as lists in pool order. */
  *legalLists(): Generator<PoolRole[]> {
    const counts = new Array<number>(this.pool.length).fill(0);
    const self = this;
    function* rec(i: number, left: number): Generator<PoolRole[]> {
      if (i === self.pool.length) {
        if (left !== 0) return;
        const list = self.pool.flatMap((r, k) => new Array<PoolRole>(counts[k]).fill(r));
        if (self.legalList(list)) yield list;
        return;
      }
      for (let c = 0; c <= Math.min(self.pool[i].maxCopies, left); c++) {
        counts[i] = c;
        yield* rec(i + 1, left - c);
      }
      counts[i] = 0;
    }
    yield* rec(0, this.n);
  }

  /** Distinct seatings of a role list that pass every seat's filters. */
  *seatings(list: readonly PoolRole[]): Generator<PoolRole[]> {
    const distinct = [...new Set(list)];
    const left = distinct.map(r => list.filter(x => x === r).length);
    const world: PoolRole[] = [];
    const self = this;
    function* rec(seat: number): Generator<PoolRole[]> {
      if (seat === self.n) {
        yield [...world];
        return;
      }
      for (let k = 0; k < distinct.length; k++) {
        if (left[k] === 0) continue;
        const r = distinct[k];
        if (!self.seatFilters[seat].every(f => f(r))) continue;
        left[k]--;
        world.push(r);
        yield* rec(seat + 1);
        world.pop();
        left[k]++;
      }
    }
    yield* rec(0);
  }

  // --- Judging a complete seating (design 4c–4f) ----------------------------

  fits(world: readonly PoolRole[]): boolean {
    if (!this.legalList(world)) return false;
    for (let s = 0; s < this.n; s++) if (!this.seatFilters[s].every(f => f(world[s]))) return false;
    if (!this.worldRules.every(rule => rule(world))) return false;

    const goodSeats = world.flatMap((r, i) => (r.alignment === 'good' ? [i] : []));
    const needsHerring = this.items.some(
      it => it.kind === 'info' && world[it.seat].id === it.spec.roleId && getRoleRule(it.spec.roleId).hasRedHerring
    );
    const herrings = needsHerring ? [-1, ...goodSeats] : [-1];
    const paws = world.some(r => r.rule.grantsFauxPaw) ? [-1, ...goodSeats] : [-1];

    for (const rh of herrings) {
      for (const fp of paws) {
        const falseEvents = this.falseInfo(world, rh, fp);
        if (falseEvents && this.withinBudget(world, falseEvents)) return true;
      }
    }
    return false;
  }

  /** False-info events in this world, or null if some evidence cannot hold at all. */
  private falseInfo(world: readonly PoolRole[], redHerring: number, fauxPaw: number): { seat: number; night: number }[] | null {
    const vortox = world.some(r => r.rule.falsifiesTownsfolkInfo);
    const result: { seat: number; night: number }[] = [];
    for (const it of this.items) {
      if (it.kind === 'saint') {
        if (world[it.seat].id === 'saint') result.push({ seat: it.seat, night: it.night });
        continue;
      }
      const genuine = world[it.seat].id === it.spec.roleId;
      if (!genuine) {
        if (it.isPublic) return null;
        continue;
      }
      const { canTrue, canFalse } = this.outcomes(it, world, redHerring, fauxPaw);
      if (it.isPublic) {
        if (!canTrue) return null;
        continue;
      }
      const expectTrue = !(it.vortoxApplies && vortox);
      if (!(expectTrue ? canTrue : canFalse)) result.push({ seat: it.seat, night: it.night });
    }
    return result;
  }

  /** Can the info be true / false over every way each player may register? */
  private outcomes(
    it: InfoItem,
    world: readonly PoolRole[],
    redHerring: number,
    fauxPaw: number
  ): { canTrue: boolean; canFalse: boolean } {
    const babysitter = this.unseatedDemonInPool && !world.some(r => r.team === 'demon');
    const options = world.map(r => (babysitter && r.team === 'minion' ? [...r.regs, BABYSITTER] : r.regs));
    const chosen: Registration[] = options.map(o => o[0]);
    const reg = (id: string) => chosen[this.seats.indexOf(id)];
    const view: InfoView = {
      seats: this.seats,
      isAlive: id => it.alive[this.seats.indexOf(id)] ?? false,
      alignment: id => (this.seats.indexOf(id) === fauxPaw ? 'evil' : reg(id).alignment),
      team: id => reg(id).team,
      registersAsRole: (id, roleId) => {
        const r = reg(id);
        const wanted = normalizeRoleId(roleId);
        return r.roleId === '*' ? this.teamOf(wanted) === r.team : r.roleId === wanted;
      },
      isRedHerring: id => this.seats.indexOf(id) === redHerring
    };

    let canTrue = false;
    let canFalse = false;
    const rec = (s: number): void => {
      if (canTrue && canFalse) return;
      if (s === this.n) {
        if (it.spec.check(it.payload, it.actorId, view)) canTrue = true;
        else canFalse = true;
        return;
      }
      for (const option of options[s]) {
        chosen[s] = option;
        rec(s + 1);
      }
    };
    rec(0);
    return { canTrue, canFalse };
  }

  /** Per-night corruption capacity, Fibbin allowance, and the drunk Village Idiot (design 4d). */
  private withinBudget(world: readonly PoolRole[], falseEvents: { seat: number; night: number }[]): boolean {
    const cap = [...new Set(world)].reduce((sum, r) => sum + (r.rule.corruptionCapacity ?? 0), 0);
    const drunkCandidates = world.flatMap((r, i) =>
      r.rule.extraCopiesDrunk && world.filter(x => x === r).length >= 2 ? [i] : []
    );
    for (const drunkSeat of [-1, ...drunkCandidates]) {
      const byNight = new Map<number, Set<number>>();
      for (const e of falseEvents) {
        if (e.seat === drunkSeat) continue;
        if (!byNight.has(e.night)) byNight.set(e.night, new Set());
        byNight.get(e.night)!.add(e.seat);
      }
      let excess = 0;
      for (const seats of byNight.values()) excess += Math.max(0, seats.size - cap);
      if (excess <= this.fibbinAllowance) return true;
    }
    return false;
  }
}

/** Exhaustively solves a small game. Throws if it would check more than MAX_SEATINGS seatings. */
export function referenceSolve(input: SolverInput): ReferenceResult {
  const game = new ReferenceGame(input);
  const possible = new Map(game.seats.map(id => [id, new Set<string>()]));
  let consistent = false;
  let seatingsChecked = 0;
  for (const list of game.legalLists()) {
    for (const world of game.seatings(list)) {
      if (++seatingsChecked > MAX_SEATINGS) {
        throw new Error(`Reference solver: more than ${MAX_SEATINGS} seatings; use a smaller game.`);
      }
      if (!game.fits(world)) continue;
      consistent = true;
      world.forEach((r, s) => possible.get(game.seats[s])!.add(r.id));
    }
  }
  return { consistent, possible, seatingsChecked };
}

/** Does this exact seating (role ID per seat, in seat order) fit the evidence? */
export function worldFits(input: SolverInput, world: readonly string[]): boolean {
  const game = new ReferenceGame(input);
  if (world.length !== game.n) return false;
  const roles = world.map(id => game.role(id));
  if (roles.some(r => !r)) return false;
  return game.fits(roles as PoolRole[]);
}

/** Every legal starting setup as role-ID lists (for generators). */
export function legalRoleLists(input: SolverInput): string[][] {
  return [...new ReferenceGame(input).legalLists()].map(list => list.map(r => r.id));
}
