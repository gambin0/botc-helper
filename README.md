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
- Create games with 5-15 players
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

## License

MIT
