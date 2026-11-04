import { describe, expect, it } from 'vitest';
import { ClaimTrust, GameEvent, ScriptCharacter } from '../../models/game';
import { RoleRegistry } from '../../roles/role-registry';
import { InfoPayload } from '../../rules/info-specs';
import { SelfKnowledge, SolverInput } from '../solver';
import { ReferenceGame, legalRoleLists, referenceSolve, worldFits } from './reference-solver';
import { makePlayers } from './game-generator';

// Hand-checked cases for the reference solver itself. Many mirror
// solver.test.ts at 7 players or fewer, with expectations re-derived from
// the rules for the smaller game.

const TB_IDS = [
  'washerwoman', 'librarian', 'investigator', 'chef', 'empath', 'fortuneteller', 'undertaker',
  'monk', 'ravenkeeper', 'virgin', 'slayer', 'soldier', 'mayor',
  'butler', 'drunk', 'recluse', 'saint',
  'poisoner', 'spy', 'scarletwoman', 'baron',
  'imp'
];
const pool = (ids: string[]): ScriptCharacter[] => RoleRegistry.toScriptCharacters(ids);
const TB = pool(TB_IDS);
const NO_POISONER = pool(TB_IDS.filter(id => id !== 'poisoner'));

let seq = 0;
function ev(kind: string, extra: Partial<GameEvent> = {}): GameEvent {
  return { id: `e${++seq}`, gameId: 'g', night: 1, phase: 'day', kind, payload: {}, trust: 'asserted', createdAt: '', ...extra };
}
const claim = (actorId: string, roleId: string, trust: ClaimTrust = 'asserted') =>
  ev('claim', { actorId, payload: { roleId }, trust });
const info = (actorId: string, payload: InfoPayload, night = 1) => ev('info', { actorId, payload, night });
const death = (playerId: string) => ev('death', { payload: { playerId } });
const execution = (playerId: string, gameEnded = false) => ev('execution', { payload: { playerId, gameEnded } });
const me = (playerId: string, roleId: string, certain = true): SelfKnowledge => ({ playerId, roleId, certain });

function run(input: Partial<SolverInput> & { players: SolverInput['players'] }) {
  return referenceSolve({ characters: TB, events: [], ...input });
}
const roles = (r: ReturnType<typeof referenceSolve>, playerId: string) => [...r.possible.get(playerId)!].sort();
const can = (r: ReturnType<typeof referenceSolve>, playerId: string, roleId: string) => r.possible.get(playerId)!.has(roleId);

