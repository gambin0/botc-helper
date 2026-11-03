import { RoleRule } from '../models/role-rule';

export const troubleBrewingRules: Record<string, RoleRule> = {
  washerwoman: {
    roleId: 'washerwoman',
    team: 'townsfolk',
    triggers: [{ type: 'each-night' }],
    constraints: [
      {
        type: 'disjunctive_role',
        params: { candidates: 2, roleType: 'townsfolk' },
        description: 'Learns two players, one of whom is a Townsfolk'
      }
    ],
    producesInformation: true,
    canBeDrunkOrPoisoned: true
  },
  librarian: {
    roleId: 'librarian',
    team: 'townsfolk',
    triggers: [{ type: 'each-night' }],
    constraints: [
      {
        type: 'disjunctive_role',
        params: { candidates: 2, roleType: 'outsider' },
        description: 'Learns two players, one of whom is an Outsider'
      }
    ],
    producesInformation: true,
    canBeDrunkOrPoisoned: true
  },
  investigator: {
    roleId: 'investigator',
    team: 'townsfolk',
    triggers: [{ type: 'each-night' }],
    constraints: [
      {
        type: 'disjunctive_role',
        params: { candidates: 2, roleType: 'minion' },
        description: 'Learns two players, one of whom is a Minion'
      }
    ],
    producesInformation: true,
    canBeDrunkOrPoisoned: true
  },
  chef: {
    roleId: 'chef',
    team: 'townsfolk',
    triggers: [{ type: 'each-night' }],
    constraints: [
      {
        type: 'evil_pair_count',
        params: {},
        description: 'Learns how many pairs of adjacent players are both evil'
      }
    ],
    producesInformation: true,
    canBeDrunkOrPoisoned: true
  },
  empath: {
    roleId: 'empath',
    team: 'townsfolk',
    triggers: [{ type: 'each-night' }],
    constraints: [
      {
        type: 'alignment_check',
        params: { target: 1 },
        description: 'Learns if a player is good or evil'
      }
    ],
    producesInformation: true,
    canBeDrunkOrPoisoned: true
  },
  fortune_teller: {
    roleId: 'fortune_teller',
    team: 'townsfolk',
    triggers: [{ type: 'each-night' }],
    constraints: [
      {
        type: 'demon_check',
        params: { target: 1 },
        description: 'Learns if a player is the Demon'
      }
    ],
    producesInformation: true,
    canBeDrunkOrPoisoned: true
  },
  undertaker: {
    roleId: 'undertaker',
    team: 'townsfolk',
    triggers: [{ type: 'execution' }],
    constraints: [
      {
        type: 'role_reveal',
        params: { target: 'executed' },
        description: 'Learns the role of the executed player'
      }
    ],
    producesInformation: true,
    canBeDrunkOrPoisoned: true
  },
  drunk: {
    roleId: 'drunk',
    team: 'outsider',
    triggers: [{ type: 'setup' }],
    constraints: [
      {
        type: 'arbitrary_info',
        params: {},
        description: 'Believes they are a specific Townsfolk role'
      }
    ],
    producesInformation: false,
    canBeDrunkOrPoisoned: false
  },
  recluse: {
    roleId: 'recluse',
    team: 'outsider',
    triggers: [{ type: 'setup' }],
    constraints: [
      {
        type: 'misidentified_evil',
        params: {},
        description: 'Appears as a Minion or Demon to ability users'
      }
    ],
    producesInformation: false,
    canBeDrunkOrPoisoned: true
  },
  imp: {
    roleId: 'imp',
    team: 'minion',
    triggers: [{ type: 'each-night' }, { type: 'death' }],
    constraints: [
      {
        type: 'kill_player',
        params: { target: 1 },
        description: 'Can kill a player each night; if killed, transfers Demon role'
      }
    ],
    producesInformation: false,
    canBeDrunkOrPoisoned: true
  },
  poisoner: {
    roleId: 'poisoner',
    team: 'minion',
    triggers: [{ type: 'each-night' }],
    constraints: [
      {
        type: 'poison_player',
        params: { target: 1 },
        description: 'Can poison a player, making their abilities unreliable'
      }
    ],
    producesInformation: false,
    canBeDrunkOrPoisoned: true
  },
  spy: {
    roleId: 'spy',
    team: 'minion',
    triggers: [{ type: 'setup' }],
    constraints: [
      {
        type: 'appears_good',
        params: {},
        description: 'Appears as a good player to ability users'
      }
    ],
    producesInformation: false,
    canBeDrunkOrPoisoned: true
  }
};
