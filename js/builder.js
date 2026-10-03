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
  const fold = element.closest("details:not(.file-menu)");
  if (fold) fold.open = true;
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

// Multiclassing (PHB p.163): meet the new class's minimums AND your current class's. Each inner list is "any of".
const MULTICLASS_REQUIREMENTS = {
  artificer: [["int"]],
  barbarian: [["str"]],
  bloodhunter: [["str", "dex"], ["int"]],
  bard: [["cha"]],
  cleric: [["wis"]],
  druid: [["wis"]],
  fighter: [["str", "dex"]],
  monk: [["dex"], ["wis"]],
  paladin: [["str"], ["cha"]],
  ranger: [["dex"], ["wis"]],
  rogue: [["dex"]],
  sorcerer: [["cha"]],
  warlock: [["cha"]],
  wizard: [["int"]]
};

function multiclassCheck(classId) {
  const describe = id => {
    const groups = MULTICLASS_REQUIREMENTS[id];
    if (!groups) return null;
    const parts = groups.map(group => {
      const met = group.some(ability => Number(character.abilities[ability] || 0) >= 13);
      return { met, text: `${group.map(ability => ability.toUpperCase()).join(" or ")} 13${met ? " ok" : " needed"}` };
    });
    return { met: parts.every(part => part.met), text: parts.map(part => part.text).join(", ") };
  };
  const target = describe(classId);
  if (!target) return { met: true, text: "Custom class: check prerequisites with your DM." };
  // You need the prerequisites of every class you already have, too (PHB p.163).
  const owned = classEntries().filter(entry => entry.classId !== classId).map(entry => ({ name: getClasses()[entry.classId]?.name || entry.classId, check: describe(entry.classId) })).filter(item => item.check);
  const met = target.met && owned.every(item => item.check.met);
  const text = `${getClasses()[classId]?.name || classId}: ${target.text}.${owned.map(item => ` ${item.name}: ${item.check.text}.`).join("")}`;
  return { met, text: `${text} ${met ? "Prerequisites met." : "Prerequisites not met."}` };
}

function multiclassRequirements(classId) {
  return multiclassCheck(classId).text;
}

// PHB p.164: what a new class grants when you multiclass into it (ERLW p.56 for the artificer).
const MULTICLASS_PROFICIENCIES = {
  artificer: { armor: "Light armor, medium armor, shields", tools: "Thieves' tools, tinker's tools" },
  barbarian: { armor: "Shields", weapons: "Simple weapons, martial weapons" },
  bard: { armor: "Light armor", tools: "One musical instrument", skills: 1 },
  cleric: { armor: "Light armor, medium armor, shields" },
  druid: { armor: "Light armor, medium armor, shields" },
  fighter: { armor: "Light armor, medium armor, shields", weapons: "Simple weapons, martial weapons" },
  monk: { weapons: "Simple weapons, shortswords" },
  paladin: { armor: "Light armor, medium armor, shields", weapons: "Simple weapons, martial weapons" },
  ranger: { armor: "Light armor, medium armor, shields", weapons: "Simple weapons, martial weapons", skills: 1 },
  rogue: { armor: "Light armor", tools: "Thieves' tools", skills: 1 },
  sorcerer: {},
  warlock: { armor: "Light armor", weapons: "Simple weapons" },
  wizard: {}
};

// The level-up plan the dialog edits; nothing touches the sheet until Level up is pressed.
let levelPlan = null;

// 2024 rules: every class picks its subclass at 3rd level.
function subclassUnlockLevel(classId, rules) {
  return rules === "2024" ? 3 : SUBCLASS_LEVEL[classId] || 3;
}

function levelTarget() {
  const plan = levelPlan;
  if (plan.target === "new") {
    const base = getClasses()[plan.newClassId];
    return base ? { key: "new", classId: base.id, from: 0, to: 1, cls: base, rules: plan.newRules, subclassName: "" } : null;
  }
  const entry = classEntries().find(item => item.key === plan.target) || classEntries()[0];
  let cls = entryClass(entry);
  // A subclass picked in this dialog can make a martial class a caster (Eldritch Knight, Arcane Trickster).
  if (plan.subclass && cls.casterType === "none") {
    const official = officialSubclasses.find(item => item.index === plan.subclass);
    const casting = lookupBySubclass(SUBCLASS_CASTING, official?.name);
    if (casting) cls = { ...cls, ...casting };
  }
  return { key: entry.key, classId: entry.classId, from: entry.level, to: entry.level + 1, cls, rules: entry.rules, subclassName: entry.subclassName };
}

function averageHitDieGain(cls) {
  return Math.max(1, Math.ceil(cls.hitDie / 2) + 1 + mod("con")) + sheetExtraHp();
}

function levelUpPicks(cls, from, to) {
  const spells = cls.preparedFormula === "known" || cls.knownTable
    ? Math.max(0, (knownSpellCap(cls, to) ?? 0) - (knownSpellCap(cls, from) ?? 0))
    : Number(cls.table[to - 1]?.newSpells || 0);
  return { spells, cantrips: Math.max(0, cantripCap(cls, to) - cantripCap(cls, from)) };
}

function openLevelDialog() {
  if (totalLevel() >= 20 && !isRuleBroken("level-cap")) {
    breakRule("level-cap", "Characters top out at level 20. Past that, the DMG suggests Epic Boons instead of levels.", openLevelDialog);
    return;
  }
  levelPlan = { target: "primary", newClassId: "", newRules: "2014", subclass: "", hp: null, choices: [] };
  renderLevelDialog();
  document.querySelector("#levelDialog").showModal();
}

