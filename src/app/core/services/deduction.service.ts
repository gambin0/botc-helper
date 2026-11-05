import { DestroyRef, Service, inject, signal } from '@angular/core';
import { DeductionResult, Explanation } from '../models/game';
import { LatestSolver } from '../solver/latest-solver';
import { SolverInput } from '../solver/solver';
import { SolverTaskRunner, SolverWorker } from '../solver/solver-task-runner';
import { WhatIfInput, WhatIfResult } from '../solver/what-if';

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
 * Runs the deduction engine in Web Workers so large games do not freeze the UI.
 *
 * - The main deductions run in one worker, always for the most recent input
 *   (see LatestSolver).
 * - On-demand questions (explanations, claim stress tests) run in a second
 *   worker so they do not wait behind a long solve. Changing the game cancels
 *   them: their promises reject with CancelledError.
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

  private readonly questions = new SolverTaskRunner(typeof Worker === 'undefined' ? null : createSolverWorker);

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.solver.dispose();
      this.questions.dispose();
    });
  }

  solve(input: SolverInput): void {
    this.questions.cancel(); // answers about the old game are no longer wanted
    this.solver.submit(input);
  }

  /** Why `playerId` can or cannot be `roleId`. */
  explain(input: SolverInput, playerId: string, roleId: string): Promise<Explanation> {
    return this.questions.run({ kind: 'explain', input, playerId, roleId });
  }

  /** What the table could deduce from a hypothetical claim. */
  stressTestClaim(input: WhatIfInput): Promise<WhatIfResult> {
    return this.questions.run({ kind: 'stress-test', input });
  }

  /** Shows the empty result immediately and abandons any running work. */
  clear(): void {
    this.solver.dispose();
    this.questions.cancel();
    this.error.set(null);
    this.result.set(EMPTY_DEDUCTIONS);
  }
}
