# Fuzz campaign

The campaign is a plain script, so no agent is needed to run it:

```bash
bash scripts/fuzz-campaign.sh             # 12 jobs × 1500 games per check, a few minutes
GAMES=5000 bash scripts/fuzz-campaign.sh  # longer
```

Each job runs one pool profile on its own seed (`npm run fuzz -- profiles` lists them), plus one job with longer event logs. Output goes to `fuzz-runs/campaign/<job>/`, which git ignores.

## Known bugs are filtered automatically

Before a failure is written out, `explainByKnownBug` in `checks.ts` re-runs it with each recorded bug's **workaround**, a change to the input that keeps the correct answer but avoids the engine's mistake:

| Bug | Workaround |
|-----|------------|
| F-001 (two Village Idiots) | Put each Village Idiot's info first among the Village Idiot info events. |
| F-002 (Outsider modifier order) | List Outsider-raising roles before Outsider-lowering ones. |

If the failure goes away under a workaround, it is counted under that bug (the `known bugs` line in the output, and `knownBugs` in `summary.json`) and not written. Use `--keep-known` to write these too. `regressions.test.ts` checks that the filter recognises each bug's regression case.

When a new bug is recorded, add a workaround for it to `WORKAROUNDS` in `checks.ts` if one exists, so that later runs stop reporting it.

## Triage of new failures

Anything left in `fuzz-runs/campaign/*/failures/` is not explained by a known bug.

1. Read it with `npm run fuzz -- show <file>.json`. It shows the minimized game and marks every role where the engine and the reference differ.
2. Decide which side is right against `openspec/changes/add-reference-solver/design.md` Section 4.
3. If the reference is wrong, fix it and add a hand-checked test to `reference-solver.test.ts`.
4. If the engine is wrong:
   - add a finding to `FINDINGS.md` and an `it.fails` regression to `regressions.test.ts`;
   - add a workaround to `checks.ts` if one exists.
5. Rerun the campaign.

## Results

| Date | Games per job | Jobs | Known-bug hits | New failures | Notes |
|------|---------------|------|----------------|--------------|-------|
| 2026-11-04 | 1500 (diff and truth) | 12 | F-002 ×624 (366 diff, 258 truth); F-001 ×0 | 0 | 4 games skipped (engine search limit). Slowest game 6 s. |

### Does the campaign catch bugs?

Checked on 2026-11-04 by planting a bug in a temporary copy of `solver.ts`, running 400 games of one profile, then restoring the file:

| Planted bug | Profile | Caught? |
|-------------|---------|---------|
| Fibbin allowance counted per night instead of per game | fibbin | Yes, by the generated-truth check (2 failures) |
| Drunk claim rule removed ("if the Drunk claims X, X is not in play") | mixed | Yes, by the differential check (3 failures by game ~230) |
| Scarlet Woman saves the Demon even with fewer than 5 alive | executions | Yes, by the differential check (3 failures by game ~65) |
