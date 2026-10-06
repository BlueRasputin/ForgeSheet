// Player-chosen class options (CLASS_OPTIONS lists), counted by builder.js classChoiceSlots(). Other code reads these keys.
const CLASS_CHOICE_DEFAULTS = { fightingStyles: [], invocations: [], pactBoon: "", metamagic: [], maneuvers: [], infusions: [], disciplines: [], runes: [], arcaneShots: [], totems: {}, hunter: {}, favoredEnemies: [], favoredTerrains: [], bloodHunterRites: [], bloodMaledicts: [], draconicAncestry: "", landTerrain: "", genieKind: "", divineSoulAffinity: "", favoredFoe: false, deftExplorer: false, primalAwareness: false, naturesVeil: false, tomeCantrips: [], blessedWarriorCantrips: [], druidicWarriorCantrips: [], kenseiWeapons: [], stormEnvironment: "", hemocraftAbility: "" };

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
    backgroundDetails: {
      trait: "",
      ideal: "",
      bond: "",
      flaw: "",
      languages: "",
      tools: "",
      armor: "",
      weapons: ""
    },
    alignment: "",
    hp: 10,
    maxHp: 10,
    tempHp: 0,
    ac: 15,
    speed: 30,
    inspiration: 0,
    identityLocked: true,
    asiAcknowledgedLevel: 0,
    autoSpells: [],
    hitDice: "1d8",
    deathSaveSuccesses: 0,
    deathSaveFailures: 0,
    saveProficiencies: ["con", "int"],
    expertSkills: [],
    attacks: "",
    features: "",
    inventory: "",
    notes: "",
    noteSections: [],
    // Dated journal entries { id, date, session, location, title, body }, shown newest first.
    journal: [],
    // Class entry key ("primary" or a multiclass id) that gained the last level; the level-up dialog starts there.
    lastLevelClass: "",
    rollHistory: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: 25, pp: 0 },
    hitDiceUsed: 0,
    concentration: "",
    resources: [],
    equipment: [
      { id: crypto.randomUUID(), name: "Scale Mail", quantity: 1, weight: 45, container: "carried", equipped: true, attuned: false, notes: "Armor" },
      { id: crypto.randomUUID(), name: "Smith's Tools", quantity: 1, weight: 8, container: "backpack", equipped: false, attuned: false, notes: "Tool proficiency" }
    ],
    classOptions: [],
    planner: { multiclass: [], feats: [] },
    // Feats from a species or background ({ name, source }); they don't use an ASI slot.
    bonusFeats: [],
    // What each taken feat added (ability, save, proficiencies, HP), so removing it can undo that.
    featGrants: {},
    classChoices: normalizeClassChoices(),
    draconicAncestry: "",
    size: "",
    movement: {},
    restLog: "",
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

let character = loadCharacter();
let characterLibrary = loadCharacterLibrary();

// With no active character saved yet, reopen the most recent library character instead of minting a new blank one.
function loadCharacter() {
  try {
    const library = JSON.parse(localStorage.getItem(CHARACTER_LIBRARY_KEY)) || {};
    const tabSheet = sessionStorage.getItem(ACTIVE_TAB_SHEET_KEY);
    if (tabSheet && library[tabSheet]) return normalizeCharacter(library[tabSheet]);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored) return normalizeCharacter(stored);
    const latest = Object.values(library).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
    return normalizeCharacter(latest);
  } catch {
    return defaultCharacter();
  }
}

// fightingStyle (the Combat tab's single select) stays the first fighting style.
function normalizeClassChoices(stored = {}, fightingStyle = "") {
  const choices = Object.fromEntries(Object.entries(CLASS_CHOICE_DEFAULTS).map(([key, fallback]) => {
    const value = stored?.[key];
    if (Array.isArray(fallback)) return [key, Array.isArray(value) ? value.map(item => String(item || "")).slice(0, 24) : []];
    if (typeof fallback === "boolean") return [key, Boolean(value)];
    if (typeof fallback === "object") return [key, value && typeof value === "object" && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).slice(0, 8).map(([at, name]) => [at, String(name || "")])) : {}];
    return [key, typeof value === "string" ? value : ""];
  }));
  if (fightingStyle && choices.fightingStyles[0] !== fightingStyle) choices.fightingStyles[0] = fightingStyle;
  return choices;
}

