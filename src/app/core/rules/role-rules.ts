import { Team } from '../models/game';

/**
 * Role behaviour registry used by the deduction engine.
 *
 * Everything the solver knows about how a character affects deduction lives
 * here, keyed by role ID. Scripts never carry rules; they only choose which
 * roles are candidates for a game. Roles without an entry use the defaults:
 * they register truthfully as their own character and do not alter setup.
 *
 * Pure TypeScript: no Angular dependencies.
 */

export type Alignment = 'good' | 'evil';

/** Teams that occupy a seat in the starting grimoire. */
export const SEAT_TEAMS: readonly Team[] = ['townsfolk', 'outsider', 'minion', 'demon'];

/**
 * How a character may appear to other players' abilities.
 * `roleId: '*'` means "any character of `team`" (e.g. the Spy registering as a Townsfolk).
 */
export interface Registration {
  alignment: Alignment;
  team: Team;
  roleId: string | '*';
}

export interface SetupModifier {
  /** Possible Outsider count changes. One option is chosen per game. */
  outsiderDelta?: readonly number[];
  /** The Outsider count can be anything (Kazali, Lord of Typhon, Xaan). */
  anyOutsiderCount?: boolean;
  /** Extra Minions (Lil' Monsta, Lord of Typhon). */
  minionDelta?: number;
  /** Roles that must also be in play when this one is (Huntsman → Damsel). */
  requiresInPlay?: readonly string[];
}

export interface RoleRule {
  setup?: SetupModifier;
  /** Overrides default (truthful) registration. */
  registersAs?: readonly Registration[];
  /**
   * How many distinct players per night this character can make drunk or
   * poisoned. Used to bound how much information can be false in a world.
   */
  corruptionCapacity?: number;
  /** The corruption stops once this character is dead (Poisoner, Widow, ...). */
  corruptsWhileAlive?: boolean;
  /**
   * The Widow: one player, chosen on the first night, stays poisoned for the
   * whole game (while the Widow lives), instead of a new choice each night.
   */
  corruptsOneForGame?: boolean;
  /** Vortox: all Townsfolk information is false. */
  falsifiesTownsfolkInfo?: boolean;
  /** A character no player holds (Lil' Monsta). */
  unseated?: boolean;
  /** How many seats may hold this character (default 1). */
  maxCopies?: number;
  /** Village Idiot: if there are extra copies, one of them is drunk. */
  extraCopiesDrunk?: boolean;
  /** Lycanthrope: one good player (the Faux Paw) registers as evil. */
  grantsFauxPaw?: boolean;
  /** Fibbin: this many pieces of false information are allowed across the game. */
  gameWideFalseInfo?: number;
  /** Fortune Teller: one good player registers as the Demon to them. */
  hasRedHerring?: boolean;
  /**
   * Imp: when this Demon dies other than by execution, a living Minion may
   * become this character (a star-pass). See rules/timeline.ts.
   */
  passesOnDeath?: boolean;
  /**
   * Scarlet Woman: if 5 or more players are alive when the Demon dies, this
   * player becomes that Demon. See rules/timeline.ts.
   */
  inheritsDemon?: boolean;
  /**
   * Set when the engine models the role only partially, so the UI can warn
   * that deductions involving it may be too permissive or too strict.
   */
  approximation?: string;
}