describe('reference: role pool and setup', () => {
  it('reads seatable roles and the Fibbin allowance', () => {
    const tb = new ReferenceGame({ characters: TB, players: makePlayers(5), events: [] });
    expect(tb.pool.length).toBe(22);
    expect(tb.fibbinAllowance).toBe(0);
    const withFibbin = new ReferenceGame({ characters: pool([...TB_IDS, 'fibbin']), players: makePlayers(5), events: [] });
    expect(withFibbin.pool.length).toBe(22);
    expect(withFibbin.fibbinAllowance).toBe(1);
  });

  it('5 players: 3/0/1/1, or 1/2/1/1 with the Baron', () => {
    const lists = legalRoleLists({ characters: TB, players: makePlayers(5), events: [] });
    expect(lists.length).toBeGreaterThan(0);
    for (const list of lists) {
      const team = (t: string) => list.filter(id => RoleRegistry.get(id)!.team === t).length;
      const counts = [team('townsfolk'), team('outsider'), team('minion'), team('demon')];
      expect(counts).toEqual(list.includes('baron') ? [1, 2, 1, 1] : [3, 0, 1, 1]);
    }
  });

  it("Lil' Monsta allows no Demon seat and one extra Minion", () => {
    const ids = ['chef', 'empath', 'noble', 'knight', 'steward', 'poisoner', 'spy', 'imp', 'lilmonsta'];
    const lists = legalRoleLists({ characters: pool(ids), players: makePlayers(5), events: [] });
    expect(lists.some(l => !l.includes('imp') && l.includes('poisoner') && l.includes('spy'))).toBe(true);
    expect(lists.every(l => !l.includes('lilmonsta'))).toBe(true);
  });

  it('Huntsman requires the Damsel', () => {
    const ids = ['huntsman', 'chef', 'empath', 'noble', 'knight', 'damsel', 'recluse', 'poisoner', 'imp'];
    const lists = legalRoleLists({ characters: pool(ids), players: makePlayers(6), events: [] });
    expect(lists.some(l => l.includes('huntsman'))).toBe(true);
    expect(lists.filter(l => l.includes('huntsman')).every(l => l.includes('damsel'))).toBe(true);
  });

  it('enumerates 5! seatings of a single legal list, without duplicates for repeated roles', () => {
    const exact = referenceSolve({ characters: pool(['chef', 'empath', 'noble', 'poisoner', 'imp']), players: makePlayers(5), events: [] });
    expect(exact.seatingsChecked).toBe(120);
    const game = new ReferenceGame({ characters: pool(['villageidiot', 'chef', 'poisoner', 'imp']), players: makePlayers(5), events: [] });
    const lists = [...game.legalLists()].map(l => l.map(r => r.id));
    expect(lists).toEqual([
      ['villageidiot', 'villageidiot', 'chef', 'poisoner', 'imp'],
      ['villageidiot', 'villageidiot', 'villageidiot', 'poisoner', 'imp']
    ]);
    const twoCopies = [...game.legalLists()][0];
    const seen = new Set([...game.seatings(twoCopies)].map(w => w.map(r => r.id).join()));
    expect(seen.size).toBe(5 * 4 * 3); // 5! / 2!
  });
});

describe('reference: spec scenarios', () => {
  it('unconstrained 5-player game: every seated role is possible for everyone', () => {
    const r = run({ players: makePlayers(5) });
    expect(r.consistent).toBe(true);
    expect(roles(r, 'p1')).toEqual([...TB_IDS].sort());
  });

  it('a certain Empath is only the Empath, and nobody else is', () => {
    const r = run({ players: makePlayers(5), self: me('p1', 'empath') });
    expect(roles(r, 'p1')).toEqual(['empath']);
    for (let i = 2; i <= 5; i++) expect(can(r, `p${i}`, 'empath')).toBe(false);
  });

  it('two confirmed Imps contradict', () => {
    const r = run({ players: makePlayers(5), events: [claim('p1', 'imp', 'confirmed'), claim('p2', 'imp', 'confirmed')] });
    expect(r.consistent).toBe(false);
  });
});

describe('reference: claims', () => {
  it('good players claim honestly, allowing for the Drunk', () => {
    const r = run({ players: makePlayers(6), events: [claim('p1', 'chef')] });
    expect(roles(r, 'p1')).toEqual(['baron', 'chef', 'drunk', 'imp', 'poisoner', 'scarletwoman', 'spy']);
  });

  it('doubted claims and honesty off add no constraint', () => {
    expect(roles(run({ players: makePlayers(5), events: [claim('p1', 'chef', 'doubted')] }), 'p1').length).toBe(22);
    const off = run({ players: makePlayers(5), events: [claim('p1', 'chef')], options: { assumeGoodPlayersHonest: false } });
    expect(roles(off, 'p1').length).toBe(22);
  });

  it('if the Drunk thinks they are the Chef, the Chef is not in play', () => {
    const r = run({ players: makePlayers(6), events: [claim('p1', 'chef'), claim('p2', 'chef', 'confirmed')] });
    expect(can(r, 'p1', 'drunk')).toBe(false);
  });

  it('a known-false claim rules out that role only', () => {
    const r = run({ players: makePlayers(5), events: [claim('p1', 'chef', 'false')] });
    expect(can(r, 'p1', 'chef')).toBe(false);
    expect(roles(r, 'p1').length).toBe(21);
  });
});

