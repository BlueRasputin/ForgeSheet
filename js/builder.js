let pendingLevelChoices = [];

function renderBuilderTools() {
  renderBuilderWizard();
  renderBackgroundTools();
  renderAdvancementTimeline();
  renderFeatureAutomation();
  renderPlanner();
}

function renderBuilderWizard() {
  const items = levelChecklist();
  const complete = items.filter(item => item.done).length;
  document.querySelector("#builderProgress").textContent = `${complete} / ${items.length} complete`;
  document.querySelector("#builderWizard").innerHTML = items.map(item => `
    <article class="wizard-step ${item.done ? "is-complete" : ""}">
      <strong>${escapeHtml(item.label)}</strong>
      <span>${item.done ? "Complete" : escapeHtml(item.detail)}</span>
      ${item.tab ? `<button class="ghost" type="button" data-builder-tab="${item.tab}">${item.done ? "Review" : "Go"}</button>` : ""}
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
  const panel = element.closest(".panel");
  if (panel && !panel.classList.contains("active") && panel.id) activateTab(panel.id);
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
  const grants = tools.split(",").map(item => item.trim()).filter(Boolean);
  const languages = grants.filter(item => /language/i.test(item));
  const toolGrants = grants.filter(item => !/language/i.test(item));
  if (toolGrants.length) character.backgroundDetails.tools = mergeLines(character.backgroundDetails.tools, toolGrants).replace(/\n/g, ", ");
  if (languages.length) character.backgroundDetails.languages = mergeLines(character.backgroundDetails.languages, languages).replace(/\n/g, ", ");
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
    ["Hit dice", `Use ${character.level}d${cls.hitDie} for ${cls.name}.`, character.hitDice === `${character.level}d${cls.hitDie}`],
    ["Proficiency bonus", `Current bonus is ${formatMod(proficiencyBonus())}.`, true],
    ["Prepared spells", `${preparedSpellCount()} prepared out of ${preparedLimitFor(cls)}.`, preparedSpellCount() <= preparedLimitFor(cls)],
    ["ASI or feat", asiLevelsFor(cls).has(character.level) ? "This level includes an ASI or feat decision." : "No ASI/feat decision at this level.", !asiLevelsFor(cls).has(character.level) || character.planner.feats.length],
    ["Subclass notes", "Record subclass features, choices, and resource rules.", (character.subclass.sections || []).some(section => section.body)],
    ["Feature text", "Keep class, species, background, and feat features in the Features box.", featureText.length > 40]
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
      <strong>Prerequisite check</strong>
      <span>${escapeHtml(requirements)}</span>
    </article>
    <article class="planner-card">
      <strong>Planned classes</strong>
      <span>${escapeHtml(planner.multiclass.map(id => getClasses()[id]?.name || id).join(", ") || "None")}</span>
      ${planner.multiclass.map(id => `<button class="ghost" data-remove-plan="multiclass:${id}" type="button">Remove ${escapeHtml(getClasses()[id]?.name || id)}</button>`).join("")}
    </article>
    <article class="planner-card">
      <strong>Feat / ASI Choices</strong>
      <span>${escapeHtml(planner.feats.join(", ") || "None")}</span>
      ${planner.feats.map((name, index) => `<button class="ghost" data-remove-plan="feat-at:${index}" type="button">Remove ${escapeHtml(name)}</button>`).join("")}
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
  if (!name || (name !== "Ability Score Improvement" && character.planner.feats.includes(name))) return;
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
  if (kind === "feat-at") character.planner.feats.splice(Number(value), 1);
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

let pendingLevelSubclass = "";

// The class as it will be after this level-up, including a subclass chosen in the dialog.
function levelUpClass() {
  const base = currentClass();
  if (!pendingLevelSubclass || base.casterType !== "none") return base;
  const official = officialSubclasses.find(item => item.index === pendingLevelSubclass);
  const casting = lookupBySubclass(SUBCLASS_CASTING, official?.name);
  return casting ? { ...base, ...casting } : base;
}

function levelUpPicks(cls, from, to) {
  const spells = cls.preparedFormula === "known" || cls.knownTable
    ? Math.max(0, (knownSpellCap(cls, to) ?? 0) - (knownSpellCap(cls, from) ?? 0))
    : Number(cls.table[to - 1]?.newSpells || 0);
  return { spells, cantrips: Math.max(0, cantripCap(cls, to) - cantripCap(cls, from)) };
}

function openLevelDialog() {
  if (character.level >= 20) return;
  pendingLevelSubclass = "";
  const nextLevel = character.level + 1;
  const cls = currentClass();
  const unlock = SUBCLASS_LEVEL[cls.id] || 3;
  const subclassOptions = officialSubclasses.filter(item => item.classIndex === cls.id);
  const needsSubclass = !character.subclassName && nextLevel >= unlock && subclassOptions.length;
  document.querySelector("#levelDialogTitle").textContent = `${cls.name} level ${nextLevel}`;
  document.querySelector("#levelSubclass").innerHTML = needsSubclass ? `
    <label>Choose your ${escapeHtml(subclassOptions[0].flavor || "subclass")}
      <select id="levelSubclassSelect">
        <option value="">Decide later</option>
        ${subclassOptions.map(item => `<option value="${escapeHtml(item.index)}">${escapeHtml(item.name)}</option>`).join("")}
      </select>
    </label>` : "";
  document.querySelector("#levelAsiPrompt").innerHTML = asiLevelsFor(cls).has(nextLevel) ? `
    <fieldset class="level-asi">
      <legend>Ability score improvement</legend>
      <label class="inline-check"><input type="radio" name="asiMode" value="asi" checked> Raise scores: +1 and +1 (choose the same ability twice for +2)</label>
      <div class="level-asi-picks">
        ${["asiFirst", "asiSecond"].map(id => `<select id="${id}">${ABILITIES.map(([ability, label]) => `<option value="${ability}" ${Number(character.abilities[ability]) >= 20 ? "disabled" : ""}>${label} (${character.abilities[ability]})</option>`).join("")}</select>`).join("")}
      </div>
      <label class="inline-check"><input type="radio" name="asiMode" value="feat"> Take a feat instead
        <select id="asiFeat">${FEAT_PRESETS.filter(name => name !== "Ability Score Improvement").map(name => `<option>${escapeHtml(name)}</option>`).join("")}</select>
      </label>
    </fieldset>` : "";
  renderLevelSummaryAndChoices();
  document.querySelector("#levelDialog").showModal();
}

function renderLevelSummaryAndChoices() {
  const nextLevel = character.level + 1;
  const cls = levelUpClass();
  const row = cls.table[nextLevel - 1] || {};
  const profNow = proficiencyBonus(character.level);
  const profNext = proficiencyBonus(nextLevel);
  const hpGain = Math.max(1, Math.ceil(cls.hitDie / 2) + 1 + mod("con")) + speciesHpPerLevel(character.species);
  document.querySelector("#levelSummary").innerHTML = `
    <div>Hit points: +${hpGain} (average), or edit Max HP after applying if you rolled.</div>
    <div>Hit dice: ${nextLevel}d${cls.hitDie} · Proficiency bonus: ${formatMod(profNext)}${profNext !== profNow ? ` (up from ${formatMod(profNow)})` : ""}</div>
    <div>Features: ${escapeHtml(row.features || "No new class feature this level.")}</div>
    ${cls.casterType === "none" ? "" : `
    <div>Spell slots: ${spellSlotsFor(cls, nextLevel).map((count, index) => count ? `${ordinal(index + 1)} ×${count}` : "").filter(Boolean).join(" · ") || "none yet"}</div>
    <div>${cls.preparedFormula === "known" ? "Spells known" : "Prepared spell limit"}: ${preparedLimitFor(cls, nextLevel)}${cantripCap(cls, nextLevel) ? ` · Cantrips: ${cantripCap(cls, nextLevel)}` : ""}</div>`}
  `;
  const picks = levelUpPicks(cls, character.level, nextLevel);
  const choices = document.querySelector("#levelSpellChoices");
  choices.innerHTML = "";
  pendingLevelChoices = [];
  const kinds = [...Array(picks.cantrips).fill(0), ...Array(picks.spells).fill("leveled")];
  kinds.forEach(kind => {
    const newRow = { id: crypto.randomUUID(), index: "", prepared: false };
    pendingLevelChoices.push(newRow);
    const wrapper = document.createElement("div");
    wrapper.className = "level-spell-choice";
    wrapper.innerHTML = `<select class="spell-select"></select><span class="muted">${kind === 0 ? "New cantrip" : cls.id === "wizard" ? "Spellbook spell" : "New spell"}</span>`;
    fillSpellSelect(wrapper.querySelector("select"), "", spellChoicesForLevelChoice(kind, cls));
    wrapper.querySelector("select").addEventListener("change", event => {
      newRow.index = event.target.value;
      pendingLevelChoices.forEach(choice => {
        if (choice !== newRow && choice.index === newRow.index) choice.index = "";
      });
    });
    choices.appendChild(wrapper);
  });
  if (!kinds.length && cls.casterType !== "none") choices.innerHTML = `<p class="muted">No new spells to learn this level${cls.preparedFormula === "known" ? "" : " (you prepare from your full class list)"}.</p>`;
}

function spellChoicesForLevelChoice(kind, cls = currentClass()) {
  const maximum = maxSpellLevelFor(cls, character.level + 1);
  const selected = new Set(character.spells.map(row => row.index).filter(Boolean));
  return allSpells
    .filter(item => !selected.has(item.index))
    .filter(item => spellMatchesClass(item, cls))
    .filter(item => kind === 0 ? item.level === 0 : item.level > 0 && item.level <= maximum)
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

let creationDraft = null;
const CREATE_STEP_LABELS = ["Identity", "Class", "Background", "Abilities", "Review"];

function blankCreationDraft() {
  return {
    step: 0,
    name: "",
    species: "",
    classId: "",
    background: "",
    backgroundChosen: false,
    level: 1,
    subclass: "",
    skills: [],
    abilities: Object.fromEntries(ABILITIES.map(([id]) => [id, 10]))
  };
}

// A half-built character survives closing the wizard; "Start over" clears it.
function openCreateDialog() {
  ensureCharacterInLibrary();
  if (!creationDraft) creationDraft = blankCreationDraft();
  renderCreateStep();
  document.querySelector("#createDialog").showModal();
}

function draftClass() {
  return getClasses()[creationDraft.classId] || null;
}

function createStepDone(index) {
  const draft = creationDraft;
  return [
    Boolean(draft.name.trim() || draft.species),
    Boolean(draft.classId),
    draft.backgroundChosen,
    ABILITIES.some(([id]) => Number(draft.abilities[id]) !== 10),
    false
  ][index];
}

function renderCreateStep() {
  const draft = creationDraft;
  document.querySelector("#createSteps").innerHTML = CREATE_STEP_LABELS.map((label, index) => `
    <button type="button" class="create-rail-step ${index === draft.step ? "is-active" : ""}${createStepDone(index) ? " is-complete" : ""}" data-create-step="${index}">
      <span>${index + 1}</span>${label}
    </button>
  `).join("") + `<button type="button" class="ghost create-start-over" data-create-reset>Start over</button>`;
  document.querySelector("#createBack").disabled = draft.step === 0;
  document.querySelector("#createBack").style.visibility = draft.step === 0 ? "hidden" : "";
  document.querySelector("#createNext").textContent = draft.step === CREATE_STEP_LABELS.length - 1 ? "Create character" : "Next";
  const renderers = [renderCreateIdentity, renderCreateClass, renderCreateBackground, renderCreateAbilities, renderCreateReview];
  document.querySelector("#createStepBody").innerHTML = renderers[draft.step]();
}

function renderCreateIdentity() {
  const species = SPECIES_PRESETS.find(([name]) => name === creationDraft.species);
  return `
    <h3 class="create-screen-title">Who are you?</h3>
    <label class="create-name">Character Name
      <input data-create-field="name" value="${escapeHtml(creationDraft.name)}" autocomplete="off" maxlength="60" placeholder="Name your hero...">
    </label>
    <div class="create-option-grid">
      ${SPECIES_PRESETS.map(([name, speed, , glyph]) => `
        <button type="button" class="create-option-card ${name === creationDraft.species ? "is-selected" : ""}" data-create-option="species:${name}">
          <span class="create-glyph">${icon(glyph)}</span>
          <strong>${name}</strong>
          <span>${speed} ft speed</span>
        </button>
      `).join("")}
    </div>
    <p class="create-detail">${species ? `<strong>${species[0]}.</strong> ${species[2]}` : "Choose a species, or skip this screen and type a homebrew species on the sheet later."}</p>
  `;
}

function renderCreateClass() {
  const cls = draftClass();
  const saves = cls ? CLASS_SAVES[cls.id] : null;
  const casting = cls ? (cls.casterType === "none" ? "Martial, no spell slots" : `${(cls.spellAbility || "").toUpperCase()} spellcasting`) : "";
  return `
    <div class="create-title-row">
      <h3 class="create-screen-title">Choose your class</h3>
      <label class="create-level">Starting Level
        <input type="number" min="1" max="20" step="1" inputmode="numeric" data-create-field="level" value="${creationDraft.level}">
      </label>
    </div>
    <div id="createSubclassSlot">${renderCreateLevelExtras()}</div>
    <div class="create-option-grid">
      ${Object.values(getClasses()).map(item => `
        <button type="button" class="create-option-card ${item.id === creationDraft.classId ? "is-selected" : ""}" data-create-option="classId:${item.id}">
          <span class="create-glyph">${icon(CLASS_GLYPHS[item.id] || "sparkle")}</span>
          <strong>${escapeHtml(item.name)}</strong>
          <span>d${item.hitDie} · ${item.casterType === "none" ? "Martial" : "Caster"}</span>
        </button>
      `).join("")}
      <button type="button" class="create-option-card" data-create-forge>
        <span class="create-glyph">${icon("hammer")}</span>
        <strong>Custom Class</strong>
        <span>Forge your own</span>
      </button>
    </div>
    <p class="create-detail">${cls ? `<strong>${escapeHtml(cls.name)}.</strong> d${cls.hitDie} hit die · ${casting}${saves ? ` · Saving throws: ${saves.map(id => id.toUpperCase()).join(", ")}` : " · Set saving throw proficiencies on the sheet"}` : "Pick a class to continue."}</p>
  `;
}

function renderCreateLevelExtras() {
  const cls = draftClass();
  const note = creationDraft.level > 1 ? `<p class="create-detail">Starting at level ${creationDraft.level}: after creation a checklist shows everything to fill in for your level.</p>` : "";
  return (cls ? renderCreateSubclassPicker(cls) : "") + note;
}

function renderCreateSubclassPicker(cls) {
  const unlock = SUBCLASS_LEVEL[cls.id] || 3;
  if (creationDraft.level < unlock) return "";
  const options = officialSubclasses.filter(item => item.classIndex === cls.id);
  if (!options.length) return "";
  return `
    <label class="create-name">Subclass
      <select data-create-field="subclass">
        <option value="">Decide later</option>
        ${options.map(item => `<option value="${escapeHtml(item.index)}" ${item.index === creationDraft.subclass ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
      </select>
    </label>
  `;
}

function backgroundSkills(background) {
  const preset = BACKGROUND_PRESETS.find(([name]) => name === background);
  return preset ? preset[1].split(",").map(name => SKILLS.find(([, label]) => label.toLowerCase() === name.trim().toLowerCase())?.[0]).filter(Boolean) : [];
}

function classSkillPicks(cls) {
  return CLASS_PROFICIENCIES[cls?.id]?.[3] || 2;
}

function renderCreateSkillPicker() {
  const cls = draftClass();
  if (!cls) return `<p class="create-detail">Pick a class first to choose its skills.</p>`;
  const fromBackground = new Set(backgroundSkills(creationDraft.background));
  const allowed = CLASS_SKILL_CHOICES[cls.id] === "any" || !CLASS_SKILL_CHOICES[cls.id] ? SKILLS.map(([id]) => id) : CLASS_SKILL_CHOICES[cls.id];
  const picks = classSkillPicks(cls);
  return `
    <h4 class="create-subtitle">${escapeHtml(cls.name)} skills: choose ${picks} (${creationDraft.skills.length}/${picks})</h4>
    <div class="create-skill-chips">
      ${allowed.map(id => {
        const label = SKILLS.find(([skill]) => skill === id)?.[1] || id;
        const owned = fromBackground.has(id);
        const chosen = creationDraft.skills.includes(id);
        return `<button type="button" class="condition-chip ${chosen || owned ? "active" : ""}" data-create-skill="${id}" ${owned ? "disabled title=\"From your background\"" : ""}>${owned ? icon("check") : ""}${escapeHtml(label)}</button>`;
      }).join("")}
    </div>
  `;
}

function renderCreateBackground() {
  const preset = BACKGROUND_PRESETS.find(([name]) => name === creationDraft.background);
  return `
    <h3 class="create-screen-title">Where do you come from?</h3>
    <div class="create-option-grid">
      ${BACKGROUND_PRESETS.map(([name, skills, , , glyph]) => `
        <button type="button" class="create-option-card ${name === creationDraft.background ? "is-selected" : ""}" data-create-option="background:${name}">
          <span class="create-glyph">${icon(glyph)}</span>
          <strong>${name}</strong>
          <span>${skills}</span>
        </button>
      `).join("")}
      <button type="button" class="create-option-card ${creationDraft.backgroundChosen && creationDraft.background === "" ? "is-selected" : ""}" data-create-option="background:">
        <span class="create-glyph">${icon("question")}</span>
        <strong>Skip for now</strong>
        <span>Decide later</span>
      </button>
    </div>
    <p class="create-detail">${preset ? `<strong>${preset[0]}.</strong> Skills: ${preset[1]} · ${preset[2]} · Feature: ${preset[3]}` : "A preset grants its skill proficiencies and background feature automatically."}</p>
    ${renderCreateSkillPicker()}
  `;
}

function draftAbilitiesWithBonus() {
  const bonus = SPECIES_PRESETS.find(([name]) => name === creationDraft.species)?.[4] || {};
  return Object.fromEntries(ABILITIES.map(([id]) => [id, clamp(Number(creationDraft.abilities[id] || 10) + (bonus[id] || 0), 1, 30)]));
}

function renderCreateAbilities() {
  const cls = draftClass();
  return `
    <h3 class="create-screen-title">Assign ability scores</h3>
    <div class="create-ability-grid">
      ${ABILITIES.map(([id, label]) => `
        <div class="create-ability-card">
          <strong>${label}</strong>
          <input type="number" min="1" max="30" step="1" inputmode="numeric" data-create-ability="${id}" value="${creationDraft.abilities[id]}">
          <span class="ability-mod">${formatMod(Math.floor((creationDraft.abilities[id] - 10) / 2))}</span>
        </div>
      `).join("")}
    </div>
    <button type="button" class="secondary" data-create-standard>Use the standard array${cls ? ` for ${escapeHtml(cls.name)}` : ""}</button>
    <p class="create-detail">Puts 15, 14, 13, 12, 10, 8 into the abilities your class leans on most. ${speciesBonusText(creationDraft.species) ? `${escapeHtml(creationDraft.species)} bonuses (${speciesBonusText(creationDraft.species)}) are added on top.` : ""}</p>
  `;
}

function renderCreateReview() {
  const cls = draftClass();
  if (!cls) return `<h3 class="create-screen-title">Almost there</h3><p class="create-detail">Choose a class before creating your character.</p>`;
  const speciesRow = SPECIES_PRESETS.find(([name]) => name === creationDraft.species);
  const abilities = draftAbilitiesWithBonus();
  const bonus = speciesRow?.[4] || {};
  const conMod = Math.floor((abilities.con - 10) / 2);
  const hp = averageHpFor(cls, creationDraft.level, conMod) + speciesHpPerLevel(creationDraft.species) * creationDraft.level;
  const subclass = officialSubclasses.find(item => item.index === creationDraft.subclass);
  const skills = [...new Set([...backgroundSkills(creationDraft.background), ...creationDraft.skills, ...(SPECIES_GRANTS[creationDraft.species]?.skills || [])])]
    .map(id => SKILLS.find(([skill]) => skill === id)?.[1]).filter(Boolean);
  return `
    <h3 class="create-screen-title">Ready for adventure</h3>
    <div class="create-review-hero">
      <span class="create-glyph">${speciesRow ? icon(speciesRow[3]) : ""}${icon(CLASS_GLYPHS[cls.id] || "sparkle")}</span>
      <strong>${escapeHtml(creationDraft.name.trim() || "New Character")}</strong>
      <span>${escapeHtml([creationDraft.species, cls.name, subclass ? `(${subclass.name})` : ""].filter(Boolean).join(" "))} · ${escapeHtml(creationDraft.background || "No background")} · Level ${creationDraft.level}</span>
    </div>
    <div class="create-review-stats">
      ${ABILITIES.map(([id]) => `<span><strong>${id.toUpperCase()}</strong> ${abilities[id]} (${formatMod(Math.floor((abilities[id] - 10) / 2))})${bonus[id] ? ` <em>+${bonus[id]}</em>` : ""}</span>`).join("")}
      <span><strong>HP</strong> ${hp}</span>
      <span><strong>Hit Dice</strong> ${creationDraft.level}d${cls.hitDie}</span>
    </div>
    <p class="create-detail">Skills: ${escapeHtml(skills.join(", ") || "none yet")}${creationDraft.skills.length < classSkillPicks(cls) ? ` · ${classSkillPicks(cls) - creationDraft.skills.length} class skill pick${classSkillPicks(cls) - creationDraft.skills.length === 1 ? "" : "s"} left (Background step)` : ""}</p>
    <p class="create-detail">Your current sheet stays saved in the Character Library. Creating starts a fresh sheet.</p>
  `;
}

function wholeNumber(value, fallback, min, max) {
  const number = Math.round(Number(value));
  return Number.isFinite(number) && String(value).trim() !== "" ? clamp(number, min, max) : fallback;
}

function handleCreateFieldInput(event) {
  if (!creationDraft) return;
  const field = event.target.dataset.createField;
  if (field === "level") {
    creationDraft.level = wholeNumber(event.target.value, creationDraft.level, 1, 20);
    const slot = document.querySelector("#createSubclassSlot");
    if (slot) slot.innerHTML = renderCreateLevelExtras();
  } else if (field) {
    creationDraft[field] = event.target.value;
  }
  const ability = event.target.dataset.createAbility;
  if (ability) {
    creationDraft.abilities[ability] = wholeNumber(event.target.value, creationDraft.abilities[ability], 1, 30);
    const modLabel = event.target.closest(".create-ability-card")?.querySelector(".ability-mod");
    if (modLabel) modLabel.textContent = formatMod(Math.floor((creationDraft.abilities[ability] - 10) / 2));
  }
}

// On commit (blur/Enter) the box shows the value that will actually be used.
function handleCreateFieldChange(event) {
  if (!creationDraft) return;
  if (event.target.dataset.createField === "level") event.target.value = creationDraft.level;
  const ability = event.target.dataset.createAbility;
  if (ability) event.target.value = creationDraft.abilities[ability];
}

function handleCreateStepClick(event) {
  if (!creationDraft) return;
  if (event.target.closest("[data-create-reset]")) {
    creationDraft = blankCreationDraft();
    renderCreateStep();
    return;
  }
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
  const skill = event.target.closest("[data-create-skill]");
  if (skill) {
    const id = skill.dataset.createSkill;
    const picks = classSkillPicks(draftClass());
    if (creationDraft.skills.includes(id)) creationDraft.skills = creationDraft.skills.filter(item => item !== id);
    else if (creationDraft.skills.length < picks) creationDraft.skills.push(id);
    renderCreateStep();
    return;
  }
  const option = event.target.closest("[data-create-option]");
  if (option) {
    const [field, ...value] = option.dataset.createOption.split(":");
    creationDraft[field] = value.join(":");
    if (field === "classId") {
      creationDraft.subclass = "";
      creationDraft.skills = [];
    }
    if (field === "background") {
      creationDraft.backgroundChosen = true;
      const owned = new Set(backgroundSkills(creationDraft.background));
      creationDraft.skills = creationDraft.skills.filter(id => !owned.has(id));
    }
    renderCreateStep();
    return;
  }
  if (event.target.closest("[data-create-standard]")) {
    const array = [15, 14, 13, 12, 10, 8];
    const cls = draftClass();
    const priority = CLASS_ABILITY_PRIORITY[creationDraft.classId]
      || [...new Set([cls?.spellAbility, "con", "dex", "str", "wis", "int", "cha"].filter(id => ABILITIES.some(([ability]) => ability === id)))];
    priority.forEach((id, index) => {
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
  if (creationDraft.step === 1 && !creationDraft.classId) {
    showToast(`<span class="toast-label">Pick a class to continue</span>`);
    return;
  }
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

function speciesHpPerLevel(species) {
  return SPECIES_GRANTS[species]?.hpPerLevel || 0;
}

function speciesBonusText(species) {
  const bonus = SPECIES_PRESETS.find(([name]) => name === species)?.[4] || {};
  return Object.entries(bonus).map(([id, value]) => `+${value} ${id.toUpperCase()}`).join(", ");
}

function finishCreation() {
  const draft = creationDraft;
  const cls = draftClass();
  if (!cls) {
    creationDraft.step = 1;
    renderCreateStep();
    showToast(`<span class="toast-label">Pick a class to continue</span>`);
    return;
  }
  const speciesRow = SPECIES_PRESETS.find(([name]) => name === draft.species);
  const speciesBonus = speciesRow?.[4] || {};
  const abilities = Object.fromEntries(ABILITIES.map(([id]) => [id, clamp(Number(draft.abilities[id] || 10) + (speciesBonus[id] || 0), 1, 30)]));
  const official = officialSubclasses.find(item => item.index === draft.subclass);
  const [armor, weapons, tools] = CLASS_PROFICIENCIES[cls.id] || [cls.armor || "", cls.weapons || "", ""];
  const featureLines = cls.table.slice(0, clamp(Number(draft.level || 1), 1, 20))
    .filter(row => row.features)
    .map(row => `Level ${row.level}: ${row.features}`);
  const level = wholeNumber(draft.level, 1, 1, 20);
  const grants = SPECIES_GRANTS[draft.species] || {};
  const hp = averageHpFor(cls, level, Math.floor((abilities.con - 10) / 2)) + speciesHpPerLevel(draft.species) * level;
  const joined = (...parts) => parts.flat().filter(Boolean).join(", ");
  character = {
    ...defaultCharacter(),
    name: draft.name.trim() || "New Character",
    classId: cls.id,
    subclassName: official?.name || "",
    subclass: { mode: official ? "official" : "custom", officialIndex: official?.index || "", type: official?.flavor || "Subclass", sections: [] },
    level,
    species: draft.species,
    background: "",
    abilities,
    hp,
    maxHp: hp,
    ac: 10 + Math.floor((abilities.dex - 10) / 2),
    speed: speciesRow ? speciesRow[1] : 30,
    hitDice: `${level}d${cls.hitDie}`,
    saveProficiencies: CLASS_SAVES[cls.id] || cls.saves || [],
    proficientSkills: [...new Set([...draft.skills, ...(grants.skills || [])])],
    spells: (grants.cantrips || []).map(index => ({ id: crypto.randomUUID(), index, level: 0, prepared: false, racial: true })),
    acAuto: true,
    equipment: [],
    resources: [],
    classOptions: [],
    actions: [],
    autoSpells: [],
    features: [speciesRow ? `Species: ${draft.species}. ${speciesRow[2]}` : "", grants.feature || "", ...featureLines].filter(Boolean).join("\n"),
    backgroundDetails: {
      ...defaultCharacter().backgroundDetails,
      armor: joined(armor, grants.armor || []),
      weapons: joined(weapons, grants.weapons || []),
      tools: joined(tools, grants.tools || []),
      languages: joined(grants.languages || [])
    },
    attacks: "",
    inventory: "",
    notes: ""
  };
  applyBackgroundPresetNamed(draft.background);
  applySubclassExtras();
  character.ac = calculatedArmorClass();
  creationDraft = null;
  document.querySelector("#createDialog").close();
  persistAndRender();
  const bonusText = speciesBonusText(draft.species);
  if (bonusText) showToast(`<span class="toast-label">${escapeHtml(character.name)} is ready</span><span>Added ${escapeHtml(draft.species)} ${bonusText} (PHB). Using custom origins? Move them in the ability scores.</span>`, { duration: 10000 });
  if (level > 1 && levelChecklist().some(item => !item.done)) document.querySelector("#checklistDialog").showModal();
}

function levelChecklist() {
  const cls = currentClass();
  const level = character.level;
  const conMod = mod("con");
  const classSkills = CLASS_PROFICIENCIES[cls.id]?.[3] || 2;
  const subclassUnlock = SUBCLASS_LEVEL[cls.id] || 3;
  const expectedSkills = classSkills + (character.background ? 2 : 0);
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
    ["Subclass", level >= subclassUnlock ? "Choose and record your subclass." : `Chosen at level ${subclassUnlock}.`, level < subclassUnlock || Boolean(character.subclassName), "#officialSubclassSelect"],
    ["Ability scores", "Set all six ability scores.", ABILITIES.every(([id]) => Number(character.abilities[id]) >= 1), "#abilities"],
    ["Skills", `Pick ${expectedSkills} skill proficiencies (${classSkills} from ${cls.name}${character.background ? ", 2 from your background" : ""}).`, (character.proficientSkills || []).length >= expectedSkills, "#skills"],
    ["Hit dice", `Should be ${level}d${cls.hitDie} for ${cls.name}.`, character.hitDice === `${level}d${cls.hitDie}`, "features"],
    ["Saving throws", "Mark your class's two saving throw proficiencies.", (character.saveProficiencies || []).length >= 2, "#savingThrows"],
    ["Hit points", `Max HP ${character.maxHp} is below the level ${level} minimum of ${minHp} (average is ${averageHp}).`, Number(character.maxHp) >= minHp, null],
    ["ASIs and feats", `${asiCount} ability score improvement${asiCount === 1 ? "" : "s"} by level ${level}. Record each in the Builder planner.`, featCount >= asiCount, "#featPlanner"],
    ["Equipment", "Add starting gear or catalog items.", (character.equipment || []).length > 0 || Boolean(character.inventory), "inventory"]
  ];
  if (caster) {
    const cantrips = cantripCap(cls);
    const chosenCantrips = character.spells.filter(row => spellRowHasSpell(row) && spellLevelForRow(row) === 0 && !spellAlwaysPrepared(row)).length;
    if (cantrips) items.push(["Cantrips", `${chosenCantrips} of ${cantrips} cantrips chosen.`, chosenCantrips === cantrips, "spells"]);
    const ownSpells = character.spells.filter(row => spellRowHasSpell(row) && spellLevelForRow(row) > 0 && !spellAlwaysPrepared(row) && !row.itemId).length;
    const knownCap = cls.preparedFormula === "known" ? knownSpellCap(cls) : cls.id === "wizard" ? KNOWN_SPELLS.wizard[level - 1] : null;
    if (knownCap !== null && knownCap !== undefined) {
      items.push([cls.id === "wizard" ? "Spellbook" : "Spells known", `${ownSpells} of ${knownCap} ${cls.id === "wizard" ? "spellbook spells" : "spells known"}.`, cls.id === "wizard" ? ownSpells >= knownCap : ownSpells === knownCap, "spells"]);
    } else {
      items.push(["Spells", "Choose your class spells.", !expectedSlots || ownSpells > 0, "spells"]);
    }
    const limit = preparedLimitFor(cls);
    if (cls.preparedFormula !== "none" && cls.preparedFormula !== "known") {
      items.push(["Prepared spells", `${preparedSpellCount()} of ${limit} prepared.`, preparedSpellCount() === limit, "spells"]);
    }
  }
  return items.map(([label, detail, done, tab]) => ({ label, detail, done, tab }));
}

function renderChecklist() {
  const items = levelChecklist();
  const remaining = items.filter(item => !item.done);
  const button = document.querySelector("#checklistButton");
  button.innerHTML = `${icon("list-checks")}${remaining.length ? `Checklist (${remaining.length})` : "Checklist"}`;
  button.classList.toggle("needs-attention", remaining.length > 0);
  button.title = remaining.length ? `To do: ${remaining.map(item => item.label).join(", ")}` : "Everything is up to date for your level.";
  document.querySelector("#checklistSummary").textContent = remaining.length
    ? `${items.length - remaining.length} of ${items.length} done for level ${character.level}`
    : `All set for level ${character.level}.`;
  document.querySelector("#checklistBody").innerHTML = items.map(item => `
    <article class="checklist-item ${item.done ? "is-complete" : ""}">
      <span class="checklist-mark">${icon(item.done ? "check-circle" : "circle")}</span>
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
  const nextLevel = character.level + 1;
  if (pendingLevelSubclass) applyOfficialSubclass(pendingLevelSubclass, false);
  const cls = currentClass();
  const asiMode = document.querySelector('input[name="asiMode"]:checked')?.value;
  if (asiMode === "asi") {
    [document.querySelector("#asiFirst").value, document.querySelector("#asiSecond").value].forEach(ability => {
      character.abilities[ability] = clamp(Number(character.abilities[ability]) + 1, 1, 20);
    });
    character.planner.feats.push("Ability Score Improvement");
  } else if (asiMode === "feat") {
    const feat = document.querySelector("#asiFeat").value;
    character.planner.feats.push(feat);
    character.features = mergeLines(character.features, [`Feat (level ${nextLevel}): ${feat}`]);
  }
  if (asiMode) character.asiAcknowledgedLevel = nextLevel;
  character.level = nextLevel;
  const gained = Math.max(1, Math.ceil(cls.hitDie / 2) + 1 + mod("con")) + speciesHpPerLevel(character.species);
  character.maxHp = Number(character.maxHp || 0) + gained;
  character.hp = Number(character.hp || 0) + gained;
  character.hitDice = `${nextLevel}d${cls.hitDie}`;
  const preparedCaster = ["levelPlusMod", "halfLevelPlusMod"].includes(cls.preparedFormula);
  pendingLevelChoices.filter(row => row.index).forEach(row => {
    const spell = allSpells.find(item => item.index === row.index);
    row.level = spell?.level ?? 1;
    row.prepared = preparedCaster && row.level > 0 && preparedSpellCount() < preparedLimitFor(cls, nextLevel);
    character.spells.push(row);
  });
  rebuildClassFeatureLines(cls, nextLevel);
  pendingLevelChoices = [];
  pendingLevelSubclass = "";
  document.querySelector("#levelDialog").close();
  persistAndRender();
  showToast(`<span class="toast-label">Level ${nextLevel}</span><span>+${gained} max HP${asiMode === "asi" ? " · ability scores raised" : asiMode === "feat" ? " · feat recorded" : ""}</span>`);
}
