let pendingLevelChoices = [];

function renderBuilderTools() {
  renderBuilderWizard();
  renderBackgroundTools();
  renderAdvancementTimeline();
  renderFeatureAutomation();
  renderPlanner();
}

function renderBuilderWizard() {
  const steps = [
    ["identity", "Identity", Boolean(character.name && character.species && character.background)],
    ["class", "Class & Subclass", Boolean(character.classId && character.level && character.subclassName)],
    ["abilities", "Ability Scores", ABILITIES.every(([id]) => Number(character.abilities[id]) >= 1)],
    ["proficiencies", "Skills", (character.proficientSkills || []).length > 0],
    ["equipment", "Equipment", (character.equipment || []).length > 0 || Boolean(character.inventory)],
    ["spells", "Spells", currentClass().casterType === "none" || character.spells.some(spellRowHasSpell)],
    ["personality", "Personality", Boolean(character.backgroundDetails?.trait || character.backgroundDetails?.ideal)]
  ];
  const complete = steps.filter(([, , done]) => done).length;
  document.querySelector("#builderProgress").textContent = `${complete} / ${steps.length} complete`;
  document.querySelector("#builderWizard").innerHTML = steps.map(([id, label, done]) => `
    <article class="wizard-step ${done ? "is-complete" : ""}">
      <strong>${escapeHtml(label)}</strong>
      <span>${done ? "Complete" : builderStepHint(id)}</span>
      <button class="ghost" type="button" data-builder-tab="${builderStepTab(id)}">${done ? "Review" : "Go"}</button>
    </article>
  `).join("");
}

function builderStepHint(id) {
  return {
    identity: "Add name, species, and background.",
    class: "Choose class, subclass, and level.",
    abilities: "Set all six ability scores.",
    proficiencies: "Pick skill proficiencies.",
    equipment: "Add starting gear or catalog items.",
    spells: "Choose class spells if your class casts.",
    personality: "Generate or write roleplay details."
  }[id] || "Review this section.";
}

function builderStepTab(id) {
  return {
    identity: "background",
    class: "features",
    abilities: "#abilities",
    proficiencies: "#skills",
    equipment: "inventory",
    spells: "spells",
    personality: "background"
  }[id] || "actions";
}

function handleBuilderWizardClick(event) {
  const button = event.target.closest("[data-builder-tab]");
  if (button) goToTarget(button.dataset.builderTab);
}

// Tab names open a tab; "#id" targets live in the always-visible sheet, so scroll there and highlight.
function goToTarget(target) {
  if (!target.startsWith("#")) {
    activateTab(target);
    return;
  }
  const element = document.querySelector(target);
  if (!element) return;
  element.scrollIntoView({ behavior: "smooth", block: "center" });
  element.classList.remove("flash-target");
  void element.offsetWidth;
  element.classList.add("flash-target");
}

function renderBackgroundTools() {
  setValue("backgroundPreset", BACKGROUND_PRESETS.some(([name]) => name === character.background) ? character.background : BACKGROUND_PRESETS[0][0]);
  setValue("personalityTraitInput", character.backgroundDetails?.trait || "");
  setValue("idealInput", character.backgroundDetails?.ideal || "");
  setValue("bondInput", character.backgroundDetails?.bond || "");
  setValue("flawInput", character.backgroundDetails?.flaw || "");
  setValue("languagesInput", character.backgroundDetails?.languages || "");
  setValue("toolsInput", character.backgroundDetails?.tools || "");
  setValue("armorTrainingInput", character.backgroundDetails?.armor || "");
  setValue("weaponTrainingInput", character.backgroundDetails?.weapons || "");
}

function applyBackgroundPresetNamed(presetName) {
  const preset = BACKGROUND_PRESETS.find(([name]) => name === presetName);
  if (!preset) return;
  const [name, skills, tools, feature] = preset;
  character.background = name;
  character.features = mergeLines(character.features, [`Background Feature: ${feature}`]);
  character.backgroundDetails.tools = tools;
  character.backgroundDetails.languages = tools.toLowerCase().includes("language") ? tools : character.backgroundDetails.languages;
  skills.split(",").map(item => item.trim()).forEach(skillName => {
    const skill = SKILLS.find(([, label]) => label.toLowerCase() === skillName.toLowerCase())?.[0];
    if (skill && !character.proficientSkills.includes(skill)) character.proficientSkills.push(skill);
  });
}

