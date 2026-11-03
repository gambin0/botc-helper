import { Script, Player, GameEvent, RolePossibility, DeductionResult, Contradiction, Team } from '../models/game';

interface Domain {
  playerId: string;
  possibleRoles: Set<string>;
}

export class BotcSolver {
  private domains: Domain[] = [];
  private events: GameEvent[] = [];
  private script: Script | null = null;
  private players: Player[] = [];

  init(script: Script, players: Player[]) {
    this.script = script;
    this.players = players;
    this.domains = players.map(p => ({
      playerId: p.id,
      possibleRoles: new Set(script.characters.map(c => c.id))
    }));
  }

  addEvent(event: GameEvent) {
    this.events.push(event);
  }

  solve(): DeductionResult {
    if (!this.script || this.players.length === 0) {
      return {
        possibleRoles: [],
        survivingWorldCount: 0,
        contradictions: [],
        requiredAssumptions: []
      };
    }

    // Reset domains
    this.domains = this.players.map(p => ({
      playerId: p.id,
      possibleRoles: new Set(this.script!.characters.map(c => c.id))
    }));

    // Apply script-level constraints
    this.applyScriptConstraints();

    // Apply event constraints iteratively until fixed point
    let changed = true;
    let iterations = 0;
    while (changed && iterations < 100) {
      changed = false;
      iterations++;
      for (const event of this.events) {
        if (this.applyEventConstraint(event)) {
          changed = true;
        }
      }
    }

    // Build result
    const possibleRoles: RolePossibility[] = [];
    for (const domain of this.domains) {
      for (const char of this.script.characters) {
        const status = domain.possibleRoles.has(char.id) ? 'possible' : 'impossible';
        possibleRoles.push({
          playerId: domain.playerId,
          roleId: char.id,
          status,
          reason: this.getReason(domain.playerId, char.id)
        });
      }
    }

    return {
      possibleRoles,
      survivingWorldCount: this.countSurvivingWorlds(),
      contradictions: this.findContradictions(),
      requiredAssumptions: this.findRequiredAssumptions()
    };
  }

  private getTeam(roleId: string): Team | null {
    if (!this.script) return null;
    const char = this.script.characters.find(c => c.id === roleId);
    return char ? char.team : null;
  }

  private getRoleName(roleId: string): string {
    if (!this.script) return roleId;
    const char = this.script.characters.find(c => c.id === roleId);
    return char ? char.name : roleId;
  }

  private getPlayerName(playerId: string): string {
    const player = this.players.find(p => p.id === playerId);
    return player ? player.name : 'Player';
  }

  private applyScriptConstraints(): boolean {
    // For now, basic constraints only
    return false;
  }

  private applyEventConstraint(event: GameEvent): boolean {
    switch (event.kind) {
      case 'claim':
        return this.applyClaimConstraint(event);
      case 'death':
        return this.applyDeathConstraint(event);
      case 'execution':
        return this.applyExecutionConstraint(event);
      case 'info':
        return this.applyInfoConstraint(event);
      default:
        return false;
    }
  }

  private applyClaimConstraint(event: GameEvent): boolean {
    const payload = event.payload as { claimedRole: string };
    if (!payload || !payload.claimedRole) return false;

    // If a player claims a role, that role becomes possible for them
    if (event.actorId) {
      const domain = this.domains.find(d => d.playerId === event.actorId);
      if (domain && !domain.possibleRoles.has(payload.claimedRole)) {
        domain.possibleRoles.add(payload.claimedRole);
        return true;
      }
    }
    return false;
  }

  private applyDeathConstraint(event: GameEvent): boolean {
    const payload = event.payload as { playerId: string };
    if (!payload || !payload.playerId) return false;

    // Dead players can't be certain roles that require being alive
    const domain = this.domains.find(d => d.playerId === payload.playerId);
    if (!domain) return false;

    let changed = false;
    // Roles that can't be dead (simplified)
    const aliveOnlyRoles = ['slayer']; // Slayer needs to be alive to use ability
    for (const roleId of aliveOnlyRoles) {
      if (domain.possibleRoles.has(roleId)) {
        domain.possibleRoles.delete(roleId);
        changed = true;
      }
    }
    return changed;
  }

  private applyExecutionConstraint(event: GameEvent): boolean {
    const payload = event.payload as { executedPlayerId: string; revealedRole?: string };
    if (!payload || !payload.executedPlayerId) return false;

    // If the executed player's role was revealed, constrain that player
    if (payload.revealedRole) {
      const domain = this.domains.find(d => d.playerId === payload.executedPlayerId);
      if (domain) {
        const newRoles = new Set([payload.revealedRole]);
        if (domain.possibleRoles.size !== 1 || !domain.possibleRoles.has(payload.revealedRole)) {
          domain.possibleRoles = newRoles;
          return true;
        }
      }
    }
    return false;
  }

