import { Team } from '../models/game';

export interface RoleDefinition {
  id: string;
  name: string;
  team: Team;
  ability: string;
  edition?: string;
  firstNight?: number;
  otherNight?: number;
  setup?: boolean;
  reminders?: string[];
  producesInformation: boolean;
  canBeDrunkOrPoisoned: boolean;
  oncePerGame?: boolean;
}
