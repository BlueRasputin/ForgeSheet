const STORAGE_KEY = "forgesheet.character.v1";
const ACTIVE_TAB_SHEET_KEY = "forgesheet.activeSheet.v1";
const CHARACTER_LIBRARY_KEY = "forgesheet.characters.v1";
const CUSTOM_CLASS_KEY = "forgesheet.classes.v1";
const CUSTOM_FEAT_KEY = "forgesheet.feats.v1";
const CUSTOM_SPELL_KEY = "forgesheet.spells.v1";
const SYNC_CONFIG_KEY = "forgesheet.sync.v1";
const SYNC_ROLE_KEY = "forgesheet.syncRole.v1";
const THEME_KEY = "forgesheet.theme.v1";
const BACKGROUND_KEY = "forgesheet.background.v1";
const VIEW_LAYOUT_KEY = "forgesheet.viewLayout.v1";
const PREFS_KEY = "forgesheet.prefs.v1";
// Paste your Firebase project's web config JSON here when you deploy, so players can sign in without pasting it.
// The web config is public by design; Firestore rules (firestore.rules) are what protect the data.
const FIREBASE_DEFAULT_CONFIG = "";
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

// Optional rules from the PHB, DMG and Tasha's that a table switches on or off per character (Settings).
const OPTIONAL_RULES = [
  ["tashas", "Tasha's optional class features and expanded spell lists", true],
  ["feats", "Feats (PHB p.165)", true],
  ["variantEncumbrance", "Variant encumbrance (PHB p.176)", false],
  // House rules (not in the books): on by default because this table plays with them.
  ["stackingInspiration", "House rule: inspiration is a counter instead of yes/no", true],
  ["overhealTempHp", "House rule: healing past max HP becomes temporary HP", true],
  ["xp", "Level by experience points instead of milestones (PHB p.15)", false]
];

