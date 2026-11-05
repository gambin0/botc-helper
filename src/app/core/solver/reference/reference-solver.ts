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
import { claimRole, executionEndedGame, infoPayload, namesYesterdaysExecution, targetPlayer } from '../../rules/events';
import { baseComposition } from '../../rules/setup';
import { chronologicalOrder } from '../../rules/timeline';
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
 *
 * The Demon can change seats during the game (an Imp star-pass, the Scarlet
 * Woman). For each grimoire, every possible history of who held the Demon is
 * simulated (see `timelines`), and information is judged against the
 * characters as they were when it was received.
 */

export interface ReferenceResult {
  /** True if at least one legal grimoire fits all the evidence. */
  consistent: boolean;
  /** Player ID → role IDs that player holds in at least one fitting grimoire. */
  possible: Map<string, Set<string>>;
  /** Players who are the living Demon after the last event in at least one fitting history. */
  demonNow: Set<string>;
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

/** Something that happens at a point in the game, in game order (rules/timeline.ts). */
type Step =
  | { kind: 'item'; item: number }
  | { kind: 'death' | 'resurrection'; seat: number; night: number }
  | { kind: 'execution'; seat: number; ended: boolean; night: number };

/** One possible history of the Demon for a grimoire. */
interface Timeline {
  /** The characters in play when each item (by index) happened. */
  rolesAt: (readonly PoolRole[])[];
  /** The living Demon's seat after the last event, or -1 if there is none (the game is over). */
  demonNow: number;
}

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
  /** Deaths, executions and items in game order. */
  private readonly steps: Step[] = [];
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
    /** Event index → the items it produced. */
    const itemsOf = events.map(() => [] as number[]);
    events.forEach((event, i) => {
      const before = this.items.length;
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
      for (let k = before; k < this.items.length; k++) itemsOf[i].push(k);
    });

    for (const i of chronologicalOrder(events)) {
      const event = events[i];
      const seat = this.seatOf(targetPlayer(event));
      if ((event.kind === 'death' || event.kind === 'resurrection') && seat !== undefined) {
        this.steps.push({ kind: event.kind, seat, night: event.night });
      } else if (event.kind === 'execution' && seat !== undefined) {
        this.steps.push({ kind: 'execution', seat, ended: executionEndedGame(event), night: event.night });
      }
      for (const item of itemsOf[i]) this.steps.push({ kind: 'item', item });
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
    alive[seat] = false;

    // A game-ending execution must kill the Demon (perhaps a Minion who became
    // it) or the Saint: checked in `timelines`, which counts players in game order.
    if (executionEndedGame(event)) return;

    // If the Demon was executed and the game went on, `timelines` requires a
    // Scarlet Woman (5+ alive) to take over, or a Mastermind.
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
    // An Undertaker always knows who was executed: naming anyone else means the source is not one.
    if (spec.aboutExecution && !namesYesterdaysExecution(event, this.input.events)) {
      this.seatFilters[seat].push(r => r.id !== spec.roleId);
    }
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
    return this.judgeWorld(world, true).fits;
  }

  /**
   * Whether the grimoire fits, and the living Demon after the last event in
   * each fitting history. With `firstOnly`, stops at the first fitting history.
   */
  judgeWorld(world: readonly PoolRole[], firstOnly = false): { fits: boolean; demonsNow: Set<number> } {
    const demonsNow = new Set<number>();
    const none = { fits: false, demonsNow };
    if (!this.legalList(world)) return none;
    for (let s = 0; s < this.n; s++) if (!this.seatFilters[s].every(f => f(world[s]))) return none;
    if (!this.worldRules.every(rule => rule(world))) return none;

    const goodSeats = world.flatMap((r, i) => (r.alignment === 'good' ? [i] : []));
    const needsHerring = this.items.some(
      it => it.kind === 'info' && world[it.seat].id === it.spec.roleId && getRoleRule(it.spec.roleId).hasRedHerring
    );
    const herrings = needsHerring ? [-1, ...goodSeats] : [-1];
    const paws = world.some(r => r.rule.grantsFauxPaw) ? [-1, ...goodSeats] : [-1];

    let fits = false;
    for (const timeline of this.timelines(world)) {
      if (demonsNow.has(timeline.demonNow)) continue; // nothing new to learn from it
      search: for (const rh of herrings) {
        for (const fp of paws) {
          const falseEvents = this.falseInfo(world, timeline.rolesAt, rh, fp);
          if (falseEvents && this.withinBudget(world, falseEvents)) {
            fits = true;
            demonsNow.add(timeline.demonNow);
            break search;
          }
        }
      }
      if (fits && firstOnly) break;
    }
    return { fits, demonsNow };
  }

