// RAW uses and recharge timing for each class's core limited features (2014 rules).
function classFeatureTrackers(cls = currentClass(), level = character.level, subclassName = character.subclassName, shared = true) {
  const chaMod = Math.max(1, mod("cha"));
  const prof = proficiencyBonus();
  const byClass = {
    fighter: [
      ["Second Wind", 1, "short"],
      level >= 2 ? ["Action Surge", level >= 17 ? 2 : 1, "short"] : null,
      level >= 9 ? ["Indomitable", level >= 17 ? 3 : level >= 13 ? 2 : 1, "long"] : null
    ],
    monk: [level >= 2 ? ["Ki Points", level, "short"] : null],
    // Archdruid (20): unlimited Wild Shape, so no tracker.
    druid: [level >= 2 && level < 20 ? ["Wild Shape", 2, "short"] : null],
    cleric: [
      level >= 2 ? ["Channel Divinity", level >= 18 ? 3 : level >= 6 ? 2 : 1, "short"] : null,
      // PHB p.59: after a success, not again for 7 days; after a failure, again after a long rest.
      level >= 10 ? ["Divine Intervention", 1, "long"] : null
    ],
    paladin: [
      ["Divine Sense", Math.max(1, 1 + mod("cha")), "long"],
      ["Lay on Hands (HP pool)", level * 5, "long"],
      level >= 3 ? ["Channel Divinity", 1, "short"] : null
    ],
    bard: [["Bardic Inspiration", chaMod, level >= 5 ? "short" : "long"]],
    sorcerer: [level >= 2 ? ["Sorcery Points", level, "long"] : null],
    // Primal Champion (20): unlimited rages, so no tracker.
    barbarian: [level < 20 ? ["Rage", level >= 17 ? 6 : level >= 12 ? 5 : level >= 6 ? 4 : level >= 3 ? 3 : 2, "long"] : null],
    rogue: [level >= 20 ? ["Stroke of Luck", 1, "short"] : null],
    // Mystic Arcanum: one 6th/7th/8th/9th-level spell each per long rest, at 11/13/15/17.
    warlock: [[11, 6], [13, 7], [15, 8], [17, 9]].filter(([gate]) => level >= gate).map(([, spellLevel]) => [`Mystic Arcanum (${ordinal(spellLevel)})`, 1, "long"]),
    wizard: [["Arcane Recovery", 1, "long"]],
    artificer: [level >= 7 ? ["Flash of Genius", Math.max(1, mod("int")), "long"] : null],
    bloodhunter: [["Blood Maledict", level >= 17 ? 4 : level >= 13 ? 3 : level >= 6 ? 2 : 1, "short"]]
  };
  const extra = lookupBySubclass(SUBCLASS_EXTRAS, subclassName);
  const extras = (!extra?.classId || extra.classId === cls.id) ? extra?.trackers?.(level, prof) || [] : [];
  const feats = shared && hasFeat("Lucky") ? [["Luck Points", 3, "long"]] : [];
  if (cls.id === "druid" && level >= 2 && lookupBySubclass({ land: true }, subclassName)) extras.push(["Natural Recovery", 1, "long"]);
  return [...(byClass[cls.id] || []), ...extras, ...feats].filter(Boolean).map(([name, max, reset]) => ({ name, max, reset }));
}

// Every class's trackers, multiclass levels included. A feature two classes share keeps the larger pool.
function allClassTrackers() {
  const byName = new Map();
  const secondary = (character.multiclasses || []).flatMap(entry => classFeatureTrackers(entryClass({ ...entry, key: entry.id }), entry.level, entry.subclassName, false));
  const pact = multiclassPactTracker();
  [...classFeatureTrackers(), ...secondary, ...(pact ? [{ name: pact[0], max: pact[1], reset: pact[2] }] : [])].forEach(tracker => {
    if (!byName.has(tracker.name) || byName.get(tracker.name).max < tracker.max) byName.set(tracker.name, tracker);
  });
  return [...byName.values()];
}

