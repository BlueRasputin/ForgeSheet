const API_BASE = "https://www.dnd5eapi.co/api/2014";
const STORAGE_KEY = "forgesheet.character.v1";
const ACTIVE_TAB_SHEET_KEY = "forgesheet.activeSheet.v1";
const CHARACTER_LIBRARY_KEY = "forgesheet.characters.v1";
const CUSTOM_CLASS_KEY = "forgesheet.classes.v1";
const SYNC_CONFIG_KEY = "forgesheet.sync.v1";
const THEME_KEY = "forgesheet.theme.v1";
const BACKGROUND_KEY = "forgesheet.background.v1";
const VIEW_LAYOUT_KEY = "forgesheet.viewLayout.v1";
const CUSTOM_SPELL_VALUE = "__custom_spell__";
const CUSTOM_CLASS_VALUE = "__custom_class__";
const PDFJS_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs";
const PDFJS_WORKER_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";
const FIREBASE_APP_URL = "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
const FIREBASE_FIRESTORE_URL = "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
const FIREBASE_AUTH_URL = "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
const THEMES = ["beyond", "light", "dark", "retro"];

const ABILITIES = [
  ["str", "Strength"],
  ["dex", "Dexterity"],
  ["con", "Constitution"],
  ["int", "Intelligence"],
  ["wis", "Wisdom"],
  ["cha", "Charisma"]
];

const SKILLS = [
  ["acrobatics", "Acrobatics", "dex"],
  ["animalHandling", "Animal Handling", "wis"],
  ["arcana", "Arcana", "int"],
  ["athletics", "Athletics", "str"],
  ["deception", "Deception", "cha"],
  ["history", "History", "int"],
  ["insight", "Insight", "wis"],
  ["intimidation", "Intimidation", "cha"],
  ["investigation", "Investigation", "int"],
  ["medicine", "Medicine", "wis"],
  ["nature", "Nature", "int"],
  ["perception", "Perception", "wis"],
  ["performance", "Performance", "cha"],
  ["persuasion", "Persuasion", "cha"],
  ["religion", "Religion", "int"],
  ["sleightOfHand", "Sleight of Hand", "dex"],
  ["stealth", "Stealth", "dex"],
  ["survival", "Survival", "wis"]
];

const CONDITIONS = [
  "Blinded", "Charmed", "Deafened", "Frightened", "Grappled", "Incapacitated",
  "Invisible", "Paralyzed", "Petrified", "Poisoned", "Prone", "Restrained",
  "Stunned", "Unconscious", "Concentrating"
];

const ASI_LEVELS = new Set([4, 8, 12, 16, 19]);

const CLASS_EXTRA_ASI_LEVELS = { fighter: [6, 14], rogue: [10] };

const PREP_SUGGESTIONS = {
  combat: ["cure-wounds", "faerie-fire", "shield", "web", "fireball", "revivify", "haste"],
  exploration: ["detect-magic", "identify", "feather-fall", "longstrider", "rope-trick", "water-breathing", "fly"],
  social: ["disguise-self", "enhance-ability", "detect-magic", "invisibility", "suggestion"],
  dungeon: ["detect-magic", "identify", "cure-wounds", "darkvision", "lesser-restoration", "web"],
  boss: ["cure-wounds", "faerie-fire", "web", "haste", "dispel-magic", "revivify"]
};

function itemCard(index, name, type, weight, rarity, notes) {
  return { index, name, type, weight, rarity, notes };
}

const ITEM_CATALOG = [
  itemCard("longsword", "Longsword", "Weapon", 3, "Martial melee weapon", "1d8 slashing, versatile 1d10."),
  itemCard("dagger", "Dagger", "Weapon", 1, "Simple melee weapon", "1d4 piercing, finesse, light, thrown 20/60."),
  itemCard("light-crossbow", "Light Crossbow", "Weapon", 5, "Simple ranged weapon", "1d8 piercing, ammunition, loading, two-handed."),
  itemCard("club", "Club", "Weapon", 2, "Simple melee weapon", "1d4 bludgeoning, light."),
  itemCard("handaxe", "Handaxe", "Weapon", 2, "Simple melee weapon", "1d6 slashing, light, thrown 20/60."),
  itemCard("javelin", "Javelin", "Weapon", 2, "Simple melee weapon", "1d6 piercing, thrown 30/120."),
  itemCard("mace", "Mace", "Weapon", 4, "Simple melee weapon", "1d6 bludgeoning."),
  itemCard("quarterstaff", "Quarterstaff", "Weapon", 4, "Simple melee weapon", "1d6 bludgeoning, versatile 1d8."),
  itemCard("spear", "Spear", "Weapon", 3, "Simple melee weapon", "1d6 piercing, thrown 20/60, versatile 1d8."),
  itemCard("shortbow", "Shortbow", "Weapon", 2, "Simple ranged weapon", "1d6 piercing, ammunition 80/320, two-handed."),
  itemCard("battleaxe", "Battleaxe", "Weapon", 4, "Martial melee weapon", "1d8 slashing, versatile 1d10."),
  itemCard("greataxe", "Greataxe", "Weapon", 7, "Martial melee weapon", "1d12 slashing, heavy, two-handed."),
  itemCard("greatsword", "Greatsword", "Weapon", 6, "Martial melee weapon", "2d6 slashing, heavy, two-handed."),
  itemCard("rapier", "Rapier", "Weapon", 2, "Martial melee weapon", "1d8 piercing, finesse."),
  itemCard("scimitar", "Scimitar", "Weapon", 3, "Martial melee weapon", "1d6 slashing, finesse, light."),
  itemCard("shortsword", "Shortsword", "Weapon", 2, "Martial melee weapon", "1d6 piercing, finesse, light."),
  itemCard("warhammer", "Warhammer", "Weapon", 2, "Martial melee weapon", "1d8 bludgeoning, versatile 1d10."),
  itemCard("longbow", "Longbow", "Weapon", 2, "Martial ranged weapon", "1d8 piercing, ammunition 150/600, heavy, two-handed."),
  itemCard("hand-crossbow", "Hand Crossbow", "Weapon", 3, "Martial ranged weapon", "1d6 piercing, ammunition 30/120, light, loading."),
  itemCard("arrows", "Arrows (20)", "Ammunition", 1, "Ammunition", "For shortbows and longbows. Recover half after a battle."),
  itemCard("crossbow-bolts", "Crossbow Bolts (20)", "Ammunition", 1.5, "Ammunition", "For crossbows. Recover half after a battle."),
  itemCard("shield", "Shield", "Armor", 6, "Adventuring gear", "+2 AC while wielded."),
  itemCard("leather-armor", "Leather Armor", "Armor", 10, "Light armor", "AC 11 + Dexterity modifier."),
  itemCard("studded-leather", "Studded Leather", "Armor", 13, "Light armor", "AC 12 + Dexterity modifier."),
  itemCard("chain-shirt", "Chain Shirt", "Armor", 20, "Medium armor", "AC 13 + Dex modifier, max 2."),
  itemCard("scale-mail", "Scale Mail", "Armor", 45, "Medium armor", "AC 14 + Dex modifier, max 2. Disadvantage on Stealth."),
  itemCard("breastplate", "Breastplate", "Armor", 20, "Medium armor", "AC 14 + Dex modifier, max 2."),
  itemCard("half-plate", "Half Plate", "Armor", 40, "Medium armor", "AC 15 + Dex modifier, max 2. Disadvantage on Stealth."),
  itemCard("chain-mail", "Chain Mail", "Armor", 55, "Heavy armor", "AC 16. Requires Strength 13. Disadvantage on Stealth."),
  itemCard("plate", "Plate", "Armor", 65, "Heavy armor", "AC 18. Requires Strength 15. Disadvantage on Stealth."),
  itemCard("backpack", "Backpack", "Adventuring Gear", 5, "Container", "Holds gear and supplies."),
  itemCard("rope-hempen", "Rope, Hempen", "Adventuring Gear", 10, "Gear", "50 feet of rope."),
  itemCard("healers-kit", "Healer's Kit", "Adventuring Gear", 3, "Gear", "10 uses. Stabilize a creature without a Medicine check."),
  itemCard("thieves-tools", "Thieves' Tools", "Tool", 1, "Tool", "Pick locks and disarm traps with proficiency."),
  itemCard("component-pouch", "Component Pouch", "Spellcasting Focus", 2, "Gear", "Holds material components without a listed cost."),
  itemCard("arcane-focus", "Arcane Focus", "Spellcasting Focus", 1, "Gear", "Orb, crystal, rod, staff, or wand used in place of components."),
  itemCard("holy-symbol", "Holy Symbol", "Spellcasting Focus", 1, "Gear", "Amulet, emblem, or reliquary used as a divine focus."),
  itemCard("spellbook", "Spellbook", "Adventuring Gear", 3, "Gear", "100 vellum pages for recording wizard spells."),
  itemCard("potion-of-healing", "Potion of Healing", "Potion", 0.5, "Common magic item", "Regain 2d4 + 2 hit points."),
  itemCard("bag-of-holding", "Bag of Holding", "Wondrous Item", 15, "Uncommon magic item", "Extradimensional storage. Contents usually do not count against carried weight here."),
  itemCard("wand-of-magic-missiles", "Wand of Magic Missiles", "Wand", 1, "Uncommon magic item", "7 charges. Cast magic missile; regains charges daily."),
  itemCard("cloak-of-protection", "Cloak of Protection", "Wondrous Item", 1, "Uncommon magic item", "+1 AC and saving throws. Requires attunement.")
];

const SPECIES_PRESETS = [
  ["Dragonborn", 30, "Draconic ancestry grants a breath weapon and resistance to its damage type.", "fire", { str: 2, cha: 1 }],
  ["Hill Dwarf", 25, "Darkvision, dwarven resilience against poison, and +1 HP per level (Dwarven Toughness).", "hammer", { con: 2, wis: 1 }],
  ["Mountain Dwarf", 25, "Darkvision, dwarven resilience, and light and medium armor training.", "mountains", { str: 2, con: 2 }],
  ["High Elf", 30, "Darkvision, keen senses, fey ancestry, trance, elf weapon training, and one wizard cantrip.", "moon-stars", { dex: 2, int: 1 }],
  ["Wood Elf", 35, "Darkvision, keen senses, fey ancestry, trance, elf weapon training, and Mask of the Wild.", "tree-evergreen", { dex: 2, wis: 1 }],
  ["Gnome", 25, "Darkvision and advantage on mental saves against magic.", "gear", { int: 2 }],
  ["Half-Elf", 30, "Darkvision, fey ancestry, and two extra skill proficiencies. +1 to two other abilities of your choice.", "moon", { cha: 2 }],
  ["Half-Orc", 30, "Darkvision, relentless endurance, and savage critical hits.", "barbell", { str: 2, con: 1 }],
  ["Halfling", 25, "Lucky rerolls on 1s, brave, and nimble through larger creatures' spaces.", "clover", { dex: 2 }],
  ["Human", 30, "+1 to every ability score.", "user", { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 }],
  ["Tiefling", 30, "Darkvision, fire resistance, and infernal legacy spells.", "flame", { cha: 2, int: 1 }]
];

