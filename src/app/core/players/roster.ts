/**
 * Remembering the people you play with: names you have typed before, and
 * the seating of the last game. Pure functions; RosterService stores them.
 */

/** Names the app gives new seats ("Player 3"). Never remembered. */
export function isDefaultName(name: string): boolean {
  return /^Player \d+$/.test(name.trim());
}

export function defaultName(seat: number): string {
  return `Player ${seat}`;
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Adds a name to the front of the remembered list (most recent first), without duplicates. */
export function rememberName(known: readonly string[], name: string, max = 100): string[] {
  const clean = name.trim();
  if (!clean || isDefaultName(clean)) return [...known];
  return [clean, ...known.filter(k => !same(k, clean))].slice(0, max);
}

export function forgetName(known: readonly string[], name: string): string[] {
  return known.filter(k => !same(k, name));
}

/**
 * Seat names for a new game of `count` players, copied from the last
 * game's seating: extra seats get default names, missing ones are dropped.
 * Seats that had a default name stay default.
 */
export function seatNamesFrom(lastSeating: readonly (string | null)[], count: number): string[] {
  return Array.from({ length: count }, (_, i) => lastSeating[i] ?? defaultName(i + 1));
}

/** The seating to remember: each seat's name, or null where it is still a default name. */
export function seatingOf(players: readonly { name: string; seat: number }[]): (string | null)[] {
  return [...players].sort((a, b) => a.seat - b.seat).map(p => (isDefaultName(p.name) ? null : p.name.trim()));
}

/** Remembered names matching what has been typed, leaving out names already at the table. */
export function nameSuggestions(
  known: readonly string[],
  typed: string,
  taken: readonly string[],
  max = 8
): string[] {
  const query = typed.trim().toLowerCase();
  return known
    .filter(k => !taken.some(t => same(t, k)))
    .filter(k => k.toLowerCase().includes(query))
    .sort((a, b) => Number(!a.toLowerCase().startsWith(query)) - Number(!b.toLowerCase().startsWith(query)))
    .slice(0, max);
}

/**
 * Moves one player to `toSeat` (1-based), shifting the others along, and
 * renumbers every seat 1..n. Returns the players in seat order.
 */
export function moveToSeat<T extends { id: string; seat: number }>(players: readonly T[], id: string, toSeat: number): T[] {
  const ordered = [...players].sort((a, b) => a.seat - b.seat);
  const from = ordered.findIndex(p => p.id === id);
  if (from < 0) return ordered;
  const to = Math.max(0, Math.min(ordered.length - 1, toSeat - 1));
  const [moved] = ordered.splice(from, 1);
  ordered.splice(to, 0, moved);
  return ordered.map((p, i) => (p.seat === i + 1 ? p : { ...p, seat: i + 1 }));
}
