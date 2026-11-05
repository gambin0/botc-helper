import { defineConfig } from 'vitest/config';

// Unit tests for the framework-agnostic core (solver, rules, script parsing).
// Angular component tests use `ng test`.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    // The brute-force reference solver takes a few seconds on some 7-player
    // tests; CI runners are slower than a desktop.
    testTimeout: 30_000
  }
});
