import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseScript } from './script-parser';
import { solve } from '../solver/solver';
import { TROUBLE_BREWING_SCRIPT } from '../constants/trouble-brewing';
import { GameEvent, Player, Script } from '../models/game';
import { InfoPayload } from '../rules/info-specs';

const WC25 = join(__dirname, '../../../assets/scripts/wc25');
const load = (file: string): Script => parseScript(JSON.parse(readFileSync(join(WC25, file), 'utf8')), file).script;
const players = (n: number): Player[] =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, gameId: 'g', name: `P${i + 1}`, seat: i + 1, alive: true }));
let seq = 0;
const claim = (actorId: string, roleId: string, trust: GameEvent['trust'] = 'confirmed'): GameEvent => ({
  id: `c${++seq}`, gameId: 'g', night: 1, phase: 'day', kind: 'claim', actorId, payload: { roleId }, trust, createdAt: ''
});
const info = (actorId: string, payload: InfoPayload): GameEvent => ({
  id: `i${++seq}`, gameId: 'g', night: 1, phase: 'first-night', kind: 'info', actorId, payload, trust: 'asserted', createdAt: ''
});
const possible = (r: ReturnType<typeof solve>, playerId: string) =>
  r.possibleRoles.filter(x => x.playerId === playerId && x.status !== 'impossible').map(x => x.roleId);

describe('every bundled script', () => {
  const scripts = [TROUBLE_BREWING_SCRIPT, ...readdirSync(WC25).filter(f => f.endsWith('.json')).map(load)];
  for (const script of scripts) {
    it(`${script.name} has a valid setup at 5-15 players`, () => {
      for (let n = 5; n <= 15; n++) {
        const r = solve({ characters: script.characters, players: players(n), events: [] });
        expect(r.consistent, `${n} players`).toBe(true);
        expect(r.incomplete, `${n} players`).toBe(false);
        expect(possible(r, 'p1').length, `${n} players`).toBeGreaterThan(0);
      }
    }, 60000);
  }
});

describe('Witch Hunt', () => {
  const wh = load('witchhunt.json');

  it('allows several Witches and never seats Lil\' Monsta', () => {
    // 7 players: 5 Townsfolk, 0 Outsiders, and Lil' Monsta's extra Minion makes 2 Witches.
    const r = solve({ characters: wh.characters, players: players(7), events: [claim('p1', 'witchhuntwitch'), claim('p2', 'witchhuntwitch')] });
    expect(r.consistent).toBe(true);
    expect(possible(r, 'p1')).toEqual(['witchhuntwitch']);
    expect(r.possibleRoles.some(x => x.roleId === 'lilmonsta')).toBe(false);
    // Both evil seats are taken, so everyone else is good.
    for (const p of ['p3', 'p4', 'p5', 'p6', 'p7']) {
      expect(r.alignments.find(a => a.playerId === p)?.canBeEvil, p).toBe(false);
    }
  });

  it('lets the babysitting Witch register as the Demon to the Fortune Teller', () => {
    const events = [
      claim('p1', 'fortuneteller'),
      claim('p2', 'witchhuntwitch'),
      claim('p3', 'witchhuntwitch'),
      info('p1', { type: 'fortuneteller', players: ['p2', 'p4'], yes: true })
    ];
    const r = solve({ characters: wh.characters, players: players(7), events });
    expect(r.consistent).toBe(true);
  });

  it('treats executing the babysitter as a game-ending execution', () => {
    const exec: GameEvent = {
      id: 'x', gameId: 'g', night: 1, phase: 'execution', kind: 'execution', payload: { playerId: 'p2', gameEnded: true }, trust: 'confirmed', createdAt: ''
    };
    const r = solve({ characters: wh.characters, players: players(7), events: [exec] });
    expect(possible(r, 'p2')).toContain('witchhuntwitch');
  });
});

describe('Village Idiot', () => {
  it('allows up to three Village Idiots', () => {
    const odm = load('1daymore.json');
    const three = ['p1', 'p2', 'p3'].map(p => claim(p, 'villageidiot'));
    expect(solve({ characters: odm.characters, players: players(8), events: three }).consistent).toBe(true);
    const four = [...three, claim('p4', 'villageidiot')];
    expect(solve({ characters: odm.characters, players: players(8), events: four }).consistent).toBe(false);
  });
});
