import { describe, expect, it } from 'vitest';
import { RoleRegistry } from '../../roles/role-registry';
import { PROFILES, ProfileName, generateGame, generateTrueGame } from './game-generator';
import { ReferenceGame, worldFits } from './reference-solver';

describe('game generator', () => {
  it('is deterministic for a (seed, index) pair', () => {
    expect(generateGame(7, 3)).toEqual(generateGame(7, 3));
    expect(generateTrueGame(7, 3)).toEqual(generateTrueGame(7, 3));
    expect(generateGame(7, 3)).not.toEqual(generateGame(7, 4));
  });

  it('keeps games small enough to enumerate, with known roles only', () => {
    for (const profile of Object.keys(PROFILES) as ProfileName[]) {
      for (let i = 0; i < 150; i++) {
        const g = generateGame(1, i, { profile });
        expect(g.players.length).toBeGreaterThanOrEqual(5);
        expect(g.players.length).toBeLessThanOrEqual(7);
        expect(new ReferenceGame(g).pool.length).toBeLessThanOrEqual(10);
        for (const c of g.characters) expect(RoleRegistry.has(c.id)).toBe(true);
        for (const forced of PROFILES[profile].forced) {
          expect(g.characters.map(c => c.id)).toContain(forced);
        }
      }
    }
  });

  it('generated-truth games always fit their own true grimoire', () => {
    let made = 0;
    for (let i = 0; i < 150; i++) {
      const g = generateTrueGame(2, i);
      if (!g) continue;
      made++;
      expect(worldFits(g.input, g.truth)).toBe(true);
    }
    expect(made).toBeGreaterThan(120);
  }, 60_000);
});
