import {
  Script,
  ScriptCharacter,
  Player,
  GameEvent,
  RolePossibility,
  DeductionResult,
  Contradiction,
  Team,
  RequiredAssumption
} from '../models/game';
import { RoleRegistry } from '../roles/role-registry';
import { SeatingCircle } from '../utils/seating';

interface Domain {
  playerId: string;
  possibleRoles: Set<string>;
}

export class BotcSolver {
  private domains: Domain[] = [];
  private events: GameEvent[] = [];
  private characters: ScriptCharacter[] = [];
  private players: Player[] = [];
  private eliminationReasons: Map<string, string> = new Map(); // key: `${playerId}:${roleId}`
  private selfPlayerId: string | null = null;
  private selfRole: string | null = null;
  private selfRoleCertain = false;

  /**
   * Initialize solver with either a Script or an ad-hoc list of characters,
   * completely decoupling the solver engine from scripts.
   */
  init(scriptOrCharacters: Script | ScriptCharacter[], players: Player[]): void {
    if ('characters' in scriptOrCharacters) {
      this.characters = scriptOrCharacters.characters;
    } else {
      this.characters = scriptOrCharacters;
    }
    this.players = players;
    this.events = [];
    this.eliminationReasons.clear();
    this.selfPlayerId = null;
    this.selfRole = null;
    this.selfRoleCertain = false;
    this.domains = players.map(p => ({
      playerId: p.id,
      possibleRoles: new Set(this.characters.map(c => c.id))
    }));
  }

  setSelfKnowledge(playerId: string, roleId: string, certain = false): void {
    this.selfPlayerId = playerId;
    this.selfRole = roleId;
    this.selfRoleCertain = certain;
  }

  addEvent(event: GameEvent): void {
    this.events.push(event);
  }

  solve(): DeductionResult {
    if (this.characters.length === 0 || this.players.length === 0) {
      return {
        possibleRoles: [],
        survivingWorldCount: 0,
        contradictions: [],
        requiredAssumptions: []
      };
    }

    this.eliminationReasons.clear();

    // Reset domains
    this.domains = this.players.map(p => ({
      playerId: p.id,
      possibleRoles: new Set(this.characters.map(c => c.id))
    }));

    // Apply private self-knowledge
    if (this.selfPlayerId && this.selfRole) {
      this.applyPrivateSelfKnowledge();
    }

    // Apply event constraints iteratively until fixed point or max iterations
    let changed = true;
    let iterations = 0;
    while (changed && iterations < 50) {
      changed = false;
      iterations++;
      for (const event of this.events) {
        if (this.applyEventConstraint(event)) {
          changed = true;
        }
      }
    }

    // Build deduction result
    const possibleRoles: RolePossibility[] = [];
    for (const domain of this.domains) {
      for (const char of this.characters) {
        const status = domain.possibleRoles.has(char.id) ? 'possible' : 'impossible';
        const reasonKey = `${domain.playerId}:${char.id}`;
        possibleRoles.push({
          playerId: domain.playerId,
          roleId: char.id,
          status,
          reason: status === 'impossible' ? (this.eliminationReasons.get(reasonKey) || 'Eliminated by constraints') : undefined
        });
      }
    }

    // Mark self player's known role as 'confirmed' in output (even if uncertain — it's their self-knowledge)
    if (this.selfPlayerId && this.selfRole) {
      const selfEntry = possibleRoles.find(
        r => r.playerId === this.selfPlayerId && r.roleId === this.selfRole
      );
      if (selfEntry) {
        selfEntry.status = 'confirmed';
        selfEntry.reason = this.selfRoleCertain
          ? 'You privately know you are this role (certain)'
          : 'You believe you are this role (may differ if Drunk/poisoned)';
      }
    }

    return {
      possibleRoles,
      survivingWorldCount: this.countSurvivingWorlds(),
      contradictions: this.findContradictions(),
      requiredAssumptions: this.findRequiredAssumptions()
    };
  }

