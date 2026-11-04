import { describe, expect, it } from 'vitest';
import { GameEvent } from '../../models/game';
import { RoleRegistry } from '../../roles/role-registry';
import { InfoPayload } from '../../rules/info-specs';
import { solve } from '../solver';
import { makePlayers } from './game-generator';
import { referenceSolve } from './reference-solver';
import { differentialCheck, explainByKnownBug } from './checks';

// Minimized engine disagreements, one per FINDINGS.md entry (F-numbers match).
// Each asserts the CORRECT answer, so `it.fails` passes while the engine is
// wrong. When the engine is fixed, the test starts failing: change it.fails
// to it and mark the finding fixed.

let seq = 0;
const ev = (kind: string, extra: Partial<GameEvent>): GameEvent => ({
  id: `r${++seq}`, gameId: 'g', night: 1, phase: 'day', kind, payload: {}, trust: 'asserted', createdAt: '', ...extra
});
const confirmed = (actorId: string, roleId: string) => ev('claim', { actorId, payload: { roleId }, trust: 'confirmed' });
const info = (actorId: string, payload: InfoPayload, night: number) => ev('info', { actorId, payload, night });

describe('engine regressions found by the reference solver', () => {
  // F-001: with two Village Idiots, the engine always treats the first one in
  // the log as the drunk copy instead of trying each.
  const f001 = {
    characters: RoleRegistry.toScriptCharacters(['villageidiot', 'chef', 'empath', 'noble', 'knight', 'poisoner', 'imp']),
    players: makePlayers(7),
    events: [
      confirmed('p1', 'villageidiot'),
      confirmed('p2', 'villageidiot'),
      confirmed('p3', 'empath'),
      confirmed('p4', 'chef'),
      info('p1', { type: 'villageidiot', player: 'p4', yes: true }, 1),
      info('p2', { type: 'villageidiot', player: 'p4', yes: true }, 1),
      info('p2', { type: 'villageidiot', player: 'p4', yes: true }, 2),
      info('p3', { type: 'empath', count: 2 }, 2)
    ]
  };

  it('F-001 reference: consistent if p2 is the drunk Village Idiot', () => {
    expect(referenceSolve(f001).consistent).toBe(true);
  });

  it.fails('F-001 engine: tries each Village Idiot as the drunk copy', () => {
    expect(solve(f001).consistent).toBe(true);
  });

  // F-002: Outsider modifiers are clamped at zero after each one, in pool
  // order, so listing the Godfather before the Baron loses the legal setup.
  const f002 = (order: string[]) => ({
    characters: RoleRegistry.toScriptCharacters(['villageidiot', 'slayer', ...order, 'drunk', 'lilmonsta']),
    players: makePlayers(7),
    events: []
  });

  it('F-002 reference: the setup is legal in either pool order', () => {
    expect(referenceSolve(f002(['baron', 'godfather'])).consistent).toBe(true);
    expect(referenceSolve(f002(['godfather', 'baron'])).consistent).toBe(true);
  });

  it.fails('F-002 engine: Godfather listed before the Baron', () => {
    expect(solve(f002(['godfather', 'baron'])).consistent).toBe(true);
  });

  // The fuzz filter (checks.ts) must recognise each recorded bug from its regression case.
  it('the known-bug filter attributes each case to its finding', () => {
    const passes = (v: Parameters<typeof differentialCheck>[0]) => differentialCheck(v).status !== 'disagree';
    expect(differentialCheck(f001).status).toBe('disagree');
    expect(explainByKnownBug(f001, passes)).toBe('F-001');
    const order = f002(['godfather', 'baron']);
    expect(differentialCheck(order).status).toBe('disagree');
    expect(explainByKnownBug(order, passes)).toBe('F-002');
  });
});
