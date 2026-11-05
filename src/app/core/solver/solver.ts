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
  /** How many seats may hold this character (Witch Hunt's Witches, Village Idiots). */
  maxCopies: number;
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
  /** The ability has a red herring (Fortune Teller); set when indexing. */
  hasRedHerring?: boolean;
}

interface GlobalConstraint {
  ev: number;
  /** Seats whose role this rule depends on (used to find interchangeable seats). */
  refs: number[];
  /** Seats that trigger a partial check when assigned; null = check at leaves only. */
  watch: number[] | null;
  /** Roles that also trigger a partial check when placed on any seat. */
  watchRoles?: number[];
  /** With complete=false, return false only if definitely violated. */
  test(world: Int16Array, complete: boolean): boolean;
}

/** Allowed team sizes given the setup modifiers that are (or may still be) in play. */
interface CompositionTargets {
  outsiders: Set<number>;
  minOutsiders: number;
  maxOutsiders: number;
  minMinions: number;
  maxMinions: number;
}

type SearchOutcome = { kind: 'sat'; world: Int16Array; free: number[] } | { kind: 'unsat' } | { kind: 'unknown' };

class BudgetExceeded extends Error {}

const EITHER_ALIGNMENT: ReadonlySet<Alignment> = new Set<Alignment>(['good', 'evil']);

