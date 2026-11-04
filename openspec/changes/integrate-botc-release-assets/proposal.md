# Proposal

## Why

The app currently lacks character images, script validation against official compatibility rules (jinxes), and robust custom script import validation. The official BotC Release repository (https://github.com/ThePandemoniumInstitute/botc-release) provides these assets and data, which would significantly enhance the user experience and app robustness.

## What Changes

- **Character Images**: Download and bundle official character images (WebP format) from the botc-release repo, organized by edition. Display character icons in the game setup, player management, and deduction board screens.
- **Jinxes Data Integration**: Import the official jinxes.json data and use it for script validation to detect incompatible character combinations when creating or importing scripts.
- **Script Schema Validation**: Use the official script-schema.json to validate custom script imports, providing clear error messages when scripts are malformed.
- **WC25 Championship Scripts**: Bundle the 14 World Championship 2025 scripts as additional official scripts available in the app.

## Capabilities

### New Capabilities
- `character-assets`: Character image display and management across all game screens.
- `script-validation`: Script validation using official jinxes data and JSON schema for custom imports.

### Modified Capabilities
<!-- None: No prior specs existed in openspec/specs/. -->

## Impact

- **Assets**: New character image assets (~500 WebP files) bundled with the app.
- **Core Services**: Script import service gains validation capabilities.
- **UI Components**: Game setup, player management, and deduction board screens gain character image display.
- **Data**: New jinxes data and WC25 scripts bundled with the app.
