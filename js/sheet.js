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
  setValue("acInput", character.identityLocked ? effectiveArmorClass() : character.ac);
  const speed = effectiveSpeed();
  setValue("speedInput", character.identityLocked ? speed : character.speed);
  const { notes: speedNotes } = speedBreakdown();
  document.querySelector("#speedInput").title = speedNotes.length ? `${character.speed} ft base, ${speedNotes.join(", ")}` : "";
  document.querySelector("#profBonus").textContent = formatMod(proficiencyBonus());
  document.querySelector("#initiativeValue").textContent = formatMod(initiativeBonus());
  const armorClass = calculatedArmorClass();
  if (character.acAuto && Number(character.ac) !== armorClass) {
    character.ac = armorClass;
    setValue("acInput", character.identityLocked ? effectiveArmorClass() : armorClass);
  }
  const acHint = document.querySelector("#acHint");
  acHint.hidden = armorClass === Number(character.ac);
  acHint.textContent = `Gear: ${armorClass}`;
  acHint.title = `Your equipped armor, shield, and DEX give AC ${armorClass}. Click to use it.`;
  document.querySelector("#inspirationValue").textContent = optionalRule("stackingInspiration") ? String(character.inspiration || 0) : character.inspiration ? "Yes" : "No";
  document.querySelector("#inspirationTile").classList.toggle("is-on", character.inspiration > 0);
  ["speedInput", "acInput", "maxHpInput"].forEach(id => {
    document.querySelector(`#${id}`).disabled = character.identityLocked;
  });
  const maxNow = effectiveMaxHp();
  const hpRatio = maxNow ? Number(character.hp) / maxNow : 1;
  const reduction = Number(character.maxHpReduction || 0);
  const note = document.querySelector("#maxHpNote");
  note.hidden = !reduction;
  note.innerHTML = reduction ? `<span>Max HP lowered by ${reduction} until a long rest (now ${maxNow}).</span><button type="button" class="ghost" data-clear-reduction>Restore</button>` : "";
  renderWildShape();
  renderFamiliar();
  document.querySelector(".hp-box").dataset.state = Number(character.hp) <= 0 ? "down" : hpRatio <= 0.25 ? "critical" : hpRatio <= 0.5 ? "bloodied" : "healthy";
  document.querySelector("#subclassOptions").innerHTML = officialSubclasses
    .filter(item => item.classIndex === character.classId)
    .map(item => `<option value="${escapeHtml(item.name)}"></option>`).join("");
  renderIdentityDisplay();
  renderAsiBanner();
}

// Wild Shape: the beast's HP sit in front of yours and absorb damage first. Its AC, STR/DEX/CON, speed and attacks
// replace yours while they're filled in (PHB p.67). The Arcane Ward shows here too.
function renderWildShape() {
  const root = document.querySelector("#wildShapeBox");
  const shape = character.wildShape;
  const ward = character.arcaneWard;
  root.hidden = !shape && !ward;
  root.onclick = handleWildShapeClick;
  if (!shape && !ward) {
    root.innerHTML = "";
    return;
  }
  if (root.contains(document.activeElement)) return;
  const stat = (field, label) => `<label>${label} <input type="number" min="0" data-wild-shape="${field}" value="${shape[field] ?? ""}" aria-label="Beast ${label}"></label>`;
  const magical = subclassLevel("moon") >= 6 ? " (magical)" : "";
  const beast = shape?.beast && SRD_BEASTS.find(item => item.index === shape.beast);
  root.innerHTML = `
    ${shape ? `
    <input data-wild-shape="name" value="${escapeHtml(shape.name || "Beast form")}" aria-label="Beast form name">
    <label>HP <input type="number" min="0" data-wild-shape="hp" value="${Number(shape.hp || 0)}" aria-label="Beast HP"></label>
    <label>of <input type="number" min="0" data-wild-shape="max" value="${Number(shape.max || 0)}" aria-label="Beast max HP"></label>
    ${stat("ac", "AC")}${stat("str", "STR")}${stat("dex", "DEX")}${stat("con", "CON")}${stat("speed", "Speed")}
    <input class="wild-shape-attacks" data-wild-shape="attacks" value="${escapeHtml(shape.attacks || "")}" placeholder="Attacks: Bite +4 1d8+2 piercing; Claw +4 2d4+2" aria-label="Beast attacks">
    ${beastAttacks(shape).map((attack, index) => `<button type="button" class="secondary" data-wild-shape-attack="${index}">${escapeHtml(attack.name)} ${escapeHtml(attack.attack)}${magical}</button>`).join("")}
    ${beast ? `<span class="wild-shape-time">${escapeHtml(beastSpeedText(beast))}</span>` : ""}
    ${shape.hoursLeft ? `<span class="wild-shape-time">${shape.hoursLeft} h left</span>` : ""}
    <button type="button" class="ghost" data-wild-shape-revert>Revert</button>
    ${shape.elemental ? "" : `<details class="beast-picker" ${Number(shape.max) ? "" : "open"}>
      <summary>Choose a beast · ${escapeHtml(wildShapeLimit().split(".")[0])}</summary>
      <input type="search" data-beast-search placeholder="Search beasts" aria-label="Search beasts">
      <div class="beast-list">${beastPickerRows()}</div>
      <small>Not listed? Fill in the fields above by hand.</small>
    </details>`}` : ""}
    ${ward ? `<span class="wild-shape-ward">Arcane Ward <b>${Number(ward.hp)}/${Number(ward.max)}</b></span>` : ""}
  `;
}

function beastPickerRows(query = "") {
  const beasts = wildShapeBeasts(query);
  return beasts.map(beast => `<button type="button" class="beast-option" data-beast-pick="${escapeHtml(beast.index)}"><b>${escapeHtml(beast.name)}</b><span>CR ${crLabel(beast.cr)} · AC ${beast.ac} · HP ${beast.hp} · ${escapeHtml(beastSpeedText(beast))}</span></button>`).join("")
    || `<p class="empty-state">No beast within your limits matches.</p>`;
}

// "Bite +4 1d8+2 piercing; Claw +4 2d4+2; Talons +3 1 slashing" -> attack rows.
function beastAttacks(shape) {
  return String(shape?.attacks || "").split(";").map(text => text.trim().match(/^(.+?)\s+([+-]\d+)\s+((?:\d*d)?\d+.*)$/)).filter(Boolean)
    .map(([, name, attack, damage]) => ({ name, attack, damage, type: "Action", notes: subclassLevel("moon") >= 6 ? "Counts as magical (Primal Strike)." : "" }));
}

function handleWildShapeClick(event) {
  const pick = event.target.closest("[data-beast-pick]");
  if (pick) {
    // The row skips re-rendering while focus is inside it; let go so the filled-in form shows.
    document.activeElement?.blur?.();
    applyBeastForm(pick.dataset.beastPick);
  }
  const button = event.target.closest("[data-wild-shape-attack]");
  const attack = button && beastAttacks(character.wildShape)[Number(button.dataset.wildShapeAttack)];
  if (attack) rollActionAttack(attack);
}