  /**
   * Every possible history of the Demon for a starting grimoire (event order: rules/timeline.ts).
   *
   * Walks the deaths and executions in game order. When the living Demon dies:
   * - a living Scarlet Woman becomes that Demon if 5 or more players were
   *   alive before the death (she must);
   * - otherwise, if it died other than by execution and passes on death (the
   *   Imp's star-pass), any living Minion may become it;
   * - after an execution logged as "the game continued", only a Mastermind
   *   can keep the game going (without a Demon); otherwise it is impossible;
   * - otherwise the game is over, and no later death, execution or
   *   information may happen. (The game may also simply be over after a
   *   star-passing Demon dies, for example to a Slayer.)
   * A game-ending execution must kill the living Demon (unless a Scarlet Woman
   * would have taken over) or the Saint, unless 2 or fewer players remain.
   */
  *timelines(world: readonly PoolRole[]): Generator<Timeline> {
    const steps = this.steps;
    // Shortcut: if no Demon ever dies and no execution ends the game, nothing changes.
    const quiet = steps.every(st => st.kind === 'item' || st.kind === 'resurrection' || (world[st.seat].team !== 'demon' && !(st.kind === 'execution' && st.ended)));
    if (quiet) {
      const alive = new Array<boolean>(this.n).fill(true);
      for (const st of steps) if (st.kind !== 'item') alive[st.seat] = st.kind === 'resurrection';
      yield { rolesAt: this.items.map(() => world), demonNow: world.findIndex((r, i) => alive[i] && r.team === 'demon') };
      return;
    }
    const rolesAt: (readonly PoolRole[])[] = new Array(this.items.length);
    const hasMastermind = world.some(r => r.id === 'mastermind');
    const livingDemon = (roles: readonly PoolRole[], alive: readonly boolean[]) =>
      roles.findIndex((r, i) => alive[i] && r.team === 'demon');
    const scarletWomanFor = (roles: readonly PoolRole[], alive: readonly boolean[], dying: number, aliveBefore: number) =>
      aliveBefore >= 5 ? roles.findIndex((r, i) => i !== dying && alive[i] && r.rule.inheritsDemon && r.team !== 'demon') : -1;
    const becomes = (roles: readonly PoolRole[], seat: number, role: PoolRole) => roles.map((r, i) => (i === seat ? role : r));

    function* walk(k: number, roles: readonly PoolRole[], alive: readonly boolean[], over: boolean): Generator<Timeline> {
      if (k === steps.length) {
        yield { rolesAt: [...rolesAt], demonNow: over ? -1 : livingDemon(roles, alive) };
        return;
      }
      const step = steps[k];
      if (over) return; // nothing can happen after the game ended
      if (step.kind === 'item') {
        rolesAt[step.item] = roles;
        yield* walk(k + 1, roles, alive, false);
        return;
      }
      if (step.kind === 'resurrection') {
        yield* walk(k + 1, roles, alive.map((a, i) => a || i === step.seat), false);
        return;
      }
      if (!alive[step.seat]) {
        yield* walk(k + 1, roles, alive, false); // already dead
        return;
      }
      const aliveBefore = alive.filter(Boolean).length;
      const after = alive.map((a, i) => a && i !== step.seat);
      const wasDemon = roles[step.seat].team === 'demon';
      const sw = wasDemon ? scarletWomanFor(roles, after, step.seat, aliveBefore) : -1;

      if (step.kind === 'execution' && step.ended) {
        if (aliveBefore - 1 <= 2) yield* walk(k + 1, roles, after, true);
        else if ((wasDemon && sw < 0) || roles[step.seat].id === 'saint') yield* walk(k + 1, roles, after, true);
        else if (roles[step.seat].team === 'minion' && game.unseatedDemonInPool && livingDemon(roles, alive) < 0) {
          yield* walk(k + 1, roles, after, true); // Lil' Monsta's babysitter
        }
        return;
      }
      if (!wasDemon) {
        yield* walk(k + 1, roles, after, false);
        return;
      }
      if (sw >= 0) {
        yield* walk(k + 1, becomes(roles, sw, roles[step.seat]), after, false);
        return;
      }
      if (step.kind === 'death' && roles[step.seat].rule.passesOnDeath) {
        for (let m = 0; m < roles.length; m++) {
          if (after[m] && roles[m].team === 'minion') yield* walk(k + 1, becomes(roles, m, roles[step.seat]), after, false);
        }
      }
      if (step.kind === 'execution') {
        // The log says the game went on, so only a Mastermind could have kept it going.
        if (hasMastermind) yield* walk(k + 1, roles, after, false);
        return;
      }
      yield* walk(k + 1, roles, after, true);
    }
    const game = this;
    yield* walk(0, world, new Array<boolean>(this.n).fill(true), false);
  }

