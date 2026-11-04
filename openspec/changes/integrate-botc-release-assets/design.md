# Design

## Context

The app currently has role data but no character images. Script validation is limited to basic JSON parsing. The official botc-release repo provides character images, jinxes data, a JSON schema, and WC25 championship scripts.

## Goals / Non-Goals

**Goals:**
- Bundle and display official character images throughout the app
- Implement script validation using official jinxes data
- Add JSON schema validation for custom script imports
- Bundle WC25 championship scripts

**Non-Goals:**
- Dynamic image downloading (all assets bundled at build time)
- Real-time validation against remote sources
- Image optimization or compression pipeline

## Decisions

### Character Image Bundling
**Decision:** Download all character images from botc-release repo and bundle them as static assets in `src/assets/characters/`.

**Rationale:** Offline-first architecture requires all assets to be bundled. WebP format is already supported by modern browsers and Android.

**Alternatives considered:**
- Dynamic loading from CDN: Requires network, adds complexity
- Base64 encoding in TypeScript: Increases bundle size significantly

### Image Naming Convention
**Decision:** Maintain the official naming convention: `{characterId}_{alignment}.webp` where alignment is `g` (good), `e` (evil), or omitted for alignment-agnostic characters.

**Rationale:** Consistency with source repo simplifies updates and maintenance.

### Jinxes Validation
**Decision:** Load jinxes.json as a static asset and validate scripts against it in the script import service.

**Rationale:** Jinxes data is relatively small (21KB) and changes infrequently. Static bundling ensures offline availability.

### Script Schema Validation
**Decision:** Use the official script-schema.json with a JSON schema validation library (e.g., `ajv`).

**Rationale:** The official schema is the authoritative source for script format. `ajv` is a well-established, fast JSON schema validator.

### WC25 Scripts
**Decision:** Bundle WC25 scripts in `src/assets/scripts/wc25/` and make them available in the script selection UI.

**Rationale:** These are official championship scripts that players may want to use.

## Risks / Trade-offs

**Bundle size increase** → Character images (~500 WebP files) will significantly increase the app's bundle size. Mitigation: Consider lazy-loading images or using a CDN for images while keeping core data bundled.

**Asset synchronization** → Bundled assets may become stale compared to the official repo. Mitigation: Document the process for updating assets and consider a build-time script to fetch latest assets.

**Validation strictness** → Schema validation may reject valid homebrew scripts that use non-standard fields. Mitigation: Provide clear error messages and allow users to bypass validation if needed.
