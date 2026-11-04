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
}

export interface Script {
  id: string;
  name: string;
  source: string;
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
  isSelf?: boolean;          // marks which player seat "you" occupy
  selfRole?: string;         // the role you privately know (or think) you are
  selfRoleCertain?: boolean; // false by default (Drunk edge case)
}

export type ClaimTrust = 'asserted' | 'confirmed' | 'doubted' | 'false';

export interface GameEvent {
  id: string;
  gameId: string;
  night: number;
  phase: 'setup' | 'first-night' | 'day' | 'nomination' | 'execution' | 'other-night';
  actorId?: string;
  kind: string;
  payload: unknown;
  trust: ClaimTrust;
  createdAt: string;
}

export interface RolePossibility {
  playerId: string;
  roleId: string;
  status: 'possible' | 'confirmed' | 'impossible';
  reason?: string;
  requiredAssumptions?: string[];
}

export interface PossibleWorld {
  roleAssignments: Record<string, string | null>;
  alignment: Record<string, 'good' | 'evil' | 'unknown'>;
  drunkOrPoisoned: Set<string>;
  dead: Set<string>;
  oncePerGameUsed: Record<string, boolean>;
  status: 'valid' | 'contradicted';
}

export interface Contradiction {
  description: string;
  events: string[];
}

export interface RequiredAssumption {
  description: string;
  affects: string[];
}

export interface DeductionResult {
  possibleRoles: RolePossibility[];
  survivingWorldCount: number;
  contradictions: Contradiction[];
  requiredAssumptions: RequiredAssumption[];
}
