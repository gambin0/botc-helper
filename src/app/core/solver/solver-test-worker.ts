import { SolverTaskRunner, SolverWorker } from './solver-task-runner';
import { SolverRequest, SolverResponse, runTask } from './solver-worker-protocol';

/** Test double for the solver worker: records requests; the test decides when and how it replies. */
export class FakeWorker implements SolverWorker {
  static created: FakeWorker[] = [];
  requests: SolverRequest[] = [];
  terminated = false;
  onmessage: ((event: MessageEvent<SolverResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;

  constructor() {
    FakeWorker.created.push(this);
  }

  postMessage(message: SolverRequest): void {
    this.requests.push(message);
  }

  terminate(): void {
    this.terminated = true;
  }

  reply(response: SolverResponse): void {
    this.onmessage?.({ data: response } as MessageEvent<SolverResponse>);
  }

  /** Answers request `index` like the real worker: structured-cloned task in, structured-cloned result out. */
  answer(index = this.requests.length - 1): void {
    const req = this.requests[index];
    this.reply(structuredClone({ id: req.id, result: runTask(structuredClone(req.task)) }));
  }

  fail(message: string): void {
    this.onerror?.({ message, preventDefault: () => {} } as ErrorEvent);
  }
}

/** Lets promise callbacks run. */
export const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

export function fakeRunner(): SolverTaskRunner {
  FakeWorker.created = [];
  return new SolverTaskRunner(() => new FakeWorker());
}
