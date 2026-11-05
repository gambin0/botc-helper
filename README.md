# Blood on the Clocktower Deduction Assistant

A mobile-first, offline-first Android app that helps Blood on the Clocktower players record in-game evidence and deduce which character assignments remain logically possible.

## Tech Stack

- **Framework:** Angular 22 with standalone components
- **Language:** TypeScript (strict mode)
- **Native Shell:** Capacitor for Android
- **Local Database:** SQLite (via @capacitor-community/sqlite)
- **Solver:** Custom TypeScript constraint-propagation engine

## Features

- Import and manage official BotC scripts (JSON format)
- Create games with 5-15 players, keeping the last game's players and seats if you like
- Remembers the names of people you play with (on this device) and suggests them when you name a seat
- Rearrange seats by dragging or with Move up/down buttons, until the first log entry
- Record in-game events (claims, deaths, executions, nominations)
- Constraint-based deduction engine
- Role possibility matrix with explanations
- Offline-first architecture

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Android Studio (for Android builds)

### Installation

```bash
npm install
```

### Development

```bash
# Run in browser
ng serve

# Build for Android
npm run build
npx cap sync android
npx cap open android
```

## Architecture

```
src/
├── app/
│   ├── core/
│   │   ├── models/       # TypeScript interfaces
│   │   ├── solver/       # Constraint propagation engine
│   │   ├── rules/        # Role-specific rules
│   │   ├── script/       # Script import/validation
│   │   ├── services/     # Game state management
│   │   └── storage/      # SQLite database service
│   ├── features/
│   │   ├── game-setup/   # Game creation and player management
│   │   ├── script-import/ # Script import UI
│   │   ├── night-log/    # Event logging
│   │   ├── deduction-board/ # Role possibility matrix
│   │   └── explanation/  # Deduction explanations
│   └── shared/           # Shared UI components
└── assets/
    └── scripts/          # Bundled script JSON files
```

## Scripts and Roles

The app includes all 181 official Blood on the Clocktower roles across 6 editions:
- Carousel (71 roles)
- Trouble Brewing (27 roles)
- Secrets in the Village (30 roles)
- Beyond the Moonrise (30 roles)
- Fabled (12 roles)
- Loric (11 roles)

Role data is sourced from the official [BotC Release repository](https://github.com/ThePandemoniumInstitute/botc-release) and converted to TypeScript at build time.

The app supports importing official BotC script JSON files. The bundled "Trouble Brewing" script is included in `src/assets/scripts/`.

## Checking the deduction engine

`src/app/core/solver/reference/` holds a brute-force **reference solver** that lists every starting grimoire for small games (5–7 players, at most 10 seatable roles). It shares the rule data with the engine but none of its search code. Two checks run as part of `npm test`:

- **Differential:** on random games, the engine and the reference must agree on whether the evidence is consistent, on every player's possible roles, and on who could be the Demon now.
- **Generated truth:** for games generated from a known grimoire, the engine must never rule out a player's true role.

For longer runs, use the fuzz command. It writes each failure, already minimized, to a JSON file:

```bash
npm run fuzz -- run --seed 5 --games 1000 --profile vortox   # profiles: npm run fuzz -- profiles
npm run fuzz -- show fuzz-runs/vortox-5/failures/diff-5-12.json
REF_SOLVER_GAMES=2000 npx vitest run src/app/core/solver/reference   # bigger npm-test checks
```

To run every profile, use `bash scripts/fuzz-campaign.sh`. It filters out failures already explained by a recorded engine bug, so only new ones are written. Disagreements are recorded in `src/app/core/solver/reference/FINDINGS.md`, each with an expected-failure test in `regressions.test.ts`. `CAMPAIGN.md` in the same folder explains the campaign and how to triage new failures. The semantics the reference follows are written out in `openspec/changes/archive/2026-11-04-add-reference-solver/design.md`, and the Demon changing seats in `src/app/core/rules/timeline.ts` and the `timelines` comment in `reference-solver.ts`. `docs/engine-review.md` tracks known gaps and open work.

## Checks and CI

```bash
npm test                                  # unit tests, including engine vs reference
npm run test:components                   # Angular component tests (src/app/**/*.spec.ts, jsdom)
npm run typecheck:test                    # plus: npx tsc --noEmit -p tsconfig.app.json (and tsconfig.worker.json, tsconfig.component.json)
npm run build && npm run test:a11y        # axe / WCAG AA scan of every page, light and dark
npm run bench:solver                      # solver timings for 10–15 player games
npx tsx scripts/puzzle-check.ts           # community logic puzzles: is each solution still possible?
```

`npm test` also runs the puzzle check, so CI does too. GitHub Actions runs all of these except the bench on every push and pull request (`.github/workflows/ci.yml`). The fuzz campaign runs weekly and on demand (`fuzz.yml`). Locally, the accessibility scan uses your installed Google Chrome; in CI it installs Chromium.

## License

MIT

The logic puzzles in `src/app/core/solver/puzzles/data/` come from [jthemphill/botc-solvers](https://github.com/jthemphill/botc-solvers) (MIT, © 2024 Jeff Hemphill); see the `LICENSE` and `README.md` there.
