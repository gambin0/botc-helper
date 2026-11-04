/**
 * Generated games to skip by hand. Failures explained by a recorded engine bug
 * are already filtered automatically (checks.ts, explainByKnownBug); use this
 * only for a case the filter cannot recognise.
 * Format: `diff:<seed>:<index>` or `truth:<seed>:<index>`.
 */
export const KNOWN_DISAGREEMENTS = new Set<string>([]);

/** Number of generated games per check: REF_SOLVER_GAMES, or the given default. */
export function gameCount(fallback: number): number {
  const raw = typeof process !== 'undefined' ? process.env['REF_SOLVER_GAMES'] : undefined;
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