// Older sheets kept the Variant Human / Custom Lineage feat in planner.feats, where it counted as an ASI.
function splitSpeciesFeat(stored) {
  const feats = [...(stored.planner?.feats || [])];
  if (Array.isArray(stored.bonusFeats)) return { feats, bonusFeats: stored.bonusFeats.filter(item => item?.name).map(item => ({ name: String(item.name), source: item.source === "background" ? "background" : "species" })) };
  const species = String(stored.species || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const name = species && String(stored.features || "").match(new RegExp(`^Feat \\(${species}\\): (.+)$`, "m"))?.[1];
  const index = name ? feats.indexOf(name) : -1;
  if (index < 0) return { feats, bonusFeats: [] };
  feats.splice(index, 1);
  return { feats, bonusFeats: [{ name, source: "species" }] };
}

function normalizeCharacter(value) {
  const base = defaultCharacter();
  const stored = value || {};
  const legacyFeats = splitSpeciesFeat(stored);
  return migrateCustomSpellRows({
    ...base,
    ...stored,
    // Synced and imported sheets are untrusted: numbers must be numbers and ids plain ids before they reach the page.
    sheetId: /^[\w-]{1,64}$/.test(String(stored.sheetId || "")) ? stored.sheetId : base.sheetId,
    level: clamp(Math.round(Number(stored.level) || 1), 1, 20),
    hp: Number(stored.hp ?? base.hp) || 0,
    maxHp: Number(stored.maxHp || stored.hp || base.maxHp) || 1,
    ac: Number(stored.ac ?? base.ac) || 10,
    speed: Number(stored.speed ?? base.speed) || 0,
    tempHp: clamp(Number(stored.tempHp || 0), 0, 999),
    // PHB p.125: you have inspiration or you don't, unless the stacking house rule is on.
    inspiration: clamp(Math.round(Number(stored.inspiration || 0)), 0, optionalRule("stackingInspiration", stored) ? 99 : 1),
    identityLocked: stored.identityLocked !== false,
    asiAcknowledgedLevel: Number(stored.asiAcknowledgedLevel || 0),
    autoSpells: stored.autoSpells || base.autoSpells,
    deathSaveSuccesses: clamp(Number(stored.deathSaveSuccesses || 0), 0, 3),
    deathSaveFailures: clamp(Number(stored.deathSaveFailures || 0), 0, 3),
    saveProficiencies: stored.saveProficiencies || base.saveProficiencies,
    subclass: {
      ...base.subclass,
      ...(stored.subclass || {}),
      mode: stored.subclass?.mode || base.subclass.mode,
      officialIndex: stored.subclass?.officialIndex || base.subclass.officialIndex,
      sections: stored.subclass?.sections || base.subclass.sections
    },
    noteSections: stored.noteSections || base.noteSections,
    backgroundDetails: { ...base.backgroundDetails, ...(stored.backgroundDetails || {}) },
    rollHistory: stored.rollHistory || base.rollHistory,
    currency: { ...base.currency, ...(stored.currency || {}) },
    hitDiceUsed: Number(stored.hitDiceUsed || 0),
    concentration: stored.concentration || base.concentration,
    resources: stored.resources || base.resources,
    // One way to equip: the old "Equipped" container becomes equipped: true, carried.
    equipment: (stored.equipment || base.equipment).map(item => item?.container === "equipped" ? { ...item, container: "carried", equipped: true } : item),
    journal: (Array.isArray(stored.journal) ? stored.journal : []).filter(entry => entry && typeof entry === "object").map(entry => ({
      id: /^[\w-]{1,64}$/.test(String(entry.id || "")) ? entry.id : crypto.randomUUID(),
      date: /^\d{4}-\d{2}-\d{2}$/.test(String(entry.date || "")) ? entry.date : "",
      session: String(entry.session ?? "").slice(0, 12),
      location: String(entry.location || "").slice(0, 200),
      title: String(entry.title || "").slice(0, 200),
      body: String(entry.body || "")
    })),
    lastLevelClass: /^[\w-]{1,64}$/.test(String(stored.lastLevelClass || "")) ? stored.lastLevelClass : "",
    classOptions: stored.classOptions || base.classOptions,
    planner: {
      multiclass: stored.planner?.multiclass || base.planner.multiclass,
      feats: legacyFeats.feats
    },
    bonusFeats: legacyFeats.bonusFeats,
    featGrants: stored.featGrants && typeof stored.featGrants === "object" ? stored.featGrants : {},
    classChoices: normalizeClassChoices(stored.classChoices, stored.fightingStyle),
    movement: stored.movement && typeof stored.movement === "object" ? stored.movement : {},
    restLog: stored.restLog || base.restLog,
    conditions: stored.conditions || base.conditions,
    exhaustion: Number(stored.exhaustion || 0),
    actions: stored.actions || base.actions,
    spellSlotUsage: stored.spellSlotUsage || base.spellSlotUsage,
    homebrewRules: stored.homebrewRules || {},
    optionalRules: { ...OPTIONAL_RULE_DEFAULTS, ...(stored.optionalRules || {}) },
    multiclasses: (Array.isArray(stored.multiclasses) ? stored.multiclasses : []).map(entry => ({
      id: /^[\w-]{1,64}$/.test(String(entry.id || "")) ? entry.id : crypto.randomUUID(),
      classId: String(entry.classId || "fighter"),
      level: clamp(Math.round(Number(entry.level) || 1), 1, 20),
      subclassName: String(entry.subclassName || ""),
      officialIndex: String(entry.officialIndex || ""),
      rules: entry.rules === "2024" ? "2024" : "2014"
    })),
    rulesVersion: stored.rulesVersion === "2024" ? "2024" : "2014",
    // Older sheets marked species spells racial: true; they are species-source rows now (spells.js header).
    spells: (Array.isArray(stored.spells) ? stored.spells : base.spells).map(row => {
      if (!row?.racial) return row;
      const { racial, ...rest } = row;
      return { ...rest, source: { kind: "species", name: String(stored.species || ""), ability: "" } };
    })
  });
}

function loadCharacterLibrary() {
  try {
    const raw = JSON.parse(localStorage.getItem(CHARACTER_LIBRARY_KEY)) || {};
    return Object.fromEntries(Object.entries(raw).map(([id, item]) => [id, normalizeCharacter(item)]));
  } catch {
    return {};
  }
}

const removedSheetIds = new Set();

// Merge by character instead of overwriting the whole map, so two open tabs can't erase each other's characters.
function saveCharacterLibrary() {
  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem(CHARACTER_LIBRARY_KEY)) || {};
  } catch {
    stored = {};
  }
  removedSheetIds.forEach(id => delete stored[id]);
  Object.entries(characterLibrary).forEach(([id, item]) => {
    if (!stored[id] || (item.updatedAt || 0) >= (stored[id].updatedAt || 0)) stored[id] = item;
  });
  localStorage.setItem(CHARACTER_LIBRARY_KEY, JSON.stringify(stored));
  Object.entries(stored).forEach(([id, item]) => {
    if (characterLibrary[id] !== item) characterLibrary[id] = normalizeCharacter(item);
  });
}