  private applyInfoConstraint(event: GameEvent): boolean {
    const payload = event.payload as {
      type: string;
      targetPlayerId?: string;
      candidatePlayerIds?: string[];
      roleId?: string;
      team?: string;
      isTrue?: boolean;
    };
    if (!payload) return false;

    switch (payload.type) {
      case 'washerwoman':
      case 'librarian':
      case 'investigator':
        return this.applyDisjunctiveRoleConstraint(event, payload);
      case 'empath':
        return this.applyAlignmentConstraint(event, payload);
      case 'fortune_teller':
        return this.applyDemonConstraint(event, payload);
      default:
        return false;
    }
  }

  private applyDisjunctiveRoleConstraint(event: GameEvent, payload: any): boolean {
    if (!payload.candidatePlayerIds || payload.candidatePlayerIds.length !== 2) return false;
    if (!payload.roleId) return false;

    const [id1, id2] = payload.candidatePlayerIds;
    const domain1 = this.domains.find(d => d.playerId === id1);
    const domain2 = this.domains.find(d => d.playerId === id2);

    if (!domain1 || !domain2) return false;

    // At least one of the two players must have this role
    let changed = false;
    if (!domain1.possibleRoles.has(payload.roleId)) {
      if (domain2.possibleRoles.size > 1 || !domain2.possibleRoles.has(payload.roleId)) {
        domain2.possibleRoles = new Set([payload.roleId]);
        changed = true;
      }
    }
    if (!domain2.possibleRoles.has(payload.roleId)) {
      if (domain1.possibleRoles.size > 1 || !domain1.possibleRoles.has(payload.roleId)) {
        domain1.possibleRoles = new Set([payload.roleId]);
        changed = true;
      }
    }
    return changed;
  }

  private applyAlignmentConstraint(event: GameEvent, payload: any): boolean {
    if (!payload.targetPlayerId) return false;
    const domain = this.domains.find(d => d.playerId === payload.targetPlayerId);
    if (!domain) return false;

    let changed = false;
    if (payload.isTrue === true) {
      // Player is good - eliminate evil roles
      for (const roleId of [...domain.possibleRoles]) {
        const team = this.getTeam(roleId);
        if (team === 'minion' || team === 'demon') {
          domain.possibleRoles.delete(roleId);
          changed = true;
        }
      }
    } else if (payload.isTrue === false) {
      // Player is evil - eliminate good roles
      for (const roleId of [...domain.possibleRoles]) {
        const team = this.getTeam(roleId);
        if (team === 'townsfolk' || team === 'outsider') {
          domain.possibleRoles.delete(roleId);
          changed = true;
        }
      }
    }
    return changed;
  }

  private applyDemonConstraint(event: GameEvent, payload: any): boolean {
    if (!payload.targetPlayerId) return false;
    const domain = this.domains.find(d => d.playerId === payload.targetPlayerId);
    if (!domain) return false;

    let changed = false;
    if (payload.isTrue === true) {
      // Player is the demon
      const demonRoles = [...domain.possibleRoles].filter(roleId => this.getTeam(roleId) === 'demon');
      if (demonRoles.length > 0) {
        domain.possibleRoles = new Set(demonRoles);
        changed = true;
      }
    } else if (payload.isTrue === false) {
      // Player is not the demon
      for (const roleId of [...domain.possibleRoles]) {
        if (this.getTeam(roleId) === 'demon') {
          domain.possibleRoles.delete(roleId);
          changed = true;
        }
      }
    }
    return changed;
  }

  private countSurvivingWorlds(): number {
    // Simplified: count non-empty domains
    return this.domains.filter(d => d.possibleRoles.size > 0).length;
  }

  private findContradictions(): Contradiction[] {
    const contradictions: Contradiction[] = [];
    for (const domain of this.domains) {
      if (domain.possibleRoles.size === 0) {
        const player = this.players.find(p => p.id === domain.playerId);
        contradictions.push({
          description: `${player?.name || 'Player'} has no possible roles`,
          events: []
        });
      }
    }
    return contradictions;
  }

  private findRequiredAssumptions(): any[] {
    // Simplified: no assumptions for now
    return [];
  }

  private getReason(playerId: string, roleId: string): string | undefined {
    const domain = this.domains.find(d => d.playerId === playerId);
    if (!domain || domain.possibleRoles.has(roleId)) return undefined;

    const team = this.getTeam(roleId);
    if (!team) return undefined;

    // Check if eliminated by alignment constraint
    for (const event of this.events) {
      if (event.kind === 'info' && event.payload) {
        const payload = event.payload as any;
        if (payload.type === 'empath' && payload.targetPlayerId === playerId) {
          if (payload.isTrue === true && (team === 'minion' || team === 'demon')) {
            return 'Confirmed good by Empath';
          }
          if (payload.isTrue === false && (team === 'townsfolk' || team === 'outsider')) {
            return 'Confirmed evil by Empath';
          }
        }
        if (payload.type === 'fortune_teller' && payload.targetPlayerId === playerId) {
          if (payload.isTrue === false && team === 'demon') {
            return 'Confirmed not Demon by Fortune Teller';
          }
        }
      }
    }

    return 'Eliminated by constraints';
  }
}
