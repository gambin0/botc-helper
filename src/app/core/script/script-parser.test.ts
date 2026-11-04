import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseScript, ScriptParseError } from './script-parser';
import { TROUBLE_BREWING_SCRIPT } from '../constants/trouble-brewing';

const WC25_DIR = join(__dirname, '../../../assets/scripts/wc25');

describe('parseScript', () => {
  it('parses the official array format with _meta', () => {
    const { script } = parseScript([{ id: '_meta', name: 'Mini', author: 'Me' }, 'chef', { id: 'empath' }, 'imp', 'poisoner']);
    expect(script.name).toBe('Mini');
    expect(script.author).toBe('Me');
    expect(script.characters.map(c => c.id)).toEqual(['chef', 'empath', 'imp', 'poisoner']);
    expect(script.characters[0].ability).toContain('pairs of evil');
  });

  it('normalises legacy IDs such as scarlet_woman and fortune_teller', () => {
    const { script } = parseScript({
      name: 'Legacy',
      characters: [{ id: 'scarlet_woman' }, { id: 'fortune_teller' }, { id: 'imp' }]
    });
    expect(script.characters.map(c => c.id)).toEqual(['scarletwoman', 'fortuneteller', 'imp']);
  });

  it('accepts fully described homebrew characters', () => {
    const { script, warnings } = parseScript([
      'imp', 'poisoner',
      { id: 'tinkerer', name: 'Tinkerer', team: 'townsfolk', ability: 'Something.' }
    ]);
    expect(script.characters.find(c => c.id === 'tinkerer')?.team).toBe('townsfolk');
    expect(warnings.length).toBe(1);
  });

  it('rejects unknown IDs, duplicates, and scripts without a Demon', () => {
    expect(() => parseScript(['imp', 'poisoner', 'notarole'])).toThrow(ScriptParseError);
    expect(() => parseScript(['imp', 'imp', 'poisoner'])).toThrow(/Duplicate/);
    expect(() => parseScript(['chef', 'poisoner'])).toThrow(/no Demon/);
  });

  it('parses every bundled WC25 script (including ones with jinxes)', () => {
    const files = readdirSync(WC25_DIR).filter(f => f.endsWith('.json'));
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      const { script } = parseScript(JSON.parse(readFileSync(join(WC25_DIR, f), 'utf8')), f);
      expect(script.characters.length, f).toBeGreaterThan(5);
    }
  });

  it('bundled Trouble Brewing has all 22 characters', () => {
    expect(TROUBLE_BREWING_SCRIPT.characters.length).toBe(22);
    expect(TROUBLE_BREWING_SCRIPT.characters.some(c => c.id === 'scarletwoman')).toBe(true);
  });
});
