# Tasks

Groups 1–5 are the tooling. Group 6 runs the fuzz campaign. It was first planned as work for a cheaper agent. A pilot showed the failures were almost all repeats of a known bug, so it became a script with an automatic known-bug filter (`scripts/fuzz-campaign.sh`). Group 7 is review.

Ground rules for every task: do not edit `src/app/core/solver/solver.ts` or anything under `src/app/core/rules/` or `src/app/core/roles/`. Run `npm test` and `npm run typecheck:test` after each group; both must pass.

## 1. Reference solver: setup and enumeration

- [x] 1.1 Build the role pool in `reference/reference-solver.ts` (Decision 3). Verified by the `role pool and setup` tests in `reference-solver.test.ts` (22 seatable TB roles; Fibbin adds an allowance, not a seat).
- [x] 1.2 Legal role lists: Outsider changes summed and clamped once, Minion count, Lil' Monsta exception, `requiresInPlay`. Verified by the 5-player Baron, Lil' Monsta and Huntsman tests.
- [x] 1.3 Distinct seatings with per-seat filters and the 2,000,000-seating guard. Verified by the 5! and Village Idiot duplicate-seating tests.

## 2. Reference solver: evidence

- [x] 2.1 Self-knowledge and claims (4a, 4b). Verified by the `claims` tests.
- [x] 2.2 Deaths, executions, Saint and Demon survival (4b). Verified by the `public abilities and executions` tests.
- [x] 2.3 Info judging, per-event registrations, red herring, Faux Paw (4c, 4e, 4f). Verified by the `information` tests, including the Spy registering differently to two abilities.
- [x] 2.4 False-info budget, Fibbin, Village Idiot drunk copy tried each way (4d). Verified by the `false-info budget` tests.
- [x] 2.5 `referenceSolve`, `worldFits`, `legalRoleLists`. Verified by the `spec scenarios` and `worldFits` tests.

## 3. Game generator

- [x] 3.1 `reference/game-generator.ts`: seeded `generateGame` with pool profiles and shuffled pool order. Verified by `game-generator.test.ts` (deterministic; 5–7 players; ≤10 seatable roles; known role IDs; forced profile roles present).
- [x] 3.2 `generateTrueGame`: evidence built one event at a time, each event kept only if the true grimoire still fits. Verified by `game-generator.test.ts` (truth always fits).
- [x] 3.3 Performance measured: slowest generated game about 1 s, typical 15 ms; recorded in `FINDINGS.md`.

## 4. Checks and fuzz command

- [x] 4.1 `reference/checks.ts`: `differentialCheck`, `truthCheck`, `minimize`. `differential.test.ts` and `generated-truth.test.ts` run them in `npm test` (150 and 300 games, `REF_SOLVER_GAMES` overrides), skipping `known-disagreements.ts`.
- [x] 4.2 `scripts/fuzz.ts` (`npm run fuzz`), with `run`, `show`, `replay` and `profiles` subcommands. Each failure is written as a minimized JSON file. Verified by running each subcommand; it found F-002 within 300 games.
- [x] 4.3 Recorded the findings made while building: F-001 (Village Idiot drunk copy) and F-002 (Outsider modifier order). Each has an `it.fails` test in `regressions.test.ts` and an entry in `FINDINGS.md`; default-seed duplicates are listed in `known-disagreements.ts`. Verified: `npm test` passes with 2 expected failures.

## 5. Documentation

- [x] 5.1 README section "Checking the deduction engine". Verified that the documented commands run.
- [x] 5.2 `reference/CAMPAIGN.md`: how to run the campaign, the known-bug filter, and the triage steps.
- [x] 5.3 Known-bug filter: `explainByKnownBug` in `checks.ts` re-runs a failure with each recorded bug's workaround. It is used by the fuzz command and by both `npm test` checks. Verified by the filter test in `regressions.test.ts`.

## 6. Fuzz campaign

- [x] 6.1 Run `bash scripts/fuzz-campaign.sh`, triage every new failure as described in `CAMPAIGN.md`, and fill in its Results table. Verify that no failure files are left untriaged and that `npm test` passes.

## 7. Review (Claude)

- [x] 7.1 Review the findings. Every `open` finding has an `it.fails` test, and a workaround in `checks.ts` where possible. Verify that `npm test` passes.
- [x] 7.2 Final check (done 2026-11-04; `solver.ts` also changed, by the separate F-001/F-002 fix commit): `git diff --stat master` shows changes only to the new reference folder, `scripts/fuzz.ts`, `scripts/fuzz-campaign.sh`, `README.md`, `package.json`/`package-lock.json` (tsx), `tsconfig.spec.json`, `.gitignore` and this change's files.

## Workflow follow-up

- F-001 and F-002 were fixed on 2026-11-04, in a separate commit on the same branch (see `FINDINGS.md`).
- Archive this change after review.
