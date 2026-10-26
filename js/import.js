let pendingImport = null;

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
    const pdf = await openPdf(file);
    const embedded = await embeddedForgeSheetData(pdf);
    if (embedded) {
      document.querySelector("#importDialog").close();
      applyImportedData(embedded);
      return;
    }
    const form = await pdfFormFields(pdf);
    if (isOfficialSheet(form)) {
      pendingImport = parseOfficialSheet(form);
      status.textContent = `Read ${Object.keys(form).length} form fields from ${file.name} (official 5e character sheet).`;
      renderImportPreview(pendingImport);
      document.querySelector("#applySheetImport").disabled = false;
      return;
    }
    const text = await extractTextFromPdf(pdf);
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

async function openPdf(file) {
  const pdfjs = await import(PDFJS_URL);
  pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
  const data = new Uint8Array(await file.arrayBuffer());
  return pdfjs.getDocument({ data }).promise;
}

async function extractTextFromPdf(pdf) {
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

// Every form field by name: checkboxes as true/false, text trimmed. Names are trimmed and single-spaced
// ("Wpn2 AtkBonus  " becomes "Wpn2 AtkBonus"); the first field with a repeated name wins.
async function pdfFormFields(pdf) {
  const fields = {};
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    (await page.getAnnotations()).filter(item => item.fieldName).forEach(item => {
      const name = item.fieldName.trim().replace(/\s+/g, " ");
      if (name in fields) return;
      fields[name] = item.checkBox ? Boolean(item.fieldValue) && item.fieldValue !== "Off" : String(item.fieldValue ?? "").trim();
    });
  }
  return fields;
}

// The official fillable sheet (5E_CharacterSheet_Fillable.pdf). Its boxes have fixed names, so nothing is guessed.
function isOfficialSheet(form) {
  return "CharacterName" in form && "ClassLevel" in form && "Check Box 23" in form;
}

// Page 3, measured from the form's layout: each spell level's text fields top to bottom, and the
// "prepared" checkbox beside each one. Cantrips have no checkboxes.
const OFFICIAL_SPELL_FIELDS = [
  [0, "1014 1016 1017 1018 1019 1020 1021 1022", ""],
  [1, "1015 1023 1024 1025 1026 1027 1028 1029 1030 1031 1032 1033", "251 309 3010 3011 3012 3013 3014 3015 3016 3017 3018 3019"],
  [2, "1046 1034 1035 1036 1037 1038 1039 1040 1041 1042 1043 1044 1045", "313 310 3020 3021 3022 3023 3024 3025 3026 3027 3028 3029 3030"],
  [3, "1048 1047 1049 1050 1051 1052 1053 1054 1055 1056 1057 1058 1059", "315 314 3031 3032 3033 3034 3035 3036 3037 3038 3039 3040 3041"],
  [4, "1061 1060 1062 1063 1064 1065 1066 1067 1068 1069 1070 1071 1072", "317 316 3042 3043 3044 3045 3046 3047 3048 3049 3050 3051 3052"],
  [5, "1074 1073 1075 1076 1077 1078 1079 1080 1081", "319 318 3053 3054 3055 3056 3057 3058 3059"],
  [6, "1083 1082 1084 1085 1086 1087 1088 1089 1090", "321 320 3060 3061 3062 3063 3064 3065 3066"],
  [7, "1092 1091 1093 1094 1095 1096 1097 1098 1099", "323 322 3067 3068 3069 3070 3071 3072 3073"],
  [8, "10101 10100 10102 10103 10104 10105 10106", "325 324 3074 3075 3076 3077 3078"],
  [9, "10108 10107 10109 101010 101011 101012 101013", "327 326 3079 3080 3081 3082 3083"]
];

// Page 1 checkboxes: saving throws STR..CHA, then the 18 skills in the sheet's (alphabetical) order.
const OFFICIAL_SAVE_BOXES = { str: 11, dex: 18, con: 19, int: 20, wis: 21, cha: 22 };
const OFFICIAL_SKILL_FIRST_BOX = 23;

function editDistance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const saved = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = saved;
    }
  }
  return row[b.length];
}

const looseKey = text => String(text || "").toLowerCase().replace(/[^a-z0-9]/g, "");

// Exact match first, then a near match (a typo or two) for names long enough not to collide.
function closestByName(items, text, nameOf = item => item.name) {
  const key = looseKey(text);
  if (!key) return null;
  const exact = items.find(item => looseKey(nameOf(item)) === key);
  if (exact || key.length < 6) return exact || null;
  let best = null;
  let bestDistance = 3;
  items.forEach(item => {
    const distance = editDistance(key, looseKey(nameOf(item)));
    if (distance < bestDistance) {
      best = item;
      bestDistance = distance;
    }
  });
  return best;
}

