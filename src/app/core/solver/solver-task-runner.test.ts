import { describe, expect, it, vi } from 'vitest';
import { TROUBLE_BREWING_SCRIPT } from '../constants/trouble-brewing';
import { GameEvent } from '../models/game';
import { CancelledError, SolverTaskRunner } from './solver-task-runner';
import { DeductionEngine, SolverInput } from './solver';
import { FakeWorker, fakeRunner } from './solver-test-worker';
import { WhatIfInput, stressTestClaim } from './what-if';
import { makePlayers } from './reference/game-generator';

const TB = TROUBLE_BREWING_SCRIPT.characters;
const confirmed = (actorId: string, roleId: string): GameEvent => ({
  id: `${actorId}-${roleId}`, gameId: 'g', night: 1, phase: 'day', kind: 'claim', actorId, payload: { roleId }, trust: 'confirmed', createdAt: ''
});
const game: SolverInput = { characters: TB, players: makePlayers(7), events: [confirmed('p2', 'chef')] };
const claimTest: WhatIfInput = { ...game, selfPlayerId: 'p1', claimRoleId: 'chef', night: 1 };

describe('SolverTaskRunner', () => {
  it('runs explain and stress-test tasks in the worker with the same answers', async () => {
    const runner = fakeRunner();
    const explained = runner.run({ kind: 'explain', input: game, playerId: 'p3', roleId: 'chef' });
    const tested = runner.run({ kind: 'stress-test', input: claimTest });
    const w = FakeWorker.created[0];
    expect(FakeWorker.created).toHaveLength(1); // one worker, tasks in order
    expect(w.requests.map(r => r.task.kind)).toEqual(['explain', 'stress-test']);
    w.answer(1); // replies may arrive in any order
    w.answer(0);
    expect(await explained).toEqual(new DeductionEngine(game).explain('p3', 'chef'));
    const result = await tested;
    expect(result).toEqual(stressTestClaim(claimTest));
    expect(result.verdict).toBe('exposed');
  });

  it('cancel rejects unfinished tasks and the next task gets a fresh worker', async () => {
    const runner = fakeRunner();
    const task = runner.run({ kind: 'explain', input: game, playerId: 'p3', roleId: 'chef' });
    runner.cancel();
    await expect(task).rejects.toBeInstanceOf(CancelledError);
    expect(FakeWorker.created[0].terminated).toBe(true);
    const next = runner.run({ kind: 'explain', input: game, playerId: 'p2', roleId: 'chef' });
    expect(FakeWorker.created).toHaveLength(2);
    FakeWorker.created[1].answer();
    expect((await next).status).toBe('possible');
  });

  it('cancel keeps an idle worker', async () => {
    const runner = fakeRunner();
    const task = runner.run({ kind: 'explain', input: game, playerId: 'p3', roleId: 'chef' });
    FakeWorker.created[0].answer();
    await task;
    runner.cancel();
    expect(FakeWorker.created[0].terminated).toBe(false);
  });

  it('rejects with the worker error message', async () => {
    const runner = fakeRunner();
    const task = runner.run({ kind: 'stress-test', input: claimTest });
    const w = FakeWorker.created[0];
    w.reply({ id: w.requests[0].id, error: 'boom' });
    await expect(task).rejects.toThrow('boom');
  });

  it('finishes every unfinished task on this thread if the worker fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const runner = fakeRunner();
    const a = runner.run({ kind: 'explain', input: game, playerId: 'p3', roleId: 'chef' });
    const b = runner.run({ kind: 'stress-test', input: claimTest });
    FakeWorker.created[0].fail('could not load');
    expect((await a).status).toBe('impossible');
    expect((await b).verdict).toBe('exposed');
    expect(runner.usingWorker).toBe(false);
    warn.mockRestore();
  });

  it('runs on this thread without workers', async () => {
    const runner = new SolverTaskRunner(null);
    expect((await runner.run({ kind: 'explain', input: game, playerId: 'p2', roleId: 'chef' })).status).toBe('possible');
  });
});
