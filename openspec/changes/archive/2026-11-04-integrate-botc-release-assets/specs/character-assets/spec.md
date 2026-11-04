# Spec Delta

## Purpose

Display official character images throughout the app to enhance visual recognition and user experience.

## ADDED Requirements

### Requirement: Character images are bundled with the app
The system SHALL bundle official character images (WebP format) for all 181 BotC roles across 6 editions.

#### Scenario: Images are available offline
- **WHEN** the app is installed and used offline
- **THEN** all character images are available for display

### Requirement: Character images display in game setup
The system SHALL display character images alongside character names during game setup.

#### Scenario: Viewing character list
- **WHEN** a player browses the character list during game setup
- **THEN** each character shows its official image with appropriate alignment variant

### Requirement: Character images display in player management
The system SHALL display character images when managing players.

#### Scenario: Viewing player cards
- **WHEN** a player views the player management screen
- **THEN** each player's assigned character shows its image

### Requirement: Character images display in deduction board
The system SHALL display character images in the role possibility matrix.

#### Scenario: Viewing deductions
- **WHEN** a player views the deduction board
- **THEN** each role row shows the character's image

### Requirement: Correct alignment variant is displayed
The system SHALL display the correct image variant based on the character's alignment state.

#### Scenario: Good alignment displayed
- **WHEN** a character is determined to be good
- **THEN** the good alignment image variant is shown

#### Scenario: Evil alignment displayed
- **WHEN** a character is determined to be evil
- **THEN** the evil alignment image variant is shown
