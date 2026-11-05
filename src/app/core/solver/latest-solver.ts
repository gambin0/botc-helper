import { DeductionResult } from '../models/game';
import { SolverInput } from './solver';
import { CancelledError, SolverTaskRunner, SolverWorker } from './solver-task-runner';

export interface LatestSolverCallbacks {
  /** A solve for the most recent input finished. */
  result(result: DeductionResult): void;
  /** True while a solve is running. */
  busy(busy: boolean): void;
  /** The most recent solve failed. */
  error(message: string): void;
}

/**
 * Solves in a worker, always for the most recent input.
 *
 * A solve can take tens of seconds for large games, so when a new input
 * arrives while a solve is still running, that solve is abandoned (its worker
 * terminated) rather than awaited. See SolverTaskRunner for the fallback when
 * workers are unavailable.
 */
export class LatestSolver {
  private readonly runner: SolverTaskRunner;
  private latest = 0;
  private running = false;

  constructor(
    createWorker: (() => SolverWorker) | null,
    private readonly callbacks: LatestSolverCallbacks
  ) {
    this.runner = new SolverTaskRunner(createWorker);
  }

  /** True while solves run in a worker (false once fallen back to the main thread). */
  get usingWorker(): boolean {
    return this.runner.usingWorker;
  }

  submit(input: SolverInput): void {
    this.runner.cancel(); // abandon the stale solve, if any
    const ticket = ++this.latest;
    this.setBusy(true);
    this.runner.run({ kind: 'solve', input }).then(
      result => {
        if (ticket !== this.latest) return;
        this.setBusy(false);
        this.callbacks.result(result);
      },
      (e: unknown) => {
        if (ticket !== this.latest || e instanceof CancelledError) return;
        this.setBusy(false);
        this.callbacks.error(e instanceof Error ? e.message : String(e));
      }
    );
  }

  /** Stops any running solve and releases the worker. */
  dispose(): void {
    this.latest++;
    this.runner.dispose();
    this.setBusy(false);
  }

  private setBusy(busy: boolean): void {
    if (busy === this.running) return;
    this.running = busy;
    this.callbacks.busy(busy);
  }
}
