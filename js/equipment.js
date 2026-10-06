function renderEquipment() {
  const root = document.querySelector("#equipmentRows");
  const template = document.querySelector("#equipmentRowTemplate");
  renderEquipmentCatalog();
  root.innerHTML = "";
  const items = character.equipment || [];
  if (!items.length) {
    root.innerHTML = `<p class="empty-state">No equipment tracked yet.</p>`;
  } else {
    items.forEach(item => {
      const node = template.content.firstElementChild.cloneNode(true);
      node.dataset.equipmentId = item.id;
      node.querySelector(".equipment-name").value = item.name || "";
      node.querySelector(".equipment-qty").value = item.quantity ?? 1;
      node.querySelector(".equipment-weight").value = item.weight ?? 0;
      node.querySelector(".equipment-container").value = item.container && item.container !== "equipped" ? item.container : "carried";
      node.querySelector(".equipment-equipped").checked = Boolean(item.equipped);
      node.querySelector(".equipment-attuned").checked = Boolean(item.attuned);
      node.querySelector(".equipment-notes").value = item.notes || "";
      // Only the chosen spell is rendered here; the full ~500-spell list fills in when the select gets focus.
      const grantSelect = node.querySelector(".equipment-grant-spell");
      const granted = allSpells.find(spell => spell.index === item.grantSpell);
      grantSelect.innerHTML = `<option value="">No spell</option>${granted ? grantSpellOptionHtml(granted) : ""}`;
      grantSelect.value = item.grantSpell || "";
      node.querySelector(".equipment-spell").open = Boolean(item.grantSpell);
      node.querySelector(".equipment-grant-uses").value = item.grantUses || "";
      const extra = equipmentItemActions(item);
      if (extra) node.insertAdjacentHTML("beforeend", extra);
      root.appendChild(node);
    });
  }
  renderEncumbrance();
  renderCurrency();
}

function grantSpellOptionHtml(spell) {
  return `<option value="${spell.index}">${escapeHtml(spell.name)} (${spell.level === 0 ? "Cantrip" : ordinal(spell.level)})</option>`;
}

function fillGrantSpellSelect(event) {
  const select = event.target;
  if (!select.classList?.contains("equipment-grant-spell") || select.dataset.filled) return;
  const value = select.value;
  select.innerHTML = `<option value="">No spell</option>` + allSpells.slice().sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)).map(grantSpellOptionHtml).join("");
  select.value = value;
  select.dataset.filled = "1";
}

function renderEncumbrance() {
  const total = equipmentWeight();
  const capacity = carryingCapacity();
  const level = encumbranceLevel();
  const attuned = (character.equipment || []).filter(item => item.attuned).length;
  const percent = capacity ? Math.min(100, Math.round((total / capacity) * 100)) : 0;
  const status = {
    over: total > 2 * capacity ? "Over push/drag limit: can't move it" : "Over capacity: speed 5 ft",
    heavy: "Heavily encumbered (variant): -20 ft, disadvantage on STR/DEX/CON rolls",
    encumbered: "Encumbered (variant): -10 ft",
    ok: "Comfortable"
  }[level];
  const bag = bagOfHoldingWeight();
  const bagNote = bag > 500 ? ` · Bag of holding over 500 lb (${formatWeight(bag)} lb)` : "";
  document.querySelector("#encumbranceSummary").textContent = `${formatWeight(total)} / ${capacity} lb · ${status} · push/drag/lift ${2 * capacity} lb · ${attuned}/${attunementLimit()} attuned${bagNote}`;
  document.querySelector("#encumbranceFill").style.width = `${percent}%`;
  document.querySelector("#encumbranceFill").dataset.state = level === "over" ? "over" : level === "ok" ? "ok" : "heavy";
}

// "over" past carrying capacity; with variant encumbrance, "heavy" past STR x 10 and "encumbered" past STR x 5 (PHB p.176).
function encumbranceLevel(source = character) {
  const total = equipmentWeight(source);
  const capacity = carryingCapacity(source);
  if (total > capacity) return "over";
  if (!optionalRule("variantEncumbrance", source)) return "ok";
  const step = capacity / 3;
  return total > 2 * step ? "heavy" : total > step ? "encumbered" : "ok";
}

function heavilyEncumbered(source = character) {
  return ["heavy", "over"].includes(encumbranceLevel(source)) && optionalRule("variantEncumbrance", source);
}

