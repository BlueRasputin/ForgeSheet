// Cumulative spells/cantrips known per class level, straight from the PHB tables.
const KNOWN_SPELLS = {
  bard: [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22],
  sorcerer: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15],
  warlock: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
  ranger: [0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11],
  wizard: Array.from({ length: 20 }, (_, index) => 6 + 2 * index)
};

function cantripProgression(start) {
  return Array.from({ length: 20 }, (_, index) => {
    const level = index + 1;
    return level >= 10 ? start + 2 : level >= 4 ? start + 1 : start;
  });
}

const CANTRIPS_KNOWN = {
  bard: cantripProgression(2),
  cleric: cantripProgression(3),
  druid: cantripProgression(2),
  sorcerer: cantripProgression(4),
  warlock: cantripProgression(2),
  wizard: cantripProgression(3)
};

// 2014 PHB class features by level for the classes built with classDef (ASI added automatically).
const CASTER_FEATURES = {
  bard: { 1: "Spellcasting, bardic inspiration (d6)", 2: "Jack of all trades, song of rest (d6)", 3: "Bard college, expertise", 5: "Bardic inspiration (d8), font of inspiration", 6: "Countercharm, college feature", 9: "Song of rest (d8)", 10: "Bardic inspiration (d10), expertise, magical secrets", 13: "Song of rest (d10)", 14: "Magical secrets, college feature", 15: "Bardic inspiration (d12)", 17: "Song of rest (d12)", 18: "Magical secrets", 20: "Superior inspiration" },
  cleric: { 1: "Spellcasting, divine domain", 2: "Channel divinity (1/rest), domain feature", 5: "Destroy undead (CR 1/2)", 6: "Channel divinity (2/rest), domain feature", 8: "Destroy undead (CR 1), domain feature", 10: "Divine intervention", 11: "Destroy undead (CR 2)", 14: "Destroy undead (CR 3)", 17: "Destroy undead (CR 4), domain feature", 18: "Channel divinity (3/rest)", 20: "Divine intervention improvement" },
  druid: { 1: "Druidic, spellcasting", 2: "Wild shape, druid circle", 4: "Wild shape improvement", 6: "Circle feature", 8: "Wild shape improvement", 10: "Circle feature", 14: "Circle feature", 18: "Timeless body, beast spells", 20: "Archdruid" },
  paladin: { 1: "Divine sense, lay on hands", 2: "Fighting style, spellcasting, divine smite", 3: "Divine health, sacred oath", 5: "Extra attack", 6: "Aura of protection", 7: "Sacred oath feature", 10: "Aura of courage", 11: "Improved divine smite", 14: "Cleansing touch", 15: "Sacred oath feature", 18: "Aura improvements", 20: "Sacred oath feature" },
  ranger: { 1: "Favored enemy, natural explorer", 2: "Fighting style, spellcasting", 3: "Ranger archetype, primeval awareness", 5: "Extra attack", 6: "Favored enemy and natural explorer improvements", 7: "Ranger archetype feature", 8: "Land's stride", 10: "Natural explorer improvement, hide in plain sight", 11: "Ranger archetype feature", 14: "Favored enemy improvement, vanish", 15: "Ranger archetype feature", 18: "Feral senses", 20: "Foe slayer" },
  sorcerer: { 1: "Spellcasting, sorcerous origin", 2: "Font of magic", 3: "Metamagic", 6: "Sorcerous origin feature", 10: "Metamagic", 14: "Sorcerous origin feature", 17: "Metamagic", 18: "Sorcerous origin feature", 20: "Sorcerous restoration" },
  warlock: { 1: "Otherworldly patron, pact magic", 2: "Eldritch invocations", 3: "Pact boon", 6: "Otherworldly patron feature", 10: "Otherworldly patron feature", 11: "Mystic arcanum (6th level)", 13: "Mystic arcanum (7th level)", 14: "Otherworldly patron feature", 15: "Mystic arcanum (8th level)", 17: "Mystic arcanum (9th level)", 20: "Eldritch master" },
  wizard: { 1: "Spellcasting, arcane recovery", 2: "Arcane tradition", 6: "Arcane tradition feature", 10: "Arcane tradition feature", 14: "Arcane tradition feature", 18: "Spell mastery", 20: "Signature spells" }
};

function classDef(id, name, hitDie, casterType, spellAbility, preparedFormula, spellSources) {
  const known = KNOWN_SPELLS[id] || [];
  const cantrips = CANTRIPS_KNOWN[id] || [];
  const featureText = CASTER_FEATURES[id] || {};
  const delta = (list, level) => Math.max(0, (list[level - 1] || 0) - (list[level - 2] || 0));
  return {
    id, name, hitDie, casterType, spellAbility, preparedFormula, spellSources,
    table: makeTable(Object.fromEntries(Array.from({ length: 20 }, (_, index) => {
      const level = index + 1;
      const features = [featureText[level], ASI_LEVELS.has(level) ? "Ability score improvement" : ""].filter(Boolean).join(", ");
      return [level, [features, delta(known, level), delta(cantrips, level)]];
    })))
  };
}

function makeTable(rows) {
  return Array.from({ length: 20 }, (_, index) => {
    const level = index + 1;
    const row = rows[level] || ["", 0, 0];
    return { level, features: row[0], newSpells: Number(row[1] || 0), cantrips: Number(row[2] || 0) };
  });
}

function martialDef(id, name, hitDie, rows) {
  return {
    id, name, hitDie,
    casterType: "none",
    spellAbility: "none",
    preparedFormula: "none",
    spellSources: [],
    table: makeTable(Object.fromEntries(Object.entries(rows).map(([level, features]) => [level, [features, 0, 0]])))
  };
}

