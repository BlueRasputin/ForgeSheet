// RAW uses and recharge timing for each class's core limited features (2014 rules).
function classFeatureTrackers(cls = currentClass(), level = character.level) {
  const chaMod = Math.max(1, mod("cha"));
  const byClass = {
    fighter: [
      ["Second Wind", 1, "short"],
      level >= 2 ? ["Action Surge", level >= 17 ? 2 : 1, "short"] : null,
      level >= 9 ? ["Indomitable", level >= 17 ? 3 : level >= 13 ? 2 : 1, "long"] : null
    ],
    monk: [level >= 2 ? ["Ki Points", level, "short"] : null],
    druid: [level >= 2 ? ["Wild Shape", 2, "short"] : null],
    cleric: [level >= 2 ? ["Channel Divinity", level >= 18 ? 3 : level >= 6 ? 2 : 1, "short"] : null],
    paladin: [
      ["Divine Sense", chaMod + 1, "long"],
      ["Lay on Hands (HP pool)", level * 5, "long"],
      level >= 3 ? ["Channel Divinity", 1, "short"] : null
    ],
    bard: [["Bardic Inspiration", chaMod, level >= 5 ? "short" : "long"]],
    sorcerer: [level >= 2 ? ["Sorcery Points", level, "long"] : null],
    barbarian: [["Rage", level >= 17 ? 6 : level >= 12 ? 5 : level >= 6 ? 4 : level >= 3 ? 3 : 2, "long"]],
    wizard: [["Arcane Recovery", 1, "long"]],
    artificer: [level >= 7 ? ["Flash of Genius", Math.max(1, mod("int")), "long"] : null],
    bloodhunter: [["Blood Maledict", level >= 17 ? 4 : level >= 13 ? 3 : level >= 6 ? 2 : 1, "short"]]
  };
  return (byClass[cls.id] || []).filter(Boolean).map(([name, max, reset]) => ({ name, max, reset }));
}

function ensureClassResources() {
  const expected = classFeatureTrackers();
  const manualNames = new Set(character.resources.filter(item => !item.auto).map(item => item.name.toLowerCase()));
  let changed = false;
  character.resources = character.resources.filter(item => {
    if (!item.auto) return true;
    if (expected.some(feature => feature.name === item.name)) return true;
    changed = true;
    return false;
  });
  expected.forEach(feature => {
    if (manualNames.has(feature.name.toLowerCase())) return;
    const existing = character.resources.find(item => item.auto && item.name === feature.name);
    if (existing) {
      if (existing.max !== feature.max || existing.reset !== feature.reset) {
        existing.current = clamp(Number(existing.current || 0) + Math.max(0, feature.max - existing.max), 0, feature.max);
        existing.max = feature.max;
        existing.reset = feature.reset;
        changed = true;
      }
      return;
    }
    character.resources.push({ id: crypto.randomUUID(), name: feature.name, current: feature.max, max: feature.max, reset: feature.reset, auto: true });
    changed = true;
  });
  if (changed) persist();
}

function renderPlayTools() {
  ensureClassResources();
  renderCombatDashboard();
  renderDiceRoller();
  renderRestPreview();
  renderResources();
  renderEquipment();
  renderClassOptions();
  renderConditions();
  renderActions();
}

let pendingConcentrationDc = null;

function renderCombatDashboard() {
  const actions = ["Action", "Bonus Action", "Reaction", "Movement"];
  const temp = Number(character.tempHp || 0);
  document.querySelector("#combatSummary").textContent = `${character.hp}/${character.maxHp} HP${temp ? ` +${temp} temp` : ""} · AC ${character.ac} · ${character.conditions.length || 0} conditions`;
  document.querySelector("#conditionsMini").textContent = character.conditions.length
    ? character.conditions.join(", ")
    : "None";
  renderConcentrationPrompt();
  renderDyingPrompt();
  document.querySelector("#combatDashboard").innerHTML = `
    ${actions.map(action => `<article><strong>${action}</strong><span>${combatActionHint(action)}</span></article>`).join("")}
    <article><strong>Concentration</strong><span>${escapeHtml(character.concentration || "None")}</span></article>
    <article><strong>Death Saves</strong><span>${character.deathSaveSuccesses} successes / ${character.deathSaveFailures} failures</span></article>
    <article><strong>Conditions</strong><span>${escapeHtml(character.conditions.join(", ") || "None")}</span></article>
    <article><strong>Inspiration</strong><span>${character.inspiration ? `${character.inspiration} point${character.inspiration === 1 ? "" : "s"} — spend one for advantage on a roll.` : "None"}</span></article>
  `;
}

