/**
 * Converts official BotC roles.json and nightsheet.json to TypeScript constants.
 * 
 * Usage: node scripts/convert-roles.mjs <roles.json> <nightsheet.json> <output.ts>
 */

import { readFileSync, writeFileSync } from 'fs';

const rolesJson = JSON.parse(readFileSync(process.argv[2], 'utf-8'));
const nightsheetJson = JSON.parse(readFileSync(process.argv[3], 'utf-8'));

// Build night order maps
const firstNightOrder = {};
nightsheetJson.firstNight.forEach((id, i) => {
  firstNightOrder[id] = i;
});

const otherNightOrder = {};
nightsheetJson.otherNight.forEach((id, i) => {
  otherNightOrder[id] = i;
});

// Convert roles to RoleDefinition format
const roles = rolesJson.map(role => {
  const fn = firstNightOrder[role.id];
  const on = otherNightOrder[role.id];
  
  // Determine producesInformation based on ability text
  const abilityLower = role.ability.toLowerCase();
  const producesInfo = abilityLower.includes('know') || 
                       abilityLower.includes('learn') ||
                       abilityLower.includes('discover') ||
                       abilityLower.includes('see') ||
                       abilityLower.includes('find out');
  
  // Determine oncePerGame
  const oncePerGame = abilityLower.includes('once per game') || 
                      abilityLower.includes('once during the day') ||
                      abilityLower.includes('the 1st time');
  
  // Determine canBeDrunkOrPoisoned (most can, some special cases)
  let canBeDrunkOrPoisoned = true;
  if (role.id === 'drunk') {
    canBeDrunkOrPoisoned = false;
  }
  
  return {
    id: role.id,
    name: role.name,
    team: role.team,
    ability: role.ability,
    firstNight: fn !== undefined ? fn : undefined,
    otherNight: on !== undefined ? on : undefined,
    setup: role.setup,
    reminders: role.reminders,
    producesInformation: producesInfo,
    canBeDrunkOrPoisoned: canBeDrunkOrPoisoned,
    oncePerGame: oncePerGame,
    edition: role.edition
  };
});

// Group by edition
const byEdition = {};
for (const role of roles) {
  if (!byEdition[role.edition]) {
    byEdition[role.edition] = [];
  }
  byEdition[role.edition].push(role);
}

// Generate TypeScript code
let output = `/**
 * Auto-generated from official BotC roles.json and nightsheet.json.
 * Source: https://github.com/ThePandemoniumInstitute/botc-release
 * DO NOT EDIT MANUALLY.
 */

import { RoleDefinition } from './role-definition';

`;

for (const [edition, editionRoles] of Object.entries(byEdition)) {
  const constName = `OFFICIAL_${edition.toUpperCase()}_ROLES`;
  output += `export const ${constName}: RoleDefinition[] = [\n`;
  
  for (let i = 0; i < editionRoles.length; i++) {
    const role = editionRoles[i];
    output += `  {\n`;
    output += `    id: '${role.id}',\n`;
    output += `    name: '${role.name.replace(/'/g, "\\'")}',\n`;
    output += `    team: '${role.team}',\n`;
    output += `    ability: '${role.ability.replace(/'/g, "\\'").replace(/\n/g, ' ')}',\n`;
    if (role.firstNight !== undefined) {
      output += `    firstNight: ${role.firstNight},\n`;
    }
    if (role.otherNight !== undefined) {
      output += `    otherNight: ${role.otherNight},\n`;
    }
    if (role.setup) {
      output += `    setup: true,\n`;
    }
    if (role.reminders && role.reminders.length > 0) {
      output += `    reminders: [${role.reminders.map(r => `'${r.replace(/'/g, "\\'")}'`).join(', ')}],\n`;
    }
    output += `    producesInformation: ${role.producesInformation},\n`;
    output += `    canBeDrunkOrPoisoned: ${role.canBeDrunkOrPoisoned}`;
    if (role.oncePerGame) {
      output += `,\n    oncePerGame: true`;
    }
    output += `\n  }${i < editionRoles.length - 1 ? ',' : ''}\n`;
  }
  
  output += `];\n\n`;
}

// Generate combined export
output += `/**
 * All official roles from all editions.
 */\n`;
output += `export const ALL_OFFICIAL_ROLES: RoleDefinition[] = [\n`;
const editionNames = Object.keys(byEdition);
for (let i = 0; i < editionNames.length; i++) {
  const edition = editionNames[i];
  const constName = `OFFICIAL_${edition.toUpperCase()}_ROLES`;
  output += `  ...${constName}`;
  if (i < editionNames.length - 1) {
    output += ',';
  }
  output += `\n`;
}
output += `];\n`;

writeFileSync(process.argv[4], output);
console.log(`Generated ${process.argv[4]} with ${roles.length} roles across ${editionNames.length} editions.`);
console.log('Editions:', editionNames.join(', '));
