import {
  DeductionResult,
  EvidenceRef,
  Explanation,
  GameEvent,
  Player,
  PlayerAlignment,
  RolePossibility,
  ScriptCharacter,
  Team
} from '../models/game';
import { RoleRegistry } from '../roles/role-registry';
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
} from '../rules/role-rules';
import { InfoPayload, InfoSpec, InfoView, PartialInfoView, getInfoSpec } from '../rules/info-specs';
import { claimRole, describeEvent, executionEndedGame, infoPayload, targetPlayer } from '../rules/events';
import { baseComposition } from '../rules/setup';

/**
 * Blood on the Clocktower deduction engine.
 *
 * A *world* is a complete starting grimoire: one character per seat, drawn
 * from the candidate role pool, that satisfies the setup rules (role counts
 * for the player count, setup modifiers such as the Baron, uniqueness).
 *
 * Evidence never has to be true by itself. Information only constrains a
 * world when its source genuinely holds that ability in the world AND is not
 * drunk/poisoned. Every world gets a budget of drunk/poisoned players per
 * night from the corrupting characters in play (Poisoner, No Dashii, ...),
 * so "the Empath is lying" and "the Empath is poisoned" remain open unless
 * the evidence rules them out.
 *
 * The engine searches for worlds with backtracking and reports which
 * (player, role) pairs appear in at least one world. It is pure TypeScript
 * with no Angular dependencies, so it can move to a Web Worker unchanged.
 */

export interface SelfKnowledge {
  playerId: string;
  /** The character the Storyteller showed you. */
  roleId: string;
  /** If false, you might actually be the Drunk, Lunatic or Marionette. */
  certain: boolean;
}

export interface SolverOptions {
  /**
   * Treat every 'asserted' claim as truthful when the claimant is good
   * (allowing for the Drunk/Lunatic/Marionette). Mark a claim 'doubted' to
   * exempt it. Defaults to true.
   */
  assumeGoodPlayersHonest?: boolean;
  /** Maximum search nodes for a single search. */
  nodeBudget?: number;
  /** Maximum search nodes for a whole solve() call. */
  totalBudget?: number;
}

export interface SolverInput {
  characters: readonly ScriptCharacter[];
  players: readonly Player[];
  events: readonly GameEvent[];
  self?: SelfKnowledge | null;
  options?: SolverOptions;
}

const T_TOWNSFOLK = 0;
const T_OUTSIDER = 1;
const T_MINION = 2;
const T_DEMON = 3;
const TEAM_INDEX: Partial<Record<Team, number>> = { townsfolk: 0, outsider: 1, minion: 2, demon: 3 };

interface RoleInfo {
  id: string;
  name: string;
  team: Team;
  teamIdx: number;
  alignment: Alignment;
  regs: readonly Registration[];
  rule: RoleRule;
}

interface Evidence {
  id: string;
  label: string;
}

interface UnaryConstraint {
  ev: number;
  player: number;
  allowed: Uint8Array;
  reason: string;
}

interface InfoConstraint {
  ev: number;
  source: number;
  infoRole: string;
  night: number;
  spec: InfoSpec;
  payload: InfoPayload;
  /** Seat indexes whose registration matters; null means the whole circle. */
  involved: number[] | null;
  alive: boolean[];
  /** Publicly observable result: the source must genuinely, soberly have the ability. */
  isPublic: boolean;
  /** Townsfolk information is inverted by the Vortox. */
  vortoxApplies: boolean;
  /** An always-false "info", e.g. a Saint executed without the game ending. */
  alwaysFalse?: boolean;
}

interface GlobalConstraint {
  ev: number;
  /** Seats whose role this rule depends on (used to find interchangeable seats). */
  refs: number[];
  /** Seats that trigger a partial check when assigned; null = check at leaves only. */
  watch: number[] | null;
  /** With complete=false, return false only if definitely violated. */
  test(world: Int16Array, complete: boolean): boolean;
}

type SearchOutcome = { kind: 'sat'; world: Int16Array; free: number[] } | { kind: 'unsat' } | { kind: 'unknown' };

class BudgetExceeded extends Error {}

