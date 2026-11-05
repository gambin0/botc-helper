/// <reference lib="webworker" />

import { solve } from './solver';
import { SolveRequest, SolveResponse } from './solver-worker-protocol';

// Runs the deduction engine off the main thread. One request at a time: the
// app terminates and replaces this worker when a newer input arrives mid-solve.
addEventListener('message', ({ data }: MessageEvent<SolveRequest>) => {
  let response: SolveResponse;
  try {
    response = { id: data.id, result: solve(data.input) };
  } catch (e) {
    response = { id: data.id, error: e instanceof Error ? e.message : String(e) };
  }
  postMessage(response);
});