  /** False-info events in this world, or null if some evidence cannot hold at all. */
  private falseInfo(
    world: readonly PoolRole[],
    rolesAt: readonly (readonly PoolRole[])[],
    redHerring: number,
    fauxPaw: number
  ): { seat: number; night: number }[] | null {
    const vortox = world.some(r => r.rule.falsifiesTownsfolkInfo);
    const result: { seat: number; night: number }[] = [];
    for (let k = 0; k < this.items.length; k++) {
      const it = this.items[k];
      const now = rolesAt[k];
      if (it.kind === 'saint') {
        if (now[it.seat].id === 'saint') result.push({ seat: it.seat, night: it.night });
        continue;
      }
      const genuine = now[it.seat].id === it.spec.roleId;
      if (!genuine) {
        if (it.isPublic) return null;
        continue;
      }
      const { canTrue, canFalse } = this.outcomes(it, now, redHerring, fauxPaw);
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

  /** Is this seat alive during night `night`? Deaths and executions before that night count. */
  private aliveOnNight(seat: number, night: number): boolean {
    let alive = true;
    for (const st of this.steps) {
      if (st.kind === 'item' || st.seat !== seat || st.night >= night) continue;
      alive = st.kind === 'resurrection';
    }
    return alive;
  }

  /**
   * Can drunkenness and poisoning explain every false-info event (design 4d)?
   * - Each corrupting character covers its capacity of distinct players per
   *   night; a Poisoner (and others that corrupt only while alive) covers
   *   nobody on nights after it died.
   * - The Widow covers one player, the same one all game, while she lives.
   * - With 2+ Village Idiots, one copy is drunk all game.
   * - The Fibbin allows that many uncovered events in the whole game.
   */
  private withinBudget(world: readonly PoolRole[], falseEvents: { seat: number; night: number }[]): boolean {
    const corrupters = [...new Set(world)]
      .filter(r => r.rule.corruptionCapacity)
      .map(r => ({ rule: r.rule, seat: world.indexOf(r) }));
    const working = (c: { rule: RoleRule; seat: number }, night: number) =>
      !c.rule.corruptsWhileAlive || this.aliveOnNight(c.seat, night);
    const perNight = corrupters.filter(c => !c.rule.corruptsOneForGame);
    const widows = corrupters.filter(c => c.rule.corruptsOneForGame);
    const capacity = (night: number) =>
      perNight.reduce((sum, c) => sum + (working(c, night) ? c.rule.corruptionCapacity! : 0), 0);
    const sources = [-1, ...new Set(falseEvents.map(e => e.seat))];
    const drunkCandidates = world.flatMap((r, i) =>
      r.rule.extraCopiesDrunk && world.filter(x => x === r).length >= 2 ? [i] : []
    );

    const fits = (drunkSeat: number, widowTargets: number[]): boolean => {
      const byNight = new Map<number, Set<number>>();
      for (const e of falseEvents) {
        if (e.seat === drunkSeat) continue;
        if (widows.some((w, k) => widowTargets[k] === e.seat && working(w, e.night))) continue;
        if (!byNight.has(e.night)) byNight.set(e.night, new Set());
        byNight.get(e.night)!.add(e.seat);
      }
      let excess = 0;
      for (const [night, seats] of byNight) excess += Math.max(0, seats.size - capacity(night));
      return excess <= this.fibbinAllowance;
    };
    const chooseTargets = (drunkSeat: number, chosen: number[]): boolean =>
      chosen.length === widows.length
        ? fits(drunkSeat, chosen)
        : sources.some(t => chooseTargets(drunkSeat, [...chosen, t]));
    return [-1, ...drunkCandidates].some(d => chooseTargets(d, []));
  }
}

/** Exhaustively solves a small game. Throws if it would check more than MAX_SEATINGS seatings. */
export function referenceSolve(input: SolverInput): ReferenceResult {
  const game = new ReferenceGame(input);
  const possible = new Map(game.seats.map(id => [id, new Set<string>()]));
  const demonNow = new Set<string>();
  let consistent = false;
  let seatingsChecked = 0;
  for (const list of game.legalLists()) {
    for (const world of game.seatings(list)) {
      if (++seatingsChecked > MAX_SEATINGS) {
        throw new Error(`Reference solver: more than ${MAX_SEATINGS} seatings; use a smaller game.`);
      }
      const judged = game.judgeWorld(world);
      if (!judged.fits) continue;
      consistent = true;
      world.forEach((r, s) => possible.get(game.seats[s])!.add(r.id));
      for (const s of judged.demonsNow) if (s >= 0) demonNow.add(game.seats[s]);
    }
  }
  return { consistent, possible, demonNow, seatingsChecked };
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
