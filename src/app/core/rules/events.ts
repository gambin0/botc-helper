import { ClaimTrust, GameEvent } from '../models/game';
import { InfoPayload, getInfoSpec } from './info-specs';
import { normalizeRoleId } from './role-rules';

/**
 * Typed readers for event payloads. They accept the legacy field names that
 * older saved games used (claimedRole, executedPlayerId, ...).
 */

export function claimRole(event: GameEvent): string | null {
  const p = event.payload as { roleId?: string; claimedRole?: string } | undefined;
  const id = p?.roleId ?? p?.claimedRole;
  return id ? normalizeRoleId(id) : null;
}

export function targetPlayer(event: GameEvent): string | null {
  const p = event.payload as { playerId?: string; executedPlayerId?: string } | undefined;
  return p?.playerId ?? p?.executedPlayerId ?? null;
}

export function executionEndedGame(event: GameEvent): boolean {
  return (event.payload as { gameEnded?: boolean } | undefined)?.gameEnded === true;
}

/**
 * Undertaker-style info on night N is about the player executed on day N-1.
 * Does the log have that execution? An execution logged under day N also
 * counts, in case the log numbers it that way; so this never wrongly says no.
 */
export function namesYesterdaysExecution(info: GameEvent, events: readonly GameEvent[]): boolean {
  const player = infoPayload(info)?.player;
  if (!player) return true;
  return events.some(
    e => e.kind === 'execution' && targetPlayer(e) === player && (e.night === info.night - 1 || e.night === info.night)
  );
}

/**
 * Ravenkeeper- and Sage-style info on night N comes from a player who died
 * that night. Does the log have that death? A death logged under the day
 * before also counts, in case the log numbers it that way.
 */
export function diedThatNight(info: GameEvent, events: readonly GameEvent[]): boolean {
  return events.some(
    e => e.kind === 'death' && targetPlayer(e) === info.actorId && (e.night === info.night || e.night === info.night - 1)
  );
}

/**
 * Was this death a Slayer's shot? True when the log has Slayer info that
 * killed the same player on the same day. The Demon then died by day, not by
 * its own night kill, so an Imp cannot pass the star.
 */
export function killedBySlayer(death: GameEvent, events: readonly GameEvent[]): boolean {
  const player = targetPlayer(death);
  return events.some(e => {
    const p = e.kind === 'info' ? infoPayload(e) : null;
    return p?.type === 'slayer' && p.yes === true && p.player === player && e.night === death.night;
  });
}

export function infoPayload(event: GameEvent): InfoPayload | null {
  const p = event.payload as InfoPayload | undefined;
  if (!p || typeof p.type !== 'string') return null;
  return { ...p, type: normalizeRoleId(p.type) };
}

const TRUST_LABEL: Record<ClaimTrust, string> = {
  asserted: '',
  doubted: ' (doubted)',
  confirmed: ' (confirmed)',
  false: ' (known false)'
};

export function describeEvent(
  event: GameEvent,
  name: (playerId?: string | null) => string,
  role: (roleId?: string | null) => string
): string {
  switch (event.kind) {
    case 'claim':
      return `${name(event.actorId)} claims ${role(claimRole(event))}${TRUST_LABEL[event.trust] ?? ''}`;
    case 'death':
      return `${name(targetPlayer(event))} died`;
    case 'execution':
      return `${name(targetPlayer(event))} was executed${executionEndedGame(event) ? ' and the game ended' : ''}`;
    case 'resurrection':
      return `${name(targetPlayer(event))} came back to life`;
    case 'info': {
      const payload = infoPayload(event);
      const spec = payload ? getInfoSpec(payload.type) : undefined;
      if (!payload || !spec) return `${name(event.actorId)} received info`;
      return `${name(event.actorId)} (as ${role(spec.roleId)}) ${spec.describe(payload, name, role)}`;
    }
    case 'note':
      return event.note ?? 'Note';
    default:
      return event.kind;
  }
}