function renderDyingPrompt() {
  const root = document.querySelector("#dyingPrompt");
  if (Number(character.hp) > 0) {
    root.innerHTML = "";
    return;
  }
  const successes = character.deathSaveSuccesses;
  const failures = character.deathSaveFailures;
  const status = failures >= 3
    ? "Dead: three failed death saves."
    : successes >= 3
      ? "Stable at 0 HP. Healing brings you back."
      : `Dying at 0 HP: ${successes} success${successes === 1 ? "" : "es"}, ${failures} failure${failures === 1 ? "" : "s"}.`;
  root.innerHTML = `
    <span><strong>${status}</strong></span>
    ${successes < 3 && failures < 3 ? `<button type="button" class="secondary" data-dying-roll>Roll Death Save</button>` : ""}
  `;
}

function renderConcentrationPrompt() {
  const root = document.querySelector("#concentrationPrompt");
  if (!pendingConcentrationDc || !character.concentration) {
    root.innerHTML = "";
    return;
  }
  root.innerHTML = `
    <span><strong>Concentration check:</strong> ${escapeHtml(character.concentration)} — CON save DC ${pendingConcentrationDc}</span>
    <button type="button" class="secondary" data-roll-concentration>Roll Save</button>
    <button type="button" class="ghost" data-dismiss-concentration>Dismiss</button>
  `;
}

function handleConcentrationPromptClick(event) {
  if (event.target.closest("[data-roll-concentration]")) {
    const dc = pendingConcentrationDc;
    pendingConcentrationDc = null;
    rollFromInput(`Concentration save (DC ${dc})`, `1d20${formatMod(mod("con"))}`);
    return;
  }
  if (event.target.closest("[data-dismiss-concentration]")) {
    pendingConcentrationDc = null;
    renderConcentrationPrompt();
  }
}

function applyDamage() {
  const amount = clamp(Number(document.querySelector("#damageAmount").value), 0, 999);
  if (!amount) return;
  const absorbed = Math.min(Number(character.tempHp || 0), amount);
  character.tempHp = Number(character.tempHp || 0) - absorbed;
  character.hp = Math.max(0, Number(character.hp || 0) - (amount - absorbed));
  if (character.concentration) pendingConcentrationDc = Math.max(10, Math.floor(amount / 2));
  document.querySelector("#damageAmount").value = "";
  persistAndRender();
}

function applyHeal() {
  const amount = clamp(Number(document.querySelector("#damageAmount").value), 0, 999);
  if (!amount) return;
  const wasDown = Number(character.hp || 0) === 0;
  character.hp = Math.min(Number(character.maxHp || 0), Number(character.hp || 0) + amount);
  if (wasDown) {
    character.deathSaveSuccesses = 0;
    character.deathSaveFailures = 0;
  }
  document.querySelector("#damageAmount").value = "";
  persistAndRender();
}

function gainInspiration() {
  character.inspiration = clamp(character.inspiration + 1, 0, 99);
  persistAndRender();
}

function spendInspiration() {
  if (!character.inspiration) return;
  character.inspiration -= 1;
  character.rollHistory = [{ label: "Inspiration Spent", formula: "advantage on one roll", mode: "normal", total: character.inspiration, parts: [`${character.inspiration} left`] }, ...(character.rollHistory || [])].slice(0, 25);
  persistAndRender();
}

function handleDeathSaveClick(event) {
  const pip = event.target.closest("[data-death-kind]");
  if (pip) {
    const key = pip.dataset.deathKind === "success" ? "deathSaveSuccesses" : "deathSaveFailures";
    const value = Number(pip.dataset.deathIndex) + 1;
    character[key] = character[key] === value ? value - 1 : value;
    persistAndRender();
    return;
  }
  const action = event.target.closest("[data-death-action]");
  if (!action) return;
  if (action.dataset.deathAction === "reset") {
    character.deathSaveSuccesses = 0;
    character.deathSaveFailures = 0;
    persistAndRender();
    return;
  }
  rollDeathSave();
}