describe('reference: setup modifiers', () => {
  it('more Outsiders than the base count requires the Baron (7 players)', () => {
    const r = run({ players: makePlayers(7), events: [claim('p1', 'saint', 'confirmed'), claim('p2', 'butler', 'confirmed')] });
    expect(r.consistent).toBe(true);
    for (let i = 3; i <= 7; i++) {
      expect(can(r, `p${i}`, 'poisoner')).toBe(false);
      expect(can(r, `p${i}`, 'spy')).toBe(false);
    }
    expect(can(r, 'p3', 'baron')).toBe(true);
  });

  it('rules out the Baron when the Outsider count cannot change (5 players)', () => {
    const r = run({
      players: makePlayers(5),
      events: ['washerwoman', 'chef', 'empath'].map((role, i) => claim(`p${i + 1}`, role, 'confirmed'))
    });
    expect(can(r, 'p4', 'baron')).toBe(false);
    expect(can(r, 'p4', 'poisoner')).toBe(true);
  });
});

describe('reference: information', () => {
  it('a sober Washerwoman pins the Townsfolk (the Spy may register as it)', () => {
    const r = run({
      characters: NO_POISONER,
      players: makePlayers(7),
      self: me('p1', 'washerwoman'),
      events: [info('p1', { type: 'washerwoman', players: ['p2', 'p3'], roleId: 'chef' }), claim('p2', 'empath', 'confirmed')]
    });
    expect(roles(r, 'p3')).toEqual(['chef', 'spy']);
  });

  it('a certain Empath reading 0 clears both neighbours of the Demon and non-Spy Minions', () => {
    const r = run({ characters: NO_POISONER, players: makePlayers(7), self: me('p1', 'empath'), events: [info('p1', { type: 'empath', count: 0 })] });
    expect(can(r, 'p2', 'imp')).toBe(false);
    expect(can(r, 'p7', 'scarletwoman')).toBe(false);
    expect(can(r, 'p2', 'spy')).toBe(true);
  });

  it('uses alive neighbours at the time of the reading', () => {
    const base = { characters: NO_POISONER, players: makePlayers(7), self: me('p1', 'empath') };
    const after = run({ ...base, events: [death('p2'), info('p1', { type: 'empath', count: 0 })] });
    expect(can(after, 'p2', 'imp')).toBe(true);
    expect(can(after, 'p3', 'imp')).toBe(false);
    const before = run({ ...base, events: [info('p1', { type: 'empath', count: 0 }), death('p2')] });
    expect(can(before, 'p2', 'imp')).toBe(false);
  });

  it('a Recluse can register as evil to the Empath', () => {
    const r = run({ characters: NO_POISONER, players: makePlayers(7), self: me('p1', 'empath'), events: [info('p1', { type: 'empath', count: 2 })] });
    expect(can(r, 'p2', 'recluse')).toBe(true);
    expect(can(r, 'p2', 'chef')).toBe(false);
  });

  it('Fortune Teller NO rules out the Demon but not the Recluse; YES can be the red herring', () => {
    const base = { characters: NO_POISONER, players: makePlayers(5), self: me('p1', 'fortuneteller') };
    const no = run({ ...base, events: [info('p1', { type: 'fortuneteller', players: ['p2', 'p3'], yes: false })] });
    expect(can(no, 'p2', 'imp')).toBe(false);
    expect(can(no, 'p2', 'recluse')).toBe(true);
    const yes = run({ ...base, events: [info('p1', { type: 'fortuneteller', players: ['p2', 'p3'], yes: true })] });
    expect(can(yes, 'p4', 'imp')).toBe(true);
  });

  it('the Spy can register differently to two abilities', () => {
    // p2 must look like the Empath to the Washerwoman and like the Spy to the Investigator.
    const r = run({
      characters: NO_POISONER,
      players: makePlayers(7),
      self: me('p1', 'washerwoman'),
      events: [
        claim('p3', 'investigator', 'confirmed'),
        claim('p4', 'chef', 'confirmed'),
        claim('p6', 'soldier', 'confirmed'),
        info('p1', { type: 'washerwoman', players: ['p2', 'p6'], roleId: 'empath' }),
        info('p3', { type: 'investigator', players: ['p2', 'p4'], roleId: 'spy' })
      ]
    });
    expect(r.consistent).toBe(true);
    expect(roles(r, 'p2')).toEqual(['spy']);
  });

  it('a Poisoner is needed to explain a false reading', () => {
    const events = [claim('p3', 'chef', 'confirmed'), info('p1', { type: 'steward', player: 'p2' }), claim('p2', 'imp', 'confirmed')];
    const ids = ['steward', 'chef', 'empath', 'noble', 'knight', 'scarletwoman', 'imp'];
    const players = makePlayers(7);
    expect(referenceSolve({ characters: pool(ids), players, self: me('p1', 'steward'), events }).consistent).toBe(false);
    const withPoisoner = referenceSolve({ characters: pool([...ids, 'poisoner']), players, self: me('p1', 'steward'), events });
    expect(withPoisoner.consistent).toBe(true);
    expect([...withPoisoner.possible.values()].some(s => s.has('poisoner'))).toBe(true);
  });

  it('the Vortox makes sober Townsfolk info false', () => {
    const chars = pool(['steward', 'chef', 'empath', 'knight', 'noble', 'klutz', 'mutant', 'cerenovus', 'vortox']);
    const r = referenceSolve({
      characters: chars, players: makePlayers(5), self: me('p1', 'steward'),
      events: [info('p1', { type: 'steward', player: 'p2' })], options: { assumeGoodPlayersHonest: false }
    });
    expect(roles(r, 'p2')).toEqual(['cerenovus', 'vortox']);
  });

  it('Lycanthrope: the Faux Paw is a good player who registers as evil', () => {
    const base = ['steward', 'chef', 'empath', 'noble', 'knight', 'pixie', 'klutz', 'cerenovus', 'imp'];
    const input = (ids: string[]): SolverInput => ({
      characters: pool(ids), players: makePlayers(7), self: me('p1', 'empath'),
      events: [info('p1', { type: 'empath', count: 2 })], options: { assumeGoodPlayersHonest: false }
    });
    expect(can(referenceSolve(input(base)), 'p2', 'chef')).toBe(false);
    expect(can(referenceSolve(input([...base, 'lycanthrope'])), 'p2', 'chef')).toBe(true);
  });
});

