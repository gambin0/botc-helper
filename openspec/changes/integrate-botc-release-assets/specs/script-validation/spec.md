# Spec Delta

## Purpose

Validate scripts using official BotC compatibility rules and JSON schema to ensure correctness and provide clear error messages.

## ADDED Requirements

### Requirement: Jinxes data is bundled with the app
The system SHALL bundle the official jinxes.json data for character compatibility validation.

#### Scenario: Jinxes data available
- **WHEN** the app validates a script
- **THEN** jinxes data is used to check character compatibility

### Requirement: Script validation detects incompatible characters
The system SHALL detect and report incompatible character combinations based on official jinxes.

#### Scenario: Incompatible characters detected
- **WHEN** a script contains incompatible characters (e.g., Damsel and Heretic)
- **THEN** the system reports the specific incompatibility with an explanation

#### Scenario: Compatible characters pass validation
- **WHEN** a script contains only compatible characters
- **THEN** the system reports no jinxes errors

### Requirement: Custom script imports are validated against schema
The system SHALL validate imported custom script JSON files against the official script schema.

#### Scenario: Valid script imports successfully
- **WHEN** a user imports a valid script JSON file
- **THEN** the script is imported and available for use

#### Scenario: Invalid script shows error
- **WHEN** a user imports a malformed script JSON file
- **THEN** the system displays a clear error message indicating what is wrong

### Requirement: WC25 championship scripts are bundled
The system SHALL bundle the 14 World Championship 2025 scripts as official scripts.

#### Scenario: WC25 scripts available
- **WHEN** a user creates a new game
- **THEN** WC25 championship scripts are available in the script selection list