function handleWildShapeInput(event) {
  if (event.target.matches?.("[data-beast-search]")) {
    event.target.closest(".beast-picker").querySelector(".beast-list").innerHTML = beastPickerRows(event.target.value);
    return;
  }
  const field = event.target.dataset.wildShape;
  if (!field || !character.wildShape) return;
  if (field === "name") character.wildShape.name = event.target.value;
  if (field === "attacks") character.wildShape.attacks = event.target.value;
  if (["ac", "str", "dex", "con", "speed"].includes(field)) character.wildShape[field] = event.target.value === "" ? "" : clamp(Number(event.target.value), 0, 999);
  if (field === "hp") character.wildShape.hp = clamp(Number(event.target.value), 0, 999);
  if (field === "max") {
    const max = clamp(Number(event.target.value), 0, 999);
    if (!Number(character.wildShape.hp) || Number(character.wildShape.hp) === Number(character.wildShape.max)) character.wildShape.hp = max;
    character.wildShape.max = max;
  }
  persist();
}

// Familiar card (Find Familiar, Pact of the Chain): form, HP with damage/heal, AC, speeds, senses and traits.
// SRD forms read their stats from SRD_BEASTS; the chain-only forms are typed in by hand.
function renderFamiliar() {
  const root = document.querySelector("#familiarBox");
  const familiar = character.familiar;
  root.hidden = !familiar;
  root.onclick = handleFamiliarClick;
  root.onchange = handleFamiliarChange;
  if (!familiar) {
    root.innerHTML = "";
    return;
  }
  if (root.contains(document.activeElement) && document.activeElement.matches("input, textarea")) return;
  const beast = familiarBeast(familiar);
  const senses = beast ? Object.entries(beast.senses || {}).map(([sense, value]) => sense === "passive_perception" ? `passive Perception ${value}` : `${sense} ${value}`).join(", ") : "";
  const status = familiar.gone ? "Gone until you cast Find Familiar again." : familiar.dismissed ? "Dismissed to its pocket dimension." : "";
  const manual = (field, label, type = "text") => `<label>${label} <input type="${type}" ${type === "number" ? `min="0"` : ""} data-familiar="${field}" value="${escapeHtml(String(familiar[field] ?? ""))}"></label>`;
  root.innerHTML = `
    <div class="familiar-head">
      <span class="field-title">Familiar</span>
      <select data-familiar="form" aria-label="Familiar form">
        <option value="">Choose a form</option>
        ${familiarForms().map(([value, name]) => `<option value="${escapeHtml(value)}" ${familiar.form === value ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}
      </select>
    </div>
    ${familiar.form ? `
    <div class="familiar-stats">
      <span>HP <b>${Number(familiar.hp || 0)}/${Number(familiar.max || 0)}</b></span>
      ${beast ? `<span>AC <b>${beast.ac}</b></span><span>${escapeHtml(beastSpeedText(beast))}</span>` : ""}
    </div>
    ${beast ? `
    <small>${escapeHtml(senses)}</small>
    ${beast.traits.length ? `<small>${beast.traits.map(trait => `<span title="${escapeHtml(trait.desc)}">${escapeHtml(trait.name)}</span>`).join(", ")}</small>` : ""}`
    : `<div class="familiar-manual">${manual("max", "Max HP", "number")}${manual("ac", "AC", "number")}${manual("speed", "Speed")}</div>${manual("notes", "Senses, traits")}`}
    <div class="familiar-actions">
      <input type="number" min="1" step="1" value="1" data-familiar-amount aria-label="Familiar damage or heal amount" ${familiar.gone ? "disabled" : ""}>
      <button type="button" class="damage" data-familiar-act="damage" ${familiar.gone ? "disabled" : ""}>Damage</button>
      <button type="button" class="heal" data-familiar-act="heal" ${familiar.gone ? "disabled" : ""}>Heal</button>
      ${familiar.gone ? `<button type="button" class="ghost" data-familiar-act="forget">Remove card</button>`
        : `<button type="button" class="ghost" data-familiar-act="${familiar.dismissed ? "resummon" : "dismiss"}">${familiar.dismissed ? "Resummon (action)" : "Dismiss"}</button>`}
    </div>` : ""}
    ${status ? `<p class="familiar-status">${status}</p>` : ""}
  `;
}

function handleFamiliarClick(event) {
  const button = event.target.closest("[data-familiar-act]");
  if (!button) return;
  const act = button.dataset.familiarAct;
  const amount = Math.max(0, Math.round(Number(document.querySelector("[data-familiar-amount]")?.value || 0)));
  if (act === "damage") changeFamiliarHp(-amount);
  if (act === "heal") changeFamiliarHp(amount);
  if (act === "dismiss" || act === "resummon") setFamiliarDismissed(act === "dismiss");
  if (act === "forget") {
    character.familiar = null;
    persistAndRender();
  }
}

function handleFamiliarChange(event) {
  const field = event.target.dataset.familiar;
  const familiar = character.familiar;
  if (!field || !familiar) return;
  if (field === "form") {
    setFamiliarForm(event.target.value);
    return;
  }
  if (field === "max") {
    familiar.max = clamp(Number(event.target.value), 0, 999);
    familiar.hp = Math.min(Number(familiar.hp || 0), familiar.max) || familiar.max;
  } else {
    familiar[field] = event.target.value;
  }
  persistAndRender();
}

function revertWildShape() {
  character.wildShape = null;
  persistAndRender();
  showToast(`<span class="toast-label">You revert to your normal form</span>`);
}

function renderIdentityDisplay() {
  const block = document.querySelector("#identityBlock");
  block.classList.toggle("is-locked", character.identityLocked);
  // Play mode by default: build values read as text; Edit unlocks scores, proficiencies, actions and trackers.
  document.body.classList.toggle("is-editing", !character.identityLocked);
  const lock = document.querySelector("#identityLock");
  lock.innerHTML = character.identityLocked ? `${icon("pencil-simple")}Edit` : `${icon("check")}Done`;
  lock.classList.toggle("primary", !character.identityLocked);
  lock.title = character.identityLocked ? "Edit details, scores, proficiencies, actions and trackers" : "Back to play mode";
  const classLine = [
    `Level ${totalLevel()}`,
    character.species,
    character.multiclasses?.length ? `(${classLabel()})` : getClasses()[character.classId]?.name || ""
  ].filter(Boolean).join(" ");
  const detailLine = [
    speciesSize(character.species),
    character.subclassName,
    character.background,
    character.alignment
  ].filter(Boolean).join(", ");
  const editions = classEntries().map(entry => `<span class="edition-badge" data-edition="${entry.rules}" title="${escapeHtml(getClasses()[entry.classId]?.name || "")} uses the ${entry.rules} rules">${classEntries().length > 1 ? `${escapeHtml(getClasses()[entry.classId]?.name || "")} ` : ""}${entry.rules}</span>`).join("");
  document.querySelector("#identityDisplay").innerHTML = `
    <strong>${escapeHtml(character.name || "Unnamed Character")}</strong>
    <span>${escapeHtml(classLine)}</span>
    <span class="edition-row">${editions}</span>
    ${detailLine ? `<em>${escapeHtml(detailLine)}</em>` : ""}
  `;
}

function toggleIdentityLock() {
  character.identityLocked = !character.identityLocked;
  character.asiAcknowledgedLevel = character.level;
  persistAndRender();
}

function renderAsiBanner() {
  const due = asiLevelsFor(currentClass()).has(character.level) && character.asiAcknowledgedLevel !== character.level;
  if (!due) return;
  character.asiAcknowledgedLevel = character.level;
  showToast(`<span class="toast-label">Level ${character.level}: Ability Score Improvement</span><span>Raise one score by 2 or two by 1, or take a feat.</span>`, {
    actions: [{ label: "Open checklist", run: () => document.querySelector("#checklistDialog").showModal() }],
    duration: 10000
  });
}

function renderSheet() {
  ABILITIES.forEach(([id]) => {
    setValue(`[data-ability="${id}"]`, character.abilities[id]);
    document.querySelector(`[data-ability="${id}"]`).disabled = character.identityLocked;
    document.querySelector(`#${id}Mod`).textContent = formatMod(mod(id));
  });
  SKILLS.forEach(([id,, ability]) => {
    const box = document.querySelector(`[data-skill="${id}"]`);
    box.checked = character.proficientSkills.includes(id);
    // Locked in play mode: the row's label would otherwise toggle proficiency when you click the skill name.
    box.disabled = character.identityLocked;
    document.querySelector(`#${id}Skill`).textContent = formatMod(skillBonus(id, ability));
    const expert = (character.expertSkills || []).includes(id);
    const star = document.querySelector(`[data-expert-skill="${id}"]`);
    star.classList.toggle("is-expert", expert);
    star.title = expert ? "Expertise active: double proficiency" : "Toggle expertise (double proficiency)";
  });
  const expertCount = (character.expertSkills || []).length;
  document.querySelector("#skillSummary").textContent = `${character.proficientSkills.length} proficient${expertCount ? ` · ${expertCount} expertise` : ""}`;
  renderSavingThrows();
  renderSenses();
  renderDeathSaves();
  setValue("hitDiceInput", character.hitDice);
  setValue("attacksInput", character.attacks);
  setValue("featuresInput", character.features);
  renderClassFeaturesPanel();
  setValue("inventoryInput", character.inventory);
  setValue("notesInput", character.notes);
  setValue("subclassMode", character.subclass.mode);
  renderOfficialSubclassControls();
  setValue("subclassType", character.subclass.type);
  setValue("subclassTemplate", "");
  setValue("exhaustionInput", character.exhaustion);
  renderXp();
}