describe('reference: false-info budget', () => {
  it('Fibbin allows one false reading per game, not per night', () => {
    const ids = ['steward', 'chef', 'empath', 'noble', 'knight', 'pixie', 'klutz', 'cerenovus', 'imp'];
    const events = [claim('p2', 'imp', 'confirmed'), claim('p3', 'cerenovus', 'confirmed'), info('p1', { type: 'steward', player: 'p2' }, 1)];
    const self = me('p1', 'steward');
    const players = makePlayers(7);
    expect(referenceSolve({ characters: pool(ids), players, self, events }).consistent).toBe(false);
    const withFibbin = pool([...ids, 'fibbin']);
    expect(referenceSolve({ characters: withFibbin, players, self, events }).consistent).toBe(true);
    const twice = [...events, claim('p4', 'noble', 'confirmed'), info('p4', { type: 'noble', players: ['p1', 'p5', 'p6'] }, 2)];
    expect(referenceSolve({ characters: withFibbin, players, self, events: twice }).consistent).toBe(false);
  });

  it('two false Village Idiots: one is the drunk copy, the other needs a Poisoner', () => {
    const events = [
      claim('p1', 'villageidiot', 'confirmed'),
      claim('p2', 'villageidiot', 'confirmed'),
      claim('p3', 'chef', 'confirmed'),
      claim('p4', 'empath', 'confirmed'),
      info('p1', { type: 'villageidiot', player: 'p3', yes: true }),
      info('p2', { type: 'villageidiot', player: 'p4', yes: true })
    ];
    const ids = ['villageidiot', 'chef', 'empath', 'noble', 'knight', 'scarletwoman', 'imp'];
    const players = makePlayers(7);
    expect(referenceSolve({ characters: pool(ids), players, events }).consistent).toBe(false);
    expect(referenceSolve({ characters: pool([...ids, 'poisoner']), players, events }).consistent).toBe(true);
  });

  it('tries each Village Idiot as the drunk copy', () => {
    // Freeing p2 works (p1 night 1 and the Empath night 2 are one poisoning each); freeing p1 does not.
    const events = [
      claim('p1', 'villageidiot', 'confirmed'),
      claim('p2', 'villageidiot', 'confirmed'),
      claim('p3', 'empath', 'confirmed'),
      claim('p4', 'chef', 'confirmed'),
      info('p1', { type: 'villageidiot', player: 'p4', yes: true }, 1),
      info('p2', { type: 'villageidiot', player: 'p4', yes: true }, 1),
      info('p2', { type: 'villageidiot', player: 'p4', yes: true }, 2),
      info('p3', { type: 'empath', count: 2 }, 2)
    ];
    const r = referenceSolve({ characters: pool(['villageidiot', 'chef', 'empath', 'noble', 'knight', 'poisoner', 'imp']), players: makePlayers(7), events });
    expect(r.consistent).toBe(true);
  });
});

