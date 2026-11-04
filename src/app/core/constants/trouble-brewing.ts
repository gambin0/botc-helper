import { Script } from '../models/game';
import { RoleRegistry } from '../roles/role-registry';

/**
 * Official Trouble Brewing script (22 characters).
 * Characters are loaded from the official roles registry.
 */
export const TROUBLE_BREWING_SCRIPT: Script = {
  id: 'trouble-brewing',
  name: 'Trouble Brewing',
  source: 'official',
  characters: RoleRegistry.toScriptCharacters([
    'washerwoman', 'librarian', 'investigator', 'chef', 'empath',
    'fortuneteller', 'undertaker', 'monk', 'ravenkeeper', 'virgin',
    'slayer', 'soldier', 'mayor', 'butler', 'drunk', 'recluse', 'saint',
    'poisoner', 'spy', 'scarlet_woman', 'baron', 'imp'
  ])
};
