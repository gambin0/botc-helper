import { Team } from '../models/game';

/**
 * Play advice, keyed by role ID like the other role rules. Roles without
 * specific advice fall back to their team's general advice, so every
 * character has something to show.
 *
 * Pure TypeScript: no Angular dependencies.
 */

export interface RoleTips {
  /** One-line summary of the role's job. */
  focus: string;
  tips: readonly string[];
  /** Why this role is risky or safe to bluff as an evil player. */
  bluffNote?: string;
}

const TEAM_TIPS: Record<Team, RoleTips> = {
  townsfolk: {
    focus: 'Use your ability and share what you learn so the good team can find the Demon.',
    tips: [
      'Write down everything you learn, with the night you learnt it. Details matter later.',
      'Decide when to reveal: early sharing helps the town, but makes you a target for the Demon.',
      'Remember you might be drunk or poisoned. Compare your info with others before trusting it completely.'
    ]
  },
  outsider: {
    focus: 'Your ability hurts the good team, so play around it while still helping find the Demon.',
    tips: [
      'Tell the town you are an Outsider at a sensible time: it helps them count, and Outsider counts can expose a Baron.',
      'Evil players often bluff Outsiders because they are hard to check. Expect your claim to be questioned.',
      'You still vote and talk. Your reasoning is as useful as anyone\'s.'
    ]
  },
  minion: {
    focus: 'Protect the Demon, sow confusion, and use your ability to make good information unreliable.',
    tips: [
      'Agree a bluff with your Demon early so you do not both claim the same character.',
      'Sit on a bluff that is hard to disprove, and have fake information ready for it.',
      'You are more expendable than the Demon: drawing suspicion or an execution onto yourself can save them.',
      'Do not defend the Demon too obviously. Voting patterns are noticed.'
    ]
  },
  demon: {
    focus: 'Survive. Kill the players whose information is closing in on you.',
    tips: [
      'Pick a bluff from the three not-in-play characters the Storyteller showed you: no good player can double-claim them.',
      'Kill confirmed or high-information players first, but vary your pattern so your kills do not point back at you.',
      'Let your Minions take heat for you. Do not over-defend them.',
      'Count votes: on the final day, evil wins if good cannot execute the Demon.'
    ]
  },
  traveller: {
    focus: 'You can leave and join freely. Your alignment is secret unless the Storyteller says otherwise.',
    tips: ['Your ability is public. Use it to shape the game in your team\'s favour.']
  },
  fabled: { focus: 'A Storyteller-only character that changes the rules.', tips: [] },
  loric: { focus: 'A Storyteller-only character that changes the rules.', tips: [] }
};

