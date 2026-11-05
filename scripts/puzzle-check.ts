/**
 * Runs the community logic puzzles through the engine and reports, per puzzle,
 * whether every solution stays possible (soundness) and how many players the
 * engine pins down to the solution (precision).
 *
 *   npx tsx scripts/puzzle-check.ts [dir]   (default src/app/core/solver/puzzles/data)
 */
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { solve } from '../src/app/core/solver/solver';
import { UnsupportedPuzzle, convertPuzzle } from '../src/app/core/solver/puzzles/puzzle-import';

const dir = process.argv[2] ?? 'src/app/core/solver/puzzles/data';
const files = readdirSync(dir)
  .filter(f => f.endsWith('.json') && !f.endsWith('.solutions.json') && existsSync(join(dir, f.replace(/\.json$/, '.solutions.json'))))
  .sort();
let ok = 0, wrong = 0, skipped = 0, exact = 0, playersTotal = 0, playersExact = 0;
for (const f of files) {
  const doc = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  const sol = JSON.parse(readFileSync(join(dir, f.replace(/\.json$/, '.solutions.json')), 'utf8'));
  let converted;
  try {
    converted = convertPuzzle(doc, sol);
  } catch (e) {
    if (!(e instanceof UnsupportedPuzzle)) throw e;
    skipped++;
    console.log(`SKIP  ${f}: ${e.message}`);
    continue;
  }
  const t0 = Date.now();
  const r = solve(converted.input);
  const ms = Date.now() - t0;
  const name = (pid: string) => converted.input.players.find(p => p.id === pid)!.name;
  const missing: string[] = [];
  let pinned = 0;
  for (const [pid, roles] of converted.answer) {
    const possible = new Set(r.possibleRoles.filter(x => x.playerId === pid && x.status !== 'impossible').map(x => x.roleId));
    for (const role of roles) if (!possible.has(role)) missing.push(`${name(pid)}=${role}`);
    if (possible.size === roles.size && [...roles].every(x => possible.has(x))) pinned++;
  }
  playersTotal += converted.answer.size;
  playersExact += pinned;
  const n = converted.answer.size;
  if (!r.consistent || missing.length) {
    wrong++;
    console.log(`WRONG ${f}: ${r.consistent ? 'consistent' : 'INCONSISTENT'}, ruled out ${missing.join(', ')}${r.incomplete ? ' (search limit)' : ''} [dropped: ${[...new Set(converted.dropped)].join('; ')}]`);
  } else {
    ok++;
    if (pinned === n) exact++;
    console.log(`ok    ${f}: ${pinned}/${n} pinned, ${ms} ms${converted.dropped.length ? ` [dropped: ${[...new Set(converted.dropped)].join('; ')}]` : ''}`);
  }
}
console.log(`\n${ok} sound (${exact} fully solved), ${wrong} wrong, ${skipped} skipped; players pinned ${playersExact}/${playersTotal}`);
