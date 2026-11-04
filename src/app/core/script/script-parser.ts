import { Script, ScriptCharacter, Team } from '../models/game';
import { RoleRegistry } from '../roles/role-registry';
import { normalizeRoleId } from '../rules/role-rules';

/**
 * Parses a Blood on the Clocktower script into a role pool.
 *
 * Accepts:
 *  - the official format: `[{ "id": "_meta", "name": ... }, "washerwoman", { "id": "chef" }, ...]`
 *  - full homebrew character objects inside that array
 *  - the legacy app format: `{ "id", "name", "characters": [...] }`
 *
 * Official characters are always resolved from the role registry, so the
 * script only decides WHICH roles are candidates, never how they behave.
 *
 * Pure TypeScript: no Angular dependencies.
 */

const TEAMS: readonly Team[] = ['townsfolk', 'outsider', 'minion', 'demon', 'traveller', 'fabled', 'loric'];

export interface ParsedScript {
  script: Script;
  warnings: string[];
}

export class ScriptParseError extends Error {}

function slug(name: string): string {
  return normalizeRoleId(name) || 'script';
}

export function parseScript(input: unknown, fallbackId?: string): ParsedScript {
  let meta: Record<string, unknown> = {};
  let entries: unknown[];

  if (Array.isArray(input)) {
    entries = input;
  } else if (input && typeof input === 'object' && Array.isArray((input as Record<string, unknown>)['characters'])) {
    meta = input as Record<string, unknown>;
    entries = meta['characters'] as unknown[];
  } else {
    throw new ScriptParseError('A script must be a JSON array of characters (official format).');
  }

  const characters: ScriptCharacter[] = [];
  const seen = new Set<string>();
  const unknown: string[] = [];
  const warnings: string[] = [];

  for (const entry of entries) {
    let rawId: string;
    let obj: Record<string, unknown> | null = null;
    if (typeof entry === 'string') {
      rawId = entry;
    } else if (entry && typeof entry === 'object' && typeof (entry as Record<string, unknown>)['id'] === 'string') {
      obj = entry as Record<string, unknown>;
      rawId = obj['id'] as string;
    } else {
      throw new ScriptParseError('Each script entry must be a character ID or an object with an "id".');
    }

    if (rawId === '_meta') {
      meta = { ...meta, ...obj };
      continue;
    }

    const id = normalizeRoleId(rawId);
    if (seen.has(id)) {
      throw new ScriptParseError(`Duplicate character "${rawId}".`);
    }
    seen.add(id);

    const official = RoleRegistry.get(id);
    if (official) {
      characters.push(RoleRegistry.toScriptCharacters([id])[0]);
      continue;
    }

    // Homebrew: must be fully described.
    const name = obj?.['name'];
    const team = obj?.['team'];
    const ability = obj?.['ability'];
    if (typeof name !== 'string' || typeof ability !== 'string' || typeof team !== 'string') {
      unknown.push(rawId);
      continue;
    }
    if (!TEAMS.includes(team as Team)) {
      throw new ScriptParseError(`Character "${name}" has unknown team "${team}".`);
    }
    characters.push({ id, name, team: team as Team, ability });
    warnings.push(`${name} is a homebrew character: the solver only applies generic rules to it.`);
  }

  if (unknown.length > 0) {
    throw new ScriptParseError(`Unknown characters (not official, and missing name/team/ability): ${unknown.join(', ')}.`);
  }
  if (!characters.some(c => c.team === 'demon')) {
    throw new ScriptParseError('The script has no Demon.');
  }
  if (!characters.some(c => c.team === 'minion')) {
    throw new ScriptParseError('The script has no Minions.');
  }

  const name = typeof meta['name'] === 'string' && meta['name'] ? (meta['name'] as string) : 'Custom Script';
  const id =
    typeof meta['id'] === 'string' && meta['id'] !== '_meta' && meta['id']
      ? (meta['id'] as string)
      : (fallbackId ?? slug(name));

  return {
    script: {
      id,
      name,
      author: typeof meta['author'] === 'string' ? (meta['author'] as string) : undefined,
      source: typeof meta['source'] === 'string' ? (meta['source'] as string) : 'imported',
      characters
    },
    warnings
  };
}
