import { Injectable, computed, effect, inject, signal } from '@angular/core';
import {
  ClaimTrust,
  EvidenceRef,
  Explanation,
  Game,
  GameEvent,
  GameEventKind,
  GamePhase,
  Player,
  RolePossibility,
  Script,
  ScriptCharacter
} from '../models/game';
import { DeductionEngine, SolverInput } from '../solver/solver';
import { DeductionService } from './deduction.service';
import { BluffSuggestion, suggestBluffs } from '../solver/bluffs';
import { DatabaseService, GameState } from '../storage/database.service';
import { generateUUID } from '../utils/uuid';
import { TROUBLE_BREWING_SCRIPT } from '../constants/trouble-brewing';
import { RoleRegistry } from '../roles/role-registry';
import { InfoPayload } from '../rules/info-specs';
import { targetPlayer } from '../rules/events';

@Injectable({ providedIn: 'root' })
export class GameStateService {
  private db = inject(DatabaseService);
  private deduction = inject(DeductionService);

  readonly script = signal<Script | null>(null);
  readonly customRoles = signal<ScriptCharacter[] | null>(null);
  readonly game = signal<Game | null>(null);
  readonly players = signal<Player[]>([]);
  readonly events = signal<GameEvent[]>([]);
  readonly selfPlayerId = signal<string | null>(null);
  readonly selfRole = signal<string | null>(null);
  readonly selfRoleCertain = signal<boolean>(false);
  /** Treat asserted claims from good players as truthful (see SolverOptions). */
  readonly assumeHonest = signal<boolean>(true);
  /**
   * Whether your private character is shown on screen. Deliberately not
   * persisted: it is masked again after every reload.
   */
  readonly revealSelf = signal(false);
  /** Role pools the user built with the custom picker. */
  readonly customScripts = signal<Script[]>([]);
  /** Not-in-play characters the Storyteller showed you as the Demon. */
  readonly demonBluffs = signal<string[]>([]);

  readonly hasGame = computed(() => this.game() !== null);
  readonly alivePlayers = computed(() => this.players().filter(p => p.alive));
  readonly currentNight = computed(() => this.events().reduce((max, e) => Math.max(max, e.night), 1));

  /**
   * The candidate role pool for the current game. Scripts only pre-select
   * roles; custom role selections take precedence.
   */
  readonly activeRoles = computed<ScriptCharacter[]>(() => {
    const custom = this.customRoles();
    if (custom && custom.length > 0) return custom;
    const s = this.script();
    if (s && s.characters.length > 0) return s.characters;
    return TROUBLE_BREWING_SCRIPT.characters;
  });

  readonly roleNames = computed(() => {
    const map = new Map<string, string>();
    for (const c of this.activeRoles()) map.set(c.id, c.name);
    return map;
  });

  private readonly solverInput = computed<SolverInput>(() => {
    const selfPlayerId = this.selfPlayerId();
    const selfRole = this.selfRole();
    return {
      characters: this.activeRoles(),
      players: this.players(),
      events: this.events(),
      self: selfPlayerId && selfRole ? { playerId: selfPlayerId, roleId: selfRole, certain: this.selfRoleCertain() } : null,
      options: { assumeGoodPlayersHonest: this.assumeHonest() }
    };
  });

  /**
   * The latest deductions. Solved in a Web Worker (DeductionService), so this
   * can briefly lag behind the evidence while `solving()` is true.
   */
  readonly deductions = this.deduction.result.asReadonly();
  /** True while a newer solve is running and the deductions may be out of date. */
  readonly solving = this.deduction.solving.asReadonly();
  /** Set if the most recent solve failed. */
  readonly solveError = this.deduction.error.asReadonly();

  private readonly resolveOnChange = effect(() => {
    const input = this.solverInput();
    if (input.characters.length === 0 || input.players.length === 0) this.deduction.clear();
    else this.deduction.solve(input);
  });

  /** Bluff options when you were shown an evil character; empty otherwise. */
  readonly bluffs = computed<BluffSuggestion[]>(() => {
    const selfPlayerId = this.selfPlayerId();
    const selfRole = this.selfRole();
    const team = this.activeRoles().find(c => c.id === selfRole)?.team ?? RoleRegistry.get(selfRole ?? '')?.team;
    if (!selfPlayerId || (team !== 'minion' && team !== 'demon')) return [];
    return suggestBluffs({
      characters: this.activeRoles(),
      players: this.players(),
      events: this.events(),
      deductions: this.deductions(),
      selfPlayerId,
      demonBluffs: team === 'demon' ? this.demonBluffs() : []
    });
  });

  /** Evidence label that respects "hide my character". */
  evidenceLabel(ref: EvidenceRef): string {
    return ref.id === 'self' && !this.revealSelf() ? 'Your private character (hidden)' : ref.label;
  }