const BUILT_IN_CLASSES = {
  artificer: {
    id: "artificer",
    name: "Artificer",
    hitDie: 8,
    casterType: "halfRoundUp",
    spellAbility: "int",
    preparedFormula: "halfLevelPlusMod",
    spellSources: ["artificer"],
    table: makeTable({
      1: ["Magical tinkering, spellcasting", 0, 2],
      2: ["Infuse item", 0, 0],
      3: ["Artificer specialist, the right tool for the job", 0, 0],
      4: ["Ability score improvement", 0, 0],
      5: ["Specialist feature", 0, 0],
      6: ["Tool expertise", 0, 0],
      7: ["Flash of genius", 0, 0],
      8: ["Ability score improvement", 0, 0],
      9: ["Specialist feature", 0, 0],
      10: ["Magic item adept", 0, 1],
      11: ["Spell-storing item", 0, 0],
      12: ["Ability score improvement", 0, 0],
      13: ["", 0, 0],
      14: ["Magic item savant", 0, 1],
      15: ["Specialist feature", 0, 0],
      16: ["Ability score improvement", 0, 0],
      17: ["", 0, 0],
      18: ["Magic item master", 0, 0],
      19: ["Ability score improvement", 0, 0],
      20: ["Soul of artifice", 0, 0]
    })
  },
  wizard: classDef("wizard", "Wizard", 6, "full", "int", "levelPlusMod", ["wizard"]),
  cleric: classDef("cleric", "Cleric", 8, "full", "wis", "levelPlusMod", ["cleric"]),
  druid: classDef("druid", "Druid", 8, "full", "wis", "levelPlusMod", ["druid"]),
  bard: classDef("bard", "Bard", 8, "full", "cha", "known", ["bard"]),
  sorcerer: classDef("sorcerer", "Sorcerer", 6, "full", "cha", "known", ["sorcerer"]),
  warlock: classDef("warlock", "Warlock", 8, "warlock", "cha", "known", ["warlock"]),
  paladin: classDef("paladin", "Paladin", 10, "halfRoundDown", "cha", "halfLevelPlusMod", ["paladin"]),
  ranger: classDef("ranger", "Ranger", 10, "halfRoundDown", "wis", "known", ["ranger"]),
  barbarian: martialDef("barbarian", "Barbarian", 12, {
    1: "Rage, unarmored defense",
    2: "Reckless attack, danger sense",
    3: "Primal path",
    4: "Ability score improvement",
    5: "Extra attack, fast movement",
    6: "Path feature",
    7: "Feral instinct",
    8: "Ability score improvement",
    9: "Brutal critical (1 die)",
    10: "Path feature",
    11: "Relentless rage",
    12: "Ability score improvement",
    13: "Brutal critical (2 dice)",
    14: "Path feature",
    15: "Persistent rage",
    16: "Ability score improvement",
    17: "Brutal critical (3 dice)",
    18: "Indomitable might",
    19: "Ability score improvement",
    20: "Primal champion"
  }),
  fighter: martialDef("fighter", "Fighter", 10, {
    1: "Fighting style, second wind",
    2: "Action surge",
    3: "Martial archetype",
    4: "Ability score improvement",
    5: "Extra attack",
    6: "Ability score improvement",
    7: "Archetype feature",
    8: "Ability score improvement",
    9: "Indomitable",
    10: "Archetype feature",
    11: "Extra attack (2)",
    12: "Ability score improvement",
    13: "Indomitable (2 uses)",
    14: "Ability score improvement",
    15: "Archetype feature",
    16: "Ability score improvement",
    17: "Action surge (2 uses), indomitable (3 uses)",
    18: "Archetype feature",
    19: "Ability score improvement",
    20: "Extra attack (3)"
  }),
  monk: martialDef("monk", "Monk", 8, {
    1: "Unarmored defense, martial arts",
    2: "Ki, unarmored movement",
    3: "Monastic tradition, deflect missiles",
    4: "Ability score improvement, slow fall",
    5: "Extra attack, stunning strike",
    6: "Ki-empowered strikes, tradition feature",
    7: "Evasion, stillness of mind",
    8: "Ability score improvement",
    9: "Unarmored movement improvement",
    10: "Purity of body",
    11: "Tradition feature",
    12: "Ability score improvement",
    13: "Tongue of the sun and moon",
    14: "Diamond soul",
    15: "Timeless body",
    16: "Ability score improvement",
    17: "Tradition feature",
    18: "Empty body",
    19: "Ability score improvement",
    20: "Perfect self"
  }),
  bloodhunter: martialDef("bloodhunter", "Blood Hunter", 10, {
    1: "Hunter's bane, blood maledict",
    2: "Fighting style, crimson rite (d4 hemocraft die)",
    3: "Blood hunter order",
    4: "Ability score improvement",
    5: "Extra attack, hemocraft die d6",
    6: "Brand of castigation, blood maledict (2 uses)",
    7: "Order feature, additional crimson rite",
    8: "Ability score improvement",
    9: "Grim psychometry",
    10: "Dark augmentation",
    11: "Order feature, hemocraft die d8",
    12: "Ability score improvement",
    13: "Brand of tethering, blood maledict (3 uses)",
    14: "Hardened soul, additional crimson rite",
    15: "Order feature",
    16: "Ability score improvement",
    17: "Blood maledict (4 uses), hemocraft die d10",
    18: "Order feature",
    19: "Ability score improvement",
    20: "Sanguine mastery"
  }),
  rogue: martialDef("rogue", "Rogue", 8, {
    1: "Expertise, sneak attack, thieves' cant",
    2: "Cunning action",
    3: "Roguish archetype",
    4: "Ability score improvement",
    5: "Uncanny dodge",
    6: "Expertise",
    7: "Evasion",
    8: "Ability score improvement",
    9: "Archetype feature",
    10: "Ability score improvement",
    11: "Reliable talent",
    12: "Ability score improvement",
    13: "Archetype feature",
    14: "Blindsense",
    15: "Slippery mind",
    16: "Ability score improvement",
    17: "Archetype feature",
    18: "Elusive",
    19: "Ability score improvement",
    20: "Stroke of luck"
  })
};

// "custom-" + slug, with -2, -3... until it is free (never an official id or another homebrew's).
function uniqueCustomId(name, taken) {
  const base = `custom-${slug(name).slice(0, 50) || "item"}`;
  let id = base;
  for (let n = 2; taken[id]; n += 1) id = `${base}-${n}`;
  return id;
}

// Custom spells: a device library (like custom classes and feats), embedded in every character that uses one
// (character.customContent.spells) and merged into spellDetails/allSpells by registerCustomSpells (spells.js).
const SPELL_SCHOOLS = ["abjuration", "conjuration", "divination", "enchantment", "evocation", "illusion", "necromancy", "transmutation"];
let customSpells = loadCustomSpells();

function loadCustomSpells() {
  try {
    const stored = JSON.parse(localStorage.getItem(CUSTOM_SPELL_KEY)) || {};
    return Object.fromEntries(Object.values(stored).map(sanitizeCustomSpell).filter(Boolean).map(spell => [spell.id, spell]));
  } catch {
    return {};
  }
}

// Merge with stored spells so a tab opened earlier can't erase spells other tabs saved.
function saveCustomSpells() {
  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem(CUSTOM_SPELL_KEY)) || {};
  } catch {
    stored = {};
  }
  customSpells = { ...stored, ...customSpells };
  localStorage.setItem(CUSTOM_SPELL_KEY, JSON.stringify(customSpells));
}

// Synced, shared and embedded spells are untrusted: keep known fields, clamp numbers, cap text. Dice fields stay as
// typed; customSpellDetail ignores ones that aren't plain dice.
function sanitizeCustomSpell(raw) {
  if (!raw || typeof raw !== "object" || !/^custom-[a-z0-9-]{1,60}$/.test(String(raw.id || ""))) return null;
  const text = (value, max = 200) => String(value ?? "").slice(0, max);
  const ability = value => ABILITIES.some(([id]) => id === value) ? value : "none";
  return {
    id: raw.id,
    name: text(raw.name, 80),
    level: clamp(Math.round(Number(raw.level) || 0), 0, 9),
    school: SPELL_SCHOOLS.includes(raw.school) ? raw.school : "evocation",
    classes: (Array.isArray(raw.classes) ? raw.classes : []).map(id => slug(text(id, 40))).filter(Boolean).slice(0, 20),
    ritual: Boolean(raw.ritual),
    concentration: Boolean(raw.concentration),
    castingTime: text(raw.castingTime, 60),
    range: text(raw.range, 60),
    components: text(raw.components, 30),
    material: text(raw.material, 300),
    duration: text(raw.duration, 60),
    desc: text(raw.desc, 4000),
    higherLevel: text(raw.higherLevel, 1000),
    attack: ["melee", "ranged"].includes(raw.attack) ? raw.attack : "none",
    save: ability(raw.save),
    damage: { dice: text(raw.damage?.dice, 20), type: text(raw.damage?.type, 20), perSlot: text(raw.damage?.perSlot, 20) },
    healing: { dice: text(raw.healing?.dice, 20), perSlot: text(raw.healing?.perSlot, 20) }
  };
}

