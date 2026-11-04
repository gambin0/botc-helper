import { describe, expect, it } from 'vitest';
import { DeductionEngine, SelfKnowledge, SolverInput, solve } from './solver';
import { RoleRegistry } from '../roles/role-registry';
import { ClaimTrust, DeductionResult, GameEvent, Player, ScriptCharacter } from '../models/game';
import { InfoPayload } from '../rules/info-specs';

const TB_IDS = [
  'washerwoman', 'librarian', 'investigator', 'chef', 'empath', 'fortuneteller', 'undertaker',
  'monk', 'ravenkeeper', 'virgin', 'slayer', 'soldier', 'mayor',
  'butler', 'drunk', 'recluse', 'saint',
  'poisoner', 'spy', 'scarletwoman', 'baron',
  'imp'
];
const TB = RoleRegistry.toScriptCharacters(TB_IDS);
const pool = (ids: string[]): ScriptCharacter[] => RoleRegistry.toScriptCharacters(ids);

function players(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    gameId: 'g',
    name: `P${i + 1}`,
    seat: i + 1,
    alive: true
  }));
}

let seq = 0;
function ev(kind: string, extra: Partial<GameEvent> = {}): GameEvent {
  return {
    id: `e${++seq}`,
    gameId: 'g',
    night: 1,
    phase: 'day',
    kind,
    payload: {},
    trust: 'asserted',
    createdAt: '',
    ...extra
  };
}
const claim = (actorId: string, roleId: string, trust: ClaimTrust = 'asserted') =>
  ev('claim', { actorId, payload: { roleId }, trust });
const info = (actorId: string, payload: InfoPayload, night = 1) => ev('info', { actorId, payload, night });
const death = (playerId: string) => ev('death', { payload: { playerId } });
const execution = (playerId: string, gameEnded = false) => ev('execution', { payload: { playerId, gameEnded } });

function run(input: Partial<SolverInput> & { players: Player[] }): DeductionResult {
  return solve({ characters: TB, events: [], ...input });
}

function possibleRoles(result: DeductionResult, playerId: string): string[] {
  return result.possibleRoles.filter(r => r.playerId === playerId && r.status !== 'impossible').map(r => r.roleId);
}
function can(result: DeductionResult, playerId: string, roleId: string): boolean {
  return possibleRoles(result, playerId).includes(roleId);
}
const me = (playerId: string, roleId: string, certain = true): SelfKnowledge => ({ playerId, roleId, certain });

describe('setup rules', () => {
  it('allows every role for everyone when nothing is known (8 players)', () => {
    const r = run({ players: players(8) });
    expect(r.consistent).toBe(true);
    expect(possibleRoles(r, 'p1').sort()).toEqual([...TB_IDS].sort());
  });

  it('enforces uniqueness: a certain self role cannot belong to anyone else', () => {
    const r = run({ players: players(8), self: me('p1', 'empath') });
    expect(possibleRoles(r, 'p1')).toEqual(['empath']);
    expect(r.possibleRoles.find(x => x.playerId === 'p1' && x.roleId === 'empath')?.status).toBe('confirmed');
    for (let i = 2; i <= 8; i++) expect(can(r, `p${i}`, 'empath')).toBe(false);
  });

  it('requires the Baron when there are more Outsiders than the base count', () => {
    // 7 players = 5 Townsfolk, 0 Outsiders, 1 Minion, 1 Demon.
    const r = run({
      players: players(7),
      events: [claim('p1', 'saint', 'confirmed'), claim('p2', 'butler', 'confirmed')]
    });
    expect(r.consistent).toBe(true);
    for (let i = 3; i <= 7; i++) {
      expect(can(r, `p${i}`, 'poisoner')).toBe(false);
      expect(can(r, `p${i}`, 'spy')).toBe(false);
      expect(can(r, `p${i}`, 'scarletwoman')).toBe(false);
    }
    expect(can(r, 'p3', 'baron')).toBe(true);
  });

  it('rules out the Baron when the Outsider count cannot change', () => {
    // 5 players: 3 Townsfolk, 0 Outsiders, 1 Minion, 1 Demon. Baron would need 2 Outsiders.
    const r = run({
      players: players(5),
      events: ['washerwoman', 'chef', 'empath'].map((role, i) => claim(`p${i + 1}`, role, 'confirmed'))
    });
    expect(can(r, 'p4', 'baron')).toBe(false);
    expect(can(r, 'p5', 'baron')).toBe(false);
    expect(can(r, 'p4', 'poisoner')).toBe(true);
  });

  it('has exactly one Demon', () => {
    const r = run({ players: players(5), events: [claim('p1', 'imp', 'confirmed')] });
    for (let i = 2; i <= 5; i++) expect(possibleRoles(r, `p${i}`).some(x => x === 'imp')).toBe(false);
  });
});