  private applyPrivateSelfKnowledge(): void {
    if (!this.selfPlayerId || !this.selfRole) return;
    const selfId = this.selfPlayerId;
    const roleId = this.selfRole;
    const certain = this.selfRoleCertain;

    // Mark self player's domain: set confirmed for self role
    const selfDomain = this.domains.find(d => d.playerId === selfId);
    if (selfDomain) {
      // If certain: lock self to this role (clear all others)
      // If uncertain (Drunk case): just mark as self-claimed — don't lock them
      // Either way: eliminate this role from ALL OTHER players
      if (certain) {
        selfDomain.possibleRoles.clear();
        selfDomain.possibleRoles.add(roleId);
        this.eliminationReasons.set(`${selfId}:${roleId}`, 'You privately know you are this role (confirmed)');
      }
      // For uncertain: don't restrict self's domain — they might actually be Drunk/different
    }

    // Eliminate from other players
    for (const domain of this.domains) {
      if (domain.playerId === selfId) continue;
      if (domain.possibleRoles.has(roleId)) {
        domain.possibleRoles.delete(roleId);
        this.eliminationReasons.set(
          `${domain.playerId}:${roleId}`,
          certain
            ? `You are confirmed as this role — cannot be anyone else`
            : `You privately believe you are this role — unlikely to also be assigned here`
        );
      }
    }
  }

  private setEliminated(playerId: string, roleId: string, reason: string): boolean {
    const domain = this.domains.find(d => d.playerId === playerId);
    if (!domain || !domain.possibleRoles.has(roleId)) {
      return false;
    }
    domain.possibleRoles.delete(roleId);
    this.eliminationReasons.set(`${playerId}:${roleId}`, reason);
    return true;
  }

  private getTeam(roleId: string): Team | null {
    const regRole = RoleRegistry.get(roleId);
    if (regRole) return regRole.team;
    const char = this.characters.find(c => c.id === roleId);
    return char ? char.team : null;
  }

  private isEvilRole(roleId: string): boolean {
    const team = this.getTeam(roleId);
    return team === 'minion' || team === 'demon';
  }

  private isGoodRole(roleId: string): boolean {
    const team = this.getTeam(roleId);
    return team === 'townsfolk' || team === 'outsider';
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
    const payload = event.payload as { claimedRole?: string } | undefined;
    if (!payload?.claimedRole || !event.actorId) return false;

    // Confirmed claims lock down the player to that role
    if (event.trust === 'confirmed') {
      const domain = this.domains.find(d => d.playerId === event.actorId);
      if (!domain) return false;

      let changed = false;
      for (const roleId of [...domain.possibleRoles]) {
        if (roleId !== payload.claimedRole) {
          if (this.setEliminated(event.actorId, roleId, `Confirmed claim: ${payload.claimedRole}`)) {
            changed = true;
          }
        }
      }
      return changed;
    }

    return false;
  }

  private applyDeathConstraint(event: GameEvent): boolean {
    // In Blood on the Clocktower, death changes alive status,
    // but dead players keep their character identity!
    return false;
  }

  private applyExecutionConstraint(event: GameEvent): boolean {
    const payload = event.payload as {
      executedPlayerId?: string;
      playerId?: string;
      revealedRole?: string;
    } | undefined;
    const targetId = payload?.executedPlayerId || payload?.playerId;
    if (!targetId || !payload?.revealedRole) return false;

    const domain = this.domains.find(d => d.playerId === targetId);
    if (!domain) return false;

    let changed = false;
    for (const roleId of [...domain.possibleRoles]) {
      if (roleId !== payload.revealedRole) {
        if (this.setEliminated(targetId, roleId, `Executed and revealed as ${payload.revealedRole}`)) {
          changed = true;
        }
      }
    }
    return changed;
  }

  private applyInfoConstraint(event: GameEvent): boolean {
    const payload = event.payload as Record<string, unknown> | undefined;
    if (!payload || typeof payload !== 'object') return false;

    const type = String(payload['type'] || '');

    switch (type) {
      case 'empath':
        return this.applyEmpathConstraint(event, payload);
      case 'chef':
        return this.applyChefConstraint(event, payload);
      case 'washerwoman':
      case 'librarian':
      case 'investigator':
        return this.applyDisjunctiveRoleConstraint(event, payload);
      case 'fortune_teller':
        return this.applyFortuneTellerConstraint(event, payload);
      case 'slayer':
        return this.applySlayerConstraint(event, payload);
      case 'virgin':
        return this.applyVirginConstraint(event, payload);
      case 'undertaker':
        return this.applyUndertakerConstraint(event, payload);
      default:
        return false;
    }
  }

