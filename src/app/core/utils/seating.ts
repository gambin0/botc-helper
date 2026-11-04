import { Player } from '../models/game';

/**
 * Utility for circular seating order in Blood on the Clocktower.
 * Seats wrap around in a circle: e.g. for an 8-player game,
 * the clockwise neighbor of Seat 8 is Seat 1.
 */
export class SeatingCircle {
  /**
   * Sort players by seat ascending (1, 2, 3...)
   */
  static getOrderedPlayers(players: Player[]): Player[] {
    return [...players].sort((a, b) => a.seat - b.seat);
  }

  /**
   * Get the next index clockwise, wrapping around to 0.
   */
  static getNextIndex(index: number, total: number): number {
    if (total <= 0) return 0;
    return (index + 1) % total;
  }

  /**
   * Get the previous index counter-clockwise, wrapping around to total - 1.
   */
  static getPrevIndex(index: number, total: number): number {
    if (total <= 0) return 0;
    return (index - 1 + total) % total;
  }

  /**
   * Get the immediate seating neighbors (regardless of alive/dead).
   */
  static getImmediateNeighbors(
    players: Player[],
    targetPlayerId: string
  ): { clockwise: Player | null; counterClockwise: Player | null } {
    const ordered = this.getOrderedPlayers(players);
    if (ordered.length <= 1) {
      return { clockwise: null, counterClockwise: null };
    }
    const idx = ordered.findIndex(p => p.id === targetPlayerId);
    if (idx === -1) {
      return { clockwise: null, counterClockwise: null };
    }

    return {
      clockwise: ordered[this.getNextIndex(idx, ordered.length)],
      counterClockwise: ordered[this.getPrevIndex(idx, ordered.length)]
    };
  }

  /**
   * Get the 2 ALIVE neighbors for a player in the circle (used by Empath).
   * Skips dead players in both clockwise and counter-clockwise directions,
   * wrapping around the circle (e.g. seat 8 -> seat 1).
   */
  static getAliveNeighbors(
    players: Player[],
    targetPlayerId: string
  ): {
    clockwise: Player | null;
    counterClockwise: Player | null;
    aliveNeighbors: Player[];
  } {
    const ordered = this.getOrderedPlayers(players);
    const targetIdx = ordered.findIndex(p => p.id === targetPlayerId);
    if (targetIdx === -1 || ordered.length <= 1) {
      return { clockwise: null, counterClockwise: null, aliveNeighbors: [] };
    }

    const n = ordered.length;
    let cw: Player | null = null;
    for (let step = 1; step < n; step++) {
      const candidate = ordered[(targetIdx + step) % n];
      if (candidate.id !== targetPlayerId && candidate.alive) {
        cw = candidate;
        break;
      }
    }

    let ccw: Player | null = null;
    for (let step = 1; step < n; step++) {
      const candidate = ordered[(targetIdx - step + n) % n];
      if (candidate.id !== targetPlayerId && candidate.alive) {
        ccw = candidate;
        break;
      }
    }

    const aliveList: Player[] = [];
    const seen = new Set<string>();
    if (cw) {
      seen.add(cw.id);
      aliveList.push(cw);
    }
    if (ccw && !seen.has(ccw.id)) {
      aliveList.push(ccw);
    }

    return {
      clockwise: cw,
      counterClockwise: ccw,
      aliveNeighbors: aliveList
    };
  }

  /**
   * Count adjacent evil pairs around the circle (for Chef).
   * Pairs evaluated: (0, 1), (1, 2), ..., (n-2, n-1), and circularly (n-1, 0).
   * Example: In an 8-player circle, if seat 8 and seat 1 are both evil,
   * they count as 1 adjacent evil pair!
   */
  static countAdjacentEvilPairs(
    players: Player[],
    isEvilPredicate: (playerId: string) => boolean
  ): number {
    const ordered = this.getOrderedPlayers(players);
    const n = ordered.length;
    if (n < 2) return 0;

    let pairs = 0;
    for (let i = 0; i < n; i++) {
      const p1 = ordered[i];
      const p2 = ordered[(i + 1) % n]; // wraps from last player to first player
      if (isEvilPredicate(p1.id) && isEvilPredicate(p2.id)) {
        pairs++;
      }
    }
    return pairs;
  }
}
