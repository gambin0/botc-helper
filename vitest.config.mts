import { defineConfig } from 'vitest/config';

// Unit tests for the framework-agnostic core (solver, rules, script parsing).
// Angular component tests use `ng test`.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node'
  }
});
