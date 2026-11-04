# Proposal

## Why

The deduction engine (`src/app/core/solver/solver.ts`) is checked only by hand-written tests whose expected answers were worked out by hand. Nothing independent confirms that its search, pruning and symmetry breaking return exactly the set of possible roles that the rules allow. Most tests only assert that a role is *still possible*, so a bug that wrongly rules a role out is the most likely kind to go unnoticed.

## What Changes

- Add a **reference solver**: a deliberately simple brute-force implementation that lists every starting grimoire for small games and tests each one against the evidence. It is written from the semantics in `design.md`, not by adapting the engine's search code.
- Add a **random game generator** (seeded, reproducible) that produces small games: player count, role pool, and an event log of claims, deaths, executions and info.
- Add a **differential test**: on many generated games, the engine and the reference solver must agree on consistency and on every player's set of possible roles.
- Add a **generated-truth test**: pick a real grimoire, generate evidence that is legal for it, and check that the engine never rules out any player's true role.
- Disagreements found by either test are **recorded, not fixed**. Each one becomes a small, named regression test marked as an expected failure, and is listed in a findings file. This change does not modify the engine.

## Capabilities

### New Capabilities
- `solver-verification`: independent checking of the deduction engine's results against a brute-force reference on small games, plus generated-truth checks and the recording of any disagreements.

### Modified Capabilities
<!-- None. The engine's behaviour is not changed by this change. -->

## Impact

- New files only, under `src/app/core/solver/reference/`. No production code changes, and nothing is imported by the app.
- `npm test` gets longer. The default run is limited to stay well under a minute; an environment variable allows longer fuzzing runs locally.
- No new dependencies.