function rollDeathSave() {
  const roll = rollDie(20);
  let outcome;
  if (roll === 20) {
    character.deathSaveSuccesses = 0;
    character.deathSaveFailures = 0;
    character.hp = 1;
    outcome = "Natural 20 — back up with 1 HP";
  } else if (roll === 1) {
    character.deathSaveFailures = clamp(character.deathSaveFailures + 2, 0, 3);
    outcome = "Natural 1 — two failures";
  } else if (roll >= 10) {
    character.deathSaveSuccesses = clamp(character.deathSaveSuccesses + 1, 0, 3);
    outcome = "Success";
  } else {
    character.deathSaveFailures = clamp(character.deathSaveFailures + 1, 0, 3);
    outcome = "Failure";
  }
  character.rollHistory = [{ label: `Death Save — ${outcome}`, formula: "1d20", mode: "normal", total: roll, parts: [`d20[${roll}]`] }, ...(character.rollHistory || [])].slice(0, 25);
  persistAndRender();
  showToast(`<span class="toast-label">Death save · ${escapeHtml(outcome)}</span><span class="toast-roll"><b>${roll}</b><small>${character.deathSaveSuccesses} successes · ${character.deathSaveFailures} failures</small></span>`, { tone: roll >= 10 ? "crit" : "fumble" });
}

function rollAbilityCheck(ability) {
  const name = ABILITIES.find(([id]) => id === ability)?.[1] || ability;
  rollFromInput(`${name} check`, `1d20${formatMod(mod(ability))}`);
}

function rollSavingThrow(ability) {
  const name = ABILITIES.find(([id]) => id === ability)?.[1] || ability;
  rollFromInput(`${name} save`, `1d20${formatMod(saveBonus(ability))}`);
}

function rollSkillCheck(skill) {
  const [, name, ability] = SKILLS.find(([id]) => id === skill) || [];
  if (!name) return;
  rollFromInput(`${name} check`, `1d20${formatMod(skillBonus(skill, ability))}`);
}

function rollInitiativeCheck() {
  rollFromInput("Initiative", `1d20${formatMod(mod("dex"))}`);
}

function combatActionHint(action) {
  return {
    Action: "Attack, cast, dash, disengage, dodge, help, hide, ready, search, or use object.",
    "Bonus Action": "Available only when a feature, spell, or item grants one.",
    Reaction: "Usually spent off-turn by a trigger such as an opportunity attack.",
    Movement: `${character.speed || 30} ft speed before modifiers.`
  }[action];
}

function renderDiceRoller() {
  const latest = character.rollHistory?.[0];
  document.querySelector("#rollSummary").textContent = latest ? `${latest.label}: ${latest.total}` : "No rolls yet";
  document.querySelector("#rollHistory").innerHTML = (character.rollHistory || []).slice(0, 8).map((roll, index) => `
    <article class="roll-item">
      <strong>${escapeHtml(roll.label)}</strong>
      <span>${escapeHtml(roll.parts.join(" + "))}</span>
      <b>${roll.total}</b>
      <button type="button" class="ghost reroll" data-roll-index="${index}" aria-label="Reroll ${escapeHtml(roll.label)}" title="Reroll">↻</button>
    </article>
  `).join("") || `<p class="empty-state">No roll history yet.</p>`;
}

function rollFromInput(label = "Custom Roll", formula = document.querySelector("#rollFormula").value, mode = document.querySelector("#rollMode").value, actions = []) {
  const result = rollFormula(formula || "1d20", mode);
  character.rollHistory = [{ label, formula: result.formula, mode, total: result.total, parts: result.parts }, ...(character.rollHistory || [])].slice(0, 25);
  persistAndRender();
  const natural = naturalD20(result);
  const tone = natural === 20 ? "crit" : natural === 1 ? "fumble" : "";
  const toastActions = typeof actions === "function" ? actions(result) : actions;
  showToast(`
    <span class="toast-label">${escapeHtml(label)}${natural === 20 ? " · natural 20!" : natural === 1 ? " · natural 1" : ""}</span>
    <span class="toast-roll"><b>${result.total}</b><small>${escapeHtml(result.parts.join(" + "))}${mode !== "normal" ? ` · ${mode}` : ""}</small></span>
  `, { tone, actions: toastActions, duration: 7000 });
  return result;
}

