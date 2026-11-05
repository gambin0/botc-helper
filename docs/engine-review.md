# Deduction engine review (November 2026)

Findings from building the brute-force reference solver (`src/app/core/solver/reference/`) and fuzzing the engine against it, plus what that work cannot cover. Items are in suggested order of work.

## Where things stand

- The engine agrees with an independent brute-force solver on 39,000 generated checks across 13 jobs (5–7 players), including Demon moves. The campaign also caught all five bugs planted to test it. See `src/app/core/solver/reference/CAMPAIGN.md`.
- Two engine bugs were found and fixed (`src/app/core/solver/reference/FINDINGS.md`):
  - **F-001:** with two or more Village Idiots, the engine always treated the first one in the log as the drunk copy.
  - **F-002:** Outsider setup changes were clamped at zero in pool order, so Hermit before Baron gave the wrong count. It hit about 1 in 50 random games.
- The checks run in `npm test` (about 12 s). The full campaign is `bash scripts/fuzz-campaign.sh` (about 7 min).

## 1. Large games are slow, and the solver blocks the UI

Measured with `npm run bench:solver` on a desktop CPU, 30 Trouble Brewing games per row. It has two kinds of game:
- **Consistent:** built from a true grimoire. Good players claim their character, evil players bluff, and info roles report info the grimoire allows.
- **Contradictory:** random claims and random info. Almost every game conflicts, so this row times finding and setting aside the conflicting evidence.

The first version of the bench gave only contradictory games, and it ran the code through tsx, which is about 3× slower than the bundled app. Its figures (15 players: median 4.7 s, slowest 36 s) overstated the problem. The "before" figures below are the original engine measured the new way.

| Game | Players | Before: median / slowest | After: median / slowest | Search limit hit (before → after) |
|---|---|---|---|---|
| Consistent | 12 | 37 ms / 106 ms | 10 ms / 42 ms | 0 → 0 |
| Consistent | 15 | 519 ms / 2.2 s | 118 ms / 0.64 s | 1 → 0 |
| Contradictory | 12 | 268 ms / 5.9 s | 37 ms / 0.22 s | 0 → 0 |
| Contradictory | 15 | 2.6 s / 13.1 s | 0.35 s / 1.4 s | 5 → 1 |

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
- [x] **Move `explain()` and `stressTestClaim` to the worker too.** They run in a second worker (`SolverTaskRunner`), so they don't wait behind a long solve. Changing the game cancels them: an open "Why?" panel closes, and the claim test says to test again. `checkPool` has no events and is fast, so it stays on the main thread.
  - **Checked in Chrome** with the same 15-player game:
    - Four "Why?" panels answered in 3.9 s.
    - A claim stress test took 29.6 s; before this change, that froze the page for the whole time.
    - The main thread never paused for more than 11 ms in either case.
    - Flipping a setting while an explanation was pending closed its panel.
- [x] **Make the search faster for 12–15 players** (table above). Every change was checked against a snapshot of 90 bench games and against the reference solver (`npm test` and the fuzz campaign).
  - **Less work per search node** (about 3.4× faster, with identical results and node counts):
    - the allowed team sizes are cached instead of rebuilt at every node;
    - a "the Drunk thinks they are X" rule is only checked when the Drunk or X is placed;
    - the corruption check no longer allocates when no whole-circle info applies;
    - two hot-path costs are gone: an O(n) loop in `unassign`, and a role-rule lookup per check.
  - **Public outcomes restrict seats up front.** A Slayer kill or Virgin execution needs the source to really hold the ability, and a single target to register suitably. The search used to find this out separately in every search. Now it is fixed before the search starts, and "Ruled out" reasons name the event instead of "the combined evidence".
  - **Finding a minimal contradiction tests whole chunks of evidence.** If the rest is still contradictory without a whole chunk, every piece in it can go at once. This gives the same answer as dropping one piece at a time, with far fewer expensive proofs.
  - **Results changed only where the old engine ran out of search budget.** In 7 of the 90 snapshot games, the old engine hit its limit and reported a conflict set that was not minimal. The new engine stays within budget, so it reports the truly minimal set.
  - **"Search limit reached" is no longer reported when the answer is complete.** That happened when the first search gave up but the per-role searches still settled every role.
- [ ] Decide how the UI should present results when the search limit is hit. Today it marks roles "Not disproven (search limit reached)". After the speed-up, this is rare: none of 30 consistent 15-player games, and 1 of 30 contradictory ones.
- [ ] **Further speed-ups, if phones need them.** In a slow consistent 15-player game, most of the time goes on proving 15–20 roles impossible, at about 20–30 ms each. The next step would be domain propagation for info constraints. Today a constraint is only checked once every seat it involves is assigned. Measure on a phone first: the work now runs in a worker, so a few hundred milliseconds shows only as an "Updating…" message.

## 2. Simplified rules that affect real games

The engine warns about these (`approximation` in `role-rules.ts`), but they matter in ordinary play:

- [x] **Star-passing (Imp) and the Scarlet Woman becoming the Demon.** Both solvers now consider every possible history of who held the Demon. Each piece of info is judged against the characters as they stood when it was received, and the result has a new `demonNow` list: who could be the living Demon after the last event. The Deduce page shows it in the summary and on each player.
  - **Order of events:** for the Demon's history, events run in game order (`rules/timeline.ts`). On night N, deaths come first, then that night's info (including day-N public abilities, which the log files under the day's number), then day N's execution.
  - **When the living Demon dies:**
    - a living Scarlet Woman must take over if 5 or more were alive;
    - otherwise, after a non-execution death, an Imp may pass the star to any living Minion;
    - an execution logged as "the game continued" needs one of those, or a Mastermind;
    - otherwise the game is over, so nothing may happen afterwards.
  - **A game-ending execution** must kill the living Demon (and no Scarlet Woman may be able to take over) or the Saint.
  - **New deductions** follow from this. A non-Imp Demon that died while the game went on is ruled out. "The game ended on the Imp's execution" proves the Scarlet Woman was dead or that 4 or fewer players were alive.
  - **Still lenient (never wrongly rules anything out):**
    - the log doesn't record how someone died, so an Imp that died some other way by day is still allowed to pass the star (a Slayer kill no longer is: see section 3);
    - a Poisoner who becomes the Imp is still counted as able to poison.
  - **The Fang Gu jumping** is modelled the same way (`passesOnDeath: { to: 'outsider', once: true }`): when the Fang Gu dies other than by execution, a living Outsider may become the Fang Gu, once per game. A living Scarlet Woman may still catch it instead. Before this, a Fang Gu that jumped made the rest of the log read as "after the game ended", which wrongly ruled out the truth.
  - **Not modelled:** other ways the Demon moves (the Pit-Hag, the Barber, Snake Charmer swaps). These roles now carry a warning.
  - **Testing:** a new `demonmoves` fuzz profile (TB with forced Imp and Scarlet Woman, 35% deaths) is in the campaign. In it, the starting Imp dies and the game goes on in about 1 game in 5. Both planted bugs were caught: skipping the star-pass (by game ~77) and dropping the loose check for info after a possible move (by the truth check). `demon-moves.test.ts` runs hand-written scenarios on both solvers.
  - **Speed:** the bench now has a "with deaths" row; at 15 players it takes a median of 174 ms and at most 0.62 s.
- [ ] The Marionette sitting next to the Demon is not enforced.
- [ ] Lord of Typhon's line of evil players is not enforced.
- [ ] Multiple Legion players are not supported.
- [ ] Atheist games with no evil players are not supported.
- [ ] Summoner games that start with no Demon are not supported.

## 3. Rule data that the fuzzer cannot check

The reference solver shares `role-rules.ts` and `info-specs.ts` with the engine, so a rule written wrong in either is wrong in both and goes unnoticed. Noticed while reading:

- [x] **A dead corrupter no longer poisons.** The Poisoner, Widow, No Dashii and Pukka (`corruptsWhileAlive`) cover nobody on nights after they died. An execution on day N or a death on night N stops them from night N+1, since the Poisoner acts before the Imp kills. Other corrupters keep the old, lenient rule: some, such as the Sweetheart, work by dying.
- [x] **The Widow poisons one player for the whole game** (`corruptsOneForGame`), while she lives. False info from two different players on different nights now needs more than a Widow.
- [x] **Undertaker info must name the player executed the day before.** Even a drunk Undertaker knows who was executed, so info naming anyone else rules out its source being the Undertaker. A note explains this and suggests logging the missing execution. An execution logged under the same day number as the info also counts, in case the log numbers days that way.
  - These three are only checked on complete grimoires; the search's early pruning stays loose, which is safe. Both solvers implement them, and `rule-data.test.ts` runs each scenario on both.
- [x] **A rules pass against the official ability text** (in `roles/official-roles.ts`) for every entry in `role-rules.ts` and `info-specs.ts`, and for every official character whose ability mentions poisoning, drunkenness, false info, setup changes, registering or becoming something.
  - **Fixed, too strict (could rule out the truth):**
    - the Fang Gu jump (above);
    - the Vigormortis had no corruption at all, though Minions it killed poison a Townsfolk neighbour. It now allows 3 corrupted players a night, with a warning that the neighbour rule is not enforced.
  - **Fixed, too loose (missed deductions):**
    - the Lleech's host, the Philosopher's drunk copy, the Sweetheart's drunk, the Puzzlemaster's drunk and the Courtier's character are each one player for the whole game, like the Widow (`corruptsOneForGame`). They were a new player each night. The Puzzlemaster had no corruption at all, which was too strict.
    - Ravenkeeper and Sage info needs the source to have died that night (`afterOwnDeath`, `diedThatNight`), like the Undertaker check: otherwise the source is not that character, with a note suggesting logging the missing death.
  - **Now warned about** (`approximation`): characters that change someone's alignment or character, or register falsely, which the engine does not track: Bounty Hunter, Cult Leader, Goon, Ogre, Mezepheles, Farmer, Pit-Hag, Snake Charmer, Riot, Zombuul, Revolutionary. Deductions in games with these can rule out the truth.
  - **Still lenient, left as is:** an Imp or Fang Gu that died by day other than to a logged Slayer shot may still pass the Demon on (deaths have no cause); the No Dashii's poisoning is not tied to its Townsfolk neighbours; the Vortox rule "if no-one is executed, evil wins" is not used, since the log has no "no execution today" entry; the Minstrel, Sailor and Innkeeper are allowed on any night.
  - `rule-data.test.ts` and `demon-moves.test.ts` cover the fixes on both solvers; the new tests fail with the old rule data. A `fanggu` fuzz profile (forced Fang Gu and Scarlet Woman, 35% deaths) joins the campaign.
- [x] **Community logic puzzles with published solutions** (`solver/puzzles/`). Real game logs with final grimoires turned out not to be published anywhere searchable. The closest substitute is the 96 weekly r/BloodOnTheClocktower puzzles, encoded as JSON with their solutions in [jthemphill/botc-solvers](https://github.com/jthemphill/botc-solvers) (MIT), a SAT-based solver.
  - **How it works:** `puzzle-import.ts` converts each puzzle into a log, dropping only what the app cannot record (Juggler, Savant, Artist info and so on), which can only leave more open. `puzzles.test.ts` requires every solution to stay possible, and `scripts/puzzle-check.ts` reports per puzzle.
  - **Result:** 87 puzzles convert (9 use house rules or homebrew characters). Before the fixes below, 26 had their solution ruled out; now 81 are sound, and the 6 left need rules we don't model (Goon, Riot ×2, Barber, Zombuul, and the Chef question below). Precision: 207 of the players in sound puzzles are pinned to the solution; 12 puzzles are fully solved.
  - **Rule bugs it found (all ruled out the truth), fixed in both solvers:**
    - a **Mutant** must not claim to be an Outsider, so an honest good player claiming a Townsfolk can be the Mutant;
    - the **Lunatic** believes they are the Demon and bluffs like one, so they can claim anything (not only a Demon);
    - the **Hermit** has every Outsider ability on the script: with the Drunk's it thinks it is a Townsfolk, with the Lunatic's a Demon, with the Mutant's it claims a non-Outsider, and with the Recluse's it can register as evil, a Minion or a Demon.
  - **A deduction it showed we were missing:** an Imp shot by the Slayer died by day, so it cannot pass the star (`killedBySlayer`). This closes the "Slayer kill" leniency noted in section 2.
  - **Open question:** puzzle 31 assumes a Recluse sitting between two evil players can count as 1 Chef pair, registering separately for each pair. The engine uses one registration per Chef reading, so it rules that solution out.
  - **Where the engine is weaker than the puzzles:** abilities we don't model (Soldier and Monk protection, the Xaan's night, Juggler, Savant, Artist and others), so many puzzles leave several characters open.
- [ ] Real game logs with known final grimoires would still be the strongest check.

## 4. Test scenarios that random games miss

F-001 never came up in 36,000 random games; only a hand-built case found it. Random generation rarely produces structured situations.

- [ ] Add scenario generators for several copies of one role, several pieces of info on one night, long chains of deaths and executions, and Fortune Teller red herrings across nights.
- [ ] Extend the reference solver to 8–9 players with small pools. It is limited to 7 today to stay fast.

## 5. Project basics

- [x] **CI** (`.github/workflows/ci.yml`): every push and pull request runs the three typechecks, `npm test` (including the engine vs reference checks), the build, and the accessibility scan.
- [x] **The fuzz campaign** (`.github/workflows/fuzz.yml`) runs weekly and on demand with `STRICT=1`, which fails the run if anything new is found. The failures are uploaded as an artifact.
- [x] **Accessibility checks** (`npm run build && npm run test:a11y`, in `e2e/a11y.spec.ts`).
  - **What is scanned:** every page, in light and dark mode, with a sample game loaded (`e2e/fixtures/sample-game.json`). The open parts are scanned too: a player panel, a "Why?" answer, the claim test and the role picker.
  - **How:** axe with the WCAG 2.0–2.2 A and AA rules. Locally it uses the installed Chrome; CI installs Chromium.
  - **Result:** all pages pass. A planted low-contrast element and an image without alt text were both caught.
- [x] **Component tests** (`npm run test:components`, `src/app/**/*.spec.ts`): the `@angular/build:unit-test` builder runs Vitest in jsdom, with the real services. Without Web Workers the solver runs on the main thread, so the tests see real deductions. They cover the Players, Game, Log (with the evidence form, driven through Material's test harnesses), Deduce and claim-test screens, plus the setup counts. Four planted bugs (a wrong move announcement, ignoring "keep the players", showing your hidden seat as a possible Demon, and a stale claim-test answer) were each caught. CI runs them after the unit tests.
