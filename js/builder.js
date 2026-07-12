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
    class: "classes",
    abilities: "actions",
    proficiencies: "actions",
    equipment: "inventory",
    spells: "spells",
    personality: "background"
  }[id] || "actions";
}

function handleBuilderWizardClick(event) {
  const button = event.target.closest("[data-builder-tab]");
  if (button) activateTab(button.dataset.builderTab);
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

function applyBackgroundPreset() {
  const preset = BACKGROUND_PRESETS.find(([name]) => name === document.querySelector("#backgroundPreset").value);
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
    const slots = spellSlotsFor(cls, level).filter(Boolean).map((count, index) => `${index + 1}:${count}`).join(" ");
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
    <div>Spell slots: ${spellSlotsFor(cls, nextLevel).join(" / ") || "none"}</div>
    <div>Prepared spell limit: ${preparedLimitFor(cls, nextLevel)}</div>
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
  if (!totalChoices) choices.innerHTML = `<p class="muted">No spell selections are required for this level.</p>`;
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
