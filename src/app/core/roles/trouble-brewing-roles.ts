import { RoleDefinition } from './role-definition';

/**
 * Official characters for the Blood on the Clocktower: Trouble Brewing edition.
 * Verified against https://wiki.bloodontheclocktower.com/Trouble_Brewing
 * Exactly 22 characters:
 * - 13 Townsfolk
 * - 4 Outsiders
 * - 4 Minions
 * - 1 Demon
 */
export const TROUBLE_BREWING_ROLES: RoleDefinition[] = [
  // --- TOWNSFOLK (13) ---
  {
    id: 'washerwoman',
    name: 'Washerwoman',
    team: 'townsfolk',
    ability: 'You start knowing that 1 of 2 players is a particular Townsfolk.',
    firstNight: 32,
    producesInformation: true,
    canBeDrunkOrPoisoned: true
  },
  {
    id: 'librarian',
    name: 'Librarian',
    team: 'townsfolk',
    ability: 'You start knowing that 1 of 2 players is a particular Outsider. (Or that zero are in play.)',
    firstNight: 33,
    producesInformation: true,
    canBeDrunkOrPoisoned: true
  },
  {
    id: 'investigator',
    name: 'Investigator',
    team: 'townsfolk',
    ability: 'You start knowing that 1 of 2 players is a particular Minion.',
    firstNight: 34,
    producesInformation: true,
    canBeDrunkOrPoisoned: true
  },
  {
    id: 'chef',
    name: 'Chef',
    team: 'townsfolk',
    ability: 'You start knowing how many pairs of evil players there are.',
    firstNight: 35,
    producesInformation: true,
    canBeDrunkOrPoisoned: true
  },
  {
    id: 'empath',
    name: 'Empath',
    team: 'townsfolk',
    ability: 'Each night, you learn how many of your 2 alive neighbours are evil.',
    firstNight: 36,
    otherNight: 53,
    producesInformation: true,
    canBeDrunkOrPoisoned: true
  },
  {
    id: 'fortune_teller',
    name: 'Fortune Teller',
    team: 'townsfolk',
    ability: 'Each night, choose 2 players: you learn if either is a Demon. There is a good player that registers as a Demon to you.',
    firstNight: 37,
    otherNight: 54,
    producesInformation: true,
    canBeDrunkOrPoisoned: true
  },
  {
    id: 'undertaker',
    name: 'Undertaker',
    team: 'townsfolk',
    ability: 'Each night*, you learn which character died by execution today.',
    otherNight: 55,
    producesInformation: true,
    canBeDrunkOrPoisoned: true
  },
  {
    id: 'monk',
    name: 'Monk',
    team: 'townsfolk',
    ability: 'Each night*, choose a player (not yourself): they are safe from the Demon tonight.',
    otherNight: 12,
    producesInformation: false,
    canBeDrunkOrPoisoned: true
  },
  {
    id: 'ravenkeeper',
    name: 'Ravenkeeper',
    team: 'townsfolk',
    ability: 'If you die at night, you are woken to choose a player: you learn their character.',
    otherNight: 52,
    producesInformation: true,
    canBeDrunkOrPoisoned: true
  },
  {
    id: 'virgin',
    name: 'Virgin',
    team: 'townsfolk',
    ability: 'The 1st time you are nominated, if the nominator is a Townsfolk, they are executed immediately.',
    oncePerGame: true,
    producesInformation: false,
    canBeDrunkOrPoisoned: true
  },
  {
    id: 'slayer',
    name: 'Slayer',
    team: 'townsfolk',
    ability: 'Once per game, during the day, publicly choose a player: if they are the Demon, they die.',
    oncePerGame: true,
    producesInformation: false,
    canBeDrunkOrPoisoned: true
  },
  {
    id: 'soldier',
    name: 'Soldier',
    team: 'townsfolk',
    ability: 'You are safe from the Demon.',
    producesInformation: false,
    canBeDrunkOrPoisoned: true
  },
  {
    id: 'mayor',
    name: 'Mayor',
    team: 'townsfolk',
    ability: 'If only 3 players live & no execution occurs, your team wins. If you die at night, another player might die instead.',
    producesInformation: false,
    canBeDrunkOrPoisoned: true
  },

  // --- OUTSIDERS (4) ---
  {
    id: 'butler',
    name: 'Butler',
    team: 'outsider',
    ability: 'Each night, choose a player (not yourself): tomorrow, you may only vote if they are voting too.',
    firstNight: 38,
    otherNight: 57,
    producesInformation: false,
    canBeDrunkOrPoisoned: true
  },
  {
    id: 'drunk',
    name: 'Drunk',
    team: 'outsider',
    ability: 'You do not know you are the Drunk. You think you are a Townsfolk character, but you are not.',
    setup: true,
    producesInformation: false,
    canBeDrunkOrPoisoned: false
  },
  {
    id: 'recluse',
    name: 'Recluse',
    team: 'outsider',
    ability: 'You might register as evil & as a Minion or Demon, even if dead.',
    producesInformation: false,
    canBeDrunkOrPoisoned: true
  },
  {
    id: 'saint',
    name: 'Saint',
    team: 'outsider',
    ability: 'If you die by execution, your team loses.',
    producesInformation: false,
    canBeDrunkOrPoisoned: true
  },

  // --- MINIONS (4) ---
  {
    id: 'poisoner',
    name: 'Poisoner',
    team: 'minion',
    ability: 'Each night, choose a player: they are poisoned tonight and tomorrow day.',
    firstNight: 17,
    otherNight: 8,
    producesInformation: false,
    canBeDrunkOrPoisoned: true
  },
  {
    id: 'spy',
    name: 'Spy',
    team: 'minion',
    ability: 'Each night, you see the Grimoire. You might register as good & as a Townsfolk or Outsider, even if dead.',
    firstNight: 49,
    otherNight: 68,
    producesInformation: false,
    canBeDrunkOrPoisoned: true
  },
  {
    id: 'scarlet_woman',
    name: 'Scarlet Woman',
    team: 'minion',
    ability: 'If there are 5 or more players alive & the Demon dies, you become the Demon. (Travellers don\'t count)',
    otherNight: 19,
    producesInformation: false,
    canBeDrunkOrPoisoned: true
  },
  {
    id: 'baron',
    name: 'Baron',
    team: 'minion',
    ability: 'There are extra Outsiders in play. [+2 Outsiders]',
    setup: true,
    producesInformation: false,
    canBeDrunkOrPoisoned: true
  },

  // --- DEMON (1) ---
  {
    id: 'imp',
    name: 'Imp',
    team: 'demon',
    ability: 'Each night*, choose a player: they die. If you kill yourself this way, a Minion becomes the Imp.',
    otherNight: 24,
    producesInformation: false,
    canBeDrunkOrPoisoned: true
  }
];
