export type Team = 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveller' | 'fabled' | 'loric';

export interface ScriptCharacter {
  id: string;
  name: string;
  team: Team;
  ability: string;
  firstNight?: number;
  otherNight?: number;
  reminders?: string[];
  setup?: boolean;
  jinxes?: unknown[];
  /** More than one player may hold this character (script "bag-duplicate"). */
  maxCopies?: number;
}

export interface Script {
  id: string;
  name: string;
  source: string;
  author?: string;
  characters: ScriptCharacter[];
}

export interface Game {
  id: string;
  name: string;
  scriptId: string;
  playerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Player {
  id: string;
  gameId: string;
  name: string;
  seat: number;
  alive: boolean;
  notes?: string;
  isSelf?: boolean;
}

/**
 * How much a claim should be trusted by the solver.
 *  - asserted:  taken at face value *if* the claimant is good (see "assume good players are honest").
 *  - doubted:   possibly a bluff even from a good player; adds no constraint.
 *  - confirmed: known to be the player's true character.
 *  - false:     known NOT to be the player's true character.
 */
export type ClaimTrust = 'asserted' | 'confirmed' | 'doubted' | 'false';

export type GameEventKind = 'claim' | 'death' | 'execution' | 'resurrection' | 'info' | 'note';

export type GamePhase = 'setup' | 'first-night' | 'day' | 'nomination' | 'execution' | 'other-night';

export interface GameEvent {
  id: string;
  gameId: string;
  night: number;
  phase: GamePhase;
  actorId?: string;
  kind: GameEventKind | string;
  payload: unknown;
  trust: ClaimTrust;
  createdAt: string;
  note?: string;
}

export interface ClaimPayload {
  roleId: string;
}

export interface PlayerPayload {
  playerId: string;
}

export interface ExecutionPayload {
  playerId: string;
  /** True if the execution ended the game. Defaults to false (play continued). */
  gameEnded?: boolean;
}

export type PossibilityStatus = 'possible' | 'confirmed' | 'impossible';

export interface RolePossibility {
  playerId: string;
  roleId: string;
  status: PossibilityStatus;
  /** Short reason, available immediately for directly-eliminated roles. */
  reason?: string;
}

export interface PlayerAlignment {
  playerId: string;
  canBeGood: boolean;
  canBeEvil: boolean;
}

export interface Contradiction {
  description: string;
  /** Event IDs (or synthetic evidence IDs) involved. */
  events: string[];
}

export interface DeductionResult {
  /** False when no starting grimoire is consistent with the evidence. */
  consistent: boolean;
  possibleRoles: RolePossibility[];
  alignments: PlayerAlignment[];
  contradictions: Contradiction[];
  /**
   * Evidence set aside to resolve contradictions; the possibilities are
   * deduced from everything else.
   */
  ignoredEvidence: EvidenceRef[];
  /** Notes about roles the engine models only approximately, unsupported input, etc. */
  warnings: string[];
  /** True if the search budget ran out, so some "possible" entries are unproven. */
  incomplete: boolean;
}

export interface EvidenceRef {
  id: string;
  label: string;
}

export interface Explanation {
  playerId: string;
  roleId: string;
  status: PossibilityStatus;
  summary: string;
  /** A minimal set of evidence that together rules the assignment out. */
  evidence: EvidenceRef[];
}