window.addEventListener("storage", event => {
  if (event.key !== CHARACTER_LIBRARY_KEY) return;
  characterLibrary = loadCharacterLibrary();
  const latest = characterLibrary[character.sheetId];
  if (latest && (latest.updatedAt || 0) > (character.updatedAt || 0)) {
    character = latest;
    renderAll();
    return;
  }
  // Another character changed elsewhere: refresh the lists without rebuilding the sheet under the cursor.
  if (!latest) characterLibrary[character.sheetId] = character;
  renderCharacterManager();
  renderPartyDashboard();
  renderDmItemTools();
});

window.addEventListener("storage", event => {
  if (event.key !== CUSTOM_CLASS_KEY) return;
  customClasses = loadCustomClasses();
  renderCharacterManager();
  renderPartyDashboard();
});

function ensureCharacterInLibrary() {
  characterLibrary[character.sheetId] = structuredCloneSafe(character);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(character));
  saveCharacterLibrary();
}

function persist() {
  character = normalizeCharacter(character);
  character.updatedAt = Date.now();
  try {
    sessionStorage.setItem(ACTIVE_TAB_SHEET_KEY, character.sheetId);
  } catch {
    // sessionStorage can be unavailable (privacy modes); the shared key still works.
  }
  const down = Number(character.hp) <= 0;
  // PHB p.197: becoming stable (or regaining HP) resets both death save counts.
  if (down && character.deathSaveSuccesses >= 3) character.stable = true;
  if (!down || character.stable) {
    character.deathSaveSuccesses = 0;
    character.deathSaveFailures = 0;
  }
  if (!down) character.stable = false;
  // Exhaustion 4 or a max HP reduction lowers the ceiling; current HP can't sit above it.
  if (Number(character.hp) > effectiveMaxHp()) character.hp = effectiveMaxHp();
  if (down && !character.conditions.includes("Unconscious")) {
    character.conditions.push("Unconscious");
    character.autoUnconscious = true;
    // Falling unconscious also drops you prone; waking up does not stand you up.
    if (!character.conditions.includes("Prone")) character.conditions.push("Prone");
  }
  if (!down && character.autoUnconscious) {
    character.conditions = character.conditions.filter(condition => condition !== "Unconscious");
    character.autoUnconscious = false;
  }
  // Custom class and feat definitions travel with the sheet (sync, export, DM view).
  character.customContent = embeddedCustomContent(character);
  // Concentration saves still owed travel with the sheet (party cards, other tabs).
  character.pendingConcentration = concentrationQueue();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(character));
  characterLibrary[character.sheetId] = structuredCloneSafe(character);
  saveCharacterLibrary();
  queueSyncUpload();
  queueCloudSave();
}