function applyBackgroundPreset() {
  applyBackgroundPresetNamed(document.querySelector("#backgroundPreset").value);
  persistAndRender();
}

function generatePersonality() {
  character.backgroundDetails.trait = pick(PERSONALITY_PROMPTS.traits);
  character.backgroundDetails.ideal = pick(PERSONALITY_PROMPTS.ideals);
  character.backgroundDetails.bond = pick(PERSONALITY_PROMPTS.bonds);
  character.backgroundDetails.flaw = pick(PERSONALITY_PROMPTS.flaws);
  persistAndRender();
}

function renderAdvancementTimeline() {
  const cls = currentClass();
  const start = Math.max(1, character.level);
  const levels = Array.from({ length: Math.min(5, 20 - start) }, (_, index) => start + index + 1);
  document.querySelector("#advancementSummary").textContent = levels.length ? `Next ${levels.length} level${levels.length === 1 ? "" : "s"}` : "At level cap";
  document.querySelector("#advancementTimeline").innerHTML = levels.length ? levels.map(level => {
    const row = cls.table[level - 1] || {};
    const slots = spellSlotsFor(cls, level).map((count, index) => count ? `${index + 1}:${count}` : "").filter(Boolean).join(" ");
    const items = [
      row.features || "Class progression",
      asiLevelsFor(cls).has(level) ? "ASI / feat choice" : "",
      row.newSpells ? `${row.newSpells} spell choice${row.newSpells === 1 ? "" : "s"}` : "",
      row.cantrips ? `${row.cantrips} cantrip${row.cantrips === 1 ? "" : "s"}` : "",
      slots ? `Slots ${slots}` : ""
    ].filter(Boolean);
    return `<article><strong>Level ${level}</strong><span>${escapeHtml(items.join(" · "))}</span></article>`;
  }).join("") : `<p class="empty-state">No further class levels.</p>`;
}

function renderFeatureAutomation() {
  const cls = currentClass();
  const suggestions = featureSuggestions(cls);
  document.querySelector("#featureAutomation").innerHTML = suggestions.map(item => `
    <article class="feature-card ${item.done ? "is-complete" : ""}">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.body)}</span>
    </article>
  `).join("");
}

function featureSuggestions(cls = currentClass()) {
  const featureText = `${character.features}\n${character.classOptions.map(item => item.name).join("\n")}`.toLowerCase();
  const suggestions = [
    ["Hit Dice", `Use ${character.level}d${cls.hitDie} for ${cls.name}.`, character.hitDice === `${character.level}d${cls.hitDie}`],
    ["Proficiency Bonus", `Current bonus is ${formatMod(proficiencyBonus())}.`, true],
    ["Prepared Spells", `${preparedSpellCount()} prepared out of ${preparedLimitFor(cls)}.`, preparedSpellCount() <= preparedLimitFor(cls)],
    ["ASI / Feat", asiLevelsFor(cls).has(character.level) ? "This level includes an ASI or feat decision." : "No ASI/feat decision at this level.", !asiLevelsFor(cls).has(character.level) || character.planner.feats.length],
    ["Subclass Notes", "Record subclass features, choices, and resource rules.", (character.subclass.sections || []).some(section => section.body)],
    ["Feature Text", "Keep class, species, background, and feat features in the Features box.", featureText.length > 40]
  ];
  return suggestions.map(([title, body, done]) => ({ title, body, done }));
}

function applyFeatureAutomation() {
  const cls = currentClass();
  character.hitDice = `${character.level}d${cls.hitDie}`;
  const lines = [
    `${cls.name} level ${character.level}`,
    `Proficiency bonus ${formatMod(proficiencyBonus())}`,
    character.subclassName ? `${character.subclass.type || "Subclass"}: ${character.subclassName}` : "",
    asiLevelsFor(cls).has(character.level) ? "ASI / feat decision tracked in Builder planner." : ""
  ].filter(Boolean);
  character.features = mergeLines(character.features, lines);
  persistAndRender();
}