// Spells typed straight into a row (row.custom, before the library) move into the library; the row points at them.
// The same old spell met twice (the active sheet and its library copy) becomes one library entry.
function migrateCustomSpellRows(source) {
  if (!(source.spells || []).some(row => row?.custom)) return source;
  const embedded = { ...(source.customContent?.spells || {}) };
  source.spells = source.spells.map(row => {
    if (!row?.custom) return row;
    const { custom, ...rest } = row;
    const fields = {
      name: custom.name || "",
      level: Number.isInteger(custom.level) ? custom.level : Number(row.level) || 0,
      castingTime: custom.castingTime || "",
      range: custom.range || "",
      duration: custom.duration || "",
      components: custom.components || "",
      desc: custom.desc || "",
      // The old editor kept concentration in the duration text ("Concentration, up to 1 minute").
      concentration: /^\s*concentration/i.test(custom.duration || "")
    };
    const same = Object.values(customSpells).find(spell => Object.entries(fields).every(([key, value]) => spell[key] === value));
    const spell = same || sanitizeCustomSpell({ ...fields, id: uniqueCustomId(`${fields.name || "spell"} ${crypto.randomUUID().slice(0, 4)}`, customSpells) });
    customSpells[spell.id] = spell;
    embedded[spell.id] = spell;
    return { ...rest, index: spell.id, level: spell.level };
  });
  saveCustomSpells();
  source.customContent = { ...(source.customContent || {}), spells: embedded };
  return source;
}

let customClasses = loadCustomClasses();
let classBuilderDraft = null;
const officialSubclasses = OFFICIAL_SUBCLASS_FALLBACK;

// Merge with stored classes so a tab opened earlier can't erase classes other tabs saved.
function saveCustomClasses() {
  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem(CUSTOM_CLASS_KEY)) || {};
  } catch {
    stored = {};
  }
  customClasses = { ...stored, ...customClasses };
  localStorage.setItem(CUSTOM_CLASS_KEY, JSON.stringify(customClasses));
}

// A custom class saved under a built-in id (an old "Warlock" homebrew) moves to custom-<id>, so it never hides the real class.
function loadCustomClasses() {
  try {
    const stored = JSON.parse(localStorage.getItem(CUSTOM_CLASS_KEY)) || {};
    return Object.fromEntries(Object.values(stored).filter(cls => cls?.id && Array.isArray(cls.table)).map(cls => {
      const id = BUILT_IN_CLASSES[cls.id] ? `custom-${cls.id}` : cls.id;
      return [id, { ...cls, id }];
    }));
  } catch {
    return {};
  }
}

// Built-in classes always win; custom classes come from this device, or from a synced character's embedded copy.
function getClasses() {
  const embedded = {};
  [character, ...Object.values(typeof characterLibrary === "object" ? characterLibrary : {})].forEach(item => {
    Object.values(item?.customContent?.classes || {}).forEach(cls => {
      if (cls?.id && Array.isArray(cls.table)) embedded[cls.id] = cls;
    });
  });
  const classes = { ...embedded, ...customClasses, ...BUILT_IN_CLASSES };
  registerCustomClassContent(classes);
  return classes;
}

// Custom classes feed the tables official content uses (subclass list, SUBCLASS_FEATURES/SPELLS/EXTRAS, subclass level,
// skill list), so their subclasses show in every picker and flow through the official code paths. Rebuilt only when
// the set of class records changes.
const injectedCustomContent = { classes: [], classIds: [], subclassIds: [] };

function registerCustomClassContent(classes) {
  const list = Object.values(classes).filter(cls => !BUILT_IN_CLASSES[cls.id]);
  const previous = injectedCustomContent;
  if (list.length === previous.classes.length && list.every((cls, index) => cls === previous.classes[index])) return;
  previous.subclassIds.forEach(id => [SUBCLASS_FEATURES, SUBCLASS_SPELLS, SUBCLASS_EXTRAS].forEach(table => delete table[id]));
  previous.classIds.forEach(id => [SUBCLASS_LEVEL, CLASS_SKILL_CHOICES].forEach(table => delete table[id]));
  for (let index = OFFICIAL_SUBCLASS_FALLBACK.length - 1; index >= 0; index -= 1) {
    if (OFFICIAL_SUBCLASS_FALLBACK[index].custom) OFFICIAL_SUBCLASS_FALLBACK.splice(index, 1);
  }
  Object.assign(injectedCustomContent, { classes: list, classIds: list.map(cls => cls.id), subclassIds: [] });
  list.forEach(cls => {
    if (cls.subclassLevel) SUBCLASS_LEVEL[cls.id] = cls.subclassLevel;
    if (cls.skillChoices?.from?.length) CLASS_SKILL_CHOICES[cls.id] = cls.skillChoices.from;
    (cls.subclasses || []).forEach(sub => {
      // Never stand in for an official subclass.
      if (!sub?.id || !sub.name || OFFICIAL_SUBCLASS_FALLBACK.some(item => item.index === sub.id)) return;
      const resources = sub.resources || [];
      OFFICIAL_SUBCLASS_FALLBACK.push({ ...officialSubclass(sub.id, sub.name, cls.id, cls.name, "Subclass"), source: "Homebrew", custom: true });
      // A feature named like one of its resources becomes an action row that spends it.
      SUBCLASS_FEATURES[sub.id] = { source: "Homebrew", features: (sub.features || []).map(([level, name, text]) => [level, name, text, resources.some(item => item.name === name) ? { cost: name } : {}]) };
      if (Object.keys(sub.spells || {}).length) SUBCLASS_SPELLS[sub.id] = sub.spells;
      SUBCLASS_EXTRAS[sub.id] = {
        classId: cls.id,
        armor: sub.armor ? [sub.armor] : [],
        weapons: sub.weapons ? [sub.weapons] : [],
        trackers: (level, prof) => resources.map(item => [item.name, classResourceMax(item.max, level, prof), item.reset, item.die])
      };
      injectedCustomContent.subclassIds.push(sub.id);
    });
  });
}

// A custom resource's uses: a number, "level", "level/2", "prof", "mod:<ability>" or a 20-entry per-level table.
function classResourceMax(max, level, prof = proficiencyBonus()) {
  if (Array.isArray(max)) return Math.max(0, Number(max[clamp(level, 1, 20) - 1]) || 0);
  if (max === "level") return level;
  if (max === "level/2") return Math.max(1, Math.floor(level / 2));
  if (max === "prof") return prof;
  const ability = String(max).match(/^mod:(str|dex|con|int|wis|cha)$/)?.[1];
  if (ability) return Math.max(1, mod(ability));
  return Math.max(0, Math.round(Number(max) || 0));
}