// 2014 PHB starting proficiencies: [armor, weapons, tools, number of class skill choices].
const CLASS_PROFICIENCIES = {
  artificer: ["Light armor, medium armor, shields", "Simple weapons", "Thieves' tools, tinker's tools, one artisan's tools", 2],
  barbarian: ["Light armor, medium armor, shields", "Simple weapons, martial weapons", "", 2],
  bard: ["Light armor", "Simple weapons, hand crossbows, longswords, rapiers, shortswords", "Three musical instruments", 3],
  bloodhunter: ["Light armor, medium armor, shields", "Simple weapons, martial weapons", "Alchemist's supplies", 3],
  cleric: ["Light armor, medium armor, shields", "Simple weapons", "", 2],
  druid: ["Light armor, medium armor, shields (nonmetal)", "Clubs, daggers, darts, javelins, maces, quarterstaffs, scimitars, sickles, slings, spears", "Herbalism kit", 2],
  fighter: ["All armor, shields", "Simple weapons, martial weapons", "", 2],
  monk: ["", "Simple weapons, shortswords", "One artisan's tools or musical instrument", 2],
  paladin: ["All armor, shields", "Simple weapons, martial weapons", "", 2],
  ranger: ["Light armor, medium armor, shields", "Simple weapons, martial weapons", "", 3],
  rogue: ["Light armor", "Simple weapons, hand crossbows, longswords, rapiers, shortswords", "Thieves' tools", 4],
  sorcerer: ["", "Daggers, darts, slings, quarterstaffs, light crossbows", "", 2],
  warlock: ["Light armor", "Simple weapons", "", 2],
  wizard: ["", "Daggers, darts, slings, quarterstaffs, light crossbows", "", 2]
};

// Highest-priority ability first, so the Standard Array lands where each class needs it.
const CLASS_ABILITY_PRIORITY = {
  artificer: ["int", "con", "dex", "wis", "str", "cha"],
  barbarian: ["str", "con", "dex", "wis", "cha", "int"],
  bard: ["cha", "dex", "con", "wis", "int", "str"],
  bloodhunter: ["dex", "int", "con", "wis", "str", "cha"],
  cleric: ["wis", "con", "str", "dex", "cha", "int"],
  druid: ["wis", "con", "dex", "int", "cha", "str"],
  fighter: ["str", "con", "dex", "wis", "int", "cha"],
  monk: ["dex", "wis", "con", "str", "int", "cha"],
  paladin: ["str", "cha", "con", "wis", "dex", "int"],
  ranger: ["dex", "wis", "con", "str", "int", "cha"],
  rogue: ["dex", "con", "int", "wis", "cha", "str"],
  sorcerer: ["cha", "con", "dex", "wis", "int", "str"],
  warlock: ["cha", "con", "dex", "wis", "int", "str"],
  wizard: ["int", "con", "dex", "wis", "cha", "str"]
};

// What each species grants beyond ability scores (2014 PHB).
const DWARF_GRANTS = { languages: ["Common", "Dwarvish"], weapons: ["Battleaxe, handaxe, light hammer, warhammer"], tools: ["Smith's tools, brewer's supplies, or mason's tools (choose one)"] };
const ELF_GRANTS = { languages: ["Common", "Elvish"], skills: ["perception"], weapons: ["Longsword, shortsword, shortbow, longbow"] };
const SPECIES_GRANTS = {
  Dragonborn: { languages: ["Common", "Draconic"] },
  Dwarf: DWARF_GRANTS,
  "Hill Dwarf": { ...DWARF_GRANTS, hpPerLevel: 1 },
  "Mountain Dwarf": { ...DWARF_GRANTS, armor: ["Light armor, medium armor"] },
  Elf: { languages: ["Common", "Elvish"], skills: ["perception"] },
  "High Elf": ELF_GRANTS,
  "Wood Elf": ELF_GRANTS,
  Gnome: { languages: ["Common", "Gnomish"] },
  "Half-Elf": { languages: ["Common", "Elvish", "one extra language"] },
  "Half-Orc": { languages: ["Common", "Orc"], skills: ["intimidation"] },
  Halfling: { languages: ["Common", "Halfling"] },
  Human: { languages: ["Common", "one extra language"] },
  Tiefling: {
    languages: ["Common", "Infernal"],
    cantrips: ["thaumaturgy"],
    feature: "Infernal Legacy: Thaumaturgy; Hellish Rebuke as a 2nd-level spell once per long rest from 3rd level; Darkness once per long rest from 5th level (CHA)."
  }
};

// Skills each class may choose from at 1st level (2014 PHB); "any" for bards.
const CLASS_SKILL_CHOICES = {
  artificer: ["arcana", "history", "investigation", "medicine", "nature", "perception", "sleightOfHand"],
  barbarian: ["animalHandling", "athletics", "intimidation", "nature", "perception", "survival"],
  bard: "any",
  bloodhunter: ["acrobatics", "arcana", "athletics", "history", "insight", "investigation", "religion", "survival"],
  cleric: ["history", "insight", "medicine", "persuasion", "religion"],
  druid: ["arcana", "animalHandling", "insight", "medicine", "nature", "perception", "religion", "survival"],
  fighter: ["acrobatics", "animalHandling", "athletics", "history", "insight", "intimidation", "perception", "survival"],
  monk: ["acrobatics", "athletics", "history", "insight", "religion", "stealth"],
  paladin: ["athletics", "insight", "intimidation", "medicine", "persuasion", "religion"],
  ranger: ["animalHandling", "athletics", "insight", "investigation", "nature", "perception", "stealth", "survival"],
  rogue: ["acrobatics", "athletics", "deception", "insight", "intimidation", "investigation", "perception", "performance", "persuasion", "sleightOfHand", "stealth"],
  sorcerer: ["arcana", "deception", "insight", "intimidation", "persuasion", "religion"],
  warlock: ["arcana", "deception", "history", "intimidation", "investigation", "nature", "religion"],
  wizard: ["arcana", "history", "insight", "investigation", "medicine", "religion"]
};

// Subclass grants beyond spells: extra training and limited-use features with their own trackers.
const SUBCLASS_EXTRAS = {
  "battle-master": { trackers: level => level >= 3 ? [["Superiority Dice", level >= 15 ? 6 : level >= 7 ? 5 : 4, "short"]] : [] },
  hexblade: { armor: ["Medium armor, shields"], weapons: ["Martial weapons"], trackers: () => [["Hexblade's Curse", 1, "short"]] },
  "eldritch-knight": {},
  champion: {},
  "war-magic": {},
  "life": { armor: ["Heavy armor"] },
  "war": { armor: ["Heavy armor"], weapons: ["Martial weapons"] },
  "tempest": { armor: ["Heavy armor"], weapons: ["Martial weapons"] },
  "forge": { armor: ["Heavy armor"] },
  "valor": { armor: ["Medium armor, shields"], weapons: ["Martial weapons"] },
  "swords": { armor: ["Medium armor"], weapons: ["Scimitar"] },
  "bladesinging": { armor: ["Light armor"], weapons: ["One one-handed melee weapon"] }
};

// Level at which each class picks its subclass.
const SUBCLASS_LEVEL = { cleric: 1, sorcerer: 1, warlock: 1, druid: 2, wizard: 2 };

const CLASS_GLYPHS = {
  artificer: "wrench", barbarian: "axe", bard: "music-notes", bloodhunter: "drop", cleric: "hands-praying", druid: "leaf",
  fighter: "sword", monk: "hand-fist", paladin: "shield", ranger: "crosshair", rogue: "knife",
  sorcerer: "sparkle", warlock: "eye", wizard: "book-open"
};

const CLASS_SAVES = {
  artificer: ["con", "int"], barbarian: ["str", "con"], bard: ["dex", "cha"], bloodhunter: ["dex", "int"],
  cleric: ["wis", "cha"], druid: ["int", "wis"], fighter: ["str", "con"],
  monk: ["str", "dex"], paladin: ["wis", "cha"], ranger: ["str", "dex"],
  rogue: ["dex", "int"], sorcerer: ["con", "cha"], warlock: ["wis", "cha"],
  wizard: ["int", "wis"]
};

const BACKGROUND_PRESETS = [
  ["Acolyte", "Insight, Religion", "Two languages", "Shelter of the Faithful", "church"],
  ["Criminal", "Deception, Stealth", "Gaming set, thieves' tools", "Criminal Contact", "key"],
  ["Folk Hero", "Animal Handling, Survival", "Artisan's tools, vehicles", "Rustic Hospitality", "plant"],
  ["Noble", "History, Persuasion", "Gaming set, one language", "Position of Privilege", "crown"],
  ["Sage", "Arcana, History", "Two languages", "Researcher", "scroll"],
  ["Soldier", "Athletics, Intimidation", "Gaming set, vehicles", "Military Rank", "medal"]
];

const PERSONALITY_PROMPTS = {
  traits: [
    "I quote old stories when making hard choices.",
    "I am suspicious until someone proves useful or kind.",
    "I treat every dungeon like a puzzle box.",
    "I keep trophies from places that changed me."
  ],
  ideals: ["Knowledge", "Freedom", "Honor", "Power", "Community", "Discovery"],
  bonds: [
    "A mentor vanished while chasing the same mystery I now follow.",
    "My family name opens some doors and closes others.",
    "I owe my life to someone I may never see again.",
    "A relic in my pack belongs somewhere dangerous."
  ],
  flaws: [
    "I over-plan when swift action would be wiser.",
    "I cannot resist forbidden lore.",
    "I assume I am the one who must fix everything.",
    "I hide fear behind sarcasm."
  ]
};

const FEAT_PRESETS = [
  "Ability Score Improvement", "Alert", "Athlete", "Crossbow Expert", "Defensive Duelist",
  "Dual Wielder", "Dungeon Delver", "Durable", "Elemental Adept", "Great Weapon Master",
  "Healer", "Inspiring Leader", "Lucky", "Magic Initiate", "Mobile", "Resilient",
  "Sentinel", "Sharpshooter", "Skilled", "Spell Sniper", "Tough", "War Caster"
];

const TAB_DEFS = [
  ["actions", "Combat"],
  ["spells", "Spells"],
  ["inventory", "Inventory"],
  ["rp", "Roleplay"],
  ["features", "Features"],
  ["builder", "Builder"],
  ["party", "Party"],
  ["campaign", "Campaign"]
];

function rule(category, title, body) {
  return { category, title, body };
}

