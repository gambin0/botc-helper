import { describe, expect, it, vi } from 'vitest';
import { DeductionResult } from '../models/game';
import { RoleRegistry } from '../roles/role-registry';
import { LatestSolver } from './latest-solver';
import { SolverWorker } from './solver-task-runner';
import { SolverInput, solve } from './solver';
import { FakeWorker, flush } from './solver-test-worker';
import { makePlayers } from './reference/game-generator';

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
  it('solves in the worker and reports busy while it runs', async () => {
    const { solver, results, busy } = setup();
    solver.submit(input());
    expect(busy).toEqual([true]);
    expect(FakeWorker.created[0].requests[0].task.kind).toBe('solve');
    FakeWorker.created[0].answer();
    await flush();
    expect(busy).toEqual([true, false]);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(solve(input())); // the worker boundary does not change the answer
  });

  it('abandons a running solve when newer input arrives', async () => {
    const { solver, results, busy } = setup();
    solver.submit(input(5));
    const first = FakeWorker.created[0];
    solver.submit(input(6));
    expect(first.terminated).toBe(true);
    expect(busy).toEqual([true]); // still busy, not flickering
    const second = FakeWorker.created[1];
    expect(second.requests).toHaveLength(1);
    first.answer(); // a late reply from the terminated worker is ignored
    await flush();
    expect(results).toEqual([]);
    second.answer();
    await flush();
    expect(results).toHaveLength(1);
    expect(results[0].possibleRoles.filter(r => r.roleId === 'imp')).toHaveLength(6);
  });

  it('reuses an idle worker', async () => {
    const { solver } = setup();
    solver.submit(input());
    FakeWorker.created[0].answer();
    await flush();
    solver.submit(input(6));
    expect(FakeWorker.created).toHaveLength(1);
    expect(FakeWorker.created[0].terminated).toBe(false);
    expect(FakeWorker.created[0].requests).toHaveLength(2);
  });

  it('reports a failed solve without dropping the worker', async () => {
    const { solver, results, errors, busy } = setup();
    solver.submit(input());
    const w = FakeWorker.created[0];
    w.reply({ id: w.requests[0].id, error: 'boom' });
    await flush();
    expect(errors).toEqual(['boom']);
    expect(results).toEqual([]);
    expect(busy).toEqual([true, false]);
    expect(solver.usingWorker).toBe(true);
  });

  it('falls back to the main thread if the worker script fails, and answers the latest input', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { solver, results, busy } = setup();
    solver.submit(input(6));
    FakeWorker.created[0].fail('could not load');
    await flush();
    expect(solver.usingWorker).toBe(false);
    expect(busy).toEqual([true, false]);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(solve(input(6)));
    solver.submit(input(5)); // later solves run on this thread
    await flush();
    expect(results).toHaveLength(2);
    expect(FakeWorker.created).toHaveLength(1);
    warn.mockRestore();
  });

  it('falls back if a worker cannot be created', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { solver, results } = setup(() => {
      throw new Error('no workers here');
    });
    solver.submit(input());
    await flush();
    expect(solver.usingWorker).toBe(false);
    expect(results).toHaveLength(1);
    warn.mockRestore();
  });

  it('solves on this thread when workers are unavailable', async () => {
    const { solver, results, busy } = setup(null);
    solver.submit(input());
    await flush();
    expect(results).toHaveLength(1);
    expect(busy).toEqual([true, false]);
  });

  it('dispose stops the running solve', async () => {
    const { solver, busy, results } = setup();
    solver.submit(input());
    solver.dispose();
    expect(FakeWorker.created[0].terminated).toBe(true);
    expect(busy).toEqual([true, false]);
    FakeWorker.created[0].answer();
    await flush();
    expect(results).toEqual([]);
  });
});