describe('information and reliability', () => {
  const noCorruption = TB_IDS.filter(id => id !== 'poisoner');

  it('a certain, sober Washerwoman pins the Townsfolk to one of two players', () => {
    const r = run({
      characters: pool(noCorruption),
      players: players(8),
      self: me('p1', 'washerwoman'),
      events: [
        info('p1', { type: 'washerwoman', players: ['p2', 'p3'], roleId: 'chef' }),
        claim('p2', 'empath', 'confirmed')
      ]
    });
    // The Spy may register as the Chef.
    expect(possibleRoles(r, 'p3').sort()).toEqual(['chef', 'spy']);
  });

  it('the same info is NOT trusted when a Poisoner could be in play', () => {
    const r = run({
      players: players(8),
      self: me('p1', 'washerwoman'),
      events: [
        info('p1', { type: 'washerwoman', players: ['p2', 'p3'], roleId: 'chef' }),
        claim('p2', 'empath', 'confirmed')
      ]
    });
    expect(can(r, 'p3', 'imp')).toBe(true);
    // ...but then the Poisoner must be in play, so p3 cannot be the Chef's "replacement" freely:
    const engine = new DeductionEngine({
      characters: TB,
      players: players(8),
      self: me('p1', 'washerwoman'),
      events: [
        info('p1', { type: 'washerwoman', players: ['p2', 'p3'], roleId: 'chef' }),
        claim('p2', 'empath', 'confirmed')
      ]
    });
    expect(engine.explain('p3', 'imp').summary).toMatch(/drunk or poisoned/);
  });

  it('info from someone who merely claims a role only binds if they really are that role', () => {
    const r = run({
      characters: pool(noCorruption),
      players: players(8),
      events: [info('p1', { type: 'empath', count: 0 })]
    });
    // p1 might be lying (evil), so the neighbours can still be evil...
    expect(can(r, 'p2', 'imp')).toBe(true);
    // ...but if p1 really is the Empath, they are not. Check via explain on a pinned world:
    const pinned = run({
      characters: pool(noCorruption),
      players: players(8),
      self: me('p1', 'empath'),
      events: [info('p1', { type: 'empath', count: 0 })]
    });
    expect(can(pinned, 'p2', 'imp')).toBe(false);
    expect(can(pinned, 'p8', 'poisoner')).toBe(false);
    expect(can(pinned, 'p2', 'spy')).toBe(true); // the Spy can register as good
  });

  it('an uncertain self role allows being the Drunk, which frees the info', () => {
    const r = run({
      characters: pool(noCorruption),
      players: players(8),
      self: me('p1', 'empath', false),
      events: [info('p1', { type: 'empath', count: 0 })]
    });
    expect(possibleRoles(r, 'p1').sort()).toEqual(['drunk', 'empath']);
    expect(can(r, 'p2', 'imp')).toBe(true); // only if p1 is the Drunk
  });

  it('uses alive neighbours at the time the info was received', () => {
    const base = {
      characters: pool(noCorruption),
      players: players(8),
      self: me('p1', 'empath')
    };
    const r = run({ ...base, events: [death('p2'), info('p1', { type: 'empath', count: 0 })] });
    expect(can(r, 'p2', 'imp')).toBe(true);
    expect(can(r, 'p3', 'imp')).toBe(false);
    const before = run({ ...base, events: [info('p1', { type: 'empath', count: 0 }), death('p2')] });
    expect(can(before, 'p2', 'imp')).toBe(false);
  });

  it('a Recluse can register as evil to the Empath', () => {
    const r = run({
      characters: pool(noCorruption),
      players: players(8),
      self: me('p1', 'empath'),
      events: [info('p1', { type: 'empath', count: 2 })]
    });
    // Both alive neighbours register evil: they can be minion/demon or the Recluse.
    expect(can(r, 'p2', 'recluse')).toBe(true);
    expect(can(r, 'p2', 'chef')).toBe(false);
  });

  it('Chef: 0 pairs means evil players never sit together (when sober)', () => {
    const r = run({
      characters: pool(noCorruption),
      players: players(10), // 2 minions + 1 demon
      self: me('p1', 'chef'),
      events: [
        info('p1', { type: 'chef', count: 0 }),
        claim('p3', 'imp', 'confirmed')
      ]
    });
    expect(can(r, 'p2', 'baron')).toBe(false);
    expect(can(r, 'p4', 'baron')).toBe(false);
    expect(can(r, 'p5', 'baron')).toBe(true);
  });

  it('Fortune Teller YES can be the red herring', () => {
    const r = run({
      characters: pool(noCorruption),
      players: players(8),
      self: me('p1', 'fortuneteller'),
      events: [info('p1', { type: 'fortuneteller', players: ['p2', 'p3'], yes: true })]
    });
    expect(can(r, 'p4', 'imp')).toBe(true);
  });

  it('Fortune Teller NO rules out the Demon (but not the Recluse)', () => {
    const r = run({
      characters: pool(noCorruption),
      players: players(8),
      self: me('p1', 'fortuneteller'),
      events: [info('p1', { type: 'fortuneteller', players: ['p2', 'p3'], yes: false })]
    });
    expect(can(r, 'p2', 'imp')).toBe(false);
    expect(can(r, 'p3', 'imp')).toBe(false);
    expect(can(r, 'p2', 'recluse')).toBe(true);
  });

  it('a single Poisoner can only explain one false source per night', () => {
    const events = [
      info('p1', { type: 'empath', count: 0 }, 1),
      info('p4', { type: 'empath', count: 0 }, 1)
    ];
    const r = run({
      players: players(8),
      self: me('p1', 'empath'),
      events: [...events, claim('p4', 'investigator', 'confirmed')]
    });
    expect(can(r, 'p2', 'imp')).toBe(true); // p1 poisoned
  });

  it('two sober readings on the same night cannot both be poisoned by one Poisoner', () => {
    const r = run({
      players: players(8),
      self: me('p1', 'empath'),
      events: [
        claim('p5', 'chef', 'confirmed'),
        info('p1', { type: 'empath', count: 0 }, 1),
        info('p5', { type: 'chef', count: 1 }, 1)
      ]
    });
    // The Imp next to the Empath needs p1 poisoned, and Chef=1 needs an adjacent evil pair
    // or p5 poisoned too. Plenty of worlds keep p2 as the Imp with an adjacent minion.
    expect(can(r, 'p2', 'imp')).toBe(true);
  });
});

