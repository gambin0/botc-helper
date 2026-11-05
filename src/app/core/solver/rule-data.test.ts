import { describe, expect, it } from 'vitest';
import { ClaimTrust, GameEvent } from '../models/game';
import { RoleRegistry } from '../roles/role-registry';
import { InfoPayload } from '../rules/info-specs';
import { referenceSolve } from './reference/reference-solver';
import { makePlayers } from './reference/game-generator';
import { SolverInput, solve } from './solver';

/**
 * Rule-data fixes the fuzzer cannot catch on its own (both solvers share the
 * rule data): a dead Poisoner, the Widow's single poisoned player, and
 * Undertaker info naming someone who was not executed.
 * Every scenario runs on both the engine and the brute-force reference.
 */

// 7 players: 5 Townsfolk, 0 Outsiders, 1 Minion, 1 Demon. No Drunk, Spy or Recluse,
// so false info can only come from poisoning.
const TOWN = ['empath', 'chef', 'monk', 'soldier', 'mayor', 'undertaker', 'slayer', 'butler'];
const withMinion = (minion: string) => [...TOWN, minion, 'imp'];

let seq = 0;
const ev = (kind: string, night: number, extra: Partial<GameEvent>): GameEvent => ({
  id: `r${++seq}`, gameId: 'g', night, phase: 'day', kind, payload: {}, trust: 'asserted', createdAt: '', ...extra
});
const claim = (actorId: string, roleId: string, trust: ClaimTrust = 'confirmed') => ev('claim', 1, { actorId, payload: { roleId }, trust });
const execution = (playerId: string, night: number) => ev('execution', night, { payload: { playerId, gameEnded: false } });
const info = (actorId: string, payload: InfoPayload, night: number) => ev('info', night, { actorId, payload });

// Both of the Empath's neighbours (P2, P7) evil is impossible with P5 confirmed as the
// only Minion, and a Chef count of 3 is impossible with 2 evil players: both are false info.
const empathWrong = (night: number) => info('p1', { type: 'empath', count: 2 }, night);
const chefWrong = (night: number) => info('p4', { type: 'chef', count: 3 }, night);

interface Outcome {
  consistent: boolean;
  can(playerId: string, roleId: string): boolean;
}

function both(pool: string[], events: GameEvent[]): Outcome[] {
  const input: SolverInput = { characters: RoleRegistry.toScriptCharacters(pool), players: makePlayers(7), events };
  const engine = solve(input);
  const ref = referenceSolve(input);
  return [
    {
      consistent: engine.consistent,
      can: (p, r) => engine.possibleRoles.some(x => x.playerId === p && x.roleId === r && x.status !== 'impossible')
    },
    { consistent: ref.consistent, can: (p, r) => ref.possible.get(p)!.has(r) }
  ];
}

describe.each([0, 1])('rule data (%s = engine, reference)', which => {
  const run = (pool: string[], events: GameEvent[]) => both(pool, events)[which];

  it('a Poisoner executed on day 1 cannot poison on night 2', () => {
    const base = [claim('p1', 'empath'), claim('p5', 'poisoner')];
    expect(run(withMinion('poisoner'), [...base, execution('p5', 1), empathWrong(2)]).consistent).toBe(false);
    // Executed after that night's info: still alive when it poisoned.
    expect(run(withMinion('poisoner'), [...base, empathWrong(2), execution('p5', 2)]).consistent).toBe(true);
  });

  it('the Widow poisons one player for the whole game', () => {
    const twoPlayers = (minion: string) => [claim('p1', 'empath'), claim('p4', 'chef'), claim('p5', minion), chefWrong(1), empathWrong(2)];
    expect(run(withMinion('widow'), twoPlayers('widow')).consistent).toBe(false);
    // A Poisoner can choose a different player each night.
    expect(run(withMinion('poisoner'), twoPlayers('poisoner')).consistent).toBe(true);
    // The same player wrong on two nights: the Widow's one poisoned player.
    expect(run(withMinion('widow'), [claim('p1', 'empath'), claim('p5', 'widow'), empathWrong(1), empathWrong(2)]).consistent).toBe(true);
  });

  it('Undertaker info must name the player executed the day before', () => {
    const named = info('p1', { type: 'undertaker', player: 'p3', roleId: 'imp' }, 2);
    const noExecution = run(withMinion('poisoner'), [claim('p1', 'undertaker', 'asserted'), named]);
    expect(noExecution.can('p1', 'undertaker')).toBe(false);
    expect(noExecution.can('p1', 'poisoner')).toBe(true);
    const executed = run(withMinion('poisoner'), [claim('p1', 'undertaker', 'asserted'), execution('p3', 1), named]);
    expect(executed.can('p1', 'undertaker')).toBe(true);
  });
});

