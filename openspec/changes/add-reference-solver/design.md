# Design

## Context

See proposal.md for why. The engine (`src/app/core/solver/solver.ts`, class `DeductionEngine`, wrapper `solve()`) searches for starting grimoires with backtracking, partial-world pruning, interchangeable-seat symmetry breaking and node budgets. It returns a `DeductionResult` (`src/app/core/models/game.ts`): `consistent`, `possibleRoles` (one entry per player and role, with `status` `'possible' | 'confirmed' | 'impossible'`), `ignoredEvidence` and `incomplete`.

The rules the engine relies on live outside it and are shared on purpose:
- `src/app/core/rules/role-rules.ts`: `getRoleRule`, `registrationsFor`, `possibleTrueRolesForBelief`, `teamAlignment`, `normalizeRoleId`, `SEAT_TEAMS`.
- `src/app/core/rules/info-specs.ts`: `getInfoSpec(roleId)` returns an `InfoSpec` with `check(payload, sourceId, view)`, `publicWhen?(payload)` and `fields`.
- `src/app/core/rules/setup.ts`: `baseComposition(playerCount)`.
- `src/app/core/rules/events.ts`: `claimRole`, `targetPlayer`, `executionEndedGame`, `infoPayload`.
- `src/app/core/roles/role-registry.ts`: `RoleRegistry.get(id)` and `RoleRegistry.toScriptCharacters(ids)`.

Existing tests in `src/app/core/solver/solver.test.ts` show how inputs are built (helpers `players`, `ev`, `claim`, `info`, `death`, `execution`, `me`). Tests run with `npm test` (Vitest, node environment, files matching `src/**/*.test.ts`).

## Goals / Non-Goals

**Goals:**
- A reference solver that is obviously correct by reading it: plain loops, no pruning beyond the role counts, no cleverness.
- Shared rule data and info checks, so the comparison tests the engine's search and bookkeeping.
- Reproducible random games, small enough to enumerate in milliseconds to a few hundred milliseconds each.

**Non-Goals:**
- Changing `solver.ts` or any other production file. If the engine is wrong, record it (see Decision 7).
- Checking that the rule data itself matches the official game rules. Both solvers share it, so a wrong rule in `role-rules.ts` or `info-specs.ts` would not be caught by the differential test. The generated-truth test catches some of these.
- Explanations (`explain()`), `confirmed` status, warnings, alignments, and which evidence the engine ignores after a contradiction. Compare only `consistent` and the possible-role sets.
- Games over 7 players.

## Decisions

### 1. File layout

All new code goes in `src/app/core/solver/reference/`:
- `reference-solver.ts`: `referenceSolve(input: SolverInput): ReferenceResult` where `ReferenceResult = { consistent: boolean; possible: Map<string, Set<string>> }` (player ID → role IDs). Also export `worldFits(input, world): boolean` and `enumerateWorlds(input): Generator<string[]>` (role ID per seat, in seat order), since the generated-truth test needs them.
- `game-generator.ts`: seeded random game generation (Decision 5).
- `reference-solver.test.ts`: fixed, hand-written cases for the reference solver itself.
- `differential.test.ts`, `generated-truth.test.ts`: the two checks.
- `regressions.test.ts`: minimized disagreements as expected failures.
- `FINDINGS.md`: one entry per disagreement.

Do not import anything from `solver.ts` into `reference-solver.ts` except the `SolverInput` and `SelfKnowledge` types. Write the reference from this document. Do not copy logic from `solver.ts`; it is fine to read it to understand an input format.

### 2. Enumeration: valid role lists first, then seatings

Rather than trying every role for every seat, enumerate in two steps:
1. **Role lists.** Every multiset of seated roles from the pool that satisfies the setup rules (Decision 3). Each role can appear at most `maxCopies` times.
2. **Seatings.** Every distinct ordering of that multiset across the seats. Skip duplicate orderings when a role appears more than once.

Then test each seating with `worldFits` (Decision 4). A player's role is possible if it appears in their seat in at least one fitting seating. `consistent` is true if at least one seating fits.

Keep generated games small enough that this stays fast: at most 7 players and at most 10 seated roles in the pool. Add a guard that throws if a single input would enumerate more than 2,000,000 seatings, so a bad generator setting fails loudly instead of hanging.

