import { describe, expect, it } from 'vitest';
import { GameEvent } from '../../models/game';
import { RoleRegistry } from '../../roles/role-registry';
import { InfoPayload } from '../../rules/info-specs';
import { SolverInput, solve } from '../solver';
import { makePlayers } from './game-generator';
import { referenceSolve } from './reference-solver';
import { differentialCheck, explainByKnownBug } from './checks';

// Minimized engine disagreements, one per FINDINGS.md entry (F-numbers match).
// Each asserts the CORRECT answer. While a bug is open its engine test is
// `it.fails` (it passes because the engine is wrong); once fixed it becomes a
// plain `it` that guards against the bug coming back.

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

  it('F-001 engine (fixed): tries each Village Idiot as the drunk copy', () => {
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

  it('F-002 engine (fixed): the setup is legal in either pool order', () => {
    expect(solve(f002(['godfather', 'baron'])).consistent).toBe(true);
    expect(solve(f002(['baron', 'godfather'])).consistent).toBe(true);
  });

  it('F-001 and F-002: engine and reference agree on the regression cases', () => {
    expect(differentialCheck(f001).status).toBe('agree');
    expect(differentialCheck(f002(['godfather', 'baron'])).status).toBe('agree');
  });

  it('the known-bug filter attributes a failure to the bug whose workaround removes it', () => {
    const swapToBaronFirst = (input: SolverInput): SolverInput[] => [{ ...input, characters: [...input.characters].reverse() }];
    const input = f002(['godfather', 'baron']);
    expect(explainByKnownBug(input, v => v.characters[0].id !== 'godfather', [['F-test', swapToBaronFirst]])).toBe('F-test');
    expect(explainByKnownBug(input, () => false, [['F-test', swapToBaronFirst]])).toBeNull();
  });
});
