import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Script, Player, GameEvent } from '../models/game';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private db: any = null;

  async init() {
    if (Capacitor.isNativePlatform()) {
      // Will use Capacitor SQLite plugin
      console.log('Initializing native SQLite database');
    } else {
      // Use localStorage for web development
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
      // SQLite query
      return null;
    } else {
      const json = localStorage.getItem(`script_${id}`);
      return json ? JSON.parse(json) : null;
    }
  }

  async savePlayer(player: Player) {
    const json = JSON.stringify(player);
    if (Capacitor.isNativePlatform()) {
      // SQLite insert
    } else {
      localStorage.setItem(`player_${player.id}`, json);
    }
  }

  async getPlayers(gameId: string): Promise<Player[]> {
    if (Capacitor.isNativePlatform()) {
      // SQLite query
      return [];
    } else {
      // Get all players for this game from localStorage
      const players: Player[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('player_')) {
          const json = localStorage.getItem(key);
          if (json) {
            const player = JSON.parse(json);
            if (player.gameId === gameId) {
              players.push(player);
            }
          }
        }
      }
      return players;
    }
  }

  async saveEvent(event: GameEvent) {
    const json = JSON.stringify(event);
    if (Capacitor.isNativePlatform()) {
      // SQLite insert
    } else {
      localStorage.setItem(`event_${event.id}`, json);
    }
  }

  async getEvents(gameId: string): Promise<GameEvent[]> {
    if (Capacitor.isNativePlatform()) {
      // SQLite query
      return [];
    } else {
      const events: GameEvent[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('event_')) {
          const json = localStorage.getItem(key);
          if (json) {
            const event = JSON.parse(json);
            if (event.gameId === gameId) {
              events.push(event);
            }
          }
        }
      }
      return events.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
  }
}