function renderLevelDialog() {
  const plan = levelPlan;
  const owned = new Set(classEntries().map(entry => entry.classId));
  const newOptions = Object.values(getClasses()).filter(cls => !owned.has(cls.id));
  if (!plan.newClassId) plan.newClassId = newOptions[0]?.id || "";
  const target = levelTarget();
  document.querySelector("#levelDialogTitle").textContent = `Level up to ${totalLevel() + 1}`;
  const check = plan.target === "new" && plan.newClassId ? multiclassCheck(plan.newClassId) : null;
  document.querySelector("#levelClassChoice").innerHTML = `
    <legend>Which class gains the level?</legend>
    ${classEntries().map(entry => `
      <label class="inline-check level-class-option">
        <input type="radio" name="levelTarget" value="${escapeHtml(entry.key)}" ${plan.target === entry.key ? "checked" : ""}>
        <span>${escapeHtml(getClasses()[entry.classId]?.name || entry.classId)} ${entry.level} → ${entry.level + 1}</span>
        <span class="edition-badge" data-edition="${entry.rules}">${entry.rules}</span>
      </label>`).join("")}
    ${newOptions.length ? `
      <label class="inline-check level-class-option">
        <input type="radio" name="levelTarget" value="new" ${plan.target === "new" ? "checked" : ""}>
        <span>Multiclass into a new class</span>
      </label>
      <div class="level-multiclass" ${plan.target === "new" ? "" : "hidden"}>
        <label>New class
          <select id="levelNewClass">${newOptions.map(cls => `<option value="${escapeHtml(cls.id)}" ${cls.id === plan.newClassId ? "selected" : ""}>${escapeHtml(cls.name)}</option>`).join("")}</select>
        </label>
        <label>Rules edition
          <select id="levelNewRules">
            <option value="2014" ${plan.newRules === "2014" ? "selected" : ""}>2014</option>
            <option value="2024" ${plan.newRules === "2024" ? "selected" : ""}>2024</option>
          </select>
        </label>
        ${check ? `<p class="${check.met ? "muted" : "level-warning"}">${escapeHtml(check.text)}</p>` : ""}
        ${plan.newClassId && MULTICLASS_PROFICIENCIES[plan.newClassId] ? `<p class="muted">You gain: ${escapeHtml(multiclassGrantText(plan.newClassId))}</p>` : ""}
      </div>` : ""}
  `;
  if (!target) return;
  const cls = target.cls;
  const average = averageHitDieGain(cls);
  if (plan.hp === null || plan.hpClass !== cls.id) {
    plan.hp = average;
    plan.hpClass = cls.id;
  }
  document.querySelector("#levelHp").innerHTML = `
    <label>Hit points gained
      <span class="level-hp-row">
        <input id="levelHpInput" type="number" min="1" max="99" value="${plan.hp}">
        <button type="button" class="ghost" data-level-hp="average">Average (${average})</button>
        <button type="button" class="ghost" data-level-hp="roll">${icon("dice-five")}Roll 1d${cls.hitDie}${formatMod(mod("con") + sheetExtraHp())}</button>
      </span>
    </label>`;
  renderLevelSummaryAndChoices();
}

function multiclassGrantText(classId) {
  const grant = MULTICLASS_PROFICIENCIES[classId] || {};
  return [grant.armor, grant.weapons, grant.tools, grant.skills ? `${grant.skills} skill from the class list` : ""].filter(Boolean).join(", ") || "no new proficiencies";
}

