const API_BASE = "https://www.dnd5eapi.co/api/2014";
const STORAGE_KEY = "forgesheet.character.v1";
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
  itemCard("shield", "Shield", "Armor", 6, "Adventuring gear", "+2 AC while wielded."),
  itemCard("leather-armor", "Leather Armor", "Armor", 10, "Light armor", "AC 11 + Dexterity modifier."),
  itemCard("scale-mail", "Scale Mail", "Armor", 45, "Medium armor", "AC 14 + Dex modifier, max 2. Disadvantage on Stealth."),
  itemCard("plate", "Plate", "Armor", 65, "Heavy armor", "AC 18. Requires Strength 15. Disadvantage on Stealth."),
  itemCard("backpack", "Backpack", "Adventuring Gear", 5, "Container", "Holds gear and supplies."),
  itemCard("rope-hempen", "Rope, Hempen", "Adventuring Gear", 10, "Gear", "50 feet of rope."),
  itemCard("healers-kit", "Healer's Kit", "Adventuring Gear", 3, "Gear", "10 uses. Stabilize a creature without a Medicine check."),
  itemCard("potion-of-healing", "Potion of Healing", "Potion", 0.5, "Common magic item", "Regain 2d4 + 2 hit points."),
  itemCard("bag-of-holding", "Bag of Holding", "Wondrous Item", 15, "Uncommon magic item", "Extradimensional storage. Contents usually do not count against carried weight here."),
  itemCard("wand-of-magic-missiles", "Wand of Magic Missiles", "Wand", 1, "Uncommon magic item", "7 charges. Cast magic missile; regains charges daily."),
  itemCard("cloak-of-protection", "Cloak of Protection", "Wondrous Item", 1, "Uncommon magic item", "+1 AC and saving throws. Requires attunement.")
];

const BACKGROUND_PRESETS = [
  ["Acolyte", "Insight, Religion", "Two languages", "Shelter of the Faithful"],
  ["Criminal", "Deception, Stealth", "Gaming set, thieves' tools", "Criminal Contact"],
  ["Folk Hero", "Animal Handling, Survival", "Artisan's tools, vehicles", "Rustic Hospitality"],
  ["Noble", "History, Persuasion", "Gaming set, one language", "Position of Privilege"],
  ["Sage", "Arcana, History", "Two languages", "Researcher"],
  ["Soldier", "Athletics, Intimidation", "Gaming set, vehicles", "Military Rank"]
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
  ["actions", "Actions"],
  ["spells", "Spells"],
  ["inventory", "Inventory"],
  ["features", "Features & Traits"],
  ["background", "Background"],
  ["notes", "Notes"],
  ["builder", "Builder"],
  ["classes", "Classes"],
  ["party", "Party"],
  ["campaign", "Campaign"],
  ["rules", "Rules"]
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
  rule("rest", "Short Rest", "At least 1 hour. You can spend Hit Dice to heal. Short-rest resources refresh."),
  rule("rest", "Long Rest", "At least 8 hours. Restores HP, spell slots, many resources, and reduces exhaustion by 1 if conditions are met."),
  rule("equipment", "Carrying Capacity", "Your carrying capacity is Strength score x 15 pounds. This app flags heavy load at two-thirds capacity."),
  rule("equipment", "Attunement", "Most characters can attune to up to 3 magic items at a time."),
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
  "arcane-eye", "fabricate", "freedom-of-movement", "secret-chest", "leomunds-secret-chest",
  "faithful-hound", "private-sanctum", "resilient-sphere", "stone-shape", "stoneskin",
  "animate-objects", "arcane-hand", "bigbys-hand", "creation", "greater-restoration", "wall-of-stone"
]);

const SUBCLASS_SPELLS = {
  armorer: { 3: ["magic-missile", "thunderwave"], 5: ["mirror-image", "shatter"], 9: ["hypnotic-pattern", "lightning-bolt"], 13: ["fire-shield", "greater-invisibility"], 17: ["passwall", "wall-of-force"] },
  alchemist: { 3: ["healing-word", "ray-of-sickness"], 5: ["flaming-sphere", "acid-arrow"], 9: ["gaseous-form", "mass-healing-word"], 13: ["blight", "death-ward"], 17: ["cloudkill", "raise-dead"] },
  artillerist: { 3: ["shield", "thunderwave"], 5: ["scorching-ray", "shatter"], 9: ["fireball", "wind-wall"], 13: ["ice-storm", "wall-of-fire"], 17: ["cone-of-cold", "wall-of-force"] },
  "battle-smith": { 3: ["heroism", "shield"], 5: ["branding-smite", "warding-bond"], 9: ["aura-of-vitality", "conjure-barrage"], 13: ["aura-of-purity", "fire-shield"], 17: ["banishing-smite", "mass-cure-wounds"] },
  life: { 1: ["bless", "cure-wounds"], 3: ["lesser-restoration", "spiritual-weapon"], 5: ["beacon-of-hope", "revivify"], 7: ["death-ward", "guardian-of-faith"], 9: ["mass-cure-wounds", "raise-dead"] },
  devotion: { 3: ["protection-from-evil-and-good", "sanctuary"], 5: ["lesser-restoration", "zone-of-truth"], 9: ["beacon-of-hope", "dispel-magic"], 13: ["freedom-of-movement", "guardian-of-faith"], 17: ["commune", "flame-strike"] },
  fiend: { 1: ["burning-hands", "command"], 3: ["blindness-deafness", "scorching-ray"], 5: ["fireball", "stinking-cloud"], 7: ["fire-shield", "wall-of-fire"], 9: ["flame-strike", "hallow"] }
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
    "Your next weapon hit deals +5d10 force damage. If that hit leaves the target at 50 hit points or fewer, it is banished — returned to its home plane, or held incapacitated in a harmless demiplane — until the spell ends.")
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
  officialSubclass("berserker", "Berserker", "barbarian", "Barbarian", "Primal Path"),
  officialSubclass("champion", "Champion", "fighter", "Fighter", "Martial Archetype"),
  officialSubclass("devotion", "Devotion", "paladin", "Paladin", "Sacred Oath"),
  officialSubclass("draconic", "Draconic", "sorcerer", "Sorcerer", "Sorcerous Origin"),
  officialSubclass("evocation", "Evocation", "wizard", "Wizard", "Arcane Tradition"),
  officialSubclass("fiend", "Fiend", "warlock", "Warlock", "Otherworldly Patron"),
  officialSubclass("hunter", "Hunter", "ranger", "Ranger", "Ranger Archetype"),
  officialSubclass("land", "Land", "druid", "Druid", "Druid Circle"),
  officialSubclass("life", "Life", "cleric", "Cleric", "Divine Domain"),
  officialSubclass("lore", "Lore", "bard", "Bard", "Bard College"),
  officialSubclass("open-hand", "Open Hand", "monk", "Monk", "Monastic Tradition"),
  officialSubclass("thief", "Thief", "rogue", "Rogue", "Roguish Archetype")
];