// XP needed to reach each character level (PHB p.15). Index = level.
const XP_FOR_LEVEL = [null, 0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
const OPTIONAL_RULE_DEFAULTS = Object.fromEntries(OPTIONAL_RULES.map(([id, , on]) => [id, on]));

const ASI_LEVELS = new Set([4, 8, 12, 16, 19]);

const CLASS_EXTRA_ASI_LEVELS = { fighter: [6, 14], rogue: [10] };

const PREP_SUGGESTIONS = {
  combat: ["cure-wounds", "faerie-fire", "shield", "web", "fireball", "revivify", "haste"],
  exploration: ["detect-magic", "identify", "feather-fall", "longstrider", "rope-trick", "water-breathing", "fly"],
  social: ["disguise-self", "enhance-ability", "detect-magic", "invisibility", "suggestion"],
  dungeon: ["detect-magic", "identify", "cure-wounds", "darkvision", "lesser-restoration", "web"],
  boss: ["cure-wounds", "faerie-fire", "web", "haste", "dispel-magic", "revivify"]
};

// cost: PHB p.145-153 list price (magic items have none).
function itemCard(index, name, type, weight, rarity, notes, cost = "") {
  return { index, name, type, weight, rarity, notes, cost };
}

// Armor notes carry donning/doffing times (PHB p.146): light 1 min on/off, medium 5 on/1 off, heavy 10 on/5 off, shield 1 action.
const ITEM_CATALOG = [
  itemCard("club", "Club", "Weapon", 2, "Simple melee weapon", "1d4 bludgeoning, light.", "1 sp"),
  itemCard("dagger", "Dagger", "Weapon", 1, "Simple melee weapon", "1d4 piercing, finesse, light, thrown 20/60.", "2 gp"),
  itemCard("greatclub", "Greatclub", "Weapon", 10, "Simple melee weapon", "1d8 bludgeoning, two-handed.", "2 sp"),
  itemCard("handaxe", "Handaxe", "Weapon", 2, "Simple melee weapon", "1d6 slashing, light, thrown 20/60.", "5 gp"),
  itemCard("javelin", "Javelin", "Weapon", 2, "Simple melee weapon", "1d6 piercing, thrown 30/120.", "5 sp"),
  itemCard("light-hammer", "Light Hammer", "Weapon", 2, "Simple melee weapon", "1d4 bludgeoning, light, thrown 20/60.", "2 gp"),
  itemCard("mace", "Mace", "Weapon", 4, "Simple melee weapon", "1d6 bludgeoning.", "5 gp"),
  itemCard("quarterstaff", "Quarterstaff", "Weapon", 4, "Simple melee weapon", "1d6 bludgeoning, versatile 1d8.", "2 sp"),
  itemCard("sickle", "Sickle", "Weapon", 2, "Simple melee weapon", "1d4 slashing, light.", "1 gp"),
  itemCard("spear", "Spear", "Weapon", 3, "Simple melee weapon", "1d6 piercing, thrown 20/60, versatile 1d8.", "1 gp"),
  itemCard("light-crossbow", "Light Crossbow", "Weapon", 5, "Simple ranged weapon", "1d8 piercing, ammunition 80/320, loading, two-handed.", "25 gp"),
  itemCard("dart", "Dart", "Weapon", 0.25, "Simple ranged weapon", "1d4 piercing, finesse, thrown 20/60.", "5 cp"),
  itemCard("shortbow", "Shortbow", "Weapon", 2, "Simple ranged weapon", "1d6 piercing, ammunition 80/320, two-handed.", "25 gp"),
  itemCard("sling", "Sling", "Weapon", 0, "Simple ranged weapon", "1d4 bludgeoning, ammunition 30/120.", "1 sp"),
  itemCard("battleaxe", "Battleaxe", "Weapon", 4, "Martial melee weapon", "1d8 slashing, versatile 1d10.", "10 gp"),
  itemCard("flail", "Flail", "Weapon", 2, "Martial melee weapon", "1d8 bludgeoning.", "10 gp"),
  itemCard("glaive", "Glaive", "Weapon", 6, "Martial melee weapon", "1d10 slashing, heavy, reach, two-handed.", "20 gp"),
  itemCard("greataxe", "Greataxe", "Weapon", 7, "Martial melee weapon", "1d12 slashing, heavy, two-handed.", "30 gp"),
  itemCard("greatsword", "Greatsword", "Weapon", 6, "Martial melee weapon", "2d6 slashing, heavy, two-handed.", "50 gp"),
  itemCard("halberd", "Halberd", "Weapon", 6, "Martial melee weapon", "1d10 slashing, heavy, reach, two-handed.", "20 gp"),
  itemCard("lance", "Lance", "Weapon", 6, "Martial melee weapon", "1d12 piercing, reach, special. Disadvantage on attacks against a target within 5 feet; needs two hands unless you are mounted.", "10 gp"),
  itemCard("longsword", "Longsword", "Weapon", 3, "Martial melee weapon", "1d8 slashing, versatile 1d10.", "15 gp"),
  itemCard("maul", "Maul", "Weapon", 10, "Martial melee weapon", "2d6 bludgeoning, heavy, two-handed.", "10 gp"),
  itemCard("morningstar", "Morningstar", "Weapon", 4, "Martial melee weapon", "1d8 piercing.", "15 gp"),
  itemCard("pike", "Pike", "Weapon", 18, "Martial melee weapon", "1d10 piercing, heavy, reach, two-handed.", "5 gp"),
  itemCard("rapier", "Rapier", "Weapon", 2, "Martial melee weapon", "1d8 piercing, finesse.", "25 gp"),
  itemCard("scimitar", "Scimitar", "Weapon", 3, "Martial melee weapon", "1d6 slashing, finesse, light.", "25 gp"),
  itemCard("shortsword", "Shortsword", "Weapon", 2, "Martial melee weapon", "1d6 piercing, finesse, light.", "10 gp"),
  itemCard("trident", "Trident", "Weapon", 4, "Martial melee weapon", "1d6 piercing, thrown 20/60, versatile 1d8.", "5 gp"),
  itemCard("war-pick", "War Pick", "Weapon", 2, "Martial melee weapon", "1d8 piercing.", "5 gp"),
  itemCard("warhammer", "Warhammer", "Weapon", 2, "Martial melee weapon", "1d8 bludgeoning, versatile 1d10.", "15 gp"),
  itemCard("whip", "Whip", "Weapon", 3, "Martial melee weapon", "1d4 slashing, finesse, reach.", "2 gp"),
  // ERLW p.22; used by the Revenant Blade feat.
  itemCard("double-bladed-scimitar", "Double-Bladed Scimitar", "Weapon", 6, "Martial melee weapon", "2d4 slashing, two-handed, special. After you attack with it as part of the Attack action, a bonus action attack with the other blade deals 1d4 slashing.", "100 gp"),
  itemCard("blowgun", "Blowgun", "Weapon", 1, "Martial ranged weapon", "1d1 piercing (always 1), ammunition 25/100, loading.", "10 gp"),
  itemCard("hand-crossbow", "Hand Crossbow", "Weapon", 3, "Martial ranged weapon", "1d6 piercing, ammunition 30/120, light, loading.", "75 gp"),
  itemCard("heavy-crossbow", "Heavy Crossbow", "Weapon", 18, "Martial ranged weapon", "1d10 piercing, ammunition 100/400, heavy, loading, two-handed.", "50 gp"),
  itemCard("longbow", "Longbow", "Weapon", 2, "Martial ranged weapon", "1d8 piercing, ammunition 150/600, heavy, two-handed.", "50 gp"),
  itemCard("net", "Net", "Weapon", 3, "Martial ranged weapon", "Special, thrown 5/15. A hit restrains a Large or smaller creature until it escapes (DC 10 Strength check as an action) or the net (AC 10, 5 HP, slashing) is destroyed. Only one attack per action, bonus action, or reaction with it.", "1 gp"),
  itemCard("arrows", "Arrows (20)", "Ammunition", 1, "Ammunition", "For shortbows and longbows. Recover half after a battle.", "1 gp"),
  itemCard("crossbow-bolts", "Crossbow Bolts (20)", "Ammunition", 1.5, "Ammunition", "For crossbows. Recover half after a battle.", "1 gp"),
  itemCard("sling-bullets", "Sling Bullets (20)", "Ammunition", 1.5, "Ammunition", "For slings. Recover half after a battle.", "4 cp"),
  itemCard("blowgun-needles", "Blowgun Needles (50)", "Ammunition", 1, "Ammunition", "For blowguns. Recover half after a battle.", "1 gp"),
  itemCard("shield", "Shield", "Armor", 6, "Shield", "+2 AC while wielded. Don or doff: 1 action.", "10 gp"),
  itemCard("padded-armor", "Padded Armor", "Armor", 8, "Light armor", "AC 11 + Dexterity modifier. Disadvantage on Stealth. Don 1 min, doff 1 min.", "5 gp"),
  itemCard("leather-armor", "Leather Armor", "Armor", 10, "Light armor", "AC 11 + Dexterity modifier. Don 1 min, doff 1 min.", "10 gp"),
  itemCard("studded-leather", "Studded Leather", "Armor", 13, "Light armor", "AC 12 + Dexterity modifier. Don 1 min, doff 1 min.", "45 gp"),
  itemCard("hide-armor", "Hide Armor", "Armor", 12, "Medium armor", "AC 12 + Dex modifier, max 2. Don 5 min, doff 1 min.", "10 gp"),
  itemCard("chain-shirt", "Chain Shirt", "Armor", 20, "Medium armor", "AC 13 + Dex modifier, max 2. Don 5 min, doff 1 min.", "50 gp"),
  itemCard("scale-mail", "Scale Mail", "Armor", 45, "Medium armor", "AC 14 + Dex modifier, max 2. Disadvantage on Stealth. Don 5 min, doff 1 min.", "50 gp"),
  itemCard("breastplate", "Breastplate", "Armor", 20, "Medium armor", "AC 14 + Dex modifier, max 2. Don 5 min, doff 1 min.", "400 gp"),
  itemCard("half-plate", "Half Plate", "Armor", 40, "Medium armor", "AC 15 + Dex modifier, max 2. Disadvantage on Stealth. Don 5 min, doff 1 min.", "750 gp"),
  itemCard("ring-mail", "Ring Mail", "Armor", 40, "Heavy armor", "AC 14. Disadvantage on Stealth. Don 10 min, doff 5 min.", "30 gp"),
  itemCard("chain-mail", "Chain Mail", "Armor", 55, "Heavy armor", "AC 16. Requires Strength 13. Disadvantage on Stealth. Don 10 min, doff 5 min.", "75 gp"),
  itemCard("splint-armor", "Splint Armor", "Armor", 60, "Heavy armor", "AC 17. Requires Strength 15. Disadvantage on Stealth. Don 10 min, doff 5 min.", "200 gp"),
  itemCard("plate", "Plate", "Armor", 65, "Heavy armor", "AC 18. Requires Strength 15. Disadvantage on Stealth. Don 10 min, doff 5 min.", "1,500 gp"),
  itemCard("backpack", "Backpack", "Adventuring Gear", 5, "Container", "Holds gear and supplies.", "2 gp"),
  itemCard("rope-hempen", "Rope, Hempen", "Adventuring Gear", 10, "Gear", "50 feet of rope.", "1 gp"),
  itemCard("healers-kit", "Healer's Kit", "Adventuring Gear", 3, "Gear", "10 uses. As an action, spend one use to stabilize a creature at 0 HP without a Medicine check.", "5 gp"),
  itemCard("thieves-tools", "Thieves' Tools", "Tool", 1, "Tool", "Pick locks and disarm traps with proficiency.", "25 gp"),
  itemCard("component-pouch", "Component Pouch", "Spellcasting Focus", 2, "Gear", "Holds material components without a listed cost.", "25 gp"),
  itemCard("arcane-focus", "Arcane Focus", "Spellcasting Focus", 1, "Gear", "Orb, crystal, rod, staff, or wand used in place of components.", "5-20 gp"),
  itemCard("druidic-focus", "Druidic Focus", "Spellcasting Focus", 1, "Gear", "Mistletoe, totem, wooden staff, or yew wand used in place of components.", "1-10 gp"),
  itemCard("holy-symbol", "Holy Symbol", "Spellcasting Focus", 1, "Gear", "Amulet, emblem, or reliquary used as a divine focus.", "5 gp"),
  itemCard("spellbook", "Spellbook", "Adventuring Gear", 3, "Gear", "100 vellum pages for recording wizard spells.", "50 gp"),
  itemCard("lute", "Lute", "Tool", 2, "Musical instrument", "A musical instrument; usable as a bard's spellcasting focus.", "35 gp"),
  // Equipment packs (PHB p.151), contents summarized.
  itemCard("burglars-pack", "Burglar's Pack", "Adventuring Gear", 44.5, "Equipment pack", "Backpack, 1,000 ball bearings, 10 ft string, bell, 5 candles, crowbar, hammer, 10 pitons, hooded lantern, 2 flasks of oil, 5 days rations, tinderbox, waterskin, 50 ft hempen rope.", "16 gp"),
  itemCard("diplomats-pack", "Diplomat's Pack", "Adventuring Gear", 36, "Equipment pack", "Chest, 2 map or scroll cases, fine clothes, ink, pen, lamp, 2 flasks of oil, 5 sheets of paper, perfume, sealing wax, soap.", "39 gp"),
  itemCard("dungeoneers-pack", "Dungeoneer's Pack", "Adventuring Gear", 61.5, "Equipment pack", "Backpack, crowbar, hammer, 10 pitons, 10 torches, tinderbox, 10 days rations, waterskin, 50 ft hempen rope.", "12 gp"),
  itemCard("entertainers-pack", "Entertainer's Pack", "Adventuring Gear", 38, "Equipment pack", "Backpack, bedroll, 2 costumes, 5 candles, 5 days rations, waterskin, disguise kit.", "40 gp"),
  itemCard("explorers-pack", "Explorer's Pack", "Adventuring Gear", 59, "Equipment pack", "Backpack, bedroll, mess kit, tinderbox, 10 torches, 10 days rations, waterskin, 50 ft hempen rope.", "10 gp"),
  itemCard("priests-pack", "Priest's Pack", "Adventuring Gear", 24, "Equipment pack", "Backpack, blanket, 10 candles, tinderbox, alms box, 2 blocks of incense, censer, vestments, 2 days rations, waterskin.", "19 gp"),
  itemCard("scholars-pack", "Scholar's Pack", "Adventuring Gear", 10, "Equipment pack", "Backpack, book of lore, ink, ink pen, 10 sheets of parchment, little bag of sand, small knife.", "40 gp"),
  itemCard("potion-of-healing", "Potion of Healing", "Potion", 0.5, "Common magic item", "Regain 2d4 + 2 hit points.", "50 gp"),
  itemCard("bag-of-holding", "Bag of Holding", "Wondrous Item", 15, "Uncommon magic item", "Extradimensional storage: holds up to 500 lb, not exceeding 64 cubic feet. The bag always weighs 15 lb, whatever is inside."),
  itemCard("wand-of-magic-missiles", "Wand of Magic Missiles", "Wand", 1, "Uncommon magic item", "7 charges. Cast magic missile: 1 charge per spell level (1st-3rd). Regains 1d6 + 1 expended charges at dawn. Last charge: roll a d20; on a 1 the wand crumbles to ash."),
  itemCard("cloak-of-protection", "Cloak of Protection", "Wondrous Item", 1, "Uncommon magic item", "+1 AC and saving throws. Requires attunement."),
  itemCard("ring-of-protection", "Ring of Protection", "Ring", 0, "Rare magic item", "+1 AC and saving throws. Requires attunement."),
  itemCard("potion-of-greater-healing", "Potion of Greater Healing", "Potion", 0.5, "Uncommon magic item", "Regain 4d4 + 4 hit points."),
  itemCard("potion-of-superior-healing", "Potion of Superior Healing", "Potion", 0.5, "Rare magic item", "Regain 8d4 + 8 hit points."),
  itemCard("potion-of-supreme-healing", "Potion of Supreme Healing", "Potion", 0.5, "Very rare magic item", "Regain 10d4 + 20 hit points."),
  itemCard("amulet-of-health", "Amulet of Health", "Wondrous Item", 1, "Rare magic item", "Sets your Constitution score to 19 while worn (no effect if it's already 19 or higher). Requires attunement."),
  itemCard("gauntlets-of-ogre-power", "Gauntlets of Ogre Power", "Wondrous Item", 1, "Uncommon magic item", "Sets your Strength score to 19 while worn (no effect if it's already 19 or higher). Requires attunement."),
  itemCard("headband-of-intellect", "Headband of Intellect", "Wondrous Item", 1, "Uncommon magic item", "Sets your Intelligence score to 19 while worn (no effect if it's already 19 or higher). Requires attunement."),
  ...[["hill", 21, "Rare"], ["stone", 23, "Very rare"], ["frost", 23, "Very rare"], ["fire", 25, "Very rare"], ["cloud", 27, "Legendary"], ["storm", 29, "Legendary"]].map(([kind, score, rarity]) =>
    itemCard(`belt-of-${kind}-giant-strength`, `Belt of ${kind[0].toUpperCase()}${kind.slice(1)} Giant Strength`, "Wondrous Item", 1, `${rarity} magic item`, `Sets your Strength score to ${score} while worn (no effect if it's already ${score} or higher). Requires attunement.`)),
  itemCard("bracers-of-defense", "Bracers of Defense", "Wondrous Item", 1, "Rare magic item", "+2 AC while you wear no armor and use no shield. Requires attunement."),
  itemCard("periapt-of-wound-closure", "Periapt of Wound Closure", "Wondrous Item", 1, "Uncommon magic item", "You stabilize whenever you start your turn dying. Hit Dice you roll to regain hit points restore double. Requires attunement."),
  ...[["strength", "Strength"], ["agility", "Dexterity"], ["fortitude", "Constitution"], ["intellect", "Intelligence"], ["insight", "Wisdom"], ["leadership", "Charisma"]].map(([kind, ability]) =>
    itemCard(`ioun-stone-${kind}`, `Ioun Stone (${kind[0].toUpperCase()}${kind.slice(1)})`, "Wondrous Item", 0, "Very rare magic item", `+2 ${ability} score, to a maximum of 20, while it orbits your head. Requires attunement.`))
];

const SPECIES_PRESETS = [
  ["Dragonborn", 30, "Draconic ancestry grants a breath weapon and resistance to its damage type.", "fire", { str: 2, cha: 1 }],
  ["Hill Dwarf", 25, "Darkvision, dwarven resilience against poison, Stonecunning (History checks about stonework count as proficient and add double your proficiency bonus), and +1 HP per level (Dwarven Toughness).", "hammer", { con: 2, wis: 1 }],
  ["Mountain Dwarf", 25, "Darkvision, dwarven resilience, Stonecunning (History checks about stonework count as proficient and add double your proficiency bonus), and light and medium armor training.", "mountains", { str: 2, con: 2 }],
  ["High Elf", 30, "Darkvision, keen senses, fey ancestry, trance, elf weapon training, and one wizard cantrip.", "moon-stars", { dex: 2, int: 1 }],
  ["Wood Elf", 35, "Darkvision, keen senses, fey ancestry, trance, elf weapon training, and Mask of the Wild.", "tree-evergreen", { dex: 2, wis: 1 }],
  ["Forest Gnome", 25, "Darkvision, gnome cunning, the minor illusion cantrip, and Speak with Small Beasts.", "gear", { int: 2, dex: 1 }],
  ["Rock Gnome", 25, "Darkvision, gnome cunning, artificer's lore, and tinker's tools.", "gear", { int: 2, con: 1 }],
  ["Half-Elf", 30, "Darkvision, fey ancestry, and two extra skill proficiencies. +1 to two other abilities of your choice.", "moon", { cha: 2 }],
  ["Half-Orc", 30, "Darkvision, relentless endurance, and savage critical hits.", "barbell", { str: 2, con: 1 }],
  ["Lightfoot Halfling", 25, "Lucky, brave, halfling nimbleness, and Naturally Stealthy.", "clover", { dex: 2, cha: 1 }],
  ["Stout Halfling", 25, "Lucky, brave, halfling nimbleness, and Stout Resilience against poison.", "clover", { dex: 2, con: 1 }],
  ["Human", 30, "+1 to every ability score.", "user", { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 }],
  ["Variant Human", 30, "+1 to two abilities of your choice, one skill, and one feat.", "user-plus", {}],
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
const DWARF_GRANTS = { languages: ["Common", "Dwarvish"], weapons: ["Battleaxe, handaxe, light hammer, warhammer"], tools: [], choose: { tool: ["Smith's tools", "Brewer's supplies", "Mason's tools"] } };
const ELF_GRANTS = { languages: ["Common", "Elvish"], skills: ["perception"], weapons: ["Longsword, shortsword, shortbow, longbow"] };
const SPECIES_GRANTS = {
  Dragonborn: { languages: ["Common", "Draconic"], choose: { ancestry: true } },
  Dwarf: DWARF_GRANTS,
  "Hill Dwarf": { ...DWARF_GRANTS, hpPerLevel: 1 },
  "Mountain Dwarf": { ...DWARF_GRANTS, armor: ["Light armor, medium armor"] },
  Elf: { languages: ["Common", "Elvish"], skills: ["perception"] },
  "High Elf": { ...ELF_GRANTS, languages: ["Common", "Elvish", "one extra language"], choose: { cantripFrom: "wizard" } },
  "Wood Elf": ELF_GRANTS,
  Gnome: { languages: ["Common", "Gnomish"] },
  "Forest Gnome": { languages: ["Common", "Gnomish"], cantrips: ["minor-illusion"] },
  "Rock Gnome": { languages: ["Common", "Gnomish"], tools: ["Tinker's tools"] },
  "Half-Elf": { languages: ["Common", "Elvish", "one extra language"], choose: { bonuses: [1, 1], skills: 2, exclude: ["cha"] } },
  "Half-Orc": { languages: ["Common", "Orc"], skills: ["intimidation"] },
  Halfling: { languages: ["Common", "Halfling"] },
  "Lightfoot Halfling": { languages: ["Common", "Halfling"] },
  "Stout Halfling": { languages: ["Common", "Halfling"] },
  Human: { languages: ["Common", "one extra language"] },
  "Variant Human": { languages: ["Common", "one extra language"], choose: { bonuses: [1, 1], skills: 1, feat: true } },
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
  // Restore Balance: uses equal to your proficiency bonus, regained on a long rest (Tasha's).
  "clockwork-soul": { trackers: (level, prof) => [["Restore Balance", prof, "long"]] },
  hexblade: { armor: ["Medium armor, shields"], weapons: ["Martial weapons"], trackers: () => [["Hexblade's Curse", 1, "short"]] },
  "eldritch-knight": {},
  champion: {},
  "arcane-archer": { trackers: level => level >= 3 ? [["Arcane Shot", 2, "short"]] : [] },
  samurai: { trackers: level => level >= 3 ? [["Fighting Spirit", 3, "long"]] : [] },
  // Psionic Energy dice: twice your proficiency bonus, all back on a long rest, one back on a short rest (Tasha's).
  "psi-warrior": { trackers: (level, prof) => level >= 3 ? [["Psionic Energy Dice", prof * 2, "long"]] : [] },
  soulknife: { trackers: (level, prof) => level >= 3 ? [["Psionic Energy Dice", prof * 2, "long"]] : [] },
  "rune-knight": { trackers: (level, prof) => level >= 3 ? [["Giant's Might", prof, "long"]] : [] },
  "echo-knight": { trackers: () => [["Unleash Incarnation", Math.max(1, mod("con")), "long"]] },
  "wild-magic": { classId: "sorcerer", trackers: () => [["Tides of Chaos", 1, "long"]] },
  stars: { trackers: (level, prof) => [["Star Map Guiding Bolt", prof, "long"]] },
  peace: { trackers: (level, prof) => [["Emboldening Bond", prof, "long"]] },
  "war-magic": {},
  "life": { armor: ["Heavy armor"] },
  "nature": { armor: ["Heavy armor"] },
  "order": { armor: ["Heavy armor"] },
  "twilight": { armor: ["Heavy armor"], weapons: ["Martial weapons"] },
  "death": { weapons: ["Martial weapons"] },
  "war": { armor: ["Heavy armor"], weapons: ["Martial weapons"] },
  "tempest": { armor: ["Heavy armor"], weapons: ["Martial weapons"] },
  "forge": { armor: ["Heavy armor"] },
  "valor": { armor: ["Medium armor, shields"], weapons: ["Martial weapons"] },
  "swords": { armor: ["Medium armor"], weapons: ["Scimitar"] },
  // Bladesong: proficiency bonus uses per long rest (Tasha's).
  "bladesinging": { armor: ["Light armor"], weapons: ["One one-handed melee weapon"], trackers: (level, prof) => [["Bladesong", prof, "long"]] }
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
  ["Criminal", "Deception, Stealth", "One type of gaming set, thieves' tools", "Criminal Contact", "key"],
  ["Folk Hero", "Animal Handling, Survival", "One type of artisan's tools, vehicles (land)", "Rustic Hospitality", "plant"],
  ["Noble", "History, Persuasion", "One type of gaming set, one language", "Position of Privilege", "crown"],
  ["Sage", "Arcana, History", "Two languages", "Researcher", "scroll"],
  ["Soldier", "Athletics, Intimidation", "One type of gaming set, vehicles (land)", "Military Rank", "medal"]
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

// Per-background personality tables for "Generate" (PHB backgrounds). Original wording, written for ForgeSheet.
const BACKGROUND_PERSONALITY = {
  Acolyte: {
    traits: ["I find a lesson from my faith in almost everything that happens.", "I keep the small rituals of my temple even on the road.", "I listen patiently, the way I listened to worshippers who came for counsel.", "Plain food and a hard bed don't bother me; I was raised on both."],
    ideals: ["Devotion. My god's will matters more than my comfort.", "Mercy. Everyone deserves a second chance to do right.", "Order. Sacred rules exist so people can live together."],
    bonds: ["The temple that raised me can always count on me.", "I carry a holy text I have sworn to return to its shrine.", "A fellow acolyte left the faith, and I want to know why."],
    flaws: ["I judge people who don't share my beliefs more harshly than I should.", "I trust anyone who wears the right holy symbol.", "Once I decide something is righteous, I stop listening."]
  },
  Charlatan: {
    traits: ["I have a different name ready for every town.", "I compliment people out of habit, sincere or not.", "I can't pass up a chance to test a new story on a stranger.", "I laugh off danger, because looking nervous is bad for business."],
    ideals: ["Independence. Nobody tells me who to be.", "Fairness. I only fleece people who can afford it.", "Ambition. One big score and I'm done with this life."],
    bonds: ["A mark I ruined deserves to be repaid someday.", "My old partner saved me from the noose, and I owe them.", "There's a forged deed in my pack that could change everything."],
    flaws: ["I can't resist a con, even when honesty would work better.", "When cornered, I lie first and think second.", "I spend money as fast as I swindle it."]
  },
  Criminal: {
    traits: ["I always know where the exits are.", "I size up everyone's purse before their face.", "I speak quietly and expect others to do the same.", "I keep my promises to thieves and break them to lords."],
    ideals: ["Loyalty. You don't sell out your crew.", "Freedom. Laws are chains for people too timid to break them.", "Greed. I want enough coin that I never go hungry again."],
    bonds: ["My old gang still thinks I owe them a cut.", "Someone took the fall for me, and I mean to get them out.", "A city watch captain has sworn to see me hang."],
    flaws: ["When I see something valuable, I start planning how to take it.", "I don't trust anyone who hasn't broken a law.", "If a plan goes bad, my first instinct is to run."]
  },
  Entertainer: {
    traits: ["Every room is a stage, and I can't help performing.", "I collect songs and stories wherever I go.", "I get restless when no one is paying attention to me.", "I answer bad news with a joke."],
    ideals: ["Beauty. A good performance makes the world better.", "Honesty. Art should show people the truth.", "Fame. I want my name remembered after I'm gone."],
    bonds: ["My first instrument was a gift from someone I'll never forget.", "A rival performer stole my best act, and I want it back.", "The troupe that raised me is still out there on the road."],
    flaws: ["I'll do almost anything for applause.", "I can't stand to share the spotlight.", "I make promises on stage that I can't keep off it."]
  },
  "Folk Hero": {
    traits: ["I judge people by how they treat farmers and laborers.", "I fix broken things whenever I find them.", "When I make up my mind, I don't back down.", "I'm more comfortable in a field than a palace."],
    ideals: ["Justice. The powerful must answer for what they do.", "Hope. Ordinary people can change their own fate.", "Duty. Someone has to stand up, so it may as well be me."],
    bonds: ["My home village is counting on me.", "I still keep the tool I used on the day I became a hero.", "A lord's cruelty drove me from my family, and I haven't forgiven it."],
    flaws: ["I believe the stories people tell about me a little too much.", "I'm stubborn even when I'm wrong.", "I have no patience for nobles or their manners."]
  },
  "Guild Artisan": {
    traits: ["I can't stop pointing out how something could be made better.", "I measure twice and act once.", "I talk business with anyone who will listen.", "I'm proud of my calluses."],
    ideals: ["Craft. Good work is its own reward.", "Community. The guild looks after its members, and so do I.", "Prosperity. Honest trade should make honest people rich."],
    bonds: ["My guild gave me everything, and I owe it my best work.", "My master's finest piece was stolen, and I'll find it.", "I'm building something that will outlast me."],
    flaws: ["I look down on shoddy work and the people who make it.", "I'll bend the truth to close a deal.", "I take any criticism of my craft personally."]
  },
  Hermit: {
    traits: ["I'm comfortable with long silences.", "I forget everyday manners after years alone.", "I ask strange questions and wait carefully for the answers.", "I notice small things in nature that others walk past."],
    ideals: ["Insight. Quiet reflection reveals what noise hides.", "Self-knowledge. Understand yourself before judging others.", "Solitude. Some truths can only be found alone."],
    bonds: ["My retreat gave me a discovery I must share with the right person.", "I left someone behind when I withdrew from the world.", "I tend a hidden place that must stay safe."],
    flaws: ["I'm slow to trust people after so long on my own.", "I keep secrets even when sharing them would help.", "I get lost in my own thoughts at the worst moments."]
  },
  Noble: {
    traits: ["I expect good manners and offer them in return.", "I know the names and crests of every great house.", "I take charge without thinking about it.", "I dress well, even on the road."],
    ideals: ["Responsibility. Rank exists to protect those beneath it.", "Family. My house's honor comes before my own.", "Power. Influence is a tool, and I mean to use it."],
    bonds: ["My family's lands are in danger, and I'll do anything to save them.", "I'm betrothed to someone I've never met.", "A rival house wronged mine, and I won't forget it."],
    flaws: ["I assume commoners will do what I tell them.", "I hide my mistakes to protect my family's name.", "I can't turn down a challenge to my honor."]
  },
  Outlander: {
    traits: ["I'd rather sleep under the stars than in a bed.", "I keep track of the weather without meaning to.", "Cities make me twitchy.", "I speak bluntly and expect the same."],
    ideals: ["Nature. The wild has its own balance worth keeping.", "Strength. Only the strong survive out there.", "Kinship. My tribe or clan is my family."],
    bonds: ["My people sent me out to bring something home.", "I'm the last to remember the old ways of my land.", "A beast I spared once spared me in return."],
    flaws: ["I don't understand why people put up with laws.", "I solve arguments with my fists.", "I'd let a town burn before I'd let the forest be cut."]
  },
  Sage: {
    traits: ["I explain things in far more detail than anyone wants.", "I keep notes on everything.", "I'd rather read than talk.", "I correct people's facts, even when it's rude."],
    ideals: ["Knowledge. Understanding is worth almost any price.", "Truth. A comforting lie is still a lie.", "Logic. Feelings shouldn't cloud a good argument."],
    bonds: ["I'm searching for a book that may not exist.", "My old mentor's research is unfinished, and I mean to finish it.", "The library that trained me is in danger."],
    flaws: ["I forget that people are more than puzzles.", "I'll take reckless risks to learn a secret.", "I can't admit I don't know something."]
  },
  Sailor: {
    traits: ["I swear by the sea and curse like a deckhand.", "I tie knots when I'm nervous.", "I trust my crewmates with my life.", "I have a story for every port."],
    ideals: ["Freedom. The horizon belongs to everyone.", "Teamwork. A ship sinks if one hand slacks.", "Adventure. There's always another shore to find."],
    bonds: ["My first ship went down, and I'm the only one who knows why.", "I owe my captain a debt I can't repay in coin.", "Someone waits for me in a port town."],
    flaws: ["I drink too much once I'm ashore.", "I follow orders even when I shouldn't.", "I pick fights to prove I'm not afraid."]
  },
  Soldier: {
    traits: ["I keep my gear clean and ready.", "I make camp the same way every night.", "I joke about death to keep fear at bay.", "I respect rank, even when the officer doesn't deserve it."],
    ideals: ["Discipline. Order keeps people alive.", "Protection. I fight so others don't have to.", "Glory. I want to be remembered for my deeds in battle."],
    bonds: ["I still carry a token from a comrade who fell beside me.", "My old unit is the closest thing I have to family.", "An enemy commander escaped me, and I'll find them."],
    flaws: ["I see every problem as a battle to win.", "I obey orders without asking if they're right.", "Memories of the war still haunt me at night."]
  },
  Urchin: {
    traits: ["I eat fast, in case someone takes my food.", "I know every alley and rooftop in my old city.", "I'm quick to make friends with stray animals.", "I hide a little of everything I'm given."],
    ideals: ["Survival. Whatever it takes to see tomorrow.", "Generosity. I remember being hungry, so I share.", "Change. Nobody should have to live the way I did."],
    bonds: ["The other street kids from my old corner are my family.", "A stranger once showed me kindness, and I want to pay it forward.", "I'll return to my city someday and make it better."],
    flaws: ["I steal small things out of habit.", "I don't trust anyone who's never been poor.", "I panic when I'm trapped in small, closed spaces."]
  }
};

const FEAT_PRESETS = [
  "Ability Score Improvement", "Alert", "Athlete", "Crossbow Expert", "Defensive Duelist",
  "Dual Wielder", "Dungeon Delver", "Durable", "Elemental Adept", "Great Weapon Master",
  "Healer", "Inspiring Leader", "Lucky", "Magic Initiate", "Mobile", "Resilient",
  "Sentinel", "Sharpshooter", "Skilled", "Spell Sniper", "Tough", "War Caster"
];

// ---------------------------------------------------------------------------------------------
// Character-creation tables (PHB ch.1-5). Choices the wizard offers; summaries are original wording.
// ---------------------------------------------------------------------------------------------
// PHB p.123.
const STANDARD_LANGUAGES = ["Common", "Dwarvish", "Elvish", "Giant", "Gnomish", "Goblin", "Halfling", "Orc"];
const EXOTIC_LANGUAGES = ["Abyssal", "Celestial", "Deep Speech", "Draconic", "Infernal", "Primordial", "Sylvan", "Undercommon"];

// PHB p.154-155.
const TOOL_GROUPS = {
  artisan: ["Alchemist's supplies", "Brewer's supplies", "Calligrapher's supplies", "Carpenter's tools", "Cartographer's tools", "Cobbler's tools", "Cook's utensils", "Glassblower's tools", "Jeweler's tools", "Leatherworker's tools", "Mason's tools", "Painter's supplies", "Potter's tools", "Smith's tools", "Tinker's tools", "Weaver's tools", "Woodcarver's tools"],
  gaming: ["Dice set", "Dragonchess set", "Playing card set", "Three-Dragon Ante set"],
  instrument: ["Bagpipes", "Drum", "Dulcimer", "Flute", "Lute", "Lyre", "Horn", "Pan flute", "Shawm", "Viol"],
  other: ["Disguise kit", "Forgery kit", "Herbalism kit", "Navigator's tools", "Poisoner's kit", "Thieves' tools", "Vehicles (land)", "Vehicles (water)"]
};

// Class starting gold instead of class equipment (PHB p.143; TCE for the artificer). "5d4*10" = 5d4 x 10 gp.
const CLASS_STARTING_GOLD = {
  artificer: "5d4*10", barbarian: "2d4*10", bard: "5d4*10", cleric: "5d4*10", druid: "2d4*10", fighter: "5d4*10",
  monk: "5d4", paladin: "5d4*10", ranger: "5d4*10", rogue: "4d4*10", sorcerer: "3d4*10", warlock: "4d4*10", wizard: "4d4*10"
};

// Class starting equipment (PHB ch.3, TCE artificer). Each group lists its options; a group with one option is given.
// Tokens: a catalog item name ("x2" for several), "pick:<kind>" for "any <kind>" (simple, simpleMelee, martial,
// martialMelee, instrument), or "text:<item>" for gear the catalog doesn't carry.
const CLASS_STARTING_EQUIPMENT = {
  artificer: [[["pick:simple", "pick:simple"]], [["Light Crossbow", "Crossbow Bolts (20)"]], [["Studded Leather"], ["Scale Mail"]], [["Thieves' Tools", "Dungeoneer's Pack"]]],
  barbarian: [[["Greataxe"], ["pick:martialMelee"]], [["Handaxe x2"], ["pick:simple"]], [["Explorer's Pack", "Javelin x4"]]],
  bard: [[["Rapier"], ["Longsword"], ["pick:simple"]], [["Diplomat's Pack"], ["Entertainer's Pack"]], [["Lute"], ["pick:instrument"]], [["Leather Armor", "Dagger"]]],
  // VERIFY: Blood Hunter (2020) starting equipment as recalled; no starting-gold formula is recorded for it.
  bloodhunter: [[["pick:martial"], ["pick:simple", "pick:simple"]], [["Light Crossbow", "Crossbow Bolts (20)"], ["Hand Crossbow", "Crossbow Bolts (20)"]], [["Studded Leather"], ["Scale Mail"]], [["Explorer's Pack", "text:Alchemist's supplies"]]],
  cleric: [[["Mace"], ["Warhammer"]], [["Scale Mail"], ["Leather Armor"], ["Chain Mail"]], [["Light Crossbow", "Crossbow Bolts (20)"], ["pick:simple"]], [["Priest's Pack"], ["Explorer's Pack"]], [["Shield", "Holy Symbol"]]],
  druid: [[["Shield"], ["pick:simple"]], [["Scimitar"], ["pick:simpleMelee"]], [["Leather Armor", "Explorer's Pack", "Druidic Focus"]]],
  fighter: [[["Chain Mail"], ["Leather Armor", "Longbow", "Arrows (20)"]], [["pick:martial", "Shield"], ["pick:martial", "pick:martial"]], [["Light Crossbow", "Crossbow Bolts (20)"], ["Handaxe x2"]], [["Dungeoneer's Pack"], ["Explorer's Pack"]]],
  monk: [[["Shortsword"], ["pick:simple"]], [["Dungeoneer's Pack"], ["Explorer's Pack"]], [["Dart x10"]]],
  paladin: [[["pick:martial", "Shield"], ["pick:martial", "pick:martial"]], [["Javelin x5"], ["pick:simpleMelee"]], [["Priest's Pack"], ["Explorer's Pack"]], [["Chain Mail", "Holy Symbol"]]],
  ranger: [[["Scale Mail"], ["Leather Armor"]], [["Shortsword x2"], ["pick:simpleMelee", "pick:simpleMelee"]], [["Dungeoneer's Pack"], ["Explorer's Pack"]], [["Longbow", "Arrows (20)"]]],
  rogue: [[["Rapier"], ["Shortsword"]], [["Shortbow", "Arrows (20)"], ["Shortsword"]], [["Burglar's Pack"], ["Dungeoneer's Pack"], ["Explorer's Pack"]], [["Leather Armor", "Dagger x2", "Thieves' Tools"]]],
  sorcerer: [[["Light Crossbow", "Crossbow Bolts (20)"], ["pick:simple"]], [["Component Pouch"], ["Arcane Focus"]], [["Dungeoneer's Pack"], ["Explorer's Pack"]], [["Dagger x2"]]],
  warlock: [[["Light Crossbow", "Crossbow Bolts (20)"], ["pick:simple"]], [["Component Pouch"], ["Arcane Focus"]], [["Scholar's Pack"], ["Dungeoneer's Pack"]], [["Leather Armor", "pick:simple", "Dagger x2"]]],
  wizard: [[["Quarterstaff"], ["Dagger"]], [["Component Pouch"], ["Arcane Focus"]], [["Scholar's Pack"], ["Explorer's Pack"]], [["Spellbook"]]]
};

// Background equipment and purse (PHB ch.4, variants included). Other books: add gear on the sheet.
const BACKGROUND_STARTING = {
  Acolyte: { gold: 15, gear: ["Holy Symbol", "text:Prayer book or prayer wheel", "text:Incense (5 sticks)", "text:Vestments", "text:Common clothes"] },
  Charlatan: { gold: 15, gear: ["text:Fine clothes", "text:Disguise kit", "text:Con tools of your choice"] },
  Criminal: { gold: 15, gear: ["text:Crowbar", "text:Dark common clothes with a hood"] },
  Spy: { gold: 15, gear: ["text:Crowbar", "text:Dark common clothes with a hood"] },
  Entertainer: { gold: 15, gear: ["pick:instrument", "text:Favor of an admirer", "text:Costume"] },
  Gladiator: { gold: 15, gear: ["text:Cheap unusual weapon, such as a trident or net", "text:Favor of an admirer", "text:Costume"] },
  "Folk Hero": { gold: 10, gear: ["pick:artisan", "text:Shovel", "text:Iron pot", "text:Common clothes"] },
  "Guild Artisan": { gold: 15, gear: ["pick:artisan", "text:Guild letter of introduction", "text:Traveler's clothes"] },
  "Guild Merchant": { gold: 15, gear: ["text:Mule and cart (in place of artisan's tools)", "text:Guild letter of introduction", "text:Traveler's clothes"] },
  Hermit: { gold: 5, gear: ["text:Scroll case of notes", "text:Winter blanket", "text:Common clothes", "text:Herbalism kit"] },
  Noble: { gold: 25, gear: ["text:Fine clothes", "text:Signet ring", "text:Scroll of pedigree"] },
  Knight: { gold: 25, gear: ["text:Fine clothes", "text:Signet ring", "text:Scroll of pedigree"] },
  Outlander: { gold: 10, gear: ["Quarterstaff", "text:Hunting trap", "text:Animal trophy", "text:Traveler's clothes"] },
  Sage: { gold: 10, gear: ["text:Bottle of ink", "text:Quill", "text:Small knife", "text:Letter from a dead colleague", "text:Common clothes"] },
  Sailor: { gold: 10, gear: ["Club", "text:Silk rope (50 ft)", "text:Lucky charm", "text:Common clothes"] },
  Pirate: { gold: 10, gear: ["Club", "text:Silk rope (50 ft)", "text:Lucky charm", "text:Common clothes"] },
  Soldier: { gold: 10, gear: ["text:Insignia of rank", "text:Trophy from a fallen enemy", "pick:gaming", "text:Common clothes"] },
  Urchin: { gold: 10, gear: ["text:Small knife", "text:Map of your home city", "text:Pet mouse", "text:Token from your parents", "text:Common clothes"] }
};

// Feats a background grants (SAiS, SCC, Planescape, Dragonlance, BGG). "(Variant)" fixes the feat's choice.
const BACKGROUND_FEATS = {
  "Astral Drifter": "Magic Initiate (Cleric)",
  Wildspacer: "Tough",
  "Lorehold Student": "Strixhaven Initiate (Lorehold)",
  "Prismari Student": "Strixhaven Initiate (Prismari)",
  "Quandrix Student": "Strixhaven Initiate (Quandrix)",
  "Silverquill Student": "Strixhaven Initiate (Silverquill)",
  "Witherbloom Student": "Strixhaven Initiate (Witherbloom)",
  "Gate Warden": "Scion of the Outer Planes",
  "Planar Philosopher": "Scion of the Outer Planes",
  "Knight of Solamnia": "Squire of Solamnia",
  "Mage of High Sorcery": "Initiate of High Sorcery",
  "Giant Foundling": "Strike of the Giants",
  "Rune Carver": "Rune Shaper"
};

// Extra movement modes (VGtM, EEPC, SCAG, MOoT, WBtW, VRGtR, AAG, LR, OGA). "walk" = equal to walking speed.
const SPECIES_MOVEMENT = {
  Aarakocra: { fly: 50, note: "no flying in medium or heavy armor" },
  "Tiefling (Winged)": { fly: 30 },
  Owlin: { fly: "walk", note: "no flying in medium or heavy armor" },
  Fairy: { fly: "walk", note: "no flying in medium or heavy armor" },
  Triton: { swim: 30 }, Lizardfolk: { swim: 30 }, "Water Genasi": { swim: 30 }, "Sea Elf": { swim: 30 }, Locathah: { swim: 30 },
  "Half-Elf (Aquatic)": { swim: 30 }, Giff: { swim: "walk" },
  Tabaxi: { climb: 20 }, Grung: { climb: 25 }, Dhampir: { climb: "walk" }, Hadozee: { climb: "walk" }
};

// Fizban's dragonborn ancestries (FTD p.10-12): breath is a 15 ft cone or 30 ft line (pick each use), DEX save.
const FTD_DRAGON_ANCESTRY = {
  "Chromatic Dragonborn": [["Black", "acid"], ["Blue", "lightning"], ["Green", "poison"], ["Red", "fire"], ["White", "cold"]],
  "Metallic Dragonborn": [["Brass", "fire"], ["Bronze", "lightning"], ["Copper", "acid"], ["Gold", "fire"], ["Silver", "cold"]],
  "Gem Dragonborn": [["Amethyst", "force"], ["Crystal", "radiant"], ["Emerald", "psychic"], ["Sapphire", "thunder"], ["Topaz", "necrotic"]]
};

// Innate spells cast without a slot (B13). [spell, character level, recharge, cast at slot level]. ability "choice" = INT,
// WIS or CHA picked at creation. Cantrips stay in SPECIES_GRANTS.cantrips.
const SPECIES_MAGIC = {
  Tiefling: { ability: "cha", spells: [["hellish-rebuke", 3, "long", 2], ["darkness", 5, "long"]] },
  "Tiefling (Feral)": { ability: "cha", spells: [["hellish-rebuke", 3, "long", 2], ["darkness", 5, "long"]] },
  "Tiefling (Devil's Tongue)": { ability: "cha", spells: [["charm-person", 3, "long", 2], ["enthrall", 5, "long"]] },
  "Tiefling (Hellfire)": { ability: "cha", spells: [["burning-hands", 3, "long", 2], ["darkness", 5, "long"]] },
  "Tiefling (Baalzebul)": { ability: "cha", spells: [["ray-of-sickness", 3, "long", 2], ["crown-of-madness", 5, "long"]] },
  "Tiefling (Dispater)": { ability: "cha", spells: [["disguise-self", 3, "long"], ["detect-thoughts", 5, "long"]] },
  "Tiefling (Fierna)": { ability: "cha", spells: [["charm-person", 3, "long", 2], ["suggestion", 5, "long"]] },
  "Tiefling (Glasya)": { ability: "cha", spells: [["disguise-self", 3, "long"], ["invisibility", 5, "long"]] },
  "Tiefling (Levistus)": { ability: "cha", spells: [["armor-of-agathys", 3, "long", 2], ["darkness", 5, "long"]] },
  "Tiefling (Mammon)": { ability: "cha", spells: [["floating-disk", 3, "long"], ["arcane-lock", 5, "long"]] },
  "Tiefling (Mephistopheles)": { ability: "cha", spells: [["burning-hands", 3, "long", 2], ["flame-blade", 5, "long"]] },
  "Tiefling (Zariel)": { ability: "cha", spells: [["searing-smite", 3, "long", 2], ["branding-smite", 5, "long"]] },
  Drow: { ability: "cha", spells: [["faerie-fire", 3, "long"], ["darkness", 5, "long"]] },
  "Half-Elf (Drow)": { ability: "cha", spells: [["faerie-fire", 3, "long"], ["darkness", 5, "long"]] },
  Duergar: { ability: "int", spells: [["enlarge-reduce", 3, "long"], ["invisibility", 5, "long"]] },
  Githyanki: { ability: "int", spells: [["jump", 3, "long"], ["misty-step", 5, "long"]] },
  Githzerai: { ability: "wis", spells: [["shield", 3, "long"], ["detect-thoughts", 5, "long"]] },
  "Air Genasi": { ability: "con", spells: [["levitate", 1, "long"]] },
  "Earth Genasi": { ability: "con", spells: [["pass-without-trace", 1, "long"]] },
  "Fire Genasi": { ability: "con", spells: [["burning-hands", 3, "long"]] },
  "Water Genasi": { ability: "con", spells: [["create-or-destroy-water", 3, "long", 2]] },
  "Yuan-ti Pureblood": { ability: "cha", spells: [["animal-friendship", 1, "will"], ["suggestion", 3, "long"]] },
  Triton: { ability: "cha", spells: [["fog-cloud", 1, "long"], ["gust-of-wind", 3, "long"], ["wall-of-water", 5, "long"]] },
  Firbolg: { ability: "wis", spells: [["detect-magic", 1, "short"], ["disguise-self", 1, "short"]] },
  "Pallid Elf": { ability: "wis", spells: [["sleep", 3, "long"], ["invisibility", 5, "long"]] },
  "Lotusden Halfling": { ability: "wis", spells: [["entangle", 3, "long"], ["spike-growth", 5, "long"]] },
  Fairy: { ability: "choice", spells: [["faerie-fire", 3, "long"], ["enlarge-reduce", 5, "long"]] },
  Hexblood: { ability: "choice", spells: [["disguise-self", 1, "long"], ["hex", 1, "long"]] },
  "Mark of Detection": { ability: "int", spells: [["detect-magic", 1, "long"], ["detect-poison-and-disease", 1, "long"], ["see-invisibility", 3, "long"]] },
  "Mark of Finding": { ability: "wis", spells: [["hunters-mark", 1, "long"], ["locate-object", 3, "long"]] },
  "Mark of Handling": { ability: "wis", spells: [["animal-friendship", 1, "long"], ["speak-with-animals", 1, "long"]] },
  "Mark of Healing": { ability: "wis", spells: [["cure-wounds", 1, "long"], ["lesser-restoration", 3, "long"]] },
  "Mark of Hospitality": { ability: "cha", spells: [["purify-food-and-drink", 1, "long"], ["unseen-servant", 1, "long"]] },
  "Mark of Making": { ability: "int", spells: [["magic-weapon", 1, "long"]] },
  "Mark of Passage": { ability: "dex", spells: [["misty-step", 1, "long"]] },
  "Mark of Scribing": { ability: "int", spells: [["comprehend-languages", 1, "long"], ["magic-mouth", 3, "long"]] },
  "Mark of Sentinel": { ability: "wis", spells: [["shield", 1, "long"]] },
  "Mark of Shadow": { ability: "cha", spells: [["invisibility", 3, "long"]] },
  "Mark of Storm": { ability: "cha", spells: [["gust-of-wind", 3, "long"]] },
  "Mark of Warding": { ability: "int", spells: [["alarm", 1, "long"], ["mage-armor", 1, "long"], ["arcane-lock", 3, "long"]] }
};

// Limited-use species traits that aren't spells: (level, prof) => [[name, uses, "short"|"long"]].
const aasimarTrackers = name => level => [["Healing Hands", 1, "long"], level >= 3 ? [name, 1, "long"] : null];
const SPECIES_TRACKERS = {
  Dragonborn: () => [["Breath Weapon", 1, "short"]],
  "Draconblood Dragonborn": () => [["Breath Weapon", 1, "short"], ["Forceful Presence", 1, "short"]],
  "Ravenite Dragonborn": () => [["Breath Weapon", 1, "short"], ["Vengeful Assault", 1, "short"]],
  "Chromatic Dragonborn": (level, prof) => [["Breath Weapon", prof, "long"], level >= 5 ? ["Chromatic Warding", 1, "long"] : null],
  "Metallic Dragonborn": (level, prof) => [["Breath Weapon", prof, "long"], level >= 5 ? ["Metallic Breath Weapon", 1, "long"] : null],
  "Gem Dragonborn": (level, prof) => [["Breath Weapon", prof, "long"], level >= 5 ? ["Gem Flight", 1, "long"] : null],
  "Protector Aasimar": aasimarTrackers("Radiant Soul"),
  "Scourge Aasimar": aasimarTrackers("Radiant Consumption"),
  "Fallen Aasimar": aasimarTrackers("Necrotic Shroud"),
  Firbolg: () => [["Hidden Step", 1, "short"]],
  Goliath: () => [["Stone's Endurance", 1, "short"]],
  Goblin: () => [["Fury of the Small", 1, "short"]],
  Hobgoblin: () => [["Saving Face", 1, "short"]],
  Kobold: () => [["Grovel, Cower, and Beg", 1, "short"]],
  Lizardfolk: () => [["Hungry Jaws", 1, "short"]],
  Eladrin: () => [["Fey Step", 1, "short"]],
  "Shadar-kai": () => [["Blessing of the Raven Queen", 1, "long"]],
  "Beasthide Shifter": () => [["Shifting", 1, "short"]],
  "Longtooth Shifter": () => [["Shifting", 1, "short"]],
  "Swiftstride Shifter": () => [["Shifting", 1, "short"]],
  "Wildhunt Shifter": () => [["Shifting", 1, "short"]],
  Leonin: () => [["Daunting Roar", 1, "short"]],
  "Astral Elf": (level, prof) => [["Starlight Step", prof, "long"]],
  Harengon: (level, prof) => [["Rabbit Hop", prof, "long"]],
  Hadozee: (level, prof) => [["Hadozee Dodge", prof, "long"]],
  Kender: (level, prof) => [["Taunt", prof, "long"]],
  Dhampir: (level, prof) => [["Vampiric Bite boost", prof, "long"]],
  Reborn: (level, prof) => [["Knowledge from a Past Life", prof, "long"]],
  "Mark of Sentinel": () => [["Vigilant Guardian", 1, "long"]]
};

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
  rule("combat", "Death Saving Throws", "At 0 HP, roll a d20 at the start of each turn: 10+ is a success, 9 or lower a failure. Three successes: stable. Three failures: dead. Natural 20: regain 1 HP. Natural 1: two failures. Taking damage at 0 HP is one failure (two on a critical hit). Healing or becoming stable resets both counts. A stable creature that isn't healed regains 1 HP after 1d4 hours. Stabilize: Wisdom (Medicine) DC 10 as an action, or a healer's kit use."),
  rule("combat", "Opportunity Attacks", "When a hostile creature you can see leaves your reach, you can use your reaction to make one melee attack against it. Disengaging, teleporting, or being moved without using movement doesn't provoke."),
  rule("combat", "Two-Weapon Fighting", "When you attack with a light melee weapon in one hand, you can use a bonus action to attack with a different light melee weapon in the other. Don't add your ability modifier to the bonus attack's damage unless it's negative."),
  rule("combat", "Grappling and Shoving", "Replace one attack: Athletics vs the target's Athletics or Acrobatics. Grapple sets its speed to 0; shove knocks it prone or pushes it 5 feet. The target can be at most one size larger than you."),
  rule("combat", "Critical Hits", "A natural 20 on an attack roll always hits and is a critical: roll all of the attack's damage dice twice, then add modifiers once. A natural 1 always misses."),
  rule("combat", "Squeezing", "A creature can squeeze through a space sized for a creature one size smaller. Each foot of movement there costs 1 extra foot, and while squeezing it has disadvantage on attack rolls and Dexterity saves, and attacks against it have advantage."),
  rule("combat", "Underwater Combat", "Melee weapon attacks have disadvantage unless the weapon is a dagger, javelin, shortsword, spear or trident (or the attacker has a swimming speed). Ranged weapon attacks miss beyond normal range and have disadvantage within it, unless made with a crossbow, a net, or a thrown weapon such as a javelin, spear, trident or dart. Anything fully underwater resists fire damage."),
  rule("combat", "Mounted Combat", "Mounting or dismounting costs half your speed. A controlled mount moves on your initiative and can only Dash, Disengage or Dodge. If something moves your mount against its will, or knocks you or it prone, make a DC 10 Dexterity save or fall prone in a space within 5 feet."),
  rule("combat", "Surprise", "A creature that doesn't notice a threat at the start of combat is surprised: it can't move or take actions on its first turn and can't take reactions until that turn ends."),
  rule("rest", "Short Rest", "At least 1 hour. Spend Hit Dice to heal: roll each die plus your CON modifier. Short-rest resources refresh."),
  rule("rest", "Long Rest", "At least 8 hours, at most once per 24 hours, and you must start it with at least 1 HP. Regain all HP and up to half your total Hit Dice (minimum 1). Exhaustion drops by 1 if you also ate and drank."),
  rule("equipment", "Carrying Capacity", "Strength score x 15 lb; push, drag or lift up to twice that, moving only 5 ft while over your capacity. Each size above Medium doubles both (Powerful Build counts as one size larger); Tiny halves them. 50 coins weigh 1 lb. Variant: over STR x 5 is encumbered (-10 ft); over STR x 10 is heavily encumbered (-20 ft and disadvantage on STR, DEX and CON checks, attacks and saves)."),
  rule("equipment", "Attunement", "Up to 3 attuned magic items (artificers: 4 at 10th, 5 at 14th, 6 at 18th). Attuning or ending attunement takes a short rest. A cursed item can't be unattuned until the curse is lifted, for example by Remove Curse."),
  rule("equipment", "Donning and Doffing Armor", "Light armor: 1 minute to put on, 1 minute to take off. Medium: 5 minutes on, 1 minute off. Heavy: 10 minutes on, 5 minutes off. A shield takes an action to don or doff. Someone helping halves the time to put armor on."),
  rule("condition", "Deafened", "Can't hear and automatically fails any ability check that requires hearing."),
  rule("condition", "Petrified", "Turned to stone: incapacitated, can't move or speak, unaware of surroundings. Attacks against it have advantage; it fails Strength and Dexterity saves, resists all damage, and is immune to poison and disease."),
  rule("condition", "Unconscious", "Incapacitated, can't move or speak, unaware of surroundings; drops what it holds and falls prone. Fails Strength and Dexterity saves. Attacks against it have advantage, and hits from within 5 feet are critical."),
  rule("condition", "Exhaustion", "Six levels: 1 disadvantage on checks, 2 speed halved, 3 disadvantage on attacks and saves, 4 HP maximum halved, 5 speed 0, 6 death. A long rest with food and drink removes one level."),
  rule("condition", "Blinded", "A blinded creature cannot see and automatically fails ability checks requiring sight. Attacks against it have advantage, and its attacks have disadvantage."),
  rule("condition", "Charmed", "A charmed creature cannot attack the charmer or target it with harmful abilities, and the charmer has advantage on social checks against it."),
  rule("condition", "Frightened", "A frightened creature has disadvantage on ability checks and attacks while the source of fear is in line of sight, and cannot willingly move closer."),
  rule("condition", "Grappled", "A grappled creature's speed becomes 0. The condition ends if the grappler is incapacitated or moved away."),
  rule("condition", "Incapacitated", "An incapacitated creature cannot take actions or reactions."),
  rule("condition", "Invisible", "An invisible creature is impossible to see without special senses. Its attacks have advantage, and attacks against it have disadvantage."),
  rule("condition", "Paralyzed", "A paralyzed creature is incapacitated, cannot move or speak, fails Strength and Dexterity saves. Attack rolls against it have advantage, and hits from within 5 feet are critical hits."),
  rule("condition", "Poisoned", "A poisoned creature has disadvantage on attack rolls and ability checks."),
  rule("condition", "Prone", "A prone creature's only movement option is crawling unless it stands, and it has disadvantage on attack rolls. Attacks against it from within 5 feet have advantage; attacks from farther away have disadvantage."),
  rule("condition", "Restrained", "Speed becomes 0, attacks against the creature have advantage, its attacks have disadvantage, and it has disadvantage on Dexterity saves."),
  rule("condition", "Stunned", "A stunned creature is incapacitated, cannot move, speaks falteringly, fails Strength and Dexterity saves, and attacks against it have advantage."),
  rule("class", "Artificer Infusions", "Infusions known / items infused at once: 4/2 at artificer 2, 6/3 at 6, 8/4 at 10, 10/5 at 14, 12/6 at 18. You can swap one known infusion when you gain an artificer level."),
  rule("class", "Warlock Invocations", "Invocations known: 2 at warlock 2, 3 at 5, 4 at 7, 5 at 9, 6 at 12, 7 at 15, 8 at 18. You can swap one known invocation when you gain a warlock level."),
  rule("class", "Metamagic", "Metamagic options known: 2 at sorcerer 3, 3 at 10, 4 at 17. Only one option per spell unless it says otherwise (Empowered Spell can join another)."),
  rule("class", "Wild Shape", "2 uses per short or long rest, lasting up to half your druid level in hours. Max beast CR 1/4 with no flying or swimming speed at druid 2, CR 1/2 with no flying speed at 4, CR 1 at 8. Circle of the Moon: CR 1 at 2, then druid level divided by 3 (rounded down) from 6.")
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
  "elemental-weapon", "protection-from-energy", "revivify", "water-breathing", "water-walk",
  "arcane-eye", "fabricate", "freedom-of-movement", "secret-chest",
  "faithful-hound", "private-sanctum", "resilient-sphere", "stone-shape", "stoneskin",
  "animate-objects", "arcane-hand", "creation", "greater-restoration", "wall-of-stone"
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
  "aberrant-mind": { 1: ["arms-of-hadar", "dissonant-whispers", "mind-sliver"], 3: ["calm-emotions", "detect-thoughts"], 5: ["hunger-of-hadar", "sending"], 7: ["black-tentacles", "summon-aberration"], 9: ["telepathic-bond", "telekinesis"] },
  "clockwork-soul": { 1: ["alarm", "protection-from-evil-and-good"], 3: ["aid", "lesser-restoration"], 5: ["dispel-magic", "protection-from-energy"], 7: ["freedom-of-movement", "summon-construct"], 9: ["greater-restoration", "wall-of-force"] },
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
  fathomless: ["create-or-destroy-water", "thunderwave", "gust-of-wind", "silence", "lightning-bolt", "sleet-storm", "control-water", "summon-elemental", "arcane-hand", "cone-of-cold"],
  genie: ["detect-evil-and-good", "phantasmal-force", "create-food-and-water", "phantasmal-killer", "creation", "wish"],
  undying: ["false-life", "ray-of-sickness", "blindness-deafness", "silence", "feign-death", "speak-with-dead", "aura-of-life", "death-ward", "contagion", "legend-lore"],
  undead: ["bane", "false-life", "blindness-deafness", "phantasmal-force", "phantom-steed", "speak-with-dead", "death-ward", "greater-invisibility", "antilife-shell", "cloudkill"]
};

function localSpell(index, name, level, classIds, castingTime, range, components, duration, concentration, summary) {
  return {
    index, name, level,
    classes: classIds.map(id => ({ index: id, name: id.charAt(0).toUpperCase() + id.slice(1) })),
    casting_time: castingTime, range, components, duration, concentration,
    ritual: /ritual/i.test(castingTime),
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
  localSpell("elemental-weapon", "Elemental Weapon", 3, ["paladin", "artificer"], "1 action", "Touch", ["V", "S"], "Concentration, up to 1 hour", true,
    "A nonmagical weapon becomes a +1 magic weapon and deals an extra 1d4 damage of a type you choose (acid, cold, fire, lightning, or thunder) on a hit. With a 5th- or 6th-level slot it is +2 and 2d4; 7th level or higher, +3 and 3d4."),
  localSpell("feign-death", "Feign Death", 3, ["bard", "cleric", "druid", "wizard"], "1 action (ritual)", "Touch", ["V", "S", "M"], "1 hour", false,
    "A willing creature appears dead to all outward inspection. It is blinded and incapacitated, its speed drops to 0, it resists all damage except psychic, and diseases and poisons have no effect on it until the spell ends."),
  localSpell("grasping-vine", "Grasping Vine", 4, ["druid", "ranger"], "1 bonus action", "30 feet", ["V", "S"], "Concentration, up to 1 minute", true,
    "A vine sprouts from a surface you can see. When you cast it, and as a bonus action on later turns, the vine lashes at a creature within 30 feet of it: Dexterity save or be pulled 20 feet toward the vine."),
  localSpell("hunger-of-hadar", "Hunger of Hadar", 3, ["warlock"], "1 action", "150 feet", ["V", "S", "M"], "Concentration, up to 1 minute", true,
    "A 20-foot-radius sphere of blackness and bitter cold. Creatures fully inside are blinded. A creature that starts its turn there takes 2d6 cold damage; one that ends its turn there makes a Dexterity save or takes 2d6 acid damage."),
  localSpell("staggering-smite", "Staggering Smite", 4, ["paladin"], "1 bonus action", "Self", ["V"], "Concentration, up to 1 minute", true,
    "Your next melee weapon hit deals an extra 4d6 psychic damage, and the target makes a Wisdom save; on a failure, until the end of its next turn it rolls attacks and ability checks with disadvantage and has no reactions."),
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