const RULES_REFERENCE = [
  rule("core", "Ability Checks", "Roll d20 + ability modifier + proficiency if a relevant proficiency applies. The DM sets the DC."),
  rule("core", "Saving Throws", "Roll d20 + ability modifier + proficiency if proficient in that saving throw."),
  rule("core", "Concentration", "Taking damage while concentrating requires a Constitution save. DC is 10 or half the damage taken, whichever is higher."),
  rule("action", "Attack", "Make one melee or ranged attack. Extra Attack and similar features can add attacks to this action."),
  rule("action", "Cast a Spell", "Cast a spell with a casting time of 1 action. Bonus action spell limits may apply."),
  rule("action", "Dash", "Gain extra movement equal to your speed for the current turn."),
  rule("action", "Disengage", "Your movement does not provoke opportunity attacks for the rest of the turn."),
  rule("action", "Dodge", "Attack rolls against you have disadvantage until your next turn if you can see the attacker, and you have advantage on Dexterity saves."),
  rule("action", "Help", "Give an ally advantage on an ability check, or help with an attack against a creature within 5 feet of you."),
  rule("action", "Hide", "Make a Dexterity (Stealth) check when conditions allow hiding."),
  rule("action", "Ready", "Choose a trigger and action. Use your reaction when the trigger occurs."),
  rule("combat", "Cover", "Half cover (low wall, another creature): +2 AC and Dexterity saves. Three-quarters cover (arrow slit, thick tree): +5 AC and Dexterity saves. Total cover: can't be targeted directly by attacks or spells."),
  rule("combat", "Death Saving Throws", "At 0 HP, roll a d20 at the start of each turn: 10+ is a success, 9 or lower a failure. Three successes: stable. Three failures: dead. Natural 20: regain 1 HP. Natural 1: two failures. Taking damage at 0 HP is one failure (two on a critical hit). Any healing resets the count."),
  rule("combat", "Opportunity Attacks", "When a hostile creature you can see leaves your reach, you can use your reaction to make one melee attack against it. Disengaging, teleporting, or being moved without using movement doesn't provoke."),
  rule("combat", "Two-Weapon Fighting", "When you attack with a light melee weapon in one hand, you can use a bonus action to attack with a different light melee weapon in the other. Don't add your ability modifier to the bonus attack's damage unless it's negative."),
  rule("combat", "Grappling and Shoving", "Replace one attack: Athletics vs the target's Athletics or Acrobatics. Grapple sets its speed to 0; shove knocks it prone or pushes it 5 feet. The target can be at most one size larger than you."),
  rule("combat", "Critical Hits", "A natural 20 on an attack roll always hits and is a critical: roll all of the attack's damage dice twice, then add modifiers once. A natural 1 always misses."),
  rule("combat", "Surprise", "A creature that doesn't notice a threat at the start of combat is surprised: it can't move or take actions on its first turn and can't take reactions until that turn ends."),
  rule("rest", "Short Rest", "At least 1 hour. You can spend Hit Dice to heal. Short-rest resources refresh."),
  rule("rest", "Long Rest", "At least 8 hours. Restores HP, spell slots, many resources, and reduces exhaustion by 1 if conditions are met."),
  rule("equipment", "Carrying Capacity", "Your carrying capacity is Strength score x 15 pounds. This app flags heavy load at two-thirds capacity."),
  rule("equipment", "Attunement", "Most characters can attune to up to 3 magic items at a time."),
  rule("condition", "Deafened", "Can't hear and automatically fails any ability check that requires hearing."),
  rule("condition", "Petrified", "Turned to stone: incapacitated, can't move or speak, unaware of surroundings. Attacks against it have advantage; it fails Strength and Dexterity saves and resists all damage."),
  rule("condition", "Unconscious", "Incapacitated, can't move or speak, unaware of surroundings; drops what it holds and falls prone. Fails Strength and Dexterity saves. Attacks against it have advantage, and hits from within 5 feet are critical."),
  rule("condition", "Exhaustion", "Six levels: 1 disadvantage on checks, 2 speed halved, 3 disadvantage on attacks and saves, 4 HP maximum halved, 5 speed 0, 6 death. A long rest with food and drink removes one level."),
  rule("condition", "Blinded", "A blinded creature cannot see and automatically fails ability checks requiring sight. Attacks against it have advantage, and its attacks have disadvantage."),
  rule("condition", "Charmed", "A charmed creature cannot attack the charmer or target it with harmful abilities, and the charmer has advantage on social checks against it."),
  rule("condition", "Frightened", "A frightened creature has disadvantage on ability checks and attacks while the source of fear is in line of sight, and cannot willingly move closer."),
  rule("condition", "Grappled", "A grappled creature's speed becomes 0. The condition ends if the grappler is incapacitated or moved away."),
  rule("condition", "Incapacitated", "An incapacitated creature cannot take actions or reactions."),
  rule("condition", "Invisible", "An invisible creature is impossible to see without special senses. Its attacks have advantage, and attacks against it have disadvantage."),
  rule("condition", "Paralyzed", "A paralyzed creature is incapacitated, cannot move or speak, fails Strength and Dexterity saves, and nearby hits are critical hits."),
  rule("condition", "Poisoned", "A poisoned creature has disadvantage on attack rolls and ability checks."),
  rule("condition", "Prone", "A prone creature's only movement option is crawling unless it stands. Melee attacks within 5 feet have advantage; ranged attacks have disadvantage."),
  rule("condition", "Restrained", "Speed becomes 0, attacks against the creature have advantage, its attacks have disadvantage, and it has disadvantage on Dexterity saves."),
  rule("condition", "Stunned", "A stunned creature is incapacitated, cannot move, speaks falteringly, fails Strength and Dexterity saves, and attacks against it have advantage."),
  rule("class", "Artificer Infusions", "Track known infusions, infused items, active items, and whether an infusion is replaced on level-up."),
  rule("class", "Warlock Invocations", "Track chosen invocations, prerequisites, passive benefits, and limited-use invocations."),
  rule("class", "Metamagic", "Track sorcery point costs and which spells or situations pair well with each option."),
  rule("class", "Wild Shape", "Track uses, CR limits, movement restrictions, beast forms, and form HP notes.")
];

const FULL_CASTER_SLOTS = {
  1: [2], 2: [3], 3: [4, 2], 4: [4, 3], 5: [4, 3, 2],
  6: [4, 3, 3], 7: [4, 3, 3, 1], 8: [4, 3, 3, 2],
  9: [4, 3, 3, 3, 1], 10: [4, 3, 3, 3, 2], 11: [4, 3, 3, 3, 2, 1],
  12: [4, 3, 3, 3, 2, 1], 13: [4, 3, 3, 3, 2, 1, 1],
  14: [4, 3, 3, 3, 2, 1, 1], 15: [4, 3, 3, 3, 2, 1, 1, 1],
  16: [4, 3, 3, 3, 2, 1, 1, 1], 17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [4, 3, 3, 3, 3, 1, 1, 1, 1], 19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
  20: [4, 3, 3, 3, 3, 2, 2, 1, 1]
};

const WARLOCK_SLOTS = {
  1: { slots: 1, level: 1 }, 2: { slots: 2, level: 1 }, 3: { slots: 2, level: 2 },
  4: { slots: 2, level: 2 }, 5: { slots: 2, level: 3 }, 6: { slots: 2, level: 3 },
  7: { slots: 2, level: 4 }, 8: { slots: 2, level: 4 }, 9: { slots: 2, level: 5 },
  10: { slots: 2, level: 5 }, 11: { slots: 3, level: 5 }, 12: { slots: 3, level: 5 },
  13: { slots: 3, level: 5 }, 14: { slots: 3, level: 5 }, 15: { slots: 3, level: 5 },
  16: { slots: 3, level: 5 }, 17: { slots: 4, level: 5 }, 18: { slots: 4, level: 5 },
  19: { slots: 4, level: 5 }, 20: { slots: 4, level: 5 }
};

const ARTIFICER_SPELLS = new Set([
  "acid-splash", "dancing-lights", "fire-bolt", "guidance", "light", "mage-hand", "mending",
  "message", "poison-spray", "prestidigitation", "ray-of-frost", "resistance", "shocking-grasp",
  "spare-the-dying", "thorn-whip", "booming-blade", "green-flame-blade", "create-bonfire",
  "frostbite", "lightning-lure", "sword-burst", "magic-stone", "thunderclap",
  "absorb-elements", "catapult", "snare",
  "alarm", "cure-wounds", "detect-magic", "disguise-self", "expeditious-retreat", "faerie-fire",
  "false-life", "feather-fall", "grease", "identify", "jump", "longstrider",
  "purify-food-and-drink", "sanctuary",
  "aid", "alter-self", "arcane-lock", "blur", "continual-flame", "darkvision", "enhance-ability",
  "enlarge-reduce", "heat-metal", "invisibility", "lesser-restoration", "levitate", "magic-mouth",
  "magic-weapon", "protection-from-poison", "rope-trick", "see-invisibility", "spider-climb", "web",
  "blink", "create-food-and-water", "dispel-magic", "fly", "glyph-of-warding", "haste",
  "protection-from-energy", "revivify", "water-breathing", "water-walk",
  "arcane-eye", "fabricate", "freedom-of-movement", "secret-chest", "secret-chest",
  "faithful-hound", "private-sanctum", "resilient-sphere", "stone-shape", "stoneskin",
  "animate-objects", "arcane-hand", "arcane-hand", "creation", "greater-restoration", "wall-of-stone"
]);