  /**
   * Empath: learns how many of their 2 ALIVE neighbours in the circle are evil.
   * Uses SeatingCircle with wrap-around (e.g. seat 8 -> seat 1).
   */
  private applyEmpathConstraint(event: GameEvent, payload: Record<string, unknown>): boolean {
    const empathId = (payload['actorId'] || event.actorId) as string | undefined;
    if (!empathId) return false;

    const count = Number(payload['count'] !== undefined ? payload['count'] : (payload['isTrue'] === true ? 1 : 0));
    const { aliveNeighbors } = SeatingCircle.getAliveNeighbors(this.players, empathId);

    if (aliveNeighbors.length === 0) return false;

    let changed = false;

    // If count is 0: ALL alive neighbors are GOOD!
    if (count === 0) {
      for (const neighbor of aliveNeighbors) {
        const domain = this.domains.find(d => d.playerId === neighbor.id);
        if (domain) {
          for (const roleId of [...domain.possibleRoles]) {
            if (this.isEvilRole(roleId)) {
              if (this.setEliminated(neighbor.id, roleId, 'Empath alive neighbor: 0 evil reading')) {
                changed = true;
              }
            }
          }
        }
      }
    }

    // If count is 2 (and there are 2 distinct alive neighbors): ALL alive neighbors are EVIL!
    if (count === 2 && aliveNeighbors.length === 2) {
      for (const neighbor of aliveNeighbors) {
        const domain = this.domains.find(d => d.playerId === neighbor.id);
        if (domain) {
          for (const roleId of [...domain.possibleRoles]) {
            if (this.isGoodRole(roleId)) {
              if (this.setEliminated(neighbor.id, roleId, 'Empath alive neighbor: 2 evil reading')) {
                changed = true;
              }
            }
          }
        }
      }
    }

    // If count is 1 with 2 alive neighbors:
    // If one alive neighbor is confirmed good, the other MUST be evil!
    // If one alive neighbor is confirmed evil, the other MUST be good!
    if (count === 1 && aliveNeighbors.length === 2) {
      const [n1, n2] = aliveNeighbors;
      const d1 = this.domains.find(d => d.playerId === n1.id);
      const d2 = this.domains.find(d => d.playerId === n2.id);

      if (d1 && d2) {
        const d1OnlyGood = [...d1.possibleRoles].every(r => this.isGoodRole(r));
        const d1OnlyEvil = [...d1.possibleRoles].every(r => this.isEvilRole(r));
        const d2OnlyGood = [...d2.possibleRoles].every(r => this.isGoodRole(r));
        const d2OnlyEvil = [...d2.possibleRoles].every(r => this.isEvilRole(r));

        if (d1OnlyGood) {
          // n2 must be evil
          for (const roleId of [...d2.possibleRoles]) {
            if (this.isGoodRole(roleId)) {
              if (this.setEliminated(n2.id, roleId, 'Empath 1-evil pair deduction: neighbor confirmed good')) {
                changed = true;
              }
            }
          }
        } else if (d1OnlyEvil) {
          // n2 must be good
          for (const roleId of [...d2.possibleRoles]) {
            if (this.isEvilRole(roleId)) {
              if (this.setEliminated(n2.id, roleId, 'Empath 1-evil pair deduction: neighbor confirmed evil')) {
                changed = true;
              }
            }
          }
        }

        if (d2OnlyGood) {
          // n1 must be evil
          for (const roleId of [...d1.possibleRoles]) {
            if (this.isGoodRole(roleId)) {
              if (this.setEliminated(n1.id, roleId, 'Empath 1-evil pair deduction: neighbor confirmed good')) {
                changed = true;
              }
            }
          }
        } else if (d2OnlyEvil) {
          // n1 must be good
          for (const roleId of [...d1.possibleRoles]) {
            if (this.isEvilRole(roleId)) {
              if (this.setEliminated(n1.id, roleId, 'Empath 1-evil pair deduction: neighbor confirmed evil')) {
                changed = true;
              }
            }
          }
        }
      }
    }

    return changed;
  }

