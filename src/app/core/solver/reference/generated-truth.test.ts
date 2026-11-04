import { describe, expect, it } from 'vitest';
import { explainByKnownBug, truthCheck } from './checks';
import { generateTrueGame } from './game-generator';
import { KNOWN_DISAGREEMENTS, gameCount } from './known-disagreements';

// The engine must never rule out the grimoire the evidence was generated from (design Decision 6).

const SEED = 1;

describe('generated-truth check', () => {
  it(`never rules out the true grimoire in ${gameCount(300)} games (seed ${SEED})`, () => {
    const failures: string[] = [];
    for (let index = 0; index < gameCount(300); index++) {
      if (KNOWN_DISAGREEMENTS.has(`truth:${SEED}:${index}`)) continue;
      const game = generateTrueGame(SEED, index);
      if (!game) continue;
      const outcome = truthCheck(game.input, game.truth);
      if (outcome.status === 'engine-wrong' && explainByKnownBug(game.input, v => truthCheck(v, game.truth).status === 'ok')) continue;
      if (outcome.status === 'engine-wrong' || outcome.status === 'generator-bug') {
        failures.push(`seed ${SEED} index ${index}: ${JSON.stringify(outcome)}\n${JSON.stringify(game)}`);
      }
    }
    expect(failures, failures.join('\n\n')).toEqual([]);
  }, 120_000);
});
