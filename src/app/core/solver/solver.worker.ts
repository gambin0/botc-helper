/// <reference lib="webworker" />

import { SolverRequest, SolverResponse, runTask } from './solver-worker-protocol';

// Runs deduction-engine tasks off the main thread, one at a time in arrival
// order. The app terminates and replaces this worker to abandon stale work.
addEventListener('message', ({ data }: MessageEvent<SolverRequest>) => {
  let response: SolverResponse;
  try {
    response = { id: data.id, result: runTask(data.task) };
  } catch (e) {
    response = { id: data.id, error: e instanceof Error ? e.message : String(e) };
  }
  postMessage(response);
});