function naturalD20(result) {
  return Number(String(result.parts[0] || "").match(/^1d20\[(\d+)\]$/)?.[1]) || null;
}

function handleRollHistoryClick(event) {
  const button = event.target.closest(".reroll");
  if (!button) return;
  const roll = character.rollHistory[Number(button.dataset.rollIndex)];
  if (roll) rollFromInput(roll.label, roll.formula, roll.mode);
}

function rollFormula(formula, mode = "normal") {
  const cleaned = String(formula).replace(/\s+/g, "").toLowerCase();
  const tokens = cleaned.match(/[+-]?[^+-]+/g) || ["1d20"];
  const parts = [];
  let total = 0;
  tokens.forEach(token => {
    const sign = token.startsWith("-") ? -1 : 1;
    const body = token.replace(/^[+-]/, "");
    const dice = body.match(/^(\d*)d(\d+)$/);
    if (dice) {
      const count = clamp(Number(dice[1] || 1), 1, 50);
      const sides = clamp(Number(dice[2]), 2, 1000);
      const rolls = Array.from({ length: count }, () => rollDie(sides));
      const used = mode === "advantage" && count === 1 && sides === 20
        ? [Math.max(rolls[0], rollDie(20))]
        : mode === "disadvantage" && count === 1 && sides === 20
          ? [Math.min(rolls[0], rollDie(20))]
          : rolls;
      const subtotal = used.reduce((sum, value) => sum + value, 0) * sign;
      total += subtotal;
      parts.push(`${sign < 0 ? "-" : ""}${body}[${used.join(",")}]`);
    } else {
      const value = Number(body || 0) * sign;
      total += value;
      parts.push(String(value));
    }
  });
  return { formula: cleaned || "1d20", parts, total };
}

function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function renderRestPreview() {
  const shortRefresh = [
    ...(isPactCaster() ? [{ name: "Pact magic slots" }] : []),
    ...character.resources.filter(item => item.reset === "short"),
    ...character.classOptions.filter(item => item.reset === "short")
  ].map(item => item.name).filter(Boolean);
  const longRefresh = [
    ...character.resources.filter(item => item.reset === "long" || item.reset === "short"),
    ...character.classOptions.filter(item => item.reset === "long" || item.reset === "short")
  ].map(item => item.name).filter(Boolean);
  document.querySelector("#restSummary").textContent = character.restLog || "No rest taken yet";
  document.querySelector("#hitDiceSummary").textContent = `${Math.max(0, character.level - character.hitDiceUsed)} / ${character.level} hit dice available`;
  document.querySelector("#restPreview").innerHTML = `
    <article><strong>Short rest</strong><span>${escapeHtml(shortRefresh.join(", ") || "No short-rest resources tracked.")}</span></article>
    <article><strong>Long rest</strong><span>HP, spell slots, 1 exhaustion, item spell uses${longRefresh.length ? `, ${escapeHtml(longRefresh.join(", "))}` : ""}</span></article>
  `;
}

function spendHitDie() {
  if (character.hitDiceUsed >= character.level) return;
  const cls = currentClass();
  const heal = Math.max(1, rollDie(cls.hitDie) + mod("con"));
  character.hitDiceUsed += 1;
  character.hp = Math.min(Number(character.maxHp || character.hp), Number(character.hp || 0) + heal);
  character.rollHistory = [{ label: "Hit Die Healing", formula: `1d${cls.hitDie}${formatMod(mod("con"))}`, mode: "normal", total: heal, parts: [`heal ${heal}`] }, ...(character.rollHistory || [])].slice(0, 25);
  persistAndRender();
  const left = character.level - character.hitDiceUsed;
  const more = left > 0 && character.hp < character.maxHp ? [{ label: `Spend another (${left} left)`, run: spendHitDie }] : [];
  showToast(`<span class="toast-label">Hit die · 1d${cls.hitDie}${formatMod(mod("con"))}</span><span class="toast-roll"><b>+${heal} HP</b><small>${character.hp}/${character.maxHp} HP · ${left} hit dice left</small></span>`, { actions: more, duration: 9000 });
}

