import { describe, expect, it } from 'vitest';
import { compositionFor, setupModifiers } from './setup';
import { RoleRegistry } from '../roles/role-registry';
import { TROUBLE_BREWING_SCRIPT } from '../constants/trouble-brewing';

describe('setup counts', () => {
  it('follows the standard table and always fills every seat', () => {
    expect(compositionFor(8)).toEqual({ townsfolk: 5, outsiders: 1, minions: 1, demons: 1 });
    expect(compositionFor(15)).toEqual({ townsfolk: 9, outsiders: 2, minions: 3, demons: 1 });
    for (let n = 5; n <= 15; n++) {
      const c = compositionFor(n);
      expect(c.townsfolk + c.outsiders + c.minions + c.demons).toBe(n);
    }
  });

  it('lists only the setup modifiers in the role pool', () => {
    expect(setupModifiers(TROUBLE_BREWING_SCRIPT.characters)).toEqual([
      { roleId: 'baron', name: 'Baron', effect: '+2 Outsiders' }
    ]);
    const pool = RoleRegistry.toScriptCharacters(['godfather', 'balloonist', 'lilmonsta', 'kazali', 'chef']);
    expect(setupModifiers(pool).map(m => m.effect)).toEqual([
      '−1 or +1 Outsider', '+0 or +1 Outsider', 'no Demon seat, +1 Minion', 'any number of Outsiders'
    ]);
  });
});
