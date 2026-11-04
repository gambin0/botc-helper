import { Injectable, inject } from '@angular/core';
import { Script, ScriptCharacter } from '../models/game';
import { generateUUID } from '../utils/uuid';
import { JinxesService } from '../services/jinxes.service';
import { ScriptValidatorService } from './script-validator.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ScriptImportService {
  private jinxesService = inject(JinxesService);
  private validatorService = inject(ScriptValidatorService);

  async importScript(json: string): Promise<Script> {
    const parsed = JSON.parse(json);

    // Validate against JSON schema first
    const validation = await this.validatorService.validate(parsed);
    if (!validation.valid) {
      throw new Error(`Script schema validation failed: ${validation.errors?.join('; ')}`);
    }

    const script = this.validateScript(parsed);
    await this.validateJinxes(script);
    return script;
  }

  importFromFile(file: File): Promise<Script> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const json = e.target?.result as string;
          const script = await this.importScript(json);
          resolve(script);
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

  private async validateJinxes(script: Script): Promise<void> {
    const characterIds = script.characters.map(c => c.id);
    const jinxes = await firstValueFrom(this.jinxesService.validateScript(characterIds));

    if (jinxes.length > 0) {
      const jinxMessages = jinxes.map(j => j.reason).join('; ');
      throw new Error(`Script has incompatible characters (jinxes): ${jinxMessages}`);
    }
  }
}