function renderPlanner() {
  fillSelect(document.querySelector("#multiclassSelect"), Object.values(getClasses()).map(cls => [cls.id, cls.name]));
  fillSelect(document.querySelector("#featSelect"), FEAT_PRESETS.map(name => [name, name]));
  const planner = character.planner || { multiclass: [], feats: [] };
  const requirements = multiclassRequirements(document.querySelector("#multiclassSelect").value);
  document.querySelector("#plannerSummary").innerHTML = `
    <article class="planner-card">
      <strong>Prerequisite Check</strong>
      <span>${escapeHtml(requirements)}</span>
    </article>
    <article class="planner-card">
      <strong>Planned Classes</strong>
      <span>${escapeHtml(planner.multiclass.map(id => getClasses()[id]?.name || id).join(", ") || "None")}</span>
      ${planner.multiclass.map(id => `<button class="ghost" data-remove-plan="multiclass:${id}" type="button">Remove ${escapeHtml(getClasses()[id]?.name || id)}</button>`).join("")}
    </article>
    <article class="planner-card">
      <strong>Feat / ASI Choices</strong>
      <span>${escapeHtml(planner.feats.join(", ") || "None")}</span>
      ${planner.feats.map(name => `<button class="ghost" data-remove-plan="feat:${escapeHtml(name)}" type="button">Remove ${escapeHtml(name)}</button>`).join("")}
    </article>
  `;
}

function addMulticlassPlan() {
  const id = document.querySelector("#multiclassSelect").value;
  if (!id || character.planner.multiclass.includes(id)) return;
  character.planner.multiclass.push(id);
  persistAndRender();
}

function addFeatPlan() {
  const name = document.querySelector("#featSelect").value;
  if (!name || character.planner.feats.includes(name)) return;
  character.planner.feats.push(name);
  character.asiAcknowledgedLevel = character.level;
  persistAndRender();
}

function handlePlannerClick(event) {
  const button = event.target.closest("[data-remove-plan]");
  if (!button) return;
  const [kind, value] = button.dataset.removePlan.split(":");
  if (kind === "multiclass") character.planner.multiclass = character.planner.multiclass.filter(item => item !== value);
  if (kind === "feat") character.planner.feats = character.planner.feats.filter(item => item !== value);
  persistAndRender();
}