function ensureClassResources() {
  const expected = allClassTrackers();
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

// The die a resource spends, when it has one (Bardic Inspiration, Superiority and Psionic Energy dice).
function resourceDie(name) {
  const level = character.level;
  const bard = classEntries().find(entry => entry.classId === "bard")?.level || 0;
  const fighter = classEntries().find(entry => entry.classId === "fighter")?.level || 0;
  if (name === "Bardic Inspiration" && bard) return bard >= 15 ? 12 : bard >= 10 ? 10 : bard >= 5 ? 8 : 6;
  if (name === "Superiority Dice") return fighter >= 18 ? 12 : fighter >= 10 ? 10 : 8;
  if (name === "Psionic Energy Dice") return level >= 17 ? 12 : level >= 11 ? 10 : level >= 5 ? 8 : 6;
  return 0;
}

function renderSideResources() {
  const root = document.querySelector("#sideResources");
  const resources = (character.resources || []).filter(item => item.name && Number(item.max) > 0);
  document.querySelector("#sideResourcesSection").hidden = !resources.length;
  document.querySelector("#sideResourcesSummary").textContent = resources.length ? `${resources.length}` : "";
  root.innerHTML = resources.map(item => {
    const current = Number(item.current || 0);
    const max = Number(item.max || 0);
    const die = resourceDie(item.name);
    const recharge = { short: "SR", long: "LR" }[item.reset] || "";
    // Up to 10 uses read best as pips; bigger pools (Ki, Lay on Hands) get a stepper.
    const counter = max <= 10
      ? `<span class="res-pips" role="group" aria-label="${escapeHtml(item.name)}: ${current} of ${max}">${Array.from({ length: max }, (_, index) => `<button type="button" class="res-pip ${index < current ? "filled" : ""}" data-res-pip="${index}" aria-pressed="${index < current}" aria-label="${escapeHtml(item.name)} use ${index + 1}"></button>`).join("")}</span>`
      : `<span class="res-stepper"><button type="button" class="ghost" data-res-step="-1" aria-label="Spend one ${escapeHtml(item.name)}">${icon("minus")}</button><b>${current}/${max}</b><button type="button" class="ghost" data-res-step="1" aria-label="Regain one ${escapeHtml(item.name)}">${icon("plus")}</button></span>`;
    return `
      <div class="side-resource ${current ? "" : "is-spent"}" data-res-id="${escapeHtml(item.id)}">
        <span class="res-name">${escapeHtml(item.name)}${die ? ` <em>d${die}</em>` : ""}</span>
        ${recharge ? `<span class="res-recharge" title="${recharge === "SR" ? "Refills on a short or long rest" : "Refills on a long rest"}">${recharge}</span>` : ""}
        ${counter}
        ${die ? `<button type="button" class="ghost res-roll" data-res-roll ${current ? "" : "disabled"} title="Spend one and roll a d${die}">${icon("dice-five")}<span class="visually-hidden">Roll</span></button>` : ""}
      </div>`;
  }).join("");
}

function handleSideResourceClick(event) {
  const row = event.target.closest("[data-res-id]");
  const resource = row && character.resources.find(item => item.id === row.dataset.resId);
  if (!resource) return;
  const max = Number(resource.max || 0);
  const pip = event.target.closest("[data-res-pip]");
  if (pip) {
    const value = Number(pip.dataset.resPip) + 1;
    // Clicking the last filled pip spends it; any other pip sets the count there.
    resource.current = Number(resource.current) === value ? value - 1 : value;
    persistAndRender();
    return;
  }
  const step = event.target.closest("[data-res-step]");
  if (step) {
    resource.current = clamp(Number(resource.current || 0) + Number(step.dataset.resStep), 0, max);
    persistAndRender();
    return;
  }
  if (event.target.closest("[data-res-roll]") && Number(resource.current) > 0) {
    resource.current = Number(resource.current) - 1;
    persistAndRender();
    const die = resourceDie(resource.name);
    rollFromInput(`${resource.name} (${resource.current}/${max} left)`, `1d${die}`, "normal", [{ label: "Undo spend", run: () => { resource.current = Math.min(max, Number(resource.current) + 1); persistAndRender(); } }]);
  }
}

// Easy mode: what this character can do on a turn, grouped like the action bar in Baldur's Gate 3.
function renderTurnGuide() {
  const root = document.querySelector("#turnGuide");
  if (!prefs.easyMode) {
    root.innerHTML = "";
    return;
  }
  const names = type => character.actions.filter(action => action.type === type).map(action => action.name);
  const spells = character.spells.filter(row => spellRowHasSpell(row) && (spellLevelForRow(row) === 0 || row.prepared || spellAlwaysPrepared(row))).length;
  const groups = [
    ["Move", "cost-free", [`Up to ${effectiveSpeed()} ft. You can split it before and after your action.`]],
    ["Action (one)", "cost-action", [...names("Action"), spells ? "Cast a spell" : "", "Dash, Disengage, Dodge, Help, Hide, Search"].filter(Boolean)],
    ["Bonus action (one, if something gives you one)", "cost-bonus", names("Bonus Action").length ? names("Bonus Action") : ["Nothing yet. Some spells, class features and two-weapon fighting use it."]],
    ["Reaction (one per round, even on others' turns)", "cost-reaction", ["Opportunity attack when an enemy leaves your reach", ...names("Reaction")]],
    ["Free", "cost-free", ["Talk, draw or sheathe a weapon, open a door"]]
  ];
  root.innerHTML = `
    <div class="block-head"><h2>On your turn</h2><button type="button" class="ghost" data-kind-jump="common">See all common actions</button></div>
    <div class="turn-guide-grid">
      ${groups.map(([title, cost, items]) => `
        <article><strong><span class="cost-dot ${cost}" aria-hidden="true"></span>${escapeHtml(title)}</strong><span>${items.map(escapeHtml).join(" · ")}</span></article>`).join("")}
    </div>`;
}

function renderPlayTools() {
  renderTurnGuide();
  ensureClassResources();
  ensureFeatureActions();
  renderCombatDashboard();
  renderDiceRoller();
  renderRestPreview();
  renderResources();
  renderSideResources();
  renderEquipment();
  renderClassOptions();
  renderConditions();
  renderActions();
}

let pendingConcentrationDc = null;

function renderCombatDashboard() {
  const actions = ["Action", "Bonus Action", "Reaction", "Movement"];
  const temp = Number(character.tempHp || 0);
  document.querySelector("#combatSummary").textContent = `${character.hp}/${effectiveMaxHp()} HP${temp ? ` +${temp} temp` : ""} · AC ${character.ac} · ${character.conditions.length || 0} condition${character.conditions.length === 1 ? "" : "s"}`;
  const exhaustion = Number(character.exhaustion || 0);
  const conditionList = [...character.conditions, ...(exhaustion ? [`Exhaustion ${exhaustion}`] : [])];
  document.querySelector("#conditionsMini").textContent = conditionList.length ? conditionList.join(", ") : "None";
  renderConcentrationPrompt();
  renderDyingPrompt();
  document.querySelector("#combatDashboard").innerHTML = `
    ${actions.map(action => `<article><strong>${action}</strong><span>${combatActionHint(action)}</span></article>`).join("")}
    <article><strong>Concentration</strong><span>${escapeHtml(character.concentration || "None")}</span></article>
    <article><strong>Death saves</strong><span>${character.deathSaveSuccesses} successes / ${character.deathSaveFailures} failures</span></article>
    <article><strong>Conditions</strong><span>${escapeHtml(character.conditions.join(", ") || "None")}</span></article>
    <article><strong>Inspiration</strong><span>${character.inspiration ? `${character.inspiration} point${character.inspiration === 1 ? "" : "s"}. Spend one for advantage on a roll.` : "None"}</span></article>
  `;
}

// Death saves render inside the HP box at 0 HP (renderDeathSaves), so this prompt stays empty.
function renderDyingPrompt() {
  document.querySelector("#dyingPrompt").innerHTML = "";
}

function renderConcentrationPrompt() {
  const root = document.querySelector("#concentrationPrompt");
  if (!pendingConcentrationDc || !character.concentration) {
    root.innerHTML = "";
    return;
  }
  root.innerHTML = `
    <span><strong>Concentration check:</strong> ${escapeHtml(character.concentration)}, CON save DC ${pendingConcentrationDc}</span>
    <button type="button" class="secondary" data-roll-concentration>Roll Save</button>
    <button type="button" class="ghost" data-dismiss-concentration>Dismiss</button>
  `;
}

function handleConcentrationPromptClick(event) {
  if (event.target.closest("[data-roll-concentration]")) {
    const dc = pendingConcentrationDc;
    pendingConcentrationDc = null;
    rollWithConditions(`Concentration save (DC ${dc})`, `1d20${formatMod(saveBonus("con"))}`, "save", "con", [], "concentration", result => {
      if (result.total >= dc) return `Held: still concentrating on ${character.concentration}.`;
      const lost = character.concentration;
      character.concentration = "";
      persistAndRender();
      return `Lost: ${lost} ends.`;
    });
    return;
  }
  if (event.target.closest("[data-dismiss-concentration]")) {
    pendingConcentrationDc = null;
    renderConcentrationPrompt();
  }
}

// The last damage taken on this sheet, so its toast (and Uncanny Dodge) can take it back.
let lastDamage = null;

function vitalsSnapshot() {
  return structuredCloneSafe({
    hp: character.hp,
    tempHp: character.tempHp,
    deathSaveFailures: character.deathSaveFailures,
    deathSaveSuccesses: character.deathSaveSuccesses,
    concentration: character.concentration,
    wildShape: character.wildShape || null,
    agathys: character.agathys || 0,
    maxHpReduction: character.maxHpReduction || 0,
    conditions: [...(character.conditions || [])],
    autoUnconscious: Boolean(character.autoUnconscious)
  });
}

function restoreVitals(snapshot) {
  Object.assign(character, structuredCloneSafe(snapshot));
  pendingConcentrationDc = null;
}

// Read the shared amount box; returns null (and explains) when it isn't a positive whole number.
function amountFromInput(input) {
  if (input.value === "") return null;
  const amount = Math.round(Number(input.value));
  if (!Number.isFinite(amount) || amount <= 0) {
    showToast(`<span class="toast-label">Enter a positive number</span><span>Type the amount, then press Damage or Heal.</span>`);
    return null;
  }
  input.value = "";
  return amount;
}

function applyDamage(input = document.querySelector("#damageAmount")) {
  const amount = amountFromInput(input);
  if (amount) dealDamage(Math.min(amount, 999), { clamped: amount > 999 });
}

function dealDamage(amount, { label = `Took ${amount} damage`, clamped = false, halved = false } = {}) {
  const before = vitalsSnapshot();
  const notes = clamped ? ["Capped at 999."] : [];
  let remaining = amount;
  // Temporary HP soak damage first, then a Wild Shape form's HP, then your own.
  const hadTemp = Number(character.tempHp || 0) > 0;
  const absorbed = Math.min(Number(character.tempHp || 0), remaining);
  character.tempHp = Number(character.tempHp || 0) - absorbed;
  remaining -= absorbed;
  if (hadTemp && character.agathys) {
    notes.push(`Armor of Agathys: if a melee attack caused this, the attacker takes ${character.agathys} cold damage.`);
    if (!character.tempHp) character.agathys = 0;
  }
  const shape = character.wildShape;
  if (shape && Number(shape.hp) > 0 && remaining > 0) {
    const taken = Math.min(Number(shape.hp), remaining);
    shape.hp = Number(shape.hp) - taken;
    remaining -= taken;
    if (shape.hp <= 0) {
      character.wildShape = null;
      notes.push(`${shape.name || "Beast form"} drops to 0 HP and you revert${remaining ? `, taking ${remaining} more` : ""}.`);
    }
  }
  const toHp = remaining;
  const hpBefore = Number(character.hp || 0);
  character.hp = Math.max(0, hpBefore - toHp);
  if (hpBefore <= 0 && toHp > 0) {
    // At 0 HP: massive damage kills outright; otherwise each hit is a failed death save (a stable creature starts over).
    if (toHp >= effectiveMaxHp()) {
      character.deathSaveFailures = 3;
      notes.push("Massive damage at 0 HP: the damage equals your HP maximum, which is instant death.");
    } else {
      // Successes only start over if you were stable (PHB p.197).
      if (character.deathSaveSuccesses >= 3) character.deathSaveSuccesses = 0;
      character.deathSaveFailures = clamp(character.deathSaveFailures + 1, 0, 3);
      notes.push(character.deathSaveFailures >= 3 ? "Damage at 0 HP: third death save failure." : "Damage at 0 HP counts as a death save failure (two if it was a critical hit).");
    }
  } else if (character.hp === 0 && toHp - hpBefore >= effectiveMaxHp()) {
    character.deathSaveFailures = 3;
    notes.push("Massive damage: the overflow equals your HP maximum, which is instant death.");
  } else if (character.hp === 0 && hpBefore > 0) {
    notes.push("You drop to 0 HP: unconscious and prone. Roll death saves on your turn.");
  }
  if (character.hp === 0 && character.concentration) {
    notes.push(`Concentration on ${character.concentration} ends.`);
    character.concentration = "";
  }
  if (character.hp === 0 && character.raging) {
    character.raging = false;
    notes.push("Your rage ends.");
  }
  pendingConcentrationDc = character.concentration ? Math.max(10, Math.floor(amount / 2)) : null;
  persistAndRender();
  lastDamage = { before, amount, sheetId: character.sheetId, halved };
  const actions = [{ label: "Undo", run: () => undoDamage(before) }];
  if (hpBefore <= 0 && toHp > 0 && toHp < effectiveMaxHp() && character.deathSaveFailures < 3) {
    actions.push({ label: "It was a crit (+1 failure)", run: () => { character.deathSaveFailures = clamp(character.deathSaveFailures + 1, 0, 3); persistAndRender(); } });
  }
  if (!halved && character.raging) actions.push({ label: "Rage: halve (B/P/S)", run: () => halveLastDamage("Rage resistance") });
  if (!halved && currentClass().id === "rogue" && character.level >= 5) actions.push({ label: "Uncanny Dodge (halve)", run: () => halveLastDamage("Uncanny Dodge") });
  actions.push({ label: "Lower max HP too", run: () => reduceMaxHp(amount) });
  const temp = Number(character.tempHp || 0);
  const shapeLine = character.wildShape ? ` · ${character.wildShape.name || "Beast form"} ${character.wildShape.hp}/${character.wildShape.max}` : "";
  showToast(`<span class="toast-label">${escapeHtml(label)}</span><span>${character.hp}/${effectiveMaxHp()} HP${temp ? ` +${temp} temp` : ""}${escapeHtml(shapeLine)}${notes.length ? `. ${escapeHtml(notes.join(" "))}` : ""}</span>`, {
    tone: character.hp === 0 ? "fumble" : "",
    actions,
    duration: notes.length ? 11000 : 7000
  });
}

function undoDamage(before) {
  restoreVitals(before);
  lastDamage = null;
  persistAndRender();
  showToast(`<span class="toast-label">Damage undone</span><span>${character.hp}/${effectiveMaxHp()} HP</span>`);
}

function halveLastDamage(reason = "Uncanny Dodge") {
  if (!lastDamage || lastDamage.sheetId !== character.sheetId) {
    showToast(`<span class="toast-label">${escapeHtml(reason)}</span><span>Use it right after taking the hit: enter the damage first, then halve it.</span>`);
    return;
  }
  if (lastDamage.halved) {
    showToast(`<span class="toast-label">Already halved</span><span>Halving applies once per hit; resistance and Uncanny Dodge don't stack on the same damage twice.</span>`);
    return;
  }
  const { before, amount } = lastDamage;
  restoreVitals(before);
  lastDamage = null;
  const half = Math.floor(amount / 2);
  if (half > 0) {
    dealDamage(half, { label: `${reason}: took ${half} instead of ${amount}`, halved: true });
    return;
  }
  persistAndRender();
  showToast(`<span class="toast-label">${escapeHtml(reason)}</span><span>The hit is halved to 0 damage.</span>`, { tone: "crit" });
}

// Life drain and similar effects: the maximum drops until a long rest.
function reduceMaxHp(amount) {
  const before = vitalsSnapshot();
  character.maxHpReduction = Number(character.maxHpReduction || 0) + amount;
  character.hp = Math.min(Number(character.hp || 0), effectiveMaxHp());
  const killed = effectiveMaxHp() === 0;
  if (killed) {
    character.hp = 0;
    character.deathSaveFailures = 3;
  }
  persistAndRender();
  showToast(`<span class="toast-label">Max HP lowered by ${amount}</span><span>${killed ? "Your HP maximum is 0: the character dies." : `${character.hp}/${effectiveMaxHp()} HP until a long rest.`}</span>`, {
    tone: "fumble",
    actions: [{ label: "Undo", run: () => { restoreVitals(before); persistAndRender(); } }]
  });
}

function clearMaxHpReduction() {
  character.maxHpReduction = 0;
  persistAndRender();
  showToast(`<span class="toast-label">Max HP restored</span><span>${character.hp}/${effectiveMaxHp()} HP</span>`);
}

function isDying() {
  return Number(character.hp) <= 0 && character.deathSaveFailures < 3 && character.deathSaveSuccesses < 3;
}

// Three failed death saves, or exhaustion level 6 (PHB p.291).
function isDead() {
  return (Number(character.hp) <= 0 && character.deathSaveFailures >= 3) || Number(character.exhaustion || 0) >= 6;
}

function applyHeal(input = document.querySelector("#damageAmount")) {
  const amount = amountFromInput(input);
  if (amount) healBy(Math.min(amount, 999));
}

function healBy(amount) {
  if (isDead()) {
    showToast(`<span class="toast-label">${escapeHtml(character.name || "This character")} is dead</span><span>Ordinary healing can't help. Revivify, Raise Dead and similar magic bring a character back.</span>`, {
      tone: "fumble",
      actions: [{ label: "Revive at 1 HP", run: reviveCharacter }],
      duration: 12000
    });
    return false;
  }
  const before = vitalsSnapshot();
  const shape = character.wildShape && Number(character.wildShape.max) > 0 ? character.wildShape : null;
  let applied;
  if (shape) {
    const old = Number(shape.hp || 0);
    shape.hp = Math.min(Number(shape.max), old + amount);
    applied = shape.hp - old;
  } else {
    const old = Number(character.hp || 0);
    character.hp = Math.min(effectiveMaxHp(), old + amount);
    applied = character.hp - old;
  }
  persistAndRender();
  const where = shape ? `${shape.name || "Beast form"} ${shape.hp}/${shape.max} HP` : `${character.hp}/${effectiveMaxHp()} HP`;
  const over = amount - applied;
  showToast(`<span class="toast-label">${applied ? `Healed ${applied}` : "Already at full HP"}</span><span>${escapeHtml(where)}${applied && over ? ` · ${over} over the maximum` : ""}</span>`, {
    tone: applied ? "crit" : "",
    actions: applied ? [{ label: "Undo", run: () => { restoreVitals(before); persistAndRender(); } }] : []
  });
  return true;
}

// Heal a different character stored on this device (the healer stays on their own sheet).
function healOther(sheetId, amount) {
  const other = characterLibrary[sheetId];
  if (!other) return;
  const name = other.name || "That character";
  if (Number(other.hp) <= 0 && Number(other.deathSaveFailures) >= 3) {
    showToast(`<span class="toast-label">${escapeHtml(name)} is dead</span><span>Ordinary healing can't help.</span>`, { tone: "fumble" });
    return;
  }
  const old = Number(other.hp || 0);
  other.hp = Math.min(effectiveMaxHp(other), old + amount);
  if (other.hp > 0) {
    other.deathSaveSuccesses = 0;
    other.deathSaveFailures = 0;
    if (other.autoUnconscious) {
      other.conditions = (other.conditions || []).filter(condition => condition !== "Unconscious");
      other.autoUnconscious = false;
    }
  }
  other.updatedAt = Date.now();
  saveCharacterLibrary();
  renderAll();
  const applied = other.hp - old;
  showToast(`<span class="toast-label">${applied ? `Healed ${escapeHtml(name)} ${applied}` : `${escapeHtml(name)} is already at full HP`}</span><span>${other.hp}/${effectiveMaxHp(other)} HP</span>`, { tone: applied ? "crit" : "" });
}

function gainTempHp(amount) {
  const before = vitalsSnapshot();
  const old = Number(character.tempHp || 0);
  character.tempHp = Math.max(old, amount);
  persistAndRender();
  showToast(`<span class="toast-label">${character.tempHp > old ? `${character.tempHp} temp HP` : `Kept ${old} temp HP`}</span><span>${character.tempHp > old ? "Temporary hit points don't stack; the higher total applies." : `${amount} is not more than the ${old} you already have.`}</span>`, {
    actions: [{ label: "Undo", run: () => { restoreVitals(before); persistAndRender(); } }]
  });
}

const INCAPACITATING = ["Incapacitated", "Paralyzed", "Petrified", "Stunned", "Unconscious"];
const SAVE_AUTO_FAIL = ["Paralyzed", "Petrified", "Stunned", "Unconscious"];

// Conditions and exhaustion that impose disadvantage (PHB appendix A).
function disadvantageSources(kind, ability = "") {
  const active = new Set(character.conditions || []);
  const exhaustion = Number(character.exhaustion || 0);
  const names = {
    attack: ["Poisoned", "Frightened", "Prone", "Blinded", "Restrained"],
    check: ["Poisoned", "Frightened"],
    save: ability === "dex" ? ["Restrained"] : []
  }[kind] || [];
  const sources = names.filter(name => active.has(name));
  const threshold = { attack: 3, check: 1, save: 3 }[kind];
  if (threshold && exhaustion >= threshold) sources.push(`exhaustion ${exhaustion}`);
  return sources;
}

// Advantage and disadvantage cancel out (PHB p. 173) no matter how many sources of each.
// picked: the Advantage / Disadvantage toggles in the roll modal. They add to what the sheet detects, so a
// character who normally has advantage but is told to roll with disadvantage rolls flat.
function rollModeFor(kind, ability = "", context = "", picked = {}) {
  const feature = advantageSource(kind, ability, context);
  const sources = disadvantageSources(kind, ability);
  const forAdvantage = [feature, picked.advantage ? "you chose advantage" : ""].filter(Boolean);
  const against = [...sources, picked.disadvantage ? "you chose disadvantage" : ""].filter(Boolean);
  if (forAdvantage.length && against.length) return { mode: "normal", note: `${forAdvantage.join(", ")} and ${against.join(", ")} cancel out` };
  if (forAdvantage.length) return { mode: "advantage", note: feature ? `${feature}: advantage` : "" };
  if (against.length) return { mode: "disadvantage", note: sources.length ? `${sources.join(", ")}: disadvantage` : "" };
  return { mode: "normal", note: "" };
}

// Class features and feats that grant advantage on their own.
function advantageSource(kind, ability, context) {
  const active = character.conditions || [];
  if (character.raging && ability === "str" && (kind === "check" || kind === "save")) return "Rage";
  if (kind === "save" && ability === "dex" && currentClass().id === "barbarian" && character.level >= 2 && !["Blinded", "Deafened"].some(name => active.includes(name)) && !incapacitatedBy()) return "Danger Sense";
  if (context === "concentration" && hasFeat("War Caster")) return "War Caster";
  if (kind === "attack" && active.includes("Invisible")) return "Invisible";
  return "";
}

function autoFailCondition(ability) {
  if (!["str", "dex"].includes(ability)) return "";
  return SAVE_AUTO_FAIL.find(name => (character.conditions || []).includes(name)) || "";
}

function incapacitatedBy() {
  return INCAPACITATING.find(name => (character.conditions || []).includes(name)) || "";
}

// Incapacitated creatures can't act. Warn once and let the player override (the DM may rule otherwise).
function blockedByIncapacitation(retry) {
  const condition = incapacitatedBy();
  if (!condition) return false;
  showToast(`<span class="toast-label">You're ${condition.toLowerCase()}</span><span>Incapacitated creatures can't take actions or reactions.</span>`, {
    tone: "fumble",
    actions: [{ label: "Do it anyway", run: retry }],
    duration: 9000
  });
  return true;
}

function reviveCharacter() {
  character.deathSaveFailures = 0;
  character.deathSaveSuccesses = 0;
  character.hp = 1;
  persistAndRender();
  showToast(`<span class="toast-label">${escapeHtml(character.name || "Character")} returns at 1 HP</span>`, { tone: "crit" });
}

function gainInspiration() {
  character.inspiration = clamp(character.inspiration + 1, 0, 99);
  persistAndRender();
}

function spendInspiration() {
  if (!character.inspiration) return;
  character.inspiration -= 1;
  character.rollHistory = [{ label: "Inspiration spent", formula: "advantage on one roll", mode: "normal", total: character.inspiration, parts: [`${character.inspiration} left`] }, ...(character.rollHistory || [])].slice(0, 25);
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
  if (!isDying()) {
    showToast(`<span class="toast-label">No death save needed</span><span>${Number(character.hp) > 0 ? "You're above 0 HP." : character.deathSaveFailures >= 3 ? "Three failures: the character is dead." : "You're stable."}</span>`);
    return;
  }
  // A death save is a saving throw, so exhaustion 3+ gives it disadvantage.
  openRoll({ label: "Death save", formula: "1d20", kind: "save", onResult: result => applyDeathSave(naturalD20(result)) });
}

function applyDeathSave(roll) {
  let outcome;
  if (roll === 20) {
    character.deathSaveSuccesses = 0;
    character.deathSaveFailures = 0;
    character.hp = 1;
    outcome = "natural 20, back up with 1 HP";
  } else if (roll === 1) {
    character.deathSaveFailures = clamp(character.deathSaveFailures + 2, 0, 3);
    outcome = "natural 1, two failures";
  } else if (roll >= 10) {
    character.deathSaveSuccesses = clamp(character.deathSaveSuccesses + 1, 0, 3);
    outcome = "Success";
  } else {
    character.deathSaveFailures = clamp(character.deathSaveFailures + 1, 0, 3);
    outcome = "Failure";
  }
  character.rollHistory[0].label = `Death save: ${outcome}`;
  persistAndRender();
  return `${outcome}. ${character.deathSaveSuccesses} success${character.deathSaveSuccesses === 1 ? "" : "es"}, ${character.deathSaveFailures} failure${character.deathSaveFailures === 1 ? "" : "s"}.`;
}

function rollAbilityCheck(ability) {
  const name = ABILITIES.find(([id]) => id === ability)?.[1] || ability;
  rollWithConditions(`${name} check`, `1d20${formatMod(mod(ability) + untrainedBonus(ability))}`, "check", ability);
}

function rollWithConditions(label, formula, kind, ability = "", actions = [], context = "", onResult = null) {
  openRoll({ label, formula, kind, ability, context, actions, onResult });
}

function rollSavingThrow(ability, actions = []) {
  const name = ABILITIES.find(([id]) => id === ability)?.[1] || ability;
  const failedBy = autoFailCondition(ability);
  if (failedBy) {
    character.rollHistory = [{ label: `${name} save: automatic failure (${failedBy})`, formula: "auto", mode: "normal", total: 0, parts: ["auto-fail"] }, ...(character.rollHistory || [])].slice(0, 25);
    persistAndRender();
    showToast(`<span class="toast-label">${escapeHtml(name)} save: automatic failure</span><span>${escapeHtml(failedBy)} creatures fail Strength and Dexterity saves.</span>`, { tone: "fumble" });
    return null;
  }
  rollWithConditions(`${name} save`, `1d20${formatMod(saveBonus(ability))}`, "save", ability, actions);
}

function rollSkillCheck(skill) {
  const [, name, ability] = SKILLS.find(([id]) => id === skill) || [];
  if (!name) return;
  rollWithConditions(`${name} check`, `1d20${formatMod(skillBonus(skill, ability))}`, "check", ability);
}

// Initiative is a Dexterity check, so conditions and exhaustion apply to it.
function rollInitiativeCheck() {
  rollWithConditions("Initiative", `1d20${formatMod(initiativeBonus())}`, "check", "dex");
}

function combatActionHint(action) {
  return {
    Action: "Attack, cast, dash, disengage, dodge, help, hide, ready, search, or use object.",
    "Bonus Action": "Available only when a feature, spell, or item grants one.",
    Reaction: "Usually spent off-turn by a trigger such as an opportunity attack.",
    Movement: `${effectiveSpeed()} ft speed.`
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
      ${/^(death save|hit die)|automatic failure/i.test(roll.label) ? "<span></span>" : `<button type="button" class="ghost reroll" data-roll-index="${index}" aria-label="Reroll ${escapeHtml(roll.label)}" title="Reroll">${icon("arrow-clockwise")}</button>`}
    </article>
  `).join("") || `<p class="empty-state">No roll history yet.</p>`;
}

function rollFromInput(label = "Custom roll", formula = document.querySelector("#rollFormula").value, mode = "normal", actions = [], detail = "", onResult = null) {
  const problem = formulaProblem(formula || "1d20");
  if (problem) {
    showToast(`<span class="toast-label">Can't roll "${escapeHtml(formula)}"</span><span>${problem}</span>`, { tone: "fumble" });
    return;
  }
  openRoll({ label, formula: formula || "1d20", mode, actions, detail, onResult });
}

function formulaProblem(formula) {
  const cleaned = String(formula).replace(/\s+/g, "").toLowerCase();
  if (!/^[+-]?(\d*d\d+|\d+)([+-](\d*d\d+|\d+))*$/.test(cleaned)) return "Use dice like 1d20+5 or 2d6+1d4+3.";
  const outOfRange = (cleaned.match(/\d*d\d+/g) || []).some(term => {
    const [count, sides] = term.split("d").map(value => Number(value || 1));
    return count < 1 || count > 100 || sides < 2 || sides > 1000;
  });
  return outOfRange ? "Use 1 to 100 dice with 2 to 1000 sides." : "";
}

function naturalD20(result) {
  return Number(String(result.parts[0] || "").match(/^1d20\[(\d+)\]$/)?.[1]) || null;
}

// Clicking d6 three times builds "3d6"; another die type is added as a new term.
function handleDiePicker(event) {
  const button = event.target.closest("[data-add-die]");
  if (!button) return;
  const input = document.querySelector("#rollFormula");
  if (button.dataset.addDie === "clear") {
    input.value = "";
    input.focus();
    return;
  }
  const sides = button.dataset.addDie;
  const terms = input.value.replace(/\s+/g, "").match(/[+-]?[^+-]+/g) || [];
  const index = terms.findIndex(term => new RegExp(`^\\+?(\\d*)d${sides}$`).test(term));
  if (index >= 0) {
    const count = Number(terms[index].match(/(\d*)d/)[1] || 1) + 1;
    terms[index] = `${index ? "+" : ""}${count}d${sides}`;
  } else {
    terms.push(`${terms.length ? "+" : ""}1d${sides}`);
  }
  input.value = terms.join("");
}

function handleRollHistoryClick(event) {
  const button = event.target.closest(".reroll");
  if (!button) return;
  const roll = character.rollHistory[Number(button.dataset.rollIndex)];
  if (roll) rollFromInput(roll.label, roll.formula, roll.mode);
}

function renderRestPreview() {
  const shortRefresh = [
    ...(slotsArePact() ? [{ name: "Pact magic slots" }] : []),
    ...character.resources.filter(item => item.reset === "short"),
    ...character.classOptions.filter(item => item.reset === "short")
  ].map(item => item.name).filter(Boolean);
  const longRefresh = [
    ...character.resources.filter(item => item.reset === "long" || item.reset === "short"),
    ...character.classOptions.filter(item => item.reset === "long" || item.reset === "short")
  ].map(item => item.name).filter(Boolean);
  document.querySelector("#restSummary").textContent = character.restLog || "No rest taken yet";
  document.querySelector("#hitDiceSummary").textContent = `Hit dice ${Math.max(0, totalLevel() - character.hitDiceUsed)} of ${hitDiceText()}`;
  document.querySelector("#restPreview").innerHTML = `
    <article><strong>Short rest</strong><span>${escapeHtml(shortRefresh.join(", ") || "No short-rest resources tracked.")}</span></article>
    <article><strong>Long rest</strong><span>HP, spell slots, 1 exhaustion, item spell uses${longRefresh.length ? `, ${escapeHtml(longRefresh.join(", "))}` : ""}</span></article>
  `;
  if (lastRest) {
    document.querySelector("#restPreview").insertAdjacentHTML("beforeend", `<article><strong>${escapeHtml(lastRest.name)} taken</strong><button type="button" class="ghost" data-undo-rest>Undo ${escapeHtml(lastRest.name.toLowerCase())}</button></article>`);
  }
}

// ponytail: a multiclass character spends the primary class's die; add a die picker if players ask.
function spendHitDie() {
  if (character.hitDiceUsed >= totalLevel()) return;
  const cls = currentClass();
  openRoll({
    label: "Hit die healing",
    formula: `1d${cls.hitDie}${formatMod(mod("con"))}`,
    onResult: result => {
      const heal = Math.max(1, result.total);
      character.hitDiceUsed += 1;
      character.hp = Math.min(effectiveMaxHp(), Number(character.hp || 0) + heal);
      persistAndRender();
      const left = totalLevel() - character.hitDiceUsed;
      return `+${heal} HP: ${character.hp}/${effectiveMaxHp()} HP, ${left} hit ${left === 1 ? "die" : "dice"} left.`;
    },
    actions: () => {
      const left = totalLevel() - character.hitDiceUsed;
      return left > 0 && character.hp < effectiveMaxHp() ? [{ label: `Spend another (${left} left)`, run: spendHitDie }] : [];
    }
  });
}

function takeRest(type) {
  if (type === "long" && Number(character.hp) <= 0) {
    showToast(`<span class="toast-label">Can't benefit from a long rest</span><span>A creature needs at least 1 hit point at the start of a long rest (PHB p.186). Heal or stabilize first.</span>`, { tone: "fumble" });
    return;
  }
  const before = structuredCloneSafe(character);
  character.raging = false;
  if (type === "short" && slotsArePact()) {
    character.spellSlotUsage = {};
  }
  // A short rest is an hour: concentration on a spell lasting an hour or less has run out.
  if (type === "short" && character.concentration) {
    const minutes = spellDurationMinutes(character.concentration);
    if (minutes !== null && minutes <= 60) character.concentration = "";
  }
  if (type === "long") {
    character.maxHpReduction = 0;
    character.wildShape = null;
    character.agathys = 0;
    character.tempHp = 0;
    character.mageArmor = false;
    (character.spells || []).forEach(row => { delete row.castLevel; });
    // Exhaustion drops first so a level-4 max HP halving ends before HP refills.
    character.exhaustion = Math.max(0, Number(character.exhaustion || 0) - 1);
    character.hp = effectiveMaxHp() || character.hp;
    character.spellSlotUsage = {};
    // Petrification needs magic to end; the rest wears off over 8 hours.
    character.conditions = (character.conditions || []).filter(condition => condition === "Exhaustion" || condition === "Petrified");
    character.hitDiceUsed = Math.max(0, Number(character.hitDiceUsed || 0) - Math.max(1, Math.floor(totalLevel() / 2)));
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
  const after = structuredCloneSafe(character);
  persistAndRender();
  const name = type === "long" ? "Long rest" : "Short rest";
  const actions = [{
    label: "Undo",
    run: undoLastRest
  }];
  const hitDiceLeft = totalLevel() - character.hitDiceUsed;
  if (type === "short" && hitDiceLeft > 0 && character.hp < effectiveMaxHp()) actions.push({ label: `Spend a hit die (${hitDiceLeft} left)`, run: spendHitDie });
  if (type === "short" && arcaneRecoveryPlan().length) actions.push({ label: recoveryFeatureName(), run: useArcaneRecovery });
  const changes = restChanges(before, character);
  const nothing = character.hp < effectiveMaxHp() && hitDiceLeft > 0 ? "No resources to recover. Spend hit dice to heal." : "Nothing needed recovering.";
  showToast(`<span class="toast-label">${name}</span><span>${escapeHtml(changes.join(" · ") || nothing)}</span>`, { actions, duration: 12000 });
  lastRest = { before, after, name };
  renderRestPreview();
}

// The most recent rest can be undone from the Rest panel until the next rest, not just from its toast.
let lastRest = null;

function undoLastRest() {
  if (!lastRest) return;
  undoRest(lastRest.before, lastRest.after);
  showToast(`<span class="toast-label">${lastRest.name} undone</span>`);
  lastRest = null;
  renderRestPreview();
}

// Reverse the rest's own changes as deltas, so anything done after the rest (here or in another tab) survives.
function undoRest(before, after) {
  const delta = (field, from = before, to = after) => Number(from?.[field] || 0) - Number(to?.[field] || 0);
  if (Number(before.maxHpReduction || 0) !== Number(after.maxHpReduction || 0)) character.maxHpReduction = before.maxHpReduction;
  if (before.wildShape && !after.wildShape && !character.wildShape) character.wildShape = before.wildShape;
  if (before.agathys && !after.agathys && !character.agathys) character.agathys = before.agathys;
  if (Number(before.tempHp || 0) > Number(after.tempHp || 0) && !Number(character.tempHp || 0)) character.tempHp = before.tempHp;
  if (before.mageArmor && !after.mageArmor) character.mageArmor = true;
  if (before.raging && !after.raging) character.raging = true;
  (before.spells || []).forEach(old => {
    const row = (character.spells || []).find(entry => entry.id === old.id);
    if (row && old.castLevel && !row.castLevel) row.castLevel = old.castLevel;
  });
  character.hp = clamp(Number(character.hp || 0) + delta("hp"), 0, effectiveMaxHp());
  const levels = new Set([...Object.keys(before.spellSlotUsage || {}), ...Object.keys(after.spellSlotUsage || {})]);
  levels.forEach(level => {
    const change = delta(level, before.spellSlotUsage, after.spellSlotUsage);
    if (change) character.spellSlotUsage[level] = Math.max(0, Number(character.spellSlotUsage[level] || 0) + change);
  });
  character.hitDiceUsed = clamp(Number(character.hitDiceUsed || 0) + delta("hitDiceUsed"), 0, totalLevel());
  ["resources", "classOptions"].forEach(key => (character[key] || []).forEach(entry => {
    const old = (before[key] || []).find(item => item.id === entry.id);
    const rested = (after[key] || []).find(item => item.id === entry.id);
    if (old && rested) entry.current = clamp(Number(entry.current || 0) + delta("current", old, rested), 0, Number(entry.max || 0));
  }));
  (character.equipment || []).forEach(item => {
    const old = (before.equipment || []).find(entry => entry.id === item.id);
    const rested = (after.equipment || []).find(entry => entry.id === item.id);
    if (old && rested) item.grantUsed = Math.max(0, Number(item.grantUsed || 0) + delta("grantUsed", old, rested));
  });
  (before.conditions || []).filter(condition => !(after.conditions || []).includes(condition)).forEach(condition => {
    if (!character.conditions.includes(condition)) character.conditions.push(condition);
  });
  character.exhaustion = clamp(Number(character.exhaustion || 0) + delta("exhaustion"), 0, 6);
  if (before.concentration && !after.concentration && !character.concentration) character.concentration = before.concentration;
  character.restLog = before.restLog;
  persistAndRender();
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
  (after.classOptions || []).forEach(option => {
    const old = (before.classOptions || []).find(item => item.id === option.id);
    if (old && Number(old.current) < Number(option.current)) changes.push(`${option.name} ${option.current}/${option.max}`);
  });
  (after.equipment || []).forEach(item => {
    const old = (before.equipment || []).find(entry => entry.id === item.id);
    if (Number(old?.grantUsed || 0) > Number(item.grantUsed || 0)) changes.push(`${item.name} recharged`);
  });
  const cleared = (before.conditions || []).filter(condition => !(after.conditions || []).includes(condition));
  if (cleared.length) changes.push(`cleared ${cleared.join(", ")}`);
  if (Number(after.exhaustion) < Number(before.exhaustion)) changes.push(`exhaustion ${after.exhaustion}`);
  if (before.concentration && !after.concentration) changes.push(`ended ${before.concentration}`);
  if (Number(before.maxHpReduction || 0) > Number(after.maxHpReduction || 0)) changes.push("max HP restored");
  if (before.wildShape && !after.wildShape) changes.push("left Wild Shape");
  return changes;
}

// Arcane Recovery (wizard) and Natural Recovery (Circle of the Land), once per day after a short rest:
// recover spent slots totalling up to half your level (rounded up), none 6th level or higher. Highest slots first.
function recoveryFeatureName() {
  const id = currentClass().id;
  if (id === "wizard") return "Arcane Recovery";
  if (id === "druid" && lookupBySubclass({ land: true })) return "Natural Recovery";
  return "";
}

function arcaneRecoveryPlan() {
  const name = recoveryFeatureName();
  if (!name) return [];
  const feature = character.resources.find(item => item.name === name);
  if (!feature || Number(feature.current) < 1) return [];
  let budget = Math.ceil(character.level / 2);
  const plan = [];
  for (let level = Math.min(5, budget); level >= 1; level -= 1) {
    let spent = Number(character.spellSlotUsage?.[level] || 0);
    while (spent > 0 && level <= budget) {
      plan.push(level);
      budget -= level;
      spent -= 1;
    }
  }
  return plan;
}

function useArcaneRecovery() {
  const plan = arcaneRecoveryPlan();
  if (!plan.length) {
    showToast(`<span class="toast-label">${escapeHtml(recoveryFeatureName() || "Arcane Recovery")}</span><span>No spent slots to recover, or it's already used today.</span>`);
    return;
  }
  const name = recoveryFeatureName();
  const before = { usage: { ...character.spellSlotUsage }, feature: character.resources.find(item => item.name === name).current };
  plan.forEach(level => {
    character.spellSlotUsage[level] = Math.max(0, Number(character.spellSlotUsage[level] || 0) - 1);
  });
  const feature = character.resources.find(item => item.name === name);
  feature.current = Number(feature.current) - 1;
  persistAndRender();
  showToast(`<span class="toast-label">${escapeHtml(name)}</span><span>Recovered ${plan.map(level => `a ${ordinal(level)}-level slot`).join(", ")}.</span>`, {
    tone: "crit",
    actions: [{ label: "Undo", run: () => { character.spellSlotUsage = before.usage; feature.current = before.feature; persistAndRender(); } }]
  });
}

function renderResources() {
  const root = document.querySelector("#resourceRows");
  const template = document.querySelector("#resourceRowTemplate");
  root.innerHTML = "";
  if (!character.resources.length) {
    root.innerHTML = `<p class="empty-state">No resources tracked yet. Choose Edit to add one.</p>`;
    return;
  }
  character.resources.forEach(resource => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.dataset.resourceId = resource.id;
    node.querySelector(".resource-name").value = resource.name;
    node.querySelector(".resource-current").value = resource.current;
    node.querySelector(".resource-max").value = resource.max;
    node.querySelector(".resource-name").title = resource.name;
    if (resource.auto) {
      node.querySelector(".resource-max").readOnly = true;
      node.querySelector(".resource-max").title = "Set by your class and level";
    }
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
  if (event.target.classList.contains("resource-current")) resource.current = clamp(Number(event.target.value), 0, Number(resource.max || 0));
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
  if (character.concentration) active.add("Concentrating");
  root.innerHTML = `
    <div class="condition-chips">
      ${CONDITIONS.map(condition => `<button type="button" title="${escapeHtml(conditionRule(condition))}" class="condition-chip ${active.has(condition) ? "active" : ""}" aria-pressed="${active.has(condition)}" data-condition="${condition}">${condition}</button>`).join("")}
    </div>
    ${[...active].filter(condition => CONDITIONS.includes(condition)).map(condition => `
      <article class="condition-card active">
        <strong>${escapeHtml(condition)}</strong>
        <span>${escapeHtml(conditionRule(condition))}</span>
        ${conditionCardControls(condition)}
      </article>
    `).join("")}
  `;
}

// Conditions that a spell or monster usually lets you shake off with a repeated save at the end of your turn.
const REPEAT_SAVE_CONDITIONS = ["Blinded", "Charmed", "Frightened", "Incapacitated", "Paralyzed", "Petrified", "Poisoned", "Restrained", "Stunned"];

function conditionCardControls(condition) {
  if (condition === "Prone") {
    return `<div class="condition-actions"><button type="button" class="secondary" data-stand-up>Stand up (costs ${Math.floor(effectiveSpeed() / 2)} ft)</button></div>`;
  }
  if (!REPEAT_SAVE_CONDITIONS.includes(condition)) return "";
  return `
    <div class="condition-actions">
      <span>Repeat save</span>
      ${ABILITIES.map(([id, name]) => `<button type="button" class="ghost" data-repeat-save="${id}" data-condition-name="${condition}" title="Roll a ${name} save to end ${condition}">${id.toUpperCase()}</button>`).join("")}
    </div>
  `;
}

function removeCondition(condition) {
  character.conditions = (character.conditions || []).filter(item => item !== condition);
  persistAndRender();
  showToast(`<span class="toast-label">${escapeHtml(condition)} ended</span>`);
}

function handleConditionClick(event) {
  if (event.target.closest("[data-stand-up]")) {
    if (Number(character.hp) <= 0) {
      showToast(`<span class="toast-label">You can't stand yet</span><span>You're unconscious at 0 HP. Healing wakes you, but you stay prone until you stand.</span>`);
      return;
    }
    character.conditions = (character.conditions || []).filter(condition => condition !== "Prone");
    persistAndRender();
    showToast(`<span class="toast-label">You stand up</span><span>Standing costs half your speed: ${Math.ceil(effectiveSpeed() / 2)} ft of movement left this turn.</span>`);
    return;
  }
  const repeat = event.target.closest("[data-repeat-save]");
  if (repeat) {
    const condition = repeat.dataset.conditionName;
    rollSavingThrow(repeat.dataset.repeatSave, () => [{ label: `It worked: end ${condition}`, run: () => removeCondition(condition) }]);
    return;
  }
  const button = event.target.closest("[data-condition]");
  if (!button) return;
  if (button.dataset.condition === "Concentrating" && character.concentration) {
    const ended = character.concentration;
    character.concentration = "";
    character.conditions = (character.conditions || []).filter(condition => condition !== "Concentrating");
    persistAndRender();
    showToast(`<span class="toast-label">Concentration ended</span><span>${escapeHtml(ended)}</span>`);
    return;
  }
  const active = new Set(character.conditions || []);
  const adding = !active.has(button.dataset.condition);
  if (adding) active.add(button.dataset.condition);
  else active.delete(button.dataset.condition);
  character.conditions = Array.from(active);
  // Being incapacitated ends concentration (PHB p.203).
  const lost = adding && INCAPACITATING.includes(button.dataset.condition) && character.concentration;
  if (lost) character.concentration = "";
  persistAndRender();
  if (lost) showToast(`<span class="toast-label">Concentration on ${escapeHtml(lost)} ends</span><span>You're ${escapeHtml(button.dataset.condition.toLowerCase())}, and incapacitated creatures can't concentrate.</span>`, { tone: "fumble" });
}

let actionTypeFilter = "all";
let actionKindFilter = "all";

// Baldur's Gate-style filters: by what the action costs and by what kind of thing it is.
function handleActionFilterClick(event) {
  const cost = event.target.closest("[data-action-filter]");
  const kind = event.target.closest("[data-kind-filter]");
  if (cost) actionTypeFilter = cost.dataset.actionFilter;
  if (kind) actionKindFilter = kind.dataset.kindFilter;
  if (cost || kind) renderActions();
}

function actionKind(action) {
  if (action.source?.spell) return "spell";
  if (action.source?.feature) return "feature";
  if (action.source?.weapon || /^\s*[+-]?\d/.test(action.attack || "")) return "attack";
  return "feature";
}

// The actions every creature has (PHB ch.9), with a roll where one applies.
const COMMON_ACTIONS = [
  ["Action", "Attack", "Make one weapon attack (more with Extra Attack)."],
  ["Action", "Cast a Spell", "Cast a spell with a casting time of 1 action."],
  ["Action", "Dash", "Gain extra movement equal to your speed this turn."],
  ["Action", "Disengage", "Your movement doesn't provoke opportunity attacks this turn."],
  ["Action", "Dodge", "Attacks against you have disadvantage and you make DEX saves with advantage until your next turn."],
  ["Action", "Help", "Give an ally advantage on their next ability check, or on their next attack against a creature within 5 ft of you."],
  ["Action", "Hide", "Make a Dexterity (Stealth) check to hide.", "stealth"],
  ["Action", "Ready", "Choose a trigger and an action; use your reaction to do it when the trigger happens."],
  ["Action", "Search", "Look for something: Wisdom (Perception) or Intelligence (Investigation).", "perception"],
  ["Action", "Use an Object", "Use an object that needs your action, like drinking a potion."],
  ["Action", "Grapple", "Replaces one attack. Strength (Athletics) vs. the target's Athletics or Acrobatics.", "athletics"],
  ["Action", "Shove", "Replaces one attack. Knock prone or push 5 ft: Athletics vs. Athletics or Acrobatics.", "athletics"],
  ["Bonus Action", "Two-Weapon Fighting", "After attacking with a light melee weapon, attack with another light weapon in your other hand. No ability modifier to its damage unless negative."],
  ["Reaction", "Opportunity Attack", "When a creature you can see leaves your reach, make one melee attack against it."],
  ["Free", "Interact with an Object", "Once per turn for free: draw or sheathe a weapon, open a door, pick up an item."],
  ["Free", "Drop Prone", "Fall prone without using movement."],
  ["Free", "Stand Up", "Costs half your movement."],
  ["Free", "Speak", "Brief words or gestures on your turn."]
];

// 2014 DMG potion healing.
const HEALING_POTIONS = { "potion of healing": "2d4+2", "potion of greater healing": "4d4+4", "potion of superior healing": "8d4+8", "potion of supreme healing": "10d4+20" };

function consumableItems() {
  return (character.equipment || []).filter(item => Number(item.quantity ?? 1) > 0 && /potion|scroll|elixir|oil of|antitoxin|healer's kit/i.test(item.name || ""));
}

function useConsumable(id) {
  const item = (character.equipment || []).find(entry => entry.id === id);
  if (!item) return;
  item.quantity = Math.max(0, Number(item.quantity ?? 1) - 1);
  persistAndRender();
  const heal = HEALING_POTIONS[String(item.name).toLowerCase().trim()];
  const undo = { label: "Undo", run: () => { item.quantity = Number(item.quantity) + 1; persistAndRender(); } };
  if (heal) {
    rollFromInput(`${item.name} healing`, heal, "normal", result => [{ label: `Heal me +${result.total}`, run: () => healBy(result.total) }, undo]);
    return;
  }
  showToast(`<span class="toast-label">Used ${escapeHtml(item.name)}</span><span>${Number(item.quantity)} left.</span>`, { actions: [undo] });
}

function commonActionsHtml() {
  return COMMON_ACTIONS.filter(([type]) => actionTypeFilter === "all" || actionTypeFilter === type).map(([type, name, text, skill]) => `
    <article class="common-action">
      <span class="cost-dot ${costClass(type)}" title="${escapeHtml(type)}"></span>
      <strong>${escapeHtml(name)}</strong>
      <span>${escapeHtml(text)}</span>
      ${skill ? `<button type="button" class="secondary" data-common-roll="${skill}">Roll ${escapeHtml(SKILLS.find(([id]) => id === skill)?.[1] || skill)}</button>` : ""}
    </article>`).join("");
}

function costClass(type) {
  return { Action: "cost-action", "Bonus Action": "cost-bonus", Reaction: "cost-reaction" }[type] || "cost-free";
}

// Actions made by Generate Actions remember what they came from and recompute as scores and levels change.
function refreshGeneratedActions() {
  character.actions.forEach(action => {
    // Rows saved before actions tracked their source: relink one that still matches an equipped weapon's dice.
    if (!action.source) {
      const item = (character.equipment || []).find(entry => (entry.equipped || entry.container === "equipped") && entry.name === action.name);
      const die = String(item?.notes || "").match(/\b(\d+d\d+)\b/)?.[1];
      if (item && die && String(action.damage || "").startsWith(die)) action.source = { weapon: item.id, grip: "" };
    }
    if (!action.source) return;
    let fresh = null;
    if (action.source.edited) return;
    if (action.source.weapon) {
      const item = (character.equipment || []).find(entry => entry.id === action.source.weapon);
      fresh = item ? weaponActions(item).find(entry => entry.source.grip === (action.source.grip || "")) : null;
      if (fresh) {
        action.notes = fresh.notes;
        action.source = { ...action.source, ability: fresh.source.ability };
      }
    } else if (action.source.spell) {
      const row = character.spells.find(entry => entry.index === action.source.spell);
      fresh = row ? spellAction(row) : null;
    } else if (action.source.feature) {
      fresh = featureActions().find(entry => entry.source.feature === action.source.feature);
    }
    if (fresh) {
      action.attack = fresh.attack;
      action.damage = fresh.damage;
      if (fresh.use) action.use = fresh.use;
    }
  });
}

function renderActions() {
  refreshGeneratedActions();
  const root = document.querySelector("#actionRows");
  const template = document.querySelector("#actionRowTemplate");
  document.querySelectorAll("[data-action-filter]").forEach(button => {
    const on = button.dataset.actionFilter === actionTypeFilter;
    button.classList.toggle("active", on);
    button.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-kind-filter]").forEach(button => {
    const on = button.dataset.kindFilter === actionKindFilter;
    button.classList.toggle("active", on);
    button.setAttribute("aria-pressed", String(on));
  });
  root.innerHTML = "";
  if (actionKindFilter === "common") {
    root.innerHTML = commonActionsHtml() || `<p class="empty-state">No common actions of this type.</p>`;
    return;
  }
  if (actionKindFilter === "item") {
    const items = actionTypeFilter === "all" || actionTypeFilter === "Action" ? consumableItems() : [];
    root.innerHTML = items.length ? items.map(item => `
      <article class="common-action">
        <span class="cost-dot cost-action" title="Action"></span>
        <strong>${escapeHtml(item.name)}</strong>
        <span>${Number(item.quantity ?? 1)} left${HEALING_POTIONS[String(item.name).toLowerCase().trim()] ? ` · heals ${HEALING_POTIONS[String(item.name).toLowerCase().trim()]}` : ""}. Drinking or using it takes an action.</span>
        <button type="button" class="secondary" data-use-consumable="${escapeHtml(item.id)}">Use</button>
      </article>`).join("") : `<p class="empty-state">No potions, scrolls or other consumables in your inventory.</p>`;
    return;
  }
  const visible = character.actions.filter(action => (actionTypeFilter === "all" || action.type === actionTypeFilter) && (actionKindFilter === "all" || actionKind(action) === actionKindFilter));
  if (!visible.length) {
    root.innerHTML = `<p class="empty-state">${character.actions.length ? "Nothing matches these filters." : "No actions yet. Choose Edit to add attacks or generate them from your gear."}</p>`;
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
    node.dataset.cost = costClass(action.type);
    syncActionButtons(node, action);
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
  // Hand edits stop automatic refreshes but keep what the row came from (a spell stays a spell).
  if ((event.target.classList.contains("action-attack") || event.target.classList.contains("action-damage")) && action.source) action.source = { ...action.source, edited: true };
  if (event.target.classList.contains("action-attack")) action.attack = event.target.value;
  if (event.target.classList.contains("action-damage")) action.damage = event.target.value;
  if (event.target.classList.contains("action-notes")) action.notes = event.target.value;
  syncActionButtons(row, action);
  persist();
}

function syncActionButtons(node, action) {
  node.querySelector(".roll-attack").style.display = /^\s*[+-]?\d+/.test(action.attack || "") ? "" : "none";
  node.querySelector(".roll-damage").style.display = actionDamageFormula(action) ? "" : "none";
  const use = node.querySelector(".use-action");
  use.hidden = !action.use;
  if (action.use) {
    const [resource, amount] = action.use.cost || [];
    use.textContent = resource === "Ki Points" ? `Use (${amount} ki)` : resource === "Superiority Dice" ? "Use a die" : "Use";
    use.title = resource ? `Spends ${amount} ${resource}` : "";
  }
}

function actionDamageFormula(action) {
  return String(action.damage || "").replace(/\s+/g, "").match(/^\d*d\d+(?:r\d+)?(?:[+-]\d*d?\d+(?:r\d+)?)*/i)?.[0] || "";
}

function doubleDice(formula) {
  return formula.replace(/(\d*)d(\d+)/gi, (_, count, sides) => `${Number(count || 1) * 2}d${sides}`);
}

function handleActionClick(event) {
  const commonRoll = event.target.closest("[data-common-roll]");
  if (commonRoll) rollSkillCheck(commonRoll.dataset.commonRoll);
  const consumable = event.target.closest("[data-use-consumable]");
  if (consumable) useConsumable(consumable.dataset.useConsumable);
  const row = event.target.closest(".action-row");
  const action = row && character.actions.find(item => item.id === row.dataset.actionId);
  if (!action) return;
  if (event.target.closest(".use-action")) {
    useFeatureAction(action);
    return;
  }
  if (event.target.closest(".roll-damage")) {
    const damage = actionDamageFormula(action);
    if (damage) rollFromInput(`${action.name || "Action"} damage`, damage, "normal");
    else showToast(`<span class="toast-label">${escapeHtml(action.name || "Action")}</span><span>No damage dice entered. Add something like 1d8+3.</span>`);
    return;
  }
  if (event.target.closest(".roll-attack")) {
    rollActionAttack(action);
    return;
  }
  if (!event.target.closest(".remove-action")) return;
  if (action.source?.feature) character.dismissedFeatures = [...new Set([...(character.dismissedFeatures || []), action.source.feature])];
  character.actions = character.actions.filter(item => item.id !== action.id);
  persistAndRender();
}

// next: an extra follow-up (the next Flurry of Blows strike) offered after this attack.
function rollActionAttack(action, suffix = "", confirmed = false, next = null) {
  const name = action.name || "Action";
  if (!confirmed && blockedByIncapacitation(() => rollActionAttack(action, suffix, true, next))) return;
  const damage = actionDamageFormula(action);
  const bonus = String(action.attack || "").match(/^\s*([+-]?\d+)/)?.[1];
  if (bonus === undefined) {
    showToast(`<span class="toast-label">${escapeHtml(name)}</span><span>${escapeHtml(action.attack || "No attack bonus entered.")}${damage ? " Roll damage after the target saves." : ""}</span>`);
    return;
  }
  const label = `${action.type === "Free" ? name : `${name} to hit`}${suffix}`;
  const traits = actionTraits(action);
  openRoll({
    label,
    formula: `1d20${formatMod(Number(bonus))}`,
    kind: "attack",
    critOn: traits.weapon ? critThreshold() : 20,
    actions: result => damageFollowUps(name, damage, naturalD20(result), traits),
    carry: next ? [next] : []
  });
}

// What kind of attack an action row is, from its source weapon or its own text.
function actionTraits(action) {
  if (action.source?.spell) return { weapon: false };
  const item = action.source?.weapon && (character.equipment || []).find(entry => entry.id === action.source.weapon);
  const text = `${action.name || ""} ${action.notes || ""} ${item ? `${item.name} ${item.notes || ""}` : ""}`.toLowerCase();
  const traits = weaponTraits(text);
  return {
    weapon: true,
    melee: !traits.ranged || traits.thrown,
    ranged: traits.ranged,
    finesse: traits.finesse,
    strength: action.source?.ability ? action.source.ability === "str" : !traits.ranged && !traits.finesse
  };
}

function weaponTraits(text) {
  return {
    ranged: /\branged\b|ammunition|crossbow|\bbow\b|longbow|shortbow|sling|\bdart|blowgun/.test(text) && !/\bthrown\b/.test(text),
    thrown: /\bthrown\b/.test(text),
    finesse: /finesse/.test(text),
    heavy: /\bheavy\b/.test(text),
    twoHanded: /two-handed/.test(text),
    light: /\blight\b/.test(text)
  };
}

// Damage that rides on a hit: Rage, Hex, Hunter's Mark, Hexblade's Curse, Sneak Attack. Each gets its own button
// so the player decides whether it applies to this target and turn.
function damageRiders(options = {}) {
  const riders = [];
  if (character.raging && options.melee && options.strength) {
    riders.push({ name: "Rage", formula: String(character.level >= 16 ? 4 : character.level >= 9 ? 3 : 2), flat: true });
  }
  if (character.concentration === "Hex") riders.push({ name: "Hex", formula: "1d6" });
  if (options.weapon && character.concentration === "Hunter's Mark") riders.push({ name: "Hunter's Mark", formula: "1d6" });
  if (hexbladeCurseActive()) riders.push({ name: "Curse", formula: String(proficiencyBonus()), flat: true });
  // Improved Divine Smite (PHB p.85): every melee weapon hit deals an extra 1d8 radiant from 11th level.
  if (options.weapon && options.melee && currentClass().id === "paladin" && character.level >= 11) riders.push({ name: "Improved Divine Smite", formula: "1d8" });
  // Sneak Attack needs a finesse or ranged weapon (PHB p.96).
  if (options.weapon && (options.finesse || options.ranged) && currentClass().id === "rogue") riders.push({ name: "Sneak Attack", formula: `${Math.ceil(character.level / 2)}d6` });
  return riders;
}

function hexbladeCurseActive() {
  if (!lookupBySubclass({ hexblade: true })) return false;
  const curse = character.resources.find(item => item.name === "Hexblade's Curse");
  return Boolean(curse) && Number(curse.current) < Number(curse.max);
}

// Champion: Improved Critical (19-20) at 3rd, Superior Critical (18-20) at 15th (PHB p.72).
function critThreshold() {
  if (currentClass().id === "fighter" && lookupBySubclass({ champion: true })) {
    if (character.level >= 15) return 18;
    if (character.level >= 3) return 19;
  }
  return 20;
}

// Brutal Critical: extra weapon damage dice on a melee crit (1/2/3 at 9/13/17).
// Half-Orc Savage Attacks (PHB p.41) adds one more die on a melee weapon crit.
function brutalCriticalDice() {
  const savage = /half-orc/i.test(character.species || "") ? 1 : 0;
  if (currentClass().id !== "barbarian") return savage;
  return savage + (character.level >= 17 ? 3 : character.level >= 13 ? 2 : character.level >= 9 ? 1 : 0);
}

function damageFollowUps(name, formula, natural, options = {}) {
  if (!formula) return [];
  // A natural 1 always misses (PHB p.194).
  if (Number(natural) === 1) return [];
  // Improved/Superior Critical cover weapon attacks only; Hexblade's Curse covers any attack.
  const crit = Number(natural) >= (options.weapon ? critThreshold() : 20);
  const curseCrit = !crit && Number(natural) >= 19 && hexbladeCurseActive();
  const build = isCrit => {
    let base = isCrit ? doubleDice(formula) : formula;
    const extra = isCrit && options.melee ? brutalCriticalDice() : 0;
    const die = formula.match(/\d*d(\d+)/i)?.[1];
    if (extra && die) base = `${base}+${extra}d${die}`;
    const riders = damageRiders(options).map(rider => ({ ...rider, formula: isCrit && !rider.flat ? doubleDice(rider.formula) : rider.formula }));
    return { base, riders };
  };
  const actions = [];
  const add = (isCrit, labelText) => {
    const { base, riders } = build(isCrit);
    const title = `${name} ${isCrit ? "critical " : ""}damage`;
    actions.push({ label: labelText, run: () => rollFromInput(title, base, "normal") });
    riders.forEach(rider => actions.push({ label: `${labelText} + ${rider.name}`, run: () => rollFromInput(`${title} + ${rider.name}`, `${base}+${rider.formula}`, "normal") }));
    if (riders.length > 1) {
      actions.push({ label: `${labelText} + all`, run: () => rollFromInput(`${title} + ${riders.map(rider => rider.name).join(" + ")}`, [base, ...riders.map(rider => rider.formula)].join("+"), "normal") });
    }
    smiteActions(isCrit, options).forEach(action => actions.push(action));
  };
  add(crit, crit ? `Roll crit damage${Number(natural) < 20 ? ` (${natural})` : ""}` : "Roll damage");
  if (curseCrit) add(true, "Crit damage (19, cursed target)");
  return actions;
}

// Divine Smite (PHB p.85): after a melee weapon hit, spend a slot for 2d8 radiant +1d8 per slot level above 1st (max 5d8).
function smiteActions(isCrit, options) {
  if (currentClass().id !== "paladin" || character.level < 2 || !options.weapon || !options.melee) return [];
  const slots = characterSpellSlots();
  const open = slots.map((count, index) => index + 1).filter(level => slotRemaining(level, slots[level - 1] || 0) > 0);
  if (!open.length) return [];
  const choices = [...new Set([open[0], open[open.length - 1]])];
  return choices.map(level => {
    const dice = Math.min(5, level + 1);
    const formula = `${isCrit ? dice * 2 : dice}d8`;
    return {
      label: `Divine Smite (${ordinal(level)} slot)`,
      run: () => {
        const max = slots[level - 1] || 0;
        const used = Number(character.spellSlotUsage?.[level] || 0);
        if (used >= max) return;
        character.spellSlotUsage[level] = used + 1;
        persistAndRender();
        rollFromInput(`Divine Smite (${ordinal(level)}-level slot)`, formula, "normal", [], "Radiant damage. Add 1d8 (2d8 on a crit) if the target is undead or a fiend.");
      }
    };
  });
}

// Fighter/paladin/ranger fighting styles that change numbers (PHB p.72).
const FIGHTING_STYLES = ["Archery", "Defense", "Dueling", "Great Weapon Fighting", "Protection", "Two-Weapon Fighting"];

function extraAttacks() {
  const cls = currentClass().id;
  const level = character.level;
  if (cls === "fighter") return level >= 20 ? 4 : level >= 11 ? 3 : level >= 5 ? 2 : 1;
  if (["barbarian", "bloodhunter", "monk", "paladin", "ranger"].includes(cls) && level >= 5) return 2;
  // Subclass Extra Attack: Valor/Swords bards and Bladesingers at 6th, Battle Smith/Armorer artificers at 5th.
  if (level >= 6 && lookupBySubclass({ valor: true, swords: true, bladesinging: true })) return 2;
  if (level >= 5 && lookupBySubclass({ "battle-smith": true, armorer: true })) return 2;
  return 1;
}

// One generated action per way of wielding the weapon (versatile weapons get a two-handed row).
function weaponActions(item) {
  const notes = String(item.notes || "");
  const die = notes.match(/\b(\d+d\d+)\b/)?.[1];
  if (!die) return [];
  const text = `${item.name} ${notes}`.toLowerCase();
  const versatile = notes.match(/versatile\s*\(?\s*(\d+d\d+)/i)?.[1];
  const grips = [{ grip: "", die }];
  if (versatile) grips.push({ grip: "two-handed", die: versatile });
  return grips.map(entry => weaponAction(item, entry.grip, entry.die, text)).filter(Boolean);
}

function weaponAction(item, grip = "", die = "", text = `${item.name} ${item.notes || ""}`.toLowerCase()) {
  const notes = String(item.notes || "");
  die = die || notes.match(/\b(\d+d\d+)\b/)?.[1];
  if (!die) return null;
  const traits = weaponTraits(text);
  const notes2 = [];
  let ability = traits.ranged ? "dex" : traits.finesse && mod("dex") > mod("str") ? "dex" : "str";
  // Martial Arts: monk weapons (simple melee or shortsword, not heavy/two-handed) use DEX and the Martial Arts die.
  const monkWeapon = currentClass().id === "monk" && !traits.ranged && !traits.heavy && !traits.twoHanded && (/simple/.test(text) || /shortsword/.test(text));
  if (monkWeapon) {
    if (mod("dex") > mod(ability)) ability = "dex";
    const martial = character.level >= 17 ? 10 : character.level >= 11 ? 8 : character.level >= 5 ? 6 : 4;
    const [count, sides] = die.split("d").map(Number);
    if (count === 1 && sides < martial) die = `1d${martial}`;
    notes2.push("Martial Arts.");
  }
  // Hex Warrior: a Hexblade uses Charisma with a one-handed weapon.
  const hexWarrior = lookupBySubclass({ hexblade: true }) && !traits.twoHanded && mod("cha") > mod(ability);
  if (hexWarrior) {
    ability = "cha";
    notes2.push("Hex Warrior: uses Charisma.");
  }
  const magic = itemMagicBonus(item);
  let toHit = proficiencyBonus() + mod(ability) + magic;
  let damageBonus = mod(ability) + magic;
  let rerolls = "";
  const style = fightingStyle();
  if (style === "Archery" && traits.ranged) {
    toHit += 2;
    notes2.push("Archery +2.");
  }
  if (style === "Dueling" && !traits.ranged && !traits.twoHanded && grip !== "two-handed") {
    damageBonus += 2;
    notes2.push("Dueling +2 (no other weapon in hand).");
  }
  if (style === "Great Weapon Fighting" && !traits.ranged && (traits.twoHanded || grip === "two-handed")) {
    rerolls = "r2";
    notes2.push("Great Weapon Fighting: reroll 1s and 2s once.");
  }
  const attacks = extraAttacks();
  if (attacks > 1) notes2.push(`Attack action: ${attacks} attacks.`);
  const damageType = notes.match(/\d+d\d+\s+([a-z]+)/i)?.[1] || "";
  return {
    id: crypto.randomUUID(),
    name: `${item.name || "Weapon"}${grip ? ` (${grip})` : ""}`,
    type: "Action",
    attack: formatMod(toHit),
    damage: `${die}${rerolls}${formatMod(damageBonus)}${damageType ? ` ${damageType}` : ""}`,
    notes: `${notes2.join(" ")} Assumes proficiency. ${notes}`.trim(),
    source: { weapon: item.id, grip, ability }
  };
}

// Class features that act at the table. "use" describes what the Use button does and what it spends.
function featureActions() {
  const cls = currentClass();
  const level = character.level;
  const prof = proficiencyBonus();
  const actions = [];
  const add = (key, fields) => actions.push({ id: crypto.randomUUID(), attack: "", damage: "", notes: "", ...fields, source: { feature: key } });
  if (cls.id === "barbarian") {
    const bonus = level >= 16 ? 4 : level >= 9 ? 3 : 2;
    add("rage", { name: "Rage", type: "Bonus Action", notes: `+${bonus} STR melee damage, resistance to bludgeoning, piercing and slashing, advantage on STR checks and saves. 1 minute.`, use: { cost: level >= 20 ? null : ["Rage", 1], kind: "rage" } });
  }
  if (cls.id === "monk") {
    const die = level >= 17 ? 10 : level >= 11 ? 8 : level >= 5 ? 6 : 4;
    const ability = Math.max(mod("str"), mod("dex"));
    const strike = { attack: formatMod(prof + ability), damage: `1d${die}${formatMod(ability)} bludgeoning` };
    add("unarmed", { name: "Unarmed Strike", type: "Action", ...strike, notes: `Martial Arts d${die}.` });
    add("unarmed-bonus", { name: "Unarmed Strike (bonus)", type: "Bonus Action", ...strike, notes: "Martial Arts: after you take the Attack action." });
    if (level >= 2) {
      add("flurry", { name: "Flurry of Blows", type: "Bonus Action", ...strike, notes: "Two unarmed strikes after you take the Attack action.", use: { cost: ["Ki Points", 1], kind: "attacks", attacks: 2 } });
      add("patient-defense", { name: "Patient Defense", type: "Bonus Action", notes: "Take the Dodge action as a bonus action.", use: { cost: ["Ki Points", 1], kind: "note", text: "Dodging: attacks against you have disadvantage and you make DEX saves with advantage until your next turn." } });
      add("step-of-the-wind", { name: "Step of the Wind", type: "Bonus Action", notes: "Disengage or Dash as a bonus action.", use: { cost: ["Ki Points", 1], kind: "note", text: "Disengage or Dash as a bonus action, and your jump distance doubles this turn." } });
    }
    if (level >= 3) {
      add("deflect-missiles", { name: "Deflect Missiles", type: "Reaction", notes: "Reduce the damage of a ranged weapon attack that hits you.", use: { kind: "roll", roll: `1d10${formatMod(mod("dex") + level)}`, text: "Reduce the damage by this much. If it drops to 0 you catch the missile and can spend 1 ki to throw it back." } });
    }
    if (level >= 5) {
      const dc = 8 + prof + mod("wis");
      add("stunning-strike", { name: "Stunning Strike", type: "Free", notes: `After a melee hit: CON save DC ${dc} or stunned.`, use: { cost: ["Ki Points", 1], kind: "note", text: `The target makes a Constitution save, DC ${dc}. On a failure it is stunned until the end of your next turn.` } });
    }
  }
  if (cls.id === "rogue") {
    if (level >= 2) add("cunning-action", { name: "Cunning Action", type: "Bonus Action", notes: "Dash, Disengage, or Hide as a bonus action.", use: { kind: "cunning" } });
    if (level >= 5) add("uncanny-dodge", { name: "Uncanny Dodge", type: "Reaction", notes: "Halve the damage of an attack that hits you.", use: { kind: "uncanny" } });
  }
  if (cls.id === "fighter") {
    add("second-wind", { name: "Second Wind", type: "Bonus Action", notes: `Regain 1d10+${level} HP.`, use: { cost: ["Second Wind", 1], kind: "heal", roll: `1d10+${level}` } });
    if (level >= 2) add("action-surge", { name: "Action Surge", type: "Free", notes: "One additional action this turn.", use: { cost: ["Action Surge", 1], kind: "note", text: "Take one additional action on this turn." } });
    if (level >= 3 && lookupBySubclass({ "battle-master": true })) {
      const die = level >= 18 ? 12 : level >= 10 ? 10 : 8;
      const dc = 8 + prof + Math.max(mod("str"), mod("dex"));
      add("superiority", { name: "Superiority Die", type: "Free", notes: `Maneuver save DC ${dc}.`, use: { cost: ["Superiority Dice", 1], kind: "roll", roll: `1d${die}`, text: `Add it as your maneuver says (attack, damage, or AC). Maneuver save DC ${dc}.` } });
    }
  }
  if (cls.id === "sorcerer") {
    if (level >= 2) add("flexible-casting", { name: "Flexible Casting", type: "Bonus Action", notes: "Turn sorcery points into a spell slot, or a slot into points.", use: { kind: "flexible" } });
    if (level >= 3) add("metamagic", { name: "Metamagic", type: "Free", notes: "Spend sorcery points to change a spell as you cast it.", use: { kind: "metamagic" } });
  }
  if (cls.id === "druid" && level >= 2) {
    add("wild-shape", { name: "Wild Shape", type: lookupBySubclass({ moon: true }) ? "Bonus Action" : "Action", notes: "Become a beast. Its HP absorb damage first.", use: { cost: ["Wild Shape", 1], kind: "wildshape" } });
  }
  return actions;
}

// Class feature rows appear on their own, like class resources. Removing one keeps it removed.
function ensureFeatureActions() {
  const dismissed = new Set(character.dismissedFeatures || []);
  const present = new Set(character.actions.map(action => action.source?.feature).filter(Boolean));
  const names = new Set(character.actions.map(action => String(action.name || "").toLowerCase()));
  const missing = featureActions().filter(action => !present.has(action.source.feature) && !dismissed.has(action.source.feature) && !names.has(action.name.toLowerCase()));
  if (!missing.length) return;
  character.actions.push(...missing);
  persist();
}

function useFeatureAction(action, confirmed = false) {
  const use = action.use;
  if (!use) return;
  if (!confirmed && blockedByIncapacitation(() => useFeatureAction(action, true))) return;
  const name = action.name || "Feature";
  let spent = null;
  if (use.cost) {
    const [resourceName, amount] = use.cost;
    const resource = character.resources.find(item => item.name === resourceName);
    if (!resource || Number(resource.current) < amount) {
      showToast(`<span class="toast-label">No ${escapeHtml(resourceName)} left</span><span>${resource ? `${resource.current}/${resource.max}. Rest to recover.` : "This sheet doesn't track it yet."}</span>`, { tone: "fumble" });
      return;
    }
    resource.current = Number(resource.current) - amount;
    spent = { resource, amount };
    persistAndRender();
  }
  const status = spent ? `${spent.resource.name} ${spent.resource.current}/${spent.resource.max}` : "";
  const refund = () => {
    if (!spent) return;
    spent.resource.current = Math.min(Number(spent.resource.max), Number(spent.resource.current) + spent.amount);
  };
  const undo = spent ? [{ label: "Undo", run: () => { refund(); persistAndRender(); } }] : [];
  if (use.kind === "attacks") {
    const strike = index => rollActionAttack(action, ` ${index} of ${use.attacks}${index === 1 && status ? ` (${status})` : ""}`, true,
      index < use.attacks ? { label: `Next strike (${index + 1} of ${use.attacks})`, run: () => strike(index + 1) } : null);
    strike(1);
    return;
  }
  if (use.kind === "heal") {
    rollFromInput(`${name}${status ? ` (${status})` : ""}`, use.roll, "normal", [], "", result => {
      healBy(result.total);
      return `Healed: ${character.hp}/${effectiveMaxHp()} HP.`;
    });
    return;
  }
  if (use.kind === "roll") {
    rollFromInput(`${name}${status ? ` (${status})` : ""}`, use.roll, "normal", undo, use.text);
    return;
  }
  if (use.kind === "note") {
    showToast(`<span class="toast-label">${escapeHtml(name)}</span><span>${escapeHtml(use.text)}${status ? ` ${escapeHtml(status)}.` : ""}</span>`, { actions: undo, duration: 9000 });
    return;
  }
  if (use.kind === "cunning") {
    showToast(`<span class="toast-label">Cunning Action</span><span>Dash, Disengage, or Hide as a bonus action.</span>`, { actions: [{ label: "Hide (Stealth)", run: () => rollSkillCheck("stealth") }] });
    return;
  }
  if (use.kind === "rage") {
    if (character.raging) {
      refund();
      character.raging = false;
      persistAndRender();
      showToast(`<span class="toast-label">Rage ends</span><span>No longer raging.</span>`);
      return;
    }
    if (character.concentration) {
      refund();
      persistAndRender();
      showToast(`<span class="toast-label">Can't rage while concentrating</span><span>You're concentrating on ${escapeHtml(character.concentration)}. Raging would end it, and you can't cast or concentrate on spells while raging.</span>`, { tone: "fumble", actions: [{ label: "Drop it and rage", run: () => { character.concentration = ""; useFeatureAction(action, true); } }] });
      return;
    }
    character.raging = true;
    persistAndRender();
    showToast(`<span class="toast-label">Raging</span><span>${escapeHtml(action.notes)}${status ? ` ${escapeHtml(status)}.` : ""}</span>`, { actions: [...undo.map(item => ({ ...item, run: () => { character.raging = false; item.run(); } })), { label: "End rage", run: () => { character.raging = false; persistAndRender(); } }], duration: 9000 });
    return;
  }
  if (use.kind === "uncanny") {
    halveLastDamage();
    return;
  }
  if (use.kind === "metamagic") {
    metamagicMenu();
    return;
  }
  if (use.kind === "flexible") {
    flexibleCastingMenu();
    return;
  }
  if (use.kind === "wildshape") {
    character.wildShape = { name: "Beast form", hp: 0, max: 0 };
    persistAndRender();
    document.querySelector('[data-wild-shape="max"]')?.focus();
    showToast(`<span class="toast-label">Wild Shape</span><span>${escapeHtml(wildShapeLimit())} Enter the beast's hit points in the Beast form row under Hit points. ${escapeHtml(status)}.</span>`, {
      actions: [{ label: "Undo", run: () => { refund(); character.wildShape = null; persistAndRender(); } }],
      duration: 9000
    });
  }
}

// Beast Shapes (PHB p.66) and Circle Forms (Moon): the highest CR and movement a druid can take.
function wildShapeLimit() {
  const level = character.level;
  const moon = lookupBySubclass({ moon: true });
  const base = level >= 8 ? 1 : level >= 4 ? 0.5 : 0.25;
  const cr = moon ? Math.max(1, Math.floor(level / 3)) : base;
  const label = cr === 0.25 ? "1/4" : cr === 0.5 ? "1/2" : String(cr);
  const movement = level >= 8 ? "any movement" : level >= 4 ? "no flying speed" : "no flying or swimming speed";
  return `Max CR ${label}, ${movement}. Lasts up to ${Math.floor(level / 2)} hours.`;
}

function sorceryPoints() {
  return character.resources.find(item => item.name === "Sorcery Points");
}

function spendSorceryPoints(amount, label) {
  const points = sorceryPoints();
  if (!points || Number(points.current) < amount) {
    showToast(`<span class="toast-label">Not enough sorcery points</span><span>${points ? `${points.current}/${points.max}` : "Not tracked."}</span>`, { tone: "fumble" });
    return false;
  }
  points.current = Number(points.current) - amount;
  persistAndRender();
  showToast(`<span class="toast-label">${escapeHtml(label)}</span><span>Sorcery points ${points.current}/${points.max}</span>`, {
    actions: [{ label: "Undo", run: () => { points.current = Math.min(Number(points.max), Number(points.current) + amount); persistAndRender(); } }]
  });
  return true;
}

function metamagicMenu() {
  const points = sorceryPoints();
  const twinned = Math.max(1, Number(character.lastCastLevel || 1));
  const options = [["Careful", 1], ["Distant", 1], ["Empowered", 1], ["Extended", 1], ["Heightened", 3], ["Quickened", 2], ["Subtle", 1], ["Twinned", twinned]];
  const affordable = options.filter(([, cost]) => cost <= Number(points?.current || 0));
  showToast(`<span class="toast-label">Metamagic</span><span>${points ? `${points.current}/${points.max} sorcery points. Twinned costs ${twinned} (the level of your last spell).` : "Sorcery points aren't tracked on this sheet."}</span>`, {
    actions: affordable.map(([name, cost]) => ({ label: `${name} (${cost})`, run: () => spendSorceryPoints(cost, `${name} Spell`) })),
    duration: 15000
  });
}

// Flexible Casting (PHB p. 101): create a slot (2/3/5/6/7 points for 1st-5th) or burn a slot for its level in points.
const SLOT_POINT_COST = { 1: 2, 2: 3, 3: 5, 4: 6, 5: 7 };

function flexibleCastingMenu() {
  const points = sorceryPoints();
  if (!points) {
    showToast(`<span class="toast-label">Flexible Casting</span><span>Sorcery points aren't tracked on this sheet.</span>`);
    return;
  }
  const slots = characterSpellSlots();
  const actions = [];
  Object.entries(SLOT_POINT_COST).forEach(([level, cost]) => {
    const spent = Number(character.spellSlotUsage?.[level] || 0);
    // A created slot can exceed the normal maximum; it's gone after a long rest (PHB p.101).
    if (slots[Number(level) - 1] > 0 && cost <= Number(points.current)) {
      actions.push({ label: `Make a ${ordinal(Number(level))}-level slot (${cost})`, run: () => {
        points.current = Number(points.current) - cost;
        character.spellSlotUsage[level] = spent - 1;
        persistAndRender();
        showToast(`<span class="toast-label">${ordinal(Number(level))}-level slot created</span><span>Sorcery points ${points.current}/${points.max}</span>`);
      } });
    }
  });
  slots.forEach((count, index) => {
    const level = index + 1;
    if (!count || slotRemaining(level, count) <= 0 || Number(points.current) >= Number(points.max)) return;
    actions.push({ label: `Burn a ${ordinal(level)}-level slot (+${level})`, run: () => {
      character.spellSlotUsage[level] = Number(character.spellSlotUsage?.[level] || 0) + 1;
      points.current = Math.min(Number(points.max), Number(points.current) + level);
      persistAndRender();
      showToast(`<span class="toast-label">${ordinal(level)}-level slot burned</span><span>Sorcery points ${points.current}/${points.max}</span>`);
    } });
  });
  showToast(`<span class="toast-label">Flexible Casting</span><span>${points.current}/${points.max} sorcery points.${actions.length ? "" : " Nothing to convert right now."}</span>`, { actions, duration: 15000 });
}

// Speed shown in play mode: the stored base plus class and feat bonuses, then conditions and exhaustion.
function effectiveSpeed() {
  return speedBreakdown().speed;
}

function speedBreakdown() {
  const base = Number(character.speed || 0);
  const level = Number(character.level || 1);
  const cls = currentClass().id;
  const worn = (character.equipment || []).filter(item => item.equipped || item.container === "equipped");
  const armor = worn.find(item => /\bAC\s+\d+/i.test(item.notes || "") && !/shield/i.test(item.name || ""));
  const notes = [];
  let speed = base;
  if (cls === "monk" && level >= 2 && !armor && !worn.some(item => /shield/i.test(item.name || ""))) {
    const bonus = level >= 18 ? 30 : level >= 14 ? 25 : level >= 10 ? 20 : level >= 6 ? 15 : 10;
    speed += bonus;
    notes.push(`+${bonus} ft Unarmored Movement`);
  }
  if (cls === "barbarian" && level >= 5 && !/heavy/i.test(armor?.notes || "")) {
    speed += 10;
    notes.push("+10 ft Fast Movement");
  }
  if (hasFeat("Mobile")) {
    speed += 10;
    notes.push("+10 ft Mobile");
  }
  const conditions = character.conditions || [];
  const exhaustion = Number(character.exhaustion || 0);
  if (["Grappled", "Restrained", "Paralyzed", "Petrified", "Stunned", "Unconscious"].some(name => conditions.includes(name)) || exhaustion >= 5) {
    notes.push(exhaustion >= 5 ? "0 ft: exhaustion 5" : "0 ft: condition");
    return { speed: 0, base, notes };
  }
  if (exhaustion >= 2) {
    speed = Math.floor(speed / 2);
    notes.push("halved: exhaustion 2");
  }
  return { speed, base, notes };
}

// Fighting style chosen on the sheet, or named in features ("Fighting Style: Archery").
function fightingStyle() {
  if (character.fightingStyle) return character.fightingStyle;
  const text = `${character.features || ""}\n${(character.classOptions || []).map(item => item.name).join("\n")}`;
  return FIGHTING_STYLES.find(style => new RegExp(`fighting style[^\\n]*${style}`, "i").test(text)) || "";
}

function hasFightingStyle() {
  const cls = currentClass().id;
  return (cls === "fighter") || (["paladin", "ranger"].includes(cls) && character.level >= 2) || (cls === "bard" && character.level >= 3 && lookupBySubclass({ swords: true }));
}

function spellAction(row) {
  const detail = spellDetails[row.index] || {};
  const text = [detail.desc].flat().filter(Boolean).join(" ");
  const dice = text.match(/\b\d+d\d+\b/)?.[0];
  const save = spellSaveAbility(text);
  const attack = /spell attack/i.test(text);
  if (!dice && !save && !attack) return null;
  const level = spellLevelForRow(row);
  const castType = castingShorthand(detail.casting_time);
  const effect = spellEffectRoll(row, level);
  return {
    id: crypto.randomUUID(),
    name: spellDisplayName(row),
    type: castType === "B" ? "Bonus Action" : castType === "R" ? "Reaction" : "Action",
    attack: save ? `DC ${document.querySelector("#spellDc")?.textContent || "-"} ${save.slice(0, 3).toUpperCase()}` : attack ? document.querySelector("#spellAttack")?.textContent || "" : "",
    damage: effect?.chip || dice || "",
    notes: `${level === 0 ? "Cantrip" : `${ordinal(level)}-level spell`} from your spell list.`,
    source: { spell: row.index }
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
  featureActions().forEach(add);
  (character.equipment || []).filter(item => item.equipped || item.container === "equipped").forEach(item => weaponActions(item).forEach(add));
  character.spells.filter(spellRowHasSpell).forEach(row => add(spellAction(row)));
  character.actions.push(...generated);
  persistAndRender();
  showToast(`<span class="toast-label">Generate Actions</span><span>${generated.length ? `Added ${generated.map(action => escapeHtml(action.name)).join(", ")}.` : "Nothing new to add: equip a weapon in Inventory or add damaging spells."}</span>`, { duration: 8000 });
}