describe('public abilities and executions', () => {
  it('a Slayer kill proves the shooter was the Slayer and the target registers as the Demon', () => {
    const r = run({
      players: players(8),
      events: [info('p1', { type: 'slayer', player: 'p2', yes: true })]
    });
    expect(possibleRoles(r, 'p1')).toEqual(['slayer']);
    expect(possibleRoles(r, 'p2').sort()).toEqual(['imp', 'recluse']);
  });

  it('a Virgin execution proves the nominator registers as a Townsfolk', () => {
    const r = run({
      players: players(8),
      events: [info('p1', { type: 'virgin', player: 'p2', yes: true })]
    });
    expect(possibleRoles(r, 'p1')).toEqual(['virgin']);
    expect(can(r, 'p2', 'spy')).toBe(true);
    expect(can(r, 'p2', 'imp')).toBe(false);
    expect(can(r, 'p2', 'butler')).toBe(false);
  });

  it('a Saint executed without the game ending must have been poisoned', () => {
    const noPoisoner = TB_IDS.filter(id => id !== 'poisoner');
    const r = run({ characters: pool(noPoisoner), players: players(8), events: [execution('p3')] });
    expect(can(r, 'p3', 'saint')).toBe(false);
    const withPoisoner = run({ players: players(8), events: [execution('p3')] });
    expect(can(withPoisoner, 'p3', 'saint')).toBe(true);
  });

  it('executing the Imp without the game ending requires the Scarlet Woman', () => {
    const r = run({ players: players(8), events: [execution('p3')] });
    expect(can(r, 'p3', 'imp')).toBe(true);
    const noSw = run({ characters: pool(TB_IDS.filter(id => id !== 'scarletwoman')), players: players(8), events: [execution('p3')] });
    expect(can(noSw, 'p3', 'imp')).toBe(false);
  });

  it('an execution that ends the game means the Demon (or Saint) died', () => {
    const r = run({ players: players(8), events: [execution('p3', true)] });
    expect(possibleRoles(r, 'p3').sort()).toEqual(['imp', 'saint']);
  });
});

