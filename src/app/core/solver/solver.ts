import { Script, Player, GameEvent, RolePossibility, DeductionResult, Contradiction } from '../models/game';

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

    // Apply event constraints
    this.applyEventConstraints();

    // Build result
    const possibleRoles: RolePossibility[] = [];
    for (const domain of this.domains) {
      for (const char of this.script.characters) {
        const status = domain.possibleRoles.has(char.id) ? 'possible' : 'impossible';
        possibleRoles.push({
          playerId: domain.playerId,
          roleId: char.id,
          status
        });
      }
    }

    return {
      possibleRoles,
      survivingWorldCount: this.countSurvivingWorlds(),
      contradictions: this.findContradictions(),
      requiredAssumptions: []
    };
  }

  private applyScriptConstraints() {
    // Basic constraint: each player gets one role
    // More complex constraints will be added per script
  }

  private applyEventConstraints() {
    for (const event of this.events) {
      switch (event.kind) {
        case 'claim':
          this.applyClaimConstraint(event);
          break;
        case 'death':
          this.applyDeathConstraint(event);
          break;
        case 'execution':
          this.applyExecutionConstraint(event);
          break;
      }
    }
  }

  private applyClaimConstraint(event: GameEvent) {
    // Simplified: if a player claims a role, that role becomes possible for them
    // (but not confirmed - they could be lying)
    const payload = event.payload as { claimedRole: string };
    if (payload && payload.claimedRole && event.actorId) {
      const domain = this.domains.find(d => d.playerId === event.actorId);
      if (domain) {
        domain.possibleRoles.add(payload.claimedRole);
      }
    }
  }

  private applyDeathConstraint(event: GameEvent) {
    // Dead players can't use certain abilities
    // More complex logic per role
  }

  private applyExecutionConstraint(event: GameEvent) {
    // Executed player's role may be revealed
  }

  private countSurvivingWorlds(): number {
    // Simplified: count non-empty domains
    return this.domains.filter(d => d.possibleRoles.size > 0).length;
  }

  private findContradictions(): Contradiction[] {
    const contradictions: Contradiction[] = [];
    // Check for empty domains (no possible roles)
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
}
