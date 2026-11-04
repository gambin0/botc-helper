# Tasks

## 1. Solver and Bootstrap Corrections

- [x] 1.1 Reset `events` array in `BotcSolver.init()` and correct role elimination on death so dead players retain their role identities. Verify by running constraint solver tests.
- [x] 1.2 Fix `APP_INITIALIZER` in `src/app/app.config.ts` by passing injected dependencies as factory arguments to prevent runtime context errors. Verify application bootstraps cleanly.

## 2. Signal-Based Game State Store

- [x] 2.1 Refactor `GameStateService` to expose Angular Signals (`script`, `game`, `players`, `events`, `alivePlayers`, `deductions`) and eliminate internal version hacks. Verify state updates trigger reactive signal changes.
- [x] 2.2 Unify death and execution event processing in `GameStateService` so both mark players as dead, and ensure `removeEvent()` re-derives alive status across all players. Verify removing death events restores player alive status.
- [x] 2.3 Wire manual player alive toggles to log corresponding death/resurrection events in the event history. Verify event log records toggles.

## 3. Screen Modernization and Template Binding

- [x] 3.1 Update `src/app/features/game-setup/game.component.ts` to bind directly to store signals, remove constructor effects, use `@if`, and use `inject()`. Verify game creation updates player counts immediately.
- [x] 3.2 Update `src/app/features/game-setup/players.component.ts` to read directly from `players()` signal without local array caching, using `@for`/`@if`. Verify dead player status updates in real time.
- [x] 3.3 Update `src/app/features/night-log/log.component.ts` to bind directly to `events()` and `players()` signals, and handle execution events. Verify adding and deleting events updates all screens.
- [x] 3.4 Update `src/app/features/deduction-board/deduce.component.ts` to consume `deductions()` and `players()` signals directly without manual effect caching. Verify deduction matrix updates upon event addition and removal.
- [x] 3.5 Update `src/app/features/script-import/scripts.component.ts` to bind to `script()` signal and replace constructor injection with `inject()`. Verify script import status updates reactively.

## 4. Routing, Cleanups, and Verification

- [x] 4.1 Configure lazy loading for feature routes in `src/app/app.routes.ts` (`loadComponent`) to respect bundle budgets. Verify `npm run build` succeeds without bundle size warnings.
- [x] 4.2 Remove obsolete boilerplate files (`src/app/app.ts`, `src/app/app.html`) and remove `standalone: true` declarations across components per `AGENTS.md`. Verify clean build and strict typing.
