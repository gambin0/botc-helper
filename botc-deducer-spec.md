# Blood on the Clocktower Deduction Assistant — Build Specification

## Goal

Build a **mobile-first, offline-first Android app** that helps a Blood on the Clocktower player record in-game evidence and deduce which character assignments remain logically possible.

The app is a **deduction assistant**, not an oracle. It should show:

- Which roles remain possible for each player.
- Which roles are impossible and why.
- Which assumptions are required for a hypothesis to remain valid.
- Which claims conflict with one another.

It must work fully offline after installation. No server, account system, or cloud sync is required for the core app.

## Primary user

A technically capable BotC player using an Android phone during live games. They want fast data entry, clear role-possibility views, and explanations for eliminated possibilities.

## Core principles

1. **Mobile-first:** One-handed use, large tap targets, bottom navigation, bottom sheets for data entry.
2. **Offline-first:** All scripts, games, events, and deductions are stored locally.
3. **Explainable:** Never show only “impossible”; explain the conflicting constraints.
4. **Uncertainty-aware:** The app must preserve multiple hypotheses rather than force a single answer.
5. **Extensible:** Official scripts should work from imported JSON; custom roles should be supported through a rule registry.
6. **Framework-agnostic core:** The solver, role rules, and game model must be pure TypeScript, independent of Angular.

## Recommended technology stack

| Layer | Technology |
|---|---|
| Framework | Angular 17+ with standalone components |
| Language | TypeScript, strict mode |
| UI | Tailwind CSS and custom mobile components |
| Native shell | Capacitor for Android |
| Local database | Capacitor SQLite |
| Solver | Custom TypeScript constraint-propagation engine in a Web Worker |
| Testing | Vitest or Jest for domain/solver tests; Angular Testing Library for UI |
| Script format | Official Blood on the Clocktower script JSON |

Do **not** use a backend for the MVP. Use local storage and file import/export.

## Application architecture

```text
src/
├─ app/
│  ├─ core/
│  │  ├─ models/
│  │  ├─ solver/
│  │  ├─ rules/
│  │  ├─ script/
│  │  └─ storage/
│  ├─ features/
│  │  ├─ game-setup/
│  │  ├─ script-import/
│  │  ├─ night-log/
│  │  ├─ deduction-board/
│  │  └─ explanation/
│  └─ shared/
├─ assets/
│  └─ scripts/
│     └─ trouble-brewing.json
└─ android/
```

### Domain layer

The domain layer must contain no Angular dependencies.

```ts
export type Team = 'townsfolk' | 'outsider' | 'minion' | 'traveller' | 'fabled';

export interface ScriptCharacter {
  id: string;
  name: string;
  team: Team;
  ability: string;
  firstNight?: number;
  otherNight?: number;
  reminders?: string[];
  setup?: boolean;
  jinxes?: unknown[];
}

export interface Player {
  id: string;
  gameId: string;
  name: string;
  seat: number;
  alive: boolean;
  notes?: string;
}

export type ClaimTrust = 'asserted' | 'confirmed' | 'doubted' | 'false';

export interface GameEvent {
  id: string;
  gameId: string;
  night: number;
  phase: 'setup' | 'first-night' | 'day' | 'nomination' | 'execution' | 'other-night';
  actorId?: string;
  kind: string;
  payload: unknown;
  trust: ClaimTrust;
  createdAt: string;
}

export interface RolePossibility {
  playerId: string;
  roleId: string;
  status: 'possible' | 'confirmed' | 'impossible';
  reason?: string;
  requiredAssumptions?: string[];
}
```

## Database schema

Use Capacitor SQLite.

```sql
CREATE TABLE IF NOT EXISTS scripts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source TEXT NOT NULL,
  json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  script_id TEXT NOT NULL,
  player_count INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  name TEXT NOT NULL,
  seat INTEGER NOT NULL,
  alive INTEGER NOT NULL DEFAULT 1,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  night INTEGER NOT NULL,
  phase TEXT NOT NULL,
  actor_id TEXT,
  kind TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  trust TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS role_assertions (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  status TEXT NOT NULL,
  reason TEXT,
  updated_at TEXT NOT NULL
);
```

Store complex event data in `payload_json`. Promote frequently queried fields into real columns only after the data model stabilizes.

## Script import

Support importing official BotC script JSON from:

- Bundled app assets.
- Android file picker.
- Pasted JSON text.

The official script JSON character object includes fields such as `id`, `name`, `team`, `ability`, night order, reminders, setup flags, and jinxes. Validate imported scripts before saving.