describe('claims', () => {
  it('assumes good players claim honestly, allowing for the Drunk', () => {
    const r = run({ players: players(8), events: [claim('p1', 'chef')] });
    expect(possibleRoles(r, 'p1').sort()).toEqual(['baron', 'chef', 'drunk', 'imp', 'poisoner', 'scarletwoman', 'spy']);
  });

  it('a claim of a character not on the script means evil (or Drunk)', () => {
    const r = run({ players: players(8), events: [claim('p1', 'dreamer')] });
    expect(possibleRoles(r, 'p1').sort()).toEqual(['baron', 'drunk', 'imp', 'poisoner', 'scarletwoman', 'spy']);
  });

  it('doubted claims add no constraint', () => {
    const r = run({ players: players(8), events: [claim('p1', 'chef', 'doubted')] });
    expect(possibleRoles(r, 'p1').length).toBe(TB_IDS.length);
  });

  it('can disable the honesty assumption', () => {
    const r = run({ players: players(8), events: [claim('p1', 'chef')], options: { assumeGoodPlayersHonest: false } });
    expect(possibleRoles(r, 'p1').length).toBe(TB_IDS.length);
  });

  it('if the Drunk thinks they are the Chef, the Chef is not in play', () => {
    const r = run({
      players: players(8),
      events: [claim('p1', 'chef'), claim('p2', 'chef', 'confirmed')]
    });
    expect(can(r, 'p1', 'drunk')).toBe(false);
    expect(possibleRoles(r, 'p1').every(id => ['poisoner', 'spy', 'scarletwoman', 'baron', 'imp'].includes(id))).toBe(true);
  });
});