describe('reference: public abilities and executions', () => {
  it('a Slayer kill proves the shooter and that the target registers as the Demon', () => {
    const r = run({ players: makePlayers(5), events: [info('p1', { type: 'slayer', player: 'p2', yes: true })] });
    expect(roles(r, 'p1')).toEqual(['slayer']);
    expect(roles(r, 'p2')).toEqual(['imp', 'recluse']);
  });

  it('a Virgin execution proves the nominator registers as a Townsfolk', () => {
    const r = run({ players: makePlayers(5), events: [info('p1', { type: 'virgin', player: 'p2', yes: true })] });
    expect(roles(r, 'p1')).toEqual(['virgin']);
    expect(can(r, 'p2', 'spy')).toBe(true);
    expect(can(r, 'p2', 'imp')).toBe(false);
  });

  it('a Saint executed without the game ending must have been poisoned', () => {
    // 6 players: at 5 the Saint needs the Baron, which leaves no room for a Poisoner.
    const small = ['chef', 'empath', 'monk', 'soldier', 'saint', 'butler', 'spy', 'imp'];
    expect(can(run({ characters: pool(small), players: makePlayers(6), events: [execution('p3')] }), 'p3', 'saint')).toBe(false);
    expect(can(run({ characters: pool([...small, 'poisoner']), players: makePlayers(6), events: [execution('p3')] }), 'p3', 'saint')).toBe(true);
    expect(can(run({ players: makePlayers(5), events: [execution('p3')] }), 'p3', 'saint')).toBe(false);
  });

  it('executing the Imp without the game ending requires the Scarlet Woman', () => {
    expect(can(run({ players: makePlayers(5), events: [execution('p3')] }), 'p3', 'imp')).toBe(true);
    const noSw = pool(TB_IDS.filter(id => id !== 'scarletwoman'));
    expect(can(run({ characters: noSw, players: makePlayers(5), events: [execution('p3')] }), 'p3', 'imp')).toBe(false);
  });

  it('an execution that ends the game means the Demon or the Saint died', () => {
    const r = run({ players: makePlayers(5), events: [execution('p3', true)] });
    expect(roles(r, 'p3')).toEqual(['imp', 'saint']);
  });
});

describe('reference: worldFits', () => {
  it('accepts a grimoire that fits and rejects one that does not', () => {
    const input: SolverInput = { characters: TB, players: makePlayers(5), events: [claim('p1', 'imp', 'confirmed')] };
    expect(worldFits(input, ['imp', 'poisoner', 'chef', 'empath', 'monk'])).toBe(true);
    expect(worldFits(input, ['chef', 'poisoner', 'imp', 'empath', 'monk'])).toBe(false);
    expect(worldFits(input, ['imp', 'poisoner', 'chef', 'empath', 'drunk'])).toBe(false); // wrong counts
  });
});