Minimum validation:

- Valid JSON.
- Each character has `id`, `name`, `team`, and `ability`.
- No duplicate character IDs.
- Team values are recognized.
- Script contains at least one Demon and appropriate Minions for the selected player count.

## Game-state model

Maintain a set of possible worlds:

```ts
export interface PossibleWorld {
  roleAssignments: Record<string, string | null>;
  alignment: Record<string, 'good' | 'evil' | 'unknown'>;
  drunkOrPoisoned: Set<string>;
  dead: Set<string>;
  oncePerGameUsed: Record<string, boolean>;
  status: 'valid' | 'contradicted';
}
```

The solver should not assume that a claim is true. Instead, preserve branches such as:

- The claimant is truthful.
- The claimant is drunk or poisoned.
- The claimant is evil and lying.
- The claimant is good but mistaken.
- The claimant’s information was altered by another ability.

## Solver design

Use a **constraint-propagation solver with bounded backtracking**.

### Initial domains

For each player, initialize the set of possible roles from the script.

Then apply script-level constraints:

- Correct number of Townsfolk, Outsiders, Minions, and Demons for the player count.
- Exactly one Demon unless a script effect says otherwise.
- Setup abilities may alter Outsider/Minion counts.
- Travellers and Fabled are handled separately from the core assignment.

### Constraint propagation

Each event produces constraints. Apply them repeatedly until no further domains shrink.

Examples:

| Event / claim | Constraint |
|---|---|
| Washerwoman learns “A or B is Role X” | At least one valid world has A or B as Role X, unless Washerwoman is drunk/poisoned |
| Investigator learns “A or B is Minion Y” | Similar disjunction, with Minion-specific validation |
| Chef reports evil pairs | Numeric constraint on adjacent evil players |
| Undertaker learns executed player’s role | Executed player’s role is constrained, subject to ability alteration |
| Player is confirmed dead | Remove that player from future action domains where relevant |
| Player claims a role directly | Create a “claimed role” hypothesis, not a confirmed fact |

### Backtracking

If propagation cannot resolve the game, run bounded backtracking:

1. Select the player with the smallest remaining role domain.
2. Assign a candidate role.
3. Propagate constraints.
4. If contradiction, backtrack.
5. If a complete valid assignment is found, retain it as a surviving world.
6. Stop after a configurable maximum number of worlds or search nodes.

The result should be:

```ts
export interface DeductionResult {
  possibleRoles: RolePossibility[];
  survivingWorldCount: number;
  contradictions: Contradiction[];
  requiredAssumptions: RequiredAssumption[];
}
```

## MVP role rules

Implement these Trouble Brewing roles first:

- Washerwoman
- Librarian
- Investigator
- Chef
- Empath
- Fortune Teller
- Undertaker
- Monk
- Ravenkeeper
- Virgin
- Slayer
- Soldier
- Mayor
- Butler
- Drunk
- Recluse
- Saint
- Baron
- Poisoner
- Spy
- Scarlet Woman
- Imp

Implement the following mechanics explicitly:

- Drunkenness.
- Poisoning.
- Once-per-game abilities.
- Death and execution.
- Role confirmation through public events.
- Demon self-kill and role transfer.
- Spy registering as good.
- Recluse registering as a Minion or Demon.
- Saint causing a loss when executed.
- Baron modifying Outsider count.
- Scarlet Woman becoming the Demon under appropriate conditions.

## User interface

### Bottom navigation

Use five primary tabs:

1. **Game** — current game, script, player count, night/phase.
2. **Players** — player list, alive/dead status, notes, claimed roles.
3. **Log** — chronological evidence and events.
4. **Deduce** — role-possibility matrix and contradictions.
5. **Scripts** — imported scripts and custom role rules.

### Player screen

For each player show:

- Name and seat.
- Alive/dead toggle.
- Claimed role.
- Possible roles.
- Confirmed role, if any.
- Impossible roles with a “Why?” button.
- Notes and related evidence.

### Deduction board

The main screen should be a compact matrix:

- Rows: players.
- Columns: roles in the current script.
- Tap: cycle possible → confirmed → impossible.
- Long-press: open explanation.
- Color coding: neutral, possible, confirmed, impossible, contradictory.

On small screens, allow horizontal scrolling for the role columns while keeping player names fixed.

### Evidence entry

Use bottom sheets with large controls:

- “Add claim”
- “Add death”
- “Add execution”
- “Add nomination”
- “Add night info”
- “Add custom note”

