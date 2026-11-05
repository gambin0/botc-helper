import { SolverRequest, SolverResponse, SolverTask, TaskResult, runTask } from './solver-worker-protocol';

/** The parts of `Worker` the runner uses, so tests can pass a fake. */
export interface SolverWorker {
  postMessage(message: SolverRequest): void;
  terminate(): void;
  onmessage: ((event: MessageEvent<SolverResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
}

/** The task was abandoned with `cancel()` before it finished. */
export class CancelledError extends Error {
  constructor() {
    super('Cancelled');
    this.name = 'CancelledError';
  }
}

interface Pending {
  task: SolverTask;
  resolve(result: unknown): void;
  reject(error: unknown): void;
}

/**
 * Runs solver tasks in one Web Worker, in the order they were submitted.
 *
 * `cancel()` abandons all unfinished tasks by terminating the worker: a solve
 * cannot be interrupted any other way. The next task starts a fresh worker.
 *
 * Without workers (unit tests), or once the worker fails to start, tasks run
 * on the calling thread instead.
 *
 * Framework-free so it can be unit-tested with a fake worker.
 */
export class SolverTaskRunner {
  private worker: SolverWorker | null = null;
  private readonly pending = new Map<number, Pending>();
  private nextId = 0;
  private broken = false;

  constructor(private readonly createWorker: (() => SolverWorker) | null) {}

  /** True while tasks run in a worker (false once fallen back to the main thread). */
  get usingWorker(): boolean {
    return this.createWorker !== null && !this.broken;
  }

  run<T extends SolverTask>(task: T): Promise<TaskResult<T>> {
    if (!this.usingWorker) return runHere(task);
    let worker: SolverWorker;
    try {
      worker = this.worker ?? this.startWorker();
    } catch (e) {
      this.fallBack(e);
      return runHere(task);
    }
    const id = ++this.nextId;
    return new Promise<TaskResult<T>>((resolve, reject) => {
      this.pending.set(id, { task, resolve: resolve as (result: unknown) => void, reject });
      worker.postMessage({ id, task });
    });
  }

  /** Abandons every unfinished task; their promises reject with `CancelledError`. */
  cancel(): void {
    if (this.pending.size === 0) return; // keep an idle worker for reuse
    this.discardWorker();
    for (const p of this.takePending()) p.reject(new CancelledError());
  }

  /** Cancels unfinished tasks and releases the worker. */
  dispose(): void {
    this.cancel();
    this.discardWorker();
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

  private receive(worker: SolverWorker, response: SolverResponse): void {
    if (worker !== this.worker) return; // from a discarded worker
    const p = this.pending.get(response.id);
    if (!p) return;
    this.pending.delete(response.id);
    if ('error' in response) p.reject(new Error(response.error));
    else p.resolve(response.result);
  }

  private discardWorker(): void {
    if (!this.worker) return;
    this.worker.onmessage = null;
    this.worker.onerror = null;
    this.worker.terminate();
    this.worker = null;
  }

  private takePending(): Pending[] {
    const all = [...this.pending.values()];
    this.pending.clear();
    return all;
  }

  /** Stop using workers for good and finish unfinished tasks on this thread. */
  private fallBack(reason: unknown): void {
    console.warn('Solver worker unavailable; solving on the main thread instead.', reason);
    this.broken = true;
    this.discardWorker();
    for (const p of this.takePending()) runHere(p.task).then(p.resolve, p.reject);
  }
}

function runHere<T extends SolverTask>(task: T): Promise<TaskResult<T>> {
  try {
    return Promise.resolve(runTask(task));
  } catch (e) {
    return Promise.reject(e);
  }
}
