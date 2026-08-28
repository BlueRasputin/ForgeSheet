function renderPlayTools() {
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
  document.querySelector("#combatDashboard").innerHTML = `
    ${actions.map(action => `<article><strong>${action}</strong><span>${combatActionHint(action)}</span></article>`).join("")}
    <article><strong>Concentration</strong><span>${escapeHtml(character.concentration || "None")}</span></article>
    <article><strong>Death Saves</strong><span>${character.deathSaveSuccesses} successes / ${character.deathSaveFailures} failures</span></article>
    <article><strong>Conditions</strong><span>${escapeHtml(character.conditions.join(", ") || "None")}</span></article>
    <article><strong>Inspiration</strong><span>${character.inspiration ? `${character.inspiration} point${character.inspiration === 1 ? "" : "s"} — spend one for advantage on a roll.` : "None"}</span></article>
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
  const bonus = mod(ability) + (character.proficientSkills.includes(skill) ? proficiencyBonus() : 0);
  rollFromInput(`${name} check`, `1d20${formatMod(bonus)}`);
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
      <button type="button" class="ghost reroll" data-roll-index="${index}">Reroll</button>
      <strong>${escapeHtml(roll.label)}</strong>
      <span>${escapeHtml(roll.formula)} = ${escapeHtml(roll.parts.join(" + "))}</span>
      <b>${roll.total}</b>
    </article>
  `).join("") || `<p class="empty-state">No roll history yet.</p>`;
}

function rollFromInput(label = "Custom Roll", formula = document.querySelector("#rollFormula").value, mode = document.querySelector("#rollMode").value) {
  const result = rollFormula(formula || "1d20", mode);
  character.rollHistory = [{ label, formula: result.formula, mode, total: result.total, parts: result.parts }, ...(character.rollHistory || [])].slice(0, 25);
  persistAndRender();
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
    ...(currentClass().casterType === "warlock" ? [{ name: "Pact magic slots" }] : []),
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
    <article><strong>Long rest</strong><span>HP, spell slots, 1 exhaustion, ${escapeHtml(longRefresh.join(", ") || "no tracked resources")}</span></article>
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
}

function takeRest(type) {
  if (type === "short" && currentClass().casterType === "warlock") {
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
  root.innerHTML = CONDITIONS.map(condition => `
    <article class="condition-card ${active.has(condition) ? "active" : ""}">
      <button type="button" title="${escapeHtml(conditionRule(condition))}" class="condition-chip ${active.has(condition) ? "active" : ""}" data-condition="${condition}">${condition}</button>
      <span>${escapeHtml(conditionRule(condition))}</span>
    </article>
  `).join("");
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

function handleActionClick(event) {
  const button = event.target.closest(".remove-action");
  const rollButton = event.target.closest(".roll-action");
  if (rollButton) {
    const row = rollButton.closest(".action-row");
    const action = character.actions.find(item => item.id === row.dataset.actionId);
    if (action) rollFromInput(action.name || "Action", action.damage || action.attack || "1d20", "normal");
    return;
  }
  if (!button) return;
  const row = button.closest(".action-row");
  character.actions = character.actions.filter(item => item.id !== row.dataset.actionId);
  persistAndRender();
}

function generateActions() {
  const existing = new Set(character.actions.map(action => action.name.toLowerCase()));
  const generated = [];
  if (!existing.has("initiative")) generated.push({ id: crypto.randomUUID(), name: "Initiative", type: "Free", attack: formatMod(mod("dex")), damage: "1d20" + formatMod(mod("dex")), notes: "Roll at start of combat." });
  (character.equipment || []).filter(item => item.equipped).forEach(item => {
    const name = item.name || "Equipped Item";
    if (!existing.has(name.toLowerCase())) generated.push({ id: crypto.randomUUID(), name, type: "Action", attack: formatMod(proficiencyBonus() + Math.max(mod("str"), mod("dex"))), damage: "1d20" + formatMod(proficiencyBonus() + Math.max(mod("str"), mod("dex"))), notes: item.notes || "Generated from equipped item. Edit damage as needed." });
  });
  character.spells.filter(row => spellRowHasSpell(row)).slice(0, 5).forEach(row => {
    const name = spellDisplayName(row);
    if (!existing.has(name.toLowerCase())) generated.push({ id: crypto.randomUUID(), name, type: spellLevelForRow(row) === 0 ? "Action" : "Spell", attack: document.querySelector("#spellAttack")?.textContent || "", damage: "", notes: `Generated from spell list. Save DC ${document.querySelector("#spellDc")?.textContent || "-"}.` });
  });
  character.actions.push(...generated);
  persistAndRender();
}
