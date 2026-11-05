import { describe, expect, it, vi } from 'vitest';
import { DeductionResult } from '../models/game';
import { RoleRegistry } from '../roles/role-registry';
import { LatestSolver, SolverWorker } from './latest-solver';
import { SolverInput, solve } from './solver';
import { SolveRequest, SolveResponse } from './solver-worker-protocol';
import { makePlayers } from './reference/game-generator';

/** A fake worker that records requests; the test decides when and how it replies. */
class FakeWorker implements SolverWorker {
  static created: FakeWorker[] = [];
  requests: SolveRequest[] = [];
  terminated = false;
  onmessage: ((event: MessageEvent<SolveResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  constructor() {
    FakeWorker.created.push(this);
  }
  postMessage(message: SolveRequest): void {
    this.requests.push(message);
  }
  terminate(): void {
    this.terminated = true;
  }
  reply(response: SolveResponse): void {
    this.onmessage?.({ data: response } as MessageEvent<SolveResponse>);
  }
  /** Replies like the real worker: structured-cloned input in, structured-cloned result out. */
  solveLast(): void {
    const req = this.requests.at(-1)!;
    this.reply(structuredClone({ id: req.id, result: solve(structuredClone(req.input)) }));
  }
  fail(message: string): void {
    this.onerror?.({ message, preventDefault: () => {} } as ErrorEvent);
  }
}

const input = (n = 5): SolverInput => ({
  characters: RoleRegistry.toScriptCharacters(['chef', 'empath', 'noble', 'knight', 'steward', 'poisoner', 'imp']),
  players: makePlayers(n),
  events: []
});

function setup(createWorker: (() => SolverWorker) | null = () => new FakeWorker()) {
  FakeWorker.created = [];
  const results: DeductionResult[] = [];
  const busy: boolean[] = [];
  const errors: string[] = [];
  const solver = new LatestSolver(createWorker, {
    result: r => results.push(r),
    busy: b => busy.push(b),
    error: e => errors.push(e)
  });
  return { solver, results, busy, errors };
}

describe('LatestSolver', () => {
  it('solves in the worker and reports busy while it runs', () => {
    const { solver, results, busy } = setup();
    solver.submit(input());
    expect(busy).toEqual([true]);
    expect(results).toEqual([]);
    FakeWorker.created[0].solveLast();
    expect(busy).toEqual([true, false]);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(solve(input())); // the worker boundary does not change the answer
  });

  it('abandons a running solve when newer input arrives', () => {
    const { solver, results } = setup();
    solver.submit(input(5));
    const first = FakeWorker.created[0];
    solver.submit(input(6));
    expect(first.terminated).toBe(true);
    const second = FakeWorker.created[1];
    expect(second.requests).toHaveLength(1);
    // A late reply from the terminated worker is ignored.
    first.reply({ id: first.requests[0].id, result: solve(input(5)) });
    expect(results).toEqual([]);
    second.solveLast();
    expect(results).toHaveLength(1);
    expect(results[0].possibleRoles.filter(r => r.roleId === 'imp')).toHaveLength(6);
  });

  it('reuses an idle worker', () => {
    const { solver } = setup();
    solver.submit(input());
    FakeWorker.created[0].solveLast();
    solver.submit(input(6));
    expect(FakeWorker.created).toHaveLength(1);
    expect(FakeWorker.created[0].terminated).toBe(false);
    expect(FakeWorker.created[0].requests).toHaveLength(2);
  });

  it('reports a failed solve without dropping the worker', () => {
    const { solver, results, errors, busy } = setup();
    solver.submit(input());
    const w = FakeWorker.created[0];
    w.reply({ id: w.requests[0].id, error: 'boom' });
    expect(errors).toEqual(['boom']);
    expect(results).toEqual([]);
    expect(busy).toEqual([true, false]);
    expect(solver.usingWorker).toBe(true);
  });

  it('falls back to the main thread if the worker script fails, and answers the latest input', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { solver, results, busy } = setup();
    solver.submit(input(6));
    FakeWorker.created[0].fail('could not load');
    expect(solver.usingWorker).toBe(false);
    expect(busy).toEqual([true, false]);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(solve(input(6)));
    solver.submit(input(5)); // later solves run synchronously
    expect(results).toHaveLength(2);
    expect(FakeWorker.created).toHaveLength(1);
    warn.mockRestore();
  });

  it('falls back if a worker cannot be created', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { solver, results } = setup(() => {
      throw new Error('no workers here');
    });
    solver.submit(input());
    expect(solver.usingWorker).toBe(false);
    expect(results).toHaveLength(1);
    warn.mockRestore();
  });

  it('solves synchronously when workers are unavailable', () => {
    const { solver, results, busy } = setup(null);
    solver.submit(input());
    expect(results).toHaveLength(1);
    expect(busy).toEqual([]);
  });

  it('dispose stops the running solve', () => {
    const { solver, busy, results } = setup();
    solver.submit(input());
    solver.dispose();
    expect(FakeWorker.created[0].terminated).toBe(true);
    expect(busy).toEqual([true, false]);
    FakeWorker.created[0].solveLast();
    expect(results).toEqual([]);
  });
});
