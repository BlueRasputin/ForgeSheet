// D&D 5e (2014 rules) expansion content: species, backgrounds, feats, spells and items from the
// official supplements. Loaded after data.js and before classes.js; it only appends to data.js's
// globals and skips anything whose name/index already exists. Every summary is an original
// mechanical paraphrase; the full text lives in the sourcebook.
(() => {
  const addMissing = (list, rows, key) => {
    const seen = new Set(list.map(key));
    rows.forEach(row => {
      if (seen.has(key(row))) return;
      seen.add(key(row));
      list.push(row);
    });
  };

  // ---------------------------------------------------------------------------------------------
  // SPECIES. Row: [name, walk speed, trait summary, Phosphor icon, ability bonuses, size?]
  // Index 5 (size) is set only when the species isn't Medium. Fixed bonuses are the 2014 values;
  // Tasha's Customizing Your Origin lets a player move them (note appended below).
  // Sources: PHB subraces, VGtM, EEPC, SCAG, MToF, ERLW, GGR, MOoT, EGtW, Locathah Rising (LR),
  // Acquisitions Inc (AI), One Grung Above (OGA), Tortle Package (TP), SCC, WBtW, TCE, VRGtR,
  // Spelljammer (AAG), Dragonlance (DSotDQ), Fizban's (FTD).
  // ---------------------------------------------------------------------------------------------
  const FLEX = "Increase one ability score by 2 and another by 1.";
  const TIEFLING_BASE = "Darkvision, fire resistance, and";
  const species = [
    // PHB subraces not in data.js
    ["Drow", 30, "Darkvision 120 ft, Keen Senses, Fey Ancestry, Trance, Sunlight Sensitivity, drow weapon training, and Drow Magic: dancing lights, faerie fire at 3rd, darkness at 5th (CHA).", "moon", { dex: 2, cha: 1 }],
    ["Forest Gnome", 25, "Small. Darkvision, Gnome Cunning, Natural Illusionist (minor illusion cantrip), and Speak with Small Beasts.", "leaf", { int: 2, dex: 1 }],
    ["Rock Gnome", 25, "Small. Darkvision, Gnome Cunning, Artificer's Lore, and Tinker (build tiny clockwork devices).", "gear", { int: 2, con: 1 }],
    ["Lightfoot Halfling", 25, "Small. Lucky, Brave, Halfling Nimbleness, and Naturally Stealthy (hide behind larger creatures).", "clover", { dex: 2, cha: 1 }],
    ["Stout Halfling", 25, "Small. Lucky, Brave, Halfling Nimbleness, and Stout Resilience (advantage on saves and resistance against poison).", "clover", { dex: 2, con: 1 }],
    // Volo's Guide to Monsters
    ["Protector Aasimar", 30, "Darkvision, necrotic and radiant resistance, Healing Hands, and the light cantrip. From 3rd level, Radiant Soul gives a flying speed and extra radiant damage for 1 minute once per long rest.", "sun", { cha: 2, wis: 1 }],
    ["Scourge Aasimar", 30, "Darkvision, necrotic and radiant resistance, Healing Hands, and the light cantrip. From 3rd level, Radiant Consumption burns you and nearby creatures while adding radiant damage to your hits.", "sun", { cha: 2, con: 1 }],
    ["Fallen Aasimar", 30, "Darkvision, necrotic and radiant resistance, Healing Hands, and the light cantrip. From 3rd level, Necrotic Shroud can frighten nearby creatures and adds necrotic damage to your hits.", "skull", { cha: 2, str: 1 }],
    ["Firbolg", 30, "Firbolg Magic (detect magic and disguise self once per short rest), Hidden Step (bonus-action invisibility once per short rest), Powerful Build, and Speech of Beast and Leaf.", "tree-evergreen", { wis: 2, str: 1 }],
    ["Goliath", 30, "Stone's Endurance (reaction: reduce damage by 1d12 + Con once per short rest), Powerful Build, Mountain Born (high altitude and cold climates), and Athletics proficiency.", "mountains", { str: 2, con: 1 }],
    ["Kenku", 30, "Expert Forgery, Mimicry, and Kenku Training (two of Acrobatics, Deception, Sleight of Hand, or Stealth). Kenku speak only by mimicking sounds.", "bird", { dex: 2, wis: 1 }],
    ["Lizardfolk", 30, "Swim 30 ft, bite (1d6 piercing), natural armor 13 + Dex, hold breath 15 minutes, Cunning Artisan, Hunter's Lore (two skills), and Hungry Jaws (bonus-action bite that grants temporary HP).", "drop", { con: 2, wis: 1 }],
    ["Tabaxi", 30, "Climb 20 ft, darkvision, Cat's Claws (1d4 slashing), Feline Agility (double speed for a turn, recharges after a turn without moving), and Perception and Stealth proficiency.", "cat", { dex: 2, cha: 1 }],
    ["Triton", 30, "Swim 30 ft, amphibious, cold resistance, Emissary of the Sea, and Control Air and Water: fog cloud, gust of wind at 3rd, wall of water at 5th (CHA).", "waves", { str: 1, con: 1, cha: 1 }],
    ["Bugbear", 30, "Darkvision, Long-Limbed (+5 ft melee reach on your turn), Powerful Build, Stealth proficiency, and Surprise Attack (extra 2d6 damage against a surprised creature).", "hand-fist", { str: 2, dex: 1 }],
    ["Goblin", 30, "Small. Darkvision, Fury of the Small (extra damage equal to your level against a larger creature once per short rest), and Nimble Escape (Disengage or Hide as a bonus action).", "knife", { dex: 2, con: 1 }, "Small"],
    ["Hobgoblin", 30, "Darkvision, Martial Training (light armor and two martial weapons), and Saving Face (add up to +5 to a failed roll for allies you can see, once per short rest).", "shield", { con: 2, int: 1 }],
    ["Kobold", 30, "Small. Darkvision, Pack Tactics, Grovel, Cower, and Beg, and Sunlight Sensitivity.", "paw-print", { dex: 2, str: -2 }, "Small"],
    ["Orc", 30, "Darkvision, Aggressive (bonus-action move toward an enemy), Menacing (Intimidation proficiency), and Powerful Build.", "axe", { str: 2, con: 1, int: -2 }],
    ["Yuan-ti Pureblood", 30, "Darkvision, Magic Resistance, immunity to poison damage and the poisoned condition, and Innate Spellcasting: poison spray, animal friendship on snakes, suggestion at 3rd (CHA).", "eye", { cha: 2, int: 1 }],
    // Elemental Evil Player's Companion
    ["Aarakocra", 25, "Flying speed 50 ft (not in medium or heavy armor) and Talons (1d4 slashing unarmed strikes).", "bird", { dex: 2, wis: 1 }],
    ["Air Genasi", 30, "Unending Breath and Mingle with the Wind: levitate once per long rest (CON).", "wind", { con: 2, dex: 1 }],
    ["Earth Genasi", 30, "Earth Walk (ignore difficult terrain of earth or stone) and Merge with Stone: pass without trace once per long rest (CON).", "mountains", { con: 2, str: 1 }],
    ["Fire Genasi", 30, "Darkvision, fire resistance, and Reach to the Blaze: produce flame cantrip, burning hands once per long rest from 3rd level (CON).", "flame", { con: 2, int: 1 }],
    ["Water Genasi", 30, "Swim 30 ft, amphibious, acid resistance, and Call to the Wave: shape water cantrip, create or destroy water once per long rest from 3rd level (CON).", "drop", { con: 2, wis: 1 }],
    // Sword Coast Adventurer's Guide
    ["Half-Elf (Aquatic)", 30, "Darkvision and Fey Ancestry; a 30 ft swim speed replaces Skill Versatility (SCAG variant). +1 to two other abilities of your choice.", "waves", { cha: 2 }],
    ["Half-Elf (Drow)", 30, "Darkvision and Fey Ancestry; Drow Magic (dancing lights, faerie fire at 3rd, darkness at 5th) replaces Skill Versatility (SCAG variant). +1 to two other abilities of your choice.", "moon", { cha: 2 }],
    ["Half-Elf (High)", 30, "Darkvision and Fey Ancestry; one wizard cantrip replaces Skill Versatility (SCAG variant). +1 to two other abilities of your choice.", "moon-stars", { cha: 2 }],
    ["Half-Elf (Wood)", 30, "Darkvision and Fey Ancestry; elf weapon training, Fleet of Foot (35 ft), or Mask of the Wild replaces Skill Versatility (SCAG variant). +1 to two other abilities of your choice.", "tree-evergreen", { cha: 2 }],
    ["Duergar", 25, "Darkvision 120 ft, Duergar Resilience (advantage against illusions, charm, and paralysis), dwarven poison resilience, Sunlight Sensitivity, and Duergar Magic: enlarge at 3rd, invisibility at 5th (INT).", "hammer", { con: 2, str: 1 }],
    ["Deep Gnome (Svirfneblin)", 25, "Small. Darkvision 120 ft, Gnome Cunning, and Stone Camouflage (advantage on Stealth in rocky terrain).", "diamond", { int: 2, dex: 1 }],
    ["Ghostwise Halfling", 25, "Small. Lucky, Brave, Halfling Nimbleness, and Silent Speech (telepathy with one creature within 30 feet).", "ghost", { dex: 2, wis: 1 }],
    ["Tiefling (Feral)", 30, `${TIEFLING_BASE} Infernal Legacy spells (SCAG variant with a Dexterity bonus instead of Charisma).`, "flame", { dex: 2, int: 1 }],
    ["Tiefling (Winged)", 30, `${TIEFLING_BASE} bat-like wings: a 30 ft flying speed replaces Infernal Legacy (SCAG variant).`, "feather", { cha: 2, int: 1 }],
    ["Tiefling (Devil's Tongue)", 30, `${TIEFLING_BASE} vicious mockery, charm person at 3rd, enthrall at 5th instead of Infernal Legacy (SCAG variant).`, "mask-happy", { cha: 2, int: 1 }],
    ["Tiefling (Hellfire)", 30, `${TIEFLING_BASE} Infernal Legacy with burning hands in place of hellish rebuke (SCAG variant).`, "flame", { cha: 2, int: 1 }],
    // Mordenkainen's Tome of Foes
    ["Tiefling (Baalzebul)", 30, `${TIEFLING_BASE} Legacy of Maladomini: thaumaturgy, ray of sickness at 3rd, crown of madness at 5th (CHA).`, "flame", { cha: 2, int: 1 }],
    ["Tiefling (Dispater)", 30, `${TIEFLING_BASE} Legacy of Dis: thaumaturgy, disguise self at 3rd, detect thoughts at 5th (CHA).`, "flame", { cha: 2, dex: 1 }],
    ["Tiefling (Fierna)", 30, `${TIEFLING_BASE} Legacy of Phlegethos: friends, charm person at 3rd, suggestion at 5th (CHA).`, "flame", { cha: 2, wis: 1 }],
    ["Tiefling (Glasya)", 30, `${TIEFLING_BASE} Legacy of Malbolge: minor illusion, disguise self at 3rd, invisibility at 5th (CHA).`, "flame", { cha: 2, dex: 1 }],
    ["Tiefling (Levistus)", 30, `${TIEFLING_BASE} Legacy of Stygia: ray of frost, armor of Agathys at 3rd, darkness at 5th (CHA).`, "snowflake", { cha: 2, con: 1 }],
    ["Tiefling (Mammon)", 30, `${TIEFLING_BASE} Legacy of Minauros: mage hand, Tenser's floating disk at 3rd, arcane lock at 5th (CHA).`, "coins", { cha: 2, int: 1 }],
    ["Tiefling (Mephistopheles)", 30, `${TIEFLING_BASE} Legacy of Cania: mage hand, burning hands at 3rd, flame blade at 5th (CHA).`, "flame", { cha: 2, int: 1 }],
    ["Tiefling (Zariel)", 30, `${TIEFLING_BASE} Legacy of Avernus: thaumaturgy, searing smite at 3rd, branding smite at 5th (CHA).`, "sword", { cha: 2, str: 1 }],
    ["Eladrin", 30, "Darkvision, Keen Senses, Fey Ancestry, Trance, and Fey Step (misty step once per short rest), with a seasonal rider from 3rd level.", "leaf", { dex: 2, cha: 1 }],
    ["Sea Elf", 30, "Darkvision, Keen Senses, Fey Ancestry, Trance, swim 30 ft and water breathing (Child of the Sea), Friend of the Sea, and sea elf weapon training.", "fish", { dex: 2, con: 1 }],
    ["Shadar-kai", 30, "Darkvision, Keen Senses, Fey Ancestry, Trance, necrotic resistance, and Blessing of the Raven Queen (bonus-action teleport once per long rest; from 3rd level you also resist all damage until your next turn).", "moon", { dex: 2, con: 1 }],
    ["Githyanki", 30, "Decadent Mastery (one extra language and one skill or tool), Martial Prodigy (light and medium armor, shortswords, longswords, greatswords), and Githyanki Psionics: mage hand, jump at 3rd, misty step at 5th (INT).", "sword", { str: 2, int: 1 }],
    ["Githzerai", 30, "Mental Discipline (advantage on saves against charmed and frightened) and Githzerai Psionics: mage hand, shield at 3rd, detect thoughts at 5th (WIS).", "brain", { wis: 2, int: 1 }],
    // Eberron: Rising from the Last War
    ["Changeling", 30, "Shapechanger (change your appearance as an action) and Changeling Instincts (two of Deception, Insight, Intimidation, or Persuasion). +1 to one other ability of your choice.", "mask-happy", { cha: 2 }],
    ["Kalashtar", 30, "Dual Mind (advantage on Wisdom saves), Mental Discipline (psychic resistance), Mind Link (telepathy), and Severed from Dreams.", "eye", { wis: 2, cha: 1 }],
    ["Beasthide Shifter", 30, "Darkvision, Keen Senses (Perception), Natural Athlete (Athletics), and Shifting once per short rest: temporary HP plus an extra 1d6, and +1 AC while shifted.", "paw-print", { con: 2, str: 1 }],
    ["Longtooth Shifter", 30, "Darkvision, Keen Senses (Perception), Fierce (Intimidation), and Shifting once per short rest: temporary HP, and a bonus-action fang attack (1d6 piercing) while shifted.", "paw-print", { str: 2, dex: 1 }],
    ["Swiftstride Shifter", 30, "Darkvision, Keen Senses (Perception), Graceful (Acrobatics), and Shifting once per short rest: temporary HP, +10 ft speed, and a reaction to move when an enemy ends its turn near you.", "paw-print", { dex: 2, cha: 1 }],
    ["Wildhunt Shifter", 30, "Darkvision, Keen Senses (Perception), Natural Tracker (Survival), and Shifting once per short rest: temporary HP, advantage on Wisdom checks, and no advantage on attacks against you from nearby creatures.", "paw-print", { wis: 2, dex: 1 }],
    ["Warforged", 30, "Constructed Resilience (poison resistance, no need to eat, breathe, or sleep, immune to disease), Sentry's Rest, Integrated Protection (+1 AC), and Specialized Design (one skill and one tool). +1 to one other ability of your choice.", "robot", { con: 2 }],
    // Guildmasters' Guide to Ravnica
    ["Centaur", 40, "Fey type, Hooves (1d4 bludgeoning), Charge (bonus-action hoof attack after a straight 30 ft move), Equine Build, and Survivor (one of Animal Handling, Medicine, Nature, or Survival).", "horse", { str: 2, wis: 1 }],
    ["Loxodon", 30, "Powerful Build, Loxodon Serenity (advantage against charmed and frightened), natural armor 12 + Con, a prehensile Trunk, and Keen Smell.", "shield", { con: 2, wis: 1 }],
    ["Minotaur", 30, "Horns (1d6 piercing), Goring Rush (bonus-action horn attack after a Dash), Hammering Horns (bonus-action shove after a melee hit), and Imposing Presence (Intimidation or Persuasion).", "barbell", { str: 2, con: 1 }],
    ["Simic Hybrid", 30, "Darkvision and Animal Enhancement: manta glide, nimble climber, or underwater adaptation at 1st level, and a second enhancement at 5th. +1 to one other ability of your choice.", "flask", { con: 2 }],
    ["Vedalken", 30, "Vedalken Dispassion (advantage on Int, Wis, and Cha saves), Tireless Precision (one skill and one tool with a bonus d4), and Partially Amphibious.", "gear", { int: 2, wis: 1 }],
    // Mythic Odysseys of Theros
    ["Leonin", 35, "Claws (1d4 slashing), darkvision, Hunter's Instincts (one of Athletics, Intimidation, Perception, or Survival), and Daunting Roar (frighten nearby creatures once per short rest).", "sun", { con: 2, str: 1 }],
    ["Satyr", 35, "Fey type, Ram (1d4 bludgeoning), Magic Resistance, Mirthful Leaps, and Reveler (Performance, Persuasion, and one musical instrument).", "music-notes", { cha: 2, dex: 1 }],
    // Explorer's Guide to Wildemount
    ["Draconblood Dragonborn", 30, "Darkvision, draconic breath weapon and damage resistance, and Forceful Presence (advantage on an Intimidation or Persuasion check once per short rest).", "fire", { int: 2, cha: 1 }],
    ["Ravenite Dragonborn", 30, "Darkvision, draconic breath weapon and damage resistance, and Vengeful Assault (reaction weapon attack against a creature that damaged you, once per short rest).", "fire", { str: 2, con: 1 }],
    ["Pallid Elf", 30, "Darkvision, Keen Senses, Fey Ancestry, Trance, Incisive Sense (advantage on Investigation and Insight), and Blessing of the Moon Weaver: light, sleep at 3rd, invisibility on yourself at 5th (WIS).", "moon", { dex: 2, wis: 1 }],
    ["Lotusden Halfling", 25, "Small. Lucky, Brave, Halfling Nimbleness, Child of the Wood (druidcraft, entangle at 3rd, spike growth at 5th), and Timberwalk.", "plant", { dex: 2, wis: 1 }],
    // Standalone adventures and supplements
    ["Locathah", 30, "Swim 30 ft, natural armor 12 + Dex, Athletics and Perception proficiency, Leviathan Will, and Limited Amphibiousness (must submerge every 4 hours). (Locathah Rising)", "fish", { str: 2, dex: 1 }],
    ["Verdan", 30, "Small (Medium from 5th level). Black Blood Healing, Limited Telepathy, Persuasion proficiency, and Telepathic Insight (advantage on Wisdom and Charisma saves). (Acquisitions Inc)", "leaf", { cha: 2, con: 1 }, "Small"],
    ["Grung", 25, "Small. Climb 25 ft, Perception proficiency, amphibious, poison immunity, Poisonous Skin, Standing Leap, and Water Dependency. (One Grung Above)", "drop", { dex: 2, con: 1 }, "Small"],
    ["Tortle", 30, "Natural armor 17 (no Dex, no worn armor), Claws (1d4 slashing), hold breath 1 hour, Shell Defense, and Survival proficiency. (Tortle Package)", "shield", { str: 2, wis: 1 }],
    ["Owlin", 30, `Small or Medium. Darkvision 120 ft, flying speed equal to your walking speed (not in medium or heavy armor), and Silent Feathers (Stealth). ${FLEX} (Strixhaven)`, "bird", {}, "Small or Medium"],
    ["Harengon", 30, `Small or Medium. Hare-Trigger (add proficiency to initiative), Leporine Senses (Perception), Lucky Footwork, and Rabbit Hop. ${FLEX} (Witchlight)`, "rabbit", {}, "Small or Medium"],
    ["Fairy", 30, `Small. Fey type, flying speed equal to your walking speed, and Fairy Magic: druidcraft, faerie fire and enlarge/reduce from 3rd level. ${FLEX} (Witchlight)`, "butterfly", {}, "Small"],
    ["Custom Lineage", 30, "Small or Medium. +2 to one ability score, one feat, and either a skill proficiency or 60 ft of sight in darkness. (Tasha's)", "user", {}, "Small or Medium"],
    ["Dhampir", 35, `Darkvision, Deathless Nature, Spider Climb (walls and ceilings from 3rd level), and Vampiric Bite (heal yourself or empower a roll). Small or Medium. ${FLEX} (Van Richten's)`, "drop", {}, "Small or Medium"],
    ["Hexblood", 30, `Darkvision, Fey type, Eerie Token, and Hex Magic: disguise self and hex once per long rest each. Small or Medium. ${FLEX} (Van Richten's)`, "eye", {}, "Small or Medium"],
    ["Reborn", 30, `Deathless Nature (resist poison, advantage against disease and on death saves, no need to eat, breathe, or sleep) and Knowledge from a Past Life (add a d6 to skill checks). Small or Medium. ${FLEX} (Van Richten's)`, "skull", {}, "Small or Medium"],
    ["Astral Elf", 30, `Darkvision, Fey Ancestry, Keen Senses (one skill), Astral Fire (dancing lights, light, or sacred flame), Starlight Step, and Astral Trance. ${FLEX} (Spelljammer)`, "planet", {}],
    ["Autognome", 30, `Small. Construct type, Armored Casing (AC 13 + Dex), Built for Success, Healing Machine, Mechanical Nature, Sentry's Rest, and Specialized Design (two tools). ${FLEX} (Spelljammer)`, "gear", {}],
    ["Giff", 30, `Swim speed, Astral Spark (extra force damage on weapon hits), Firearms Mastery, and Hippo Build. ${FLEX} (Spelljammer)`, "anchor", {}],
    ["Hadozee", 30, `Climb speed, Dexterous Feet, Glide, and Hadozee Dodge (reaction to reduce damage). Small or Medium. ${FLEX} (Spelljammer)`, "feather", {}, "Small or Medium"],
    ["Plasmoid", 30, `Ooze type, Amorphous, Darkvision, Hold Breath, Natural Resilience (acid and poison resistance), and Shape Self. Small or Medium. ${FLEX} (Spelljammer)`, "drop", {}, "Small or Medium"],
    ["Thri-kreen", 30, `Chameleon Carapace (AC 13 + Dex), Secondary Arms, Sleepless, and Thri-kreen Telepathy. Small or Medium. ${FLEX} (Spelljammer)`, "bug", {}, "Small or Medium"],
    ["Kender", 30, `Small. Fearless, Kender Aptitude (one of Insight, Investigation, Sleight of Hand, Stealth, or Survival), and Taunt. ${FLEX} (Dragonlance)`, "key", {}, "Small"],
    ["Chromatic Dragonborn", 30, `Chromatic Ancestry: a breath weapon that replaces one attack and resistance to its damage type; from 5th level, Chromatic Warding grants immunity to it for 1 minute. ${FLEX} (Fizban's)`, "fire", {}],
    ["Metallic Dragonborn", 30, `Metallic Ancestry: a breath weapon that replaces one attack and resistance to its damage type; from 5th level, a second enervating or repulsion breath. ${FLEX} (Fizban's)`, "fire", {}],
    ["Gem Dragonborn", 30, `Gem Ancestry: a breath weapon that replaces one attack, resistance to its damage type, and Psionic Mind telepathy; from 5th level, Gem Flight. ${FLEX} (Fizban's)`, "diamond", {}]
  ].map(row => {
    if (Object.keys(row[4]).length) row[2] += " Tasha's lets you move these ability bonuses.";
    return row;
  });
  addMissing(SPECIES_PRESETS, species, row => row[0]);

  // Grants beyond ability scores, keyed by species name (same shape as data.js SPECIES_GRANTS).
  // Choices the app can't auto-pick (e.g. "two of these skills") go in `feature` as a reminder.
  const elfWeapons = ["Longsword, shortsword, shortbow, longbow"];
  const tiefling = (cantrip, legacy) => ({ languages: ["Common", "Infernal"], cantrips: cantrip ? [cantrip] : [], feature: legacy });
  const aasimar = { languages: ["Common", "Celestial"], cantrips: ["light"], feature: "Healing Hands: as an action, touch a creature to restore hit points equal to your level, once per long rest." };
  const halfElf = extra => ({ languages: ["Common", "Elvish", "one extra language"], ...extra });
  const shifter = skill => ({ languages: ["Common"], skills: ["perception", skill], feature: "Shifting: bonus action, once per short rest, for 1 minute; gain temporary HP equal to your level + Con modifier (minimum 1)." });
  const speciesGrants = {
    Drow: { languages: ["Common", "Elvish"], skills: ["perception"], weapons: ["Rapier, shortsword, hand crossbow"], cantrips: ["dancing-lights"] },
    "Forest Gnome": { languages: ["Common", "Gnomish"], cantrips: ["minor-illusion"] },
    "Rock Gnome": { languages: ["Common", "Gnomish"], tools: ["Tinker's tools"] },
    "Lightfoot Halfling": { languages: ["Common", "Halfling"] },
    "Stout Halfling": { languages: ["Common", "Halfling"] },
    "Protector Aasimar": aasimar,
    "Scourge Aasimar": aasimar,
    "Fallen Aasimar": aasimar,
    Firbolg: { languages: ["Common", "Elvish", "Giant"] },
    Goliath: { languages: ["Common", "Giant"], skills: ["athletics"] },
    Kenku: { languages: ["Common", "Auran"], feature: "Kenku Training: choose two of Acrobatics, Deception, Sleight of Hand, or Stealth." },
    Lizardfolk: { languages: ["Common", "Draconic"], feature: "Hunter's Lore: choose two of Animal Handling, Nature, Perception, Stealth, or Survival. Natural Armor: AC 13 + Dex without armor." },
    Tabaxi: { languages: ["Common", "one extra language"], skills: ["perception", "stealth"] },
    Triton: { languages: ["Common", "Primordial"] },
    Bugbear: { languages: ["Common", "Goblin"], skills: ["stealth"] },
    Goblin: { languages: ["Common", "Goblin"] },
    Hobgoblin: { languages: ["Common", "Goblin"], armor: ["Light armor"], weapons: ["Two martial weapons of your choice"] },
    Kobold: { languages: ["Common", "Draconic"] },
    Orc: { languages: ["Common", "Orc"], skills: ["intimidation"] },
    "Yuan-ti Pureblood": { languages: ["Common", "Abyssal", "Draconic"], cantrips: ["poison-spray"] },
    Aarakocra: { languages: ["Common", "Aarakocra", "Auran"] },
    "Air Genasi": { languages: ["Common", "Primordial"] },
    "Earth Genasi": { languages: ["Common", "Primordial"] },
    "Fire Genasi": { languages: ["Common", "Primordial"], cantrips: ["produce-flame"] },
    "Water Genasi": { languages: ["Common", "Primordial"], cantrips: ["shape-water"] },
    "Half-Elf (Aquatic)": halfElf({}),
    "Half-Elf (Drow)": halfElf({ cantrips: ["dancing-lights"] }),
    "Half-Elf (High)": halfElf({ feature: "High Elf Heritage: one wizard cantrip of your choice (INT)." }),
    "Half-Elf (Wood)": halfElf({ feature: "Wood Elf Heritage: choose elf weapon training, 35 ft speed, or Mask of the Wild." }),
    Duergar: { ...DWARF_GRANTS, languages: ["Common", "Dwarvish", "Undercommon"] },
    "Deep Gnome (Svirfneblin)": { languages: ["Common", "Gnomish", "Undercommon"] },
    "Ghostwise Halfling": { languages: ["Common", "Halfling"] },
    "Tiefling (Feral)": SPECIES_GRANTS.Tiefling,
    "Tiefling (Winged)": { languages: ["Common", "Infernal"] },
    "Tiefling (Devil's Tongue)": tiefling("vicious-mockery", "Devil's Tongue: vicious mockery; charm person as a 2nd-level spell once per long rest from 3rd level; enthrall once per long rest from 5th level (CHA)."),
    "Tiefling (Hellfire)": tiefling("thaumaturgy", "Hellfire: thaumaturgy; burning hands as a 2nd-level spell once per long rest from 3rd level; darkness once per long rest from 5th level (CHA)."),
    "Tiefling (Baalzebul)": tiefling("thaumaturgy", "Legacy of Maladomini: ray of sickness as a 2nd-level spell (3rd level) and crown of madness (5th level), each once per long rest (CHA)."),
    "Tiefling (Dispater)": tiefling("thaumaturgy", "Legacy of Dis: disguise self (3rd level) and detect thoughts (5th level), each once per long rest (CHA)."),
    "Tiefling (Fierna)": tiefling("friends", "Legacy of Phlegethos: charm person as a 2nd-level spell (3rd level) and suggestion (5th level), each once per long rest (CHA)."),
    "Tiefling (Glasya)": tiefling("minor-illusion", "Legacy of Malbolge: disguise self (3rd level) and invisibility (5th level), each once per long rest (CHA)."),
    "Tiefling (Levistus)": tiefling("ray-of-frost", "Legacy of Stygia: armor of Agathys as a 2nd-level spell (3rd level) and darkness (5th level), each once per long rest (CHA)."),
    "Tiefling (Mammon)": tiefling("mage-hand", "Legacy of Minauros: Tenser's floating disk (3rd level) and arcane lock (5th level), each once per long rest (CHA)."),
    "Tiefling (Mephistopheles)": tiefling("mage-hand", "Legacy of Cania: burning hands as a 2nd-level spell (3rd level) and flame blade (5th level), each once per long rest (CHA)."),
    "Tiefling (Zariel)": tiefling("thaumaturgy", "Legacy of Avernus: searing smite as a 2nd-level spell (3rd level) and branding smite (5th level), each once per long rest (CHA)."),
    Eladrin: { languages: ["Common", "Elvish"], skills: ["perception"] },
    "Sea Elf": { languages: ["Common", "Elvish", "Aquan"], skills: ["perception"], weapons: ["Spear, trident, light crossbow, net"] },
    "Shadar-kai": { languages: ["Common", "Elvish"], skills: ["perception"] },
    Githyanki: { languages: ["Common", "Gith", "one extra language"], armor: ["Light armor, medium armor"], weapons: ["Shortsword, longsword, greatsword"], cantrips: ["mage-hand"] },
    Githzerai: { languages: ["Common", "Gith"], cantrips: ["mage-hand"] },
    Changeling: { languages: ["Common", "two extra languages"], feature: "Changeling Instincts: choose two of Deception, Insight, Intimidation, or Persuasion." },
    Kalashtar: { languages: ["Common", "Quori", "one extra language"] },
    "Beasthide Shifter": shifter("athletics"),
    "Longtooth Shifter": shifter("intimidation"),
    "Swiftstride Shifter": shifter("acrobatics"),
    "Wildhunt Shifter": shifter("survival"),
    Warforged: { languages: ["Common", "one extra language"], tools: ["One tool of your choice"], feature: "Specialized Design: one skill proficiency of your choice. Integrated Protection: +1 AC." },
    Centaur: { languages: ["Common", "Sylvan"], feature: "Survivor: choose one of Animal Handling, Medicine, Nature, or Survival." },
    Loxodon: { languages: ["Common", "Loxodon"], feature: "Natural Armor: AC 12 + Con without armor." },
    Minotaur: { languages: ["Common", "Minotaur"], feature: "Imposing Presence: choose Intimidation or Persuasion." },
    "Simic Hybrid": { languages: ["Common", "Elvish or Vedalken"] },
    Vedalken: { languages: ["Common", "Vedalken", "one extra language"], tools: ["One tool of your choice"], feature: "Tireless Precision: one of Arcana, History, Investigation, Medicine, Performance, or Sleight of Hand; add 1d4 to checks with it and your chosen tool." },
    Leonin: { languages: ["Common", "Leonin"], feature: "Hunter's Instincts: choose one of Athletics, Intimidation, Perception, or Survival." },
    Satyr: { languages: ["Common", "Sylvan"], skills: ["performance", "persuasion"], tools: ["One musical instrument"] },
    "Draconblood Dragonborn": { languages: ["Common", "Draconic"] },
    "Ravenite Dragonborn": { languages: ["Common", "Draconic"] },
    "Pallid Elf": { languages: ["Common", "Elvish"], skills: ["perception"], cantrips: ["light"] },
    "Lotusden Halfling": { languages: ["Common", "Halfling"], cantrips: ["druidcraft"] },
    Locathah: { languages: ["Common", "Aquan"], skills: ["athletics", "perception"] },
    Verdan: { languages: ["Common", "Goblin", "one extra language"], skills: ["persuasion"] },
    Grung: { languages: ["Grung"], skills: ["perception"] },
    Tortle: { languages: ["Common", "Aquan"], skills: ["survival"], feature: "Natural Armor: base AC 17; Dexterity doesn't apply and you can't wear armor (shields are fine)." },
    Owlin: { languages: ["Common", "one extra language"], skills: ["stealth"] },
    Harengon: { languages: ["Common", "one extra language"], skills: ["perception"] },
    Fairy: { languages: ["Common", "one extra language"], cantrips: ["druidcraft"] },
    "Custom Lineage": { languages: ["Common", "one extra language"] },
    Dhampir: { languages: ["Common", "one extra language"] },
    Hexblood: { languages: ["Common", "one extra language"] },
    Reborn: { languages: ["Common", "one extra language"] },
    "Astral Elf": { languages: ["Common", "one extra language"] },
    Autognome: { languages: ["Common", "one extra language"], tools: ["Two tools of your choice"] },
    Giff: { languages: ["Common", "one extra language"], weapons: ["Firearms"] },
    Hadozee: { languages: ["Common", "one extra language"] },
    Plasmoid: { languages: ["Common", "one extra language"] },
    "Thri-kreen": { languages: ["Common", "one extra language"] },
    Kender: { languages: ["Common", "one extra language"] },
    "Chromatic Dragonborn": { languages: ["Common", "one extra language"] },
    "Metallic Dragonborn": { languages: ["Common", "one extra language"] },
    "Gem Dragonborn": { languages: ["Common", "one extra language"] }
  };
  Object.entries(speciesGrants).forEach(([name, grants]) => {
    if (!(name in SPECIES_GRANTS)) SPECIES_GRANTS[name] = grants;
  });

  // ---------------------------------------------------------------------------------------------
  // BACKGROUNDS. Row: [name, skills, tools/languages, feature name, Phosphor icon]
  // builder.js matches skills by exact name (choice text is ignored) and routes any comma item
  // containing "language" to languages, the rest to tools.
  // ---------------------------------------------------------------------------------------------
  addMissing(BACKGROUND_PRESETS, [
    // Player's Handbook (and its listed variants)
    ["Charlatan", "Deception, Sleight of Hand", "Disguise kit, forgery kit", "False Identity", "mask-happy"],
    ["Entertainer", "Acrobatics, Performance", "Disguise kit, one musical instrument", "By Popular Demand", "music-notes"],
    ["Gladiator", "Acrobatics, Performance", "Disguise kit, one unusual weapon", "By Popular Demand", "sword"],
    ["Guild Artisan", "Insight, Persuasion", "One artisan's tools, one language", "Guild Membership", "hammer"],
    ["Guild Merchant", "Insight, Persuasion", "Navigator's tools, one language", "Guild Membership", "coins"],
    ["Hermit", "Medicine, Religion", "Herbalism kit, one language", "Discovery", "tent"],
    ["Knight", "History, Persuasion", "Gaming set, one language", "Retainers", "shield"],
    ["Outlander", "Athletics, Survival", "One musical instrument, one language", "Wanderer", "compass"],
    ["Sailor", "Athletics, Perception", "Navigator's tools, vehicles (water)", "Ship's Passage", "anchor"],
    ["Pirate", "Athletics, Perception", "Navigator's tools, vehicles (water)", "Bad Reputation", "skull"],
    ["Spy", "Deception, Stealth", "Gaming set, thieves' tools", "Spy Contact", "eye"],
    ["Urchin", "Sleight of Hand, Stealth", "Disguise kit, thieves' tools", "City Secrets", "key"],
    // Sword Coast Adventurer's Guide
    ["City Watch", "Athletics, Insight", "Two languages", "Watcher's Eye", "binoculars"],
    ["Clan Crafter", "History, Insight", "One artisan's tools, one language", "Respect of the Stout Folk", "hammer"],
    ["Cloistered Scholar", "History, Arcana/Nature/Religion (pick one)", "Two languages", "Library Access", "book-open"],
    ["Courtier", "Insight, Persuasion", "Two languages", "Court Functionary", "crown"],
    ["Faction Agent", "Insight, one Int/Wis/Cha skill (pick one)", "Two languages", "Safe Haven", "detective"],
    ["Far Traveler", "Insight, Perception", "One musical instrument or gaming set, one language", "All Eyes on You", "globe"],
    ["Inheritor", "Survival, Arcana/History/Religion (pick one)", "Gaming set or musical instrument, one language", "Inheritance", "scroll"],
    ["Knight of the Order", "Persuasion, Arcana/History/Nature/Religion (pick one)", "Gaming set or musical instrument, one language", "Knightly Regard", "shield"],
    ["Mercenary Veteran", "Athletics, Persuasion", "Gaming set, vehicles (land)", "Mercenary Life", "sword"],
    ["Urban Bounty Hunter", "Two of Deception/Insight/Persuasion/Stealth", "Two of gaming set/musical instrument/thieves' tools", "Ear to the Ground", "crosshair"],
    ["Uthgardt Tribe Member", "Athletics, Survival", "Musical instrument or artisan's tools, one language", "Uthgardt Heritage", "mountains"],
    ["Waterdhavian Noble", "History, Persuasion", "Gaming set or musical instrument, one language", "Kept in Style", "crown"],
    // Curse of Strahd / Van Richten's Guide to Ravenloft
    ["Haunted One", "Two of Arcana/Investigation/Religion/Survival", "Two languages (one exotic)", "Heart of Darkness", "ghost"],
    ["Investigator", "Two of Insight/Investigation/Perception", "Disguise kit, thieves' tools", "Official Inquiry", "magnifying-glass"],
    // Eberron: Rising from the Last War
    ["House Agent", "Investigation, Persuasion", "Two tools set by your house", "House Connections", "key"],
    // Guildmasters' Guide to Ravnica
    ["Azorius Functionary", "Insight, Intimidation", "Two languages", "Legal Authority", "scales"],
    ["Boros Legionnaire", "Athletics, Intimidation", "Gaming set, one language", "Legion Station", "shield"],
    ["Dimir Operative", "Deception, Stealth", "Disguise kit, one language", "False Identity", "mask-sad"],
    ["Golgari Agent", "Nature, Survival", "Poisoner's kit, one language", "Undercity Paths", "plant"],
    ["Gruul Anarch", "Animal Handling, Athletics", "Herbalism kit, one language", "Rubblebelt Refuge", "axe"],
    ["Izzet Engineer", "Arcana, Investigation", "One artisan's tools, one language", "Urban Infrastructure", "lightning"],
    ["Orzhov Representative", "Intimidation, Religion", "Two languages", "Leverage", "coins"],
    ["Rakdos Cultist", "Acrobatics, Performance", "One musical instrument, one language", "Fearsome Reputation", "flame"],
    ["Selesnya Initiate", "Nature, Persuasion", "Artisan's tools or musical instrument, one language", "Conclave's Shelter", "tree-evergreen"],
    ["Simic Scientist", "Arcana, Medicine", "Two languages", "Researcher", "flask"],
    // Mythic Odysseys of Theros
    ["Athlete", "Acrobatics, Athletics", "Vehicles (land), one language", "Echoes of Victory", "trophy"],
    // Explorer's Guide to Wildemount
    ["Grinner", "Deception, Performance", "Disguise kit, one musical instrument", "Ballad of the Grinning Fool", "mask-happy"],
    ["Volstrucker Agent", "Deception, Stealth", "Poisoner's kit, one language", "Shadow Network", "knife"],
    // Acquisitions Incorporated
    ["Celebrity Adventurer's Scion", "Perception, Performance", "Disguise kit, two languages", "Name Dropping", "star"],
    ["Failed Merchant", "Investigation, Persuasion", "One artisan's tools, one language", "Supply Chain", "coins"],
    ["Gambler", "Deception, Insight", "Gaming set, one language", "Never Tell Me the Odds", "club"],
    ["Plaintiff", "Medicine, Persuasion", "One artisan's tools, one language", "Legalese", "gavel"],
    ["Rival Intern", "History, Investigation", "One artisan's tools, one language", "Inside Informant", "briefcase"],
    // Ghosts of Saltmarsh
    ["Fisher", "History, Survival", "One language", "Harvest the Water", "fish"],
    ["Marine", "Athletics, Survival", "Vehicles (water), vehicles (land)", "Steady", "anchor"],
    ["Shipwright", "History, Perception", "Carpenter's tools, vehicles (water)", "I'll Patch It!", "hammer"],
    ["Smuggler", "Athletics, Deception", "Vehicles (water)", "Down Low", "sailboat"],
    // Strixhaven: A Curriculum of Chaos (each feature is the matching Strixhaven Initiate feat)
    ["Lorehold Student", "History, Religion", "Two languages", "Lorehold Initiate", "scroll"],
    ["Prismari Student", "Acrobatics, Performance", "Artisan's tools or musical instrument, one language", "Prismari Initiate", "palette"],
    ["Quandrix Student", "Arcana, Nature", "One artisan's tools, one language", "Quandrix Initiate", "cube"],
    ["Silverquill Student", "Intimidation, Persuasion", "Two languages", "Silverquill Initiate", "feather"],
    ["Witherbloom Student", "Nature, Survival", "Herbalism kit, one language", "Witherbloom Initiate", "leaf"],
    // The Wild Beyond the Witchlight
    ["Feylost", "Deception, Survival", "One musical instrument, one language", "Feywild Connection", "butterfly"],
    ["Witchlight Hand", "Performance, Sleight of Hand", "Disguise kit or musical instrument, one language", "Carnival Companion", "mask-happy"],
    // Spelljammer: Adventures in Space
    ["Astral Drifter", "Insight, Religion", "Two languages", "Divine Contact", "planet"],
    ["Wildspacer", "Athletics, Survival", "Navigator's tools, vehicles (space)", "Wildspace Adaptation", "rocket"],
    // Planescape: Adventures in the Multiverse (each grants Scion of the Outer Planes)
    ["Gate Warden", "Persuasion, Survival", "Two languages", "Planar Infusion", "key"],
    ["Planar Philosopher", "Arcana, one faction skill (pick one)", "Two languages", "Conviction", "infinity"],
    // Dragonlance and Baldur's Gate: Descent into Avernus
    ["Knight of Solamnia", "Athletics, Survival", "Gaming set, one language", "Squire of Solamnia", "shield"],
    ["Mage of High Sorcery", "Arcana, History", "Two languages", "Initiate of High Sorcery", "moon-stars"],
    ["Faceless", "Deception, Intimidation", "Disguise kit, one language", "Dual Personalities", "mask-happy"]
  ], row => row[0]);

  // ---------------------------------------------------------------------------------------------
  // FEATS (names only; data.js FEAT_PRESETS is a plain name list).
  // ---------------------------------------------------------------------------------------------
  addMissing(FEAT_PRESETS, [
    // Player's Handbook
    "Actor", "Charger", "Grappler", "Heavily Armored", "Heavy Armor Master", "Keen Mind", "Lightly Armored",
    "Linguist", "Mage Slayer", "Martial Adept", "Medium Armor Master", "Moderately Armored", "Mounted Combatant",
    "Observant", "Polearm Master", "Ritual Caster", "Savage Attacker", "Shield Master", "Skulker",
    "Tavern Brawler", "Weapon Master",
    // Xanathar's Guide racial feats
    "Bountiful Luck", "Dragon Fear", "Dragon Hide", "Drow High Magic", "Dwarven Fortitude", "Elven Accuracy",
    "Fade Away", "Fey Teleportation", "Flames of Phlegethos", "Infernal Constitution", "Orcish Fury",
    "Prodigy", "Second Chance", "Squat Nimbleness", "Wood Elf Magic",
    // Tasha's Cauldron of Everything
    "Artificer Initiate", "Chef", "Crusher", "Eldritch Adept", "Fey Touched", "Fighting Initiate", "Gunner",
    "Metamagic Adept", "Piercer", "Poisoner", "Shadow Touched", "Skill Expert", "Slasher", "Telekinetic", "Telepathic",
    // Fizban's Treasury of Dragons
    "Gift of the Chromatic Dragon", "Gift of the Gem Dragon", "Gift of the Metallic Dragon",
    // Other 2014-era books: EEPC, ERLW, EGtW, SCC, Planescape, Dragonlance, Bigby Presents: Glory of the Giants
    "Svirfneblin Magic", "Aberrant Dragonmark", "Revenant Blade", "Strixhaven Initiate", "Strixhaven Mascot",
    "Scion of the Outer Planes", "Agent of Order", "Baleful Scion", "Cohort of Chaos", "Outlands Envoy", "Planar Wanderer",
    "Squire of Solamnia", "Knight of the Crown", "Knight of the Rose", "Knight of the Sword",
    "Initiate of High Sorcery", "Adept of the Black Robes", "Adept of the Red Robes", "Adept of the White Robes",
    "Giant Foundling", "Rune Shaper", "Strike of the Giants", "Ember of the Fire Giant", "Fury of the Frost Giant",
    "Guile of the Cloud Giant", "Keenness of the Stone Giant", "Soul of the Storm Giant", "Vigor of the Hill Giant"
  ], name => name);

  // ---------------------------------------------------------------------------------------------
  // SPELLS. Non-SRD spells missing from data.js LOCAL_SPELLS (SRD spells come from the 5e API, so
  // none are repeated here). Summaries put the main damage dice first and use "makes a X save" /
  // "X save or" wording so spells.js picks up the roll and save; `higher_level` uses the
  // "NdM for each slot level above" / "5th level" phrasing its upcast and cantrip scaling read.
  // ---------------------------------------------------------------------------------------------
  const sp = (source, index, name, level, school, classes, castingTime, range, components, duration, summary, higher) => {
    const detail = localSpell(index, name, level, classes, castingTime, range, components, duration, /^concentration/i.test(duration), summary);
    return Object.assign(detail, {
      school: { index: school.toLowerCase(), name: school },
      ritual: /ritual/i.test(castingTime),
      source
    }, higher ? { higher_level: [higher] } : {});
  };
  const CON1M = "Concentration, up to 1 minute";
  const CON10M = "Concentration, up to 10 minutes";
  const CON1H = "Concentration, up to 1 hour";
  const VSM = ["V", "S", "M"];
  const VS = ["V", "S"];
  const CANTRIP_SCALE = "Damage increases by one die at 5th level, 11th level, and 17th level.";
  const SUMMON = "Its statistics use the slot level you cast the spell with.";
  const summon = (spirit) => `Call ${spirit} whose statistics scale with the spell's level; it shares your initiative, obeys your verbal commands, and vanishes at 0 hit points or when the spell ends.`;

  const spells = [
    // Player's Handbook spells outside the SRD
    sp("PHB", "arcane-gate", "Arcane Gate", 6, "Conjuration", ["sorcerer", "warlock", "wizard"], "1 action", "500 feet", VS, CON10M,
      "Open two linked 10-foot portals on ground you can see, one within 10 feet of you; anything entering one portal steps out of the other, and a bonus action rotates them."),
    sp("PHB", "beast-sense", "Beast Sense", 2, "Divination", ["druid", "ranger"], "1 action (ritual)", "Touch", ["S"], CON1H,
      "Touch a willing beast and perceive through its senses until you end the effect as an action; meanwhile you can't use your own senses."),
    sp("PHB", "blinding-smite", "Blinding Smite", 3, "Evocation", ["paladin"], "1 bonus action", "Self", ["V"], CON1M,
      "Your next melee weapon hit deals an extra 3d8 radiant damage, and the target makes a Constitution save or is blinded until the spell ends, repeating the save at the end of each of its turns."),
    sp("PHB", "conjure-volley", "Conjure Volley", 5, "Conjuration", ["ranger"], "1 action", "150 feet", VSM, "Instantaneous",
      "Loose ammunition or a thrown weapon into the air: each creature in a 40-foot-radius, 20-foot-high cylinder makes a Dexterity save, taking 8d8 damage of the weapon's type on a failure, half on a success."),
    sp("PHB", "cordon-of-arrows", "Cordon of Arrows", 2, "Transmutation", ["ranger"], "1 action", "5 feet", VSM, "8 hours",
      "Plant four pieces of ammunition; when a creature you didn't exempt enters or ends its turn within 30 feet of them, one flies at it: Dexterity save or take 1d6 piercing damage. The spell ends when the ammunition is spent.",
      "Two more pieces of ammunition for each slot level above 2nd."),
    sp("PHB", "lightning-arrow", "Lightning Arrow", 3, "Transmutation", ["ranger"], "1 bonus action", "Self", VS, CON1M,
      "Your next ranged weapon attack turns to lightning: the target takes 4d8 lightning damage on a hit or half on a miss instead of weapon damage, and each creature within 10 feet of it makes a Dexterity save, taking 2d8 lightning damage on a failure, half on a success.",
      "Both damage rolls increase by 1d8 for each slot level above 3rd."),
    sp("PHB", "power-word-heal", "Power Word Heal", 9, "Evocation", ["bard", "cleric"], "1 action", "Touch", VS, "Instantaneous",
      "A creature you touch is restored to its hit point maximum and freed from the charmed, frightened, paralyzed, and stunned conditions; if prone, it can use its reaction to stand."),
    sp("PHB", "swift-quiver", "Swift Quiver", 5, "Transmutation", ["ranger"], "1 bonus action", "Touch", VSM, CON1M,
      "A quiver you touch supplies endless nonmagical ammunition, and on each of your turns you can use a bonus action to make two attacks with a weapon that draws from it."),
    sp("PHB", "telepathy", "Telepathy", 8, "Evocation", ["wizard"], "1 action", "Unlimited", VSM, "24 hours",
      "Link minds with a willing creature you know on the same plane, sharing words, images, and other sensory messages instantly for the duration."),
    sp("PHB", "tsunami", "Tsunami", 8, "Conjuration", ["druid"], "1 minute", "Sight", VS, "Concentration, up to 6 rounds",
      "A wall of water up to 300 feet long, 300 feet high, and 50 feet thick crashes down: each creature in it makes a Strength save, taking 6d10 bludgeoning damage on a failure, half on a success. The wave then rolls away from you each round, shrinking and weakening."),

    // Xanathar's Guide to Everything (includes the Elemental Evil Player's Companion reprints)
    sp("XGE", "beast-bond", "Beast Bond", 1, "Divination", ["druid", "ranger"], "1 action", "Touch", VSM, CON10M,
      "Form a telepathic link with a friendly or charmed beast of Intelligence 3 or lower; it understands you and has advantage on attacks against creatures you can see within 5 feet of you."),
    sp("XGE", "cause-fear", "Cause Fear", 1, "Necromancy", ["warlock", "wizard"], "1 action", "60 feet", ["V"], CON1M,
      "One creature makes a Wisdom save or is frightened of you, repeating the save at the end of each of its turns. Constructs and undead are immune.",
      "One additional creature for each slot level above 1st."),
    sp("XGE", "ceremony", "Ceremony", 1, "Abjuration", ["cleric", "paladin"], "1 hour (ritual)", "Touch", VSM, "Instantaneous",
      "Perform one religious rite (atonement, bless water, coming of age, dedication, funeral rite, or wedding), each granting a small blessing such as a d4 bonus or holy water."),
    sp("XGE", "chaos-bolt", "Chaos Bolt", 1, "Evocation", ["sorcerer"], "1 action", "120 feet", VS, "Instantaneous",
      "Ranged spell attack: on a hit the target takes 2d8 + 1d6 damage whose type is set by one of the d8s (acid, cold, fire, force, lightning, poison, psychic, or thunder). If the d8s match, the bolt leaps to another creature within 30 feet.",
      "Damage increases by 1d6 for each slot level above 1st."),
    sp("XGE", "zephyr-strike", "Zephyr Strike", 1, "Transmutation", ["ranger"], "1 bonus action", "Self", ["V"], CON1M,
      "Your movement doesn't provoke opportunity attacks. Once before it ends, make a weapon attack with advantage; on a hit it deals an extra 1d8 force damage and your speed rises by 30 feet that turn."),
    sp("XGE", "dust-devil", "Dust Devil", 2, "Conjuration", ["druid", "sorcerer", "wizard"], "1 action", "60 feet", VSM, CON1M,
      "A 5-foot whirlwind: each creature that ends its turn within 5 feet of it makes a Strength save, taking 1d8 bludgeoning damage and being pushed 10 feet on a failure, half damage only on a success. A bonus action moves it 30 feet.",
      "Damage increases by 1d8 for each slot level above 2nd."),
    sp("XGE", "earthbind", "Earthbind", 2, "Transmutation", ["druid", "sorcerer", "warlock", "wizard"], "1 action", "300 feet", ["V"], CON1M,
      "One creature makes a Strength save or its flying speed drops to 0 for the duration; an airborne target descends 60 feet per round and lands safely."),
    sp("XGE", "maximilians-earthen-grasp", "Maximilian's Earthen Grasp", 2, "Transmutation", ["sorcerer", "wizard"], "1 action", "30 feet", VSM, CON1M,
      "An earthen hand rises in a 5-foot square: one creature within 5 feet of it makes a Strength save or takes 2d6 bludgeoning damage and is restrained. Later actions can crush the restrained target again or grab another."),
    sp("XGE", "pyrotechnics", "Pyrotechnics", 2, "Transmutation", ["artificer", "bard", "sorcerer", "wizard"], "1 action", "60 feet", VS, "Instantaneous",
      "Snuff a nonmagical flame into fireworks (creatures within 10 feet make a Constitution save or are blinded until the end of your next turn) or a 20-foot-radius cloud of smoke that heavily obscures for 1 minute."),
    sp("XGE", "skywrite", "Skywrite", 2, "Transmutation", ["artificer", "bard", "druid", "wizard"], "1 action (ritual)", "Sight", VS, CON1H,
      "Shape the clouds into up to ten words in a part of the sky you can see; strong wind scatters them early."),
    sp("XGE", "catnap", "Catnap", 3, "Enchantment", ["artificer", "bard", "sorcerer", "wizard"], "1 action", "30 feet", ["S", "M"], "10 minutes",
      "Up to three willing creatures fall unconscious; one that sleeps the full 10 minutes gains the benefits of a short rest and can't be affected again until it finishes a long rest.",
      "One additional willing creature for each slot level above 3rd."),
    sp("XGE", "enemies-abound", "Enemies Abound", 3, "Enchantment", ["bard", "sorcerer", "warlock", "wizard"], "1 action", "120 feet", VS, CON1M,
      "One creature makes an Intelligence save or can't tell friend from foe, treating everyone as an enemy and picking targets at random; it repeats the save whenever it takes damage."),
    sp("XGE", "flame-arrows", "Flame Arrows", 3, "Transmutation", ["artificer", "druid", "ranger", "sorcerer", "wizard"], "1 action", "Touch", VS, CON1H,
      "Up to twelve pieces of ammunition drawn from the quiver you touch each deal an extra 1d6 fire damage on a hit; each loses the magic once it hits or misses.",
      "Two more pieces of ammunition for each slot level above 3rd."),
    sp("XGE", "summon-lesser-demons", "Summon Lesser Demons", 3, "Conjuration", ["warlock", "wizard"], "1 action", "60 feet", VSM, CON1H,
      "Roll on a table to call low-challenge demons that are hostile to everything but demons and attack the nearest non-demon; a circle of blood drawn as you cast holds them back.",
      "Higher slots summon more demons."),
    sp("XGE", "tiny-servant", "Tiny Servant", 3, "Transmutation", ["artificer", "wizard"], "1 minute", "Touch", VS, "8 hours",
      "Animate a Tiny unattended object into a servant with little legs; a bonus action lets you command it mentally from up to 120 feet away.",
      "Two additional objects for each slot level above 3rd."),
    sp("XGE", "wall-of-sand", "Wall of Sand", 3, "Evocation", ["wizard"], "1 action", "90 feet", VSM, CON10M,
      "A swirling wall of sand 30 feet long, 10 feet high, and 10 feet thick blocks sight; a creature inside it is blinded and moves at one-third speed."),
    sp("XGE", "wall-of-water", "Wall of Water", 3, "Evocation", ["druid", "sorcerer", "wizard"], "1 action", "60 feet", VSM, CON10M,
      "A wall of water 30 feet long, 10 feet high, and 1 foot thick (or a 20-foot ring): its space is difficult terrain, ranged weapon attacks through it have disadvantage, and fire damage through it is halved."),
    sp("XGE", "charm-monster", "Charm Monster", 4, "Enchantment", ["bard", "druid", "sorcerer", "warlock", "wizard"], "1 action", "30 feet", VS, "1 hour",
      "One creature makes a Wisdom save (with advantage if you or allies are fighting it) or is charmed by you and treats you as a friendly acquaintance; it knows it was charmed afterward.",
      "One additional creature for each slot level above 4th."),
    sp("XGE", "elemental-bane", "Elemental Bane", 4, "Transmutation", ["artificer", "druid", "warlock", "wizard"], "1 action", "90 feet", VS, CON1M,
      "Choose acid, cold, fire, lightning, or thunder: the target makes a Constitution save or loses resistance to that type and takes an extra 2d6 damage of it the first time each turn it is dealt that type.",
      "One additional creature for each slot level above 4th."),
    sp("XGE", "find-greater-steed", "Find Greater Steed", 4, "Conjuration", ["paladin"], "10 minutes", "30 feet", VS, "Instantaneous",
      "Summon a loyal spirit mount shaped as a griffon, pegasus, peryton, dire wolf, rhinoceros, or saber-toothed tiger; it shares your self-targeted spells while you ride it."),
    sp("XGE", "summon-greater-demon", "Summon Greater Demon", 4, "Conjuration", ["warlock", "wizard"], "1 action", "60 feet", VSM, CON1H,
      "Summon one demon of challenge rating 5 or lower that obeys you; it makes a Charisma save at the end of each of its turns, breaking free and turning hostile on a success. A blood circle can contain it.",
      "Challenge rating increases by 1 for each slot level above 4th."),
    sp("XGE", "control-winds", "Control Winds", 5, "Transmutation", ["druid", "sorcerer", "wizard"], "1 action", "300 feet", VS, CON1H,
      "Command the air in a 100-foot cube: gusts that hinder ranged attacks and movement against the wind, a downdraft that drives fliers down, or an updraft; an action switches the effect."),
    sp("XGE", "danse-macabre", "Danse Macabre", 5, "Necromancy", ["warlock", "wizard"], "1 action", "60 feet", VS, CON1H,
      "Raise up to five Small or Medium corpses as zombies or skeletons that obey your bonus-action commands and add your spellcasting ability modifier to their attack and damage rolls.",
      "Two additional corpses for each slot level above 5th."),
    sp("XGE", "dawn", "Dawn", 5, "Evocation", ["cleric", "wizard"], "1 action", "60 feet", VSM, CON1M,
      "A 30-foot-radius, 40-foot-high cylinder of sunlight: each creature in it when it appears, or that ends its turn there, makes a Constitution save, taking 4d10 radiant damage on a failure, half on a success. A bonus action moves it 60 feet."),
    sp("XGE", "enervation", "Enervation", 5, "Necromancy", ["sorcerer", "warlock", "wizard"], "1 action", "60 feet", VS, CON1M,
      "A tendril of darkness latches onto one creature: it makes a Dexterity save or takes 4d8 necrotic damage, and your action deals 4d8 more on later turns; on a success it takes 2d8 and the spell ends. You regain hit points equal to half the necrotic damage dealt.",
      "Damage increases by 1d8 for each slot level above 5th."),
    sp("XGE", "immolation", "Immolation", 5, "Evocation", ["sorcerer", "wizard"], "1 action", "90 feet", ["V"], CON1M,
      "Flames engulf one creature: it makes a Dexterity save, taking 8d6 fire damage on a failure, half on a success. On a failure it keeps burning for 4d6 fire damage at the end of each of its turns until a later save succeeds."),
    sp("XGE", "infernal-calling", "Infernal Calling", 5, "Conjuration", ["warlock", "wizard"], "1 minute", "90 feet", VSM, CON1H,
      "Summon an unfriendly devil of challenge rating 6 or lower that follows your commands only when it suits it, unless you know its true name or hold its talisman.",
      "Challenge rating increases by 1 for each slot level above 5th."),
    sp("XGE", "negative-energy-flood", "Negative Energy Flood", 5, "Necromancy", ["warlock", "wizard"], "1 action", "60 feet", ["V", "M"], "Instantaneous",
      "One creature makes a Constitution save, taking 5d12 necrotic damage on a failure, half on a success; a creature it kills rises as a zombie. An undead target instead gains temporary hit points equal to half the roll."),
    sp("XGE", "skill-empowerment", "Skill Empowerment", 5, "Transmutation", ["artificer", "bard", "sorcerer", "wizard"], "1 action", "Touch", VS, CON1H,
      "A willing creature doubles its proficiency bonus for one skill it is proficient in."),
    sp("XGE", "transmute-rock", "Transmute Rock", 5, "Transmutation", ["artificer", "druid", "wizard"], "1 action", "120 feet", ["S", "M"], "Until dispelled",
      "Turn nonmagical stone in up to a 40-foot cube into deep, slowing mud, or mud into stone that can trap creatures caught inside it."),
    sp("XGE", "wall-of-light", "Wall of Light", 5, "Evocation", ["sorcerer", "warlock", "wizard"], "1 action", "120 feet", VSM, CON10M,
      "A wall of light 60 feet long, 10 feet high, and 5 feet thick: each creature in it when it appears makes a Constitution save, taking 4d8 radiant damage and being blinded on a failure, half damage only on a success. Your action can fire a beam from it (ranged spell attack, same damage), shrinking it 10 feet.",
      "Damage increases by 1d8 for each slot level above 5th."),
    sp("XGE", "bones-of-the-earth", "Bones of the Earth", 6, "Transmutation", ["druid"], "1 action", "120 feet", VS, "Instantaneous",
      "Up to six 30-foot stone pillars erupt; a creature where one rises makes a Dexterity save or is lifted on top, and one crushed against a ceiling takes 6d6 bludgeoning damage and is restrained.",
      "Two additional pillars for each slot level above 6th."),
    sp("XGE", "create-homunculus", "Create Homunculus", 6, "Transmutation", ["wizard"], "1 hour", "Touch", VSM, "Instantaneous",
      "Cut yourself with a jeweled dagger, taking piercing damage that can't be reduced, to craft a loyal homunculus companion; you can have only one at a time."),
    sp("XGE", "investiture-of-flame", "Investiture of Flame", 6, "Transmutation", ["druid", "sorcerer", "warlock", "wizard"], "1 action", "Self", VS, CON10M,
      "Your action can blast a 15-foot line of fire: each creature in it makes a Dexterity save, taking 4d8 fire damage on a failure, half on a success. You are also immune to fire, resist cold, and creatures that move near you or end their turn within 5 feet take fire damage."),
    sp("XGE", "investiture-of-ice", "Investiture of Ice", 6, "Transmutation", ["druid", "sorcerer", "warlock", "wizard"], "1 action", "Self", VS, CON10M,
      "Your action can blast a 15-foot cone of cold: each creature in it makes a Constitution save, taking 4d6 cold damage and having its speed halved on a failure, half damage only on a success. You are also immune to cold, resist fire, and the ground near you is difficult terrain for others."),
    sp("XGE", "investiture-of-stone", "Investiture of Stone", 6, "Transmutation", ["druid", "sorcerer", "warlock", "wizard"], "1 action", "Self", VS, CON10M,
      "You resist nonmagical bludgeoning, piercing, and slashing damage, can move through earth and stone, and your action can shake the ground: each other creature within 15 feet makes a Dexterity save or falls prone."),
    sp("XGE", "investiture-of-wind", "Investiture of Wind", 6, "Transmutation", ["druid", "sorcerer", "warlock", "wizard"], "1 action", "Self", VS, CON10M,
      "Your action can hurl a 15-foot cube of wind within 60 feet: each creature in it makes a Constitution save, taking 2d10 bludgeoning damage and being pushed 10 feet on a failure, half damage only on a success. You also gain a 60-foot flying speed and ranged weapon attacks against you have disadvantage."),
    sp("XGE", "primordial-ward", "Primordial Ward", 6, "Abjuration", ["druid"], "1 action", "Self", VS, CON1M,
      "You resist acid, cold, fire, lightning, and thunder damage; when one of them hits you, your reaction can trade the resistances for immunity to that type until the end of your next turn."),
    sp("XGE", "scatter", "Scatter", 6, "Conjuration", ["sorcerer", "warlock", "wizard"], "1 action", "30 feet", ["V"], "Instantaneous",
      "Teleport up to five creatures you can see within range to spaces you can see within 120 feet of you; an unwilling creature makes a Wisdom save to resist."),
    sp("XGE", "soul-cage", "Soul Cage", 6, "Necromancy", ["warlock", "wizard"], "1 reaction", "60 feet", VSM, "8 hours",
      "Reaction when a humanoid you can see dies: trap its soul in a tiny cage, then exploit it up to six times to regain 2d8 hit points, ask it a question, gain advantage on a roll, or see a place it knew."),
    sp("XGE", "tensers-transformation", "Tenser's Transformation", 6, "Transmutation", ["wizard"], "1 action", "Self", VSM, CON10M,
      "Gain 50 temporary hit points, advantage on weapon attacks, an extra 2d12 force damage on weapon hits, proficiency with all armor, shields, weapons, and Strength and Constitution saves, and two attacks per Attack action, but no spellcasting. When it ends, a DC 15 Constitution save or one level of exhaustion."),
    sp("XGE", "druid-grove", "Druid Grove", 6, "Abjuration", ["druid"], "10 minutes", "Touch", VSM, "24 hours",
      "Ward an area up to a 90-foot cube with solid fog, grasping undergrowth, animated tree guardians, and one extra effect of your choice; you and creatures you designate are unaffected. Casting it daily for a year makes it permanent."),
    sp("XGE", "power-word-pain", "Power Word Pain", 7, "Enchantment", ["sorcerer", "warlock", "wizard"], "1 action", "60 feet", ["V"], "Instantaneous",
      "A creature with 100 hit points or fewer is wracked with pain: its speed can't exceed 10 feet, it has disadvantage on attacks, checks, and non-Constitution saves, and casting needs a Constitution save. It makes a Constitution save at the end of each of its turns to end the effect."),
    sp("XGE", "temple-of-the-gods", "Temple of the Gods", 7, "Conjuration", ["cleric"], "1 hour", "120 feet", VSM, "24 hours",
      "Raise a temple to your deity: creature types you choose must succeed on a Charisma save to enter, divination can't see inside, and healing spells cast inside restore extra hit points equal to your Wisdom modifier. Casting it daily for a year makes it permanent."),
    sp("XGE", "whirlwind", "Whirlwind", 7, "Evocation", ["druid", "sorcerer", "wizard"], "1 action", "300 feet", ["V", "M"], CON1M,
      "A 10-foot-radius, 30-foot-high whirlwind you move 30 feet per turn: a creature it touches makes a Dexterity save, taking 10d6 bludgeoning damage on a failure, half on a success, and a Large or smaller creature that fails is also pulled in and restrained unless it passes a Strength save."),
    sp("XGE", "illusory-dragon", "Illusory Dragon", 8, "Illusion", ["wizard"], "1 action", "120 feet", ["S"], CON1M,
      "A Huge shadowy dragon breathes a 60-foot cone of a damage type you choose as a bonus action: each creature in it makes an Intelligence save, taking 7d6 damage on a failure, half on a success. Creatures that see it appear make a Wisdom save or are frightened for 1 minute."),
    sp("XGE", "maddening-darkness", "Maddening Darkness", 8, "Evocation", ["warlock", "wizard"], "1 action", "150 feet", ["V", "M"], CON10M,
      "Magical darkness fills a 60-foot-radius sphere; a creature that starts its turn inside makes a Wisdom save, taking 8d8 psychic damage on a failure, half on a success."),
    sp("XGE", "mighty-fortress", "Mighty Fortress", 8, "Conjuration", ["wizard"], "1 minute", "1 mile", VSM, "Instantaneous",
      "Raise a stone fortress with four towers and a keep in a 120-foot square, staffed by 100 invisible servants; it lasts 7 days, and casting it weekly for a year makes it permanent."),
    sp("XGE", "invulnerability", "Invulnerability", 9, "Abjuration", ["wizard"], "1 action", "Self", VSM, CON10M,
      "You are immune to all damage until the spell ends."),
    sp("XGE", "mass-polymorph", "Mass Polymorph", 9, "Transmutation", ["bard", "sorcerer", "wizard"], "1 action", "120 feet", VSM, CON1H,
      "Turn up to ten creatures into beasts whose challenge rating can't exceed theirs (or half their level); an unwilling creature makes a Wisdom save to resist."),

    // Tasha's Cauldron of Everything
    sp("TCE", "summon-beast", "Summon Beast", 2, "Conjuration", ["druid", "ranger"], "1 action", "90 feet", VSM, CON1H, summon("a Bestial Spirit (air, land, or water)"), SUMMON),
    sp("TCE", "summon-fey", "Summon Fey", 3, "Conjuration", ["druid", "ranger", "warlock", "wizard"], "1 action", "90 feet", VSM, CON1H, summon("a Fey Spirit (fuming, mirthful, or tricksy)"), SUMMON),
    sp("TCE", "summon-shadowspawn", "Summon Shadowspawn", 3, "Conjuration", ["warlock", "wizard"], "1 action", "90 feet", VSM, CON1H, summon("a Shadow Spirit (fury, despair, or fear)"), SUMMON),
    sp("TCE", "summon-undead", "Summon Undead", 3, "Necromancy", ["warlock", "wizard"], "1 action", "90 feet", VSM, CON1H, summon("an Undead Spirit (ghostly, putrid, or skeletal)"), SUMMON),
    sp("TCE", "summon-aberration", "Summon Aberration", 4, "Conjuration", ["warlock", "wizard"], "1 action", "90 feet", VSM, CON1H, summon("an Aberrant Spirit (beholderkin, slaad, or star spawn)"), SUMMON),
    sp("TCE", "summon-construct", "Summon Construct", 4, "Conjuration", ["artificer", "wizard"], "1 action", "90 feet", VSM, CON1H, summon("a Construct Spirit (clay, metal, or stone)"), SUMMON),
    sp("TCE", "summon-elemental", "Summon Elemental", 4, "Conjuration", ["druid", "ranger", "wizard"], "1 action", "90 feet", VSM, CON1H, summon("an Elemental Spirit (air, earth, fire, or water)"), SUMMON),
    sp("TCE", "summon-celestial", "Summon Celestial", 5, "Conjuration", ["cleric", "paladin"], "1 action", "90 feet", VSM, CON1H, summon("a Celestial Spirit (avenger or defender)"), SUMMON),
    sp("TCE", "summon-fiend", "Summon Fiend", 6, "Conjuration", ["warlock", "wizard"], "1 action", "90 feet", VSM, CON1H, summon("a Fiendish Spirit (demon, devil, or yugoloth)"), SUMMON),
    sp("TCE", "tashas-otherworldly-guise", "Tasha's Otherworldly Guise", 6, "Transmutation", ["sorcerer", "warlock", "wizard"], "1 bonus action", "Self", VSM, CON1M,
      "Draw on the Upper Planes (immune to radiant and necrotic damage and the charmed condition) or Lower Planes (immune to fire and poison damage and the poisoned condition), and gain a 40-foot flying speed, +2 AC, magical weapon attacks using your spellcasting ability, and two attacks per Attack action."),
    sp("TCE", "dream-of-the-blue-veil", "Dream of the Blue Veil", 7, "Conjuration", ["bard", "sorcerer", "warlock", "wizard"], "10 minutes", "20 feet", VSM, "6 hours",
      "You and up to eight willing creatures fall unconscious and dream of another world of the Material Plane tied to an item or creature you hold, arriving there in body when the spell ends."),
    sp("TCE", "blade-of-disaster", "Blade of Disaster", 9, "Conjuration", ["sorcerer", "warlock", "wizard"], "1 bonus action", "60 feet", VS, CON1M,
      "A blade-shaped planar rift: as a bonus action move it 30 feet and make up to two melee spell attacks with it, each dealing 4d12 force damage on a hit. It scores a critical hit on an 18 or higher, dealing 12d12 force instead."),

    // Fizban's Treasury of Dragons
    sp("FTD", "nathairs-mischief", "Nathair's Mischief", 2, "Illusion", ["bard", "sorcerer", "wizard"], "1 action", "60 feet", ["S", "M"], CON1M,
      "Fill a 20-foot cube with fey mischief, rolling a d4 for its effect each round: charming (Wisdom save or charmed), dazzling (Dexterity save or blinded), giggling (Wisdom save or incapacitated), or the cube becomes difficult terrain."),
    sp("FTD", "rimes-binding-ice", "Rime's Binding Ice", 2, "Evocation", ["sorcerer", "wizard"], "1 action", "Self (30-foot cone)", ["S", "M"], "Instantaneous",
      "Ice bursts in a 30-foot cone: each creature in it makes a Constitution save, taking 3d8 cold damage and being frozen in place (speed 0 for 1 minute unless chipped free) on a failure, half damage only on a success.",
      "Cold damage increases by 1d8 for each slot level above 2nd."),
    sp("FTD", "ashardalons-stride", "Ashardalon's Stride", 3, "Transmutation", ["artificer", "ranger", "sorcerer", "wizard"], "1 bonus action", "Self", VS, CON1M,
      "Your speed rises by 20 feet and your movement doesn't provoke opportunity attacks; each creature or object you pass within 5 feet of takes 1d6 fire damage, once per turn.",
      "Speed rises 5 more feet and damage by 1d6 for each slot level above 3rd."),
    sp("FTD", "raulothims-psychic-lance", "Raulothim's Psychic Lance", 4, "Enchantment", ["bard", "sorcerer", "warlock", "wizard"], "1 action", "120 feet", ["V"], "Instantaneous",
      "One creature you can see, or one you name that is within range even if hidden, makes an Intelligence save or takes 7d6 psychic damage and is incapacitated until the start of your next turn; half damage only on a success.",
      "Damage increases by 1d6 for each slot level above 4th."),
    sp("FTD", "summon-draconic-spirit", "Summon Draconic Spirit", 5, "Conjuration", ["druid", "sorcerer", "wizard"], "1 action", "60 feet", VSM, CON1H,
      summon("a Draconic Spirit (chromatic, gem, or metallic) that also shares its damage resistance with you"), SUMMON),
    sp("FTD", "fizbans-platinum-shield", "Fizban's Platinum Shield", 6, "Abjuration", ["sorcerer", "wizard"], "1 bonus action", "60 feet", VSM, CON1M,
      "Wrap a creature in platinum light: half cover, resistance to acid, cold, fire, lightning, and poison damage, and no damage instead of half when it succeeds on a Dexterity save. A bonus action moves the shield to another creature."),
    sp("FTD", "draconic-transformation", "Draconic Transformation", 7, "Transmutation", ["druid", "sorcerer", "wizard"], "1 bonus action", "Self", VSM, CON1M,
      "Gain 30-foot blindsight and spectral wings with a 60-foot flying speed, and exhale force in a 60-foot cone when you cast it and as a bonus action later: each creature in it makes a Dexterity save, taking 6d8 force damage on a failure, half on a success."),

    // Acquisitions Incorporated
    sp("AI", "distort-value", "Distort Value", 1, "Illusion", ["bard", "sorcerer", "warlock", "wizard"], "1 minute", "Touch", ["V"], "8 hours",
      "Make an object up to 1 foot on a side look worth twice or half its real value; an observer must beat your spell save DC with an Investigation check to see through it.",
      "The object can be 1 foot larger for each slot level above 1st."),
    sp("AI", "jims-magic-missile", "Jim's Magic Missile", 1, "Evocation", ["wizard"], "1 action", "120 feet", VSM, "Instantaneous",
      "Create three glowing darts and make a ranged spell attack with each, dealing 2d4 force damage on a hit; on a natural 1, every dart turns and strikes you for 1 force damage instead.",
      "One more dart for each slot level above 1st."),
    sp("AI", "gift-of-gab", "Gift of Gab", 2, "Enchantment", ["bard", "wizard"], "1 reaction", "Self", VSM, "Instantaneous",
      "Reaction while speaking: each creature of your choice within 5 feet forgets everything you said in the last 6 seconds, and you can replace it with something better."),
    sp("AI", "jims-glowing-coin", "Jim's Glowing Coin", 2, "Enchantment", ["wizard"], "1 action", "60 feet", ["S", "M"], "1 minute",
      "Toss a glowing coin: each creature of your choice within 30 feet of it makes a Wisdom save or is distracted, with disadvantage on Perception checks and initiative rolls for the duration."),
    sp("AI", "fast-friends", "Fast Friends", 3, "Enchantment", ["bard", "cleric", "wizard"], "1 action", "30 feet", ["V"], CON1H,
      "One humanoid makes a Wisdom save (with advantage if you're fighting it) or is charmed and willing to perform reasonable services for you.",
      "One additional creature for each slot level above 3rd."),
    sp("AI", "incite-greed", "Incite Greed", 3, "Enchantment", ["cleric", "sorcerer", "warlock", "wizard"], "1 action", "30 feet", VSM, CON1M,
      "Hold up a gem: each creature of your choice that can see it makes a Wisdom save or is charmed, moving to stand within 5 feet of you staring at the gem; it repeats the save at the end of each of its turns."),
    sp("AI", "motivational-speech", "Motivational Speech", 3, "Enchantment", ["bard", "cleric"], "1 minute", "60 feet", ["V"], "1 hour",
      "Up to five creatures that hear you gain 5 temporary hit points and advantage on Wisdom saves, and a target that is hit gains advantage on its next attack roll; the benefits end when its temporary hit points are gone.",
      "Temporary hit points increase by 5 for each slot level above 3rd."),

    // Strixhaven: A Curriculum of Chaos
    sp("SCC", "borrowed-knowledge", "Borrowed Knowledge", 2, "Divination", ["bard", "cleric", "warlock", "wizard"], "1 action", "Self", VSM, "1 hour",
      "Gain proficiency in one skill you lack for the duration."),
    sp("SCC", "kinetic-jaunt", "Kinetic Jaunt", 2, "Transmutation", ["artificer", "bard", "sorcerer", "wizard"], "1 bonus action", "Self", ["S"], CON1M,
      "Your speed rises by 10 feet, your movement doesn't provoke opportunity attacks, and you can move through creatures' spaces; ending a turn inside one shunts you out and deals force damage to you."),
    sp("SCC", "vortex-warp", "Vortex Warp", 2, "Conjuration", ["artificer", "sorcerer", "wizard"], "1 action", "90 feet", VS, "Instantaneous",
      "One creature you can see makes a Constitution save (a willing creature can choose to fail) or is teleported to an unoccupied space you can see within range.",
      "Range increases by 30 feet for each slot level above 2nd."),
    sp("SCC", "wither-and-bloom", "Wither and Bloom", 2, "Necromancy", ["druid", "sorcerer", "wizard"], "1 action", "60 feet", VSM, "Instantaneous",
      "Each creature of your choice in a 10-foot-radius sphere makes a Constitution save, taking 2d6 necrotic damage on a failure, half on a success; then one creature of your choice there can spend and roll a Hit Die to heal.",
      "Damage increases by 1d6 for each slot level above 2nd, and one more Hit Die can be spent per slot level."),

    // Explorer's Guide to Wildemount (dunamancy; wizard list, also open to Chronurgy/Graviturgy)
    sp("EGtW", "sapping-sting", "Sapping Sting", 0, "Necromancy", ["wizard"], "1 action", "30 feet", VS, "Instantaneous",
      "One creature makes a Constitution save or takes 1d4 necrotic damage and falls prone.", CANTRIP_SCALE),
    sp("EGtW", "gift-of-alacrity", "Gift of Alacrity", 1, "Divination", ["wizard"], "1 minute", "Touch", VSM, "8 hours",
      "A willing creature adds a d8 to its initiative rolls for the duration."),
    sp("EGtW", "magnify-gravity", "Magnify Gravity", 1, "Transmutation", ["wizard"], "1 action", "60 feet", VS, "1 round",
      "Gravity surges in a 10-foot-radius sphere: each creature in it makes a Constitution save, taking 2d8 force damage and having its speed halved until the end of its next turn on a failure, half damage only on a success.",
      "Damage increases by 1d8 for each slot level above 1st."),
    sp("EGtW", "fortunes-favor", "Fortune's Favor", 2, "Divination", ["wizard"], "1 minute", "60 feet", VSM, "1 hour",
      "A creature gains one extra d20 it can roll once before the spell ends to replace its own attack roll, check, or save, or to force a reroll of an attack against it.",
      "One additional creature for each slot level above 2nd."),
    sp("EGtW", "immovable-object", "Immovable Object", 2, "Transmutation", ["wizard"], "1 action", "Touch", VSM, "1 hour",
      "Fix an object of 10 pounds or less in place; it holds up to 4,000 pounds, and only you, creatures you name, or a successful Strength (Athletics) check against your DC can move it.",
      "Higher slots extend the duration and strength."),
    sp("EGtW", "wristpocket", "Wristpocket", 2, "Conjuration", ["wizard"], "1 action (ritual)", "Self", ["S"], CON1H,
      "Send an object of up to 5 pounds you hold into an extradimensional pocket and recall it to your hand as an action; it reappears at your feet when the spell ends."),
    sp("EGtW", "pulse-wave", "Pulse Wave", 3, "Evocation", ["wizard"], "1 action", "Self (30-foot cone)", VS, "Instantaneous",
      "A wave of force fills a 30-foot cone: each creature in it makes a Constitution save, taking 6d6 force damage and being pushed or pulled up to 15 feet on a failure, half damage only on a success.",
      "Damage increases by 1d6 for each slot level above 3rd, and the push or pull by 5 feet."),
    sp("EGtW", "gravity-sinkhole", "Gravity Sinkhole", 4, "Evocation", ["wizard"], "1 action", "120 feet", VSM, "Instantaneous",
      "A 20-foot-radius sphere of crushing gravity: each creature in it makes a Constitution save, taking 5d10 force damage and being pulled toward the center on a failure, half damage only on a success.",
      "Damage increases by 1d10 for each slot level above 4th."),
    sp("EGtW", "temporal-shunt", "Temporal Shunt", 5, "Transmutation", ["wizard"], "1 reaction", "120 feet", VS, "1 round",
      "Reaction when a creature you can see attacks or starts casting a spell: it makes a Wisdom save or vanishes until the start of your next turn, and the attack or spell is wasted.",
      "One additional creature for each slot level above 5th."),
    sp("EGtW", "gravity-fissure", "Gravity Fissure", 6, "Evocation", ["wizard"], "1 action", "Self (100-foot line)", VSM, "Instantaneous",
      "A ravine of gravity in a 100-foot line: each creature in it makes a Constitution save, taking 8d8 force damage on a failure, half on a success. Creatures within 10 feet of the line also save or take the damage and are pulled toward it.",
      "Damage increases by 1d8 for each slot level above 6th."),
    sp("EGtW", "tether-essence", "Tether Essence", 7, "Necromancy", ["wizard"], "1 action", "60 feet", VSM, CON1H,
      "Two creatures each make a Constitution save (with disadvantage if within 30 feet of each other); if both fail, damage or healing one receives is mirrored onto the other until the spell ends."),
    sp("EGtW", "dark-star", "Dark Star", 8, "Evocation", ["wizard"], "1 action", "150 feet", VSM, CON1M,
      "A 40-foot-radius sphere of darkness, silence, and crushing gravity that is difficult terrain: a creature that enters it or starts its turn there makes a Constitution save, taking 8d10 force damage on a failure, half on a success, and one reduced to 0 hit points is crushed to dust."),
    sp("EGtW", "reality-break", "Reality Break", 8, "Conjuration", ["wizard"], "1 action", "60 feet", VSM, CON1M,
      "One creature makes a Wisdom save or reality fractures around it: it can't take reactions and rolls a d10 each turn for a random effect such as stunning psychic visions, a force rift, a hurling wormhole, or blinding void cold. It repeats the save at the end of each of its turns."),
    sp("EGtW", "ravenous-void", "Ravenous Void", 9, "Evocation", ["wizard"], "1 action", "1,000 feet", VSM, CON1M,
      "A 20-foot-radius gravitational void pulls creatures within 100 feet toward it each turn; a creature that starts its turn inside is restrained and takes 5d10 force damage, and one destroyed by it leaves nothing behind."),
    sp("EGtW", "time-ravage", "Time Ravage", 9, "Necromancy", ["wizard"], "1 action", "90 feet", VSM, "Instantaneous",
      "One creature makes a Constitution save, taking 10d12 necrotic damage on a failure, half on a success; on a failure it also ages into frailty and will die of old age within 30 days unless powerful magic reverses it."),

    // Other books: Guildmasters' Guide to Ravnica, Icewind Dale: Rime of the Frostmaiden
    sp("GGR", "encode-thoughts", "Encode Thoughts", 0, "Enchantment", ["wizard"], "1 action", "Self", ["S"], "8 hours",
      "Draw a memory, idea, or message out of your mind as a tangible thought strand that lasts the duration; certain magic and creatures can read it."),
    sp("IDRotF", "frost-fingers", "Frost Fingers", 1, "Evocation", ["wizard"], "1 action", "Self (15-foot cone)", VS, "Instantaneous",
      "Freezing cold sprays in a 15-foot cone: each creature in it makes a Constitution save, taking 2d8 cold damage on a failure, half on a success, and exposed water in the area freezes.",
      "Damage increases by 1d8 for each slot level above 1st.")
  ];
  // LOCAL_SPELL_INDEX is derived from LOCAL_SPELLS once in data.js, so both are extended here.
  const knownSpells = new Set([...LOCAL_SPELLS, ...FALLBACK_SPELLS].map(spell => spell.index));
  spells.filter(detail => !knownSpells.has(detail.index)).forEach(detail => {
    LOCAL_SPELLS.push(detail);
    LOCAL_SPELL_INDEX.push({ index: detail.index, name: detail.name, level: detail.level, classes: detail.classes.map(cls => cls.index) });
  });

  // ---------------------------------------------------------------------------------------------
  // ITEMS. Non-SRD class focuses and trinkets from TCE/XGE, plus DMG firearms for the Gunner feat.
  // ---------------------------------------------------------------------------------------------
  addMissing(ITEM_CATALOG, [
    itemCard("pistol", "Pistol", "Weapon", 3, "Martial ranged weapon", "1d10 piercing, ammunition 30/90, loading. (DMG firearm)"),
    itemCard("musket", "Musket", "Weapon", 10, "Martial ranged weapon", "1d12 piercing, ammunition 40/120, loading, two-handed. (DMG firearm)"),
    itemCard("all-purpose-tool", "All-Purpose Tool +1", "Wondrous Item", 1, "Uncommon magic item", "Counts as any artisan's tools; +1 to artificer spell attacks and save DCs; once per long rest borrow a cantrip for 8 hours. Requires attunement by an artificer. (TCE)"),
    itemCard("amulet-of-the-devout", "Amulet of the Devout +1", "Wondrous Item", 1, "Uncommon magic item", "Holy symbol; +1 to spell attacks and save DCs; one free Channel Divinity use per long rest. Requires attunement by a cleric or paladin. (TCE)"),
    itemCard("arcane-grimoire", "Arcane Grimoire +1", "Wondrous Item", 3, "Uncommon magic item", "Spellbook focus; +1 to wizard spell attacks and save DCs; Arcane Recovery regains one extra slot level. Requires attunement by a wizard. (TCE)"),
    itemCard("bloodwell-vial", "Bloodwell Vial +1", "Wondrous Item", 0.5, "Uncommon magic item", "+1 to sorcerer spell attacks and save DCs; once per day, regain sorcery points when spending Hit Dice on a short rest. Requires attunement by a sorcerer. (TCE)"),
    itemCard("moon-sickle", "Moon Sickle +1", "Weapon", 2, "Uncommon magic item", "1d4 slashing, light; +1 to attack and damage, +1 to druid and ranger spell attacks and save DCs, and add 1d4 to healing spells. Requires attunement by a druid or ranger. (TCE)"),
    itemCard("rhythm-makers-drum", "Rhythm-Maker's Drum +1", "Wondrous Item", 3, "Uncommon magic item", "Instrument focus; +1 to bard spell attacks and save DCs; once per long rest regain one Bardic Inspiration. Requires attunement by a bard. (TCE)"),
    itemCard("guardian-emblem", "Guardian Emblem", "Wondrous Item", 0, "Uncommon magic item", "3 charges; reaction to turn a critical hit on you or an ally within 30 feet into a normal hit. Regains charges at dawn. Requires attunement by a cleric or paladin. (TCE)"),
    itemCard("ruby-of-the-war-mage", "Ruby of the War Mage", "Wondrous Item", 0, "Common magic item", "Affix to a weapon to use it as a spellcasting focus. Requires attunement by a spellcaster. (XGE)"),
    itemCard("moon-touched-sword", "Moon-Touched Sword", "Weapon", 3, "Common magic item", "Sheds bright light 15 feet and dim light 15 feet more in darkness. Uses the base sword's damage. (XGE)"),
    itemCard("cloak-of-many-fashions", "Cloak of Many Fashions", "Wondrous Item", 1, "Common magic item", "Bonus action: change the cloak's style, color, and quality. (XGE)"),
    itemCard("enduring-spellbook", "Enduring Spellbook", "Wondrous Item", 3, "Common magic item", "Spellbook unharmed by fire or water and doesn't age. (XGE)"),
    itemCard("wand-of-pyrotechnics", "Wand of Pyrotechnics", "Wand", 1, "Common magic item", "7 charges; spend one for a harmless burst of colorful fireworks. Regains 1d6 + 1 charges at dawn. (XGE)")
  ], item => item.index);

  // Creation-time choices read by speciesChoices() in builder.js: "+2/+1 of your choice" lineages,
  // the SCAG half-elf variants (+1/+1, not CHA) and Tasha's Custom Lineage (+2, a skill, a feat).
  SPECIES_PRESETS.forEach(([name, , , , bonus]) => {
    const grants = SPECIES_GRANTS[name] = { ...(SPECIES_GRANTS[name] || {}) };
    if (grants.choose) return;
    if (/^Half-Elf \(/.test(name)) grants.choose = { bonuses: [1, 1], exclude: ["cha"], ...(name === "Half-Elf (High)" ? { cantripFrom: "wizard" } : {}) };
    else if (name === "Custom Lineage") grants.choose = { bonuses: [2], skills: 1, feat: true };
    else if (!Object.keys(bonus || {}).length) grants.choose = { bonuses: [2, 1] };
  });
})();