// Mystic Arcanum gates (class level: spell level): the warlock's, or the ones a custom pact class sets.
const WARLOCK_ARCANUM = { 11: 6, 13: 7, 15: 8, 17: 9 };

function arcanumLevelsFor(cls) {
  return cls?.id === "warlock" ? WARLOCK_ARCANUM : cls?.arcanumLevels || {};
}

// Trackers a custom class defines: its resources and one Mystic Arcanum use per configured spell level.
function customClassTrackers(cls, level, prof) {
  if (BUILT_IN_CLASSES[cls.id]) return [];
  const arcanum = Object.entries(cls.arcanumLevels || {}).filter(([gate]) => level >= Number(gate)).map(([, spellLevel]) => [`Mystic Arcanum (${ordinal(spellLevel)})`, 1, "long"]);
  return [...arcanum, ...(cls.resources || []).map(item => [item.name, classResourceMax(item.max, level, prof), item.reset, item.die])];
}

// Stand-in for a custom class this device doesn't have, so the sheet never silently becomes another class.
function missingClass(id) {
  return { id, name: `Custom class (${id}, not on this device)`, hitDie: 8, casterType: "none", spellAbility: "none", preparedFormula: "none", spellSources: [], table: makeTable({}) };
}

// Cumulative spells known by class level for subclass-granted casting.
const THIRD_CASTER_KNOWN = [0, 0, 3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13];
const PROFANE_SOUL_KNOWN = [0, 0, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 11];

// Martial subclasses that make their class a caster.
const SUBCLASS_CASTING = {
  // EK/AT leveled spells must come from two schools, except one pick at each of 3rd, 8th, 14th and 20th (PHB p.75, p.98).
  "eldritch-knight": { casterType: "third", spellAbility: "int", preparedFormula: "known", spellSources: ["wizard"], knownTable: THIRD_CASTER_KNOWN, cantripTable: subclassCantrips(2), schools: ["abjuration", "evocation"], freeSchoolLevels: [3, 8, 14, 20] },
  // Arcane Trickster's third cantrip is Mage Hand, granted automatically, so only two are chosen.
  "arcane-trickster": { casterType: "third", spellAbility: "int", preparedFormula: "known", spellSources: ["wizard"], knownTable: THIRD_CASTER_KNOWN, cantripTable: subclassCantrips(2), schools: ["enchantment", "illusion"], freeSchoolLevels: [3, 8, 14, 20] },
  // Profane Soul casts with the hemocraft ability (a getter, so each entryClass spread reads the current choice).
  "profane-soul": { casterType: "pactThird", get spellAbility() { return hemocraftAbility(); }, preparedFormula: "known", spellSources: ["warlock"], knownTable: PROFANE_SOUL_KNOWN, cantripTable: subclassCantrips(2) }
};

// Hemocraft ability (Blood Hunter 2020): INT, or WIS for every hemocraft feature with the DM's permission.
function hemocraftAbility(source = character) {
  return source.classChoices?.hemocraftAbility === "wis" ? "wis" : "int";
}

function hemocraftDc(prof = proficiencyBonus()) {
  return 8 + prof + mod(hemocraftAbility());
}

// Subclass casters learn cantrips at 3rd level and one more at 10th.
function subclassCantrips(start) {
  return Array.from({ length: 20 }, (_, index) => index + 1 < 3 ? 0 : index + 1 >= 10 ? start + 1 : start);
}

function cantripCap(cls = currentClass(), level = character.level) {
  if (cls.cantripTable) return cls.cantripTable[level - 1] || 0;
  return (cls.table || []).slice(0, level).reduce((sum, row) => sum + Number(row.cantrips || 0), 0);
}

function currentClass() {
  const base = getClasses()[character.classId] || (character.classId ? missingClass(character.classId) : BUILT_IN_CLASSES.artificer);
  const cls = editionClass(base, character.rulesVersion);
  const casting = cls.casterType === "none" ? lookupBySubclass(SUBCLASS_CASTING) : null;
  return casting ? { ...cls, ...casting } : cls;
}

// A class set to the 2024 rules: its SRD 5.2 table drives features, ASI levels, cantrips, prepared spells and slots.
// Classes with no 2024 SRD table (artificer, blood hunter, custom classes) keep their 2014 tables.
function editionClass(cls, rules) {
  return rules === "2024" ? class2024(cls) || cls : cls;
}

const class2024Cache = {};

function class2024(cls) {
  const srd = SRD_2024_CLASSES[cls.id];
  if (!srd || !BUILT_IN_CLASSES[cls.id]) return null;
  if (class2024Cache[cls.id]) return class2024Cache[cls.id];
  const levels = srd.levels;
  const caster = levels.some(level => level.slots.some(Boolean));
  const prepared = levels.map(level => level.prepared);
  const has = name => levels.filter(level => level.features.some(feature => feature.name === name)).map(level => level.level);
  // Bards, sorcerers, warlocks and rangers change their list on level up only; the rest re-prepare after a long rest.
  const listCaster = caster && cls.preparedFormula === "known";
  const built = {
    ...cls,
    rules: "2024",
    srd2024: srd,
    subclassLevel: 3,
    asiLevels: [...has("Ability Score Improvement"), ...has("Epic Boon")],
    epicBoonLevels: has("Epic Boon"),
    // 2024 paladins and rangers cast from 1st level: their slots match the full-caster table at half level, rounded up.
    casterType: ["paladin", "ranger"].includes(cls.id) ? "halfRoundUp" : cls.casterType,
    cantripTable: caster ? levels.map(level => level.cantrips) : undefined,
    knownTable: listCaster ? prepared : undefined,
    preparedTable: caster && !listCaster ? prepared : undefined,
    preparedFormula: !caster ? "none" : listCaster ? "known" : "table",
    table: makeTable(Object.fromEntries(levels.map(level => [level.level, [
      level.features.map(feature => feature.name).join(", "),
      // A wizard still copies two spells into the spellbook each level; other prepared casters prepare from the full list.
      cls.id === "wizard" ? (level.level === 1 ? 6 : 2) : 0,
      0
    ]])))
  };
  class2024Cache[cls.id] = built;
  return built;
}

function isPactCaster(cls = currentClass()) {
  return ["warlock", "pactHalf", "pactThird"].includes(cls.casterType);
}

// Multiclassing: character.level is the primary class's level; extra classes live in character.multiclasses.
function totalLevel(source = character) {
  return Number(source.level || 1) + (source.multiclasses || []).reduce((sum, entry) => sum + Number(entry.level || 0), 0);
}

function classEntries(source = character) {
  return [
    { key: "primary", classId: source.classId, level: Number(source.level || 1), subclassName: source.subclassName, officialIndex: source.subclass?.officialIndex || "", rules: source.rulesVersion || "2014" },
    ...(source.multiclasses || []).map(entry => ({ key: entry.id, ...entry, rules: entry.rules || "2014" }))
  ];
}

// Multiclass-aware rule checks. Class features ask these instead of currentClass()/character.level, so a
// feature works the same whether its class was taken first or later.

// The official subclass slug for a class entry: the picked slug, else the typed name matched within that class
// (so the barbarian's Wild Magic never resolves to the sorcerer's).
function subclassIndexFor(entry) {
  if (entry.officialIndex) return entry.officialIndex;
  const key = normalizedSubclassKey(entry.subclassName);
  if (!key) return "";
  return officialSubclasses.find(item => item.classIndex === entry.classId && [item.index, item.name].some(text => normalizedSubclassKey(text) === key))?.index || "";
}