// XP leveling (PHB p.15) when the table uses it; otherwise levels come by milestone and nothing shows.
function renderXp() {
  const on = optionalRule("xp");
  const field = document.querySelector("#xpField");
  if (field) field.hidden = !on;
  const next = XP_FOR_LEVEL[totalLevel() + 1];
  const ready = on && totalLevel() < 20 && Number(character.xp || 0) >= next;
  setValue("xpInput", character.xp || 0);
  const hint = document.querySelector("#xpNext");
  if (hint) hint.textContent = on && next ? `next level at ${next.toLocaleString()}` : "";
  const button = document.querySelector("#levelUpButton");
  button.classList.toggle("is-ready", ready);
  button.title = ready ? `${Number(character.xp).toLocaleString()} XP: enough for level ${totalLevel() + 1}` : "";
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
    if (id === "acInput") character.acAuto = false;
    const ceiling = map[id] === "level" ? 20 : map[id] === "hp" ? effectiveMaxHp() : 999;
    character[map[id]] = ["level", "hp", "maxHp", "ac", "speed"].includes(map[id]) ? clamp(Number(value), map[id] === "hp" ? 0 : 1, ceiling) : value;
    if (map[id] === "maxHp") character.hp = Math.min(Number(character.hp || 0), effectiveMaxHp());
    if (id === "classSelect") switchClassTo(value);
    if (id === "subclassName") linkTypedSubclass(value);
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
  if (id === "xpInput") {
    character.xp = clamp(Math.round(Number(value) || 0), 0, 999999);
    persist();
  }
  if (id === "tempHpInput") {
    character.tempHp = clamp(Number(value), 0, 999);
    persist();
  }
  if (id === "concentrationInput") {
    // Whitespace alone isn't a spell name; it showed as "Concentrating on " on the Party tab.
    character.concentration = value.trim();
    persist();
  }
  const coinMap = { coinCp: "cp", coinSp: "sp", coinEp: "ep", coinGp: "gp", coinPp: "pp" };
  if (coinMap[id]) {
    const coins = coinValue(value, character.currency[coinMap[id]]);
    if (coins === null) return;
    character.currency[coinMap[id]] = coins;
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

// Coin boxes take simple sums: "15+45" -> 60; a leading sign changes the current amount ("+45", "-10").
// Anything else (or a half-typed "15+") returns null and the old amount stays.
function coinValue(text, current = 0) {
  const cleaned = String(text).replace(/[\s,]/g, "");
  if (!/^[+-]?\d+([+-]\d+)*$/.test(cleaned)) return null;
  const sum = cleaned.match(/[+-]?\d+/g).reduce((total, term) => total + Number(term), 0);
  return clamp((/^[+-]/.test(cleaned) ? Number(current || 0) : 0) + sum, 0, 999999);
}

// Committed on change (blur/Enter) so typing "1" then "5" doesn't apply two level jumps.
// Changing class swaps everything the class provides: saves, armor and weapon training, HP by hit die, features.
function switchClassTo(classId) {
  classBuilderDraft = null;
  const previousHitDie = Number(String(character.hitDice || "").split("d")[1]) || null;
  character.classId = classId;
  character.subclassName = "";
  character.subclass = { ...character.subclass, mode: "custom", officialIndex: "", type: "Subclass" };
  const cls = currentClass();
  const grants = SPECIES_GRANTS[character.species] || {};
  const [armor, weapons] = CLASS_PROFICIENCIES[cls.id] || [cls.armor || "", cls.weapons || ""];
  const saves = CLASS_SAVES[cls.id] || cls.saves;
  if (saves?.length) character.saveProficiencies = [...saves];
  character.backgroundDetails.armor = mergeList(armor, grants.armor || []);
  character.backgroundDetails.weapons = mergeList(weapons, grants.weapons || []);
  character.hitDice = `${character.level}d${cls.hitDie}`;
  if (previousHitDie !== cls.hitDie) {
    const missing = Number(character.maxHp || 0) - Number(character.hp || 0);
    character.maxHp = averageHpFor(cls, character.level, mod("con")) + sheetExtraHp() * character.level;
    character.hp = clamp(character.maxHp - missing, 0, character.maxHp);
  }
  rebuildClassFeatureLines(cls, character.level);
  showToast(`<span class="toast-label">Now a ${escapeHtml(cls.name)}</span><span>Saves, training, hit dice, HP and features updated. Pick a ${escapeHtml(cls.name)} subclass when you reach it.</span>`, { duration: 9000 });
}

// Typing a subclass name links it to the official entry, so its grants and extras apply.
function linkTypedSubclass(name) {
  const key = normalizedSubclassKey(name);
  const official = key && officialSubclasses.find(item => item.classIndex === character.classId && normalizedSubclassKey(item.name) === key);
  if (!official) {
    Object.assign(character.subclass, { mode: "custom", officialIndex: "" });
    return;
  }
  character.subclass.mode = "official";
  character.subclass.officialIndex = official.index;
  character.subclass.type = official.flavor || character.subclass.type;
  applySubclassExtras();
}

function applyLevelChange(value) {
  const typed = Number(value);
  if (!Number.isInteger(typed) || typed < 1 || typed > 20) {
    showToast(`<span class="toast-label">Level must be a whole number from 1 to 20</span><span>Kept level ${character.level}.</span>`, { tone: "fumble" });
    document.querySelector("#levelInput").value = character.level;
    return;
  }
  const next = typed;
  const delta = next - character.level;
  if (!delta) {
    renderAll();
    return;
  }
  const cls = currentClass();
  const perLevel = Math.max(1, Math.ceil(cls.hitDie / 2) + 1 + mod("con")) + sheetExtraHp();
  character.level = next;
  rebuildClassFeatureLines(cls, next);
  character.maxHp = Math.max(next, Number(character.maxHp || 0) + delta * perLevel);
  character.hp = clamp(Number(character.hp || 0) + delta * perLevel, 0, character.maxHp);
  character.hitDice = `${next}d${cls.hitDie}`;
  character.hitDiceUsed = Math.min(Number(character.hitDiceUsed || 0), next);
  persistAndRender();
  showToast(`<strong>Level ${next}</strong> Max HP ${delta > 0 ? "+" : ""}${delta * perLevel} using the average (${perLevel}/level), hit dice ${next}d${cls.hitDie}. Edit Max HP if you rolled.`, { duration: 9000 });
}

function handleAbilityInput(event) {
  const ability = event.target.dataset.ability;
  const before = mod(ability);
  character.abilities[ability] = clamp(Number(event.target.value), 1, 30);
  // CON changes HP at every level you have, not just the next one (PHB p.177).
  const levels = totalLevel();
  const change = ability === "con" ? (mod("con") - before) * levels : 0;
  if (change) {
    character.maxHp = Math.max(levels, Number(character.maxHp || 0) + change);
    character.hp = clamp(Number(character.hp || 0) + change, 0, character.maxHp);
  }
  persistAndRender();
  if (change) showToast(`<span class="toast-label">Constitution ${formatMod(mod("con"))}</span><span>Max HP ${formatMod(change)} (${formatMod(change / levels)} for each of your ${levels} levels).</span>`);
}

function saveBonus(ability) {
  return mod(ability) + (saveProficient(ability) ? proficiencyBonus() : 0) + itemSaveBonus() + auraOfProtection() + darkAugmentation(ability);
}

// Dark Augmentation (Blood Hunter 10): STR, DEX and CON saves add the hemocraft modifier (minimum +1).
function darkAugmentation(ability) {
  return classLevel("bloodhunter") >= 10 && ["str", "dex", "con"].includes(ability) ? Math.max(1, mod(hemocraftAbility())) : 0;
}

// Diamond Soul (monk 14): every save. Slippery Mind (rogue 15): Wisdom saves.
function saveProficient(ability) {
  return character.saveProficiencies.includes(ability)
    || classLevel("monk") >= 14
    || (classLevel("rogue") >= 15 && ability === "wis");
}

// "+1 AC and saving throws" (Cloak/Ring of Protection) on equipped, attuned items.
function itemSaveBonus() {
  return uniqueActiveItems()
    .reduce((sum, item) => sum + Number(String(item.notes || "").match(/\+(\d+)[^.]*saving throws/i)?.[1] || 0), 0)
    + (typeof featureSaveBonus === "function" ? featureSaveBonus() : 0);
}

// Paladin 6+: add your CHA modifier (minimum +1) to your saving throws while conscious.
function auraOfProtection() {
  return classLevel("paladin") >= 6 && Number(character.hp) > 0 && !(character.conditions || []).includes("Unconscious") ? Math.max(1, mod("cha")) : 0;
}

function renderSavingThrows() {
  document.querySelectorAll("[data-save]").forEach(input => {
    input.checked = character.saveProficiencies.includes(input.dataset.save);
    input.disabled = character.identityLocked;
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
    return `<div class="sense-row"><strong>${passiveScore(skill)}</strong><span>${label}</span></div>`;
  }).join("") + specialSensesHtml();
}

// 10 + the skill bonus, ±5 for advantage or disadvantage; Observant adds 5 to passive Perception and Investigation.
function passiveScore(skill) {
  const ability = SKILLS.find(([id]) => id === skill)[2];
  return 10 + skillBonus(skill, ability) + (hasFeat("Observant") && ["perception", "investigation"].includes(skill) ? 5 : 0) + passiveRollModeBonus(ability, skill) + customFeatModifier("passive", skill);
}

// Darkvision from the species preset (60 ft) or any "Darkvision N ft" written in features.
function specialSensesHtml() {
  const written = String(character.features || "").match(/darkvision\D{0,12}(\d+)/i);
  const preset = SPECIES_PRESETS.find(([name]) => name === character.species);
  const presetRange = preset?.[2].match(/darkvision\D{0,4}(\d+)/i);
  const base = (written ? Number(written[1]) : presetRange ? Number(presetRange[1]) : preset && /darkvision/i.test(preset[2]) ? 60 : 0) + grantDarkvision();
  // Eyes of the Dark (Shadow Magic): darkvision 120 ft. Devil's Sight: see in magical darkness to 120 ft.
  const range = subclassLevel("shadow-magic") ? Math.max(base, 120) : base;
  const devil = classLevel("warlock") >= 2 && typeof hasInvocation === "function" && hasInvocation("Devil's Sight");
  // Blind Fighting style (TCE p.41): blindsight 10 ft.
  const blind = typeof hasStyle === "function" && hasStyle("Blind Fighting") ? `<p class="special-senses">${icon("eye")}Blindsight 10 ft</p>` : "";
  // Other movement modes from the species (fly, swim, climb); "walk" means equal to walking speed.
  // Gift of the Depths (XGE p.57): swim speed equal to your walking speed, and you can breathe underwater.
  const depths = classLevel("warlock") >= 5 && typeof hasInvocation === "function" && hasInvocation("Gift of the Depths");
  const moves = Object.entries({ ...(character.movement || {}), ...(depths ? { swim: "walk" } : {}) }).filter(([mode]) => ["fly", "swim", "climb"].includes(mode))
    .map(([mode, value]) => `${mode} ${value === "walk" ? character.speed : Number(value) || 0} ft`);
  return `${range ? `<p class="special-senses">${icon("eye")}Darkvision ${range} ft</p>` : ""}${devil ? `<p class="special-senses">${icon("eye")}Devil's Sight 120 ft (magical darkness too)</p>` : ""}${blind}`
    + (moves.length ? `<p class="special-senses">${icon("sneaker-move")}${escapeHtml(moves.join(", "))}${depths ? " (breathe underwater)" : ""}${character.movement?.note ? ` (${escapeHtml(character.movement.note)})` : ""}</p>` : "");
}

function speciesSize(species) {
  const preset = SPECIES_PRESETS.find(([name]) => name === species);
  if (!preset) return "";
  return preset[5] || (/gnome|halfling/i.test(species) ? "Small" : "Medium");
}

function renderDeathSaves() {
  const root = document.querySelector("#deathSaveTracker");
  const successes = character.deathSaveSuccesses;
  const failures = character.deathSaveFailures;
  const status = failures >= 3 ? "Three failures: dead" : character.stable ? "Stable" : "";
  const pips = kind => Array.from({ length: 3 }, (_, index) => {
    const count = kind === "success" ? successes : failures;
    return `<button type="button" class="death-pip ${kind} ${index < count ? "filled" : ""}" data-death-kind="${kind}" data-death-index="${index}" aria-label="${kind} ${index + 1}"></button>`;
  }).join("");
  root.innerHTML = `
    <div class="death-save-row"><span>Successes</span>${pips("success")}</div>
    <div class="death-save-row"><span>Failures</span>${pips("failure")}</div>
    <div class="death-save-actions">
      <button type="button" class="ghost" data-death-action="roll" ${isDying() ? "" : "disabled title=\"Only while dying at 0 HP\""}>Roll death save</button>
      <button type="button" class="ghost" data-death-action="reset">Reset</button>
      ${isDying() ? `<button type="button" class="ghost" data-death-action="stabilize" title="Medicine DC 10, a healer's kit, or Spare the Dying">Stabilize</button>` : ""}
      ${character.stable && Number(character.hp) <= 0 ? `<button type="button" class="ghost" data-death-action="wake" title="A stable creature that isn't healed regains 1 HP after 1d4 hours">1d4 hours pass</button>` : ""}
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

// Expertise one class entry gives at its level: rogue 2 at 1st (+2 at 6th), bard 2 at 3rd (+2 at 10th) (PHB p.54, p.96).
function classExpertise(classId, level) {
  return classId === "rogue" ? (level >= 6 ? 4 : level >= 1 ? 2 : 0) : classId === "bard" ? (level >= 10 ? 4 : level >= 3 ? 2 : 0) : 0;
}

// Expertise picks the character has: class levels (above), Prodigy and Skill Expert 1 each, Knowledge Domain 2
// (PHB p.59), Scout's Survivalist 2 (XGE p.47), Tasha's Canny 1 (ranger 1, optional).
function expertiseAllowed(source = character) {
  const fromClasses = classEntries(source).reduce((sum, entry) => sum + classExpertise(entry.classId, entry.level), 0);
  const feats = ["Prodigy", "Skill Expert"].filter(name => hasFeat(name, source)).length;
  const subclass = (subclassLevel("knowledge") >= 1 ? 2 : 0) + (subclassLevel("scout") >= 3 ? 2 : 0);
  const canny = classLevel("ranger", source) >= 1 && optionalRule("tashas", source) ? 1 : 0;
  return fromClasses + feats + subclass + canny;
}

// Expertise doubles a proficiency you already have (PHB p.54); it never adds one.
function toggleExpertise(skill) {
  const expert = (character.expertSkills || []).includes(skill);
  if (expert) {
    character.expertSkills = character.expertSkills.filter(item => item !== skill);
    persistAndRender();
    return;
  }
  const label = SKILLS.find(([id]) => id === skill)?.[1] || skill;
  if (!character.proficientSkills.includes(skill)) {
    showToast(`<span class="toast-label">Not proficient in ${escapeHtml(label)}</span><span>Expertise doubles a proficiency you already have. Mark the skill proficient first.</span>`, { tone: "fumble" });
    return;
  }
  const add = () => {
    character.expertSkills = [...(character.expertSkills || []), skill];
    persistAndRender();
  };
  const allowed = expertiseAllowed();
  if ((character.expertSkills || []).length >= allowed && !isRuleBroken("expertise-limit")) {
    breakRule("expertise-limit", `You already have ${character.expertSkills.length} expertise skill${character.expertSkills.length === 1 ? "" : "s"}; your class levels and feats give ${allowed}.`, add);
    return;
  }
  add();
}

function addNoteSection(kind, title = "New Section", body = "") {
  getNoteSections(kind).push({ id: crypto.randomUUID(), title, body });
  persistAndRender();
}

function renderDynamicNoteSections(kind) {
  if (kind !== "subclass") renderJournal();
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

// ---- Journal (Roleplay tab): dated entries, newest first ----
function localDateText(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function sortedJournal(journal = character.journal || []) {
  return [...journal].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
}

function renderJournal() {
  const root = document.querySelector("#journalEntries");
  if (!root) return;
  const entries = sortedJournal();
  root.innerHTML = entries.length ? entries.map(entry => `
    <article class="note-section journal-entry" data-journal-id="${escapeHtml(entry.id)}">
      <div class="note-section-head">
        <input class="note-title" data-journal-field="title" value="${escapeHtml(entry.title)}" placeholder="Title" autocomplete="off" aria-label="Entry title">
        <button class="ghost" type="button" data-journal-remove>Delete</button>
      </div>
      <div class="journal-meta">
        <label>Date <input type="date" data-journal-field="date" value="${escapeHtml(entry.date)}"></label>
        <label>Session <input type="number" min="0" step="1" inputmode="numeric" data-journal-field="session" value="${escapeHtml(entry.session)}"></label>
        <label>Location <input data-journal-field="location" value="${escapeHtml(entry.location)}" autocomplete="off"></label>
      </div>
      <textarea class="note-body" rows="5" data-journal-field="body" aria-label="Entry text">${escapeHtml(entry.body)}</textarea>
    </article>`).join("") : `<p class="empty-state">No journal entries yet.</p>`;
  root.oninput = handleJournalInput;
  root.onchange = event => { if (event.target.dataset.journalField === "date") persistAndRender(); };
  root.onclick = handleJournalClick;
  const add = document.querySelector("#addJournalEntry");
  if (add) add.onclick = addJournalEntry;
}

function addJournalEntry() {
  character.journal = character.journal || [];
  const entry = { id: crypto.randomUUID(), date: localDateText(), session: sortedJournal()[0]?.session || "", location: "", title: "", body: "" };
  character.journal.unshift(entry);
  persistAndRender();
  document.querySelector(`[data-journal-id="${entry.id}"] [data-journal-field="title"]`)?.focus();
}

function handleJournalInput(event) {
  const field = event.target.dataset.journalField;
  const entry = (character.journal || []).find(item => item.id === event.target.closest("[data-journal-id]")?.dataset.journalId);
  if (!field || !entry) return;
  entry[field] = event.target.value;
  persist();
}

function handleJournalClick(event) {
  if (!event.target.closest("[data-journal-remove]")) return;
  const id = event.target.closest("[data-journal-id]")?.dataset.journalId;
  const index = (character.journal || []).findIndex(item => item.id === id);
  if (index < 0) return;
  const [removed] = character.journal.splice(index, 1);
  persistAndRender();
  showToast(`<span class="toast-label">Journal entry deleted</span><span>${escapeHtml(removed.title || removed.date || "Untitled")}</span>`, {
    actions: [{ label: "Undo", run: () => { character.journal.splice(index, 0, removed); persistAndRender(); } }]
  });
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
    ["Note Sections", (character.noteSections || []).map(section => `${section.title}: ${section.body}`).join("\n")],
    ["Journal", sortedJournal().map(entry => [entry.date, entry.session && `Session ${entry.session}`, entry.location, `${entry.title}: ${entry.body}`].filter(Boolean).join(" · ")).join("\n")]
  ];
  const matches = haystacks.filter(([, text]) => String(text || "").toLowerCase().includes(query));
  root.classList.add("active");
  root.innerHTML = matches.length ? matches.map(([label, text]) => `<article><strong>${label}</strong><p>${escapeHtml(truncate(String(text), 180))}</p></article>`).join("") : `<p class="empty-state">No matches.</p>`;
}

// Whether the player picked a Tasha's replacement feature (meta.choice on its CLASS_FEATURE_DETAILS row).
function optionalFeatureTaken(choice, source = character) {
  if (!optionalRule("tashas", source)) return false;
  return choice === "blessedStrikes" ? source.combatChoices?.blessedStrikes === "Blessed Strikes" : Boolean(source.classChoices?.[choice]);
}

const SUBCLASS_PLACEHOLDER = /^(Specialist|Path|College|Order|Domain|Circle|Archetype|Tradition|Oath|Patron|Origin|Conclave) Feature$/i;

// Class and subclass features reached at each class entry's level, plus the next one coming.
function classFeatureRows(source = character) {
  const tashas = optionalRule("tashas", source);
  return classEntries(source).map(entry => {
    const cls = getClasses()[entry.classId];
    const slug = subclassIndexFor(entry);
    const sub = SUBCLASS_FEATURES[slug];
    const subName = officialSubclasses.find(item => item.index === slug)?.name || entry.subclassName || "";
    let rows = [
      ...(CLASS_FEATURE_DETAILS[entry.classId] || []).map(([level, name, summary, meta = {}]) => ({ level, name, summary, meta, source: meta.source || "" })),
      ...(sub?.features || []).map(([level, name, summary, meta = {}]) => ({ level, name, summary, meta, source: sub.source }))
    ].filter(row => row.source !== "TCE-optional" || tashas)
      // With a subclass chosen, its real features replace the generic "Circle Feature" placeholder rows.
      .filter(row => !(sub && SUBCLASS_PLACEHOLDER.test(row.name) && sub.features.some(([level]) => level === row.level)))
      .sort((a, b) => a.level - b.level);
    // A Tasha's replacement shows only once picked, and then hides what it replaced (hidden only when every
    // replacement naming it is picked: Favored Foe and Roving both replace the 6th-level ranger improvement).
    const picked = row => optionalFeatureTaken(row.meta.choice, source);
    const swaps = rows.filter(row => row.meta.choice);
    rows = rows.filter(row => {
      if (row.meta.choice) return picked(row);
      const by = swaps.filter(swap => (swap.meta.replaces || []).includes(row.name));
      return !by.length || !by.every(picked);
    });
    // Next: the next feature that will arrive, ASIs included; Tasha's additions only once picked (above).
    const next = rows.find(row => row.level > entry.level && (row.source !== "TCE-optional" || row.meta.choice));
    return { entry, name: cls?.name || entry.classId, subName, reached: rows.filter(row => row.level <= entry.level && row.name !== "Ability Score Improvement"), next };
  });
}

const FEATURE_ACTION_LABELS = { action: "Action", bonus: "Bonus action", reaction: "Reaction", rest: "During a rest" };
const FEATURE_RECHARGE_LABELS = { short: "Short rest", long: "Long rest" };
// character.classChoices keys (CLASS_CHOICE_DEFAULTS) → heading, and the CLASS_OPTIONS list a pick's summary comes from.
const CLASS_CHOICE_LABELS = { invocations: "Eldritch invocations", metamagic: "Metamagic", pactBoon: "Pact boon", maneuvers: "Maneuvers", infusions: "Infusions", fightingStyles: "Fighting styles", bloodHunterRites: "Crimson rites", bloodMaledicts: "Blood curses", arcaneShots: "Arcane shots", disciplines: "Elemental disciplines", runes: "Runes", totems: "Totem spirits", hunter: "Hunter options", favoredEnemies: "Favored enemies", favoredTerrains: "Favored terrains", draconicAncestry: "Dragon ancestor", landTerrain: "Circle of the Land terrain", genieKind: "Genie kind", divineSoulAffinity: "Divine Soul affinity", tomeCantrips: "Book of Shadows cantrips", blessedWarriorCantrips: "Blessed Warrior cantrips", druidicWarriorCantrips: "Druidic Warrior cantrips", kenseiWeapons: "Kensei weapons", stormEnvironment: "Storm Herald environment" };
const CLASS_CHOICE_LISTS = { pactBoon: "pactBoons", disciplines: "elementalDisciplines", totems: "totemSpirits", hunter: "hunterOptions", stormEnvironment: "stormHeraldEnvironments" };

function featureRowHtml({ name, summary, chips = [] }) {
  return `<details class="feature-row"><summary><span class="feature-row-name">${escapeHtml(name)}</span><span class="feature-chips">${chips.filter(Boolean).map(([text, tone = ""]) => `<em class="feature-chip ${tone}">${escapeHtml(text)}</em>`).join("")}</span></summary>${summary ? `<p>${escapeHtml(summary)}</p>` : ""}</details>`;
}

// ---- Species traits as feature rows, split out of the SPECIES_PRESETS trait line ----
// Short original summaries for traits the trait line only names. Keys are lower case.
const SPECIES_TRAIT_SUMMARIES = {
  "keen senses": "Proficiency in Perception.",
  "fey ancestry": "Advantage on saves against being charmed, and magic can't put you to sleep.",
  "trance": "Meditate 4 hours instead of sleeping 8 to get a long rest's benefit.",
  "elf weapon training": "Proficiency with the longsword, shortsword, shortbow, and longbow.",
  "mask of the wild": "You can try to hide when only lightly obscured by natural things like foliage, rain, snow, or mist.",
  "dwarven resilience": "Advantage on saves against poison, and resistance to poison damage.",
  "stout resilience": "Advantage on saves against poison, and resistance to poison damage.",
  "dwarven toughness": "+1 hit point per level.",
  "gnome cunning": "Advantage on INT, WIS, and CHA saves against magic.",
  "speak with small beasts": "Share simple ideas with Small or smaller beasts through sounds and gestures.",
  "artificer's lore": "History checks about magic items, alchemical objects, or technological devices add twice your proficiency bonus.",
  "tinker's tools": "Proficiency with tinker's tools; build tiny clockwork devices.",
  "relentless endurance": "When damage drops you to 0 HP without killing you outright, you drop to 1 HP instead. Once per long rest.",
  "savage attacks": "When you score a critical hit with a melee weapon, roll one of its damage dice one more time and add it to the extra damage.",
  "menacing": "Proficiency in Intimidation.",
  "lucky": "When you roll a 1 on the d20 for an attack, ability check, or save, reroll it and use the new roll.",
  "brave": "Advantage on saves against being frightened.",
  "halfling nimbleness": "You can move through the space of any creature larger than you.",
  "naturally stealthy": "You can try to hide when only obscured by a creature at least one size larger than you.",
  "skill versatility": "Proficiency in two skills of your choice.",
  "infernal legacy": "Thaumaturgy; hellish rebuke as a 2nd-level spell once per long rest from 3rd level; darkness once per long rest from 5th level (CHA).",
  "sunlight sensitivity": "Disadvantage on attack rolls and sight-based Perception checks when you, your target, or what you look at is in direct sunlight.",
  "powerful build": "You count as one size larger for carrying capacity and the weight you can push, drag, or lift.",
  "magic resistance": "Advantage on saves against spells and other magical effects.",
  "amphibious": "You can breathe air and water.",
  "healing hands": "Action: touch a creature to restore hit points equal to your level. Once per long rest.",
  "pack tactics": "Advantage on attacks against a creature when an ally that isn't incapacitated is within 5 feet of it.",
  "grovel, cower, and beg": "Action: until the end of your next turn, allies have advantage on attacks against enemies within 10 feet of you that can see you. Once per short or long rest.",
  "fey type": "Your creature type is fey, not humanoid.",
  "drow weapon training": "Proficiency with rapiers, shortswords, and hand crossbows.",
  "speech of beast and leaf": "Beasts and plants understand the meaning of your words, and you have advantage on CHA checks to influence them.",
  "unending breath": "You can hold your breath indefinitely while you're not incapacitated.",
  "stonecunning": "History checks about stonework count as proficient and add twice your proficiency bonus.",
  "draconic ancestry": "Your dragon type sets your breath weapon's damage type and shape, and your damage resistance.",
  "damage resistance": "Resistance to the damage type of your draconic ancestry."
};
// Trait-line wording that names a trait differently from its trait name.
const SPECIES_TRAIT_NAMES = {
  "savage critical hits": "Savage Attacks", "relentless endurance": "Relentless Endurance", "dwarven resilience against poison": "Dwarven Resilience",
  "stout resilience against poison": "Stout Resilience", "two extra skill proficiencies": "Skill Versatility", "infernal legacy spells": "Infernal Legacy",
  "elf weapon training": "Elf Weapon Training", "keen senses": "Keen Senses", "fey ancestry": "Fey Ancestry", "trance": "Trance",
  "gnome cunning": "Gnome Cunning", "lucky": "Lucky", "brave": "Brave", "halfling nimbleness": "Halfling Nimbleness",
  "dwarven resilience": "Dwarven Resilience", "artificer's lore": "Artificer's Lore", "tinker's tools": "Tinker's Tools", "drow weapon training": "Drow Weapon Training"
};
// Traits the trait line leaves out (granted through SPECIES_GRANTS instead).
const SPECIES_EXTRA_TRAITS = { "Half-Orc": ["Menacing"] };

// Splits text at separators outside parentheses; each part keeps the separator before it.
function splitOutsideParens(text, separators) {
  const parts = [];
  let depth = 0;
  let start = 0;
  let before = "";
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === "(") depth += 1;
    else if (char === ")") depth = Math.max(0, depth - 1);
    else if (!depth) {
      const separator = separators.find(item => text.startsWith(item, index));
      if (separator) {
        parts.push({ text: text.slice(start, index).trim(), sep: before });
        before = separator;
        start = index + separator.length;
        index = start - 1;
      }
    }
  }
  parts.push({ text: text.slice(start).trim(), sep: before });
  return parts.filter(part => part.text);
}

function speciesTraitRows(source = character) {
  const species = source.species || "";
  const preset = SPECIES_PRESETS.find(([name]) => name === species);
  if (!preset) return [];
  const text = String(preset[2] || "")
    .replace("Draconic ancestry grants a breath weapon and resistance to its damage type", "Draconic Ancestry, Breath Weapon, Damage Resistance")
    .replace(/draconic breath weapon and damage resistance/i, "Breath Weapon, Damage Resistance")
    .replace("vicious mockery, charm person at 3rd, enthrall at 5th instead of Infernal Legacy", "Legacy of the Devil's Tongue: vicious mockery, charm person at 3rd, enthrall at 5th (CHA)")
    .replace(/ \(SCAG variant[^)]*\)/g, "")
    .replace("Grovel, Cower, and Beg", "Grovel\u0001 Cower\u0001 and Beg");
  // Sentences about size, parent race, ability increases or the book are not traits.
  const sentences = splitOutsideParens(text.replace(/\.$/, ""), [". "]).map(part => part.text.replace(/\.$/, ""))
    .filter(sentence => !/^(\(|Tasha's lets|Increase one|\+1 to|Kenku speak|Small\b|Medium\b)/.test(sentence) && !/^[A-Z][a-z-]+( or [a-z-]+)?$/.test(sentence));
  const pieces = [];
  let from = "";
  sentences.forEach(sentence => splitOutsideParens(sentence, [", and ", ", or ", ", ", "; "]).forEach(({ text: raw, sep }, index, parts) => {
    // "from 3rd level, Radiant Soul ..." applies the level to the next trait.
    if (/^from \d+\w+ level$/i.test(raw) && /^[A-Z]/.test(parts[index + 1]?.text || "")) {
      from = raw.toLowerCase();
      return;
    }
    const part = from ? `${raw} (${from})` : raw;
    from = "";
    const last = pieces[pieces.length - 1];
    // Parts that don't start with a capital, after "Trait: ...", continue that trait's text.
    if (last?.includes(":") && /^[^A-Z]/.test(part)) {
      pieces[pieces.length - 1] = `${last}${sep}${part}`;
      return;
    }
    // "Fey Step (...), with a seasonal rider": the rider belongs in the parentheses.
    if (/\)$/.test(last || "") && /^with /.test(part)) {
      pieces[pieces.length - 1] = `${last.slice(0, -1)}; ${part})`;
      return;
    }
    // "Darkvision and Fey Ancestry", "Earth Walk (...) and Merge with Stone": two traits.
    splitOutsideParens(part, [" and "]).forEach(({ text: half }, index, halves) => {
      const previous = halves[index - 1]?.text;
      if (index && !/\)$/.test(previous) && !/^(darkvision|unending breath)$/i.test(previous)) pieces[pieces.length - 1] += ` and ${half}`;
      else pieces.push(half);
    });
  }));
  pieces.push(...(SPECIES_EXTRA_TRAITS[species] || []).filter(name => !pieces.some(piece => piece.toLowerCase().startsWith(name.toLowerCase()))));
  const capital = value => value ? value[0].toUpperCase() + value.slice(1) : value;
  const skillName = value => SKILLS.find(([, label]) => label.toLowerCase() === value.toLowerCase())?.[1];
  const rows = pieces.map(piece => piece.replace(/\u0001/g, ",").replace(/^the /, "")).map(text => {
    // "X replaces Skill Versatility" (variant subraces): note what it replaces.
    const swap = !text.includes(":") && text.match(/^(.*?) replaces (.+)$/);
    const piece = swap ? swap[1] : text;
    let name = piece;
    let summary = "";
    const colon = piece.indexOf(":");
    const paren = piece.match(/^([^()]*?)\s*\(([^()]*)\)$/);
    if (colon > 0 && (!paren || colon < piece.indexOf("("))) {
      name = piece.slice(0, colon);
      summary = capital(piece.slice(colon + 1).trim());
    } else if (paren) {
      const [, head, inner] = paren;
      // "+1 HP per level (Dwarven Toughness)": the name is in the parentheses.
      if (/^[^A-Z]/.test(head) && /^[A-Z][\w' ]*$/.test(inner) && !skillName(inner)) [name, summary] = [inner, capital(head)];
      else [name, summary] = [head, skillName(inner) ? `Proficiency in ${skillName(inner)}.` : capital(inner)];
    }
    // "Radiant Soul gives a flying speed ...": the capitalized words are the name, the rest describes it.
    const long = name.split(" ").length > 4 && name.match(/^([A-Z][\w'-]*(?:\s(?:of|the|and|[A-Z][\w'-]*))+)\s(?!(?:of|the|and)\s)([a-z].*)$/);
    if (long) [name, summary] = [long[1], `${capital(long[2])}${summary ? ` (${summary[0].toLowerCase()}${summary.slice(1)})` : ""}`];
    if (swap) summary = `${summary ? `${summary}; in` : "In"} place of ${swap[2]}.`;
    name = SPECIES_TRAIT_NAMES[name.toLowerCase()] || capital(name);
    const key = name.toLowerCase();
    const darkvision = key.match(/^darkvision(?: (\d+) ft)?$/);
    if (darkvision) return { name: "Darkvision", summary: `You see in dim light within ${darkvision[1] || 60} feet as if it were bright light, and in darkness as if it were dim light (no colors in darkness).` };
    if (key === "breath weapon") summary = (typeof breathWeapon === "function" && breathWeapon()?.notes) || "Exhale energy of your ancestry's damage type. Once per short or long rest.";
    if (key === "draconic ancestry" && source.draconicAncestry) summary = `${source.draconicAncestry} dragon. ${SPECIES_TRAIT_SUMMARIES[key]}`;
    const resistance = key.match(/^([a-z, ]+?) resistance$/);
    return { name, summary: summary || SPECIES_TRAIT_SUMMARIES[key] || (resistance && key !== "damage resistance" && key !== "magic resistance" ? `Resistance to ${resistance[1]} damage.` : "") };
  });
  // Innate spells the trait line doesn't spell out (SPECIES_MAGIC).
  const magic = SPECIES_MAGIC[species];
  const spellName = index => spellDetails[index]?.name || allSpells.find(item => item.index === index)?.name || index.replace(/-/g, " ");
  if (magic?.spells?.length && !rows.some(row => `${row.name} ${row.summary}`.toLowerCase().includes(spellName(magic.spells[0][0]).toLowerCase()))) {
    rows.push({ name: "Innate spells", summary: magic.spells.map(([index, level, recharge]) => `${spellName(index)}${level > 1 ? ` from level ${level}` : ""}${recharge === "will" ? " at will" : ` once per ${recharge} rest`}`).join("; ") + "." });
  }
  return rows.filter((row, index) => row.name && rows.findIndex(other => other.name === row.name) === index);
}

function renderClassFeaturesPanel() {
  const root = document.querySelector("#classFeatureList");
  if (!root) return;
  const groups = classFeatureRows().map(({ entry, name, subName, reached, next }) => {
    const artificer = entry.classId === "artificer" && entry.level >= 2
      ? `<p class="feature-next">Infusions known ${[4, 6, 8, 10, 12][[2, 6, 10, 14, 18].filter(gate => entry.level >= gate).length - 1]} · infused items at once ${[2, 3, 4, 5, 6][[2, 6, 10, 14, 18].filter(gate => entry.level >= gate).length - 1]}</p>` : "";
    return `
      <section class="feature-group">
        <h3>${escapeHtml(`${name} ${entry.level}`)}${subName ? ` <span>${escapeHtml(subName)}</span>` : ""}</h3>
        ${artificer}
        ${reached.map(row => featureRowHtml({
          name: row.name,
          summary: row.summary,
          chips: [
            [`${name} ${row.level}`],
            row.source === "TCE-optional" ? ["Optional (Tasha's)", "is-optional"] : row.source ? [row.source] : null,
            FEATURE_ACTION_LABELS[row.meta.action] ? [FEATURE_ACTION_LABELS[row.meta.action]] : null,
            row.meta.cost ? [`Spends ${row.meta.cost}`] : null,
            row.meta.uses ? [`Uses: ${row.meta.uses}`] : null,
            FEATURE_RECHARGE_LABELS[row.meta.recharge] ? [FEATURE_RECHARGE_LABELS[row.meta.recharge]] : null
          ]
        })).join("")}
        ${next ? `<p class="feature-next">Next: ${escapeHtml(next.name)} at ${escapeHtml(name)} ${next.level}</p>` : ""}
      </section>`;
  });
  const traits = speciesTraitRows();
  if (traits.length) groups.push(`<section class="feature-group"><h3>${escapeHtml(character.species)} <span>Species traits</span></h3>${traits.map(row => featureRowHtml({ name: row.name, summary: row.summary, chips: [["Species"]] })).join("")}</section>`);
  const custom = Array.isArray(character.customFeats) ? character.customFeats : [];
  const feats = [...new Set((character.planner?.feats || []).filter(feat => feat !== "Ability Score Improvement"))];
  const featRows = [
    ...feats.map(feat => featureRowHtml({ name: feat, summary: FEAT_DETAILS[feat]?.summary || custom.find(item => item.name === feat)?.summary || "", chips: [FEAT_DETAILS[feat]?.source ? [FEAT_DETAILS[feat].source] : ["Custom"]] })),
    ...custom.filter(item => item?.name && !feats.includes(item.name)).map(item => featureRowHtml({ name: item.name, summary: item.summary || "", chips: [["Custom"]] }))
  ];
  if (featRows.length) groups.push(`<section class="feature-group"><h3>Feats</h3>${featRows.join("")}</section>`);
  const choices = Object.keys(character.classChoices || {}).map(key => {
    const list = Array.isArray(CLASS_OPTIONS[CLASS_CHOICE_LISTS[key] || key]) ? CLASS_OPTIONS[CLASS_CHOICE_LISTS[key] || key] : [];
    const rows = classChoiceNames(key).map(choice => {
      const option = list.find(item => item.name === choice || item.dragon === choice || item.id === choice) || {};
      return featureRowHtml({ name: option.id === choice ? option.name : spellDetails[choice]?.name || choice, summary: option.summary || (option.damage ? `${option.damage} damage, ${option.breath || ""}`.trim() : ""), chips: [option.source ? [option.source] : null, option.cost ? [option.cost] : option.ki ? [`${option.ki} ki`] : null, option.prereq ? [option.prereq] : null] });
    });
    return rows.length ? `<section class="feature-group"><h3>${escapeHtml(CLASS_CHOICE_LABELS[key] || key)}</h3>${rows.join("")}</section>` : "";
  }).filter(Boolean);
  groups.push(...choices);
  root.innerHTML = groups.join("");
}
