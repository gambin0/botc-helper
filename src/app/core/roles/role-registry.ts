import { RoleDefinition } from './role-definition';
import { ALL_OFFICIAL_ROLES } from './official-roles';
import { ScriptCharacter, Team } from '../models/game';

/**
 * Decoupled registry of character roles.
 * Game rules and solver deduction constraints attach to character roles,
 * completely independent of any specific script.
 * Scripts are merely pre-selected collections/presets of roles.
 */
export class RoleRegistry {
  private static roles: Map<string, RoleDefinition> = new Map();

  static {
    this.registerAll(ALL_OFFICIAL_ROLES);
  }

  /**
   * Register a single role definition.
   */
  static register(role: RoleDefinition): void {
    this.roles.set(role.id, role);
  }

  /**
   * Register multiple role definitions.
   */
  static registerAll(roles: RoleDefinition[]): void {
    for (const role of roles) {
      this.roles.set(role.id, role);
    }
  }

  /**
   * Get a role definition by role ID.
   */
  static get(roleId: string): RoleDefinition | undefined {
    return this.roles.get(roleId);
  }

  /**
   * Check if a role is registered.
   */
  static has(roleId: string): boolean {
    return this.roles.has(roleId);
  }

  /**
   * Get all registered roles.
   */
  static getAll(): RoleDefinition[] {
    return Array.from(this.roles.values());
  }

  /**
   * Get roles filtered by team.
   */
  static getByTeam(team: Team): RoleDefinition[] {
    return this.getAll().filter(r => r.team === team);
  }

  /**
   * Convert role definitions to ScriptCharacter format.
   */
  static toScriptCharacters(roleIds?: string[]): ScriptCharacter[] {
    const roles = roleIds
      ? roleIds.map(id => this.get(id)).filter((r): r is RoleDefinition => r !== undefined)
      : this.getAll();

    return roles.map(r => ({
      id: r.id,
      name: r.name,
      team: r.team,
      ability: r.ability,
      firstNight: r.firstNight,
      otherNight: r.otherNight,
      setup: r.setup
    }));
  }
}