const SUBCLASS_SPELLS = {
  armorer: { 3: ["magic-missile", "thunderwave"], 5: ["mirror-image", "shatter"], 9: ["hypnotic-pattern", "lightning-bolt"], 13: ["fire-shield", "greater-invisibility"], 17: ["passwall", "wall-of-force"] },
  alchemist: { 3: ["healing-word", "ray-of-sickness"], 5: ["flaming-sphere", "acid-arrow"], 9: ["gaseous-form", "mass-healing-word"], 13: ["blight", "death-ward"], 17: ["cloudkill", "raise-dead"] },
  artillerist: { 3: ["shield", "thunderwave"], 5: ["scorching-ray", "shatter"], 9: ["fireball", "wind-wall"], 13: ["ice-storm", "wall-of-fire"], 17: ["cone-of-cold", "wall-of-force"] },
  "battle-smith": { 3: ["heroism", "shield"], 5: ["branding-smite", "warding-bond"], 9: ["aura-of-vitality", "conjure-barrage"], 13: ["aura-of-purity", "fire-shield"], 17: ["banishing-smite", "mass-cure-wounds"] },
  life: { 1: ["bless", "cure-wounds"], 3: ["lesser-restoration", "spiritual-weapon"], 5: ["beacon-of-hope", "revivify"], 7: ["death-ward", "guardian-of-faith"], 9: ["mass-cure-wounds", "raise-dead"] },
  devotion: { 3: ["protection-from-evil-and-good", "sanctuary"], 5: ["lesser-restoration", "zone-of-truth"], 9: ["beacon-of-hope", "dispel-magic"], 13: ["freedom-of-movement", "guardian-of-faith"], 17: ["commune", "flame-strike"] },
  ancients: { 3: ["ensnaring-strike", "speak-with-animals"], 5: ["misty-step", "moonbeam"], 9: ["plant-growth", "protection-from-energy"], 13: ["ice-storm", "stoneskin"], 17: ["commune-with-nature", "tree-stride"] },
  vengeance: { 3: ["bane", "hunters-mark"], 5: ["hold-person", "misty-step"], 9: ["haste", "protection-from-energy"], 13: ["banishment", "dimension-door"], 17: ["hold-monster", "scrying"] },
  tempest: { 1: ["fog-cloud", "thunderwave"], 3: ["gust-of-wind", "shatter"], 5: ["call-lightning", "sleet-storm"], 7: ["control-water", "ice-storm"], 9: ["destructive-wave", "insect-plague"] },
  light: { 1: ["burning-hands", "faerie-fire"], 3: ["flaming-sphere", "scorching-ray"], 5: ["daylight", "fireball"], 7: ["guardian-of-faith", "wall-of-fire"], 9: ["flame-strike", "scrying"] },
  war: { 1: ["divine-favor", "shield-of-faith"], 3: ["magic-weapon", "spiritual-weapon"], 5: ["crusaders-mantle", "spirit-guardians"], 7: ["freedom-of-movement", "stoneskin"], 9: ["flame-strike", "hold-monster"] },
  trickery: { 1: ["charm-person", "disguise-self"], 3: ["mirror-image", "pass-without-trace"], 5: ["blink", "dispel-magic"], 7: ["dimension-door", "polymorph"], 9: ["dominate-person", "modify-memory"] },
  knowledge: { 1: ["command", "identify"], 3: ["augury", "suggestion"], 5: ["nondetection", "speak-with-dead"], 7: ["arcane-eye", "confusion"], 9: ["legend-lore", "scrying"] },
  nature: { 1: ["animal-friendship", "speak-with-animals"], 3: ["barkskin", "spike-growth"], 5: ["plant-growth", "wind-wall"], 7: ["dominate-beast", "grasping-vine"], 9: ["insect-plague", "tree-stride"] },
  death: { 1: ["false-life", "ray-of-sickness"], 3: ["blindness-deafness", "ray-of-enfeeblement"], 5: ["animate-dead", "vampiric-touch"], 7: ["blight", "death-ward"], 9: ["antilife-shell", "cloudkill"] },
  arcana: { 1: ["detect-magic", "magic-missile"], 3: ["magic-weapon", "arcanists-magic-aura"], 5: ["dispel-magic", "magic-circle"], 7: ["arcane-eye", "secret-chest"], 9: ["planar-binding", "teleportation-circle"] },
  forge: { 1: ["identify", "searing-smite"], 3: ["heat-metal", "magic-weapon"], 5: ["elemental-weapon", "protection-from-energy"], 7: ["fabricate", "wall-of-fire"], 9: ["animate-objects", "creation"] },
  grave: { 1: ["bane", "false-life"], 3: ["gentle-repose", "ray-of-enfeeblement"], 5: ["revivify", "vampiric-touch"], 7: ["blight", "death-ward"], 9: ["antilife-shell", "raise-dead"] },
  order: { 1: ["command", "heroism"], 3: ["hold-person", "zone-of-truth"], 5: ["mass-healing-word", "slow"], 7: ["compulsion", "locate-creature"], 9: ["commune", "dominate-person"] },
  peace: { 1: ["heroism", "sanctuary"], 3: ["aid", "warding-bond"], 5: ["beacon-of-hope", "sending"], 7: ["aura-of-purity", "resilient-sphere"], 9: ["greater-restoration", "telepathic-bond"] },
  twilight: { 1: ["faerie-fire", "sleep"], 3: ["moonbeam", "see-invisibility"], 5: ["aura-of-vitality", "tiny-hut"], 7: ["aura-of-life", "greater-invisibility"], 9: ["circle-of-power", "mislead"] },
  conquest: { 3: ["armor-of-agathys", "command"], 5: ["hold-person", "spiritual-weapon"], 9: ["bestow-curse", "fear"], 13: ["dominate-beast", "stoneskin"], 17: ["cloudkill", "dominate-person"] },
  redemption: { 3: ["sanctuary", "sleep"], 5: ["calm-emotions", "hold-person"], 9: ["counterspell", "hypnotic-pattern"], 13: ["resilient-sphere", "stoneskin"], 17: ["hold-monster", "wall-of-force"] },
  glory: { 3: ["guiding-bolt", "heroism"], 5: ["enhance-ability", "magic-weapon"], 9: ["haste", "protection-from-energy"], 13: ["compulsion", "freedom-of-movement"], 17: ["commune", "flame-strike"] },
  watchers: { 3: ["alarm", "detect-magic"], 5: ["moonbeam", "see-invisibility"], 9: ["counterspell", "nondetection"], 13: ["aura-of-purity", "banishment"], 17: ["hold-monster", "scrying"] },
  crown: { 3: ["command", "compelled-duel"], 5: ["warding-bond", "zone-of-truth"], 9: ["aura-of-vitality", "spirit-guardians"], 13: ["banishment", "guardian-of-faith"], 17: ["circle-of-power", "geas"] },
  oathbreaker: { 3: ["hellish-rebuke", "inflict-wounds"], 5: ["crown-of-madness", "darkness"], 9: ["animate-dead", "bestow-curse"], 13: ["blight", "confusion"], 17: ["contagion", "dominate-person"] },
  wildfire: { 2: ["burning-hands", "cure-wounds"], 3: ["flaming-sphere", "scorching-ray"], 5: ["plant-growth", "revivify"], 7: ["aura-of-life", "fire-shield"], 9: ["flame-strike", "mass-cure-wounds"] },
  spores: { 2: ["chill-touch"], 3: ["blindness-deafness", "gentle-repose"], 5: ["animate-dead", "gaseous-form"], 7: ["blight", "confusion"], 9: ["cloudkill", "contagion"] },
  "aberrant-mind": { 1: ["arms-of-hadar", "dissonant-whispers", "mind-sliver"], 3: ["calm-emotions", "detect-thoughts"], 5: ["hunger-of-hadar", "sending"], 7: ["black-tentacles", "telekinesis"], 9: ["telepathic-bond"] },
  "clockwork-soul": { 1: ["alarm", "protection-from-evil-and-good"], 3: ["aid", "lesser-restoration"], 5: ["dispel-magic", "protection-from-energy"], 7: ["freedom-of-movement", "fabricate"], 9: ["greater-restoration", "wall-of-force"] },
  "gloom-stalker": { 3: ["disguise-self"], 5: ["rope-trick"], 9: ["fear"], 13: ["greater-invisibility"], 17: ["seeming"] },
  "horizon-walker": { 3: ["protection-from-evil-and-good"], 5: ["misty-step"], 9: ["haste"], 13: ["banishment"], 17: ["teleportation-circle"] },
  "monster-slayer": { 3: ["protection-from-evil-and-good"], 5: ["zone-of-truth"], 9: ["magic-circle"], 13: ["banishment"], 17: ["hold-monster"] },
  "fey-wanderer": { 3: ["charm-person"], 5: ["misty-step"], 9: ["dispel-magic"], 13: ["dimension-door"], 17: ["mislead"] },
  swarmkeeper: { 3: ["faerie-fire"], 5: ["web"], 9: ["gaseous-form"], 13: ["arcane-eye"], 17: ["insect-plague"] },
  "arcane-trickster": { 3: ["mage-hand"] }
};

// Warlock patron lists expand the spells a warlock MAY learn — they are not auto-known like domain/oath/specialist spells.
const EXPANDED_SUBCLASS_SPELLS = {
  fiend: ["burning-hands", "command", "blindness-deafness", "scorching-ray", "fireball", "stinking-cloud", "fire-shield", "wall-of-fire", "flame-strike", "hallow"],
  archfey: ["faerie-fire", "sleep", "calm-emotions", "phantasmal-force", "blink", "plant-growth", "dominate-beast", "greater-invisibility", "dominate-person", "seeming"],
  "great-old-one": ["dissonant-whispers", "hideous-laughter", "detect-thoughts", "phantasmal-force", "clairvoyance", "sending", "dominate-beast", "black-tentacles", "dominate-person", "telekinesis"],
  celestial: ["cure-wounds", "guiding-bolt", "flaming-sphere", "lesser-restoration", "daylight", "revivify", "guardian-of-faith", "wall-of-fire", "flame-strike", "greater-restoration"],
  hexblade: ["shield", "wrathful-smite", "blur", "branding-smite", "blink", "elemental-weapon", "phantasmal-killer", "staggering-smite", "banishing-smite", "cone-of-cold"],
  fathomless: ["create-or-destroy-water", "thunderwave", "gust-of-wind", "silence", "lightning-bolt", "sleet-storm", "control-water", "watery-sphere", "arcane-hand", "cone-of-cold"],
  genie: ["detect-evil-and-good", "phantasmal-force", "create-food-and-water", "phantasmal-killer", "creation", "wish"],
  undying: ["false-life", "ray-of-sickness", "blindness-deafness", "silence", "feign-death", "speak-with-dead", "aura-of-life", "death-ward", "contagion", "legend-lore"],
  undead: ["bane", "false-life", "blindness-deafness", "phantasmal-force", "phantom-steed", "speak-with-dead", "death-ward", "greater-invisibility", "antilife-shell", "cloudkill"]
};

function spell(index, name, level, classes) {
  return { index, name, level, classes };
}

const FALLBACK_SPELLS = [
  spell("acid-splash", "Acid Splash", 0, ["sorcerer", "wizard", "artificer"]),
  spell("cure-wounds", "Cure Wounds", 1, ["bard", "cleric", "druid", "paladin", "ranger", "artificer"]),
  spell("detect-magic", "Detect Magic", 1, ["bard", "cleric", "druid", "paladin", "ranger", "sorcerer", "wizard", "artificer"]),
  spell("faerie-fire", "Faerie Fire", 1, ["bard", "druid", "artificer"]),
  spell("fireball", "Fireball", 3, ["sorcerer", "wizard"]),
  spell("grease", "Grease", 1, ["wizard", "artificer"]),
  spell("identify", "Identify", 1, ["bard", "wizard", "artificer"]),
  spell("mending", "Mending", 0, ["bard", "cleric", "druid", "sorcerer", "wizard", "artificer"]),
  spell("message", "Message", 0, ["bard", "sorcerer", "wizard", "artificer"]),
  spell("prestidigitation", "Prestidigitation", 0, ["bard", "sorcerer", "warlock", "wizard", "artificer"]),
  spell("ray-of-frost", "Ray of Frost", 0, ["sorcerer", "wizard", "artificer"]),
  spell("revivify", "Revivify", 3, ["cleric", "paladin", "artificer"]),
  spell("sanctuary", "Sanctuary", 1, ["cleric", "artificer"]),
  spell("shocking-grasp", "Shocking Grasp", 0, ["sorcerer", "wizard", "artificer"]),
  spell("web", "Web", 2, ["sorcerer", "wizard", "artificer"])
];

function localSpell(index, name, level, classIds, castingTime, range, components, duration, concentration, summary) {
  return {
    index, name, level,
    classes: classIds.map(id => ({ index: id, name: id.charAt(0).toUpperCase() + id.slice(1) })),
    casting_time: castingTime, range, components, duration, concentration,
    desc: [summary],
    local: true
  };
}