function optionalRule(id, source = character) {
  return (source.optionalRules || OPTIONAL_RULE_DEFAULTS)[id] ?? OPTIONAL_RULE_DEFAULTS[id];
}

function primarySubclassKey() {
  return subclassIndexFor(classEntries()[0]) || character.subclassName;
}

// Levels in one class, 0 if the character has none.
function classLevel(classId, source = character) {
  return classEntries(source).filter(entry => entry.classId === classId).reduce((sum, entry) => sum + entry.level, 0);
}

// Levels in the class that has this subclass, 0 if no class entry has it. Pass several slugs to check any of them.
function subclassLevel(...indexes) {
  return classEntries().filter(entry => indexes.includes(subclassIndexFor(entry))).reduce((sum, entry) => sum + entry.level, 0);
}

// The class definition for any class entry, with subclass casting (Eldritch Knight and similar) applied.
function entryClass(entry) {
  if (entry.key === "primary") return currentClass();
  const cls = editionClass(getClasses()[entry.classId] || missingClass(entry.classId), entry.rules);
  const casting = cls.casterType === "none" ? lookupBySubclass(SUBCLASS_CASTING, subclassIndexFor(entry) || entry.subclassName) : null;
  return casting ? { ...cls, ...casting } : cls;
}

function classLabel(source = character) {
  const entries = classEntries(source);
  const name = id => getClasses()[id]?.name || id;
  if (entries.length === 1) return `${name(source.classId)} ${source.level || 1}`;
  return entries.map(entry => `${name(entry.classId)} ${entry.level}`).join(" / ");
}

// PHB p.164: add full caster levels, half of paladin/ranger levels, a third of EK/AT levels (artificer rounds up).
const MULTICLASS_CASTER_SHARE = {
  full: level => level,
  halfRoundDown: level => Math.floor(level / 2),
  halfRoundUp: level => Math.ceil(level / 2),
  third: level => Math.floor(level / 3)
};

// Only classes that already have the Spellcasting feature count (paladin/ranger from 2nd, EK/AT from 3rd; PHB p.164).
function slotCasterEntries() {
  return classEntries().map(entry => ({ entry, cls: entryClass(entry) }))
    .filter(({ cls, entry }) => MULTICLASS_CASTER_SHARE[cls.casterType] && spellSlotsFor(cls, entry.level).some(Boolean));
}

// Pact Magic fills the slot grid unless the character also has Spellcasting slots; then it's tracked as a resource.
function slotsArePact() {
  if (!character.multiclasses?.length) return isPactCaster();
  return !slotCasterEntries().length && classEntries().some(entry => isPactCaster(entryClass(entry)));
}

function characterSpellSlots() {
  if (!character.multiclasses?.length) return spellSlotsFor(currentClass(), character.level);
  const casters = slotCasterEntries();
  if (!casters.length) return pactSlotsFor();
  if (casters.length === 1) return spellSlotsFor(casters[0].cls, casters[0].entry.level);
  const casterLevel = casters.reduce((sum, { cls, entry }) => sum + MULTICLASS_CASTER_SHARE[cls.casterType](entry.level), 0);
  return FULL_CASTER_SLOTS[casterLevel] || [];
}

// Pact slots used to be a sidebar resource next to Spellcasting slots; they are now a spendable pool (pactSlotPool).
function multiclassPactTracker() {
  return null;
}

// Pact Magic from warlock + Profane Soul: warlock level + a third of blood hunter levels (rounded down) on the warlock table.
// Custom half pact casters add half their levels (rounded down).
function pactSlotsFor() {
  const pacts = classEntries().map(entry => ({ entry, cls: entryClass(entry) })).filter(({ cls }) => isPactCaster(cls));
  if (!pacts.length) return [];
  if (pacts.length === 1) return spellSlotsFor(pacts[0].cls, pacts[0].entry.level);
  const share = { pactHalf: 2, pactThird: 3 };
  const level = pacts.reduce((sum, { cls, entry }) => sum + Math.floor(entry.level / (share[cls.casterType] || 1)), 0);
  return spellSlotsFor(BUILT_IN_CLASSES.warlock, Math.min(20, level));
}

// Pact Magic slots beside a Spellcasting slot grid (multiclass): their own pool, spendable on any of your spells
// and recharged by a short rest (PHB p.164). Usage lives in character.pactSlotUsage.
function pactSlotPool() {
  if (!character.multiclasses?.length || slotsArePact()) return null;
  const slots = pactSlotsFor();
  if (!slots.length) return null;
  const max = slots[slots.length - 1];
  return { level: slots.length, max, left: Math.max(0, max - Number(character.pactSlotUsage || 0)) };
}

function knownSpellCap(cls = currentClass(), level = character.level) {
  const table = cls.knownTable || KNOWN_SPELLS[cls.id];
  if (table) return table[level - 1] || 0;
  // A custom "known spells" class counts its table's new-spell column.
  return cls.preparedFormula === "known" && !BUILT_IN_CLASSES[cls.id] && cls.table ? cls.table.slice(0, level).reduce((sum, row) => sum + Number(row.newSpells || 0), 0) : null;
}

function spellSlotsFor(cls, level = character.level) {
  if (cls.casterType === "none") return [];
  if (isPactCaster(cls)) {
    // Profane Soul Spellcasting table: 1 slot at 3rd-5th, 2 from 6th; slot level 1st/2nd/3rd/4th at 3/7/13/19.
    // Custom half pact casters use the warlock row for half their level (rounded up), from 2nd level.
    const pact = cls.casterType === "pactThird"
      ? (level < 3 ? null : { slots: level >= 6 ? 2 : 1, level: level >= 19 ? 4 : level >= 13 ? 3 : level >= 7 ? 2 : 1 })
      : cls.casterType === "pactHalf" ? (level < 2 ? null : WARLOCK_SLOTS[Math.ceil(level / 2)]) : WARLOCK_SLOTS[level];
    return pact ? Array.from({ length: pact.level }, (_, index) => index + 1 === pact.level ? pact.slots : 0) : [];
  }
  // PHB half/third casters match the full-caster table at ceil(level/2) / ceil(level/3),
  // except they get no slots before level 2 / level 3. "halfRoundUp" (artificer) has slots from level 1.
  let casterLevel = level;
  if (cls.casterType === "halfRoundDown") casterLevel = level === 1 ? 0 : Math.ceil(level / 2);
  if (cls.casterType === "halfRoundUp") casterLevel = Math.ceil(level / 2);
  if (cls.casterType === "third") casterLevel = level < 3 ? 0 : Math.ceil(level / 3);
  return FULL_CASTER_SLOTS[Math.max(0, casterLevel)] || [];
}

function maxSpellLevelFor(cls, level) {
  const slotted = spellSlotsFor(cls, level).reduce((highest, count, index) => count > 0 ? index + 1 : highest, 0);
  // Mystic Arcanum: warlocks pick a 6th/7th/8th/9th-level spell at 11/13/15/17 (custom pact classes set their own).
  const arcanum = Math.max(0, ...Object.entries(arcanumLevelsFor(cls)).filter(([gate]) => level >= Number(gate)).map(([, spellLevel]) => spellLevel));
  return Math.max(slotted, arcanum);
}

