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
  document.querySelector("#initiativeValue").textContent = formatMod(mod("dex"));
  document.querySelector("#inspirationValue").textContent = character.inspiration;
  document.querySelector("#inspirationTile").classList.toggle("is-on", character.inspiration > 0);
  ["speedInput", "acInput", "hpInput", "maxHpInput", "tempHpInput"].forEach(id => {
    document.querySelector(`#${id}`).disabled = character.identityLocked;
  });
  renderIdentityDisplay();
  renderAsiBanner();
}

function renderIdentityDisplay() {
  const block = document.querySelector("#identityBlock");
  block.classList.toggle("is-locked", character.identityLocked);
  document.querySelector("#identityLock").title = character.identityLocked ? "Edit character details, scores, and stats" : "Done editing";
  const classLine = [
    `Level ${character.level}`,
    character.species,
    getClasses()[character.classId]?.name || ""
  ].filter(Boolean).join(" ");
  const detailLine = [
    character.subclassName,
    character.background,
    character.alignment
  ].filter(Boolean).join(" · ");
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
  const banner = document.querySelector("#asiBanner");
  const show = asiLevelsFor(currentClass()).has(character.level) && character.asiAcknowledgedLevel !== character.level;
  banner.classList.toggle("visible", show);
  banner.textContent = show
    ? `Level ${character.level}: Ability Score Improvement or feat available — record it in the Builder tab.`
    : "";
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
    star.title = expert ? "Expertise active — double proficiency" : "Toggle expertise (double proficiency)";
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
    character[map[id]] = ["level", "hp", "maxHp", "ac", "speed"].includes(map[id]) ? clamp(Number(value), map[id] === "hp" ? 0 : 1, map[id] === "level" ? 20 : 999) : value;
    if (id === "classSelect") {
      classBuilderDraft = null;
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
function applyLevelChange(value) {
  const next = clamp(Number(value), 1, 20);
  const delta = next - character.level;
  if (!delta) {
    renderAll();
    return;
  }
  const cls = currentClass();
  const perLevel = Math.max(1, Math.ceil(cls.hitDie / 2) + 1 + mod("con"));
  character.level = next;
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
  }).join("");
}

function renderDeathSaves() {
  const root = document.querySelector("#deathSaveTracker");
  const successes = character.deathSaveSuccesses;
  const failures = character.deathSaveFailures;
  const status = failures >= 3 ? "Three failures — dead" : successes >= 3 ? "Stable" : "";
  const pips = kind => Array.from({ length: 3 }, (_, index) => {
    const count = kind === "success" ? successes : failures;
    return `<button type="button" class="death-pip ${kind} ${index < count ? "filled" : ""}" data-death-kind="${kind}" data-death-index="${index}" aria-label="${kind} ${index + 1}"></button>`;
  }).join("");
  root.innerHTML = `
    <div class="death-save-row"><span>Successes</span>${pips("success")}</div>
    <div class="death-save-row"><span>Failures</span>${pips("failure")}</div>
    <div class="death-save-actions">
      <button type="button" class="ghost" data-death-action="roll">Roll Death Save</button>
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