const LOCAL_SPELLS = [
  localSpell("aura-of-life", "Aura of Life", 4, ["paladin"], "1 action", "Self (30-foot radius)", ["V"], "Concentration, up to 10 minutes", true,
    "A life-preserving aura moves with you. Nonhostile creatures in it, including you, resist necrotic damage and can't have their hit point maximum reduced. A nonhostile creature at 0 hit points that starts its turn in the aura regains 1 hit point."),
  localSpell("circle-of-power", "Circle of Power", 5, ["paladin"], "1 action", "Self (30-foot radius)", ["V"], "Concentration, up to 10 minutes", true,
    "Divine energy radiates from you. You and friendly creatures in the aura have advantage on saving throws against spells and other magical effects, and take no damage instead of half on a successful save."),
  localSpell("compelled-duel", "Compelled Duel", 1, ["paladin"], "1 bonus action", "30 feet", ["V"], "Concentration, up to 1 minute", true,
    "A creature you can see makes a Wisdom save or is compelled to duel you: it has disadvantage on attacks against creatures other than you, and must make a Wisdom save to move more than 30 feet away from you."),
  localSpell("crusaders-mantle", "Crusader's Mantle", 3, ["paladin"], "1 action", "Self (30-foot radius)", ["V"], "Concentration, up to 1 minute", true,
    "Holy power radiates from you. Each nonhostile creature in the aura, including you, deals an extra 1d4 radiant damage when it hits with a weapon attack."),
  localSpell("elemental-weapon", "Elemental Weapon", 3, ["paladin"], "1 action", "Touch", ["V", "S"], "Concentration, up to 1 hour", true,
    "A nonmagical weapon becomes a +1 magic weapon and deals an extra 1d4 damage of a type you choose (acid, cold, fire, lightning, or thunder) on a hit. With a 5th- or 6th-level slot it is +2 and 2d4; 7th level or higher, +3 and 3d4."),
  localSpell("feign-death", "Feign Death", 3, ["bard", "cleric", "druid", "wizard"], "1 action (ritual)", "Touch", ["V", "S", "M"], "1 hour", false,
    "A willing creature appears dead to all outward inspection. It is blinded and incapacitated, its speed drops to 0, it resists all damage except psychic, and diseases and poisons have no effect on it until the spell ends."),
  localSpell("grasping-vine", "Grasping Vine", 4, ["druid", "ranger"], "1 bonus action", "30 feet", ["V", "S"], "Concentration, up to 1 minute", true,
    "A vine sprouts from a surface you can see. When you cast it, and as a bonus action on later turns, the vine lashes at a creature within 30 feet of it: Dexterity save or be pulled 20 feet toward the vine."),
  localSpell("hunger-of-hadar", "Hunger of Hadar", 3, ["warlock"], "1 action", "150 feet", ["V", "S", "M"], "Concentration, up to 1 minute", true,
    "A 20-foot-radius sphere of blackness and bitter cold. Creatures fully inside are blinded. A creature that starts its turn there takes 2d6 cold damage; one that ends its turn there makes a Dexterity save or takes 2d6 acid damage."),
  localSpell("staggering-smite", "Staggering Smite", 4, ["paladin"], "1 bonus action", "Self", ["V"], "Concentration, up to 1 minute", true,
    "Your next melee weapon hit deals an extra 4d6 psychic damage, and the target makes a Wisdom save or has disadvantage on attack rolls and ability checks and can't take reactions until the end of its next turn."),
  localSpell("watery-sphere", "Watery Sphere", 4, ["druid", "sorcerer", "wizard"], "1 action", "90 feet", ["V", "S", "M"], "Concentration, up to 1 minute", true,
    "A 5-foot-radius sphere of water. Each creature in its space makes a Strength save or is restrained inside it. As an action you can move the sphere up to 30 feet, carrying restrained creatures with it."),
  localSpell("booming-blade", "Booming Blade", 0, ["artificer", "sorcerer", "warlock", "wizard"], "1 action", "Self (5-foot radius)", ["S", "M"], "1 round", false,
    "Make a melee attack with a weapon as part of the cast. On a hit the target takes normal weapon damage and hums with stored thunder; if it willingly moves before your next turn, it takes 1d8 thunder damage. The stored damage, and from 5th level a bonus thunder die on the hit itself, scale as you level."),
  localSpell("green-flame-blade", "Green-Flame Blade", 0, ["artificer", "sorcerer", "warlock", "wizard"], "1 action", "Self (5-foot radius)", ["S", "M"], "Instantaneous", false,
    "Make a melee attack with a weapon as part of the cast. On a hit, green fire leaps from the target to a different creature you can see within 5 feet of it, dealing fire damage equal to your spellcasting modifier. The leap damage, and from 5th level a bonus fire die on the hit, scale as you level."),
  localSpell("create-bonfire", "Create Bonfire", 0, ["artificer", "druid", "sorcerer", "warlock", "wizard"], "1 action", "60 feet", ["V", "S"], "Concentration, up to 1 minute", true,
    "Conjure a bonfire filling a 5-foot cube. A creature in its space when it appears, or that enters it or ends its turn there, makes a Dexterity save or takes 1d8 fire damage (scales at 5th/11th/17th level)."),
  localSpell("frostbite", "Frostbite", 0, ["artificer", "druid", "sorcerer", "warlock", "wizard"], "1 action", "60 feet", ["V", "S"], "Instantaneous", false,
    "Target makes a Constitution save or takes 1d6 cold damage and has disadvantage on the next weapon attack it makes before the end of its next turn (damage scales at 5th/11th/17th)."),
  localSpell("lightning-lure", "Lightning Lure", 0, ["artificer", "sorcerer", "warlock", "wizard"], "1 action", "Self (15-foot radius)", ["V"], "Instantaneous", false,
    "A lash of lightning strikes one creature within 15 feet: Strength save or be pulled up to 10 feet straight toward you, taking 1d8 lightning damage if it ends the pull within 5 feet of you (damage scales)."),
  localSpell("sword-burst", "Sword Burst", 0, ["artificer", "sorcerer", "warlock", "wizard"], "1 action", "Self (5-foot radius)", ["V"], "Instantaneous", false,
    "Spectral blades sweep around you: each creature within 5 feet makes a Dexterity save or takes 1d6 force damage (scales at 5th/11th/17th)."),
  localSpell("magic-stone", "Magic Stone", 0, ["artificer", "druid", "warlock"], "1 bonus action", "Touch", ["V", "S"], "1 minute", false,
    "Imbue up to three pebbles. Anyone can throw one (range 60 feet) or sling it, attacking with your spell attack bonus; a hit deals 1d6 + your spellcasting modifier bludgeoning damage."),
  localSpell("thorn-whip", "Thorn Whip", 0, ["artificer", "druid"], "1 action", "30 feet", ["V", "S", "M"], "Instantaneous", false,
    "Melee spell attack against a creature within 30 feet: 1d6 piercing damage, and if the target is Large or smaller you pull it up to 10 feet closer to you (damage scales at 5th/11th/17th)."),
  localSpell("thunderclap", "Thunderclap", 0, ["artificer", "bard", "druid", "sorcerer", "warlock", "wizard"], "1 action", "Self (5-foot radius)", ["S"], "Instantaneous", false,
    "A crack of thunder audible 100 feet away: each creature within 5 feet makes a Constitution save or takes 1d6 thunder damage (scales at 5th/11th/17th)."),
  localSpell("absorb-elements", "Absorb Elements", 1, ["artificer", "druid", "ranger", "sorcerer", "wizard"], "1 reaction", "Self", ["S"], "1 round", false,
    "Reaction when you take acid, cold, fire, lightning, or thunder damage: you have resistance to that damage type until the start of your next turn, and the first melee hit you land on your next turn deals +1d6 damage of that type (+1d6 per slot level above 1st)."),
  localSpell("catapult", "Catapult", 1, ["artificer", "sorcerer", "wizard"], "1 action", "60 feet", ["S"], "Instantaneous", false,
    "Fling an unattended object of 1 to 5 pounds in a straight 90-foot line. The first creature in the path makes a Dexterity save or takes 3d8 bludgeoning damage and stops the object (+1d8 damage and +5 pounds per slot level above 1st)."),
  localSpell("snare", "Snare", 1, ["artificer", "druid", "ranger", "wizard"], "1 minute", "Touch", ["S", "M"], "8 hours", false,
    "Use 25 feet of rope to rig a hidden 5-foot magical trap on the ground. The first creature to step in makes a Dexterity save or is hoisted upside down and restrained in the air until the spell ends; it can repeat the save each turn, and others can free it with an Intelligence (Arcana) check."),
  localSpell("ray-of-sickness", "Ray of Sickness", 1, ["sorcerer", "wizard"], "1 action", "60 feet", ["V", "S"], "Instantaneous", false,
    "Ranged spell attack: 2d8 poison damage, and the target makes a Constitution save or is poisoned until the end of your next turn (+1d8 damage per slot level above 1st)."),
  localSpell("aura-of-vitality", "Aura of Vitality", 3, ["paladin"], "1 action", "Self (30-foot radius)", ["V"], "Concentration, up to 1 minute", true,
    "A healing aura moves with you. As a bonus action on each of your turns until the spell ends, restore 2d6 hit points to one creature in the aura."),
  localSpell("conjure-barrage", "Conjure Barrage", 3, ["ranger"], "1 action", "Self (60-foot cone)", ["V", "S", "M"], "Instantaneous", false,
    "Duplicate one piece of ammunition or a thrown weapon into a cone: each creature in a 60-foot cone makes a Dexterity save, taking 3d8 damage of the weapon's type on a failure, half on a success."),
  localSpell("aura-of-purity", "Aura of Purity", 4, ["paladin"], "1 action", "Self (30-foot radius)", ["V"], "Concentration, up to 10 minutes", true,
    "A purifying aura moves with you. Creatures you choose in it can't become diseased, have resistance to poison damage, and have advantage on saves against being blinded, charmed, deafened, frightened, paralyzed, poisoned, or stunned."),
  localSpell("banishing-smite", "Banishing Smite", 5, ["paladin"], "1 bonus action", "Self", ["V"], "Concentration, up to 1 minute", true,
    "Your next weapon hit deals +5d10 force damage. If that hit leaves the target at 50 hit points or fewer, it is banished until the spell ends: returned to its home plane, or held incapacitated in a harmless demiplane."),
  localSpell("toll-the-dead", "Toll the Dead", 0, ["cleric", "warlock", "wizard"], "1 action", "60 feet", ["V", "S"], "Instantaneous", false,
    "A dolorous bell tolls around one creature: Wisdom save or take 1d8 necrotic damage, or 1d12 instead if the target is missing any hit points (scales at 5th/11th/17th)."),
  localSpell("mind-sliver", "Mind Sliver", 0, ["sorcerer", "warlock", "wizard"], "1 action", "60 feet", ["V"], "1 round", false,
    "A psychic spike: Intelligence save or take 1d6 psychic damage and subtract 1d4 from the next saving throw the target makes before the end of your next turn (damage scales at 5th/11th/17th)."),
  localSpell("blade-ward", "Blade Ward", 0, ["bard", "sorcerer", "warlock", "wizard"], "1 action", "Self", ["V", "S"], "1 round", false,
    "Trace a sigil of warding: until the end of your next turn you have resistance to bludgeoning, piercing, and slashing damage from weapon attacks."),
  localSpell("friends", "Friends", 0, ["bard", "sorcerer", "warlock", "wizard"], "1 action", "Self", ["S", "M"], "Concentration, up to 1 minute", true,
    "Gain advantage on all Charisma checks against one non-hostile creature. When the spell ends, it realizes you used magic on it and may become hostile."),
  localSpell("word-of-radiance", "Word of Radiance", 0, ["cleric"], "1 action", "5 feet", ["V", "M"], "Instantaneous", false,
    "Burning radiance erupts from you: each creature of your choice within 5 feet makes a Constitution save or takes 1d6 radiant damage (scales at 5th/11th/17th)."),
  localSpell("primal-savagery", "Primal Savagery", 0, ["druid"], "1 action", "Self", ["S"], "Instantaneous", false,
    "Your teeth or nails sharpen into acid-dripping points: make a melee spell attack for 1d10 acid damage (scales at 5th/11th/17th)."),
  localSpell("control-flames", "Control Flames", 0, ["druid", "sorcerer", "wizard"], "1 action", "60 feet", ["S"], "Instantaneous or 1 hour", false,
    "Manipulate nonmagical flame in a 5-foot cube: expand it, extinguish it, double or halve its light, or shape crude moving images in it. No damage."),
  localSpell("gust", "Gust", 0, ["druid", "sorcerer", "wizard"], "1 action", "30 feet", ["V", "S"], "Instantaneous", false,
    "Command a puff of wind: push a Medium or smaller creature 5 feet away (Strength save negates), push an unattended object up to 10 pounds 10 feet, or create a harmless sensory breeze."),
  localSpell("mold-earth", "Mold Earth", 0, ["druid", "sorcerer", "wizard"], "1 action", "30 feet", ["S"], "Instantaneous or 1 hour", false,
    "Shape loose earth in a 5-foot cube: excavate and deposit it, draw shapes and colors on it, or make it difficult or normal terrain. Up to two non-instantaneous effects active at once."),
  localSpell("shape-water", "Shape Water", 0, ["druid", "sorcerer", "wizard"], "1 action", "30 feet", ["S"], "Instantaneous or 1 hour", false,
    "Shape water in a 5-foot cube: move or form it into simple shapes, change its color or opacity, or freeze it (if no creature is in it). Up to two non-instantaneous effects active at once."),
  localSpell("infestation", "Infestation", 0, ["druid", "sorcerer", "warlock", "wizard"], "1 action", "30 feet", ["V", "S", "M"], "Instantaneous", false,
    "A swarm of biting mites erupts on one creature: Constitution save or take 1d6 poison damage and move 5 feet in a random direction (damage scales at 5th/11th/17th)."),
  localSpell("hex", "Hex", 1, ["warlock"], "1 bonus action", "90 feet", ["V", "S", "M"], "Concentration, up to 1 hour", true,
    "Curse one creature: your attacks deal it +1d6 necrotic damage, and it has disadvantage on ability checks with one ability you choose. If it drops to 0 HP, a bonus action moves the curse to a new target. Higher slots extend duration (3rd: 8 hours, 5th: 24 hours)."),
  localSpell("armor-of-agathys", "Armor of Agathys", 1, ["warlock"], "1 action", "Self", ["V", "S", "M"], "1 hour", false,
    "Icy armor grants 5 temporary hit points. While any remain, a creature that hits you with a melee attack takes 5 cold damage. Both numbers increase by 5 per slot level above 1st."),
  localSpell("arms-of-hadar", "Arms of Hadar", 1, ["warlock"], "1 action", "Self (10-foot radius)", ["V", "S"], "Instantaneous", false,
    "Dark tendrils lash out: each creature within 10 feet makes a Strength save or takes 2d6 necrotic damage and can't take reactions until its next turn; half damage on a success (+1d6 per slot level above 1st)."),
  localSpell("chromatic-orb", "Chromatic Orb", 1, ["sorcerer", "wizard"], "1 action", "90 feet", ["V", "S", "M"], "Instantaneous", false,
    "Hurl a sphere of energy: ranged spell attack for 3d8 acid, cold, fire, lightning, poison, or thunder damage, your choice each cast (+1d8 per slot level above 1st)."),
  localSpell("witch-bolt", "Witch Bolt", 1, ["sorcerer", "warlock", "wizard"], "1 action", "30 feet", ["V", "S", "M"], "Concentration, up to 1 minute", true,
    "Ranged spell attack for 1d12 lightning damage; on a hit a crackling arc locks on, and on later turns your action deals 1d12 lightning automatically. Ends if the target leaves range or gains total cover. Initial damage +1d12 per slot level above 1st."),
  localSpell("dissonant-whispers", "Dissonant Whispers", 1, ["bard"], "1 action", "60 feet", ["V"], "Instantaneous", false,
    "A discordant melody only the target hears: Wisdom save or take 3d6 psychic damage and immediately use its reaction to move its full speed away from you; half damage and no move on a success (+1d6 per slot level above 1st)."),
  localSpell("ice-knife", "Ice Knife", 1, ["druid", "sorcerer", "wizard"], "1 action", "60 feet", ["S", "M"], "Instantaneous", false,
    "Throw an ice shard: ranged spell attack for 1d10 piercing damage. Hit or miss, it then explodes: the target and each creature within 5 feet makes a Dexterity save or takes 2d6 cold damage (cold +1d6 per slot level above 1st)."),
  localSpell("earth-tremor", "Earth Tremor", 1, ["bard", "druid", "sorcerer", "wizard"], "1 action", "Self (10-foot radius)", ["V", "S"], "Instantaneous", false,
    "The ground shakes: each other creature within 10 feet makes a Dexterity save or takes 1d6 bludgeoning damage and falls prone; loose ground in the area becomes difficult terrain (+1d6 per slot level above 1st)."),
  localSpell("ensnaring-strike", "Ensnaring Strike", 1, ["ranger"], "1 bonus action", "Self", ["V"], "Concentration, up to 1 minute", true,
    "Your next weapon hit sprouts grasping vines: Strength save or the target is restrained and takes 1d6 piercing damage at the start of each of its turns; it or an ally can break free with a Strength check (+1d6 per slot level above 1st)."),
  localSpell("hail-of-thorns", "Hail of Thorns", 1, ["ranger"], "1 bonus action", "Self", ["V"], "Concentration, up to 1 minute", true,
    "Your next ranged weapon hit bursts into thorns: the target and each creature within 5 feet of it makes a Dexterity save, taking 1d10 piercing damage on a failure, half on a success (+1d10 per slot level above 1st, max 6d10)."),
  localSpell("searing-smite", "Searing Smite", 1, ["paladin"], "1 bonus action", "Self", ["V"], "Concentration, up to 1 minute", true,
    "Your next melee weapon hit deals +1d6 fire damage and ignites the target: 1d6 fire at the start of each of its turns until it ends the flames with a successful Constitution save or someone douses them (initial damage +1d6 per slot level above 1st)."),
  localSpell("thunderous-smite", "Thunderous Smite", 1, ["paladin"], "1 bonus action", "Self", ["V"], "Concentration, up to 1 minute", true,
    "Your next melee weapon hit cracks with thunder audible 300 feet away, dealing +2d6 thunder damage; the target makes a Strength save or is pushed 10 feet away and knocked prone."),
  localSpell("wrathful-smite", "Wrathful Smite", 1, ["paladin"], "1 bonus action", "Self", ["V"], "Concentration, up to 1 minute", true,
    "Your next melee weapon hit deals +1d6 psychic damage; the target makes a Wisdom save or is frightened of you until the spell ends (it can spend an action on a Wisdom check to end it)."),
  localSpell("silvery-barbs", "Silvery Barbs", 1, ["bard", "sorcerer", "wizard"], "1 reaction", "60 feet", ["V"], "Instantaneous", false,
    "Reaction when a creature within 60 feet succeeds on an attack, check, or save: force it to reroll and use the lower result, then grant another creature advantage on its next attack, check, or save within 1 minute."),
  localSpell("tashas-caustic-brew", "Tasha's Caustic Brew", 1, ["artificer", "sorcerer", "wizard"], "1 action", "Self (30-foot line)", ["V", "S", "M"], "Concentration, up to 1 minute", true,
    "Spray acid in a 30-foot, 5-foot-wide line: each creature in it makes a Dexterity save or is covered in acid, taking 2d4 acid damage at the start of each of its turns until a creature uses an action to scrape it off (+2d4 per slot level above 1st)."),
  localSpell("cloud-of-daggers", "Cloud of Daggers", 2, ["bard", "sorcerer", "warlock", "wizard"], "1 action", "60 feet", ["V", "S", "M"], "Concentration, up to 1 minute", true,
    "Fill a 5-foot cube with spinning daggers: a creature takes 4d4 slashing damage when it enters the cube for the first time on a turn or starts its turn there (+2d4 per slot level above 2nd)."),
  localSpell("crown-of-madness", "Crown of Madness", 2, ["bard", "sorcerer", "warlock", "wizard"], "1 action", "120 feet", ["V", "S"], "Concentration, up to 1 minute", true,
    "One humanoid makes a Wisdom save or is charmed: it must use its action each turn to attack a creature you choose before moving. It repeats the save at the end of each of its turns, and you must use your action each turn to maintain control."),
  localSpell("phantasmal-force", "Phantasmal Force", 2, ["bard", "sorcerer", "wizard"], "1 action", "60 feet", ["V", "S", "M"], "Concentration, up to 1 minute", true,
    "Intelligence save or you craft an illusion in the target's mind that it believes completely, rationalizing any contradiction. The phantasm can deal it 1d6 psychic damage each round; an action and an Intelligence (Investigation) check against your DC ends it."),
  localSpell("shadow-blade", "Shadow Blade", 2, ["sorcerer", "warlock", "wizard"], "1 bonus action", "Self", ["V", "S"], "Concentration, up to 1 minute", true,
    "Weave a sword of solid shadow: finesse, light, thrown (20/60), 2d8 psychic damage, and advantage on attacks made in dim light or darkness. Damage rises with slot level (3rd-4th: 3d8, 5th-6th: 4d8, 7th+: 5d8)."),
  localSpell("dragons-breath", "Dragon's Breath", 2, ["sorcerer", "wizard"], "1 bonus action", "Touch", ["V", "S", "M"], "Concentration, up to 1 minute", true,
    "A willing creature you touch can use its action to exhale a 15-foot cone of acid, cold, fire, lightning, or poison: each creature in the cone makes a Dexterity save, taking 3d6 damage on a failure, half on a success (+1d6 per slot level above 2nd)."),
  localSpell("mind-spike", "Mind Spike", 2, ["sorcerer", "warlock", "wizard"], "1 action", "60 feet", ["S"], "Concentration, up to 1 hour", true,
    "Wisdom save or take 3d8 psychic damage, half on a success. On a failure you also always know the target's location while the spell lasts, and it can't hide from you (+1d8 per slot level above 2nd)."),
  localSpell("tashas-mind-whip", "Tasha's Mind Whip", 2, ["sorcerer", "wizard"], "1 action", "90 feet", ["V"], "1 round", false,
    "Lash one creature's mind: Intelligence save or take 3d6 psychic damage, lose its reaction, and on its next turn choose only one of move, action, or bonus action; half damage only on a success (+1 target per slot level above 2nd)."),
  localSpell("aganazzars-scorcher", "Aganazzar's Scorcher", 2, ["sorcerer", "wizard"], "1 action", "30 feet", ["V", "S", "M"], "Instantaneous", false,
    "A 30-foot line of roaring flame 5 feet wide: each creature in it makes a Dexterity save, taking 3d8 fire damage on a failure, half on a success (+1d8 per slot level above 2nd)."),
  localSpell("snillocs-snowball-swarm", "Snilloc's Snowball Swarm", 2, ["sorcerer", "wizard"], "1 action", "90 feet", ["V", "S", "M"], "Instantaneous", false,
    "A flurry of magic snowballs bursts in a 5-foot-radius sphere: each creature there makes a Dexterity save, taking 3d6 cold damage on a failure, half on a success (+1d6 per slot level above 2nd)."),
  localSpell("warding-wind", "Warding Wind", 2, ["bard", "druid", "sorcerer", "wizard"], "1 action", "Self", ["V"], "Concentration, up to 10 minutes", true,
    "Deafening wind whirls in a 10-foot radius around you: it deafens creatures inside, extinguishes unprotected flames, disperses fog and gas, makes the area difficult terrain for others, and gives ranged weapon attacks through it disadvantage."),
  localSpell("healing-spirit", "Healing Spirit", 2, ["druid", "ranger"], "1 bonus action", "60 feet", ["V", "S"], "Concentration, up to 1 minute", true,
    "Summon a nature spirit in a 5-foot cube. When a creature you can see enters the cube or starts its turn there, you can have it regain 1d6 hit points; the spirit can heal a total of 1 + your spellcasting modifier times. A bonus action moves it 30 feet (+1d6 healing per slot level above 2nd)."),
  localSpell("thunder-step", "Thunder Step", 3, ["sorcerer", "warlock", "wizard"], "1 action", "90 feet", ["V"], "Instantaneous", false,
    "Teleport up to 90 feet with a thunderous crack: each creature within 10 feet of the space you left makes a Constitution save, taking 3d10 thunder damage on a failure, half on a success. You can bring one willing creature within 5 feet (+1d10 per slot level above 3rd)."),
  localSpell("tidal-wave", "Tidal Wave", 3, ["druid", "sorcerer", "wizard"], "1 action", "120 feet", ["V", "S", "M"], "Instantaneous", false,
    "A wave 30 feet long, 10 feet wide, and 10 feet tall crashes down: each creature in the area makes a Dexterity save, taking 4d8 bludgeoning damage and falling prone on a failure, half damage and no prone on a success. The water then spreads out, dousing unprotected flames."),
  localSpell("erupting-earth", "Erupting Earth", 3, ["druid", "sorcerer", "wizard"], "1 action", "120 feet", ["V", "S", "M"], "Instantaneous", false,
    "A 20-foot cube of ground churns and erupts: each creature in it makes a Dexterity save, taking 3d12 bludgeoning damage on a failure, half on a success; the area becomes difficult terrain until cleared (+1d12 per slot level above 3rd)."),
  localSpell("intellect-fortress", "Intellect Fortress", 3, ["artificer", "bard", "sorcerer", "warlock", "wizard"], "1 action", "30 feet", ["V"], "Concentration, up to 1 hour", true,
    "One willing creature gains resistance to psychic damage and advantage on Intelligence, Wisdom, and Charisma saving throws for the duration (+1 target per slot level above 3rd)."),
  localSpell("spirit-shroud", "Spirit Shroud", 3, ["cleric", "paladin", "warlock", "wizard"], "1 bonus action", "Self", ["V", "S"], "Concentration, up to 1 minute", true,
    "Spirits cloak you: your attacks against creatures within 10 feet deal +1d8 radiant, necrotic, or cold damage (your choice at cast), and a creature you hit can't regain hit points until the start of your next turn. Each turn one creature of your choice within 10 feet has its speed reduced by 10 feet. Bonus die increases by 1d8 per two slot levels above 3rd."),
  localSpell("melfs-minute-meteors", "Melf's Minute Meteors", 3, ["sorcerer", "wizard"], "1 action", "Self", ["V", "S", "M"], "Concentration, up to 10 minutes", true,
    "Create six tiny orbiting meteors. When you cast the spell and as a bonus action on later turns, fling one or two at points within 120 feet: each bursts in a 5-foot radius, Dexterity save or 2d6 fire damage, half on a success (+2 meteors per slot level above 3rd)."),
  localSpell("life-transference", "Life Transference", 3, ["cleric", "wizard"], "1 action", "30 feet", ["V", "S"], "Instantaneous", false,
    "Sacrifice vitality: you take 4d8 necrotic damage that can't be reduced, and one creature you can see regains hit points equal to twice the damage you took (+1d8 per slot level above 3rd)."),
  localSpell("storm-sphere", "Storm Sphere", 4, ["sorcerer", "wizard"], "1 action", "150 feet", ["V", "S"], "Concentration, up to 1 minute", true,
    "A 20-foot-radius sphere of whirling air: a creature that enters it or starts its turn there makes a Strength save or takes 2d6 bludgeoning damage, and as a bonus action each turn you can hurl a bolt from its center as a ranged spell attack against a creature within 60 feet of the sphere for 4d6 lightning damage (lightning +1d6 per slot level above 4th)."),
  localSpell("vitriolic-sphere", "Vitriolic Sphere", 4, ["sorcerer", "wizard"], "1 action", "150 feet", ["V", "S", "M"], "Instantaneous", false,
    "A 20-foot-radius sphere of acid: Dexterity save. On a failure a creature takes 10d4 acid damage now and 5d4 more at the end of its next turn; on a success, half the initial damage and nothing later (initial damage +2d4 per slot level above 4th)."),
  localSpell("shadow-of-moil", "Shadow of Moil", 4, ["warlock"], "1 action", "Self", ["V", "S", "M"], "Concentration, up to 1 minute", true,
    "Flame-like shadows wreathe you: you are heavily obscured to others, dim light within 10 feet of you becomes darkness, you have resistance to radiant damage, and a creature that hits you from within 10 feet takes 2d8 necrotic damage."),
  localSpell("sickening-radiance", "Sickening Radiance", 4, ["sorcerer", "warlock", "wizard"], "1 action", "120 feet", ["V", "S"], "Concentration, up to 10 minutes", true,
    "Dim greenish light fills a 30-foot-radius sphere: a creature that enters it or ends its turn there makes a Constitution save or takes 4d10 radiant damage, gains one level of exhaustion (removed when the spell ends), and emits a ghostly glow that negates invisibility."),
  localSpell("guardian-of-nature", "Guardian of Nature", 4, ["druid", "ranger"], "1 bonus action", "Self", ["V"], "Concentration, up to 1 minute", true,
    "Transform into a nature spirit: Primal Beast (speed +10 feet, 120-foot darkvision, advantage on Strength-based attacks, melee hits deal +1d6 force) or Great Tree (10 temporary HP, advantage on Constitution saves and on Dexterity- and Wisdom-based attacks, ground within 15 feet is difficult terrain for enemies)."),
  localSpell("steel-wind-strike", "Steel Wind Strike", 5, ["ranger", "wizard"], "1 action", "30 feet", ["S", "M"], "Instantaneous", false,
    "Flash like the wind between up to five creatures within 30 feet: make a melee spell attack against each, dealing 6d10 force damage on a hit, then teleport to an unoccupied space within 5 feet of any one of the targets."),
  localSpell("synaptic-static", "Synaptic Static", 5, ["bard", "sorcerer", "warlock", "wizard"], "1 action", "120 feet", ["V", "S"], "Instantaneous", false,
    "A 20-foot-radius burst of psychic static: Intelligence save or take 8d6 psychic damage, half on a success. On a failure the creature also subtracts 1d6 from its attack rolls, ability checks, and concentration saves for 1 minute (Intelligence save at the end of each of its turns to end it)."),
  localSpell("far-step", "Far Step", 5, ["sorcerer", "warlock", "wizard"], "1 bonus action", "Self", ["V"], "Concentration, up to 1 minute", true,
    "Teleport up to 60 feet to a space you can see, and do so again as a bonus action on each of your turns while the spell lasts."),
  localSpell("holy-weapon", "Holy Weapon", 5, ["cleric", "paladin"], "1 bonus action", "Touch", ["V", "S"], "Concentration, up to 1 hour", true,
    "A weapon you touch glows with bright light and deals +2d8 radiant damage on hits. As a bonus action you can end the spell in a radiant burst: each creature of your choice within 30 feet makes a Constitution save or takes 4d8 radiant damage and is blinded for 1 minute; half damage and no blindness on a success."),
  localSpell("destructive-wave", "Destructive Wave", 5, ["paladin"], "1 action", "Self (30-foot radius)", ["V"], "Instantaneous", false,
    "Divine power slams the ground: each creature you choose within 30 feet makes a Constitution save or takes 5d6 thunder damage plus 5d6 radiant or necrotic damage (your choice) and is knocked prone; half damage and no prone on a success."),
  localSpell("mental-prison", "Mental Prison", 6, ["sorcerer", "warlock", "wizard"], "1 action", "60 feet", ["S"], "Concentration, up to 1 minute", true,
    "Bind one creature in an illusory cell only it perceives: on a successful Intelligence save it takes 5d10 psychic damage and the spell ends; on a failure it takes the damage and is trapped: it can't see or hear beyond the illusion, and passing through it deals 10d10 psychic damage and ends the spell."),
  localSpell("crown-of-stars", "Crown of Stars", 7, ["sorcerer", "warlock", "wizard"], "1 action", "Self", ["V", "S"], "1 hour", false,
    "Seven star-like motes orbit your head. As a bonus action, fling one at a creature or object within 120 feet: ranged spell attack for 4d12 radiant damage. While four or more remain you shed bright light in a 30-foot radius (+2 motes per slot level above 7th)."),
  localSpell("abi-dalzims-horrid-wilting", "Abi-Dalzim's Horrid Wilting", 8, ["sorcerer", "wizard"], "1 action", "150 feet", ["V", "S", "M"], "Instantaneous", false,
    "Draw the moisture from a 30-foot cube: each creature in it makes a Constitution save, taking 12d8 necrotic damage on a failure, half on a success. Constructs and undead are immune, water elementals and plant creatures save with disadvantage, and nonmagical plants in the area wither."),
  localSpell("psychic-scream", "Psychic Scream", 9, ["bard", "sorcerer", "warlock", "wizard"], "1 action", "90 feet", ["S"], "Instantaneous", false,
    "Assault the minds of up to ten creatures: Intelligence save or take 14d6 psychic damage and be stunned, half damage and no stun on a success. A stunned target repeats the save at the end of each of its turns to end the effect.")
];