  /**
   * Chef: learns how many pairs of evil players are adjacent in the circle.
   * Circle wraps around from last seat to first seat!
   */
  private applyChefConstraint(event: GameEvent, payload: Record<string, unknown>): boolean {
    const count = Number(payload['count']);
    if (isNaN(count)) return false;

    let changed = false;

    // If count is 0: No two evil players are adjacent around the circle!
    if (count === 0) {
      for (const player of this.players) {
        const domain = this.domains.find(d => d.playerId === player.id);
        if (!domain) continue;

        // If player is confirmed evil, their circular neighbors CANNOT be evil!
        const isPlayerConfirmedEvil = [...domain.possibleRoles].every(r => this.isEvilRole(r));
        if (isPlayerConfirmedEvil) {
          const { clockwise, counterClockwise } = SeatingCircle.getImmediateNeighbors(this.players, player.id);
          const neighbors = [clockwise, counterClockwise].filter((p): p is Player => p !== null);

          for (const neighbor of neighbors) {
            const nDomain = this.domains.find(d => d.playerId === neighbor.id);
            if (nDomain) {
              for (const roleId of [...nDomain.possibleRoles]) {
                if (this.isEvilRole(roleId)) {
                  if (this.setEliminated(neighbor.id, roleId, 'Chef 0-pairs: cannot be adjacent to confirmed evil player')) {
                    changed = true;
                  }
                }
              }
            }
          }
        }
      }
    }

    return changed;
  }

  /**
   * Washerwoman / Librarian / Investigator:
   * Learns that 1 of 2 players is a particular role.
   */
  private applyDisjunctiveRoleConstraint(event: GameEvent, payload: Record<string, unknown>): boolean {
    const candidateIds = payload['candidatePlayerIds'] as string[] | undefined;
    const roleId = payload['roleId'] as string | undefined;

    if (!candidateIds || candidateIds.length !== 2 || !roleId) return false;

    const [id1, id2] = candidateIds;
    const domain1 = this.domains.find(d => d.playerId === id1);
    const domain2 = this.domains.find(d => d.playerId === id2);

    if (!domain1 || !domain2) return false;

    let changed = false;

    // If candidate 1 cannot be this role, candidate 2 MUST have it!
    if (!domain1.possibleRoles.has(roleId)) {
      if (domain2.possibleRoles.has(roleId)) {
        for (const otherRoleId of [...domain2.possibleRoles]) {
          if (otherRoleId !== roleId) {
            if (this.setEliminated(id2, otherRoleId, `1-of-2 deduction: ${id1} cannot be ${roleId}`)) {
              changed = true;
            }
          }
        }
      } else {
        // Neither candidate can be the role -> contradiction
        domain2.possibleRoles.clear();
        changed = true;
      }
    }

    // If candidate 2 cannot be this role, candidate 1 MUST have it!
    if (!domain2.possibleRoles.has(roleId)) {
      if (domain1.possibleRoles.has(roleId)) {
        for (const otherRoleId of [...domain1.possibleRoles]) {
          if (otherRoleId !== roleId) {
            if (this.setEliminated(id1, otherRoleId, `1-of-2 deduction: ${id2} cannot be ${roleId}`)) {
              changed = true;
            }
          }
        }
      } else {
        // Neither candidate can be the role -> contradiction
        domain1.possibleRoles.clear();
        changed = true;
      }
    }

    return changed;
  }

  /**
   * Fortune Teller: choose 2 players, learns if either is a Demon.
   */
  private applyFortuneTellerConstraint(event: GameEvent, payload: Record<string, unknown>): boolean {
    const candidateIds = (payload['candidatePlayerIds'] || [payload['targetPlayerId']]) as string[];
    const isTrue = payload['isTrue'] ?? (payload['result'] === 'yes');

    if (!candidateIds || candidateIds.length === 0) return false;

    let changed = false;

    // If result is 'no' / false: Neither player is a Demon!
    if (isTrue === false || payload['result'] === 'no') {
      for (const playerId of candidateIds) {
        const domain = this.domains.find(d => d.playerId === playerId);
        if (domain) {
          for (const roleId of [...domain.possibleRoles]) {
            if (this.getTeam(roleId) === 'demon') {
              if (this.setEliminated(playerId, roleId, 'Fortune Teller "no" reading')) {
                changed = true;
              }
            }
          }
        }
      }
    }

    return changed;
  }

