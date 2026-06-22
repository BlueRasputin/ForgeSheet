const API_BASE = "https://www.dnd5eapi.co/api/2014";
const STORAGE_KEY = "forgesheet.character.v1";
const CHARACTER_LIBRARY_KEY = "forgesheet.characters.v1";
const CUSTOM_CLASS_KEY = "forgesheet.classes.v1";
const SYNC_CONFIG_KEY = "forgesheet.sync.v1";
const THEME_KEY = "forgesheet.theme.v1";
const CUSTOM_SPELL_VALUE = "__custom_spell__";
const PDFJS_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs";
const PDFJS_WORKER_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";
const FIREBASE_APP_URL = "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
const FIREBASE_FIRESTORE_URL = "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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
  "acid-splash", "cure-wounds", "detect-magic", "disguise-self", "expeditious-retreat",
  "faerie-fire", "false-life", "feather-fall", "grease", "identify", "jump", "longstrider",
  "sanctuary", "arcane-lock", "blur", "continual-flame", "darkvision", "enhance-ability",
  "enlarge-reduce", "invisibility", "lesser-restoration", "levitate", "magic-mouth",
  "magic-weapon", "protection-from-poison", "rope-trick", "see-invisibility", "spider-climb",
  "web", "blink", "dispel-magic", "fly", "gaseous-form", "glyph-of-warding", "haste",
  "protection-from-energy", "revivify", "water-breathing", "water-walk", "arcane-eye",
  "fabricate", "freedom-of-movement", "greater-invisibility", "stone-shape", "stoneskin",
  "animate-objects", "bigbys-hand", "creation", "greater-restoration", "skill-empowerment",
  "wall-of-stone", "mending", "message", "prestidigitation", "ray-of-frost", "shocking-grasp"
]);

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
      2: ["Infusions", 0, 0],
      3: ["Specialist feature, tool expertise", 0, 0],
      4: ["Ability score improvement", 0, 0],
      5: ["Specialist feature", 0, 0],
      6: ["Tool expertise improvement", 0, 0],
      7: ["Flash of genius", 0, 0],
      8: ["Ability score improvement", 0, 0],
      9: ["Specialist feature", 0, 0],
      10: ["Magic item adept", 0, 1],
      11: ["Spell-storing item", 0, 0],
      12: ["Ability score improvement", 0, 0],
      13: ["Feature improvement", 0, 0],
      14: ["Magic item savant", 0, 0],
      15: ["Specialist feature", 0, 0],
      16: ["Ability score improvement", 0, 0],
      17: ["Feature improvement", 0, 0],
      18: ["Magic item master", 0, 0],
      19: ["Ability score improvement", 0, 0],
      20: ["Capstone feature", 0, 0]
    })
  },
  wizard: classDef("wizard", "Wizard", 6, "full", "int", "levelPlusMod", ["wizard"], 2, 3),
  cleric: classDef("cleric", "Cleric", 8, "full", "wis", "levelPlusMod", ["cleric"], 0, 0),
  druid: classDef("druid", "Druid", 8, "full", "wis", "levelPlusMod", ["druid"], 0, 0),
  bard: classDef("bard", "Bard", 8, "full", "cha", "known", ["bard"], 1, 4),
  sorcerer: classDef("sorcerer", "Sorcerer", 6, "full", "cha", "known", ["sorcerer"], 1, 2),
  warlock: classDef("warlock", "Warlock", 8, "warlock", "cha", "known", ["warlock"], 1, 2),
  paladin: classDef("paladin", "Paladin", 10, "halfRoundDown", "cha", "halfLevelPlusMod", ["paladin"], 0, 0),
  ranger: classDef("ranger", "Ranger", 10, "halfRoundDown", "wis", "known", ["ranger"], 1, 0)
};

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

let allSpells = FALLBACK_SPELLS;
let spellDetails = {};
let officialSubclasses = OFFICIAL_SUBCLASS_FALLBACK;
let subclassApiStatus = "fallback";
let customClasses = loadCustomClasses();
let character = loadCharacter();
let characterLibrary = loadCharacterLibrary();
let pendingLevelChoices = [];
let pendingImport = null;
let syncSettings = loadSyncSettings();
let syncState = {
  connected: false,
  db: null,
  firestore: null,
  unsubscribers: [],
  uploadTimer: null,
  lastSummary: null,
  applyingRemote: false
};

document.addEventListener("DOMContentLoaded", init);

function init() {
  document.body.dataset.theme = localStorage.getItem(THEME_KEY) || "light";
  ensureCharacterInLibrary();
  buildStaticControls();
  bindEvents();
  renderAll();
  hydrateSubclasses();
  hydrateSpells();
}

