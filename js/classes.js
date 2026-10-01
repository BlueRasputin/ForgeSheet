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
      14: ["Magic item savant", 0, 1],
      15: ["Specialist feature", 0, 0],
      16: ["Ability score improvement", 0, 0],
      17: ["Feature improvement", 0, 0],
      18: ["Magic item master", 0, 0],
      19: ["Ability score improvement", 0, 0],
      20: ["Capstone feature", 0, 0]
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
    13: "Blood maledict (3 uses)",
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

// Cumulative spells known by class level for subclass-granted casting.
const THIRD_CASTER_KNOWN = [0, 0, 3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13];
const PROFANE_SOUL_KNOWN = [0, 0, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 11];

// Martial subclasses that make their class a caster.
const SUBCLASS_CASTING = {
  "eldritch-knight": { casterType: "third", spellAbility: "int", preparedFormula: "known", spellSources: ["wizard"], knownTable: THIRD_CASTER_KNOWN, cantripTable: subclassCantrips(2) },
  "arcane-trickster": { casterType: "third", spellAbility: "int", preparedFormula: "known", spellSources: ["wizard"], knownTable: THIRD_CASTER_KNOWN, cantripTable: subclassCantrips(3) },
  "profane-soul": { casterType: "pactThird", spellAbility: "int", preparedFormula: "known", spellSources: ["warlock"], knownTable: PROFANE_SOUL_KNOWN, cantripTable: subclassCantrips(2) }
};

// Subclass casters learn cantrips at 3rd level and one more at 10th.
function subclassCantrips(start) {
  return Array.from({ length: 20 }, (_, index) => index + 1 < 3 ? 0 : index + 1 >= 10 ? start + 1 : start);
}

function cantripCap(cls = currentClass(), level = character.level) {
  if (cls.cantripTable) return cls.cantripTable[level - 1] || 0;
  return (cls.table || []).slice(0, level).reduce((sum, row) => sum + Number(row.cantrips || 0), 0);
}

function currentClass() {
  const cls = getClasses()[character.classId] || BUILT_IN_CLASSES.artificer;
  const casting = cls.casterType === "none" ? lookupBySubclass(SUBCLASS_CASTING) : null;
  return casting ? { ...cls, ...casting } : cls;
}

function isPactCaster(cls = currentClass()) {
  return cls.casterType === "warlock" || cls.casterType === "pactThird";
}

function knownSpellCap(cls = currentClass(), level = character.level) {
  const table = cls.knownTable || KNOWN_SPELLS[cls.id];
  return table ? table[level - 1] || 0 : null;
}

function spellSlotsFor(cls, level = character.level) {
  if (cls.casterType === "none") return [];
  if (isPactCaster(cls)) {
    // Profane Soul pact magic tracks the warlock table at a third of blood hunter level, starting at 3rd.
    const pact = cls.casterType === "pactThird" ? (level < 3 ? null : WARLOCK_SLOTS[Math.ceil(level / 3)]) : WARLOCK_SLOTS[level];
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
  return spellSlotsFor(cls, level).reduce((highest, count, index) => count > 0 ? index + 1 : highest, 0);
}

function asiLevelsFor(cls = currentClass()) {
  return new Set([...ASI_LEVELS, ...(CLASS_EXTRA_ASI_LEVELS[cls.id] || [])]);
}

function preparedLimitFor(cls, level = character.level) {
  if (cls.preparedFormula === "none") return 0;
  if (cls.preparedFormula === "known") return knownSpellCap(cls, level) ?? character.spells.filter(row => row.index).length;
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
  renderBuilder();
  renderClassTable();
  document.querySelector("#classBuilderDialog").showModal();
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
      <td>${escapeHtml(row.features || "-")}</td>
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
    const parts = line.split(",");
    const number = Number(parts[0]);
    const numeric = parts.length >= 4 ? parts.slice(-2) : ["0", "0"];
    const features = (parts.length >= 4 ? parts.slice(1, -2) : parts.slice(1)).join(",").trim();
    if (number >= 1 && number <= 20) rows[number] = [features, Number(numeric[0]) || 0, Number(numeric[1]) || 0];
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
    detail.innerHTML = `<p class="muted">Custom mode lets you type any subclass name and track its features in the sections below.</p>`;
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
    <div><span>Class</span><strong>${escapeHtml(official.className)}</strong></div>
    <div><span>Subclass Type</span><strong>${escapeHtml(official.flavor || "Subclass")}</strong></div>
    <p>${escapeHtml(truncate((official.desc || []).join(" "), 380)) || (subclassApiStatus === "ready" ? "This subclass isn't in the free SRD, so no description is bundled. Record its features in the sections below." : "Description will appear when API details finish loading.")}</p>
  `;
  if (!(official.desc || []).length) loadOfficialSubclassDetail(official.index);
}

function applyOfficialSubclass(index) {
  character.subclass.officialIndex = index || "";
  if (index) character.subclass.mode = "official";
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
