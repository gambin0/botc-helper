import { GameEvent } from '../models/game';

/**
 * When things happen, for the Demon changing seats.
 *
 * The log is kept in entry order, but a star-pass on night N must be seen by
 * that night's information (the Imp acts before the info roles), and an
 * execution on day N happens after that day's public abilities. So, for the
 * purpose of tracking who holds the Demon, events run in this order:
 *
 *   night N:  deaths (and resurrections), then information (including day-N
 *             public abilities such as a Slayer shot, which the app logs with
 *             the day's number)
 *   day N:    executions
 *
 * Events at the same point keep their log order. Claims carry no time.
 *
 * Pure TypeScript: no Angular dependencies.
 */
export type TimedKind = 'death' | 'resurrection' | 'info' | 'execution';

const RANK: Record<TimedKind, number> = { death: 0, resurrection: 0, info: 1, execution: 2 };

export function isTimed(event: GameEvent): event is GameEvent & { kind: TimedKind } {
  return event.kind in RANK;
}

/** Indexes into `events` of the timed events, in game order. */
export function chronologicalOrder(events: readonly GameEvent[]): number[] {
  const timed: number[] = [];
  events.forEach((e, i) => {
    if (isTimed(e)) timed.push(i);
  });
  const key = (i: number) => Math.max(1, events[i].night) * 3 + RANK[events[i].kind as TimedKind];
  return timed.sort((a, b) => key(a) - key(b) || a - b);
}
