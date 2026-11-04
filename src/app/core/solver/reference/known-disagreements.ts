/**
 * Generated games to skip by hand. Failures explained by a recorded engine bug
 * are already filtered automatically (checks.ts, explainByKnownBug); use this
 * only for a case the filter cannot recognise.
 * Format: `diff:<seed>:<index>` or `truth:<seed>:<index>`.
 */
export const KNOWN_DISAGREEMENTS = new Set<string>([]);

/** Number of generated games per check: REF_SOLVER_GAMES, or the given default. */
export function gameCount(fallback: number): number {
  // Read through globalThis so this file also type-checks in the browser app build.
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  const raw = env?.['REF_SOLVER_GAMES'];
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
