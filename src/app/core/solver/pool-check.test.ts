import { describe, expect, it } from 'vitest';
import { checkPool } from './pool-check';
import { RoleRegistry } from '../roles/role-registry';
import { TROUBLE_BREWING_SCRIPT } from '../constants/trouble-brewing';

describe('checkPool', () => {
  it('accepts Trouble Brewing at every player count', () => {
    for (let n = 5; n <= 15; n++) expect(checkPool(TROUBLE_BREWING_SCRIPT.characters, n).valid, `${n}`).toBe(true);
  });

  it('flags a pool with no Demon', () => {
    const r = checkPool(RoleRegistry.toScriptCharacters(['chef', 'empath', 'monk', 'soldier', 'mayor', 'poisoner']), 5);
    expect(r.valid).toBe(false);
    expect(r.warnings).toContain('The role pool has no Demon.');
  });

  it('flags too few Minions for the player count', () => {
    const tf = ['chef', 'empath', 'monk', 'soldier', 'mayor', 'virgin', 'slayer', 'washerwoman', 'librarian', 'investigator'];
    const r = checkPool(RoleRegistry.toScriptCharacters([...tf, 'saint', 'recluse', 'poisoner', 'imp']), 10);
    expect(r.valid).toBe(false);
    expect(r.warnings.some(w => w.includes('fewer than 2 Minions'))).toBe(true);
  });

  it('flags a pool too small to fill the Townsfolk seats', () => {
    const r = checkPool(RoleRegistry.toScriptCharacters(['chef', 'empath', 'poisoner', 'imp']), 7);
    expect(r.valid).toBe(false);
  });
});