function renderLevelSummaryAndChoices() {
  const plan = levelPlan;
  const target = levelTarget();
  if (!target) return;
  const { cls, from, to, rules } = target;
  const row = cls.table[to - 1] || {};
  const profNow = proficiencyBonus(totalLevel());
  const profNext = proficiencyBonus(totalLevel() + 1);
  const multiclassed = Boolean(character.multiclasses?.length) || target.key === "new";
  document.querySelector("#levelSummary").innerHTML = `
    <div><span class="edition-badge" data-edition="${rules}">${rules} rules</span> ${escapeHtml(cls.name)} level ${to}</div>
    <div>Proficiency bonus: ${formatMod(profNext)}${profNext !== profNow ? ` (up from ${formatMod(profNow)})` : ""} · Hit dice gain a d${cls.hitDie}</div>
    <div>Features: ${escapeHtml(row.features || "No new class feature this level.")}</div>
    ${cls.casterType === "none" ? "" : `<div>${multiclassed ? "Spell slots follow the multiclass spellcaster table (PHB p.165)." : `Spell slots: ${spellSlotsFor(cls, to).map((count, index) => count ? `${ordinal(index + 1)} ×${count}` : "").filter(Boolean).join(" · ") || "none yet"}`}</div>`}
    ${rules === "2024" ? `<div class="muted">2024 rules: check the 2024 Player's Handbook for this level's features; ForgeSheet's automation follows the 2014 tables.</div>` : ""}
  `;
  const subclassOptions = officialSubclasses.filter(item => item.classIndex === target.classId);
  const needsSubclass = !target.subclassName && to >= subclassUnlockLevel(target.classId, rules) && subclassOptions.length;
  document.querySelector("#levelSubclass").innerHTML = needsSubclass ? `
    <label>Choose your ${escapeHtml(subclassOptions[0].flavor || "subclass")}
      <select id="levelSubclassSelect">
        <option value="">Decide later</option>
        ${subclassOptions.map(item => `<option value="${escapeHtml(item.index)}" ${plan.subclass === item.index ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
      </select>
    </label>` : "";
  renderLevelAsi(asiLevelsFor(cls).has(to), rules);
  const picks = target.key === "new" && cls.preparedFormula !== "known" && !cls.knownTable
    ? { spells: 0, cantrips: cantripCap(cls, 1) }
    : levelUpPicks(cls, from, to);
  if (rules === "2024") picks.spells = 0;
  const choices = document.querySelector("#levelSpellChoices");
  choices.innerHTML = "";
  plan.choices = [];
  const kinds = [...Array(picks.cantrips).fill(0), ...Array(picks.spells).fill("leveled")];
  kinds.forEach(kind => {
    const newRow = { id: crypto.randomUUID(), index: "", prepared: false };
    plan.choices.push(newRow);
    const wrapper = document.createElement("div");
    wrapper.className = "level-spell-choice";
    wrapper.innerHTML = `<select class="spell-select" aria-label="${kind === 0 ? "New cantrip" : "New spell"}"></select><span class="muted">${kind === 0 ? "New cantrip" : cls.id === "wizard" ? "Spellbook spell" : "New spell"}</span>`;
    fillSpellSelect(wrapper.querySelector("select"), "", spellChoicesForLevelChoice(kind, cls, to));
    wrapper.querySelector("select").addEventListener("change", event => {
      newRow.index = event.target.value;
      plan.choices.forEach(choice => {
        if (choice !== newRow && choice.index === newRow.index) choice.index = "";
      });
    });
    choices.appendChild(wrapper);
  });
  if (!kinds.length && cls.casterType !== "none") {
    choices.innerHTML = `<p class="muted">${rules === "2024" ? "2024 casters prepare spells from their class list: update them in the Spells tab after leveling." : `No new spells to learn this level${cls.preparedFormula === "known" ? "" : " (you prepare from your full class list)"}.`}</p>`;
  }
}

function renderLevelAsi(due, rules) {
  const root = document.querySelector("#levelAsiPrompt");
  if (!due) {
    root.innerHTML = "";
    return;
  }
  root.innerHTML = `
    <fieldset class="level-asi">
      <legend>Ability score improvement${rules === "2024" ? " (2024: or any feat you qualify for)" : ""}</legend>
      <label class="inline-check"><input type="radio" name="asiMode" value="asi" checked> Raise scores: +1 and +1 (pick the same ability twice for +2)</label>
      <div class="level-asi-picks">
        ${["asiFirst", "asiSecond"].map((id, index) => `<select id="${id}" aria-label="${index ? "Second" : "First"} ability to raise">${ABILITIES.map(([ability, label]) => `<option value="${ability}">${label} (${character.abilities[ability]})</option>`).join("")}</select>`).join("")}
      </div>
      <label class="inline-check"><input type="radio" name="asiMode" value="feat"> Take a feat instead
        <select id="asiFeat" aria-label="Feat">${FEAT_PRESETS.filter(name => name !== "Ability Score Improvement").map(name => {
          const blocked = featBlocked(name);
          return `<option value="${escapeHtml(name)}" ${blocked === "already taken" ? "disabled" : ""}>${escapeHtml(name)}${blocked ? ` (${escapeHtml(blocked)})` : ""}</option>`;
        }).join("")}</select>
        <select id="asiFeatAbility" aria-label="Ability the feat raises" hidden></select>
      </label>
    </fieldset>`;
  const featSelect = document.querySelector("#asiFeat");
  const firstOpen = [...featSelect.options].find(option => !option.disabled && !featBlocked(option.value));
  if (firstOpen) featSelect.value = firstOpen.value;
  const syncAbility = () => {
    const options = FEAT_RULES[featSelect.value]?.ability || [];
    const pick = document.querySelector("#asiFeatAbility");
    pick.hidden = !options.length;
    pick.innerHTML = options.map(id => `<option value="${id}">+1 ${id.toUpperCase()} (${character.abilities[id]})</option>`).join("");
  };
  featSelect.addEventListener("change", syncAbility);
  syncAbility();
}

function spellChoicesForLevelChoice(kind, cls, toLevel) {
  const maximum = maxSpellLevelFor(cls, toLevel);
  const selected = new Set(character.spells.map(row => row.index).filter(Boolean));
  return allSpells
    .filter(item => !selected.has(item.index))
    .filter(item => spellMatchesClass(item, cls))
    .filter(item => kind === 0 ? item.level === 0 : item.level > 0 && item.level <= maximum)
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

function handleLevelDialogInput(event) {
  const plan = levelPlan;
  if (!plan) return;
  const target = event.target;
  if (target.name === "levelTarget") {
    plan.target = target.value;
    plan.subclass = "";
    renderLevelDialog();
  } else if (target.id === "levelNewClass") {
    plan.newClassId = target.value;
    renderLevelDialog();
  } else if (target.id === "levelNewRules") {
    plan.newRules = target.value;
    renderLevelDialog();
  } else if (target.id === "levelSubclassSelect") {
    plan.subclass = target.value;
    renderLevelSummaryAndChoices();
  } else if (target.id === "levelHpInput") {
    plan.hp = Number(target.value);
  }
}

function handleLevelDialogClick(event) {
  const button = event.target.closest("[data-level-hp]");
  if (!button) return;
  const target = levelTarget();
  if (button.dataset.levelHp === "average") {
    levelPlan.hp = averageHitDieGain(target.cls);
    document.querySelector("#levelHpInput").value = levelPlan.hp;
    return;
  }
  // Each level adds at least 1 HP even with a CON penalty (PHB p.15).
  openRoll({
    label: `Hit points for ${target.cls.name} ${target.to}`,
    formula: `1d${target.cls.hitDie}${formatMod(mod("con") + sheetExtraHp())}`,
    onResult: result => {
      levelPlan.hp = Math.max(1, result.total);
      document.querySelector("#levelHpInput").value = levelPlan.hp;
      return `+${levelPlan.hp} HP goes into the level-up form.`;
    }
  });
}

// Validates the plan; rule breaks ask once, then the level is applied.
function applyLevelUp(event) {
  event.preventDefault();
  const plan = levelPlan;
  const target = plan && levelTarget();
  if (!target) return;
  const hp = Math.round(Number(document.querySelector("#levelHpInput")?.value || plan.hp));
  if (!Number.isFinite(hp) || hp < 1) {
    showToast(`<span class="toast-label">Hit points gained must be at least 1</span>`, { tone: "fumble" });
    return;
  }
  plan.hp = hp;
  if (target.key === "new" && !plan.prereqOk) {
    const check = multiclassCheck(target.classId);
    if (!check.met && !isRuleBroken("multiclass-prereq")) {
      breakRule("multiclass-prereq", check.text, () => { plan.prereqOk = true; document.querySelector("#confirmLevelUp").click(); });
      return;
    }
  }
  const asiMode = document.querySelector('input[name="asiMode"]:checked')?.value || "";
  const asiPicks = asiMode === "asi" ? [document.querySelector("#asiFirst").value, document.querySelector("#asiSecond").value] : [];
  const feat = asiMode === "feat" ? document.querySelector("#asiFeat").value : "";
  const featAbility = feat && FEAT_RULES[feat]?.ability ? document.querySelector("#asiFeatAbility").value : "";
  const raised = [...asiPicks, featAbility].filter(Boolean);
  const over = ABILITIES.find(([id]) => Number(character.abilities[id]) + raised.filter(item => item === id).length > 20);
  if (over && !plan.capOk && !isRuleBroken("ability-cap")) {
    breakRule("ability-cap", `${over[1]} would go above 20, the most an ability score can reach without magic.`, () => { plan.capOk = true; document.querySelector("#confirmLevelUp").click(); });
    return;
  }
  if (feat && featBlocked(feat) && !plan.featOk && !isRuleBroken("feat-prereq")) {
    breakRule("feat-prereq", `${feat} ${featBlocked(feat)}.`, () => { plan.featOk = true; document.querySelector("#confirmLevelUp").click(); });
    return;
  }
  commitLevelUp(target, { hp, asiMode, raised, feat, featAbility });
}

function commitLevelUp(target, { hp, asiMode, raised, feat, featAbility }) {
  const plan = levelPlan;
  const conBefore = mod("con");
  const levelsBefore = totalLevel();
  const cap = isRuleBroken("ability-cap") || plan.capOk ? 30 : 20;
  raised.forEach(ability => {
    character.abilities[ability] = clamp(Number(character.abilities[ability]) + 1, 1, cap);
  });
  let featNote = "";
  if (asiMode === "asi") character.planner.feats.push("Ability Score Improvement");
  if (feat) {
    if (featAbility) {
      featNote = ` +1 ${featAbility.toUpperCase()}`;
      if (FEAT_RULES[feat]?.saveProficiency && !character.saveProficiencies.includes(featAbility)) {
        character.saveProficiencies.push(featAbility);
        featNote += `, ${featAbility.toUpperCase()} save proficiency`;
      }
    }
    character.planner.feats.push(feat);
    character.features = mergeLines(character.features, [`Feat (level ${levelsBefore + 1}): ${feat}${featNote ? ` (${featNote.trim()})` : ""}`]);
  }
  const official = plan.subclass ? officialSubclasses.find(item => item.index === plan.subclass) : null;
  const cls = target.cls;
  if (target.key === "primary") {
    if (official) applyOfficialSubclass(official.index, false);
    character.level += 1;
    if (asiMode) character.asiAcknowledgedLevel = character.level;
    rebuildClassFeatureLines(currentClass(), character.level);
  } else {
    let entry = character.multiclasses.find(item => item.id === target.key);
    if (target.key === "new") {
      entry = { id: crypto.randomUUID(), classId: target.classId, level: 0, subclassName: "", rules: target.rules };
      character.multiclasses.push(entry);
      const grant = MULTICLASS_PROFICIENCIES[target.classId] || {};
      if (grant.armor) character.backgroundDetails.armor = mergeList(character.backgroundDetails.armor, grant.armor.split(", "));
      if (grant.weapons) character.backgroundDetails.weapons = mergeList(character.backgroundDetails.weapons, grant.weapons.split(", "));
      if (grant.tools) character.backgroundDetails.tools = mergeList(character.backgroundDetails.tools, grant.tools.split(", "));
    }
    entry.level += 1;
    if (official) entry.subclassName = official.name;
    const row = cls.table[entry.level - 1];
    if (row?.features) character.features = mergeLines(character.features, [`${cls.name} ${entry.level}: ${row.features}`]);
  }
  // A higher CON modifier raises HP for every earlier level too; Tough adds 2 per earlier level when taken.
  const retro = (mod("con") - conBefore) * levelsBefore + (feat === "Tough" ? 2 * levelsBefore : 0);
  const gained = hp + retro;
  character.maxHp = Number(character.maxHp || 0) + gained;
  character.hp = Number(character.hp || 0) + gained;
  character.hitDice = hitDiceText();
  plan.choices.filter(row => row.index).forEach(row => {
    const spell = allSpells.find(item => item.index === row.index);
    row.level = spell?.level ?? 1;
    row.prepared = isPreparedCaster(cls) && row.level > 0 && canPrepareAnother();
    character.spells.push(row);
  });
  levelPlan = null;
  document.querySelector("#levelDialog").close();
  persistAndRender();
  celebrate();
  const grantSkills = target.key === "new" ? MULTICLASS_PROFICIENCIES[target.classId]?.skills : 0;
  showToast(`<span class="toast-label">Level ${totalLevel()}: ${escapeHtml(cls.name)} ${target.to}</span><span>+${gained} max HP${retro ? ` (${formatMod(retro)} for earlier levels)` : ""}${asiMode === "asi" ? " · ability scores raised" : feat ? ` · ${escapeHtml(feat)}${escapeHtml(featNote)}` : ""}${grantSkills ? ` · pick ${grantSkills} ${escapeHtml(cls.name)} skill in Edit` : ""}</span>`, { tone: "crit", duration: 9000 });
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
    speciesAbilities: [],
    speciesSkills: [],
    speciesCantrip: "",
    speciesFeat: "",
    speciesFeatAbility: "",
    abilities: Object.fromEntries(ABILITIES.map(([id]) => [id, 10]))
  };
}

// Species choices made at creation: Half-Elf and Variant Human +1s, bonus skills, a feat, a High Elf cantrip.
function speciesChoices(species = creationDraft?.species) {
  return SPECIES_GRANTS[species]?.choose || {};
}

// Chosen species increases, in pick order: [2, 1] means the first pick gets +2 and the second +1.
function speciesBonusSteps(species) {
  return speciesChoices(species).bonuses || [];
}

function chosenSpeciesBonus(draft, id) {
  const index = (draft.speciesAbilities || []).indexOf(id);
  return index < 0 ? 0 : speciesBonusSteps(draft.species)[index] || 0;
}

// Point buy (PHB p.13): scores 8-15, 27 points.
const POINT_BUY_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

function pointBuySpent(abilities) {
  const scores = ABILITIES.map(([id]) => Number(abilities[id]));
  return scores.every(score => score in POINT_BUY_COST) ? scores.reduce((sum, score) => sum + POINT_BUY_COST[score], 0) : null;
}

function pointBuyText() {
  const spent = pointBuySpent(creationDraft.abilities);
  return spent === null ? "Point buy: every score must be 8 to 15." : `Point buy: ${spent} of 27 points spent${spent > 27 ? ` (${spent - 27} over)` : ""}.`;
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
    <p class="create-detail">${species ? `<strong>${species[0]}.</strong> ${species[2]}` : "Choose a species, or skip this screen and type a homebrew species on the sheet later."}</p>
    ${renderCreateSpeciesExtras()}
    <label class="create-name create-search">Find a species
      <input type="search" data-create-species-search autocomplete="off" placeholder="Search ${SPECIES_PRESETS.length} species: aasimar, tortle, warforged...">
    </label>
    <div class="create-option-grid" id="createSpeciesGrid">
      ${SPECIES_PRESETS.map(([name, speed, , glyph]) => `
        <button type="button" class="create-option-card ${name === creationDraft.species ? "is-selected" : ""}" data-create-option="species:${escapeHtml(name)}" data-species-name="${escapeHtml(name.toLowerCase())}">
          <span class="create-glyph">${icon(glyph)}</span>
          <strong>${escapeHtml(name)}</strong>
          <span>${speed} ft speed</span>
        </button>
      `).join("")}
    </div>
    <p class="create-detail" id="createSpeciesEmpty" hidden>No species match that search.</p>
  `;
}

function renderCreateSpeciesExtras() {
  const choose = speciesChoices();
  const parts = [];
  if (choose.cantripFrom) {
    const cantrips = allSpells.filter(spell => spell.level === 0 && (spell.classes || []).some(item => item.index === choose.cantripFrom));
    parts.push(`<label class="create-name">${escapeHtml(choose.cantripFrom.charAt(0).toUpperCase() + choose.cantripFrom.slice(1))} cantrip
      <select data-create-field="speciesCantrip"><option value="">Choose later</option>${cantrips.map(spell => `<option value="${escapeHtml(spell.index)}" ${spell.index === creationDraft.speciesCantrip ? "selected" : ""}>${escapeHtml(spell.name)}</option>`).join("")}</select>
    </label>`);
  }
  if (choose.feat) parts.push(`<p class="create-detail">${escapeHtml(creationDraft.species)} also takes a feat: pick it on the Abilities step, once your scores are set.</p>`);
  return parts.join("");
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
  const fromBackground = new Set([...backgroundSkills(creationDraft.background), ...(SPECIES_GRANTS[creationDraft.species]?.skills || []), ...creationDraft.speciesSkills]);
  const allowed = CLASS_SKILL_CHOICES[cls.id] === "any" || !CLASS_SKILL_CHOICES[cls.id] ? SKILLS.map(([id]) => id) : CLASS_SKILL_CHOICES[cls.id];
  const picks = classSkillPicks(cls);
  return `
    <h4 class="create-subtitle">${escapeHtml(cls.name)} skills: choose ${picks} (${creationDraft.skills.length}/${picks})</h4>
    <div class="create-skill-chips">
      ${allowed.map(id => {
        const label = SKILLS.find(([skill]) => skill === id)?.[1] || id;
        const owned = fromBackground.has(id);
        const chosen = creationDraft.skills.includes(id);
        return `<button type="button" class="condition-chip ${chosen || owned ? "active" : ""}" data-create-skill="${id}" ${owned ? "disabled title=\"From your background or species\"" : ""}>${owned ? icon("check") : ""}${escapeHtml(label)}</button>`;
      }).join("")}
    </div>
    ${renderCreateSpeciesSkills()}
  `;
}

function renderCreateSpeciesSkills() {
  const picks = speciesChoices().skills || 0;
  if (!picks) return "";
  const owned = new Set([...backgroundSkills(creationDraft.background), ...(SPECIES_GRANTS[creationDraft.species]?.skills || []), ...creationDraft.skills]);
  return `
    <h4 class="create-subtitle">${escapeHtml(creationDraft.species)} skills: choose ${picks} of any (${creationDraft.speciesSkills.length}/${picks})</h4>
    <div class="create-skill-chips">
      ${SKILLS.map(([id, label]) => {
        const chosen = creationDraft.speciesSkills.includes(id);
        const taken = owned.has(id);
        return `<button type="button" class="condition-chip ${chosen || taken ? "active" : ""}" data-create-species-skill="${id}" ${taken ? "disabled" : ""}>${taken ? icon("check") : ""}${escapeHtml(label)}</button>`;
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

function draftAbilitiesWithBonus(draft = creationDraft) {
  const bonus = SPECIES_PRESETS.find(([name]) => name === draft.species)?.[4] || {};
  const featAbility = FEAT_RULES[draft.speciesFeat]?.ability?.includes(draft.speciesFeatAbility) ? draft.speciesFeatAbility : "";
  return Object.fromEntries(ABILITIES.map(([id]) => [id, clamp(Number(draft.abilities[id] || 10) + (bonus[id] || 0) + chosenSpeciesBonus(draft, id) + (featAbility === id ? 1 : 0), 1, 30)]));
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
    <div class="create-ability-methods">
      <button type="button" class="secondary" data-create-standard>Use the standard array${cls ? ` for ${escapeHtml(cls.name)}` : ""}</button>
      <button type="button" class="ghost" data-create-pointbuy>Start point buy</button>
    </div>
    <p class="create-detail" id="createPointBuy">${pointBuyText()}</p>
    <p class="create-detail">The standard array puts 15, 14, 13, 12, 10, 8 into the abilities your class leans on most. ${speciesBonusText(creationDraft.species) ? `${escapeHtml(creationDraft.species)} bonuses (${speciesBonusText(creationDraft.species)}) are added on top.` : ""}</p>
    ${renderCreateSpeciesAbilities()}
  `;
}

function renderCreateSpeciesFeat() {
  if (!speciesChoices().feat) return "";
  const source = draftFeatSource();
  const cls = draftClass() || { casterType: "none" };
  const abilities = FEAT_RULES[creationDraft.speciesFeat]?.ability || [];
  return `
    <label class="create-name">${escapeHtml(creationDraft.species)} feat
      <select data-create-field="speciesFeat"><option value="">Choose later</option>${FEAT_PRESETS.filter(name => name !== "Ability Score Improvement").map(name => {
        const blocked = featBlocked(name, source, cls);
        return `<option value="${escapeHtml(name)}" ${name === creationDraft.speciesFeat ? "selected" : ""} ${blocked ? "disabled" : ""}>${escapeHtml(name)}${blocked ? ` (${escapeHtml(blocked)})` : ""}</option>`;
      }).join("")}</select>
    </label>
    ${abilities.length ? `<label class="create-name">Feat increase
      <select data-create-field="speciesFeatAbility">${abilities.map(id => `<option value="${id}" ${id === creationDraft.speciesFeatAbility ? "selected" : ""}>+1 ${id.toUpperCase()}</option>`).join("")}</select>
    </label>` : ""}
  `;
}

function renderCreateSpeciesAbilities() {
  const steps = speciesBonusSteps(creationDraft.species);
  if (!steps.length) return renderCreateSpeciesFeat();
  const excluded = new Set(speciesChoices().exclude || []);
  const next = steps[creationDraft.speciesAbilities.length];
  return `
    <h4 class="create-subtitle">${escapeHtml(creationDraft.species)}: ${steps.map(step => `+${step}`).join(" and ")} to different abilities${next ? `, next pick gets +${next}` : ""} (${creationDraft.speciesAbilities.length}/${steps.length})</h4>
    <div class="create-skill-chips">
      ${ABILITIES.filter(([id]) => !excluded.has(id)).map(([id, label]) => {
        const bonus = chosenSpeciesBonus(creationDraft, id);
        return `<button type="button" class="condition-chip ${bonus ? "active" : ""}" data-create-species-ability="${id}">${escapeHtml(label)}${bonus ? ` +${bonus}` : ""}</button>`;
      }).join("")}
    </div>
    ${renderCreateSpeciesFeat()}
  `;
}

function renderCreateReview() {
  const cls = draftClass();
  if (!cls) return `<h3 class="create-screen-title">Almost there</h3><p class="create-detail">Choose a class before creating your character.</p>`;
  const speciesRow = SPECIES_PRESETS.find(([name]) => name === creationDraft.species);
  const abilities = draftAbilitiesWithBonus();
  const bonus = speciesRow?.[4] || {};
  const conMod = Math.floor((abilities.con - 10) / 2);
  const hp = averageHpFor(cls, creationDraft.level, conMod) + extraHpPerLevel({ species: creationDraft.species, classId: cls.id, subclass: creationDraft.subclass, feats: [creationDraft.speciesFeat] }) * creationDraft.level;
  const subclass = officialSubclasses.find(item => item.index === creationDraft.subclass);
  const skills = [...new Set([...backgroundSkills(creationDraft.background), ...creationDraft.skills, ...creationDraft.speciesSkills, ...(SPECIES_GRANTS[creationDraft.species]?.skills || [])])]
    .map(id => SKILLS.find(([skill]) => skill === id)?.[1]).filter(Boolean);
  return `
    <h3 class="create-screen-title">Ready for adventure</h3>
    <div class="create-review-hero">
      <span class="create-glyph">${speciesRow ? icon(speciesRow[3]) : ""}${icon(CLASS_GLYPHS[cls.id] || "sparkle")}</span>
      <strong>${escapeHtml(creationDraft.name.trim() || "New Character")}</strong>
      <span>${escapeHtml([creationDraft.species, cls.name, subclass ? `(${subclass.name})` : ""].filter(Boolean).join(" "))} · ${escapeHtml(creationDraft.background || "No background")} · Level ${creationDraft.level}</span>
    </div>
    <div class="create-review-stats">
      ${ABILITIES.map(([id]) => {
        const extra = (bonus[id] || 0) + chosenSpeciesBonus(creationDraft, id);
        return `<span><strong>${id.toUpperCase()}</strong> ${abilities[id]} (${formatMod(Math.floor((abilities[id] - 10) / 2))})${extra ? ` <em>+${extra}</em>` : ""}</span>`;
      }).join("")}
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
  if (event.target.matches("[data-create-species-search]")) {
    const query = event.target.value.trim().toLowerCase();
    let shown = 0;
    document.querySelectorAll("#createSpeciesGrid [data-species-name]").forEach(card => {
      card.hidden = Boolean(query) && !card.dataset.speciesName.includes(query);
      if (!card.hidden) shown += 1;
    });
    document.querySelector("#createSpeciesEmpty").hidden = shown > 0;
  }
  const ability = event.target.dataset.createAbility;
  if (ability) {
    creationDraft.abilities[ability] = wholeNumber(event.target.value, creationDraft.abilities[ability], 1, 30);
    const modLabel = event.target.closest(".create-ability-card")?.querySelector(".ability-mod");
    if (modLabel) modLabel.textContent = formatMod(Math.floor((creationDraft.abilities[ability] - 10) / 2));
    const pointBuy = document.querySelector("#createPointBuy");
    if (pointBuy) pointBuy.textContent = pointBuyText();
  }
}

// On commit (blur/Enter) the box shows the value that will actually be used.
function handleCreateFieldChange(event) {
  if (!creationDraft) return;
  if (event.target.dataset.createField === "speciesFeat") {
    creationDraft.speciesFeatAbility = FEAT_RULES[creationDraft.speciesFeat]?.ability?.[0] || "";
    renderCreateStep();
    return;
  }
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
  const speciesSkill = event.target.closest("[data-create-species-skill]");
  if (speciesSkill) {
    const id = speciesSkill.dataset.createSpeciesSkill;
    const picks = speciesChoices().skills || 0;
    if (creationDraft.speciesSkills.includes(id)) creationDraft.speciesSkills = creationDraft.speciesSkills.filter(item => item !== id);
    else if (creationDraft.speciesSkills.length < picks) creationDraft.speciesSkills.push(id);
    renderCreateStep();
    return;
  }
  const speciesAbility = event.target.closest("[data-create-species-ability]");
  if (speciesAbility) {
    const id = speciesAbility.dataset.createSpeciesAbility;
    const picks = speciesBonusSteps(creationDraft.species).length;
    if (creationDraft.speciesAbilities.includes(id)) creationDraft.speciesAbilities = creationDraft.speciesAbilities.filter(item => item !== id);
    else if (creationDraft.speciesAbilities.length < picks) creationDraft.speciesAbilities.push(id);
    renderCreateStep();
    return;
  }
  if (event.target.closest("[data-create-pointbuy]")) {
    ABILITIES.forEach(([id]) => { creationDraft.abilities[id] = 8; });
    renderCreateStep();
    return;
  }
  const option = event.target.closest("[data-create-option]");
  if (option) {
    const [field, ...value] = option.dataset.createOption.split(":");
    creationDraft[field] = value.join(":");
    if (field === "species") {
      creationDraft.speciesAbilities = [];
      creationDraft.speciesSkills = [];
      creationDraft.speciesCantrip = "";
      creationDraft.speciesFeat = "";
      creationDraft.speciesFeatAbility = "";
      const granted = new Set(SPECIES_GRANTS[creationDraft.species]?.skills || []);
      creationDraft.skills = creationDraft.skills.filter(id => !granted.has(id));
    }
    if (field === "classId") {
      creationDraft.subclass = "";
      creationDraft.skills = [];
    }
    if (field === "background") {
      creationDraft.backgroundChosen = true;
      const owned = new Set(backgroundSkills(creationDraft.background));
      creationDraft.skills = creationDraft.skills.filter(id => !owned.has(id));
      creationDraft.speciesSkills = creationDraft.speciesSkills.filter(id => !owned.has(id));
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

// Each level adds at least 1 HP, even with a CON penalty (PHB p.15).
function averageHpFor(cls, level, conMod) {
  return Math.max(1, cls.hitDie + conMod) + (level - 1) * Math.max(1, Math.ceil(cls.hitDie / 2) + 1 + conMod);
}

// HP added every level on top of the class die: Hill Dwarf, the Tough feat, Draconic Resilience.
function extraHpPerLevel({ species, classId, subclass, feats = [] }) {
  return speciesHpPerLevel(species) + (feats.includes("Tough") ? 2 : 0) + (classId === "sorcerer" && lookupBySubclass({ draconic: true }, subclass) ? 1 : 0);
}

function sheetExtraHp() {
  return extraHpPerLevel({ species: character.species, classId: currentClass().id, subclass: character.subclassName, feats: character.planner?.feats || [] });
}

// Feats with prerequisites, a +1 ability choice (half feats), or that can be taken more than once (PHB ch.6, XGtE).
const FEAT_RULES = {
  "Actor": { ability: ["cha"] },
  "Athlete": { ability: ["str", "dex"] },
  "Defensive Duelist": { needs: "DEX 13", ok: c => c.abilities.dex >= 13 },
  "Durable": { ability: ["con"] },
  "Elemental Adept": { needs: "spellcasting", ok: (c, cls) => cls.casterType !== "none", repeatable: true },
  "Grappler": { needs: "STR 13", ok: c => c.abilities.str >= 13 },
  "Heavily Armored": { ability: ["str"], needs: "medium armor", ok: c => /medium/i.test(c.backgroundDetails?.armor || "") },
  "Heavy Armor Master": { ability: ["str"], needs: "heavy armor", ok: c => /heavy|all armor/i.test(c.backgroundDetails?.armor || "") },
  "Inspiring Leader": { needs: "CHA 13", ok: c => c.abilities.cha >= 13 },
  "Keen Mind": { ability: ["int"] },
  "Lightly Armored": { ability: ["str", "dex"] },
  "Linguist": { ability: ["int"] },
  "Medium Armor Master": { needs: "medium armor", ok: c => /medium/i.test(c.backgroundDetails?.armor || "") },
  "Moderately Armored": { ability: ["str", "dex"], needs: "light armor", ok: c => /light|medium|all armor/i.test(c.backgroundDetails?.armor || "") },
  "Observant": { ability: ["int", "wis"] },
  "Resilient": { ability: ["str", "dex", "con", "int", "wis", "cha"], saveProficiency: true },
  "Ritual Caster": { needs: "INT or WIS 13", ok: c => c.abilities.int >= 13 || c.abilities.wis >= 13 },
  "Skulker": { needs: "DEX 13", ok: c => c.abilities.dex >= 13 },
  "Spell Sniper": { needs: "spellcasting", ok: (c, cls) => cls.casterType !== "none" },
  "Tavern Brawler": { ability: ["str", "con"] },
  "War Caster": { needs: "spellcasting", ok: (c, cls) => cls.casterType !== "none" },
  "Weapon Master": { ability: ["str", "dex"] },
  // Xanathar's racial feats.
  "Bountiful Luck": { needs: "halfling", ok: c => /halfling/i.test(c.species) },
  "Dragon Fear": { ability: ["str", "con", "cha"], needs: "dragonborn", ok: c => /dragonborn/i.test(c.species) },
  "Dragon Hide": { ability: ["str", "con", "cha"], needs: "dragonborn", ok: c => /dragonborn/i.test(c.species) },
  "Drow High Magic": { needs: "drow", ok: c => /drow/i.test(c.species) },
  "Dwarven Fortitude": { ability: ["con"], needs: "dwarf", ok: c => /dwarf|duergar/i.test(c.species) },
  "Elven Accuracy": { ability: ["dex", "int", "wis", "cha"], needs: "elf or half-elf", ok: c => /elf|eladrin|shadar-kai/i.test(c.species) },
  "Fade Away": { ability: ["dex", "int"], needs: "gnome", ok: c => /gnome/i.test(c.species) },
  "Fey Teleportation": { ability: ["int", "cha"], needs: "high elf", ok: c => /high elf/i.test(c.species) },
  "Flames of Phlegethos": { ability: ["int", "cha"], needs: "tiefling", ok: c => /tiefling/i.test(c.species) },
  "Infernal Constitution": { ability: ["con"], needs: "tiefling", ok: c => /tiefling/i.test(c.species) },
  "Orcish Fury": { ability: ["str", "con"], needs: "half-orc", ok: c => /orc/i.test(c.species) },
  "Prodigy": { needs: "half-elf, half-orc or human", ok: c => /half-elf|half-orc|human/i.test(c.species) },
  "Second Chance": { ability: ["dex", "con", "cha"], needs: "halfling", ok: c => /halfling/i.test(c.species) },
  "Squat Nimbleness": { ability: ["str", "dex"], needs: "dwarf or a Small species", ok: c => /dwarf|gnome|halfling|goblin|kobold/i.test(c.species) },
  "Wood Elf Magic": { needs: "wood elf", ok: c => /wood elf/i.test(c.species) },
  "Svirfneblin Magic": { needs: "deep gnome", ok: c => /deep gnome|svirfneblin/i.test(c.species) },
  // Tasha's.
  "Chef": { ability: ["con", "wis"] },
  "Crusher": { ability: ["str", "con"] },
  "Eldritch Adept": { needs: "spellcasting or Pact Magic", ok: (c, cls) => cls.casterType !== "none" },
  "Fey Touched": { ability: ["int", "wis", "cha"] },
  "Fighting Initiate": { needs: "martial weapons", ok: c => /martial/i.test(c.backgroundDetails?.weapons || "") },
  "Gunner": { ability: ["dex"] },
  "Metamagic Adept": { needs: "spellcasting or Pact Magic", ok: (c, cls) => cls.casterType !== "none" },
  "Piercer": { ability: ["str", "dex"] },
  "Shadow Touched": { ability: ["int", "wis", "cha"] },
  "Skill Expert": { ability: ["str", "dex", "con", "int", "wis", "cha"] },
  "Slasher": { ability: ["str", "dex"] },
  "Telekinetic": { ability: ["int", "wis", "cha"] },
  "Telepathic": { ability: ["int", "wis", "cha"] }
};

// Why a feat can't be taken right now, or "" when it can. Works for the sheet or a creation draft.
function featBlocked(name, source = character, cls = currentClass()) {
  const rule = FEAT_RULES[name] || {};
  if (!rule.repeatable && hasFeat(name, source)) return "already taken";
  if (rule.ok && !rule.ok(source, cls)) return `needs ${rule.needs}`;
  return "";
}

// The draft as a character-shaped object, for feat prerequisites at creation.
function draftFeatSource() {
  const cls = draftClass();
  const [armor, weapons] = CLASS_PROFICIENCIES[cls?.id] || ["", ""];
  const grants = SPECIES_GRANTS[creationDraft.species] || {};
  return {
    abilities: draftAbilitiesWithBonus(),
    species: creationDraft.species,
    backgroundDetails: { armor: [armor, ...(grants.armor || [])].join(", "), weapons: [weapons, ...(grants.weapons || [])].join(", ") },
    planner: { feats: [] }
  };
}

function speciesHpPerLevel(species) {
  return SPECIES_GRANTS[species]?.hpPerLevel || 0;
}

function speciesBonusText(species) {
  const bonus = SPECIES_PRESETS.find(([name]) => name === species)?.[4] || {};
  return Object.entries(bonus).map(([id, value]) => `${formatMod(value)} ${id.toUpperCase()}`).join(", ");
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
  const abilities = draftAbilitiesWithBonus(draft);
  const official = officialSubclasses.find(item => item.index === draft.subclass);
  const [armor, weapons, tools] = CLASS_PROFICIENCIES[cls.id] || [cls.armor || "", cls.weapons || "", ""];
  const featureLines = cls.table.slice(0, clamp(Number(draft.level || 1), 1, 20))
    .filter(row => row.features)
    .map(row => `Level ${row.level}: ${row.features}`);
  const level = wholeNumber(draft.level, 1, 1, 20);
  const grants = SPECIES_GRANTS[draft.species] || {};
  const hp = averageHpFor(cls, level, Math.floor((abilities.con - 10) / 2)) + extraHpPerLevel({ species: draft.species, classId: cls.id, subclass: draft.subclass, feats: [draft.speciesFeat] }) * level;
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
    saveProficiencies: [...new Set([...(CLASS_SAVES[cls.id] || cls.saves || []), ...(FEAT_RULES[draft.speciesFeat]?.saveProficiency && draft.speciesFeatAbility ? [draft.speciesFeatAbility] : [])])],
    proficientSkills: [...new Set([...draft.skills, ...draft.speciesSkills, ...(grants.skills || [])])],
    spells: [...(grants.cantrips || []), draft.speciesCantrip].filter(Boolean).map(index => ({ id: crypto.randomUUID(), index, level: 0, prepared: false, racial: true })),
    planner: { ...defaultCharacter().planner, feats: draft.speciesFeat ? [draft.speciesFeat] : [] },
    acAuto: true,
    equipment: [],
    resources: [],
    classOptions: [],
    actions: [],
    autoSpells: [],
    features: [speciesRow ? `Species: ${draft.species}. ${speciesRow[2]}` : "", grants.feature || "", draft.speciesFeat ? `Feat (${draft.species}): ${draft.speciesFeat}` : "", ...featureLines].filter(Boolean).join("\n"),
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
  const speciesGrant = SPECIES_GRANTS[character.species] || {};
  const speciesSkills = (speciesGrant.skills || []).length + (speciesGrant.choose?.skills || 0);
  const expectedSkills = classSkills + (character.background ? 2 : 0) + speciesSkills;
  // Expertise: rogues 2 at 1st and 2 more at 6th; bards 2 at 3rd and 2 more at 10th.
  const expertiseDue = cls.id === "rogue" ? (level >= 6 ? 4 : 2) : cls.id === "bard" ? (level >= 10 ? 4 : level >= 3 ? 2 : 0) : 0;
  const asiCount = [...asiLevelsFor(cls)].filter(asiLevel => asiLevel <= level).length;
  const featCount = (character.planner?.feats || []).length;
  // Lowest legal max HP: full first die, then a roll of 1 + CON (min 1) every level after.
  const minHp = Math.max(1, cls.hitDie + conMod) + (level - 1) * Math.max(1, 1 + conMod) + sheetExtraHp() * level;
  const averageHp = averageHpFor(cls, level, conMod);
  const caster = cls.casterType !== "none";
  const expectedSlots = caster ? spellSlotsFor(cls, level).some(Boolean) : false;
  const items = [
    ["Identity", "Name, species, and background chosen.", Boolean(character.name && character.species && character.background), "rp"],
    // ponytail: subclass required at level 3 for everyone; some classes pick at 1-2, refine per-class if it matters
    ["Subclass", level >= subclassUnlock ? "Choose and record your subclass." : `Chosen at level ${subclassUnlock}.`, level < subclassUnlock || Boolean(character.subclassName), "#officialSubclassSelect"],
    ["Ability scores", "Set all six ability scores.", ABILITIES.every(([id]) => Number(character.abilities[id]) >= 1), "#abilities"],
    ["Skills", `Pick ${expectedSkills} skill proficiencies (${classSkills} from ${cls.name}${character.background ? ", 2 from your background" : ""}${speciesSkills ? `, ${speciesSkills} from your species` : ""}).`, (character.proficientSkills || []).length >= expectedSkills, "#skills"],
    ...(expertiseDue ? [["Expertise", `Choose ${expertiseDue} skills to double your proficiency in (${(character.expertSkills || []).length} chosen).`, (character.expertSkills || []).length >= expertiseDue, "#skills"]] : []),
    ["Hit dice", `Should be ${level}d${cls.hitDie} for ${cls.name}.`, character.hitDice === `${level}d${cls.hitDie}`, "#hitDiceInput"],
    ["Saving throws", "Mark your class's two saving throw proficiencies.", (character.saveProficiencies || []).length >= 2, "#abilities"],
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
  button.innerHTML = `${icon("list-checks")}<span class="btn-label">${remaining.length ? `Checklist (${remaining.length})` : "Checklist"}</span>`;
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