describe.each([0, 1])('one player drunk or poisoned for the game (%s = engine, reference)', which => {
  const run = (pool: string[], events: GameEvent[]) => both(pool, events)[which];
  const pool = [...TOWN, 'mastermind', 'lleech'];
  const base = [claim('p1', 'empath'), claim('p4', 'chef'), claim('p5', 'mastermind')];

  it("the Lleech's host is the same player all game", () => {
    expect(run(pool, [...base, chefWrong(1), empathWrong(2)]).consistent).toBe(false);
    expect(run(pool, [...base, empathWrong(1), empathWrong(2)]).consistent).toBe(true);
  });
});

describe.each([0, 1])('info that comes with dying (%s = engine, reference)', which => {
  const run = (pool: string[], events: GameEvent[]) => both(pool, events)[which];
  const pool = [...TOWN, 'ravenkeeper', 'sage', 'poisoner', 'imp'];
  const death = (playerId: string, night: number) => ev('death', night, { payload: { playerId } });

  it('Ravenkeeper and Sage info needs the source to have died that night', () => {
    const raven = info('p1', { type: 'ravenkeeper', player: 'p3', roleId: 'chef' }, 2);
    const alive = run(pool, [claim('p1', 'ravenkeeper', 'asserted'), raven]);
    expect(alive.can('p1', 'ravenkeeper')).toBe(false);
    expect(run(pool, [claim('p1', 'ravenkeeper', 'asserted'), death('p1', 2), raven]).can('p1', 'ravenkeeper')).toBe(true);

    const sage = info('p2', { type: 'sage', players: ['p3', 'p4'] }, 3);
    expect(run(pool, [claim('p2', 'sage', 'asserted'), sage]).can('p2', 'sage')).toBe(false);
    expect(run(pool, [claim('p2', 'sage', 'asserted'), death('p2', 3), sage]).can('p2', 'sage')).toBe(true);
  });
});

describe.each([0, 1])('who an honest good player can be (%s = engine, reference)', which => {
  const run = (pool: string[], events: GameEvent[]) => both(pool, events)[which];
  // With a Baron: 3 Townsfolk and 2 Outsiders.
  const chefClaim = [claim('p1', 'chef', 'asserted')];

  it('the Lunatic thinks they are the Demon, so they bluff a good character', () => {
    expect(run([...TOWN, 'lunatic', 'baron', 'imp'], chefClaim).can('p1', 'lunatic')).toBe(true);
  });

  it('the Mutant must not claim to be an Outsider', () => {
    const pool = [...TOWN, 'mutant', 'baron', 'imp'];
    expect(run(pool, chefClaim).can('p1', 'mutant')).toBe(true);
    expect(run(pool, [claim('p1', 'butler', 'asserted')]).can('p1', 'mutant')).toBe(false);
  });

  it('the Hermit has the Drunk ability when the Drunk is on the script', () => {
    expect(run([...TOWN, 'hermit', 'drunk', 'baron', 'imp'], chefClaim).can('p1', 'hermit')).toBe(true);
    expect(run([...TOWN, 'hermit', 'baron', 'imp'], chefClaim).can('p1', 'hermit')).toBe(false);
  });

  it('the Hermit can register like the Recluse when the Recluse is on the script', () => {
    const events = [
      claim('p1', 'investigator'),
      claim('p2', 'chef'),
      claim('p3', 'hermit'),
      info('p1', { type: 'investigator', players: ['p2', 'p3'], roleId: 'baron' }, 1)
    ];
    const pool = [...TOWN, 'investigator', 'hermit', 'baron', 'imp'];
    expect(run([...pool, 'recluse'], events).consistent).toBe(true);
    expect(run(pool, events).consistent).toBe(false);
  });
});

describe('rule data warnings', () => {
  it('warns when Ravenkeeper info comes from someone who did not die', () => {
    const r = solve({
      characters: RoleRegistry.toScriptCharacters([...TOWN, 'ravenkeeper', 'poisoner', 'imp']),
      players: makePlayers(7),
      events: [info('p1', { type: 'ravenkeeper', player: 'p3', roleId: 'chef' }, 2)]
    });
    expect(r.warnings.some(w => w.includes('did not die that night'))).toBe(true);
  });

  it('warns about characters whose changes are not modelled', () => {
    const r = solve({
      characters: RoleRegistry.toScriptCharacters([...TOWN, 'poisoner', 'imp', 'bountyhunter']),
      players: makePlayers(7),
      events: []
    });
    expect(r.warnings.some(w => w.startsWith('Bounty Hunter:'))).toBe(true);
  });

  it('warns when Undertaker info names someone who was not executed', () => {
    const r = solve({
      characters: RoleRegistry.toScriptCharacters(withMinion('poisoner')),
      players: makePlayers(7),
      events: [info('p1', { type: 'undertaker', player: 'p3', roleId: 'imp' }, 2)]
    });
    expect(r.warnings.some(w => w.includes('was not executed'))).toBe(true);
  });
});
