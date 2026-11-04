import { Injectable, signal, computed, inject } from '@angular/core';
import { Script, Player, GameEvent, RolePossibility, DeductionResult, ClaimTrust, Game, ScriptCharacter } from '../models/game';
import { BotcSolver } from '../solver/solver';
import { DatabaseService, GameState } from '../storage/database.service';
import { ScriptImportService } from '../script/script-import.service';
import { generateUUID } from '../utils/uuid';
import { TROUBLE_BREWING_SCRIPT } from '../constants/trouble-brewing';
import { RoleRegistry } from '../roles/role-registry';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  private db = inject(DatabaseService);
  private scriptImport = inject(ScriptImportService);

  readonly script = signal<Script | null>(null);
  readonly customRoles = signal<ScriptCharacter[] | null>(null);
  readonly game = signal<Game | null>(null);
  readonly players = signal<Player[]>([]);
  readonly events = signal<GameEvent[]>([]);
  readonly selfPlayerId = signal<string | null>(null);
  readonly selfRole = signal<string | null>(null);
  readonly selfRoleCertain = signal<boolean>(false);

  readonly hasGame = computed(() => this.game() !== null);
  readonly alivePlayers = computed(() => this.players().filter(p => p.alive));

  /**
   * The active pool of character roles for the current game.
   * If custom roles are selected, they take precedence; otherwise the loaded script's roles,
   * falling back to Trouble Brewing characters.
   */
  readonly activeRoles = computed<ScriptCharacter[]>(() => {
    const custom = this.customRoles();
    if (custom && custom.length > 0) return custom;
    const s = this.script();
    if (s && s.characters.length > 0) return s.characters;
    return TROUBLE_BREWING_SCRIPT.characters;
  });

  readonly deductions = computed<DeductionResult>(() => {
    const characters = this.activeRoles();
    const players = this.players();
    const events = this.events();
    const selfPlayerId = this.selfPlayerId();
    const selfRole = this.selfRole();
    const selfRoleCertain = this.selfRoleCertain();

    if (characters.length === 0 || players.length === 0) {
      return {
        possibleRoles: [],
        survivingWorldCount: 0,
        contradictions: [],
        requiredAssumptions: []
      };
    }

    const solver = new BotcSolver();
    solver.init(characters, players);
    if (selfPlayerId && selfRole) {
      solver.setSelfKnowledge(selfPlayerId, selfRole, selfRoleCertain);
    }
    for (const event of events) {
      solver.addEvent(event);
    }
    return solver.solve();
  });

  async loadScript(id: string): Promise<void> {
    const script = await this.db.getScript(id);
    if (script) {
      this.customRoles.set(null);
      this.script.set(script);
      this.persistState();
    }
  }

  async importScript(json: string): Promise<void> {
    const script = await this.scriptImport.importScript(json);
    this.customRoles.set(null);
    this.script.set(script);
    await this.db.saveScript(script);
    this.persistState();
  }

  setScript(script: Script): void {
    this.customRoles.set(null);
    this.script.set(script);
    this.db.saveScript(script);
    this.persistState();
  }

  /**
   * Select a custom set of roles by ID (e.g. for custom role draft / non-script games).
   */
  selectRoles(roleIds: string[]): void {
    const characters = RoleRegistry.toScriptCharacters(roleIds);
    this.customRoles.set(characters);
    this.persistState();
  }

  setCustomRoles(roles: ScriptCharacter[]): void {
    this.customRoles.set(roles);
    this.persistState();
  }

  setSelf(playerId: string): void {
    // Clear isSelf on all players, set on this one
    this.players.update(players =>
      players.map(p => ({ ...p, isSelf: p.id === playerId }))
    );
    this.selfPlayerId.set(playerId);
    this.persistState();
  }

  setSelfRole(roleId: string | null, certain = false): void {
    this.selfRole.set(roleId);
    this.selfRoleCertain.set(certain);
    this.persistState();
  }

  clearSelf(): void {
    this.players.update(players =>
      players.map(p => ({ ...p, isSelf: false }))
    );
    this.selfPlayerId.set(null);
    this.selfRole.set(null);
    this.selfRoleCertain.set(false);
    this.persistState();
  }

  createGame(name: string, playerCount: number): void {
    let currentScript = this.script();
    if (!currentScript && !this.customRoles()) {
      currentScript = TROUBLE_BREWING_SCRIPT;
      this.script.set(currentScript);
    }

    const count = Math.max(5, Math.min(15, Number(playerCount) || 8));
    const gameId = generateUUID();
    const newGame: Game = {
      id: gameId,
      name: name || 'Game',
      scriptId: currentScript?.id || 'custom',
      playerCount: count,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newPlayers: Player[] = [];
    for (let i = 0; i < count; i++) {
      newPlayers.push({
        id: generateUUID(),
        gameId,
        name: `Player ${i + 1}`,
        seat: i + 1,
        alive: true
      });
    }

    this.game.set(newGame);
    this.players.set(newPlayers);
    this.events.set([]);

    this.persistState();
  }

  addPlayer(player: Player): void {
    const currentGame = this.game();
    if (!currentGame) {
      throw new Error('No game created');
    }
    player.gameId = currentGame.id;
    this.players.update(players => [...players, player]);
    this.persistState();
  }

  removePlayer(playerId: string): void {
    this.players.update(players => players.filter(p => p.id !== playerId));
    this.persistState();
  }

  updatePlayer(player: Player): void {
    this.players.update(players =>
      players.map(p => (p.id === player.id ? { ...p, ...player } : p))
    );
    this.persistState();
  }

  togglePlayerAlive(playerId: string): void {
    const player = this.players().find(p => p.id === playerId);
    if (!player) return;

    if (player.alive) {
      this.addDeath(playerId, 0);
    } else {
      this.addResurrection(playerId);
    }
  }

  addEvent(event: GameEvent): void {
    const currentGame = this.game();
    if (!currentGame) {
      throw new Error('No game created');
    }
    event.gameId = currentGame.id;

    const updatedEvents = [...this.events(), event];
    this.events.set(updatedEvents);
    this.players.update(currentPlayers => this.updatePlayerAliveStatus(currentPlayers, updatedEvents));
    this.persistState();
  }

  addClaim(playerId: string, claimedRole: string, trust: ClaimTrust = 'asserted'): void {
    const currentGame = this.game();
    if (!currentGame) {
      throw new Error('No game created');
    }
    const event: GameEvent = {
      id: generateUUID(),
      gameId: currentGame.id,
      night: 0,
      phase: 'day',
      actorId: playerId,
      kind: 'claim',
      payload: { claimedRole },
      trust,
      createdAt: new Date().toISOString()
    };
    this.addEvent(event);
  }

  addDeath(playerId: string, night: number): void {
    const currentGame = this.game();
    if (!currentGame) {
      throw new Error('No game created');
    }
    const event: GameEvent = {
      id: generateUUID(),
      gameId: currentGame.id,
      night,
      phase: 'day',
      kind: 'death',
      payload: { playerId },
      trust: 'confirmed',
      createdAt: new Date().toISOString()
    };
    this.addEvent(event);
  }

  addExecution(playerId: string, revealedRole?: string): void {
    const currentGame = this.game();
    if (!currentGame) {
      throw new Error('No game created');
    }
    const event: GameEvent = {
      id: generateUUID(),
      gameId: currentGame.id,
      night: 0,
      phase: 'execution',
      kind: 'execution',
      payload: { executedPlayerId: playerId, playerId, revealedRole },
      trust: 'confirmed',
      createdAt: new Date().toISOString()
    };
    this.addEvent(event);
  }

  addResurrection(playerId: string): void {
    const currentGame = this.game();
    if (!currentGame) {
      throw new Error('No game created');
    }
    const event: GameEvent = {
      id: generateUUID(),
      gameId: currentGame.id,
      night: 0,
      phase: 'day',
      kind: 'resurrection',
      payload: { playerId },
      trust: 'confirmed',
      createdAt: new Date().toISOString()
    };
    this.addEvent(event);
  }

  addInfo(event: GameEvent): void {
    this.addEvent(event);
  }

  removeEvent(eventId: string): void {
    const updatedEvents = this.events().filter(e => e.id !== eventId);
    this.events.set(updatedEvents);
    this.players.update(currentPlayers => this.updatePlayerAliveStatus(currentPlayers, updatedEvents));
    this.persistState();
  }

  private updatePlayerAliveStatus(players: Player[], events: GameEvent[]): Player[] {
    return players.map(player => {
      let alive = true;
      for (const event of events) {
        if (event.kind === 'death') {
          const payload = event.payload as { playerId?: string } | undefined;
          if (payload?.playerId === player.id) {
            alive = false;
          }
        } else if (event.kind === 'execution') {
          const payload = event.payload as { executedPlayerId?: string; playerId?: string } | undefined;
          if (payload?.executedPlayerId === player.id || payload?.playerId === player.id) {
            alive = false;
          }
        } else if (event.kind === 'resurrection') {
          const payload = event.payload as { playerId?: string } | undefined;
          if (payload?.playerId === player.id) {
            alive = true;
          }
        }
      }
      return { ...player, alive };
    });
  }

  async loadCurrentGame(): Promise<boolean> {
    try {
      const savedState = await this.db.getGameState();
      if (!savedState) {
        const scriptId = await this.db.getCurrentScriptId();
        if (scriptId) {
          const savedScript = await this.db.getScript(scriptId);
          if (savedScript) {
            this.script.set(savedScript);
            return false;
          }
        }
        this.script.set(TROUBLE_BREWING_SCRIPT);
        return false;
      }

      const activeScript = savedState.script || TROUBLE_BREWING_SCRIPT;
      this.script.set(activeScript);
      if (savedState.customRoles) {
        this.customRoles.set(savedState.customRoles);
      }
      if (savedState.selfPlayerId) {
        this.selfPlayerId.set(savedState.selfPlayerId);
      }
      if (savedState.selfRole) {
        this.selfRole.set(savedState.selfRole);
        this.selfRoleCertain.set(savedState.selfRoleCertain ?? false);
      }

      let loadedGame = savedState.game ?? null;
      if (!loadedGame) {
        const gameId = savedState.players?.[0]?.gameId ?? (await this.db.getCurrentGameId());
        if (gameId) {
          loadedGame = await this.db.getGame(gameId);
        }
      }

      if (!loadedGame && savedState.players && savedState.players.length > 0) {
        loadedGame = {
          id: savedState.players[0].gameId || generateUUID(),
          name: 'Restored Game',
          scriptId: activeScript.id,
          playerCount: savedState.players.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      this.game.set(loadedGame);

      const events = savedState.events || [];
      this.events.set(events);
      const players = this.updatePlayerAliveStatus(savedState.players || [], events);
      this.players.set(players);

      return loadedGame !== null;
    } catch (err) {
      console.error('Failed to load current game:', err);
      if (!this.script()) {
        this.script.set(TROUBLE_BREWING_SCRIPT);
      }
      return false;
    }
  }

  persistState(): void {
    const currentScript = this.script();
    const currentCustomRoles = this.customRoles();
    const currentGame = this.game();
    const currentPlayers = this.players();
    const currentEvents = this.events();

    if (!currentScript && !currentGame && !currentCustomRoles) {
      return;
    }

    if (currentGame) {
      const updatedGame: Game = {
        ...currentGame,
        updatedAt: new Date().toISOString()
      };
      this.db.saveGame(updatedGame);
      this.db.saveCurrentGameId(currentGame.id);
    }

    if (currentScript) {
      this.db.saveScript(currentScript);
    }

    const state: GameState = {
      game: currentGame,
      script: currentScript,
      customRoles: currentCustomRoles,
      players: currentPlayers,
      events: currentEvents,
      selfPlayerId: this.selfPlayerId(),
      selfRole: this.selfRole(),
      selfRoleCertain: this.selfRoleCertain()
    };
    this.db.saveGameState(state);
  }

  getDeductions(): DeductionResult {
    return this.deductions();
  }

  getPossibleRoles(playerId: string): RolePossibility[] {
    return this.deductions().possibleRoles.filter(r => r.playerId === playerId);
  }

  getScript(): Script | null {
    return this.script();
  }

  getPlayers(): Player[] {
    return this.players();
  }

  getEvents(): GameEvent[] {
    return this.events();
  }

  getGame(): Game | null {
    return this.game();
  }

  async resetGame(): Promise<void> {
    const currentScript = this.script() || TROUBLE_BREWING_SCRIPT;
    this.game.set(null);
    this.players.set([]);
    this.events.set([]);
    this.selfPlayerId.set(null);
    this.selfRole.set(null);
    this.selfRoleCertain.set(false);
    await this.db.clearGameState();
    this.script.set(currentScript);
    this.persistState();
  }
}
