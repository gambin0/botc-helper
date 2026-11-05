import { DeductionResult } from '../models/game';
import { SolverInput } from './solver';

/** Message from the app to the solver worker. */
export interface SolveRequest {
  id: number;
  input: SolverInput;
}

/** Message from the solver worker back to the app. */
export type SolveResponse = { id: number; result: DeductionResult } | { id: number; error: string };