// Speed after carried weight: variant -10/-20 ft, and 5 ft while dragging more than you can carry.
function encumberedSpeed(speed, notes, source = character) {
  const level = encumbranceLevel(source);
  if (level === "over") {
    notes.push(equipmentWeight(source) > 2 * carryingCapacity(source) ? "0 ft: over push/drag limit" : "5 ft: over carrying capacity");
    return equipmentWeight(source) > 2 * carryingCapacity(source) ? 0 : Math.min(speed, 5);
  }
  if (level === "heavy") notes.push("-20 ft heavily encumbered");
  if (level === "encumbered") notes.push("-10 ft encumbered");
  return Math.max(0, speed - ({ heavy: 20, encumbered: 10 }[level] || 0));
}

function bagOfHoldingWeight(source = character) {
  return (source.equipment || []).filter(item => item.container === "bagOfHolding")
    .reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.weight || 0), 0);
}

// Magic Item Adept/Savant/Master (artificer 10/14/18) raise the attunement limit to 4/5/6.
function attunementLimit(source = character) {
  const level = classLevel("artificer", source);
  return level >= 18 ? 6 : level >= 14 ? 5 : level >= 10 ? 4 : 3;
}

// "Requires attunement by a cleric or paladin": the classes (or "spellcaster") that may attune. Empty = anyone.
function attunementRequirementProblem(item) {
  const wanted = String(item.notes || "").match(/requires attunement by (?:an? )?([^.(]+)/i)?.[1];
  // Magic Item Savant (artificer 14) ignores class, race, spell and level requirements.
  if (!wanted || classLevel("artificer") >= 14) return "";
  const options = wanted.split(/,| or /).map(text => text.trim().replace(/^(?:an?|the) /i, "").toLowerCase()).filter(Boolean);
  const classes = classEntries().map(entry => String(getClasses()[entry.classId]?.name || entry.classId).toLowerCase());
  const caster = characterMaxSpellLevel() > 0 || (character.spells || []).some(spellRowHasSpell);
  const met = options.some(option => classes.includes(option) || (option === "spellcaster" && caster)
    || String(character.species || "").toLowerCase().includes(option));
  return met ? "" : `${item.name} can only be attuned by ${wanted.trim()}.`;
}

// Cursed items can't be unattuned until the curse is lifted (DMG p.138-139).
function itemCursed(item) {
  return Boolean(item.cursed) || /\bcursed\b/i.test(item.notes || "");
}

function renderCurrency() {
  const coins = character.currency || {};
  setValue("coinCp", coins.cp || 0);
  setValue("coinSp", coins.sp || 0);
  setValue("coinEp", coins.ep || 0);
  setValue("coinGp", coins.gp || 0);
  setValue("coinPp", coins.pp || 0);
  const gp = (Number(coins.cp || 0) / 100) + (Number(coins.sp || 0) / 10) + (Number(coins.ep || 0) / 2) + Number(coins.gp || 0) + (Number(coins.pp || 0) * 10);
  document.querySelector("#coinSummary").textContent = `${formatWeight(gp)} gp`;
}

function addEquipment() {
  character.equipment.push({ id: crypto.randomUUID(), name: "New Item", quantity: 1, weight: 0, equipped: false, attuned: false, notes: "" });
  persistAndRender();
}

function renderEquipmentCatalog() {
  const select = document.querySelector("#equipmentCatalogSelect");
  if (!select) return;
  const current = select.value;
  fillSelect(select, ITEM_CATALOG.map(item => [item.index, `${item.name} (${item.type}${item.cost ? `, ${item.cost}` : ""})`]));
  if (ITEM_CATALOG.some(item => item.index === current)) select.value = current;
}

function addCatalogEquipment() {
  const item = ITEM_CATALOG.find(entry => entry.index === document.querySelector("#equipmentCatalogSelect").value);
  if (!item) return;
  // The same item again stacks onto its row (attunement items stay separate: each is attuned on its own).
  const stack = !/attunement/i.test(item.notes || "") && character.equipment.find(entry => String(entry.name).toLowerCase() === item.name.toLowerCase());
  if (stack) stack.quantity = Number(stack.quantity || 0) + 1;
  else character.equipment.push(equipmentFromItemCard(item));
  persistAndRender();
}

function handleEquipmentInput(event) {
  const row = event.target.closest(".equipment-row");
  if (!row) return;
  const item = character.equipment.find(entry => entry.id === row.dataset.equipmentId);
  if (!item) return;
  if (event.target.classList.contains("equipment-name")) item.name = event.target.value;
  if (event.target.classList.contains("equipment-qty")) item.quantity = clamp(Number(event.target.value), 0, 999);
  if (event.target.classList.contains("equipment-weight")) item.weight = Math.max(0, Number(event.target.value) || 0);
  if (event.target.classList.contains("equipment-container")) item.container = event.target.value;
  if (event.target.classList.contains("equipment-equipped") || event.target.classList.contains("equipment-container")) {
    // Equipping keeps the item where it is carried (the checkbox is the only equip control).
    if (event.target.classList.contains("equipment-equipped")) item.equipped = event.target.checked;
    persistAndRender();
    return;
  }
  if (event.target.classList.contains("equipment-attuned")) {
    changeAttunement(item, event.target);
    return;
  }
  if (event.target.classList.contains("equipment-notes")) item.notes = event.target.value;
  if (event.target.classList.contains("equipment-grant-spell")) {
    item.grantSpell = event.target.value;
    item.grantUsed = 0;
    persistAndRender();
    return;
  }
  if (event.target.classList.contains("equipment-grant-uses")) {
    item.grantUses = clamp(Number(event.target.value), 0, 99);
    persistAndRender();
    return;
  }
  persist();
  renderEncumbrance();
}

function handleEquipmentClick(event) {
  const itemAction = event.target.closest("[data-item-action]");
  if (itemAction) {
    const item = character.equipment.find(entry => entry.id === itemAction.closest(".equipment-row")?.dataset.equipmentId);
    if (item) ({ eat: eatGoodberry, feed: feedGoodberry, scribe: copyScrollIntoSpellbook })[itemAction.dataset.itemAction]?.(item);
    return;
  }
  const button = event.target.closest(".remove-equipment");
  if (!button) return;
  const row = button.closest(".equipment-row");
  character.equipment = character.equipment.filter(item => item.id !== row.dataset.equipmentId);
  persistAndRender();
}

// Buttons under an inventory row: Eat/Feed for goodberries, Copy into spellbook for a wizard's spell scroll.
function equipmentItemActions(item) {
  const buttons = [];
  if (item.goodberry) {
    if (berriesSpoiled(item)) return `<div class="equipment-item-actions"><span class="item-flag is-bad">Spoiled. Removed on your next long rest.</span></div>`;
    const hours = Math.max(1, Math.ceil((Number(item.castAt) + GOODBERRY_LIFE - Date.now()) / 3600000));
    buttons.push(`<span class="item-flag">Fresh for ${hours} h</span>`,
      `<button type="button" class="secondary" data-item-action="eat">Eat (heal 1)</button>`,
      `<button type="button" class="secondary" data-item-action="feed">Feed an ally</button>`);
  }
  if (canCopyScroll(item)) buttons.push(`<button type="button" class="secondary" data-item-action="scribe">Copy into spellbook</button>`);
  return buttons.length ? `<div class="equipment-item-actions">${buttons.join("")}</div>` : "";
}

// Goodberry (PHB p.246): ten berries that each heal 1 HP and feed a creature for a day; they lose their potency
// 24 hours after the casting. The clock is real time from the cast.
const GOODBERRY_LIFE = 24 * 60 * 60 * 1000;

function goodberryItem(at = Date.now()) {
  const when = new Date(at).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" });
  return { id: crypto.randomUUID(), name: "Goodberries", quantity: 10, weight: 0, container: "carried", equipped: false, attuned: false, goodberry: true, castAt: at,
    notes: `Cast ${when}. Each berry heals 1 HP and is a day's food. They spoil 24 hours after the casting.` };
}

function berriesSpoiled(item, now = Date.now()) {
  return Boolean(item.goodberry) && now - Number(item.castAt || 0) >= GOODBERRY_LIFE;
}

function takeGoodberry(item) {
  if (berriesSpoiled(item) || Number(item.quantity ?? 1) < 1) return false;
  item.quantity = Number(item.quantity ?? 1) - 1;
  if (item.quantity <= 0) character.equipment = character.equipment.filter(entry => entry !== item);
  return true;
}

function eatGoodberry(item) {
  if (takeGoodberry(item)) healBy(1);
}

function feedGoodberry(item) {
  const actions = healTargets().map(ally => healTargetAction(ally, `Feed ${ally.name || "ally"} (+1)`, () => {
    if (!takeGoodberry(item)) return;
    persist();
    healOther(ally.sheetId, 1);
  }));
  showToast(`<span class="toast-label">Feed a goodberry</span><span>${actions.length ? `Give one of your ${Number(item.quantity ?? 1)} berries to an ally; it heals them 1 HP.` : "No party members on this device."}</span>`, { actions, duration: 15000, persist: true });
}

function equipmentFromItemCard(item) {
  return {
    id: crypto.randomUUID(),
    name: item.name,
    quantity: item.quantity || 1,
    weight: Number(item.weight || 0),
    // The bag itself weighs 15 lb wherever it is; only what's inside it stops counting.
    // A DM card sent "Equipped" arrives equipped and carried.
    container: item.container && item.container !== "equipped" ? item.container : "carried",
    equipped: item.container === "equipped",
    // Attuning takes a short rest, so a new item arrives unattuned (DMG p.138).
    attuned: false,
    cursed: Boolean(item.cursed),
    ...(item.magicBonus ? { magicBonus: Number(item.magicBonus) } : {}),
    notes: [item.type, item.rarity, item.notes].filter(Boolean).join(" - ")
  };
}

// PHB p.176: STR x 15, doubled per size above Medium and halved for Tiny. Powerful Build and Equine Build
// count as one size larger.
function carryingCapacity(source = character) {
  return Math.max(0, effectiveScore("str", source) * 15 * carrySizeFactor(source));
}

function carrySizeFactor(source = character) {
  const preset = SPECIES_PRESETS.find(([name]) => name === source.species);
  const steps = { Tiny: -1, Large: 1, Huge: 2, Gargantuan: 3 }[speciesSize(source.species || "")] || 0;
  const build = /powerful build|equine build/i.test(`${preset?.[2] || ""}\n${source.features || ""}`) ? 1 : 0;
  return steps + build < 0 ? 0.5 : 2 ** (steps + build);
}

// Carried gear plus coins (50 to the pound, PHB p.143). Bag of holding contents, mounts and home don't count.
function equipmentWeight(source = character) {
  const coins = Object.values(source.currency || {}).reduce((sum, count) => sum + Number(count || 0), 0);
  return coins / 50 + (source.equipment || []).reduce((sum, item) => {
    if (["bagOfHolding", "mount", "home"].includes(item.container)) return sum;
    return sum + (Number(item.quantity || 0) * Number(item.weight || 0));
  }, 0);
}

function changeAttunement(item, checkbox) {
  const attune = checkbox.checked;
  checkbox.checked = Boolean(item.attuned);
  if (!attune) {
    if (itemCursed(item)) {
      showToast(`<span class="toast-label">${escapeHtml(item.name)} won't let go</span><span>A curse binds you to it. Remove Curse (or similar magic) ends the attunement.</span>`, {
        tone: "fumble",
        actions: [{ label: "Curse lifted: end attunement", run: () => { item.cursed = false; item.notes = String(item.notes || "").replace(/\s*\bcursed\b\.?/i, ""); item.attuned = false; persistAndRender(); } }],
        persist: true
      });
      return;
    }
    item.attuned = false;
    persistAndRender();
    showToast(`<span class="toast-label">Attunement to ${escapeHtml(item.name)} ends</span><span>Ending it on purpose takes a short rest.</span>`, { actions: [{ label: "Undo", run: () => { item.attuned = true; persistAndRender(); } }] });
    return;
  }
  const attuned = character.equipment.filter(entry => entry.attuned && entry !== item).length;
  const limit = attunementLimit();
  const finish = () => {
    item.attuned = true;
    persistAndRender();
    showToast(`<span class="toast-label">Attuned to ${escapeHtml(item.name)}</span><span>Attuning takes a short rest spent focused on the item.${itemCursed(item) ? " It's cursed: you can't end this attunement until the curse is lifted." : ""}</span>`, {
      tone: itemCursed(item) ? "fumble" : "",
      actions: itemCursed(item) ? [] : [{ label: "Undo", run: () => { item.attuned = false; persistAndRender(); } }]
    });
  };
  const requirement = attunementRequirementProblem(item);
  const checkLimit = () => {
    // DMG p.138: no more than three attuned items at a time (more for a high-level artificer).
    if (attuned >= limit && !isRuleBroken("attunement-limit")) {
      breakRule("attunement-limit", `You're already attuned to ${limit} magic items, your limit. End an attunement first, or allow more.`, finish);
      return;
    }
    finish();
  };
  if (requirement && !isRuleBroken("attunement-requirement")) {
    breakRule("attunement-requirement", `${requirement} Attune anyway?`, checkLimit);
    return;
  }
  checkLimit();
}
