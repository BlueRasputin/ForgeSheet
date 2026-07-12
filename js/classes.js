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
  ranger: classDef("ranger", "Ranger", 10, "halfRoundDown", "wis", "known", ["ranger"], 1, 0),
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

let customClasses = loadCustomClasses();
let classBuilderDraft = null;
let officialSubclasses = OFFICIAL_SUBCLASS_FALLBACK;
let subclassApiStatus = "fallback";

function loadCustomClasses() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_CLASS_KEY)) || {};
  } catch {
    return {};
  }
}

function getClasses() {
  return { ...BUILT_IN_CLASSES, ...customClasses };
}

function currentClass() {
  return getClasses()[character.classId] || BUILT_IN_CLASSES.artificer;
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

function asiLevelsFor(cls = currentClass()) {
  return new Set([...ASI_LEVELS, ...(CLASS_EXTRA_ASI_LEVELS[cls.id] || [])]);
}

function preparedLimitFor(cls, level = character.level) {
  if (cls.preparedFormula === "none") return 0;
  if (cls.preparedFormula === "known") return character.spells.filter(row => row.index).length;
  if (cls.preparedFormula === "levelPlusMod") return Math.max(1, level + mod(cls.spellAbility));
  if (cls.preparedFormula === "halfLevelPlusMod") return Math.max(1, Math.floor(level / 2) + mod(cls.spellAbility));
  return 0;
}

function startCustomClassDraft() {
  classBuilderDraft = {
    id: "",
    name: "",
    hitDie: 8,
    casterType: "none",
    spellAbility: "int",
    preparedFormula: "none",
    spellSources: [],
    table: makeTable({
      1: ["Starting features", 0, 0],
      4: ["Ability score improvement", 0, 0],
      8: ["Ability score improvement", 0, 0],
      12: ["Ability score improvement", 0, 0],
      16: ["Ability score improvement", 0, 0],
      19: ["Ability score improvement", 0, 0]
    })
  };
  activateTab("classes");
  renderBuilder();
  renderClassTable();
}

function renderBuilder() {
  const cls = classBuilderDraft || currentClass();
  setValue("builderName", cls.name);
  setValue("builderHitDie", String(cls.hitDie));
  setValue("builderCasterType", cls.casterType);
  setValue("builderSpellAbility", cls.spellAbility || "int");
  setValue("builderPreparedFormula", cls.preparedFormula || "none");
  setValue("builderSpellSources", (cls.spellSources || []).join(", "));
  setValue("builderTable", cls.table.map(row => `${row.level}, ${row.features || ""}, ${row.newSpells || 0}, ${row.cantrips || 0}`).join("\n"));
}

function renderClassTable() {
  const cls = classBuilderDraft || currentClass();
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
  saveClassToCloud(customClasses[id]);
  character.classId = id;
  classBuilderDraft = null;
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
