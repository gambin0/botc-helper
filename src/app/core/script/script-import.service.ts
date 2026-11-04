import { Injectable } from '@angular/core';
import { Script, ScriptCharacter } from '../models/game';
import { generateUUID } from '../utils/uuid';

@Injectable({
  providedIn: 'root'
})
export class ScriptImportService {
  importScript(json: string): Script {
    const parsed = JSON.parse(json);
    return this.validateScript(parsed);
  }

  importFromFile(file: File): Promise<Script> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = e.target?.result as string;
          resolve(this.importScript(json));
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  private validateScript(data: unknown): Script {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid script data');
    }
    const raw = data as Record<string, unknown>;
    if (typeof raw['name'] !== 'string' || !raw['name']) {
      throw new Error('Script must have a name');
    }
    if (!Array.isArray(raw['characters'])) {
      throw new Error('Script must have a characters array');
    }

    const characters: ScriptCharacter[] = raw['characters'].map((c: unknown) => {
      if (!c || typeof c !== 'object') throw new Error('Invalid character data');
      const char = c as Record<string, unknown>;
      if (!char['id'] || typeof char['id'] !== 'string') throw new Error('Character must have an id');
      if (!char['name'] || typeof char['name'] !== 'string') throw new Error('Character must have a name');
      if (!char['team'] || typeof char['team'] !== 'string') throw new Error('Character must have a team');
      if (!char['ability'] || typeof char['ability'] !== 'string') throw new Error('Character must have an ability');
      return c as ScriptCharacter;
    });

    // Check for duplicate IDs
    const ids = characters.map(c => c.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      throw new Error('Script has duplicate character IDs');
    }

    return {
      id: typeof raw['id'] === 'string' && raw['id'] ? raw['id'] : generateUUID(),
      name: raw['name'],
      source: typeof raw['source'] === 'string' && raw['source'] ? raw['source'] : 'imported',
      characters
    };
  }
}