**Alternative considered:** reuse the engine with pruning disabled. Rejected, because then both sides share the search code we want to test.

### 3. Setup rules (which role lists are legal)

Let `n` be the player count and `[T, O, M, D] = baseComposition(n)`. Build the role pool from `input.characters`:
- Normalize IDs with `normalizeRoleId`. Ignore duplicates.
- A role's team is `RoleRegistry.get(id)?.team ?? character.team`.
- Each character's `getRoleRule(id).gameWideFalseInfo` adds to the game's **Fibbin allowance**, even when the character is not a seated role.
- Only roles whose team is in `SEAT_TEAMS` can be seated. Roles with `rule.unseated` (Lil' Monsta) are never seated.
- `maxCopies = max(1, character.maxCopies ?? rule.maxCopies ?? 1)`.

A role list is legal when all of the following hold:
- It has exactly `n` roles.
- **Outsider count.** Start with the set `{O}`. For each role in the list with `rule.setup`: if `anyOutsiderCount`, the set becomes `{0, 1, …, n}`; otherwise, if `outsiderDelta` is set, the set becomes `{ max(0, x + d) : x in set, d in outsiderDelta }`. The list's Outsider count must be in the final set. Apply the modifiers one after another; the order does not matter for the current data.
- **Minion count.** `minMinions = M + sum of rule.setup.minionDelta over roles in the list`.
- **Demon count.** Normally the list has exactly `D` Demons (always 1) and exactly `minMinions` Minions. **Lil' Monsta exception:** if a role with `rule.unseated` and team `demon` is in the pool, a list may instead have 0 Demons and exactly `minMinions + 1` Minions.
- The Townsfolk count is whatever remains. There is no separate Townsfolk target.
- **Required roles.** For each role in the list with `rule.setup.requiresInPlay`, every required role is also in the list.

### 4. When a seating fits the evidence (`worldFits`)

A seating assigns one role ID to each seat, in seat order (players sorted by `seat`). The evidence is the self-knowledge plus the event log, read in order.

**4a. Self-knowledge** (`input.self`, if its player is seated and the believed role has a known team):
- If `certain`, the player's role is exactly the believed role.
- Otherwise the player's role is in `possibleTrueRolesForBelief(believed, believedTeam)`. **Drunk rule:** if the player is the Drunk, the believed role must not be held by any seat.
- If the believed role is not in the pool, the self-knowledge is still applied. The engine then reports a contradiction and sets it aside. That case is out of scope for comparison, so the generator never produces it.

**4b. Events.** Walk the events in order, keeping an `alive` flag per seat (all start alive):
- `death`: the target becomes dead. `resurrection`: the target becomes alive.
- `claim` with role `R` and a known team (`claimRole(event)`):
  - `confirmed`: the actor's role is `R`.
  - `false`: the actor's role is not `R`.
  - `asserted`, when `options.assumeGoodPlayersHonest` is not `false`: the actor is evil, or their role is in `possibleTrueRolesForBelief(R, teamOf(R))`. The same Drunk rule as 4a applies: if the actor is the Drunk, no seat holds `R`.
  - `doubted`, or `asserted` with honesty turned off: no constraint.
- `execution` of target `t`: let `aliveBefore` be the number of living players just before. Then `t` becomes dead.
  - If `executionEndedGame(event)`: if `aliveBefore - 1 <= 2`, no constraint. Otherwise `t` is a Demon, or the Saint, or (only if a seat-less Demon such as Lil' Monsta is in the pool) a Minion.
  - Otherwise (the game continued):
    - **Demon survived.** If `t` holds a Demon role, then either some *other* seat holds the Scarlet Woman and `aliveBefore >= 5`, or some seat holds the Mastermind.
    - **Saint survived.** If `t` holds the Saint, this execution counts as a **false-info event** for seat `t` on `event.night` (see 4d). The Vortox does not affect it.
- `info`: let `payload = infoPayload(event)` and `spec = getInfoSpec(payload.type)`. Skip the event if either is missing, the actor is not seated, or any player ID in `payload.players` / `payload.player` is not seated. Take a snapshot of `alive` now; the check uses it.
- `note` and anything else: ignored.

**4c. Judging one info event.** Let `src` be the actor's seat and `genuine = (role of src === spec.roleId)`. Let `isPublic = spec.publicWhen?.(payload) ?? false`.
- Not genuine: if `isPublic`, the seating does **not** fit. Otherwise the event places no constraint.
- Genuine: work out whether the info **can be true** and whether it **can be false** in this seating (4e).
  - If `isPublic`: it must be able to be true, otherwise the seating does not fit. Poisoning cannot explain it.
  - Otherwise let `vortoxApplies = (teamOf(spec.roleId) === 'townsfolk' && !spec.publicWhen)`. If `vortoxApplies` and some seat holds a role with `rule.falsifiesTownsfolkInfo`, the info is *expected false*; otherwise it is *expected true*.
  - If the expected value is reachable, the event is fine. If not, it is a **false-info event** for `src` on `event.night`, which must be explained by drunkenness or poisoning (4d).

**4d. Budget for false info.** Collect the false-info events from 4b and 4c. Then:
- **Village Idiot exception.** If the role at `src` has `rule.extraCopiesDrunk` and at least 2 seats hold that role, one of those copies is the drunk one for the whole game, and that seat's false-info events cost nothing. Try **each** copy as the drunk one and accept the seating if any choice works. The engine always picks the first copy; see Risks.
- `cap` = sum of `rule.corruptionCapacity` over the **distinct** roles held by at least one seat. A role held by two seats still adds its capacity once. No corrupting role currently allows more than one copy.
- For each night, count the **distinct** seats with a false-info event that night. `excess` = sum over nights of `max(0, count - cap)`.
- The budget is respected when `excess <= fibbinAllowance` (Decision 3).

The seating fits if every constraint in 4a–4b holds, no info event made it unfit in 4c, and the budget in 4d is respected, for at least one choice of the hidden facts in 4f.

**4e. Can the info be true / false?** Call `spec.check(payload, actorId, view)` under every combination of how each player registers. Build `view` (an `InfoView`) from the snapshot and the current choices:
- `seats`: player IDs in seat order. `isAlive(id)`: from the snapshot taken at this event.
- Each seat has a list of possible **registrations**: `registrationsFor(roleId, team)`. **Lil' Monsta:** if the seating has no Demon (possible only with Lil' Monsta in the pool), every Minion also has the extra registration `{ alignment: 'evil', team: 'demon', roleId: 'lilmonsta' }`.
- Registrations are chosen **separately for each info event**. A Spy can look good to one ability and evil to another.
- `alignment(id)`: the chosen registration's alignment, except that the **Faux Paw** seat (4f) is always `'evil'`.
- `team(id)`: the chosen registration's team.
- `registersAsRole(id, roleId)`: if the registration's `roleId` is `'*'`, true when `roleId` belongs to the registration's team (team from the pool, falling back to `RoleRegistry`); otherwise true when the IDs match after `normalizeRoleId`.
- `isRedHerring(id)`: true for the red herring seat (4f).

The info **can be true** if `check` returns true for at least one combination, and **can be false** if it returns false for at least one. To keep it simple, try every combination over **all** seats with more than one registration. With 7 seats this is small.

**4f. Hidden facts chosen once per seating:**
- **Red herring:** if any genuine info event comes from a role with `rule.hasRedHerring` (the Fortune Teller), try "no red herring" and each seat holding a good-alignment role (`teamAlignment` of the seat's real team). The same red herring applies to every event.
- **Faux Paw:** if a seat holds a role with `rule.grantsFauxPaw` (the Lycanthrope), try "none" and each seat holding a good role. The same Faux Paw applies to every event.

The seating fits if **some** red herring choice and **some** Faux Paw choice make 4a–4d hold.

### 5. Random game generator

`generateGame(seed: number, index: number): SolverInput`. Use a small seeded PRNG, either a copy of the engine's `mulberry32` or your own, seeded from `seed` and `index`, so the same pair always gives the same game. Never call `Math.random`.

- **Player count:** 5–7.
- **Role pool:** choose roles from the list below so that each team has at least the base count for that player count, plus 1–3 extra roles. The pool must hold at most 10 seated roles. Include Fibbin (a non-seated Fabled character) in about 10% of games.
  - Townsfolk: washerwoman, librarian, investigator, chef, empath, fortuneteller, undertaker, ravenkeeper, virgin, slayer, steward, noble, knight, seamstress, shugenja, villageidiot, balloonist, grandmother, sage, dreamer, lycanthrope.
  - Outsiders: drunk, recluse, saint, butler, mutant.
  - Minions: poisoner, spy, scarletwoman, baron, godfather, widow, mastermind.
  - Demons: imp, nodashii, vortox. Add lilmonsta in about 10% of games, and only alongside at least one of these, so the pool always has a seatable Demon.
  - Fabled (not seated): fibbin.

  All of these IDs were checked in `RoleRegistry` when this change was written, and each has the team listed above.
- **Self-knowledge:** in about 60% of games, a random player believes a random pool role. Use `certain` 50/50.
- **Events:** 0–8 events across nights 1–3, chosen randomly from:
  - claims, with trust `asserted` 70%, `confirmed` 10%, `doubted` 10%, `false` 10%;
  - info events: pick a role that has an `InfoSpec`, a random actor, and a random payload built from `spec.fields`:
    - `players`: `count` distinct players;
    - `player`: one player;
    - `role`: a pool role, limited to `teams` if set;
    - `number`: between `min` and `max`, capped at `n`;
    - `boolean`: random.
  - deaths;
  - executions of living players, with `gameEnded` set 15% of the time.
- In about 30% of games, set `options.assumeGoodPlayersHonest` to `false`.

Random games are often inconsistent. That is fine: consistency is compared too.

### 6. The two checks

- **Differential** (`differential.test.ts`): for `index` from 0 to `N - 1` with a fixed seed, generate a game, run `solve()` and `referenceSolve()`.
  - If `engine.incomplete`, count the game as skipped.
  - Otherwise require `engine.consistent === ref.consistent`.
  - When both are consistent, require that each player's set of engine roles with status other than `'impossible'` equals `ref.possible.get(player)`.
  - When the reference says the game is inconsistent, only the `consistent` flag is compared. The engine's recovery after a contradiction is out of scope.
  - On failure, print the seed, the index, and the game as JSON.
- **Generated truth** (`generated-truth.test.ts`): for each index, pick a random legal role list (Decision 3) and a random seating, then build evidence from it:
  - claims that the rules allow: good players claim their own role; the Drunk claims a Townsfolk not in play; evil players claim a good role;
  - info events from genuine info roles, using payloads where `check` can be true under some registration;
  - a few deaths.

  Assert that `worldFits` returns true for the chosen seating; this sanity-checks the generator. Then assert that the engine says the game is consistent and lists every player's true role as possible.
- `N` defaults to a value that keeps both files together under 60 seconds on this machine (start around 300 each and adjust). It is overridden by the environment variable `REF_SOLVER_GAMES`. Give each test an explicit Vitest timeout.

### 7. Recording disagreements

When a check fails, do **not** change `solver.ts` or the rule files. Instead:
1. **Minimize the game:** repeatedly remove one event, the self-knowledge, or one unused pool role, keeping each removal if the disagreement still happens.
2. Decide which side is wrong by reasoning from this document. If it is the reference, fix the reference. If it is the engine, add the minimized case to `regressions.test.ts` as `it.fails('<short description>', …)`. The test asserts the correct answer, so it fails today and turns green once the engine is fixed.
3. Add an entry to `FINDINGS.md`. Include:
   - the seed and index;
   - the minimized input;
   - what the engine says and what the reference says;
   - which rule in this document applies, and your reasoning about which side is wrong.
4. Skip that seed and index in the random loop by listing it in a `KNOWN_DISAGREEMENTS` set, so the default run passes.

## Risks / Trade-offs

- **The reference is wrong in the same way as the engine** because both follow the same reading of the rules. → Mitigation: the generated-truth test checks against a known grimoire. Section 4 is written out in full so a reviewer can check it against the official rules.
- **The engine always picks the first Village Idiot copy as the drunk one** in its final check (Decision 4d). → Expect a possible disagreement in games with 2+ Village Idiots. Treat it like any other finding (Decision 7).
- **Lil' Monsta, the Mastermind and the Scarlet Woman** have very specific rules in Section 4. The order of the conditions there matches the engine's intended behaviour. → If a difference shows up in these cases, record it; do not guess.
- **Enumeration is too slow** for some generated pools. → Guarded by the seating limit in Decision 2. Lower the pool size before raising any limit.
- **Flaky timing** on slower machines. → Generous per-test timeouts, and `N` can be changed with the environment variable.
