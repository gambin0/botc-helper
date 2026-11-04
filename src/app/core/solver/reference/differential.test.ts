import { describe, expect, it } from 'vitest';
import { differentialCheck, explainByKnownBug } from './checks';
import { generateGame } from './game-generator';
import { KNOWN_DISAGREEMENTS, gameCount } from './known-disagreements';

// Engine vs brute-force reference on random small games (design Decision 6).
// Longer runs: REF_SOLVER_GAMES=2000 npx vitest run src/app/core/solver/reference
// or the fuzz command (npm run fuzz -- --help).

const SEED = 1;

describe('differential check: engine vs reference', () => {
  it(`agrees on ${gameCount(150)} random games (seed ${SEED})`, () => {
    let skipped = 0;
    const failures: string[] = [];
    for (let index = 0; index < gameCount(150); index++) {
      if (KNOWN_DISAGREEMENTS.has(`diff:${SEED}:${index}`)) continue;
      const input = generateGame(SEED, index);
      const outcome = differentialCheck(input);
      if (outcome.status === 'skipped') skipped++;
      if (outcome.status === 'disagree') {
        // Failures explained by a recorded engine bug are covered by regressions.test.ts.
        if (explainByKnownBug(input, v => differentialCheck(v).status !== 'disagree')) continue;
        failures.push(`seed ${SEED} index ${index}: ${JSON.stringify(outcome)}\n${JSON.stringify(input)}`);
      }
    }
    if (skipped > 0) console.info(`differential check: ${skipped} games skipped (engine search incomplete)`);
    expect(failures, failures.join('\n\n')).toEqual([]);
  }, 120_000);
});