Every entry should record:

- Night number.
- Phase.
- Actor.
- Event type.
- Structured payload.
- Trust level.
- Optional free-text note.

## Explanation UX

For every impossible assignment, show a concise explanation:

> **Alice cannot be the Baron.**  
> If Alice were the Baron, the game would require two Outsiders. The current surviving assignments allow only one Outsider because Bob and Carol are both constrained to Townsfolk roles.

For uncertain conclusions:

> **Alice could still be the Imp if:**  
> - Bob’s claim is false, or  
> - Bob is poisoned, or  
> - The Imp used its self-kill ability and transferred the Demon role.

Never present a deduction as certain unless the user has explicitly marked it confirmed or the solver has proven it across all surviving worlds.

## Custom roles

Create a role-rule registry:

```ts
export interface RoleRule {
  roleId: string;
  triggers: RoleTrigger[];
  constraints: ConstraintDefinition[];
  producesInformation: boolean;
  canBeDrunkOrPoisoned: boolean;
}
```

For custom roles, allow the user to define:

- Team.
- Ability text.
- Trigger: setup, first night, each night, death, nomination, execution.
- Information produced.
- Whether information can be arbitrary.
- Drunk/poisoned behavior.
- Once-per-game limitation.
- Jinxes or special interactions.

Start with template-based custom roles:

- “Learn one of two players is Role X.”
- “Learn a count.”
- “Learn alignment.”
- “Learn role of executed player.”
- “Protected from Demon.”
- “Changes team/count during setup.”
- “Arbitrary information if poisoned.”

## Testing requirements

Write extensive tests for the solver before building advanced UI.

Required tests:

- Valid Trouble Brewing role distribution.
- Washerwoman claim constraints.
- Investigator claim constraints.
- Chef evil-pair constraints.
- Undertaker execution constraints.
- Drunk produces arbitrary information.
- Poisoner invalidates information.
- Spy can register as good.
- Recluse can register as evil.
- Baron changes Outsider count.
- Imp self-kill transfers Demon role.
- Scarlet Woman Demon promotion.
- Saint execution ends the game.
- Custom role template constraints.
- Contradiction detection and explanation generation.

Example test:

```ts
it('marks the Baron impossible when only one Outsider assignment remains', () => {
  const result = solver.solve({
    script: troubleBrewing,
    players: fivePlayers,
    events: [
      claimEvent('alice', 'washerwoman', {
        candidates: ['bob', 'carol'],
        roleId: 'chef'
      }),
      deathEvent('dave'),
      executionEvent('eve', 'saint')
    ]
  });

  expect(result.possibleRoles).toContainEqual(
    expect.objectContaining({
      playerId: 'alice',
      roleId: 'baron',
      status: 'impossible'
    })
  );
});
```

## Android / Capacitor setup

Use Capacitor to wrap the Angular build.

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android
npx cap init "BOTC Deducer" "com.charlesu.botcdeducer" --web-dir=dist/botc-deducer
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

Development workflow:

```bash
ng serve                 # browser debugging
npm run build            # production web build
npx cap sync android     # copy web assets and update plugins
npx cap open android     # open Android Studio
```

Use Android Studio for emulator/device deployment and native logging. Use Chrome DevTools for Angular and solver debugging.

## Offline behavior

- Bundle Trouble Brewing in app assets.
- Store imported scripts in SQLite.
- Store all game events locally.
- Export/import full game state as JSON.
- Do not require network access after installation.
- Make all solver work happen locally in a Web Worker.

## Build order

Implement in this order:

1. Angular + Capacitor Android skeleton.
2. SQLite storage service.
3. Script JSON import and validation.
4. Game creation and player management.
5. Event logging.
6. Manual role-possibility matrix.
7. Solver domain model and constraint engine.
8. Trouble Brewing role rules.
9. Automatic deduction and contradiction detection.
10. Explanation UI.
11. Custom-role rule templates.
12. Export/import and backup.

## Non-goals for MVP

Do not build:

- Online multiplayer.
- Cloud sync.
- User accounts.
- Storyteller grimoire management.
- Full automation of every published role.
- AI-generated role interpretations.
- Push notifications.
- Server-side game state.

## Success criteria

The MVP is successful when a user can:

1. Import or select Trouble Brewing.
2. Create a 5–15 player game.
3. Add claims, deaths, nominations, and executions during play.
4. See which roles remain possible for each player.
5. Tap any impossible role and understand why it is impossible.
6. Use the app entirely offline on Android.
7. Save and reopen a game without data loss.
