import { describe, expect, it } from 'vitest';
import { suggestBluffs } from './bluffs';
import { solve } from './solver';
import { RoleRegistry } from '../roles/role-registry';
import { GameEvent, Player } from '../models/game';
import { getRoleTips, hasSpecificTips } from '../rules/role-tips';
import { TROUBLE_BREWING_SCRIPT } from '../constants/trouble-brewing';

const TB = TROUBLE_BREWING_SCRIPT.characters;
const players: Player[] = Array.from({ length: 8 }, (_, i) => ({
  id: `p${i + 1}`, gameId: 'g', name: `P${i + 1}`, seat: i + 1, alive: true
}));
const claim = (actorId: string, roleId: string, trust: GameEvent['trust'] = 'asserted'): GameEvent => ({
  id: `${actorId}-${roleId}`, gameId: 'g', night: 1, phase: 'day', kind: 'claim', actorId, payload: { roleId }, trust, createdAt: ''
});

function bluffs(events: GameEvent[], demonBluffs: string[] = []) {
  const self = { playerId: 'p1', roleId: 'imp', certain: true };
  const deductions = solve({ characters: TB, players, events, self });
  return suggestBluffs({ characters: TB, players, events, deductions, selfPlayerId: 'p1', demonBluffs });
}
const find = (list: ReturnType<typeof bluffs>, id: string) => list.find(b => b.roleId === id)!;

describe('suggestBluffs', () => {
  it('only suggests good characters', () => {
    const list = bluffs([]);
    expect(list.every(b => b.team === 'townsfolk' || b.team === 'outsider')).toBe(true);
    expect(list.length).toBe(17);
  });

  it('marks claimed roles to avoid and Storyteller bluffs as safe', () => {
    const list = bluffs([claim('p3', 'chef')], ['monk', 'saint', 'empath']);
    expect(find(list, 'chef').rating).toBe('avoid');
    expect(find(list, 'chef').reasons[0]).toContain('P3');
    expect(find(list, 'monk').rating).toBe('safe');
    expect(list[0].rating).toBe('safe');
    expect(list.at(-1)!.rating).toBe('avoid');
  });

  it('ignores claims known to be false', () => {
    expect(find(bluffs([claim('p3', 'chef', 'false')]), 'chef').rating).toBe('possible');
  });

  it('is safe when the evidence rules everyone else out', () => {
    // 7 confirmed players leave nobody else able to be the Mayor.
    const roles = ['chef', 'empath', 'monk', 'soldier', 'virgin', 'poisoner', 'butler'];
    const events = roles.map((r, i) => claim(`p${i + 2}`, r, 'confirmed'));
    const mayor = find(bluffs(events), 'mayor');
    expect(mayor.rating).toBe('safe');
    expect(mayor.holders).toBe(0);
  });
});

describe('role tips', () => {
  it('has specific tips for every Trouble Brewing character', () => {
    for (const c of TB) expect(hasSpecificTips(c.id), c.id).toBe(true);
  });

  it('falls back to team tips for every other official character', () => {
    for (const role of RoleRegistry.getAll()) {
      expect(getRoleTips(role.id, role.team).focus.length, role.id).toBeGreaterThan(0);
    }
  });
});