function persistAndRender() {
  persist();
  renderAll();
}

// Max HP after temporary reductions (life drain and similar), which a long rest clears.
// Exhaustion 4+ halves the maximum (PHB p.291).
function effectiveMaxHp(target = character) {
  // maxHpBonus: Aid and Heroes' Feast raise the maximum until a long rest.
  const max = Math.max(0, Number(target.maxHp || 0) + Number(target.maxHpBonus || 0) - Number(target.maxHpReduction || 0));
  return Number(target.exhaustion || 0) >= 4 ? Math.floor(max / 2) : max;
}

function duplicateCharacter() {
  character = { ...structuredCloneSafe(character), sheetId: crypto.randomUUID(), name: `${character.name || "Character"} Copy` };
  persistAndRender();
}

function deleteCharacter() {
  showToast(`<span class="toast-label">Delete ${escapeHtml(character.name || "this character")}?</span><span>This removes the character from the library and can't be undone.</span>`, {
    tone: "fumble",
    actions: [{ label: "Delete", run: confirmDeleteCharacter }],
    persist: true
  });
}

function confirmDeleteCharacter() {
  const name = character.name || "Character";
  deleteCharacterFromCloud(character.sheetId);
  removedSheetIds.add(character.sheetId);
  delete characterLibrary[character.sheetId];
  const remaining = Object.values(characterLibrary);
  character = remaining.length ? normalizeCharacter(remaining[0]) : defaultCharacter();
  persistAndRender();
  showToast(`<span class="toast-label">${escapeHtml(name)} deleted</span>`);
}

// Opening a sheet only views it; nothing is saved (and no one else's sheet gets a new timestamp) until it changes.
function switchToSheet(sheetId) {
  const next = characterLibrary[sheetId];
  if (!next) return;
  character = normalizeCharacter(next);
  try {
    sessionStorage.setItem(ACTIVE_TAB_SHEET_KEY, sheetId);
  } catch {
    // Per-tab memory is optional.
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(character));
  renderAll();
  showToast(`<span class="toast-label">Now viewing ${escapeHtml(character.name || "character")}</span>`);
}

function switchCharacter(event) {
  switchToSheet(event.target.value);
}

function resetCharacter() {
  showToast(`<span class="toast-label">Start a blank sheet?</span><span>${escapeHtml(character.name || "The current character")} stays in the library.</span>`, {
    actions: [{
      label: "Blank sheet",
      run: () => {
        character = defaultCharacter();
        persistAndRender();
      }
    }],
    persist: true
  });
}

// all: every character on this device (a backup); otherwise just the open character.
function exportCharacterJson(all = false) {
  const payload = all ? { character, characterLibrary } : { character };
  downloadFile(`${slug(all ? "forgesheet-backup" : character.name || "character")}.json`, JSON.stringify(payload, null, 2), "application/json");
}

