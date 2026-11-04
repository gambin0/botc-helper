import { Injectable } from '@angular/core';
import { Script } from '../models/game';
import { ParsedScript, ScriptParseError, parseScript } from './script-parser';

@Injectable({ providedIn: 'root' })
export class ScriptImportService {
  /** Parses script JSON text. Throws ScriptParseError with a user-facing message. */
  parse(json: string, fallbackId?: string): ParsedScript {
    let data: unknown;
    try {
      data = JSON.parse(json);
    } catch {
      throw new ScriptParseError('That is not valid JSON.');
    }
    return parseScript(data, fallbackId);
  }

  async fetchBundled(path: string, fallbackId: string): Promise<Script> {
    const response = await fetch(path);
    if (!response.ok) throw new ScriptParseError(`Could not load ${path} (${response.status}).`);
    return this.parse(await response.text(), fallbackId).script;
  }

  readFile(file: File): Promise<ParsedScript> {
    return file.text().then(text => this.parse(text));
  }
}