// "5d8 + 2d10": one group per hit die size across all classes.
function hitDiceText(source = character) {
  const counts = {};
  classEntries(source).forEach(entry => {
    const die = (getClasses()[entry.classId] || BUILT_IN_CLASSES.fighter).hitDie;
    counts[die] = (counts[die] || 0) + Number(entry.level || 0);
  });
  return Object.entries(counts).sort(([a], [b]) => b - a).map(([die, count]) => `${count}d${die}`).join(" + ");
}

function characterMaxSpellLevel() {
  const slotted = characterSpellSlots().reduce((highest, count, index) => count > 0 ? index + 1 : highest, 0);
  return Math.max(slotted, ...classEntries().map(entry => maxSpellLevelFor(entryClass(entry), entry.level)));
}

function asiLevelsFor(cls = currentClass()) {
  if (cls.asiLevels?.length) return new Set(cls.asiLevels);
  return new Set([...ASI_LEVELS, ...(CLASS_EXTRA_ASI_LEVELS[cls.id] || [])]);
}

function preparedLimitFor(cls, level = character.level) {
  if (cls.preparedFormula === "none") return 0;
  if (cls.preparedTable) return cls.preparedTable[level - 1] || 0;
  if (cls.preparedFormula === "known") return knownSpellCap(cls, level) ?? character.spells.filter(row => row.index).length;
  if (cls.preparedFormula === "levelPlusMod") return Math.max(1, level + mod(cls.spellAbility));
  // Artificers: INT mod + half level rounded down, min 1, from 1st level (TCE). Paladins prepare nothing before 2nd.
  if (cls.preparedFormula === "halfLevelPlusMod" && cls.id === "artificer") return Math.max(1, Math.floor(level / 2) + mod(cls.spellAbility));
  if (cls.preparedFormula === "halfLevelPlusMod") return level < 2 ? 0 : Math.max(1, Math.floor(level / 2) + mod(cls.spellAbility));
  return 0;
}

function startCustomClassDraft(existingId = "") {
  const existing = customClasses[existingId];
  classBuilderDraft = existing ? structuredCloneSafe(existing) : {
    id: "",
    name: "",
    hitDie: 8,
    casterType: "none",
    spellAbility: "int",
    preparedFormula: "none",
    spellSources: [],
    saves: [],
    armor: "",
    weapons: "",
    subclassLevel: 3,
    asiLevels: [],
    arcanumLevels: {},
    skillChoices: { count: 2, from: [] },
    multiclass: { requires: [], grants: {} },
    spellList: [],
    resources: [],
    subclasses: [],
    table: makeTable({
      1: ["Starting features", 0, 0],
      4: ["Ability score improvement", 0, 0],
      8: ["Ability score improvement", 0, 0],
      12: ["Ability score improvement", 0, 0],
      16: ["Ability score improvement", 0, 0],
      19: ["Ability score improvement", 0, 0]
    })
  };
  renderBuilder(true);
  renderClassTable();
  document.querySelector("#classBuilderDialog").showModal();
}

// Builder fields are the draft: every keystroke updates the draft and the preview table.
function readBuilderFields() {
  const saves = [document.querySelector("#builderSaveOne").value, document.querySelector("#builderSaveTwo").value].filter(Boolean);
  return {
    ...(classBuilderDraft || {}),
    name: document.querySelector("#builderName").value.trim(),
    hitDie: Number(document.querySelector("#builderHitDie").value),
    casterType: document.querySelector("#builderCasterType").value,
    spellAbility: document.querySelector("#builderSpellAbility").value,
    preparedFormula: document.querySelector("#builderPreparedFormula").value,
    spellSources: document.querySelector("#builderSpellSources").value.split(",").map(item => slug(item.trim())).filter(Boolean),
    saves: [...new Set(saves)],
    armor: document.querySelector("#builderArmor").value.trim(),
    weapons: document.querySelector("#builderWeapons").value.trim(),
    table: parseClassTable(document.querySelector("#builderTable").value),
    ...readBuilderExtras()
  };
}

// The "Resources, subclasses and multiclassing" fold of the class builder (J25, J27).
function readBuilderExtras() {
  const value = id => document.querySelector(`#${id}`)?.value || "";
  const levels = text => [...new Set(String(text).split(",").map(item => Number(item.trim())).filter(level => Number.isInteger(level) && level >= 1 && level <= 20))].sort((a, b) => a - b);
  const abilityId = text => ABILITIES.find(([id, label]) => [id, label.toLowerCase()].includes(String(text).trim().toLowerCase()))?.[0];
  const skillId = text => SKILLS.find(([id, label]) => [id.toLowerCase(), label.toLowerCase()].includes(String(text).trim().toLowerCase()))?.[0];
  const skillFrom = value("builderSkillFrom").trim();
  // A blank field keeps the default (two skills, like most classes), never zero.
  const skillCount = value("builderSkillCount").trim();
  return {
    subclassLevel: clamp(Math.round(Number(value("builderSubclassLevel")) || 3), 1, 20),
    asiLevels: levels(value("builderAsiLevels")),
    arcanumLevels: Object.fromEntries(value("builderArcanum").split(",").map(pair => pair.split(":").map(item => Number(item.trim())))
      .filter(([gate, spellLevel]) => gate >= 1 && gate <= 20 && spellLevel >= 1 && spellLevel <= 9)),
    skillChoices: {
      count: skillCount && Number.isFinite(Number(skillCount)) ? clamp(Math.round(Number(skillCount)), 0, 6) : 2,
      from: /^any$/i.test(skillFrom) ? "any" : skillFrom.split(",").map(skillId).filter(Boolean)
    },
    multiclass: {
      // "str/dex, cha": 13 in STR or DEX, and 13 in CHA (PHB p.163).
      requires: value("builderMcRequires").split(",").map(group => group.split(/\/|\bor\b/i).map(abilityId).filter(Boolean)).filter(group => group.length),
      grants: Object.fromEntries([["armor", value("builderMcArmor")], ["weapons", value("builderMcWeapons")], ["tools", value("builderMcTools")], ["skills", Number(value("builderMcSkills")) || 0]]
        .map(([key, item]) => [key, typeof item === "string" ? item.trim() : clamp(item, 0, 6)]).filter(([, item]) => item))
    },
    spellList: value("builderSpellList").split(",").map(spellIndexFromText).filter(Boolean),
    resources: value("builderResources").split("\n").map(parseResourceLine).filter(Boolean),
    subclasses: parseSubclassText(value("builderSubclasses"))
  };
}

// "shield", "Shield" or "custom-moon-bolt" -> the spell's index.
function spellIndexFromText(text) {
  const name = String(text || "").trim();
  if (!name) return "";
  return allSpells.find(spell => spell.index === slug(name) || spell.name.toLowerCase() === name.toLowerCase())?.index || slug(name);
}

