/**
 * Times the deduction engine on large, realistic Trouble Brewing games:
 * every player claims a Townsfolk and most report one piece of info.
 *
 *   npm run bench:solver               # 10, 12 and 15 players, 30 games each
 *   npm run bench:solver -- 15 50      # 15 players, 50 games
 */
import { GameEvent } from '../src/app/core/models/game';
import { RoleRegistry } from '../src/app/core/roles/role-registry';
import { allInfoSpecs } from '../src/app/core/rules/info-specs';
import { Rng, makePlayers, randomPayload } from '../src/app/core/solver/reference/game-generator';
import { solve } from '../src/app/core/solver/solver';

const TB = [
  'washerwoman', 'librarian', 'investigator', 'chef', 'empath', 'fortuneteller', 'undertaker',
  'monk', 'ravenkeeper', 'virgin', 'slayer', 'soldier', 'mayor',
  'butler', 'drunk', 'recluse', 'saint',
  'poisoner', 'spy', 'scarletwoman', 'baron', 'imp'
];
const TOWNSFOLK = TB.slice(0, 13);
const characters = RoleRegistry.toScriptCharacters(TB);

function game(n: number, i: number) {
  const rng = new Rng(99, i + n * 100);
  const players = makePlayers(n);
  const ids = players.map(p => p.id);
  const events: GameEvent[] = [];
  let k = 0;
  const base = { gameId: 'g', phase: 'day' as const, trust: 'asserted' as const, createdAt: '' };
  for (const id of ids) {
    const role = rng.pick(TOWNSFOLK);
    events.push({ ...base, id: `c${k++}`, night: 1, kind: 'claim', actorId: id, payload: { roleId: role } });
    if (allInfoSpecs().some(s => s.roleId === role) && rng.chance(0.7)) {
      const payload = randomPayload(rng, role, ids, TB);
      if (payload) events.push({ ...base, id: `i${k++}`, night: rng.int(1, 3), kind: 'info', actorId: id, payload });
    }
  }
  return { characters, players, events };
}

const [onlyN, count] = process.argv.slice(2).map(Number);
const sizes = onlyN ? [onlyN] : [10, 12, 15];
const games = count || 30;
for (const n of sizes) {
  const times: number[] = [];
  let incomplete = 0;
  for (let i = 0; i < games; i++) {
    const t = performance.now();
    if (solve(game(n, i)).incomplete) incomplete++;
    times.push(performance.now() - t);
  }
  times.sort((a, b) => a - b);
  const pct = (p: number) => Math.round(times[Math.min(times.length - 1, Math.floor(p * times.length))]);
  console.log(
    `${n} players, ${games} games: median ${pct(0.5)} ms, p90 ${pct(0.9)} ms, max ${pct(1)} ms, search limit hit ${incomplete}/${games}`
  );
}
