# Spec Delta

## Purpose

Gives independent evidence that the deduction engine returns exactly the role possibilities the game rules allow, by comparing it with a brute-force reference on small games and by checking it never rules out a known true grimoire.

## ADDED Requirements

### Requirement: Reference solver lists possibilities exhaustively
The project SHALL include a reference solver that takes the same input as the engine and, by checking every legal starting grimoire, reports whether any grimoire fits all the evidence and, for each player, the exact set of roles they hold in at least one fitting grimoire.

#### Scenario: Unconstrained small game
- **WHEN** the reference solver is given 5 players, a Trouble Brewing pool and no events
- **THEN** it reports the game as consistent and every seated role in the pool as possible for every player

#### Scenario: Certain self role
- **WHEN** player 1 is certain they are the Empath and there are no other events
- **THEN** the reference solver reports Empath as player 1's only possible role and Empath as impossible for every other player

#### Scenario: Contradictory evidence
- **WHEN** two different players are both confirmed as the Imp
- **THEN** the reference solver reports the game as inconsistent

### Requirement: Reference solver follows the documented rules
The reference solver SHALL decide whether a grimoire fits the evidence using the world semantics written in this change's design, and SHALL reuse the project's per-role rule data and info checks rather than the engine's search code.

#### Scenario: Agreement with existing hand-written engine tests
- **WHEN** the reference solver is run on each existing engine test case whose game has 7 or fewer players and is small enough to enumerate
- **THEN** it produces the same expected outcome that test asserts for the engine

### Requirement: Differential check against the engine
The test suite SHALL generate random small games from a fixed seed and, for each one where the engine's search finished, check that the engine and the reference solver agree on consistency and, when consistent, on every player's set of possible roles.

#### Scenario: Engine and reference agree
- **WHEN** the differential test runs on its default set of generated games
- **THEN** every game where the engine did not report an incomplete search has matching results, or its disagreement is recorded as described below

#### Scenario: Incomplete engine search
- **WHEN** the engine reports that its search budget ran out for a generated game
- **THEN** that game is skipped and counted as skipped rather than treated as a disagreement

### Requirement: Generated-truth check
The test suite SHALL pick random legal grimoires, generate evidence that the rules allow for each one, and check that the engine reports each player's true starting role as possible.

#### Scenario: True grimoire is never ruled out
- **WHEN** the engine is given evidence generated from a known true grimoire
- **THEN** the engine reports the game as consistent and every player's true role as possible

### Requirement: Disagreements are recorded, not fixed
Any disagreement the checks find SHALL be reduced to a small reproducible case and kept as a named regression test marked as an expected failure, with an entry in a findings file. The engine's code SHALL NOT be changed by this work.

#### Scenario: Disagreement found
- **WHEN** the differential or generated-truth check finds a game where the engine is wrong or the reference disagrees
- **THEN** a minimized version of that game exists as an expected-failure test, the findings file describes it, and the default test run still passes

### Requirement: Checks are reproducible and bounded
The checks SHALL be deterministic for a given seed, SHALL report the seed and game index of any failure, SHALL keep the default test run's added time under 60 seconds, and SHALL allow more generated games to be run through an environment variable.

#### Scenario: Re-running a reported failure
- **WHEN** a developer reruns the checks with the seed and index printed for a failure
- **THEN** the same game is generated and the same failure is reproduced

#### Scenario: Longer local fuzzing run
- **WHEN** the developer sets the documented environment variable to a larger game count
- **THEN** the checks run that many generated games
