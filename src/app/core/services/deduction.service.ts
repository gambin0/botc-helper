import { DestroyRef, Service, inject, signal } from '@angular/core';
import { DeductionResult } from '../models/game';
import { LatestSolver, SolverWorker } from '../solver/latest-solver';
import { SolverInput } from '../solver/solver';

export const EMPTY_DEDUCTIONS: DeductionResult = {
  consistent: true,
  possibleRoles: [],
  alignments: [],
  contradictions: [],
  ignoredEvidence: [],
  warnings: [],
  incomplete: false
};

function createSolverWorker(): SolverWorker {
  return new Worker(new URL('../solver/solver.worker', import.meta.url), { type: 'module' });
}

/**
 * Runs the deduction engine in a Web Worker so large games do not freeze the
 * UI. Only the most recent input is solved; see LatestSolver.
 */
@Service()
export class DeductionService {
  /** The latest finished result. Kept on screen while a newer solve runs. */
  readonly result = signal<DeductionResult>(EMPTY_DEDUCTIONS);
  /** True while the shown result may be out of date because a solve is running. */
  readonly solving = signal(false);
  /** Error from the most recent solve, if it failed. */
  readonly error = signal<string | null>(null);

  private readonly solver = new LatestSolver(typeof Worker === 'undefined' ? null : createSolverWorker, {
    result: r => {
      this.error.set(null);
      this.result.set(r);
    },
    busy: b => this.solving.set(b),
    error: message => this.error.set(message)
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.solver.dispose());
  }

  solve(input: SolverInput): void {
    this.solver.submit(input);
  }

  /** Shows the empty result immediately and abandons any running solve. */
  clear(): void {
    this.solver.dispose();
    this.error.set(null);
    this.result.set(EMPTY_DEDUCTIONS);
  }
}
