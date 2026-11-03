export interface RoleTrigger {
  type: 'setup' | 'first-night' | 'each-night' | 'death' | 'nomination' | 'execution' | 'claim';
  condition?: string;
}

export interface ConstraintDefinition {
  type: string;
  params: Record<string, unknown>;
  description: string;
}

export interface RoleRule {
  roleId: string;
  triggers: RoleTrigger[];
  constraints: ConstraintDefinition[];
  producesInformation: boolean;
  canBeDrunkOrPoisoned: boolean;
  oncePerGame?: boolean;
  team?: string;
}
