function renderHeader() {
  fillSelect(document.querySelector("#classSelect"), [
    ...Object.values(getClasses()).map(cls => [cls.id, cls.name]),
    [CUSTOM_CLASS_VALUE, "Custom class..."]
  ]);
  setValue("characterName", character.name);
  setValue("classSelect", character.classId);
  setValue("subclassName", character.subclassName);
  setValue("levelInput", character.level);
  setValue("speciesInput", character.species);
  setValue("backgroundInput", character.background);
  setValue("alignmentInput", character.alignment);
  setValue("hpInput", character.hp);
  setValue("maxHpInput", character.maxHp);
  setValue("tempHpInput", character.tempHp);
  setValue("acInput", character.ac);
  setValue("speedInput", character.speed);
  document.querySelector("#profBonus").textContent = formatMod(proficiencyBonus());
  document.querySelector("#initiativeValue").textContent = formatMod(initiativeBonus());
  const armorClass = calculatedArmorClass();
  if (character.acAuto && Number(character.ac) !== armorClass) {
    character.ac = armorClass;
    setValue("acInput", armorClass);
  }
  const acHint = document.querySelector("#acHint");
  acHint.hidden = armorClass === Number(character.ac);
  acHint.textContent = `Gear: ${armorClass}`;
  acHint.title = `Your equipped armor, shield, and DEX give AC ${armorClass}. Click to use it.`;
  document.querySelector("#inspirationValue").textContent = character.inspiration;
  document.querySelector("#inspirationTile").classList.toggle("is-on", character.inspiration > 0);
  ["speedInput", "acInput", "maxHpInput"].forEach(id => {
    document.querySelector(`#${id}`).disabled = character.identityLocked;
  });
  const hpRatio = character.maxHp ? Number(character.hp) / Number(character.maxHp) : 1;
  document.querySelector(".hp-box").dataset.state = Number(character.hp) <= 0 ? "down" : hpRatio <= 0.25 ? "critical" : hpRatio <= 0.5 ? "bloodied" : "healthy";
  document.querySelector("#subclassOptions").innerHTML = officialSubclasses
    .filter(item => item.classIndex === character.classId)
    .map(item => `<option value="${escapeHtml(item.name)}"></option>`).join("");
  renderIdentityDisplay();
  renderAsiBanner();
}

function renderIdentityDisplay() {
  const block = document.querySelector("#identityBlock");
  block.classList.toggle("is-locked", character.identityLocked);
  // Play mode by default: build values read as text; Edit unlocks scores, proficiencies, actions and trackers.
  document.body.classList.toggle("is-editing", !character.identityLocked);
  const lock = document.querySelector("#identityLock");
  lock.innerHTML = character.identityLocked ? `${icon("pencil-simple")}Edit` : `${icon("check")}Done`;
  lock.classList.toggle("primary", !character.identityLocked);
  lock.title = character.identityLocked ? "Edit details, scores, proficiencies, actions and trackers" : "Back to play mode";
  const classLine = [
    `Level ${character.level}`,
    character.species,
    getClasses()[character.classId]?.name || ""
  ].filter(Boolean).join(" ");
  const detailLine = [
    speciesSize(character.species),
    character.subclassName,
    character.background,
    character.alignment
  ].filter(Boolean).join(", ");
  document.querySelector("#identityDisplay").innerHTML = `
    <strong>${escapeHtml(character.name || "Unnamed Character")}</strong>
    <span>${escapeHtml(classLine)}</span>
    ${detailLine ? `<em>${escapeHtml(detailLine)}</em>` : ""}
  `;
}

function toggleIdentityLock() {
  character.identityLocked = !character.identityLocked;
  character.asiAcknowledgedLevel = character.level;
  persistAndRender();
}

function renderAsiBanner() {
  const due = asiLevelsFor(currentClass()).has(character.level) && character.asiAcknowledgedLevel !== character.level;
  if (!due) return;
  character.asiAcknowledgedLevel = character.level;
  showToast(`<span class="toast-label">Level ${character.level}: Ability Score Improvement</span><span>Raise one score by 2 or two by 1, or take a feat.</span>`, {
    actions: [{ label: "Open checklist", run: () => document.querySelector("#checklistDialog").showModal() }],
    duration: 10000
  });
}

