import { Injectable } from '@angular/core';
import { Script, Player, GameEvent, Game, ScriptCharacter } from '../models/game';

export interface GameState {
  game: Game | null;
  script: Script | null;
  customRoles?: ScriptCharacter[] | null;
  players: Player[];
  events: GameEvent[];
  selfPlayerId?: string | null;
  selfRole?: string | null;
  selfRoleCertain?: boolean;
  assumeHonest?: boolean;
  demonBluffs?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  async init(): Promise<void> {
    // Ready for persistence
  }

  async saveScript(script: Script): Promise<void> {
    try {
      localStorage.setItem(`script_${script.id}`, JSON.stringify(script));
      localStorage.setItem('current_script_id', script.id);
    } catch (e) {
      console.warn('Failed to save script to storage:', e);
    }
  }

  async getScript(id: string): Promise<Script | null> {
    try {
      const json = localStorage.getItem(`script_${id}`);
      return json ? JSON.parse(json) : null;
    } catch {
      return null;
    }
  }

  /** Custom role pools the user has saved. */
  async listCustomScripts(): Promise<Script[]> {
    try {
      const raw = localStorage.getItem('custom_scripts');
      return raw ? (JSON.parse(raw) as Script[]) : [];
    } catch {
      return [];
    }
  }

  async saveCustomScripts(scripts: Script[]): Promise<void> {
    try {
      localStorage.setItem('custom_scripts', JSON.stringify(scripts));
    } catch (e) {
      console.warn('Failed to save custom role pools:', e);
    }
  }

  async getCurrentScriptId(): Promise<string | null> {
    try {
      return localStorage.getItem('current_script_id');
    } catch {
      return null;
    }
  }

  async saveGame(game: Game): Promise<void> {
    try {
      localStorage.setItem(`game_${game.id}`, JSON.stringify(game));
      localStorage.setItem('current_game_id', game.id);
    } catch (e) {
      console.warn('Failed to save game to storage:', e);
    }
  }

  async getGame(id: string): Promise<Game | null> {
    try {
      const json = localStorage.getItem(`game_${id}`);
      return json ? JSON.parse(json) : null;
    } catch {
      return null;
    }
  }

  async saveCurrentGameId(gameId: string): Promise<void> {
    try {
      localStorage.setItem('current_game_id', gameId);
    } catch (e) {
      console.warn('Failed to save current game id:', e);
    }
  }

  async getCurrentGameId(): Promise<string | null> {
    try {
      return localStorage.getItem('current_game_id');
    } catch {
      return null;
    }
  }

  async saveGameState(state: GameState): Promise<void> {
    try {
      localStorage.setItem('game_state', JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save game state to storage:', e);
    }
  }

  async getGameState(): Promise<GameState | null> {
    try {
      const json = localStorage.getItem('game_state');
      return json ? JSON.parse(json) : null;
    } catch {
      return null;
    }
  }

  async clearGameState(): Promise<void> {
    try {
      localStorage.removeItem('game_state');
      localStorage.removeItem('current_game_id');
    } catch (e) {
      console.warn('Failed to clear game state:', e);
    }
  }
}
