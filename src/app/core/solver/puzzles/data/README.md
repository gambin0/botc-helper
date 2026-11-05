# Community logic puzzles

These puzzles and their solutions are copied unchanged from
[jthemphill/botc-solvers](https://github.com/jthemphill/botc-solvers)
(`src/examples`, commit `9f7bf3eb7cbab71da9db0d4d4365c0a87b34d4bf`), under the MIT
license in `LICENSE` here. Most are the weekly Blood on the Clocktower puzzles
posted to r/BloodOnTheClocktower.

`puzzles.test.ts` converts each one (`puzzle-import.ts`) and checks that the
engine never rules out the published solution. `npx tsx scripts/puzzle-check.ts`
prints a per-puzzle report, including how many players the engine pins down.