describe('contradictions and explanations', () => {
  it('reports a contradiction with the minimal conflicting evidence', () => {
    const c1 = claim('p1', 'imp', 'confirmed');
    const c2 = claim('p2', 'imp', 'confirmed');
    const unrelated = claim('p3', 'chef');
    const r = run({ players: players(8), events: [c1, unrelated, c2] });
    expect(r.consistent).toBe(false);
    expect(r.contradictions[0].events.sort()).toEqual([c1.id, c2.id].sort());
  });

  it('keeps deducing after a contradiction by setting aside the latest conflicting evidence', () => {
    const c1 = claim('p1', 'imp', 'confirmed');
    const c2 = claim('p2', 'imp', 'confirmed');
    const r = run({ players: players(8), events: [c1, claim('p3', 'chef', 'confirmed'), c2] });
    expect(r.consistent).toBe(false);
    expect(r.ignoredEvidence.map(e => e.id)).toEqual([c2.id]);
    // Deductions still come from the remaining evidence.
    expect(possibleRoles(r, 'p1')).toEqual(['imp']);
    expect(possibleRoles(r, 'p3')).toEqual(['chef']);
    expect(possibleRoles(r, 'p2').length).toBeGreaterThan(10);
  });

  it('warns and recovers when your character is not in the role pool', () => {
    const r = run({ players: players(8), self: me('p1', 'vortox') });
    expect(r.warnings.some(w => w.includes('not in the current role pool'))).toBe(true);
    expect(r.ignoredEvidence.map(e => e.id)).toEqual(['self']);
    expect(possibleRoles(r, 'p2').length).toBe(TB_IDS.length);
  });

  it('explains an impossible assignment with the evidence responsible', () => {
    const fortune = info('p1', { type: 'fortuneteller', players: ['p2', 'p3'], yes: false });
    const engine = new DeductionEngine({
      characters: pool(TB_IDS.filter(id => id !== 'poisoner')),
      players: players(8),
      self: me('p1', 'fortuneteller'),
      events: [claim('p5', 'mayor'), fortune]
    });
    const why = engine.explain('p2', 'imp');
    expect(why.status).toBe('impossible');
    expect(why.evidence.map(e => e.id).sort()).toEqual(['self', fortune.id].sort());
  });

  it('marks unproven possibilities when the search budget runs out', () => {
    const r = run({ players: players(15), options: { nodeBudget: 3, totalBudget: 10 } });
    expect(r.incomplete).toBe(true);
  });
});