const BABYSITTER: Registration = { alignment: 'evil', team: 'demon', roleId: 'lilmonsta' };

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
  private globalsByRole: number[][] = [];
  private wholeCircleInfos: number[] = [];
  private leafGlobals: number[] = [];

  // Role groups
  private setupModifierRoles: number[] = [];
  private corrupterRoles: number[] = [];
  private extraCopyDrunkRoles: number[] = [];
  private requiresRoles: number[] = [];
  private vortoxRole = -1;
  /** Lycanthrope: grants a Faux Paw. */
  private fauxPawRole = -1;
  /** Fibbin (Fabled): extra false information allowed across the game. */
  private gameWideFalseInfo = 0;
  /** Lil' Monsta: a Demon that no player holds. */
  private unseatedDemon = -1;
  private maxMinionsEver = 0;
  private ambiguousRole: boolean[] = [];
  private readonly targetsCache = new Map<number, CompositionTargets>();
  /** roles[r].maxCopies, as a typed array for the hot path. */
  private maxCopies = new Uint8Array(0);

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
  /** While filling interchangeable seats, roles below this index can no longer be placed. */
  private freeFloor = -1;

  // Evaluation scratch state for InfoView
  private curReg: (Registration | null)[] = [];
  private curAlive: boolean[] = [];
  private curRedHerring = -1;
  /** Lycanthrope's Faux Paw: a good player who registers as evil. */
  private curFauxPaw = -1;
  private readonly view: InfoView;
  private readonly partialView: PartialInfoView;
  private partialAlignments: ReadonlySet<Alignment>[] = [];
  /** The alignments each role can register as. */
  private roleAlignments: ReadonlySet<Alignment>[] = [];

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
      alignment: id =>
        engine.curFauxPaw >= 0 && engine.seatIndex.get(id) === engine.curFauxPaw ? 'evil' : engine.regOf(id).alignment,
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
    this.addPublicInfoDomains(); // needs the views above
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
      // Fabled such as the Fibbin change the rules without occupying a seat.
      this.gameWideFalseInfo += getRoleRule(id).gameWideFalseInfo ?? 0;
      if (!SEAT_TEAMS.includes(team)) continue; // Travellers, Fabled and Loric are not seat roles
      const info: RoleInfo = {
        id,
        name: registered?.name ?? char.name,
        team,
        teamIdx: TEAM_INDEX[team]!,
        alignment: teamAlignment(team),
        regs: registrationsFor(id, team),
        rule: getRoleRule(id),
        maxCopies: Math.max(1, char.maxCopies ?? getRoleRule(id).maxCopies ?? 1)
      };
      this.roleIndex.set(id, this.roles.length);
      this.roles.push(info);
    }

    this.maxCopies = Uint8Array.from(this.roles, r => r.maxCopies);
    this.roles.forEach((r, i) => {
      if (r.rule.setup?.outsiderDelta || r.rule.setup?.anyOutsiderCount || r.rule.setup?.minionDelta) {
        this.setupModifierRoles.push(i);
      }
      if (r.rule.setup?.requiresInPlay) this.requiresRoles.push(i);
      if (r.rule.corruptionCapacity) this.corrupterRoles.push(i);
      if (r.rule.extraCopiesDrunk && r.maxCopies > 1) this.extraCopyDrunkRoles.push(i);
      if (r.rule.falsifiesTownsfolkInfo) this.vortoxRole = i;
      if (r.rule.unseated && r.teamIdx === T_DEMON) this.unseatedDemon = i;
      if (r.rule.grantsFauxPaw) this.fauxPawRole = i;
      this.ambiguousRole[i] = r.regs.length > 1;
      this.roleAlignments[i] = new Set(r.regs.map(g => g.alignment));
    });

    this.maxMinionsEver =
      this.composition[T_MINION] +
      (this.unseatedDemon >= 0 ? 1 : 0) +
      this.setupModifierRoles.reduce((sum, r) => sum + Math.max(0, this.roles[r].rule.setup?.minionDelta ?? 0), 0);

    const [, , minions] = this.composition;
    const count = (t: number) =>
      this.roles.filter(r => r.teamIdx === t && !r.rule.unseated).reduce((n, r) => n + r.maxCopies, 0);
    if (count(T_DEMON) === 0 && this.unseatedDemon < 0) this.warnings.push('The role pool has no Demon.');
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

  private unseatedDemonInPool(): boolean {
    return this.roles.some(r => r.rule.unseated && r.team === 'demon');
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
      // Can only start failing when this seat becomes the Drunk or the believed role is placed.
      watch: [seat],
      watchRoles: [believedIdx],
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
        this.maskWhere(
          r => r.team === 'demon' || r.id === 'saint' || (r.team === 'minion' && this.unseatedDemonInPool())
        ),
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

  /**
   * A public outcome (a Slayer kill, a Virgin execution) needs its source to
   * genuinely hold the ability, and for a single target, that target to
   * register suitably. `judge` already enforces both, but only once the seats
   * are assigned, in every search. Restricting the seats' domains up front
   * removes the same worlds before the search starts.
   */
  private addPublicInfoDomains(): void {
    // With these in play a registration depends on the rest of the grimoire.
    if (this.unseatedDemon >= 0 || this.fauxPawRole >= 0) return;
    const R = this.roles.length;
    for (const c of this.infos) {
      if (!c.isPublic || c.alwaysFalse) continue;
      const label = this.evidence[c.ev].label;
      const genuine = this.roleIndex.get(c.infoRole);
      if (genuine === undefined) {
        this.addUnary(c.ev, c.source, new Uint8Array(R), label);
        continue;
      }
      if (c.involved?.length !== 1 || c.hasRedHerring) {
        this.addUnary(c.ev, c.source, this.maskWhere((_, r) => r === genuine), label);
        continue;
      }
      const target = c.involved[0];
      this.world = new Int16Array(this.n).fill(-1);
      this.curReg = new Array(this.n).fill(null);
      this.world[c.source] = genuine;
      const fits = (r: number): boolean => {
        this.world[target] = r;
        try {
          return this.outcomes(c, -1).canTrue;
        } catch {
          return true; // the check needed more of the grimoire; leave it to the search
        }
      };
      if (target === c.source) {
        this.addUnary(c.ev, c.source, this.maskWhere((_, r) => r === genuine && fits(r)), label);
      } else {
        this.addUnary(c.ev, c.source, this.maskWhere((_, r) => r === genuine), label);
        this.addUnary(c.ev, target, this.maskWhere((_, r) => fits(r)), label);
      }
    }
  }

  private indexConstraints(): void {
    this.infosBySeat = Array.from({ length: this.n }, () => []);
    this.globalsBySeat = Array.from({ length: this.n }, () => []);
    this.infos.forEach((c, i) => {
      c.hasRedHerring = getRoleRule(c.infoRole).hasRedHerring === true;
      if (c.involved === null) {
        this.wholeCircleInfos.push(i);
        return;
      }
      for (const s of new Set([c.source, ...c.involved])) this.infosBySeat[s].push(i);
    });
    this.globalsByRole = Array.from({ length: this.roles.length }, () => []);
    this.globals.forEach((g, i) => {
      if (g.watch === null) this.leafGlobals.push(i);
      else for (const s of g.watch) this.globalsBySeat[s].push(i);
      for (const r of g.watchRoles ?? []) this.globalsByRole[r].push(i);
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
   * redHerring / fauxPaw: a seat index, -1 for none, or 'any' to let any good involved player be it.
   */
  private outcomes(
    c: InfoConstraint,
    redHerring: number | 'any',
    fauxPaw: number | 'any' = -1
  ): { canTrue: boolean; canFalse: boolean } {
    if (c.alwaysFalse) return { canTrue: false, canFalse: true };
    const seats = c.involved ?? this.seatIds.map((_, i) => i);
    this.curAlive = c.alive;
    const ambiguous: number[] = [];
    // With Lil' Monsta in play, the babysitting Minion "is the Demon".
    const babysitter = this.unseatedDemon >= 0 && this.teamCount[T_DEMON] === 0;
    const regsOf = (s: number): readonly Registration[] => {
      const role = this.roles[this.world[s]];
      return babysitter && role.teamIdx === T_MINION ? [...role.regs, BABYSITTER] : role.regs;
    };
    for (const s of seats) {
      const regs = regsOf(s);
      this.curReg[s] = regs[0];
      if (regs.length > 1) ambiguous.push(s);
    }
    const goodSeats = () => seats.filter(s => this.roles[this.world[s]].alignment === 'good');
    const herrings: number[] = redHerring === 'any' ? [-1, ...goodSeats()] : [redHerring];
    const paws: number[] = fauxPaw === 'any' ? [-1, ...goodSeats()] : [fauxPaw];

    let canTrue = false;
    let canFalse = false;
    const recurse = (k: number): boolean => {
      if (k === ambiguous.length) {
        for (const rh of herrings) {
          for (const fp of paws) {
            this.curRedHerring = rh;
            this.curFauxPaw = fp;
            if (c.spec.check(c.payload, this.seatIds[c.source], this.view)) canTrue = true;
            else canFalse = true;
            if (canTrue && canFalse) return true;
          }
        }
        return false;
      }
      const s = ambiguous[k];
      for (const reg of regsOf(s)) {
        this.curReg[s] = reg;
        if (recurse(k + 1)) return true;
      }
      return false;
    };
    recurse(0);
    this.curRedHerring = -1;
    this.curFauxPaw = -1;
    return { canTrue, canFalse };
  }

  private hasRedHerringRole(c: InfoConstraint): boolean {
    return c.hasRedHerring === true;
  }

  /** During search: could a Faux Paw exist in this world? */
  private fauxPawMode(complete: boolean): 'any' | -1 {
    if (this.fauxPawRole < 0) return -1;
    return this.used[this.fauxPawRole] || (!complete && this.placeable(this.fauxPawRole)) ? 'any' : -1;
  }

  // ---------------------------------------------------------------------------
  // Composition
  // ---------------------------------------------------------------------------

  /** All copies of role r are already seated. */
  private full(r: number): boolean {
    return this.used[r] >= this.maxCopies[r];
  }

  /** Can role r still appear given the current partial assignment? */
  private placeable(r: number): boolean {
    if (this.full(r) || this.assignedCount >= this.n || r < this.freeFloor) return false;
    const t = this.roles[r].teamIdx;
    if (t === T_DEMON) return this.teamCount[T_DEMON] < this.composition[T_DEMON];
    if (t === T_MINION) return this.teamCount[T_MINION] < this.maxMinionsEver;
    return true;
  }

  /**
   * Allowed outsider counts and minion count range given mandatory and optional modifiers.
   * Called at every search node, so results are cached: they depend only on whether
   * each setup modifier is placed, still placeable, or neither.
   */
  private compositionTargets(complete: boolean): CompositionTargets {
    let key = complete ? 1 : 0;
    for (const r of this.setupModifierRoles) {
      key = key * 3 + (this.used[r] ? 2 : !complete && this.placeable(r) ? 1 : 0);
    }
    let targets = this.targetsCache.get(key);
    if (!targets) {
      targets = this.computeCompositionTargets(complete);
      this.targetsCache.set(key, targets);
    }
    return targets;
  }

  private computeCompositionTargets(complete: boolean): CompositionTargets {
    // Track the unclamped sum of Outsider changes and clamp at zero once at the
    // end. Clamping after each modifier would depend on pool order: with a base
    // of 0, Hermit (−1) then Baron (+2) must give 1, not 2.
    let sums = new Set([0]);
    let anyCount = false;
    let minMinions = this.composition[T_MINION];
    let maxMinions = minMinions;
    const combine = (set: Set<number>, rule: RoleRule): Set<number> => {
      const next = new Set<number>();
      for (const x of set) for (const d of rule.setup?.outsiderDelta ?? [0]) next.add(x + d);
      return next;
    };
    for (const r of this.setupModifierRoles) {
      const rule = this.roles[r].rule;
      if (this.used[r]) {
        if (rule.setup?.anyOutsiderCount) anyCount = true;
        else sums = combine(sums, rule);
        minMinions += rule.setup?.minionDelta ?? 0;
        maxMinions += rule.setup?.minionDelta ?? 0;
      } else if (!complete && this.placeable(r)) {
        // Might still be placed: widen the targets (a relaxation for pruning).
        if (rule.setup?.anyOutsiderCount) anyCount = true;
        else for (const x of combine(sums, rule)) sums.add(x);
        maxMinions += rule.setup?.minionDelta ?? 0;
      }
    }
    const outsiders = new Set<number>();
    if (anyCount) for (let x = 0; x <= this.n; x++) outsiders.add(x);
    else for (const d of sums) outsiders.add(Math.max(0, this.composition[T_OUTSIDER] + d));
    return { outsiders, minOutsiders: Math.min(...outsiders), maxOutsiders: Math.max(...outsiders), minMinions, maxMinions };
  }

  private compositionOk(complete: boolean): boolean {
    const [tf, out, min, dem] = this.teamCount;
    const demons = this.composition[T_DEMON];
    const { outsiders, minOutsiders: oMin, maxOutsiders: oMax, minMinions, maxMinions } = this.compositionTargets(complete);
    // Lil' Monsta: no Demon seat, one extra Minion.
    const unseated = this.unseatedDemon >= 0;
    if (complete) {
      if (tf + out + min + dem !== this.n || !outsiders.has(out)) return false;
      if (dem === demons) return min === minMinions;
      return unseated && dem === 0 && min === minMinions + 1;
    }
    if (dem > demons || min > maxMinions + (unseated && dem === 0 ? 1 : 0) || out > oMax) return false;
    // Either layout has the same number of evil seats, so Townsfolk bounds are unchanged.
    const tfMax = this.n - demons - minMinions - oMin;
    const tfMin = this.n - demons - maxMinions - oMax;
    if (tf > tfMax) return false;
    const remaining = this.n - this.assignedCount;
    const evilNeeded = Math.max(0, demons + minMinions - dem - min);
    const needed = (unseated ? evilNeeded : demons - dem + Math.max(0, minMinions - min)) +
      Math.max(0, oMin - out) + Math.max(0, tfMin - tf);
    if (needed > remaining) return false;
    return this.freeCapacityOk([
      Math.max(0, tfMin - tf),
      Math.max(0, oMin - out),
      unseated ? 0 : Math.max(0, minMinions - min),
      unseated ? 0 : demons - dem
    ]);
  }

  /**
   * Village Idiot: with 2+ copies in play, one of them is drunk all game, so
   * false info from a single Village Idiot needs no other explanation.
   */
  private drunkCopyRole(c: InfoConstraint, complete: boolean): number {
    const r = this.world[c.source];
    if (r < 0 || !this.extraCopyDrunkRoles.includes(r)) return -1;
    if (this.used[r] >= 2 || (!complete && this.placeable(r))) return r;
    return -1;
  }

  /** "Requires X in play" (Huntsman → Damsel) is still achievable. */
  private requirementsPlaceable(): boolean {
    let targets: CompositionTargets | null = null;
    for (const r of this.requiresRoles) {
      if (!this.used[r]) continue;
      for (const req of this.roles[r].rule.setup!.requiresInPlay!) {
        const q = this.roleIndex.get(req);
        if (q === undefined) return false;
        if (this.used[q]) continue;
        if (!this.placeable(q)) return false;
        // There must also be room on the required role's team.
        targets ??= this.compositionTargets(false);
        const t = this.roles[q].teamIdx;
        if (t === T_OUTSIDER && this.teamCount[T_OUTSIDER] >= targets.maxOutsiders) return false;
        if (t === T_MINION && this.teamCount[T_MINION] >= targets.maxMinions + (this.unseatedDemon >= 0 ? 1 : 0)) return false;
      }
    }
    return true;
  }

  /**
   * While filling interchangeable seats in canonical order, only roles at or
   * above the floor remain. Checks each team can still reach its minimum.
   */
  private freeCapacityOk(needed: readonly number[]): boolean {
    if (this.freeFloor < 0) return true;
    const avail = [0, 0, 0, 0];
    for (let r = this.freeFloor; r < this.roles.length; r++) {
      const role = this.roles[r];
      if (role.rule.unseated) continue;
      avail[role.teamIdx] += role.maxCopies - this.used[r];
    }
    return needed.every((need, t) => need <= avail[t]);
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
        if (this.roles[r].rule.unseated) continue;
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
    this.freeFloor = -1;

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
      for (const r of domains[p]) if (!this.full(r)) size++;
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
      // Non-decreasing (not strictly increasing) so duplicated characters can repeat.
      if (this.freeAssigned > 0) minRole = this.world[this.freeSeats[this.freeAssigned - 1]];
    }
    if (bestSize === 0) return false;

    const free = this.isFree[best] === 1;
    const prevFloor = this.freeFloor;
    for (const r of domains[best]) {
      if (this.full(r) || r < minRole) continue;
      if (free) this.freeFloor = r;
      const undo = this.assign(best, r);
      if (undo !== null) {
        if (free) this.freeAssigned++;
        if (this.dfs(domains)) return true;
        if (free) this.freeAssigned--;
        this.unassign(best, r, undo);
      }
    }
    this.freeFloor = prevFloor;
    return false;
  }

  /** Assigns and checks partial consistency. Returns an undo log, or null if inconsistent (already undone). */
  private assign(p: number, r: number): [number, number][] | null {
    this.world[p] = r;
    this.used[r]++;
    this.teamCount[this.roles[r].teamIdx]++;
    this.assignedCount++;
    const undo: [number, number][] = [];

    const fail = () => {
      this.unassign(p, r, undo);
      return null;
    };

    if (!this.compositionOk(false)) return fail();
    if (!this.requirementsPlaceable()) return fail();

    for (const gi of this.globalsBySeat[p]) {
      const g = this.globals[gi];
      if (this.active[g.ev] && !g.test(this.world, false)) return fail();
    }
    for (const gi of this.globalsByRole[r]) {
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
      const verdict = this.judge(c, this.hasRedHerringRole(c) ? 'any' : -1, vortox, this.fauxPawMode(false));
      if (verdict === 'impossible') return fail();
      if (verdict === 'needs-corruption' && this.drunkCopyRole(c, false) >= 0) continue;
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
    this.world[p] = -1;
    this.used[r]--;
    this.teamCount[this.roles[r].teamIdx]--;
    this.assignedCount--;
    this.curReg[p] = null;
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
    vortox: 'yes' | 'maybe' | 'no',
    fauxPaw: number | 'any' = -1
  ): 'ok' | 'needs-corruption' | 'impossible' {
    const genuine = this.roles[this.world[c.source]].id === c.infoRole;
    if (!genuine) return c.isPublic ? 'impossible' : 'ok';
    const { canTrue, canFalse } = this.outcomes(c, redHerring, fauxPaw);
    if (c.isPublic) return canTrue ? 'ok' : 'impossible';
    if (c.vortoxApplies && vortox === 'maybe') return 'ok';
    const expectTrue = !(c.vortoxApplies && vortox === 'yes');
    return (expectTrue ? canTrue : canFalse) ? 'ok' : 'needs-corruption';
  }

  /** Bounds-based check for whole-circle info such as the Chef. */
  private wholeCircleFailures(vortox: 'yes' | 'maybe' | 'no'): Map<number, Set<number>> {
    const extra = new Map<number, Set<number>>();
    let viewReady = false;
    for (const ci of this.wholeCircleInfos) {
      const c = this.infos[ci];
      if (!this.active[c.ev] || !c.spec.countRange || this.world[c.source] < 0) continue;
      if (this.roles[this.world[c.source]].id !== c.infoRole) continue;
      if (c.vortoxApplies && vortox === 'maybe') continue;
      if (!viewReady) {
        const pawPossible = this.fauxPawMode(false) === 'any';
        for (let s = 0; s < this.n; s++) {
          const r = this.world[s];
          this.partialAlignments[s] = r < 0 || pawPossible ? EITHER_ALIGNMENT : this.roleAlignments[r];
        }
        viewReady = true;
      }
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
    if (extra.size === 0) {
      // Common case: no allocation. Each night's map holds its distinct false sources.
      let excess = 0;
      for (const sources of this.failing.values()) excess += Math.max(0, sources.size - cap);
      return excess <= this.gameWideFalseInfo;
    }
    const nights = new Set([...this.failing.keys(), ...extra.keys()]);
    const sizes: number[] = [];
    for (const night of nights) {
      const sources = new Set([...(this.failing.get(night)?.keys() ?? []), ...(extra.get(night) ?? [])]);
      sizes.push(sources.size);
    }
    return this.withinCorruption(sizes, cap);
  }

  /**
   * Each night allows `cap` false sources; the Fibbin allows a few extra
   * across the whole game.
   */
  private withinCorruption(perNight: number[], cap: number): boolean {
    let excess = 0;
    for (const size of perNight) excess += Math.max(0, size - cap);
    return excess <= this.gameWideFalseInfo;
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

    const paws = [-1];
    if (this.fauxPawRole >= 0 && this.used[this.fauxPawRole]) {
      for (let s = 0; s < this.n; s++) if (this.roles[this.world[s]].alignment === 'good') paws.push(s);
    }

    for (const rh of herrings) for (const fp of paws) {
      const failing = new Map<number, Set<number>>();
      const add = (night: number, source: number) => {
        if (!failing.has(night)) failing.set(night, new Set());
        failing.get(night)!.add(source);
      };
      const drunkCopyFails: InfoConstraint[] = [];
      let ok = true;
      for (const c of activeInfos) {
        const verdict = this.judge(c, rh, vortox, fp);
        if (verdict === 'impossible') {
          ok = false;
          break;
        }
        if (verdict !== 'needs-corruption') continue;
        if (this.drunkCopyRole(c, true) >= 0) drunkCopyFails.push(c);
        else add(c.night, c.source);
      }
      if (ok && this.drunkCopyChoiceFits(failing, drunkCopyFails, cap)) return true;
    }
    return false;
  }

  /**
   * Village Idiot: with 2+ copies in play, exactly one copy is drunk all game
   * and its false info is free; false info from any other copy needs
   * poisoning. Any copy may be the drunk one, so try each copy that gave
   * false info (per role that has drunk extra copies).
   */
  private drunkCopyChoiceFits(
    failing: Map<number, Set<number>>,
    drunkCopyFails: InfoConstraint[],
    cap: number
  ): boolean {
    const byRole = new Map<number, number[]>();
    for (const c of drunkCopyFails) {
      const r = this.world[c.source];
      const sources = byRole.get(r) ?? [];
      if (!sources.includes(c.source)) sources.push(c.source);
      byRole.set(r, sources);
    }
    const groups = [...byRole.values()];
    const choose = (k: number, freed: Set<number>): boolean => {
      if (k === groups.length) {
        const sizes = new Map<number, Set<number>>();
        for (const [night, sources] of failing) sizes.set(night, new Set(sources));
        for (const c of drunkCopyFails) {
          if (freed.has(c.source)) continue;
          if (!sizes.has(c.night)) sizes.set(c.night, new Set());
          sizes.get(c.night)!.add(c.source);
        }
        return this.withinCorruption([...sizes.values()].map(s => s.size), cap);
      }
      return groups[k].some(source => choose(k + 1, new Set([...freed, source])));
    };
    return choose(0, new Set());
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
    let foundWorld = base.kind === 'sat';
    if (base.kind === 'sat') markWorld(base);

    if (base.kind !== 'unsat') {
      const domains = this.staticDomains(active);
      for (let p = 0; p < this.n; p++) {
        for (const r of domains[p]) {
          if (possible[p][r]) continue;
          const out = this.search(active, [p, r]);
          if (out.kind === 'sat') {
            markWorld(out);
            foundWorld = true;
          } else if (out.kind === 'unknown') {
            possible[p][r] = 1;
            unproven[p][r] = 1;
            incomplete = true;
          }
        }
      }
      // If the first search gave up but a pinned one found a world, the
      // evidence is consistent and the pinned searches settled every role.
      if (!foundWorld) incomplete = true;
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
        if (role.rule.unseated) continue;
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

  /**
   * Deletion-based minimal unsatisfiable subset of evidence, as evidence indexes in log order.
   *
   * Plain deletion drops each piece of evidence in log order if the rest is
   * still unsatisfiable. That costs one full unsatisfiability proof per piece,
   * and proofs are the expensive searches. Instead, try dropping a whole
   * chunk at once: if the rest is still unsatisfiable, then (because removing
   * evidence never removes worlds) deletion would have dropped every piece in
   * the chunk, so one proof covers them all. Otherwise split the chunk and
   * recurse in log order. The result is the same subset plain deletion finds
   * (as long as no search runs out of budget).
   */
  private minimalConflictIndexes(start: Uint8Array, pin?: [number, number]): number[] {
    const active = start.slice();
    const reduce = (chunk: number[]): void => {
      if (chunk.length === 0) return;
      for (const e of chunk) active[e] = 0;
      if (this.search(active, pin).kind === 'unsat') return; // none of the chunk is needed
      for (const e of chunk) active[e] = 1;
      if (chunk.length === 1) return; // needed for the conflict
      const mid = chunk.length >> 1;
      reduce(chunk.slice(0, mid));
      reduce(chunk.slice(mid));
    };
    reduce([...active.keys()].filter(i => active[i]));
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
    world.forEach(r => this.used[r]++);
    this.assignedCount = this.n;
    const vortox = this.vortoxState(true);
    const needing = new Set<number>();
    for (const c of this.infos) {
      if (this.judge(c, this.hasRedHerringRole(c) ? 'any' : -1, vortox, this.fauxPawMode(true)) === 'needs-corruption') {
        needing.add(c.source);
      }
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
