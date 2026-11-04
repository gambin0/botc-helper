# Spec Delta

## Purpose

Provides a unified reactive state store that synchronizes game creation, player records, in-game events, and deduction solver results across all application views in real time.

## ADDED Requirements

### Requirement: Synchronized Game Creation and Setup
The system SHALL provide a centralized reactive state store where creating a new game immediately initializes player slots and notifies all dependent screens without manual page refreshes.

#### Scenario: New game creation updates all screens
- **WHEN** the user creates a game with N players
- **THEN** the active game state and player list are immediately available to the Game overview, Players list, Event Log, and Deduction Board views

### Requirement: Event-Driven Player Death and Execution
The system SHALL mark a player as dead whenever a death event or an execution event targeting that player is recorded in the event log.

#### Scenario: Recording a player death
- **WHEN** a death event is recorded for a player
- **THEN** that player's status is updated to dead across the Players list, Game overview, and Deduction views

#### Scenario: Recording a player execution
- **WHEN** an execution event is recorded for a player
- **THEN** that player's status is updated to dead across the Players list, Game overview, and Deduction views

### Requirement: Reversion of Player Status on Event Deletion
The system SHALL recompute player alive status from the remaining events whenever an event is removed, restoring dead players to alive if no active death or execution events remain for them.

#### Scenario: Deleting the sole death event for a player
- **WHEN** the user deletes the only recorded death or execution event for a player
- **THEN** the player's status immediately reverts to alive across all screens

### Requirement: Deduction Solver Synchronization on Event Mutation
The system SHALL maintain solver state consistency such that adding, modifying, or deleting events causes the deduction solver to recompute role possibilities against the current event history without retaining deleted events.

#### Scenario: Deleting an event that caused a deduction
- **WHEN** an event that eliminated a role possibility is deleted
- **THEN** the deduction board immediately updates and re-evaluates the role possibility as available if not contradicted by remaining events

### Requirement: Preservation of Role Identity Upon Death
The deduction solver SHALL NOT eliminate character roles (such as the Slayer) from a player's candidate possibilities purely because that player has died.

#### Scenario: Dead player possibility evaluation
- **WHEN** a player dies in the event log
- **THEN** their candidate roles are not eliminated simply due to being deceased