const LOCAL_SPELL_INDEX = LOCAL_SPELLS.map(detail => ({
  index: detail.index,
  name: detail.name,
  level: detail.level,
  classes: detail.classes.map(cls => cls.index)
}));

const SUBCLASS_TEMPLATES = {
  armorer: [
    ["Guardian Armor", "Write the armor form's defensive features, attacks, limitations, and when you use it."],
    ["Infiltrator Armor", "Write the armor form's stealth, movement, ranged attack, and utility notes."],
    ["Third Armor Form", "Use this for a table variant, homebrew armor model, or future form from your campaign."]
  ],
  choice: [
    ["Subclass Choice", "Record the selected option and what changes when you switch choices."],
    ["Always-On Features", "Write passive benefits, proficiencies, expanded lists, and reminders."],
    ["Limited-Use Features", "Track uses, recharge timing, triggers, and action economy."]
  ],
  resource: [
    ["Resource Pool", "Track max uses, current uses, recharge timing, and any scaling math."],
    ["Feature Options", "List the feature options that spend or modify this resource."],
    ["Level Scaling", "Record what changes at later class or subclass levels."]
  ]
};

const IMPORT_SECTION_HEADINGS = [
  "features", "traits", "class features", "features & traits", "attacks", "actions",
  "attacks & spellcasting", "inventory", "equipment", "possessions", "notes",
  "backstory", "personality", "spells", "spell list", "known spells", "prepared spells",
  "proficiencies", "skill proficiencies", "skills"
];