function renderSheet() {
  ABILITIES.forEach(([id]) => {
    setValue(`[data-ability="${id}"]`, character.abilities[id]);
    document.querySelector(`[data-ability="${id}"]`).disabled = character.identityLocked;
    document.querySelector(`#${id}Mod`).textContent = formatMod(mod(id));
  });
  SKILLS.forEach(([id,, ability]) => {
    document.querySelector(`[data-skill="${id}"]`).checked = character.proficientSkills.includes(id);
    document.querySelector(`#${id}Skill`).textContent = formatMod(skillBonus(id, ability));
    const expert = (character.expertSkills || []).includes(id);
    const star = document.querySelector(`[data-expert-skill="${id}"]`);
    star.classList.toggle("is-expert", expert);
    star.title = expert ? "Expertise active: double proficiency" : "Toggle expertise (double proficiency)";
  });
  const expertCount = (character.expertSkills || []).length;
  document.querySelector("#skillSummary").textContent = `${character.proficientSkills.length} proficient${expertCount ? ` · ${expertCount} expertise` : ""}`;
  renderSavingThrows();
  renderSenses();
  renderDeathSaves();
  setValue("hitDiceInput", character.hitDice);
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

function handleInput(event) {
  const id = event.target.id;
  if (id === "levelInput") return;
  const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
  if (id === "classSelect" && value === CUSTOM_CLASS_VALUE) {
    startCustomClassDraft();
    return;
  }
  const map = {
    characterName: "name", classSelect: "classId", subclassName: "subclassName", levelInput: "level", speciesInput: "species",
    backgroundInput: "background", alignmentInput: "alignment", hpInput: "hp", acInput: "ac",
    maxHpInput: "maxHp", speedInput: "speed", hitDiceInput: "hitDice", attacksInput: "attacks",
    featuresInput: "features", inventoryInput: "inventory", notesInput: "notes"
  };
  if (map[id]) {
    if (id === "acInput") character.acAuto = false;
    character[map[id]] = ["level", "hp", "maxHp", "ac", "speed"].includes(map[id]) ? clamp(Number(value), map[id] === "hp" ? 0 : 1, map[id] === "level" ? 20 : 999) : value;
    if (id === "classSelect") switchClassTo(value);
    if (id === "subclassName") linkTypedSubclass(value);
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
  if (id === "tempHpInput") {
    character.tempHp = clamp(Number(value), 0, 999);
    persist();
  }
  if (id === "concentrationInput") {
    character.concentration = value;
    persist();
  }
  const coinMap = { coinCp: "cp", coinSp: "sp", coinEp: "ep", coinGp: "gp", coinPp: "pp" };
  if (coinMap[id]) {
    character.currency[coinMap[id]] = clamp(Number(value), 0, 999999);
    persist();
  }
  const personalityMap = {
    personalityTraitInput: "trait",
    idealInput: "ideal",
    bondInput: "bond",
    flawInput: "flaw",
    languagesInput: "languages",
    toolsInput: "tools",
    armorTrainingInput: "armor",
    weaponTrainingInput: "weapons"
  };
  if (personalityMap[id]) {
    character.backgroundDetails[personalityMap[id]] = value;
    persist();
  }
  renderAll();
}

// Committed on change (blur/Enter) so typing "1" then "5" doesn't apply two level jumps.
// Changing class swaps everything the class provides: saves, armor and weapon training, HP by hit die, features.
function switchClassTo(classId) {
  classBuilderDraft = null;
  const previousHitDie = Number(String(character.hitDice || "").split("d")[1]) || null;
  character.classId = classId;
  character.subclassName = "";
  character.subclass = { ...character.subclass, mode: "custom", officialIndex: "", type: "Subclass" };
  const cls = currentClass();
  const grants = SPECIES_GRANTS[character.species] || {};
  const [armor, weapons] = CLASS_PROFICIENCIES[cls.id] || [cls.armor || "", cls.weapons || ""];
  const saves = CLASS_SAVES[cls.id] || cls.saves;
  if (saves?.length) character.saveProficiencies = [...saves];
  character.backgroundDetails.armor = mergeList(armor, grants.armor || []);
  character.backgroundDetails.weapons = mergeList(weapons, grants.weapons || []);
  character.hitDice = `${character.level}d${cls.hitDie}`;
  if (previousHitDie !== cls.hitDie) {
    const missing = Number(character.maxHp || 0) - Number(character.hp || 0);
    character.maxHp = averageHpFor(cls, character.level, mod("con")) + speciesHpPerLevel(character.species) * character.level;
    character.hp = clamp(character.maxHp - missing, 0, character.maxHp);
  }
  rebuildClassFeatureLines(cls, character.level);
  showToast(`<span class="toast-label">Now a ${escapeHtml(cls.name)}</span><span>Saves, training, hit dice, HP and features updated. Pick a ${escapeHtml(cls.name)} subclass when you reach it.</span>`, { duration: 9000 });
}

// Typing a subclass name links it to the official entry, so its grants and extras apply.
function linkTypedSubclass(name) {
  const key = normalizedSubclassKey(name);
  const official = key && officialSubclasses.find(item => item.classIndex === character.classId && normalizedSubclassKey(item.name) === key);
  if (!official) return;
  character.subclass.mode = "official";
  character.subclass.officialIndex = official.index;
  character.subclass.type = official.flavor || character.subclass.type;
  applySubclassExtras();
}

function applyLevelChange(value) {
  const typed = Number(value);
  if (!Number.isInteger(typed) || typed < 1 || typed > 20) {
    showToast(`<span class="toast-label">Level must be a whole number from 1 to 20</span><span>Kept level ${character.level}.</span>`, { tone: "fumble" });
    document.querySelector("#levelInput").value = character.level;
    return;
  }
  const next = typed;
  const delta = next - character.level;
  if (!delta) {
    renderAll();
    return;
  }
  const cls = currentClass();
  const perLevel = Math.max(1, Math.ceil(cls.hitDie / 2) + 1 + mod("con")) + speciesHpPerLevel(character.species);
  character.level = next;
  rebuildClassFeatureLines(cls, next);
  character.maxHp = Math.max(next, Number(character.maxHp || 0) + delta * perLevel);
  character.hp = clamp(Number(character.hp || 0) + delta * perLevel, 0, character.maxHp);
  character.hitDice = `${next}d${cls.hitDie}`;
  character.hitDiceUsed = Math.min(Number(character.hitDiceUsed || 0), next);
  persistAndRender();
  showToast(`<strong>Level ${next}</strong> Max HP ${delta > 0 ? "+" : ""}${delta * perLevel} using the average (${perLevel}/level), hit dice ${next}d${cls.hitDie}. Edit Max HP if you rolled.`, { duration: 9000 });
}

function handleAbilityInput(event) {
  character.abilities[event.target.dataset.ability] = clamp(Number(event.target.value), 1, 30);
  persistAndRender();
}

function saveBonus(ability) {
  return mod(ability) + (character.saveProficiencies.includes(ability) ? proficiencyBonus() : 0);
}

function renderSavingThrows() {
  document.querySelectorAll("[data-save]").forEach(input => {
    input.checked = character.saveProficiencies.includes(input.dataset.save);
  });
  ABILITIES.forEach(([id]) => {
    document.querySelector(`#${id}Save`).textContent = formatMod(saveBonus(id));
  });
}

function handleSaveInput(event) {
  const ability = event.target.dataset.save;
  if (!ability) return;
  character.saveProficiencies = character.saveProficiencies.filter(item => item !== ability);
  if (event.target.checked) character.saveProficiencies.push(ability);
  persistAndRender();
}

function renderSenses() {
  const senses = [["perception", "Passive Perception"], ["investigation", "Passive Investigation"], ["insight", "Passive Insight"]];
  document.querySelector("#senses").innerHTML = senses.map(([skill, label]) => {
    const ability = SKILLS.find(([id]) => id === skill)[2];
    return `<div class="sense-row"><strong>${10 + skillBonus(skill, ability)}</strong><span>${label}</span></div>`;
  }).join("") + specialSensesHtml();
}

// Darkvision from the species preset (60 ft) or any "Darkvision N ft" written in features.
function specialSensesHtml() {
  const written = String(character.features || "").match(/darkvision\D{0,12}(\d+)/i);
  const preset = SPECIES_PRESETS.find(([name]) => name === character.species);
  const range = written ? Number(written[1]) : preset && /darkvision/i.test(preset[2]) ? 60 : 0;
  return range ? `<p class="special-senses">${icon("eye")}Darkvision ${range} ft</p>` : "";
}

function speciesSize(species) {
  if (!SPECIES_PRESETS.some(([name]) => name === species)) return "";
  return /gnome|halfling/i.test(species) ? "Small" : "Medium";
}

function renderDeathSaves() {
  const root = document.querySelector("#deathSaveTracker");
  const successes = character.deathSaveSuccesses;
  const failures = character.deathSaveFailures;
  const status = failures >= 3 ? "Three failures: dead" : successes >= 3 ? "Stable" : "";
  const pips = kind => Array.from({ length: 3 }, (_, index) => {
    const count = kind === "success" ? successes : failures;
    return `<button type="button" class="death-pip ${kind} ${index < count ? "filled" : ""}" data-death-kind="${kind}" data-death-index="${index}" aria-label="${kind} ${index + 1}"></button>`;
  }).join("");
  root.innerHTML = `
    <div class="death-save-row"><span>Successes</span>${pips("success")}</div>
    <div class="death-save-row"><span>Failures</span>${pips("failure")}</div>
    <div class="death-save-actions">
      <button type="button" class="ghost" data-death-action="roll" ${isDying() ? "" : "disabled title=\"Only while dying at 0 HP\""}>Roll death save</button>
      <button type="button" class="ghost" data-death-action="reset">Reset</button>
      ${status ? `<em>${status}</em>` : ""}
    </div>
  `;
}

function handleSkillInput(event) {
  const skill = event.target.dataset.skill;
  character.proficientSkills = character.proficientSkills.filter(item => item !== skill);
  if (event.target.checked) {
    character.proficientSkills.push(skill);
  } else {
    character.expertSkills = (character.expertSkills || []).filter(item => item !== skill);
  }
  persistAndRender();
}

function toggleExpertise(skill) {
  const expert = (character.expertSkills || []).includes(skill);
  character.expertSkills = (character.expertSkills || []).filter(item => item !== skill);
  if (!expert) {
    character.expertSkills.push(skill);
    if (!character.proficientSkills.includes(skill)) character.proficientSkills.push(skill);
  }
  persistAndRender();
}

function addNoteSection(kind, title = "New Section", body = "") {
  getNoteSections(kind).push({ id: crypto.randomUUID(), title, body });
  persistAndRender();
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
    ["Equipment", character.equipment.map(item => `${item.name}: ${item.notes}`).join("\n")],
    ["Notes", character.notes],
    ["Subclass", character.subclass.sections.map(section => `${section.title}: ${section.body}`).join("\n")],
    ["Class Options", character.classOptions.map(option => `${option.name}: ${option.notes}`).join("\n")],
    ["Actions", character.actions.map(action => `${action.name}: ${action.notes}`).join("\n")],
    ["Spells", character.spells.map(spellDisplayName).join(", ")],
    ["Note Sections", (character.noteSections || []).map(section => `${section.title}: ${section.body}`).join("\n")]
  ];
  const matches = haystacks.filter(([, text]) => String(text || "").toLowerCase().includes(query));
  root.classList.add("active");
  root.innerHTML = matches.length ? matches.map(([label, text]) => `<article><strong>${label}</strong><p>${escapeHtml(truncate(String(text), 180))}</p></article>`).join("") : `<p class="empty-state">No matches.</p>`;
}
