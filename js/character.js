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
    rollHistory: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: 25, pp: 0 },
    hitDiceUsed: 0,
    concentration: "",
    resources: [
      { id: crypto.randomUUID(), name: "Infusions", current: 2, max: 2, reset: "long" }
    ],
    equipment: [
      { id: crypto.randomUUID(), name: "Scale Mail", quantity: 1, weight: 45, container: "equipped", equipped: true, attuned: false, notes: "Armor" },
      { id: crypto.randomUUID(), name: "Smith's Tools", quantity: 1, weight: 8, container: "backpack", equipped: false, attuned: false, notes: "Tool proficiency" }
    ],
    classOptions: [
      { id: crypto.randomUUID(), kind: "infusion", name: "Enhanced Defense", current: 1, max: 1, reset: "long", notes: "Record infused item and bonus here." }
    ],
    planner: { multiclass: [], feats: [] },
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

function normalizeCharacter(value) {
  const base = defaultCharacter();
  const stored = value || {};
  return {
    ...base,
    ...stored,
    sheetId: stored.sheetId || base.sheetId,
    maxHp: stored.maxHp || stored.hp || base.maxHp,
    tempHp: clamp(Number(stored.tempHp || 0), 0, 999),
    inspiration: clamp(Number(stored.inspiration || 0), 0, 99),
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
    equipment: stored.equipment || base.equipment,
    classOptions: stored.classOptions || base.classOptions,
    planner: {
      multiclass: stored.planner?.multiclass || base.planner.multiclass,
      feats: stored.planner?.feats || base.planner.feats
    },
    restLog: stored.restLog || base.restLog,
    conditions: stored.conditions || base.conditions,
    exhaustion: Number(stored.exhaustion || 0),
    actions: stored.actions || base.actions,
    spellSlotUsage: stored.spellSlotUsage || base.spellSlotUsage
  };
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
  if (!down) {
    character.deathSaveSuccesses = 0;
    character.deathSaveFailures = 0;
  }
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
  const max = Math.max(0, Number(target.maxHp || 0) - Number(target.maxHpReduction || 0));
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
    duration: 10000
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
    duration: 10000
  });
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
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    showToast(`<span class="toast-label">Couldn't import ${escapeHtml(file.name)}</span><span>It isn't valid ForgeSheet JSON.</span>`, { tone: "fumble" });
    event.target.value = "";
    return;
  }
  if (data.characterLibrary) {
    characterLibrary = Object.fromEntries(Object.entries(data.characterLibrary).map(([id, item]) => [id, normalizeCharacter(item)]));
  }
  if (data.character) character = normalizeCharacter(data.character);
  else if (data.name || data.classId) character = normalizeCharacter(data);
  persistAndRender();
  event.target.value = "";
}

function renderCharacterManager() {
  const select = document.querySelector("#characterLibrarySelect");
  const characters = Object.values(characterLibrary).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  select.innerHTML = characters.map(item => `<option value="${item.sheetId}">${escapeHtml(item.name || "Unnamed")} - ${escapeHtml(getClasses()[item.classId]?.name || "Class")} ${item.level || 1}</option>`).join("");
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
  return Math.floor(((character.abilities[ability] || 10) - 10) / 2);
}

function proficiencyBonus(level = character.level) {
  return Math.ceil(level / 4) + 1;
}

function hasFeat(name, source = character) {
  return (source.planner?.feats || []).includes(name);
}

// Bards from 2nd level add half proficiency to any ability check they aren't proficient in.
function jackOfAllTrades() {
  return currentClass().id === "bard" && character.level >= 2 ? Math.floor(proficiencyBonus() / 2) : 0;
}

// Champion 7+: half proficiency, rounded up, to STR, DEX and CON checks you aren't proficient in.
function remarkableAthlete(ability) {
  return currentClass().id === "fighter" && character.level >= 7 && lookupBySubclass({ champion: true }) && ["str", "dex", "con"].includes(ability)
    ? Math.ceil(proficiencyBonus() / 2)
    : 0;
}

// The bonus an untrained ability check gets (the two features don't stack; the higher applies).
function untrainedBonus(ability) {
  return Math.max(jackOfAllTrades(), remarkableAthlete(ability));
}

function skillBonus(skill, ability) {
  const proficient = character.proficientSkills.includes(skill);
  const expert = (character.expertSkills || []).includes(skill);
  return mod(ability) + (proficient ? proficiencyBonus() * (expert ? 2 : 1) : untrainedBonus(ability));
}

function initiativeBonus() {
  return mod("dex") + untrainedBonus("dex") + (hasFeat("Alert") ? 5 : 0);
}

// "+1 Longsword", "Shield +2": a magic bonus written in the item name.
function itemMagicBonus(item) {
  return Number(String(item?.name || "").match(/(?:^|\s)\+(\d)(?:\s|$)/)?.[1] || 0);
}

// AC from equipped gear: body armor ("AC 14 + Dex modifier, max 2"), shields and magic "+N AC" bonuses.
function calculatedArmorClass() {
  const worn = (character.equipment || []).filter(item => item.equipped || item.container === "equipped");
  const usable = item => !/attunement/i.test(item.notes || "") || item.attuned;
  const armor = worn.find(item => /\bAC\s+\d+/i.test(item.notes || ""));
  const dex = mod("dex");
  let ac;
  if (armor) {
    const notes = armor.notes;
    const base = Number(notes.match(/\bAC\s+(\d+)/i)[1]);
    const addsDex = /\+\s*Dex/i.test(notes);
    const cap = notes.match(/max\s+(\d+)/i);
    ac = base + (addsDex ? (cap ? Math.min(dex, Number(cap[1])) : dex) : 0) + itemMagicBonus(armor);
    if (typeof fightingStyle === "function" && fightingStyle() === "Defense") ac += 1;
  } else {
    const shield = worn.some(item => /shield/i.test(item.name || ""));
    const id = currentClass().id;
    // Unarmored options don't stack; take the best one the character qualifies for.
    const options = [10 + dex];
    if (id === "barbarian") options.push(10 + dex + mod("con"));
    if (id === "monk" && !shield) options.push(10 + dex + mod("wis"));
    if (id === "sorcerer" && lookupBySubclass({ draconic: true })) options.push(13 + dex);
    if (character.mageArmor) options.push(13 + dex);
    // Natural armor (VGtM, ERLW, Locathah Rising): a base that still allows a shield.
    const natural = { Tortle: 17, Lizardfolk: 13 + dex, Loxodon: 12 + mod("con"), Locathah: 12 + dex }[character.species];
    if (natural) options.push(natural);
    ac = Math.max(...options);
  }
  worn.filter(usable).forEach(item => {
    const bonus = String(item.notes || "").match(/\+(\d+)\s*AC/i);
    if (bonus) ac += Number(bonus[1]);
    if (item !== armor && /shield/i.test(item.name || "")) ac += itemMagicBonus(item);
  });
  return ac;
}

// Works for any stored character (Party and sync views), not only the open sheet.
function passivePerception(source = character) {
  const wisdom = source.abilities?.wis ?? 10;
  const wisMod = Math.floor((wisdom - 10) / 2);
  const proficient = source.proficientSkills?.includes("perception");
  const multiplier = source.expertSkills?.includes("perception") ? 2 : 1;
  const prof = proficiencyBonus(source.level);
  const jack = !proficient && source.classId === "bard" && source.level >= 2 ? Math.floor(prof / 2) : 0;
  return 10 + wisMod + (proficient ? prof * multiplier : jack) + (hasFeat("Observant", source) ? 5 : 0);
}