function officialSubclass(index, name, classIndex, className, flavor, desc = []) {
  return { index, name, classIndex, className, flavor, desc };
}

const OFFICIAL_SUBCLASS_FALLBACK = [
  // Artificer (TCE/ERLW)
  officialSubclass("alchemist", "Alchemist", "artificer", "Artificer", "Specialist"),
  officialSubclass("armorer", "Armorer", "artificer", "Artificer", "Specialist"),
  officialSubclass("artillerist", "Artillerist", "artificer", "Artificer", "Specialist"),
  officialSubclass("battle-smith", "Battle Smith", "artificer", "Artificer", "Specialist"),
  // Barbarian
  officialSubclass("berserker", "Berserker", "barbarian", "Barbarian", "Primal Path"),
  officialSubclass("totem-warrior", "Totem Warrior", "barbarian", "Barbarian", "Primal Path"),
  officialSubclass("ancestral-guardian", "Ancestral Guardian", "barbarian", "Barbarian", "Primal Path"),
  officialSubclass("storm-herald", "Storm Herald", "barbarian", "Barbarian", "Primal Path"),
  officialSubclass("zealot", "Zealot", "barbarian", "Barbarian", "Primal Path"),
  officialSubclass("beast", "Beast", "barbarian", "Barbarian", "Primal Path"),
  officialSubclass("wild-magic-barbarian", "Wild Magic", "barbarian", "Barbarian", "Primal Path"),
  officialSubclass("battlerager", "Battlerager", "barbarian", "Barbarian", "Primal Path"),
  // Bard
  officialSubclass("lore", "Lore", "bard", "Bard", "Bard College"),
  officialSubclass("valor", "Valor", "bard", "Bard", "Bard College"),
  officialSubclass("glamour", "Glamour", "bard", "Bard", "Bard College"),
  officialSubclass("swords", "Swords", "bard", "Bard", "Bard College"),
  officialSubclass("whispers", "Whispers", "bard", "Bard", "Bard College"),
  officialSubclass("creation", "Creation", "bard", "Bard", "Bard College"),
  officialSubclass("eloquence", "Eloquence", "bard", "Bard", "Bard College"),
  officialSubclass("spirits", "Spirits", "bard", "Bard", "Bard College"),
  // Blood Hunter
  officialSubclass("ghostslayer", "Ghostslayer", "bloodhunter", "Blood Hunter", "Blood Hunter Order"),
  officialSubclass("profane-soul", "Profane Soul", "bloodhunter", "Blood Hunter", "Blood Hunter Order"),
  officialSubclass("mutant", "Mutant", "bloodhunter", "Blood Hunter", "Blood Hunter Order"),
  officialSubclass("lycan", "Lycan", "bloodhunter", "Blood Hunter", "Blood Hunter Order"),
  // Cleric
  officialSubclass("knowledge", "Knowledge", "cleric", "Cleric", "Divine Domain"),
  officialSubclass("life", "Life", "cleric", "Cleric", "Divine Domain"),
  officialSubclass("light", "Light", "cleric", "Cleric", "Divine Domain"),
  officialSubclass("nature", "Nature", "cleric", "Cleric", "Divine Domain"),
  officialSubclass("tempest", "Tempest", "cleric", "Cleric", "Divine Domain"),
  officialSubclass("trickery", "Trickery", "cleric", "Cleric", "Divine Domain"),
  officialSubclass("war", "War", "cleric", "Cleric", "Divine Domain"),
  officialSubclass("death", "Death", "cleric", "Cleric", "Divine Domain"),
  officialSubclass("arcana", "Arcana", "cleric", "Cleric", "Divine Domain"),
  officialSubclass("forge", "Forge", "cleric", "Cleric", "Divine Domain"),
  officialSubclass("grave", "Grave", "cleric", "Cleric", "Divine Domain"),
  officialSubclass("order", "Order", "cleric", "Cleric", "Divine Domain"),
  officialSubclass("peace", "Peace", "cleric", "Cleric", "Divine Domain"),
  officialSubclass("twilight", "Twilight", "cleric", "Cleric", "Divine Domain"),
  // Druid
  officialSubclass("land", "Land", "druid", "Druid", "Druid Circle"),
  officialSubclass("moon", "Moon", "druid", "Druid", "Druid Circle"),
  officialSubclass("dreams", "Dreams", "druid", "Druid", "Druid Circle"),
  officialSubclass("shepherd", "Shepherd", "druid", "Druid", "Druid Circle"),
  officialSubclass("spores", "Spores", "druid", "Druid", "Druid Circle"),
  officialSubclass("stars", "Stars", "druid", "Druid", "Druid Circle"),
  officialSubclass("wildfire", "Wildfire", "druid", "Druid", "Druid Circle"),
  // Fighter
  officialSubclass("champion", "Champion", "fighter", "Fighter", "Martial Archetype"),
  officialSubclass("battle-master", "Battle Master", "fighter", "Fighter", "Martial Archetype"),
  officialSubclass("eldritch-knight", "Eldritch Knight", "fighter", "Fighter", "Martial Archetype"),
  officialSubclass("arcane-archer", "Arcane Archer", "fighter", "Fighter", "Martial Archetype"),
  officialSubclass("cavalier", "Cavalier", "fighter", "Fighter", "Martial Archetype"),
  officialSubclass("samurai", "Samurai", "fighter", "Fighter", "Martial Archetype"),
  officialSubclass("psi-warrior", "Psi Warrior", "fighter", "Fighter", "Martial Archetype"),
  officialSubclass("rune-knight", "Rune Knight", "fighter", "Fighter", "Martial Archetype"),
  officialSubclass("purple-dragon-knight", "Purple Dragon Knight", "fighter", "Fighter", "Martial Archetype"),
  officialSubclass("echo-knight", "Echo Knight", "fighter", "Fighter", "Martial Archetype"),
  // Monk
  officialSubclass("open-hand", "Open Hand", "monk", "Monk", "Monastic Tradition"),
  officialSubclass("shadow", "Shadow", "monk", "Monk", "Monastic Tradition"),
  officialSubclass("four-elements", "Four Elements", "monk", "Monk", "Monastic Tradition"),
  officialSubclass("drunken-master", "Drunken Master", "monk", "Monk", "Monastic Tradition"),
  officialSubclass("kensei", "Kensei", "monk", "Monk", "Monastic Tradition"),
  officialSubclass("sun-soul", "Sun Soul", "monk", "Monk", "Monastic Tradition"),
  officialSubclass("mercy", "Mercy", "monk", "Monk", "Monastic Tradition"),
  officialSubclass("astral-self", "Astral Self", "monk", "Monk", "Monastic Tradition"),
  officialSubclass("ascendant-dragon", "Ascendant Dragon", "monk", "Monk", "Monastic Tradition"),
  officialSubclass("long-death", "Long Death", "monk", "Monk", "Monastic Tradition"),
  // Paladin
  officialSubclass("devotion", "Devotion", "paladin", "Paladin", "Sacred Oath"),
  officialSubclass("ancients", "Ancients", "paladin", "Paladin", "Sacred Oath"),
  officialSubclass("vengeance", "Vengeance", "paladin", "Paladin", "Sacred Oath"),
  officialSubclass("oathbreaker", "Oathbreaker", "paladin", "Paladin", "Sacred Oath"),
  officialSubclass("conquest", "Conquest", "paladin", "Paladin", "Sacred Oath"),
  officialSubclass("redemption", "Redemption", "paladin", "Paladin", "Sacred Oath"),
  officialSubclass("glory", "Glory", "paladin", "Paladin", "Sacred Oath"),
  officialSubclass("watchers", "Watchers", "paladin", "Paladin", "Sacred Oath"),
  officialSubclass("crown", "Crown", "paladin", "Paladin", "Sacred Oath"),
  // Ranger
  officialSubclass("hunter", "Hunter", "ranger", "Ranger", "Ranger Archetype"),
  officialSubclass("beast-master", "Beast Master", "ranger", "Ranger", "Ranger Archetype"),
  officialSubclass("gloom-stalker", "Gloom Stalker", "ranger", "Ranger", "Ranger Archetype"),
  officialSubclass("horizon-walker", "Horizon Walker", "ranger", "Ranger", "Ranger Archetype"),
  officialSubclass("monster-slayer", "Monster Slayer", "ranger", "Ranger", "Ranger Archetype"),
  officialSubclass("fey-wanderer", "Fey Wanderer", "ranger", "Ranger", "Ranger Archetype"),
  officialSubclass("swarmkeeper", "Swarmkeeper", "ranger", "Ranger", "Ranger Archetype"),
  officialSubclass("drakewarden", "Drakewarden", "ranger", "Ranger", "Ranger Archetype"),
  // Rogue
  officialSubclass("thief", "Thief", "rogue", "Rogue", "Roguish Archetype"),
  officialSubclass("assassin", "Assassin", "rogue", "Rogue", "Roguish Archetype"),
  officialSubclass("arcane-trickster", "Arcane Trickster", "rogue", "Rogue", "Roguish Archetype"),
  officialSubclass("inquisitive", "Inquisitive", "rogue", "Rogue", "Roguish Archetype"),
  officialSubclass("mastermind", "Mastermind", "rogue", "Rogue", "Roguish Archetype"),
  officialSubclass("scout", "Scout", "rogue", "Rogue", "Roguish Archetype"),
  officialSubclass("swashbuckler", "Swashbuckler", "rogue", "Rogue", "Roguish Archetype"),
  officialSubclass("phantom", "Phantom", "rogue", "Rogue", "Roguish Archetype"),
  officialSubclass("soulknife", "Soulknife", "rogue", "Rogue", "Roguish Archetype"),
  // Sorcerer
  officialSubclass("draconic", "Draconic", "sorcerer", "Sorcerer", "Sorcerous Origin"),
  officialSubclass("wild-magic", "Wild Magic", "sorcerer", "Sorcerer", "Sorcerous Origin"),
  officialSubclass("divine-soul", "Divine Soul", "sorcerer", "Sorcerer", "Sorcerous Origin"),
  officialSubclass("shadow-magic", "Shadow Magic", "sorcerer", "Sorcerer", "Sorcerous Origin"),
  officialSubclass("storm-sorcery", "Storm Sorcery", "sorcerer", "Sorcerer", "Sorcerous Origin"),
  officialSubclass("aberrant-mind", "Aberrant Mind", "sorcerer", "Sorcerer", "Sorcerous Origin"),
  officialSubclass("clockwork-soul", "Clockwork Soul", "sorcerer", "Sorcerer", "Sorcerous Origin"),
  officialSubclass("lunar-sorcery", "Lunar Sorcery", "sorcerer", "Sorcerer", "Sorcerous Origin"),
  // Warlock
  officialSubclass("archfey", "Archfey", "warlock", "Warlock", "Otherworldly Patron"),
  officialSubclass("fiend", "Fiend", "warlock", "Warlock", "Otherworldly Patron"),
  officialSubclass("great-old-one", "Great Old One", "warlock", "Warlock", "Otherworldly Patron"),
  officialSubclass("celestial", "Celestial", "warlock", "Warlock", "Otherworldly Patron"),
  officialSubclass("hexblade", "Hexblade", "warlock", "Warlock", "Otherworldly Patron"),
  officialSubclass("fathomless", "Fathomless", "warlock", "Warlock", "Otherworldly Patron"),
  officialSubclass("genie", "Genie", "warlock", "Warlock", "Otherworldly Patron"),
  officialSubclass("undying", "Undying", "warlock", "Warlock", "Otherworldly Patron"),
  officialSubclass("undead", "Undead", "warlock", "Warlock", "Otherworldly Patron"),
  // Wizard
  officialSubclass("abjuration", "Abjuration", "wizard", "Wizard", "Arcane Tradition"),
  officialSubclass("conjuration", "Conjuration", "wizard", "Wizard", "Arcane Tradition"),
  officialSubclass("divination", "Divination", "wizard", "Wizard", "Arcane Tradition"),
  officialSubclass("enchantment", "Enchantment", "wizard", "Wizard", "Arcane Tradition"),
  officialSubclass("evocation", "Evocation", "wizard", "Wizard", "Arcane Tradition"),
  officialSubclass("illusion", "Illusion", "wizard", "Wizard", "Arcane Tradition"),
  officialSubclass("necromancy", "Necromancy", "wizard", "Wizard", "Arcane Tradition"),
  officialSubclass("transmutation", "Transmutation", "wizard", "Wizard", "Arcane Tradition"),
  officialSubclass("war-magic", "War Magic", "wizard", "Wizard", "Arcane Tradition"),
  officialSubclass("bladesinging", "Bladesinging", "wizard", "Wizard", "Arcane Tradition"),
  officialSubclass("order-of-scribes", "Order of Scribes", "wizard", "Wizard", "Arcane Tradition"),
  officialSubclass("chronurgy", "Chronurgy", "wizard", "Wizard", "Arcane Tradition"),
  officialSubclass("graviturgy", "Graviturgy", "wizard", "Wizard", "Arcane Tradition")
];