function downloadFile(name, content, type) {
  const url = URL.createObjectURL(content instanceof Blob ? content : new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function importCharacterJson(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  try {
    applyImportedData(JSON.parse(await file.text()));
  } catch {
    showToast(`<span class="toast-label">Couldn't import ${escapeHtml(file.name)}</span><span>It isn't valid ForgeSheet JSON.</span>`, { tone: "fumble" });
  }
}

// Shared by JSON and ForgeSheet PDF imports. Imported characters join the library; nothing local is dropped.
function applyImportedData(data) {
  const imported = data.characterLibrary ? Object.values(data.characterLibrary) : [];
  const main = data.character || (data.name || data.classId ? data : null);
  if (!main && !imported.length) throw new Error("no character in file");
  imported.forEach(item => {
    const next = normalizeCharacter(item);
    characterLibrary[next.sheetId] = next;
  });
  if (main) character = normalizeCharacter(main);
  persistAndRender();
  showToast(`<span class="toast-label">Imported ${escapeHtml(main?.name || `${imported.length} characters`)}</span>`);
}

function renderCharacterManager() {
  const select = document.querySelector("#characterLibrarySelect");
  const characters = Object.values(characterLibrary).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  select.innerHTML = characters.map(item => `<option value="${item.sheetId}">${escapeHtml(item.name || "Unnamed")} - ${escapeHtml(classLabel(item))}</option>`).join("");
  select.value = character.sheetId;
  document.querySelector("#autosaveStatus").textContent = `Autosaved ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  document.querySelector("#themeSelect").value = document.body.dataset.theme;
}

function handleThemeSelect(event) {
  document.body.dataset.theme = THEMES.includes(event.target.value) ? event.target.value : "light";
  localStorage.setItem(THEME_KEY, document.body.dataset.theme);
  renderCharacterManager();
}

function applyCustomBackground() {
  const data = localStorage.getItem(BACKGROUND_KEY);
  document.body.classList.toggle("custom-bg", Boolean(data));
  document.body.style.setProperty("--custom-bg", data ? `url(${data})` : "none");
  document.querySelector("#backgroundUpload").textContent = data ? "Clear backdrop image" : "Set backdrop image…";
}

function handleBackgroundButton() {
  if (localStorage.getItem(BACKGROUND_KEY)) {
    localStorage.removeItem(BACKGROUND_KEY);
    applyCustomBackground();
    return;
  }
  document.querySelector("#backgroundFile").click();
}

function handleBackgroundFile(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    const scale = Math.min(1, 1920 / img.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(img.src);
    try {
      localStorage.setItem(BACKGROUND_KEY, canvas.toDataURL("image/jpeg", 0.82));
    } catch {
      document.querySelector("#autosaveStatus").textContent = "Backdrop image too large to store.";
      return;
    }
    applyCustomBackground();
  };
  img.src = URL.createObjectURL(file);
}

function mod(ability) {
  // Wild Shape: STR, DEX and CON come from the beast when its scores are entered (PHB p.67).
  const beast = ["str", "dex", "con"].includes(ability) && Number(character.wildShape?.[ability]);
  return Math.floor(((beast || effectiveScore(ability)) - 10) / 2);
}

// A magic item works once worn or wielded, and only after attuning if it needs attunement (DMG p.136-138).
function itemAttunedIfNeeded(item) {
  return !/attunement/i.test(item.notes || "") || Boolean(item.attuned);
}

function itemActive(item) {
  return (item.equipped || item.container === "equipped") && itemAttunedIfNeeded(item);
}

// Two copies of the same item don't add their bonuses together (DMG p.252).
function uniqueActiveItems(source = character) {
  const seen = new Set();
  return (source.equipment || []).filter(itemActive).filter(item => {
    const key = String(item.name || "").toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const ABILITY_WORDS = { str: "strength", dex: "dexterity", con: "constitution", int: "intelligence", wis: "wisdom", cha: "charisma" };

// Items that set a score ("Sets Strength to 19": no effect if yours is higher), then items that raise it
// ("+2 Strength, max 20", Ioun stones).
function effectiveScore(ability, source = character) {
  const raw = Number(source.abilities?.[ability] || 10);
  const word = ABILITY_WORDS[ability];
  if (!word) return raw;
  const items = uniqueActiveItems(source).map(item => String(item.notes || ""));
  const set = Math.max(raw, ...items.map(notes => Number(notes.match(new RegExp(`sets (?:your )?${word}(?: score)? to (\\d+)`, "i"))?.[1] || 0)));
  return items.reduce((score, notes) => {
    const raise = notes.match(new RegExp(`\\+(\\d+) (?:to )?(?:your )?${word}[^.]*?max(?:imum)?(?: of)? (\\d+)`, "i"));
    return raise && score < Number(raise[2]) ? Math.min(Number(raise[2]), score + Number(raise[1])) : score;
  }, set);
}

function proficiencyBonus(level = totalLevel()) {
  return Math.ceil(level / 4) + 1;
}

// Matches a feat by name ("Strike of the Giants") or exact entry ("Strike of the Giants (Fire)"); species and
// background feats count too.
function hasFeat(name, source = character) {
  return takenFeatEntries(source).some(entry => entry === name || featBaseName(entry) === name);
}

// Dragonmarked subraces (ERLW) keep their parent race's traits: the species name plus that race, for trait tests.
const SPECIES_BASE = {
  "Mark of Healing": "halfling", "Mark of Hospitality": "halfling", "Mark of Warding": "dwarf", "Mark of Scribing": "gnome",
  "Mark of Shadow": "elf", "Mark of Detection": "half-elf", "Mark of Storm": "half-elf", "Mark of Making": "human",
  "Mark of Passage": "human", "Mark of Sentinel": "human", "Mark of Handling": "human", "Mark of Finding": "human"
};
function speciesLineage(source = character) {
  const species = source.species || "";
  return `${species} ${SPECIES_BASE[species] || ""}`.trim();
}

// Bards from 2nd level add half proficiency to any ability check they aren't proficient in.
function jackOfAllTrades() {
  return classLevel("bard") >= 2 ? Math.floor(proficiencyBonus() / 2) : 0;
}

// Champion 7+: half proficiency, rounded up, to STR, DEX and CON checks you aren't proficient in.
function remarkableAthlete(ability) {
  return subclassLevel("champion") >= 7 && ["str", "dex", "con"].includes(ability)
    ? Math.ceil(proficiencyBonus() / 2)
    : 0;
}

// The bonus an untrained ability check gets (the two features don't stack; the higher applies).
function untrainedBonus(ability) {
  return Math.max(jackOfAllTrades(), remarkableAthlete(ability));
}

function skillBonus(skill, ability) {
  // Beguiling Influence (PHB p.110) grants Deception and Persuasion while the invocation is known.
  const beguiling = ["deception", "persuasion"].includes(skill) && classLevel("warlock") > 0 && typeof hasInvocation === "function" && hasInvocation("Beguiling Influence");
  const proficient = beguiling || character.proficientSkills.includes(skill);
  const expert = (character.expertSkills || []).includes(skill);
  return mod(ability) + (proficient ? proficiencyBonus() * (expert ? 2 : 1) : untrainedBonus(ability));
}

function initiativeBonus() {
  return mod("dex") + untrainedBonus("dex") + (hasFeat("Alert") ? 5 : 0) + initiativeFeatureBonus() + customFeatModifier("initiative");
}

// Dread Ambusher (+WIS, XGE p.42), Rakish Audacity (+CHA, XGE p.47), Tactical Wit (+INT, XGE p.60),
// Hare-Trigger (+proficiency, WBtW).
function initiativeFeatureBonus() {
  return (subclassLevel("gloom-stalker") >= 3 ? mod("wis") : 0)
    + (subclassLevel("swashbuckler") >= 3 ? mod("cha") : 0)
    + (subclassLevel("war-magic") >= 2 ? mod("int") : 0)
    + (/harengon/i.test(character.species || "") ? proficiencyBonus() : 0);
}

// "+1 Longsword", "Shield +2": a magic bonus written in the item name.
function itemMagicBonus(item) {
  if (!itemAttunedIfNeeded(item || {})) return 0;
  return Number(item?.magicBonus || String(item?.name || "").match(/(?:^|\s)\+(\d)(?:\s|$)/)?.[1] || 0);
}

// AC from equipped gear: body armor ("AC 14 + Dex modifier, max 2"), shields and magic "+N AC" bonuses.
function calculatedArmorClass() {
  if (Number(character.wildShape?.ac)) return Number(character.wildShape.ac);
  const worn = (character.equipment || []).filter(item => item.equipped || item.container === "equipped");
  const usable = item => !/attunement/i.test(item.notes || "") || item.attuned;
  // Tortles can't wear armor (their shell is the base AC); a worn suit is ignored.
  const armor = character.species === "Tortle" ? null : worn.find(item => /\bAC\s+\d+/i.test(item.notes || ""));
  const dex = mod("dex");
  let ac;
  if (armor) {
    const notes = armor.notes;
    const base = Number(notes.match(/\bAC\s+(\d+)/i)[1]);
    const addsDex = /\+\s*Dex/i.test(notes);
    // Medium Armor Master (PHB p.168): medium armor takes up to +3 DEX instead of +2.
    const cap = notes.match(/max\s+(\d+)/i) && Number(notes.match(/max\s+(\d+)/i)[1]) + (hasFeat("Medium Armor Master") && /medium armor/i.test(notes) ? 1 : 0);
    ac = base + (addsDex ? (cap ? Math.min(dex, cap) : dex) : 0) + itemMagicBonus(armor);
    if (typeof hasStyle === "function" && hasStyle("Defense")) ac += 1;
  } else {
    const shield = worn.some(item => /shield/i.test(item.name || ""));
    // Unarmored options don't stack; take the best one the character qualifies for.
    const options = [10 + dex];
    // Unarmored Defense can't be gained twice (PHB p.164): only the first barbarian or monk class's version counts.
    const unarmored = classEntries().find(entry => ["barbarian", "monk"].includes(entry.classId))?.classId;
    if (unarmored === "barbarian") options.push(10 + dex + mod("con"));
    if (unarmored === "monk" && !shield) options.push(10 + dex + mod("wis"));
    if (subclassLevel("draconic")) options.push(13 + dex);
    if (character.mageArmor) options.push(13 + dex);
    // Dragon Hide (XGE p.74): 13 + DEX without armor.
    if (hasFeat("Dragon Hide")) options.push(13 + dex);
    // Natural armor (VGtM, ERLW, Locathah Rising): a base that still allows a shield.
    const natural = { Tortle: 17, Lizardfolk: 13 + dex, Loxodon: 12 + mod("con"), Locathah: 12 + dex, Autognome: 13 + dex, "Thri-kreen": 13 + dex }[character.species];
    if (natural) options.push(natural);
    ac = Math.max(...options);
  }
  // Dual Wielder (PHB p.165): +1 while wielding a melee weapon in each hand. Revenant Blade (ERLW p.54): +1 while
  // wielding a double-bladed scimitar with two hands.
  const meleeWeapons = worn.filter(item => /melee weapon/i.test(item.notes || "")).length;
  if (hasFeat("Dual Wielder") && meleeWeapons >= 2) ac += 1;
  if (hasFeat("Revenant Blade") && worn.some(item => /double-bladed scimitar/i.test(item.name || ""))) ac += 1;
  const shielded = worn.some(item => /shield/i.test(item.name || ""));
  worn.filter(usable).filter(item => uniqueActiveItems().includes(item)).forEach(item => {
    // Bracers of Defense: only with no armor and no shield.
    if (/bracers of defense/i.test(item.name || "") && (armor || shielded)) return;
    const bonus = String(item.notes || "").match(/\+(\d+)\s*AC/i);
    if (bonus) ac += Number(bonus[1]);
    if (item !== armor && /shield/i.test(item.name || "")) ac += itemMagicBonus(item);
  });
  if (typeof featureAcBonus === "function") ac += featureAcBonus(armor, worn);
  // Warforged Integrated Protection (ERLW p.36): +1 with or without armor.
  if (/warforged/i.test(character.species || "")) ac += 1;
  return ac + customFeatModifier("ac", Boolean(armor));
}

// Works for any stored character (Party and sync views), not only the open sheet.
function passivePerception(source = character) {
  const wisMod = Math.floor((effectiveScore("wis", source) - 10) / 2);
  const proficient = source.proficientSkills?.includes("perception");
  const multiplier = source.expertSkills?.includes("perception") ? 2 : 1;
  const prof = proficiencyBonus(totalLevel(source));
  const jack = !proficient && classLevel("bard", source) >= 2 ? Math.floor(prof / 2) : 0;
  return 10 + wisMod + (proficient ? prof * multiplier : jack) + (hasFeat("Observant", source) ? 5 : 0) + passiveRollModeBonus("wis", "perception", source) + customFeatModifier("passive", "perception", source);
}

// PHB p.175: advantage on the check adds 5 to the passive score, disadvantage subtracts 5 (they cancel).
function passiveRollModeBonus(ability, skill, source = character) {
  const conditions = source.conditions || [];
  const against = ["Poisoned", "Frightened"].some(name => conditions.includes(name)) || Number(source.exhaustion || 0) >= 1
    || (heavilyEncumbered(source) && ["str", "dex", "con"].includes(ability));
  // Pallid Elf Incisive Sense: advantage on Investigation and Insight.
  const helped = (source.raging && ability === "str") || (/pallid elf/i.test(source.species || "") && ["investigation", "insight"].includes(skill));
  return helped === against ? 0 : helped ? 5 : -5;
}