// "Armorer Artificier, 6" or "Fighter 3 / Wizard 2 (Evocation)": class, level and subclass per segment.
function parseClassLevel(text) {
  const classes = Object.values(getClasses());
  return String(text || "").split(/\/|;|\band\b/i).map(segment => {
    const words = segment.match(/[A-Za-z'-]+/g) || [];
    const cls = words.map(word => closestByName(classes, word)).find(Boolean);
    const level = Number(segment.match(/\d+/)?.[0] || 0);
    const subclassName = words.filter(word => closestByName(classes, word) !== cls && !/^(level|lvl)$/i.test(word)).join(" ");
    return cls ? { classId: cls.id, level: clamp(level || 1, 1, 20), subclassName } : null;
  }).filter(Boolean);
}

const numberIn = text => Number(String(text || "").match(/-?\d+/)?.[0] || 0);
const linesIn = text => String(text || "").split("\n").map(line => line.replace(/^\s*[-•*]\s*/, "").trim()).filter(Boolean);

function parseOfficialSheet(form) {
  const notes = [];
  const box = number => Boolean(form[`Check Box ${number}`]);
  const classes = parseClassLevel(form.ClassLevel);
  if (!classes.length) notes.push(`Couldn't find a class in "${form.ClassLevel}". Pick the class on the sheet after importing.`);
  const [primary, ...extra] = classes;
  const abilities = Object.fromEntries(ABILITIES.map(([id]) => [id, clamp(numberIn(form[id.toUpperCase()]) || 10, 1, 30)]));
  const spells = [];
  const unknownSpells = [];
  OFFICIAL_SPELL_FIELDS.forEach(([level, names, boxes]) => {
    const boxList = boxes.split(" ");
    names.split(" ").forEach((number, row) => {
      const name = form[`Spells ${number}`];
      if (!name) return;
      const match = closestByName(allSpells.filter(item => item.level === level), name) || closestByName(allSpells, name);
      const prepared = level > 0 && box(boxList[row]);
      if (match) spells.push({ id: crypto.randomUUID(), index: match.index, level: match.level, prepared });
      else {
        unknownSpells.push(name);
        spells.push({ id: crypto.randomUUID(), index: "", level, prepared, custom: { name, level, castingTime: "", range: "", duration: "", components: "", desc: "Imported from a PDF; add the details from your book." } });
      }
    });
  });
  // Ticks on the subclass's always-prepared spells (Armorer, Life Domain...) don't show the sheet tracks
  // preparation; without other ticks, the import prepares spells up to the class limit instead.
  const granted = Object.values(lookupBySubclass(SUBCLASS_SPELLS, primary?.subclassName) || {}).flat();
  const autoPrepare = !spells.some(row => row.prepared && !granted.includes(row.index));
  if (unknownSpells.length) notes.push(`Added as custom spells (not in the spell list): ${unknownSpells.join(", ")}.`);
  const actions = [["Wpn Name", "Wpn1 AtkBonus", "Wpn1 Damage"], ["Wpn Name 2", "Wpn2 AtkBonus", "Wpn2 Damage"], ["Wpn Name 3", "Wpn3 AtkBonus", "Wpn3 Damage"]]
    .filter(([name]) => form[name])
    .map(([name, bonus, damage]) => {
      const attack = String(form[bonus] || "").trim();
      return { id: crypto.randomUUID(), name: form[name], type: "Action", attack: /^\d/.test(attack) ? `+${attack}` : attack, damage: form[damage] || "", notes: "Imported" };
    });
  // Equipment lines that name a catalog item become inventory rows (weight, damage, AC); the rest stay as text.
  const catalog = [...ITEM_CATALOG];
  const equipment = [];
  const looseItems = [];
  linesIn(form.Equipment).forEach(line => {
    const item = closestByName(catalog, line);
    if (item) equipment.push(equipmentFromItemCard(item));
    else looseItems.push(line);
  });
  const hpMax = numberIn(form.HPMax);
  const hpCurrent = form.HPCurrent === "" ? hpMax : numberIn(form.HPCurrent);
  const details = [["Player", form.PlayerName], ["Experience", form.XP], ["Age", form.Age], ["Height", form.Height], ["Weight", form.Weight], ["Eyes", form.Eyes], ["Skin", form.Skin], ["Hair", form.Hair]]
    .filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`).join("\n");
  const section = (title, body) => body ? [{ id: crypto.randomUUID(), title, body }] : [];
  const imported = {
    name: form.CharacterName || "Imported character",
    classId: primary?.classId || character.classId,
    subclassName: primary?.subclassName || "",
    level: primary?.level || 1,
    multiclasses: extra.map(entry => ({ id: crypto.randomUUID(), classId: entry.classId, level: entry.level, subclassName: entry.subclassName, rules: "2014" })),
    species: form.Race || "",
    background: form.Background || "",
    alignment: form.Alignment || "",
    abilities,
    maxHp: hpMax || 1,
    hp: clamp(hpCurrent, 0, hpMax || 1),
    tempHp: numberIn(form.HPTemp),
    ac: numberIn(form.AC) || 10,
    acAuto: false,
    speed: numberIn(form.Speed) || 30,
    inspiration: form.Inspiration && !/^(no|off|0)$/i.test(form.Inspiration) ? numberIn(form.Inspiration) || 1 : 0,
    hitDice: form.HDTotal || "",
    saveProficiencies: Object.entries(OFFICIAL_SAVE_BOXES).filter(([, number]) => box(number)).map(([id]) => id),
    proficientSkills: SKILLS.filter((skill, index) => box(OFFICIAL_SKILL_FIRST_BOX + index)).map(([id]) => id),
    deathSaveSuccesses: [12, 13, 14].filter(box).length,
    deathSaveFailures: [15, 16, 17].filter(box).length,
    currency: Object.fromEntries(["cp", "sp", "ep", "gp", "pp"].map(coin => [coin, numberIn(form[coin.toUpperCase()])])),
    actions,
    attacks: form.AttacksSpellcasting || "",
    features: [form["Features and Traits"], form["Feat+Traits"]].filter(Boolean).join("\n\n"),
    equipment,
    inventory: [looseItems.join("\n"), form.Treasure ? `Treasure:\n${form.Treasure}` : ""].filter(Boolean).join("\n\n"),
    spells,
    backgroundDetails: { trait: form.PersonalityTraits || "", ideal: form.Ideals || "", bond: form.Bonds || "", flaw: form.Flaws || "" },
    notes: form.Backstory || "",
    noteSections: [
      ...section("Other proficiencies and languages", form.ProficienciesLang),
      ...section("Allies and organizations", [form.FactionName, form.Allies].filter(Boolean).join("\n")),
      ...section("Details", details)
    ]
  };
  const classText = classes.map(entry => `${getClasses()[entry.classId].name} ${entry.level}${entry.subclassName ? ` (${entry.subclassName})` : ""}`).join(" / ");
  return {
    character: imported,
    autoPrepare,
    notes,
    fields: {
      name: imported.name,
      class: classText || "not found",
      species: imported.species,
      hitPoints: `${imported.hp} / ${imported.maxHp}`,
      ac: imported.ac,
      speed: imported.speed,
      abilities,
      saves: imported.saveProficiencies.map(id => id.toUpperCase()),
      skills: imported.proficientSkills.map(id => SKILLS.find(([skill]) => skill === id)[1]),
      attacks: actions.map(action => `${action.name} ${action.attack} ${action.damage}`.trim()),
      spells: spells.map(row => `${row.custom?.name || allSpells.find(item => item.index === row.index)?.name || row.index}${granted.includes(row.index) ? " (always prepared)" : row.prepared ? " (prepared)" : ""}`),
      equipment: equipment.map(item => item.name),
      coins: Object.entries(imported.currency).filter(([, value]) => value).map(([coin, value]) => `${value} ${coin}`)
    }
  };
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
    /(?:character\s*name|\bname)\s*[:\-]\s*([^\n|]+)/i
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
    /alignment\s*[:\-]\s*(lawful good|neutral good|chaotic good|lawful neutral|true neutral|chaotic neutral|lawful evil|neutral evil|chaotic evil|neutral|\b[LNC][GNE]\b)/i
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

  const detectedSpells = detectKnownSpells(normalized);
  if (detectedSpells.length) fields.spells = detectedSpells;

  const saves = detectSaves(compact);
  if (saves.length) fields.saveProficiencies = saves;
  const attacks = detectAttackLines(normalized);
  if (attacks.length) fields.actions = attacks;

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
    root.innerHTML = `<p class="muted">${escapeHtml(result?.notes?.[0] || "No fields detected yet.")}</p>`;
    return;
  }
  const rows = Object.entries(result.fields).map(([key, value]) => `
    <tr><th>${importFieldLabel(key)}</th><td>${escapeHtml(importValueSummary(value))}</td></tr>
  `).join("");
  const notes = result.notes.length ? `<p class="muted">${result.notes.map(escapeHtml).join(" ")}</p>` : "";
  root.innerHTML = `
    ${result.character ? `<div class="import-warning">Imports as a new character; the open sheet isn't changed.</div>` : `<div class="import-warning">Skill proficiencies are intentionally manual unless you enable skill import.</div>`}
    <table>
      <tbody>${rows}</tbody>
    </table>
    ${notes}
  `;
}

function applyPendingImport() {
  if (!pendingImport) return;
  if (pendingImport.character) {
    applyOfficialImport(pendingImport.character, pendingImport.autoPrepare);
    return;
  }
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
      linkTypedSubclass(value);
    } else if (key === "hp") {
      character.hp = value;
      character.maxHp = value;
    } else if (key === "actions") {
      const names = new Set(character.actions.map(action => action.name.toLowerCase()));
      value.filter(action => !names.has(action.name.toLowerCase())).forEach(action => {
        character.actions.push({ id: crypto.randomUUID(), type: "Action", notes: "Imported", ...action });
      });
    } else {
      character[key] = value;
    }
  });
  if (fields.classId || fields.level) {
    const cls = currentClass();
    if (!fields.hitDice) character.hitDice = `${character.level}d${cls.hitDie}`;
    rebuildClassFeatureLines(cls, character.level);
  }
  persistAndRender();
  document.querySelector("#importDialog").close();
}

// A sheet read from the official PDF becomes its own character, starting from a blank sheet (no sample gear).
function applyOfficialImport(imported, autoPrepare) {
  const blank = defaultCharacter();
  character = normalizeCharacter({
    ...blank,
    ...imported,
    subclass: { mode: "custom", officialIndex: "", type: "Subclass", sections: [] },
    backgroundDetails: { ...blank.backgroundDetails, ...imported.backgroundDetails },
    resources: [],
    classOptions: [],
    autoSpells: [],
    expertSkills: [],
    planner: { multiclass: [], feats: [] }
  });
  if (character.subclassName) linkTypedSubclass(character.subclassName);
  if (!character.hitDice) character.hitDice = hitDiceText();
  rebuildClassFeatureLines(currentClass(), character.level);
  ensureSubclassSpells();
  let unprepared = 0;
  if (autoPrepare) {
    character.spells.filter(row => spellLevelForRow(row) > 0 && !spellAlwaysPrepared(row)).forEach(row => {
      row.prepared = canPrepareAnother();
      if (!row.prepared) unprepared += 1;
    });
  }
  pendingImport = null;
  document.querySelector("#importDialog").close();
  persistAndRender();
  showToast(`<span class="toast-label">Imported ${escapeHtml(character.name)}</span><span>${escapeHtml(classLabel())}.${unprepared ? ` ${unprepared} spell${unprepared === 1 ? " is" : "s are"} over your prepared limit and left unprepared; choose in the Spells tab.` : ""} Check the sheet for anything the PDF didn't cover.</span>`, { tone: "crit", duration: 9000 });
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
    ...(found ? [new RegExp(`\\b${escapeRegExp(found.name)}\\s+(\\d{1,2})\\b`, "i")] : []),
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
    /(?:skill proficiencies|proficient skills|skills proficient|proficient in|skills)\s*[:\-]\s*([^\n]+)/i
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

// Only look for spell names in a spells section (or lines that mention spells), as whole words,
// so "Sleight of Hand" doesn't import Light and "Darkvision 60 ft." doesn't import Darkvision.
function detectKnownSpells(text) {
  const section = extractSection(text, ["spells", "spellcasting", "cantrips", "spells known", "prepared spells"]);
  const source = section || text.split("\n").filter(line => /spell|cantrip/i.test(line)).join("\n");
  if (!source) return [];
  return allSpells
    .filter(item => new RegExp(`\\b${escapeRegExp(item.name)}\\b`, "i").test(source))
    .map(item => item.index);
}

function detectSaves(text) {
  const line = firstMatch(text, [/(?:saving throws?|saves)\s*[:\-]\s*([^\n]+)/i]);
  if (!line) return [];
  return ABILITIES.filter(([id, name]) => new RegExp(`\\b(${id}|${name})\\b`, "i").test(line)).map(([id]) => id);
}

// "Rapier +7 to hit, 1d8+4 piercing" style lines become actions with Attack and Damage rolls.
function detectAttackLines(text) {
  const attacks = [];
  text.split("\n").forEach(line => {
    const match = line.match(/^\s*([A-Za-z][\w' ()-]{1,30}?)\s*[:\-]?\s+([+-]\d{1,2})\s*(?:to hit)?\s*[,;]?\s*(\d+d\d+(?:\s*[+-]\s*\d+)?)\s*([a-z]+)?/i);
    if (match) attacks.push({ name: match[1].trim(), attack: match[2], damage: `${match[3].replace(/\s+/g, "")}${match[4] ? ` ${match[4]}` : ""}` });
  });
  return attacks;
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