/** Small deterministic PRNG so results are reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class DeductionEngine {
  private readonly n: number;
  private readonly seatIds: string[];
  private readonly seatIndex = new Map<string, number>();
  private readonly playerNames = new Map<string, string>();
  private readonly roles: RoleInfo[] = [];
  private readonly roleIndex = new Map<string, number>();
  private readonly composition: readonly [number, number, number, number];
  private readonly evidence: Evidence[] = [];
  private readonly unary: UnaryConstraint[] = [];
  private readonly infos: InfoConstraint[] = [];
  private readonly globals: GlobalConstraint[] = [];
  private readonly warnings: string[] = [];
  private readonly options: Required<SolverOptions>;

  // Constraint indexes by seat
  private infosBySeat: number[][] = [];
  private globalsBySeat: number[][] = [];
  private wholeCircleInfos: number[] = [];
  private leafGlobals: number[] = [];

  // Role groups
  private setupModifierRoles: number[] = [];
  private corrupterRoles: number[] = [];
  private requiresRoles: number[] = [];
  private vortoxRole = -1;
  private maxMinionsEver = 0;
  private ambiguousRole: boolean[] = [];

  // Search state
  private world!: Int16Array;
  private used!: Uint8Array;
  private teamCount = [0, 0, 0, 0];
  private assignedCount = 0;
  private active!: Uint8Array;
  private failing = new Map<number, Map<number, number>>();
  private nodes = 0;
  private searchBudget = 0;
  private totalNodes = 0;
  private rng = mulberry32(1);
  private links: Set<number>[] = [];
  private freeSeats: number[] = [];
  private isFree = new Uint8Array(0);
  private freeAssigned = 0;

  // Evaluation scratch state for InfoView
  private curReg: (Registration | null)[] = [];
  private curAlive: boolean[] = [];
  private curRedHerring = -1;
  private readonly view: InfoView;
  private readonly partialView: PartialInfoView;
  private partialAlignments: Set<Alignment>[] = [];

  constructor(input: SolverInput) {
    this.options = {
      assumeGoodPlayersHonest: input.options?.assumeGoodPlayersHonest ?? true,
      nodeBudget: input.options?.nodeBudget ?? 150_000,
      totalBudget: input.options?.totalBudget ?? 4_000_000
    };

    const seated = [...input.players].sort((a, b) => a.seat - b.seat);
    this.n = seated.length;
    this.seatIds = seated.map(p => p.id);
    seated.forEach((p, i) => {
      this.seatIndex.set(p.id, i);
      this.playerNames.set(p.id, p.name);
    });
    this.composition = baseComposition(this.n);
    if (this.n > 15) {
      this.warnings.push('More than 15 players: Travellers are not modelled, so 15-player role counts are used.');
    }

    this.buildRoles(input.characters);
    this.compileEvidence(input);
    this.indexConstraints();

    for (const role of this.roles) {
      if (role.rule.approximation) this.warnings.push(`${role.name}: ${role.rule.approximation}`);
    }

    const engine = this;
    this.view = {
      seats: this.seatIds,
      isAlive: id => engine.curAlive[engine.seatIndex.get(id) ?? -1] ?? false,
      alignment: id => engine.regOf(id).alignment,
      team: id => engine.regOf(id).team,
      registersAsRole: (id, roleId) => {
        const reg = engine.regOf(id);
        const wanted = normalizeRoleId(roleId);
        return reg.roleId === '*' ? engine.teamOfAnyRole(wanted) === reg.team : reg.roleId === wanted;
      },
      isRedHerring: id => engine.curRedHerring >= 0 && engine.seatIndex.get(id) === engine.curRedHerring
    };
    this.partialView = {
      seats: this.seatIds,
      alignmentOptions: id => engine.partialAlignments[engine.seatIndex.get(id) ?? 0]
    };
  }

  // ---------------------------------------------------------------------------
  // Setup
  // ---------------------------------------------------------------------------

  private buildRoles(characters: readonly ScriptCharacter[]): void {
    for (const char of characters) {
      const id = normalizeRoleId(char.id);
      if (this.roleIndex.has(id)) continue;
      const registered = RoleRegistry.get(id);
      const team = registered?.team ?? char.team;
      if (!SEAT_TEAMS.includes(team)) continue; // Travellers, Fabled and Loric are not seat roles
      const info: RoleInfo = {
        id,
        name: registered?.name ?? char.name,
        team,
        teamIdx: TEAM_INDEX[team]!,
        alignment: teamAlignment(team),
        regs: registrationsFor(id, team),
        rule: getRoleRule(id)
      };
      this.roleIndex.set(id, this.roles.length);
      this.roles.push(info);
    }

    this.roles.forEach((r, i) => {
      if (r.rule.setup?.outsiderDelta || r.rule.setup?.anyOutsiderCount || r.rule.setup?.minionDelta) {
        this.setupModifierRoles.push(i);
      }
      if (r.rule.setup?.requiresInPlay) this.requiresRoles.push(i);
      if (r.rule.corruptionCapacity) this.corrupterRoles.push(i);
      if (r.rule.falsifiesTownsfolkInfo) this.vortoxRole = i;
      this.ambiguousRole[i] = r.regs.length > 1;
    });

    this.maxMinionsEver =
      this.composition[T_MINION] +
      this.setupModifierRoles.reduce((sum, r) => sum + Math.max(0, this.roles[r].rule.setup?.minionDelta ?? 0), 0);

    const [, , minions] = this.composition;
    const count = (t: number) => this.roles.filter(r => r.teamIdx === t).length;
    if (count(T_DEMON) === 0) this.warnings.push('The role pool has no Demon.');
    if (count(T_MINION) < minions) this.warnings.push(`The role pool has fewer than ${minions} Minions.`);
  }

  private addEvidence(id: string, label: string): number {
    this.evidence.push({ id, label });
    return this.evidence.length - 1;
  }

  private name(playerId?: string | null): string {
    return (playerId && this.playerNames.get(playerId)) || 'Unknown player';
  }

  private roleName(roleId?: string | null): string {
    if (!roleId) return 'unknown character';
    const id = normalizeRoleId(roleId);
    const idx = this.roleIndex.get(id);
    return idx !== undefined ? this.roles[idx].name : (RoleRegistry.get(id)?.name ?? roleId);
  }

  private teamOfAnyRole(roleId: string): Team | null {
    const idx = this.roleIndex.get(roleId);
    if (idx !== undefined) return this.roles[idx].team;
    return RoleRegistry.get(roleId)?.team ?? null;
  }

  private maskWhere(pred: (r: RoleInfo, i: number) => boolean): Uint8Array {
    const m = new Uint8Array(this.roles.length);
    this.roles.forEach((r, i) => (m[i] = pred(r, i) ? 1 : 0));
    return m;
  }

  private addUnary(ev: number, player: number, allowed: Uint8Array, reason: string): void {
    this.unary.push({ ev, player, allowed, reason });
  }

  /** Global rule: if `seat` is the Drunk, `believed` cannot be in play. */
  private addDrunkBeliefRule(ev: number, seat: number, believed: string): void {
    const drunk = this.roleIndex.get('drunk');
    const believedIdx = this.roleIndex.get(believed);
    if (drunk === undefined || believedIdx === undefined) return;
    this.globals.push({
      ev,
      refs: [seat],
      watch: null,
      test: w => {
        if (w[seat] !== drunk) return true;
        for (let i = 0; i < this.n; i++) if (w[i] === believedIdx) return false;
        return true;
      }
    });
  }

  private compileEvidence(input: SolverInput): void {
    const describe = (e: GameEvent) =>
      describeEvent(e, id => this.name(id), id => this.roleName(id));

    // Private self-knowledge
    const self = input.self;
    if (self && this.seatIndex.has(self.playerId)) {
      const seat = this.seatIndex.get(self.playerId)!;
      const believed = normalizeRoleId(self.roleId);
      const believedTeam = this.teamOfAnyRole(believed);
      if (believedTeam && !this.roleIndex.has(believed)) {
        this.warnings.push(
          `Your character (${this.roleName(believed)}) is not in the current role pool. Did you change scripts?`
        );
      }
      if (believedTeam) {
        const ev = this.addEvidence(
          'self',
          `You were told you are the ${this.roleName(believed)}${self.certain ? ' (certain)' : ''}`
        );
        const candidates = self.certain ? [believed] : possibleTrueRolesForBelief(believed, believedTeam);
        this.addUnary(ev, seat, this.maskWhere(r => candidates.includes(r.id)), this.evidence[ev].label);
        if (!self.certain) this.addDrunkBeliefRule(ev, seat, believed);
      }
    }

    // Walk the log in order, tracking who is alive at each point.
    const alive = new Array<boolean>(this.n).fill(true);
    for (const event of input.events) {
      const label = describe(event);
      switch (event.kind) {
        case 'death':
        case 'resurrection': {
          const seat = this.seatIndex.get(targetPlayer(event) ?? '');
          if (seat !== undefined) alive[seat] = event.kind === 'resurrection';
          break;
        }
        case 'execution':
          this.compileExecution(event, label, alive);
          break;
        case 'claim':
          this.compileClaim(event, label);
          break;
        case 'info':
          this.compileInfo(event, label, alive);
          break;
      }
    }
  }

  private compileClaim(event: GameEvent, label: string): void {
    const seat = this.seatIndex.get(event.actorId ?? '');
    const roleId = claimRole(event);
    if (seat === undefined || !roleId) return;
    const team = this.teamOfAnyRole(roleId);
    if (!team) return;

    switch (event.trust) {
      case 'confirmed': {
        const ev = this.addEvidence(event.id, label);
        this.addUnary(ev, seat, this.maskWhere(r => r.id === roleId), label);
        break;
      }
      case 'false': {
        const ev = this.addEvidence(event.id, label);
        this.addUnary(ev, seat, this.maskWhere(r => r.id !== roleId), label);
        break;
      }
      case 'asserted': {
        if (!this.options.assumeGoodPlayersHonest) return;
        const ev = this.addEvidence(event.id, `${label} — assuming good players claim honestly`);
        const truthful = possibleTrueRolesForBelief(roleId, team);
        this.addUnary(
          ev,
          seat,
          this.maskWhere(r => r.alignment === 'evil' || truthful.includes(r.id)),
          `Claimed ${this.roleName(roleId)}, so if good they would be the ${this.roleName(roleId)} (or Drunk)`
        );
        this.addDrunkBeliefRule(ev, seat, roleId);
        break;
      }
      // 'doubted': no constraint
    }
  }

  private compileExecution(event: GameEvent, label: string, alive: boolean[]): void {
    const seat = this.seatIndex.get(targetPlayer(event) ?? '');
    if (seat === undefined) return;
    const aliveBefore = alive.filter(Boolean).length;
    alive[seat] = false;
    const aliveAfter = aliveBefore - 1;

    if (executionEndedGame(event)) {
      if (aliveAfter <= 2) return; // Could be the final-two evil win.
      const ev = this.addEvidence(event.id, label);
      this.addUnary(
        ev,
        seat,
        this.maskWhere(r => r.team === 'demon' || r.id === 'saint'),
        'The game ended on their execution, so they were the Demon (or Saint)'
      );
      return;
    }

    const ev = this.addEvidence(event.id, `${label} and the game continued`);

    // Executing a sober Saint ends the game.
    if (this.roleIndex.has('saint')) {
      this.infos.push({
        ev,
        source: seat,
        infoRole: 'saint',
        night: event.night,
        spec: getInfoSpec('steward')!, // unused when alwaysFalse
        payload: { type: 'saint' },
        involved: [],
        alive: [...alive],
        isPublic: false,
        vortoxApplies: false,
        alwaysFalse: true
      });
    }

    // Executing the Demon ends the game unless something saves it.
    const sw = this.roleIndex.get('scarletwoman');
    const mastermind = this.roleIndex.get('mastermind');
    this.globals.push({
      ev,
      refs: [seat],
      watch: [seat],
      test: (w, complete) => {
        const r = w[seat];
        if (r < 0 || this.roles[r].teamIdx !== T_DEMON) return true;
        const swOk = sw !== undefined && aliveBefore >= 5;
        if (!complete) return swOk || mastermind !== undefined;
        for (let i = 0; i < this.n; i++) {
          if (i === seat) continue;
          if (swOk && w[i] === sw) return true;
          if (mastermind !== undefined && w[i] === mastermind) return true;
        }
        return false;
      }
    });
  }

  private compileInfo(event: GameEvent, label: string, alive: boolean[]): void {
    const payload = infoPayload(event);
    const source = this.seatIndex.get(event.actorId ?? '');
    if (!payload || source === undefined) return;
    const spec = getInfoSpec(payload.type);
    if (!spec) {
      this.warnings.push(`No deduction rule for "${this.roleName(payload.type)}" info; it was ignored.`);
      return;
    }
    const aliveSnapshot = [...alive];
    const involvedIds = spec.involved(payload, event.actorId!, {
      seats: this.seatIds,
      isAlive: id => aliveSnapshot[this.seatIndex.get(id) ?? -1] ?? false
    });
    let involved: number[] | null = null;
    if (involvedIds !== 'all') {
      involved = [];
      for (const id of involvedIds) {
        const idx = this.seatIndex.get(id);
        if (idx === undefined) return; // references a removed player
        if (!involved.includes(idx)) involved.push(idx);
      }
    }
    const ev = this.addEvidence(event.id, label);
    this.infos.push({
      ev,
      source,
      infoRole: spec.roleId,
      night: event.night,
      spec,
      payload,
      involved,
      alive: aliveSnapshot,
      isPublic: spec.publicWhen?.(payload) ?? false,
      vortoxApplies: this.teamOfAnyRole(spec.roleId) === 'townsfolk' && !spec.publicWhen
    });
  }

  private indexConstraints(): void {
    this.infosBySeat = Array.from({ length: this.n }, () => []);
    this.globalsBySeat = Array.from({ length: this.n }, () => []);
    this.infos.forEach((c, i) => {
      if (c.involved === null) {
        this.wholeCircleInfos.push(i);
        return;
      }
      for (const s of new Set([c.source, ...c.involved])) this.infosBySeat[s].push(i);
    });
    this.globals.forEach((g, i) => {
      if (g.watch === null) this.leafGlobals.push(i);
      else for (const s of g.watch) this.globalsBySeat[s].push(i);
    });
  }

  // ---------------------------------------------------------------------------
  // Evaluation helpers
  // ---------------------------------------------------------------------------

  private regOf(id: string): Registration {
    const idx = this.seatIndex.get(id);
    const reg = idx === undefined ? null : this.curReg[idx];
    if (!reg) throw new Error(`Registration requested for unassigned player ${id}`);
    return reg;
  }

  /**
   * Returns which truth values the info can take in the current (partial)
   * world, over all ways ambiguous characters may register.
   * redHerring: a seat index, -1 for none, or 'any' to let any good target be it.
   */
  private outcomes(c: InfoConstraint, redHerring: number | 'any'): { canTrue: boolean; canFalse: boolean } {
    if (c.alwaysFalse) return { canTrue: false, canFalse: true };
    const seats = c.involved ?? this.seatIds.map((_, i) => i);
    this.curAlive = c.alive;
    const ambiguous: number[] = [];
    for (const s of seats) {
      const r = this.world[s];
      this.curReg[s] = this.roles[r].regs[0];
      if (this.ambiguousRole[r]) ambiguous.push(s);
    }
    const herrings: number[] =
      redHerring === 'any'
        ? [-1, ...seats.filter(s => this.roles[this.world[s]].alignment === 'good')]
        : [redHerring];

    let canTrue = false;
    let canFalse = false;
    const recurse = (k: number): boolean => {
      if (k === ambiguous.length) {
        for (const rh of herrings) {
          this.curRedHerring = rh;
          if (c.spec.check(c.payload, this.seatIds[c.source], this.view)) canTrue = true;
          else canFalse = true;
          if (canTrue && canFalse) return true;
        }
        return false;
      }
      const s = ambiguous[k];
      for (const reg of this.roles[this.world[s]].regs) {
        this.curReg[s] = reg;
        if (recurse(k + 1)) return true;
      }
      return false;
    };
    recurse(0);
    this.curRedHerring = -1;
    return { canTrue, canFalse };
  }

  private hasRedHerringRole(c: InfoConstraint): boolean {
    return getRoleRule(c.infoRole).hasRedHerring === true;
  }

  // ---------------------------------------------------------------------------
  // Composition
  // ---------------------------------------------------------------------------

  /** Can role r still appear given the current partial assignment? */
  private placeable(r: number): boolean {
    if (this.used[r] || this.assignedCount >= this.n) return false;
    const t = this.roles[r].teamIdx;
    if (t === T_DEMON) return this.teamCount[T_DEMON] < this.composition[T_DEMON];
    if (t === T_MINION) return this.teamCount[T_MINION] < this.maxMinionsEver;
    return true;
  }

  /** Allowed outsider counts and minion count range given mandatory and optional modifiers. */
  private compositionTargets(complete: boolean): { outsiders: Set<number>; minMinions: number; maxMinions: number } {
    let outsiders = new Set([this.composition[T_OUTSIDER]]);
    let minMinions = this.composition[T_MINION];
    let maxMinions = minMinions;
    const apply = (set: Set<number>, rule: RoleRule): Set<number> => {
      const next = new Set<number>();
      if (rule.setup?.anyOutsiderCount) {
        for (let x = 0; x <= this.n; x++) next.add(x);
        return next;
      }
      const deltas = rule.setup?.outsiderDelta ?? [0];
      for (const x of set) for (const d of deltas) next.add(Math.max(0, x + d));
      return next;
    };
    for (const r of this.setupModifierRoles) {
      const rule = this.roles[r].rule;
      if (this.used[r]) {
        outsiders = apply(outsiders, rule);
        minMinions += rule.setup?.minionDelta ?? 0;
        maxMinions += rule.setup?.minionDelta ?? 0;
      } else if (!complete && this.placeable(r)) {
        for (const x of apply(outsiders, rule)) outsiders.add(x);
        maxMinions += rule.setup?.minionDelta ?? 0;
      }
    }
    return { outsiders, minMinions, maxMinions };
  }

  private compositionOk(complete: boolean): boolean {
    const [tf, out, min, dem] = this.teamCount;
    const demons = this.composition[T_DEMON];
    const { outsiders, minMinions, maxMinions } = this.compositionTargets(complete);
    if (complete) {
      return dem === demons && min === minMinions && outsiders.has(out) && tf + out + min + dem === this.n;
    }
    let oMin = Infinity;
    let oMax = -Infinity;
    for (const x of outsiders) {
      oMin = Math.min(oMin, x);
      oMax = Math.max(oMax, x);
    }
    if (dem > demons || min > maxMinions || out > oMax) return false;
    const tfMax = this.n - demons - minMinions - oMin;
    const tfMin = this.n - demons - maxMinions - oMax;
    if (tf > tfMax) return false;
    const remaining = this.n - this.assignedCount;
    const needed =
      (demons - dem) + Math.max(0, minMinions - min) + Math.max(0, oMin - out) + Math.max(0, tfMin - tf);
    return needed <= remaining;
  }

  private corruptionCapacity(complete: boolean): number {
    let cap = 0;
    for (const r of this.corrupterRoles) {
      if (this.used[r] || (!complete && this.placeable(r))) cap += this.roles[r].rule.corruptionCapacity ?? 0;
    }
    return cap;
  }

  private vortoxState(complete: boolean): 'yes' | 'maybe' | 'no' {
    if (this.vortoxRole < 0) return 'no';
    if (this.used[this.vortoxRole]) return 'yes';
    return !complete && this.placeable(this.vortoxRole) ? 'maybe' : 'no';
  }

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------

  private staticDomains(active: Uint8Array, pin?: [number, number]): number[][] {
    const domains: number[][] = [];
    for (let p = 0; p < this.n; p++) {
      const d: number[] = [];
      for (let r = 0; r < this.roles.length; r++) {
        if (pin && pin[0] === p && pin[1] !== r) continue;
        let ok = true;
        for (const u of this.unary) {
          if (u.player === p && active[u.ev] && !u.allowed[r]) {
            ok = false;
            break;
          }
        }
        if (ok) d.push(r);
      }
      domains.push(d);
    }
    return domains;
  }

  private search(active: Uint8Array, pin?: [number, number]): SearchOutcome {
    const domains = this.staticDomains(active, pin);
    if (domains.some(d => d.length === 0)) return { kind: 'unsat' };
    for (const d of domains) {
      for (let i = d.length - 1; i > 0; i--) {
        const j = Math.floor(this.rng() * (i + 1));
        [d[i], d[j]] = [d[j], d[i]];
      }
    }

    // Seats sharing evidence (for the degree heuristic), and seats with no
    // evidence at all, which are interchangeable and can be filled in a
    // canonical order (symmetry breaking).
    this.links = Array.from({ length: this.n }, () => new Set<number>());
    const referenced = new Uint8Array(this.n);
    let wholeCircle = false;
    const link = (seats: number[]) => {
      for (const a of seats) {
        referenced[a] = 1;
        for (const b of seats) if (a !== b) this.links[a].add(b);
      }
    };
    for (const c of this.infos) {
      if (!active[c.ev]) continue;
      if (c.involved === null) wholeCircle = true;
      else link([c.source, ...c.involved]);
    }
    for (const g of this.globals) if (active[g.ev]) link(g.refs);
    this.freeSeats = [];
    this.isFree = new Uint8Array(this.n);
    for (let p = 0; p < this.n; p++) {
      if (!wholeCircle && !referenced[p] && domains[p].length === this.roles.length) {
        this.freeSeats.push(p);
        this.isFree[p] = 1;
      }
    }
    this.freeAssigned = 0;

    this.active = active;
    this.world = new Int16Array(this.n).fill(-1);
    this.used = new Uint8Array(this.roles.length);
    this.teamCount = [0, 0, 0, 0];
    this.assignedCount = 0;
    this.failing = new Map();
    this.curReg = new Array(this.n).fill(null);
    this.nodes = 0;
    this.searchBudget = Math.min(this.options.nodeBudget, Math.max(0, this.options.totalBudget - this.totalNodes));

    try {
      const found = this.dfs(domains);
      return found ? { kind: 'sat', world: this.world.slice(), free: [...this.freeSeats] } : { kind: 'unsat' };
    } catch (e) {
      if (e instanceof BudgetExceeded) return { kind: 'unknown' };
      throw e;
    } finally {
      this.totalNodes += this.nodes;
    }
  }

  private dfs(domains: number[][]): boolean {
    if (++this.nodes > this.searchBudget) throw new BudgetExceeded();
    if (this.assignedCount === this.n) return this.leafOk();

    // Constrained seats first: smallest remaining domain, then most links to assigned seats.
    let best = -1;
    let bestSize = Infinity;
    let bestLinks = -1;
    for (let p = 0; p < this.n; p++) {
      if (this.world[p] >= 0 || this.isFree[p]) continue;
      let size = 0;
      for (const r of domains[p]) if (!this.used[r]) size++;
      if (size > bestSize) continue;
      let linked = 0;
      for (const q of this.links[p]) if (this.world[q] >= 0) linked++;
      if (size < bestSize || linked > bestLinks) {
        best = p;
        bestSize = size;
        bestLinks = linked;
      }
    }

    // Interchangeable seats last, with strictly increasing role indexes.
    let minRole = 0;
    if (best < 0) {
      best = this.freeSeats[this.freeAssigned];
      if (this.freeAssigned > 0) minRole = this.world[this.freeSeats[this.freeAssigned - 1]] + 1;
    }
    if (bestSize === 0) return false;

    const free = this.isFree[best] === 1;
    for (const r of domains[best]) {
      if (this.used[r] || r < minRole) continue;
      const undo = this.assign(best, r);
      if (undo !== null) {
        if (free) this.freeAssigned++;
        if (this.dfs(domains)) return true;
        if (free) this.freeAssigned--;
        this.unassign(best, r, undo);
      }
    }
    return false;
  }

  /** Assigns and checks partial consistency. Returns an undo log, or null if inconsistent (already undone). */
  private assign(p: number, r: number): [number, number][] | null {
    this.world[p] = r;
    this.used[r] = 1;
    this.teamCount[this.roles[r].teamIdx]++;
    this.assignedCount++;
    const undo: [number, number][] = [];

    const fail = () => {
      this.unassign(p, r, undo);
      return null;
    };

    if (!this.compositionOk(false)) return fail();

    for (const gi of this.globalsBySeat[p]) {
      const g = this.globals[gi];
      if (this.active[g.ev] && !g.test(this.world, false)) return fail();
    }
    for (const gi of this.leafGlobals) {
      const g = this.globals[gi];
      if (this.active[g.ev] && !g.test(this.world, false)) return fail();
    }

    const vortox = this.vortoxState(false);
    for (const ci of this.infosBySeat[p]) {
      const c = this.infos[ci];
      if (!this.active[c.ev] || this.world[c.source] < 0) continue;
      if (c.involved!.some(s => this.world[s] < 0)) continue;
      const verdict = this.judge(c, this.hasRedHerringRole(c) ? 'any' : -1, vortox);
      if (verdict === 'impossible') return fail();
      if (verdict === 'needs-corruption') {
        let byNight = this.failing.get(c.night);
        if (!byNight) this.failing.set(c.night, (byNight = new Map()));
        byNight.set(c.source, (byNight.get(c.source) ?? 0) + 1);
        undo.push([c.night, c.source]);
      }
    }

    if (!this.corruptionFits(vortox)) return fail();
    return undo;
  }

  private unassign(p: number, r: number, undo: [number, number][]): void {
    for (const [night, source] of undo) {
      const byNight = this.failing.get(night)!;
      const left = byNight.get(source)! - 1;
      if (left === 0) byNight.delete(source);
      else byNight.set(source, left);
    }
    undo.length = 0;
    this.world[p] = -1;
    this.used[r] = 0;
    this.teamCount[this.roles[r].teamIdx]--;
    this.assignedCount--;
    for (let i = 0; i < this.n; i++) if (this.world[i] < 0) this.curReg[i] = null;
  }

  /**
   * Decides what an info constraint requires in the current world.
   * 'ok': satisfied (or the source does not genuinely have the ability).
   * 'needs-corruption': only consistent if the source is drunk/poisoned that night.
   * 'impossible': cannot be satisfied at all.
   */
  private judge(
    c: InfoConstraint,
    redHerring: number | 'any',
    vortox: 'yes' | 'maybe' | 'no'
  ): 'ok' | 'needs-corruption' | 'impossible' {
    const genuine = this.roles[this.world[c.source]].id === c.infoRole;
    if (!genuine) return c.isPublic ? 'impossible' : 'ok';
    const { canTrue, canFalse } = this.outcomes(c, redHerring);
    if (c.isPublic) return canTrue ? 'ok' : 'impossible';
    if (c.vortoxApplies && vortox === 'maybe') return 'ok';
    const expectTrue = !(c.vortoxApplies && vortox === 'yes');
    return (expectTrue ? canTrue : canFalse) ? 'ok' : 'needs-corruption';
  }

  /** Bounds-based check for whole-circle info such as the Chef. */
  private wholeCircleFailures(vortox: 'yes' | 'maybe' | 'no'): Map<number, Set<number>> {
    const extra = new Map<number, Set<number>>();
    if (this.wholeCircleInfos.length === 0) return extra;
    this.partialAlignments = [];
    for (let s = 0; s < this.n; s++) {
      const r = this.world[s];
      this.partialAlignments.push(
        r < 0 ? new Set<Alignment>(['good', 'evil']) : new Set(this.roles[r].regs.map(g => g.alignment))
      );
    }
    for (const ci of this.wholeCircleInfos) {
      const c = this.infos[ci];
      if (!this.active[c.ev] || !c.spec.countRange || this.world[c.source] < 0) continue;
      if (this.roles[this.world[c.source]].id !== c.infoRole) continue;
      if (c.vortoxApplies && vortox === 'maybe') continue;
      const [min, max] = c.spec.countRange(c.payload, this.partialView);
      const value = c.payload.count ?? -1;
      const canTrue = value >= min && value <= max;
      const canFalse = !(min === max && min === value);
      const expectTrue = !(c.vortoxApplies && vortox === 'yes');
      if (!(expectTrue ? canTrue : canFalse)) {
        if (!extra.has(c.night)) extra.set(c.night, new Set());
        extra.get(c.night)!.add(c.source);
      }
    }
    return extra;
  }

  private corruptionFits(vortox: 'yes' | 'maybe' | 'no'): boolean {
    const cap = this.corruptionCapacity(false);
    const extra = this.wholeCircleFailures(vortox);
    const nights = new Set([...this.failing.keys(), ...extra.keys()]);
    for (const night of nights) {
      const sources = new Set([...(this.failing.get(night)?.keys() ?? []), ...(extra.get(night) ?? [])]);
      if (sources.size > cap) return false;
    }
    return true;
  }

  /** Exact check of a complete world. */
  private leafOk(): boolean {
    if (!this.compositionOk(true)) return false;
    for (const r of this.requiresRoles) {
      if (!this.used[r]) continue;
      for (const req of this.roles[r].rule.setup!.requiresInPlay!) {
        const reqIdx = this.roleIndex.get(req);
        if (reqIdx === undefined || !this.used[reqIdx]) return false;
      }
    }
    for (const g of this.globals) {
      if (this.active[g.ev] && !g.test(this.world, true)) return false;
    }

    const vortox = this.vortoxState(true);
    const cap = this.corruptionCapacity(true);
    const activeInfos = this.infos.filter(c => this.active[c.ev]);
    const needsHerring = activeInfos.some(
      c => this.hasRedHerringRole(c) && this.roles[this.world[c.source]].id === c.infoRole
    );
    const herrings = [-1];
    if (needsHerring) {
      for (let s = 0; s < this.n; s++) if (this.roles[this.world[s]].alignment === 'good') herrings.push(s);
    }

    for (const rh of herrings) {
      const failing = new Map<number, Set<number>>();
      let ok = true;
      for (const c of activeInfos) {
        const verdict = this.judge(c, rh, vortox);
        if (verdict === 'impossible') {
          ok = false;
          break;
        }
        if (verdict === 'needs-corruption') {
          if (!failing.has(c.night)) failing.set(c.night, new Set());
          failing.get(c.night)!.add(c.source);
        }
      }
      if (ok && [...failing.values()].every(s => s.size <= cap)) return true;
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  private allActive(): Uint8Array {
    return new Uint8Array(this.evidence.length).fill(1);
  }

  solve(): DeductionResult {
    const R = this.roles.length;
    const empty: DeductionResult = {
      consistent: true,
      possibleRoles: [],
      alignments: [],
      contradictions: [],
      ignoredEvidence: [],
      warnings: [...this.warnings],
      incomplete: false
    };
    if (this.n === 0 || R === 0) return empty;
    if (this.n < 5) {
      empty.warnings.push('Deduction needs at least 5 players.');
      return empty;
    }

    const active = this.allActive();
    const possible = Array.from({ length: this.n }, () => new Uint8Array(R));
    const unproven = Array.from({ length: this.n }, () => new Uint8Array(R));
    const markWorld = (out: { world: Int16Array; free: number[] }) => {
      out.world.forEach((r, p) => (possible[p][r] = 1));
      // Interchangeable seats could have had any of each other's roles.
      for (const p of out.free) for (const q of out.free) possible[p][out.world[q]] = 1;
    };
    let incomplete = false;
    const contradictions: DeductionResult['contradictions'] = [];
    const ignoredEvidence: EvidenceRef[] = [];

    // On a contradiction, set aside the most recent piece of evidence in a
    // minimal conflicting set and keep deducing from the rest, so one
    // mistake does not wipe out every deduction.
    let base = this.search(active);
    for (let round = 0; base.kind === 'unsat' && round < 5; round++) {
      const core = this.minimalConflictIndexes(active);
      const refs = core.map(i => ({ id: this.evidence[i].id, label: this.evidence[i].label }));
      contradictions.push({
        description: core.length
          ? 'No starting grimoire fits all of this evidence together: ' + refs.map(e => e.label).join('; ')
          : 'No starting grimoire fits the setup rules for this role pool and player count.',
        events: refs.map(e => e.id)
      });
      if (core.length === 0) break;
      const drop = core[core.length - 1];
      active[drop] = 0;
      ignoredEvidence.push(refs[refs.length - 1]);
      base = this.search(active);
    }
    if (base.kind === 'sat') markWorld(base);
    if (base.kind === 'unknown') incomplete = true;

    if (base.kind !== 'unsat') {
      const domains = this.staticDomains(active);
      for (let p = 0; p < this.n; p++) {
        for (const r of domains[p]) {
          if (possible[p][r]) continue;
          const out = this.search(active, [p, r]);
          if (out.kind === 'sat') markWorld(out);
          else if (out.kind === 'unknown') {
            possible[p][r] = 1;
            unproven[p][r] = 1;
            incomplete = true;
          }
        }
      }
    }

    const possibleRoles: RolePossibility[] = [];
    const alignments: PlayerAlignment[] = [];
    for (let p = 0; p < this.n; p++) {
      const playerId = this.seatIds[p];
      const count = possible[p].reduce((a, b) => a + b, 0);
      let canBeGood = false;
      let canBeEvil = false;
      for (let r = 0; r < R; r++) {
        const role = this.roles[r];
        if (possible[p][r]) {
          if (role.alignment === 'good') canBeGood = true;
          else canBeEvil = true;
          possibleRoles.push({
            playerId,
            roleId: role.id,
            status: count === 1 && !unproven[p][r] ? 'confirmed' : 'possible',
            reason: unproven[p][r] ? 'Not disproven (search limit reached)' : undefined
          });
        } else {
          possibleRoles.push({
            playerId,
            roleId: role.id,
            status: 'impossible',
            reason: this.directReason(p, r, active) ?? 'Ruled out by the combined evidence'
          });
        }
      }
      alignments.push({ playerId, canBeGood, canBeEvil });
    }

    return {
      consistent: contradictions.length === 0,
      possibleRoles,
      alignments,
      contradictions,
      ignoredEvidence,
      warnings: [...this.warnings],
      incomplete
    };
  }

  private directReason(p: number, r: number, active: Uint8Array): string | null {
    for (const u of this.unary) if (u.player === p && active[u.ev] && !u.allowed[r]) return u.reason;
    return null;
  }

  /** Deletion-based minimal unsatisfiable subset of evidence, as evidence indexes in log order. */
  private minimalConflictIndexes(start: Uint8Array, pin?: [number, number]): number[] {
    const active = start.slice();
    for (let e = 0; e < active.length; e++) {
      if (!active[e]) continue;
      active[e] = 0;
      const out = this.search(active, pin);
      if (out.kind !== 'unsat') active[e] = 1; // e is needed for the conflict
    }
    return [...active.keys()].filter(i => active[i]);
  }

  private minimalConflict(start: Uint8Array, pin?: [number, number]): EvidenceRef[] {
    return this.minimalConflictIndexes(start, pin).map(i => ({ id: this.evidence[i].id, label: this.evidence[i].label }));
  }

  /** Explains why `playerId` can or cannot be `roleId`. */
  explain(playerId: string, roleId: string): Explanation {
    const p = this.seatIndex.get(playerId);
    const r = this.roleIndex.get(normalizeRoleId(roleId));
    const who = this.name(playerId);
    const what = this.roleName(roleId);
    if (p === undefined || r === undefined) {
      return { playerId, roleId, status: 'impossible', summary: `${what} is not in the role pool.`, evidence: [] };
    }
    const active = this.allActive();
    const out = this.search(active, [p, r]);
    if (out.kind === 'sat') {
      const corrupt = this.describeWorldNeeds(out.world);
      return {
        playerId,
        roleId,
        status: 'possible',
        summary: `${who} could be the ${what}.${corrupt}`,
        evidence: []
      };
    }
    if (out.kind === 'unknown') {
      return {
        playerId,
        roleId,
        status: 'possible',
        summary: `Not disproven: the search limit was reached while checking ${who} as the ${what}.`,
        evidence: []
      };
    }
    const core = this.minimalConflict(active, [p, r]);
    const summary = core.length
      ? `${who} cannot be the ${what}: that contradicts ${core.length === 1 ? 'this evidence' : 'these pieces of evidence taken together'}.`
      : `${who} cannot be the ${what}: no legal setup for this player count and role pool allows it.`;
    return { playerId, roleId, status: 'impossible', summary, evidence: core };
  }

  /** One-line hint about what an example world needed (e.g. a poisoner). */
  private describeWorldNeeds(world: Int16Array): string {
    this.world = world;
    this.used = new Uint8Array(this.roles.length);
    world.forEach(r => (this.used[r] = 1));
    this.assignedCount = this.n;
    const vortox = this.vortoxState(true);
    const needing = new Set<number>();
    for (const c of this.infos) {
      if (this.judge(c, this.hasRedHerringRole(c) ? 'any' : -1, vortox) === 'needs-corruption') needing.add(c.source);
    }
    if (needing.size === 0) return '';
    const names = [...needing].map(s => this.name(this.seatIds[s])).join(', ');
    return ` For example, if ${names} ${needing.size === 1 ? 'was' : 'were'} drunk or poisoned.`;
  }
}

/** Convenience wrapper. */
export function solve(input: SolverInput): DeductionResult {
  return new DeductionEngine(input).solve();
}
