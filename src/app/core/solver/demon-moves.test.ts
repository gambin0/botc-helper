import { describe, expect, it } from 'vitest';
import { ClaimTrust, GameEvent } from '../models/game';
import { RoleRegistry } from '../roles/role-registry';
import { InfoPayload } from '../rules/info-specs';
import { referenceSolve } from './reference/reference-solver';
import { makePlayers } from './reference/game-generator';
import { SolverInput, solve } from './solver';

/**
 * The Demon changing seats: Imp star-passes and the Scarlet Woman.
 * Every scenario runs on both the engine and the brute-force reference.
 */

// 7 players: 5 Townsfolk, 0 Outsiders, 1 Minion, 1 Demon (small pool so the reference is quick).
const POOL = ['slayer', 'chef', 'empath', 'monk', 'soldier', 'mayor', 'washerwoman', 'butler', 'poisoner', 'spy', 'scarletwoman', 'imp'];
const without = (...ids: string[]) => POOL.filter(id => !ids.includes(id));

let seq = 0;
const ev = (kind: string, night: number, extra: Partial<GameEvent>): GameEvent => ({
  id: `e${++seq}`, gameId: 'g', night, phase: 'day', kind, payload: {}, trust: 'asserted', createdAt: '', ...extra
});
const claim = (actorId: string, roleId: string, trust: ClaimTrust = 'confirmed') => ev('claim', 1, { actorId, payload: { roleId }, trust });
const death = (playerId: string, night: number) => ev('death', night, { payload: { playerId } });
const execution = (playerId: string, night: number, gameEnded = false) => ev('execution', night, { payload: { playerId, gameEnded } });
const info = (actorId: string, payload: InfoPayload, night: number) => ev('info', night, { actorId, payload });

interface Outcome {
  consistent: boolean;
  can(playerId: string, roleId: string): boolean;
  demonNow: string[];
}

function both(pool: string[], events: GameEvent[]): Outcome[] {
  const input: SolverInput = { characters: RoleRegistry.toScriptCharacters(pool), players: makePlayers(7), events };
  const engine = solve(input);
  const ref = referenceSolve(input);
  return [
    {
      consistent: engine.consistent,
      can: (p, r) => engine.possibleRoles.some(x => x.playerId === p && x.roleId === r && x.status !== 'impossible'),
      demonNow: [...engine.demonNow].sort()
    },
    { consistent: ref.consistent, can: (p, r) => ref.possible.get(p)!.has(r), demonNow: [...ref.demonNow].sort() }
  ];
}

describe.each([0, 1])('the Demon changing seats (%s = engine, reference)', which => {
  const run = (pool: string[], events: GameEvent[]) => both(pool, events)[which];

  it('without deaths, the Demon now is whoever can start as the Demon', () => {
    const r = run(POOL, [claim('p1', 'chef'), claim('p2', 'imp')]);
    expect(r.demonNow).toEqual(['p2']);
  });

  it('a star-pass lets a Minion be killed by the Slayer as the Demon', () => {
    // P2 (the Imp) dies on night 2; on day 3 the Slayer kills P5 as the Demon.
    const events = [claim('p1', 'slayer'), claim('p2', 'imp'), death('p2', 2), info('p1', { type: 'slayer', player: 'p5', yes: true }, 3)];
    const r = run(without('scarletwoman'), events);
    expect(r.consistent).toBe(true);
    expect(r.can('p5', 'poisoner')).toBe(true);
    expect(r.can('p5', 'spy')).toBe(true);
    expect(r.can('p5', 'chef')).toBe(false);
    // Without the death, P5 would have to be the Imp, and P2 already is: a contradiction.
    expect(run(without('scarletwoman'), events.filter(e => e.kind !== 'death')).consistent).toBe(false);
  });

  it('after a star-pass, the Demon now is one of the living Minions', () => {
    const r = run(without('scarletwoman'), [claim('p1', 'chef'), claim('p2', 'imp'), death('p2', 2), claim('p3', 'mayor'), claim('p4', 'monk')]);
    expect(r.demonNow).toEqual(['p5', 'p6', 'p7']);
  });

  it('a Demon that cannot pass on dying ends the game, so later events rule it out', () => {
    // No Scarlet Woman, and the Demon is a No Dashii: P2 dying ends the game.
    const pool = [...without('scarletwoman', 'imp'), 'nodashii'];
    const later = run(pool, [death('p2', 2), info('p1', { type: 'chef', count: 0 }, 3)]);
    expect(later.can('p2', 'nodashii')).toBe(false);
    // If nothing happens afterwards, the game may simply have ended there.
    const last = run(pool, [death('p2', 2)]);
    expect(last.can('p2', 'nodashii')).toBe(true);
    expect(last.demonNow).not.toContain('p2');
  });

  it('the Scarlet Woman takes over when the Demon is executed with 5 or more alive', () => {
    const events = [claim('p3', 'imp'), execution('p3', 1)];
    const r = run(POOL, events);
    expect(r.consistent).toBe(true);
    expect(r.can('p4', 'scarletwoman')).toBe(true);
    expect(r.demonNow.length).toBeGreaterThan(0);
    expect(r.demonNow).not.toContain('p3');
    // The new Demon is whoever is the Scarlet Woman: only seats that can be her.
    const sw = run(POOL, [...events, claim('p4', 'scarletwoman'), claim('p5', 'mayor')]);
    expect(sw.demonNow).toEqual(['p4']);
  });

  it('the Scarlet Woman must take over, so the game cannot end on the Imp with her alive', () => {
    const r = run(POOL, [claim('p3', 'imp'), claim('p4', 'scarletwoman'), execution('p3', 1, true)]);
    expect(r.consistent).toBe(false);
  });

  it('a game-ending execution can kill a Minion who caught the star', () => {
    const events = [claim('p2', 'imp'), death('p2', 2), execution('p5', 3, true)];
    const r = run(without('scarletwoman'), events);
    expect(r.consistent).toBe(true);
    expect(r.can('p5', 'poisoner')).toBe(true);
    expect(r.can('p5', 'chef')).toBe(false);
  });
});
