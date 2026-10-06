function renderBuilderTools() {
  ensureGrantedSpells();
  renderBuilderWizard();
  renderBackgroundTools();
  renderAdvancementTimeline();
  renderFeatureAutomation();
  renderPlanner();
  renderCustomFeats();
  renderClassChoicesBlock();
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
  // Skill proficiencies and expertise are changed in Edit mode, so going to them unlocks it.
  if (target === "#skills" && character.identityLocked) {
    character.identityLocked = false;
    persistAndRender();
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

// After a long rest: open the Spells tab with the prepare checkboxes highlighted (play.js takeRest).
function focusPreparedSpells() {
  activateTab("spells");
  goToTarget("#preparedCount");
  const toggles = [...document.querySelectorAll("#spells .prepare-toggle")].filter(label => !label.querySelector("input")?.disabled);
  toggles.forEach(label => {
    label.classList.remove("flash-target");
    void label.offsetWidth;
    label.classList.add("flash-target");
  });
  toggles[0]?.querySelector("input")?.focus({ preventScroll: true });
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

// Background skills, tools and languages. picks: { slotId: value } from the creation wizard; without picks the
// choice text stays on the sheet as a reminder (Builder "Apply preset").
function applyBackgroundPresetNamed(presetName, picks = {}) {
  const preset = BACKGROUND_PRESETS.find(([name]) => name === presetName);
  if (!preset) return;
  const [name, skills, tools, feature] = preset;
  character.background = name;
  character.features = mergeLines(character.features, [`Background Feature: ${feature}`]);
  const languages = [];
  const toolGrants = [];
  tools.split(",").map(item => item.trim()).filter(Boolean).forEach((token, index) => {
    const grant = parseGrantToken(token);
    const chosen = Array.from({ length: grant.count || 0 }, (_, n) => picks[`bg-${grant.kind}-${index}-${n}`]).filter(Boolean);
    const list = grant.kind === "language" || /language/i.test(token) ? languages : toolGrants;
    list.push(...(chosen.length ? chosen : [token]));
  });
  if (toolGrants.length) character.backgroundDetails.tools = mergeList(character.backgroundDetails.tools, toolGrants);
  if (languages.length) character.backgroundDetails.languages = mergeList(character.backgroundDetails.languages, languages);
  const granted = skills.split(",").flatMap((token, index) => {
    const parsed = parseSkillToken(token);
    return parsed.fixed ? [parsed.fixed] : Array.from({ length: parsed.count }, (_, n) => picks[`bg-skill-${index}-${n}`]);
  });
  granted.filter(Boolean).forEach(skill => {
    if (!character.proficientSkills.includes(skill)) character.proficientSkills.push(skill);
  });
}

// ---- Choice text in species and background rows ----
function skillIdFor(text) {
  return SKILLS.find(([id, label]) => id === text || label.toLowerCase() === String(text).trim().toLowerCase())?.[0] || "";
}

// "Insight" -> fixed; "Arcana/Nature/Religion (pick one)" or "Two of A/B/C/D" -> a pick; "one Int/Wis/Cha skill" -> those abilities.
function parseSkillToken(token) {
  const text = token.trim();
  const fixed = skillIdFor(text);
  if (fixed) return { fixed };
  const count = /^two\b/i.test(text) ? 2 : 1;
  const abilities = text.match(/one ((?:str|dex|con|int|wis|cha)(?:\/(?:str|dex|con|int|wis|cha))*) skill/i)?.[1];
  if (abilities) return { count, options: SKILLS.filter(([, , ability]) => abilities.toLowerCase().split("/").includes(ability)).map(([id]) => id) };
  const listed = text.replace(/^two of /i, "").replace(/\(pick one\)/i, "").split("/").map(skillIdFor).filter(Boolean);
  if (listed.length > 1) return { count, options: listed };
  return { count, options: SKILLS.map(([id]) => id) };
}

function toolOptions(part) {
  const text = part.toLowerCase();
  if (/gaming set/.test(text)) return TOOL_GROUPS.gaming;
  if (/artisan/.test(text)) return TOOL_GROUPS.artisan;
  if (/instrument/.test(text)) return TOOL_GROUPS.instrument;
  if (/tools? of your choice/.test(text)) return Object.values(TOOL_GROUPS).flat();
  const named = Object.values(TOOL_GROUPS).flat().find(item => item.toLowerCase() === text.replace(/^one\s+/, "").trim());
  return named ? [named] : [];
}

// Tool and language grant text -> { kind, count, options, label } for a choice, or { fixed } for a plain grant.
function parseGrantToken(token) {
  const text = token.trim();
  const lower = text.toLowerCase();
  const count = /^(two|2)\b/.test(lower) ? 2 : /^three\b/.test(lower) ? 3 : 1;
  const languages = [...STANDARD_LANGUAGES, ...EXOTIC_LANGUAGES];
  if (/\blanguages?\b/.test(lower)) return { kind: "language", count, label: /exotic/.test(lower) ? "Language (one may be exotic)" : "Language", options: languages };
  const alternatives = lower.split(/\s+or\s+/).map(part => part.trim());
  if (alternatives.length > 1 && alternatives.some(part => languages.some(name => name.toLowerCase() === part))) {
    return { kind: "language", count: 1, label: "Language", options: text.split(/\s+or\s+/i).map(part => part.trim()) };
  }
  const listText = lower.replace(/^two of /, "");
  const parts = /^two of /.test(lower) ? listText.split("/") : alternatives;
  const options = [...new Set(parts.flatMap(toolOptions))];
  if (options.length > 1 && (parts.length > 1 || /^(one|two|three)\b|^gaming set$|^artisan's tools$|^musical instrument$/.test(lower))) {
    return { kind: "tool", count, label: /instrument/.test(lower) && parts.length === 1 ? "Musical instrument" : /gaming/.test(lower) && parts.length === 1 ? "Gaming set" : /artisan/.test(lower) && parts.length === 1 ? "Artisan's tools" : "Tool", options };
  }
  return { fixed: text };
}

// Every pick the creation wizard asks for outside the class step: background skills/tools/languages, species
// languages and tools, and replacements when a background repeats a proficiency you already get (PHB p.125).
function creationSlots(draft = creationDraft) {
  const slots = [];
  const add = (id, group, kind, label, options) => slots.push({ id, group, kind, label, options });
  const skillOptions = ids => ids.map(id => [id, SKILLS.find(([skill]) => skill === id)?.[1] || id]);
  const background = BACKGROUND_PRESETS.find(([name]) => name === draft.background);
  const speciesGrants = SPECIES_GRANTS[draft.species] || {};
  const speciesSkills = new Set([...(speciesGrants.skills || []), ...draft.speciesSkills]);
  if (background) {
    background[1].split(",").forEach((token, index) => {
      const parsed = parseSkillToken(token);
      for (let n = 0; n < (parsed.count || 0); n += 1) add(`bg-skill-${index}-${n}`, "background", "skill", "Background skill", skillOptions(parsed.options));
    });
    background[2].split(",").forEach((token, index) => {
      const grant = parseGrantToken(token);
      for (let n = 0; n < (grant.count || 0); n += 1) add(`bg-${grant.kind}-${index}-${n}`, "background", grant.kind, grant.label, grant.options.map(item => [item, item]));
    });
    // Duplicate proficiencies get a replacement of the same kind.
    backgroundSkills(draft.background).filter(id => speciesSkills.has(id)).forEach((id, n) => {
      add(`rep-skill-${n}`, "background", "skill", `Replacement for ${SKILLS.find(([skill]) => skill === id)?.[1]} (you already have it)`, skillOptions(SKILLS.map(([skill]) => skill).filter(skill => !speciesSkills.has(skill) && !backgroundSkills(draft.background).includes(skill))));
    });
  }
  [...(speciesGrants.languages || []), ...(speciesGrants.tools || [])].forEach((token, index) => {
    const grant = parseGrantToken(token);
    for (let n = 0; n < (grant.count || 0); n += 1) add(`sp-${grant.kind}-${index}-${n}`, "species", grant.kind, grant.label, grant.options.map(item => [item, item]));
  });
  if (speciesGrants.choose?.tool) add("sp-tool-choice", "species", "tool", "Tool proficiency", speciesGrants.choose.tool.map(item => [item, item]));
  // Class tool choices (bard instruments, monk and artificer artisan's tools), shown on the Class step.
  String(CLASS_PROFICIENCIES[draft.classId]?.[2] || "").split(",").forEach((token, index) => {
    const grant = parseGrantToken(token);
    for (let n = 0; n < (grant.count || 0); n += 1) add(`cls-${grant.kind}-${index}-${n}`, "class", grant.kind, grant.label, grant.options.map(item => [item, item]));
  });
  // The same tool from two sources: pick a different tool instead (PHB p.125). Fixed grants and picks both count.
  const toolSlots = slots.filter(slot => slot.kind === "tool");
  const fixedTools = text => String(text || "").split(",").filter(token => parseGrantToken(token).fixed).map(token => token.trim());
  const owned = [
    ...fixedTools(CLASS_PROFICIENCIES[draft.classId]?.[2]), ...(speciesGrants.tools || []).flatMap(fixedTools), ...fixedTools(background?.[2]),
    ...toolSlots.map(slot => draft.picks[slot.id]).filter(Boolean)
  ];
  const seen = new Set();
  const all = Object.values(TOOL_GROUPS).flat();
  owned.filter(tool => {
    const key = tool.toLowerCase();
    return seen.has(key) || !seen.add(key);
  }).forEach((tool, n) => {
    add(`rep-tool-${n}`, "background", "tool", `Replacement for ${tool} (you already have it)`, all.filter(item => !seen.has(item.toLowerCase())).map(item => [item, item]));
  });
  return slots;
}

// A value picked in one select isn't offered again in another select of the same kind (three different instruments).
function creationSlotsHtml(group) {
  const slots = creationSlots();
  return slots.filter(slot => slot.group === group).map(slot => {
    const taken = new Set(slots.filter(other => other !== slot && other.kind === slot.kind).map(other => creationDraft.picks[other.id]).filter(Boolean));
    return `
    <label class="create-name">${escapeHtml(slot.label)}
      <select data-create-pick="${slot.id}"><option value="">Choose later</option>${slot.options.filter(([value]) => !taken.has(value)).map(([value, label]) => `<option value="${escapeHtml(value)}" ${creationDraft.picks[slot.id] === value ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}</select>
    </label>`;
  }).join("");
}

// ---- Builder planner ----
let plannerFeat = { name: "" };

function applyBackgroundPreset() {
  applyBackgroundPresetNamed(document.querySelector("#backgroundPreset").value);
  persistAndRender();
}

// The background's own tables when it has them, else the general prompts.
function generatePersonality() {
  const tables = BACKGROUND_PERSONALITY[character.background] || PERSONALITY_PROMPTS;
  character.backgroundDetails.trait = pick(tables.traits);
  character.backgroundDetails.ideal = pick(tables.ideals);
  character.backgroundDetails.bond = pick(tables.bonds);
  character.backgroundDetails.flaw = pick(tables.flaws);
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
    ["Hit dice", `Use ${hitDiceText()}.`, character.hitDice === hitDiceText()],
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
  character.hitDice = hitDiceText();
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
  const featSelect = document.querySelector("#featSelect");
  featSelect.innerHTML = `<option value="">Ability Score Improvement</option>${featOptionsHtml(plannerFeat.name, character)}`;
  featSelect.value = plannerFeat.name;
  featSelect.onchange = () => {
    plannerFeat = { name: featSelect.value };
    const rule = featRule(plannerFeat.name);
    if (rule?.ability.length === 1) plannerFeat.ability = rule.ability[0];
    renderPlannerFeatPicks();
  };
  renderPlannerFeatPicks();
  const planner = character.planner || { multiclass: [], feats: [] };
  const requirements = multiclassRequirements(document.querySelector("#multiclassSelect").value);
  const bonus = character.bonusFeats || [];
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
      <span>${escapeHtml([...planner.feats, ...bonus.map(item => `${item.name} (${item.source})`)].join(", ") || "None")}</span>
      ${planner.feats.map((name, index) => `<button class="ghost" data-remove-plan="feat-at:${index}" type="button">Remove ${escapeHtml(name)}</button>`).join("")}
      ${bonus.map(item => `<button class="ghost" data-remove-plan="bonus-feat:${escapeHtml(item.name)}" type="button">Remove ${escapeHtml(item.name)}</button>`).join("")}
    </article>
  `;
}

function renderPlannerFeatPicks() {
  const root = document.querySelector("#featPlannerPicks");
  if (!root) return;
  root.innerHTML = plannerFeat.name ? `${featDetailHtml(plannerFeat.name, character, plannerFeat.variant)}<div class="feat-picks">${featPicksHtml(plannerFeat.name, plannerFeat, character, "planner")}</div>` : "";
  root.onchange = event => {
    if (updateFeatPickState(plannerFeat, event.target)) renderPlannerFeatPicks();
  };
}

// What a feat still needs picked before it can be taken (its variant, its +1).
function featPickProblem(state) {
  const rule = featRule(state.name);
  if (!rule) return "";
  if (rule.variants && !state.variant) return `Choose which ${state.name} option you take.`;
  if (rule.ability.length > 1 && !rule.ability.includes(state.ability)) return `Choose the ability ${state.name} raises.`;
  return "";
}

function addMulticlassPlan() {
  const id = document.querySelector("#multiclassSelect").value;
  if (!id || character.planner.multiclass.includes(id)) return;
  character.planner.multiclass.push(id);
  persistAndRender();
}

// "Add feat" records a feat taken at an earlier level: it applies the feat like a level-up does (B16).
function addFeatPlan() {
  const state = plannerFeat;
  if (!state.name) {
    character.planner.feats.push("Ability Score Improvement");
    character.asiAcknowledgedLevel = character.level;
    persistAndRender();
    return;
  }
  const problem = featPickProblem(state);
  if (problem) {
    showToast(`<span class="toast-label">${escapeHtml(problem)}</span>`);
    return;
  }
  const blocked = featBlocked(state.name, character, state.variant);
  if (blocked === "already taken") {
    showToast(`<span class="toast-label">${escapeHtml(state.name)} is already taken</span>`);
    return;
  }
  const take = () => {
    const note = takeFeat(state, { kind: "planner", hp: true });
    character.asiAcknowledgedLevel = character.level;
    plannerFeat = { name: "" };
    persistAndRender();
    showToast(`<span class="toast-label">${escapeHtml(featEntry(state.name, state.variant))} added</span>${note ? `<span>${escapeHtml(note)}</span>` : ""}`);
  };
  if (blocked) breakRule("feat-prereq", `${state.name} ${blocked}.`, take);
  else take();
}

function handlePlannerClick(event) {
  const button = event.target.closest("[data-remove-plan]");
  if (!button) return;
  const [kind, ...rest] = button.dataset.removePlan.split(":");
  const value = rest.join(":");
  if (kind === "multiclass") character.planner.multiclass = character.planner.multiclass.filter(item => item !== value);
  if (kind === "feat-at") {
    const entry = character.planner.feats[Number(value)];
    if (entry === "Ability Score Improvement") character.planner.feats.splice(Number(value), 1);
    else if (entry) dropFeat(entry);
  }
  if (kind === "bonus-feat") dropFeat(value);
  persistAndRender();
}

// Species spells cast without a slot (SPECIES_MAGIC), added as the character reaches each spell's level.
function ensureGrantedSpells() {
  const magic = SPECIES_MAGIC[character.species];
  const level = totalLevel();
  const ability = magic?.ability === "choice" ? character.speciesSpellAbility || "cha" : magic?.ability;
  const wanted = (magic?.spells || []).filter(([, at]) => level >= at);
  const before = character.spells.length;
  // Only the rows SPECIES_MAGIC adds (they carry free); species cantrips chosen at creation stay.
  character.spells = character.spells.filter(row => row.source?.kind !== "species" || !row.free || (row.source.name === character.species && wanted.some(([index]) => index === row.index)));
  let changed = character.spells.length !== before;
  wanted.forEach(([index, , per, castAt]) => {
    if (character.spells.some(row => row.index === index && row.source?.kind === "species" && row.free)) return;
    const spellLevel = allSpells.find(item => item.index === index)?.level ?? 1;
    character.spells.push({ id: crypto.randomUUID(), index, level: spellLevel, prepared: false, source: { kind: "species", name: character.species, ability }, free: per === "will" ? "will" : `1/${per}`, ...(castAt ? { castAt } : {}) });
    changed = true;
  });
  if (changed) persist();
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

// Built-in table first, then a custom class's own multiclass data (its "needs 13 in" and what it grants).
function multiclassRequirementsFor(classId) {
  return MULTICLASS_REQUIREMENTS[classId] || (getClasses()[classId]?.multiclass?.requires?.length ? getClasses()[classId].multiclass.requires : null);
}

function multiclassProficienciesFor(classId) {
  return MULTICLASS_PROFICIENCIES[classId] || getClasses()[classId]?.multiclass?.grants || null;
}

function multiclassCheck(classId) {
  const describe = id => {
    const groups = multiclassRequirementsFor(id);
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

// PHB p.164: what a new class grants when you multiclass into it (TCE "Optional Rule: Multiclassing" for the artificer).
const MULTICLASS_PROFICIENCIES = {
  artificer: { armor: "Light armor, medium armor, shields", tools: "Thieves' tools, tinker's tools" },
  barbarian: { armor: "Shields", weapons: "Simple weapons, martial weapons" },
  bard: { armor: "Light armor", tools: "One musical instrument", skills: 1 },
  // VERIFY: Blood Hunter (2020) multiclass list; one review reads it without medium armor and shields.
  bloodhunter: { armor: "Light armor, medium armor, shields", weapons: "Simple weapons, martial weapons", tools: "Alchemist's supplies" },
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

// 2024 rules: every class picks its subclass at 3rd level. A custom class sets its own level.
function subclassUnlockLevel(classId, rules) {
  return rules === "2024" ? 3 : getClasses()[classId]?.subclassLevel || SUBCLASS_LEVEL[classId] || 3;
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
    const casting = lookupBySubclass(SUBCLASS_CASTING, official?.index);
    if (casting) cls = { ...cls, ...casting };
  }
  return { key: entry.key, classId: entry.classId, from: entry.level, to: entry.level + 1, cls, rules: entry.rules, subclassName: entry.subclassName };
}

// ---- Level-up dialog ----
// Average HP for a level in one class entry; Draconic Resilience only counts for a draconic sorcerer entry (J4).
function averageHitDieGain(cls, target = levelTarget()) {
  return Math.max(1, Math.ceil(cls.hitDie / 2) + 1 + mod("con")) + sheetExtraHp(target?.classId || cls.id, target?.subclassName || "");
}

// Most HP one level can add: the full hit die + CON modifier + per-level bonuses (Hill Dwarf, Tough, Draconic Resilience).
function maxHitDieGain(cls, target = levelTarget()) {
  return Math.max(1, cls.hitDie + mod("con")) + sheetExtraHp(target?.classId || cls.id, target?.subclassName || "");
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
  // Start on the class levelled last (alternating multiclass levels), if it's still on the sheet.
  const last = classEntries().some(entry => entry.key === character.lastLevelClass) ? character.lastLevelClass : "primary";
  levelPlan = { target: last, newClassId: "", newRules: "2014", subclass: "", hp: null, choices: [], asiMode: "asi", asiPicks: ["str", "str"], feat: { name: "" }, classChoices: structuredCloneSafe(character.classChoices) };
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
  // Multiclassing into bard grants one musical instrument of your choice (PHB p.164).
  const toolChoice = plan.newClassId ? parseGrantToken(multiclassProficienciesFor(plan.newClassId)?.tools || "") : {};
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
        ${plan.newClassId && multiclassProficienciesFor(plan.newClassId) ? `<p class="muted">You gain: ${escapeHtml(multiclassGrantText(plan.newClassId))}</p>` : ""}
        ${toolChoice.options ? `<label>${escapeHtml(toolChoice.label)}
          <select id="levelNewTool"><option value="">Choose later</option>${toolChoice.options.map(item => `<option value="${escapeHtml(item)}" ${plan.newTool === item ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}</select>
        </label>` : ""}
      </div>` : ""}
  `;
  if (!target) return;
  const cls = target.cls;
  const average = averageHitDieGain(cls, target);
  if (plan.hp === null || plan.hpClass !== cls.id) {
    plan.hp = average;
    plan.hpClass = cls.id;
  }
  document.querySelector("#levelHp").innerHTML = `
    <label>Hit points gained
      <span class="level-hp-row">
        <input id="levelHpInput" type="number" min="1" max="${maxHitDieGain(cls, target)}" value="${plan.hp}">
        <button type="button" class="ghost" data-level-hp="average">Average (${average})</button>
        <button type="button" class="ghost" data-level-hp="roll">${icon("dice-five")}Roll 1d${cls.hitDie}${formatMod(mod("con") + sheetExtraHp(target.classId, target.subclassName))}</button>
      </span>
    </label>
    <p class="muted">Raising CON or taking Tough at this level adds HP for every level, this one included, when you confirm.</p>`;
  renderLevelSummaryAndChoices();
}

// "Countercharm, college feature" -> "Countercharm, Additional Magical Secrets" once the subclass is known.
function levelFeatureText(features, subclassSlug, level) {
  const names = (SUBCLASS_FEATURES[subclassSlug]?.features || []).filter(([at]) => at === level).map(([, name]) => name);
  if (!features || !names.length) return features || "";
  const parts = features.split(",").map(part => part.trim());
  const placeholder = parts.findIndex(part => /feature$/i.test(part));
  if (placeholder < 0) return features;
  parts.splice(placeholder, 1, ...names);
  return parts.join(", ");
}

function multiclassGrantText(classId) {
  const grant = multiclassProficienciesFor(classId) || {};
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
  const pactSlots = isPactCaster(cls) ? spellSlotsFor(cls, to) : [];
  const slotLine = isPactCaster(cls)
    ? `Pact slots: ${pactSlots.length ? `${pactSlots[pactSlots.length - 1]} × ${ordinal(pactSlots.length)} level, regained on a short rest` : "none yet"}${multiclassed ? " (pact slots are separate from the multiclass table)" : ""}.`
    : multiclassed ? "Spell slots follow the multiclass spellcaster table (PHB p.165)." : `Spell slots: ${spellSlotsFor(cls, to).map((count, index) => count ? `${ordinal(index + 1)} ×${count}` : "").filter(Boolean).join(" · ") || "none yet"}`;
  const gained = rules === "2024" ? [] : levelFeaturesGained(target);
  document.querySelector("#levelSummary").innerHTML = `
    <div><span class="edition-badge" data-edition="${rules}">${rules} rules</span> ${escapeHtml(cls.name)} level ${to}</div>
    <div>Proficiency bonus: ${formatMod(profNext)}${profNext !== profNow ? ` (up from ${formatMod(profNow)})` : ""} · Hit dice gain a d${cls.hitDie}</div>
    ${gained.length ? `<div class="level-features"><span>New features (tap one to read it):</span>${gained.map(feature => featureRowHtml({ name: feature.name, summary: feature.summary, chips: [[`${cls.name} ${feature.level}`], feature.source === "TCE-optional" ? ["Optional (Tasha's)", "is-optional"] : null] })).join("")}</div>`
      : `<div>Features: ${escapeHtml(levelFeatureText(row.features, plan.subclass || (classEntries().find(entry => entry.key === target.key) ? subclassIndexFor(classEntries().find(entry => entry.key === target.key)) : ""), to) || "No new class feature this level.")}</div>`}
    ${cls.casterType === "none" ? "" : `<div>${escapeHtml(slotLine)}</div>`}
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
  renderLevelClassChoices();
  renderLevelSkillChoices();
  // A new prepared-caster multiclass learns no spells, except a wizard's six spellbook spells (PHB p.114).
  const picks = target.key === "new" && cls.preparedFormula !== "known" && !cls.knownTable && cls.id !== "wizard"
    ? { spells: 0, cantrips: cantripCap(cls, 1) }
    : levelUpPicks(cls, from, to);
  if (rules === "2024") picks.spells = 0;
  // Subclass bonus cantrips (Nature, Arcana, Death domains; Circle of the Land) arrive with the subclass level.
  const entryNow = classEntries().find(entry => entry.key === target.key);
  const bonus = SUBCLASS_BONUS_CANTRIPS[plan.subclass || (entryNow ? subclassIndexFor(entryNow) : "")];
  if (bonus && from < bonus.level && to >= bonus.level) picks.cantrips += bonus.count;
  // Mystic Arcanum (PHB p.108): one 6th/7th/8th/9th-level warlock spell at 11/13/15/17, separate from spells known.
  const arcanum = rules !== "2024" ? arcanumLevelsFor(cls)[to] || 0 : 0;
  // Magical Secrets (bard 10/14/18): two of this level's new spells may come from any class list (PHB p.54).
  // Additional Magical Secrets (Lore 6): two more from any list, on top of spells known (PHB p.55).
  const secrets = target.classId === "bard" && rules !== "2024" && [10, 14, 18].includes(to) ? Math.min(2, picks.spells) : 0;
  const lore = target.classId === "bard" && rules !== "2024" && to === 6 && (plan.subclass || (entryNow ? subclassIndexFor(entryNow) : "")) === "lore" ? 2 : 0;
  const choices = document.querySelector("#levelSpellChoices");
  choices.innerHTML = "";
  plan.choices = [];
  plan.replace = null;
  const kinds = [...Array(picks.cantrips).fill(0), ...Array(picks.spells - secrets).fill("leveled"), ...Array(secrets).fill("secret"), ...Array(lore).fill("lore"), ...(arcanum ? ["arcanum"] : [])];
  const pickLabel = kind => kind === 0 ? "New cantrip" : kind === "arcanum" ? `Mystic Arcanum (${ordinal(arcanum)})` : kind === "secret" ? "Magical Secrets: any class's list" : kind === "lore" ? "Additional Magical Secrets: any class's list, not counted as known" : cls.id === "wizard" ? "Spellbook spell" : "New spell";
  const refills = [];
  kinds.forEach(kind => {
    // A prepared caster's new spellbook spells are prepared only if the player leaves Prepare ticked.
    const preparable = isPreparedCaster(cls) && kind !== 0 && kind !== "arcanum";
    const newRow = { id: crypto.randomUUID(), index: "", prepared: false, ...(preparable ? { prepare: true } : {}), ...(kind === "secret" ? { secret: true } : kind === "lore" ? { secret: "lore" } : {}) };
    plan.choices.push(newRow);
    const wrapper = document.createElement("div");
    wrapper.className = "level-spell-choice";
    wrapper.innerHTML = `<select class="spell-select" aria-label="${pickLabel(kind)}"></select><span class="muted">${pickLabel(kind)}</span>${preparable ? `<label class="inline-check"><input type="checkbox" data-level-prepare checked> Prepare</label>` : ""}`;
    if (preparable) wrapper.querySelector("[data-level-prepare]").addEventListener("change", event => { newRow.prepare = event.target.checked; });
    const select = wrapper.querySelector("select");
    fillSpellSelect(select, "", spellChoicesForLevelChoice(kind, cls, to, newRow));
    // EK/AT: once the free off-school pick is used, the other picks narrow to the two schools.
    if (cls.schools && kind !== 0) refills.push(() => { fillSpellSelect(select, newRow.index, spellChoicesForLevelChoice(kind, cls, to, newRow)); newRow.index = select.value; });
    select.addEventListener("change", event => {
      newRow.index = event.target.value;
      plan.choices.forEach(choice => {
        if (choice !== newRow && choice.index === newRow.index) choice.index = "";
      });
      refills.forEach(refill => refill());
    });
    choices.appendChild(wrapper);
  });
  if (plan.choices.some(choice => choice.prepare)) choices.insertAdjacentHTML("afterbegin", `<p class="muted">Ticked spells are prepared now if you have room under your prepared limit.</p>`);
  if (!kinds.length && cls.casterType !== "none") {
    choices.insertAdjacentHTML("afterbegin", `<p class="muted">${rules === "2024" ? "2024 casters prepare spells from their class list: update them in the Spells tab after leveling." : `No new spells to learn this level${cls.preparedFormula === "known" ? "" : " (you prepare from your full class list)"}.`}</p>`);
  }
  // Known casters may swap one known spell for another on gaining a level (bard, sorcerer, warlock, ranger, EK, AT).
  const knownRows = (cls.preparedFormula === "known" || cls.knownTable) && from >= 1 && rules !== "2024"
    ? character.spells.filter(row => spellRowHasSpell(row) && spellLevelForRow(row) > 0 && spellLevelForRow(row) <= 5 && !spellAlwaysPrepared(row) && !row.itemId && !row.secret && !row.ritualBook && spellRowKey(row) === target.key)
    : [];
  if (knownRows.length) {
    plan.replace = { from: "", to: "" };
    const wrapper = document.createElement("fieldset");
    wrapper.className = "level-section level-swap";
    wrapper.innerHTML = `<legend>Swap one known spell?</legend>
      <p class="muted">Gaining a ${escapeHtml(cls.name)} level lets you trade one ${escapeHtml(cls.name)} spell you know for another from the class list, of a level you can cast. Optional.</p>
      <div class="level-spell-choice"><select aria-label="Known spell to replace"><option value="">No swap</option>${knownRows.map(row => `<option value="${escapeHtml(row.id)}">${escapeHtml(spellDisplayName(row))}</option>`).join("")}</select><select class="spell-select" aria-label="Replacement spell"></select></div>`;
    const [oldSelect, newSelect] = wrapper.querySelectorAll("select");
    fillSpellSelect(newSelect, "", spellChoicesForLevelChoice("leveled", cls, to));
    oldSelect.addEventListener("change", event => { plan.replace.from = event.target.value; });
    newSelect.addEventListener("change", event => { plan.replace.to = event.target.value; });
    choices.appendChild(wrapper);
  }
}

// The sheet as it would be after this level: the target entry one level up, with the subclass picked here.
function levelAfterSource(target = levelTarget(), plan = levelPlan) {
  if (target.key === "primary") return { ...character, level: character.level + 1, subclass: plan.subclass ? { ...character.subclass, officialIndex: plan.subclass } : character.subclass };
  const multiclasses = target.key === "new"
    ? [...(character.multiclasses || []), { id: "new", classId: target.classId, level: 1, subclassName: "", officialIndex: plan.subclass, rules: target.rules }]
    : (character.multiclasses || []).map(entry => entry.id === target.key ? { ...entry, level: entry.level + 1, officialIndex: plan.subclass || entry.officialIndex } : entry);
  return { ...character, multiclasses };
}

// Class and subclass features this level adds, with their summaries (the Features tab rows).
function levelFeaturesGained(target = levelTarget(), plan = levelPlan) {
  const group = classFeatureRows(levelAfterSource(target, plan)).find(item => item.entry.key === target.key);
  return (group?.reached || []).filter(row => row.level === target.to);
}

// "INT 16 → 18 (+4)" for the abilities an ASI raises.
function levelAsiResultText(picks, source = character) {
  return ABILITIES.filter(([id]) => picks.includes(id)).map(([id]) => {
    const now = Number(source.abilities[id]) || 10;
    const next = now + picks.filter(item => item === id).length;
    return `${id.toUpperCase()} ${now} → ${next} (${formatMod(Math.floor((next - 10) / 2))})`;
  }).join(" · ");
}

// Skill picks a level grants: Lore Bonus Proficiencies, Blessings of Knowledge, Survivalist, and class Expertise.
function levelSkillGroups(target = levelTarget(), plan = levelPlan) {
  if (!target) return [];
  const entry = classEntries().find(item => item.key === target.key);
  const slug = plan.subclass || (entry ? subclassIndexFor(entry) : "");
  const gains = (classId, sub, level) => target.classId === classId && slug === sub && target.to >= level && (target.from < level || plan.subclass === sub);
  const picked = group => group.fixed ? group.options : (plan.skillPicks?.[group.key] || []).filter(id => group.options.includes(id));
  const owned = character.proficientSkills || [];
  const experts = character.expertSkills || [];
  const all = SKILLS.map(([id]) => id);
  const groups = [];
  // College of Lore (PHB p.54): three skills of your choice at 3rd level.
  if (gains("bard", "lore", 3)) groups.push({ key: "lore", label: "Bonus Proficiencies: 3 skills", count: 3, prof: true, options: all.filter(id => !owned.includes(id)) });
  // Knowledge Domain (PHB p.59): two of Arcana, History, Nature, Religion, proficient with double the bonus.
  if (gains("cleric", "knowledge", 1)) groups.push({ key: "knowledge", label: "Blessings of Knowledge: 2 skills, proficiency and expertise", count: 2, prof: true, expert: true, options: ["arcana", "history", "nature", "religion"].filter(id => !experts.includes(id)) });
  // Scout (XGE p.47): Nature and Survival, proficient with double the bonus.
  if (gains("rogue", "scout", 3)) groups.push({ key: "scout", label: "Survivalist: proficiency and expertise", count: 2, prof: true, expert: true, fixed: true, options: ["nature", "survival"] });
  const count = classExpertise(target.classId, target.to) - classExpertise(target.classId, target.from);
  if (count > 0) {
    const proficient = new Set([...owned, ...groups.filter(group => group.prof).flatMap(picked)]);
    const doubled = new Set([...experts, ...groups.filter(group => group.expert).flatMap(picked)]);
    groups.push({ key: "expertise", label: `Expertise: ${count} skills you're proficient in (double proficiency)`, count, expert: true, options: all.filter(id => proficient.has(id) && !doubled.has(id)) });
  }
  return groups.map(group => ({ ...group, picks: [...new Set(picked(group))].slice(0, group.count) }));
}

function applyLevelSkillPicks(groups) {
  groups.forEach(group => group.picks.forEach(id => {
    if (group.prof && !character.proficientSkills.includes(id)) character.proficientSkills.push(id);
    if (group.expert && !(character.expertSkills || []).includes(id)) character.expertSkills = [...(character.expertSkills || []), id];
  }));
}

function renderLevelSkillChoices() {
  const root = document.querySelector("#levelSkillChoices");
  if (!root || !levelPlan) return;
  const groups = levelSkillGroups();
  const name = id => SKILLS.find(([skill]) => skill === id)?.[1] || id;
  root.innerHTML = groups.length ? `<fieldset class="level-section"><legend>Skills</legend>${groups.map(group => {
    const chosen = levelPlan.skillPicks?.[group.key] || [];
    const selects = group.fixed ? `<span class="muted">${escapeHtml(group.options.map(name).join(" and "))}</span>` : Array.from({ length: group.count }, (_, index) => {
      const value = chosen[index] || "";
      const options = group.options.filter(id => id === value || !chosen.includes(id));
      return `<select data-level-skill="${group.key}" data-index="${index}" aria-label="${escapeHtml(group.label)}, pick ${index + 1}"><option value="">Choose…</option>${options.map(id => `<option value="${id}" ${id === value ? "selected" : ""}>${escapeHtml(name(id))}</option>`).join("")}</select>`;
    }).join("");
    return `<div class="level-skill-group"><span>${escapeHtml(group.label)}</span><div class="level-skill-picks">${selects}</div></div>`;
  }).join("")}</fieldset>` : "";
}

function renderLevelAsi(due, rules) {
  const root = document.querySelector("#levelAsiPrompt");
  if (!due) {
    root.innerHTML = "";
    return;
  }
  const plan = levelPlan;
  const feats = optionalRule("feats");
  if (!feats) plan.asiMode = "asi";
  root.innerHTML = `
    <fieldset class="level-asi">
      <legend>Ability score improvement${rules === "2024" ? " (2024: or any feat you qualify for)" : ""}</legend>
      <label class="inline-check"><input type="radio" name="asiMode" value="asi" ${plan.asiMode === "asi" ? "checked" : ""}> Raise scores: +1 and +1 (pick the same ability twice for +2)</label>
      <div class="level-asi-picks">
        ${["asiFirst", "asiSecond"].map((id, index) => `<select id="${id}" aria-label="${index ? "Second" : "First"} ability to raise">${ABILITIES.map(([ability, label]) => `<option value="${ability}" ${plan.asiPicks[index] === ability ? "selected" : ""}>${label} (${character.abilities[ability]})</option>`).join("")}</select>`).join("")}
      </div>
      <p id="levelAsiResult" class="level-asi-result" aria-live="polite">${escapeHtml(levelAsiResultText(plan.asiPicks))}</p>
      ${feats ? `<label class="inline-check"><input type="radio" name="asiMode" value="feat" ${plan.asiMode === "feat" ? "checked" : ""}> Take a feat instead</label>
      <div class="level-feat-picker" ${plan.asiMode === "feat" ? "" : "hidden"}>${featPickerHtml(plan.feat, character, "level")}</div>` : `<p class="muted">Feats are off for this character (Settings).</p>`}
    </fieldset>`;
}

// Class choices that are still open after this level (new invocations, a fighting style, a pact boon...).
function renderLevelClassChoices() {
  const root = document.querySelector("#levelClassChoices");
  if (!root) return;
  const plan = levelPlan;
  const target = levelTarget();
  if (!target) return;
  const entries = classEntries().map(entry => ({ ...entry }));
  if (target.key === "new") entries.push({ key: "new", classId: target.classId, level: 1, subclassName: "", officialIndex: plan.subclass, rules: target.rules });
  else {
    const entry = entries.find(item => item.key === target.key);
    entry.level += 1;
    if (plan.subclass) entry.officialIndex = plan.subclass;
  }
  const extraSpells = plan.choices.map(choice => choice.index).filter(Boolean);
  // A feat taken this level (Eldritch Adept, Metamagic Adept, Martial Adept, Fighting Initiate) adds picks too.
  const source = plan.asiMode === "feat" && plan.feat.name ? { ...character, planner: { ...character.planner, feats: [...character.planner.feats, plan.feat.name] } } : character;
  const slots = classChoiceSlots(entries, plan.classChoices, source, extraSpells).filter(slot => !slotValue(plan.classChoices, slot) || plan.openSlots?.has(slotId(slot)));
  plan.openSlots = new Set([...(plan.openSlots || []), ...slots.map(slotId)]);
  root.innerHTML = slots.length ? `<fieldset class="level-section"><legend>Class choices</legend>${classChoicesHtml(slots, plan.classChoices, "level")}<p class="muted">Change earlier picks any time under Features → Class choices.</p></fieldset>` : "";
}

// kind: 0 (cantrip), "leveled" (up to the highest slot level: Mystic Arcanum levels are their own pick), or "arcanum".
function spellChoicesForLevelChoice(kind, cls, toLevel, pickRow = null) {
  const slotted = spellSlotsFor(cls, toLevel).reduce((highest, count, index) => count > 0 ? index + 1 : highest, 0);
  const maximum = cls.id === "warlock" || isPactCaster(cls) ? slotted : maxSpellLevelFor(cls, toLevel);
  const arcanumLevel = { 11: 6, 13: 7, 15: 8, 17: 9 }[toLevel];
  const selected = new Set(character.spells.map(row => row.index).filter(Boolean));
  const target = levelPlan ? levelTarget() : null;
  const entry = target ? { key: target.key, classId: target.classId, level: toLevel, subclassName: target.subclassName, officialIndex: levelPlan.subclass || "" } : undefined;
  // Eldritch Knight / Arcane Trickster: two schools only, except one pick at each of 3rd, 8th, 14th and 20th (PHB p.75, p.98).
  let schoolOnly = false;
  if (cls.schools && kind !== 0) {
    const offSchool = character.spells.filter(row => spellRowKey(row) === target?.key && spellLevelForRow(row) > 0 && !spellAlwaysPrepared(row)
      && !cls.schools.includes(spellDetails[row.index]?.school?.index)).length;
    // The other picks in this level-up dialog count too.
    const offPicked = (levelPlan?.choices || []).filter(row => row !== pickRow && row.index && !cls.schools.includes(spellDetails[row.index]?.school?.index)).length;
    schoolOnly = offSchool + offPicked >= cls.freeSchoolLevels.filter(level => toLevel >= level).length;
  }
  // Magical Secrets picks: any class's list, cantrips or spells of a level the bard can cast.
  if (kind === "secret" || kind === "lore") {
    return allSpells.filter(item => !selected.has(item.index) && item.level <= maximum)
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  }
  return allSpells
    .filter(item => !selected.has(item.index))
    .filter(item => spellMatchesClass(item, cls, entry))
    .filter(item => kind === 0 ? item.level === 0 : kind === "arcanum" ? item.level === arcanumLevel : item.level > 0 && item.level <= maximum)
    .filter(item => !schoolOnly || cls.schools.includes(spellDetails[item.index]?.school?.index))
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
  } else if (target.id === "levelNewTool") {
    plan.newTool = target.value;
  } else if (target.id === "levelNewRules") {
    plan.newRules = target.value;
    renderLevelDialog();
  } else if (target.id === "levelSubclassSelect") {
    plan.subclass = target.value;
    renderLevelSummaryAndChoices();
  } else if (target.id === "levelHpInput") {
    plan.hp = Number(target.value);
  } else if (target.name === "asiMode") {
    plan.asiMode = target.value;
    renderLevelAsi(true, levelTarget().rules);
    renderLevelClassChoices();
  } else if (target.id === "asiFirst" || target.id === "asiSecond") {
    plan.asiPicks[target.id === "asiFirst" ? 0 : 1] = target.value;
    const result = document.querySelector("#levelAsiResult");
    if (result) result.textContent = levelAsiResultText(plan.asiPicks);
  } else if (target.dataset.levelSkill) {
    plan.skillPicks ||= {};
    (plan.skillPicks[target.dataset.levelSkill] ||= [])[Number(target.dataset.index)] = target.value;
    renderLevelSkillChoices();
  } else if (target.dataset.featScope === "level") {
    if (!updateFeatPickState(plan.feat, target)) return;
    renderLevelAsi(true, levelTarget().rules);
    renderLevelClassChoices();
  } else if (target.dataset.ccScope === "level") {
    setClassChoice(plan.classChoices, target);
    renderLevelClassChoices();
  }
}

function handleLevelDialogClick(event) {
  const button = event.target.closest("[data-level-hp]");
  if (!button) return;
  const target = levelTarget();
  if (button.dataset.levelHp === "average") {
    levelPlan.hp = averageHitDieGain(target.cls, target);
    document.querySelector("#levelHpInput").value = levelPlan.hp;
    return;
  }
  // Each level adds at least 1 HP even with a CON penalty (PHB p.15).
  openRoll({
    label: `Hit points for ${target.cls.name} ${target.to}`,
    formula: `1d${target.cls.hitDie}${formatMod(mod("con") + sheetExtraHp(target.classId, target.subclassName))}`,
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
  const most = maxHitDieGain(target.cls, target);
  if (!Number.isFinite(hp) || hp < 1 || hp > most) {
    showToast(`<span class="toast-label">Hit points gained must be 1 to ${most}</span><span>A d${target.cls.hitDie} plus your CON modifier${most - Math.max(1, target.cls.hitDie + mod("con")) ? " and per-level bonuses" : ""} (PHB p.15).</span>`, { tone: "fumble" });
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
  const due = asiLevelsFor(target.cls).has(target.to);
  const asiMode = due ? plan.asiMode : "";
  const featState = asiMode === "feat" ? plan.feat : null;
  if (featState && !featState.name) {
    showToast(`<span class="toast-label">Pick a feat, or raise ability scores instead</span>`);
    return;
  }
  const problem = featState && featPickProblem(featState);
  if (problem) {
    showToast(`<span class="toast-label">${escapeHtml(problem)}</span>`);
    return;
  }
  const rule = featState && featRule(featState.name);
  const featAbility = rule?.ability.includes(featState.ability) ? featState.ability : rule?.ability.length === 1 ? rule.ability[0] : "";
  const raised = [...(asiMode === "asi" ? plan.asiPicks : []), featAbility].filter(Boolean);
  const over = ABILITIES.find(([id]) => Number(character.abilities[id]) + raised.filter(item => item === id).length > 20);
  if (over && !plan.capOk && !isRuleBroken("ability-cap")) {
    breakRule("ability-cap", `${over[1]} would go above 20, the most an ability score can reach without magic.`, () => { plan.capOk = true; document.querySelector("#confirmLevelUp").click(); });
    return;
  }
  const blocked = featState && featBlocked(featState.name, character, featState.variant);
  if (blocked === "already taken") {
    showToast(`<span class="toast-label">${escapeHtml(featState.name)} is already taken</span>`);
    return;
  }
  if (blocked && !plan.featOk && !isRuleBroken("feat-prereq")) {
    breakRule("feat-prereq", `${featState.name} ${blocked}.`, () => { plan.featOk = true; document.querySelector("#confirmLevelUp").click(); });
    return;
  }
  commitLevelUp(target, { hp, asiMode, asiPicks: asiMode === "asi" ? plan.asiPicks : [], featState });
}

function commitLevelUp(target, { hp, asiMode, asiPicks = [], featState = null }) {
  const plan = levelPlan;
  const skillGroups = levelSkillGroups(target, plan);
  const conBefore = mod("con");
  const levelsAfter = totalLevel() + 1;
  const cap = isRuleBroken("ability-cap") || plan.capOk ? 30 : 20;
  asiPicks.forEach(ability => {
    character.abilities[ability] = clamp(Number(character.abilities[ability]) + 1, 1, cap);
  });
  if (asiMode === "asi") character.planner.feats.push("Ability Score Improvement");
  let featNote = "";
  let flatHp = 0;
  if (featState?.name) {
    const hpBefore = Number(character.maxHp || 0);
    featNote = takeFeat(featState, { kind: "asi", level: levelsAfter });
    flatHp = Number(character.maxHp || 0) - hpBefore;
  }
  const official = plan.subclass ? officialSubclasses.find(item => item.index === plan.subclass) : null;
  const cls = target.cls;
  let entryForExtras;
  if (target.key === "primary") {
    if (official) applyOfficialSubclass(official.index, false);
    character.level += 1;
    if (asiMode) character.asiAcknowledgedLevel = character.level;
    rebuildClassFeatureLines(currentClass(), character.level);
    entryForExtras = classEntries()[0];
  } else {
    let entry = character.multiclasses.find(item => item.id === target.key);
    if (target.key === "new") {
      entry = { id: crypto.randomUUID(), classId: target.classId, level: 0, subclassName: "", rules: target.rules };
      character.multiclasses.push(entry);
      const grant = multiclassProficienciesFor(target.classId) || {};
      if (grant.armor) character.backgroundDetails.armor = mergeList(character.backgroundDetails.armor, grant.armor.split(", "));
      if (grant.weapons) character.backgroundDetails.weapons = mergeList(character.backgroundDetails.weapons, grant.weapons.split(", "));
      const tools = grant.tools && parseGrantToken(grant.tools).options && plan.newTool ? plan.newTool : grant.tools;
      if (tools) character.backgroundDetails.tools = mergeList(character.backgroundDetails.tools, tools.split(", "));
    }
    entry.level += 1;
    if (official) Object.assign(entry, { subclassName: official.name, officialIndex: official.index });
    const row = cls.table[entry.level - 1];
    if (row?.features) character.features = mergeLines(character.features, [`${cls.name} ${entry.level}: ${row.features}`]);
    entryForExtras = { ...entry, key: entry.id };
  }
  // Subclass training and saves for whichever class gained the level (Hexblade dip, Samurai 7th...).
  applySubclassExtras(entryForExtras);
  applyLevelSkillPicks(skillGroups);
  // A higher CON modifier raises HP for every level, this one included; Tough (and custom HP-per-level feats)
  // likewise count every level; Draconic Resilience picked now adds 1 per sorcerer level (PHB p.15, 102, 170).
  const perLevelFeat = featState?.name ? featRule(featState.name)?.hpPerLevel || 0 : 0;
  const draconicNow = official?.index === "draconic" && target.classId === "sorcerer" ? target.to : 0;
  const retro = (mod("con") - conBefore) * levelsAfter + perLevelFeat * levelsAfter + draconicNow;
  const gained = hp + retro;
  character.maxHp = Number(character.maxHp || 0) + gained;
  character.hp = Number(character.hp || 0) + gained;
  character.hitDice = hitDiceText();
  // New spells belong to the class that gained the level (PHB p.164).
  const ownerKey = target.key === "new" ? character.multiclasses[character.multiclasses.length - 1].id : target.key;
  character.lastLevelClass = ownerKey;
  plan.choices.filter(choice => choice.index).forEach(({ prepare, ...row }) => {
    const spell = allSpells.find(item => item.index === row.index);
    row.level = spell?.level ?? 1;
    row.classKey = ownerKey;
    row.prepared = prepare !== false && isPreparedCaster(cls) && row.level > 0 && canPrepareAnother(ownerKey);
    character.spells.push(row);
  });
  const swap = plan.replace?.from && plan.replace?.to ? character.spells.find(row => row.id === plan.replace.from) : null;
  if (swap) Object.assign(swap, { index: plan.replace.to, level: allSpells.find(item => item.index === plan.replace.to)?.level ?? swap.level });
  character.classChoices = plan.classChoices;
  character.fightingStyle = character.classChoices.fightingStyles[0] || character.fightingStyle || "";
  ensureGrantedSpells();
  levelPlan = null;
  document.querySelector("#levelDialog").close();
  persistAndRender();
  celebrate();
  const grantSkills = target.key === "new" ? multiclassProficienciesFor(target.classId)?.skills : 0;
  const totalGain = gained + flatHp;
  showToast(`<span class="toast-label">Level ${totalLevel()}: ${escapeHtml(cls.name)} ${target.to}</span><span>+${totalGain} max HP${retro ? ` (${formatMod(retro)} for CON, feats or Draconic Resilience across all levels)` : ""}${asiMode === "asi" ? " · ability scores raised" : featState?.name ? ` · ${escapeHtml(featEntry(featState.name, featState.variant))}${featNote ? ` (${escapeHtml(featNote)})` : ""}` : ""}${grantSkills ? ` · pick ${grantSkills} ${escapeHtml(cls.name)} skill in Edit` : ""}</span>`, { tone: "crit", duration: 9000 });
}

// ---------------------------------------------------------------------------------------------
// Class choices: how many of each option the class levels allow (CLASS_OPTIONS.progressions), with prerequisites.
// A slot is { key, index, label, options: [{ value, label, why, summary }] }; index is the array position, the
// level key for totems/hunter, or null for single choices.
// ---------------------------------------------------------------------------------------------
function progression(table, level) {
  return Object.entries(table).reduce((count, [at, value]) => level >= Number(at) ? value : count, 0);
}

function slotId(slot) {
  return `${slot.key}:${slot.index ?? ""}`;
}

function slotValue(choices, slot) {
  const value = choices[slot.key];
  return slot.index === null ? value : value?.[slot.index] || "";
}

function setClassChoice(choices, target) {
  const key = target.dataset.ccKey;
  if (target.dataset.ccFlag) {
    choices[target.dataset.ccFlag] = target.checked;
    return;
  }
  if (!(key in choices)) return;
  const index = target.dataset.ccIndex;
  if (index === "") choices[key] = target.value;
  else if (Array.isArray(choices[key])) {
    choices[key] = [...choices[key]];
    choices[key][Number(index)] = target.value;
  } else choices[key] = { ...choices[key], [index]: target.value };
}

// Why an invocation can't be learned yet (PHB p.110: prerequisites need warlock levels; a non-warlock with
// Eldritch Adept can only take invocations without a prerequisite).
function invocationBlocked(invocation, ctx) {
  const hasPrereq = invocation.level || invocation.pact || invocation.spell;
  if (hasPrereq && !ctx.warlock) return "needs warlock levels";
  if (invocation.level > ctx.warlock) return `needs warlock ${invocation.level}`;
  if (invocation.pact && invocation.pact !== ctx.pact) return `needs Pact of the ${invocation.pact.charAt(0).toUpperCase()}${invocation.pact.slice(1)}`;
  if (invocation.spell === "eldritch-blast" && !ctx.knows("eldritch-blast")) return "needs eldritch blast";
  if (invocation.spell === "hex-or-curse" && !(ctx.knows("hex") || ctx.hexblade || ctx.invocations.includes("Sign of Ill Omen"))) return "needs hex or a curse feature";
  return "";
}

function classChoiceSlots(entries = classEntries(), choices = character.classChoices, source = character, extraSpells = []) {
  const tashas = optionalRule("tashas", source);
  const allowed = item => !item.optional || tashas;
  const level = id => entries.filter(entry => entry.classId === id).reduce((sum, entry) => sum + entry.level, 0);
  const sub = slug => entries.filter(entry => subclassIndexFor(entry) === slug).reduce((sum, entry) => sum + entry.level, 0);
  const feats = takenFeatEntries(source);
  const slots = [];
  const many = (key, count, label, options) => {
    for (let index = 0; index < count; index += 1) slots.push({ key, index, label: count > 1 ? `${label} ${index + 1}` : label, options });
  };
  const option = (item, why = "") => ({ value: item.name, label: item.name, why, summary: item.summary || "" });

  // Fighting styles: one per feature that grants one, each from its own class list.
  const styles = [];
  if (level("fighter")) styles.push(["fighter", "Fighting style (fighter)"]);
  if (level("paladin") >= 2) styles.push(["paladin", "Fighting style (paladin)"]);
  if (level("ranger") >= 2) styles.push(["ranger", "Fighting style (ranger)"]);
  if (level("bloodhunter") >= 2) styles.push(["bloodhunter", "Fighting style (blood hunter)"]);
  if (sub("swords") >= 3) styles.push(["bard:swords", "Fighting style (College of Swords)"]);
  if (sub("champion") >= 10) styles.push(["fighter", "Additional fighting style (Champion)"]);
  if (feats.includes("Fighting Initiate")) styles.push(["fighter", "Fighting style (Fighting Initiate)"]);
  styles.forEach(([cls, label], index) => slots.push({ key: "fightingStyles", index, label, options: CLASS_OPTIONS.fightingStyles.filter(style => style.classes.includes(cls) && allowed(style)).map(style => option(style)) }));

  const warlock = level("warlock");
  if (warlock >= 3) slots.push({ key: "pactBoon", index: null, label: "Pact boon", options: CLASS_OPTIONS.pactBoons.filter(allowed).map(boon => ({ value: boon.id, label: boon.name, why: "", summary: boon.summary })) });
  // Cantrips a class option teaches (PHB p.108; TCE p.53, p.57); spells.js adds them as rows of that class.
  const cantrips = classId => allSpells.filter(item => item.level === 0 && (!classId || spellOnClassList(item, classId))).map(item => ({ value: item.index, label: item.name, why: "", summary: "" }));
  if (warlock >= 3 && choices.pactBoon === "tome") many("tomeCantrips", 3, "Book of Shadows cantrip", cantrips(""));
  if (level("paladin") >= 2 && (choices.fightingStyles || []).includes("Blessed Warrior")) many("blessedWarriorCantrips", 2, "Blessed Warrior cantrip", cantrips("cleric"));
  if (level("ranger") >= 2 && (choices.fightingStyles || []).includes("Druidic Warrior")) many("druidicWarriorCantrips", 2, "Druidic Warrior cantrip", cantrips("druid"));
  const invocationCount = progression(CLASS_OPTIONS.progressions.invocationsKnown, warlock) + (feats.includes("Eldritch Adept") ? 1 : 0);
  if (invocationCount) {
    const knownSpells = new Set([...(source.spells || []).map(row => row.index), ...extraSpells]);
    const ctx = { warlock, pact: choices.pactBoon, knows: index => knownSpells.has(index), hexblade: sub("hexblade") > 0, invocations: choices.invocations || [] };
    many("invocations", invocationCount, "Eldritch invocation", CLASS_OPTIONS.invocations.filter(allowed).map(item => option(item, invocationBlocked(item, ctx))));
  }
  const metamagic = progression(CLASS_OPTIONS.progressions.metamagicKnown, level("sorcerer")) + (feats.includes("Metamagic Adept") ? 2 : 0);
  if (metamagic) many("metamagic", metamagic, "Metamagic", CLASS_OPTIONS.metamagic.filter(allowed).map(item => option(item)));
  const maneuvers = progression(CLASS_OPTIONS.progressions.maneuversKnown, sub("battle-master")) + (feats.includes("Martial Adept") ? 2 : 0) + ((choices.fightingStyles || []).includes("Superior Technique") ? 1 : 0);
  if (maneuvers) many("maneuvers", maneuvers, "Maneuver", CLASS_OPTIONS.maneuvers.filter(allowed).map(item => option(item)));
  const artificer = level("artificer");
  const infusions = progression(CLASS_OPTIONS.progressions.infusionsKnown, artificer);
  if (infusions) many("infusions", infusions, "Infusion", CLASS_OPTIONS.infusions.map(item => option(item, item.level > artificer ? `needs artificer ${item.level}` : "")));
  const elements = sub("four-elements");
  const disciplines = progression(CLASS_OPTIONS.progressions.elementalDisciplines, elements);
  if (disciplines) many("disciplines", disciplines, "Elemental discipline", CLASS_OPTIONS.elementalDisciplines.filter(item => !item.auto).map(item => option(item, item.level > elements ? `needs monk ${item.level}` : "")));
  const runeKnight = sub("rune-knight");
  const runes = progression(CLASS_OPTIONS.progressions.runesKnown, runeKnight);
  if (runes) many("runes", runes, "Rune", CLASS_OPTIONS.runes.map(item => option(item, item.level > runeKnight ? `needs fighter ${item.level}` : "")));
  const shots = progression(CLASS_OPTIONS.progressions.arcaneShotOptions, sub("arcane-archer"));
  if (shots) many("arcaneShots", shots, "Arcane Shot option", CLASS_OPTIONS.arcaneShots.map(item => option(item)));
  const totem = sub("totem-warrior");
  [[3, "Totem spirit"], [6, "Aspect of the beast"], [14, "Totemic attunement"]].filter(([at]) => totem >= at).forEach(([at, label]) => {
    slots.push({ key: "totems", index: String(at), label, options: CLASS_OPTIONS.totemSpirits.filter(item => item.level === at).map(item => option(item)) });
  });
  const hunter = sub("hunter");
  [3, 7, 11, 15].filter(at => hunter >= at).forEach(at => {
    const list = CLASS_OPTIONS.hunterOptions.filter(item => item.level === at);
    slots.push({ key: "hunter", index: String(at), label: list[0]?.feature || "Hunter option", options: list.map(item => option(item)) });
  });
  // Crimson rites known: 1 at 2nd, 2 at 7th, 3 at 14th (the Ghostslayer's Rite of the Dawn comes free).
  const hunterLevel = level("bloodhunter");
  const rites = progression({ 2: 1, 7: 2, 14: 3 }, hunterLevel);
  if (rites) many("bloodHunterRites", rites, "Crimson rite", CLASS_OPTIONS.bloodHunterRites.filter(item => item.kind !== "order").map(item => option(item, item.level > hunterLevel ? `needs blood hunter ${item.level}` : "")));
  if (hunterLevel) slots.push({ key: "hemocraftAbility", index: null, label: "Hemocraft ability", options: [
    { value: "int", label: "Intelligence", why: "", summary: "The default hemocraft ability." },
    { value: "wis", label: "Wisdom", why: "", summary: "With your DM's permission. Used for every hemocraft feature: curse DC, brands, Dark Augmentation and Profane Soul spells." }
  ] });
  const curses = progression({ 1: 1, 6: 2, 10: 3, 14: 4, 18: 5 }, hunterLevel);
  if (curses) many("bloodMaledicts", curses, "Blood curse", CLASS_OPTIONS.bloodMaledicts.map(item => option(item, item.level > hunterLevel ? `needs blood hunter ${item.level}` : "")));
  const ranger = level("ranger");
  if (ranger && !(tashas && choices.favoredFoe)) many("favoredEnemies", progression({ 1: 1, 6: 2, 14: 3 }, ranger), "Favored enemy", CLASS_OPTIONS.favoredEnemies.map(name => ({ value: name, label: name, why: "", summary: "" })));
  if (ranger && !(tashas && choices.deftExplorer)) many("favoredTerrains", progression({ 1: 1, 6: 2, 10: 3 }, ranger), "Favored terrain", CLASS_OPTIONS.favoredTerrains.map(name => ({ value: name, label: name, why: "", summary: "" })));
  if (sub("draconic")) slots.push({ key: "draconicAncestry", index: null, label: "Dragon ancestor", options: CLASS_OPTIONS.draconicAncestry.map(row => ({ value: row.dragon, label: `${row.dragon} (${row.damage})`, why: "", summary: "" })) });
  if (sub("land") >= 2) slots.push({ key: "landTerrain", index: null, label: "Circle of the Land terrain", options: CLASS_OPTIONS.landCircleTerrains.map(name => ({ value: name, label: name.charAt(0).toUpperCase() + name.slice(1), why: "", summary: "" })) });
  if (sub("genie")) slots.push({ key: "genieKind", index: null, label: "Genie kind", options: ["Dao", "Djinni", "Efreeti", "Marid"].map(name => ({ value: name, label: name, why: "", summary: "" })) });
  // Way of the Kensei (XGE p.34): one melee and one ranged at 3rd, one more of either at 6th, 11th and 17th.
  const kensei = sub("kensei");
  if (kensei >= 3) {
    const kenseiOk = ITEM_CATALOG.filter(item => item.type === "Weapon" && item.cost && /^(simple|martial)/i.test(item.rarity || "") && (item.index === "longbow" || !/\bheavy\b|\bspecial\b/i.test(item.notes || "")));
    const pick = list => list.map(item => ({ value: item.name, label: item.name, why: "", summary: "" }));
    slots.push({ key: "kenseiWeapons", index: 0, label: "Kensei weapon 1 (melee)", options: pick(kenseiOk.filter(item => /melee/i.test(item.rarity))) });
    slots.push({ key: "kenseiWeapons", index: 1, label: "Kensei weapon 2 (ranged)", options: pick(kenseiOk.filter(item => /ranged/i.test(item.rarity))) });
    for (let index = 2; index < progression({ 3: 2, 6: 3, 11: 4, 17: 5 }, kensei); index += 1) slots.push({ key: "kenseiWeapons", index, label: `Kensei weapon ${index + 1}`, options: pick(kenseiOk) });
  }
  if (sub("storm-herald") >= 3) slots.push({ key: "stormEnvironment", index: null, label: "Storm Herald environment", options: CLASS_OPTIONS.stormHeraldEnvironments.map(item => option(item)) });
  if (sub("divine-soul")) slots.push({ key: "divineSoulAffinity", index: null, label: "Divine Soul affinity", options: CLASS_OPTIONS.divineSoulAffinity.map(row => ({ value: row.name, label: `${row.name} (${row.spell.replace(/-/g, " ")})`, why: "", summary: "" })) });
  return slots;
}

// Weapon and feat picks the combat rows read (character.combatChoices); shown with the class choices, never required.
function combatChoiceSlots() {
  const tashas = optionalRule("tashas");
  const weapons = wornItems().filter(item => /\d+d\d+/.test(item.notes || "") && /weapon/i.test(item.notes || ""));
  const traits = item => weaponTraits(`${item.name} ${item.notes}`.toLowerCase());
  const weaponSlot = (key, label, filter = () => true) => ({ key, index: null, label, options: weapons.filter(filter).map(item => ({ value: item.id, label: item.name || "Weapon", why: "", summary: "" })) });
  const slots = [];
  if (subclassLevel("hexblade")) slots.push(weaponSlot("hexWarriorWeapon", "Hex Warrior weapon", item => !traits(item).twoHanded));
  if (classLevel("warlock") >= 3 && (classChoiceNames("pactBoon").some(name => /blade/i.test(name)) || choiceWritten("Pact of the Blade"))) slots.push(weaponSlot("pactWeapon", "Pact weapon"));
  if (tashas && classLevel("monk") >= 2) slots.push(weaponSlot("dedicatedWeapon", "Dedicated weapon", item => !traits(item).heavy && !SPECIAL_WEAPON.test(`${item.name} ${item.notes}`.toLowerCase())));
  if (tashas && classLevel("cleric") >= 8) slots.push({ key: "blessedStrikes", index: null, label: "8th-level cleric feature", blank: "Domain feature (PHB)", options: [{ value: "Blessed Strikes", label: "Blessed Strikes (Tasha's)", why: "", summary: "" }] });
  // Older sheets took Elemental Adept without a type in the feat name.
  const adept = takenFeatEntries().filter(entry => entry === "Elemental Adept").length;
  for (let index = 0; index < adept; index += 1) slots.push({ key: "elementalAdept", index, label: "Elemental Adept type", options: ["acid", "cold", "fire", "lightning", "thunder"].map(type => ({ value: type, label: type, why: "", summary: "" })) });
  if (hasFeat("Planar Wanderer")) slots.push({ key: "planarWanderer", index: null, label: "Planar Wanderer resistance (pick after each long rest)", options: ["acid", "cold", "fire"].map(type => ({ value: type, label: type, why: "", summary: "" })) });
  return slots;
}

// Selects for a list of slots; an option chosen in a sibling slot (or failing a prerequisite) is disabled.
function classChoicesHtml(slots, choices, scope) {
  return slots.map(slot => {
    const current = slotValue(choices, slot);
    const siblings = Array.isArray(choices[slot.key]) ? choices[slot.key].filter((value, index) => index !== slot.index && value) : [];
    const picked = slot.options.find(item => item.value === current);
    return `<div class="class-choice">
      <label class="create-name">${escapeHtml(slot.label)}
        <select data-cc-key="${slot.key}" data-cc-index="${slot.index ?? ""}" data-cc-scope="${scope}">
          <option value="">${escapeHtml(slot.blank || "Choose…")}</option>
          ${slot.options.map(item => {
            const taken = siblings.includes(item.value) && item.value !== "Replicate Magic Item";
            const why = item.why || (taken ? "already chosen" : "");
            return `<option value="${escapeHtml(item.value)}" ${item.value === current ? "selected" : ""} ${why && item.value !== current ? "disabled" : ""}>${escapeHtml(item.label)}${why ? ` (${escapeHtml(why)})` : ""}</option>`;
          }).join("")}
        </select>
      </label>
      ${picked?.why ? `<p class="level-warning">${escapeHtml(picked.label)}: ${escapeHtml(picked.why)}.</p>` : picked?.summary ? `<p class="muted">${escapeHtml(picked.summary)}</p>` : ""}
    </div>`;
  }).join("");
}

function renderClassChoicesBlock() {
  const root = document.querySelector("#classChoicesBlock");
  if (!root) return;
  const slots = classChoiceSlots();
  const combat = combatChoiceSlots();
  const ranger = classLevel("ranger") > 0 && optionalRule("tashas");
  root.innerHTML = slots.length || ranger || combat.length ? `
    ${ranger ? `<div class="create-skill-chips">
      <label class="inline-check"><input type="checkbox" data-cc-flag="favoredFoe" data-cc-scope="sheet" ${character.classChoices.favoredFoe ? "checked" : ""}> Favored Foe instead of Favored Enemy (Tasha's)</label>
      <label class="inline-check"><input type="checkbox" data-cc-flag="deftExplorer" data-cc-scope="sheet" ${character.classChoices.deftExplorer ? "checked" : ""}> Deft Explorer instead of Natural Explorer (Tasha's)</label>
      <label class="inline-check"><input type="checkbox" data-cc-flag="primalAwareness" data-cc-scope="sheet" ${character.classChoices.primalAwareness ? "checked" : ""}> Primal Awareness instead of Primeval Awareness (Tasha's)</label>
      <label class="inline-check"><input type="checkbox" data-cc-flag="naturesVeil" data-cc-scope="sheet" ${character.classChoices.naturesVeil ? "checked" : ""}> Nature's Veil instead of Hide in Plain Sight (Tasha's)</label>
    </div>` : ""}
    <div class="field-grid">${classChoicesHtml(slots, character.classChoices, "sheet")}${classChoicesHtml(combat, character.combatChoices || {}, "combat")}</div>`
    : `<p class="empty-state">No class options to choose at this level.</p>`;
  root.onchange = event => {
    const { ccScope, ccKey, ccIndex } = event.target.dataset;
    if (ccScope === "combat") {
      const choices = character.combatChoices = { ...(character.combatChoices || {}) };
      if (ccIndex === "") choices[ccKey] = event.target.value;
      else {
        const list = Array.isArray(choices[ccKey]) ? [...choices[ccKey]] : [];
        list[Number(ccIndex)] = event.target.value;
        choices[ccKey] = Array.from(list, entry => entry || "");
      }
      persistAndRender();
      return;
    }
    if (ccScope !== "sheet") return;
    setClassChoice(character.classChoices, event.target);
    character.fightingStyle = character.classChoices.fightingStyles[0] || "";
    persistAndRender();
  };
}

let creationDraft = null;
// ---------------------------------------------------------------------------------------------
// Creation wizard
// ---------------------------------------------------------------------------------------------
const CREATE_STEP_LABELS = ["Identity", "Class", "Background", "Abilities", "Equipment", "Spells", "Review"];

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
    speciesFeat: { name: "" },
    backgroundFeat: { name: "" },
    abilities: Object.fromEntries(ABILITIES.map(([id]) => [id, 10])),
    method: "",
    pool: null,
    altBonuses: false,
    customOrigin: false,
    picks: {},
    improvements: [],
    gear: { mode: "", options: {}, picks: {}, gold: null },
    spellPicks: { cantrips: [], spells: [] },
    hpMode: "average",
    hpRolls: [],
    capOk: false
  };
}

// Chosen species increases and what stays fixed, with Tasha's Customizing Your Origin (TCE p.7) when switched on:
// every fixed increase becomes a free pick (penalties stay where they are).
function speciesBonusPlan(draft = creationDraft) {
  const fixed = { ...(SPECIES_PRESETS.find(([name]) => name === draft.species)?.[4] || {}) };
  const choose = speciesChoices(draft.species);
  let steps = draft.altBonuses && choose.alt ? choose.alt : choose.bonuses || [];
  let exclude = choose.exclude || [];
  if (draft.customOrigin) {
    const moved = Object.entries(fixed).filter(([, value]) => value > 0);
    moved.forEach(([id]) => delete fixed[id]);
    steps = [...moved.map(([, value]) => value), ...steps].sort((a, b) => b - a);
    exclude = [];
  }
  return { fixed, steps, exclude };
}

// Species choices made at creation: Half-Elf and Variant Human +1s, bonus skills, a feat, a High Elf cantrip.
function speciesChoices(species = creationDraft?.species) {
  return SPECIES_GRANTS[species]?.choose || {};
}

function speciesBonusSteps(species, draft = creationDraft) {
  return speciesBonusPlan({ ...(draft || {}), species }).steps;
}

function chosenSpeciesBonus(draft, id) {
  const index = (draft.speciesAbilities || []).indexOf(id);
  return index < 0 ? 0 : speciesBonusPlan(draft).steps[index] || 0;
}

// Skill picks a species gives (Custom Lineage: a skill or darkvision, TCE p.8).
function speciesSkillPicks(draft = creationDraft) {
  const choose = speciesChoices(draft.species);
  return choose.either ? (draft.lineageEither === "darkvision" ? 0 : 1) : choose.skills || 0;
}

// +1s from feats and ASIs chosen in the wizard.
function draftFeatBonus(draft, id) {
  const featAbility = state => {
    const rule = state?.name && featRule(state.name);
    return rule ? (rule.ability.includes(state.ability) ? state.ability : rule.ability.length === 1 ? rule.ability[0] : "") : "";
  };
  let bonus = featAbility(draft.speciesFeat) === id ? 1 : 0;
  (draft.improvements || []).forEach(item => {
    if (item.mode === "feat") bonus += featAbility(item.feat) === id ? 1 : 0;
    else bonus += [item.first, item.second].filter(ability => ability === id).length;
  });
  return bonus;
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
    Boolean(draft.gear.mode),
    [...draft.spellPicks.cantrips, ...draft.spellPicks.spells].some(Boolean),
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
  const renderers = [renderCreateIdentity, renderCreateClass, renderCreateBackground, renderCreateAbilities, renderCreateEquipment, renderCreateSpells, renderCreateReview];
  document.querySelector("#createStepBody").innerHTML = renderers[draft.step]();
}

function renderCreateIdentity() {
  const species = SPECIES_PRESETS.find(([name]) => name === creationDraft.species);
  return `
    <h3 class="create-screen-title">Who are you?</h3>
    <label class="create-name">Character Name
      <input data-create-field="name" aria-label="Character name" value="${escapeHtml(creationDraft.name)}" autocomplete="off" maxlength="60" placeholder="Name your hero...">
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
  const draft = creationDraft;
  const choose = speciesChoices();
  const parts = [];
  const select = (field, label, options, current) => `<label class="create-name">${escapeHtml(label)}
      <select data-create-field="${field}"><option value="">Choose later</option>${options.map(([value, text]) => `<option value="${escapeHtml(value)}" ${value === current ? "selected" : ""}>${escapeHtml(text)}</option>`).join("")}</select>
    </label>`;
  if (choose.ancestry) {
    const ftd = FTD_DRAGON_ANCESTRY[draft.species];
    const options = ftd ? ftd.map(([dragon, damage]) => [dragon, `${dragon} (${damage})`]) : CLASS_OPTIONS.draconicAncestry.map(row => [row.dragon, `${row.dragon}: ${row.damage}, ${row.breath}, ${row.save.toUpperCase()} save`]);
    parts.push(select("draconicAncestry", "Draconic ancestry (breath weapon and resistance)", options, draft.draconicAncestry));
  }
  if (choose.size) parts.push(select("size", "Size", choose.size.map(size => [size, size]), draft.size));
  if (choose.spellAbility) parts.push(select("speciesSpellAbility", "Spellcasting ability for species spells", choose.spellAbility.map(id => [id, id.toUpperCase()]), draft.speciesSpellAbility));
  if (choose.heritage) parts.push(select("heritage", "Wood elf heritage", choose.heritage.map(item => [item, item]), draft.heritage));
  if (choose.either) parts.push(select("lineageEither", "Custom Lineage: skill or darkvision", [["skill", "One skill proficiency"], ["darkvision", "Darkvision 60 ft"]], draft.lineageEither || "skill"));
  if (choose.cantripFrom || choose.cantripList) {
    const cantrips = choose.cantripList
      ? choose.cantripList.map(index => allSpells.find(spell => spell.index === index)).filter(Boolean)
      : allSpells.filter(spell => spell.level === 0 && spellOnClassList(spell, choose.cantripFrom));
    const label = choose.cantripList ? "Species cantrip" : `${choose.cantripFrom.charAt(0).toUpperCase() + choose.cantripFrom.slice(1)} cantrip`;
    parts.push(select("speciesCantrip", label, cantrips.map(spell => [spell.index, spell.name]), draft.speciesCantrip));
  }
  parts.push(creationSlotsHtml("species"));
  if (choose.feat) parts.push(`<p class="create-detail">${escapeHtml(draft.species)} also takes a feat: pick it on the Abilities step, once your scores are set.</p>`);
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
    ${creationSlotsHtml("class")}
  `;
}

function renderCreateLevelExtras() {
  const cls = draftClass();
  const note = creationDraft.level > 1 ? `<p class="create-detail">Starting at level ${creationDraft.level}: after creation a checklist shows everything to fill in for your level.</p>` : "";
  return (cls ? renderCreateSubclassPicker(cls) : "") + note;
}

function renderCreateSubclassPicker(cls) {
  const unlock = subclassUnlockLevel(cls.id);
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
  return cls?.skillChoices?.count ?? (CLASS_PROFICIENCIES[cls?.id]?.[3] || 2);
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
  const picks = speciesSkillPicks();
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
  const draft = creationDraft;
  const preset = BACKGROUND_PRESETS.find(([name]) => name === draft.background);
  const start = BACKGROUND_STARTING[draft.background];
  const featName = BACKGROUND_FEATS[draft.background];
  return `
    <h3 class="create-screen-title">Where do you come from?</h3>
    <div class="create-option-grid">
      ${BACKGROUND_PRESETS.map(([name, skills, , , glyph]) => `
        <button type="button" class="create-option-card ${name === draft.background ? "is-selected" : ""}" data-create-option="background:${name}">
          <span class="create-glyph">${icon(glyph)}</span>
          <strong>${name}</strong>
          <span>${skills}</span>
        </button>
      `).join("")}
      <button type="button" class="create-option-card ${draft.backgroundChosen && draft.background === "" ? "is-selected" : ""}" data-create-option="background:">
        <span class="create-glyph">${icon("question")}</span>
        <strong>Skip for now</strong>
        <span>Decide later</span>
      </button>
    </div>
    <p class="create-detail">${preset ? `<strong>${preset[0]}.</strong> Skills: ${preset[1]} · ${preset[2]} · Feature: ${preset[3]}${start ? ` · Starting purse: ${start.gold} gp` : ""}` : "A preset grants its skill proficiencies and background feature automatically."}</p>
    ${creationSlotsHtml("background")}
    ${featName ? `<h4 class="create-subtitle">Background feat</h4>${featDetailHtml(draft.backgroundFeat.name, draftFeatSource(), draft.backgroundFeat.variant)}<div class="feat-picks">${featPicksHtml(draft.backgroundFeat.name, draft.backgroundFeat, draftFeatSource(), "background")}</div>` : ""}
    ${renderCreateSkillPicker()}
  `;
}

// Ability totals; capped at 20 unless the player kept a higher total (C26). raw: uncapped, for validation.
function draftAbilitiesWithBonus(draft = creationDraft, { feats = true, raw = false } = {}) {
  const { fixed } = speciesBonusPlan(draft);
  const cap = raw || draft.capOk ? 30 : 20;
  return Object.fromEntries(ABILITIES.map(([id]) => [id, clamp(Number(draft.abilities[id] || 10) + (fixed[id] || 0) + chosenSpeciesBonus(draft, id) + (feats ? draftFeatBonus(draft, id) : 0), 1, cap)]));
}

// Starting scores: 3-18 before increases (PHB p.13), at most 20 after; point buy 27 points, 8-15.
function draftAbilityProblems(draft = creationDraft) {
  const problems = [];
  const high = ABILITIES.find(([id]) => Number(draft.abilities[id]) > 18);
  if (high) problems.push(`${high[1]} starts at ${draft.abilities[high[0]]}; no starting method goes above 18.`);
  const totals = draftAbilitiesWithBonus(draft, { raw: true });
  const over = ABILITIES.find(([id]) => totals[id] > 20);
  if (over) problems.push(`${over[1]} would be ${totals[over[0]]}; increases can't take a score above 20.`);
  if (draft.method === "pointbuy") {
    const spent = pointBuySpent(draft.abilities);
    if (spent === null) problems.push("Point buy scores must be 8 to 15.");
    else if (spent > 27) problems.push(`Point buy spends ${spent} of 27 points.`);
  }
  return problems;
}

// "16 (14 + 2) · +3": the final score with species and feat increases, then its modifier.
function createAbilityScoreText(id, draft = creationDraft, totals = draftAbilitiesWithBonus(draft)) {
  const base = Number(draft.abilities[id]) || 0;
  const extra = totals[id] - base;
  return `${totals[id]}${extra ? ` (${base} ${extra > 0 ? "+" : "−"} ${Math.abs(extra)})` : ""} · ${formatMod(Math.floor((totals[id] - 10) / 2))}`;
}

function renderCreateAbilities() {
  const draft = creationDraft;
  const cls = draftClass();
  const totals = draftAbilitiesWithBonus();
  const pool = draft.pool;
  return `
    <h3 class="create-screen-title">Assign ability scores</h3>
    <div class="create-ability-grid">
      ${ABILITIES.map(([id, label]) => `
        <div class="create-ability-card">
          <strong>${label}</strong>
          ${pool
            ? `<select data-create-assign="${id}" aria-label="${label} score">${[...new Set(pool)].sort((a, b) => b - a).map(value => `<option value="${value}" ${Number(draft.abilities[id]) === value ? "selected" : ""}>${value}</option>`).join("")}</select>`
            : `<input type="number" min="3" max="18" step="1" inputmode="numeric" aria-label="${label} score" data-create-ability="${id}" value="${draft.abilities[id]}">`}
          <span class="ability-mod">${createAbilityScoreText(id, draft, totals)}</span>
        </div>
      `).join("")}
    </div>
    <div class="create-ability-methods">
      <button type="button" class="secondary" data-create-standard>Use the standard array${cls ? ` for ${escapeHtml(cls.name)}` : ""}</button>
      <button type="button" class="ghost" data-create-pointbuy>Start point buy</button>
      <button type="button" class="ghost" data-create-roll>${icon("dice-five")}Roll 4d6, drop lowest</button>
      ${pool ? `<button type="button" class="ghost" data-create-manual>Type scores instead</button>` : ""}
    </div>
    <p class="create-detail" id="createPointBuy">${draft.method === "pointbuy" ? pointBuyText() : draft.method === "rolled" ? `Rolled: ${pool.join(", ")}. Each pick swaps scores between abilities.` : draft.method === "standard" ? "Standard array 15, 14, 13, 12, 10, 8, placed for your class. Each pick swaps scores between abilities." : "Type each score, or pick a method above."}</p>
    ${draftAbilityProblems().map(text => `<p class="level-warning">${escapeHtml(text)}</p>`).join("")}
    ${renderCreateSpeciesAbilities()}
    ${renderCreateImprovements()}
  `;
}

function renderCreateSpeciesFeat() {
  if (!speciesChoices().feat || !optionalRule("feats")) return "";
  return `<div class="create-feat">${featPickerHtml(creationDraft.speciesFeat, draftFeatSource(), "species", { label: `${creationDraft.species} feat`, blockDisabled: true })}</div>`;
}

function renderCreateSpeciesAbilities() {
  const draft = creationDraft;
  const choose = speciesChoices();
  const { steps, exclude } = speciesBonusPlan();
  const fixedBonus = Object.keys(SPECIES_PRESETS.find(([name]) => name === draft.species)?.[4] || {}).length;
  const toggles = `
    <div class="create-skill-chips">
      ${choose.alt ? `<button type="button" class="condition-chip ${draft.altBonuses ? "active" : ""}" data-create-toggle="altBonuses">+1 to three abilities instead of +2/+1</button>` : ""}
      ${fixedBonus && draft.species ? `<button type="button" class="condition-chip ${draft.customOrigin ? "active" : ""}" data-create-toggle="customOrigin">Customize origin: move the increases (Tasha's, optional)</button>` : ""}
    </div>`;
  if (!steps.length) return toggles + renderCreateSpeciesFeat();
  const next = steps[draft.speciesAbilities.length];
  return `
    <h4 class="create-subtitle">${escapeHtml(draft.species)}: ${steps.map(step => `+${step}`).join(" and ")} to different abilities${next ? `, next pick gets +${next}` : ""} (${draft.speciesAbilities.length}/${steps.length})</h4>
    ${toggles}
    <div class="create-skill-chips">
      ${ABILITIES.filter(([id]) => !exclude.includes(id)).map(([id, label]) => {
        const bonus = chosenSpeciesBonus(draft, id);
        return `<button type="button" class="condition-chip ${bonus ? "active" : ""}" data-create-species-ability="${id}">${escapeHtml(label)}${bonus ? ` +${bonus}` : ""}</button>`;
      }).join("")}
    </div>
    ${renderCreateSpeciesFeat()}
  `;
}

// Characters starting above 1st level make each ASI or feat choice their levels give (PHB p.15).
function renderCreateImprovements() {
  const draft = creationDraft;
  const cls = draftClass();
  if (!cls) return "";
  const levels = [...asiLevelsFor(cls)].filter(level => level <= draft.level).sort((a, b) => a - b);
  draft.improvements = levels.map((level, index) => draft.improvements[index] || { level, mode: "asi", first: "", second: "", feat: { name: "" } });
  draft.improvements.forEach((item, index) => { item.level = levels[index]; });
  if (!levels.length) return "";
  const source = draftFeatSource();
  return `
    <h4 class="create-subtitle">Ability score improvements (levels ${levels.join(", ")})</h4>
    ${draft.improvements.map((item, index) => `
      <div class="create-improvement">
        <label class="create-name">Level ${item.level}
          <select data-create-improve="${index}" data-improve-field="mode">
            <option value="asi" ${item.mode === "asi" ? "selected" : ""}>+1 and +1 to ability scores</option>
            ${optionalRule("feats") ? `<option value="feat" ${item.mode === "feat" ? "selected" : ""}>A feat</option>` : ""}
          </select>
        </label>
        ${item.mode === "asi"
          ? ["first", "second"].map(field => `<label class="create-name">+1 to <select data-create-improve="${index}" data-improve-field="${field}"><option value="">Choose…</option>${ABILITIES.map(([id, label]) => `<option value="${id}" ${item[field] === id ? "selected" : ""}>${label}</option>`).join("")}</select></label>`).join("")
          : featPickerHtml(item.feat, source, `improve-${index}`, { blockDisabled: true })}
      </div>`).join("")}`;
}

// ---- Equipment step (PHB p.143): class + background gear and purse, or rolled class gold ----
function gearPickOptions(kind) {
  const weapons = pattern => ITEM_CATALOG.filter(item => item.type === "Weapon" && pattern.test(item.rarity || "") && item.cost && !/firearm/i.test(item.notes || "")).map(item => item.name);
  return {
    simple: weapons(/^simple/i), simpleMelee: weapons(/^simple melee/i), martial: weapons(/^martial/i), martialMelee: weapons(/^martial melee/i),
    instrument: TOOL_GROUPS.instrument, artisan: TOOL_GROUPS.artisan, gaming: TOOL_GROUPS.gaming
  }[kind] || [];
}

function gearKindLabel(kind) {
  return { simple: "Simple weapon", simpleMelee: "Simple melee weapon", martial: "Martial weapon", martialMelee: "Martial melee weapon", instrument: "Musical instrument", artisan: "Artisan's tools", gaming: "Gaming set" }[kind] || "Item";
}

// Spellcasting focus forms (PHB p.151). A staff or wooden staff is also a quarterstaff.
const FOCUS_TYPES = {
  "Arcane Focus": ["Crystal", "Orb", "Rod", "Staff", "Wand"],
  "Druidic Focus": ["Sprig of mistletoe", "Totem", "Wooden staff", "Yew wand"],
  "Holy Symbol": ["Amulet", "Emblem", "Reliquary"]
};

// Gear tokens -> [{ name, quantity, key }]; key identifies a "pick:" token's select (or a focus's form select).
function resolveGear(tokens, prefix, picks = {}) {
  return tokens.map((token, index) => {
    const key = `${prefix}-${index}`;
    if (token.startsWith("pick:")) return { name: picks[key] || "", quantity: 1, key, kind: token.slice(5) };
    if (token.startsWith("text:")) return { name: token.slice(5), quantity: 1 };
    const [, name, count] = token.match(/^(.*?)(?: x(\d+))?$/);
    if (FOCUS_TYPES[name]) return { name, quantity: Number(count || 1), key, focus: FOCUS_TYPES[name], focusType: picks[key] || "" };
    return { name, quantity: Number(count || 1) };
  });
}

// The inventory row for a starting focus of the chosen form; a staff is a quarterstaff you can fight with.
function focusGearRow(item) {
  const staff = /staff/i.test(item.focusType);
  const card = ITEM_CATALOG.find(entry => entry.name === (staff ? "Quarterstaff" : item.name));
  const row = card ? equipmentFromItemCard({ ...card, quantity: item.quantity }) : { id: crypto.randomUUID(), name: item.name, quantity: item.quantity, weight: 0, container: "carried", equipped: false, attuned: false, notes: "" };
  row.name = staff ? `Quarterstaff (${item.name.toLowerCase()})` : item.focusType ? `${item.name} (${item.focusType.toLowerCase()})` : item.name;
  if (staff) row.notes = `${row.notes} Also your spellcasting focus.`.trim();
  return { row, card };
}

// Background gear picks the Background step already answered (Soldier's gaming set, Entertainer's instrument).
function backgroundGearPicks(draft = creationDraft) {
  const labels = { instrument: "Musical instrument", gaming: "Gaming set", artisan: "Artisan's tools" };
  const slots = creationSlots(draft).filter(slot => slot.group === "background" && slot.kind === "tool" && draft.picks[slot.id]);
  return Object.fromEntries(resolveGear(BACKGROUND_STARTING[draft.background]?.gear || [], "b").filter(item => item.kind)
    .map(item => [item.key, draft.picks[slots.find(slot => slot.label === labels[item.kind])?.id]]).filter(([, name]) => name));
}

function draftGear(draft = creationDraft) {
  if (draft.gear.mode !== "equipment") return [];
  const groups = CLASS_STARTING_EQUIPMENT[draft.classId] || [];
  const classGear = groups.flatMap((group, index) => resolveGear(group[Number(draft.gear.options[index] || 0)] || group[0], `c${index}`, draft.gear.picks));
  return [...classGear, ...resolveGear(BACKGROUND_STARTING[draft.background]?.gear || [], "b", { ...draft.gear.picks, ...backgroundGearPicks(draft) })];
}

function renderCreateEquipment() {
  const draft = creationDraft;
  const cls = draftClass();
  const groups = CLASS_STARTING_EQUIPMENT[cls?.id] || [];
  const goldFormula = CLASS_STARTING_GOLD[cls?.id];
  const purse = BACKGROUND_STARTING[draft.background];
  const mode = draft.gear.mode;
  const pickSelect = item => item.focus ? `<label class="create-name">${escapeHtml(item.name)} form
      <select data-create-gear-pick="${item.key}"><option value="">Choose later</option>${item.focus.map(name => `<option ${name === item.focusType ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}</select>
    </label>` : `<label class="create-name">${escapeHtml(gearKindLabel(item.kind))}
      <select data-create-gear-pick="${item.key}"><option value="">Choose…</option>${gearPickOptions(item.kind).map(name => `<option ${name === item.name ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}</select>
    </label>`;
  const optionLabel = option => resolveGear(option, "x").map(item => item.kind ? `any ${{ simple: "simple weapon", simpleMelee: "simple melee weapon", martial: "martial weapon", martialMelee: "martial melee weapon", instrument: "musical instrument" }[item.kind] || item.kind}` : `${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ""}`).join(", ");
  return `
    <h3 class="create-screen-title">Starting equipment</h3>
    <div class="create-skill-chips">
      <button type="button" class="condition-chip ${mode === "equipment" ? "active" : ""}" data-create-gear-mode="equipment" ${groups.length ? "" : "disabled"}>Take the class and background equipment</button>
      <button type="button" class="condition-chip ${mode === "gold" ? "active" : ""}" data-create-gear-mode="gold" ${goldFormula ? "" : "disabled"}>Roll starting gold instead${goldFormula ? ` (${goldFormula.replace("*", " × ")} gp)` : ""}</button>
      <button type="button" class="condition-chip ${mode === "none" ? "active" : ""}" data-create-gear-mode="none">Decide later (no gear, 0 gp)</button>
    </div>
    ${mode === "equipment" ? `
      ${groups.map((group, index) => {
        const chosen = group[Number(draft.gear.options[index] || 0)] || group[0];
        const picks = resolveGear(chosen, `c${index}`, draft.gear.picks).filter(item => item.kind || item.focus);
        return `${group.length > 1 ? `<label class="create-name">Choose one
            <select data-create-gear-option="${index}">${group.map((option, optionIndex) => `<option value="${optionIndex}" ${Number(draft.gear.options[index] || 0) === optionIndex ? "selected" : ""}>${escapeHtml(optionLabel(option))}</option>`).join("")}</select>
          </label>` : `<p class="create-detail">You get: ${escapeHtml(optionLabel(chosen))}</p>`}${picks.map(pickSelect).join("")}`;
      }).join("")}
      ${purse ? `<p class="create-detail"><strong>${escapeHtml(draft.background)}:</strong> ${escapeHtml(resolveGear(purse.gear, "b", backgroundGearPicks()).map(item => item.kind && !item.name ? `a ${item.kind === "instrument" ? "musical instrument" : item.kind === "artisan" ? "set of artisan's tools" : "gaming set"}` : item.name).join(", "))}, and ${purse.gold} gp.</p>
        ${resolveGear(purse.gear, "b", draft.gear.picks).filter(item => (item.kind && !backgroundGearPicks()[item.key]) || item.focus).map(pickSelect).join("")}`
        : draft.background ? `<p class="create-detail">${escapeHtml(draft.background)}'s gear and coins aren't listed here: add them in Inventory.</p>` : ""}
    ` : mode === "gold" ? `
      <p class="create-detail">${draft.gear.gold === null ? `Roll ${escapeHtml(goldFormula.replace("*", " × "))} gp. Starting gold replaces the class and background equipment, purse included.` : `<strong>${draft.gear.gold} gp</strong> to spend on gear from the catalog.`}</p>
      <button type="button" class="secondary" data-create-gold-roll>${icon("dice-five")}${draft.gear.gold === null ? "Roll" : "Roll again"}</button>
    ` : `<p class="create-detail">Pick how you start: the gear your class and background give you, or a class's starting gold to spend.</p>`}
  `;
}

// ---- Spells step ----
function draftCaster(draft = creationDraft) {
  const cls = getClasses()[draft.classId];
  if (!cls) return null;
  const casting = cls.casterType === "none" && draft.subclass ? lookupBySubclass(SUBCLASS_CASTING, draft.subclass) : null;
  return casting ? { ...cls, ...casting } : cls;
}

function draftSpellCounts(draft = creationDraft) {
  const cls = draftCaster(draft);
  if (!cls || cls.casterType === "none") return { cantrips: 0, spells: 0, maxLevel: 0 };
  const level = draft.level;
  const slots = spellSlotsFor(cls, level);
  const maxLevel = slots.reduce((highest, count, index) => count > 0 ? index + 1 : highest, 0);
  const spells = cls.preparedFormula === "known" ? knownSpellCap(cls, level) || 0 : cls.id === "wizard" ? KNOWN_SPELLS.wizard[level - 1] : 0;
  return { cantrips: cantripCap(cls, level), spells: maxLevel ? spells : 0, maxLevel };
}

function draftSpellOptions(kind, draft = creationDraft) {
  const cls = draftCaster(draft);
  const { maxLevel } = draftSpellCounts(draft);
  return allSpells.filter(item => (cls.spellSources || []).some(id => spellOnClassList(item, id)))
    .filter(item => kind === "cantrips" ? item.level === 0 : item.level > 0 && item.level <= maxLevel)
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

function renderCreateSpells() {
  const draft = creationDraft;
  const cls = draftCaster(draft);
  const counts = draftSpellCounts(draft);
  if (!cls || (!counts.cantrips && !counts.spells)) {
    const prepares = cls && counts.maxLevel && cls.preparedFormula !== "known" && cls.casterType !== "none";
    return `<h3 class="create-screen-title">Spells</h3><p class="create-detail">${prepares ? `${escapeHtml(cls.name)} prepares spells from the whole class list each day: choose them in the Spells tab.` : `No spells to choose${cls ? ` for ${escapeHtml(cls.name)} at level ${draft.level}` : ""}.`}</p>`;
  }
  const pickers = kind => Array.from({ length: counts[kind] }, (_, index) => {
    const current = draft.spellPicks[kind][index] || "";
    // Cantrips the species already grants (High Elf's pick, Tiefling's thaumaturgy) aren't offered again.
    const taken = new Set([...draft.spellPicks[kind].filter((value, other) => value && other !== index), draft.speciesCantrip, ...(SPECIES_GRANTS[draft.species]?.cantrips || [])].filter(Boolean));
    return `<select class="spell-select" data-create-spell="${kind}" data-index="${index}" aria-label="${kind === "cantrips" ? "Cantrip" : "Spell"} ${index + 1}"><option value="">Choose later</option>${draftSpellOptions(kind).filter(item => !taken.has(item.index)).map(item => `<option value="${escapeHtml(item.index)}" ${item.index === current ? "selected" : ""}>${escapeHtml(item.name)}${item.level ? ` (${ordinal(item.level)})` : ""}</option>`).join("")}</select>`;
  }).join("");
  return `
    <h3 class="create-screen-title">Spells</h3>
    ${counts.cantrips ? `<h4 class="create-subtitle">Cantrips (${counts.cantrips})</h4><div class="spell-rows">${pickers("cantrips")}</div>` : ""}
    ${counts.spells ? `<h4 class="create-subtitle">${cls.id === "wizard" ? "Spellbook" : "Spells known"} (${counts.spells}, up to ${ordinal(counts.maxLevel)} level)</h4><div class="spell-rows">${pickers("spells")}</div>` : ""}
    ${cls.preparedFormula !== "known" && cls.id !== "wizard" ? `<p class="create-detail">You prepare leveled spells from your class list in the Spells tab.</p>` : ""}
  `;
}

function renderCreateReview() {
  const draft = creationDraft;
  const cls = draftClass();
  if (!cls) return `<h3 class="create-screen-title">Almost there</h3><p class="create-detail">Choose a class before creating your character.</p>`;
  const speciesRow = SPECIES_PRESETS.find(([name]) => name === draft.species);
  const abilities = draftAbilitiesWithBonus();
  const hp = draftHp(draft);
  const subclass = officialSubclasses.find(item => item.index === draft.subclass);
  // Background skill picks and replacements for duplicated skills count too.
  const pickedSkills = creationSlots().filter(slot => slot.kind === "skill" && draft.picks[slot.id]).map(slot => draft.picks[slot.id]);
  const skills = [...new Set([...backgroundSkills(draft.background), ...draft.skills, ...draft.speciesSkills, ...(SPECIES_GRANTS[draft.species]?.skills || []), ...pickedSkills])]
    .map(id => SKILLS.find(([skill]) => skill === id)?.[1]).filter(Boolean);
  const feats = draftFeatEntries(draft);
  return `
    <h3 class="create-screen-title">Ready for adventure</h3>
    <div class="create-review-hero">
      <span class="create-glyph">${speciesRow ? icon(speciesRow[3]) : ""}${icon(CLASS_GLYPHS[cls.id] || "sparkle")}</span>
      <strong>${escapeHtml(draft.name.trim() || "New Character")}</strong>
      <span>${escapeHtml([draft.species, cls.name, subclass ? `(${subclass.name})` : ""].filter(Boolean).join(" "))} · ${escapeHtml(draft.background || "No background")} · Level ${draft.level}</span>
    </div>
    <div class="create-review-stats">
      ${ABILITIES.map(([id]) => {
        const extra = abilities[id] - Number(draft.abilities[id] || 10);
        return `<span><strong>${id.toUpperCase()}</strong> ${abilities[id]} (${formatMod(Math.floor((abilities[id] - 10) / 2))})${extra ? ` <em>${formatMod(extra)}</em>` : ""}</span>`;
      }).join("")}
      <span><strong>HP</strong> ${hp}</span>
      <span><strong>Hit Dice</strong> ${draft.level}d${cls.hitDie}</span>
      <span><strong>Gold</strong> ${draftGold(draft)} gp</span>
    </div>
    ${draft.level > 1 ? `
      <label class="create-name">Hit points for levels 2-${draft.level}
        <select data-create-field="hpMode"><option value="average" ${draft.hpMode === "average" ? "selected" : ""}>Take the average</option><option value="roll" ${draft.hpMode === "roll" ? "selected" : ""}>Roll each level</option></select>
      </label>
      ${draft.hpMode === "roll" ? `<p class="create-detail">Rolls: ${draft.hpRolls.length ? escapeHtml(draft.hpRolls.join(", ")) : "not rolled yet"} <button type="button" class="ghost" data-create-hp-roll>${icon("dice-five")}${draft.hpRolls.length ? "Reroll" : "Roll"}</button></p>` : ""}` : ""}
    <p class="create-detail">Skills: ${escapeHtml(skills.join(", ") || "none yet")}${draft.skills.length < classSkillPicks(cls) ? ` · ${classSkillPicks(cls) - draft.skills.length} class skill pick${classSkillPicks(cls) - draft.skills.length === 1 ? "" : "s"} left (Background step)` : ""}</p>
    ${feats.length ? `<p class="create-detail">Feats: ${escapeHtml(feats.join(", "))}</p>` : ""}
    <p class="create-detail">Your current sheet stays saved in the Character Library. Creating starts a fresh sheet.</p>
  `;
}

function draftFeatEntries(draft = creationDraft) {
  const entries = [];
  if (draft.speciesFeat?.name) entries.push(featEntry(draft.speciesFeat.name, draft.speciesFeat.variant));
  if (BACKGROUND_FEATS[draft.background] && draft.backgroundFeat?.name) entries.push(featEntry(draft.backgroundFeat.name, draft.backgroundFeat.variant));
  (draft.improvements || []).forEach(item => {
    if (item.mode === "feat" && item.feat?.name) entries.push(featEntry(item.feat.name, item.feat.variant));
  });
  return entries;
}

// Level 1 takes the full die; later levels the average, or the rolls (each at least 1, PHB p.15).
function draftHp(draft = creationDraft) {
  const cls = draftClass();
  if (!cls) return 0;
  const conMod = Math.floor((draftAbilitiesWithBonus(draft).con - 10) / 2);
  const extra = extraHpPerLevel({ species: draft.species, classId: cls.id, subclass: draft.subclass, feats: draftFeatEntries(draft) }) * draft.level;
  if (draft.hpMode === "roll" && draft.hpRolls.length === draft.level - 1) {
    return Math.max(1, cls.hitDie + conMod) + draft.hpRolls.reduce((sum, roll) => sum + Math.max(1, roll + conMod), 0) + extra;
  }
  return averageHpFor(cls, draft.level, conMod) + extra;
}

function draftGold(draft = creationDraft) {
  if (draft.gear.mode === "gold") return draft.gear.gold || 0;
  return draft.gear.mode === "equipment" ? BACKGROUND_STARTING[draft.background]?.gold || 0 : 0;
}

function wholeNumber(value, fallback, min, max) {
  const number = Math.round(Number(value));
  return Number.isFinite(number) && String(value).trim() !== "" ? clamp(number, min, max) : fallback;
}

function handleCreateFieldInput(event) {
  if (!creationDraft) return;
  const target = event.target;
  const field = target.dataset.createField;
  if (field === "level") {
    creationDraft.level = wholeNumber(target.value, creationDraft.level, 1, 20);
    creationDraft.hpRolls = [];
    const slot = document.querySelector("#createSubclassSlot");
    if (slot) slot.innerHTML = renderCreateLevelExtras();
  } else if (field) {
    creationDraft[field] = target.value;
  }
  if (target.dataset.createPick) {
    // Re-render so the other selects drop this pick (and a tool picked twice gets its replacement select).
    creationDraft.picks[target.dataset.createPick] = target.value;
    renderCreateStep();
  }
  if (target.dataset.createGearPick) creationDraft.gear.picks[target.dataset.createGearPick] = target.value;
  if (target.dataset.createSpell) creationDraft.spellPicks[target.dataset.createSpell][Number(target.dataset.index)] = target.value;
  if (target.matches("[data-create-species-search]")) {
    const query = target.value.trim().toLowerCase();
    let shown = 0;
    document.querySelectorAll("#createSpeciesGrid [data-species-name]").forEach(card => {
      card.hidden = Boolean(query) && !card.dataset.speciesName.includes(query);
      if (!card.hidden) shown += 1;
    });
    document.querySelector("#createSpeciesEmpty").hidden = shown > 0;
  }
  const ability = target.dataset.createAbility;
  if (ability) {
    creationDraft.abilities[ability] = wholeNumber(target.value, creationDraft.abilities[ability], 1, 30);
    const modLabel = target.closest(".create-ability-card")?.querySelector(".ability-mod");
    if (modLabel) modLabel.textContent = createAbilityScoreText(ability);
    const pointBuy = document.querySelector("#createPointBuy");
    if (pointBuy && creationDraft.method === "pointbuy") pointBuy.textContent = pointBuyText();
  }
}

// On commit (blur/Enter) the box shows the value that will actually be used; choices that change other
// controls re-render the step.
function handleCreateFieldChange(event) {
  if (!creationDraft) return;
  const draft = creationDraft;
  const target = event.target;
  const scope = target.dataset.featScope;
  if (scope) {
    const state = scope === "species" ? draft.speciesFeat : scope === "background" ? draft.backgroundFeat : draft.improvements[Number(scope.split("-")[1])]?.feat;
    if (state && updateFeatPickState(state, target)) renderCreateStep();
    return;
  }
  if (target.dataset.createImprove) {
    draft.improvements[Number(target.dataset.createImprove)][target.dataset.improveField] = target.value;
    renderCreateStep();
    return;
  }
  if (target.dataset.createAssign) {
    // Picking a score swaps it with whichever ability held it, so the array or rolls stay whole.
    const id = target.dataset.createAssign;
    const value = Number(target.value);
    const other = ABILITIES.map(([ability]) => ability).find(ability => ability !== id && Number(draft.abilities[ability]) === value);
    if (other) draft.abilities[other] = draft.abilities[id];
    draft.abilities[id] = value;
    renderCreateStep();
    return;
  }
  if (target.dataset.createGearOption) {
    draft.gear.options[target.dataset.createGearOption] = Number(target.value);
    renderCreateStep();
    return;
  }
  if (["lineageEither", "hpMode", "draconicAncestry"].includes(target.dataset.createField)) {
    if (target.dataset.createField === "lineageEither") draft.speciesSkills = [];
    renderCreateStep();
    return;
  }
  if (target.dataset.createSpell) {
    renderCreateStep();
    return;
  }
  if (target.dataset.createField === "level") target.value = draft.level;
  const ability = target.dataset.createAbility;
  if (ability) target.value = draft.abilities[ability];
}

function rollAbilityPool() {
  // 4d6, drop the lowest die, six times (PHB p.13).
  return Array.from({ length: 6 }, () => Array.from({ length: 4 }, () => rollDie(6)).sort((a, b) => b - a).slice(0, 3).reduce((sum, die) => sum + die, 0));
}

function placeByClassPriority(values) {
  const cls = draftClass();
  const priority = CLASS_ABILITY_PRIORITY[creationDraft.classId]
    || [...new Set([cls?.spellAbility, "con", "dex", "str", "wis", "int", "cha"].filter(id => ABILITIES.some(([ability]) => ability === id)))];
  [...values].sort((a, b) => b - a).forEach((value, index) => {
    creationDraft.abilities[priority[index]] = value;
  });
}

function handleCreateStepClick(event) {
  if (!creationDraft) return;
  const draft = creationDraft;
  if (event.target.closest("[data-create-reset]")) {
    creationDraft = blankCreationDraft();
    renderCreateStep();
    return;
  }
  const stepButton = event.target.closest("[data-create-step]");
  if (stepButton) {
    draft.step = Number(stepButton.dataset.createStep);
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
    if (draft.skills.includes(id)) draft.skills = draft.skills.filter(item => item !== id);
    else if (draft.skills.length < picks) draft.skills.push(id);
    renderCreateStep();
    return;
  }
  const speciesSkill = event.target.closest("[data-create-species-skill]");
  if (speciesSkill) {
    const id = speciesSkill.dataset.createSpeciesSkill;
    const picks = speciesSkillPicks();
    if (draft.speciesSkills.includes(id)) draft.speciesSkills = draft.speciesSkills.filter(item => item !== id);
    else if (draft.speciesSkills.length < picks) draft.speciesSkills.push(id);
    renderCreateStep();
    return;
  }
  const speciesAbility = event.target.closest("[data-create-species-ability]");
  if (speciesAbility) {
    const id = speciesAbility.dataset.createSpeciesAbility;
    const picks = speciesBonusPlan().steps.length;
    if (draft.speciesAbilities.includes(id)) draft.speciesAbilities = draft.speciesAbilities.filter(item => item !== id);
    else if (draft.speciesAbilities.length < picks) draft.speciesAbilities.push(id);
    renderCreateStep();
    return;
  }
  const toggle = event.target.closest("[data-create-toggle]");
  if (toggle) {
    draft[toggle.dataset.createToggle] = !draft[toggle.dataset.createToggle];
    draft.speciesAbilities = [];
    renderCreateStep();
    return;
  }
  if (event.target.closest("[data-create-pointbuy]")) {
    ABILITIES.forEach(([id]) => { draft.abilities[id] = 8; });
    Object.assign(draft, { method: "pointbuy", pool: null });
    renderCreateStep();
    return;
  }
  if (event.target.closest("[data-create-roll]")) {
    const pool = rollAbilityPool();
    Object.assign(draft, { method: "rolled", pool });
    placeByClassPriority(pool);
    renderCreateStep();
    return;
  }
  if (event.target.closest("[data-create-manual]")) {
    Object.assign(draft, { method: "", pool: null });
    renderCreateStep();
    return;
  }
  const gearMode = event.target.closest("[data-create-gear-mode]");
  if (gearMode) {
    draft.gear.mode = gearMode.dataset.createGearMode;
    renderCreateStep();
    return;
  }
  if (event.target.closest("[data-create-gold-roll]")) {
    const [dice, times] = CLASS_STARTING_GOLD[draft.classId].split("*");
    const [count, sides] = dice.split("d").map(Number);
    draft.gear.gold = Array.from({ length: count }, () => rollDie(sides)).reduce((sum, die) => sum + die, 0) * Number(times || 1);
    renderCreateStep();
    return;
  }
  if (event.target.closest("[data-create-hp-roll]")) {
    const cls = draftClass();
    draft.hpRolls = Array.from({ length: draft.level - 1 }, () => rollDie(cls.hitDie));
    renderCreateStep();
    return;
  }
  const option = event.target.closest("[data-create-option]");
  if (option) {
    const [field, ...value] = option.dataset.createOption.split(":");
    draft[field] = value.join(":");
    if (field === "species") {
      Object.assign(draft, { speciesAbilities: [], speciesSkills: [], speciesCantrip: "", speciesFeat: { name: "" }, draconicAncestry: "", size: "", speciesSpellAbility: "", heritage: "", lineageEither: "", altBonuses: false, customOrigin: false });
      Object.keys(draft.picks).filter(key => key.startsWith("sp-")).forEach(key => delete draft.picks[key]);
      const granted = new Set(SPECIES_GRANTS[draft.species]?.skills || []);
      draft.skills = draft.skills.filter(id => !granted.has(id));
    }
    if (field === "classId") {
      Object.keys(draft.picks).filter(key => key.startsWith("cls-")).forEach(key => delete draft.picks[key]);
      Object.assign(draft, { subclass: "", skills: [], improvements: [], gear: { mode: "", options: {}, picks: {}, gold: null }, spellPicks: { cantrips: [], spells: [] }, hpRolls: [] });
    }
    if (field === "background") {
      draft.backgroundChosen = true;
      const feat = BACKGROUND_FEATS[draft.background] || "";
      draft.backgroundFeat = { name: featBaseName(feat), ...(featVariant(feat) ? { variant: featVariant(feat), fixedVariant: true } : {}) };
      Object.keys(draft.picks).filter(key => /^(bg|rep)-/.test(key)).forEach(key => delete draft.picks[key]);
      const owned = new Set(backgroundSkills(draft.background));
      draft.skills = draft.skills.filter(id => !owned.has(id));
      draft.speciesSkills = draft.speciesSkills.filter(id => !owned.has(id));
    }
    renderCreateStep();
    return;
  }
  if (event.target.closest("[data-create-standard]")) {
    Object.assign(draft, { method: "standard", pool: [15, 14, 13, 12, 10, 8] });
    placeByClassPriority(draft.pool);
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
  const draft = creationDraft;
  if (draft.step === 1 && !draft.classId) {
    showToast(`<span class="toast-label">Pick a class to continue</span>`);
    return;
  }
  if (draft.step === 3 && !draft.capOk) {
    const problems = draftAbilityProblems();
    if (problems.length) {
      showToast(`<span class="toast-label">Ability scores break the creation rules</span><span>${escapeHtml(problems.join(" "))}</span>`, {
        tone: "fumble",
        actions: [{ label: "Keep them anyway", run: () => { draft.capOk = true; createStepNext(); } }],
        persist: true
      });
      return;
    }
  }
  // Every "any martial weapon" style choice in the starting gear needs an answer (it's part of the package).
  const unpicked = (draft.step === 4 || draft.step === CREATE_STEP_LABELS.length - 1) && draftGear(draft).filter(item => item.kind && !item.name);
  if (unpicked?.length) {
    draft.step = 4;
    renderCreateStep();
    showToast(`<span class="toast-label">Choose your starting gear</span><span>Pick the ${escapeHtml(unpicked.map(item => gearKindLabel(item.kind).toLowerCase()).join(", "))} on the Equipment step.</span>`, { tone: "fumble" });
    return;
  }
  if (draft.step < CREATE_STEP_LABELS.length - 1) {
    draft.step += 1;
    renderCreateStep();
    return;
  }
  finishCreation();
}

// Each level adds at least 1 HP, even with a CON penalty (PHB p.15).
function averageHpFor(cls, level, conMod) {
  return Math.max(1, cls.hitDie + conMod) + (level - 1) * Math.max(1, Math.ceil(cls.hitDie / 2) + 1 + conMod);
}

// HP added every level on top of the class die: Hill Dwarf, feats (Tough, custom feats), and Draconic Resilience
// for a level gained in a Draconic sorcerer entry (PHB p.102: per sorcerer level only).
function extraHpPerLevel({ species, classId, subclass, feats = [] }) {
  return speciesHpPerLevel(species) + feats.reduce((sum, entry) => sum + (featRule(featBaseName(entry))?.hpPerLevel || 0), 0) + (classId === "sorcerer" && lookupBySubclass({ draconic: true }, subclass) ? 1 : 0);
}

// Per-level extra HP for a level in one class entry (defaults to the primary class).
function sheetExtraHp(classId = currentClass().id, subclass = character.subclassName) {
  return extraHpPerLevel({ species: character.species, classId, subclass, feats: takenFeatEntries() });
}

// ---------------------------------------------------------------------------------------------
// Feats. A taken feat is an entry string: the feat's name, or "Name (Variant)" when the feat fixes a choice
// ("Strike of the Giants (Fire)"). Class-level picks live in planner.feats (the ASI slots); feats from a
// species or background live in character.bonusFeats so they never count as an ASI (PHB p.31, TCE p.8).
// ---------------------------------------------------------------------------------------------
const SPELLCASTING_CLASSES = { Bard: ["bard", "cha"], Cleric: ["cleric", "wis"], Druid: ["druid", "wis"], Sorcerer: ["sorcerer", "cha"], Warlock: ["warlock", "cha"], Wizard: ["wizard", "int"] };
const STRIXHAVEN_COLLEGES = {
  Lorehold: { cantrips: ["light", "sacred-flame", "thaumaturgy"], classes: ["cleric", "wizard"] },
  Prismari: { cantrips: ["fire-bolt", "prestidigitation", "ray-of-frost"], classes: ["bard", "sorcerer"] },
  Quandrix: { cantrips: ["druidcraft", "guidance", "mage-hand"], classes: ["druid", "wizard"] },
  Silverquill: { cantrips: ["sacred-flame", "thaumaturgy", "vicious-mockery"], classes: ["bard", "cleric"] },
  Witherbloom: { cantrips: ["chill-touch", "druidcraft", "spare-the-dying"], classes: ["druid", "wizard"] }
};
const HIGH_SORCERY_MOONS = {
  Nuitari: ["dissonant-whispers", "false-life", "hex", "ray-of-sickness"],
  Lunitari: ["color-spray", "disguise-self", "feather-fall", "longstrider"],
  Solinari: ["comprehend-languages", "detect-evil-and-good", "protection-from-evil-and-good", "shield"]
};
// Scion of the Outer Planes: [resistance, cantrip] per plane type.
const SCION_PLANES = { Chaotic: ["poison", "minor-illusion"], Evil: ["necrotic", "chill-touch"], Good: ["radiant", "sacred-flame"], Lawful: ["force", "guidance"], Outlands: ["psychic", "mage-hand"] };

// Feats that fix one choice when taken; the choice becomes part of the entry name.
const FEAT_VARIANTS = {
  "Elemental Adept": ["Acid", "Cold", "Fire", "Lightning", "Thunder"],
  "Magic Initiate": Object.keys(SPELLCASTING_CLASSES),
  "Ritual Caster": Object.keys(SPELLCASTING_CLASSES),
  "Spell Sniper": Object.keys(SPELLCASTING_CLASSES),
  "Strixhaven Initiate": Object.keys(STRIXHAVEN_COLLEGES),
  "Initiate of High Sorcery": Object.keys(HIGH_SORCERY_MOONS),
  "Scion of the Outer Planes": Object.keys(SCION_PLANES),
  "Strike of the Giants": ["Cloud", "Fire", "Frost", "Hill", "Stone", "Storm"],
  "Divinely Favored": ["Evil", "Good", "Neutral"]
};

// Proficiencies, senses and resistances a feat grants (fixed), and the picks it asks for when taken.
const FEAT_GRANTS = {
  "Lightly Armored": { armor: ["Light armor"] },
  "Moderately Armored": { armor: ["Medium armor", "Shields"] },
  "Heavily Armored": { armor: ["Heavy armor"] },
  "Tavern Brawler": { weapons: ["Improvised weapons"] },
  "Gunner": { weapons: ["Firearms"] },
  "Chef": { tools: ["Cook's utensils"] },
  "Poisoner": { tools: ["Poisoner's kit"] },
  "Fey Teleportation": { languages: ["Sylvan"] },
  "Weapon Master": { picks: { weapons: 4 } },
  "Skilled": { picks: { skillOrTool: 3 } },
  "Prodigy": { picks: { skills: 1, tools: 1, languages: 1, expertise: 1 } },
  "Skill Expert": { picks: { skills: 1, expertise: 1 } },
  "Squat Nimbleness": { picks: { skills: 1 }, skillFrom: ["acrobatics", "athletics"] },
  "Linguist": { picks: { languages: 3 } },
  "Artificer Initiate": { picks: { tools: 1 }, toolFrom: "artisan" },
  "Keenness of the Stone Giant": { darkvision: 60 },
  "Infernal Constitution": { resist: ["cold", "poison"] },
  "Ember of the Fire Giant": { resist: ["fire"] },
  "Fury of the Frost Giant": { resist: ["cold"] },
  "Dungeon Delver": { resist: ["damage from traps"] }
};

// HP per level from a feat (Tough, PHB p.170).
const FEAT_HP_PER_LEVEL = { Tough: 2 };

// Spells a feat teaches. ability: a fixed ability, "feat" (the +1 the feat raised), "class" (the variant class's),
// or "pick" (INT, WIS or CHA chosen with the feat). free: "will", "1/long", "1/short" or "ritual" (cast without a slot).
function featSpellSpec(name, variant) {
  const cls = SPELLCASTING_CLASSES[variant];
  const college = STRIXHAVEN_COLLEGES[variant];
  const specs = {
    "Magic Initiate": cls && { ability: cls[1], choose: [{ count: 2, level: 0, classes: [cls[0]] }, { count: 1, level: 1, classes: [cls[0]], free: "1/long" }] },
    "Ritual Caster": cls && { ability: cls[1], choose: [{ count: 2, level: 1, classes: [cls[0]], ritual: true, free: "ritual" }] },
    "Spell Sniper": cls && { ability: cls[1], choose: [{ count: 1, level: 0, classes: [cls[0]], attack: true }] },
    "Fey Touched": { ability: "feat", fixed: [["misty-step", "1/long"]], choose: [{ count: 1, level: 1, schools: ["divination", "enchantment"], free: "1/long" }] },
    "Shadow Touched": { ability: "feat", fixed: [["invisibility", "1/long"]], choose: [{ count: 1, level: 1, schools: ["illusion", "necromancy"], free: "1/long" }] },
    "Telepathic": { ability: "feat", fixed: [["detect-thoughts", "1/long"]] },
    "Telekinetic": { ability: "feat", fixed: [["mage-hand", ""]] },
    "Artificer Initiate": { ability: "int", choose: [{ count: 1, level: 0, classes: ["artificer"] }, { count: 1, level: 1, classes: ["artificer"], free: "1/long" }] },
    "Drow High Magic": { ability: "cha", fixed: [["detect-magic", "will"], ["levitate", "1/long"], ["dispel-magic", "1/long"]] },
    "Wood Elf Magic": { ability: "wis", fixed: [["longstrider", "1/long"], ["pass-without-trace", "1/long"]], choose: [{ count: 1, level: 0, classes: ["druid"] }] },
    "Svirfneblin Magic": { ability: "int", fixed: [["nondetection", "will"], ["blindness-deafness", "1/long"], ["blur", "1/long"], ["disguise-self", "1/long"]] },
    "Fey Teleportation": { ability: "int", fixed: [["misty-step", "1/short"]] },
    "Aberrant Dragonmark": { ability: "con", choose: [{ count: 1, level: 0, classes: ["sorcerer"] }, { count: 1, level: 1, classes: ["sorcerer"], free: "1/short" }] },
    "Gift of the Metallic Dragon": { ability: "pick", fixed: [["cure-wounds", "1/long"]] },
    "Strixhaven Initiate": college && { ability: "pick", choose: [{ count: 2, level: 0, list: college.cantrips }, { count: 1, level: 1, classes: college.classes, free: "1/long" }] },
    "Strixhaven Mascot": { ability: "pick", fixed: [["find-familiar", "ritual"]] },
    "Initiate of High Sorcery": HIGH_SORCERY_MOONS[variant] && { ability: "pick", choose: [{ count: 1, level: 0, classes: ["wizard"] }, { count: 2, level: 1, list: HIGH_SORCERY_MOONS[variant], free: "1/long" }] },
    "Adept of the Black Robes": { ability: "initiate", choose: [{ count: 1, level: 2, schools: ["enchantment", "necromancy"], free: "1/long" }] },
    "Adept of the Red Robes": { ability: "initiate", choose: [{ count: 1, level: 2, schools: ["illusion", "transmutation"], free: "1/long" }] },
    "Adept of the White Robes": { ability: "initiate", choose: [{ count: 1, level: 2, schools: ["abjuration", "divination"], free: "1/long" }] },
    "Divinely Favored": variant && { ability: "pick", fixed: [["augury", "1/long"]], choose: [{ count: 1, level: 0, classes: ["cleric"] }, { count: 1, level: 1, classes: [{ Evil: "warlock", Good: "cleric", Neutral: "druid" }[variant]], free: "1/long" }] },
    "Scion of the Outer Planes": SCION_PLANES[variant] && { ability: "pick", fixed: [[SCION_PLANES[variant][1], ""]] },
    "Outlands Envoy": { ability: "scion", fixed: [["misty-step", "1/long"], ["tongues", "1/long"]] },
    "Rune Shaper": { ability: "pick", fixed: [["comprehend-languages", "1/long"]] },
    "Cartomancer": { ability: "class", fixed: [["prestidigitation", ""]] }
  };
  return specs[name] || null;
}

// Limited-use feat features (C16-C18): (level, prof) => [[name, uses, reset]].
const FEAT_TRACKERS = {
  Lucky: () => [["Luck Points", 3, "long"]],
  "Metamagic Adept": () => [["Sorcery Points (Metamagic Adept)", 2, "long"]],
  "Orcish Fury": () => [["Orcish Fury", 1, "short"]],
  "Fade Away": () => [["Fade Away", 1, "short"]],
  // Second Chance also comes back when you roll initiative.
  "Second Chance": () => [["Second Chance", 1, "short"]],
  "Chef": (level, prof) => [["Chef's Treats", prof, "long"]],
  "Gift of the Chromatic Dragon": (level, prof) => [["Chromatic Infusion", 1, "long"], ["Reactive Resistance", prof, "long"]],
  "Gift of the Gem Dragon": (level, prof) => [["Telekinetic Reprisal", prof, "long"]],
  "Gift of the Metallic Dragon": (level, prof) => [["Protective Wings", prof, "long"]],
  "Squire of Solamnia": (level, prof) => [["Precise Strike", prof, "long"]],
  "Knight of the Crown": (level, prof) => [["Commanding Rally", prof, "long"]],
  "Knight of the Rose": (level, prof) => [["Bolstering Rally", prof, "long"]],
  "Knight of the Sword": (level, prof) => [["Demoralizing Strike", prof, "long"]],
  "Adept of the Red Robes": (level, prof) => [["Magical Balance", prof, "long"]],
  "Strike of the Giants": (level, prof) => [["Giant's Strike", prof, "long"]],
  "Ember of the Fire Giant": (level, prof) => [["Searing Ignition", prof, "long"]],
  "Fury of the Frost Giant": (level, prof) => [["Frigid Retaliation", prof, "long"]],
  "Guile of the Cloud Giant": (level, prof) => [["Cloudy Escape", prof, "long"]],
  "Keenness of the Stone Giant": (level, prof) => [["Stone Throw", prof, "long"]],
  "Soul of the Storm Giant": (level, prof) => [["Maelstrom Aura", prof, "long"]],
  "Agent of Order": (level, prof) => [["Stasis Strike", prof, "long"]],
  "Baleful Scion": (level, prof) => [["Grasp of Avarice", prof, "long"]],
  "Righteous Heritor": (level, prof) => [["Soothe Pain", prof, "long"]],
  "Planar Wanderer": () => [["Portal Sense", 1, "long"]],
  "Strixhaven Mascot": () => [["Mascot Swap", 1, "long"]],
  "Cartomancer": () => [["Hidden Ace", 1, "long"]]
};

// ---- Prerequisite tests (each works on the sheet or a creation draft) ----
const ELF_PATTERN = /elf|eladrin|shadar-kai|drow|mark of (shadow|detection|storm)/i;

function armorTrained(source, kind) {
  const armor = source.backgroundDetails?.armor || "";
  return /all armor/i.test(armor) || new RegExp(kind, "i").test(armor);
}

// "Proficiency with a martial weapon": martial weapons, or any martial weapon named in the weapons field.
function martialTrained(source) {
  const weapons = (source.backgroundDetails?.weapons || "").toLowerCase();
  if (/martial/.test(weapons)) return true;
  return ITEM_CATALOG.some(item => /^martial/i.test(item.rarity || "") && (weapons.includes(item.name.toLowerCase()) || weapons.includes(`${item.name.toLowerCase()}s`)));
}

// Spellcasting or Pact Magic from a class entry at its current level (paladin/ranger 2nd; EK, AT, Profane Soul 3rd).
function entryCastingKind(entry) {
  const base = getClasses()[entry.classId] || {};
  const cls = base.casterType === "none" ? { ...base, ...(lookupBySubclass(SUBCLASS_CASTING, subclassIndexFor(entry) || entry.subclassName) || {}) } : base;
  const start = { halfRoundDown: 2, third: 3, pactThird: 3 }[cls.casterType] || 1;
  if (!cls.casterType || cls.casterType === "none" || Number(entry.level) < start) return "";
  return isPactCaster(cls) ? "pact" : "spellcasting";
}

function hasCastingFeature(source, allowPact = true) {
  return classEntries(source).some(entry => {
    const kind = entryCastingKind(entry);
    return kind === "spellcasting" || (allowPact && kind === "pact");
  });
}

// "The ability to cast at least one spell": any class casting, or a species or feat spell.
function castsAnySpell(source) {
  return hasCastingFeature(source) || (source.spells || []).some(row => row.index && row.source)
    || takenFeatEntries(source).some(entry => featSpellSpec(featBaseName(entry), featVariant(entry)));
}

function characterSize(source = character) {
  if (source.size) return source.size;
  const preset = SPECIES_PRESETS.find(([name]) => name === source.species);
  return /^small$/i.test(preset?.[5] || "") || (!preset?.[5] && /gnome|halfling|goblin|kobold/i.test(source.species || "")) ? "Small" : "Medium";
}

const level4 = source => totalLevel(source) >= 4;
const hasBackground = (source, name) => source.background === name;
const classIs = (source, ...ids) => classEntries(source).some(entry => ids.includes(entry.classId));

// [test, what it needs]. Ability lists and repeatability come from FEAT_DETAILS (rules-feats.js).
const FEAT_PREREQS = {
  "Defensive Duelist": [source => source.abilities.dex >= 13, "DEX 13"],
  "Grappler": [source => source.abilities.str >= 13, "STR 13"],
  "Inspiring Leader": [source => source.abilities.cha >= 13, "CHA 13"],
  "Skulker": [source => source.abilities.dex >= 13, "DEX 13"],
  "Ritual Caster": [source => source.abilities.int >= 13 || source.abilities.wis >= 13, "INT or WIS 13"],
  "Moderately Armored": [source => armorTrained(source, "light|medium"), "light armor proficiency"],
  "Heavily Armored": [source => armorTrained(source, "medium"), "medium armor proficiency"],
  "Medium Armor Master": [source => armorTrained(source, "medium"), "medium armor proficiency"],
  "Heavy Armor Master": [source => armorTrained(source, "heavy"), "heavy armor proficiency"],
  "Elemental Adept": [castsAnySpell, "the ability to cast a spell"],
  "Spell Sniper": [castsAnySpell, "the ability to cast a spell"],
  "War Caster": [castsAnySpell, "the ability to cast a spell"],
  "Eldritch Adept": [source => hasCastingFeature(source), "the Spellcasting or Pact Magic feature"],
  "Metamagic Adept": [source => hasCastingFeature(source), "the Spellcasting or Pact Magic feature"],
  "Fighting Initiate": [martialTrained, "martial weapon proficiency"],
  "Strike of the Giants": [source => martialTrained(source) || hasBackground(source, "Giant Foundling"), "martial weapon proficiency or the Giant Foundling background"],
  "Rune Shaper": [source => hasCastingFeature(source, false) || hasBackground(source, "Rune Carver"), "the Spellcasting feature or the Rune Carver background"],
  "Cartomancer": [source => level4(source) && hasCastingFeature(source, false), "4th level and the Spellcasting feature"],
  "Bountiful Luck": [source => /halfling|mark of (healing|hospitality)/i.test(source.species), "halfling"],
  "Second Chance": [source => /halfling|mark of (healing|hospitality)/i.test(source.species), "halfling"],
  "Dragon Fear": [source => /dragonborn/i.test(source.species), "dragonborn"],
  "Dragon Hide": [source => /dragonborn/i.test(source.species), "dragonborn"],
  "Drow High Magic": [source => /^drow$/i.test(source.species), "elf (drow)"],
  "Dwarven Fortitude": [source => /dwarf|duergar|mark of warding/i.test(source.species), "dwarf"],
  "Elven Accuracy": [source => ELF_PATTERN.test(source.species), "elf or half-elf"],
  "Revenant Blade": [source => ELF_PATTERN.test(source.species) && !/half-elf|mark of (detection|storm)/i.test(source.species), "elf"],
  "Fade Away": [source => /gnome|svirfneblin|mark of scribing/i.test(source.species) && !/autognome/i.test(source.species), "gnome"],
  "Fey Teleportation": [source => /high elf/i.test(source.species), "elf (high elf)"],
  "Wood Elf Magic": [source => /wood elf/i.test(source.species), "elf (wood elf)"],
  "Flames of Phlegethos": [source => /tiefling/i.test(source.species), "tiefling"],
  "Infernal Constitution": [source => /tiefling/i.test(source.species), "tiefling"],
  "Orcish Fury": [source => /half-orc/i.test(source.species), "half-orc"],
  "Prodigy": [source => /half-elf|half-orc|human/i.test(speciesLineage(source)), "half-elf, half-orc or human"],
  "Squat Nimbleness": [source => /dwarf|duergar|mark of warding/i.test(source.species) || characterSize(source) === "Small", "dwarf or a Small species"],
  "Svirfneblin Magic": [source => /deep gnome|svirfneblin/i.test(source.species), "gnome (deep gnome)"],
  "Aberrant Dragonmark": [source => !/^mark of/i.test(source.species), "no other dragonmark"],
  "Squire of Solamnia": [source => classIs(source, "fighter", "paladin") || hasBackground(source, "Knight of Solamnia"), "fighter or paladin, or the Knight of Solamnia background", "Dragonlance campaign"],
  "Initiate of High Sorcery": [source => classIs(source, "sorcerer", "wizard") || hasBackground(source, "Mage of High Sorcery"), "sorcerer or wizard, or the Mage of High Sorcery background", "Dragonlance campaign"],
  "Divinely Favored": [level4, "4th level", "Dragonlance campaign"],
  "Scion of the Outer Planes": [() => true, "", "Planescape campaign"]
};
// 4th level plus another feat (or a variant of it).
[
  ["Strixhaven Mascot", "Strixhaven Initiate"], ["Agent of Order", "Scion of the Outer Planes (Lawful)"],
  ["Baleful Scion", "Scion of the Outer Planes (Evil)"], ["Cohort of Chaos", "Scion of the Outer Planes (Chaotic)"],
  ["Righteous Heritor", "Scion of the Outer Planes (Good)"], ["Outlands Envoy", "Scion of the Outer Planes (Outlands)"],
  ["Planar Wanderer", "Scion of the Outer Planes"], ["Knight of the Crown", "Squire of Solamnia"],
  ["Knight of the Rose", "Squire of Solamnia"], ["Knight of the Sword", "Squire of Solamnia"],
  ["Adept of the Black Robes", "Initiate of High Sorcery (Nuitari)"], ["Adept of the Red Robes", "Initiate of High Sorcery (Lunitari)"],
  ["Adept of the White Robes", "Initiate of High Sorcery (Solinari)"], ["Ember of the Fire Giant", "Strike of the Giants (Fire)"],
  ["Fury of the Frost Giant", "Strike of the Giants (Frost)"], ["Guile of the Cloud Giant", "Strike of the Giants (Cloud)"],
  ["Keenness of the Stone Giant", "Strike of the Giants (Stone)"], ["Soul of the Storm Giant", "Strike of the Giants (Storm)"],
  ["Vigor of the Hill Giant", "Strike of the Giants (Hill)"]
].forEach(([feat, needs]) => {
  FEAT_PREREQS[feat] = [source => level4(source) && hasFeat(needs, source), `4th level and ${needs}`];
});

// Everything the app knows about one feat: official (FEAT_DETAILS + tables above) or custom.
function featRule(name, source = character) {
  const custom = customFeatByName(name, source);
  if (custom) {
    return {
      custom, source: "Custom", summary: custom.description || "", prereqText: custom.prereq?.text || "",
      ability: custom.ability?.choose || [], repeatable: Boolean(custom.repeatable), hpPerLevel: Number(custom.hp?.perLevel || 0)
    };
  }
  const details = FEAT_DETAILS[name];
  if (!details && !FEAT_PRESETS.includes(name)) return null;
  const [ok, needs, note] = FEAT_PREREQS[name] || [];
  return {
    source: details?.source || "", summary: details?.summary || "", prereqText: details?.prereq || "",
    ability: details?.ability || [], repeatable: Boolean(details?.repeatable), saveProficiency: name === "Resilient",
    hpPerLevel: FEAT_HP_PER_LEVEL[name] || 0, ok, needs, note, variants: FEAT_VARIANTS[name]
  };
}

function allFeatNames() {
  return [...FEAT_PRESETS, ...Object.values(customFeats).map(feat => feat.name).filter(name => !FEAT_PRESETS.includes(name))];
}

function featEntry(name, variant = "") {
  return variant ? `${name} (${variant})` : name;
}

function featBaseName(entry) {
  const match = String(entry || "").match(/^(.*) \(([^()]*)\)$/);
  return match && (FEAT_VARIANTS[match[1]] || FEAT_PRESETS.includes(match[1])) ? match[1] : String(entry || "");
}

function featVariant(entry) {
  const base = featBaseName(entry);
  return base === entry ? "" : String(entry).slice(base.length + 2, -1);
}

// Every feat the character has: class-level picks, then species and background feats.
function takenFeatEntries(source = character) {
  return [...(source.planner?.feats || []), ...(source.bonusFeats || []).map(feat => feat.name)].filter(entry => entry && entry !== "Ability Score Improvement");
}

// Why a feat can't be taken right now, or "" when it can. Custom feats only show their typed prerequisite.
function featBlocked(name, source = character, variant = "") {
  const rule = featRule(name, source);
  if (!rule) return "";
  const entry = featEntry(name, variant);
  if (rule.repeatable ? takenFeatEntries(source).includes(entry) && (variant || !rule.variants) : hasFeat(name, source)) return "already taken";
  if (rule.ok && !rule.ok(source)) return `needs ${rule.needs}`;
  return "";
}

// The draft as a character-shaped object, for feat prerequisites at creation (subclass training included).
function draftFeatSource(draft = creationDraft) {
  const cls = getClasses()[draft.classId];
  const [armor, weapons] = CLASS_PROFICIENCIES[cls?.id] || [cls?.armor || "", cls?.weapons || ""];
  const grants = SPECIES_GRANTS[draft.species] || {};
  const extras = draft.subclass ? SUBCLASS_EXTRAS[draft.subclass] || {} : {};
  return {
    abilities: draftAbilitiesWithBonus(draft, { feats: false }),
    species: draft.species,
    size: draft.size || "",
    background: draft.background,
    classId: draft.classId,
    level: draft.level,
    subclassName: officialSubclasses.find(item => item.index === draft.subclass)?.name || "",
    subclass: { officialIndex: draft.subclass || "" },
    backgroundDetails: {
      armor: [armor, ...(grants.armor || []), ...(extras.armor || [])].join(", "),
      weapons: [weapons, ...(grants.weapons || []), ...(extras.weapons || [])].join(", ")
    },
    spells: [...(grants.cantrips || []), draft.speciesCantrip].filter(Boolean).map(index => ({ index, source: { kind: "species", name: draft.species, ability: "" } })),
    planner: { feats: (draft.improvements || []).filter(item => item.mode === "feat" && item.feat?.name).map(item => featEntry(item.feat.name, item.feat.variant)) },
    bonusFeats: [BACKGROUND_FEATS[draft.background]].filter(Boolean).map(name => ({ name }))
  };
}

// ---- Feat picker (Builder planner, level-up, creation): select, details, and the feat's own choices ----
function featOptionsHtml(selected, source, { blockDisabled = false } = {}) {
  return allFeatNames().filter(name => name !== "Ability Score Improvement").map(name => {
    const why = featBlocked(name, source);
    const custom = customFeatByName(name, source);
    const disabled = why === "already taken" || (blockDisabled && Boolean(why));
    return `<option value="${escapeHtml(name)}" ${name === selected ? "selected" : ""} ${disabled ? "disabled" : ""}>${escapeHtml(name)}${custom ? " (Custom)" : ""}${why ? ` (${escapeHtml(why)})` : ""}</option>`;
  }).join("");
}

function featDetailHtml(name, source, variant = "") {
  const rule = featRule(name, source);
  if (!rule) return "";
  const why = featBlocked(name, source, variant);
  return `
    <div class="feat-detail">
      <p><strong>${escapeHtml(name)}</strong> <span class="edition-badge">${escapeHtml(rule.source || "Custom")}</span>${rule.repeatable ? ` <span class="muted">Repeatable</span>` : ""}</p>
      ${rule.prereqText ? `<p class="muted">Prerequisite: ${escapeHtml(rule.prereqText)}${rule.custom ? " (not checked)" : ""}</p>` : ""}
      ${rule.summary ? `<p>${escapeHtml(rule.summary)}</p>` : ""}
      ${rule.note ? `<p class="muted">${escapeHtml(rule.note)}: check with your DM.</p>` : ""}
      ${why ? `<p class="level-warning">Can't take it yet: ${escapeHtml(why)}.</p>` : ""}
    </div>`;
}

// The selects a feat needs, as [{ key, label, options: [[value, label]], count }].
function featPickSpecs(name, state, source) {
  const rule = featRule(name, source);
  if (!rule) return [];
  const specs = [];
  const skillLabel = id => SKILLS.find(([skill]) => skill === id)?.[1] || id;
  const allTools = Object.values(TOOL_GROUPS).flat();
  const languages = [...STANDARD_LANGUAGES, ...EXOTIC_LANGUAGES].map(item => [item, item]);
  if (rule.variants && !state.fixedVariant) specs.push({ key: "variant", label: "Choice", count: 1, options: rule.variants.map(item => [item, item]) });
  if (rule.ability.length) specs.push({ key: "ability", label: "+1 to", count: 1, options: rule.ability.map(id => [id, `${id.toUpperCase()} (${source.abilities?.[id] ?? "-"})`]) });
  const grants = rule.custom ? customFeatGrantShape(rule.custom) : FEAT_GRANTS[name] || {};
  const picks = grants.picks || {};
  const owned = new Set(source.proficientSkills || []);
  if (picks.skills) specs.push({ key: "skills", label: "Skill", count: picks.skills, options: (grants.skillFrom || SKILLS.map(([id]) => id)).filter(id => !owned.has(id)).map(id => [id, skillLabel(id)]) });
  if (picks.skillOrTool) specs.push({ key: "skillOrTool", label: "Skill or tool", count: picks.skillOrTool, options: [...SKILLS.filter(([id]) => !owned.has(id)).map(([id, label]) => [id, label]), ...allTools.map(item => [`tool:${item}`, item])] });
  if (picks.expertise) {
    const expert = new Set(source.expertSkills || []);
    const pool = [...owned, ...(state.skills || [])].filter(id => SKILLS.some(([skill]) => skill === id) && !expert.has(id));
    specs.push({ key: "expertise", label: "Expertise", count: picks.expertise, options: [...new Set(pool)].map(id => [id, skillLabel(id)]) });
  }
  if (picks.tools) specs.push({ key: "tools", label: "Tool", count: picks.tools, options: (grants.toolFrom ? TOOL_GROUPS[grants.toolFrom] : allTools).map(item => [item, item]) });
  if (picks.languages) specs.push({ key: "languages", label: "Language", count: picks.languages, options: languages });
  if (picks.weapons) specs.push({ key: "weapons", label: "Weapon", count: picks.weapons, options: ITEM_CATALOG.filter(item => /^(simple|martial)/i.test(item.rarity || "") && item.type === "Weapon").map(item => [item.name, item.name]) });
  const spells = featSpellSpec(name, state.variant);
  if (spells?.ability === "pick") specs.push({ key: "castAbility", label: "Spellcasting ability", count: 1, options: ["int", "wis", "cha"].map(id => [id, id.toUpperCase()]) });
  (spells?.choose || []).forEach((choice, index) => {
    specs.push({ key: `spells${index}`, label: choice.level ? `${ordinal(choice.level)}-level spell` : "Cantrip", count: choice.count, options: featSpellOptions(choice).map(item => [item.index, item.name]) });
  });
  return specs;
}

function featSpellOptions(choice) {
  return allSpells.filter(item => {
    const detail = LOCAL_SPELLS.find(spell => spell.index === item.index) || {};
    if (item.level !== choice.level) return false;
    if (choice.list && !choice.list.includes(item.index)) return false;
    if (choice.classes && !choice.classes.some(id => spellOnClassList(item, id))) return false;
    if (choice.schools && !choice.schools.includes(String(detail.school?.index || detail.school || "").toLowerCase())) return false;
    if (choice.ritual && !detail.ritual) return false;
    if (choice.attack && !detail.attack_type && !/spell attack/i.test([detail.desc].flat().join(" "))) return false;
    return true;
  }).sort((a, b) => a.name.localeCompare(b.name));
}

// On a class's spell list (the Tasha's expanded lists count when that optional rule is on).
function spellOnClassList(item, classId) {
  if (classId === "artificer" && ARTIFICER_SPELLS.has(item.index)) return true;
  return (item.classes || []).some(entry => (entry.index || entry) === classId) || (optionalRule("tashas") && (item.optionalClasses || []).includes(classId));
}

function featPicksHtml(name, state, source, scope) {
  return featPickSpecs(name, state, source).map(spec => Array.from({ length: spec.count }, (_, index) => {
    const current = spec.count === 1 && !/^(skills|skillOrTool|expertise|tools|languages|weapons|spells\d)$/.test(spec.key) ? state[spec.key] : (state[spec.key] || [])[index];
    return `<label class="create-name">${escapeHtml(spec.label)}${spec.count > 1 ? ` ${index + 1}` : ""}
      <select data-feat-pick="${spec.key}" data-feat-index="${index}" data-feat-scope="${scope}">
        <option value="">Choose…</option>
        ${spec.options.map(([value, label]) => `<option value="${escapeHtml(value)}" ${value === current ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
      </select>
    </label>`;
  }).join("")).join("");
}

// The whole picker; state = { name, variant, ability, skills: [], ... } kept by the caller.
function featPickerHtml(state, source, scope, { label = "Feat", blockDisabled = false } = {}) {
  return `
    <label class="create-name">${escapeHtml(label)}
      <select data-feat-name data-feat-scope="${scope}"><option value="">Choose a feat…</option>${featOptionsHtml(state.name, source, { blockDisabled })}</select>
    </label>
    ${state.name ? `${featDetailHtml(state.name, source, state.variant)}<div class="feat-picks">${featPicksHtml(state.name, state, source, scope)}</div>` : ""}`;
}

// Applies a change event from a picker to its state; returns true when it handled the event.
function updateFeatPickState(state, target) {
  if (target.matches("[data-feat-name]")) {
    Object.keys(state).forEach(key => delete state[key]);
    state.name = target.value;
    const rule = featRule(state.name);
    if (rule?.ability.length === 1) state.ability = rule.ability[0];
    return true;
  }
  const key = target.dataset.featPick;
  if (!key) return false;
  const single = ["variant", "ability", "castAbility"].includes(key);
  if (single) state[key] = target.value;
  else {
    state[key] = [...(state[key] || [])];
    state[key][Number(target.dataset.featIndex)] = target.value;
  }
  if (key === "variant") Object.keys(state).filter(item => /^spells\d$/.test(item)).forEach(item => delete state[item]);
  return true;
}

// ---- Taking and removing a feat ----
// Applies everything a feat grants and records it in character.featGrants so removing it undoes it.
// options: { kind: "asi" | "planner" | "species" | "background", raiseAbility, hp, level }
function takeFeat(state, { kind = "asi", raiseAbility = true, hp = false, level = totalLevel() } = {}) {
  const name = state.name;
  const rule = featRule(name);
  if (!rule) return "";
  const entry = featEntry(name, state.variant);
  const record = { ability: "", save: "", hpFlat: 0, skills: [], expertise: [], armor: [], weapons: [], tools: [], languages: [] };
  const notes = [];
  const ability = rule.ability.includes(state.ability) ? state.ability : rule.ability.length === 1 ? rule.ability[0] : "";
  if (ability) {
    // At creation the +1 is already in the scores; it is still recorded so removing the feat undoes it.
    if (raiseAbility) character.abilities[ability] = clamp(Number(character.abilities[ability]) + 1, 1, isRuleBroken("ability-cap") ? 30 : 20);
    record.ability = ability;
    notes.push(`+1 ${ability.toUpperCase()}`);
  }
  if (rule.saveProficiency && ability && !character.saveProficiencies.includes(ability)) {
    character.saveProficiencies.push(ability);
    record.save = ability;
    notes.push(`${ability.toUpperCase()} save proficiency`);
  }
  const grants = rule.custom ? customFeatGrantShape(rule.custom) : FEAT_GRANTS[name] || {};
  const addTo = (field, items) => {
    const before = String(character.backgroundDetails[field] || "").toLowerCase();
    const fresh = items.filter(item => item && !before.split(",").map(part => part.trim()).includes(item.toLowerCase()));
    if (!fresh.length) return;
    character.backgroundDetails[field] = mergeList(character.backgroundDetails[field], fresh);
    record[field].push(...fresh);
  };
  addTo("armor", grants.armor || []);
  addTo("weapons", [...(grants.weapons || []), ...(state.weapons || [])]);
  const toolPicks = (state.skillOrTool || []).filter(item => item?.startsWith("tool:")).map(item => item.slice(5));
  addTo("tools", [...(grants.tools || []), ...(state.tools || []), ...toolPicks]);
  addTo("languages", [...(grants.languages || []), ...(state.languages || [])]);
  [...(state.skills || []), ...(state.skillOrTool || []).filter(item => item && !item.startsWith("tool:"))].filter(Boolean).forEach(skill => {
    if (character.proficientSkills.includes(skill)) return;
    character.proficientSkills.push(skill);
    record.skills.push(skill);
  });
  (grants.fixedSkills || []).forEach(skill => {
    if (character.proficientSkills.includes(skill)) return;
    character.proficientSkills.push(skill);
    record.skills.push(skill);
  });
  (state.expertise || []).filter(Boolean).forEach(skill => {
    if (!character.proficientSkills.includes(skill) || character.expertSkills.includes(skill)) return;
    character.expertSkills.push(skill);
    record.expertise.push(skill);
  });
  const resist = [...(grants.resist || []), ...(name === "Scion of the Outer Planes" && SCION_PLANES[state.variant] ? [SCION_PLANES[state.variant][0]] : [])];
  if (resist.length) notes.push(`resistance to ${resist.join(" and ")}`);
  if (grants.darkvision) notes.push(`darkvision +${grants.darkvision} ft`);
  // Tough and custom HP per level count every level already gained (PHB p.170) when hp is set; level-up and
  // creation add that themselves. A custom feat's one-time HP is always added here.
  record.hpFlat = Number(rule.custom?.hp?.flat || 0);
  const addedHp = (hp ? rule.hpPerLevel * level : 0) + record.hpFlat;
  if (addedHp) {
    character.maxHp = Number(character.maxHp || 0) + addedHp;
    character.hp = Number(character.hp || 0) + addedHp;
  }
  character.featGrants = { ...(character.featGrants || {}), [entry]: record };
  if (kind === "species" || kind === "background") character.bonusFeats = [...(character.bonusFeats || []), { name: entry, source: kind }];
  else character.planner.feats.push(entry);
  addFeatSpellRows(entry, state);
  const label = kind === "species" ? `Feat (${character.species})` : kind === "background" ? `Feat (${character.background})` : kind === "planner" ? "Feat" : `Feat (level ${level})`;
  character.features = mergeLines(character.features, [`${label}: ${entry}${notes.length ? ` (${notes.join(", ")})` : ""}`]);
  return notes.join(", ");
}

function addFeatSpellRows(entry, state) {
  const name = featBaseName(entry);
  const rule = featRule(name);
  // A custom feat lists fixed spells; "feat" ability means the ability the feat raised.
  const custom = rule?.custom;
  const spec = custom
    ? { ability: "feat", fixed: [], customRows: custom.spells.map(spell => [spell.index, spell.free, spell.ability === "feat" ? "" : spell.ability]) }
    : featSpellSpec(name, featVariant(entry) || state.variant);
  if (!spec) return;
  const ability = {
    feat: rule?.ability.includes(state.ability) ? state.ability : rule?.ability[0],
    pick: state.castAbility || "int",
    initiate: character.spells.find(row => row.source?.name?.startsWith("Initiate of High Sorcery"))?.source.ability || state.castAbility || "int",
    scion: character.spells.find(row => row.source?.name?.startsWith("Scion of the Outer Planes"))?.source.ability || state.castAbility || "int",
    class: ""
  }[spec.ability] ?? spec.ability;
  const rows = [...(spec.fixed || []), ...(spec.customRows || [])];
  (spec.choose || []).forEach((choice, index) => (state[`spells${index}`] || []).filter(Boolean).forEach(spell => rows.push([spell, choice.free || ""])));
  rows.forEach(([index, free, rowAbility]) => {
    if (character.spells.some(row => row.index === index && row.source?.name === entry)) return;
    const level = allSpells.find(item => item.index === index)?.level ?? 0;
    character.spells.push({ id: crypto.randomUUID(), index, level, prepared: false, source: { kind: "feat", name: entry, ability: rowAbility || ability || "int" }, free, ...(free === "ritual" ? { ritualBook: true } : {}) });
  });
}

// Undo a feat recorded by takeFeat (Builder planner "Remove").
function dropFeat(entry) {
  const record = character.featGrants?.[entry];
  const plannerIndex = character.planner.feats.lastIndexOf(entry);
  if (plannerIndex >= 0) character.planner.feats.splice(plannerIndex, 1);
  else character.bonusFeats = (character.bonusFeats || []).filter(feat => feat.name !== entry);
  if (record) {
    if (record.ability) character.abilities[record.ability] = Math.max(1, Number(character.abilities[record.ability]) - 1);
    if (record.save) character.saveProficiencies = character.saveProficiencies.filter(id => id !== record.save);
    const hpLoss = (featRule(featBaseName(entry))?.hpPerLevel || 0) * totalLevel() + Number(record.hpFlat || 0);
    if (hpLoss) {
      character.maxHp = Math.max(1, Number(character.maxHp || 0) - hpLoss);
      character.hp = clamp(Number(character.hp || 0) - hpLoss, 0, character.maxHp);
    }
    character.proficientSkills = character.proficientSkills.filter(id => !record.skills.includes(id));
    character.expertSkills = (character.expertSkills || []).filter(id => !record.expertise.includes(id));
    ["armor", "weapons", "tools", "languages"].forEach(field => {
      const drop = new Set((record[field] || []).map(item => item.toLowerCase()));
      if (drop.size) character.backgroundDetails[field] = String(character.backgroundDetails[field] || "").split(",").map(item => item.trim()).filter(item => item && !drop.has(item.toLowerCase())).join(", ");
    });
    delete character.featGrants[entry];
  }
  if (!takenFeatEntries().includes(entry)) {
    character.spells = character.spells.filter(row => row.source?.name !== entry);
    const pattern = new RegExp(`^Feat[^:]*: ${entry.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}( \\(|$)`);
    character.features = String(character.features || "").split("\n").filter(line => !pattern.test(line)).join("\n");
  }
}

// ---- Trackers, actions and modifiers granted by species and feats (play.js / character.js hooks) ----
function grantTrackers(prof = proficiencyBonus(), source = character) {
  const level = totalLevel(source);
  const list = [...(SPECIES_TRACKERS[source.species]?.(level, prof) || [])];
  takenFeatEntries(source).forEach(entry => {
    const name = featBaseName(entry);
    list.push(...(FEAT_TRACKERS[name]?.(level, prof) || []));
    const custom = customFeatByName(name, source);
    (custom?.resources || []).forEach(resource => list.push([resource.name, resolveFeatUses(resource.max, prof, source), resource.reset || "long", resource.die]));
  });
  // Martial Adept / Superior Technique dice: play.js allClassTrackers (superiorityDiceBonus).
  return list.filter(Boolean);
}

function resolveFeatUses(max, prof, source = character) {
  if (max === "prof") return prof;
  if (/^mod:(str|dex|con|int|wis|cha)$/.test(String(max))) return Math.max(1, Math.floor(((source.abilities?.[String(max).slice(4)] || 10) - 10) / 2));
  return clamp(Math.round(Number(max) || 1), 1, 20);
}

// Breath Weapon (PHB p.34; EGtW; FTD p.10-12) and custom feat notes, added to featureActions (play.js).
function grantActions(add, prof) {
  const breath = breathWeapon(prof);
  if (breath) add("breath-weapon", breath);
}

function breathWeapon(prof = proficiencyBonus()) {
  if (!/dragonborn/i.test(character.species || "") || !character.draconicAncestry) return null;
  const level = totalLevel();
  const dc = 8 + mod("con") + prof;
  const ftd = FTD_DRAGON_ANCESTRY[character.species]?.find(([dragon]) => dragon === character.draconicAncestry);
  if (ftd) {
    const dice = `${level >= 17 ? 4 : level >= 11 ? 3 : level >= 5 ? 2 : 1}d10`;
    return { name: "Breath Weapon", type: "Action", damage: `${dice} ${ftd[1]}`, notes: `Replaces one attack. 15 ft cone or 30 ft line, DEX save DC ${dc}, half on a success.`, use: { cost: ["Breath Weapon", 1], kind: "roll", roll: dice, text: `${ftd[1]} damage. Each creature in the area makes a DC ${dc} Dexterity save, taking half on a success.` } };
  }
  const row = CLASS_OPTIONS.draconicAncestry.find(item => item.dragon === character.draconicAncestry);
  if (!row) return null;
  const dice = `${level >= 16 ? 5 : level >= 11 ? 4 : level >= 6 ? 3 : 2}d6`;
  const save = row.save.toUpperCase();
  return { name: "Breath Weapon", type: "Action", damage: `${dice} ${row.damage}`, notes: `${row.breath}, ${save} save DC ${dc}, half on a success.`, use: { cost: ["Breath Weapon", 1], kind: "roll", roll: dice, text: `${row.damage} damage. Each creature in the ${row.breath} makes a DC ${dc} ${save === "DEX" ? "Dexterity" : "Constitution"} save, taking half on a success.` } };
}

// Damage resistances from species ancestry and feats as [source, type] pairs; resistanceSources applies them.
function resistanceGrants(source = character) {
  const list = [];
  const ancestry = CLASS_OPTIONS.draconicAncestry.find(item => item.dragon === source.draconicAncestry);
  const ftd = FTD_DRAGON_ANCESTRY[source.species]?.find(([dragon]) => dragon === source.draconicAncestry);
  if (/dragonborn/i.test(source.species || "") && (ftd || ancestry)) list.push(["Draconic Ancestry", ftd ? ftd[1] : ancestry.damage]);
  takenFeatEntries(source).forEach(entry => {
    const name = featBaseName(entry);
    (FEAT_GRANTS[name]?.resist || []).forEach(type => list.push([name, type]));
    if (name === "Scion of the Outer Planes" && SCION_PLANES[featVariant(entry)]) list.push([name, SCION_PLANES[featVariant(entry)][0]]);
    // Planar Wanderer: acid, cold or fire, picked after each long rest (combat choices).
    if (name === "Planar Wanderer" && source.combatChoices?.planarWanderer) list.push([name, source.combatChoices.planarWanderer]);
  });
  return list;
}

function grantResistances(source = character) {
  return [...new Set(resistanceGrants(source).map(([, type]) => type))];
}

// Extra darkvision from feats (Keenness of the Stone Giant: 60 ft, or +60 if you already have it).
function grantDarkvision(source = character) {
  return takenFeatEntries(source).reduce((sum, entry) => sum + (FEAT_GRANTS[featBaseName(entry)]?.darkvision || 0), 0);
}

// Sum of one numeric custom-feat modifier: ("initiative"), ("speed"), ("passive", "perception"), ("ac", armored).
function customFeatModifier(kind, detail = "", source = character) {
  return takenFeatEntries(source).reduce((sum, entry) => {
    const mods = customFeatByName(featBaseName(entry), source)?.modifiers || {};
    if (kind === "initiative") return sum + Number(mods.initiative || 0);
    if (kind === "speed") return sum + Number(mods.speed?.walk || 0);
    if (kind === "passive") return sum + Number(mods.passive?.[detail] || 0);
    if (kind === "ac") {
      const when = mods.ac?.when || "always";
      return sum + (when === "always" || (when === "armored") === Boolean(detail) ? Number(mods.ac?.bonus || 0) : 0);
    }
    return sum;
  }, 0);
}

// speedBreakdown (play.js) hook: custom feat walking-speed bonuses.
function grantSpeedBonus(notes) {
  let total = 0;
  takenFeatEntries().forEach(entry => {
    const bonus = Number(customFeatByName(featBaseName(entry))?.modifiers?.speed?.walk || 0);
    if (!bonus) return;
    total += bonus;
    notes.push(`${formatMod(bonus)} ft ${featBaseName(entry)}`);
  });
  return total;
}

// ---------------------------------------------------------------------------------------------
// Custom feats: a device library (localStorage, like custom classes) plus a copy embedded in each character
// that took one (character.customContent.feats), so synced and DM-opened sheets keep working.
// ---------------------------------------------------------------------------------------------
let customFeats = loadCustomFeats();
let customFeatDraft = null;

function loadCustomFeats() {
  try {
    const stored = JSON.parse(localStorage.getItem(CUSTOM_FEAT_KEY)) || {};
    return Object.fromEntries(Object.values(stored).map(sanitizeCustomFeat).filter(Boolean).map(feat => [feat.id, feat]));
  } catch {
    return {};
  }
}

// Merge with stored feats so a tab opened earlier can't erase feats other tabs saved.
function saveCustomFeats(removedId = "") {
  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem(CUSTOM_FEAT_KEY)) || {};
  } catch {
    stored = {};
  }
  if (removedId) delete stored[removedId];
  customFeats = { ...stored, ...customFeats };
  if (removedId) delete customFeats[removedId];
  localStorage.setItem(CUSTOM_FEAT_KEY, JSON.stringify(customFeats));
}

function customFeatByName(name, source = character) {
  if (!name) return null;
  const local = Object.values(customFeats).find(feat => feat.name === name);
  if (local) return local;
  const embedded = Object.values(source?.customContent?.feats || {}).find(feat => feat?.name === name);
  return embedded ? sanitizeCustomFeat(embedded) : null;
}

// Shared, synced and imported feats are untrusted: keep known fields, clamp numbers, cap text.
function sanitizeCustomFeat(raw) {
  if (!raw || typeof raw !== "object") return null;
  const text = (value, max = 200) => String(value ?? "").slice(0, max);
  const num = (value, min, max) => clamp(Math.round(Number(value) || 0), min, max);
  const list = (value, max = 12) => (Array.isArray(value) ? value : String(value || "").split(",")).map(item => text(item, 60).trim()).filter(Boolean).slice(0, max);
  const name = text(raw.name, 80).trim();
  const id = /^custom-[a-z0-9-]{1,60}$/.test(String(raw.id || "")) ? raw.id : name ? `custom-${slug(name).slice(0, 50)}` : "";
  if (!name || !id) return null;
  const abilityIds = ABILITIES.map(([ability]) => ability);
  const resets = ["short", "long", "manual"];
  return {
    id, name, version: 1, source: "Homebrew", author: text(raw.author, 80),
    repeatable: Boolean(raw.repeatable),
    prereq: { text: text(raw.prereq?.text, 160) },
    ability: { choose: (raw.ability?.choose || []).filter(item => abilityIds.includes(item)), amount: 1 },
    proficiencies: {
      armor: list(raw.proficiencies?.armor), weapons: list(raw.proficiencies?.weapons), tools: list(raw.proficiencies?.tools), languages: list(raw.proficiencies?.languages),
      skills: { choose: num(raw.proficiencies?.skills?.choose, 0, 6), from: "any" }
    },
    hp: { perLevel: num(raw.hp?.perLevel, 0, 5), flat: num(raw.hp?.flat, 0, 50) },
    modifiers: {
      initiative: num(raw.modifiers?.initiative, -5, 10),
      speed: { walk: num(raw.modifiers?.speed?.walk, -30, 60) },
      ac: { bonus: num(raw.modifiers?.ac?.bonus, -5, 10), when: ["always", "armored", "unarmored"].includes(raw.modifiers?.ac?.when) ? raw.modifiers.ac.when : "always" },
      passive: { perception: num(raw.modifiers?.passive?.perception, -5, 10), investigation: num(raw.modifiers?.passive?.investigation, -5, 10), insight: num(raw.modifiers?.passive?.insight, -5, 10) }
    },
    resources: (Array.isArray(raw.resources) ? raw.resources : []).slice(0, 4).map(resource => ({
      name: text(resource?.name, 60).trim(),
      max: resource?.max === "prof" || /^mod:(str|dex|con|int|wis|cha)$/.test(String(resource?.max)) ? resource.max : num(resource?.max, 1, 20),
      reset: resets.includes(resource?.reset) ? resource.reset : "long",
      die: [0, 4, 6, 8, 10, 12].includes(Number(resource?.die)) ? Number(resource.die) : 0
    })).filter(resource => resource.name),
    spells: (Array.isArray(raw.spells) ? raw.spells : []).slice(0, 6).map(spell => ({
      index: text(spell?.index, 60),
      free: ["", "will", "1/long", "1/short"].includes(spell?.free) ? spell.free : "",
      ability: [...abilityIds, "feat"].includes(spell?.ability) ? spell.ability : "feat"
    })).filter(spell => /^[a-z0-9-]+$/.test(spell.index)),
    description: text(raw.description, 2000)
  };
}

// A custom feat in the FEAT_GRANTS shape takeFeat uses.
function customFeatGrantShape(feat) {
  const p = feat.proficiencies || {};
  return { armor: p.armor, weapons: p.weapons, tools: p.tools, languages: p.languages, picks: { skills: p.skills?.choose || 0 } };
}

function blankCustomFeat() {
  return sanitizeCustomFeat({ id: "custom-new", name: "New feat" });
}

function renderCustomFeats() {
  const root = document.querySelector("#customFeats");
  // Never redraw the editor under someone who is typing in it.
  if (!root || (customFeatDraft && root.contains(document.activeElement))) return;
  const feats = Object.values(customFeats).sort((a, b) => a.name.localeCompare(b.name));
  const draft = customFeatDraft;
  root.innerHTML = `
    <div class="planner-summary">
      ${feats.map(feat => `
        <article class="planner-card">
          <strong>${escapeHtml(feat.name)} <span class="edition-badge">Custom</span></strong>
          <span>${escapeHtml(customFeatSummary(feat))}</span>
          <span class="button-row">
            <button class="ghost" type="button" data-custom-feat-edit="${escapeHtml(feat.id)}">Edit</button>
            <button class="ghost" type="button" data-custom-feat-share="${escapeHtml(feat.id)}">Share</button>
            <button class="ghost" type="button" data-custom-feat-delete="${escapeHtml(feat.id)}">Delete</button>
          </span>
        </article>`).join("") || `<p class="empty-state">No custom feats yet. Make one, or import a share code.</p>`}
    </div>
    <div class="class-share">
      <button class="secondary" type="button" data-custom-feat-new>${icon("plus")}New feat</button>
      <input id="importFeatCode" autocomplete="off" placeholder="Enter share code">
      <button class="secondary" type="button" data-custom-feat-import>Import</button>
    </div>
    <p id="featShareStatus" class="muted">${escapeHtml(customFeatStatus)}</p>
    ${draft ? customFeatEditorHtml(draft) : ""}`;
  root.onclick = handleCustomFeatClick;
}

let customFeatStatus = "Custom feats show up in every feat list, marked Custom. Their prerequisite is shown but not checked.";

function customFeatSummary(feat) {
  const parts = [
    feat.prereq.text ? `Prerequisite: ${feat.prereq.text}` : "",
    feat.ability.choose.length ? `+1 ${feat.ability.choose.map(id => id.toUpperCase()).join("/")}` : "",
    feat.hp.perLevel ? `+${feat.hp.perLevel} HP per level` : "",
    feat.modifiers.initiative ? `${formatMod(feat.modifiers.initiative)} initiative` : "",
    feat.modifiers.speed.walk ? `${formatMod(feat.modifiers.speed.walk)} ft speed` : "",
    feat.modifiers.ac.bonus ? `${formatMod(feat.modifiers.ac.bonus)} AC` : "",
    feat.resources.map(resource => `${resource.name} (${resource.max === "prof" ? "PB" : resource.max}/${resource.reset})`).join(", ")
  ].filter(Boolean);
  return parts.join(" · ") || feat.description.slice(0, 120) || "No effects yet";
}

function customFeatEditorHtml(feat) {
  const field = (label, key, value, attrs = "") => `<label>${label} <input data-custom-feat-field="${key}" value="${escapeHtml(value)}" ${attrs}></label>`;
  const number = (label, key, value, min, max) => field(label, key, value, `type="number" min="${min}" max="${max}" step="1" inputmode="numeric"`);
  const resource = feat.resources[0] || { name: "", max: 1, reset: "long", die: 0 };
  const spellText = feat.spells.map(spell => spell.index).join(", ");
  const spellFree = feat.spells[0]?.free || "";
  const spellAbility = feat.spells[0]?.ability || "feat";
  return `
    <section class="block custom-feat-editor">
      <div class="block-head">
        <h2>${feat.id === "custom-new" ? "New custom feat" : `Edit ${escapeHtml(feat.name)}`}</h2>
        <div class="button-row">
          <button class="ghost" type="button" data-custom-feat-cancel>Cancel</button>
          <button class="secondary" type="button" data-custom-feat-save>${icon("floppy-disk")}Save</button>
        </div>
      </div>
      <div class="field-grid">
        ${field("Name", "name", feat.name, 'maxlength="80"')}
        ${field("Prerequisite (shown, not checked)", "prereq", feat.prereq.text, 'maxlength="160" placeholder="INT 13, 4th level"')}
        <label class="inline-check"><input type="checkbox" data-custom-feat-field="repeatable" ${feat.repeatable ? "checked" : ""}> Can be taken more than once</label>
        <div class="field-label">+1 to one of
          <span class="create-skill-chips">${ABILITIES.map(([id, label]) => `<label class="inline-check"><input type="checkbox" data-custom-feat-ability="${id}" ${feat.ability.choose.includes(id) ? "checked" : ""}> ${label}</label>`).join("")}</span>
        </div>
        ${field("Armor proficiencies", "armor", feat.proficiencies.armor.join(", "), 'placeholder="Medium armor, Shields"')}
        ${field("Weapon proficiencies", "weapons", feat.proficiencies.weapons.join(", "))}
        ${field("Tool proficiencies", "tools", feat.proficiencies.tools.join(", "))}
        ${field("Languages", "languages", feat.proficiencies.languages.join(", "))}
        ${number("Skills to pick", "skills", feat.proficiencies.skills.choose, 0, 6)}
        ${number("HP per level", "hpPerLevel", feat.hp.perLevel, 0, 5)}
        ${number("HP once", "hpFlat", feat.hp.flat, 0, 50)}
        ${number("Initiative bonus", "initiative", feat.modifiers.initiative, -5, 10)}
        ${number("Walking speed bonus (ft)", "speed", feat.modifiers.speed.walk, -30, 60)}
        ${number("AC bonus", "acBonus", feat.modifiers.ac.bonus, -5, 10)}
        <label>AC bonus applies <select data-custom-feat-field="acWhen">${[["always", "Always"], ["armored", "Wearing armor"], ["unarmored", "Not wearing armor"]].map(([id, label]) => `<option value="${id}" ${feat.modifiers.ac.when === id ? "selected" : ""}>${label}</option>`).join("")}</select></label>
        ${number("Passive Perception", "passivePerception", feat.modifiers.passive.perception, -5, 10)}
        ${number("Passive Investigation", "passiveInvestigation", feat.modifiers.passive.investigation, -5, 10)}
        ${number("Passive Insight", "passiveInsight", feat.modifiers.passive.insight, -5, 10)}
        ${field("Limited use: name", "resourceName", resource.name, 'placeholder="Witchsight"')}
        <label>Uses <select data-custom-feat-field="resourceMax">${[...Array.from({ length: 10 }, (_, index) => [String(index + 1), String(index + 1)]), ["prof", "Proficiency bonus"], ...ABILITIES.map(([id, label]) => [`mod:${id}`, `${label} modifier`])].map(([value, label]) => `<option value="${value}" ${String(resource.max) === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
        <label>Recharge <select data-custom-feat-field="resourceReset">${[["short", "Short or long rest"], ["long", "Long rest"], ["manual", "Manual"]].map(([id, label]) => `<option value="${id}" ${resource.reset === id ? "selected" : ""}>${label}</option>`).join("")}</select></label>
        ${field("Granted spells (names or ids, comma separated)", "spells", spellText, 'placeholder="misty-step, shield"')}
        <label>Free casts <select data-custom-feat-field="spellFree">${[["", "None (uses your slots)"], ["will", "At will"], ["1/long", "Once per long rest"], ["1/short", "Once per short rest"]].map(([id, label]) => `<option value="${id}" ${spellFree === id ? "selected" : ""}>${label}</option>`).join("")}</select></label>
        <label>Spellcasting ability <select data-custom-feat-field="spellAbility">${[["feat", "The ability the feat raised"], ...ABILITIES].map(([id, label]) => `<option value="${id}" ${spellAbility === id ? "selected" : ""}>${label}</option>`).join("")}</select></label>
      </div>
      <label>Description (your own rules text)
        <textarea data-custom-feat-field="description" rows="4" maxlength="2000">${escapeHtml(feat.description)}</textarea>
      </label>
    </section>`;
}

// Reads the editor back into a feat record (unsanitized; saveCustomFeatDraft sanitizes).
function readCustomFeatEditor(root, base) {
  const value = key => root.querySelector(`[data-custom-feat-field="${key}"]`)?.value ?? "";
  const spellIndexes = value("spells").split(",").map(item => item.trim()).filter(Boolean).map(item => allSpells.find(spell => spell.index === slug(item) || spell.name.toLowerCase() === item.toLowerCase())?.index || slug(item));
  return {
    ...base,
    name: value("name"),
    repeatable: Boolean(root.querySelector('[data-custom-feat-field="repeatable"]')?.checked),
    prereq: { text: value("prereq") },
    ability: { choose: ABILITIES.map(([id]) => id).filter(id => root.querySelector(`[data-custom-feat-ability="${id}"]`)?.checked), amount: 1 },
    proficiencies: { armor: value("armor"), weapons: value("weapons"), tools: value("tools"), languages: value("languages"), skills: { choose: value("skills"), from: "any" } },
    hp: { perLevel: value("hpPerLevel"), flat: value("hpFlat") },
    modifiers: {
      initiative: value("initiative"), speed: { walk: value("speed") }, ac: { bonus: value("acBonus"), when: value("acWhen") },
      passive: { perception: value("passivePerception"), investigation: value("passiveInvestigation"), insight: value("passiveInsight") }
    },
    resources: value("resourceName").trim() ? [{ name: value("resourceName"), max: value("resourceMax"), reset: value("resourceReset") }] : [],
    spells: spellIndexes.map(index => ({ index, free: value("spellFree"), ability: value("spellAbility") })),
    description: value("description")
  };
}

function saveCustomFeatDraft(root) {
  const raw = readCustomFeatEditor(root, customFeatDraft);
  const name = String(raw.name || "").trim();
  if (!name) return setCustomFeatStatus("Give the feat a name first.");
  if (FEAT_PRESETS.includes(name) || Object.values(customFeats).some(feat => feat.name === name && feat.id !== customFeatDraft.id)) {
    return setCustomFeatStatus(`A feat named ${name} already exists. Pick another name.`);
  }
  const id = customFeatDraft.id !== "custom-new" && customFeats[customFeatDraft.id] ? customFeatDraft.id : uniqueCustomId(name, customFeats);
  const previousName = customFeats[id]?.name;
  const feat = sanitizeCustomFeat({ ...raw, id });
  customFeats[id] = feat;
  saveCustomFeats();
  if (typeof saveFeatToCloud === "function") saveFeatToCloud(feat);
  // A rename keeps characters that already took the feat pointing at it.
  if (previousName && previousName !== feat.name) {
    character.planner.feats = character.planner.feats.map(entry => entry === previousName ? feat.name : entry);
    character.bonusFeats = (character.bonusFeats || []).map(item => item.name === previousName ? { ...item, name: feat.name } : item);
  }
  customFeatDraft = null;
  customFeatStatus = `Saved ${feat.name}. Pick it in the planner, at level-up, or as a species feat.`;
  persistAndRender();
}

function setCustomFeatStatus(text) {
  customFeatStatus = text;
  const status = document.querySelector("#featShareStatus");
  if (status) status.textContent = text;
}

function handleCustomFeatClick(event) {
  const root = event.currentTarget;
  const button = event.target.closest("button");
  if (!button) return;
  if (button.matches("[data-custom-feat-new]")) customFeatDraft = blankCustomFeat();
  else if (button.dataset.customFeatEdit) customFeatDraft = structuredCloneSafe(customFeats[button.dataset.customFeatEdit]);
  else if (button.matches("[data-custom-feat-cancel]")) customFeatDraft = null;
  else if (button.matches("[data-custom-feat-save]")) return saveCustomFeatDraft(root);
  else if (button.dataset.customFeatShare) return typeof shareContent === "function" && shareContent("feat", customFeats[button.dataset.customFeatShare]);
  else if (button.matches("[data-custom-feat-import]")) return typeof importSharedContent === "function" && importSharedContent(document.querySelector("#importFeatCode").value, "feat");
  else if (button.dataset.customFeatDelete) {
    const feat = customFeats[button.dataset.customFeatDelete];
    showToast(`<span class="toast-label">Delete ${escapeHtml(feat.name)}?</span><span>Characters that took it keep their own copy.</span>`, {
      tone: "fumble",
      actions: [{ label: "Delete", run: () => { delete customFeats[feat.id]; saveCustomFeats(feat.id); renderCustomFeats(); } }],
      persist: true
    });
    return;
  }
  renderCustomFeats();
}

// What persist() embeds in the character: custom class, feat and spell definitions it uses (J27, J28).
function embeddedCustomContent(source = character) {
  const previous = source.customContent || {};
  const classes = { ...(previous.classes || {}) };
  classEntries(source).forEach(entry => {
    if (customClasses[entry.classId]) classes[entry.classId] = customClasses[entry.classId];
  });
  const feats = {};
  takenFeatEntries(source).forEach(entry => {
    const feat = customFeatByName(featBaseName(entry), source);
    if (feat) feats[feat.id] = feat;
  });
  Object.keys(classes).forEach(id => {
    if (!classEntries(source).some(entry => entry.classId === id)) delete classes[id];
  });
  const spells = {};
  (source.spells || []).forEach(row => {
    const spell = customSpells[row.index] || previous.spells?.[row.index];
    if (spell) spells[spell.id] = spell;
  });
  return { classes, feats, spells };
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
  const hp = draftHp(draft);
  const joined = (...parts) => parts.flat().filter(Boolean).join(", ");
  const slots = creationSlots(draft);
  const picked = kind => slots.filter(slot => slot.kind === kind && draft.picks[slot.id]).map(slot => draft.picks[slot.id]);
  // Species language and tool text: a made pick replaces its "one extra language" token.
  const speciesTokens = field => (grants[field] || []).flatMap((token, index) => {
    const grant = parseGrantToken(token);
    const chosen = Array.from({ length: grant.count || 0 }, (_, n) => draft.picks[`sp-${grant.kind}-${index + (field === "tools" ? (grants.languages || []).length : 0)}-${n}`]).filter(Boolean);
    return chosen.length ? chosen : [token];
  });
  // Class tool text: each pick replaces its "three musical instruments" / "one artisan's tools" token.
  const classTools = String(tools || "").split(",").flatMap((token, index) => {
    const grant = parseGrantToken(token);
    const chosen = Array.from({ length: grant.count || 0 }, (_, n) => draft.picks[`cls-${grant.kind}-${index}-${n}`]).filter(Boolean);
    return chosen.length ? chosen : [token.trim()];
  });
  const heritage = draft.heritage || "";
  const ancestry = CLASS_OPTIONS.draconicAncestry.find(row => row.dragon === draft.draconicAncestry);
  const ftdAncestry = FTD_DRAGON_ANCESTRY[draft.species]?.find(([dragon]) => dragon === draft.draconicAncestry);
  const movement = SPECIES_MOVEMENT[draft.species] || {};
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
    speed: /Fleet of Foot/.test(heritage) ? 35 : speciesRow ? speciesRow[1] : 30,
    size: draft.size || "",
    movement: { ...movement },
    draconicAncestry: draft.draconicAncestry || "",
    speciesSpellAbility: draft.speciesSpellAbility || "",
    hitDice: `${level}d${cls.hitDie}`,
    saveProficiencies: [...(CLASS_SAVES[cls.id] || cls.saves || [])],
    proficientSkills: [...new Set([...draft.skills, ...draft.speciesSkills, ...(grants.skills || [])])],
    spells: [
      ...[...(grants.cantrips || []), draft.speciesCantrip].filter(Boolean).map(index => ({ id: crypto.randomUUID(), index, level: 0, prepared: false, source: { kind: "species", name: draft.species, ability: "" } })),
      ...[...draft.spellPicks.cantrips, ...draft.spellPicks.spells].filter(index => index && index !== draft.speciesCantrip && !(grants.cantrips || []).includes(index)).map(index => ({ id: crypto.randomUUID(), index, level: allSpells.find(item => item.index === index)?.level ?? 0, prepared: false }))
    ],
    planner: { ...defaultCharacter().planner, feats: [] },
    acAuto: true,
    equipment: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: draftGold(draft), pp: 0 },
    resources: [],
    classOptions: [],
    actions: [],
    autoSpells: [],
    homebrewRules: draft.capOk ? { "ability-cap": { label: HOMEBREW_RULES["ability-cap"], at: Date.now() } } : {},
    features: [
      speciesRow ? `Species: ${draft.species}. ${speciesRow[2]}` : "",
      heritage ? "" : grants.feature || "",
      ancestry ? `Draconic Ancestry: ${ancestry.dragon} (${ancestry.damage} resistance; breath ${ancestry.breath}, ${ancestry.save.toUpperCase()} save)` : "",
      ftdAncestry ? `Draconic Ancestry: ${ftdAncestry[0]} (${ftdAncestry[1]} resistance and breath)` : "",
      heritage ? `Wood Elf Heritage: ${heritage}` : "",
      draft.lineageEither === "darkvision" ? "Darkvision 60 ft (Custom Lineage)" : "",
      draft.size ? `Size: ${draft.size}` : "",
      ...featureLines
    ].filter(Boolean).join("\n"),
    backgroundDetails: {
      ...defaultCharacter().backgroundDetails,
      armor: joined(armor, grants.armor || []),
      weapons: joined(weapons, grants.weapons || [], /weapon training/i.test(heritage) ? ["Longsword, shortsword, shortbow, longbow"] : []),
      tools: mergeList("", [...classTools, ...speciesTokens("tools"), draft.picks["sp-tool-choice"] || ""]),
      languages: joined(speciesTokens("languages"))
    },
    attacks: "",
    inventory: "",
    notes: ""
  };
  const bgPicks = Object.fromEntries(Object.entries(draft.picks).filter(([key]) => key.startsWith("bg-")));
  applyBackgroundPresetNamed(draft.background, bgPicks);
  // Replacement proficiencies for duplicates (PHB p.125).
  slots.filter(slot => slot.id.startsWith("rep-") && draft.picks[slot.id]).forEach(slot => {
    if (slot.kind === "skill" && !character.proficientSkills.includes(draft.picks[slot.id])) character.proficientSkills.push(draft.picks[slot.id]);
    if (slot.kind === "tool") character.backgroundDetails.tools = mergeList(character.backgroundDetails.tools, [draft.picks[slot.id]]);
  });
  applySubclassExtras();
  // Feats: the species feat and background feat don't use an ASI; abilities and HP already include them.
  if (draft.speciesFeat?.name) takeFeat(draft.speciesFeat, { kind: "species", raiseAbility: false, level });
  if (BACKGROUND_FEATS[draft.background] && draft.backgroundFeat?.name) takeFeat(draft.backgroundFeat, { kind: "background", raiseAbility: false, level });
  draft.improvements.forEach(item => {
    if (item.mode === "feat" && item.feat?.name) takeFeat(item.feat, { kind: "asi", raiseAbility: false, level: item.level });
    else if (item.mode === "asi" && (item.first || item.second)) character.planner.feats.push("Ability Score Improvement");
  });
  if (draft.gear.mode === "equipment") {
    const worn = { armor: false, shield: false };
    draftGear(draft).filter(item => item.name).forEach(item => {
      const focus = item.focus ? focusGearRow(item) : null;
      const card = focus ? focus.card : ITEM_CATALOG.find(entry => entry.name.toLowerCase() === item.name.toLowerCase());
      const row = focus ? focus.row : card ? equipmentFromItemCard({ ...card, quantity: item.quantity }) : { id: crypto.randomUUID(), name: item.name, quantity: item.quantity, weight: 0, container: "carried", equipped: false, attuned: false, notes: "" };
      // Starting gear is ready to use: one suit of armor and one shield worn (so AC is right), weapons in hand.
      const slot = card?.type === "Armor" ? (/shield/i.test(card.name) ? "shield" : "armor") : "";
      if (card?.type === "Weapon" || (slot && !worn[slot])) Object.assign(row, { equipped: true });
      if (slot) worn[slot] = true;
      // The same item from class and background gear stacks on one row.
      const same = character.equipment.find(entry => entry.name.toLowerCase() === row.name.toLowerCase());
      if (same) same.quantity = Number(same.quantity || 0) + Number(row.quantity || 1);
      else character.equipment.push(row);
    });
  }
  ensureGrantedSpells();
  character.ac = calculatedArmorClass();
  creationDraft = null;
  document.querySelector("#createDialog").close();
  persistAndRender();
  const bonusText = speciesBonusText(draft.species);
  if (bonusText) showToast(`<span class="toast-label">${escapeHtml(character.name)} is ready</span><span>Added ${escapeHtml(draft.species)} ${draft.customOrigin ? "increases where you placed them" : bonusText} (PHB).</span>`, { duration: 10000 });
  if (level > 1 && levelChecklist().some(item => !item.done)) document.querySelector("#checklistDialog").showModal();
}

function levelChecklist() {
  const cls = currentClass();
  const level = character.level;
  const conMod = mod("con");
  const classSkills = classSkillPicks(cls);
  const subclassUnlock = subclassUnlockLevel(cls.id);
  const speciesGrant = SPECIES_GRANTS[character.species] || {};
  const lineageSkill = speciesGrant.choose?.either && !/Darkvision 60 ft \(Custom Lineage\)/.test(character.features || "") ? 1 : 0;
  const speciesSkills = (speciesGrant.skills || []).length + (speciesGrant.choose?.skills || 0) + lineageSkill;
  // College of Lore: three more skills of your choice at 3rd level (PHB p.54).
  const loreSkills = subclassLevel("lore") >= 3 ? 3 : 0;
  const expectedSkills = classSkills + (character.background ? 2 : 0) + speciesSkills + loreSkills;
  // Every class entry counts at its own level (PHB p.163): Expertise (rogue 2 at 1st and 2 more at 6th; bard 2 at
  // 3rd and 2 more at 10th), ASIs from each class's table, and HP from each class's die.
  const entries = classEntries();
  const totalLevels = totalLevel();
  const expertiseDue = entries.reduce((sum, entry) => sum + classExpertise(entry.classId, entry.level), 0);
  const asiCount = entries.reduce((sum, entry) => sum + [...asiLevelsFor(getClasses()[entry.classId] || cls)].filter(asiLevel => asiLevel <= entry.level).length, 0);
  const featCount = (character.planner?.feats || []).length;
  // Lowest legal max HP: the first class's full die, then a roll of 1 + CON (min 1) every level after.
  const minHp = Math.max(1, cls.hitDie + conMod) + (totalLevels - 1) * Math.max(1, 1 + conMod)
    + entries.reduce((sum, entry) => sum + sheetExtraHp(entry.classId, subclassIndexFor(entry) || entry.subclassName) * entry.level, 0);
  const averageHp = averageHpFor(cls, level, conMod);
  const caster = cls.casterType !== "none";
  const expectedSlots = caster ? spellSlotsFor(cls, level).some(Boolean) : false;
  // Fighting styles, invocations, pact boon, favored enemy... (Features tab, Class choices).
  const choiceSlots = classChoiceSlots();
  const openChoices = choiceSlots.filter(slot => !slotValue(character.classChoices, slot)).length;
  // A feat whose prerequisite is lost stops working until it's met again (PHB p.165).
  const lapsed = takenFeatEntries().filter(entry => {
    const rule = featRule(featBaseName(entry));
    return rule?.ok && !rule.ok(character);
  });
  const items = [
    ["Identity", "Name, species, and background chosen.", Boolean(character.name && character.species && character.background), "rp"],
    // ponytail: subclass required at level 3 for everyone; some classes pick at 1-2, refine per-class if it matters
    ["Subclass", level >= subclassUnlock ? "Choose and record your subclass." : `Chosen at level ${subclassUnlock}.`, level < subclassUnlock || Boolean(character.subclassName), "#officialSubclassSelect"],
    ["Ability scores", "Set all six ability scores.", ABILITIES.every(([id]) => Number(character.abilities[id]) >= 1), "#abilities"],
    ["Skills", `Pick ${expectedSkills} skill proficiencies (${classSkills} from ${cls.name}${character.background ? ", 2 from your background" : ""}${speciesSkills ? `, ${speciesSkills} from your species` : ""}${loreSkills ? ", 3 from Bonus Proficiencies" : ""}).`, (character.proficientSkills || []).length >= expectedSkills, "#skills"],
    ...(expertiseDue ? [["Expertise", `Choose ${expertiseDue} skills to double your proficiency in (${(character.expertSkills || []).length} chosen).`, (character.expertSkills || []).length >= expertiseDue, "#skills"]] : []),
    ["Hit dice", `Should be ${hitDiceText()}.`, character.hitDice === hitDiceText(), "#hitDiceInput"],
    ["Saving throws", "Mark your class's two saving throw proficiencies.", (character.saveProficiencies || []).length >= 2, "#abilities"],
    ["Hit points", `Max HP ${character.maxHp} is below the level ${totalLevels} minimum of ${minHp}${entries.length === 1 ? ` (average is ${averageHp})` : ""}.`, Number(character.maxHp) >= minHp, null],
    ["ASIs and feats", `${asiCount} ability score improvement${asiCount === 1 ? "" : "s"} by level ${totalLevels}. Record each in the Builder planner.`, featCount >= asiCount, "#featPlanner"],
    ...(lapsed.length ? [["Feat prerequisites", `Not met any more, so these don't work until they are: ${lapsed.join(", ")}.`, false, "#featPlanner"]] : []),
    ...(choiceSlots.length ? [["Class choices", `${openChoices} class option${openChoices === 1 ? "" : "s"} still to choose (${[...new Set(choiceSlots.filter(slot => !slotValue(character.classChoices, slot)).map(slot => slot.label.replace(/ \d+$/, "")))].join(", ")}).`, !openChoices, "#classChoicesBlock"]] : []),
    ["Equipment", "Add starting gear or catalog items.", (character.equipment || []).length > 0 || Boolean(character.inventory), "inventory"]
  ];
  if (caster) {
    const cantrips = cantripCap(cls);
    const chosenCantrips = character.spells.filter(row => spellRowHasSpell(row) && spellLevelForRow(row) === 0 && !spellAlwaysPrepared(row) && spellRowKey(row) === "primary").length;
    if (cantrips) items.push(["Cantrips", `${chosenCantrips} of ${cantrips} cantrips chosen.`, chosenCantrips === cantrips, "spells"]);
    const ownSpells = character.spells.filter(row => spellRowHasSpell(row) && spellLevelForRow(row) > 0 && !spellAlwaysPrepared(row) && row.secret !== "lore" && spellRowKey(row) === "primary").length;
    const knownCap = cls.preparedFormula === "known" ? knownSpellCap(cls) : cls.id === "wizard" ? KNOWN_SPELLS.wizard[level - 1] : null;
    if (knownCap !== null && knownCap !== undefined) {
      items.push([cls.id === "wizard" ? "Spellbook" : "Spells known", `${ownSpells} of ${knownCap} ${cls.id === "wizard" ? "spellbook spells" : "spells known"}.`, cls.id === "wizard" ? ownSpells >= knownCap : ownSpells === knownCap, "spells"]);
    } else {
      items.push(["Spells", "Choose your class spells.", !expectedSlots || ownSpells > 0, "spells"]);
    }
    if (openLoreSecrets()) items.push(["Additional Magical Secrets", `${openLoreSecrets()} of 2 spells from any class's list still to choose (Spells tab: add a spell).`, false, "spells"]);
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