describe('scripts are just role pools', () => {
  it('works with an arbitrary non-TB pool', () => {
    const r = solve({
      characters: pool(['noble', 'steward', 'knight', 'chef', 'empath', 'klutz', 'mutant', 'widow', 'cerenovus', 'nodashii']),
      players: players(6),
      events: [],
      self: me('p1', 'steward')
    });
    expect(r.consistent).toBe(true);
    expect(possibleRoles(r, 'p1')).toEqual(['steward']);
  });

  it('applies the Vortox: sober Townsfolk info is false', () => {
    const chars = pool(['steward', 'chef', 'empath', 'knight', 'noble', 'klutz', 'mutant', 'cerenovus', 'vortox']);
    const r = solve({
      characters: chars,
      players: players(5),
      self: me('p1', 'steward'),
      events: [info('p1', { type: 'steward', player: 'p2' })],
      options: { assumeGoodPlayersHonest: false }
    });
    // With the Vortox, the Steward's "good player" is actually evil.
    expect(possibleRoles(r, 'p2').sort()).toEqual(['cerenovus', 'vortox']);
  });

  it('Lycanthrope: the Faux Paw is a good player who registers as evil', () => {
    const base = ['steward', 'chef', 'empath', 'noble', 'knight', 'pixie', 'klutz', 'cerenovus', 'imp'];
    const input = (ids: string[]) => ({
      characters: pool(ids), players: players(7), self: me('p1', 'empath'),
      events: [info('p1', { type: 'empath', count: 2 })], options: { assumeGoodPlayersHonest: false }
    });
    // Without the Lycanthrope both neighbours must be evil (and the setup itself is valid).
    const without = solve(input(base));
    expect(without.consistent).toBe(true);
    expect(can(without, 'p2', 'chef')).toBe(false);
    // With it, one of them may be the good Faux Paw.
    expect(can(solve(input([...base, 'lycanthrope'])), 'p2', 'chef')).toBe(true);
  });

  it('Fibbin allows one piece of false information per game, not per night', () => {
    const ids = ['steward', 'chef', 'empath', 'noble', 'knight', 'pixie', 'klutz', 'cerenovus', 'imp'];
    const events = [
      claim('p2', 'imp', 'confirmed'),
      claim('p3', 'cerenovus', 'confirmed'),
      info('p1', { type: 'steward', player: 'p2' }, 1)
    ];
    const self = me('p1', 'steward');
    expect(solve({ characters: pool(ids), players: players(7), self, events }).consistent).toBe(false);
    const withFibbin = pool([...ids, 'fibbin']);
    expect(solve({ characters: withFibbin, players: players(7), self, events }).consistent).toBe(true);
    // A second false reading on another night is one too many.
    const twice = [...events, claim('p4', 'noble', 'confirmed'), info('p4', { type: 'noble', players: ['p1', 'p5', 'p6'] }, 2)];
    expect(solve({ characters: withFibbin, players: players(7), self, events: twice }).consistent).toBe(false);
  });

  it('logs Shugenja, Village Idiot and Balloonist info', () => {
    const ids = ['shugenja', 'villageidiot', 'balloonist', 'chef', 'empath', 'noble', 'knight', 'klutz', 'cerenovus', 'imp'];
    const base = { characters: pool(ids), players: players(7), options: { assumeGoodPlayersHonest: false } };
    // Shugenja in seat 1: closest evil is clockwise, so seat 2 being the Imp fits and seat 7 alone does not.
    const shu = solve({ ...base, self: me('p1', 'shugenja'), events: [claim('p7', 'imp', 'confirmed'), info('p1', { type: 'shugenja', yes: true })] });
    expect(can(shu, 'p2', 'cerenovus')).toBe(true);
    expect(can(shu, 'p6', 'cerenovus')).toBe(false);
    // The Village Idiot sees a confirmed Chef as evil. That is only possible if you are the drunk
    // extra Village Idiot, so it fits while another Village Idiot could be in play...
    const chef = claim('p2', 'chef', 'confirmed');
    const reading = info('p1', { type: 'villageidiot', player: 'p2', yes: true });
    const vi = solve({ ...base, self: me('p1', 'villageidiot'), events: [chef, reading] });
    expect(vi.consistent).toBe(true);
    expect(vi.ignoredEvidence).toEqual([]);
    // ...and contradicts the evidence once nobody else can be a Village Idiot.
    const others = [['p3', 'empath'], ['p4', 'noble'], ['p5', 'knight'], ['p6', 'imp'], ['p7', 'cerenovus']]
      .map(([p, r]) => claim(p, r, 'confirmed'));
    const alone = solve({ ...base, self: me('p1', 'villageidiot'), events: [chef, ...others, reading] });
    expect(alone.consistent).toBe(false);
    // Balloonist: tonight's player is a different type from last night's Townsfolk.
    const bal = solve({ ...base, self: me('p1', 'balloonist'), events: [claim('p2', 'chef', 'confirmed'), info('p1', { type: 'balloonist', players: ['p2', 'p3'] })] });
    expect(can(bal, 'p3', 'empath')).toBe(false);
    expect(can(bal, 'p3', 'imp')).toBe(true);
  });

  it('handles 15 players with lots of evidence in reasonable time', () => {
    const ps = players(15);
    const started = Date.now();
    const r = run({
      players: ps,
      self: me('p1', 'empath', false),
      events: [
        info('p1', { type: 'empath', count: 1 }),
        claim('p2', 'chef'),
        info('p2', { type: 'chef', count: 1 }),
        claim('p3', 'washerwoman'),
        info('p3', { type: 'washerwoman', players: ['p4', 'p9'], roleId: 'mayor' }),
        claim('p4', 'mayor'),
        claim('p5', 'investigator'),
        info('p5', { type: 'investigator', players: ['p6', 'p12'], roleId: 'baron' }),
        claim('p7', 'fortuneteller'),
        info('p7', { type: 'fortuneteller', players: ['p8', 'p10'], yes: false }, 1),
        info('p7', { type: 'fortuneteller', players: ['p11', 'p12'], yes: true }, 2),
        death('p13'),
        execution('p6'),
        claim('p14', 'undertaker'),
        info('p14', { type: 'undertaker', player: 'p6', roleId: 'baron' }, 2)
      ]
    });
    expect(r.consistent).toBe(true);
    expect(Date.now() - started).toBeLessThan(5000);
  });
});