const ROLE_TIPS: Record<string, RoleTips> = {
  // --- Trouble Brewing: Townsfolk ---
  washerwoman: {
    focus: 'You learn that one of two players is a particular Townsfolk.',
    tips: [
      'One of your two players is probably confirmed good to you. That is a great ally.',
      'The other player was likely chosen as a red herring, possibly an evil player. Watch them.',
      'Sharing early lets the shown Townsfolk confirm or deny it, which also tests your own sobriety.'
    ],
    bluffNote: 'Easy to invent, but the Townsfolk you "saw" may deny it.'
  },
  librarian: {
    focus: 'You learn that one of two players is a particular Outsider, or that none are in play.',
    tips: [
      '"No Outsiders" is valuable: anyone claiming an Outsider is likely lying, and a Baron is unlikely.',
      'If you see the Drunk, one of your two players thinks they are a Townsfolk but is not.',
      'Outsider counts help the town spot a Baron (+2 Outsiders).'
    ],
    bluffNote: 'Safe if you show a real Outsider claim; risky if Outsider counts are known.'
  },
  investigator: {
    focus: 'You learn that one of two players is a particular Minion.',
    tips: [
      'One of your two players is evil (unless a Recluse misregisters). Push on both.',
      'Consider holding your info a day: the shown Minion may claim something you can then disprove.',
      'You are a top Demon target once revealed, so share to a trusted player first.'
    ],
    bluffNote: 'Accusing two players is aggressive and draws attention; good for framing a good player.'
  },
  chef: {
    focus: 'You learn how many pairs of evil players sit next to each other.',
    tips: [
      'A 0 is strong: no two evil players are neighbours. Combine it with confirmed-good players to narrow seats.',
      'A 1 or more means evil players are adjacent. Look at pairs who defend each other.',
      'Your info never changes, so the town can use it all game. Share it early.'
    ],
    bluffNote: 'Usually safe: a single number is hard to disprove early. Saying 0 is the safest.'
  },
  empath: {
    focus: 'Each night you learn how many of your two alive neighbours are evil.',
    tips: [
      'Your neighbours change when people die. Track who your alive neighbours were each night.',
      'A 0 clears both neighbours: they become your strongest allies.',
      'A sudden change between nights, with no deaths next to you, can mean you were poisoned.'
    ],
    bluffNote: 'Risky: your numbers must stay consistent as players die around you.'
  },
  fortuneteller: {
    focus: 'Each night you pick two players and learn if either is the Demon.',
    tips: [
      'One good player is your red herring and always registers as the Demon to you.',
      'Test yourself early: include a player you believe is good to find the red herring.',
      'A "no" clears both players of being the Demon (unless you are drunk or poisoned).'
    ],
    bluffNote: 'Flexible: you can "clear" teammates or point at good players, but a real FT may contradict you.'
  },
  undertaker: {
    focus: 'Each night you learn which character died by execution today.',
    tips: [
      'You confirm or break claims after every execution. Keep a list.',
      'If you learn an executed player was evil, the town knows the vote was right.',
      'You only get info on days with an execution, so push for executions.'
    ],
    bluffNote: 'Dangerous: if an executed teammate is revealed by someone else, your info clashes.'
  },
  monk: {
    focus: 'Each night you protect another player from the Demon.',
    tips: [
      'Protect players with strong information, but not so predictably the Demon can play around it.',
      'If nobody dies at night, you may have saved your target. That can confirm you to them.',
      'You cannot protect yourself.'
    ],
    bluffNote: 'Safe: protection is invisible, and a no-death night can be "explained" by you.'
  },
  ravenkeeper: {
    focus: 'If you die at night, you learn one player\'s character.',
    tips: [
      'Claim openly or hint at it: the Demon may avoid killing you, which keeps you alive.',
      'If you are killed, pick the player whose role would unlock the most information.'
    ],
    bluffNote: 'Safe while alive; the Demon knows if you were killed and said nothing.'
  },
  virgin: {
    focus: 'The first time you are nominated, if the nominator is a Townsfolk, they are executed.',
    tips: [
      'Getting a trusted player to nominate you can confirm both of you (if they die, they were a Townsfolk).',
      'Once your ability is used, you are just a good voter. Make sure it is spent usefully.'
    ],
    bluffNote: 'Very risky: anyone can test it by nominating you.'
  },
  slayer: {
    focus: 'Once per game, during the day, publicly choose a player: if they are the Demon, they die.',
    tips: [
      'Do not waste your shot early. Wait until suspicion narrows down.',
      'A miss still clears the target of being the Demon (if you are sober and really the Slayer).',
      'The Recluse can die to your shot, so a kill is not proof on its own.'
    ],
    bluffNote: 'Risky: the town may ask you to shoot, which reveals the bluff.'
  },
  soldier: {
    focus: 'You are safe from the Demon.',
    tips: [
      'Surviving many nights makes your claim credible. Use that trust to lead the town.',
      'The Demon can still poison you through the Poisoner, so do not rely on your safety blindly.'
    ],
    bluffNote: 'Fairly safe, but suspicious if you survive while everyone around you dies.'
  },
  mayor: {
    focus: 'If only three players live and there is no execution, good wins. You might survive a kill.',
    tips: [
      'In the final three, argue for no execution if you trust the other good player.',
      'A failed kill on you may bounce to someone else. Watch unusual night deaths.'
    ],
    bluffNote: 'Good late-game bluff for a Demon who wants to avoid execution in the final three.'
  },

  // --- Trouble Brewing: Outsiders ---
  butler: {
    focus: 'Each night you pick a master; you may only vote when your master votes.',
    tips: [
      'Choose a master you trust: your vote follows theirs.',
      'Claim Butler early so nobody reads your voting as suspicious.'
    ],
    bluffNote: 'Easy to claim and rarely checked, but it limits how you can vote.'
  },
  drunk: {
    focus: 'You think you are a Townsfolk, but you are the Drunk and your information is unreliable.',
    tips: ['You cannot know you are the Drunk. Treat this app\'s "not certain" option as that possibility.']
  },
  recluse: {
    focus: 'You might register as evil, even as a Minion or Demon, to abilities.',
    tips: [
      'Expect bad readings on you from the Empath, Fortune Teller or Investigator. Explain it early.',
      'Your confusion can protect real evil players, so help the town account for you.'
    ],
    bluffNote: 'Classic Demon bluff: it explains away evil readings on you.'
  },
  saint: {
    focus: 'If you are executed, your team loses.',
    tips: [
      'Claim Saint when you are in danger of execution.',
      'Evil players love to bluff Saint. Be ready to be doubted.'
    ],
    bluffNote: 'Strong bluff to avoid execution, but a real Saint or Undertaker can expose you.'
  },

  // --- Trouble Brewing: Minions ---
  poisoner: {
    focus: 'Each night you poison a player, making their information wrong.',
    tips: [
      'Poison the players whose information is most dangerous to your Demon.',
      'Poisoning creates contradictions between good players. Encourage them to doubt each other.',
      'Poisoning the Monk or Soldier can let your Demon kill through them.'
    ]
  },
  spy: {
    focus: 'You see the Grimoire each night and might register as good.',
    tips: [
      'You know every character. Use it to pick a bluff that is safely not in play.',
      'Feed your Demon information about who holds the most dangerous roles.',
      'You can survive many good abilities: lean into claiming a good role convincingly.'
    ]
  },
  scarletwoman: {
    focus: 'If the Demon dies with 5 or more players alive, you become the Demon.',
    tips: [
      'Stay low-key and alive. You are the Demon\'s insurance policy.',
      'If you become the Demon, keep your old bluff: suddenly changing your story is a giveaway.'
    ]
  },
  baron: {
    focus: 'There are two extra Outsiders in play.',
    tips: [
      'Extra Outsiders make the game confusing. Encourage good players to doubt each other\'s claims.',
      'Many Outsider claims point to a Baron. Avoid claiming Outsider yourself if several are out.'
    ]
  },

  // --- Trouble Brewing: Demon ---
  imp: {
    focus: 'Each night you kill a player. If you kill yourself, a Minion becomes the Imp.',
    tips: [
      'Killing yourself (star-passing) can throw off a town that is closing in on you.',
      'Kill information roles, but sometimes leave a confused player alive: they can mislead the town.',
      'Use one of your three not-in-play bluffs, ideally one that is hard to test.'
    ]
  }
};

export function getRoleTips(roleId: string, team: Team): RoleTips {
  return ROLE_TIPS[roleId] ?? TEAM_TIPS[team];
}

export function hasSpecificTips(roleId: string): boolean {
  return roleId in ROLE_TIPS;
}

export function teamTips(team: Team): RoleTips {
  return TEAM_TIPS[team];
}
