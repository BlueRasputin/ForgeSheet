// RAW uses and recharge timing for each class's core limited features (2014 rules).
function classFeatureTrackers(cls = currentClass(), level = character.level, subclassName = primarySubclassKey(), shared = true) {
  const chaMod = Math.max(1, mod("cha"));
  const prof = proficiencyBonus();
  const byClass = {
    fighter: [
      ["Second Wind", 1, "short"],
      level >= 2 ? ["Action Surge", level >= 17 ? 2 : 1, "short"] : null,
      level >= 9 ? ["Indomitable", level >= 17 ? 3 : level >= 13 ? 2 : 1, "long"] : null,
      // Psi Warrior (TCE p.43): a bonus action regains one Psionic Energy die, once per short or long rest.
      level >= 3 && lookupBySubclass({ "psi-warrior": true }, subclassName) ? ["Psionic Energy Recovery", 1, "short"] : null
    ],
    monk: [level >= 2 ? ["Ki Points", level, "short"] : null],
    // Archdruid (20): unlimited Wild Shape, so no tracker.
    druid: [level >= 2 && level < 20 ? ["Wild Shape", 2, "short"] : null],
    cleric: [
      level >= 2 ? ["Channel Divinity", level >= 18 ? 3 : level >= 6 ? 2 : 1, "short"] : null,
      // PHB p.59: after a success, not again for 7 days ("manual" until then); after a failure, again after a long rest.
      level >= 10 ? ["Divine Intervention", 1, character.divineInterventionLocked ? "manual" : "long"] : null,
      optionalRule("tashas") && level >= 2 ? ["Harness Divine Power", level >= 18 ? 3 : level >= 6 ? 2 : 1, "long"] : null
    ],
    paladin: [
      // Divine Sense has no minimum: CHA 8-9 gives 0 uses (PHB p.84).
      ["Divine Sense", Math.max(0, 1 + mod("cha")), "long"],
      ["Lay on Hands (HP pool)", level * 5, "long"],
      level >= 3 ? ["Channel Divinity", 1, "short"] : null,
      // Cleansing Touch (PHB p.85); Harness Divine Power is a Tasha's optional feature (TCE p.53).
      level >= 14 ? ["Cleansing Touch", chaMod, "long"] : null,
      level >= 3 && optionalRule("tashas") ? ["Harness Divine Power", level >= 15 ? 3 : level >= 7 ? 2 : 1, "long"] : null
    ],
    // Tasha's optional ranger features (TCE p.56-57): Favored Foe, Deft Explorer's Tireless, Nature's Veil, Primal Awareness.
    ranger: [
      rangerOption("favoredFoe") ? ["Favored Foe", prof, "long"] : null,
      rangerOption("deftExplorer") && level >= 10 ? ["Tireless", prof, "long"] : null,
      rangerOption("naturesVeil") && level >= 10 ? ["Nature's Veil", prof, "long"] : null,
      ...(rangerOption("primalAwareness") ? [[3, "speak with animals"], [5, "beast sense"], [9, "speak with plants"], [13, "locate creature"], [17, "commune with nature"]] : [])
        .filter(([gate]) => level >= gate).map(([, spell]) => [`Primal Awareness: ${spell}`, 1, "long"])
    ],
    bard: [["Bardic Inspiration", chaMod, level >= 5 ? "short" : "long"]],
    sorcerer: [level >= 2 ? ["Sorcery Points", level, "long"] : null],
    // Primal Champion (20): unlimited rages, so no tracker.
    barbarian: [level < 20 ? ["Rage", level >= 17 ? 6 : level >= 12 ? 5 : level >= 6 ? 4 : level >= 3 ? 3 : 2, "long"] : null],
    rogue: [level >= 20 ? ["Stroke of Luck", 1, "short"] : null],
    // Mystic Arcanum: one 6th/7th/8th/9th-level spell each per long rest, at 11/13/15/17.
    warlock: [
      ...[[11, 6], [13, 7], [15, 8], [17, 9]].filter(([gate]) => level >= gate).map(([, spellLevel]) => [`Mystic Arcanum (${ordinal(spellLevel)})`, 1, "long"]),
      level >= 20 ? ["Eldritch Master", 1, "long"] : null,
      optionalRule("tashas") && level >= 3 && classChoiceNames("pactBoon").some(name => /talisman/i.test(name)) ? ["Pact of the Talisman", prof, "long"] : null
    ],
    // Signature Spells (wizard 20) are tracked per flagged spell row (spells.js ensureSpellTrackers).
    wizard: [["Arcane Recovery", 1, "long"]],
    artificer: [
      // Infuse Item (TCE p.12): a count of items infused at once, not a pool that rests refill.
      level >= 2 ? ["Infused Items", level >= 18 ? 6 : level >= 14 ? 5 : level >= 10 ? 4 : level >= 6 ? 3 : 2, "manual"] : null,
      level >= 7 ? ["Flash of Genius", Math.max(1, mod("int")), "long"] : null,
      level >= 11 ? ["Spell-Storing Item", Math.max(2, 2 * mod("int")), "long"] : null
    ],
    bloodhunter: [
      ["Blood Maledict", level >= 17 ? 4 : level >= 13 ? 3 : level >= 6 ? 2 : 1, "short"],
      level >= 6 ? ["Brand of Castigation", 1, "short"] : null
    ]
  };
  const extra = lookupBySubclass(SUBCLASS_EXTRAS, subclassName);
  const extras = (!extra?.classId || extra.classId === cls.id) ? extra?.trackers?.(level, prof) || [] : [];
  // Feat and species pools (Lucky, Martial Adept, Breath Weapon...) and custom feat trackers: builder.js grantTrackers.
  const feats = shared ? grantTrackers(prof) : [];
  if (cls.id === "druid" && level >= 2 && lookupBySubclass({ land: true }, subclassName)) extras.push(["Natural Recovery", 1, "long"]);
  // A custom class's own resources and Mystic Arcanum (classes.js customClassTrackers); a 4th number is the resource's die.
  // A 2024 class takes its pools from the SRD 5.2 table instead of the 2014 numbers above.
  return [...(cls.srd2024 ? trackers2024(cls, level) : byClass[cls.id] || []), ...customClassTrackers(cls, level, prof), ...extras, ...feats].filter(Boolean)
    .map(([name, max, reset, die, label]) => ({ name, max, reset, ...(Number(die) > 0 ? { die: Number(die) } : {}), ...(label ? { label } : {}) }));
}

// 2024 class pools (SRD 5.2). "shortOne": one use back on a short rest, all on a long rest (Rage, Channel Divinity,
// Wild Shape, Second Wind). Names match the 2014 trackers so the Use buttons keep working; a 5th entry is the 2024 label.
function trackers2024(cls, level) {
  const rows = cls.srd2024.levels.slice(0, level);
  const at = rows[rows.length - 1]?.specific || {};
  const times = name => rows.filter(row => row.features.some(feature => feature.name === name)).length;
  const chaMod = Math.max(1, mod("cha"));
  const byClass = {
    barbarian: [["Rage", at.rage_count, "shortOne"]],
    bard: [["Bardic Inspiration", chaMod, times("Font of Inspiration") ? "short" : "long", at.bardic_inspiration_die]],
    cleric: [
      at.channel_divinity_charges ? ["Channel Divinity", at.channel_divinity_charges, "shortOne"] : null,
      times("Divine Intervention") ? ["Divine Intervention", 1, "long"] : null
    ],
    druid: [at.wild_shape_uses ? ["Wild Shape", at.wild_shape_uses, "shortOne"] : null],
    fighter: [
      ["Second Wind", at.second_wind_uses, "shortOne"],
      times("Action Surge") ? ["Action Surge", times("Action Surge"), "short"] : null,
      times("Indomitable") ? ["Indomitable", times("Indomitable"), "long"] : null
    ],
    monk: [at.focus_points ? ["Ki Points", at.focus_points, "short", 0, "Focus Points"] : null],
    paladin: [
      ["Lay on Hands (HP pool)", level * 5, "long"],
      at.channel_divinity_charges ? ["Channel Divinity", at.channel_divinity_charges, "shortOne"] : null
    ],
    // Favored Enemy: Hunter's Mark without a slot this many times per long rest.
    ranger: [at.favored_enemies ? ["Favored Enemy (Hunter's Mark)", at.favored_enemies, "long"] : null],
    rogue: [times("Stroke of Luck") ? ["Stroke of Luck", 1, "short"] : null],
    sorcerer: [
      times("Innate Sorcery") ? ["Innate Sorcery", 2, "long"] : null,
      at.sorcery_points ? ["Sorcery Points", at.sorcery_points, "long"] : null
    ],
    warlock: [
      times("Magical Cunning") ? ["Magical Cunning", 1, "long"] : null,
      ...[[11, 6], [13, 7], [15, 8], [17, 9]].filter(([gate]) => level >= gate).map(([, spellLevel]) => [`Mystic Arcanum (${ordinal(spellLevel)})`, 1, "long"])
    ],
    wizard: [["Arcane Recovery", 1, "long"]]
  };
  return byClass[cls.id] || [];
}

// Every class's trackers, multiclass levels included. A feature two classes share keeps the larger pool.
function allClassTrackers() {
  const byName = new Map();
  const secondary = (character.multiclasses || []).flatMap(entry => classFeatureTrackers(entryClass({ ...entry, key: entry.id }), entry.level, subclassIndexFor(entry) || entry.subclassName, false));
  const pact = multiclassPactTracker();
  [...classFeatureTrackers(), ...secondary, ...(pact ? [{ name: pact[0], max: pact[1], reset: pact[2] }] : []), ...combatTrackers()].forEach(tracker => {
    if (!byName.has(tracker.name) || byName.get(tracker.name).max < tracker.max) byName.set(tracker.name, tracker);
  });
  // Martial Adept and Superior Technique add a die to any Battle Master dice (PHB p.168, TCE p.41).
  const extraDice = superiorityDiceBonus();
  if (extraDice) byName.set("Superiority Dice", { name: "Superiority Dice", max: (byName.get("Superiority Dice")?.max || 0) + extraDice, reset: "short" });
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
      if (existing.max !== feature.max || existing.reset !== feature.reset || existing.die !== feature.die || existing.label !== feature.label) {
        existing.current = clamp(Number(existing.current || 0) + Math.max(0, feature.max - existing.max), 0, feature.max);
        existing.max = feature.max;
        existing.reset = feature.reset;
        if (feature.die) existing.die = feature.die;
        else delete existing.die;
        if (feature.label) existing.label = feature.label;
        else delete existing.label;
        changed = true;
      }
      return;
    }
    character.resources.push({ id: crypto.randomUUID(), name: feature.name, current: feature.max, max: feature.max, reset: feature.reset, auto: true, ...(feature.die ? { die: feature.die } : {}), ...(feature.label ? { label: feature.label } : {}) });
    changed = true;
  });
  if (changed) persist();
}

// The die a resource spends, when it has one (Bardic Inspiration, Superiority and Psionic Energy dice).
function resourceDie(name) {
  // A Bardic Inspiration die another sheet gave you.
  const held = (character.resources || []).find(item => item.name === name && item.die);
  if (held) return Number(held.die);
  const level = subclassLevel("psi-warrior", "soulknife");
  const bard = classLevel("bard");
  const fighter = classLevel("fighter");
  if (name === "Bardic Inspiration" && bard) return bard >= 15 ? 12 : bard >= 10 ? 10 : bard >= 5 ? 8 : 6;
  // Without Battle Master levels, Martial Adept and Superior Technique dice are d6s.
  if (name === "Superiority Dice") return !subclassLevel("battle-master") ? 6 : fighter >= 18 ? 12 : fighter >= 10 ? 10 : 8;
  if (name === "Psionic Energy Dice") return level >= 17 ? 12 : level >= 11 ? 10 : level >= 5 ? 8 : 6;
  return 0;
}

// Martial Arts die: d4-d10 in 2014 (PHB p.78); d6-d12 for a 2024 monk (SRD 5.2 table).
function martialArtsDie(level = classLevel("monk")) {
  const monk = classEntries().find(entry => entry.classId === "monk");
  const srd = monk ? entryClass(monk).srd2024 : null;
  if (srd) return Number(srd.levels[clamp(level, 1, 20) - 1]?.specific.martial_arts_die) || 6;
  return level >= 17 ? 10 : level >= 11 ? 8 : level >= 5 ? 6 : 4;
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
    const recharge = { short: "SR", long: "LR", shortOne: "SR+1" }[item.reset] || "";
    const label = item.label || item.name;
    // Up to 10 uses read best as pips; bigger pools (Ki, Lay on Hands) get a stepper.
    const counter = max <= 10
      ? `<span class="res-pips" role="group" aria-label="${escapeHtml(label)}: ${current} of ${max}">${Array.from({ length: max }, (_, index) => `<button type="button" class="res-pip ${index < current ? "filled" : ""}" data-res-pip="${index}" aria-pressed="${index < current}" aria-label="${escapeHtml(label)} use ${index + 1}"></button>`).join("")}</span>`
      : `<span class="res-stepper"><button type="button" class="ghost" data-res-step="-1" aria-label="Spend one ${escapeHtml(label)}">${icon("minus")}</button><b>${current}/${max}</b><button type="button" class="ghost" data-res-step="1" aria-label="Regain one ${escapeHtml(label)}">${icon("plus")}</button></span>`;
    return `
      <div class="side-resource ${current ? "" : "is-spent"}" data-res-id="${escapeHtml(item.id)}">
        <span class="res-name">${escapeHtml(label)}${die ? ` <em>d${die}</em>` : ""}</span>
        ${recharge ? `<span class="res-recharge" title="${{ SR: "Refills on a short or long rest", LR: "Refills on a long rest", "SR+1": "One back on a short rest, all on a long rest" }[recharge]}">${recharge}</span>` : ""}
        ${counter}
        ${item.name === "Portent" && character.portentDice?.length ? `<span class="res-portent">${character.portentDice.map((value, index) => `<button type="button" class="ghost" data-portent-use="${index}" aria-label="Use portent die ${value}">${value}</button>`).join("")}</span>` : ""}
        ${die && item.name !== "Bardic Inspiration" ? `<button type="button" class="ghost res-roll" data-res-roll ${current ? "" : "disabled"} title="Spend one and roll a d${die}">${icon("dice-five")}<span class="visually-hidden">Roll</span></button>` : ""}
      </div>`;
  }).join("");
}