function classDef(id, name, hitDie, casterType, spellAbility, preparedFormula, spellSources, learnedPerLevel, startingSpells) {
  return {
    id, name, hitDie, casterType, spellAbility, preparedFormula, spellSources,
    table: makeTable(Object.fromEntries(Array.from({ length: 20 }, (_, index) => {
      const level = index + 1;
      const features = level % 4 === 0 ? "Ability score improvement" : level === 1 ? "Spellcasting" : "";
      const newSpells = level === 1 ? startingSpells : learnedPerLevel;
      return [level, [features, newSpells, level === 1 ? 3 : 0]];
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

function spell(index, name, level, classes) {
  return { index, name, level, classes };
}

function officialSubclass(index, name, classIndex, className, flavor, desc = []) {
  return { index, name, classIndex, className, flavor, desc };
}

function defaultCharacter() {
  return {
    name: "New Character",
    sheetId: crypto.randomUUID(),
    classId: "artificer",
    subclassName: "Armorer",
    subclass: {
      mode: "custom",
      officialIndex: "",
      type: "Specialist",
      sections: [
        { id: crypto.randomUUID(), title: "Guardian Armor", body: "" },
        { id: crypto.randomUUID(), title: "Infiltrator Armor", body: "" },
        { id: crypto.randomUUID(), title: "Third Armor Form", body: "" }
      ]
    },
    level: 1,
    species: "",
    background: "",
    alignment: "",
    hp: 10,
    maxHp: 10,
    ac: 15,
    speed: 30,
    hitDice: "1d8",
    deathSaves: "",
    attacks: "",
    features: "",
    inventory: "",
    notes: "",
    noteSections: [],
    resources: [
      { id: crypto.randomUUID(), name: "Infusions", current: 2, max: 2, reset: "long" }
    ],
    conditions: [],
    exhaustion: 0,
    actions: [],
    spellSlotUsage: {},
    abilities: { str: 10, dex: 14, con: 14, int: 16, wis: 12, cha: 10 },
    proficientSkills: ["arcana", "investigation"],
    spells: [
      { id: crypto.randomUUID(), index: "mending", prepared: true },
      { id: crypto.randomUUID(), index: "cure-wounds", prepared: true },
      { id: crypto.randomUUID(), index: "", level: 1, prepared: false }
    ]
  };
}

function getClasses() {
  return { ...BUILT_IN_CLASSES, ...customClasses };
}

function currentClass() {
  return getClasses()[character.classId] || BUILT_IN_CLASSES.artificer;
}

function buildStaticControls() {
  const casterOptions = [
    ["none", "None"],
    ["full", "Full caster"],
    ["halfRoundDown", "Half caster"],
    ["halfRoundUp", "Half caster, rounded up"],
    ["third", "Third caster"],
    ["warlock", "Pact magic"]
  ];
  fillSelect(document.querySelector("#builderCasterType"), casterOptions);
  fillSelect(document.querySelector("#builderSpellAbility"), ABILITIES);
  fillSelect(document.querySelector("#builderPreparedFormula"), [
    ["none", "None"],
    ["known", "Known spells"],
    ["levelPlusMod", "Level + ability modifier"],
    ["halfLevelPlusMod", "Half level + ability modifier"]
  ]);

  const abilities = document.querySelector("#abilities");
  abilities.innerHTML = ABILITIES.map(([id, name]) => `
    <div class="ability-card">
      <label>${name}<input data-ability="${id}" type="number" min="1" max="30"></label>
      <strong id="${id}Mod">+0</strong>
    </div>
  `).join("");

  const skills = document.querySelector("#skills");
  skills.innerHTML = SKILLS.map(([id, name]) => `
    <label class="skill-row">
      <input data-skill="${id}" type="checkbox">
      <span>${name}</span>
      <strong id="${id}Skill">+0</strong>
    </label>
  `).join("");
}

function bindEvents() {
  document.querySelectorAll(".tab").forEach(button => {
    button.addEventListener("click", () => activateTab(button.dataset.tab));
  });

  const watched = [
    "characterName", "classSelect", "subclassName", "levelInput", "speciesInput", "backgroundInput", "alignmentInput",
    "hpInput", "maxHpInput", "acInput", "speedInput", "hitDiceInput", "deathSavesInput", "attacksInput",
    "featuresInput", "inventoryInput", "notesInput", "subclassMode", "officialSubclassSelect",
    "subclassType", "subclassTemplate", "showAllSpells", "exhaustionInput", "sheetSearch"
  ];
  watched.forEach(id => document.querySelector(`#${id}`).addEventListener("input", handleInput));

  document.querySelectorAll("[data-ability]").forEach(input => input.addEventListener("input", handleAbilityInput));
  document.querySelectorAll("[data-skill]").forEach(input => input.addEventListener("input", handleSkillInput));
  document.querySelector("#spellRows").addEventListener("click", event => {
    const button = event.target.closest("[data-add-spell-level]");
    if (!button) return;
    const level = Number(button.dataset.addSpellLevel);
    character.spells.push({ id: crypto.randomUUID(), index: "", level, prepared: level > 0 });
    persistAndRender();
  });
  document.querySelector("#slotGrid").addEventListener("click", handleSlotUsageClick);
  document.querySelector("#saveCharacter").addEventListener("click", persistAndRender);
  document.querySelector("#resetCharacter").addEventListener("click", resetCharacter);
  document.querySelector("#newCharacterButton").addEventListener("click", createNewCharacter);
  document.querySelector("#duplicateCharacterButton").addEventListener("click", duplicateCharacter);
  document.querySelector("#deleteCharacterButton").addEventListener("click", deleteCharacter);
  document.querySelector("#characterLibrarySelect").addEventListener("change", switchCharacter);
  document.querySelector("#exportJsonButton").addEventListener("click", exportCharacterJson);
  document.querySelector("#importJsonButton").addEventListener("click", () => document.querySelector("#jsonImportInput").click());
  document.querySelector("#jsonImportInput").addEventListener("change", importCharacterJson);
  document.querySelector("#toggleTheme").addEventListener("click", toggleTheme);
  document.querySelector("#importSheetButton").addEventListener("click", openImportDialog);
  document.querySelector("#sheetImportPdf").addEventListener("change", handlePdfImport);
  document.querySelector("#parseSheetImport").addEventListener("click", parseImportDialogText);
  document.querySelector("#applySheetImport").addEventListener("click", applyPendingImport);
  document.querySelector("#levelUpButton").addEventListener("click", openLevelDialog);
  document.querySelector("#confirmLevelUp").addEventListener("click", applyLevelUp);
  document.querySelector("#saveClass").addEventListener("click", saveCustomClass);
  document.querySelector("#shortRestButton").addEventListener("click", () => takeRest("short"));
  document.querySelector("#longRestButton").addEventListener("click", () => takeRest("long"));
  document.querySelector("#addResourceButton").addEventListener("click", addResource);
  document.querySelector("#resourceRows").addEventListener("input", handleResourceInput);
  document.querySelector("#resourceRows").addEventListener("click", handleResourceClick);
  document.querySelector("#conditionGrid").addEventListener("click", handleConditionClick);
  document.querySelector("#addActionButton").addEventListener("click", addAction);
  document.querySelector("#actionRows").addEventListener("input", handleActionInput);
  document.querySelector("#actionRows").addEventListener("click", handleActionClick);
  document.querySelector("#connectSync").addEventListener("click", connectCampaignSync);
  document.querySelector("#disconnectSync").addEventListener("click", disconnectCampaignSync);
  document.querySelector("#copyPlayerLink").addEventListener("click", () => copySyncLink("player"));
  document.querySelector("#copyDmLink").addEventListener("click", () => copySyncLink("dm"));
  ["syncRole", "syncCampaignId", "syncPlayerName", "syncSheetId", "syncFirebaseConfig"].forEach(id => {
    document.querySelector(`#${id}`).addEventListener("input", handleSyncSettingsInput);
  });
  document.querySelector("#addSubclassSection").addEventListener("click", () => addNoteSection("subclass"));
  document.querySelector("#addGeneralNoteSection").addEventListener("click", () => addNoteSection("general"));
  document.querySelector("#subclassSections").addEventListener("input", event => handleNoteSectionInput(event, "subclass"));
  document.querySelector("#subclassSections").addEventListener("click", event => handleNoteSectionClick(event, "subclass"));
  document.querySelector("#generalNoteSections").addEventListener("input", event => handleNoteSectionInput(event, "general"));
  document.querySelector("#generalNoteSections").addEventListener("click", event => handleNoteSectionClick(event, "general"));
}

function activateTab(tab) {
  document.querySelectorAll(".tab").forEach(button => button.classList.toggle("active", button.dataset.tab === tab));
  document.querySelectorAll(".panel").forEach(panel => panel.classList.toggle("active", panel.id === tab));
}

function handleInput(event) {
  const id = event.target.id;
  const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
  const map = {
    characterName: "name", classSelect: "classId", subclassName: "subclassName", levelInput: "level", speciesInput: "species",
    backgroundInput: "background", alignmentInput: "alignment", hpInput: "hp", acInput: "ac",
    maxHpInput: "maxHp", speedInput: "speed", hitDiceInput: "hitDice", deathSavesInput: "deathSaves", attacksInput: "attacks",
    featuresInput: "features", inventoryInput: "inventory", notesInput: "notes"
  };
  if (map[id]) {
    character[map[id]] = ["level", "hp", "maxHp", "ac", "speed"].includes(map[id]) ? clamp(Number(value), 1, map[id] === "level" ? 20 : 999) : value;
    if (id === "classSelect") {
      const cls = currentClass();
      character.hitDice = `${character.level}d${cls.hitDie}`;
      const official = officialSubclasses.find(item => item.index === character.subclass.officialIndex);
      if (character.subclass.mode === "official" && official && official.classIndex !== character.classId) {
        character.subclass.officialIndex = "";
        character.subclassName = "";
      }
    }
    persist();
  }
  if (id === "subclassType") {
    character.subclass.type = value;
    persist();
  }
  if (id === "subclassMode") {
    character.subclass.mode = value;
    if (value === "official") applyOfficialSubclass(character.subclass.officialIndex);
    persist();
  }
  if (id === "officialSubclassSelect") {
    applyOfficialSubclass(value);
  }
  if (id === "subclassTemplate" && value) {
    applySubclassTemplate(value);
    event.target.value = "";
  }
  if (id === "exhaustionInput") {
    character.exhaustion = clamp(Number(value), 0, 6);
    persist();
  }
  renderAll();
}

function handleAbilityInput(event) {
  character.abilities[event.target.dataset.ability] = clamp(Number(event.target.value), 1, 30);
  persistAndRender();
}

function handleSkillInput(event) {
  const skill = event.target.dataset.skill;
  character.proficientSkills = character.proficientSkills.filter(item => item !== skill);
  if (event.target.checked) character.proficientSkills.push(skill);
  persistAndRender();
}

function renderAll() {
  renderCharacterManager();
  renderHeader();
  renderSheet();
  renderDynamicNoteSections("subclass");
  renderDynamicNoteSections("general");
  renderPlayTools();
  renderSpells();
  renderBuilder();
  renderClassTable();
  renderPartyDashboard();
  renderSearchResults();
  renderSyncPanel();
}

function renderHeader() {
  fillSelect(document.querySelector("#classSelect"), Object.values(getClasses()).map(cls => [cls.id, cls.name]));
  setValue("characterName", character.name);
  setValue("classSelect", character.classId);
  setValue("subclassName", character.subclassName);
  setValue("levelInput", character.level);
  setValue("speciesInput", character.species);
  setValue("backgroundInput", character.background);
  setValue("alignmentInput", character.alignment);
  setValue("hpInput", character.hp);
  setValue("maxHpInput", character.maxHp);
  setValue("acInput", character.ac);
  setValue("speedInput", character.speed);
  document.querySelector("#profBonus").textContent = formatMod(proficiencyBonus());
  document.querySelector("#initiativeValue").textContent = formatMod(mod("dex"));
}

function renderSheet() {
  ABILITIES.forEach(([id]) => {
    setValue(`[data-ability="${id}"]`, character.abilities[id]);
    document.querySelector(`#${id}Mod`).textContent = formatMod(mod(id));
  });
  SKILLS.forEach(([id,, ability]) => {
    document.querySelector(`[data-skill="${id}"]`).checked = character.proficientSkills.includes(id);
    const bonus = mod(ability) + (character.proficientSkills.includes(id) ? proficiencyBonus() : 0);
    document.querySelector(`#${id}Skill`).textContent = formatMod(bonus);
  });
  document.querySelector("#skillSummary").textContent = `${character.proficientSkills.length} proficient`;
  setValue("hitDiceInput", character.hitDice);
  setValue("deathSavesInput", character.deathSaves);
  setValue("attacksInput", character.attacks);
  setValue("featuresInput", character.features);
  setValue("inventoryInput", character.inventory);
  setValue("notesInput", character.notes);
  setValue("subclassMode", character.subclass.mode);
  renderOfficialSubclassControls();
  setValue("subclassType", character.subclass.type);
  setValue("subclassTemplate", "");
  setValue("exhaustionInput", character.exhaustion);
}

function renderOfficialSubclassControls() {
  const select = document.querySelector("#officialSubclassSelect");
  const detail = document.querySelector("#officialSubclassDetail");
  const isOfficial = character.subclass.mode === "official";
  const matching = officialSubclasses.filter(item => item.classIndex === character.classId);
  const options = matching.length ? matching : officialSubclasses;
  const placeholder = officialSubclasses.length
    ? matching.length ? "Choose SRD subclass..." : `No SRD ${currentClass().name} subclasses`
    : "SRD subclasses unavailable";
  select.innerHTML = `<option value="">${placeholder}</option>` + options
    .map(item => `<option value="${item.index}">${item.name}${matching.length ? "" : ` (${item.className})`}</option>`)
    .join("");
  select.disabled = !isOfficial || !officialSubclasses.length || (!matching.length && character.classId === "artificer");
  select.value = officialSubclasses.some(item => item.index === character.subclass.officialIndex)
    ? character.subclass.officialIndex
    : "";
  detail.classList.toggle("is-empty", !isOfficial);
  if (!isOfficial) {
    detail.innerHTML = `<p class="muted">Custom mode keeps subclass fields flexible for non-SRD options like Armorer.</p>`;
    return;
  }
  const official = officialSubclasses.find(item => item.index === character.subclass.officialIndex);
  if (!official) {
    const sourceNote = subclassApiStatus === "ready"
      ? "Official SRD API loaded."
      : "Using the bundled SRD fallback list while API details load.";
    const emptyMessage = matching.length
      ? `Choose an official SRD ${currentClass().name} subclass from the dropdown.`
      : `The SRD does not include an official subclass for ${currentClass().name}. Use Custom mode for non-SRD subclasses.`;
    detail.innerHTML = `<p class="muted">${sourceNote} ${emptyMessage}</p>`;
    return;
  }
  detail.innerHTML = `
    <div><span>SRD Class</span><strong>${official.className}</strong></div>
    <div><span>Subclass Type</span><strong>${official.flavor || "Subclass"}</strong></div>
    <p>${truncate((official.desc || []).join(" "), 380) || "Description will appear when API details finish loading."}</p>
  `;
  if (!(official.desc || []).length) loadOfficialSubclassDetail(official.index);
}

function applyOfficialSubclass(index) {
  character.subclass.officialIndex = index || "";
  const official = officialSubclasses.find(item => item.index === index);
  if (official) {
    character.subclassName = official.name;
    character.subclass.type = official.flavor || character.subclass.type;
    loadOfficialSubclassDetail(index);
  }
  persistAndRender();
}

function addNoteSection(kind, title = "New Section", body = "") {
  getNoteSections(kind).push({ id: crypto.randomUUID(), title, body });
  persistAndRender();
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

function renderDynamicNoteSections(kind) {
  const root = document.querySelector(kind === "subclass" ? "#subclassSections" : "#generalNoteSections");
  const template = document.querySelector("#noteSectionTemplate");
  root.innerHTML = "";
  const sections = getNoteSections(kind);
  if (!sections.length) {
    root.innerHTML = `<p class="empty-state">No custom sections yet.</p>`;
    return;
  }
  sections.forEach(section => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.dataset.sectionId = section.id;
    node.querySelector(".note-title").value = section.title;
    node.querySelector(".note-body").value = section.body;
    root.appendChild(node);
  });
}

function handleNoteSectionInput(event, kind) {
  const sectionNode = event.target.closest(".note-section");
  if (!sectionNode) return;
  const section = getNoteSections(kind).find(item => item.id === sectionNode.dataset.sectionId);
  if (!section) return;
  if (event.target.classList.contains("note-title")) section.title = event.target.value;
  if (event.target.classList.contains("note-body")) section.body = event.target.value;
  persist();
}

function handleNoteSectionClick(event, kind) {
  const button = event.target.closest(".remove-note-section");
  if (!button) return;
  const sectionNode = button.closest(".note-section");
  const sections = getNoteSections(kind);
  const index = sections.findIndex(item => item.id === sectionNode.dataset.sectionId);
  if (index >= 0) sections.splice(index, 1);
  persistAndRender();
}

function getNoteSections(kind) {
  return kind === "subclass" ? character.subclass.sections : character.noteSections;
}

function renderCharacterManager() {
  const select = document.querySelector("#characterLibrarySelect");
  const characters = Object.values(characterLibrary).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  select.innerHTML = characters.map(item => `<option value="${item.sheetId}">${escapeHtml(item.name || "Unnamed")} - ${escapeHtml(getClasses()[item.classId]?.name || "Class")} ${item.level || 1}</option>`).join("");
  select.value = character.sheetId;
  document.querySelector("#autosaveStatus").textContent = `Autosaved ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  document.querySelector("#toggleTheme").textContent = document.body.dataset.theme === "dark" ? "Light" : "Dark";
}

function ensureCharacterInLibrary() {
  characterLibrary[character.sheetId] = structuredCloneSafe(character);
  saveCharacterLibrary();
}

function createNewCharacter() {
  character = defaultCharacter();
  persistAndRender();
}

function duplicateCharacter() {
  character = { ...structuredCloneSafe(character), sheetId: crypto.randomUUID(), name: `${character.name || "Character"} Copy` };
  persistAndRender();
}

function deleteCharacter() {
  if (!confirm(`Delete ${character.name || "this character"} from the local library?`)) return;
  delete characterLibrary[character.sheetId];
  const remaining = Object.values(characterLibrary);
  character = remaining.length ? normalizeCharacter(remaining[0]) : defaultCharacter();
  persistAndRender();
}

function switchCharacter(event) {
  const next = characterLibrary[event.target.value];
  if (!next) return;
  character = normalizeCharacter(next);
  persistAndRender();
}

function exportCharacterJson() {
  const blob = new Blob([JSON.stringify({ character, characterLibrary }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${slug(character.name || "character")}-forgesheet.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function importCharacterJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const data = JSON.parse(await file.text());
  if (data.characterLibrary) {
    characterLibrary = Object.fromEntries(Object.entries(data.characterLibrary).map(([id, item]) => [id, normalizeCharacter(item)]));
  }
  if (data.character) character = normalizeCharacter(data.character);
  else if (data.name || data.classId) character = normalizeCharacter(data);
  persistAndRender();
  event.target.value = "";
}

function toggleTheme() {
  document.body.dataset.theme = document.body.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_KEY, document.body.dataset.theme);
  renderCharacterManager();
}

function renderPlayTools() {
  renderResources();
  renderConditions();
  renderActions();
}

function renderResources() {
  const root = document.querySelector("#resourceRows");
  const template = document.querySelector("#resourceRowTemplate");
  root.innerHTML = "";
  if (!character.resources.length) {
    root.innerHTML = `<p class="empty-state">No tracked resources yet.</p>`;
    return;
  }
  character.resources.forEach(resource => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.dataset.resourceId = resource.id;
    node.querySelector(".resource-name").value = resource.name;
    node.querySelector(".resource-current").value = resource.current;
    node.querySelector(".resource-max").value = resource.max;
    node.querySelector(".resource-reset").value = resource.reset;
    root.appendChild(node);
  });
}

function addResource() {
  character.resources.push({ id: crypto.randomUUID(), name: "New Resource", current: 1, max: 1, reset: "long" });
  persistAndRender();
}

function handleResourceInput(event) {
  const row = event.target.closest(".tracker-row");
  if (!row) return;
  const resource = character.resources.find(item => item.id === row.dataset.resourceId);
  if (!resource) return;
  if (event.target.classList.contains("resource-name")) resource.name = event.target.value;
  if (event.target.classList.contains("resource-current")) resource.current = clamp(Number(event.target.value), 0, 999);
  if (event.target.classList.contains("resource-max")) resource.max = clamp(Number(event.target.value), 0, 999);
  if (event.target.classList.contains("resource-reset")) resource.reset = event.target.value;
  persist();
}

function handleResourceClick(event) {
  const button = event.target.closest(".remove-resource");
  if (!button) return;
  const row = button.closest(".tracker-row");
  character.resources = character.resources.filter(item => item.id !== row.dataset.resourceId);
  persistAndRender();
}

function renderConditions() {
  const root = document.querySelector("#conditionGrid");
  const active = new Set(character.conditions || []);
  root.innerHTML = CONDITIONS.map(condition => `<button type="button" class="condition-chip ${active.has(condition) ? "active" : ""}" data-condition="${condition}">${condition}</button>`).join("");
}

function handleConditionClick(event) {
  const button = event.target.closest("[data-condition]");
  if (!button) return;
  const active = new Set(character.conditions || []);
  if (active.has(button.dataset.condition)) active.delete(button.dataset.condition);
  else active.add(button.dataset.condition);
  character.conditions = Array.from(active);
  persistAndRender();
}

function renderActions() {
  const root = document.querySelector("#actionRows");
  const template = document.querySelector("#actionRowTemplate");
  root.innerHTML = "";
  if (!character.actions.length) {
    root.innerHTML = `<p class="empty-state">No custom actions yet.</p>`;
    return;
  }
  character.actions.forEach(action => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.dataset.actionId = action.id;
    node.querySelector(".action-name").value = action.name;
    node.querySelector(".action-type").value = action.type;
    node.querySelector(".action-attack").value = action.attack;
    node.querySelector(".action-damage").value = action.damage;
    node.querySelector(".action-notes").value = action.notes;
    root.appendChild(node);
  });
}

function addAction() {
  character.actions.push({ id: crypto.randomUUID(), name: "New Action", type: "Action", attack: "", damage: "", notes: "" });
  persistAndRender();
}

function handleActionInput(event) {
  const row = event.target.closest(".action-row");
  if (!row) return;
  const action = character.actions.find(item => item.id === row.dataset.actionId);
  if (!action) return;
  if (event.target.classList.contains("action-name")) action.name = event.target.value;
  if (event.target.classList.contains("action-type")) action.type = event.target.value;
  if (event.target.classList.contains("action-attack")) action.attack = event.target.value;
  if (event.target.classList.contains("action-damage")) action.damage = event.target.value;
  if (event.target.classList.contains("action-notes")) action.notes = event.target.value;
  persist();
}

function handleActionClick(event) {
  const button = event.target.closest(".remove-action");
  if (!button) return;
  const row = button.closest(".action-row");
  character.actions = character.actions.filter(item => item.id !== row.dataset.actionId);
  persistAndRender();
}

function takeRest(type) {
  if (type === "long") {
    character.hp = character.maxHp || character.hp;
    character.spellSlotUsage = {};
    character.conditions = (character.conditions || []).filter(condition => condition === "Exhaustion");
    character.exhaustion = Math.max(0, Number(character.exhaustion || 0) - 1);
  }
  character.resources.forEach(resource => {
    if (resource.reset === type || (type === "long" && resource.reset === "short")) resource.current = resource.max;
  });
  persistAndRender();
}

function renderPartyDashboard() {
  const characters = Object.values(characterLibrary).map(normalizeCharacter).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  document.querySelector("#partyCount").textContent = `${characters.length} character${characters.length === 1 ? "" : "s"}`;
  const root = document.querySelector("#partyDashboard");
  root.innerHTML = characters.map(item => {
    const cls = getClasses()[item.classId]?.name || "Class";
    const passive = 10 + Math.floor(((item.abilities?.wis || 10) - 10) / 2) + (item.proficientSkills?.includes("perception") ? proficiencyBonus(item.level) : 0);
    return `<article class="party-card"><strong>${escapeHtml(item.name || "Unnamed")}</strong><span>${escapeHtml(cls)} ${item.level || 1}${item.subclassName ? ` · ${escapeHtml(item.subclassName)}` : ""}</span><div><b>AC</b> ${item.ac || "-"} <b>HP</b> ${item.hp || "-"} / ${item.maxHp || item.hp || "-"} <b>Passive</b> ${passive}</div><p>${escapeHtml((item.conditions || []).join(", ") || "No conditions")}</p></article>`;
  }).join("");
}

function renderSearchResults() {
  const query = document.querySelector("#sheetSearch")?.value.trim().toLowerCase();
  const root = document.querySelector("#searchResults");
  if (!query) {
    root.classList.remove("active");
    root.innerHTML = "";
    return;
  }
  const haystacks = [
    ["Features", character.features],
    ["Attacks", character.attacks],
    ["Inventory", character.inventory],
    ["Notes", character.notes],
    ["Subclass", character.subclass.sections.map(section => `${section.title}: ${section.body}`).join("\n")],
    ["Actions", character.actions.map(action => `${action.name}: ${action.notes}`).join("\n")],
    ["Spells", character.spells.map(spellDisplayName).join(", ")]
  ];
  const matches = haystacks.filter(([, text]) => String(text || "").toLowerCase().includes(query));
  root.classList.add("active");
  root.innerHTML = matches.length ? matches.map(([label, text]) => `<article><strong>${label}</strong><p>${escapeHtml(truncate(String(text), 180))}</p></article>`).join("") : `<p class="empty-state">No matches.</p>`;
}

function renderSyncPanel() {
  setValue("syncRole", syncSettings.role);
  setValue("syncCampaignId", syncSettings.campaignId);
  setValue("syncPlayerName", syncSettings.playerName || character.name);
  setValue("syncSheetId", syncSettings.sheetId || character.sheetId);
  setValue("syncFirebaseConfig", syncSettings.firebaseConfigText);
  document.querySelector("#syncStatus").textContent = syncState.connected
    ? `Connected as ${syncSettings.role.toUpperCase()} to ${syncSettings.campaignId}.`
    : "Not connected.";
  if (!syncState.connected) {
    document.querySelector("#dmRoster").innerHTML = `<p class="empty-state">Connect as DM to watch player sheets.</p>`;
    document.querySelector("#syncActivity").innerHTML = `<p class="empty-state">Connect to a campaign to see level-up and prepared-spell changes.</p>`;
    document.querySelector("#syncRosterCount").textContent = "0 sheets";
  }
}

function handleSyncSettingsInput(event) {
  const map = {
    syncRole: "role",
    syncCampaignId: "campaignId",
    syncPlayerName: "playerName",
    syncSheetId: "sheetId",
    syncFirebaseConfig: "firebaseConfigText"
  };
  syncSettings[map[event.target.id]] = event.target.value;
  if (event.target.id === "syncSheetId") character.sheetId = event.target.value || character.sheetId;
  saveSyncSettings();
  persist();
}

async function connectCampaignSync() {
  disconnectCampaignSync(false);
  syncSettings.playerName = syncSettings.playerName || character.name;
  syncSettings.sheetId = syncSettings.sheetId || character.sheetId || crypto.randomUUID();
  character.sheetId = syncSettings.sheetId;
  saveSyncSettings();
  persist();

  const status = document.querySelector("#syncStatus");
  if (!syncSettings.campaignId || !syncSettings.firebaseConfigText) {
    status.textContent = "Add a campaign ID and Firebase web config first.";
    return;
  }

  try {
    status.textContent = "Connecting to campaign...";
    const firebaseConfig = JSON.parse(syncSettings.firebaseConfigText);
    const appApi = await import(FIREBASE_APP_URL);
    const firestoreApi = await import(FIREBASE_FIRESTORE_URL);
    const existing = appApi.getApps().find(app => app.name === "forgesheet-sync");
    const app = existing || appApi.initializeApp(firebaseConfig, "forgesheet-sync");
    syncState.db = firestoreApi.getFirestore(app);
    syncState.firestore = firestoreApi;
    syncState.connected = true;
    syncState.lastSummary = syncCharacterSummary();
    subscribeCampaign();
    if (syncSettings.role === "player") await uploadSheetSnapshot("connected");
    status.textContent = `Connected as ${syncSettings.role.toUpperCase()} to ${syncSettings.campaignId}.`;
    renderSyncPanel();
  } catch (error) {
    syncState.connected = false;
    status.textContent = "Could not connect. Check the Firebase config and Firestore rules.";
  }
}

function disconnectCampaignSync(updateStatus = true) {
  syncState.unsubscribers.forEach(unsubscribe => unsubscribe());
  syncState.unsubscribers = [];
  syncState.connected = false;
  syncState.db = null;
  syncState.firestore = null;
  clearTimeout(syncState.uploadTimer);
  if (updateStatus) {
    document.querySelector("#syncStatus").textContent = "Disconnected.";
    document.querySelector("#dmRoster").innerHTML = "";
    document.querySelector("#syncActivity").innerHTML = "";
    document.querySelector("#syncRosterCount").textContent = "0 sheets";
  }
}

function subscribeCampaign() {
  const fs = syncState.firestore;
  const campaignPath = `campaigns/${syncSettings.campaignId}`;
  if (syncSettings.role === "dm") {
    const sheetsRef = fs.collection(syncState.db, `${campaignPath}/sheets`);
    syncState.unsubscribers.push(fs.onSnapshot(sheetsRef, snapshot => {
      const sheets = snapshot.docs.map(doc => doc.data()).sort((a, b) => (a.characterName || "").localeCompare(b.characterName || ""));
      renderDmRoster(sheets);
    }));
  }
  const activityRef = fs.query(
    fs.collection(syncState.db, `${campaignPath}/activity`),
    fs.orderBy("createdAt", "desc"),
    fs.limit(30)
  );
  syncState.unsubscribers.push(fs.onSnapshot(activityRef, snapshot => {
    renderActivity(snapshot.docs.map(doc => doc.data()));
  }));
}

function queueSyncUpload() {
  if (!syncState.connected || syncSettings.role !== "player" || syncState.applyingRemote) return;
  clearTimeout(syncState.uploadTimer);
  syncState.uploadTimer = setTimeout(() => uploadSheetSnapshot("updated"), 700);
}

async function uploadSheetSnapshot(reason) {
  if (!syncState.connected || syncSettings.role !== "player") return;
  const fs = syncState.firestore;
  const summary = syncCharacterSummary();
  const sheetRef = fs.doc(syncState.db, `campaigns/${syncSettings.campaignId}/sheets/${syncSettings.sheetId}`);
  await fs.setDoc(sheetRef, {
    ...summary,
    sheetId: syncSettings.sheetId,
    playerName: syncSettings.playerName || character.name,
    character,
    updatedAt: fs.serverTimestamp()
  }, { merge: true });
  await maybeLogSyncActivity(summary, reason);
  syncState.lastSummary = summary;
}

async function maybeLogSyncActivity(summary, reason) {
  const previous = syncState.lastSummary;
  const changes = [];
  if (!previous || reason === "connected") {
    changes.push("shared their sheet");
  } else {
    if (previous.level !== summary.level) changes.push(`leveled from ${previous.level} to ${summary.level}`);
    if (previous.preparedSignature !== summary.preparedSignature) changes.push("changed prepared spells");
  }
  if (!changes.length) return;
  const fs = syncState.firestore;
  await fs.addDoc(fs.collection(syncState.db, `campaigns/${syncSettings.campaignId}/activity`), {
    sheetId: syncSettings.sheetId,
    characterName: summary.characterName,
    playerName: syncSettings.playerName || character.name,
    message: `${summary.characterName} ${changes.join(" and ")}.`,
    createdAt: fs.serverTimestamp()
  });
}

function syncCharacterSummary() {
  const cls = currentClass();
  const prepared = character.spells
    .filter(row => row.prepared && spellRowHasSpell(row))
    .map(spellDisplayName)
    .filter(Boolean)
    .sort();
  return {
    characterName: character.name,
    className: cls.name,
    classId: character.classId,
    subclassName: character.subclassName,
    level: character.level,
    hp: character.hp,
    ac: character.ac,
    preparedSpells: prepared,
    preparedSignature: prepared.join("|")
  };
}

function renderDmRoster(sheets) {
  document.querySelector("#syncRosterCount").textContent = `${sheets.length} sheet${sheets.length === 1 ? "" : "s"}`;
  const root = document.querySelector("#dmRoster");
  if (!sheets.length) {
    root.innerHTML = `<p class="empty-state">No player sheets connected yet.</p>`;
    return;
  }
  root.innerHTML = sheets.map(sheet => `
    <article class="dm-sheet">
      <div>
        <strong>${escapeHtml(sheet.characterName || "Unnamed")}</strong>
        <span>${escapeHtml(sheet.playerName || "Player")} · ${escapeHtml(sheet.className || "Class")} ${sheet.level || "?"}${sheet.subclassName ? ` · ${escapeHtml(sheet.subclassName)}` : ""}</span>
      </div>
      <div class="dm-sheet-stats">
        <span>AC ${escapeHtml(sheet.ac ?? "-")}</span>
        <span>HP ${escapeHtml(sheet.hp ?? "-")}</span>
      </div>
      <p>${escapeHtml((sheet.preparedSpells || []).join(", ") || "No prepared spells listed.")}</p>
    </article>
  `).join("");
}

function renderActivity(items) {
  const root = document.querySelector("#syncActivity");
  if (!items.length) {
    root.innerHTML = `<p class="empty-state">No campaign activity yet.</p>`;
    return;
  }
  root.innerHTML = items.map(item => `
    <article class="activity-item">
      <strong>${escapeHtml(item.message || "Sheet updated.")}</strong>
      <span>${escapeHtml(item.playerName || "")}</span>
    </article>
  `).join("");
}

async function copySyncLink(role) {
  syncSettings.role = role;
  saveSyncSettings();
  const url = new URL(location.href);
  url.searchParams.set("campaign", syncSettings.campaignId || "");
  url.searchParams.set("role", role);
  if (role === "player") url.searchParams.set("sheet", syncSettings.sheetId || character.sheetId);
  await navigator.clipboard.writeText(url.toString());
  document.querySelector("#syncStatus").textContent = `${role === "dm" ? "DM" : "Player"} link copied.`;
}

function openImportDialog() {
  pendingImport = null;
  document.querySelector("#sheetImportPdf").value = "";
  document.querySelector("#sheetImportText").value = "";
  document.querySelector("#importSkillProficiencies").checked = false;
  document.querySelector("#pdfImportStatus").textContent = "PDF text extraction works best with fillable or text-based PDFs.";
  document.querySelector("#applySheetImport").disabled = true;
  document.querySelector("#importPreview").innerHTML = `<p class="muted">Detected fields will appear here before anything is applied.</p>`;
  document.querySelector("#importDialog").showModal();
}

async function handlePdfImport(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const status = document.querySelector("#pdfImportStatus");
  const textArea = document.querySelector("#sheetImportText");
  if (file.type && file.type !== "application/pdf") {
    status.textContent = "Choose a PDF file.";
    return;
  }
  status.textContent = `Reading ${file.name}...`;
  document.querySelector("#applySheetImport").disabled = true;
  try {
    const text = await extractTextFromPdf(file);
    if (!text.trim()) {
      status.textContent = "No selectable text found. This may be a scanned/image-only PDF.";
      return;
    }
    textArea.value = text;
    status.textContent = `Extracted ${text.length.toLocaleString()} characters from ${file.name}.`;
    pendingImport = parseCharacterSheetText(text);
    renderImportPreview(pendingImport);
    document.querySelector("#applySheetImport").disabled = !pendingImport || !Object.keys(pendingImport.fields).length;
  } catch (error) {
    status.textContent = "Could not read this PDF. Try a fillable/text PDF or paste the sheet text manually.";
  }
}

async function extractTextFromPdf(file) {
  const pdfjs = await import(PDFJS_URL);
  pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str || "").join(" ");
    const annotations = await page.getAnnotations();
    const formText = annotations
      .filter(item => item.fieldName && isMeaningfulPdfFieldValue(item.fieldValue))
      .map(item => `${item.fieldName}: ${item.fieldValue}`)
      .join("\n");
    pages.push([pageText, formText].filter(Boolean).join("\n"));
  }
  return normalizeExtractedPdfText(pages.join("\n\n"));
}

function isMeaningfulPdfFieldValue(value) {
  if (value === undefined || value === null) return false;
  const text = String(value).trim();
  if (!text) return false;
  return !/^(off|false|no|0)$/i.test(text);
}

function normalizeExtractedPdfText(text) {
  return text
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function parseImportDialogText() {
  const text = document.querySelector("#sheetImportText").value.trim();
  pendingImport = parseCharacterSheetText(text);
  renderImportPreview(pendingImport);
  document.querySelector("#applySheetImport").disabled = !pendingImport || !Object.keys(pendingImport.fields).length;
}

function parseCharacterSheetText(text) {
  const fields = {};
  const importSkills = Boolean(document.querySelector("#importSkillProficiencies")?.checked);
  const notes = [importSkills
    ? "Skill proficiency import is enabled. Review detected skills before applying."
    : "Skill proficiencies are not imported by default. Set them manually after import, or check the skill import option before parsing."
  ];
  if (!text) return { fields, notes: ["No text pasted."] };
  const normalized = text.replace(/\r/g, "");
  const compact = normalized.replace(/[ \t]+/g, " ");

  assignIf(fields, "name", firstMatch(compact, [
    /(?:character\s*name|name)\s*[:\-]\s*([^\n|]+)/i
  ]));
  if (!fields.name) {
    const firstLine = normalized.split("\n").map(line => line.trim()).find(Boolean);
    if (firstLine && firstLine.length <= 48 && !/:/.test(firstLine)) fields.name = firstLine;
  }

  const classInfo = detectClassAndLevel(compact);
  if (classInfo.classId) fields.classId = classInfo.classId;
  assignIf(fields, "level", firstNumber(compact, [
    /(?:level|lvl)\s*[:\-]?\s*(\d{1,2})/i,
    /(?:class\s*&\s*level|class\s+and\s+level)\s*[:\-]\s*[^0-9\n]*(\d{1,2})/i
  ]) || classInfo.level);

  assignIf(fields, "subclassName", firstMatch(compact, [
    /(?:subclass|archetype|specialist|domain|patron|oath|circle|tradition)\s*[:\-]\s*([^\n|]+)/i
  ]));
  assignIf(fields, "species", firstMatch(compact, [
    /(?:species|race)\s*[:\-]\s*([^\n|]+)/i
  ]));
  assignIf(fields, "background", firstMatch(compact, [
    /background\s*[:\-]\s*([^\n|]+)/i
  ]));
  assignIf(fields, "alignment", firstMatch(compact, [
    /alignment\s*[:\-]\s*([A-Z]{1,2}|lawful good|neutral good|chaotic good|lawful neutral|true neutral|neutral|chaotic neutral|lawful evil|neutral evil|chaotic evil)/i
  ]));
  assignIf(fields, "hp", firstNumber(compact, [
    /(?:hit points|hp|max hp|maximum hp)\s*[:\-]?\s*(\d{1,3})/i
  ]));
  assignIf(fields, "ac", firstNumber(compact, [
    /(?:armor class|ac)\s*[:\-]?\s*(\d{1,3})/i
  ]));
  assignIf(fields, "speed", firstNumber(compact, [
    /speed\s*[:\-]?\s*(\d{1,3})/i
  ]));
  assignIf(fields, "hitDice", firstMatch(compact, [
    /(?:hit dice|hit die)\s*[:\-]\s*([0-9dD+\-\s]+)/i
  ]));

  const abilities = detectAbilities(compact);
  if (Object.keys(abilities).length) fields.abilities = abilities;

  const skillMatches = importSkills ? detectProficientSkills(compact) : [];
  if (skillMatches.length) fields.proficientSkills = skillMatches;

  const detectedSpells = detectKnownSpells(compact);
  if (detectedSpells.length) fields.spells = detectedSpells;

  assignIf(fields, "features", extractSection(normalized, ["features", "traits", "class features", "features & traits"]));
  assignIf(fields, "attacks", extractSection(normalized, ["attacks", "actions", "attacks & spellcasting"]));
  assignIf(fields, "inventory", extractSection(normalized, ["inventory", "equipment", "possessions"]));
  assignIf(fields, "notes", extractSection(normalized, ["notes", "backstory", "personality"]));

  if (!fields.features && !fields.notes) {
    notes.push("Long free-form text was not assigned to a field. Paste sections with labels like Features:, Inventory:, or Notes: for better extraction.");
  }
  return { fields, notes };
}

function renderImportPreview(result) {
  const root = document.querySelector("#importPreview");
  if (!result || !Object.keys(result.fields).length) {
    root.innerHTML = `<p class="muted">${result?.notes?.[0] || "No fields detected yet."}</p>`;
    return;
  }
  const rows = Object.entries(result.fields).map(([key, value]) => `
    <tr><th>${importFieldLabel(key)}</th><td>${escapeHtml(importValueSummary(value))}</td></tr>
  `).join("");
  const notes = result.notes.length ? `<p class="muted">${result.notes.map(escapeHtml).join(" ")}</p>` : "";
  root.innerHTML = `
    <div class="import-warning">Skill proficiencies are intentionally manual unless you enable skill import.</div>
    <table>
      <tbody>${rows}</tbody>
    </table>
    ${notes}
  `;
}

function applyPendingImport() {
  if (!pendingImport) return;
  const fields = pendingImport.fields;
  Object.entries(fields).forEach(([key, value]) => {
    if (key === "abilities") {
      character.abilities = { ...character.abilities, ...value };
    } else if (key === "proficientSkills") {
      character.proficientSkills = Array.from(new Set(value));
    } else if (key === "spells") {
      mergeImportedSpells(value);
    } else if (key === "subclassName") {
      character.subclassName = value;
      character.subclass.mode = "custom";
    } else {
      character[key] = value;
    }
  });
  if (fields.classId) {
    const cls = currentClass();
    character.hitDice = character.hitDice || `${character.level}d${cls.hitDie}`;
  }
  persistAndRender();
  document.querySelector("#importDialog").close();
}

function mergeImportedSpells(spells) {
  const existing = new Set(character.spells.map(row => row.index).filter(Boolean));
  spells.forEach(spellIndex => {
    if (existing.has(spellIndex)) return;
    const spell = allSpells.find(item => item.index === spellIndex);
    character.spells.push({
      id: crypto.randomUUID(),
      index: spellIndex,
      level: spell?.level ?? 1,
      prepared: (spell?.level ?? 1) > 0
    });
    existing.add(spellIndex);
  });
}

function detectClassAndLevel(text) {
  const result = {};
  const classes = Object.values(getClasses()).sort((a, b) => b.name.length - a.name.length);
  const classLine = firstMatch(text, [
    /(?:class\s*&\s*level|class\s+and\s+level|class)\s*[:\-]\s*([^\n|]+)/i
  ]);
  const haystack = classLine || text;
  const found = classes.find(cls => new RegExp(`\\b${escapeRegExp(cls.name)}\\b`, "i").test(haystack));
  if (found) result.classId = found.id;
  const level = firstNumber(haystack, [
    /(?:level|lvl)\s*(\d{1,2})/i,
    /\b(\d{1,2})(?:st|nd|rd|th)?\s*level\b/i,
    /\b(?:artificer|barbarian|bard|cleric|druid|fighter|monk|paladin|ranger|rogue|sorcerer|warlock|wizard)\s+(\d{1,2})\b/i
  ]);
  if (level) result.level = clamp(level, 1, 20);
  return result;
}

function detectAbilities(text) {
  const abilities = {};
  ABILITIES.forEach(([id, name]) => {
    const short = id.toUpperCase();
    const score = firstNumber(text, [
      new RegExp(`\\b${name}\\b\\s*[:\\-]?\\s*(\\d{1,2})`, "i"),
      new RegExp(`\\b${short}\\b\\s*[:\\-]?\\s*(\\d{1,2})`, "i")
    ]);
    if (score) abilities[id] = clamp(score, 1, 30);
  });
  return abilities;
}

function detectProficientSkills(text) {
  const explicitBlock = firstMatch(text, [
    /(?:skill proficiencies|proficient skills|skills proficient|proficient in)\s*[:\-]\s*([^\n]+)/i
  ]);
  const explicitSkills = explicitBlock.length <= 220 ? skillsMentionedIn(explicitBlock) : [];
  if (explicitSkills.length && explicitSkills.length <= 8) return explicitSkills;

  const profSection = extractSection(text, ["skill proficiencies", "proficient skills", "proficiencies"]);
  const sectionSkills = profSection.length <= 500 ? skillsMentionedIn(profSection) : [];
  if (sectionSkills.length && sectionSkills.length <= 8) return sectionSkills;

  const marked = new Set();
  text.split("\n").forEach(line => {
    if (line.length > 160) return;
    SKILLS.forEach(([id, name]) => {
      const escaped = escapeRegExp(name);
      const hasSkill = new RegExp(`\\b${escaped}\\b`, "i").test(line);
      if (!hasSkill) return;
      const marker = String.raw`(?:[●■◆✓✔✕*]|\[x\]|\(x\)|\bx\b|\bprof(?:icient|\.)?\b)`;
      const markedBefore = new RegExp(`${marker}\\s*[-+]?\\d*\\s*\\b${escaped}\\b`, "i").test(line);
      const markedAfter = new RegExp(`\\b${escaped}\\b.{0,40}${marker}`, "i").test(line);
      if (markedBefore || markedAfter) marked.add(id);
    });
  });
  return Array.from(marked);
}

function skillsMentionedIn(text) {
  const source = text.toLowerCase();
  return SKILLS
    .filter(([id, name]) => source.includes(name.toLowerCase()) || source.includes(id.toLowerCase()))
    .map(([id]) => id);
}

function detectKnownSpells(text) {
  const lower = text.toLowerCase();
  return allSpells
    .filter(item => lower.includes(item.name.toLowerCase()) || lower.includes(`spell: ${item.name.toLowerCase()}`))
    .map(item => item.index);
}

function extractSection(text, headings) {
  const lines = text.split("\n");
  const start = lines.findIndex(line => headings.some(heading => new RegExp(`^\\s*${escapeRegExp(heading)}\\s*:?\\s*$`, "i").test(line)));
  if (start < 0) return "";
  const collected = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    const isKnownHeading = IMPORT_SECTION_HEADINGS.some(heading => new RegExp(`^\\s*${escapeRegExp(heading)}\\s*:?\\s*$`, "i").test(line));
    if (isKnownHeading && collected.length) break;
    collected.push(line);
  }
  return collected.join("\n").trim();
}

function firstMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return cleanImportedValue(match[1]);
  }
  return "";
}

function firstNumber(text, patterns) {
  const value = firstMatch(text, patterns);
  return value ? Number(value.match(/\d+/)?.[0]) : 0;
}

function assignIf(object, key, value) {
  if (value !== "" && value !== 0 && value !== undefined && value !== null) object[key] = value;
}

function cleanImportedValue(value) {
  return String(value).replace(/\s+/g, " ").replace(/[|•]+$/g, "").trim();
}

function importFieldLabel(key) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, char => char.toUpperCase());
}

function importValueSummary(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return Object.entries(value).map(([key, item]) => `${key.toUpperCase()} ${item}`).join(", ");
  return String(value).slice(0, 260);
}

function renderSpells() {
  const cls = currentClass();
  const ability = cls.spellAbility;
  const spellMod = ABILITIES.some(([id]) => id === ability) ? mod(ability) : 0;
  const preparedLimit = preparedLimitFor(cls);
  const preparedUsed = character.spells.filter(row => spellRowHasSpell(row) && row.prepared && spellLevelForRow(row) > 0).length;
  document.querySelector("#spellAbility").textContent = ability === "none" ? "-" : ability.toUpperCase();
  document.querySelector("#spellDc").textContent = ability === "none" ? "-" : 8 + proficiencyBonus() + spellMod;
  document.querySelector("#spellAttack").textContent = ability === "none" ? "-" : formatMod(proficiencyBonus() + spellMod);
  document.querySelector("#preparedCount").textContent = `${preparedUsed} / ${preparedLimit}`;
  document.querySelector("#preparedCount").style.color = preparedUsed > preparedLimit ? "var(--accent)" : "inherit";
  renderSlots(cls);
  renderSpellRows();
}

function renderSlots(cls) {
  const slots = spellSlotsFor(cls, character.level);
  const slotGrid = document.querySelector("#slotGrid");
  if (!slots.length) {
    slotGrid.innerHTML = `<div class="slot"><span>Slots</span><strong>-</strong></div>`;
    return;
  }
  slotGrid.innerHTML = slots.map((count, index) => `
    <div class="slot slot-tracker">
      <span>${ordinal(index + 1)}</span>
      <strong>${slotRemaining(index + 1, count)} / ${count || "-"}</strong>
      <div>
        <button type="button" class="ghost" data-slot-level="${index + 1}" data-slot-delta="-1">Use</button>
        <button type="button" class="ghost" data-slot-level="${index + 1}" data-slot-delta="1">Restore</button>
      </div>
    </div>
  `).join("");
}

function slotRemaining(level, max) {
  const used = Number(character.spellSlotUsage?.[level] || 0);
  return Math.max(0, Number(max || 0) - used);
}

function handleSlotUsageClick(event) {
  const button = event.target.closest("[data-slot-level]");
  if (!button) return;
  const level = button.dataset.slotLevel;
  const delta = Number(button.dataset.slotDelta);
  const max = spellSlotsFor(currentClass(), character.level)[Number(level) - 1] || 0;
  const currentUsed = Number(character.spellSlotUsage[level] || 0);
  character.spellSlotUsage[level] = clamp(currentUsed - delta, 0, max);
  persistAndRender();
}

function renderSpellRows() {
  const root = document.querySelector("#spellRows");
  const template = document.querySelector("#spellRowTemplate");
  root.innerHTML = "";
  visibleSpellLevels().forEach(level => {
    const section = document.createElement("section");
    section.className = "spell-section";
    const rows = character.spells.filter(row => spellLevelForRow(row) === level);
    section.innerHTML = `
      <div class="spell-section-head">
        <div>
          <h3>${spellLevelLabel(level)}</h3>
          <span>${rows.filter(spellRowHasSpell).length} selected</span>
        </div>
        <button type="button" class="ghost" data-add-spell-level="${level}">Add ${level === 0 ? "Cantrip" : "Spell"}</button>
      </div>
      <div class="spell-section-body"></div>
    `;
    const body = section.querySelector(".spell-section-body");
    if (!rows.length) {
      body.innerHTML = `<p class="empty-state">No ${spellLevelLabel(level).toLowerCase()} selected.</p>`;
    }
    rows.forEach(row => {
      const node = template.content.firstElementChild.cloneNode(true);
      const select = node.querySelector(".spell-select");
      const prepared = node.querySelector(".prepared-toggle");
      const remove = node.querySelector(".remove-spell");
      fillSpellSelect(select, spellSelectValue(row), spellChoices(row.index, level));
      prepared.checked = level > 0 && row.prepared;
      prepared.disabled = level === 0;
      if (level === 0) prepared.closest("label").classList.add("is-disabled");
      select.addEventListener("change", () => {
        if (select.value === CUSTOM_SPELL_VALUE) {
          row.index = "";
          row.custom = {
            name: row.custom?.name || "",
            level,
            castingTime: row.custom?.castingTime || "",
            range: row.custom?.range || "",
            duration: row.custom?.duration || "",
            components: row.custom?.components || "",
            desc: row.custom?.desc || ""
          };
        } else {
          row.index = select.value;
          delete row.custom;
        }
        row.level = level;
        row.prepared = level > 0 && row.prepared;
        persistAndRender();
        if (row.index) loadSpellDetail(row.index);
      });
      prepared.addEventListener("change", () => {
        row.prepared = prepared.checked;
        persistAndRender();
      });
      remove.addEventListener("click", () => {
        character.spells = character.spells.filter(item => item.id !== row.id);
        persistAndRender();
      });
      renderCustomSpellEditor(node, row, level);
      renderSpellCard(node.querySelector(".spell-card"), row);
      body.appendChild(node);
    });
    root.appendChild(section);
  });
}

function fillSpellSelect(select, currentValue, choices = spellChoices(currentValue)) {
  select.innerHTML = `<option value="">Choose spell...</option><option value="${CUSTOM_SPELL_VALUE}">Custom spell...</option>` + choices
    .map(item => `<option value="${item.index}">${item.name} (${item.level === 0 ? "Cantrip" : ordinal(item.level)})</option>`)
    .join("");
  select.value = currentValue || "";
}

function spellChoices(currentIndex = "", level = null) {
  const cls = currentClass();
  const selected = new Set(character.spells.map(row => row.index).filter(Boolean));
  if (currentIndex) selected.delete(currentIndex);
  const includeAll = document.querySelector("#showAllSpells")?.checked;
  return allSpells
    .filter(item => currentIndex === item.index || !selected.has(item.index))
    .filter(item => currentIndex === item.index || includeAll || spellMatchesClass(item, cls))
    .filter(item => currentIndex === item.index || level === null || Number(level) === item.level)
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

function spellSelectValue(row) {
  return row.custom ? CUSTOM_SPELL_VALUE : row.index || "";
}

function spellRowHasSpell(row) {
  return Boolean(row.index || row.custom);
}

function spellLevelForRow(row) {
  if (row.custom && Number.isInteger(row.custom.level)) return row.custom.level;
  const spell = allSpells.find(item => item.index === row.index);
  if (spell && Number.isInteger(spell.level)) return spell.level;
  if (Number.isInteger(row.level)) return row.level;
  return 1;
}

function visibleSpellLevels() {
  const selectedLevels = character.spells.map(spellLevelForRow);
  const maxKnownLevel = Math.max(1, maxSpellLevelFor(currentClass(), character.level), ...selectedLevels);
  const levels = new Set([0, ...Array.from({ length: Math.min(9, maxKnownLevel) }, (_, index) => index + 1), ...selectedLevels]);
  return Array.from(levels).filter(level => level >= 0 && level <= 9).sort((a, b) => a - b);
}

function spellLevelLabel(level) {
  return level === 0 ? "Cantrips" : `${ordinal(level)} Level`;
}

function spellMatchesClass(item, cls) {
  const sources = new Set(cls.spellSources || []);
  if (sources.has("artificer") && ARTIFICER_SPELLS.has(item.index)) return true;
  return (item.classes || []).some(classId => sources.has(classId));
}

function renderCustomSpellEditor(node, row, level) {
  const editor = node.querySelector(".custom-spell-fields");
  editor.classList.toggle("active", Boolean(row.custom));
  if (!row.custom) return;
  row.custom.level = level;
  const fields = {
    ".custom-spell-name": "name",
    ".custom-spell-casting": "castingTime",
    ".custom-spell-range": "range",
    ".custom-spell-duration": "duration",
    ".custom-spell-components": "components",
    ".custom-spell-desc": "desc"
  };
  Object.entries(fields).forEach(([selector, key]) => {
    const input = node.querySelector(selector);
    input.value = row.custom[key] || "";
    input.addEventListener("input", () => {
      row.custom[key] = input.value;
      row.custom.level = level;
      persist();
      renderSpellCard(node.querySelector(".spell-card"), row);
    });
  });
}

function renderSpellCard(card, rowOrIndex) {
  const row = typeof rowOrIndex === "object" ? rowOrIndex : { index: rowOrIndex };
  if (row.custom) {
    const custom = row.custom;
    card.innerHTML = `
      <strong>${escapeHtml(custom.name || "Custom spell")}</strong> ${spellLevelLabel(custom.level || row.level || 0)}
      <br>${escapeHtml(custom.castingTime || "Casting time")} · ${escapeHtml(custom.range || "Range")} · ${escapeHtml(custom.components || "Components")}
      <br>${escapeHtml(custom.duration || "Duration")}
      <br>${escapeHtml(truncate(custom.desc || "Enter the custom spell details above.", 320))}
      <br><span>Source: Custom / book copy</span>
    `;
    return;
  }
  const index = row.index;
  if (!index) {
    card.innerHTML = `<span>Select a spell to see casting details.</span>`;
    return;
  }
  const summary = allSpells.find(item => item.index === index);
  const detail = spellDetails[index];
  if (!detail) {
    card.innerHTML = `<strong>${summary?.name || index}</strong><br><span>Loading details...</span>`;
    loadSpellDetail(index);
    return;
  }
  const classes = (detail.classes || []).map(item => item.name || item).join(", ");
  card.innerHTML = `
    <strong>${detail.name}</strong> ${detail.level === 0 ? "Cantrip" : ordinal(detail.level)}
    <br>${detail.casting_time || ""} · ${detail.range || ""} · ${(detail.components || []).join(", ")}
    <br>${detail.concentration ? "Concentration · " : ""}${detail.duration || ""}
    <br>${truncate((detail.desc || []).join(" "), 260)}
    <br><span>API classes: ${classes || "custom/homebrew"}</span>
  `;
}

function renderBuilder() {
  const cls = currentClass();
  setValue("builderName", cls.name);
  setValue("builderHitDie", String(cls.hitDie));
  setValue("builderCasterType", cls.casterType);
  setValue("builderSpellAbility", cls.spellAbility || "int");
  setValue("builderPreparedFormula", cls.preparedFormula || "none");
  setValue("builderSpellSources", (cls.spellSources || []).join(", "));
  setValue("builderTable", cls.table.map(row => `${row.level}, ${row.features || ""}, ${row.newSpells || 0}, ${row.cantrips || 0}`).join("\n"));
}

function renderClassTable() {
  const cls = currentClass();
  const rows = cls.table.map(row => {
    const slots = spellSlotsFor(cls, row.level);
    return `<tr class="${row.level === character.level ? "current" : ""}">
      <td>${row.level}</td>
      <td>${row.features || "-"}</td>
      <td>${row.newSpells || "-"}</td>
      <td>${row.cantrips || "-"}</td>
      <td>${slots.length ? slots.join(" / ") : "-"}</td>
      <td>${preparedLimitFor(cls, row.level)}</td>
    </tr>`;
  }).join("");
  document.querySelector("#classTable").innerHTML = `
    <table>
      <thead><tr><th>Level</th><th>Features</th><th>New spells</th><th>Cantrips</th><th>Slots</th><th>Prepared</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function saveCustomClass() {
  const name = document.querySelector("#builderName").value.trim();
  if (!name) return;
  const id = slug(name);
  customClasses[id] = {
    id,
    name,
    hitDie: Number(document.querySelector("#builderHitDie").value),
    casterType: document.querySelector("#builderCasterType").value,
    spellAbility: document.querySelector("#builderSpellAbility").value,
    preparedFormula: document.querySelector("#builderPreparedFormula").value,
    spellSources: document.querySelector("#builderSpellSources").value.split(",").map(item => slug(item.trim())).filter(Boolean),
    table: parseClassTable(document.querySelector("#builderTable").value)
  };
  localStorage.setItem(CUSTOM_CLASS_KEY, JSON.stringify(customClasses));
  character.classId = id;
  persistAndRender();
}

function parseClassTable(text) {
  const rows = {};
  text.split("\n").forEach(line => {
    const [level, features = "", newSpells = "0", cantrips = "0"] = line.split(",");
    const number = Number(level);
    if (number >= 1 && number <= 20) rows[number] = [features.trim(), Number(newSpells), Number(cantrips)];
  });
  return makeTable(rows);
}

function openLevelDialog() {
  if (character.level >= 20) return;
  const nextLevel = character.level + 1;
  const cls = currentClass();
  const row = cls.table[nextLevel - 1];
  pendingLevelChoices = [];
  document.querySelector("#levelDialogTitle").textContent = `${cls.name} Level ${nextLevel}`;
  document.querySelector("#levelSummary").innerHTML = `
    <div>Hit points: add an average ${Math.ceil(cls.hitDie / 2) + 1 + mod("con")} HP, or edit manually after applying.</div>
    <div>Hit dice: ${nextLevel}d${cls.hitDie}</div>
    <div>Features: ${row.features || "No class-table feature entered."}</div>
    <div>Spell slots: ${spellSlotsFor(cls, nextLevel).join(" / ") || "none"}</div>
    <div>Prepared spell limit: ${preparedLimitFor(cls, nextLevel)}</div>
  `;
  const choices = document.querySelector("#levelSpellChoices");
  choices.innerHTML = "";
  const totalChoices = (row.newSpells || 0) + (row.cantrips || 0);
  for (let i = 0; i < totalChoices; i += 1) {
    const newRow = { id: crypto.randomUUID(), index: "", prepared: true };
    pendingLevelChoices.push(newRow);
    const wrapper = document.createElement("div");
    wrapper.className = "spell-row";
    wrapper.innerHTML = `<select class="spell-select"></select><span class="muted">${i < row.cantrips ? "Cantrip" : "New spell"}</span>`;
    fillSpellSelect(wrapper.querySelector("select"), "", spellChoicesForLevelChoice(i < row.cantrips ? 0 : "leveled"));
    wrapper.querySelector("select").addEventListener("change", event => {
      newRow.index = event.target.value;
      pendingLevelChoices.forEach(choice => {
        if (choice !== newRow && choice.index === newRow.index) choice.index = "";
      });
    });
    choices.appendChild(wrapper);
  }
  if (!totalChoices) choices.innerHTML = `<p class="muted">No spell selections are required for this level.</p>`;
  document.querySelector("#levelDialog").showModal();
}

function spellChoicesForLevelChoice(kind) {
  const maximum = maxSpellLevelFor(currentClass(), character.level + 1);
  const selected = new Set(character.spells.map(row => row.index).filter(Boolean));
  return allSpells
    .filter(item => !selected.has(item.index))
    .filter(item => spellMatchesClass(item, currentClass()))
    .filter(item => kind === 0 ? item.level === 0 : item.level > 0 && item.level <= maximum)
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

function applyLevelUp(event) {
  event.preventDefault();
  const cls = currentClass();
  const nextLevel = character.level + 1;
  character.level = nextLevel;
  character.hp = Number(character.hp || 0) + Math.max(1, Math.ceil(cls.hitDie / 2) + 1 + mod("con"));
  character.hitDice = `${nextLevel}d${cls.hitDie}`;
  pendingLevelChoices.filter(row => row.index).forEach(row => character.spells.push(row));
  const row = cls.table[nextLevel - 1];
  if (row.features) {
    character.features = [character.features, `Level ${nextLevel}: ${row.features}`].filter(Boolean).join("\n");
  }
  pendingLevelChoices = [];
  document.querySelector("#levelDialog").close();
  persistAndRender();
}

async function hydrateSpells() {
  try {
    const response = await fetch(`${API_BASE}/spells`);
    const data = await response.json();
    document.querySelector("#apiStatus").textContent = `Loading ${data.count} SRD spell records...`;
    const settled = await Promise.allSettled(data.results.map(item => fetch(`${API_BASE}/spells/${item.index}`).then(res => res.json())));
    const apiDetails = settled
      .filter(result => result.status === "fulfilled")
      .map(result => normalizeSpellDetail(result.value));
    apiDetails.forEach(detail => {
      spellDetails[detail.index] = detail;
    });
    const apiSpells = apiDetails.map(detail => ({
      index: detail.index,
      name: detail.name,
      level: detail.level,
      classes: detail.classes.map(cls => cls.index)
    }));
    allSpells = mergeSpellLists(apiSpells, FALLBACK_SPELLS);
    document.querySelector("#apiStatus").textContent = `Loaded ${allSpells.length} SRD spells from the 5e API.`;
    renderSpells();
  } catch (error) {
    document.querySelector("#apiStatus").textContent = "Using bundled fallback spells. The live API was not reachable.";
  }
}

async function hydrateSubclasses() {
  try {
    subclassApiStatus = "loading";
    renderOfficialSubclassControls();
    const response = await fetch(`${API_BASE}/subclasses`);
    const data = await response.json();
    const settled = await Promise.allSettled(data.results.map(item => fetch(`${API_BASE}/subclasses/${item.index}`).then(res => res.json())));
    const apiSubclasses = settled
      .filter(result => result.status === "fulfilled")
      .map(result => normalizeSubclassDetail(result.value))
      .sort((a, b) => a.className.localeCompare(b.className) || a.name.localeCompare(b.name));
    officialSubclasses = mergeSubclasses(OFFICIAL_SUBCLASS_FALLBACK, apiSubclasses);
    subclassApiStatus = "ready";
    renderAll();
  } catch (error) {
    officialSubclasses = OFFICIAL_SUBCLASS_FALLBACK;
    subclassApiStatus = "fallback";
    renderOfficialSubclassControls();
  }
}

function mergeSubclasses(fallback, apiSubclasses) {
  const map = new Map(fallback.map(item => [item.index, item]));
  apiSubclasses.forEach(item => map.set(item.index, { ...map.get(item.index), ...item }));
  return Array.from(map.values()).sort((a, b) => a.className.localeCompare(b.className) || a.name.localeCompare(b.name));
}

function normalizeSubclassDetail(detail) {
  return {
    index: detail.index,
    name: detail.name,
    flavor: detail.subclass_flavor,
    desc: detail.desc || [],
    classIndex: detail.class?.index || "",
    className: detail.class?.name || "Unknown"
  };
}

async function loadOfficialSubclassDetail(index) {
  const existing = officialSubclasses.find(item => item.index === index);
  if (!index || (existing?.desc || []).length) return;
  try {
    const response = await fetch(`${API_BASE}/subclasses/${index}`);
    const detail = normalizeSubclassDetail(await response.json());
    officialSubclasses = mergeSubclasses(officialSubclasses, [detail]);
    if (character.subclass.officialIndex === index) renderAll();
  } catch {
    // Keep the fallback entry; the app remains usable without the description.
  }
}

async function loadSpellDetail(index) {
  if (!index || spellDetails[index]) return;
  try {
    const response = await fetch(`${API_BASE}/spells/${index}`);
    const detail = await response.json();
    spellDetails[index] = normalizeSpellDetail(detail);
    allSpells = allSpells.map(item => item.index === index ? {
      ...item,
      level: detail.level,
      classes: (detail.classes || []).map(cls => cls.index)
    } : item);
    renderSpells();
  } catch (error) {
    spellDetails[index] = allSpells.find(item => item.index === index) || { index, name: index, desc: [] };
    renderSpells();
  }
}

function normalizeSpellDetail(detail) {
  return {
    ...detail,
    classes: (detail.classes || []).map(cls => ({ ...cls, index: cls.index }))
  };
}

function mergeSpellLists(fallback, api) {
  const map = new Map();
  [...api, ...fallback].forEach(item => map.set(item.index, { ...map.get(item.index), ...item }));
  return Array.from(map.values());
}

function spellSlotsFor(cls, level = character.level) {
  if (cls.casterType === "none") return [];
  if (cls.casterType === "warlock") {
    const pact = WARLOCK_SLOTS[level];
    return pact ? Array.from({ length: pact.level }, (_, index) => index + 1 === pact.level ? pact.slots : 0) : [];
  }
  let casterLevel = level;
  if (cls.casterType === "halfRoundDown") casterLevel = Math.floor(level / 2);
  if (cls.casterType === "halfRoundUp") casterLevel = Math.ceil(level / 2);
  if (cls.casterType === "third") casterLevel = Math.floor(level / 3);
  return FULL_CASTER_SLOTS[Math.max(0, casterLevel)] || [];
}

function maxSpellLevelFor(cls, level) {
  return spellSlotsFor(cls, level).reduce((highest, count, index) => count > 0 ? index + 1 : highest, 0);
}

function preparedLimitFor(cls, level = character.level) {
  if (cls.preparedFormula === "none") return 0;
  if (cls.preparedFormula === "known") return character.spells.filter(row => row.index).length;
  if (cls.preparedFormula === "levelPlusMod") return Math.max(1, level + mod(cls.spellAbility));
  if (cls.preparedFormula === "halfLevelPlusMod") return Math.max(1, Math.ceil(level / 2) + mod(cls.spellAbility));
  return 0;
}

function proficiencyBonus(level = character.level) {
  return Math.ceil(level / 4) + 1;
}

function mod(ability) {
  return Math.floor(((character.abilities[ability] || 10) - 10) / 2);
}

function formatMod(value) {
  return value >= 0 ? `+${value}` : String(value);
}

function ordinal(number) {
  const names = ["", "1st", "2nd", "3rd"];
  return names[number] || `${number}th`;
}

function fillSelect(select, options) {
  const value = select.value;
  select.innerHTML = options.map(([id, label]) => `<option value="${id}">${label}</option>`).join("");
  if (options.some(([id]) => id === value)) select.value = value;
}

function setValue(idOrSelector, value) {
  const element = idOrSelector.startsWith?.("[") ? document.querySelector(idOrSelector) : document.querySelector(`#${idOrSelector}`);
  if (element && element.value !== String(value ?? "")) element.value = value ?? "";
}

function truncate(text, length) {
  if (!text) return "";
  return text.length > length ? `${text.slice(0, length - 1)}...` : text;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function clamp(value, min, max = Infinity) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function persistAndRender() {
  persist();
  renderAll();
}

function persist() {
  character = normalizeCharacter(character);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(character));
  characterLibrary[character.sheetId] = structuredCloneSafe(character);
  saveCharacterLibrary();
  queueSyncUpload();
}

function loadCharacter() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    return normalizeCharacter(stored);
  } catch {
    return defaultCharacter();
  }
}

function normalizeCharacter(value) {
  const base = defaultCharacter();
  const stored = value || {};
  return {
    ...base,
    ...stored,
    sheetId: stored.sheetId || base.sheetId,
    maxHp: stored.maxHp || stored.hp || base.maxHp,
    subclass: {
      ...base.subclass,
      ...(stored.subclass || {}),
      mode: stored.subclass?.mode || base.subclass.mode,
      officialIndex: stored.subclass?.officialIndex || base.subclass.officialIndex,
      sections: stored.subclass?.sections || base.subclass.sections
    },
    noteSections: stored.noteSections || base.noteSections,
    resources: stored.resources || base.resources,
    conditions: stored.conditions || base.conditions,
    exhaustion: Number(stored.exhaustion || 0),
    actions: stored.actions || base.actions,
    spellSlotUsage: stored.spellSlotUsage || base.spellSlotUsage
  };
}

function loadCustomClasses() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_CLASS_KEY)) || {};
  } catch {
    return {};
  }
}

function loadCharacterLibrary() {
  try {
    const raw = JSON.parse(localStorage.getItem(CHARACTER_LIBRARY_KEY)) || {};
    return Object.fromEntries(Object.entries(raw).map(([id, item]) => [id, normalizeCharacter(item)]));
  } catch {
    return {};
  }
}

function saveCharacterLibrary() {
  localStorage.setItem(CHARACTER_LIBRARY_KEY, JSON.stringify(characterLibrary));
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadSyncSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(SYNC_CONFIG_KEY)) || {};
    const params = new URLSearchParams(location.search);
    return {
      firebaseConfigText: stored.firebaseConfigText || "",
      campaignId: params.get("campaign") || stored.campaignId || "",
      role: params.get("role") || stored.role || "player",
      playerName: stored.playerName || "",
      sheetId: params.get("sheet") || stored.sheetId || crypto.randomUUID()
    };
  } catch {
    return { firebaseConfigText: "", campaignId: "", role: "player", playerName: "", sheetId: crypto.randomUUID() };
  }
}

function saveSyncSettings() {
  localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(syncSettings));
}

function spellDisplayName(row) {
  if (row.custom) return row.custom.name || "Custom spell";
  return allSpells.find(spell => spell.index === row.index)?.name || row.index;
}

function resetCharacter() {
  if (!confirm("Reset this character sheet?")) return;
  character = defaultCharacter();
  persistAndRender();
}