const ROLE_RULES: Record<string, RoleRule> = {
  // --- Misregistration ---
  spy: {
    registersAs: [
      { alignment: 'evil', team: 'minion', roleId: 'spy' },
      { alignment: 'good', team: 'minion', roleId: 'spy' },
      { alignment: 'good', team: 'townsfolk', roleId: '*' },
      { alignment: 'good', team: 'outsider', roleId: '*' }
    ]
  },
  recluse: {
    registersAs: [
      { alignment: 'good', team: 'outsider', roleId: 'recluse' },
      { alignment: 'evil', team: 'outsider', roleId: 'recluse' },
      { alignment: 'evil', team: 'minion', roleId: '*' },
      { alignment: 'evil', team: 'demon', roleId: '*' }
    ]
  },

  // --- Setup modifiers ---
  baron: { setup: { outsiderDelta: [2] } },
  fanggu: { setup: { outsiderDelta: [1] } },
  vigormortis: { setup: { outsiderDelta: [-1] } },
  godfather: { setup: { outsiderDelta: [-1, 1] } },
  balloonist: { setup: { outsiderDelta: [0, 1] } },
  hermit: { setup: { outsiderDelta: [0, -1] } },
  kazali: { setup: { anyOutsiderCount: true } },
  xaan: { setup: { anyOutsiderCount: true }, corruptionCapacity: 99 },
  lordoftyphon: {
    setup: { anyOutsiderCount: true, minionDelta: 1 },
    approximation: 'Evil players sitting in a line is not enforced.'
  },
  lilmonsta: {
    // No player holds Lil' Monsta: there is one extra Minion instead, and the
    // babysitting Minion registers as the Demon. Handled by the solver.
    unseated: true
  },
  huntsman: { setup: { requiresInPlay: ['damsel'] } },
  choirboy: { setup: { requiresInPlay: ['king'] } },

  // --- Drunkenness and poisoning sources ---
  poisoner: { corruptionCapacity: 1, corruptsWhileAlive: true },
  widow: { corruptionCapacity: 1, corruptsWhileAlive: true, corruptsOneForGame: true },
  nodashii: { corruptionCapacity: 2, corruptsWhileAlive: true },
  pukka: { corruptionCapacity: 1, corruptsWhileAlive: true },
  lleech: { corruptionCapacity: 1 },
  philosopher: { corruptionCapacity: 1 },
  sweetheart: { corruptionCapacity: 1 },
  sailor: { corruptionCapacity: 1 },
  innkeeper: { corruptionCapacity: 1 },
  courtier: { corruptionCapacity: 1 },
  goon: { corruptionCapacity: 1 },
  cannibal: { corruptionCapacity: 1 },
  minstrel: { corruptionCapacity: 99 },

  // --- Information modifiers ---
  vortox: { falsifiesTownsfolkInfo: true },
  fortuneteller: { hasRedHerring: true },
  lycanthrope: { grantsFauxPaw: true },
  fibbin: { gameWideFalseInfo: 1 },

  // --- The Demon changing seats ---
  imp: { passesOnDeath: true },
  scarletwoman: { inheritsDemon: true },

  // --- Known gaps ---
  legion: { approximation: 'Multiple Legion players are not modelled.' },
  atheist: { approximation: 'Games with no evil characters are not modelled.' },
  summoner: { approximation: 'Games that start with no Demon are not modelled.' },
  villageidiot: { maxCopies: 3, extraCopiesDrunk: true },
  marionette: { approximation: 'The Marionette neighbouring the Demon is not enforced.' }
};

export function getRoleRule(roleId: string): RoleRule {
  return ROLE_RULES[roleId] ?? {};
}

export function teamAlignment(team: Team): Alignment {
  return team === 'minion' || team === 'demon' ? 'evil' : 'good';
}

export function registrationsFor(roleId: string, team: Team): readonly Registration[] {
  return (
    getRoleRule(roleId).registersAs ?? [{ alignment: teamAlignment(team), team, roleId }]
  );
}

/**
 * Characters a player might actually be when they *believe* (or claim, while
 * good and honest) to be `believedRoleId`.
 *  - Drunk thinks they are a Townsfolk.
 *  - Lunatic thinks they are a Demon.
 *  - Marionette thinks they are a good character.
 */
export function possibleTrueRolesForBelief(believedRoleId: string, believedTeam: Team): string[] {
  const result = [believedRoleId];
  if (believedTeam === 'townsfolk') result.push('drunk');
  if (believedTeam === 'demon') result.push('lunatic');
  if (believedTeam === 'townsfolk' || believedTeam === 'outsider') result.push('marionette');
  return result;
}

/**
 * Normalises a character ID so that the variants seen in scripts and older
 * data ("scarlet_woman", "Fortune Teller", "fortune-teller") all match the
 * official registry IDs ("scarletwoman", "fortuneteller").
 */
export function normalizeRoleId(id: string): string {
  return id.toLowerCase().replace(/[^a-z0-9]/g, '');
}