function handleSideResourceClick(event) {
  const portent = event.target.closest("[data-portent-use]");
  if (portent) {
    usePortentDie(Number(portent.dataset.portentUse));
    return;
  }
  const row = event.target.closest("[data-res-id]");
  const resource = row && character.resources.find(item => item.id === row.dataset.resId);
  if (!resource) return;
  const max = Number(resource.max || 0);
  const pip = event.target.closest("[data-res-pip]");
  if (pip) {
    const value = Number(pip.dataset.resPip) + 1;
    // Spending Arcane/Natural Recovery means picking the slots it recovers.
    if (value <= Number(resource.current) && recoveryFeatures().some(feature => feature.name === resource.name)) {
      useArcaneRecovery(resource.name);
      return;
    }
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
  applyPrimalChampion();
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

// One Constitution save per source of damage (PHB p.203), so two hits before the roll queue two saves.
let pendingConcentrationDcs = [];
// The queue travels with the sheet (persist writes it), so party cards and other tabs see saves owed.
let pendingConcentrationOwner = null;

// sameSheetOnly: persist re-normalizes the open sheet, so there only a different sheet brings its own queue.
function adoptConcentrationQueue(sameSheetOnly = false) {
  const stale = sameSheetOnly ? pendingConcentrationOwner?.sheetId !== character.sheetId : pendingConcentrationOwner !== character;
  if (stale) pendingConcentrationDcs = (Array.isArray(character.pendingConcentration) ? character.pendingConcentration : []).map(Number).filter(Number.isFinite);
  pendingConcentrationOwner = character;
}

function concentrationQueue() {
  adoptConcentrationQueue(true);
  return character.concentration ? [...pendingConcentrationDcs] : [];
}

function renderCombatDashboard() {
  const actions = ["Action", "Bonus Action", "Reaction", "Movement"];
  const temp = Number(character.tempHp || 0);
  document.querySelector("#combatSummary").textContent = `${character.hp}/${effectiveMaxHp()} HP${temp ? ` +${temp} temp` : ""} · AC ${effectiveArmorClass()} · ${character.conditions.length || 0} condition${character.conditions.length === 1 ? "" : "s"}`;
  const exhaustion = Number(character.exhaustion || 0);
  const conditionList = [...character.conditions, ...(exhaustion ? [`Exhaustion ${exhaustion}`] : [])];
  document.querySelector("#conditionsMini").textContent = conditionList.length ? conditionList.join(", ") : "None";
  renderConcentrationPrompt();
  renderDyingPrompt();
  renderTurnPrompt();
  document.querySelector("#combatDashboard").innerHTML = `
    ${actions.map(action => `<article><strong>${action}</strong><span>${combatActionHint(action)}</span></article>`).join("")}
    <article><strong>Concentration</strong><span>${escapeHtml(character.concentration || "None")}</span></article>
    <article><strong>Death saves</strong><span>${character.deathSaveSuccesses} successes / ${character.deathSaveFailures} failures</span></article>
    <article><strong>Conditions</strong><span>${escapeHtml(character.conditions.join(", ") || "None")}</span></article>
    <article><strong>Inspiration</strong><span>${character.inspiration ? `${optionalRule("stackingInspiration") ? character.inspiration : "Yes"}. Spend one in the roll window for advantage on one attack, save or check.` : "None"}</span></article>
  `;
}

// Death saves render inside the HP box at 0 HP (renderDeathSaves), so this prompt stays empty.
function renderDyingPrompt() {
  document.querySelector("#dyingPrompt").innerHTML = "";
}

function renderConcentrationPrompt() {
  // A different sheet object (switched, or replaced from another tab) brings its own queue.
  adoptConcentrationQueue();
  const root = document.querySelector("#concentrationPrompt");
  if (!pendingConcentrationDcs.length || !character.concentration) {
    root.innerHTML = "";
    return;
  }
  const more = pendingConcentrationDcs.length - 1;
  root.innerHTML = `
    <span><strong>Concentration check:</strong> ${escapeHtml(character.concentration)}, CON save DC ${pendingConcentrationDcs[0]}${more ? ` (then ${more} more: DC ${pendingConcentrationDcs.slice(1).join(", ")})` : ""}</span>
    <button type="button" class="secondary" data-roll-concentration>Roll Save</button>
    <button type="button" class="ghost" data-dismiss-concentration>Dismiss</button>
  `;
}

function handleConcentrationPromptClick(event) {
  if (event.target.closest("[data-roll-concentration]")) {
    rollConcentrationSave();
    return;
  }
  if (event.target.closest("[data-dismiss-concentration]")) {
    pendingConcentrationDcs = [];
    persistAndRender();
  }
}

// The next queued concentration save; damage opens it straight away when the roll window is free.
function rollConcentrationSave() {
  if (!pendingConcentrationDcs.length || !character.concentration) return;
  // The DC leaves the queue when the roll lands, so cancelling the roll window keeps the save owed.
  const dc = pendingConcentrationDcs[0];
  rollWithConditions(`Concentration save (DC ${dc})`, `1d20${formatMod(saveBonus("con") + concentrationFeatureBonus())}`, "save", "con", [], "concentration", result => {
    pendingConcentrationDcs.shift();
    if (result.total >= dc) {
      // Save first: the queue travels with the sheet, and rendering re-reads it from there.
      persistAndRender();
      return `Held: still concentrating on ${character.concentration}.${pendingConcentrationDcs.length ? ` Next check: DC ${pendingConcentrationDcs[0]}.` : ""}`;
    }
    const lost = character.concentration;
    character.concentration = "";
    pendingConcentrationDcs = [];
    persistAndRender();
    return `Lost: ${lost} ends.`;
  });
}

// The last damage taken on this sheet, so its toast can re-apply it with resistance, Uncanny Dodge and the like.
let lastDamage = null;

function vitalsSnapshot() {
  return structuredCloneSafe({
    hp: character.hp,
    tempHp: character.tempHp,
    deathSaveFailures: character.deathSaveFailures,
    deathSaveSuccesses: character.deathSaveSuccesses,
    stable: Boolean(character.stable),
    concentration: character.concentration,
    wildShape: character.wildShape || null,
    arcaneWard: character.arcaneWard || null,
    agathys: character.agathys || 0,
    maxHpReduction: character.maxHpReduction || 0,
    maxHpBonus: character.maxHpBonus || 0,
    maxHpBonuses: character.maxHpBonuses || {},
    conditions: [...(character.conditions || [])],
    autoUnconscious: Boolean(character.autoUnconscious),
    raging: Boolean(character.raging),
    frenzied: Boolean(character.frenzied),
    effects: { ...(character.effects || {}) },
    exhaustion: Number(character.exhaustion || 0),
    pendingDcs: [...pendingConcentrationDcs]
  });
}

function restoreVitals(snapshot) {
  const { pendingDcs, ...vitals } = structuredCloneSafe(snapshot);
  Object.assign(character, vitals);
  pendingConcentrationDcs = pendingDcs || [];
}

// Read the shared amount box; returns null (and explains) when it isn't a positive whole number.
function amountFromInput(input) {
  if (input.value === "") return null;
  const amount = Math.round(Number(input.value));
  if (!Number.isFinite(amount) || amount <= 0) {
    showToast(`<span class="toast-label">Enter a positive number</span><span>Type the amount, then press Damage or Heal.</span>`);
    return null;
  }
  // Back to 1 so the arrows (or arrow keys) step from a sensible start.
  input.value = "1";
  return amount;
}

function applyDamage(input = document.querySelector("#damageAmount")) {
  const amount = amountFromInput(input);
  const typeInput = document.querySelector("#damageType");
  const type = typeInput?.value || "";
  if (typeInput) typeInput.value = "";
  if (amount) dealDamage(Math.min(amount, 999), { clamped: amount > 999, type });
}

// Damage modifiers in PHB order (p.197): flat reductions, then halving (Uncanny Dodge, Evasion), then resistance,
// then vulnerability. Several resistances still halve only once.
function damageAfterMods(raw, mods = {}) {
  if (mods.immune) return 0;
  let amount = Math.max(0, raw - Number(mods.reduce || 0));
  if (mods.uncanny) amount = Math.floor(amount / 2);
  if (mods.evasion) amount = Math.floor(amount / 2);
  if (mods.resist) amount = Math.floor(amount / 2);
  if (mods.vulnerable) amount *= 2;
  return amount;
}

function damageModNames(mods) {
  return [
    mods.reduce ? `-${mods.reduce}` : "",
    mods.uncanny ? "Uncanny Dodge" : "",
    mods.evasion ? "Evasion" : "",
    mods.resist ? "resistance" : "",
    mods.vulnerable ? "vulnerable" : "",
    mods.immune ? "immune" : ""
  ].filter(Boolean);
}

function dealDamage(raw, { label = "", clamped = false, mods = null, type = "" } = {}) {
  const before = vitalsSnapshot();
  const wasRaging = Boolean(character.raging);
  // A typed hit applies the resistances and immunities this sheet knows about on its own.
  mods = mods || (type ? { resist: resistanceSources(type).length > 0, immune: damageImmunities(type).length > 0 } : {});
  const amount = damageAfterMods(raw, mods);
  const changed = damageModNames(mods);
  label = label || `Took ${amount}${type ? ` ${type}` : ""} damage${changed.length ? ` (${raw}: ${changed.join(", ")})` : ""}`;
  const notes = clamped ? ["Capped at 999."] : [];
  turnState().rageFed = true;
  let remaining = arcaneWardAbsorb(amount, notes);
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
  // Death Ward (PHB p.230): the first drop to 0 HP from damage leaves you at 1 instead, and the spell ends.
  if (character.hp === 0 && hpBefore > 0 && hasEffect("Death Ward")) {
    character.hp = 1;
    delete effects()["Death Ward"];
    notes.push("Death Ward: you drop to 1 HP instead, and the ward ends.");
  }
  if (hpBefore <= 0 && toHp > 0) {
    // At 0 HP: massive damage kills outright; otherwise each hit is a failed death save (a stable creature starts over).
    if (toHp >= effectiveMaxHp()) {
      character.deathSaveFailures = 3;
      notes.push("Massive damage at 0 HP: the damage equals your HP maximum, which is instant death.");
    } else {
      // A stable creature that takes damage is dying again, starting from 0/0 (PHB p.197).
      if (character.stable || character.deathSaveSuccesses >= 3) Object.assign(character, { stable: false, deathSaveSuccesses: 0, deathSaveFailures: 0 });
      character.deathSaveFailures = clamp(character.deathSaveFailures + 1, 0, 3);
      notes.push(character.deathSaveFailures >= 3 ? "Damage at 0 HP: third death save failure." : "Damage at 0 HP counts as one death save failure; a melee hit from within 5 ft is a critical hit and counts as two.");
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
  if (character.hp === 0 && character.raging) notes.push(endRage(true));
  // Each separate source of damage needs its own concentration save (PHB p.203); they queue in order.
  if (!character.concentration) pendingConcentrationDcs = [];
  else if (amount > 0) pendingConcentrationDcs.push(Math.max(10, Math.floor(amount / 2)));
  persistAndRender();
  if (character.concentration && amount > 0 && !document.querySelector("#rollDialog")?.open) rollConcentrationSave();
  const conditionSaves = amount > 0 ? conditionSaveActions("damage") : [];
  if (conditionSaves.length) showToast(`<span class="toast-label">Damage: repeat your save</span><span>Taking damage lets you repeat the save against ${escapeHtml(conditionSaves.map(action => action.label.replace(/.* vs /, "")).join(", "))}.</span>`, { actions: conditionSaves, persist: true });
  lastDamage = { before, raw, mods, type, sheetId: character.sheetId };
  const actions = [{ label: "Undo", run: () => undoDamage(before) }];
  const alive = character.deathSaveFailures < 3;
  if (hpBefore <= 0 && toHp > 0 && toHp < effectiveMaxHp() && alive) {
    actions.push({ label: "Melee hit within 5 ft: crit (2 failures)", run: () => { character.deathSaveFailures = clamp(character.deathSaveFailures + 1, 0, 3); persistAndRender(); } });
  }
  if (character.hp === 0 && hpBefore > 0 && alive) actions.push(...zeroHpActions(before, wasRaging, amount));
  actions.push(...damageModActions(mods, type, wasRaging));
  actions.push({ label: "Lower max HP too", run: () => reduceMaxHp(amount) });
  const temp = Number(character.tempHp || 0);
  const shapeLine = character.wildShape ? ` · ${character.wildShape.name || "Beast form"} ${character.wildShape.hp}/${character.wildShape.max}` : "";
  showToast(`<span class="toast-label">${escapeHtml(label)}</span><span>${character.hp}/${effectiveMaxHp()} HP${temp ? ` +${temp} temp` : ""}${escapeHtml(shapeLine)}${notes.length ? `. ${escapeHtml(notes.join(" "))}` : ""}</span>`, {
    tone: character.hp === 0 ? "fumble" : "",
    actions,
    duration: notes.length ? 11000 : 7000,
    // Dropping to 0 HP offers choices (Relentless Endurance, knocked out) that must not vanish.
    persist: character.hp === 0 && hpBefore > 0 && alive
  });
}

function undoDamage(before) {
  restoreVitals(before);
  lastDamage = null;
  persistAndRender();
  showToast(`<span class="toast-label">Damage undone</span><span>${character.hp}/${effectiveMaxHp()} HP</span>`);
}

// Take the last hit back and apply it again with a changed modifier (resistance, a reduction, Uncanny Dodge...).
function reapplyLastDamage(change, reason) {
  if (!lastDamage || lastDamage.sheetId !== character.sheetId) {
    showToast(`<span class="toast-label">${escapeHtml(reason)}</span><span>Use it right after taking the hit: enter the damage first, then apply it.</span>`);
    return false;
  }
  const { before, raw, mods, type } = lastDamage;
  restoreVitals(before);
  lastDamage = null;
  dealDamage(raw, { mods: { ...mods, ...change }, type });
  return true;
}

const HALVING_MODS = { "Uncanny Dodge": "uncanny", Evasion: "evasion" };

function halveLastDamage(reason = "Uncanny Dodge") {
  const key = HALVING_MODS[reason] || "resist";
  if (lastDamage?.sheetId === character.sheetId && lastDamage.mods[key]) {
    showToast(`<span class="toast-label">Already applied</span><span>${key === "resist" ? "Resistances don't stack: a hit is halved for resistance only once. Uncanny Dodge still halves it again." : `${escapeHtml(reason)} already halved this hit.`}</span>`);
    return;
  }
  reapplyLastDamage({ [key]: true }, reason);
}

// Slow Fall, Deflect Missiles, Parry, Heavy Armor Master: flat reductions before any halving.
function reduceLastDamage(amount, reason) {
  if (!lastDamage || lastDamage.sheetId !== character.sheetId) return reapplyLastDamage({}, reason);
  return reapplyLastDamage({ reduce: Number(lastDamage.mods.reduce || 0) + amount }, reason);
}

// Lowering HP by hand is damage too: concentration needs a save, and 0 HP ends it (PHB p.203).
function hpEdited(before, after) {
  if (!(after < before) || !character.concentration) return;
  if (after <= 0) {
    const lost = character.concentration;
    character.concentration = "";
    persistAndRender();
    showToast(`<span class="toast-label">${escapeHtml(lost)} ends</span><span>You dropped to 0 HP.</span>`);
    return;
  }
  pendingConcentrationDcs = [...pendingConcentrationDcs, Math.max(10, Math.floor((before - after) / 2))];
  renderConcentrationPrompt();
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
    character.concentration = "";
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
  return Number(character.hp) <= 0 && !character.stable && character.deathSaveFailures < 3 && character.deathSaveSuccesses < 3 && !isDead();
}

// Three failed death saves, or exhaustion level 6 (PHB p.291).
function isDead(source = character) {
  return (Number(source.hp) <= 0 && Number(source.deathSaveFailures) >= 3) || Number(source.exhaustion || 0) >= 6;
}

// Stable: unconscious at 0 HP, no more death saves, both counts back to 0 (PHB p.197).
function stabilizeSheet(sheet) {
  Object.assign(sheet, { stable: true, deathSaveSuccesses: 0, deathSaveFailures: 0 });
}

// Healing lands on a Wild Shape form's HP while the form lasts (PHB p.67), otherwise on the creature's own.
// Healing past the maximum is lost (RAW), or becomes temporary HP under the overheal house rule.
function applyHealing(sheet, amount) {
  const shape = sheet.wildShape && Number(sheet.wildShape.max) > 0 ? sheet.wildShape : null;
  const old = Number((shape || sheet).hp || 0);
  const next = Math.min(shape ? Number(shape.max) : effectiveMaxHp(sheet), old + amount);
  (shape || sheet).hp = next;
  const temp = !shape && optionalRule("overhealTempHp", sheet) ? Math.max(0, old + amount - next) : 0;
  if (temp) sheet.tempHp = Number(sheet.tempHp || 0) + temp;
  return { applied: next - old, shape, temp };
}

// Other living party members on this device (heal, temp HP, inspiration and rest-perk targets).
function otherSheets() {
  return Object.values(characterLibrary).filter(item => item.sheetId !== character.sheetId && !isDead(item) && inParty(item));
}

// Heal-target lists: allies at 0 HP first (marked "down"), then the most HP missing. Allies at full HP stay in the
// list but can't be picked, so it's clear nobody went missing. Only party members on this device (otherSheets).
function hpMissing(sheet) {
  const shape = sheet.wildShape && Number(sheet.wildShape.max) > 0 ? sheet.wildShape : null;
  return shape ? Number(shape.max) - Number(shape.hp || 0) : effectiveMaxHp(sheet) - Number(sheet.hp || 0);
}

function healTargets() {
  const down = sheet => Number(sheet.hp || 0) <= 0;
  return otherSheets().sort((a, b) => down(b) - down(a) || hpMissing(b) - hpMissing(a));
}

// blocked: another reason the ally can't take it ("had it this rest").
function healTargetAction(sheet, label, run, blocked = "") {
  const reason = blocked || (hpMissing(sheet) <= 0 ? "full HP" : "");
  return { label: `${label}${reason ? ` (${reason})` : Number(sheet.hp || 0) <= 0 ? " (down)" : ""}`, run, disabled: Boolean(reason) };
}

// Change any character on this device (the open one or another) and save it.
// note: the activity line the changed sheet shows (party.js logSheetChange); without one it describes the change.
function updateSheet(sheetId, change, note = "") {
  if (sheetId === character.sheetId) {
    const before = sheetVitals(character);
    change(character);
    logSheetChange(character, before, note);
    persistAndRender();
    return character;
  }
  const other = characterLibrary[sheetId];
  if (!other) return null;
  const before = sheetVitals(other);
  change(other);
  if (Number(other.hp) > 0) {
    Object.assign(other, { stable: false, deathSaveSuccesses: 0, deathSaveFailures: 0 });
    if (other.autoUnconscious) {
      other.conditions = (other.conditions || []).filter(condition => condition !== "Unconscious");
      other.autoUnconscious = false;
    }
  }
  logSheetChange(other, before, note);
  other.updatedAt = Date.now();
  saveCharacterLibrary();
  renderAll();
  return other;
}

function activeItemNamed(pattern) {
  return uniqueActiveItems().some(item => pattern.test(item.name || ""));
}

function applyHeal(input = document.querySelector("#damageAmount")) {
  const amount = amountFromInput(input);
  if (amount) healBy(Math.min(amount, 999));
}

// Beacon of Hope (PHB p.217): a creature under it regains the most any healing dice can give, not only a spell's.
function beaconHealing(sheet, result) {
  if (!(Number(sheet?.effects?.["Beacon of Hope"] || 0) > 0)) return result.total;
  const max = Number(maximizeDice(String(result.formula || "")));
  return Number.isFinite(max) ? Math.max(result.total, max) : result.total;
}

function healBy(amount) {
  if (isDead()) {
    showToast(`<span class="toast-label">${escapeHtml(character.name || "This character")} is dead</span><span>Ordinary healing can't help. Revivify, Raise Dead and similar magic bring a character back.</span>`, {
      tone: "fumble",
      actions: [{ label: "Revive at 1 HP", run: reviveCharacter }],
      persist: true
    });
    return false;
  }
  const before = vitalsSnapshot();
  const { applied, shape, temp } = applyHealing(character, amount);
  persistAndRender();
  const where = shape ? `${shape.name || "Beast form"} ${shape.hp}/${shape.max} HP` : `${character.hp}/${effectiveMaxHp()} HP`;
  const over = amount - applied - temp;
  const changed = applied || temp;
  showToast(`<span class="toast-label">${applied ? `Healed ${applied}` : temp ? "At full HP" : "Already at full HP"}</span><span>${escapeHtml(where)}${temp ? ` · +${temp} temp HP (${character.tempHp} total)` : ""}${applied && over ? ` · ${over} over the maximum` : ""}</span>`, {
    tone: changed ? "crit" : "",
    actions: changed ? [{ label: "Undo", run: () => { restoreVitals(before); persistAndRender(); } }] : []
  });
  return true;
}

// Heal a different character stored on this device (the healer stays on their own sheet).
function healOther(sheetId, amount) {
  const other = characterLibrary[sheetId];
  if (!other) return;
  const name = other.name || "That character";
  if (isDead(other)) {
    showToast(`<span class="toast-label">${escapeHtml(name)} is dead</span><span>Ordinary healing can't help.</span>`, { tone: "fumble" });
    return;
  }
  let healed;
  const sheet = updateSheet(sheetId, target => { healed = applyHealing(target, amount); });
  const { applied, shape, temp } = healed;
  const where = shape ? `${shape.name || "Beast form"} ${shape.hp}/${shape.max} HP` : `${sheet.hp}/${effectiveMaxHp(sheet)} HP`;
  showToast(`<span class="toast-label">${applied ? `Healed ${escapeHtml(name)} ${applied}` : temp ? `${escapeHtml(name)} is at full HP` : `${escapeHtml(name)} is already at full HP`}</span><span>${escapeHtml(where)}${temp ? ` · +${temp} temp HP` : ""}</span>`, { tone: applied || temp ? "crit" : "" });
}

// Party-card damage. The open sheet goes through dealDamage; another sheet follows the same order: its own
// resistances and immunities, Arcane Ward, temp HP, Wild Shape HP, then its HP; Death Ward; death saves and massive damage.
function damageOther(sheetId, raw, type = "") {
  const other = sheetId === character.sheetId ? character : characterLibrary[sheetId];
  if (!other) return;
  const name = other.name || "That character";
  const mods = type ? asSheet(other, () => ({ resist: resistanceSources(type).length > 0, immune: damageImmunities(type).length > 0 })) : {};
  const amount = damageAfterMods(raw, mods);
  const note = `${actorName()} dealt you ${amount}${type ? ` ${type}` : ""} damage${mods.immune ? " (immune)" : mods.resist ? " (resisted)" : ""}`;
  if (other === character) {
    dealDamage(raw, { type });
    // Only logs from the DM seat; a player damaging their own sheet needs no notice.
    logSheetChange(character, null, note);
    return persistAndRender();
  }
  const notes = [];
  const sheet = updateSheet(sheetId, target => {
    let remaining = amount;
    const ward = target.arcaneWard;
    if (ward && Number(ward.hp) > 0) {
      const taken = Math.min(Number(ward.hp), remaining);
      ward.hp = Number(ward.hp) - taken;
      remaining -= taken;
    }
    const temp = Math.min(Number(target.tempHp || 0), remaining);
    target.tempHp = Number(target.tempHp || 0) - temp;
    remaining -= temp;
    const shape = target.wildShape;
    if (shape && Number(shape.hp) > 0 && remaining > 0) {
      const taken = Math.min(Number(shape.hp), remaining);
      shape.hp = Number(shape.hp) - taken;
      remaining -= taken;
      if (shape.hp <= 0) {
        target.wildShape = null;
        notes.push(`${shape.name || "Beast form"} drops to 0 HP: back to normal form.`);
      }
    }
    const hpBefore = Number(target.hp || 0);
    target.hp = Math.max(0, hpBefore - remaining);
    if (target.hp === 0 && hpBefore > 0 && Number(target.effects?.["Death Ward"] || 0) > 0) {
      target.hp = 1;
      delete target.effects["Death Ward"];
      notes.push("Death Ward: 1 HP instead, and the ward ends.");
    }
    const max = effectiveMaxHp(target);
    if (target.hp === 0 && remaining > 0 && (hpBefore <= 0 ? remaining : remaining - hpBefore) >= max) {
      target.deathSaveFailures = 3;
      notes.push("Massive damage: instant death.");
    } else if (hpBefore <= 0 && remaining > 0) {
      // A stable creature that takes damage starts dying again (PHB p.197).
      if (target.stable || Number(target.deathSaveSuccesses) >= 3) Object.assign(target, { stable: false, deathSaveSuccesses: 0, deathSaveFailures: 0 });
      target.deathSaveFailures = clamp(Number(target.deathSaveFailures || 0) + 1, 0, 3);
      notes.push("Damage at 0 HP: one death save failure.");
    }
    if (target.hp === 0) {
      if (hpBefore > 0) notes.push("Drops to 0 HP: unconscious and prone.");
      target.conditions = [...new Set([...(target.conditions || []), "Unconscious", "Prone"])];
      if (hpBefore > 0) target.autoUnconscious = true;
      if (target.concentration) notes.push(`Concentration on ${target.concentration} ends.`);
      target.concentration = "";
      target.pendingConcentration = [];
      if (target.raging) {
        target.raging = false;
        if (target.effects) delete target.effects.Rage;
        if (target.frenzied) target.exhaustion = Math.min(6, Number(target.exhaustion || 0) + 1);
        target.frenzied = false;
      }
    } else if (target.concentration && amount > 0) {
      const dc = Math.max(10, Math.floor(amount / 2));
      target.pendingConcentration = [...(target.pendingConcentration || []), dc];
      notes.push(`CON save DC ${dc} to keep ${target.concentration}.`);
    }
  }, note);
  const where = sheet.wildShape ? `${sheet.wildShape.name || "Beast form"} ${sheet.wildShape.hp}/${sheet.wildShape.max}` : `${sheet.hp}/${effectiveMaxHp(sheet)} HP`;
  showToast(`<span class="toast-label">${escapeHtml(name)} took ${amount}${type ? ` ${escapeHtml(type)}` : ""} damage${mods.immune ? " (immune)" : mods.resist ? " (resisted)" : ""}</span><span>${escapeHtml(where)}${Number(sheet.tempHp) ? ` +${sheet.tempHp} temp` : ""}${notes.length ? `. ${escapeHtml(notes.join(" "))}` : ""}</span>`, { tone: Number(sheet.hp) === 0 ? "fumble" : "" });
}

function gainTempHp(amount) {
  const before = vitalsSnapshot();
  const old = Number(character.tempHp || 0);
  character.tempHp = Math.max(old, amount);
  persistAndRender();
  // PHB p.198: temporary HP don't stack; you choose which pool to keep. The higher one is kept unless you pick the other.
  const other = character.tempHp === old ? amount : old;
  const actions = [{ label: "Undo", run: () => { restoreVitals(before); persistAndRender(); } }];
  if (other > 0 && other !== character.tempHp) actions.push({ label: `${other === amount ? "Take" : "Keep"} ${other} instead`, run: () => { character.tempHp = other; persistAndRender(); } });
  showToast(`<span class="toast-label">${character.tempHp > old ? `${character.tempHp} temp HP` : `Kept ${old} temp HP`}</span><span>${character.tempHp > old ? "Temporary hit points don't stack; you keep one pool." : `${amount} is not more than the ${old} you already have.`}</span>`, { actions });
}

const INCAPACITATING = ["Incapacitated", "Paralyzed", "Petrified", "Stunned", "Unconscious"];
const SAVE_AUTO_FAIL = ["Paralyzed", "Petrified", "Stunned", "Unconscious"];

// Conditions, exhaustion and armor that impose disadvantage (PHB appendix A, p.144).
function disadvantageSources(kind, ability = "", context = "") {
  const immune = conditionImmunities();
  const active = new Set((character.conditions || []).filter(name => !immune.has(name)));
  const exhaustion = Number(character.exhaustion || 0);
  const names = {
    attack: ["Poisoned", "Frightened", "Prone", "Blinded", "Restrained"],
    check: ["Poisoned", "Frightened"],
    save: ability === "dex" ? ["Restrained"] : []
  }[kind] || [];
  const sources = names.filter(name => active.has(name));
  if (heavilyEncumbered() && ["str", "dex", "con"].includes(ability)) sources.push("heavily encumbered");
  const threshold = { attack: 3, check: 1, save: 3 }[kind];
  if (threshold && exhaustion >= threshold) sources.push(`exhaustion ${exhaustion}`);
  const armor = wornArmor();
  // Medium Armor Master removes the Stealth penalty of medium armor (PHB p.168).
  if (context === "stealth" && /disadvantage on stealth/i.test(armor?.notes || "") && !(hasFeat("Medium Armor Master") && armorCategory(armor) === "medium")) sources.push(`${armor.name}: Stealth`);
  if (["str", "dex"].includes(ability) && untrainedArmorItem()) sources.push(`untrained in ${untrainedArmorItem().name}`);
  return sources;
}

// Advantage and disadvantage cancel out (PHB p. 173) no matter how many sources of each.
// picked: the Advantage / Disadvantage toggles in the roll modal. They add to what the sheet detects, so a
// character who normally has advantage but is told to roll with disadvantage rolls flat.
function rollModeFor(kind, ability = "", context = "", picked = {}) {
  const chips = (picked.chips || []).filter(chip => chip.on);
  const feature = [advantageSource(kind, ability, context), ...(picked.advantageFrom || [])].filter(Boolean).join(", ");
  const sources = [...disadvantageSources(kind, ability, context), ...(picked.disadvantageFrom || []), ...chips.map(chip => chip.disadvantage).filter(Boolean)]
    .filter(source => !chips.some(chip => chip.ignore === source));
  // Spending Inspiration gives advantage on this roll (PHB p.125).
  const forAdvantage = [feature, picked.advantage ? "you chose advantage" : "", picked.inspiration ? "Inspiration" : ""].filter(Boolean);
  const against = [...sources, picked.disadvantage ? "you chose disadvantage" : ""].filter(Boolean);
  if (forAdvantage.length && against.length) return { mode: "normal", note: `${forAdvantage.join(", ")} and ${against.join(", ")} cancel out` };
  if (forAdvantage.length) return { mode: "advantage", note: feature ? `${feature}: advantage` : "" };
  if (against.length) return { mode: "disadvantage", note: sources.length ? `${sources.join(", ")}: disadvantage` : "" };
  return { mode: "normal", note: "" };
}

// Class features and feats that grant advantage on their own.
function advantageSource(kind, ability, context) {
  const active = character.conditions || [];
  const species = character.species || "";
  if (kind === "save" && /charmed|frightened/i.test(context) && classLevel("bloodhunter") >= 14) return "Hardened Soul";
  if (context === "concentration" && classLevel("warlock") >= 2 && hasInvocation("Eldritch Mind")) return "Eldritch Mind";
  if (rageActive() && ability === "str" && (kind === "check" || kind === "save")) return "Rage";
  if (character.hybrid && subclassLevel("lycan") && ability === "str" && (kind === "check" || kind === "save")) return "Hybrid Transformation";
  if (kind === "save" && ability === "dex" && classLevel("barbarian") >= 2 && !["Blinded", "Deafened"].some(name => active.includes(name)) && !incapacitatedBy()) return "Danger Sense";
  if (context === "concentration" && hasFeat("War Caster")) return "War Caster";
  if (context === "concentration" && /eldritch mind/i.test(`${character.features || ""} ${(character.classOptions || []).map(item => item.name).join(" ")} ${(character.classChoices?.invocations || []).join(" ")}`)) return "Eldritch Mind";
  // Feral Instinct (PHB p.49).
  if (context === "initiative" && classLevel("barbarian") >= 7 && !incapacitatedBy()) return "Feral Instinct";
  if (kind === "attack" && context === "str-melee" && turnState().reckless) return "Reckless Attack";
  if (kind === "attack" && context && hasEffect("Fighting Spirit")) return "Fighting Spirit";
  if (kind === "attack" && (active.includes("Invisible") || hasEffect("Nature's Veil") || hasEffect("Empty Body"))) return "Invisible";
  // Vedalken Dispassion (GGR) and Kalashtar Dual Mind (ERLW) apply to every such save.
  if (kind === "save" && /vedalken/i.test(species) && ["int", "wis", "cha"].includes(ability)) return "Vedalken Dispassion";
  if (kind === "save" && /kalashtar/i.test(species) && ability === "wis") return "Dual Mind";
  // Beacon of Hope (PHB p.217): advantage on Wisdom saves and death saves.
  if (kind === "save" && (ability === "wis" || context === "death") && hasEffect("Beacon of Hope")) return "Beacon of Hope";
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
    persist: true
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

// PHB p.125: you have inspiration or you don't; the stacking house rule makes it a counter.
function gainInspiration() {
  character.inspiration = optionalRule("stackingInspiration") ? Math.min(99, Number(character.inspiration || 0) + 1) : 1;
  persistAndRender();
}

// Spending it from the roll window grants advantage there; this button just clears it.
function spendInspiration() {
  if (!character.inspiration) return;
  character.inspiration = Number(character.inspiration) - 1;
  character.rollHistory = [{ label: "Inspiration spent", formula: "advantage on one roll", mode: "normal", total: 0, parts: ["advantage on one attack, save or check"] }, ...(character.rollHistory || [])].slice(0, 25);
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
    character.stable = false;
    persistAndRender();
    return;
  }
  if (action.dataset.deathAction === "stabilize") {
    showToast(`<span class="toast-label">Stabilize ${escapeHtml(character.name || "this character")}</span><span>An ally uses an action: a DC 10 Wisdom (Medicine) check, one use of a healer's kit, or Spare the Dying.</span>`, {
      actions: [{ label: "Mark stable", run: () => { stabilizeSheet(character); persistAndRender(); } }],
      persist: true
    });
    return;
  }
  if (action.dataset.deathAction === "wake") {
    rollFromInput("Hours until you regain 1 HP", "1d4", "normal", [], "A stable creature that isn't healed regains 1 HP after 1d4 hours.", result => {
      character.hp = Math.max(1, Number(character.hp || 0));
      persistAndRender();
      return `After ${result.total} hour${result.total === 1 ? "" : "s"}: 1 HP and conscious (still prone).`;
    });
    return;
  }
  rollDeathSave();
}

function rollDeathSave() {
  if (!isDying()) {
    showToast(`<span class="toast-label">No death save needed</span><span>${Number(character.hp) > 0 ? "You're above 0 HP." : character.deathSaveFailures >= 3 ? "Three failures: the character is dead." : "You're stable."}</span>`);
    return;
  }
  // Periapt of Wound Closure: you stabilize at the start of your turn instead of rolling.
  if (activeItemNamed(/periapt of wound closure/i)) {
    stabilizeSheet(character);
    persistAndRender();
    showToast(`<span class="toast-label">Periapt of Wound Closure</span><span>You stabilize at 0 HP.</span>`, { tone: "crit" });
    return;
  }
  // A death save is a saving throw: exhaustion 3+ gives it disadvantage, and general save bonuses (a Cloak of Protection,
  // Bless or an ally's aura through Extra bonus) count. No ability modifier or proficiency (PHB p.197).
  const bonus = itemSaveBonus();
  openRoll({ label: "Death save", formula: `1d20${bonus ? formatMod(bonus) : ""}`, kind: "save", context: "death", onResult: result => applyDeathSave(naturalD20(result), result.total) });
}

// roll: the natural d20 (1 and 20 are special); total: with bonuses, 10 or more succeeds.
function applyDeathSave(roll, total = roll) {
  let outcome;
  if (roll === 20) {
    character.deathSaveSuccesses = 0;
    character.deathSaveFailures = 0;
    character.hp = 1;
    outcome = "natural 20, back up with 1 HP";
  } else if (roll === 1) {
    character.deathSaveFailures = clamp(character.deathSaveFailures + 2, 0, 3);
    outcome = "natural 1, two failures";
  } else if (total >= 10) {
    character.deathSaveSuccesses = clamp(character.deathSaveSuccesses + 1, 0, 3);
    outcome = "Success";
    if (character.deathSaveSuccesses >= 3) {
      stabilizeSheet(character);
      outcome = "Third success: stable";
    }
  } else {
    character.deathSaveFailures = clamp(character.deathSaveFailures + 1, 0, 3);
    outcome = "Failure";
  }
  if (character.rollHistory?.[0]) character.rollHistory[0].label = `Death save: ${outcome}`;
  persistAndRender();
  if (character.stable) return `${outcome}. You stop making death saves; you regain 1 HP after 1d4 hours unless healed sooner.`;
  return `${outcome}. ${character.deathSaveSuccesses} success${character.deathSaveSuccesses === 1 ? "" : "es"}, ${character.deathSaveFailures} failure${character.deathSaveFailures === 1 ? "" : "s"}.`;
}

function rollAbilityCheck(ability) {
  const name = ABILITIES.find(([id]) => id === ability)?.[1] || ability;
  openRoll({ label: `${name} check`, formula: `1d20${formatMod(mod(ability) + untrainedBonus(ability))}`, kind: "check", ability, context: "ability", actions: withFlashOfGenius([], "check"), floor: indomitableMight(ability) });
}

// Indomitable Might (PHB p.49): a Strength check total below your Strength score uses the score.
function indomitableMight(ability) {
  return ability === "str" && classLevel("barbarian") >= 18 ? { value: effectiveScore("str"), note: "Indomitable Might" } : null;
}

function rollWithConditions(label, formula, kind, ability = "", actions = [], context = "", onResult = null) {
  openRoll({ label, formula, kind, ability, context, actions: withFlashOfGenius(actions, kind), onResult });
}

function rollSavingThrow(ability, actions = [], context = "") {
  const name = ABILITIES.find(([id]) => id === ability)?.[1] || ability;
  const failedBy = autoFailCondition(ability);
  if (failedBy) {
    character.rollHistory = [{ label: `${name} save: automatic failure (${failedBy})`, formula: "auto", mode: "normal", total: 0, parts: ["auto-fail"] }, ...(character.rollHistory || [])].slice(0, 25);
    persistAndRender();
    showToast(`<span class="toast-label">${escapeHtml(name)} save: automatic failure</span><span>${escapeHtml(failedBy)} creatures fail Strength and Dexterity saves.</span>`, { tone: "fumble" });
    return null;
  }
  openRoll({ label: `${name} save`, formula: `1d20${formatMod(saveBonus(ability))}`, kind: "save", ability, context, actions: withFlashOfGenius(actions, "save"), detail: ability === "dex" && hasEvasion() ? "Evasion: no damage on a success, half on a failure." : "" });
}

function rollSkillCheck(skill) {
  const [, name, ability] = SKILLS.find(([id]) => id === skill) || [];
  if (!name) return;
  // Reliable Talent (PHB p.96): a proficient check treats a d20 of 9 or lower as 10.
  const reliable = classLevel("rogue") >= 11 && character.proficientSkills.includes(skill);
  openRoll({ label: `${name} check`, formula: `1d20${formatMod(skillBonus(skill, ability))}`, kind: "check", ability, context: skill, actions: withFlashOfGenius([], "check"), minD20: reliable ? 10 : 0, floor: indomitableMight(ability) });
}

// Initiative is a Dexterity check, so conditions and exhaustion apply to it. Rolling it starts round 1.
function rollInitiativeCheck() {
  startCombat();
  // Kept on the sheet for the Party tab's order; roll history is capped and scrolls it away.
  rollWithConditions("Initiative", `1d20${formatMod(initiativeBonus())}`, "check", "dex", [], "initiative", result => {
    character.initiative = { total: result.total, at: Date.now() };
    persist();
  });
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
  const dice = "\\d*d(?:\\d+|%)(?:r\\d+)?(?:m\\d+)?(?:k[hl]\\d+)?";
  if (!new RegExp(`^[+-]?(${dice}|\\d+)([+-](${dice}|\\d+))*$`).test(cleaned)) return "Use dice like 1d20+5 or 2d6+1d4+3 (r2 rerolls 1s and 2s, kh3 keeps the highest 3, d% is a d100).";
  const outOfRange = parseFormula(cleaned).terms.filter(term => term.sides).some(term =>
    term.count < 1 || term.count > 100 || term.sides < 2 || term.sides > 1000 || term.reroll >= term.sides || term.min > term.sides
    || (term.keep && (term.keep.n < 1 || term.keep.n > term.count)));
  return outOfRange ? "Use 1 to 100 dice with 2 to 1000 sides; a reroll must be below the die size and a keep count within the dice rolled." : "";
}

function naturalD20(result) {
  if (Number.isFinite(result.natural)) return result.natural;
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
    ...(slotsArePact() || pactSlotPool() ? [{ name: "Pact magic slots" }] : []),
    ...character.resources.filter(item => item.reset === "short"),
    ...character.resources.filter(item => item.reset === "shortOne").map(item => ({ name: `${item.label || item.name} (one use)` })),
    ...character.classOptions.filter(item => item.reset === "short")
  ].map(item => item.label || item.name).filter(Boolean);
  const longRefresh = [
    ...character.resources.filter(item => ["long", "short", "shortOne"].includes(item.reset)),
    ...character.classOptions.filter(item => item.reset === "long" || item.reset === "short")
  ].map(item => item.label || item.name).filter(Boolean);
  document.querySelector("#restSummary").textContent = character.restLog || "No rest taken yet";
  const pools = hitDicePools();
  const spent = hitDiceSpent();
  document.querySelector("#hitDiceSummary").textContent = `Hit dice ${Object.keys(pools).sort((a, b) => b - a).map(die => `${pools[die] - spent[die]}d${die}`).join(" + ")} of ${hitDiceText()}`;
  document.querySelector("#restPreview").innerHTML = `
    <article><strong>Short rest</strong><span>${escapeHtml(shortRefresh.join(", ") || "No short-rest resources tracked.")}</span></article>
    <article><strong>Long rest</strong><span>HP, spell slots, half your Hit Dice, 1 exhaustion (with food and drink), item charges${longRefresh.length ? `, ${escapeHtml(longRefresh.join(", "))}` : ""}</span></article>
  `;
  // Arcane/Natural Recovery: once a day after a short rest (PHB p.115, 68); offered here until it's used or a long rest.
  if (/^Short rest/.test(character.restLog || "")) {
    recoveryFeatures().filter(feature => arcaneRecoveryPlan(feature.budget).length).forEach(feature => {
      document.querySelector("#restPreview").insertAdjacentHTML("beforeend", `<article><strong>${escapeHtml(feature.name)}</strong><button type="button" class="ghost" data-recovery="${escapeHtml(feature.name)}">Recover spell slots</button></article>`);
    });
  }
  if (lastRest) {
    document.querySelector("#restPreview").insertAdjacentHTML("beforeend", `<article><strong>${escapeHtml(lastRest.name)} taken</strong><button type="button" class="ghost" data-undo-rest>Undo ${escapeHtml(lastRest.name.toLowerCase())}</button></article>`);
  }
}

// Hit Dice by size across every class: { 10: 5, 6: 3 } (PHB p.164: each class adds its own dice).
function hitDicePools(source = character) {
  const pools = {};
  classEntries(source).forEach(entry => {
    const die = (getClasses()[entry.classId] || BUILT_IN_CLASSES.fighter).hitDie;
    pools[die] = (pools[die] || 0) + Number(entry.level || 0);
  });
  return pools;
}

// Spent Hit Dice by size. hitDiceUsed stays the total for older readers; when the two disagree (an older sheet, an
// edit elsewhere) the difference is read as the largest dice spent first.
function hitDiceSpent(source = character) {
  const pools = hitDicePools(source);
  const sizes = Object.keys(pools).map(Number).sort((a, b) => b - a);
  const spent = Object.fromEntries(sizes.map(die => [die, clamp(Number(source.hitDiceSpent?.[die] || 0), 0, pools[die])]));
  let diff = clamp(Number(source.hitDiceUsed || 0), 0, totalLevel(source)) - Object.values(spent).reduce((sum, value) => sum + value, 0);
  sizes.forEach(die => { const add = clamp(diff, 0, pools[die] - spent[die]); spent[die] += add; diff -= add; });
  [...sizes].reverse().forEach(die => { const take = clamp(-diff, 0, spent[die]); spent[die] -= take; diff += take; });
  return spent;
}

function setHitDiceSpent(spent) {
  character.hitDiceSpent = spent;
  character.hitDiceUsed = Object.values(spent).reduce((sum, value) => sum + value, 0);
}

// PHB p.186: the die plus CON, no minimum beyond 0. Durable: at least twice your CON modifier (minimum 2).
// Periapt of Wound Closure doubles it.
function hitDieHealing(total) {
  let heal = Math.max(0, total);
  if (hasFeat("Durable")) heal = Math.max(heal, 2, 2 * mod("con"));
  if (activeItemNamed(/periapt of wound closure/i)) heal *= 2;
  return heal;
}

// die: the size to spend. A character with more than one size left picks one (PHB p.164).
// minimum: Dwarven Fortitude heals at least 1 (XGE p.74); an ordinary Hit Die has no floor.
function spendHitDie(die, minimum = 0) {
  const pools = hitDicePools();
  const spent = hitDiceSpent();
  const open = Object.keys(pools).map(Number).filter(size => pools[size] > spent[size]).sort((a, b) => b - a);
  if (!open.length) return;
  if (!open.includes(die)) {
    if (open.length > 1) {
      showToast(`<span class="toast-label">Spend which Hit Die?</span><span>Add your CON modifier (${formatMod(mod("con"))}) to the roll.</span>`, {
        persist: true,
        actions: open.map(size => ({ label: `d${size} (${pools[size] - spent[size]} left)`, run: () => spendHitDie(size, minimum) }))
      });
      return;
    }
    die = open[0];
  }
  openRoll({
    label: `Hit die healing (d${die})`,
    formula: `1d${die}${formatMod(mod("con"))}`,
    breakdown: "CON",
    onResult: result => {
      const heal = Math.max(minimum, hitDieHealing(beaconHealing(character, result)));
      const now = hitDiceSpent();
      now[die] += 1;
      setHitDiceSpent(now);
      if (restPerks?.sheetId === character.sheetId) restPerks.spentHitDice = true;
      character.hitDiceSpentAt = Date.now();
      applyHealing(character, heal);
      persistAndRender();
      const left = totalLevel() - character.hitDiceUsed;
      return `+${heal} HP: ${character.hp}/${effectiveMaxHp()} HP, ${left} hit ${left === 1 ? "die" : "dice"} left.`;
    },
    actions: () => {
      const left = totalLevel() - character.hitDiceUsed;
      return [...restPerkActions(), ...bloodwellActions(), ...(left > 0 && character.hp < effectiveMaxHp() ? [{ label: `Spend another (${left} left)`, run: spendHitDie }] : [])];
    }
  });
}

// Bloodwell Vial (TCE p.118): rolling Hit Dice while attuned to it returns 5 sorcery points, once per dawn.
function bloodwellActions() {
  const vial = uniqueActiveItems().find(item => /bloodwell vial/i.test(item.name || ""));
  const points = sorceryPoints();
  if (!vial || vial.dawnUsed || !points || Number(points.current) >= Number(points.max)) return [];
  return [{ label: "Bloodwell Vial: +5 sorcery points", run: () => {
    vial.dawnUsed = true;
    points.current = Math.min(Number(points.max), Number(points.current) + 5);
    persistAndRender();
    showToast(`<span class="toast-label">Bloodwell Vial</span><span>Sorcery points ${points.current}/${points.max}. It works again after the next dawn.</span>`);
  } }];
}

// Extra healing at the end of a short rest for a creature that spent Hit Dice: Song of Rest (a bard 2+ in the
// party, PHB p.54) and Chef (TCE), each once per rest.
let restPerks = null;

function restPerkActions() {
  if (!restPerks || restPerks.sheetId !== character.sheetId || !restPerks.spentHitDice) return [];
  const party = [character, ...otherSheets()];
  const songDie = Math.max(0, ...party.map(sheet => songOfRestDie(sheet)));
  const perk = (key, label, formula) => ({ label: `${label} +${formula}`, run: () => {
    restPerks[key] = true;
    if (key === "song") character.songOfRestAt = Date.now();
    rollFromInput(label, formula, "normal", [], "", result => {
      healBy(beaconHealing(character, result));
      return `${character.hp}/${effectiveMaxHp()} HP.`;
    });
  } });
  return [
    songDie && !restPerks.song && !(Number(character.songOfRestAt) >= restPerks.at) ? perk("song", "Song of Rest", `1d${songDie}`) : null,
    party.some(sheet => hasFeat("Chef", sheet)) && !restPerks.chef ? perk("chef", "Chef's food", "1d8") : null,
    // Vigor of the Hill Giant, Iron Stomach (BGG): eating during the rest adds CON + PB once.
    hasFeat("Vigor of the Hill Giant") && !restPerks.ironStomach ? { label: `Iron Stomach (ate) +${Math.max(0, mod("con") + proficiencyBonus())}`, run: () => {
      restPerks.ironStomach = true;
      healBy(Math.max(0, mod("con") + proficiencyBonus()));
    } } : null
  ].filter(Boolean);
}

function songOfRestDie(sheet = character) {
  const bard = classLevel("bard", sheet);
  return bard >= 17 ? 12 : bard >= 13 ? 10 : bard >= 9 ? 8 : bard >= 2 ? 6 : 0;
}

// Song of Rest from the bard's side: roll the bard's die for an ally on this device, once per ally per short rest.
// Allies who spent hit dice in the last 2 hours are marked; anyone in the party can still be picked.
function songOfRestMenu() {
  const die = songOfRestDie();
  if (!die) return;
  const since = Number(character.shortRestAt || 0);
  const recent = sheet => Number(sheet.hitDiceSpentAt || 0) > Date.now() - 2 * 60 * 60 * 1000;
  const allies = healTargets().sort((a, b) => recent(b) - recent(a));
  const actions = allies.map(ally => healTargetAction(ally, `${ally.name || "Ally"}${recent(ally) ? " (spent hit dice)" : ""} +1d${die}`, () => {
    rollFromInput(`Song of Rest: ${ally.name || "ally"}`, `1d${die}`, "normal", [], "", result => {
      let healed;
      updateSheet(ally.sheetId, target => { target.songOfRestAt = Date.now(); healed = applyHealing(target, beaconHealing(target, result)); });
      return `${ally.name || "Ally"} +${healed.applied} HP.`;
    });
  }, since && Number(ally.songOfRestAt) >= since ? "had it this rest" : ""));
  showToast(`<span class="toast-label">Song of Rest (d${die})</span><span>${actions.length ? `Each ally who spent hit dice during the short rest regains an extra 1d${die}.` : "No party members on this device. Allies get the die from their own hit die roll."}</span>`, { actions, duration: 15000, persist: true });
}

// options.food: a long rest only removes a level of exhaustion if you also ate and drank (PHB p.291).
function takeRest(type, options = {}) {
  if (type === "long" && Number(character.hp) <= 0) {
    showToast(`<span class="toast-label">Can't benefit from a long rest</span><span>A creature needs at least 1 hit point at the start of a long rest (PHB p.186). Heal or stabilize first.</span>`, { tone: "fumble" });
    return;
  }
  if (type === "long" && options.food === undefined) {
    const again = /^Long rest/.test(character.restLog || "");
    showToast(`<span class="toast-label">Long rest</span><span>At least 8 hours; an hour of fighting or similar effort restarts it.${again ? " Your last rest was also a long rest: only one long rest counts in any 24 hours." : ""}</span>`, {
      actions: [
        { label: "Rest (ate and drank)", run: () => takeRest("long", { food: true }) },
        { label: "Rest without food or water", run: () => takeRest("long", { food: false }) }
      ],
      persist: true
    });
    return;
  }
  const before = structuredCloneSafe(character);
  restPerks = type === "short" ? { sheetId: character.sheetId, at: Date.now() } : null;
  if (type === "short") character.shortRestAt = Date.now();
  endCombatState(type);
  character.raging = false;
  // Healer and Inspiring Leader: each creature benefits once per short or long rest.
  character.healerFeatUsed = false;
  character.inspiringLeaderUsed = false;
  if (type === "short" && slotsArePact()) {
    character.spellSlotUsage = {};
  }
  // Multiclass Pact Magic slots come back on any rest.
  character.pactSlotUsage = 0;
  // A short rest is an hour: concentration on a spell lasting an hour or less has run out.
  if (type === "short" && character.concentration) {
    const minutes = spellDurationMinutes(character.concentration);
    if (minutes !== null && minutes <= 60) character.concentration = "";
  }
  if (type === "long") {
    character.maxHpReduction = 0;
    // Aid (8 hours) ends with the long rest; Heroes' Feast lasts 24 hours, so it stays until the player ends it.
    const feast = Number(character.maxHpBonuses?.["heroes-feast"] || 0);
    character.maxHpBonus = feast;
    character.maxHpBonuses = feast ? { "heroes-feast": feast } : {};
    character.wildShape = wildShapeAfterRest(8);
    character.agathys = 0;
    character.tempHp = 0;
    character.mageArmor = false;
    (character.spells || []).forEach(row => { delete row.castLevel; });
    // Exhaustion drops first so a level-4 max HP halving ends before HP refills.
    if (options.food) character.exhaustion = Math.max(0, Number(character.exhaustion || 0) - 1);
    character.hp = effectiveMaxHp() || character.hp;
    character.spellSlotUsage = {};
    // Conditions last until their own source ends them; resting only gets you off the ground.
    character.conditions = (character.conditions || []).filter(condition => condition !== "Prone");
    regainHitDice(Math.max(1, Math.floor(totalLevel() / 2)));
    character.concentration = "";
    (character.equipment || []).forEach(rechargeItem);
    character.equipment = (character.equipment || []).filter(item => !berriesSpoiled(item));
  }
  character.resources.forEach(resource => {
    if (resource.reset === type || (type === "long" && ["short", "shortOne"].includes(resource.reset))) resource.current = resource.max;
    else if (type === "short" && resource.reset === "shortOne") resource.current = Math.min(Number(resource.max), Number(resource.current || 0) + 1);
  });
  character.classOptions.forEach(option => {
    if (option.reset === type || (type === "long" && option.reset === "short")) option.current = option.max;
  });
  classFeatureRest(type);
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
  if (type === "short") recoveryFeatures().filter(feature => arcaneRecoveryPlan(feature.budget).length).forEach(feature => actions.push({ label: feature.name, run: () => useArcaneRecovery(feature.name) }));
  if (type === "short" && songOfRestDie() && otherSheets().length) actions.push({ label: "Song of Rest for allies", run: songOfRestMenu });
  const still = (character.conditions || []).filter(condition => condition !== "Unconscious" || !character.autoUnconscious);
  if (type === "long") still.slice(0, 4).forEach(condition => actions.push({ label: `End ${condition}`, run: () => removeCondition(condition) }));
  if (type === "long" && character.maxHpBonuses?.["heroes-feast"]) actions.push({ label: "Heroes' Feast ends", run: endHeroesFeast });
  // Prepared casters change their prepared list after a long rest (PHB p.58, 64, 114); known casters don't.
  if (type === "long" && classEntries().some(entry => isPreparedCaster(entryClass(entry)) && preparedLimitFor(entryClass(entry), entry.level) > 0)) actions.push({ label: "Change prepared spells", run: focusPreparedSpells });
  const changes = restChanges(before, character);
  if (type === "long" && still.length) changes.push(`still affected: ${still.join(", ")}`);
  if (type === "long" && !options.food && Number(character.exhaustion || 0)) changes.push("exhaustion unchanged (no food or drink)");
  const nothing = character.hp < effectiveMaxHp() && hitDiceLeft > 0 ? "No resources to recover. Spend hit dice to heal." : "Nothing needed recovering.";
  showToast(`<span class="toast-label">${name}</span><span>${escapeHtml(changes.join(" · ") || nothing)}</span>`, { actions, duration: 12000, persist: actions.length > 1 });
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
  const spentNow = hitDiceSpent();
  const [spentBefore, spentAfter] = [hitDiceSpent(before), hitDiceSpent(after)];
  const pools = hitDicePools();
  Object.keys(spentNow).forEach(die => { spentNow[die] = clamp(spentNow[die] + (spentBefore[die] || 0) - (spentAfter[die] || 0), 0, pools[die]); });
  setHitDiceSpent(spentNow);
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
  if (Number(before.pactSlotUsage || 0) > Number(after.pactSlotUsage || 0)) character.pactSlotUsage = Number(character.pactSlotUsage || 0) + Number(before.pactSlotUsage) - Number(after.pactSlotUsage || 0);
  if (before.maxHpBonus && !after.maxHpBonus && !character.maxHpBonus) character.maxHpBonus = before.maxHpBonus;
  character.restLog = before.restLog;
  persistAndRender();
}

// Heroes' Feast's +HP maximum lasts 24 hours (PHB p.250): the player ends it when that time is up.
function endHeroesFeast() {
  const feast = Number(character.maxHpBonuses?.["heroes-feast"] || 0);
  character.maxHpBonus = Math.max(0, Number(character.maxHpBonus || 0) - feast);
  delete character.maxHpBonuses["heroes-feast"];
  persistAndRender();
  showToast(`<span class="toast-label">Heroes' Feast ends</span><span>HP maximum back to ${effectiveMaxHp()}.</span>`);
}

// Long rest: regain up to `count` spent Hit Dice, largest first (PHB p.186).
function regainHitDice(count) {
  const spent = hitDiceSpent();
  Object.keys(spent).map(Number).sort((a, b) => b - a).forEach(die => {
    const back = Math.min(count, spent[die]);
    spent[die] -= back;
    count -= back;
  });
  setHitDiceSpent(spent);
}

// Charged items regain what their notes say at dawn ("regains 1d6 + 1 expended charges"); others refill completely.
function rechargeItem(item) {
  delete item.dawnUsed;
  const used = Number(item.grantUsed || 0);
  if (!used) return;
  const dice = String(item.notes || "").match(/regains (\d*d\d+(?:\s*\+\s*\d+)?)(?: expended)? charges/i)?.[1];
  item.grantUsed = dice ? Math.max(0, used - rollFormula(dice.replace(/\s+/g, "")).total) : 0;
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

// Arcane Recovery (wizard) and Natural Recovery (Circle of the Land), once per day after a short rest: recover spent
// slots totalling up to half that class's level (rounded up), none 6th level or higher. Each feature has its own budget.
function recoveryFeatures() {
  return [["Arcane Recovery", classLevel("wizard")], ["Natural Recovery", subclassLevel("land")]]
    .filter(([name, level]) => level > 0 && Number(character.resources.find(item => item.name === name)?.current) > 0)
    // Arcane Grimoire (TCE): Arcane Recovery regains one more slot level.
    .map(([name, level]) => ({ name, budget: Math.ceil(level / 2) + (name === "Arcane Recovery" && activeItemNamed(/arcane grimoire/i) ? 1 : 0) }));
}

function recoveryFeatureName() {
  return recoveryFeatures()[0]?.name || "";
}

// The spent slots a budget could recover, highest first (what the picker offers).
function arcaneRecoveryPlan(budget = recoveryFeatures()[0]?.budget || 0) {
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

// Pick the slots one at a time; the feature is spent with the first slot recovered.
function useArcaneRecovery(name = recoveryFeatureName(), budget = null, started = false) {
  const level = name === "Natural Recovery" ? subclassLevel("land") : classLevel("wizard");
  const feature = character.resources.find(item => item.name === name);
  const left = budget ?? recoveryFeatures().find(item => item.name === name)?.budget ?? Math.ceil(level / 2);
  const choices = [1, 2, 3, 4, 5].filter(slot => slot <= left && Number(character.spellSlotUsage?.[slot] || 0) > 0);
  if (!feature || (!started && Number(feature.current) < 1) || !choices.length) {
    showToast(`<span class="toast-label">${escapeHtml(name || "Arcane Recovery")}</span><span>${started ? "Done recovering slots." : "No spent slots to recover, or it's already used today."}</span>`);
    return;
  }
  showToast(`<span class="toast-label">${escapeHtml(name)}</span><span>Recover spent slots worth up to ${left} more level${left === 1 ? "" : "s"} (none above 5th).</span>`, {
    tone: started ? "crit" : "",
    actions: [
      ...choices.reverse().map(slot => ({
        label: `Recover a ${ordinal(slot)}`,
        run: () => {
          if (!started) feature.current = Number(feature.current) - 1;
          character.spellSlotUsage[slot] = Math.max(0, Number(character.spellSlotUsage[slot] || 0) - 1);
          persistAndRender();
          useArcaneRecovery(name, left - slot, true);
        }
      })),
      ...(started ? [{ label: "Done", run: () => {} }] : [])
    ],
    persist: true
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
    node.querySelector(".resource-name").value = resource.label || resource.name;
    node.querySelector(".resource-current").value = resource.current;
    node.querySelector(".resource-max").value = resource.max;
    node.querySelector(".resource-name").title = resource.name;
    if (resource.auto) {
      node.querySelector(".resource-max").readOnly = true;
      node.querySelector(".resource-max").title = "Set by your class and level";
      // A renamed class pool would stop matching its feature and come back as a duplicate.
      node.querySelector(".resource-name").readOnly = Boolean(resource.label);
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
    infusion: ["Infused Item", 0, 0, "manual", "Record the infusion and the item it's on. It lasts until you replace it."],
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
      ${CONDITIONS.map(condition => `<button type="button" title="${escapeHtml([conditionTagText(condition), conditionRule(condition)].filter(Boolean).join(". "))}" class="condition-chip ${active.has(condition) ? "active" : ""}" aria-pressed="${active.has(condition)}" data-condition="${condition}">${condition}${conditionTag(condition)?.dc ? ` · ${escapeHtml(conditionTag(condition).ability.toUpperCase())} DC ${Number(conditionTag(condition).dc)}` : ""}</button>`).join("")}
    </div>
    ${[...active].filter(condition => CONDITIONS.includes(condition)).map(condition => `
      <article class="condition-card active">
        <strong>${escapeHtml(condition)}${conditionTagText(condition) ? ` <small class="condition-tag-text">${escapeHtml(conditionTagText(condition))}</small>` : ""}</strong>
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
    const speed = effectiveSpeed();
    return `<div class="condition-actions"><button type="button" class="secondary" data-stand-up ${speed ? "" : "disabled title=\"Your speed is 0\""}>${speed ? `Stand up (costs ${Math.ceil(speed / 2)} ft)` : "Can't stand: speed 0"}</button></div>`;
  }
  if (!REPEAT_SAVE_CONDITIONS.includes(condition)) return "";
  const tag = character.conditionSaves?.[condition] || {};
  const attrs = key => `data-tag-field="${key}" data-condition-name="${condition}"`;
  return `
    <div class="condition-actions">
      <span>Repeat save</span>
      ${tag.ability && tag.dc ? `<button type="button" class="secondary" data-tagged-save="${condition}">${escapeHtml(tag.ability.toUpperCase())} save DC ${Number(tag.dc)}</button>` : ABILITIES.map(([id, name]) => `<button type="button" class="ghost" data-repeat-save="${id}" data-condition-name="${condition}" title="Roll a ${name} save to end ${condition}">${id.toUpperCase()}</button>`).join("")}
    </div>
    <div class="condition-tag">
      <label>Source <input ${attrs("source")} value="${escapeHtml(tag.source || "")}" placeholder="Hold Person" size="10" autocomplete="off"></label>
      <label>Save <select ${attrs("ability")}><option value="">-</option>${ABILITIES.map(([id]) => `<option value="${id}" ${tag.ability === id ? "selected" : ""}>${id.toUpperCase()}</option>`).join("")}</select></label>
      <label>DC <input ${attrs("dc")} type="number" min="1" max="30" value="${escapeHtml(tag.dc || "")}" inputmode="numeric"></label>
      <label>Repeat <select ${attrs("when")}><option value="">Not tracked</option>${Object.entries(CONDITION_SAVE_TIMES).map(([id, text]) => `<option value="${id}" ${tag.when === id ? "selected" : ""}>${escapeHtml(text)}</option>`).join("")}</select></label>
    </div>
  `;
}

// "Save ends" tags (Hold Person: Paralyzed, WIS DC 11, repeat at the end of each turn). Next turn and damage
// prompt the repeat save; a success ends the condition.
const CONDITION_SAVE_TIMES = { end: "end of each turn", start: "start of each turn", damage: "when damaged", "end-damage": "end of each turn and when damaged" };

function conditionTag(condition) {
  const tag = character.conditionSaves?.[condition];
  return tag && (character.conditions || []).includes(condition) ? tag : null;
}

function conditionTagText(condition) {
  const tag = conditionTag(condition);
  if (!tag) return "";
  return [tag.source, tag.ability && tag.dc ? `${tag.ability.toUpperCase()} DC ${tag.dc}` : "", CONDITION_SAVE_TIMES[tag.when] || ""].filter(Boolean).join(", ");
}

// trigger "turn" (Next turn: end- and start-of-turn saves) or "damage".
function conditionSaveActions(trigger) {
  return (character.conditions || []).filter(condition => {
    const tag = conditionTag(condition);
    return tag?.ability && tag.dc && (trigger === "damage" ? /damage/.test(tag.when || "") : /end|start/.test(tag.when || ""));
  }).map(condition => {
    const tag = conditionTag(condition);
    const when = trigger === "damage" ? "Damaged" : tag.when === "start" ? "Start of turn" : "End of turn";
    return { label: `${when}: ${tag.ability.toUpperCase()} save DC ${tag.dc} vs ${condition}`, run: () => rollConditionSave(condition) };
  });
}

function rollConditionSave(condition) {
  const tag = conditionTag(condition);
  if (!tag?.ability || !tag.dc) return;
  // Paralyzed and similar fail STR and DEX saves outright; rollSavingThrow explains that.
  if (autoFailCondition(tag.ability)) return rollSavingThrow(tag.ability, [], `condition:${condition}`);
  const name = ABILITIES.find(([id]) => id === tag.ability)?.[1] || tag.ability;
  const dc = Number(tag.dc);
  openRoll({ label: `${name} save vs ${condition} (DC ${dc})`, formula: `1d20${formatMod(saveBonus(tag.ability))}`, kind: "save", ability: tag.ability, context: `condition:${condition}`, actions: withFlashOfGenius([], "save"), onResult: result => {
    if (result.total < dc) return `Failed: still ${condition.toLowerCase()}${tag.source ? ` (${tag.source})` : ""}.`;
    character.conditions = (character.conditions || []).filter(item => item !== condition);
    persistAndRender();
    return `Success: ${condition} ends.`;
  } });
}

function handleConditionChange(event) {
  const input = event.target.closest("[data-tag-field]");
  if (!input) return;
  const condition = input.dataset.conditionName;
  const tags = character.conditionSaves = { ...(character.conditionSaves || {}) };
  const value = input.dataset.tagField === "dc" ? clamp(Math.round(Number(input.value)), 0, 30) || "" : input.value.trim();
  tags[condition] = { ...(tags[condition] || {}), [input.dataset.tagField]: value };
  persistAndRender();
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
    // Standing costs half your speed, so a speed of 0 can't pay it (PHB p.190-191).
    const speed = effectiveSpeed();
    if (!speed) {
      showToast(`<span class="toast-label">You can't stand up</span><span>Your speed is 0 (${escapeHtml(speedBreakdown().notes.join(", "))}).</span>`);
      return;
    }
    character.conditions = (character.conditions || []).filter(condition => condition !== "Prone");
    persistAndRender();
    showToast(`<span class="toast-label">You stand up</span><span>Standing costs ${Math.ceil(speed / 2)} ft: ${speed - Math.ceil(speed / 2)} ft of movement left this turn.</span>`);
    return;
  }
  const tagged = event.target.closest("[data-tagged-save]");
  if (tagged) return rollConditionSave(tagged.dataset.taggedSave);
  const repeat = event.target.closest("[data-repeat-save]");
  if (repeat) {
    const condition = repeat.dataset.conditionName;
    rollSavingThrow(repeat.dataset.repeatSave, () => [{ label: `It worked: end ${condition}`, run: () => removeCondition(condition) }], `condition:${condition}`);
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
  const immune = adding && event.detail !== "forced" && conditionImmunities().get(button.dataset.condition);
  if (immune) {
    showToast(`<span class="toast-label">Immune to ${escapeHtml(button.dataset.condition.toLowerCase())}</span><span>${escapeHtml(immune)} keeps it off you.</span>`, {
      persist: true,
      actions: [{ label: "Add it anyway", run: () => { character.conditions = [...(character.conditions || []), button.dataset.condition]; persistAndRender(); } }]
    });
    return;
  }
  if (adding) active.add(button.dataset.condition);
  else active.delete(button.dataset.condition);
  // A fresh condition starts untagged; an old tag belonged to the last time it was on.
  if (adding && character.conditionSaves?.[button.dataset.condition]) delete character.conditionSaves[button.dataset.condition];
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
  ["Free", "Stand Up", "Costs movement equal to half your speed."],
  ["Free", "Speak", "Brief words or gestures on your turn."]
];

// 2014 DMG potion healing.
const HEALING_POTIONS = { "potion of healing": "2d4+2", "potion of greater healing": "4d4+4", "potion of superior healing": "8d4+8", "potion of supreme healing": "10d4+20" };

function consumableItems() {
  return (character.equipment || []).filter(item => Number(item.quantity ?? 1) > 0 && /potion|scroll|elixir|oil of|antitoxin|healer's kit/i.test(item.name || ""));
}

// "Potion of Greater Healing" or "Potion of Healing (Greater)".
function potionHealing(name) {
  const match = String(name || "").toLowerCase().match(/potion of (?:(greater|superior|supreme) )?healing(?: \((greater|superior|supreme)\))?/);
  if (!match) return "";
  const tier = match[1] || match[2];
  return HEALING_POTIONS[`potion of ${tier ? `${tier} ` : ""}healing`];
}

function useConsumable(id) {
  const item = (character.equipment || []).find(entry => entry.id === id);
  if (!item) return;
  if (/healer's kit/i.test(item.name || "")) {
    healersKitMenu(item);
    return;
  }
  const spend = () => { item.quantity = Math.max(0, Number(item.quantity ?? 1) - 1); persistAndRender(); };
  const heal = potionHealing(item.name);
  const undo = { label: "Undo", run: () => { item.quantity = Number(item.quantity) + 1; persistAndRender(); } };
  if (heal) {
    // The potion is used up only when someone drinks it: closing the roll with Done keeps it.
    // Feeding a potion to someone else is also an action (Use an Object).
    rollFromInput(`${item.name} healing`, heal, "normal", result => [
      { label: `Heal me +${beaconHealing(character, result)}`, run: () => { spend(); healBy(beaconHealing(character, result)); } },
      ...healTargets().map(sheet => healTargetAction(sheet, `Give to ${sheet.name || "ally"} +${beaconHealing(sheet, result)}`, () => { spend(); healOther(sheet.sheetId, beaconHealing(sheet, result)); }))
    ], "Choose who drinks it. Done without choosing keeps the potion.");
    return;
  }
  spend();
  showToast(`<span class="toast-label">Used ${escapeHtml(item.name)}</span><span>${Number(item.quantity)} left.</span>`, { actions: [undo] });
}

// A healer's kit has 10 uses (PHB p.151); the item is used up only when the last one goes.
function kitUses(item) {
  return Number(item.uses ?? 10);
}

function spendKitUse(item) {
  item.uses = kitUses(item) - 1;
  if (item.uses <= 0) {
    item.quantity = Math.max(0, Number(item.quantity ?? 1) - 1);
    item.uses = item.quantity > 0 ? 10 : 0;
  }
  persist();
}

// Healer feat (PHB p.167): stabilizing with a kit also leaves the creature at 1 HP, and a kit use can restore
// 1d6 + 4 + the creature's Hit Dice total, once per creature per short or long rest.
function healersKitMenu(item) {
  const healer = hasFeat("Healer");
  const dying = otherSheets().filter(sheet => Number(sheet.hp) <= 0 && !sheet.stable && !isDead(sheet));
  const healable = healer ? [character, ...healTargets()].filter(sheet => !isDead(sheet) && !sheet.healerFeatUsed) : [];
  const actions = [
    ...dying.map(sheet => ({ label: `Stabilize ${sheet.name || "ally"}`, run: () => kitStabilize(item, sheet.sheetId) })),
    ...healable.map(sheet => ({ label: `Healer: ${sheet.sheetId === character.sheetId ? "me" : sheet.name || "ally"} (1d6+${4 + totalLevel(sheet)})`, run: () => {
      spendKitUse(item);
      rollFromInput(`Healer feat: ${sheet.name || "ally"}`, `1d6+${4 + totalLevel(sheet)}`, "normal", [], "Once per creature per short or long rest.", result => {
        let healed;
        updateSheet(sheet.sheetId, target => { target.healerFeatUsed = true; healed = applyHealing(target, result.total); });
        return `+${healed.applied} HP. Healer's kit: ${kitUses(item)} uses left.`;
      });
    } }))
  ];
  showToast(`<span class="toast-label">Healer's Kit: ${kitUses(item)} use${kitUses(item) === 1 ? "" : "s"} left</span><span>${actions.length ? "As an action, spend one use." : "No one at 0 HP needs stabilizing."}${healer ? "" : " Stabilizing needs no Medicine check."}</span>`, { actions, persist: true });
}

function kitStabilize(item, sheetId) {
  spendKitUse(item);
  const sheet = updateSheet(sheetId, target => {
    stabilizeSheet(target);
    if (hasFeat("Healer")) target.hp = Math.max(1, Number(target.hp || 0));
  });
  showToast(`<span class="toast-label">${escapeHtml(sheet?.name || "Ally")} is stable</span><span>${hasFeat("Healer") ? "Healer feat: they regain 1 HP. " : ""}Healer's kit: ${kitUses(item)} uses left.</span>`, { tone: "crit" });
}

// Stabilize a dying ally as the open character (PHB p.197); the party card picks the helper first.
function stabilizeMenu(sheetId) {
  const target = characterLibrary[sheetId];
  if (!target) return;
  const name = target.name || "Ally";
  const kit = consumableItems().find(item => /healer's kit/i.test(item.name || ""));
  const spare = (character.spells || []).some(row => row.index === "spare-the-dying");
  const actions = [
    { label: "Medicine check (DC 10)", run: () => rollWithConditions(`Medicine: stabilize ${name} (DC 10)`, `1d20${formatMod(skillBonus("medicine", "wis"))}`, "check", "wis", [], "", result => {
      if (result.total < 10) return `Failed: ${name} is still dying.`;
      updateSheet(sheetId, stabilizeSheet);
      return `Success: ${name} is stable.`;
    }) },
    kit ? { label: `Healer's kit (${kitUses(kit)} uses)`, run: () => kitStabilize(kit, sheetId) } : null,
    spare ? { label: "Spare the Dying", run: () => { updateSheet(sheetId, stabilizeSheet); showToast(`<span class="toast-label">${escapeHtml(name)} is stable</span>`, { tone: "crit" }); } } : null
  ].filter(Boolean);
  showToast(`<span class="toast-label">Stabilize ${escapeHtml(name)}</span><span>Uses your action. ${escapeHtml(character.name || "You")} must be within reach.</span>`, { actions, persist: true });
}

// Inspiring Leader (PHB p.167): up to six friendly creatures, you included, gain temp HP = your level + CHA modifier,
// each once per short or long rest.
function inspiringLeaderMenu() {
  const amount = Math.max(0, totalLevel() + mod("cha"));
  // They must hear and understand you, so not while unconscious at 0 HP.
  const targets = [character, ...otherSheets()].filter(sheet => Number(sheet.hp) > 0 && !sheet.inspiringLeaderUsed);
  showToast(`<span class="toast-label">Inspiring Leader: ${amount} temp HP</span><span>A 10-minute speech for up to 6 creatures who can hear you. Temp HP don't stack; each keeps the higher pool.</span>`, {
    actions: targets.map(sheet => ({ label: sheet.sheetId === character.sheetId ? "Me" : sheet.name || "Ally", run: () => {
      updateSheet(sheet.sheetId, target => {
        target.inspiringLeaderUsed = true;
        target.tempHp = Math.max(Number(target.tempHp || 0), amount);
      });
    } })),
    persist: true
  });
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
// Weapon and spell rows follow the sheet: equipping a weapon or readying a spell adds its rows, unequipping it or
// unpreparing the spell removes them. Rows edited by hand stay; rows the player removed stay removed.
function generatedActionKey(action) {
  if (action.source?.weapon) return `weapon:${action.source.weapon}:${action.source.grip || ""}`;
  return action.source?.spell ? `spell:${action.source.spell}` : "";
}

function spellRowReady(row) {
  if (!spellRowHasSpell(row) || row.ritualBook) return false;
  return itemForSpellRow(row) || spellLevelForRow(row) === 0 || !spellRowNeedsPreparing(row) || row.prepared || spellAlwaysPrepared(row);
}

function syncGeneratedActions() {
  const wanted = [...wornItems().flatMap(weaponActions), ...character.spells.filter(spellRowReady).map(spellAction).filter(Boolean)];
  const keys = new Set(wanted.map(generatedActionKey));
  const dismissed = new Set(character.dismissedFeatures || []);
  character.actions = character.actions.filter(action => !generatedActionKey(action) || action.source.edited || keys.has(generatedActionKey(action)));
  const present = new Set(character.actions.map(generatedActionKey));
  const names = new Set(character.actions.map(action => String(action.name || "").toLowerCase()));
  wanted.filter(action => !present.has(generatedActionKey(action)) && !dismissed.has(generatedActionKey(action)) && !names.has(action.name.toLowerCase()))
    .forEach(action => character.actions.push(action));
}

function refreshGeneratedActions() {
  syncGeneratedActions();
  let features = null;
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
        action.source = { ...action.source, ability: fresh.source.ability, smallHeavy: fresh.source.smallHeavy };
      }
    } else if (action.source.spell) {
      const row = character.spells.find(entry => entry.index === action.source.spell);
      fresh = row ? spellAction(row) : null;
    } else if (action.source.feature) {
      features ||= featureActions();
      fresh = features.find(entry => entry.source.feature === action.source.feature);
      if (fresh) action.source = { ...action.source, ...fresh.source };
    }
    if (fresh) {
      // Level-ups and state changes (Second Wind's +level, the inspiration die, Portent's rolls) change the text too.
      if (!action.source.notesEdited) action.notes = fresh.notes;
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
        <span>${/healer's kit/i.test(item.name || "") ? `${kitUses(item)} use${kitUses(item) === 1 ? "" : "s"} left` : `${Number(item.quantity ?? 1)} left`}${HEALING_POTIONS[String(item.name).toLowerCase().trim()] ? ` · heals ${HEALING_POTIONS[String(item.name).toLowerCase().trim()]}` : ""}. Drinking or using it takes an action.</span>
        <button type="button" class="secondary" data-use-consumable="${escapeHtml(item.id)}">Use</button>
      </article>`).join("") : `<p class="empty-state">No potions, scrolls or other consumables in your inventory.</p>`;
    return;
  }
  // In Wild Shape you fight with the beast's attacks (Beast form row), not your weapons.
  const visible = character.actions.filter(action => !(character.wildShape && action.source?.weapon) && (actionTypeFilter === "all" || action.type === actionTypeFilter) && (actionKindFilter === "all" || actionKind(action) === actionKindFilter));
  if (!visible.length) {
    root.innerHTML = `<p class="empty-state">${character.actions.length ? "Nothing matches these filters." : "No actions yet. Equip a weapon in Inventory and its attacks appear here, or choose Edit to add your own."}</p>`;
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
  if (event.target.classList.contains("action-notes")) {
    action.notes = event.target.value;
    if (action.source) action.source = { ...action.source, notesEdited: true };
  }
  syncActionButtons(row, action);
  persist();
}

function syncActionButtons(node, action) {
  node.querySelector(".roll-attack").style.display = /^\s*[+-]?\d+/.test(action.attack || "") ? "" : "none";
  // Improved / Superior Critical (Champion): show the range so a 19 gets called out before the roll window does.
  const critOn = actionTraits(action).weapon ? critThreshold() : 20;
  node.querySelector(".roll-attack").textContent = critOn < 20 ? `Attack · crit ${critOn}–20` : "Attack";
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
  return String(action.damage || "").replace(/\s+/g, "").match(/^(?:\d*d\d+(?:r\d+)?(?:m\d+)?|\d+)(?:[+-]\d*d?\d+(?:r\d+)?(?:m\d+)?)*/i)?.[0] || "";
}

function doubleDice(formula) {
  return formula.replace(/(\d*)d(\d+)/gi, (_, count, sides) => `${Number(count || 1) * 2}d${sides}`);
}

function handleActionClick(event) {
  const commonRoll = event.target.closest("[data-common-roll]");
  if (commonRoll) rollSkillCheck(commonRoll.dataset.commonRoll);
  const consumable = event.target.closest("[data-use-consumable]");
  if (consumable) {
    markTurnCost("Action");
    useConsumable(consumable.dataset.useConsumable);
  }
  const row = event.target.closest(".action-row");
  const action = row && character.actions.find(item => item.id === row.dataset.actionId);
  if (!action) return;
  if (event.target.closest(".use-action")) {
    // Only a use that can be paid for fills a marker; Action Surge adds an action instead.
    const [cost, amount] = action.use?.cost || [];
    if (!cost || Number(character.resources.find(item => item.name === cost)?.current) >= amount) {
      if (action.source?.feature === "action-surge") turnState().extraActions = Number(turnState().extraActions || 0) + 1;
      else markTurnCost(action.type);
    }
    useFeatureAction(action);
    return;
  }
  const spellRow = action.source?.spell && !action.source.edited && event.target.closest(".roll-damage, .roll-attack") && character.spells.find(entry => entry.index === action.source.spell);
  if (spellRow) {
    castSpellRow(spellRow);
    return;
  }
  if (event.target.closest(".roll-damage")) {
    const damage = actionDamageFormula(action);
    // A damage-only row (a save, no attack roll) is the use itself.
    if (damage && !/^\s*[+-]?\d+/.test(action.attack || "")) markTurnCost(action.type);
    if (damage) rollFromInput(...plainDamageRoll(action, damage));
    else showToast(`<span class="toast-label">${escapeHtml(action.name || "Action")}</span><span>No damage dice entered. Add something like 1d8+3.</span>`);
    return;
  }
  if (event.target.closest(".roll-attack")) {
    markTurnCost(action.type);
    rollActionAttack(action);
    return;
  }
  if (!event.target.closest(".remove-action")) return;
  const dismissKey = action.source?.feature || generatedActionKey(action);
  if (dismissKey) character.dismissedFeatures = [...new Set([...(character.dismissedFeatures || []), dismissKey])];
  character.actions = character.actions.filter(item => item.id !== action.id);
  persistAndRender();
}

// The row's own Damage button (no attack roll first) still adds the riders that are part of every hit (Rage,
// Improved Divine Smite), like the Attack -> Roll damage path does. Returns rollFromInput's label and formula.
function plainDamageRoll(action, damage) {
  const traits = actionTraits(action);
  const reroll = traits.melee ? damage.match(/d\d+(r\d+)/i)?.[1] || "" : "";
  const always = traits.weapon ? damageRiders(traits).filter(rider => rider.always) : [];
  const formula = [damage, ...always.map(rider => rider.flat ? rider.formula : withReroll(rider.formula, reroll))].join("+");
  return [`${action.name || "Action"} damage${always.length ? ` (with ${always.map(rider => rider.name).join(", ")})` : ""}`, formula, "normal"];
}

// next: an extra follow-up (the next Flurry of Blows strike) offered after this attack.
function rollActionAttack(action, suffix = "", confirmed = false, next = null) {
  const name = action.name || "Action";
  if (!confirmed && blockedByIncapacitation(() => rollActionAttack(action, suffix, true, next))) return;
  if (!confirmed && action.type === "Reaction" && reactionSpent(() => rollActionAttack(action, suffix, true, next))) return;
  const damage = actionDamageFormula(action);
  const bonus = String(action.attack || "").match(/^\s*([+-]?\d+)/)?.[1];
  if (bonus === undefined) {
    showToast(`<span class="toast-label">${escapeHtml(name)}</span><span>${escapeHtml(action.attack || "No attack bonus entered.")}${damage ? " Roll damage after the target saves." : ""}</span>`);
    return;
  }
  const traits = actionTraits(action);
  const turn = turnState();
  if (action.type === "Reaction") {
    turn.reaction = true;
    enemyTurnRiders();
  }
  if (traits.weapon) turn.rageFed = true;
  // Extra Attack (PHB p.72): the Attack action's later swings follow this one, like the next Flurry strike.
  const item = action.source?.weapon && (character.equipment || []).find(entry => entry.id === action.source.weapon);
  const attacks = action.type === "Action" && item ? extraAttacks(item) : 1;
  if (!next && !suffix && attacks > 1) {
    const chain = index => rollActionAttack(action, ` ${index} of ${attacks}`, true, index < attacks ? { label: `Next attack (${index + 1} of ${attacks})`, run: () => chain(index + 1) } : null);
    chain(1);
    return;
  }
  // Steady Aim gives advantage to the next attack only.
  const advantageFrom = turn.steadyAim ? ["Steady Aim"] : [];
  turn.steadyAim = false;
  const label = `${action.type === "Free" ? name : `${name} to hit`}${suffix}`;
  const range = traits.ranged ? String(`${item?.notes || ""} ${action.notes || ""}`).match(/(\d+)\/(\d+)/) : null;
  openRoll({
    label,
    formula: `1d20${formatMod(Number(bonus))}`,
    kind: "attack",
    ability: action.source?.ability || "",
    context: traits.melee && traits.strength ? "str-melee" : traits.weapon ? "weapon" : "",
    advantageFrom,
    disadvantageFrom: action.source?.smallHeavy ? ["heavy weapon, Small wielder"] : [],
    critOn: traits.weapon ? critThreshold() : 20,
    powerAttack: item && !weaponProficient(item) ? "" : traits.melee && traits.heavy && hasFeat("Great Weapon Master") ? "Great Weapon Master" : traits.rangedWeapon && hasFeat("Sharpshooter") ? "Sharpshooter" : "",
    underwaterOk: /dagger|javelin|shortsword|spear|trident|crossbow|\bnet\b|\bdarts?\b/i.test(`${name} ${item?.name || ""}`),
    rangeNote: traits.ranged ? `Ranged attack: disadvantage beyond ${range ? `${range[1]} ft (no attack past ${range[2]} ft)` : "normal range"}${hasFeat("Crossbow Expert") ? "" : " or with a hostile creature within 5 ft that can see you"}.` : "",
    // Stroke of Luck turns even a natural 1 into a hit, but not a crit.
    actions: result => [...damageFollowUps(name, withPowerAttack(damage), rollRequest?.forcedHit ? Math.max(2, naturalD20(result)) : naturalD20(result), traits), ...thrownWeaponSpent(item, action)],
    carry: next ? [next] : []
  });
}

// A thrown weapon leaves your hand: the attack takes one from the item's quantity, once per roll (the result can
// re-render), with a follow-up to put it back.
function thrownWeaponSpent(item, action) {
  const request = rollRequest;
  if (!item || action.source?.grip !== "thrown" || !request) return [];
  if (!request.thrown) {
    if (Number(item.quantity ?? 1) < 1) return [];
    item.quantity = Number(item.quantity ?? 1) - 1;
    request.thrown = { item, back: false };
    persist();
  }
  const thrown = request.thrown;
  return thrown.back ? [] : [{ label: `Undo throw (${item.name} back to ${Number(item.quantity) + 1})`, run: () => {
    if (thrown.back) return;
    thrown.back = true;
    item.quantity = Number(item.quantity) + 1;
    persistAndRender();
  } }];
}

// Great Weapon Master / Sharpshooter: the -5 to hit chip adds +10 to the damage that follows.
function withPowerAttack(damage) {
  const bonus = (rollRequest?.chips || []).filter(chip => chip.on && chip.damage).reduce((sum, chip) => sum + chip.damage, 0);
  return damage && bonus ? `${damage}+${bonus}` : damage;
}

// What kind of attack an action row is, from its source weapon or its own text. A thrown melee weapon makes a
// ranged attack when thrown (PHB p.147).
function actionTraits(action) {
  if (action.source?.spell) return { weapon: false };
  const item = action.source?.weapon && (character.equipment || []).find(entry => entry.id === action.source.weapon);
  const text = `${action.name || ""} ${action.notes || ""} ${item ? `${item.name} ${item.notes || ""}` : ""}`.toLowerCase();
  const traits = weaponTraits(text);
  const grip = action.source?.grip || "";
  const thrown = grip === "thrown";
  return {
    weapon: true,
    melee: !traits.rangedWeapon && !thrown,
    ranged: traits.rangedWeapon || thrown,
    rangedWeapon: traits.rangedWeapon,
    finesse: traits.finesse,
    heavy: traits.heavy,
    twoHanded: traits.twoHanded || grip === "two-handed",
    pactWeapon: Boolean(item) && item.id === pactWeaponId(),
    kensei: kenseiWeapon(item),
    damageType: String(action.damage || "").match(/\b(bludgeoning|piercing|slashing)\b/i)?.[1]?.toLowerCase() || "",
    strength: action.source?.ability ? action.source.ability === "str" : !traits.rangedWeapon && !traits.finesse
  };
}

function weaponTraits(text) {
  return {
    rangedWeapon: /\branged weapon\b|ammunition|crossbow|\bbow\b|longbow|shortbow|\bsling\b|\bdarts?\b|blowgun|\bnet\b/.test(text),
    thrown: /\bthrown\b/.test(text),
    finesse: /finesse/.test(text) || (hasFeat("Revenant Blade") && /double-bladed scimitar/.test(text)),
    heavy: /\bheavy\b/.test(text),
    twoHanded: /two-handed/.test(text),
    // The property only: "Light Crossbow" is not a light weapon.
    light: /,\s*light\b/.test(text)
  };
}

// Damage that rides on a hit. "always" riders are part of every such hit (Rage, Improved Divine Smite, Lifedrinker);
// the rest get their own button so the player decides whether they apply. "once" riders work once per turn.
function damageRiders(options = {}) {
  const riders = [];
  const once = new Set(turnState().riders || []);
  const add = rider => { if (!rider.once || !once.has(rider.once)) riders.push(rider); };
  const barbarian = classLevel("barbarian");
  if (rageActive() && options.melee && options.strength) add({ name: "Rage", formula: String(barbarian >= 16 ? 4 : barbarian >= 9 ? 3 : 2), flat: true, always: true });
  // Improved Divine Smite (PHB p.85): every melee weapon hit deals an extra 1d8 radiant from 11th level.
  if (options.weapon && options.melee && classLevel("paladin") >= 11) add({ name: "Improved Divine Smite", formula: "1d8", always: true });
  if (character.concentration === "Hex") add({ name: "Hex", formula: "1d6" });
  if (options.weapon && character.concentration === "Hunter's Mark") add({ name: "Hunter's Mark", formula: "1d6" });
  if (hexbladeCurseActive()) add({ name: "Curse", formula: String(proficiencyBonus()), flat: true });
  const ranger = classLevel("ranger");
  if (character.concentration === "Favored Foe") add({ name: "Favored Foe", formula: `1d${ranger >= 14 ? 8 : ranger >= 6 ? 6 : 4}`, once: "favored-foe" });
  if (options.weapon && hunterOption("Colossus Slayer")) add({ name: "Colossus Slayer (target below max HP)", formula: "1d8", once: "colossus" });
  if (options.weapon && subclassLevel("gloom-stalker") >= 3 && turnState().round === 1) add({ name: "Dread Ambusher (first turn)", formula: "1d8", once: "dread" });
  if (ranger >= 20) add({ name: "Foe Slayer (favored enemy)", formula: String(mod("wis")), flat: true, once: "foe-slayer" });
  // Zealot Divine Fury (XGE p.11): the first weapon hit each turn while raging.
  if (options.weapon && rageActive() && subclassLevel("zealot") >= 3) add({ name: "Divine Fury", formula: `1d6+${Math.floor(subclassLevel("zealot") / 2)}`, once: "divine-fury" });
  // Divine Strike (cleric 8, PHB p.60-63, XGE, TCE) or the Tasha's Blessed Strikes replacement (TCE p.30: weapon
  // attacks and cantrips), once per turn.
  const cleric = classLevel("cleric");
  const blessed = cleric >= 8 && optionalFeatureTaken("blessedStrikes");
  if (blessed && (options.weapon || options.cantrip)) add({ name: "Blessed Strikes (radiant)", formula: "1d8", once: "divine-strike" });
  else if (options.weapon && cleric >= 8) {
    const domain = classEntries().filter(entry => entry.classId === "cleric").map(entry => subclassIndexFor(entry) || normalizedSubclassKey(entry.subclassName)).find(Boolean);
    // VERIFY: blood (TDCSR) Divine Strike type from the app's own feature row; TDCSR text isn't available locally.
    const type = { life: "radiant", tempest: "thunder", trickery: "poison", war: "weapon type", nature: "cold, fire or lightning", death: "necrotic", forge: "fire", order: "psychic", twilight: "radiant", blood: "necrotic" }[domain];
    if (type) add({ name: `Divine Strike (${type})`, formula: cleric >= 14 ? "2d8" : "1d8", once: "divine-strike" });
  }
  // Sneak Attack (PHB p.96): finesse or ranged weapon, with advantage or an ally next to the target, once per turn.
  if (options.weapon && (options.finesse || options.rangedWeapon) && classLevel("rogue")) {
    const swash = subclassLevel("swashbuckler") >= 3 ? ", or no one else within 5 ft of you" : "";
    add({ name: `Sneak Attack (advantage, or an ally next to the target${swash})`, formula: `${Math.ceil(classLevel("rogue") / 2)}d6`, once: "sneak" });
  }
  featureDamageRiders(options).forEach(add);
  return riders;
}

// Riders for a cantrip that needs no attack roll (Sacred Flame, Toll the Dead): Blessed Strikes, once per turn.
function cantripRiderFollowUps(name) {
  return damageRiders({ cantrip: true }).filter(rider => rider.once === "divine-strike").map(rider => ({
    label: `${rider.name} +${rider.formula} (once per turn)`,
    run: () => {
      const turn = turnState();
      turn.riders = [...new Set([...(turn.riders || []), rider.once])];
      rollFromInput(`${name} + ${rider.name}`, rider.formula, "normal");
    }
  }));
}

// Hexblade's Curse lasts 1 minute on one target (XGE p.55); it's tracked as a timed effect.
function hexbladeCurseActive() {
  return subclassLevel("hexblade") > 0 && hasEffect("Hexblade's Curse") && !incapacitatedBy();
}

// Champion: Improved Critical (19-20) at 3rd, Superior Critical (18-20) at 15th (PHB p.72).
function critThreshold() {
  if (subclassLevel("champion")) {
    if (subclassLevel("champion") >= 15) return 18;
    if (subclassLevel("champion") >= 3) return 19;
  }
  return 20;
}

// Brutal Critical: extra weapon damage dice on a melee crit (1/2/3 at 9/13/17).
// Half-Orc Savage Attacks (PHB p.41) adds one more die on a melee weapon crit.
function brutalCriticalDice() {
  const savage = /half-orc/i.test(character.species || "") ? 1 : 0;
  const level = classLevel("barbarian");
  return savage + (level >= 17 ? 3 : level >= 13 ? 2 : level >= 9 ? 1 : 0);
}

// Great Weapon Fighting's reroll covers every damage die of the attack, so extra dice carry the base's rN.
function withReroll(formula, reroll) {
  return reroll ? formula.replace(/(\d*d\d+)(?!\d|r)/gi, `$1${reroll}`) : formula;
}

function damageFollowUps(name, formula, natural, options = {}) {
  if (!formula) return [];
  // A natural 1 always misses (PHB p.194).
  if (Number(natural) === 1) return [];
  // Improved/Superior Critical cover weapon attacks only; Hexblade's Curse covers any attack.
  const crit = Number(natural) >= (options.weapon ? critThreshold() : 20);
  const curseCrit = !crit && Number(natural) >= 19 && hexbladeCurseActive();
  const reroll = options.melee ? formula.match(/d\d+(r\d+)/i)?.[1] || "" : "";
  const build = isCrit => {
    let base = isCrit ? doubleDice(formula) : formula;
    const die = formula.match(/\d*d(\d+)/i)?.[1];
    // Piercer (TCE p.80): one extra damage die on a crit with piercing damage.
    const extra = (isCrit && options.melee ? brutalCriticalDice() : 0) + (isCrit && options.damageType === "piercing" && hasFeat("Piercer") ? 1 : 0);
    if (extra && die) base = `${base}+${extra}d${die}${reroll}`;
    const scaled = rider => ({ ...rider, formula: withReroll(isCrit && !rider.flat ? doubleDice(rider.formula) : rider.formula, rider.flat ? "" : reroll) });
    const riders = damageRiders(options).map(scaled);
    const always = riders.filter(rider => rider.always);
    always.forEach(rider => { base = `${base}+${rider.formula}`; });
    return { base, riders: riders.filter(rider => !rider.always), always: always.map(rider => rider.name) };
  };
  const followUps = (isCrit, list) => {
    const { base, riders, always } = build(isCrit);
    const title = `${name} ${isCrit ? "critical " : ""}damage${always.length ? ` (with ${always.join(", ")})` : ""}`;
    const after = damageRollFollowUps(name, formula, options, isCrit);
    const detail = damageRollDetail(options, isCrit, formula);
    const use = picked => () => {
      const turn = turnState();
      turn.riders = [...new Set([...(turn.riders || []), ...picked.map(rider => rider.once).filter(Boolean)])];
      picked.filter(rider => rider.spend).forEach(({ spend: [resource, amount] }) => {
        const tracker = character.resources.find(item => item.name === resource);
        if (tracker) tracker.current = Math.max(0, Number(tracker.current) - amount);
      });
      rollFromInput(`${title}${picked.length ? ` + ${picked.map(rider => rider.name.replace(/ \(.*/, "")).join(" + ")}` : ""}`, [base, ...picked.map(rider => rider.formula)].join("+"), "normal", after, detail);
    };
    const labelText = list.label;
    list.actions.push({ label: labelText, run: use([]) });
    riders.forEach(rider => list.actions.push({ label: `${labelText} + ${rider.name}`, run: use([rider]) }));
    if (riders.length > 1) list.actions.push({ label: `${labelText} + all`, run: use(riders) });
    smiteActions(isCrit, options, reroll).forEach(action => list.actions.push(action));
    if (isCrit && options.melee && hasFeat("Great Weapon Master")) list.actions.push({ label: "Great Weapon Master: bonus attack", run: () => showToast(`<span class="toast-label">Great Weapon Master</span><span>A melee crit (or dropping a creature to 0 HP) lets you make one melee weapon attack as a bonus action.</span>`) });
  };
  const actions = [];
  followUps(crit, { label: crit ? `Roll crit damage${Number(natural) < 20 ? ` (${natural})` : ""}` : "Roll damage", actions });
  if (curseCrit) followUps(true, { label: "Crit damage (19, cursed target)", actions });
  // A hit can be a crit without a high roll: a paralyzed or unconscious target within 5 ft (PHB p.290-292), or a
  // surprised creature hit by an Assassin (PHB p.97).
  if (!crit && !curseCrit) {
    actions.push({ label: subclassLevel("assassin") >= 3 ? "It's a crit (surprised, paralyzed or unconscious target)" : "It's a crit (paralyzed or unconscious target within 5 ft)", run: () => {
      const critActions = [];
      followUps(true, { label: "Roll crit damage", actions: critActions });
      showToast(`<span class="toast-label">${escapeHtml(name)}: critical hit</span><span>Pick the damage to roll.</span>`, { actions: critActions, persist: true });
    } });
  }
  return actions;
}

// Notes for the damage roll itself (Slasher, Crusher, Piercer riders that change the target, not the number).
function damageRollDetail(options, isCrit, formula = "") {
  const notes = [];
  // Name the extra crit dice (the formula alone reads "2d12r2+3+1d12r2").
  const die = formula.match(/\d*d(\d+)/i)?.[1];
  const savage = /half-orc/i.test(character.species || "") ? 1 : 0;
  const brutal = brutalCriticalDice() - savage;
  if (isCrit && die && options.melee && savage) notes.push(`+1d${die} Savage Attacks.`);
  if (isCrit && die && options.melee && brutal) notes.push(`+${brutal}d${die} Brutal Critical.`);
  if (isCrit && die && options.damageType === "piercing" && hasFeat("Piercer")) notes.push(`+1d${die} Piercer.`);
  if (options.damageType === "slashing" && hasFeat("Slasher")) notes.push(isCrit ? "Slasher: the target has disadvantage on attacks until your next turn; once per turn its speed drops 10 ft." : "Slasher: once per turn the target's speed drops 10 ft until your next turn.");
  if (options.damageType === "bludgeoning" && hasFeat("Crusher")) notes.push(isCrit ? "Crusher: attacks against the target have advantage until your next turn; once per turn you can push it 5 ft." : "Crusher: once per turn you can push the target 5 ft.");
  return notes.join(" ");
}

// Follow-ups on a weapon damage roll: Savage Attacker and Piercer rerolls (once per turn each).
function damageRollFollowUps(name, formula, options, isCrit) {
  const actions = [];
  const turn = turnState();
  const dice = (isCrit ? doubleDice(formula) : formula).match(/\d*d\d+(?:r\d+)?/gi) || [];
  if (options.weapon && options.melee && hasFeat("Savage Attacker") && dice.length && !turn.savage) {
    actions.push({ label: "Savage Attacker: reroll the weapon dice", run: () => {
      turnState().savage = true;
      rollFromInput(`${name} weapon dice (Savage Attacker)`, dice.join("+"), "normal", [], "Use whichever roll of the weapon's dice is higher.");
    } });
  }
  // Valor's Combat Inspiration (PHB p.55): a held die can go on a weapon damage roll.
  const valor = character.resources.find(item => item.inspirationFrom && /\(Valor\)/.test(item.name) && Number(item.current) > 0 && item.die);
  if (options.weapon && valor) {
    actions.push({ label: `+ Combat Inspiration (d${valor.die})`, run: () => {
      valor.current = 0;
      persistAndRender();
      rollFromInput(`${name} (Combat Inspiration)`, `1d${valor.die}`, "normal", [], "Add this to the weapon's damage.");
    } });
  }
  const die = formula.match(/\d*d(\d+)/i)?.[1];
  if (options.damageType === "piercing" && hasFeat("Piercer") && die && !turn.piercer) {
    actions.push({ label: `Piercer: reroll one d${die}`, run: () => {
      turnState().piercer = true;
      rollFromInput(`${name} (Piercer reroll)`, `1d${die}`, "normal", [], "Replace one of the damage dice with this roll.");
    } });
  }
  return actions;
}

// Divine Smite (PHB p.85): after a melee weapon hit, spend a slot for 2d8 radiant +1d8 per slot level above 1st
// (max 5d8), +1d8 against undead or a fiend. Multiclass Pact Magic slots are spell slots too.
function smiteActions(isCrit, options, reroll = "") {
  const actions = [];
  const slots = characterSpellSlots();
  const crit = count => `${isCrit ? count * 2 : count}d8${reroll}`;
  const smite = (level, label) => {
    const dice = Math.min(5, level + 1);
    persistAndRender();
    rollFromInput(label, crit(dice), "normal", [{ label: "Target is undead or a fiend: +1d8", run: () => rollFromInput("Divine Smite (undead or fiend)", crit(1), "normal") }], "Radiant damage.");
  };
  if (classLevel("paladin") >= 2 && options.weapon && options.melee) {
    slots.forEach((count, index) => {
      const level = index + 1;
      if (!count || slotRemaining(level, count) <= 0) return;
      actions.push({ label: `Divine Smite (${ordinal(level)} slot)`, run: () => {
        if (Number(character.spellSlotUsage?.[level] || 0) >= count) return;
        character.spellSlotUsage[level] = Number(character.spellSlotUsage?.[level] || 0) + 1;
        smite(level, `Divine Smite (${ordinal(level)}-level slot)`);
      } });
    });
    const pact = pactSlotPool();
    if (pact?.left > 0) {
      actions.push({ label: `Divine Smite (${ordinal(pact.level)} pact slot)`, run: () => {
        if (!pactSlotPool()?.left) return;
        character.pactSlotUsage = Number(character.pactSlotUsage || 0) + 1;
        smite(pact.level, `Divine Smite (${ordinal(pact.level)}-level pact slot)`);
      } });
    }
  }
  return actions;
}

// Extra Attack from two classes doesn't stack (PHB p.164); take the best one.
function extraAttacks(item = null) {
  const fighter = classLevel("fighter");
  const best = [fighter >= 20 ? 4 : fighter >= 11 ? 3 : fighter >= 5 ? 2 : 1];
  if (["barbarian", "bloodhunter", "monk", "paladin", "ranger"].some(id => classLevel(id) >= 5)) best.push(2);
  // Subclass Extra Attack: Valor/Swords bards and Bladesingers at 6th, Battle Smith/Armorer artificers at 5th.
  if (subclassLevel("valor", "swords", "bladesinging") >= 6) best.push(2);
  if (subclassLevel("battle-smith", "armorer") >= 5) best.push(2);
  // Thirsting Blade (warlock 5): two attacks with the pact weapon.
  if (classLevel("warlock") >= 5 && hasInvocation("Thirsting Blade") && item?.id && item.id === pactWeaponId()) best.push(2);
  return Math.max(...best);
}

// Weapons with the special property (PHB p.147) can't be Dedicated or Kensei weapons.
const SPECIAL_WEAPON = /\bspecial\b|\blance\b|\bnet\b/;

// Way of the Kensei (XGE p.34): weapon types picked with the class choices (classChoices.kenseiWeapons).
function kenseiWeapon(item) {
  if (!item || subclassLevel("kensei") < 3) return false;
  const name = String(item.name || "").toLowerCase();
  return classChoiceNames("kenseiWeapons").some(pick => pick === item.id || (pick && name.includes(pick.toLowerCase())));
}

// Items the catalog marks as something other than a weapon never make attack rows (a potion's 2d4 isn't an attack).
const NOT_A_WEAPON = /^(potion|scroll|wand|ring|wondrous item|armor|adventuring gear|tool|ammunition|spellcasting focus)\b/i;

// One generated action per way of wielding the weapon: versatile two-handed, thrown, off-hand and feat bonus attacks.
function weaponActions(item) {
  const notes = String(item.notes || "");
  const die = notes.match(/\b(\d+d\d+)\b/)?.[1];
  if (!die || NOT_A_WEAPON.test(notes)) return [];
  const text = `${item.name} ${notes}`.toLowerCase();
  const traits = weaponTraits(text);
  const versatile = notes.match(/versatile\s*\(?\s*(\d+d\d+)/i)?.[1];
  const grips = [{ grip: "", die }];
  if (versatile) grips.push({ grip: "two-handed", die: versatile });
  if (traits.thrown && !traits.rangedWeapon) grips.push({ grip: "thrown", die });
  if (offHandWeapons().includes(item)) grips.push({ grip: "off-hand", die });
  // Polearm Master (PHB p.168, 2018 errata adds the spear): a 1d4 bludgeoning butt-end attack as a bonus action.
  if (hasFeat("Polearm Master") && /glaive|halberd|quarterstaff|spear/.test(text)) grips.push({ grip: "butt end", die: "1d4" });
  // Crossbow Expert (PHB p.165): a bonus-action hand crossbow attack after attacking with a one-handed weapon.
  if (hasFeat("Crossbow Expert") && /hand crossbow/.test(text)) grips.push({ grip: "bonus attack", die });
  // Double-bladed scimitar (ERLW p.21): after the Attack action, a bonus-action attack with the other blade for 1d4.
  if (/double-bladed scimitar/.test(text)) grips.push({ grip: "other blade", die: "1d4" });
  return grips.map(entry => weaponAction(item, entry.grip, entry.die, text)).filter(Boolean);
}

const BONUS_GRIPS = ["off-hand", "butt end", "bonus attack", "other blade"];

// Two-weapon fighting (PHB p.195): two light melee weapons (any one-handed melee weapons with Dual Wielder).
function offHandWeapons() {
  const fits = item => {
    const notes = String(item.notes || "");
    if (!/\d+d\d+/.test(notes) || NOT_A_WEAPON.test(notes)) return false;
    const traits = weaponTraits(`${item.name} ${notes}`.toLowerCase());
    return !traits.rangedWeapon && (traits.light || (hasFeat("Dual Wielder") && !traits.twoHanded));
  };
  const weapons = wornItems().filter(fits);
  return weapons.length >= 2 ? weapons : [];
}

function weaponAction(item, grip = "", die = "", text = `${item.name} ${item.notes || ""}`.toLowerCase()) {
  const notes = String(item.notes || "");
  die = die || notes.match(/\b(\d+d\d+)\b/)?.[1];
  if (!die) return null;
  const traits = weaponTraits(text);
  const thrown = grip === "thrown";
  const melee = !traits.rangedWeapon && !thrown;
  const notes2 = [];
  let ability = traits.finesse ? (mod("dex") > mod("str") ? "dex" : "str") : traits.rangedWeapon ? "dex" : "str";
  // Martial Arts (PHB p.78): shortswords and simple melee weapons without two-handed or heavy (plus a Tasha's
  // Dedicated Weapon or a Kensei weapon, which may be ranged) use DEX and the Martial Arts die, but only without armor
  // or a shield.
  const monkLevel = classLevel("monk");
  const dedicated = optionalRule("tashas") && character.combatChoices?.dedicatedWeapon === item.id && !traits.heavy && !SPECIAL_WEAPON.test(text);
  const monkWeapon = monkLevel > 0 && monkUnarmored() && (dedicated || kenseiWeapon(item) || (!traits.rangedWeapon && !traits.heavy && !traits.twoHanded && (/simple/.test(text) || /shortsword/.test(text))));
  if (monkWeapon) {
    if (mod("dex") > mod(ability)) ability = "dex";
    const martial = martialArtsDie(monkLevel);
    const [count, sides] = die.split("d").map(Number);
    if (count === 1 && sides < martial) die = `1d${martial}`;
    notes2.push("Martial Arts.");
  }
  // Hex Warrior (XGE p.55): CHA for the one weapon picked after a long rest (not two-handed) and any pact weapon.
  const pact = item.id === pactWeaponId();
  const hexChoice = character.combatChoices?.hexWarriorWeapon || wornItems().find(entry => /\d+d\d+/.test(entry.notes || "") && !NOT_A_WEAPON.test(entry.notes || "") && !weaponTraits(`${entry.name} ${entry.notes}`.toLowerCase()).twoHanded)?.id;
  const hexWarrior = subclassLevel("hexblade") > 0 && ((hexChoice === item.id && !traits.twoHanded) || pact) && mod("cha") > mod(ability);
  if (hexWarrior) {
    ability = "cha";
    notes2.push("Hex Warrior: uses Charisma.");
  }
  const adjust = featureWeaponAdjust(item, traits, ability, notes2);
  ability = adjust.ability;
  // Small creatures have disadvantage with heavy weapons (PHB p.147).
  const smallHeavy = traits.heavy && characterSize() === "Small";
  if (smallHeavy) notes2.push("Disadvantage: heavy weapon in a Small creature's hands.");
  const magic = itemMagicBonus(item) + adjust.bonus;
  const proficient = pact || weaponProficient(item) || kenseiWeapon(item);
  let toHit = (proficient ? proficiencyBonus() : 0) + mod(ability) + magic;
  let damageBonus = mod(ability) + magic;
  if (!proficient) notes2.push("Not proficient: no proficiency bonus to hit.");
  let rerolls = "";
  if (hasStyle("Archery") && traits.rangedWeapon) {
    toHit += 2;
    notes2.push("Archery +2.");
  }
  const otherWeapon = wornItems().some(entry => entry !== item && /\d+d\d+/.test(entry.notes || "") && !NOT_A_WEAPON.test(entry.notes || ""));
  if (hasStyle("Dueling") && melee && !traits.twoHanded && grip !== "two-handed" && !BONUS_GRIPS.includes(grip) && !otherWeapon) {
    damageBonus += 2;
    notes2.push("Dueling +2 (no other weapon in hand).");
  }
  if (hasStyle("Great Weapon Fighting") && melee && (traits.twoHanded || grip === "two-handed")) {
    rerolls = "r2";
    notes2.push("Great Weapon Fighting: reroll 1s and 2s once.");
  }
  if (hasStyle("Thrown Weapon Fighting") && traits.thrown && (thrown || traits.rangedWeapon)) {
    damageBonus += 2;
    notes2.push("Thrown Weapon Fighting +2.");
  }
  if (grip === "off-hand" && !hasStyle("Two-Weapon Fighting")) {
    damageBonus = Math.min(0, mod(ability)) + magic;
    notes2.push("Off-hand: no ability modifier to damage unless it's negative.");
  }
  // Sacred Weapon (PHB p.86): + CHA (minimum +1) to weapon attack rolls while it lasts.
  if (hasEffect("Sacred Weapon")) {
    toHit += Math.max(1, mod("cha"));
    notes2.push("Sacred Weapon.");
  }
  if (hasFeat("Crossbow Expert") && /crossbow/.test(text)) notes2.push("Crossbow Expert: ignore loading.");
  if (hasFeat("Gunner") && /firearm|pistol|musket/.test(text)) notes2.push("Gunner: ignore loading; no disadvantage for an enemy within 5 ft.");
  if (hasFeat("Polearm Master") && /glaive|halberd|pike|quarterstaff|spear/.test(text)) notes2.push("Polearm Master: opportunity attack when a creature enters your reach.");
  const attacks = grip === "" || grip === "two-handed" || thrown ? extraAttacks(item) : 1;
  if (attacks > 1) notes2.push(`Attack action: ${attacks} attacks.`);
  const range = thrown ? notes.match(/thrown\s*\(?\s*(?:range\s*)?(\d+\/\d+)/i)?.[1] : "";
  if (range) notes2.push(`Thrown ${range} ft.`);
  const damageType = grip === "butt end" ? "bludgeoning" : notes.match(/\d+d\d+\s+([a-z]+)/i)?.[1] || "";
  return {
    id: crypto.randomUUID(),
    name: `${item.name || "Weapon"}${grip ? ` (${grip})` : ""}`,
    type: BONUS_GRIPS.includes(grip) ? "Bonus Action" : "Action",
    attack: formatMod(toHit),
    damage: `${die}${rerolls}${formatMod(damageBonus)}${damageType ? ` ${damageType}` : ""}`,
    notes: `${notes2.join(" ")} ${notes}`.trim(),
    source: { weapon: item.id, grip, ability, ...(smallHeavy ? { smallHeavy } : {}) }
  };
}

// Class features that act at the table. "use" describes what the Use button does and what it spends.
// Each class adds its rows from its own level, so a feature works the same in any multiclass position.
function featureActions() {
  const prof = proficiencyBonus();
  const actions = [];
  const add = (key, fields) => actions.push({ id: crypto.randomUUID(), attack: "", damage: "", notes: "", ...fields, source: { ...(fields.source || {}), feature: key } });
  classEntries().forEach(entry => CLASS_FEATURE_ACTIONS[entry.classId]?.({ level: entry.level, subclass: subclassIndexFor(entry), add, prof, entry }));
  if (hasFeat("Inspiring Leader")) add("inspiring-leader", { name: "Inspiring Leader", type: "Action", notes: "10-minute speech: up to 6 friendly creatures gain temp HP equal to your level + CHA modifier, once per rest each.", use: { kind: "inspiringLeader" } });
  classChoiceActions(add, prof);
  combatFeatureActions(add, prof);
  grantActions(add, prof);
  return actions;
}

const CLASS_FEATURE_ACTIONS = {
  barbarian({ level, subclass, add }) {
    const bonus = level >= 16 ? 4 : level >= 9 ? 3 : 2;
    const bear = totemSpirit(3) === "Bear";
    // Totem picks that change a rage (PHB p.50, SCAG p.121-122).
    const totems = [3, 6, 14].map(at => CLASS_OPTIONS.totemSpirits.find(item => item.level === at && item.name === totemSpirit(at))).filter(item => item && /while raging/i.test(item.summary)).map(item => `${item.name}: ${item.summary}`);
    const pounce = optionalRule("tashas") && level >= 7 ? " Instinctive Pounce: move up to half your speed as part of the bonus action." : "";
    add("rage", { name: "Rage", type: "Bonus Action", notes: `+${bonus} damage on STR melee weapon attacks, resistance to ${bear ? "all damage except psychic" : "bludgeoning, piercing and slashing"}, advantage on STR checks and saves. 1 minute; no benefits in heavy armor.${pounce}${totems.length ? ` ${totems.join(" ")}` : ""}`, use: { cost: level >= 20 ? null : ["Rage", 1], kind: "rage" } });
    if (level >= 2) add("reckless", { name: "Reckless Attack", type: "Free", notes: "First attack on your turn: advantage on STR melee weapon attacks this turn; attacks against you have advantage until your next turn.", use: { kind: "reckless" } });
    if (subclass === "berserker" && level >= 3) add("frenzy-attack", { name: "Frenzy attack", type: "Bonus Action", notes: "While raging in a frenzy: one melee weapon attack as a bonus action on each of your turns. Roll it from the weapon's row.", use: { kind: "frenzy" } });
    if (subclass === "ancestral-guardian" && level >= 6) {
      const dice = level >= 14 ? 4 : level >= 10 ? 3 : 2;
      add("spirit-shield", { name: "Spirit Shield", type: "Reaction", notes: `While raging: reduce the damage to a creature within 30 ft by ${dice}d6.`, use: { kind: "roll", roll: `${dice}d6`, text: "Reduce the damage your ally takes by this much." } });
    }
  },
  monk({ level, subclass, add, prof }) {
    const die = martialArtsDie(level);
    const martial = monkUnarmored();
    const ability = martial && mod("dex") > mod("str") ? "dex" : "str";
    // Martial Arts needs no armor and no shield (PHB p.78); otherwise it's a plain 1 + STR unarmed strike.
    const strike = martial
      ? { attack: formatMod(prof + mod(ability)), damage: `1d${die}${formatMod(mod(ability))} bludgeoning`, source: { ability } }
      : { attack: formatMod(prof + mod("str")), damage: `${Math.max(0, 1 + mod("str"))} bludgeoning`, source: { ability: "str" } };
    const magical = level >= 6 ? " Counts as magical (Ki-Empowered Strikes)." : "";
    add("unarmed", { name: "Unarmed Strike", type: "Action", ...strike, notes: `${martial ? `Martial Arts d${die}.` : "No Martial Arts while wearing armor or a shield."}${magical}` });
    add("unarmed-bonus", { name: "Unarmed Strike (bonus)", type: "Bonus Action", ...strike, notes: `Martial Arts: after you take the Attack action.${magical}` });
    if (level >= 2) {
      add("flurry", { name: "Flurry of Blows", type: "Bonus Action", ...strike, notes: "Two unarmed strikes after you take the Attack action.", use: { cost: ["Ki Points", 1], kind: "attacks", attacks: 2 } });
      add("patient-defense", { name: "Patient Defense", type: "Bonus Action", notes: "Take the Dodge action as a bonus action.", use: { cost: ["Ki Points", 1], kind: "note", text: "Dodging: attacks against you have disadvantage and you make DEX saves with advantage until your next turn." } });
      add("step-of-the-wind", { name: "Step of the Wind", type: "Bonus Action", notes: "Disengage or Dash as a bonus action.", use: { cost: ["Ki Points", 1], kind: "note", text: "Disengage or Dash as a bonus action, and your jump distance doubles this turn." } });
    }
    if (level >= 3) {
      add("deflect-missiles", { name: "Deflect Missiles", type: "Reaction", notes: "Reduce the damage of a ranged weapon attack that hits you.", use: { kind: "deflect", roll: `1d10${formatMod(mod("dex") + level)}` } });
      if (optionalRule("tashas")) add("ki-fueled-attack", { name: "Ki-Fueled Attack", type: "Bonus Action", notes: "After you spend 1+ ki as part of an action: one unarmed strike or monk weapon attack.", use: { kind: "note", text: "Make one attack with an unarmed strike or a monk weapon." } });
    }
    if (subclass === "kensei" && level >= 3) {
      add("agile-parry", { name: "Agile Parry", type: "Free", notes: "After an unarmed strike in the Attack action while holding a melee kensei weapon: +2 AC until your next turn.", use: { kind: "effect", effect: "Agile Parry", rounds: 1, text: "+2 AC until the start of your next turn." } });
      add("kenseis-shot", { name: "Kensei's Shot", type: "Bonus Action", notes: "This turn, ranged kensei weapon hits deal an extra 1d4.", use: { kind: "effect", effect: "Kensei's Shot", rounds: 1, text: "Ranged kensei weapon hits add 1d4 this turn." } });
    }
    if (level >= 4) {
      add("slow-fall", { name: "Slow Fall", type: "Reaction", notes: `Reduce falling damage by ${5 * level}.`, use: { kind: "reduce", amount: 5 * level } });
      if (optionalRule("tashas")) add("quickened-healing", { name: "Quickened Healing", type: "Action", notes: `Regain 1d${die}+${prof} HP.`, use: { cost: ["Ki Points", 2], kind: "heal", roll: `1d${die}+${prof}` } });
    }
    if (level >= 5) {
      const dc = 8 + prof + mod("wis");
      add("stunning-strike", { name: "Stunning Strike", type: "Free", notes: `After a melee hit: CON save DC ${dc} or stunned.`, use: { cost: ["Ki Points", 1], kind: "note", text: `The target makes a Constitution save, DC ${dc}. On a failure it is stunned until the end of your next turn.` } });
    }
    if (subclass === "open-hand" && level >= 6) add("wholeness-of-body", { name: "Wholeness of Body", type: "Action", notes: `Regain ${3 * level} HP.`, use: { cost: ["Wholeness of Body", 1], kind: "heal", roll: String(3 * level) } });
    if (level >= 7) add("stillness-of-mind", { name: "Stillness of Mind", type: "Action", notes: "End one effect that charms or frightens you.", use: { kind: "stillness" } });
    if (level >= 18) add("empty-body", { name: "Empty Body", type: "Action", notes: "4 ki: invisible and resistant to all damage but force for 1 minute. 8 ki: cast astral projection on yourself without components.", use: { cost: ["Ki Points", 4], kind: "effect", effect: "Empty Body", rounds: 10, text: "Invisible, with resistance to all damage except force, for 1 minute." } });
  },
  rogue({ level, subclass, add, prof }) {
    // Soulknife Psionic Power (TCE p.63): like the Psi Warrior, a bonus action regains one die once per rest.
    if (subclass === "soulknife" && level >= 3) add("psionic-recovery", { name: "Recover a Psionic Energy die", type: "Bonus Action", notes: "Regain one expended Psionic Energy die, once per short or long rest.", use: { cost: ["Psionic Energy Recovery", 1], kind: "regain", resource: "Psionic Energy Dice" } });
    // Psychic Blades (Soulknife 3, TCE p.63): finesse, thrown 60/120, 1d6 psychic; a bonus-action second blade deals 1d4.
    if (subclass === "soulknife" && level >= 3) {
      const ability = mod("dex") >= mod("str") ? "dex" : "str";
      const blade = { attack: formatMod(prof + mod(ability)), source: { ability } };
      add("psychic-blade", { name: "Psychic Blade", type: "Action", ...blade, damage: `1d6${formatMod(mod(ability))} psychic`, notes: "Finesse, thrown (60/120). Vanishes after the attack." });
      add("psychic-blade-bonus", { name: "Psychic Blade (bonus)", type: "Bonus Action", ...blade, damage: `1d4${formatMod(mod(ability))} psychic`, notes: "Finesse, thrown (60/120). After you attack with a Psychic Blade this turn." });
    }
    if (level >= 2) add("cunning-action", { name: "Cunning Action", type: "Bonus Action", notes: "Dash, Disengage, or Hide as a bonus action.", use: { kind: "cunning" } });
    if (level >= 3 && optionalRule("tashas")) add("steady-aim", { name: "Steady Aim", type: "Bonus Action", notes: "If you haven't moved this turn: advantage on your next attack this turn; your speed is 0 until the end of the turn.", use: { kind: "steady" } });
    if (level >= 5) add("uncanny-dodge", { name: "Uncanny Dodge", type: "Reaction", notes: "Halve the damage of an attack that hits you.", use: { kind: "uncanny" } });
  },
  fighter({ level, subclass, add, prof }) {
    add("second-wind", { name: "Second Wind", type: "Bonus Action", notes: `Regain 1d10+${level} HP.`, use: { cost: ["Second Wind", 1], kind: "heal", roll: `1d10+${level}` } });
    if (level >= 2) add("action-surge", { name: "Action Surge", type: "Free", notes: "One additional action this turn.", use: { cost: ["Action Surge", 1], kind: "note", text: "Take one additional action on this turn." } });
    if (subclass === "champion" && level >= 18) add("survivor", { name: "Survivor (start of turn)", type: "Free", notes: `At the start of your turn, regain ${5 + mod("con")} HP if you're at half HP or less (and above 0).`, use: { kind: "survivor" } });
    if (subclass === "eldritch-knight" && level >= 7) add("war-magic", { name: "War Magic attack", type: "Bonus Action", notes: level >= 18 ? "After you cast a spell with your action: one weapon attack." : "After you cast a cantrip with your action: one weapon attack.", use: { kind: "note", text: "Make one weapon attack from its row." } });
    if (subclass === "samurai" && level >= 3) add("fighting-spirit", { name: "Fighting Spirit", type: "Bonus Action", notes: `Advantage on weapon attacks this turn and ${level >= 15 ? 15 : level >= 10 ? 10 : 5} temporary HP.`, use: { cost: ["Fighting Spirit", 1], kind: "fightingspirit", amount: level >= 15 ? 15 : level >= 10 ? 10 : 5 } });
    if (subclass === "psi-warrior" && level >= 3) add("psionic-recovery", { name: "Recover a Psionic Energy die", type: "Bonus Action", notes: "Regain one expended Psionic Energy die, once per short or long rest.", use: { cost: ["Psionic Energy Recovery", 1], kind: "regain", resource: "Psionic Energy Dice" } });
  },
  paladin({ level, subclass, add, prof }) {
    add("lay-on-hands", { name: "Lay on Hands", type: "Action", notes: `Heal from a pool of ${5 * level} HP, or spend 5 to cure a disease or neutralize a poison.`, use: { kind: "layonhands" } });
    add("divine-sense", { name: "Divine Sense", type: "Action", notes: "Sense celestials, fiends and undead within 60 ft.", use: { cost: ["Divine Sense", 1], kind: "note", text: "Until the end of your next turn you know where any celestial, fiend or undead within 60 ft is (not behind total cover) and what type it is, and you notice consecrated or desecrated places and objects there." } });
    if (level >= 3 && optionalRule("tashas")) add("harness-divine-power", { name: "Harness Divine Power", type: "Bonus Action", notes: `Spend Channel Divinity to regain a spell slot of level ${Math.ceil(prof / 2)} or lower.`, use: { cost: ["Harness Divine Power", 1], kind: "harness" } });
    if (subclass === "devotion" && level >= 3) add("sacred-weapon", { name: "Sacred Weapon", type: "Action", notes: `Channel Divinity: +${Math.max(1, mod("cha"))} to attack rolls with one weapon for 1 minute; it sheds light and counts as magical.`, use: { cost: ["Channel Divinity", 1], kind: "effect", effect: "Sacred Weapon", rounds: 10, text: "Your weapon attacks add your CHA modifier to hit for 1 minute." } });
    if (subclass === "vengeance" && level >= 3) add("vow-of-enmity", { name: "Vow of Enmity", type: "Bonus Action", notes: "Channel Divinity: advantage on attack rolls against one creature within 10 ft for 1 minute.", use: { cost: ["Channel Divinity", 1], kind: "effect", effect: "Vow of Enmity", rounds: 10, text: "Turn on Advantage when you attack the vowed creature." } });
    if (level >= 14) add("cleansing-touch", { name: "Cleansing Touch", type: "Action", notes: "End one spell on yourself or a willing creature you touch.", use: { cost: ["Cleansing Touch", 1], kind: "note", text: "One spell on the creature you touch ends." } });
  },
  ranger({ level, subclass, add }) {
    if (rangerOption("favoredFoe")) {
      const die = level >= 14 ? 8 : level >= 6 ? 6 : 4;
      add("favored-foe", { name: "Favored Foe", type: "Free", notes: `When you hit, mark the target for 1 minute (concentration): +1d${die} damage once per turn.`, use: { cost: ["Favored Foe", 1], kind: "favoredfoe" } });
    }
    if (rangerOption("deftExplorer") && level >= 10) add("tireless", { name: "Tireless", type: "Action", notes: "Gain 1d8 + WIS temporary HP (minimum 1). A short rest also removes one level of exhaustion.", use: { cost: ["Tireless", 1], kind: "temp", roll: `1d8${formatMod(mod("wis"))}` } });
    if (rangerOption("naturesVeil")) {
      if (level >= 10) add("natures-veil", { name: "Nature's Veil", type: "Bonus Action", notes: "Become invisible until the start of your next turn.", use: { cost: ["Nature's Veil", 1], kind: "effect", effect: "Nature's Veil", rounds: 1, text: "You're invisible until the start of your next turn." } });
    } else if (level >= 10) add("hide-in-plain-sight", { name: "Hide in Plain Sight", type: "Action", notes: "Spend 1 minute on camouflage: +10 to Stealth while you stay still against a surface.", use: { kind: "note", text: "+10 to Dexterity (Stealth) checks until you move or act." } });
    if (!rangerOption("primalAwareness") && level >= 3) add("primeval-awareness", { name: "Primeval Awareness", type: "Action", notes: "Spend a ranger spell slot to sense certain creature types nearby.", use: { kind: "note", text: "For 1 minute per slot level you sense whether aberrations, celestials, dragons, elementals, fey, fiends or undead are within 1 mile (6 miles in favored terrain). Mark the slot spent." } });
    if (level >= 14) add("vanish", { name: "Vanish", type: "Bonus Action", notes: "Hide as a bonus action; nonmagical tracking fails unless you allow it.", use: { kind: "vanish" } });
    if (subclass === "hunter") {
      classChoiceNames("hunter").map(name => CLASS_OPTIONS.hunterOptions.find(item => item.name === name)).filter(item => item && /reaction|as an action/i.test(item.summary)).forEach(item => {
        add(slug(item.name), { name: item.name, type: /reaction/i.test(item.summary) ? "Reaction" : "Action", notes: item.summary, use: { kind: "note", text: item.summary } });
      });
    }
  }
};

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

// frenzy: a Berserker's answer to "Rage" or "Rage + Frenzy" (asked before the rage starts).
function useFeatureAction(action, confirmed = false, frenzy = undefined) {
  const use = action.use;
  if (!use) return;
  if (!confirmed && blockedByIncapacitation(() => useFeatureAction(action, true))) return;
  if (!confirmed && action.type === "Reaction" && reactionSpent(() => useFeatureAction(action, true))) return;
  // A reaction-type use spends the round's reaction once payFor succeeds (a use it can't pay for leaves it unspent).
  if (CLASS_FEATURE_USES[use.kind]) return CLASS_FEATURE_USES[use.kind](action, action.type === "Reaction" ? { ...use, reaction: true } : use);
  // Berserker (PHB p.49): you decide to frenzy when you start raging.
  if (use.kind === "rage" && !character.raging && subclassLevel("berserker") >= 3 && frenzy === undefined) {
    showToast(`<span class="toast-label">Rage</span><span>Frenzy: while raging, one melee weapon attack as a bonus action on each of your turns. When the rage ends you gain a level of exhaustion.</span>`, {
      persist: true,
      actions: [{ label: "Rage", run: () => useFeatureAction(action, confirmed, false) }, { label: "Rage + Frenzy", run: () => useFeatureAction(action, confirmed, true) }]
    });
    return;
  }
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
    if (!spent || spent.refunded) return;
    spent.refunded = true;
    spent.resource.current = Math.min(Number(spent.resource.max), Number(spent.resource.current) + spent.amount);
  };
  const undo = spent ? [{ label: "Undo", run: () => { refund(); persistAndRender(); } }] : [];
  if (action.type === "Reaction") turnState().reaction = true;
  if (martialFeatureUse(action, use, { name, status, spent, refund, undo, confirmed })) return;
  if (use.kind === "attacks") {
    const strike = index => rollActionAttack(action, ` ${index} of ${use.attacks}${index === 1 && status ? ` (${status})` : ""}`, true,
      index < use.attacks ? { label: `Next strike (${index + 1} of ${use.attacks})`, run: () => strike(index + 1) } : null);
    strike(1);
    return;
  }
  if (use.kind === "heal") {
    rollFromInput(`${name}${status ? ` (${status})` : ""}`, use.roll, "normal", [], "", result => {
      healBy(beaconHealing(character, result));
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
    showToast(`<span class="toast-label">Cunning Action</span><span>Dash, Disengage, or Hide as a bonus action.</span>`, { persist: true, actions: [{ label: "Hide (Stealth)", run: () => rollSkillCheck("stealth") }] });
    return;
  }
  if (use.kind === "rage") {
    if (character.raging) {
      refund();
      const note = endRage();
      persistAndRender();
      showToast(`<span class="toast-label">Rage ends</span><span>${escapeHtml(note)}</span>`);
      return;
    }
    // No rage benefits in heavy armor (PHB p.48); the player can still rage.
    if (!confirmed && wearingHeavyArmor()) {
      refund();
      persistAndRender();
      showToast(`<span class="toast-label">Heavy armor: no rage benefits</span><span>While you wear heavy armor, Rage gives no damage bonus, resistance or advantage.</span>`, { persist: true, tone: "fumble", actions: [{ label: "Rage anyway", run: () => useFeatureAction(action, true, frenzy) }] });
      return;
    }
    if (character.concentration) {
      refund();
      persistAndRender();
      showToast(`<span class="toast-label">Can't rage while concentrating</span><span>You're concentrating on ${escapeHtml(character.concentration)}. Raging would end it, and you can't cast or concentrate on spells while raging.</span>`, { persist: true, tone: "fumble", actions: [{ label: "Drop it and rage", run: () => { character.concentration = ""; useFeatureAction(action, true, frenzy); } }] });
      return;
    }
    character.raging = true;
    character.frenzied = Boolean(frenzy);
    effects().Rage = 10;
    turnState().rageFed = false;
    persistAndRender();
    showToast(`<span class="toast-label">Raging (10 rounds)${frenzy ? ", frenzied" : ""}</span><span>${escapeHtml(action.notes)}${status ? ` ${escapeHtml(status)}.` : ""}</span>`, { actions: [...undo.map(item => ({ ...item, run: () => { character.raging = false; character.frenzied = false; delete effects().Rage; item.run(); } })), { label: "End rage", run: () => { const note = endRage(); persistAndRender(); showToast(`<span class="toast-label">Rage ends</span><span>${escapeHtml(note)}</span>`); } }], duration: 9000 });
    return;
  }
  if (use.kind === "uncanny") {
    halveLastDamage();
    return;
  }
  if (use.kind === "inspiringLeader") {
    inspiringLeaderMenu();
    return;
  }
  if (use.kind === "hexwarrior") {
    const weapons = (character.equipment || []).filter(entry => /\d+d\d+/.test(entry.notes || "") && !weaponTraits(`${entry.name} ${entry.notes || ""}`.toLowerCase()).twoHanded);
    showToast(`<span class="toast-label">Hex Warrior</span><span>Choose the weapon that uses Charisma until your next long rest.</span>`, {
      actions: weapons.map(entry => ({ label: entry.name || "Weapon", run: () => { character.combatChoices = { ...(character.combatChoices || {}), hexWarriorWeapon: entry.id }; persistAndRender(); } })),
      persist: true
    });
    return;
  }
  if (use.kind === "metamagic") {
    metamagicMenu();
    return;
  }
  if (use.kind === "flexible") {
    flexibleCastingMenu();
  }
}

// Beast Shapes (PHB p.66) and Circle Forms (Moon): the highest CR and movement a druid can take.
function wildShapeRules() {
  const level = classLevel("druid");
  const base = level >= 8 ? 1 : level >= 4 ? 0.5 : 0.25;
  return { cr: subclassLevel("moon") > 0 ? Math.max(1, Math.floor(level / 3)) : base, swim: level >= 4, fly: level >= 8, hours: Math.floor(level / 2) };
}

function crLabel(cr) {
  return { 0.125: "1/8", 0.25: "1/4", 0.5: "1/2" }[cr] || String(cr);
}

function wildShapeLimit() {
  const { cr, swim, fly, hours } = wildShapeRules();
  const movement = fly ? "any movement" : swim ? "no flying speed" : "no flying or swimming speed";
  return `Max CR ${crLabel(cr)}, ${movement}. Lasts up to ${hours} hour${hours === 1 ? "" : "s"}.`;
}

// SRD beasts this druid can become now, strongest first, filtered by a name search.
function wildShapeBeasts(query = "") {
  const { cr, swim, fly } = wildShapeRules();
  const text = String(query).trim().toLowerCase();
  return SRD_BEASTS.filter(beast => beast.cr <= cr && (swim || !beast.speed.swim) && (fly || !beast.speed.fly) && beast.name.toLowerCase().includes(text))
    .sort((a, b) => b.cr - a.cr || a.name.localeCompare(b.name));
}

function beastSpeedText(beast) {
  return Object.entries(beast.speed || {}).map(([kind, value]) => kind === "walk" ? value : `${kind} ${value}`).join(", ");
}

// Picking a beast fills the form row: HP, AC, STR/DEX/CON, walking speed and its attacks with to-hit and damage.
function applyBeastForm(index) {
  const beast = SRD_BEASTS.find(item => item.index === index);
  if (!beast || !character.wildShape) return;
  Object.assign(character.wildShape, {
    name: beast.name, beast: beast.index, hp: beast.hp, max: beast.hp, ac: beast.ac, str: beast.str, dex: beast.dex, con: beast.con,
    speed: parseInt(beast.speed.walk, 10) || 0,
    attacks: beast.actions.filter(item => item.attack !== null && item.damage).map(item => `${item.name} ${formatMod(item.attack)} ${item.damage}`).join("; ")
  });
  persistAndRender();
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

// Metamagic is picked as part of casting (spells.js promptMetamagic). This menu is for spells cast off the sheet:
// the options you know, Twinned priced at your last spell's level.
function metamagicMenu() {
  const points = sorceryPoints();
  const twinned = Math.max(1, Number(character.lastCastLevel || 1));
  const options = knownMetamagic().map(option => [option.name.replace(/ Spell$/, ""), option.points === "spellLevel" ? twinned : Number(option.points)]);
  const affordable = options.filter(([, cost]) => cost <= Number(points?.current || 0));
  showToast(`<span class="toast-label">Metamagic</span><span>${points ? `${points.current}/${points.max} sorcery points. Casting a spell from the sheet asks for Metamagic itself. Twinned here costs ${twinned} (your last spell's level).` : "Sorcery points aren't tracked on this sheet."}</span>`, {
    actions: affordable.map(([name, cost]) => ({ label: `${name} (${cost})`, run: () => spendSorceryPoints(cost, `${name} Spell`) })),
    persist: true
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
    // A created slot can exceed the normal maximum, at any level up to 5th; it's gone after a long rest (PHB p.101).
    if (cost <= Number(points.current)) {
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
  // Multiclass Pact Magic slots can be burned for points too (they are spell slots).
  const pact = pactSlotPool();
  if (pact?.left > 0 && Number(points.current) < Number(points.max)) {
    actions.push({ label: `Burn a ${ordinal(pact.level)}-level pact slot (+${pact.level})`, run: () => {
      character.pactSlotUsage = Number(character.pactSlotUsage || 0) + 1;
      points.current = Math.min(Number(points.max), Number(points.current) + pact.level);
      persistAndRender();
      showToast(`<span class="toast-label">Pact slot burned</span><span>Sorcery points ${points.current}/${points.max}</span>`);
    } });
  }
  showToast(`<span class="toast-label">Flexible Casting</span><span>${points.current}/${points.max} sorcery points.${actions.length ? "" : " Nothing to convert right now."}</span>`, { actions, persist: true });
}

// Speed shown in play mode: the stored base plus class and feat bonuses, then conditions and exhaustion.
function effectiveSpeed() {
  return speedBreakdown().speed;
}

function speedBreakdown() {
  // Wild Shape uses the beast's walking speed.
  const base = Number(character.wildShape?.speed || character.speed || 0);
  const monk = classLevel("monk");
  const armor = wornArmor();
  const notes = [];
  let speed = base + featureSpeedBonus(notes);
  if (monk >= 2 && monkUnarmored()) {
    const bonus = monk >= 18 ? 30 : monk >= 14 ? 25 : monk >= 10 ? 20 : monk >= 6 ? 15 : 10;
    speed += bonus;
    notes.push(`+${bonus} ft Unarmored Movement`);
  }
  if (classLevel("barbarian") >= 5 && !/heavy/i.test(armor?.notes || "")) {
    speed += 10;
    notes.push("+10 ft Fast Movement");
  }
  if (hasFeat("Mobile")) {
    speed += 10;
    notes.push("+10 ft Mobile");
  }
  const bonuses = [
    [hasFeat("Squat Nimbleness"), 5, "Squat Nimbleness"],
    [rangerOption("deftExplorer") && classLevel("ranger") >= 6, 5, "Roving"],
    [classLevel("bloodhunter") >= 10, 5, "Dark Augmentation"],
    [rageActive() && totemSpirit(3) === "Elk", 15, "Elk totem"],
    [subclassLevel("gloom-stalker") >= 3 && turnState().round === 1, 10, "Dread Ambusher (first turn)"]
  ];
  bonuses.filter(([applies]) => applies).forEach(([, feet, name]) => {
    speed += feet;
    notes.push(`+${feet} ft ${name}`);
  });
  // Heavy armor without its Strength score: -10 ft, except for dwarves (PHB p.144, p.20).
  const needed = Number(String(armor?.notes || "").match(/Requires Strength (\d+)/i)?.[1] || 0);
  if (needed && effectiveScore("str") < needed && !/dwarf|duergar/i.test(character.species || "")) {
    speed -= 10;
    notes.push(`-10 ft: ${armor.name} needs STR ${needed}`);
  }
  speed += grantSpeedBonus(notes);
  speed = encumberedSpeed(speed, notes);
  const conditions = character.conditions || [];
  const exhaustion = Number(character.exhaustion || 0);
  if (["Grappled", "Restrained", "Paralyzed", "Petrified", "Stunned", "Unconscious"].some(name => conditions.includes(name)) || exhaustion >= 5) {
    notes.push(exhaustion >= 5 ? "0 ft: exhaustion 5" : "0 ft: condition");
    return { speed: 0, base, notes };
  }
  if (turnState().speedZero) {
    notes.push(`0 ft: ${turnState().speedZero}`);
    return { speed: 0, base, notes };
  }
  if (exhaustion >= 2) {
    speed = Math.floor(speed / 2);
    notes.push("halved: exhaustion 2");
  }
  return { speed, base, notes };
}

// Spell rows in Actions: the DC and attack come from the spell's own class (refreshed on every render), and the
// row's buttons cast through castSpellRow so slots and concentration apply.
function spellAction(row) {
  const detail = spellDetails[row.index] || {};
  const text = [detail.desc].flat().filter(Boolean).join(" ");
  const dice = SPELL_ROLL_OVERRIDES[row.index]?.none ? "" : text.match(/\b\d+d\d+\b/)?.[0];
  const save = spellSaveFor(row);
  const attack = Boolean(detail.attack_type) || /spell attack/i.test(text);
  const stats = spellStatsFor(row);
  if (!dice && !save && !attack) return null;
  const level = spellLevelForRow(row);
  const castType = castingShorthand(detail.casting_time);
  const effect = spellEffectRoll(row, level);
  return {
    id: crypto.randomUUID(),
    name: spellDisplayName(row),
    type: castType === "B" ? "Bonus Action" : castType === "R" ? "Reaction" : "Action",
    attack: save ? `DC ${SPELL_ROLL_OVERRIDES[row.index]?.fixedDc || stats.dc} ${save.slice(0, 3).toUpperCase()}` : attack ? formatMod(stats.attack) : "",
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
  character.spells.filter(spellRowReady).forEach(row => add(spellAction(row)));
  character.actions.push(...generated);
  persistAndRender();
  showToast(`<span class="toast-label">Generate Actions</span><span>${generated.length ? `Added ${generated.map(action => escapeHtml(action.name)).join(", ")}.` : "Nothing new to add: equip a weapon in Inventory or add damaging spells."}</span>`, { duration: 8000 });
}

// ===== Caster and support classes: feature actions, riders and hooks =====
// Artificer, bard, cleric, druid, sorcerer, warlock, wizard and blood hunter rows, plus subclass features that act at
// the table. Subclass rows come from SUBCLASS_FEATURES; FEATURE_ACTION_OVERRIDES adds the numbers and buttons.

// Picks the build step stores in character.classChoices[key] (CLASS_OPTIONS keys: invocations, metamagic, runes, ...).
function classChoiceNames(key, source = character) {
  const value = source.classChoices?.[key];
  const list = Array.isArray(value) ? value : value && typeof value === "object" ? Object.values(value) : value ? [value] : [];
  return list.map(item => typeof item === "string" ? item : item?.name).filter(Boolean);
}

// Invocations come from the build picks; older sheets wrote them in Features or the class option rows.
function hasInvocation(name) {
  const picked = classChoiceNames("invocations");
  if (picked.length) return picked.some(item => item.toLowerCase() === name.toLowerCase());
  const text = `${character.features || ""}\n${(character.classOptions || []).map(item => item.name).join("\n")}`;
  return new RegExp(`\\b${name}\\b`, "i").test(text);
}

function hemocraftDie(level = classLevel("bloodhunter")) {
  return level >= 17 ? 10 : level >= 11 ? 8 : level >= 5 ? 6 : 4;
}

// Arcane Ward (Abjuration 2): twice your wizard level + INT modifier.
function arcaneWardMax() {
  return Math.max(1, 2 * subclassLevel("abjuration") + mod("int"));
}

// Divine Intervention (PHB p.59): d100 at or under your cleric level; automatic at 20th.
function divineInterventionSucceeds(roll, level) {
  return level >= 20 || Number(roll) <= level;
}

// Wild Shape lasts half your druid level in hours; a rest uses up 1 (short) or 8 (long) of them.
function wildShapeAfterRest(hours) {
  const shape = character.wildShape;
  if (!shape) return null;
  const left = Number(shape.hoursLeft ?? Math.floor(classLevel("druid") / 2)) - hours;
  return left > 0 ? { ...shape, hoursLeft: left } : null;
}

function healButtons(amount) {
  return [
    { label: `Heal me +${amount}`, run: () => healBy(amount) },
    ...healTargets().map(other => healTargetAction(other, `Heal ${other.name || "unnamed"} +${amount}`, () => healOther(other.sheetId, amount)))
  ];
}

function tempHpButtons(amount, allies = true) {
  return [
    { label: `Gain ${amount} temp HP`, run: () => gainTempHp(amount) },
    ...(allies ? otherSheets().map(other => ({ label: `Give ${other.name || "unnamed"} ${amount} temp HP`, run: () => tempHpOther(other.sheetId, amount) })) : [])
  ];
}

// Temporary HP for another sheet on this device; like your own, they don't stack.
function tempHpOther(sheetId, amount) {
  const other = characterLibrary[sheetId];
  if (!other) return;
  const old = Number(other.tempHp || 0);
  other.tempHp = Math.max(old, amount);
  other.updatedAt = Date.now();
  saveCharacterLibrary();
  renderAll();
  showToast(`<span class="toast-label">${escapeHtml(other.name || "That character")}: ${other.tempHp} temp HP</span><span>${other.tempHp > old ? "Temporary hit points don't stack; the higher total applies." : `Kept the ${old} they already had.`}</span>`);
}

// Spend a tracked use. Returns { status, refund } or null (after explaining) when none are left.
function spendFeatureResource(name, amount = 1) {
  const resource = character.resources.find(item => item.name === name);
  if (!resource || Number(resource.current) < amount) {
    showToast(`<span class="toast-label">No ${escapeHtml(name)} left</span><span>${resource ? `${resource.current}/${resource.max}. ${resource.reset === "manual" ? "Restore it by hand when it comes back." : "Rest to recover."}` : "This sheet doesn't track it yet."}</span>`, { tone: "fumble" });
    return null;
  }
  resource.current = Number(resource.current) - amount;
  persistAndRender();
  let refunded = false;
  return {
    status: `${name} ${resource.current}/${resource.max}`,
    refund: () => {
      if (refunded) return;
      refunded = true;
      resource.current = Math.min(Number(resource.max), Number(resource.current) + amount);
      persistAndRender();
    }
  };
}

function payFor(use) {
  const before = turnState().reaction;
  if (use.reaction) turnState().reaction = true;
  const paid = use.cost ? spendFeatureResource(...use.cost) : { status: "", refund() {} };
  if (!paid) turnState().reaction = before;
  return paid;
}

function openSlotLevels() {
  const slots = characterSpellSlots();
  return slots.map((count, index) => index + 1).filter(level => slotRemaining(level, slots[level - 1] || 0) > 0);
}

function spendSlot(level) {
  character.spellSlotUsage[level] = Number(character.spellSlotUsage?.[level] || 0) + 1;
  persistAndRender();
}

// Use kinds owned by the caster classes. Each handler spends its own cost.
const CLASS_FEATURE_USES = {
  // Frenzy (Berserker 3, PHB p.49): choosing it marks the rage, so ending the rage adds the exhaustion level.
  frenzy() {
    if (!character.raging) {
      showToast(`<span class="toast-label">Frenzy</span><span>You frenzy when you rage. Use Rage first.</span>`, { tone: "fumble" });
      return;
    }
    const first = !character.frenzied;
    character.frenzied = true;
    persistAndRender();
    showToast(`<span class="toast-label">Frenzied</span><span>Make one melee weapon attack from its row.${first ? " When this rage ends you gain one level of exhaustion." : ""}</span>`, {
      actions: first ? [{ label: "Undo frenzy", run: () => { character.frenzied = false; persistAndRender(); } }] : [],
      duration: 9000
    });
  },
  hitDie() {
    spendHitDie(undefined, 1);
  },
  wildshape(action, use) {
    const paid = payFor(use);
    if (!paid) return;
    const druid = classLevel("druid");
    character.wildShape = { name: use.form || "Beast form", hp: 0, max: 0, hoursLeft: Math.max(1, Math.floor(druid / 2)), ...(use.form ? { elemental: true } : {}) };
    character.symbiotic = false;
    persistAndRender();
    document.querySelector(use.form ? '[data-wild-shape="max"]' : "[data-beast-search]")?.focus();
    showToast(`<span class="toast-label">${escapeHtml(action.name)}</span><span>${escapeHtml(use.form ? "An air, earth, fire or water elemental." : wildShapeLimit())} ${use.form ? "Enter the form's HP, AC, STR/DEX/CON, speed and attacks in the Beast form row under Hit points." : "Pick a beast under Hit points, or type one in by hand."}${paid.status ? ` ${escapeHtml(paid.status)}.` : ""}</span>`, {
      actions: [{ label: "Undo", run: () => { paid.refund(); character.wildShape = null; persistAndRender(); } }],
      duration: 9000
    });
  },
  // Combat Wild Shape (Moon 2): a bonus action and a slot heal the beast 1d8 per slot level.
  slotHeal() {
    if (!character.wildShape) {
      showToast(`<span class="toast-label">Combat Wild Shape</span><span>Only while you're in Wild Shape.</span>`);
      return;
    }
    const open = openSlotLevels();
    showToast(`<span class="toast-label">Combat Wild Shape</span><span>${open.length ? "Spend a spell slot: the beast regains 1d8 HP per slot level." : "No spell slots left."}</span>`, {
      actions: open.map(level => ({ label: `${ordinal(level)}-level slot (${level}d8)`, run: () => {
        spendSlot(level);
        rollFromInput(`Combat Wild Shape (${ordinal(level)}-level slot)`, `${level}d8`, "normal", [], "", result => {
          healBy(beaconHealing(character, result));
          return `${character.wildShape?.name || "Beast form"} regains ${result.total} HP.`;
        });
      } })),
      persist: true
    });
  },
  symbiotic(action, use) {
    const paid = payFor(use);
    if (!paid) return;
    character.symbiotic = true;
    gainTempHp(4 * classLevel("druid"));
    showToast(`<span class="toast-label">Symbiotic Entity</span><span>${4 * classLevel("druid")} temp HP for 10 minutes. Halo of Spores rolls twice and melee weapon hits add 1d6 necrotic while the temp HP last. ${escapeHtml(paid.status)}.</span>`, {
      actions: [{ label: "Undo", run: () => { paid.refund(); character.symbiotic = false; } }, { label: "End it", run: () => { character.symbiotic = false; persistAndRender(); } }],
      duration: 9000
    });
  },
  divine(action) {
    const resource = character.resources.find(item => item.name === "Divine Intervention");
    const level = classLevel("cleric");
    if (resource && Number(resource.current) < 1) {
      showToast(`<span class="toast-label">Divine Intervention used</span><span>${character.divineInterventionLocked ? "It succeeded, so it's back after 7 days." : "It failed; it's back after a long rest."}</span>`, {
        persist: true,
        actions: character.divineInterventionLocked ? [{ label: "7 days have passed", run: () => { character.divineInterventionLocked = false; resource.current = 1; ensureClassResources(); persistAndRender(); } }] : []
      });
      return;
    }
    const paid = spendFeatureResource("Divine Intervention");
    if (!paid) return;
    const settle = success => {
      character.divineInterventionLocked = success;
      ensureClassResources();
      persistAndRender();
      return success ? "Your deity intervenes. You can't use this again for 7 days." : "No answer. You can try again after a long rest.";
    };
    const undo = [{ label: "Undo", run: () => { character.divineInterventionLocked = false; ensureClassResources(); paid.refund(); } }];
    if (level >= 20) {
      showToast(`<span class="toast-label">Divine Intervention succeeds</span><span>${settle(true)}</span>`, { tone: "crit", actions: undo, duration: 9000 });
      return;
    }
    rollFromInput(`Divine Intervention (needs ${level} or lower)`, "1d100", "normal", undo, "", result => settle(divineInterventionSucceeds(result.total, level)));
  },
  // Harness Divine Power (TCE): one Channel Divinity use returns a slot up to half your proficiency bonus (rounded up).
  harness(action, use) {
    const divinity = character.resources.find(item => item.name === "Channel Divinity");
    const highest = Math.ceil(proficiencyBonus() / 2);
    const spent = Array.from({ length: highest }, (_, index) => index + 1).filter(level => Number(character.spellSlotUsage?.[level] || 0) > 0);
    if (!divinity || Number(divinity.current) < 1 || !spent.length) {
      showToast(`<span class="toast-label">Harness Divine Power</span><span>${!divinity || Number(divinity.current) < 1 ? "It needs a Channel Divinity use." : `No spent slots of ${ordinal(highest)} level or lower.`}</span>`);
      return;
    }
    showToast(`<span class="toast-label">Harness Divine Power</span><span>Spend a Channel Divinity use to regain a slot (${ordinal(highest)} level at most).</span>`, {
      persist: true,
      actions: spent.map(level => ({ label: `Regain a ${ordinal(level)}-level slot`, run: () => {
        const paid = payFor(use);
        if (!paid) return;
        divinity.current = Number(divinity.current) - 1;
        character.spellSlotUsage[level] = Number(character.spellSlotUsage[level]) - 1;
        persistAndRender();
        showToast(`<span class="toast-label">${ordinal(level)}-level slot regained</span><span>Channel Divinity ${divinity.current}/${divinity.max}. ${escapeHtml(paid.status)}.</span>`, {
          actions: [{ label: "Undo", run: () => { divinity.current = Number(divinity.current) + 1; character.spellSlotUsage[level] = Number(character.spellSlotUsage[level] || 0) + 1; paid.refund(); } }]
        });
      } })),
      duration: 12000
    });
  },
  // Rolls, then offers the result to you or the party: healing (use.heal), temp HP (use.temp), or both.
  give(action, use) {
    const paid = payFor(use);
    if (!paid) return;
    const label = `${action.name}${paid.status ? ` (${paid.status})` : ""}`;
    const buttons = total => [...(use.heal ? healButtons(total) : []), ...(use.temp ? tempHpButtons(use.tempPerDie ? use.dice : total, use.allies !== false) : []), { label: "Undo spend", run: paid.refund }];
    if (!use.roll) {
      showToast(`<span class="toast-label">${escapeHtml(label)}</span><span>${escapeHtml(use.text || "")}</span>`, { actions: buttons(use.amount), persist: true });
      return;
    }
    rollFromInput(label, use.roll, "normal", result => buttons(Math.max(use.min || 0, result.total)), use.text || "");
  },
  // Preserve Life (Life 2, PHB p.60): split the pool; nobody is raised above half its HP maximum.
  preserveLife(action, use) {
    const paid = payFor(use);
    if (!paid) return;
    const offer = left => {
      const room = sheet => preserveLifeRoom(sheet, left);
      const targets = [character, ...healTargets()].filter(sheet => room(sheet) > 0);
      showToast(`<span class="toast-label">Preserve Life</span><span>${left} HP left to split; nobody goes above half their HP maximum. Undead and constructs can't benefit.${paid.status ? ` ${escapeHtml(paid.status)}.` : ""}</span>`, {
        actions: [...targets.map(sheet => ({ label: `Heal ${sheet === character ? "me" : sheet.name || "unnamed"} +${room(sheet)}`, run: () => {
          const amount = room(sheet);
          if (sheet === character) healBy(amount);
          else healOther(sheet.sheetId, amount);
          if (left > amount) offer(left - amount);
        } })), { label: "Undo spend", run: paid.refund }],
        persist: true
      });
    };
    offer(use.amount);
  },
  // Starry Form (Stars 2, TCE p.38): spend Wild Shape and pick a constellation for 10 minutes. Twinkling
  // Constellations (10) lets you switch at the start of each turn.
  starry(action, use) {
    const forms = ["Archer", "Chalice", "Dragon"];
    const current = starryForm();
    if (current) {
      showToast(`<span class="toast-label">Starry Form: ${current}</span>`, {
        actions: [
          ...(subclassLevel("stars") >= 10 ? forms.filter(form => form !== current).map(form => ({ label: `Switch to ${form}`, run: () => { character.starryForm = form; persistAndRender(); } })) : []),
          { label: "End it", run: () => { delete effects()["Starry Form"]; persistAndRender(); } }
        ],
        persist: true
      });
      return;
    }
    const paid = payFor(use);
    if (!paid) return;
    showToast(`<span class="toast-label">Starry Form</span><span>Pick a constellation; it lasts 10 minutes.${paid.status ? ` ${escapeHtml(paid.status)}.` : ""}</span>`, {
      actions: [...forms.map(form => ({ label: form, run: () => { character.starryForm = form; effects()["Starry Form"] = 100; persistAndRender(); } })), { label: "Undo spend", run: paid.refund }],
      persist: true
    });
  },
  // Dice pools (Balm of the Summer Court, Healing Light): pick how many dice to spend.
  pool(action, use) {
    const resource = character.resources.find(item => item.name === use.pool);
    const most = Math.min(use.maxDice, Number(resource?.current || 0));
    if (!resource || most < 1) {
      showToast(`<span class="toast-label">No ${escapeHtml(use.pool)} left</span>`, { tone: "fumble" });
      return;
    }
    showToast(`<span class="toast-label">${escapeHtml(action.name)}</span><span>${resource.current} dice left; spend up to ${use.maxDice} at once. ${escapeHtml(use.text || "")}</span>`, {
      actions: Array.from({ length: most }, (_, index) => index + 1).map(dice => ({ label: `${dice}d${use.die}`, run: () => CLASS_FEATURE_USES.give(action, { ...use, cost: [use.pool, dice], roll: `${dice}d${use.die}`, dice }) })),
      persist: true
    });
  },
  // Bardic Inspiration: give a die to another sheet; it shows there as a one-use tracker with a roll button.
  // Nothing is spent until a target is picked, so a missed toast costs nothing: Use again re-offers the targets.
  inspire(action, use) {
    const tracker = character.resources.find(item => item.name === "Bardic Inspiration");
    if (!tracker || Number(tracker.current) < 1) {
      payFor(use);
      return;
    }
    const die = resourceDie("Bardic Inspiration");
    const valor = subclassLevel("valor") >= 3;
    const give = sheetId => () => {
      const paid = payFor(use);
      if (!paid) return;
      if (sheetId) giveInspiration(sheetId, die, valor, paid);
      else showToast(`<span class="toast-label">Bardic Inspiration given</span><span>Tell them to add a d${die}. ${escapeHtml(paid.status)}.</span>`, { actions: [{ label: "Undo", run: paid.refund }] });
    };
    showToast(`<span class="toast-label">Bardic Inspiration d${die}</span><span>One creature other than you within 60 ft. Within 10 minutes it adds the die to one ability check, attack roll or save${valor ? ", or (Valor) to a weapon damage roll or to its AC against one attack" : ""}. The die is spent when you pick who gets it; missed this? Use the row again.</span>`, {
      actions: [...otherSheets().map(other => ({ label: `Give to ${other.name || "unnamed"}`, run: give(other.sheetId) })), { label: "Someone not on this device", run: give("") }],
      persist: true
    });
  },
  rite() {
    const level = classLevel("bloodhunter");
    if (character.crimsonRite) {
      showToast(`<span class="toast-label">${escapeHtml(character.crimsonRite.name)} is active</span><span>It lasts until you finish a short or long rest.</span>`, { actions: [{ label: "End it", run: () => { character.crimsonRite = null; persistAndRender(); } }] });
      return;
    }
    const known = classChoiceNames("bloodHunterRites");
    const rites = (CLASS_OPTIONS.bloodHunterRites || []).filter(rite => rite.kind === "order" ? subclassLevel("ghostslayer") >= 3 : known.length ? known.includes(rite.name) : rite.level <= level);
    const die = hemocraftDie(level);
    showToast(`<span class="toast-label">Crimson Rite</span><span>Bonus action: take 1d${die} necrotic damage (it can't be reduced); your weapon's attacks deal +1d${die} of the rite's type until you rest.</span>`, {
      actions: rites.map(rite => ({ label: `${rite.name.replace("Rite of the ", "")} (${rite.damage})`, run: () => {
        rollFromInput(`${rite.name}: activation cost`, `1d${die}`, "normal", [], "Necrotic damage to you that can't be reduced.", result => {
          character.crimsonRite = { name: rite.name, damage: rite.damage };
          dealDamage(result.total, { label: `${rite.name}: took ${result.total} necrotic` });
          return `${rite.name} active: +1d${die} ${rite.damage} on hits with this weapon.`;
        });
      } })),
      persist: true
    });
  },
  maledict(action, use) {
    const paid = payFor(use);
    if (!paid) return;
    const die = hemocraftDie();
    showToast(`<span class="toast-label">Blood Maledict</span><span>${escapeHtml(use.text)} ${escapeHtml(paid.status)}.</span>`, {
      actions: [
        { label: `Amplify (take 1d${die} necrotic)`, run: () => rollFromInput("Amplify blood curse: cost", `1d${die}`, "normal", [], "Necrotic damage to you that can't be reduced.", result => { dealDamage(result.total, { label: `Amplified: took ${result.total} necrotic` }); return ""; }) },
        { label: "Undo", run: paid.refund }
      ],
      persist: true
    });
  },
  // Wild Magic (PHB p.103): after a 1st+ level sorcerer spell the DM can call for a d20; a 1 means a surge.
  surge() {
    const level = subclassLevel("wild-magic");
    const surge = () => {
      const tides = character.resources.find(item => item.name === "Tides of Chaos");
      if (tides) tides.current = tides.max;
      persistAndRender();
      rollFromInput("Wild Magic Surge (d100)", "1d100", "normal", level >= 14 ? [{ label: "Roll again (Controlled Chaos: use either)", run: () => rollFromInput("Wild Magic Surge, second roll", "1d100") }] : [], "Find the result on the Wild Magic Surge table (PHB p.104). Tides of Chaos is back.");
    };
    rollFromInput("Wild Magic surge check", "1d20", "normal", result => result.total === 1 ? [{ label: "Surge: roll d100", run: surge }] : [], "", result => result.total === 1 ? "A 1: wild magic surges." : "No surge.");
  },
  songOfRest() {
    songOfRestMenu();
  },
  portent() {
    const dice = character.portentDice || [];
    const count = subclassLevel("divination") >= 14 ? 3 : 2;
    if (!dice.length) {
      showToast(`<span class="toast-label">Portent</span><span>No portent dice left. You roll ${count} after each long rest.</span>`, { persist: true, actions: [{ label: `Roll ${count} now`, run: () => { rollPortent(); showToast(`<span class="toast-label">Portent</span><span>${character.portentDice.join(", ")}</span>`); } }] });
      return;
    }
    showToast(`<span class="toast-label">Portent</span><span>Replace any attack roll, save or ability check you can see with one of these, before the roll is made.</span>`, {
      persist: true,
      actions: dice.map((value, index) => ({ label: `Use ${value}`, run: () => usePortentDie(index) })),
      duration: 12000
    });
  },
  ward(action, use) {
    const ward = character.arcaneWard;
    const max = arcaneWardMax();
    const create = () => {
      const paid = payFor(use);
      if (!paid) return;
      character.arcaneWard = { hp: max, max };
      persistAndRender();
      showToast(`<span class="toast-label">Arcane Ward up</span><span>${max} ward HP. Damage hits the ward first.</span>`, { actions: [{ label: "Undo", run: () => { character.arcaneWard = ward; paid.refund(); } }] });
    };
    const highest = characterSpellSlots().length || 1;
    const recharge = Array.from({ length: highest }, (_, index) => index + 1).map(level => ({ label: `Cast a ${ordinal(level)}-level abjuration (+${2 * level})`, run: () => {
      character.arcaneWard.hp = Math.min(character.arcaneWard.max, Number(character.arcaneWard.hp) + 2 * level);
      persistAndRender();
      showToast(`<span class="toast-label">Arcane Ward ${character.arcaneWard.hp}/${character.arcaneWard.max}</span>`);
    } }));
    showToast(`<span class="toast-label">Arcane Ward</span><span>${ward ? `${ward.hp}/${ward.max} ward HP. Each abjuration spell of 1st level or higher restores twice its level.` : `Casting an abjuration spell of 1st level or higher creates it with ${max} HP, once per long rest.`}</span>`, {
      actions: ward ? recharge : [{ label: "Create it (cast an abjuration spell)", run: create }],
      persist: true
    });
  },
  // Grim Harvest (Necromancy 2): kill with a spell, regain twice its level in HP (three times for necromancy).
  grim() {
    const highest = Math.max(1, characterSpellSlots().length);
    showToast(`<span class="toast-label">Grim Harvest</span><span>Once per turn, when your spell kills a creature that isn't a construct or undead. Pick the spell's level.</span>`, {
      actions: Array.from({ length: highest }, (_, index) => index + 1).flatMap(level => [
        { label: `${ordinal(level)} (+${2 * level})`, run: () => healBy(2 * level) },
        { label: `${ordinal(level)} necromancy (+${3 * level})`, run: () => healBy(3 * level) }
      ]),
      persist: true
    });
  },
  // On/off states (Bladesong, Hybrid Transformation): use.flag names the character field.
  toggle(action, use) {
    if (character[use.flag]) {
      character[use.flag] = false;
      persistAndRender();
      showToast(`<span class="toast-label">${escapeHtml(action.name)} ends</span>`);
      return;
    }
    const paid = payFor(use);
    if (!paid) return;
    character[use.flag] = true;
    persistAndRender();
    showToast(`<span class="toast-label">${escapeHtml(action.name)}</span><span>${escapeHtml(use.text)}${paid.status ? ` ${escapeHtml(paid.status)}.` : ""}</span>`, {
      actions: [{ label: "Undo", run: () => { character[use.flag] = false; paid.refund(); } }, { label: "End it", run: () => { character[use.flag] = false; persistAndRender(); } }],
      duration: 9000
    });
  },
  // Spend a chosen number of points (Bastion of Law 1-5 SP, Revelation in Flesh one benefit per SP).
  points(action, use) {
    const resource = character.resources.find(item => item.name === use.resource);
    const most = Math.min(use.most || 99, Number(resource?.current || 0));
    if (most < 1) {
      showToast(`<span class="toast-label">No ${escapeHtml(use.resource)} left</span>`, { tone: "fumble" });
      return;
    }
    showToast(`<span class="toast-label">${escapeHtml(action.name)}</span><span>${resource.current} ${escapeHtml(use.resource)} left. ${escapeHtml(use.text)}</span>`, {
      actions: Array.from({ length: most }, (_, index) => index + 1).map(count => ({ label: `${count} ${use.unit}`, run: () => useFeatureAction({ ...action, use: { kind: "note", cost: [use.resource, count], text: use.each(count) } }, true) })),
      persist: true
    });
  },
  // Eldritch Master (warlock 20): 1 minute to regain every expended pact slot.
  eldritchMaster(action, use) {
    const paid = payFor(use);
    if (!paid) return;
    const usage = { ...character.spellSlotUsage };
    const pactBefore = character.pactSlotUsage;
    if (slotsArePact()) character.spellSlotUsage = {};
    else character.pactSlotUsage = 0;
    persistAndRender();
    showToast(`<span class="toast-label">Eldritch Master</span><span>Pact Magic slots restored. ${escapeHtml(paid.status)}.</span>`, {
      tone: "crit",
      actions: [{ label: "Undo", run: () => { character.spellSlotUsage = usage; character.pactSlotUsage = pactBefore; paid.refund(); } }]
    });
  },
  // Eldritch Smite (XGE): spend a pact slot on a pact weapon hit for 1d8 + 1d8 per slot level force.
  eldritchSmite() {
    const pact = pactSlotPool();
    const level = slotsArePact() ? characterSpellSlots().length : pact?.level || 0;
    const left = slotsArePact() ? slotRemaining(level, characterSpellSlots()[level - 1]) : pact?.left || 0;
    if (!level || left < 1) {
      showToast(`<span class="toast-label">Eldritch Smite</span><span>No pact slots left.</span>`, { tone: "fumble" });
      return;
    }
    if (slotsArePact()) spendSlot(level);
    else {
      character.pactSlotUsage = Number(character.pactSlotUsage || 0) + 1;
      persistAndRender();
    }
    rollFromInput(`Eldritch Smite (${ordinal(level)}-level pact slot)`, `${level + 1}d8`, "normal", [], "Force damage; double the dice on a crit. A Huge or smaller target is knocked prone.");
  }
};

function giveInspiration(sheetId, die, valor, paid = null) {
  const other = characterLibrary[sheetId];
  if (!other) return paid?.refund();
  other.resources = [...(other.resources || []).filter(item => !item.inspirationFrom), {
    id: crypto.randomUUID(), name: `Bardic Inspiration from ${character.name || "a bard"}${valor ? " (Valor)" : ""}`, current: 1, max: 1, reset: "manual", die, inspirationFrom: character.sheetId
  }];
  other.updatedAt = Date.now();
  saveCharacterLibrary();
  renderAll();
  const undo = paid ? [{ label: "Undo", run: () => {
    paid.refund();
    other.resources = (other.resources || []).filter(item => item.inspirationFrom !== character.sheetId);
    other.updatedAt = Date.now();
    saveCharacterLibrary();
    renderAll();
  } }] : [];
  showToast(`<span class="toast-label">${other.name ? `${escapeHtml(other.name)} holds` : "They hold"} a d${die}</span><span>It shows in their trackers with a roll button.${paid ? ` ${escapeHtml(paid.status)}.` : ""}</span>`, { actions: undo });
}

function usePortentDie(index) {
  const dice = character.portentDice || [];
  const value = dice[index];
  if (value === undefined) return;
  character.portentDice = dice.filter((_, other) => other !== index);
  const tracker = character.resources.find(item => item.name === "Portent");
  if (tracker) tracker.current = character.portentDice.length;
  persistAndRender();
  showToast(`<span class="toast-label">Portent: ${value}</span><span>That roll is a ${value}. ${character.portentDice.length} left.</span>`, {
    actions: [{ label: "Undo", run: () => { character.portentDice.splice(index, 0, value); if (tracker) tracker.current = character.portentDice.length; persistAndRender(); } }]
  });
}

function rollPortent() {
  const count = subclassLevel("divination") >= 14 ? 3 : 2;
  character.portentDice = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * 20));
  const tracker = character.resources.find(item => item.name === "Portent");
  if (tracker) tracker.current = count;
  persistAndRender();
}

// Rest effects beyond refilling trackers.
function classFeatureRest(type) {
  ["bladesong", "hybrid", "symbiotic", "starryForm"].forEach(flag => { character[flag] = false; });
  character.crimsonRite = null;
  character.resources = character.resources.filter(item => !(item.inspirationFrom && !Number(item.current)));
  // Sorcerous Restoration (sorcerer 20): a short rest returns 4 sorcery points.
  const points = sorceryPoints();
  if (type === "short" && points && classLevel("sorcerer") >= 20) points.current = Math.min(Number(points.max), Number(points.current) + 4);
  // Power Surge (War Magic 6, XGE): a long rest sets it to one; a short rest gives one if you have none.
  const surge = character.resources.find(item => item.name === "Power Surge");
  if (surge && (type === "long" || !Number(surge.current))) surge.current = Math.min(1, Number(surge.max));
  if (type === "short") character.wildShape = wildShapeAfterRest(1);
  if (type === "long") {
    character.arcaneWard = null;
    if (subclassLevel("divination") >= 2) rollPortent();
  }
}

// The Arcane Ward takes damage before temporary HP.
function arcaneWardAbsorb(amount, notes) {
  const ward = character.arcaneWard;
  if (!ward || Number(ward.hp) <= 0) return amount;
  const taken = Math.min(Number(ward.hp), amount);
  ward.hp = Number(ward.hp) - taken;
  notes.push(`Arcane Ward absorbs ${taken} (${ward.hp}/${ward.max} left).`);
  return amount - taken;
}

// ---- Combat rules: armor, fighting styles, class choices, damage modifiers and turn state ----

function wornItems() {
  return (character.equipment || []).filter(item => item.equipped || item.container === "equipped");
}

// Body armor is the worn item with an "AC N" line; shields are named as such.
function wornArmor() {
  return wornItems().find(item => /\bAC\s+\d+/i.test(item.notes || "") && !/shield/i.test(item.name || ""));
}

function wearingShield() {
  return wornItems().some(item => /shield/i.test(item.name || ""));
}

function armorCategory(item) {
  if (!item) return "";
  if (/shield/i.test(item.name || "")) return "shield";
  const notes = String(item.notes || "");
  const named = notes.match(/\b(light|medium|heavy) armor\b/i)?.[1];
  if (named) return named.toLowerCase();
  // Hand-written armor: read the weight from its AC line (no DEX = heavy, capped DEX = medium).
  if (!/\bAC\s+\d+/i.test(notes)) return "";
  return !/\+\s*Dex/i.test(notes) ? "heavy" : /max\s+\d/i.test(notes) ? "medium" : "light";
}

function wearingHeavyArmor() {
  return armorCategory(wornArmor()) === "heavy";
}

// Everything the sheet says the character is trained with: the written field (or the class default on sheets that
// never filled it), species grants, subclass grants and multiclass grants.
function trainingText(field) {
  const index = field === "armor" ? 0 : 1;
  const written = String(character.backgroundDetails?.[field] || "").trim();
  const cls = currentClass();
  const parts = [written || cls[field] || CLASS_PROFICIENCIES[cls.id]?.[index] || ""];
  parts.push(...(SPECIES_GRANTS[character.species]?.[field] || []));
  classEntries().forEach(entry => {
    parts.push(...(lookupBySubclass(SUBCLASS_EXTRAS, subclassIndexFor(entry) || entry.subclassName)?.[field] || []));
    if (entry.key !== "primary") parts.push(multiclassProficienciesFor(entry.classId)?.[field] || "");
  });
  if (field === "armor") {
    if (hasFeat("Lightly Armored")) parts.push("light armor");
    if (hasFeat("Moderately Armored")) parts.push("medium armor, shields");
    if (hasFeat("Heavily Armored")) parts.push("heavy armor");
  }
  return parts.join(", ").toLowerCase();
}

function armorProficient(item) {
  const kind = armorCategory(item);
  if (!kind) return true;
  const text = trainingText("armor");
  if (kind === "shield") return /shield/.test(text);
  return /all armor/.test(text) || text.includes(`${kind} armor`);
}

// Armor or a shield worn without proficiency (PHB p.144): disadvantage on STR/DEX rolls and no spellcasting.
function untrainedArmorItem() {
  return wornItems().find(item => armorCategory(item) && !armorProficient(item)) || null;
}

// PHB p.146: proficiency only adds to attacks with weapons you're proficient with.
function weaponProficient(item) {
  const training = trainingText("weapons");
  const text = `${item.name} ${item.notes || ""}`.toLowerCase();
  const category = text.match(/\b(simple|martial) (?:melee|ranged) weapon/)?.[1];
  if (category && training.includes(`${category} weapons`)) return true;
  if (/firearm/.test(text) && (/firearm/.test(training) || hasFeat("Gunner"))) return true;
  if (/improvised/.test(text) && hasFeat("Tavern Brawler")) return true;
  const base = String(item.name || "").toLowerCase().replace(/\+\d|\(.*?\)/g, "").trim();
  if (base && training.includes(base)) return true;
  // A home-made item with no category can't be checked; assume the player knows.
  return !category && !/firearm/.test(text);
}

// Kensei weapons (XGE p.34) are weapon types picked in classChoices.kenseiWeapons.
function kenseiWeapon(item) {
  const base = String(item?.name || "").toLowerCase().replace(/\+\d|\(.*?\)/g, "").trim();
  return subclassLevel("kensei") >= 3 && classChoiceNames("kenseiWeapons").some(name => base === name.toLowerCase());
}

// Names chosen for a class option: the level-up picks (classChoices), sheet rows (classOptions) and feature text.
function choiceWritten(name) {
  const text = `${character.features || ""}\n${(character.classOptions || []).map(item => item.name).join("\n")}\n${classChoiceNames("invocations").join("\n")}`;
  return new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text);
}

function hasFightingStyle() {
  return classLevel("fighter") > 0 || classLevel("paladin") >= 2 || classLevel("ranger") >= 2 || classLevel("bloodhunter") >= 2 || subclassLevel("swords") >= 3 || hasFeat("Fighting Initiate");
}

function fightingStyles() {
  if (!hasFightingStyle()) return [];
  const names = CLASS_OPTIONS.fightingStyles.map(style => style.name);
  const picked = character.classChoices?.fightingStyles ? classChoiceNames("fightingStyles") : [character.fightingStyle];
  const text = `${character.features || ""}\n${(character.classOptions || []).map(item => item.name).join("\n")}`;
  const written = names.filter(name => new RegExp(`fighting style[^\\n]*${name}`, "i").test(text));
  return [...new Set([...picked, ...written])].filter(name => names.includes(name));
}

function hasStyle(name) {
  return fightingStyles().includes(name);
}

// Martial Arts and Unarmored Movement need no armor and no shield (PHB p.78).
function monkUnarmored() {
  return !wornArmor() && !wearingShield();
}

// Rage's benefits need no heavy armor (PHB p.48).
function rageActive() {
  return Boolean(character.raging) && !wearingHeavyArmor();
}

// Totem Warrior picks at 3rd, 6th and 14th level (or a "Bear totem" line in features for the 3rd-level one).
function totemSpirit(level) {
  if (subclassLevel("totem-warrior") < level) return "";
  const index = { 3: 0, 6: 1, 14: 2 }[level];
  const picked = character.classChoices?.totems?.[level];
  if (picked || index) return picked || "";
  return ["Bear", "Eagle", "Elk", "Tiger", "Wolf"].find(name => new RegExp(`totem[^\\n]*\\b${name}\\b|\\b${name}\\b[^\\n]*totem`, "i").test(character.features || "")) || "";
}

function hunterOption(name) {
  return subclassLevel("hunter") > 0 && (classChoiceNames("hunter").includes(name) || choiceWritten(name));
}

// Tasha's ranger replacements: on with the optional rule unless the sheet records the PHB feature instead.
function rangerOption(flag) {
  return optionalRule("tashas") && (character.classChoices?.[flag] ?? true);
}

function pactWeaponId() {
  if (classLevel("warlock") < 3) return "";
  return character.combatChoices?.pactWeapon || wornItems().find(item => /\bpact\b/i.test(`${item.name} ${item.notes || ""}`))?.id || "";
}

const BPS = ["bludgeoning", "piercing", "slashing"];
const DAMAGE_TYPES = ["acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic", "piercing", "poison", "psychic", "radiant", "slashing", "thunder"];
const SPECIES_RESISTANCES = [
  [/dwarf|duergar|stout halfling|warforged|reborn|autognome/i, ["poison"]],
  [/tiefling|fire genasi/i, ["fire"]],
  [/aasimar/i, ["necrotic", "radiant"]],
  [/water genasi/i, ["acid"]],
  [/triton/i, ["cold"]],
  [/shadar-kai/i, ["necrotic"]],
  [/kalashtar/i, ["psychic"]],
  [/plasmoid/i, ["acid", "poison"]]
];
const SPECIES_IMMUNITIES = [[/yuan-ti|grung/i, ["poison"]]];

// Every resistance the sheet knows about. With a type, the ones that apply; without, all of them with what they cover.
function resistanceSources(type = "", raging = Boolean(character.raging)) {
  const entries = [];
  if (raging && !wearingHeavyArmor()) {
    entries.push(totemSpirit(3) === "Bear" ? ["Rage (Bear)", t => t !== "psychic", "all but psychic"] : ["Rage", t => BPS.includes(t), "B/P/S"]);
  }
  if ((character.conditions || []).includes("Petrified")) entries.push(["Petrified", () => true, "all"]);
  if (hasEffect("Empty Body")) entries.push(["Empty Body", t => t !== "force", "all but force"]);
  if (character.concentration === "Stoneskin") entries.push(["Stoneskin", t => BPS.includes(t), "nonmagical B/P/S"]);
  const resist = (name, types, what = types.join("/")) => entries.push([name, t => types.includes(t), what]);
  SPECIES_RESISTANCES.filter(([pattern]) => pattern.test(speciesLineage())).forEach(([, types]) => resist(character.species, types));
  // Draconic ancestry and feats (Infernal Constitution, giant feats, Scion of the Outer Planes, Planar Wanderer).
  resistanceGrants().forEach(([name, t]) => resist(name, [t]));
  // Subclass features. "Nonmagical" ones apply on their own like Stoneskin; the damage toast can undo a magical hit.
  if (character.hybrid && subclassLevel("lycan")) resist("Hybrid Transformation", BPS, "nonmagical B/P/S");
  if (character.crimsonRite?.name === "Rite of the Dawn") resist("Rite of the Dawn", ["necrotic"]);
  if (subclassLevel("forge") >= 6) resist("Soul of the Forge", ["fire"]);
  if (subclassLevel("forge") >= 17 && wearingHeavyArmor()) resist("Saint of Forge and Fire", BPS, "nonmagical B/P/S");
  if (subclassLevel("war") >= 17) resist("Avatar of Battle", BPS, "nonmagical B/P/S");
  if (subclassLevel("stars") >= 14 && starryForm()) resist("Full of Stars", BPS, "B/P/S");
  if (subclassLevel("alchemist") >= 15) resist("Chemical Mastery", ["acid", "poison"]);
  return entries.filter(([, test]) => !type || test(type)).map(([name, , what]) => type ? name : `${name} ${what}`);
}

function damageImmunities(type) {
  const sources = SPECIES_IMMUNITIES.filter(([pattern, types]) => pattern.test(character.species || "") && types.includes(type)).map(() => character.species);
  if (type === "poison" && (character.conditions || []).includes("Petrified")) sources.push("Petrified");
  // Purity of Body covers poison damage too (Sage Advice Compendium).
  if (type === "poison" && classLevel("monk") >= 10) sources.push("Purity of Body");
  if (type === "poison" && subclassLevel("mutant") >= 7) sources.push("Strange Metabolism");
  if (type === "poison" && subclassLevel("land") >= 10) sources.push("Nature's Ward");
  if (type === "fire" && subclassLevel("forge") >= 17) sources.push("Saint of Forge and Fire");
  return sources;
}

function conscious() {
  return Number(character.hp) > 0 && !(character.conditions || []).includes("Unconscious");
}

// Conditions this character can't have right now, with the reason (PHB p.49, 79, 85-86; VGM; ToA).
function conditionImmunities() {
  const immune = new Map();
  if (classLevel("paladin") >= 10 && conscious()) immune.set("Frightened", "Aura of Courage");
  if (subclassLevel("devotion") >= 7 && conscious()) immune.set("Charmed", "Aura of Devotion");
  if (classLevel("monk") >= 10) immune.set("Poisoned", "Purity of Body");
  if (subclassLevel("berserker") >= 6 && rageActive()) ["Charmed", "Frightened"].forEach(name => immune.set(name, "Mindless Rage"));
  if (/yuan-ti|grung/i.test(character.species || "")) immune.set("Poisoned", character.species);
  if (subclassLevel("mutant") >= 7) immune.set("Poisoned", "Strange Metabolism");
  if (subclassLevel("land") >= 10) immune.set("Poisoned", "Nature's Ward");
  if (subclassLevel("alchemist") >= 15) immune.set("Poisoned", "Chemical Mastery");
  if (subclassLevel("spores") >= 14) ["Blinded", "Deafened", "Frightened", "Poisoned"].forEach(name => immune.set(name, "Fungal Body"));
  return immune;
}

function hasEvasion() {
  return (classLevel("rogue") >= 7 || classLevel("monk") >= 7 || hunterOption("Evasion")) && !incapacitatedBy();
}

// Per-turn flags (reaction, Sneak Attack, Reckless...) and timed effects counted in rounds.
function turnState() {
  if (!character.turn || typeof character.turn !== "object") character.turn = {};
  return character.turn;
}

function effects() {
  if (!character.effects || typeof character.effects !== "object") character.effects = {};
  return character.effects;
}

function hasEffect(name) {
  return Number(effects()[name] || 0) > 0;
}

// Ends a rage; Frenzy leaves one level of exhaustion (PHB p.49). Returns the note to show.
function endRage() {
  if (!character.raging) return "";
  character.raging = false;
  delete effects().Rage;
  if (!character.frenzied) return "Your rage ends.";
  character.frenzied = false;
  character.exhaustion = Math.min(6, Number(character.exhaustion || 0) + 1);
  return `Your rage ends. Frenzy: exhaustion ${character.exhaustion}.`;
}

// Warn before a second reaction in the same round (PHB p.190).
function reactionSpent(retry) {
  if (!turnState().reaction) return false;
  showToast(`<span class="toast-label">Reaction already used</span><span>You get one reaction per round; it comes back at the start of your turn (press Next turn).</span>`, {
    actions: [{ label: "Use it anyway", run: retry }],
    persist: true
  });
  return true;
}

// Rolling initiative starts round 1 and triggers the "when you roll initiative" features.
function startCombat() {
  const notes = [];
  const resource = name => character.resources.find(item => item.name === name);
  const refill = (name, amount, why) => {
    const item = resource(name);
    if (item && Number(item.current) === 0) {
      item.current = Math.min(Number(item.max), amount);
      notes.push(why);
    }
  };
  character.turn = { round: 1 };
  character.turnCasts = null;
  if (classLevel("monk") >= 20) refill("Ki Points", 4, "Perfect Self: regained 4 ki.");
  if (subclassLevel("battle-master") >= 15) refill("Superiority Dice", 1, "Relentless: regained 1 superiority die.");
  if (classLevel("bard") >= 20) refill("Bardic Inspiration", 1, "Superior Inspiration: regained 1 Bardic Inspiration.");
  persistAndRender();
  if (notes.length) showToast(`<span class="toast-label">Combat starts</span><span>${escapeHtml(notes.join(" "))}</span>`, { tone: "crit" });
}

// Sneak Attack and Colossus Slayer are once per turn, not per round (PHB p.93, 96): an attack on another creature's
// turn (an opportunity attack) can use them again. Divine Fury, Favored Foe and the like are "on each of your turns".
const ANY_TURN_RIDERS = ["sneak", "colossus", "deft-strike"];
function enemyTurnRiders() {
  const turn = turnState();
  turn.riders = (turn.riders || []).filter(key => !ANY_TURN_RIDERS.includes(key));
}

function nextTurn() {
  const turn = turnState();
  const notes = [];
  const unfedRage = character.raging && classLevel("barbarian") < 15 && !turn.rageFed;
  Object.keys(effects()).forEach(name => {
    effects()[name] = Number(effects()[name]) - 1;
    if (effects()[name] > 0) return;
    delete effects()[name];
    notes.push(name === "Rage" ? endRage() : `${name} ends.`);
  });
  character.turn = { round: Number(turn.round || 0) + 1 };
  // A new turn clears the bonus-action-spell limit (PHB p.202).
  character.turnCasts = null;
  persistAndRender();
  const actions = [];
  // PHB p.48: a rage ends early if your turn ended without attacking a hostile creature or taking damage.
  if (unfedRage && character.raging) {
    notes.push("Did you attack a hostile creature or take damage since your last turn? If not, your rage ended.");
    actions.push({ label: "End rage", run: () => { const note = endRage(); persistAndRender(); showToast(`<span class="toast-label">Rage ends</span><span>${escapeHtml(note)}</span>`); } });
  }
  // Save-ends conditions (end or start of turn) and a dying character's death save (PHB p.197) come up now.
  actions.push(...conditionSaveActions("turn"));
  if (isDying()) {
    notes.unshift("You're at 0 HP: roll a death save.");
    actions.unshift({ label: "Roll death save", run: rollDeathSave });
  }
  showToast(`<span class="toast-label">Round ${character.turn.round}: your turn</span><span>${escapeHtml(notes.join(" ") || (incapacitatedBy() ? `You're ${incapacitatedBy().toLowerCase()}: no actions or reactions.` : "Your reaction is back."))}</span>`, { actions, persist: actions.length > 0 });
}

function endCombatState(restType = "") {
  if (character.raging) endRage();
  character.turn = {};
  character.initiative = null;
  // Death Ward lasts 8 hours: only a long rest outlasts it.
  const ward = restType !== "long" && effects()["Death Ward"];
  character.effects = ward ? { "Death Ward": ward } : {};
  character.frenzied = false;
  character.relentlessUses = 0;
}

const TURN_EFFECT_NOTES = {
  Rage: () => `Raging${character.frenzied ? " (frenzy)" : ""}`,
  "Sacred Weapon": () => `Sacred Weapon: +${Math.max(1, mod("cha"))} to weapon attacks`,
  "Vow of Enmity": () => "Vow of Enmity: advantage against the vowed creature",
  "Empty Body": () => "Empty Body: invisible, resistance to all but force",
  "Hexblade's Curse": () => `Hexblade's Curse: +${proficiencyBonus()} damage, crit on 19-20 against the target`,
  Reckless: () => "Reckless: attacks against you have advantage",
  "Nature's Veil": () => "Nature's Veil: invisible",
  "Starry Form": () => `Starry Form: ${character.starryForm || "constellation"}`,
  "Death Ward": () => "Death Ward: the first drop to 0 HP leaves you at 1",
  "Beacon of Hope": () => "Beacon of Hope: advantage on WIS and death saves, healing is maximized",
  Shield: () => "Shield: +5 AC",
  "Shield of Faith": () => "Shield of Faith: +2 AC",
  Haste: () => "Haste: +2 AC, double speed, advantage on DEX saves, one extra limited action",
  Barkskin: () => "Barkskin: AC at least 16"
};

// AC with spell effects on top of the sheet's AC (PHB): Shield +5 until your next turn, Shield of Faith +2, Haste +2,
// and Barkskin's floor of 16 (applied last, so a lower AC plus bonuses still reads 16).
function effectiveArmorClass(source = character) {
  const on = name => Number(source.effects?.[name] || 0) > 0;
  const ac = Number(source.ac || 10) + (on("Shield") ? 5 : 0) + (on("Shield of Faith") ? 2 : 0) + (on("Haste") ? 2 : 0);
  return on("Barkskin") ? Math.max(16, ac) : ac;
}

// The active Starry Form constellation ("Archer", "Chalice", "Dragon"), or "".
function starryForm() {
  return subclassLevel("stars") >= 2 && hasEffect("Starry Form") ? character.starryForm || "" : "";
}

// How much of a Preserve Life pool a sheet can take: up to half its HP maximum.
function preserveLifeRoom(sheet, left) {
  return Math.min(left, Math.max(0, Math.floor(effectiveMaxHp(sheet) / 2) - Number(sheet.hp || 0)));
}

function renderTurnPrompt() {
  const root = document.querySelector("#turnPrompt");
  if (!root) return;
  const turn = turnState();
  const active = Object.entries(effects()).filter(([, rounds]) => Number(rounds) > 0);
  // In combat the Action / Bonus / Reaction markers show the reaction, so the flag is only for out of combat.
  const flags = [turn.reaction && !turn.round ? "Reaction used" : "", (turn.riders || []).includes("sneak") ? "Sneak Attack used this turn" : ""].filter(Boolean);
  if (!turn.round && !active.length && !flags.length) {
    root.innerHTML = "";
    return;
  }
  // The rage card below covers Rage and Reckless.
  const items = active.filter(([name]) => !(character.raging && ["Rage", "Reckless"].includes(name))).map(([name, rounds]) => `${(TURN_EFFECT_NOTES[name] || (() => name))()} (${rounds} round${Number(rounds) === 1 ? "" : "s"})`);
  root.innerHTML = `
    <span><strong>${turn.round ? `Round ${turn.round}` : "Effects"}:</strong> ${escapeHtml([...items, ...flags].join(" · ") || (character.raging ? "" : "nothing active"))}</span>
    ${turn.round ? turnEconomyHtml(turn) : ""}
    ${character.raging ? rageCardHtml(turn) : ""}
    ${active.map(([name]) => `<button type="button" class="ghost" data-end-effect="${escapeHtml(name)}">End ${escapeHtml(name)}</button>`).join("")}
    ${hasEffect("Hexblade's Curse") ? `<button type="button" class="ghost" data-curse-kill>Cursed target died (heal ${Math.max(1, classLevel("warlock") + mod("cha"))})</button>` : ""}
    ${(turn.riders || []).some(key => ANY_TURN_RIDERS.includes(key)) ? `<button type="button" class="ghost" data-enemy-turn title="Sneak Attack and Colossus Slayer work once on each creature's turn">Enemy's turn</button>` : ""}
    <button type="button" class="secondary" data-next-turn>Next turn</button>
    ${turn.round ? `<button type="button" class="ghost" data-end-combat>End combat</button>` : ""}
  `;
}

// Action / Bonus / Reaction markers for this turn. Action Surge adds an action (turn.extraActions).
function turnEconomyHtml(turn) {
  const allowed = 1 + Number(turn.extraActions || 0);
  const used = Number(turn.actions || 0);
  const pip = (label, on, text = label) => `<span class="turn-pip" data-used="${on}">${escapeHtml(text)}<span class="visually-hidden">${on ? " used" : " ready"}</span></span>`;
  return `<span class="turn-economy" role="group" aria-label="This turn">
    ${pip("Action", used >= allowed, allowed > 1 ? `Action ${Math.min(used, allowed)}/${allowed}` : "Action")}
    ${pip("Bonus", Number(turn.bonus || 0) > 0, Number(turn.bonus || 0) > 1 ? `Bonus ×${turn.bonus}` : "Bonus")}
    ${pip("Reaction", Boolean(turn.reaction))}
  </span>`;
}

// What a raging Berserker (or any barbarian) needs at a glance: frenzy, Reckless, rounds left of 10.
function rageCardHtml(turn) {
  const rounds = Number(effects().Rage || 0);
  return `<span class="rage-card"><strong>Rage on</strong>
    <span>${character.frenzied ? "Frenzy" : "No frenzy"}</span>
    <span>${turn.reckless ? "Reckless used this turn" : "Reckless not used"}</span>
    <span>${rounds} of 10 rounds left</span></span>`;
}

// Fill a marker when a row, feature or spell of that type is used in combat. A second bonus action only warns.
function markTurnCost(type) {
  const turn = turnState();
  if (!turn.round) return;
  if (type === "Action") turn.actions = Number(turn.actions || 0) + 1;
  if (type === "Bonus Action") {
    if (turn.bonus) showToast(`<span class="toast-label">Second bonus action</span><span>You get one bonus action per turn; you already used it this turn.</span>`, { tone: "fumble" });
    turn.bonus = Number(turn.bonus || 0) + 1;
  }
  persistAndRender();
}

function handleTurnPromptClick(event) {
  if (event.target.closest("[data-next-turn]")) return nextTurn();
  if (event.target.closest("[data-enemy-turn]")) {
    enemyTurnRiders();
    persistAndRender();
    return;
  }
  if (event.target.closest("[data-end-combat]")) {
    character.turn = {};
    persistAndRender();
    return;
  }
  const end = event.target.closest("[data-end-effect]");
  if (end) {
    const name = end.dataset.endEffect;
    if (name === "Rage") endRage();
    delete effects()[name];
    persistAndRender();
    return;
  }
  if (event.target.closest("[data-curse-kill]")) {
    delete effects()["Hexblade's Curse"];
    healBy(Math.max(1, classLevel("warlock") + mod("cha")));
  }
}

// Per-roll bonuses the player switches on in the roll modal. Bless and Bane stay on until switched off.
function rollChips(request) {
  const chips = [];
  const kind = request.kind;
  if (!["attack", "check", "save"].includes(kind)) return chips;
  const lasting = character.rollBuffs || [];
  const add = (id, label, formula, extra = {}) => chips.push({ id, label, formula, on: lasting.includes(id), ...extra });
  if (kind !== "check") {
    add("bless", "Bless +1d4", "+1d4", { lasting: true });
    add("bane", "Bane -1d4", "-1d4", { lasting: true });
  }
  if (kind === "check") add("guidance", "Guidance +1d4", "+1d4");
  // Pass without Trace (PHB p.264): +10 to Stealth within 30 ft of the caster; on when you concentrate on it yourself.
  if (kind === "check" && request.context === "stealth") add("pass-without-trace", "Pass without Trace +10", "+10", { on: /^pass without trace$/i.test(character.concentration || "") });
  if (kind === "save") add("resistance", "Resistance +1d4", "+1d4");
  if (kind === "save" && request.ability === "dex") {
    add("cover2", "Half cover +2", "+2");
    add("cover5", "Three-quarters cover +5", "+5");
    if (hasFeat("Shield Master") && wearingShield()) add("shield-master", "Shield Master +2 (one target)", "+2");
  }
  if (kind === "save") {
    // Aura of Protection from another paladin on this device (PHB p.85). Auras don't stack (DMG p.252): offer each
    // the strongest one, and only for what it adds over your own aura.
    const own = auraOfProtection();
    const auraBonus = other => Math.max(1, Math.floor(((other.abilities?.cha || 10) - 10) / 2));
    const best = Object.values(characterLibrary).filter(other => other.sheetId !== character.sheetId && classLevel("paladin", other) >= 6 && Number(other.hp) > 0 && !(other.conditions || []).includes("Unconscious"))
      .sort((a, b) => auraBonus(b) - auraBonus(a))[0];
    const extra = best ? auraBonus(best) - own : 0;
    if (extra > 0) add(`aura-${best.sheetId}`, `${best.name || "Paladin"}'s aura +${extra}${own ? " over yours" : ""} (within ${classLevel("paladin", best) >= 18 ? 30 : 10} ft)`, `+${extra}`);
  }
  if ((character.conditions || []).includes("Frightened") && kind !== "save") add("fear-hidden", "Fear source out of sight", "", { ignore: "Frightened" });
  if (kind === "attack") {
    if (request.powerAttack) add("power", `${request.powerAttack} -5 / +10`, "-5", { damage: 10 });
    add("underwater", "Underwater", "", request.underwaterOk ? {} : { disadvantage: "underwater" });
  }
  return chips;
}

function toggleRollChip(request, chip) {
  if (!chip) return;
  chip.on = !chip.on;
  if (!chip.lasting) return;
  const lasting = new Set(character.rollBuffs || []);
  if (chip.on) lasting.add(chip.id);
  else lasting.delete(chip.id);
  character.rollBuffs = [...lasting];
  persist();
}

// Situational reminders the sheet can't decide on its own, shown in the roll modal.
function rollHints(request) {
  const hints = [];
  const species = speciesLineage();
  const ability = request.ability;
  const conditions = character.conditions || [];
  if (request.kind === "save") {
    if (/gnome/i.test(species) && !/autognome/i.test(species) && ["int", "wis", "cha"].includes(ability)) hints.push("Gnome Cunning: advantage if this save is against magic.");
    if (/halfling|kender/i.test(species)) hints.push("Brave: advantage against being frightened.");
    if (/dwarf|duergar|stout halfling/i.test(species)) hints.push(`${/stout/i.test(species) ? "Stout" : "Dwarven"} Resilience: advantage against poison.`);
    if (/elf|eladrin|drow|shadar-kai/i.test(species)) hints.push("Fey Ancestry: advantage against being charmed.");
    if (/duergar/i.test(species)) hints.push("Duergar Resilience: advantage against illusions, being charmed or paralyzed.");
    if (/githzerai|loxodon/i.test(species)) hints.push("Advantage against being charmed or frightened.");
    if (/yuan-ti|satyr/i.test(species)) hints.push("Magic Resistance: advantage against spells and magical effects.");
    if (hasFeat("Mage Slayer")) hints.push("Mage Slayer: advantage against spells cast by a creature within 5 ft.");
    if (hasFeat("Infernal Constitution")) hints.push("Infernal Constitution: advantage against being poisoned.");
    if (/autognome/i.test(species)) hints.push("Mechanical Nature: advantage against being paralyzed or poisoned.");
    if (hunterOption("Steel Will")) hints.push("Steel Will: advantage against being frightened.");
    if (ability === "dex" && hasEvasion()) hints.push("Evasion: no damage on a success, half on a failure (use Evasion on the damage toast).");
    if (hasFeat("Dungeon Delver")) hints.push("Dungeon Delver: advantage against traps.");
  }
  if (request.kind === "check") {
    if (conditions.includes("Blinded")) hints.push("Blinded: a check that relies on sight fails automatically.");
    if (conditions.includes("Deafened")) hints.push("Deafened: a check that relies on hearing fails automatically.");
    if (hasFeat("Dungeon Delver") && ["perception", "investigation"].includes(request.context)) hints.push("Dungeon Delver: advantage when searching for secret doors.");
    if (hasFeat("Squat Nimbleness") && ["athletics", "acrobatics"].includes(request.context)) hints.push("Squat Nimbleness: advantage to escape a grapple.");
  }
  if (conditions.includes("Frightened") && request.kind !== "save") hints.push("Frightened only gives disadvantage while the source of your fear is in sight.");
  if (request.kind === "attack") {
    if (request.rangeNote) hints.push(request.rangeNote);
    if (hasEffect("Vow of Enmity")) hints.push("Vow of Enmity: switch on Advantage against your vowed target.");
    if (subclassLevel("assassin") >= 3) hints.push("Assassinate: advantage against a creature that hasn't taken a turn yet; any hit on a surprised creature is a critical hit.");
    if (subclassLevel("gloom-stalker") >= 3 && turnState().round === 1) hints.push("Dread Ambusher: on your first turn, the Attack action gets one extra weapon attack (+1d8 on a hit).");
    if (request.powerAttack === "Sharpshooter") hints.push("Sharpshooter: long range gives no disadvantage, and half and three-quarters cover don't apply.");
  }
  return hints;
}

// Follow-ups on a d20 roll: rerolls and features that change the die after you see it.
function d20FollowUps(request, result) {
  const natural = naturalD20(result);
  if (natural === null || !["attack", "check", "save"].includes(request.kind) || !request.view) return [];
  const used = request.used || (request.used = new Set());
  const resource = name => character.resources.find(item => item.name === name);
  const spend = (name, amount = 1) => {
    const item = resource(name);
    if (!item || Number(item.current) < amount) return false;
    item.current = Number(item.current) - amount;
    return true;
  };
  const d20s = result.dice.filter(die => die.sides === 20).map(die => die.value);
  const keptIndex = Math.max(0, result.dice.filter(die => die.sides === 20).findIndex(die => !die.dropped));
  const actions = [];
  // Rerolls run the whole roll again and replace the first one's outcome; edits change the die and re-run the outcome.
  const reroll = (label, name, cost = 1) => actions.push({ label, run: () => {
    if (!spend(name, cost)) return;
    openRoll({ ...request, label: `${request.label} (${label.split(":")[0]} reroll)`, result: null, used: new Set(), view: null, portent: null, replaces: request.before });
  } });
  if (natural === 1 && /halfling/i.test(speciesLineage()) && !used.has("halfling")) {
    actions.push({ label: "Halfling Lucky: reroll the 1", run: () => {
      used.add("halfling");
      const value = rollDie(20);
      const next = [...d20s];
      next[d20s.indexOf(1)] = value;
      const mode = request.view.mode;
      const pick = mode === "advantage" ? Math.max(...next) : mode === "disadvantage" ? Math.min(...next) : value;
      reviseRollResult(next, next.indexOf(pick), `Halfling Lucky: the 1 became ${value}`);
    } });
  }
  const luck = resource("Luck Points");
  if (luck && Number(luck.current) > 0 && !used.has("lucky")) {
    actions.push({ label: `Lucky: roll another d20 (${luck.current} left)`, run: () => {
      if (!spend("Luck Points")) return;
      used.add("lucky");
      const value = rollDie(20);
      const next = [...d20s, value];
      const best = Math.max(...next);
      reviseRollResult(next, next.indexOf(best), `Lucky: rolled ${value}, used the ${best}`);
    } });
  }
  // A Bardic Inspiration die another sheet gave you: add it after seeing the d20 (PHB p.53).
  const held = character.resources.find(item => item.inspirationFrom && Number(item.current) > 0 && item.die);
  if (held && !used.has("bardic")) {
    actions.push({ label: `+ Bardic Inspiration (d${held.die})`, run: () => {
      held.current = 0;
      used.add("bardic");
      const value = rollDie(Number(held.die));
      reviseRollResult(null, 0, `Bardic Inspiration: +${value}`, value);
    } });
  }
  if (request.kind === "save" && classLevel("fighter") >= 9 && Number(resource("Indomitable")?.current) > 0) reroll(`Indomitable: reroll (${resource("Indomitable").current} left)`, "Indomitable");
  if (request.kind === "save" && classLevel("monk") >= 14 && Number(resource("Ki Points")?.current) > 0) reroll("Diamond Soul: reroll (1 ki)", "Ki Points");
  if (classLevel("rogue") >= 20 && Number(resource("Stroke of Luck")?.current) > 0 && !used.has("stroke")) {
    if (request.kind === "attack") actions.push({ label: "Stroke of Luck: it hits", run: () => { if (spend("Stroke of Luck")) { used.add("stroke"); request.forcedHit = true; reviseRollResult(null, 0, "Stroke of Luck: the attack hits"); } } });
    if (request.kind === "check") actions.push({ label: "Stroke of Luck: natural 20", run: () => { if (spend("Stroke of Luck")) { used.add("stroke"); const next = [...d20s]; next[keptIndex] = 20; reviseRollResult(next, keptIndex, "Stroke of Luck: the d20 counts as 20"); } } });
  }
  // Focused Aim (TCE p.49): after a miss, 1-3 ki for +2 each.
  const aimed = request.focusedAim || 0;
  if (request.kind === "attack" && optionalRule("tashas") && classLevel("monk") >= 5 && aimed < 3 && Number(resource("Ki Points")?.current) > 0) {
    actions.push({ label: "Focused Aim: +2 (1 ki)", run: () => { if (spend("Ki Points")) { request.focusedAim = aimed + 1; reviseRollResult(null, 0, `Focused Aim: +2 (${aimed + 1} ki)`, 2); } } });
  }
  // Precision Attack: add a superiority die to the attack roll.
  if (request.kind === "attack" && knownManeuvers().includes("Precision Attack") && Number(resource("Superiority Dice")?.current) > 0 && !used.has("precision")) {
    const die = resourceDie("Superiority Dice");
    actions.push({ label: `Precision Attack: +d${die}`, run: () => { if (spend("Superiority Dice")) { used.add("precision"); const value = rollDie(die); reviseRollResult(null, 0, `Precision Attack: +${value}`, value); } } });
  }
  return actions;
}

// Riders that ride on an attack hit; each is its own button, like Sneak Attack.
function featureDamageRiders(options = {}) {
  const riders = [];
  const rite = character.crimsonRite;
  if (rite && options.weapon) {
    const die = hemocraftDie();
    // Brand of Sundering (Ghostslayer 11) adds one more hemocraft die.
    riders.push({ name: rite.name.replace("Rite of the ", "Rite: "), formula: `${subclassLevel("ghostslayer") >= 11 ? 2 : 1}d${die}` });
    if (rite.name === "Rite of the Dawn") riders.push({ name: "Rite of the Dawn vs undead", formula: `1d${die}` });
  }
  if (options.weapon && options.pactWeapon && classLevel("warlock") >= 12 && hasInvocation("Lifedrinker")) riders.push({ name: "Lifedrinker (pact weapon)", formula: String(Math.max(1, mod("cha"))), flat: true });
  if (options.weapon && options.melee && character.symbiotic && Number(character.tempHp || 0) > 0) riders.push({ name: "Symbiotic Entity", formula: "1d6" });
  if (subclassLevel("genie")) riders.push({ name: "Genie's Wrath (once per turn)", formula: String(proficiencyBonus()), flat: true });
  // Kensei's Shot (bonus action, this turn) and Deft Strike (6th: 1 ki, once per turn) on kensei weapon hits.
  if (options.kensei && options.rangedWeapon && hasEffect("Kensei's Shot")) riders.push({ name: "Kensei's Shot", formula: "1d4" });
  if (options.kensei && subclassLevel("kensei") >= 6 && Number(character.resources.find(item => item.name === "Ki Points")?.current) > 0) {
    const monk = classLevel("monk");
    riders.push({ name: "Deft Strike (1 ki)", formula: `1d${martialArtsDie(monk)}`, once: "deft-strike", spend: ["Ki Points", 1] });
  }
  const lycan = subclassLevel("lycan");
  if (character.hybrid && options.melee && lycan) riders.push({ name: "Feral Might", formula: String(lycan >= 18 ? 3 : lycan >= 11 ? 2 : 1), flat: true });
  return riders;
}

// Weapon ability and bonus from class features. Battle Ready (Battle Smith 3): INT for magic weapons.
// Improved Pact Weapon (XGE): +1 to a pact weapon that isn't already magic.
function featureWeaponAdjust(item, traits, ability, notes) {
  let bonus = 0;
  if (subclassLevel("battle-smith") >= 3 && itemMagicBonus(item) > 0 && mod("int") > mod(ability)) {
    ability = "int";
    notes.push("Battle Ready: uses Intelligence.");
  }
  if (item.id === pactWeaponId() && classLevel("warlock") >= 3 && hasInvocation("Improved Pact Weapon") && !itemMagicBonus(item)) {
    bonus = 1;
    notes.push("Improved Pact Weapon +1.");
  }
  return { ability, bonus };
}

function featureAcBonus(armor, worn) {
  const notes = String(armor?.notes || "");
  const heavy = armor && !/\+\s*Dex/i.test(notes);
  const light = !armor || (/\+\s*Dex/i.test(notes) && !/max\s+\d/i.test(notes));
  const shield = worn.some(item => /shield/i.test(item.name || ""));
  let bonus = 0;
  // Soul of the Forge (Forge 6, XGE): +1 AC in heavy armor.
  if (heavy && subclassLevel("forge") >= 6) bonus += 1;
  // Bladesong (TCE): +INT (min 1) in light or no armor and no shield.
  if (character.bladesong && light && !shield) bonus += Math.max(1, mod("int"));
  // Resilient Hide (Lycan hybrid form): +1 AC without heavy armor.
  if (character.hybrid && !heavy) bonus += 1;
  if (hasEffect("Agile Parry")) bonus += 2;
  // Durable Magic (War Magic 10): +2 AC while concentrating.
  if (subclassLevel("war-magic") >= 10 && character.concentration) bonus += 2;
  return bonus;
}

function featureSaveBonus() {
  // Soul of Artifice (artificer 20): +1 per attuned magic item.
  const attuned = classLevel("artificer") >= 20 ? (character.equipment || []).filter(item => item.attuned).length : 0;
  return attuned + (subclassLevel("war-magic") >= 10 && character.concentration ? 2 : 0);
}

function featureSpeedBonus(notes) {
  let bonus = 0;
  if (character.bladesong) {
    bonus += 10;
    notes.push("+10 ft Bladesong");
  }
  if (subclassLevel("lycan") >= 7) {
    bonus += 10;
    notes.push("+10 ft Stalker's Prowess");
  }
  return bonus;
}

// Bladesong adds INT (min 1) to Constitution saves to keep concentration.
function concentrationFeatureBonus() {
  return character.bladesong ? Math.max(1, mod("int")) : 0;
}

// Flash of Genius (artificer 7): a reaction adds INT to a check or save.
function withFlashOfGenius(actions, kind) {
  const flash = character.resources.find(item => item.name === "Flash of Genius");
  if (!flash || !["save", "check"].includes(kind)) return actions;
  return result => {
    const own = typeof actions === "function" ? actions(result) : actions || [];
    if (Number(flash.current) < 1) return own;
    const bonus = Math.max(1, mod("int"));
    return [...own, { label: `Flash of Genius +${bonus} (${result.total + bonus})`, run: () => { const paid = spendFeatureResource("Flash of Genius"); if (paid) showToast(`<span class="toast-label">Flash of Genius: ${result.total + bonus}</span><span>${escapeHtml(paid.status)}</span>`, { actions: [{ label: "Undo", run: paid.refund }] }); } }];
  };
}

// Option picks (classChoices) that act at the table: elemental disciplines, blood curses, arcane shots and runes.
function classChoiceActions(add, prof) {
  const pick = (key, list = CLASS_OPTIONS[key] || []) => classChoiceNames(key).map(name => list.find(item => item.name === name)).filter(Boolean);
  pick("disciplines", CLASS_OPTIONS.elementalDisciplines).filter(item => item.ki).forEach(item => add(`discipline-${slug(item.name)}`, {
    name: item.name, type: "Action", notes: `${item.ki} ki.${item.spell ? ` Casts ${item.spell.replace(/-/g, " ")}.` : ""}`, use: { cost: ["Ki Points", item.ki], kind: "note", text: item.summary }
  }));
  const curseDc = hemocraftDc(prof);
  pick("bloodMaledicts").forEach(item => add(`curse-${slug(item.name)}`, {
    name: item.name, type: /reaction/.test(item.action || "") ? "Reaction" : "Bonus Action", notes: `${item.save ? `${item.save.toUpperCase()} save DC ${curseDc}. ` : ""}${item.summary}`,
    use: { cost: ["Blood Maledict", 1], kind: "maledict", text: `${item.summary}${item.amplify ? ` Amplified: ${item.amplify}` : ""}` }
  }));
  const arrowDc = 8 + prof + mod("int");
  pick("arcaneShots").forEach(item => add(`arcane-shot-${slug(item.name)}`, {
    name: item.name, type: "Free", notes: `On a magic arrow hit.${item.save ? ` ${item.save.toUpperCase()} save DC ${arrowDc}.` : ""}`, use: { cost: ["Arcane Shot", 1], kind: "note", text: item.summary }
  }));
  const runeDc = 8 + prof + mod("con");
  pick("runes").forEach(item => add(`rune-${slug(item.name)}`, {
    name: item.name, type: "Free", notes: `Invoke it.${item.save ? ` ${item.save.toUpperCase()} save DC ${runeDc}.` : ""}`, use: { cost: [character.resources.some(res => res.name === item.name) ? item.name : "Rune Invocations", 1], kind: "note", text: item.summary }
  }));
}

// Subclass features that act at the table, from SUBCLASS_FEATURES. Rows spend meta.cost or the tracker of the same
// name; FEATURE_ACTION_OVERRIDES turns the ones with numbers into rolls and buttons.
const FEATURE_TYPES = { action: "Action", bonus: "Bonus Action", reaction: "Reaction" };

function subclassFeatureActions({ level, subclass, add, prof }) {
  (SUBCLASS_FEATURES[subclass]?.features || []).forEach(([gain, name, summary, meta = {}]) => {
    if (gain > level || !(FEATURE_TYPES[meta.action] || meta.cost)) return;
    const tracker = character.resources.find(item => item.name === name || item.name.startsWith(`${name} (`));
    const fields = {
      name, type: FEATURE_TYPES[meta.action] || "Free", notes: summary,
      use: { cost: meta.cost ? [meta.cost, 1] : tracker ? [tracker.name, 1] : null, kind: "note", text: summary }
    };
    const override = FEATURE_ACTION_OVERRIDES[`${subclass}:${name}`]?.({ level, prof, fields });
    const use = { ...fields.use, ...override?.use };
    // Archdruid (20): anything that spends Wild Shape is free.
    if (use.cost?.[0] === "Wild Shape" && classLevel("druid") >= 20) use.cost = null;
    add(`${subclass}-${slug(name)}`, { ...fields, ...override, use });
  });
}

const featureDc = (prof, ability) => 8 + prof + mod(ability);
const FEATURE_ACTION_OVERRIDES = {
  "lore:Cutting Words": () => ({ use: { kind: "roll", roll: `1d${resourceDie("Bardic Inspiration") || 6}`, text: "Subtract this from the creature's attack roll, ability check or damage roll." } }),
  "lore:Peerless Skill": () => ({ use: { kind: "roll", roll: `1d${resourceDie("Bardic Inspiration") || 6}`, text: "Add this to your own ability check." } }),
  "life:Channel Divinity: Preserve Life": ({ level }) => ({ notes: `Restore ${5 * level} HP split among creatures within 30 ft, none above half its max.`, use: { kind: "preserveLife", amount: 5 * level, text: `Up to ${5 * level} HP in total; nobody goes above half their HP maximum. Undead and constructs can't benefit.` } }),
  "light:Channel Divinity: Radiance of the Dawn": ({ level, prof }) => ({ notes: `CON save DC ${featureDc(prof, "wis")}, 2d10+${level} radiant (half on a save).`, use: { kind: "roll", roll: `2d10+${level}`, text: `Hostile creatures within 30 ft: CON save DC ${featureDc(prof, "wis")}, half on a success. Also dispels magical darkness there.` } }),
  "tempest:Wrath of the Storm": ({ prof }) => ({ use: { kind: "roll", roll: "2d8", text: `Lightning or thunder; DEX save DC ${featureDc(prof, "wis")} for half.` } }),
  "death:Channel Divinity: Touch of Death": ({ level }) => ({ notes: `After a melee hit: +${5 + 2 * level} necrotic.`, use: { text: `Add ${5 + 2 * level} necrotic damage to the hit.` } }),
  "war:Channel Divinity: Guided Strike": () => ({ use: { text: "+10 to your attack roll, after you see the roll but before the outcome." } }),
  "twilight:Channel Divinity: Twilight Sanctuary": ({ level }) => ({ notes: `1 minute, 30 ft: 1d6+${level} temp HP or end charmed/frightened at the end of a turn.`, use: { kind: "give", temp: true, roll: `1d6+${level}`, text: "A creature that ends its turn in the sphere gains this many temp HP (or ends one charmed or frightened effect). Roll again each time." } }),
  "peace:Channel Divinity: Balm of Peace": ({ prof }) => ({ notes: `Move; each creature you pass within 5 ft regains 2d6${formatMod(mod("wis"))} HP (at least 1).`, use: { kind: "give", heal: true, min: 1, roll: `2d6${formatMod(mod("wis"))}`, text: "Roll for each creature you choose. Your movement doesn't provoke opportunity attacks." } }),
  "moon:Combat Wild Shape": () => ({ name: "Combat Wild Shape (heal)", notes: "While transformed: spend a slot, regain 1d8 HP per slot level.", use: { kind: "slotHeal", cost: null } }),
  "moon:Elemental Wild Shape": () => ({ notes: "Spend two Wild Shape uses to become an elemental.", use: { kind: "wildshape", cost: ["Wild Shape", 2], form: "Elemental form" } }),
  "stars:Starry Form": ({ level }) => ({ notes: `${starryForm() ? `${starryForm()} active. ` : ""}10 minutes. Archer: bonus-action ranged spell attack, ${level >= 10 ? 2 : 1}d8${formatMod(mod("wis"))} radiant. Chalice: a slot heal also heals ${level >= 10 ? 2 : 1}d8${formatMod(mod("wis"))}. Dragon: 9 or lower counts as 10 on INT/WIS checks and concentration saves.`, use: { cost: ["Wild Shape", 1], kind: "starry" } }),
  "dreams:Balm of the Summer Court": ({ level }) => ({ use: { kind: "pool", cost: null, pool: "Balm of the Summer Court (d6)", die: 6, maxDice: Math.max(1, Math.floor(level / 2)), heal: true, temp: true, tempPerDie: true, text: "The ally regains the total and gains 1 temp HP per die." } }),
  "shepherd:Spirit Totem": ({ level }) => ({ notes: `Bear: ${5 + level} temp HP to chosen creatures. Unicorn: +${level} HP to each when you heal with a slot. Hawk: reaction advantage.`, use: { kind: "give", temp: true, amount: 5 + level, text: `Bear spirit: each creature you choose in the aura gains ${5 + level} temp HP. Unicorn: when you heal with a spell slot, each creature you choose in the aura also regains ${level} HP.` } }),
  "spores:Halo of Spores": ({ level, prof }) => {
    const die = level >= 14 ? 10 : level >= 10 ? 8 : level >= 6 ? 6 : 4;
    return { notes: `CON save DC ${featureDc(prof, "wis")} or 1d${die} necrotic (twice with Symbiotic Entity).`, use: { kind: "roll", roll: `${character.symbiotic ? 2 : 1}d${die}`, text: `Necrotic damage unless it makes a CON save, DC ${featureDc(prof, "wis")}.` } };
  },
  "spores:Symbiotic Entity": ({ level }) => ({ notes: `${4 * level} temp HP; Halo dice doubled; +1d6 necrotic on melee weapon hits.`, use: { kind: "symbiotic", cost: ["Wild Shape", 1] } }),
  "wildfire:Summon Wildfire Spirit": ({ level, prof }) => ({ notes: `Spirit HP ${5 + 5 * level}, AC 13. Arrival: DEX save DC ${featureDc(prof, "wis")} or 2d6 fire within 10 ft.`, use: { kind: "roll", cost: ["Wild Shape", 1], roll: "2d6", text: `Fire damage to each creature within 10 ft of the spirit that fails a DEX save (DC ${featureDc(prof, "wis")}). The spirit has ${5 + 5 * level} HP and lasts 1 hour.` } }),
  "wildfire:Cauterizing Flames": () => ({ use: { kind: "give", heal: true, roll: `2d10${formatMod(mod("wis"))}`, text: "Heal the creature in the flame's space, or deal this much fire damage to it instead." } }),
  "alchemist:Experimental Elixir": () => ({ use: { kind: "roll", roll: "1d6", text: `1 healing (2d4${formatMod(Math.max(1, mod("int")))}), 2 swiftness (+10 ft speed, 1 hour), 3 resilience (+1 AC, 10 min), 4 boldness (+1d4 attacks and saves, 1 min), 5 flight (10 ft, 10 min), 6 alter self (10 min).${subclassLevel("alchemist") >= 9 ? ` Restorative Reagents: the drinker also gains 2d6${formatMod(Math.max(1, mod("int")))} temp HP.` : ""}` } }),
  "armorer:Armor Model": ({ level }) => ({ name: "Defensive Field", notes: `Guardian model: gain ${level} temp HP.`, use: { kind: "give", temp: true, allies: false, amount: level, cost: ["Defensive Field (Guardian)", 1], text: "Guardian model only, while your armor is on. Temp HP last until a long rest." } }),
  "armorer:Perfected Armor": () => ({ use: { cost: ["Perfected Armor (Guardian)", 1] } }),
  "artillerist:Eldritch Cannon": () => ({ notes: `Flamethrower or Force Ballista 2d8${subclassLevel("artillerist") >= 9 ? "+1d8" : ""}; Protector 1d8${formatMod(Math.max(1, mod("int")))} temp HP within 10 ft.`, use: { kind: "give", temp: true, roll: `1d8${formatMod(Math.max(1, mod("int")))}`, text: "Protector cannon: it and each creature you choose within 10 ft gain this many temp HP. (Other cannons: roll their 2d8 from the dice tray.)" } }),
  "battle-smith:Steel Defender": ({ prof }) => ({ name: "Steel Defender: Repair", notes: `Repair restores 2d8+${prof} HP to a construct or object, 3 times a day.`, use: { kind: "roll", cost: ["Steel Defender Repair", 1], roll: `2d8+${prof}`, text: "HP restored to your defender or another construct or object." } }),
  "celestial:Healing Light": ({ level }) => ({ use: { kind: "pool", cost: null, pool: "Healing Light (d6 pool)", die: 6, maxDice: Math.max(1, mod("cha")), heal: true, text: "One creature within 60 ft regains the total." } }),
  "undead:Form of Dread": ({ level, prof }) => ({ notes: `1 minute: 1d10+${level} temp HP, immune to frightened; once per turn a hit forces a WIS save (DC ${featureDc(prof, "cha")}) or frightened.`, use: { kind: "give", temp: true, allies: false, roll: `1d10+${level}`, text: "Temp HP from Form of Dread." } }),
  "fathomless:Tentacle of the Deeps": ({ level, prof }) => ({ attack: formatMod(prof + mod("cha")), damage: `${level >= 10 ? 2 : 1}d8 cold`, notes: "Bonus action: summon or move the tentacle; it attacks for cold damage and reduces speed by 10 ft." }),
  "fathomless:Guardian Coil": ({ level }) => ({ use: { kind: "roll", cost: null, roll: `${level >= 10 ? 2 : 1}d8`, text: "Reduce the damage to a creature within 10 ft of the tentacle by this much." } }),
  "wild-magic:Bend Luck": () => ({ use: { kind: "roll", cost: ["Sorcery Points", 2], roll: "1d4", text: "Add or subtract this from the creature's attack roll, ability check or saving throw." } }),
  "shadow-magic:Hound of Ill Omen": () => ({ use: { cost: ["Sorcery Points", 3] } }),
  "aberrant-mind:Revelation in Flesh": () => ({ use: { kind: "points", resource: "Sorcery Points", most: 4, unit: "SP", text: "One benefit per point, for 10 minutes.", each: count => `${count} benefit${count === 1 ? "" : "s"} for 10 minutes: see invisible within 60 ft, fly at walking speed (hover), swim at twice walking speed and breathe water, or squeeze through 1-inch gaps and spend 5 ft of movement to escape a grapple or nonmagical restraints.` } }),
  "clockwork-soul:Bastion of Law": () => ({ use: { kind: "points", resource: "Sorcery Points", most: 5, unit: "SP", text: "Ward yourself or a creature within 30 ft with that many d8s.", each: count => `The ward holds ${count}d8. When the warded creature takes damage it rolls any number of them and reduces the damage by the total. It lasts until a long rest or until you ward again.` } }),
  "storm-sorcery:Storm's Fury": ({ level, prof }) => ({ notes: `When hit in melee: ${level} lightning to the attacker, STR save DC ${featureDc(prof, "cha")} or pushed 20 ft.` }),
  "bladesinging:Bladesong": () => ({ use: { kind: "toggle", flag: "bladesong", text: `1 minute: +${Math.max(1, mod("int"))} AC, +10 ft speed, advantage on Acrobatics, +${Math.max(1, mod("int"))} to concentration saves. Ends in medium or heavy armor, with a shield, or attacking with two hands.` } }),
  "lycan:Hybrid Transformation": ({ level }) => ({ use: { kind: "toggle", flag: "hybrid", cost: level >= 18 ? null : ["Hybrid Transformation", 1], text: `Up to 1 hour: +1 AC without heavy armor, resistance to nonmagical unsilvered bludgeoning, piercing and slashing, advantage on STR checks and saves, +${level >= 18 ? 3 : level >= 11 ? 2 : 1} melee damage. Bloodlust: below half HP at the start of your turn, DC 8 WIS save.` } }),
  "mutant:Mutagencraft": () => ({ name: "Drink a mutagen", use: { cost: ["Mutagens", 1] } }),
  "abjuration:Projected Ward": () => ({ notes: "When a creature you can see within 30 ft takes damage, your Arcane Ward absorbs it instead." }),
  "war-magic:Arcane Deflection": () => ({ notes: "When hit or failing a save: +2 AC against the attack or +4 to the save. Then only cantrips until the end of your next turn." }),
  // A timed effect: hexbladeCurseActive() adds the damage and the 19-20 crit while it lasts.
  "hexblade:Hexblade's Curse": ({ prof }) => ({ notes: `Curse a creature within 30 ft for 1 minute: +${prof} damage against it, crits on 19-20, heal when it dies.`, use: { cost: ["Hexblade's Curse", 1], kind: "effect", effect: "Hexblade's Curse", rounds: 10, text: "Cursed. Use the Round bar to record the target dying (you heal)." } })
};

function wardAndPortentRows({ level, subclass, add }) {
  if (subclass === "abjuration" && level >= 2) add("arcane-ward", { name: "Arcane Ward", type: "Free", notes: `Ward HP ${arcaneWardMax()}. Damage hits the ward first.`, use: { kind: "ward", cost: ["Arcane Ward", 1] } });
  if (subclass === "divination" && level >= 2) add("portent", { name: "Portent", type: "Free", notes: `${(character.portentDice || []).join(", ") || "No dice left"}. Replace a roll you can see.`, use: { kind: "portent" } });
}

// The 2024 Armorer (Eberron: Forge of the Artificer) adds the Dreadnaught model; the 2014 (Tasha's) one doesn't have it.
function armorer2024() {
  return classEntries().some(entry => entry.classId === "artificer" && entry.rules === "2024" && subclassIndexFor(entry) === "armorer");
}

Object.assign(CLASS_FEATURE_ACTIONS, {
  artificer({ level, subclass, add, prof }) {
    const int = Math.max(1, mod("int"));
    if (level >= 7) add("flash-of-genius", { name: "Flash of Genius", type: "Reaction", notes: `+${int} to a check or save made by you or a creature within 30 ft.`, use: { cost: ["Flash of Genius", 1], kind: "note", text: `Add ${int} to the ability check or saving throw.` } });
    if (level >= 11) add("spell-storing-item", { name: "Spell-Storing Item", type: "Action", notes: `The holder casts the stored 1st- or 2nd-level spell (DC ${8 + prof + mod("int")}).`, use: { cost: ["Spell-Storing Item", 1], kind: "note", text: `The stored spell takes effect, using your spellcasting modifier (DC ${8 + prof + mod("int")}, +${prof + mod("int")} to hit).` } });
    if (subclass === "armorer" && level >= 3) {
      add("thunder-gauntlets", { name: "Thunder Gauntlets (Guardian)", type: "Action", attack: formatMod(prof + mod("int")), damage: `1d8${formatMod(mod("int"))} thunder`, notes: "Guardian model. A creature you hit has disadvantage on attacks against others until your next turn." });
      if (armorer2024()) {
        add("armor-flail", { name: "Armor Flail (Dreadnaught)", type: "Action", attack: formatMod(prof + mod("int")), damage: `1d10${formatMod(mod("int"))} bludgeoning`, notes: "Dreadnaught model. Wrecking Ball: on a hit against a creature at least one size smaller than you, push it up to 10 ft away or pull it up to 10 ft toward you." });
        add("giant-stature", { name: "Giant Stature (Dreadnaught)", type: "Bonus Action", notes: "1 minute: reach +5 ft, and you and your gear become Large if you're smaller and there's room.", use: { cost: ["Giant Stature (Dreadnaught)", 1], kind: "note", text: "For 1 minute your reach increases by 5 feet, and if you're smaller than Large you become Large along with what you wear, provided there's room." } });
      }
      add("lightning-launcher", { name: "Lightning Launcher (Infiltrator)", type: "Action", attack: formatMod(prof + mod("int")), damage: `1d6${formatMod(mod("int"))} lightning`, notes: "Infiltrator model, 90/300 ft. Once per turn +1d6 lightning on a hit." });
    }
    if (subclass === "battle-smith" && level >= 9) add("arcane-jolt", { name: "Arcane Jolt", type: "Free", notes: `Once per turn on a magic weapon or defender hit: ${level >= 15 ? 4 : 2}d6 force, or heal that much to a creature within 30 ft.`, use: { cost: ["Arcane Jolt", 1], kind: "give", heal: true, roll: `${level >= 15 ? 4 : 2}d6`, text: "Force damage to the target, or healing for a creature within 30 ft of it." } });
    if (subclass === "alchemist" && level >= 9) add("restorative-reagents", { name: "Lesser Restoration (Reagents)", type: "Action", notes: "Cast lesser restoration without a slot.", use: { cost: ["Restorative Reagents", 1], kind: "note", text: "Lesser restoration, no slot needed (alchemist's supplies as the focus)." } });
    if (subclass === "artillerist" && level >= 5) add("arcane-firearm", { name: "Arcane Firearm", type: "Free", notes: "+1d8 to one damage roll of an artificer spell cast through it.", use: { kind: "roll", roll: "1d8", text: "Add this to one damage roll of the spell." } });
    subclassFeatureActions({ level, subclass, add, prof });
  },
  bard({ level, subclass, add, prof }) {
    const die = resourceDie("Bardic Inspiration") || 6;
    add("bardic-inspiration", { name: "Bardic Inspiration", type: "Bonus Action", notes: `Give a creature other than you a d${die} for 10 minutes.`, use: { cost: ["Bardic Inspiration", 1], kind: "inspire" } });
    if (level >= 2) {
      const rest = level >= 17 ? 12 : level >= 13 ? 10 : level >= 9 ? 8 : 6;
      add("song-of-rest", { name: "Song of Rest", type: "Free", notes: `During a short rest, allies who spend hit dice regain an extra 1d${rest}.`, use: { kind: "songOfRest" } });
    }
    if (level >= 6) add("countercharm", { name: "Countercharm", type: "Action", notes: "Until the end of your next turn, you and friends within 30 ft have advantage on saves against charmed and frightened.", use: { kind: "note", text: "Advantage on saves against being charmed or frightened for you and friends within 30 ft who hear you." } });
    subclassFeatureActions({ level, subclass, add, prof });
  },
  cleric({ level, subclass, add, prof }) {
    const save = featureDc(prof, "wis");
    if (level >= 2) {
      const destroy = [[17, "4"], [14, "3"], [11, "2"], [8, "1"], [5, "1/2"]].find(([gate]) => level >= gate)?.[1];
      add("turn-undead", { name: "Turn Undead", type: "Action", notes: `WIS save DC ${save}.${destroy ? ` Destroys CR ${destroy} or lower.` : ""}`, use: { cost: ["Channel Divinity", 1], kind: "note", text: `Each undead within 30 ft that can see or hear you makes a WIS save, DC ${save}, or is turned for 1 minute (until it takes damage).${destroy ? ` Undead of CR ${destroy} or lower that fail are destroyed.` : ""}` } });
      if (optionalRule("tashas")) add("harness-divine-power", { name: "Harness Divine Power", type: "Bonus Action", notes: `Spend a Channel Divinity use to regain a slot up to ${ordinal(Math.ceil(prof / 2))} level.`, use: { cost: ["Harness Divine Power", 1], kind: "harness" } });
    }
    if (level >= 10) add("divine-intervention", { name: "Divine Intervention", type: "Action", notes: level >= 20 ? "Succeeds automatically." : `Roll d100: ${level} or lower succeeds.`, use: { kind: "divine" } });
    subclassFeatureActions({ level, subclass, add, prof });
  },
  druid({ level, subclass, add, prof }) {
    if (level < 2) return;
    // Archdruid (20): unlimited Wild Shape.
    add("wild-shape", { name: "Wild Shape", type: subclass === "moon" ? "Bonus Action" : "Action", notes: "Become a beast. Its HP absorb damage first.", use: { cost: level >= 20 ? null : ["Wild Shape", 1], kind: "wildshape" } });
    if (optionalRule("tashas")) add("wild-companion", { name: "Wild Companion", type: "Action", notes: "Spend a Wild Shape use to cast find familiar (a fey).", use: { cost: level >= 20 ? null : ["Wild Shape", 1], kind: "note", text: `Find familiar without material components; the fey familiar lasts ${Math.floor(level / 2)} hours.` } });
    subclassFeatureActions({ level, subclass, add, prof });
    if (starryForm() === "Archer") add("starry-archer", { name: "Starry Form: Archer", type: "Bonus Action", attack: formatMod(spellStats("wis", "druid").attack), damage: `${level >= 10 ? 2 : 1}d8${formatMod(mod("wis"))} radiant`, notes: "Ranged spell attack against a creature within 60 ft." });
  },
  sorcerer({ level, subclass, add, prof }) {
    if (level >= 2) add("flexible-casting", { name: "Flexible Casting", type: "Bonus Action", notes: "Turn sorcery points into a spell slot, or a slot into points.", use: { kind: "flexible" } });
    if (level >= 3) add("metamagic", { name: "Metamagic", type: "Free", notes: "Spend sorcery points to change a spell as you cast it.", use: { kind: "metamagic" } });
    if (subclass === "wild-magic") {
      add("wild-magic-surge", { name: "Wild Magic Surge check", type: "Free", notes: "After a 1st-level or higher sorcerer spell: roll a d20; on a 1, roll d100.", use: { kind: "surge" } });
      add("tides-of-chaos", { name: "Tides of Chaos", type: "Free", notes: "Advantage on one attack, check or save.", use: { cost: ["Tides of Chaos", 1], kind: "note", text: "Roll this attack, check or save with advantage. It comes back on a long rest or when you roll on the surge table." } });
    }
    if (subclass === "draconic" && level >= 6) {
      const type = (CLASS_OPTIONS.draconicAncestry || []).find(item => classChoiceNames("draconicAncestry").some(name => name.toLowerCase().includes(item.dragon.toLowerCase())))?.damage || "your ancestry's type";
      add("elemental-affinity", { name: "Elemental Affinity", type: "Free", notes: `+${mod("cha")} to one damage roll of a spell dealing ${type} damage. 1 SP: resistance to ${type} for 1 hour.`, use: { cost: ["Sorcery Points", 1], kind: "note", text: `Resistance to ${type} damage for 1 hour.` } });
    }
    if (subclass === "shadow-magic" && level >= 3) add("eyes-of-the-dark", { name: "Darkness (Eyes of the Dark)", type: "Action", notes: "Cast darkness for 2 sorcery points; you can see through it.", use: { cost: ["Sorcery Points", 2], kind: "note", text: "Darkness without a slot; you see through it." } });
    if (subclass === "storm-sorcery" && level >= 6) add("heart-of-the-storm", { name: "Heart of the Storm", type: "Free", notes: `On a 1st+ level lightning or thunder spell: ${Math.floor(level / 2)} lightning or thunder to chosen creatures within 10 ft.`, use: { kind: "note", text: `Creatures you choose within 10 ft take ${Math.floor(level / 2)} lightning or thunder damage.` } });
    subclassFeatureActions({ level, subclass, add, prof });
  },
  warlock({ level, subclass, add, prof }) {
    if (subclass === "hexblade") add("hex-warrior", { name: "Hex Warrior", type: "Free", notes: "Bind one weapon after a long rest: it uses Charisma. Your pact weapon (the Pact weapon pick in Class choices) always does.", use: { kind: "hexwarrior" } });
    if (level >= 20) add("eldritch-master", { name: "Eldritch Master", type: "Free", notes: "Spend 1 minute to regain all expended pact slots.", use: { cost: ["Eldritch Master", 1], kind: "eldritchMaster" } });
    if (level >= 5 && hasInvocation("Eldritch Smite")) add("eldritch-smite", { name: "Eldritch Smite", type: "Free", notes: "On a pact weapon hit: spend a pact slot for force damage and knock prone.", use: { kind: "eldritchSmite" } });
    const blast = [
      hasInvocation("Eldritch Spear") && "range 300 ft",
      hasInvocation("Repelling Blast") && "push 10 ft per beam hit",
      hasInvocation("Grasp of Hadar") && "once per turn pull 10 ft",
      hasInvocation("Lance of Lethargy") && "once per turn -10 ft speed",
      hasInvocation("Agonizing Blast") && `+${mod("cha")} damage per beam`
    ].filter(Boolean);
    if (blast.length) add("eldritch-blast-invocations", { name: "Eldritch Blast invocations", type: "Free", notes: blast.join("; "), use: { kind: "note", text: `On eldritch blast: ${blast.join("; ")}.` } });
    if (subclass === "fiend") add("dark-ones-blessing", { name: "Dark One's Blessing", type: "Free", notes: `When you drop a hostile creature to 0 HP: ${Math.max(1, mod("cha") + level)} temp HP.`, use: { kind: "give", temp: true, allies: false, amount: Math.max(1, mod("cha") + level), text: "You reduced a hostile creature to 0 HP." } });
    if (subclass === "fiend" && level >= 6) add("dark-ones-own-luck", { name: "Dark One's Own Luck", type: "Free", notes: "+1d10 to an ability check or save, after seeing the roll.", use: { cost: ["Dark One's Own Luck", 1], kind: "roll", roll: "1d10", text: "Add this to your ability check or saving throw." } });
    if (subclass === "fiend" && level >= 14) add("hurl-through-hell", { name: "Hurl Through Hell", type: "Free", notes: "On a hit: the target vanishes until the end of your next turn, then takes 10d10 psychic unless it's a fiend.", use: { cost: ["Hurl Through Hell", 1], kind: "roll", roll: "10d10", text: "Psychic damage when it returns (none if it's a fiend)." } });
    if (subclass === "celestial" && level >= 6) add("radiant-soul", { name: "Radiant Soul", type: "Free", notes: `+${mod("cha")} to one radiant or fire damage roll of a spell you cast.`, use: { kind: "note", text: `Add ${mod("cha")} to one radiant or fire damage roll against one target.` } });
    if (subclass === "celestial" && level >= 10) add("celestial-resilience", { name: "Celestial Resilience", type: "Free", notes: `After a rest: ${level + mod("cha")} temp HP for you, ${Math.floor(level / 2) + mod("cha")} for up to five others.`, use: { kind: "give", temp: true, allies: false, amount: level + mod("cha"), text: `Up to five creatures you can see each gain ${Math.floor(level / 2) + mod("cha")} temp HP.` } });
    subclassFeatureActions({ level, subclass, add, prof });
  },
  wizard({ level, subclass, add, prof }) {
    wardAndPortentRows({ level, subclass, add });
    if (subclass === "necromancy" && level >= 2) add("grim-harvest", { name: "Grim Harvest", type: "Free", notes: "Kill with a spell: regain twice its level in HP (three times for necromancy).", use: { kind: "grim" } });
    if (subclass === "evocation" && level >= 2) add("sculpt-spells", { name: "Sculpt Spells", type: "Free", notes: "Evocation spell: 1 + spell level creatures you choose auto-succeed and take no damage on a half-damage save.", use: { kind: "note", text: "Pick 1 + the spell's level creatures: they succeed on the save and take no damage if they'd take half." } });
    if (subclass === "evocation" && level >= 10) add("empowered-evocation", { name: "Empowered Evocation", type: "Free", notes: `+${mod("int")} to one damage roll of a wizard evocation spell.`, use: { kind: "note", text: `Add ${mod("int")} to one damage roll of the evocation spell.` } });
    if (subclass === "war-magic" && level >= 6) add("power-surge", { name: "Power Surge", type: "Free", notes: `Once per turn, +${Math.floor(level / 2)} force to one target of a wizard spell.`, use: { cost: ["Power Surge", 1], kind: "note", text: `Add ${Math.floor(level / 2)} force damage to one creature or object the spell damages. Gain a surge when you end a spell with counterspell or dispel magic.` } });
    subclassFeatureActions({ level, subclass, add, prof });
  },
  bloodhunter({ level, subclass, add, prof }) {
    const die = hemocraftDie(level);
    const dcInt = hemocraftDc(prof);
    const hemo = Math.max(1, mod(hemocraftAbility()));
    add("blood-maledict", { name: "Blood Maledict", type: "Bonus Action", notes: `Hemocraft DC ${dcInt}, hemocraft die d${die}. Amplify by taking 1d${die} necrotic.`, use: { cost: ["Blood Maledict", 1], kind: "maledict", text: `Invoke a blood curse (save DC ${dcInt}).` } });
    if (level >= 2) add("crimson-rite", { name: "Crimson Rite", type: "Bonus Action", notes: `Take 1d${die} necrotic; the weapon deals +1d${die} of the rite's type until you rest.`, use: { kind: "rite" } });
    if (level >= 6) add("brand-of-castigation", { name: "Brand of Castigation", type: "Free", notes: `On a rite weapon hit: the target takes ${level >= 13 ? 2 * hemo : hemo} psychic each time it damages you or a creature within 5 ft of you.${level >= 13 ? " Tethering: it can't Dash; teleporting or leaving the plane costs 4d6 psychic and a WIS save." : ""}`, use: { cost: ["Brand of Castigation", 1], kind: "note", text: "The brand lasts until you dismiss it or brand another creature." } });
    if (subclass === "lycan" && level >= 3) {
      const strike = { attack: formatMod(prof + Math.max(mod("str"), mod("dex")) + (level >= 18 ? 3 : level >= 11 ? 2 : level >= 7 ? 1 : 0)), damage: `1d${level >= 11 ? 8 : 6}${formatMod(Math.max(mod("str"), mod("dex")))} slashing` };
      add("predatory-strikes", { name: "Predatory Strikes (hybrid)", type: "Action", ...strike, notes: "Unarmed strike in hybrid form; one more as a bonus action after the Attack action." });
    }
    subclassFeatureActions({ level, subclass, add, prof });
  }
});

function knownManeuvers() {
  return classChoiceNames("maneuvers").filter(name => CLASS_OPTIONS.maneuvers.some(item => item.name === name))
    .concat(CLASS_OPTIONS.maneuvers.map(item => item.name).filter(name => choiceWritten(name)))
    .filter((name, index, list) => list.indexOf(name) === index);
}

// Maneuvers known: Battle Master 3/5/7/9 (PHB p.73), Superior Technique 1 (TCE p.41), Martial Adept 2 (PHB p.168).
function maneuverSlots() {
  const level = subclassLevel("battle-master");
  const known = Object.entries(CLASS_OPTIONS.progressions.maneuversKnown).filter(([at]) => level >= Number(at)).map(([, count]) => count).pop() || 0;
  return known + (hasStyle("Superior Technique") ? 1 : 0) + (hasFeat("Martial Adept") ? 2 : 0);
}

function superiorityDiceBonus() {
  return (hasStyle("Superior Technique") ? 1 : 0) + (hasFeat("Martial Adept") ? 1 : 0);
}

// Trackers that come from feats, species and fighting styles rather than a class table.
function combatTrackers() {
  return [
    // Relentless Endurance (PHB p.41): once per long rest.
    /half-orc/i.test(character.species || "") ? { name: "Relentless Endurance", max: 1, reset: "long" } : null
  ].filter(Boolean);
}

// Primal Champion (PHB p.49): +4 STR and CON (maximum 24) once the barbarian reaches 20th level.
function applyPrimalChampion() {
  if (classLevel("barbarian") < 20 || character.primalChampion) return;
  const conBefore = mod("con");
  ["str", "con"].forEach(id => { character.abilities[id] = Math.min(24, Number(character.abilities[id] || 10) + 4); });
  const change = (mod("con") - conBefore) * totalLevel();
  character.maxHp = Number(character.maxHp || 0) + change;
  character.hp = Number(character.hp || 0) + change;
  character.primalChampion = true;
  persist();
  showToast(`<span class="toast-label">Primal Champion</span><span>Strength and Constitution +4 (maximum 24)${change ? `, max HP ${formatMod(change)}` : ""}.</span>`, { tone: "crit" });
}

// Rows from fighting styles, feats and subclass features that aren't tied to one class's own table.
function combatFeatureActions(add, prof) {
  const str = mod("str");
  const worn = wornItems();
  const holdsWeapon = worn.some(item => /\bweapon\b/i.test(item.notes || "") && /\d+d\d+/.test(item.notes || ""));
  if (!classLevel("monk")) {
    // Unarmed strike (PHB p.195): proficient, 1 + STR bludgeoning; Tavern Brawler, Dragon Hide and Unarmed Fighting raise the die.
    const unarmedDie = hasStyle("Unarmed Fighting") ? (holdsWeapon || wearingShield() ? "1d6" : "1d8") : hasFeat("Tavern Brawler") || hasFeat("Dragon Hide") ? "1d4" : "";
    const damage = unarmedDie ? `${unarmedDie}${formatMod(str)}` : String(Math.max(0, 1 + str));
    add("unarmed-strike", { name: "Unarmed Strike", type: "Action", attack: formatMod(prof + str), damage: `${damage} ${hasFeat("Dragon Hide") && !hasStyle("Unarmed Fighting") ? "slashing" : "bludgeoning"}`, notes: "Punch, kick or headbutt.", source: { ability: "str" } });
  }
  if (hasFeat("Tavern Brawler")) add("improvised", { name: "Improvised Weapon", type: "Action", attack: formatMod(prof + str), damage: `1d4${formatMod(str)}`, notes: "Tavern Brawler: proficient. After a hit with this or an unarmed strike, you can try to grapple as a bonus action.", source: { ability: "str" } });
  if (hasStyle("Unarmed Fighting")) add("unarmed-fighting-grapple", { name: "Unarmed Fighting: grappled creature", type: "Free", notes: "At the start of your turn, a creature you're grappling takes 1d4 bludgeoning.", use: { kind: "roll", roll: "1d4", text: "Bludgeoning damage to the creature you're grappling." } });
  if (hasStyle("Protection") && wearingShield()) add("protection", { name: "Protection", type: "Reaction", notes: "With a shield: impose disadvantage on an attack against a creature within 5 ft of you.", use: { kind: "note", text: "The attack against your ally has disadvantage." } });
  if (hasStyle("Interception") && (wearingShield() || holdsWeapon)) add("interception", { name: "Interception", type: "Reaction", notes: `Reduce damage to a creature within 5 ft of you by 1d10+${prof}.`, use: { kind: "roll", roll: `1d10+${prof}`, text: "Reduce the damage your ally takes by this much (to a minimum of 0)." } });
  if (allClassTrackers().some(tracker => tracker.name === "Superiority Dice")) {
    const dc = 8 + prof + Math.max(str, mod("dex"));
    add("superiority", { name: "Superiority Die", type: "Free", notes: `Maneuver save DC ${dc}.${knownManeuvers().length ? ` Known: ${knownManeuvers().join(", ")}.` : ""}`, use: { kind: "superiority", text: `Maneuver save DC ${dc}.` } });
  }
  if (hasFeat("Defensive Duelist")) add("defensive-duelist", { name: "Defensive Duelist", type: "Reaction", notes: `+${prof} AC against one melee hit while wielding a finesse weapon you're proficient with.`, use: { kind: "note", text: `+${prof} AC against this melee attack.` } });
  if (hasFeat("Sentinel")) add("sentinel", { name: "Sentinel", type: "Reaction", notes: "Attack a creature within 5 ft that attacks someone else; your opportunity attack hits drop its speed to 0.", use: { kind: "note", text: "Make one melee weapon attack against that creature." } });
  if (hasFeat("Mage Slayer")) add("mage-slayer", { name: "Mage Slayer", type: "Reaction", notes: "Attack a creature within 5 ft that casts a spell; creatures you damage have disadvantage on concentration saves.", use: { kind: "note", text: "Make one melee weapon attack against the caster." } });
  if (hasFeat("Shield Master") && wearingShield()) add("shield-master", { name: "Shield Master shove", type: "Bonus Action", notes: "After you take the Attack action: shove a creature within 5 ft with your shield.", use: { kind: "note", text: "Athletics vs the target's Athletics or Acrobatics: push 5 ft or knock prone." } });
  if (hasFeat("Telekinetic")) {
    // Telekinetic (TCE p.81): the DC uses the ability the feat raised.
    const ability = Object.entries(character.featGrants || {}).find(([entry]) => featBaseName(entry) === "Telekinetic")?.[1]?.ability || "int";
    const dc = 8 + prof + mod(ability);
    add("telekinetic", { name: "Telekinetic shove", type: "Bonus Action", notes: `One creature you can see within 30 ft: STR save DC ${dc} or it moves 5 ft toward or away from you. A willing creature can fail on purpose.`, use: { kind: "note", text: `STR save DC ${dc}; on a failure, move it 5 ft toward or away from you.` } });
  }
  // Dwarven Fortitude (XGE p.74): taking the Dodge action lets you spend one Hit Die to heal.
  if (hasFeat("Dwarven Fortitude")) add("dwarven-fortitude", { name: "Dodge (Dwarven Fortitude)", type: "Action", notes: "Dodge, then spend one Hit Die: regain the roll + CON (minimum 1).", use: { kind: "hitDie" } });
  if (hasFeat("Charger")) add("charger", { name: "Charger", type: "Bonus Action", notes: "After you Dash and move 10+ ft straight: one melee weapon attack (+5 damage) or a shove (push 10 ft).", use: { kind: "note", text: "Add +5 to the damage of this attack, or push the target up to 10 ft." } });
}

// Lay on Hands (PHB p.84): restore HP from the pool, or spend 5 to cure a disease or neutralize a poison.
function layOnHandsMenu() {
  const pool = character.resources.find(item => item.name === "Lay on Hands (HP pool)");
  if (!pool || Number(pool.current) < 1) {
    showToast(`<span class="toast-label">Lay on Hands</span><span>The pool is empty. It refills on a long rest.</span>`, { tone: "fumble" });
    return;
  }
  const left = Number(pool.current);
  const typed = Math.round(Number(document.querySelector("#damageAmount")?.value || 0));
  const spend = (amount, run) => () => {
    pool.current = Number(pool.current) - amount;
    run();
  };
  const actions = [];
  const missing = Math.max(0, effectiveMaxHp() - Number(character.hp || 0));
  if (typed > 0 && typed <= left) actions.push({ label: `Heal me +${typed}`, run: spend(typed, () => { document.querySelector("#damageAmount").value = "1"; healBy(typed); }) });
  else if (missing) actions.push({ label: `Heal me +${Math.min(left, missing)}`, run: spend(Math.min(left, missing), () => healBy(Math.min(left, missing))) });
  healTargets().forEach(other => {
    const amount = typed > 0 && typed <= left ? typed : Math.min(left, hpMissing(other));
    actions.push(healTargetAction(other, `Heal ${other.name || "ally"}${amount > 0 ? ` +${amount}` : ""}`, spend(amount, () => healOther(other.sheetId, amount))));
  });
  if (left >= 5) actions.push({ label: "Cure a disease or poison (5)", run: spend(5, () => { persistAndRender(); showToast(`<span class="toast-label">Lay on Hands</span><span>One disease or poison ends. Pool ${pool.current}/${pool.max}.</span>`); }) });
  showToast(`<span class="toast-label">Lay on Hands: ${left}/${pool.max} in the pool</span><span>Type an amount in the HP box first to spend exactly that much. No effect on undead or constructs.</span>`, { actions, persist: true });
}

// Damage-toast buttons for features that kick in when a hit drops you to 0 HP without dying outright.
function zeroHpActions(before, wasRaging, amount) {
  const actions = [];
  const standAt = hp => {
    character.hp = hp;
    character.conditions = [...before.conditions];
    character.autoUnconscious = before.autoUnconscious;
    character.deathSaveFailures = 0;
    character.deathSaveSuccesses = 0;
  };
  const revive = (hp, label) => {
    standAt(hp);
    persistAndRender();
    showToast(`<span class="toast-label">${escapeHtml(label)}</span><span>${character.hp}/${effectiveMaxHp()} HP</span>`, { tone: "crit" });
  };
  const has = name => Number(character.resources.find(item => item.name === name)?.current || 0) > 0;
  const infused = character.resources.find(item => item.name === "Infused Items");
  if (classLevel("artificer") >= 20 && infused && Number(infused.current) < Number(infused.max)) {
    actions.push({ label: "Soul of Artifice: end an infusion, 1 HP", run: () => { infused.current = Number(infused.current) + 1; revive(1, "Soul of Artifice"); } });
  }
  if (subclassLevel("shadow-magic") && has("Strength of the Grave")) {
    const dc = 5 + amount;
    actions.push({ label: `Strength of the Grave (CHA DC ${dc})`, run: () => {
      if (!spendFeatureResource("Strength of the Grave")) return;
      rollWithConditions(`Strength of the Grave (DC ${dc})`, `1d20${formatMod(saveBonus("cha"))}`, "save", "cha", [], "", result => {
        if (result.total < dc) return "Failed: you stay at 0 HP.";
        revive(1, "Strength of the Grave");
        return "Success: you drop to 1 HP instead. (Not against radiant damage or a critical hit.)";
      });
    } });
  }
  if (subclassLevel("wildfire") >= 14 && has("Blazing Revival")) {
    actions.push({ label: "Blazing Revival (spirit within 120 ft)", run: () => { if (spendFeatureResource("Blazing Revival")) revive(Math.floor(effectiveMaxHp() / 2), "Blazing Revival: the spirit is gone"); } });
  }
  if (subclassLevel("ghostslayer") >= 18 && character.crimsonRite) {
    actions.push({ label: "Rite Revival: end your rites, 1 HP", run: () => { character.crimsonRite = null; revive(1, "Rite Revival"); } });
  }
  // Relentless Rage (PHB p.49): DC 10 CON save, +5 for each use since your last rest.
  if (wasRaging && classLevel("barbarian") >= 11) {
    const dc = 10 + 5 * Number(character.relentlessUses || 0);
    actions.push({ label: `Relentless Rage (CON save DC ${dc})`, run: () => rollWithConditions(`Relentless Rage (DC ${dc})`, `1d20${formatMod(saveBonus("con"))}`, "save", "con", [], "", result => {
      character.relentlessUses = Number(character.relentlessUses || 0) + 1;
      if (result.total < dc) {
        persistAndRender();
        return "Failed: you stay at 0 HP.";
      }
      standAt(1);
      Object.assign(character, { raging: true, frenzied: before.frenzied, exhaustion: before.exhaustion, effects: structuredCloneSafe(before.effects || {}) });
      persistAndRender();
      return "Success: you drop to 1 HP instead and keep raging.";
    }) });
  }
  const endurance = character.resources.find(item => item.name === "Relentless Endurance");
  if (endurance && Number(endurance.current) > 0) {
    actions.push({ label: "Relentless Endurance: drop to 1 HP", run: () => {
      endurance.current = Number(endurance.current) - 1;
      standAt(1);
      persistAndRender();
      showToast(`<span class="toast-label">Relentless Endurance</span><span>You drop to 1 HP instead. Usable again after a long rest.</span>`, { tone: "crit" });
    } });
  }
  // PHB p.198: a melee attacker can knock the creature out instead; it falls unconscious and is stable.
  actions.push({ label: "Knocked out by a melee attack (stable)", run: () => {
    character.deathSaveFailures = 0;
    character.deathSaveSuccesses = 3;
    character.stable = true;
    persistAndRender();
  } });
  return actions;
}

function damageModActions(mods, type, wasRaging) {
  const actions = [];
  const sources = resistanceSources(type, wasRaging);
  actions.push(mods.resist
    ? { label: "Undo resistance", run: () => reapplyLastDamage({ resist: false }, "Resistance") }
    : { label: `Resistance: halve${sources.length ? ` (${sources.join(", ")})` : ""}`, run: () => halveLastDamage(sources[0] || "Resistance") });
  if (!mods.uncanny && (classLevel("rogue") >= 5 || hunterOption("Uncanny Dodge")) && !incapacitatedBy()) {
    actions.push({ label: "Uncanny Dodge (halve)", run: () => { turnState().reaction = true; halveLastDamage("Uncanny Dodge"); } });
  }
  if (!mods.evasion && hasEvasion()) actions.push({ label: "Evasion: failed DEX save, halve", run: () => halveLastDamage("Evasion") });
  if (!mods.reduce && hasFeat("Heavy Armor Master") && wearingHeavyArmor() && (!type || BPS.includes(type))) {
    actions.push({ label: "Heavy Armor Master -3 (nonmagical weapon)", run: () => reduceLastDamage(3, "Heavy Armor Master") });
  }
  actions.push(mods.vulnerable
    ? { label: "Undo vulnerability", run: () => reapplyLastDamage({ vulnerable: false }, "Vulnerability") }
    : { label: "Vulnerable: double", run: () => reapplyLastDamage({ vulnerable: true }, "Vulnerability") });
  return actions;
}

// Elemental Adept treats 1s on that type's damage dice as 2s; Flames of Phlegethos rerolls 1s on fire spells.
function spellDamageDieRule(text) {
  const type = String(text).match(/\d+d\d+\s+(acid|cold|fire|lightning|thunder)\s+damage/i)?.[1]?.toLowerCase();
  if (!type) return "";
  const adept = (character.combatChoices?.elementalAdept || []).includes(type) || takenFeatEntries().some(entry => featBaseName(entry) === "Elemental Adept" && featVariant(entry).toLowerCase() === type) || new RegExp(`elemental adept[^\\n]*${type}`, "i").test(character.features || "");
  const flames = type === "fire" && hasFeat("Flames of Phlegethos");
  return `${flames ? "r1" : ""}${adept ? "m2" : ""}`;
}

// Use-button kinds for martial features. Returns true when it handled the use.
function martialFeatureUse(action, use, { name, status, refund, undo }) {
  const note = (text, extra = []) => showToast(`<span class="toast-label">${escapeHtml(name)}</span><span>${escapeHtml(text)}${status ? ` ${escapeHtml(status)}.` : ""}</span>`, { actions: [...extra, ...undo], duration: 9000 });
  const resource = label => character.resources.find(item => item.name === label);
  switch (use.kind) {
    case "reckless":
      turnState().reckless = true;
      effects().Reckless = 1;
      persistAndRender();
      note("Advantage on STR melee weapon attacks this turn. Attacks against you have advantage until your next turn.");
      return true;
    case "steady":
      turnState().steadyAim = true;
      turnState().speedZero = "Steady Aim";
      persistAndRender();
      note("Your next attack this turn has advantage. Your speed is 0 until the end of the turn.");
      return true;
    case "survivor": {
      const max = effectiveMaxHp();
      const hp = Number(character.hp || 0);
      if (hp <= 0 || hp > Math.floor(max / 2)) {
        note(hp <= 0 ? "Survivor needs at least 1 HP." : `Survivor works only at half HP or less (${Math.floor(max / 2)}).`);
        return true;
      }
      healBy(5 + mod("con"));
      return true;
    }
    case "layonhands":
      layOnHandsMenu();
      return true;
    case "effect":
      effects()[use.effect] = use.rounds;
      persistAndRender();
      note(use.text, [{ label: `End ${use.effect}`, run: () => { delete effects()[use.effect]; persistAndRender(); } }]);
      return true;
    case "fightingspirit":
      effects()["Fighting Spirit"] = 1;
      persistAndRender();
      gainTempHp(use.amount);
      return true;
    case "regain": {
      const pool = resource(use.resource);
      if (!pool || Number(pool.current) >= Number(pool.max)) {
        refund();
        persistAndRender();
        note(`${use.resource} are already full.`);
        return true;
      }
      pool.current = Number(pool.current) + 1;
      persistAndRender();
      note(`${use.resource} ${pool.current}/${pool.max}.`);
      return true;
    }
    case "temp":
      rollFromInput(`${name}${status ? ` (${status})` : ""}`, use.roll, "normal", [], "", result => {
        gainTempHp(Math.max(1, result.total));
        return `${Math.max(1, result.total)} temporary HP.`;
      });
      return true;
    case "favoredfoe": {
      const start = () => {
        character.concentration = "Favored Foe";
        persistAndRender();
        note("The target is marked for 1 minute while you concentrate. Your first hit on it each turn adds the Favored Foe die.");
      };
      if (character.concentration && character.concentration !== "Favored Foe") {
        showToast(`<span class="toast-label">You're concentrating on ${escapeHtml(character.concentration)}</span><span>Marking a Favored Foe ends it.</span>`, { persist: true, actions: [{ label: "Mark anyway", run: start }, { label: "Cancel", run: () => { refund(); persistAndRender(); } }] });
        return true;
      }
      start();
      return true;
    }
    case "reduce":
      reduceLastDamage(use.amount, name);
      return true;
    case "deflect":
      rollFromInput(`${name}`, use.roll, "normal", result => [{ label: `Reduce the hit by ${result.total}`, run: () => deflectMissile(result.total) }], "Reduce the damage of the ranged weapon attack that hit you.");
      return true;
    case "stillness": {
      const ended = (character.conditions || []).filter(condition => ["Charmed", "Frightened"].includes(condition));
      if (!ended.length) {
        note("You aren't charmed or frightened.");
        return true;
      }
      character.conditions = character.conditions.filter(condition => condition !== ended[0]);
      persistAndRender();
      note(`${ended[0]} ends.`);
      return true;
    }
    case "vanish":
      rollSkillCheck("stealth");
      return true;
    case "superiority":
      superiorityMenu();
      return true;
    default:
      return false;
  }
}

// Deflect Missiles (PHB p.78): the reduction applies to the last hit; at 0 you catch it and can throw it back for 1 ki.
function deflectMissile(amount) {
  const raw = lastDamage?.sheetId === character.sheetId ? damageAfterMods(lastDamage.raw, lastDamage.mods) : null;
  reduceLastDamage(amount, "Deflect Missiles");
  if (raw === null || raw > amount) return;
  const die = classLevel("monk") >= 17 ? 10 : classLevel("monk") >= 11 ? 8 : classLevel("monk") >= 5 ? 6 : 4;
  const ability = Math.max(mod("dex"), mod("str"));
  const throwBack = { id: "deflect-throw", name: "Thrown-back missile", type: "Free", attack: formatMod(proficiencyBonus() + ability), damage: `1d${die}${formatMod(ability)}`, notes: "A ranged weapon attack (20/60) with a monk weapon." };
  showToast(`<span class="toast-label">You catch the missile</span><span>Spend 1 ki to throw it back (range 20/60) as part of the reaction.</span>`, {
    persist: true,
    actions: [{ label: "Throw it back (1 ki)", run: () => {
      const ki = character.resources.find(item => item.name === "Ki Points");
      if (!ki || Number(ki.current) < 1) return showToast(`<span class="toast-label">No ki left</span>`, { tone: "fumble" });
      ki.current = Number(ki.current) - 1;
      persistAndRender();
      rollActionAttack(throwBack, "", true);
    } }],
    duration: 10000
  });
}

// Superiority Die: pick the maneuver, spend a die and roll it with the maneuver's rule beside it.
function superiorityMenu() {
  const dice = character.resources.find(item => item.name === "Superiority Dice");
  const die = resourceDie("Superiority Dice");
  const dc = 8 + proficiencyBonus() + Math.max(mod("str"), mod("dex"));
  if (!dice || Number(dice.current) < 1) {
    showToast(`<span class="toast-label">No superiority dice left</span><span>They come back on a short or long rest.</span>`, { tone: "fumble" });
    return;
  }
  const roll = maneuver => {
    dice.current = Number(dice.current) - 1;
    persistAndRender();
    const item = CLASS_OPTIONS.maneuvers.find(entry => entry.name === maneuver);
    const save = item?.save ? ` ${item.save.toUpperCase()} save DC ${dc}.` : "";
    rollFromInput(`${maneuver || "Superiority die"} (${dice.current}/${dice.max} left)`, `1d${die}`, "normal", [{ label: "Undo spend", run: () => { dice.current = Math.min(Number(dice.max), Number(dice.current) + 1); persistAndRender(); } }], `${item?.summary || "Add it as your maneuver says."}${save}`);
  };
  const known = knownManeuvers();
  showToast(`<span class="toast-label">Superiority dice ${dice.current}/${dice.max} (d${die})</span><span>Maneuver save DC ${dc}.${known.length ? "" : " Choose your maneuvers under Actions to list them here."}</span>`, {
    actions: [...known.map(maneuver => ({ label: maneuver, run: () => roll(maneuver) })), { label: "Roll a die", run: () => roll("") }],
    persist: true
  });
}