function multiclassRequirements(classId) {
  const reqs = {
    artificer: [["int", 13]],
    barbarian: [["str", 13]],
    bloodhunter: [["dex", 13], ["int", 13]],
    bard: [["cha", 13]],
    cleric: [["wis", 13]],
    druid: [["wis", 13]],
    fighter: [["str", 13], ["dex", 13], "or"],
    monk: [["dex", 13], ["wis", 13]],
    paladin: [["str", 13], ["cha", 13]],
    ranger: [["dex", 13], ["wis", 13]],
    rogue: [["dex", 13]],
    sorcerer: [["cha", 13]],
    warlock: [["cha", 13]],
    wizard: [["int", 13]]
  };
  const rule = reqs[classId];
  if (!rule) return "Custom class: check DM prerequisites.";
  const useOr = rule.includes("or");
  const checks = rule.filter(Array.isArray).map(([ability, score]) => ({
    ability,
    score,
    met: Number(character.abilities[ability] || 0) >= score
  }));
  const met = useOr ? checks.some(item => item.met) : checks.every(item => item.met);
  const text = checks.map(item => `${item.ability.toUpperCase()} ${item.score}${item.met ? " ok" : " needed"}`).join(useOr ? " or " : ", ");
  return `${text}. ${met ? "Prerequisites met." : "Prerequisites not met."}`;
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
    ${cls.casterType === "none" ? "" : `
    <div>Spell slots: ${spellSlotsFor(cls, nextLevel).map((count, index) => count ? `${ordinal(index + 1)} ×${count}` : "").filter(Boolean).join(" · ") || "none yet"}</div>
    <div>${cls.preparedFormula === "known" ? "Spells known" : "Prepared spell limit"}: ${preparedLimitFor(cls, nextLevel)}</div>`}
  `;
  const choices = document.querySelector("#levelSpellChoices");
  choices.innerHTML = "";
  const totalChoices = (row.newSpells || 0) + (row.cantrips || 0);
  document.querySelector("#levelAsiPrompt").innerHTML = asiLevelsFor(cls).has(nextLevel)
    ? `<div><strong>ASI / Feat:</strong> Choose +2 to one ability, +1 to two abilities, or record a feat in Features after applying.</div>`
    : "";
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
  if (!totalChoices) choices.innerHTML = cls.casterType === "none" ? "" : `<p class="muted">No spell selections are required for this level.</p>`;
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

let creationDraft = null;
const CREATE_STEP_LABELS = ["Identity", "Class", "Background", "Abilities", "Review"];

function openCreateDialog() {
  ensureCharacterInLibrary();
  creationDraft = {
    step: 0,
    name: "",
    species: "",
    classId: currentClass().id,
    background: "",
    level: 1,
    abilities: Object.fromEntries(ABILITIES.map(([id]) => [id, 10]))
  };
  renderCreateStep();
  document.querySelector("#createDialog").showModal();
}

function renderCreateStep() {
  const draft = creationDraft;
  document.querySelector("#createSteps").innerHTML = CREATE_STEP_LABELS.map((label, index) => `
    <button type="button" class="create-rail-step ${index === draft.step ? "is-active" : ""}${index < draft.step ? " is-complete" : ""}" data-create-step="${index}">
      <span>${index + 1}</span>${label}
    </button>
  `).join("");
  document.querySelector("#createBack").disabled = draft.step === 0;
  document.querySelector("#createNext").textContent = draft.step === CREATE_STEP_LABELS.length - 1 ? "Create Character" : "Next";
  const renderers = [renderCreateIdentity, renderCreateClass, renderCreateBackground, renderCreateAbilities, renderCreateReview];
  document.querySelector("#createStepBody").innerHTML = renderers[draft.step]();
}

function renderCreateIdentity() {
  const species = SPECIES_PRESETS.find(([name]) => name === creationDraft.species);
  return `
    <h3 class="create-screen-title">Who are you?</h3>
    <label class="create-name">Character Name
      <input data-create-field="name" value="${escapeHtml(creationDraft.name)}" autocomplete="off" placeholder="Name your hero...">
    </label>
    <div class="create-option-grid">
      ${SPECIES_PRESETS.map(([name, speed, , glyph]) => `
        <button type="button" class="create-option-card ${name === creationDraft.species ? "is-selected" : ""}" data-create-option="species:${name}">
          <span class="create-glyph">${glyph}</span>
          <strong>${name}</strong>
          <span>${speed} ft speed</span>
        </button>
      `).join("")}
    </div>
    <p class="create-detail">${species ? `<strong>${species[0]}</strong> — ${species[2]}` : "Choose a species, or skip this screen and type a homebrew species on the sheet later."}</p>
  `;
}

function renderCreateClass() {
  const cls = getClasses()[creationDraft.classId] || currentClass();
  const saves = CLASS_SAVES[cls.id];
  const casting = cls.casterType === "none" ? "Martial — no spell slots" : `${(cls.spellAbility || "").toUpperCase()} spellcasting`;
  return `
    <div class="create-title-row">
      <h3 class="create-screen-title">Choose your class</h3>
      <label class="create-level">Starting Level
        <input type="number" min="1" max="20" data-create-field="level" value="${creationDraft.level}">
      </label>
    </div>
    <div class="create-option-grid">
      ${Object.values(getClasses()).map(item => `
        <button type="button" class="create-option-card ${item.id === creationDraft.classId ? "is-selected" : ""}" data-create-option="classId:${item.id}">
          <span class="create-glyph">${CLASS_GLYPHS[item.id] || "✨"}</span>
          <strong>${escapeHtml(item.name)}</strong>
          <span>d${item.hitDie} · ${item.casterType === "none" ? "Martial" : "Caster"}</span>
        </button>
      `).join("")}
      <button type="button" class="create-option-card" data-create-forge>
        <span class="create-glyph">🛠️</span>
        <strong>Custom Class</strong>
        <span>Forge your own</span>
      </button>
    </div>
    <p class="create-detail"><strong>${escapeHtml(cls.name)}</strong> — d${cls.hitDie} hit die · ${casting}${saves ? ` · Saving throws: ${saves.map(id => id.toUpperCase()).join(", ")}` : " · Set saving throw proficiencies on the sheet"}</p>
    ${creationDraft.level > 1 ? `<p class="create-detail">Starting at level ${creationDraft.level}: after creation a checklist shows everything to fill in for your level.</p>` : ""}
  `;
}

function renderCreateBackground() {
  const preset = BACKGROUND_PRESETS.find(([name]) => name === creationDraft.background);
  return `
    <h3 class="create-screen-title">Where do you come from?</h3>
    <div class="create-option-grid">
      ${BACKGROUND_PRESETS.map(([name, skills, , , glyph]) => `
        <button type="button" class="create-option-card ${name === creationDraft.background ? "is-selected" : ""}" data-create-option="background:${name}">
          <span class="create-glyph">${glyph}</span>
          <strong>${name}</strong>
          <span>${skills}</span>
        </button>
      `).join("")}
      <button type="button" class="create-option-card ${creationDraft.background === "" ? "is-selected" : ""}" data-create-option="background:">
        <span class="create-glyph">❔</span>
        <strong>Skip for now</strong>
        <span>Decide later</span>
      </button>
    </div>
    <p class="create-detail">${preset ? `<strong>${preset[0]}</strong> — Skills: ${preset[1]} · ${preset[2]} · Feature: ${preset[3]}` : "A preset grants its skill proficiencies and background feature automatically."}</p>
  `;
}

function renderCreateAbilities() {
  return `
    <h3 class="create-screen-title">Assign ability scores</h3>
    <div class="create-ability-grid">
      ${ABILITIES.map(([id, label]) => `
        <div class="create-ability-card">
          <strong>${label}</strong>
          <input type="number" min="1" max="30" data-create-ability="${id}" value="${creationDraft.abilities[id]}">
          <span class="ability-mod">${formatMod(Math.floor((creationDraft.abilities[id] - 10) / 2))}</span>
        </div>
      `).join("")}
    </div>
    <button type="button" class="secondary" data-create-standard>Use Standard Array (15, 14, 13, 12, 10, 8)</button>
    <p class="create-detail">The array fills scores in the order listed — swap numbers between abilities to suit your class.</p>
  `;
}

function renderCreateReview() {
  const cls = getClasses()[creationDraft.classId] || currentClass();
  const speciesRow = SPECIES_PRESETS.find(([name]) => name === creationDraft.species);
  const conMod = Math.floor((Number(creationDraft.abilities.con || 10) - 10) / 2);
  const hp = averageHpFor(cls, creationDraft.level, conMod);
  return `
    <h3 class="create-screen-title">Ready for adventure</h3>
    <div class="create-review-hero">
      <span class="create-glyph">${speciesRow ? speciesRow[3] : ""}${CLASS_GLYPHS[cls.id] || "✨"}</span>
      <strong>${escapeHtml(creationDraft.name.trim() || "New Character")}</strong>
      <span>${escapeHtml([creationDraft.species, cls.name].filter(Boolean).join(" "))} · ${escapeHtml(creationDraft.background || "No background")} · Level ${creationDraft.level}</span>
    </div>
    <div class="create-review-stats">
      ${ABILITIES.map(([id, label]) => `<span><strong>${id.toUpperCase()}</strong> ${creationDraft.abilities[id]} (${formatMod(Math.floor((creationDraft.abilities[id] - 10) / 2))})</span>`).join("")}
      <span><strong>HP</strong> ${hp}</span>
      <span><strong>Hit Dice</strong> ${creationDraft.level}d${cls.hitDie}</span>
    </div>
    <p class="create-detail">Your current sheet stays saved in the Character Library. Creating starts a fresh blank sheet.</p>
  `;
}

function handleCreateFieldInput(event) {
  if (!creationDraft) return;
  const field = event.target.dataset.createField;
  if (field === "level") {
    creationDraft.level = clamp(Number(event.target.value || 1), 1, 20);
  } else if (field) {
    creationDraft[field] = event.target.value;
  }
  const ability = event.target.dataset.createAbility;
  if (ability) {
    creationDraft.abilities[ability] = clamp(Number(event.target.value || 10), 1, 30);
    const modLabel = event.target.closest(".create-ability-card")?.querySelector(".ability-mod");
    if (modLabel) modLabel.textContent = formatMod(Math.floor((creationDraft.abilities[ability] - 10) / 2));
  }
}

function handleCreateStepClick(event) {
  if (!creationDraft) return;
  const stepButton = event.target.closest("[data-create-step]");
  if (stepButton) {
    creationDraft.step = Number(stepButton.dataset.createStep);
    renderCreateStep();
    return;
  }
  if (event.target.closest("[data-create-forge]")) {
    startCustomClassDraft();
    return;
  }
  const option = event.target.closest("[data-create-option]");
  if (option) {
    const [field, ...value] = option.dataset.createOption.split(":");
    creationDraft[field] = value.join(":");
    renderCreateStep();
    return;
  }
  if (event.target.closest("[data-create-standard]")) {
    const array = [15, 14, 13, 12, 10, 8];
    ABILITIES.forEach(([id], index) => {
      creationDraft.abilities[id] = array[index];
    });
    renderCreateStep();
  }
}

function createStepBack() {
  if (!creationDraft || creationDraft.step === 0) return;
  creationDraft.step -= 1;
  renderCreateStep();
}

function createStepNext() {
  if (!creationDraft) return;
  if (creationDraft.step < CREATE_STEP_LABELS.length - 1) {
    creationDraft.step += 1;
    renderCreateStep();
    return;
  }
  finishCreation();
}

function averageHpFor(cls, level, conMod) {
  return Math.max(level, cls.hitDie + conMod + (level - 1) * (Math.ceil(cls.hitDie / 2) + 1 + conMod));
}

function finishCreation() {
  const draft = creationDraft;
  const cls = getClasses()[draft.classId] || currentClass();
  const speciesRow = SPECIES_PRESETS.find(([name]) => name === draft.species);
  const abilities = Object.fromEntries(ABILITIES.map(([id]) => [id, clamp(Number(draft.abilities[id] || 10), 1, 30)]));
  const level = clamp(Number(draft.level || 1), 1, 20);
  const hp = averageHpFor(cls, level, Math.floor((abilities.con - 10) / 2));
  character = {
    ...defaultCharacter(),
    name: draft.name.trim() || "New Character",
    classId: cls.id,
    subclassName: "",
    subclass: { mode: "custom", officialIndex: "", type: "Subclass", sections: [] },
    level,
    species: draft.species,
    background: "",
    abilities,
    hp,
    maxHp: hp,
    ac: 10 + Math.floor((abilities.dex - 10) / 2),
    speed: speciesRow ? speciesRow[1] : 30,
    hitDice: `${level}d${cls.hitDie}`,
    saveProficiencies: CLASS_SAVES[cls.id] || [],
    proficientSkills: [],
    spells: [],
    equipment: [],
    resources: [],
    classOptions: [],
    actions: [],
    autoSpells: [],
    features: speciesRow ? `Species: ${draft.species} — ${speciesRow[2]}` : "",
    attacks: "",
    inventory: "",
    notes: ""
  };
  applyBackgroundPresetNamed(draft.background);
  creationDraft = null;
  document.querySelector("#createDialog").close();
  persistAndRender();
  if (level > 1 && levelChecklist().some(item => !item.done)) document.querySelector("#checklistDialog").showModal();
}

function levelChecklist() {
  const cls = currentClass();
  const level = character.level;
  const conMod = mod("con");
  const asiCount = [...asiLevelsFor(cls)].filter(asiLevel => asiLevel <= level).length;
  const featCount = (character.planner?.feats || []).length;
  // Lowest legal max HP: full first die, then a roll of 1 + CON (min 1) every level after.
  const minHp = Math.max(level, cls.hitDie + conMod + (level - 1) * Math.max(1, 1 + conMod));
  const averageHp = averageHpFor(cls, level, conMod);
  const caster = cls.casterType !== "none";
  const expectedSlots = caster ? spellSlotsFor(cls, level).some(Boolean) : false;
  const items = [
    ["Identity", "Name, species, and background chosen.", Boolean(character.name && character.species && character.background), "background"],
    // ponytail: subclass required at level 3 for everyone; some classes pick at 1-2, refine per-class if it matters
    ["Subclass", level >= 3 ? "Choose and record your subclass." : "Chosen at level 3 for most classes.", level < 3 || Boolean(character.subclassName), "features"],
    ["Ability Scores", "Set all six ability scores.", ABILITIES.every(([id]) => Number(character.abilities[id]) >= 1), "#abilities"],
    ["Skills", "Pick your skill proficiencies.", (character.proficientSkills || []).length > 0, "#skills"],
    ["Hit Dice", `Should be ${level}d${cls.hitDie} for ${cls.name}.`, character.hitDice === `${level}d${cls.hitDie}`, "features"],
    ["Hit Points", `Max HP ${character.maxHp} is below the level ${level} minimum of ${minHp} (average is ${averageHp}).`, Number(character.maxHp) >= minHp, null],
    ["ASI / Feats", `${asiCount} ability score improvement${asiCount === 1 ? "" : "s"} by level ${level} — record each in the Builder planner.`, featCount >= asiCount, "builder"],
    ["Equipment", "Add starting gear or catalog items.", (character.equipment || []).length > 0 || Boolean(character.inventory), "inventory"]
  ];
  if (caster) {
    items.push(["Spells", "Choose your class spells.", !expectedSlots || character.spells.some(spellRowHasSpell), "spells"]);
    const limit = preparedLimitFor(cls);
    if (cls.preparedFormula !== "none" && cls.preparedFormula !== "known") {
      items.push(["Prepared Spells", `${preparedSpellCount()} prepared of ${limit} allowed.`, preparedSpellCount() > 0 && preparedSpellCount() <= limit, "spells"]);
    }
  }
  return items.map(([label, detail, done, tab]) => ({ label, detail, done, tab }));
}

function renderChecklist() {
  const items = levelChecklist();
  const remaining = items.filter(item => !item.done);
  const button = document.querySelector("#checklistButton");
  button.textContent = remaining.length ? `Checklist (${remaining.length})` : "Checklist";
  button.classList.toggle("needs-attention", remaining.length > 0);
  button.title = remaining.length ? `To do: ${remaining.map(item => item.label).join(", ")}` : "Everything is up to date for your level.";
  document.querySelector("#checklistSummary").textContent = remaining.length
    ? `${items.length - remaining.length} of ${items.length} done for level ${character.level}`
    : `All set for level ${character.level}!`;
  document.querySelector("#checklistBody").innerHTML = items.map(item => `
    <article class="checklist-item ${item.done ? "is-complete" : ""}">
      <span class="checklist-mark">${item.done ? "✓" : "○"}</span>
      <div>
        <strong>${escapeHtml(item.label)}</strong>
        <span>${item.done ? "Done" : escapeHtml(item.detail)}</span>
      </div>
      ${!item.done && item.tab ? `<button type="button" class="ghost" data-checklist-tab="${item.tab}">Go</button>` : ""}
    </article>
  `).join("");
  document.querySelectorAll(".tab").forEach(tabButton => {
    const todos = remaining.filter(item => item.tab === tabButton.dataset.tab);
    tabButton.classList.toggle("needs-attention", todos.length > 0);
    tabButton.title = todos.length ? `To do: ${todos.map(item => item.label).join(", ")}` : "";
  });
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
