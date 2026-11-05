import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { solve } from '../solver';
import { UnsupportedPuzzle, convertPuzzle } from './puzzle-import';

/**
 * Community logic puzzles with published solutions (see data/README.md).
 * The engine must never rule out a solution. Puzzles that depend on rules the
 * engine does not model are listed in KNOWN; if one starts passing, remove it.
 */

const DIR = join(__dirname, 'data');

const KNOWN: Record<string, string> = {
  'a-clean-sweep': 'the Goon changing alignment is not modelled',
  'puzzle-31-no-your-other-left':
    'counts a Recluse between two evil players as 1 Chef pair (registering separately for each pair); the engine uses one registration per reading',
  'puzzle-49-bastille-day': 'the Riot is not modelled',
  'puzzle-67-minus-one-thats-three-times-two': 'the Riot is not modelled',
  'puzzle-87-freaky-friday': 'the Barber swapping characters is not modelled',
  'puzzle-92-half-moon-rising': 'the Zombuul surviving its first death is not modelled'
};

const SKIPPED = [
  'puzzle-08-the-stitch-up', // characters may repeat
  'puzzle-21-eight-jugglers-juggling',
  'puzzle-29-a-dreamer-im-not-the-only-one',
  'puzzle-64-copycatholic',
  'puzzle-56-meanwhile-at-the-legion-of-doom', // custom character counts
  'puzzle-72-one-digit-too-many',
  'puzzle-76-three-for-three',
  'puzzle-27-is-this-a-legion-game', // homebrew characters
  'puzzle-44-trouble-homebrewing'
];

const names = readdirSync(DIR)
  .filter(f => f.endsWith('.solutions.json'))
  .map(f => f.replace(/\.solutions\.json$/, ''))
  .sort();

function load(name: string) {
  const doc = JSON.parse(readFileSync(join(DIR, `${name}.json`), 'utf8'));
  const solutions = JSON.parse(readFileSync(join(DIR, `${name}.solutions.json`), 'utf8'));
  try {
    return convertPuzzle(doc, solutions);
  } catch (e) {
    if (e instanceof UnsupportedPuzzle) return null;
    throw e;
  }
}

/** Solution characters the engine rules out (or 'inconsistent'). */
function ruledOut(name: string): { missing: string[]; pinned: number; players: number } {
  const puzzle = load(name)!;
  const result = solve(puzzle.input);
  const missing: string[] = result.consistent ? [] : ['inconsistent'];
  let pinned = 0;
  for (const [player, roles] of puzzle.answer) {
    const possible = new Set(result.possibleRoles.filter(r => r.playerId === player && r.status !== 'impossible').map(r => r.roleId));
    for (const role of roles) if (!possible.has(role)) missing.push(`${player}=${role}`);
    if (possible.size === roles.size) pinned++;
  }
  return { missing, pinned, players: puzzle.answer.size };
}

describe('community logic puzzles', () => {
  it('converts every puzzle except those using house rules or homebrew characters', () => {
    expect(names.filter(n => load(n) === null).sort()).toEqual([...SKIPPED].sort());
  });

  const supported = names.filter(n => !SKIPPED.includes(n));

  it.each(supported.filter(n => !KNOWN[n]))('%s: the solution stays possible', name => {
    expect(ruledOut(name).missing).toEqual([]);
  });

  it.each(Object.keys(KNOWN))('%s still needs an unmodelled rule', name => {
    expect(ruledOut(name).missing, `${name} now passes: remove it from KNOWN`).not.toEqual([]);
  });

  it('pins down at least as many players as before', () => {
    let pinned = 0;
    let solved = 0;
    for (const name of supported.filter(n => !KNOWN[n])) {
      const r = ruledOut(name);
      pinned += r.pinned;
      if (r.pinned === r.players) solved++;
    }
    // Raise these when the engine gets better at deducing.
    expect(pinned).toBeGreaterThanOrEqual(207);
    expect(solved).toBeGreaterThanOrEqual(12);
  });
});
