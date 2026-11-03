import { Injectable } from '@angular/core';
import { Script, Player, GameEvent, RolePossibility, DeductionResult } from '../models/game';
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

    const gameId = crypto.randomUUID();
    this.currentPlayers = [];
    this.currentEvents = [];

    // Create player slots
    for (let i = 0; i < playerCount; i++) {
      const player: Player = {
        id: crypto.randomUUID(),
        gameId,
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
    this.currentEvents.push(event);
    this.solver.addEvent(event);
    this.db.saveEvent(event);
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
}
