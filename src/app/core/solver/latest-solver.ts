import { DeductionResult } from '../models/game';
import { SolverInput, solve } from './solver';
import { SolveRequest, SolveResponse } from './solver-worker-protocol';

/** The parts of `Worker` this class uses, so tests can pass a fake. */
export interface SolverWorker {
  postMessage(message: SolveRequest): void;
  terminate(): void;
  onmessage: ((event: MessageEvent<SolveResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
}

export interface LatestSolverCallbacks {
  /** A solve for the most recent input finished. */
  result(result: DeductionResult): void;
  /** True while a solve is running in the worker. */
  busy(busy: boolean): void;
  /** The most recent solve failed. */
  error(message: string): void;
}

/**
 * Solves in a worker, always for the most recent input.
 *
 * A solve can take tens of seconds for large games, so when a new input
 * arrives while the worker is still busy, the worker is terminated and a
 * fresh one is started: the stale solve is abandoned rather than awaited.
 *
 * Without workers (unit tests), or if the worker fails to start, it falls
 * back to solving synchronously on the calling thread.
 *
 * Framework-free so it can be unit-tested with a fake worker.
 */
export class LatestSolver {
  private worker: SolverWorker | null = null;
  private pendingId: number | null = null;
  private nextId = 0;
  private broken = false;
  private latestInput: SolverInput | null = null;

  constructor(
    private readonly createWorker: (() => SolverWorker) | null,
    private readonly callbacks: LatestSolverCallbacks
  ) {}

  /** True while solves run in a worker (false once fallen back to the main thread). */
  get usingWorker(): boolean {
    return this.createWorker !== null && !this.broken;
  }

  submit(input: SolverInput): void {
    this.latestInput = input;
    if (!this.usingWorker) {
      this.solveHere(input);
      return;
    }
    if (this.pendingId !== null) this.discardWorker(); // abandon the stale solve
    let worker: SolverWorker;
    try {
      worker = this.worker ?? this.startWorker();
    } catch (e) {
      this.fallBack(e);
      return;
    }
    const id = ++this.nextId;
    this.pendingId = id;
    this.callbacks.busy(true);
    worker.postMessage({ id, input });
  }

  /** Stops any running solve and releases the worker. */
  dispose(): void {
    this.discardWorker();
    if (this.pendingId !== null) {
      this.pendingId = null;
      this.callbacks.busy(false);
    }
  }

  private startWorker(): SolverWorker {
    const worker = this.createWorker!();
    worker.onmessage = event => this.receive(worker, event.data);
    worker.onerror = event => {
      // The worker script itself failed (for example, it could not load).
      event.preventDefault?.();
      if (worker === this.worker) this.fallBack(event.message || 'Solver worker failed');
    };
    this.worker = worker;
    return worker;
  }

  private receive(worker: SolverWorker, response: SolveResponse): void {
    if (worker !== this.worker || response.id !== this.pendingId) return; // stale
    this.pendingId = null;
    this.callbacks.busy(false);
    if ('error' in response) this.callbacks.error(response.error);
    else this.callbacks.result(response.result);
  }

  private discardWorker(): void {
    if (!this.worker) return;
    this.worker.onmessage = null;
    this.worker.onerror = null;
    this.worker.terminate();
    this.worker = null;
  }

  /** Stop using workers for good and answer the latest input on this thread. */
  private fallBack(reason: unknown): void {
    console.warn('Deduction worker unavailable; solving on the main thread instead.', reason);
    this.broken = true;
    this.dispose();
    if (this.latestInput) this.solveHere(this.latestInput);
  }

  private solveHere(input: SolverInput): void {
    try {
      this.callbacks.result(solve(input));
    } catch (e) {
      this.callbacks.error(e instanceof Error ? e.message : String(e));
    }
  }
}
