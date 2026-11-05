# Deduction engine review (November 2026)

Findings from building the brute-force reference solver (`src/app/core/solver/reference/`) and fuzzing the engine against it, plus what that work cannot cover. Items are in suggested order of work.

## Where things stand

- The engine agrees with an independent brute-force solver on 36,000 generated checks across 12 role profiles (5–7 players). The campaign also caught three bugs planted to test it. See `src/app/core/solver/reference/CAMPAIGN.md`.
- Two engine bugs were found and fixed (`src/app/core/solver/reference/FINDINGS.md`):
  - **F-001:** with two or more Village Idiots, the engine always treated the first one in the log as the drunk copy.
  - **F-002:** Outsider setup changes were clamped at zero in pool order, so Hermit before Baron gave the wrong count. It hit about 1 in 50 random games.
- The checks run in `npm test` (about 12 s). The full campaign is `bash scripts/fuzz-campaign.sh` (about 7 min).

## 1. Large games are slow, and the solver blocks the UI

Measured with `npm run bench:solver` (Trouble Brewing, every player claims a Townsfolk, most report one piece of info; desktop CPU):

| Players | Median | 90th percentile | Slowest | Search limit hit |
|---|---|---|---|---|
| 10 | 0.1 s | 2.0 s | 3.1 s | 0 / 30 |
| 12 | 0.5 s | 1.9 s | 16.9 s | 0 / 30 |
| 15 | 4.7 s | 20.6 s | 36.1 s | 5 / 30 |

The app called the solver synchronously on the main thread. This happens in four places:
- `GameStateService.deductions`, which re-solves on every edit;
- `explain()`;
- the claim stress test (`stressTestClaim`, three solves);
- the role picker's `checkPool`.

The UI freezes for the whole solve, and phones are slower than this desktop.

**Work:**
- [x] **Run `deductions` in a Web Worker,** with the latest input winning and an "Updating…" status (branch `solver-web-worker`). The code is in `DeductionService`, `latest-solver.ts` and `solver.worker.ts`.
  - **Checked in Chrome** on the production build with the slowest 15-player bench game. The main thread never paused for more than 51 ms while the solve ran in the worker.
  - Flipping a setting twice mid-solve abandoned the stale solve and settled on the final input.
  - The console stayed empty, and the fallback to the main thread never fired.
  - The deductions page keeps the previous result visible during a solve and marks it `aria-busy`. It is not dimmed, because that would break contrast minimums.
- [ ] Move `explain()` and `stressTestClaim` to the worker too. `checkPool` has no events and is fast, so it can stay.
- [ ] **Make the search faster for 12–15 players.** This is where the real time goes. The reference solver and the fuzz campaign make it safe to optimize: any change that alters results will fail `npm test`.
- [ ] Decide how the UI should present results when the search limit is hit. Today it marks roles "Not disproven (search limit reached)", and at 15 players that happens in about 1 game in 6.

## 2. Simplified rules that affect real games

The engine warns about these (`approximation` in `role-rules.ts`), but they matter in ordinary play:

- [ ] **Star-passing (Imp) and the Scarlet Woman becoming the Demon are not modelled.** Results describe *starting* characters. After a star-pass in Trouble Brewing, the board can mislead players who read it as current characters.
- [ ] The Marionette sitting next to the Demon is not enforced.
- [ ] Lord of Typhon's line of evil players is not enforced.
- [ ] Multiple Legion players are not supported.
- [ ] Atheist games with no evil players are not supported.
- [ ] Summoner games that start with no Demon are not supported.

## 3. Rule data that the fuzzer cannot check

The reference solver shares `role-rules.ts` and `info-specs.ts` with the engine, so a rule written wrong in either is wrong in both and goes unnoticed. Noticed while reading:

- [ ] **Corruption capacity ignores whether the corrupter is alive.** A dead Poisoner still allows a poisoned player each night. This is too lenient: it leaves extra roles possible but never wrongly rules one out.
- [ ] **The Widow gets capacity every night,** but she poisons one player once per game. Also too lenient.
- [ ] **Undertaker info is not tied to an execution.** The form takes any player.
- [ ] A rules pass over every entry in `role-rules.ts` and `info-specs.ts` against the official almanac.
- [ ] The strongest check would be a set of **real game logs with known final grimoires,** as regression tests.

## 4. Test scenarios that random games miss

F-001 never came up in 36,000 random games; only a hand-built case found it. Random generation rarely produces structured situations.

- [ ] Add scenario generators for several copies of one role, several pieces of info on one night, long chains of deaths and executions, and Fortune Teller red herrings across nights.
- [ ] Extend the reference solver to 8–9 players with small pools. It is limited to 7 today to stay fast.

## 5. Project basics

- [ ] **CI:** there is no `.github` workflow, so `npm test`, `npm run typecheck:test` and `ng build` only run when someone remembers to.
- [ ] **No component tests,** although `AGENTS.md` requires the app to pass all AXE accessibility checks. Nothing checks that today.
