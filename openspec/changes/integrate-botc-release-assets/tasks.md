# Tasks

## 1. Download and Bundle Character Images

- [x] 1.1 Download all character images from https://github.com/ThePandemoniumInstitute/botc-release/tree/main/resources/characters/ to src/assets/characters/ organized by edition
- [x] 1.2 Verify all 181 character images are downloaded and organized correctly by listing the files
- [x] 1.3 Create a build script (scripts/download-characters.sh) that can re-download images from the official repo, verify it runs successfully

## 2. Implement Character Image Display

- [x] 2.1 Create a CharacterImage component that displays the correct image variant based on character ID and alignment, verify with unit tests
- [x] 2.2 Integrate CharacterImage component into game setup screen's character list, verify images display correctly in browser
- [x] 2.3 Integrate CharacterImage component into player management screen, verify images display on player cards
- [x] 2.4 Integrate CharacterImage component into deduction board role matrix, verify images display in role rows

## 3. Bundle Jinxes Data

- [x] 3.1 Download jinxes.json from https://raw.githubusercontent.com/ThePandemoniumInstitute/botc-release/main/resources/data/jinxes.json to src/assets/data/jinxes.json
- [x] 3.2 Create a JinxesService that loads and provides jinxes data, verify with unit tests
- [x] 3.3 Add jinxes validation to script import service that checks character compatibility, verify with unit tests for known jinxes (e.g., Damsel + Heretic)

## 4. Implement Script Schema Validation

- [x] 4.1 Download script-schema.json from https://raw.githubusercontent.com/ThePandemoniumInstitute/botc-release/main/script-schema.json to src/assets/data/script-schema.json
- [x] 4.2 Add ajv dependency to package.json and install it, verify installation succeeds
- [x] 4.3 Create a ScriptValidator service that validates scripts against the schema, verify with unit tests for valid and invalid scripts
- [x] 4.4 Integrate schema validation into the script import UI with clear error messages, verify by importing a malformed script

## 5. Bundle WC25 Championship Scripts

- [x] 5.1 Download all 14 WC25 scripts from https://github.com/ThePandemoniumInstitute/botc-release/tree/main/wc25/ to src/assets/scripts/wc25/
- [x] 5.2 Create a build script (scripts/download-wc25-scripts.sh) that can re-download WC25 scripts, verify it runs successfully
- [x] 5.3 Update script registry to include WC25 scripts, verify they appear in the script selection UI

## 6. Integration Testing

- [x] 6.1 Run end-to-end test: import a custom script with jinxes, verify validation errors are displayed
- [x] 6.2 Run end-to-end test: create a game with character images, verify images display on all screens
- [x] 6.3 Run end-to-end test: import a WC25 script, verify it loads and is playable
