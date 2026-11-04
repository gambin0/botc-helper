# Design

## Context

See `proposal.md` for problem context and motivation.
The application is built on Angular 22, Capacitor for Android, and a TypeScript constraint solver. The codebase currently suffers from state divergence across views due to local component array duplication, solver event retention bugs, and lifecycle bootstrap errors.

## Goals / Non-Goals

**Goals:**
- Unify application state inside `GameStateService` using Angular Signals (`signal`, `computed`).
- Ensure all views react synchronously to game creation, event logging, and event deletion.
- Fix event retention in `BotcSolver` and align deduction rules with Blood on the Clocktower mechanics.
- Comply with Angular 22 and project standards defined in `AGENTS.md` (no `standalone: true`, `inject()` usage, `@if`/`@for`, lazy routes).

**Non-Goals:**
- Rewriting the constraint solver engine into a Web Worker (deferred to a dedicated performance change).
- Adding complex role mechanics beyond Trouble Brewing (e.g., custom jinxes, Vortox, Legion).
- Reworking database storage layer beyond local state serialization.

## Decisions

### 1. Angular Signals for Global Store (`GameStateService`)
- **Decision**: Represent all core state as read-only signals on `GameStateService`:
  ```typescript
  readonly script = signal<Script | null>(null);
  readonly game = signal<Game | null>(null);
  readonly players = signal<readonly Player[]>([]);
  readonly events = signal<readonly GameEvent[]>([]);
  readonly alivePlayers = computed(() => this.players().filter(p => p.alive));
  readonly deductions = computed(() => this.computeDeductions());
  ```
- **Rationale**: Components bind directly to these signals in templates. No manual `this.players = ...` copying or constructor `effect()` hacks are needed. Updates to `events` or `players` instantly trigger re-renders in all active routes.
- **Alternatives Considered**:
  - *RxJS BehaviorSubjects*: Adds unnecessary subscription boilerplate and manual unsubscription overhead when Angular 22 has first-class Signals.
  - *NgRx / ComponentStore*: Overhead is too high for an offline mobile app; standard Angular Signals provide sufficient reactivity without boilerplate.

### 2. Event-Driven Player Lifecycle
- **Decision**: Player alive status is computed from the event history.
  - An event of kind `death` or `execution` marks the target player dead.
  - If a player's alive state is toggled from the Players screen, the service logs a corresponding event rather than mutating a disconnected field.
  - When an event is removed via `removeEvent()`, player alive status is automatically recalculated from the remaining events, reviving players if no death/execution events remain.
- **Rationale**: Single source of truth. The event log is the historical record of the game; player status is a projection of that history.
- **Alternatives Considered**:
  - *Separate mutable alive boolean on Player*: Led to the current desynchronization bugs where event deletion and manual toggles overwrote each other.

### 3. Solver Event Clearing and Rule Corrections
- **Decision**:
  - `BotcSolver.init()` must explicitly reset `this.events = []`.
  - In `applyDeathConstraint()`, do NOT remove character roles like Slayer from possible roles upon death. In BotC, a player who dies retains their character identity.
  - Update `countSurvivingWorlds()` to calculate combinations or display a realistic metric rather than merely the count of players with non-empty domains.
- **Rationale**: Eliminates the permanent event leak where deleted events remained active in the solver.

### 4. Dependency Injection & Bootstrap Correction
- **Decision**:
  - Fix `appConfig` in `app.config.ts`:
    ```typescript
    export function initApp(db: DatabaseService, gameState: GameStateService) {
      return async () => {
        await db.init();
        await gameState.loadCurrentGame();
      };
    }
    ```
    Pass dependencies via `deps: [DatabaseService, GameStateService]` into `initApp` parameters.
  - Switch all components to `inject(GameStateService)` and `inject(MatDialog)`.
  - Convert route configurations in `app.routes.ts` to `loadComponent: () => import(...)`.

## Risks / Trade-offs

- **[Risk]** Synchronous solver execution in `computed()` could cause UI lag with large event counts.
  → **Mitigation**: Trouble Brewing has at most 15 players and small constraint domains. Re-solving takes <5ms. Web Worker offloading is scoped for a future change if custom scripts demand it.
- **[Risk]** Deleting an execution event could affect revealed role constraints.
  → **Mitigation**: Solver rebuilds its state strictly from the surviving event array on every mutation, cleanly dropping constraints tied to removed execution events.
