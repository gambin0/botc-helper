import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Script, Player, GameEvent, Game } from '../models/game';

export interface GameState {
  script: Script;
  players: Player[];
  events: GameEvent[];
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private db: any = null;

  async init() {
    if (Capacitor.isNativePlatform()) {
      console.log('Initializing native SQLite database');
    } else {
      console.log('Using localStorage for development');
    }
  }

  async saveScript(script: Script) {
    const json = JSON.stringify(script);
    if (Capacitor.isNativePlatform()) {
      // SQLite insert
    } else {
      localStorage.setItem(`script_${script.id}`, json);
    }
  }

  async getScript(id: string): Promise<Script | null> {
    if (Capacitor.isNativePlatform()) {
      return null;
    } else {
      const json = localStorage.getItem(`script_${id}`);
      return json ? JSON.parse(json) : null;
    }
  }

  async saveGame(game: Game) {
    const json = JSON.stringify(game);
    if (Capacitor.isNativePlatform()) {
      // SQLite insert
    } else {
      localStorage.setItem(`game_${game.id}`, json);
    }
  }

  async getGame(id: string): Promise<Game | null> {
    if (Capacitor.isNativePlatform()) {
      return null;
    } else {
      const json = localStorage.getItem(`game_${id}`);
      return json ? JSON.parse(json) : null;
    }
  }

  async saveCurrentGameId(gameId: string) {
    if (Capacitor.isNativePlatform()) {
      // SQLite insert
    } else {
      localStorage.setItem('current_game_id', gameId);
    }
  }

  async getCurrentGameId(): Promise<string | null> {
    if (Capacitor.isNativePlatform()) {
      return null;
    } else {
      return localStorage.getItem('current_game_id');
    }
  }

  async saveGameState(state: GameState) {
    const json = JSON.stringify(state);
    if (Capacitor.isNativePlatform()) {
      // SQLite insert
    } else {
      localStorage.setItem('game_state', json);
    }
  }

  async getGameState(): Promise<GameState | null> {
    if (Capacitor.isNativePlatform()) {
      return null;
    } else {
      const json = localStorage.getItem('game_state');
      return json ? JSON.parse(json) : null;
    }
  }

  async clearGameState() {
    if (Capacitor.isNativePlatform()) {
      // SQLite delete
    } else {
      localStorage.removeItem('game_state');
      localStorage.removeItem('current_game_id');
    }
  }
}
