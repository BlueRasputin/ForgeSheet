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