// "Hex Points | level/2 | short | d6": name | uses | short or long | optional die.
function parseResourceLine(line) {
  const [name, max, reset, die] = String(line).split("|").map(part => part.trim());
  if (!name) return null;
  const table = String(max || "").split(",").map(Number);
  const uses = table.length === 20 && table.every(Number.isFinite) ? table
    : ["level", "level/2", "prof"].includes(max) || /^mod:(str|dex|con|int|wis|cha)$/.test(max) ? max : clamp(Math.round(Number(max) || 1), 0, 99);
  const sides = Number(String(die || "").replace(/^d/i, ""));
  return { name: name.slice(0, 60), max: uses, reset: /^short/i.test(reset || "") ? "short" : "long", ...([4, 6, 8, 10, 12].includes(sides) ? { die: sides } : {}) };
}

function resourceLineText(item) {
  return [item.name, Array.isArray(item.max) ? item.max.join(",") : item.max, item.reset, item.die ? `d${item.die}` : ""].filter(Boolean).join(" | ");
}

// Subclass block: "Subclass: Name", then "3: Feature: text", "Spells 3: a, b", "Resource: name | uses | reset | die",
// "Armor: ...", "Weapons: ...".
function parseSubclassText(text) {
  const subclasses = [];
  String(text).split("\n").map(line => line.trim()).filter(Boolean).forEach(line => {
    const head = line.match(/^subclass:\s*(.+)$/i);
    if (head) {
      subclasses.push({ name: head[1].slice(0, 80), features: [], spells: {}, resources: [], armor: "", weapons: "" });
      return;
    }
    const sub = subclasses[subclasses.length - 1];
    if (!sub) return;
    const spells = line.match(/^spells\s+(\d+):\s*(.+)$/i);
    const field = line.match(/^(resource|armor|weapons):\s*(.+)$/i);
    const feature = line.match(/^(\d+):\s*([^:]+?)(?::\s*(.*))?$/);
    if (spells) sub.spells[clamp(Number(spells[1]), 1, 20)] = spells[2].split(",").map(spellIndexFromText).filter(Boolean);
    else if (field && /resource/i.test(field[1])) sub.resources.push(parseResourceLine(field[2]));
    else if (field) sub[field[1].toLowerCase()] = field[2];
    else if (feature) sub.features.push([clamp(Number(feature[1]), 1, 20), feature[2].slice(0, 80), (feature[3] || "").slice(0, 600)]);
  });
  return subclasses.map(sub => ({ ...sub, resources: sub.resources.filter(Boolean) }));
}

function subclassText(subclasses = []) {
  return subclasses.map(sub => [
    `Subclass: ${sub.name}`,
    ...(sub.features || []).map(([level, name, text]) => `${level}: ${name}${text ? `: ${text}` : ""}`),
    ...Object.entries(sub.spells || {}).map(([level, list]) => `Spells ${level}: ${list.join(", ")}`),
    ...(sub.resources || []).map(item => `Resource: ${resourceLineText(item)}`),
    sub.armor ? `Armor: ${sub.armor}` : "",
    sub.weapons ? `Weapons: ${sub.weapons}` : ""
  ].filter(Boolean).join("\n")).join("\n\n");
}

function handleBuilderInput() {
  classBuilderDraft = readBuilderFields();
  renderClassTable();
}

function renderBuilder(force = false) {
  // Never overwrite what someone is typing in an open builder (a background re-render used to wipe it).
  if (!force && document.querySelector("#classBuilderDialog")?.open) return;
  const cls = classBuilderDraft || currentClass();
  const abilityOptions = [["", "None"], ...ABILITIES];
  fillSelect(document.querySelector("#builderSaveOne"), abilityOptions);
  fillSelect(document.querySelector("#builderSaveTwo"), abilityOptions);
  const write = (id, value) => {
    const field = document.querySelector(`#${id}`);
    if (field) field.value = value;
  };
  write("builderName", cls.name);
  write("builderHitDie", String(cls.hitDie));
  write("builderCasterType", cls.casterType);
  write("builderSpellAbility", cls.spellAbility || "int");
  write("builderPreparedFormula", cls.preparedFormula || "none");
  write("builderSpellSources", (cls.spellSources || []).join(", "));
  const saves = cls.saves || CLASS_SAVES[cls.id] || [];
  write("builderSaveOne", saves[0] || "");
  write("builderSaveTwo", saves[1] || "");
  write("builderArmor", cls.armor ?? CLASS_PROFICIENCIES[cls.id]?.[0] ?? "");
  write("builderWeapons", cls.weapons ?? CLASS_PROFICIENCIES[cls.id]?.[1] ?? "");
  write("builderTable", cls.table.map(row => `${row.level}, ${row.features || ""}, ${row.newSpells || 0}, ${row.cantrips || 0}`).join("\n"));
  const grants = cls.multiclass?.grants || {};
  write("builderSubclassLevel", String(cls.subclassLevel || SUBCLASS_LEVEL[cls.id] || 3));
  write("builderAsiLevels", (cls.asiLevels || []).join(", "));
  write("builderArcanum", Object.entries(cls.arcanumLevels || {}).map(([gate, spellLevel]) => `${gate}:${spellLevel}`).join(", "));
  write("builderSkillCount", String(cls.skillChoices?.count ?? 2));
  write("builderSkillFrom", cls.skillChoices?.from === "any" ? "any" : (cls.skillChoices?.from || []).map(id => SKILLS.find(([skill]) => skill === id)?.[1] || id).join(", "));
  write("builderMcRequires", (cls.multiclass?.requires || []).map(group => group.join("/")).join(", "));
  write("builderMcArmor", grants.armor || "");
  write("builderMcWeapons", grants.weapons || "");
  write("builderMcTools", grants.tools || "");
  write("builderMcSkills", String(grants.skills || 0));
  write("builderSpellList", (cls.spellList || []).join(", "));
  write("builderResources", (cls.resources || []).map(resourceLineText).join("\n"));
  write("builderSubclasses", subclassText(cls.subclasses));
  const editSelect = document.querySelector("#editCustomClassSelect");
  const customs = Object.values(customClasses);
  editSelect.innerHTML = `<option value="">Edit existing…</option>` + customs.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join("");
  editSelect.hidden = !customs.length;
}

