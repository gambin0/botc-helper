# Proposal

## Why

The application currently manages game, player, event, and deduction state using disconnected local mutable arrays in each component, causing critical desynchronization across views (e.g., recorded deaths on the Event Log do not reliably reflect on the Game Setup or Deduction screens, and deleting an event fails to revive dead players). Additionally, the solver fails to reset its internal event list on re-initialization, permanently retaining deleted events, while several core BotC rules and Angular 22 best practices are violated.

## What Changes

- **Reactive State Management**: Refactor `GameStateService` into an Angular Signals-based single source of truth (`script`, `game`, `players`, `events`, `alivePlayers`, `deductions`), removing manual local copies and `ngOnInit` synchronization in feature components.
- **Event-Driven Player Lifecycle**: Unify `death` and `execution` events so both mark players as dead, and dynamically recompute alive status upon event deletion. Synchronize manual player status toggles to record events rather than mutating detached fields.
- **Solver Memory & Game Rules Fixes**:
  - Reset `this.events = []` in `BotcSolver.init()` to eliminate event duplication and allow event deletions to revert deductions.
  - Retain character roles (e.g., Slayer) in player domains upon death, adhering to Blood on the Clocktower rules.
  - Correct surviving world count calculation and handle disjunctive constraint edge cases without reviving contradicted roles.
- **Application Lifecycle & Bootstrap Fixes**:
  - Fix `APP_INITIALIZER` in `app.config.ts` to properly pass injected services rather than calling `inject()` in an asynchronous callback.
  - Enable lazy loading on feature routes in `app.routes.ts` to respect performance budgets.
  - Remove deprecated `standalone: true` declarations, replace constructor injection with `inject()`, replace `any` types with domain models, and delete dead boilerplate files (`app.ts`, `app.html`).

## Capabilities

### New Capabilities
- `game-state`: Reactive state management and event log lifecycle ensuring synchronized player alive status, event handling, and deduction updates across all screens.

### Modified Capabilities
<!-- None: No prior specs existed in openspec/specs/. -->

## Impact

- **Core Services**: `GameStateService`, `BotcSolver`, `DatabaseService`.
- **UI Components**: `GameComponent`, `PlayersComponent`, `LogComponent`, `DeduceComponent`, `ScriptsComponent`.
- **App Configuration & Routing**: `app.config.ts`, `app.routes.ts`, removal of unused `app.ts` and `app.html`.
- **APIs**: `GameStateService` public API transitions from getter methods returning detached arrays to read-only Angular Signals and computed signals.