function takeRest(type) {
  const before = structuredCloneSafe(character);
  if (type === "short" && isPactCaster()) {
    character.spellSlotUsage = {};
  }
  if (type === "long") {
    character.hp = character.maxHp || character.hp;
    character.spellSlotUsage = {};
    character.conditions = (character.conditions || []).filter(condition => condition === "Exhaustion");
    character.exhaustion = Math.max(0, Number(character.exhaustion || 0) - 1);
    character.hitDiceUsed = Math.max(0, Number(character.hitDiceUsed || 0) - Math.max(1, Math.floor(character.level / 2)));
    character.concentration = "";
    (character.equipment || []).forEach(item => {
      item.grantUsed = 0;
    });
  }
  character.resources.forEach(resource => {
    if (resource.reset === type || (type === "long" && resource.reset === "short")) resource.current = resource.max;
  });
  character.classOptions.forEach(option => {
    if (option.reset === type || (type === "long" && option.reset === "short")) option.current = option.max;
  });
  character.restLog = `${type === "long" ? "Long" : "Short"} rest taken ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  persistAndRender();
  const name = type === "long" ? "Long rest" : "Short rest";
  const actions = [{
    label: "Undo",
    run: () => {
      character = normalizeCharacter(before);
      persistAndRender();
      showToast(`<span class="toast-label">${name} undone</span>`);
    }
  }];
  const hitDiceLeft = character.level - character.hitDiceUsed;
  if (type === "short" && hitDiceLeft > 0 && character.hp < character.maxHp) actions.push({ label: `Spend Hit Die (${hitDiceLeft} left)`, run: spendHitDie });
  const changes = restChanges(before, character);
  showToast(`<span class="toast-label">${name}</span><span>${escapeHtml(changes.join(" · ") || "Nothing needed recovering.")}</span>`, { actions, duration: 12000 });
}

function restChanges(before, after) {
  const usedSlots = usage => Object.values(usage || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  const changes = [];
  const hp = Number(after.hp) - Number(before.hp);
  if (hp > 0) changes.push(`+${hp} HP`);
  const slots = usedSlots(before.spellSlotUsage) - usedSlots(after.spellSlotUsage);
  if (slots > 0) changes.push(`${slots} spell slot${slots === 1 ? "" : "s"} restored`);
  const hitDice = Number(before.hitDiceUsed || 0) - Number(after.hitDiceUsed || 0);
  if (hitDice > 0) changes.push(`${hitDice} hit ${hitDice === 1 ? "die" : "dice"} regained`);
  after.resources.forEach(resource => {
    const old = before.resources.find(item => item.id === resource.id);
    if (old && Number(old.current) < Number(resource.current)) changes.push(`${resource.name} ${resource.current}/${resource.max}`);
  });
  (after.equipment || []).forEach(item => {
    const old = (before.equipment || []).find(entry => entry.id === item.id);
    if (Number(old?.grantUsed || 0) > Number(item.grantUsed || 0)) changes.push(`${item.name} recharged`);
  });
  const cleared = (before.conditions || []).filter(condition => !(after.conditions || []).includes(condition));
  if (cleared.length) changes.push(`cleared ${cleared.join(", ")}`);
  if (Number(after.exhaustion) < Number(before.exhaustion)) changes.push(`exhaustion ${after.exhaustion}`);
  if (before.concentration && !after.concentration) changes.push(`ended ${before.concentration}`);
  return changes;
}

function renderResources() {
  const root = document.querySelector("#resourceRows");
  const template = document.querySelector("#resourceRowTemplate");
  root.innerHTML = "";
  if (!character.resources.length) {
    root.innerHTML = `<p class="empty-state">No tracked resources yet.</p>`;
    return;
  }
  character.resources.forEach(resource => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.dataset.resourceId = resource.id;
    node.querySelector(".resource-name").value = resource.name;
    node.querySelector(".resource-current").value = resource.current;
    node.querySelector(".resource-max").value = resource.max;
    node.querySelector(".resource-reset").value = resource.reset;
    root.appendChild(node);
  });
}

function addResource() {
  character.resources.push({ id: crypto.randomUUID(), name: "New Resource", current: 1, max: 1, reset: "long" });
  persistAndRender();
}

function handleResourceInput(event) {
  const row = event.target.closest(".tracker-row");
  if (!row) return;
  const resource = character.resources.find(item => item.id === row.dataset.resourceId);
  if (!resource) return;
  if (event.target.classList.contains("resource-name")) resource.name = event.target.value;
  if (event.target.classList.contains("resource-current")) resource.current = clamp(Number(event.target.value), 0, 999);
  if (event.target.classList.contains("resource-max")) resource.max = clamp(Number(event.target.value), 0, 999);
  if (event.target.classList.contains("resource-reset")) resource.reset = event.target.value;
  persist();
}

function handleResourceClick(event) {
  const step = event.target.closest(".resource-step");
  if (step) {
    const resource = character.resources.find(item => item.id === step.closest(".tracker-row").dataset.resourceId);
    if (!resource) return;
    resource.current = clamp(Number(resource.current || 0) + Number(step.dataset.step), 0, Number(resource.max || 0));
    persistAndRender();
    return;
  }
  const button = event.target.closest(".remove-resource");
  if (!button) return;
  const row = button.closest(".tracker-row");
  character.resources = character.resources.filter(item => item.id !== row.dataset.resourceId);
  persistAndRender();
}

function renderClassOptions() {
  const root = document.querySelector("#classOptionRows");
  const template = document.querySelector("#classOptionTemplate");
  root.innerHTML = "";
  setValue("classOptionPreset", "");
  const options = character.classOptions || [];
  if (!options.length) {
    root.innerHTML = `<p class="empty-state">No class option modules yet.</p>`;
    return;
  }
  options.forEach(option => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.dataset.classOptionId = option.id;
    node.querySelector(".class-option-name").value = option.name || "";
    node.querySelector(".class-option-kind").value = option.kind || "custom";
    node.querySelector(".class-option-current").value = option.current ?? 0;
    node.querySelector(".class-option-max").value = option.max ?? 0;
    node.querySelector(".class-option-reset").value = option.reset || "manual";
    node.querySelector(".class-option-notes").value = option.notes || "";
    root.appendChild(node);
  });
}

function handleClassOptionPreset(event) {
  if (!event.target.value) return;
  addClassOption(event.target.value);
  event.target.value = "";
}

function addClassOption(kind = "custom") {
  const presets = {
    infusion: ["Infused Item", 1, 1, "long", "Record infusion, item, bonus, and whether it is currently active."],
    invocation: ["Eldritch Invocation", 1, 1, "manual", "Record passive benefit, prerequisite, or limited-use rule."],
    metamagic: ["Metamagic Option", 0, 0, "long", "Record sorcery point cost and best spell pairings."],
    wildShape: ["Wild Shape Form", 2, 2, "short", "Record form, CR, HP, AC, speed, senses, and attacks."],
    maneuver: ["Battle Maneuver", 0, 0, "short", "Record superiority die, trigger, save, and rider."]
  };
  const [name, current, max, reset, notes] = presets[kind] || ["Custom Option", 1, 1, "manual", ""];
  character.classOptions.push({ id: crypto.randomUUID(), kind, name, current, max, reset, notes });
  persistAndRender();
}

function handleClassOptionInput(event) {
  const row = event.target.closest(".class-option-row");
  if (!row) return;
  const option = character.classOptions.find(item => item.id === row.dataset.classOptionId);
  if (!option) return;
  if (event.target.classList.contains("class-option-name")) option.name = event.target.value;
  if (event.target.classList.contains("class-option-kind")) option.kind = event.target.value;
  if (event.target.classList.contains("class-option-current")) option.current = clamp(Number(event.target.value), 0, 999);
  if (event.target.classList.contains("class-option-max")) option.max = clamp(Number(event.target.value), 0, 999);
  if (event.target.classList.contains("class-option-reset")) option.reset = event.target.value;
  if (event.target.classList.contains("class-option-notes")) option.notes = event.target.value;
  persist();
  renderRestPreview();
}

function handleClassOptionClick(event) {
  const button = event.target.closest(".remove-class-option");
  if (!button) return;
  const row = button.closest(".class-option-row");
  character.classOptions = character.classOptions.filter(item => item.id !== row.dataset.classOptionId);
  persistAndRender();
}

function renderConditions() {
  const root = document.querySelector("#conditionGrid");
  const active = new Set(character.conditions || []);
  root.innerHTML = `
    <div class="condition-chips">
      ${CONDITIONS.map(condition => `<button type="button" title="${escapeHtml(conditionRule(condition))}" class="condition-chip ${active.has(condition) ? "active" : ""}" aria-pressed="${active.has(condition)}" data-condition="${condition}">${condition}</button>`).join("")}
    </div>
    ${[...active].filter(condition => CONDITIONS.includes(condition)).map(condition => `
      <article class="condition-card active"><strong>${escapeHtml(condition)}</strong><span>${escapeHtml(conditionRule(condition))}</span></article>
    `).join("")}
  `;
}

function handleConditionClick(event) {
  const button = event.target.closest("[data-condition]");
  if (!button) return;
  const active = new Set(character.conditions || []);
  if (active.has(button.dataset.condition)) active.delete(button.dataset.condition);
  else active.add(button.dataset.condition);
  character.conditions = Array.from(active);
  persistAndRender();
}

let actionTypeFilter = "all";

function handleActionFilterClick(event) {
  const button = event.target.closest("[data-action-filter]");
  if (!button) return;
  actionTypeFilter = button.dataset.actionFilter;
  renderActions();
}

function renderActions() {
  const root = document.querySelector("#actionRows");
  const template = document.querySelector("#actionRowTemplate");
  document.querySelectorAll("[data-action-filter]").forEach(button => {
    button.classList.toggle("active", button.dataset.actionFilter === actionTypeFilter);
  });
  root.innerHTML = "";
  const visible = character.actions.filter(action => actionTypeFilter === "all" || action.type === actionTypeFilter);
  if (!visible.length) {
    root.innerHTML = `<p class="empty-state">${character.actions.length ? "No actions of this type." : "No custom actions yet."}</p>`;
    return;
  }
  visible.forEach(action => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.dataset.actionId = action.id;
    node.querySelector(".action-name").value = action.name;
    node.querySelector(".action-type").value = action.type;
    node.querySelector(".action-attack").value = action.attack;
    node.querySelector(".action-damage").value = action.damage;
    node.querySelector(".action-notes").value = action.notes;
    root.appendChild(node);
  });
}

function addAction() {
  character.actions.push({ id: crypto.randomUUID(), name: "New Action", type: "Action", attack: "", damage: "", notes: "" });
  persistAndRender();
}

function handleActionInput(event) {
  const row = event.target.closest(".action-row");
  if (!row) return;
  const action = character.actions.find(item => item.id === row.dataset.actionId);
  if (!action) return;
  if (event.target.classList.contains("action-name")) action.name = event.target.value;
  if (event.target.classList.contains("action-type")) action.type = event.target.value;
  if (event.target.classList.contains("action-attack")) action.attack = event.target.value;
  if (event.target.classList.contains("action-damage")) action.damage = event.target.value;
  if (event.target.classList.contains("action-notes")) action.notes = event.target.value;
  persist();
}

function actionDamageFormula(action) {
  return String(action.damage || "").replace(/\s+/g, "").match(/^\d*d\d+(?:[+-]\d*d?\d+)*/i)?.[0] || "";
}

function doubleDice(formula) {
  return formula.replace(/(\d*)d(\d+)/gi, (_, count, sides) => `${Number(count || 1) * 2}d${sides}`);
}

function handleActionClick(event) {
  const button = event.target.closest(".remove-action");
  const attackButton = event.target.closest(".roll-attack");
  const damageButton = event.target.closest(".roll-damage");
  if (attackButton || damageButton) {
    const action = character.actions.find(item => item.id === event.target.closest(".action-row").dataset.actionId);
    if (!action) return;
    const name = action.name || "Action";
    const damage = actionDamageFormula(action);
    if (damageButton) {
      if (damage) rollFromInput(`${name} damage`, damage, "normal");
      else showToast(`<span class="toast-label">${escapeHtml(name)}</span><span>No damage dice entered. Add something like 1d8+3.</span>`);
      return;
    }
    const bonus = String(action.attack || "").match(/^\s*([+-]?\d+)/)?.[1];
    if (bonus === undefined) {
      showToast(`<span class="toast-label">${escapeHtml(name)}</span><span>${escapeHtml(action.attack || "No attack bonus entered.")}${damage ? " Roll damage after the target saves." : ""}</span>`);
      return;
    }
    const label = action.type === "Free" ? name : `${name} to hit`;
    const followUp = result => {
      if (!damage) return [];
      return naturalD20(result) === 20
        ? [{ label: "Roll crit damage", run: () => rollFromInput(`${name} critical damage`, doubleDice(damage), "normal") }]
        : [{ label: "Roll damage", run: () => rollFromInput(`${name} damage`, damage, "normal") }];
    };
    rollFromInput(label, `1d20${formatMod(Number(bonus))}`, document.querySelector("#rollMode").value, followUp);
    return;
  }
  if (!button) return;
  const row = button.closest(".action-row");
  character.actions = character.actions.filter(item => item.id !== row.dataset.actionId);
  persistAndRender();
}

function weaponAction(item) {
  const notes = String(item.notes || "");
  const die = notes.match(/\b(\d+d\d+)\b/)?.[1];
  if (!die) return null;
  const text = `${item.name} ${notes}`.toLowerCase();
  const ranged = /ranged|ammunition|crossbow|\bbow\b|longbow|shortbow|sling|dart/.test(text);
  const finesse = /finesse/.test(text);
  const abilityMod = ranged ? mod("dex") : finesse ? Math.max(mod("str"), mod("dex")) : mod("str");
  const damageType = notes.match(/\d+d\d+\s+([a-z]+)/i)?.[1] || "";
  return {
    id: crypto.randomUUID(),
    name: item.name || "Weapon",
    type: "Action",
    attack: formatMod(proficiencyBonus() + abilityMod),
    damage: `${die}${formatMod(abilityMod)}${damageType ? ` ${damageType}` : ""}`,
    notes: `Assumes proficiency. ${notes}`.trim()
  };
}

function spellAction(row) {
  const detail = spellDetails[row.index] || {};
  const text = [detail.desc].flat().filter(Boolean).join(" ");
  const dice = text.match(/\b\d+d\d+\b/)?.[0];
  const save = text.match(/(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s+sav/i)?.[1];
  const attack = /spell attack/i.test(text);
  if (!dice && !save && !attack) return null;
  const level = spellLevelForRow(row);
  const castType = castingShorthand(detail.casting_time);
  return {
    id: crypto.randomUUID(),
    name: spellDisplayName(row),
    type: castType === "B" ? "Bonus Action" : castType === "R" ? "Reaction" : "Action",
    attack: save ? `DC ${document.querySelector("#spellDc")?.textContent || "-"} ${save.slice(0, 3).toUpperCase()}` : attack ? document.querySelector("#spellAttack")?.textContent || "" : "",
    damage: dice || "",
    notes: `${level === 0 ? "Cantrip" : `${ordinal(level)}-level spell`} from your spell list.`
  };
}

function generateActions() {
  const names = new Set(character.actions.map(action => action.name.toLowerCase()));
  const generated = [];
  const add = action => {
    if (!action || names.has(action.name.toLowerCase())) return;
    names.add(action.name.toLowerCase());
    generated.push(action);
  };
  (character.equipment || []).filter(item => item.equipped || item.container === "equipped").forEach(item => add(weaponAction(item)));
  character.spells.filter(spellRowHasSpell).forEach(row => add(spellAction(row)));
  character.actions.push(...generated);
  persistAndRender();
  showToast(`<span class="toast-label">Generate Actions</span><span>${generated.length ? `Added ${generated.map(action => escapeHtml(action.name)).join(", ")}.` : "Nothing new: equip weapons or add damaging spells first."}</span>`, { duration: 8000 });
}
