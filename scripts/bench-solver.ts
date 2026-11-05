/**
 * Times the deduction engine on large Trouble Brewing games.
 *
 *   npm run bench:solver               # 10, 12 and 15 players, 30 games each
 *   npm run bench:solver -- 15 50      # 15 players, 50 games
 *
 * Two kinds of game:
 * - consistent: built from a true grimoire. Good players claim their
 *   character, the Drunk claims what it thinks it is, evil players bluff,
 *   and info roles report info that the true grimoire allows.
 * - contradictory: everyone claims a random Townsfolk and reports random
 *   info. Almost always contradictory, so this times the work of finding
 *   and setting aside conflicting evidence.
 *
 * The code is bundled with esbuild first, like the app build: running the
 * TypeScript through tsx directly is about three times slower.
 */
import { GameEvent, Player } from '../src/app/core/models/game';
import { RoleRegistry } from '../src/app/core/roles/role-registry';
import { allInfoSpecs } from '../src/app/core/rules/info-specs';
import { Rng, makePlayers, randomPayload } from '../src/app/core/solver/reference/game-generator';
import { legalRoleLists, worldFits } from '../src/app/core/solver/reference/reference-solver';
import { SolverInput, solve } from '../src/app/core/solver/solver';

const TB = [
  'washerwoman', 'librarian', 'investigator', 'chef', 'empath', 'fortuneteller', 'undertaker',
  'monk', 'ravenkeeper', 'virgin', 'slayer', 'soldier', 'mayor',
  'butler', 'drunk', 'recluse', 'saint',
  'poisoner', 'spy', 'scarletwoman', 'baron', 'imp'
];
const TOWNSFOLK = TB.slice(0, 13);
const GOOD = TB.slice(0, 17).filter(id => id !== 'drunk');
const characters = RoleRegistry.toScriptCharacters(TB);
const hasInfo = (role: string) => allInfoSpecs().some(s => s.roleId === role);
const base = { gameId: 'g', phase: 'day' as const, trust: 'asserted' as const, createdAt: '' };

function contradictoryGame(n: number, i: number): SolverInput {
  const rng = new Rng(99, i + n * 100);
  const players = makePlayers(n);
  const ids = players.map(p => p.id);
  const events: GameEvent[] = [];
  let k = 0;
  for (const id of ids) {
    const role = rng.pick(TOWNSFOLK);
    events.push({ ...base, id: `c${k++}`, night: 1, kind: 'claim', actorId: id, payload: { roleId: role } });
    if (hasInfo(role) && rng.chance(0.7)) {
      const payload = randomPayload(rng, role, ids, TB);
      if (payload) events.push({ ...base, id: `i${k++}`, night: rng.int(1, 3), kind: 'info', actorId: id, payload });
    }
  }
  return { characters, players, events };
}

const listsBySize = new Map<number, string[][]>();

function consistentGame(n: number, i: number): SolverInput {
  const rng = new Rng(7, i + n * 100);
  const players: Player[] = makePlayers(n);
  const ids = players.map(p => p.id);
  const empty: SolverInput = { characters, players, events: [] };
  if (!listsBySize.has(n)) listsBySize.set(n, legalRoleLists(empty));
  const truth = rng.shuffle([...rng.pick(listsBySize.get(n)!)]);
  const drunkBelief = rng.pick(TOWNSFOLK.filter(id => !truth.includes(id)));

  const events: GameEvent[] = [];
  let k = 0;
  const claimed = truth.map(role =>
    role === 'drunk' ? drunkBelief : GOOD.includes(role) ? role : rng.pick(TOWNSFOLK.filter(t => !truth.includes(t)))
  );
  ids.forEach((id, s) =>
    events.push({ ...base, id: `c${k++}`, night: 1, kind: 'claim', actorId: id, payload: { roleId: claimed[s] } })
  );
  // Info that the true grimoire allows: honest from sober info roles, anything
  // from evil players and the Drunk (subject to the Poisoner's budget).
  ids.forEach((id, s) => {
    if (!hasInfo(claimed[s]) || !rng.chance(0.7)) return;
    for (let attempt = 0; attempt < 30; attempt++) {
      const payload = randomPayload(rng, claimed[s], ids, TB);
      if (!payload) continue;
      const event: GameEvent = { ...base, id: `i${k}`, night: rng.int(1, 3), kind: 'info', actorId: id, payload };
      if (worldFits({ ...empty, events: [...events, event] }, truth)) {
        events.push(event);
        k++;
        return;
      }
    }
  });
  return { characters, players, events };
}

const [onlyN, count] = process.argv.slice(2).map(Number);
const sizes = onlyN ? [onlyN] : [10, 12, 15];
const games = count || 30;
for (const [kind, make] of [['consistent', consistentGame], ['contradictory', contradictoryGame]] as const) {
  for (const n of sizes) {
    const times: number[] = [];
    let incomplete = 0;
    let inconsistent = 0;
    for (let i = 0; i < games; i++) {
      const input = make(n, i);
      const t = performance.now();
      const result = solve(input);
      times.push(performance.now() - t);
      if (result.incomplete) incomplete++;
      if (!result.consistent) inconsistent++;
    }
    times.sort((a, b) => a - b);
    const pct = (p: number) => Math.round(times[Math.min(times.length - 1, Math.floor(p * times.length))]);
    console.log(
      `${kind.padEnd(13)} ${n} players, ${games} games: median ${pct(0.5)} ms, p90 ${pct(0.9)} ms, max ${pct(1)} ms, ` +
        `search limit hit ${incomplete}/${games}, contradictory ${inconsistent}/${games}`
    );
  }
}