  /** Warnings with your own character masked while it is hidden. */
  readonly visibleWarnings = computed(() =>
    this.deductions().warnings.map(w =>
      w.startsWith('Your character (') && !this.revealSelf() ? w.replace(/^Your character \([^)]*\)/, 'Your character') : w
    )
  );

  /** Contradiction descriptions with your own character masked while hidden. */
  readonly visibleContradictions = computed(() =>
    this.deductions().contradictions.map(c =>
      this.revealSelf() ? c.description : c.description.replace(/You were told you are the [^;]*/g, 'Your private character (hidden)')
    )
  );

  roleName(roleId: string | null | undefined): string {
    if (!roleId) return 'unknown';
    return this.roleNames().get(roleId) ?? RoleRegistry.get(roleId)?.name ?? roleId;
  }

  playerName(playerId: string | null | undefined): string {
    return this.players().find(p => p.id === playerId)?.name ?? 'Unknown player';
  }

  explain(playerId: string, roleId: string): Explanation {
    return new DeductionEngine(this.solverInput()).explain(playerId, roleId);
  }

  getPossibleRoles(playerId: string): RolePossibility[] {
    return this.deductions().possibleRoles.filter(r => r.playerId === playerId);
  }

  // ---------------------------------------------------------------------------
  // Scripts and role pools
  // ---------------------------------------------------------------------------

  setScript(script: Script): void {
    this.customRoles.set(null);
    this.script.set(script);
    this.persistState();
  }

  /** Select a custom set of roles by ID (non-script games). */
  selectRoles(roleIds: string[]): void {
    this.customRoles.set(RoleRegistry.toScriptCharacters(roleIds));
    this.persistState();
  }

  /** Saves (or replaces, by ID) a custom role pool and makes it active. */
  saveCustomScript(script: Script): void {
    this.customScripts.update(list => [...list.filter(s => s.id !== script.id), script]);
    this.db.saveCustomScripts(this.customScripts());
    this.setScript(script);
  }

  deleteCustomScript(id: string): void {
    this.customScripts.update(list => list.filter(s => s.id !== id));
    this.db.saveCustomScripts(this.customScripts());
  }

  setDemonBluffs(roleIds: string[]): void {
    this.demonBluffs.set(roleIds.slice(0, 3));
    this.persistState();
  }

  setAssumeHonest(value: boolean): void {
    this.assumeHonest.set(value);
    this.persistState();
  }

  // ---------------------------------------------------------------------------
  // Self knowledge
  // ---------------------------------------------------------------------------

  setSelf(playerId: string): void {
    this.players.update(players => players.map(p => ({ ...p, isSelf: p.id === playerId })));
    this.selfPlayerId.set(playerId);
    this.persistState();
  }

  setSelfRole(roleId: string | null, certain = false): void {
    this.selfRole.set(roleId);
    this.selfRoleCertain.set(certain);
    this.persistState();
  }

  clearSelf(): void {
    this.players.update(players => players.map(p => ({ ...p, isSelf: false })));
    this.selfPlayerId.set(null);
    this.selfRole.set(null);
    this.selfRoleCertain.set(false);
    this.persistState();
  }

  // ---------------------------------------------------------------------------
  // Game and players
  // ---------------------------------------------------------------------------

  createGame(name: string, playerCount: number): void {
    if (!this.script() && !this.customRoles()) this.script.set(TROUBLE_BREWING_SCRIPT);
    const count = Math.max(5, Math.min(15, Math.round(Number(playerCount)) || 8));
    const gameId = generateUUID();
    const now = new Date().toISOString();
    this.game.set({
      id: gameId,
      name: name || 'Game',
      scriptId: this.script()?.id ?? 'custom',
      playerCount: count,
      createdAt: now,
      updatedAt: now
    });
    this.players.set(
      Array.from({ length: count }, (_, i) => ({
        id: generateUUID(),
        gameId,
        name: `Player ${i + 1}`,
        seat: i + 1,
        alive: true
      }))
    );
    this.events.set([]);
    this.demonBluffs.set([]);
    this.selfPlayerId.set(null);
    this.selfRole.set(null);
    this.selfRoleCertain.set(false);
    this.persistState();
  }

  updatePlayer(player: Player): void {
    this.players.update(players => players.map(p => (p.id === player.id ? { ...p, ...player } : p)));
    this.persistState();
  }

  togglePlayerAlive(playerId: string): void {
    const player = this.players().find(p => p.id === playerId);
    if (!player) return;
    if (player.alive) this.addDeath(playerId, this.currentNight());
    else this.addPlayerEvent('resurrection', playerId, this.currentNight());
  }

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------

  private newEvent(kind: GameEventKind, night: number, phase: GamePhase, extra: Partial<GameEvent>): GameEvent {
    const game = this.game();
    if (!game) throw new Error('No game created');
    return {
      id: generateUUID(),
      gameId: game.id,
      night: Math.max(1, Math.round(night) || 1),
      phase,
      kind,
      payload: {},
      trust: 'confirmed',
      createdAt: new Date().toISOString(),
      ...extra
    };
  }

  private addEvent(event: GameEvent): void {
    const events = [...this.events(), event];
    this.events.set(events);
    this.players.update(players => this.withAliveStatus(players, events));
    this.persistState();
  }

  addClaim(playerId: string, roleId: string, trust: ClaimTrust, night: number): void {
    this.addEvent(this.newEvent('claim', night, 'day', { actorId: playerId, payload: { roleId }, trust }));
  }

  addDeath(playerId: string, night: number): void {
    this.addPlayerEvent('death', playerId, night);
  }

  addExecution(playerId: string, night: number, gameEnded = false): void {
    this.addEvent(this.newEvent('execution', night, 'execution', { payload: { playerId, gameEnded } }));
  }

  private addPlayerEvent(kind: 'death' | 'resurrection', playerId: string, night: number): void {
    this.addEvent(this.newEvent(kind, night, 'day', { payload: { playerId } }));
  }

  addInfo(sourcePlayerId: string, payload: InfoPayload, night: number): void {
    this.addEvent(
      this.newEvent('info', night, night === 1 ? 'first-night' : 'other-night', {
        actorId: sourcePlayerId,
        payload,
        trust: 'asserted'
      })
    );
  }

  removeEvent(eventId: string): void {
    const events = this.events().filter(e => e.id !== eventId);
    this.events.set(events);
    this.players.update(players => this.withAliveStatus(players, events));
    this.persistState();
  }

  /** Alive status is a projection of the event log. */
  private withAliveStatus(players: Player[], events: GameEvent[]): Player[] {
    return players.map(player => {
      let alive = true;
      for (const event of events) {
        if (targetPlayer(event) !== player.id) continue;
        if (event.kind === 'death' || event.kind === 'execution') alive = false;
        else if (event.kind === 'resurrection') alive = true;
      }
      return { ...player, alive };
    });
  }

  // ---------------------------------------------------------------------------
  // Persistence
  // ---------------------------------------------------------------------------

  async loadCurrentGame(): Promise<boolean> {
    this.customScripts.set(await this.db.listCustomScripts());
    try {
      const saved = await this.db.getGameState();
      if (!saved) {
        const scriptId = await this.db.getCurrentScriptId();
        const savedScript = scriptId ? await this.db.getScript(scriptId) : null;
        this.script.set(savedScript ?? TROUBLE_BREWING_SCRIPT);
        return false;
      }

      this.script.set(saved.script ?? TROUBLE_BREWING_SCRIPT);
      this.customRoles.set(saved.customRoles ?? null);
      this.selfPlayerId.set(saved.selfPlayerId ?? null);
      this.selfRole.set(saved.selfRole ?? null);
      this.selfRoleCertain.set(saved.selfRoleCertain ?? false);
      this.assumeHonest.set(saved.assumeHonest ?? true);
      this.demonBluffs.set(saved.demonBluffs ?? []);
      this.game.set(saved.game ?? null);
      const events = saved.events ?? [];
      this.events.set(events);
      this.players.set(this.withAliveStatus(saved.players ?? [], events));
      return saved.game !== null;
    } catch (err) {
      console.error('Failed to load current game:', err);
      if (!this.script()) this.script.set(TROUBLE_BREWING_SCRIPT);
      return false;
    }
  }

  persistState(): void {
    const script = this.script();
    const game = this.game();
    if (game) this.db.saveGame({ ...game, updatedAt: new Date().toISOString() });
    if (script) this.db.saveScript(script);

    const state: GameState = {
      game,
      script,
      customRoles: this.customRoles(),
      players: this.players(),
      events: this.events(),
      selfPlayerId: this.selfPlayerId(),
      selfRole: this.selfRole(),
      selfRoleCertain: this.selfRoleCertain(),
      assumeHonest: this.assumeHonest(),
      demonBluffs: this.demonBluffs()
    };
    this.db.saveGameState(state);
  }

  async resetGame(): Promise<void> {
    const script = this.script() ?? TROUBLE_BREWING_SCRIPT;
    this.game.set(null);
    this.players.set([]);
    this.events.set([]);
    this.demonBluffs.set([]);
    this.selfPlayerId.set(null);
    this.selfRole.set(null);
    this.selfRoleCertain.set(false);
    await this.db.clearGameState();
    this.script.set(script);
    this.persistState();
  }
}