function classTableHtml(cls) {
  const caster = cls.casterType !== "none";
  const rows = cls.table.map(row => {
    const slots = spellSlotsFor(cls, row.level);
    return `<tr class="${row.level === character.level ? "current" : ""}">
      <td>${Number(row.level)}</td>
      <td>${escapeHtml(row.features || "-")}</td>
      ${caster ? `<td>${Number(row.newSpells) || "-"}</td><td>${Number(row.cantrips) || "-"}</td><td>${slots.some(Boolean) ? slots.join(" / ") : "-"}</td><td>${preparedLimitFor(cls, row.level) || "-"}</td>` : ""}
    </tr>`;
  }).join("");
  return `
    <table>
      <thead><tr><th>Level</th><th>Features</th>${caster ? "<th>New spells</th><th>Cantrips</th><th>Slots</th><th>Prepared</th>" : ""}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderClassTable() {
  if (document.querySelector("#classBuilderDialog")?.open) {
    document.querySelector("#classTable").innerHTML = classTableHtml(classBuilderDraft || currentClass());
  }
  const cls = currentClass();
  document.querySelector("#builderTabClassTable").innerHTML = classTableHtml(cls);
  document.querySelector("#editCurrentClass").hidden = !customClasses[cls.id];
}

function saveCustomClass() {
  const fields = readBuilderFields();
  if (!fields.name) {
    showToast(`<span class="toast-label">Give the class a name first</span>`);
    return;
  }
  // New classes get "custom-<name>" ids (-2, -3... on collision), so they never replace a built-in or another homebrew.
  const id = fields.id && customClasses[fields.id] ? fields.id : uniqueCustomId(fields.name, { ...BUILT_IN_CLASSES, ...customClasses });
  // Subclass ids are "<class id>-<name>", so a character's pick survives edits that keep the name.
  const subclasses = (fields.subclasses || []).map(sub => ({ ...sub, id: `${id}-${slug(sub.name)}`.slice(0, 64) }));
  customClasses[id] = { ...fields, subclasses, id };
  saveCustomClasses();
  saveClassToCloud(customClasses[id]);
  const creating = creationDraft && document.querySelector("#createDialog").open;
  if (creating) {
    creationDraft.classId = id;
  } else {
    creationDraft = null;
    character.classId = id;
  }
  classBuilderDraft = null;
  const dialog = document.querySelector("#classBuilderDialog");
  if (dialog.open) dialog.close();
  if (creating) renderCreateStep();
  persistAndRender();
}

function parseClassTable(text) {
  const rows = {};
  text.split("\n").forEach(line => {
    // "level, features, new spells, cantrips": only the first and last two commas are separators.
    const parts = line.split(",").map(part => part.trim());
    const number = Number(parts[0]);
    const rest = parts.slice(1);
    const numbers = [];
    while (rest.length > 1 && numbers.length < 2 && /^\d+$/.test(rest[rest.length - 1])) numbers.unshift(Number(rest.pop()));
    while (numbers.length < 2) numbers.push(0);
    if (number >= 1 && number <= 20) rows[number] = [rest.join(", "), numbers[0], numbers[1]];
  });
  return makeTable(rows);
}

function renderOfficialSubclassControls() {
  const select = document.querySelector("#officialSubclassSelect");
  const detail = document.querySelector("#officialSubclassDetail");
  const isOfficial = character.subclass.mode === "official";
  const matching = officialSubclasses.filter(item => item.classIndex === character.classId);
  select.innerHTML = `<option value="">${matching.length ? "Choose a subclass..." : `No official ${escapeHtml(currentClass().name)} subclasses`}</option>` + matching
    .map(item => `<option value="${escapeHtml(item.index)}">${escapeHtml(item.name)}${item.source ? ` (${escapeHtml(item.source)})` : ""}</option>`)
    .join("");
  select.disabled = !matching.length;
  select.value = matching.some(item => item.index === character.subclass.officialIndex) ? character.subclass.officialIndex : "";
  detail.classList.toggle("is-empty", !isOfficial);
  if (!isOfficial) {
    detail.innerHTML = `<p class="muted">Custom mode lets you type any subclass name and track its features in the sections below.</p>`;
    return;
  }
  const official = officialSubclasses.find(item => item.index === character.subclass.officialIndex);
  detail.innerHTML = official
    ? `<div><span>Class</span><strong>${escapeHtml(official.className)}</strong></div>
      <div><span>Subclass type</span><strong>${escapeHtml(official.flavor || "Subclass")}</strong></div>
      <p class="muted">Its features are listed under Class features above, up to your ${escapeHtml(official.className)} level.</p>`
    : `<p class="muted">Choose a ${escapeHtml(currentClass().name)} subclass from the list.</p>`;
}

function applyOfficialSubclass(index, render = true) {
  character.subclass.officialIndex = index || "";
  if (index) character.subclass.mode = "official";
  const official = officialSubclasses.find(item => item.index === index);
  if (official) {
    character.subclassName = official.name;
    character.subclass.type = official.flavor || character.subclass.type;
    applySubclassExtras();
  }
  if (render) persistAndRender();
}

function mergeList(existing, additions) {
  const items = String(existing || "").split(",").map(item => item.trim()).filter(Boolean);
  // "Medium armor, shields" counts as two items, so applying it twice adds nothing.
  additions.flatMap(item => String(item).split(",")).map(item => item.trim()).filter(Boolean).forEach(item => {
    if (!items.some(current => current.toLowerCase() === item.toLowerCase())) items.push(item);
  });
  return items.join(", ");
}

// Subclass grants for any class entry (primary or multiclass): armor, weapons, tools, languages, fixed skills,
// saves gained at a class level, and cantrips. Choices the player still makes become feature reminders.
// Safe to call again: nothing is added twice.
function applySubclassExtras(entry = classEntries()[0]) {
  const key = subclassIndexFor(entry) || entry.subclassName;
  const extras = key ? lookupBySubclass(SUBCLASS_EXTRAS, key) || {} : {};
  if (extras.classId && extras.classId !== entry.classId) return;
  const name = entry.subclassName || key;
  const reminders = [];
  ["armor", "weapons", "tools", "languages"].forEach(field => {
    const fixed = (extras[field] || []).filter(item => !/choice|\bor\b|^one\b|kensei weapons|at \d+th/i.test(item));
    if (fixed.length) character.backgroundDetails[field] = mergeList(character.backgroundDetails[field], fixed);
    (extras[field] || []).filter(item => !fixed.includes(item)).forEach(item => reminders.push(item));
  });
  (extras.skills || []).forEach(text => {
    const skill = SKILLS.find(([id, label]) => id === text || label.toLowerCase() === String(text).toLowerCase())?.[0];
    if (!skill) reminders.push(text);
    else if (!character.proficientSkills.includes(skill)) character.proficientSkills.push(skill);
  });
  reminders.push(...(extras.choices || []));
  (extras.saves || []).forEach(([level, ability, fallback]) => {
    const marker = `${name}: ${ability.toUpperCase()} save proficiency`;
    if (entry.level < level || String(character.features || "").includes(marker)) return;
    if (character.saveProficiencies.includes(ability)) reminders.push(`${ability.toUpperCase()} save proficiency (already proficient: take ${fallback.toUpperCase()} instead)`);
    else {
      character.saveProficiencies.push(ability);
      character.features = mergeLines(character.features, [marker]);
    }
  });
  if (reminders.length) character.features = mergeLines(character.features, reminders.map(text => `${name} choice: ${text}`));
}

// "Level N: ..." feature lines always match the current class and level.
function rebuildClassFeatureLines(cls = currentClass(), level = character.level) {
  const kept = String(character.features || "").split("\n").filter(line => line && !/^Level \d+: /.test(line));
  const lines = cls.table.slice(0, level).filter(row => row.features).map(row => `Level ${row.level}: ${row.features}`);
  character.features = [...kept, ...lines].join("\n");
}

function applySubclassTemplate(templateId) {
  const template = SUBCLASS_TEMPLATES[templateId];
  if (!template) return;
  const existingTitles = new Set(character.subclass.sections.map(section => section.title.toLowerCase()));
  template.forEach(([title, body]) => {
    if (!existingTitles.has(title.toLowerCase())) {
      character.subclass.sections.push({ id: crypto.randomUUID(), title, body });
    }
  });
  persist();
}
