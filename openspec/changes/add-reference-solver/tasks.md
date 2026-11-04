# Tasks

Ground rules for every task: do not edit `src/app/core/solver/solver.ts` or any file under `src/app/core/rules/` or `src/app/core/roles/`. All new code goes in `src/app/core/solver/reference/`. Follow `design.md` Section 4 exactly when deciding whether a grimoire fits; if it seems wrong or unclear, write the question in `FINDINGS.md` rather than guessing. Run `npm test` and `npm run typecheck:test` after each group, and both must pass.

## 1. Reference solver: setup and enumeration

- [ ] 1.1 Create `src/app/core/solver/reference/reference-solver.ts` that builds the role pool (design Decision 3: normalized IDs, teams, `maxCopies`, seat-only roles, Fibbin allowance). Verify with a test in `reference-solver.test.ts` that a Trouble Brewing pool yields 22 seatable roles and that adding `fibbin` gives an allowance of 1 without adding a seat role.
- [ ] 1.2 Implement legal role-list enumeration (Decision 3: Outsider set, Minion count, Lil' Monsta exception, `requiresInPlay`). Verify with tests:
  - 5 players, TB pool: every list has 3 Townsfolk, 0 Outsiders, 1 Minion and 1 Demon, except lists with the Baron, which have 1 Townsfolk and 2 Outsiders;
  - a pool with `lilmonsta` produces some lists with 0 Demons and 2 Minions;
  - a pool with `huntsman` never produces a list with the Huntsman and no Damsel.
- [ ] 1.3 Implement `enumerateWorlds` (distinct seatings of each list, no duplicates for repeated roles) with the 2,000,000-seating guard. Verify with a test that a 5-player pool with exactly 3 Townsfolk, 1 Minion and 1 Demon yields 5! = 120 seatings, and that a pool with 2 copies of `villageidiot` allowed produces no duplicate seatings.

## 2. Reference solver: evidence

- [ ] 2.1 Implement self-knowledge and claims in `worldFits` (design 4a and the claim part of 4b, including the Drunk rule and the honesty option). Verify with `reference-solver.test.ts` cases mirroring the `claims` block of `solver.test.ts`: the same inputs give the same possible-role sets.
- [ ] 2.2 Implement deaths, resurrections and executions (rest of 4b: the alive snapshot, game-ended, Demon survived, Saint survived). Verify with cases mirroring the `public abilities and executions` block of `solver.test.ts`. Use 5–7 players instead of 8 where needed to keep them fast, and work out the expected answers again for the smaller game.
- [ ] 2.3 Implement info judging, registrations, red herring and Faux Paw (4c, 4e, 4f). Verify with cases mirroring the `information and reliability` block of `solver.test.ts` at 7 players or fewer, plus a test that a Spy can register differently to two info events on the same night.
- [ ] 2.4 Implement the false-info budget (4d: per-night distinct seats, capacity from distinct roles, Fibbin allowance, Village Idiot drunk copy tried each way). Verify with the Fibbin case from `solver.test.ts` and a test where two Village Idiots each give false info: it fits if one of them is drunk and the other is poisoned by a Poisoner, and does not fit without the Poisoner.
- [ ] 2.5 Implement `referenceSolve` (consistent flag plus per-player possible sets). Verify that the scenarios in `specs/solver-verification/spec.md` under "Reference solver lists possibilities exhaustively" pass as tests.

## 3. Game generator

- [ ] 3.1 Create `game-generator.ts` with `generateGame(seed, index)` as in design Decision 5, using a seeded PRNG and never `Math.random`. Verify with a test that the same (seed, index) gives a deep-equal input twice, that 1,000 generated games all have 5–7 players and at most 10 seatable roles, and that every role ID used exists in `RoleRegistry`.
- [ ] 3.2 Add `generateTrueGame(seed, index)` for the generated-truth check, which returns `{ input, truth }` (Decision 6). Verify with a test that `worldFits(input, truth)` is true for 300 generated games.
- [ ] 3.3 Measure: log how long `referenceSolve` takes on 300 generated games and confirm the slowest is under 1 second. If not, tighten the generator (smaller pools or fewer players) rather than adding pruning to the reference. Record the timing in `FINDINGS.md` under a "Performance" heading.

## 4. Checks

- [ ] 4.1 Create `differential.test.ts` as in Decision 6, with `N` from `REF_SOLVER_GAMES` (default chosen so the run stays under 30 seconds), an explicit timeout, a printed count of skipped games, and failure output that includes the seed, the index and the input JSON. Verify by running `npm test`. Deliberately break the reference (for example, ignore asserted claims), confirm the test fails with a useful message, then undo the break.
- [ ] 4.2 Create `generated-truth.test.ts` as in Decision 6, with the same `N` and timeout handling. Verify by running `npm test` and by running `REF_SOLVER_GAMES=2000 npx vitest run src/app/core/solver/reference`.
- [ ] 4.3 For every disagreement found in 4.1 or 4.2, follow design Decision 7: minimize it, decide which side is wrong, add an `it.fails` case to `regressions.test.ts` if it is the engine, add a `FINDINGS.md` entry, and add the (seed, index) to `KNOWN_DISAGREEMENTS`. Verify that `npm test` passes and that every `it.fails` case has a matching `FINDINGS.md` entry. If there are no disagreements, say so in `FINDINGS.md`.

## 5. Wrap-up

- [ ] 5.1 Add a short section to `README.md` on what the reference checks do, how to run a longer fuzzing run with `REF_SOLVER_GAMES`, and where findings are recorded. Verify the documented command runs as written.
- [ ] 5.2 Final check: `git diff --stat master` shows changes only under `src/app/core/solver/reference/`, `README.md` and this change's `tasks.md`. `npm test` and `npm run typecheck:test` both pass, and the full test run takes under 60 seconds longer than before this change.

## Workflow follow-up

- A stronger model or the user reviews `FINDINGS.md` and decides which engine fixes to make in a separate change.
- Archive this change once the review is done.
