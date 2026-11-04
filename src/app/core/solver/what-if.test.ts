import { describe, expect, it } from 'vitest';
import { stressTestClaim, WhatIfInput } from './what-if';
import { GameEvent, Player } from '../models/game';
import { TROUBLE_BREWING_SCRIPT } from '../constants/trouble-brewing';

const TB = TROUBLE_BREWING_SCRIPT.characters;
const players = (n: number): Player[] =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, gameId: 'g', name: `P${i + 1}`, seat: i + 1, alive: true }));
const claim = (actorId: string, roleId: string, trust: GameEvent['trust'] = 'asserted'): GameEvent => ({
  id: `${actorId}-${roleId}`, gameId: 'g', night: 1, phase: 'day', kind: 'claim', actorId, payload: { roleId }, trust, createdAt: ''
});
const test = (over: Partial<WhatIfInput>) =>
  stressTestClaim({ characters: TB, players: players(8), events: [], selfPlayerId: 'p1', claimRoleId: 'chef', night: 1, ...over });

describe('stressTestClaim', () => {
  it('is quiet when the claim adds nothing', () => {
    const r = test({});
    expect(r.verdict).toBe('quiet');
    expect(r.changes.every(c => c.isSelf)).toBe(true);
  });

  it('exposes you when the character is confirmed elsewhere', () => {
    const r = test({ events: [claim('p2', 'chef', 'confirmed')] });
    expect(r.verdict).toBe('exposed');
    expect(r.sameClaim).toEqual(['P2']);
  });

  it('flags hard contradictions from public outcomes', () => {
    // Claiming you shot P3 and they died, while P3 is confirmed as the Chef.
    const r = test({
      events: [claim('p3', 'chef', 'confirmed')],
      claimRoleId: 'slayer',
      info: { type: 'slayer', player: 'p3', yes: true }
    });
    expect(r.verdict).toBe('contradiction');
    expect(r.conflicts.length).toBeGreaterThan(0);
  });

  it('reports what the table concludes if they believe you', () => {
    // 7 players: 5 Townsfolk, 0 Outsiders. Four Townsfolk are confirmed.
    const events = ['chef', 'empath', 'monk', 'soldier'].map((r, i) => claim(`p${i + 2}`, r, 'confirmed'));
    const r = stressTestClaim({
      characters: TB, players: players(7), events, selfPlayerId: 'p1', claimRoleId: 'mayor', night: 1
    });
    expect(r.verdict).toBe('quiet');
    const believed = Object.fromEntries(r.ifBelieved.map(c => [c.playerId, c.changes]));
    expect(believed['p6']).toContain('can now be proven evil');
    expect(believed['p7']).toContain('can now be proven evil');
  });

  it('reveals when the claim proves something about another player', () => {
    // A Virgin execution is public: it proves the nominator registers as a Townsfolk.
    const r = test({ claimRoleId: 'virgin', info: { type: 'virgin', player: 'p2', yes: true } });
    expect(r.verdict).toBe('reveals');
    const p2 = r.changes.find(c => c.playerId === 'p2');
    expect(p2?.changes.join(' ')).toMatch(/cleared of being the Demon|fewer possible/);
  });
});
