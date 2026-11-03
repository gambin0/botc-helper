import { Injectable } from '@angular/core';
import { Script, ScriptCharacter } from '../models/game';

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

  private validateScript(data: any): Script {
    if (!data.name) throw new Error('Script must have a name');
    if (!data.characters || !Array.isArray(data.characters)) {
      throw new Error('Script must have a characters array');
    }

    const characters: ScriptCharacter[] = data.characters.map((c: any) => {
      if (!c.id) throw new Error('Character must have an id');
      if (!c.name) throw new Error('Character must have a name');
      if (!c.team) throw new Error('Character must have a team');
      if (!c.ability) throw new Error('Character must have an ability');
      return c as ScriptCharacter;
    });

    // Check for duplicate IDs
    const ids = characters.map(c => c.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      throw new Error('Script has duplicate character IDs');
    }

    return {
      id: data.id || crypto.randomUUID(),
      name: data.name,
      source: data.source || 'imported',
      characters
    };
  }
}
