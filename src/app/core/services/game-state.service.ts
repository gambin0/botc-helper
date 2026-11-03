import { Injectable } from '@angular/core';
import { Script, Player, GameEvent, RolePossibility, DeductionResult, ClaimTrust } from '../models/game';
import { BotcSolver } from '../solver/solver';
import { DatabaseService } from '../storage/database.service';
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
  }

  addPlayer(player: Player) {
    if (!this.currentGameId) {
      throw new Error('No game created');
    }
    player.gameId = this.currentGameId;
    this.currentPlayers.push(player);
    this.db.savePlayer(player);
  }

  removePlayer(playerId: string) {
    this.currentPlayers = this.currentPlayers.filter(p => p.id !== playerId);
  }

  updatePlayer(player: Player) {
    const index = this.currentPlayers.findIndex(p => p.id === player.id);
    if (index !== -1) {
      this.currentPlayers[index] = player;
    }
    this.db.savePlayer(player);
  }

  addEvent(event: GameEvent) {
    if (!this.currentGameId) {
      throw new Error('No game created');
    }
    event.gameId = this.currentGameId;
    this.currentEvents.push(event);
    this.solver.addEvent(event);
    this.db.saveEvent(event);
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

  getDeductions(): DeductionResult {
    return this.solver.solve();
  }

  getPossibleRoles(playerId: string): RolePossibility[] {
    const result = this.solver.solve();
    return result.possibleRoles.filter(r => r.playerId === playerId);
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
}
