import { Injectable, signal, computed } from '@angular/core';
import { Script, Player, GameEvent, RolePossibility, DeductionResult, ClaimTrust, Game } from '../models/game';
import { BotcSolver } from '../solver/solver';
import { DatabaseService, GameState } from '../storage/database.service';
import { ScriptImportService } from '../script/script-import.service';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  private currentScript: Script | null = null;
  private currentPlayers: Player[] = [];
  private currentEvents: GameEvent[] = [];
  private solver = new BotcSolver();
  private currentGameId: string | null = null;
  private currentGame: Game | null = null;

  private eventsVersion = signal(0);

  deductions = computed(() => {
    this.eventsVersion(); // trigger re-computation when events change
    return this.solver.solve();
  });

  constructor(
    private db: DatabaseService,
    private scriptImport: ScriptImportService
  ) {}

  async loadScript(id: string): Promise<void> {
    const script = await this.db.getScript(id);
    if (script) {
      this.currentScript = script;
    }
  }

  async importScript(json: string): Promise<void> {
    const script = this.scriptImport.importScript(json);
    this.currentScript = script;
    await this.db.saveScript(script);
  }

  createGame(name: string, playerCount: number) {
    if (!this.currentScript) {
      throw new Error('No script loaded');
    }

    this.currentGameId = crypto.randomUUID();
    this.currentPlayers = [];
    this.currentEvents = [];

    this.currentGame = {
      id: this.currentGameId,
      name,
      scriptId: this.currentScript.id,
      playerCount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Create player slots
    for (let i = 0; i < playerCount; i++) {
      const player: Player = {
        id: crypto.randomUUID(),
        gameId: this.currentGameId,
        name: `Player ${i + 1}`,
        seat: i + 1,
        alive: true
      };
      this.currentPlayers.push(player);
    }

    // Initialize solver
    this.solver.init(this.currentScript, this.currentPlayers);

    // Persist game
    this.persistState();
  }

  addPlayer(player: Player) {
    if (!this.currentGameId) {
      throw new Error('No game created');
    }
    player.gameId = this.currentGameId;
    this.currentPlayers.push(player);
    this.persistState();
  }

  removePlayer(playerId: string) {
    this.currentPlayers = this.currentPlayers.filter(p => p.id !== playerId);
    this.persistState();
  }

  updatePlayer(player: Player) {
    const index = this.currentPlayers.findIndex(p => p.id === player.id);
    if (index !== -1) {
      this.currentPlayers[index] = player;
    }
    this.persistState();
  }

  addEvent(event: GameEvent) {
    if (!this.currentGameId) {
      throw new Error('No game created');
    }
    event.gameId = this.currentGameId;
    this.currentEvents.push(event);
    this.rebuildSolver();
    this.eventsVersion.update(v => v + 1);
    this.persistState();
  }

  addClaim(playerId: string, claimedRole: string, trust: ClaimTrust = 'asserted') {
    const event: GameEvent = {
      id: crypto.randomUUID(),
      gameId: this.currentGameId!,
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

  addDeath(playerId: string, night: number) {
    const event: GameEvent = {
      id: crypto.randomUUID(),
      gameId: this.currentGameId!,
      night,
      phase: 'day',
      kind: 'death',
      payload: { playerId },
      trust: 'confirmed',
      createdAt: new Date().toISOString()
    };
    this.addEvent(event);

    // Mark player as dead
    const player = this.currentPlayers.find(p => p.id === playerId);
    if (player) {
      player.alive = false;
      this.updatePlayer(player);
    }
  }

  addExecution(playerId: string, revealedRole?: string) {
    const event: GameEvent = {
      id: crypto.randomUUID(),
      gameId: this.currentGameId!,
      night: 0,
      phase: 'execution',
      kind: 'execution',
      payload: { executedPlayerId: playerId, revealedRole },
      trust: 'confirmed',
      createdAt: new Date().toISOString()
    };
    this.addEvent(event);
  }

  addInfo(event: GameEvent) {
    this.addEvent(event);
  }

  removeEvent(eventId: string) {
    this.currentEvents = this.currentEvents.filter(e => e.id !== eventId);
    this.rebuildPlayerState();
    this.rebuildSolver();
    this.eventsVersion.update(v => v + 1);
    this.persistState();
  }

  private rebuildPlayerState() {
    // Create new player objects with updated alive status
    const deathPlayerIds = new Set<string>();
    for (const event of this.currentEvents) {
      if (event.kind === 'death') {
        const payload = event.payload as { playerId: string };
        deathPlayerIds.add(payload.playerId);
      }
    }

    this.currentPlayers = this.currentPlayers.map(player => ({
      ...player,
      alive: !deathPlayerIds.has(player.id)
    }));
  }

  private rebuildSolver() {
    if (this.currentScript && this.currentPlayers.length > 0) {
      this.solver.init(this.currentScript, this.currentPlayers);
      for (const event of this.currentEvents) {
        this.solver.addEvent(event);
      }
    }
  }

  async loadCurrentGame(): Promise<boolean> {
    const savedState = await this.db.getGameState();
    if (!savedState) {
      return false;
    }

    this.currentScript = savedState.script;
    this.currentPlayers = savedState.players;
    this.currentEvents = savedState.events;
    this.currentGameId = this.currentPlayers[0]?.gameId ?? null;

    // Restore game metadata
    if (this.currentGameId) {
      const savedGame = await this.db.getGame(this.currentGameId);
      this.currentGame = savedGame;
    }

    this.rebuildSolver();
    this.eventsVersion.update(v => v + 1);
    return true;
  }

  private persistState() {
    if (!this.currentScript || !this.currentGameId || !this.currentGame) {
      return;
    }

    // Update game timestamp
    this.currentGame.updatedAt = new Date().toISOString();

    // Save game metadata
    this.db.saveGame(this.currentGame);
    this.db.saveCurrentGameId(this.currentGameId);

    // Save full game state
    const state: GameState = {
      script: this.currentScript,
      players: this.currentPlayers,
      events: this.currentEvents
    };
    this.db.saveGameState(state);
  }

  getDeductions(): DeductionResult {
    return this.deductions();
  }

  getPossibleRoles(playerId: string): RolePossibility[] {
    return this.deductions().possibleRoles.filter(r => r.playerId === playerId);
  }

  getScript() {
    return this.currentScript;
  }

  getPlayers() {
    return this.currentPlayers;
  }

  getEvents() {
    return this.currentEvents;
  }

  hasGame() {
    return this.currentGameId !== null;
  }

  getGame() {
    return this.currentGame;
  }

  async resetGame() {
    this.currentScript = null;
    this.currentPlayers = [];
    this.currentEvents = [];
    this.currentGameId = null;
    this.currentGame = null;
    this.solver = new BotcSolver();
    this.eventsVersion.update(v => v + 1);
    await this.db.clearGameState();
  }
}