  /**
   * Slayer: shoots a player. If Demon, target dies.
   */
  private applySlayerConstraint(event: GameEvent, payload: Record<string, unknown>): boolean {
    const targetPlayerId = payload['targetPlayerId'] as string | undefined;
    const targetDied = payload['targetDied'] === true || payload['isTrue'] === true;

    if (!targetPlayerId) return false;

    const domain = this.domains.find(d => d.playerId === targetPlayerId);
    if (!domain) return false;

    let changed = false;

    if (targetDied) {
      // Target was the Demon
      for (const roleId of [...domain.possibleRoles]) {
        if (this.getTeam(roleId) !== 'demon') {
          if (this.setEliminated(targetPlayerId, roleId, 'Slayer shot killed player: confirmed Demon')) {
            changed = true;
          }
        }
      }
    } else {
      // Target did not die -> Not the Demon
      for (const roleId of [...domain.possibleRoles]) {
        if (this.getTeam(roleId) === 'demon') {
          if (this.setEliminated(targetPlayerId, roleId, 'Slayer shot failed: not the Demon')) {
            changed = true;
          }
        }
      }
    }

    return changed;
  }

  /**
   * Virgin: when nominated, if nominator is Townsfolk, nominator executed immediately.
   */
  private applyVirginConstraint(event: GameEvent, payload: Record<string, unknown>): boolean {
    const nominatorId = payload['nominatorPlayerId'] as string | undefined;
    const virginId = (payload['virginPlayerId'] || event.actorId) as string | undefined;
    const wasExecuted = payload['wasExecuted'] === true;

    if (!nominatorId || !wasExecuted) return false;

    let changed = false;

    // Nominator must be Townsfolk
    const nomDomain = this.domains.find(d => d.playerId === nominatorId);
    if (nomDomain) {
      for (const roleId of [...nomDomain.possibleRoles]) {
        if (this.getTeam(roleId) !== 'townsfolk') {
          if (this.setEliminated(nominatorId, roleId, 'Virgin nomination executed: nominator is Townsfolk')) {
            changed = true;
          }
        }
      }
    }

    // Target is confirmed Virgin
    if (virginId) {
      const vDomain = this.domains.find(d => d.playerId === virginId);
      if (vDomain && vDomain.possibleRoles.has('virgin')) {
        for (const roleId of [...vDomain.possibleRoles]) {
          if (roleId !== 'virgin') {
            if (this.setEliminated(virginId, roleId, 'Virgin ability triggered: confirmed Virgin')) {
              changed = true;
            }
          }
        }
      }
    }

    return changed;
  }

  /**
   * Undertaker: learns executed player's role.
   */
  private applyUndertakerConstraint(event: GameEvent, payload: Record<string, unknown>): boolean {
    const executedPlayerId = payload['executedPlayerId'] as string | undefined;
    const revealedRole = payload['revealedRole'] as string | undefined;

    if (!executedPlayerId || !revealedRole) return false;

    const domain = this.domains.find(d => d.playerId === executedPlayerId);
    if (!domain) return false;

    let changed = false;
    for (const roleId of [...domain.possibleRoles]) {
      if (roleId !== revealedRole) {
        if (this.setEliminated(executedPlayerId, roleId, `Undertaker learned: ${revealedRole}`)) {
          changed = true;
        }
      }
    }
    return changed;
  }

  private countSurvivingWorlds(): number {
    if (this.domains.length === 0 || this.domains.some(d => d.possibleRoles.size === 0)) {
      return 0;
    }
    return this.domains.reduce((acc, d) => acc * d.possibleRoles.size, 1);
  }

  private findContradictions(): Contradiction[] {
    const contradictions: Contradiction[] = [];
    for (const domain of this.domains) {
      if (domain.possibleRoles.size === 0) {
        const player = this.players.find(p => p.id === domain.playerId);
        contradictions.push({
          description: `${player?.name || 'Player'} has no logically possible roles remaining`,
          events: []
        });
      }
    }
    return contradictions;
  }

  private findRequiredAssumptions(): RequiredAssumption[] {
    return [];
  }
}
