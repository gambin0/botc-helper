import { DeductionResult, Explanation } from '../models/game';
import { DeductionEngine, SolverInput, solve } from './solver';
import { WhatIfInput, WhatIfResult, stressTestClaim } from './what-if';

/** Work the solver worker can do. Everything in here must survive structured cloning. */
export type SolverTask =
  | { kind: 'solve'; input: SolverInput }
  | { kind: 'explain'; input: SolverInput; playerId: string; roleId: string }
  | { kind: 'stress-test'; input: WhatIfInput };

interface TaskResults {
  solve: DeductionResult;
  explain: Explanation;
  'stress-test': WhatIfResult;
}

export type TaskResult<T extends SolverTask> = TaskResults[T['kind']];

/** Message from the app to the solver worker. */
export interface SolverRequest {
  id: number;
  task: SolverTask;
}

/** Message from the solver worker back to the app. */
export type SolverResponse = { id: number; result: unknown } | { id: number; error: string };

/** Runs a task on the current thread. Used by the worker, and by the app when workers are unavailable. */
export function runTask<T extends SolverTask>(task: T): TaskResult<T>;
export function runTask(task: SolverTask): TaskResult<SolverTask> {
  switch (task.kind) {
    case 'solve':
      return solve(task.input);
    case 'explain':
      return new DeductionEngine(task.input).explain(task.playerId, task.roleId);
    case 'stress-test':
      return stressTestClaim(task.input);
  }
}
