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
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored) return normalizeCharacter(stored);
    const library = Object.values(JSON.parse(localStorage.getItem(CHARACTER_LIBRARY_KEY)) || {});
    const latest = library.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
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
  if (!latest) characterLibrary[character.sheetId] = character;
  else if ((latest.updatedAt || 0) > (character.updatedAt || 0)) character = latest;
  renderAll();
});

function ensureCharacterInLibrary() {
  characterLibrary[character.sheetId] = structuredCloneSafe(character);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(character));
  saveCharacterLibrary();
}

function persist() {
  character = normalizeCharacter(character);
  character.updatedAt = Date.now();
  const down = Number(character.hp) <= 0;
  if (!down) {
    character.deathSaveSuccesses = 0;
    character.deathSaveFailures = 0;
  }
  if (down && !character.conditions.includes("Unconscious")) {
    character.conditions.push("Unconscious");
    character.autoUnconscious = true;
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

function duplicateCharacter() {
  character = { ...structuredCloneSafe(character), sheetId: crypto.randomUUID(), name: `${character.name || "Character"} Copy` };
  persistAndRender();
}

function deleteCharacter() {
  if (!confirm(`Delete ${character.name || "this character"} from the library?`)) return;
  deleteCharacterFromCloud(character.sheetId);
  removedSheetIds.add(character.sheetId);
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

function resetCharacter() {
  if (!confirm("Reset this character sheet?")) return;
  character = defaultCharacter();
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

function skillBonus(skill, ability) {
  const proficient = character.proficientSkills.includes(skill);
  const expert = (character.expertSkills || []).includes(skill);
  return mod(ability) + (proficient ? proficiencyBonus() * (expert ? 2 : 1) : 0);
}

function passivePerception(source = character) {
  const wisdom = source.abilities?.wis ?? 10;
  const wisMod = Math.floor((wisdom - 10) / 2);
  const multiplier = source.expertSkills?.includes("perception") ? 2 : 1;
  return 10 + wisMod + (source.proficientSkills?.includes("perception") ? proficiencyBonus(source.level) * multiplier : 0);
}
