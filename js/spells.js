let allSpells = mergeSpellLists(FALLBACK_SPELLS, LOCAL_SPELL_INDEX);
let spellDetails = Object.fromEntries(LOCAL_SPELLS.map(detail => [detail.index, detail]));
const expandedSpellRows = new Set();

function spellSummaryHtml(row) {
  if (!spellRowHasSpell(row)) return `<span class="muted">Pick a spell to see its summary.</span>`;
  const level = spellLevelForRow(row);
  const detail = row.custom || spellDetails[row.index] || {};
  const text = [detail.desc].flat().filter(Boolean).join(" ");
  // ponytail: save type and damage dice scraped from the description with regexes; matches SRD phrasing, misses exotic wording
  const save = spellSaveAbility(text);
  const attack = /spell attack/i.test(text);
  const dice = spellEffectRoll(row, level)?.chip || text.match(/\b\d+d\d+\b/)?.[0];
  const cast = castingShorthand(row.custom ? row.custom.castingTime : detail.casting_time);
  const concentration = row.custom ? /concentration/i.test(row.custom.duration || "") : detail.concentration;
  const parts = [
    level === 0 ? "Cantrip" : ordinal(level),
    cast,
    save ? `${save.slice(0, 3).toUpperCase()} save` : attack ? "Spell attack" : "No save",
    dice || "",
    concentration ? "C" : "",
    detail.ritual ? "R" : ""
  ].filter(Boolean);
  return `<strong class="spell-print-name">${escapeHtml(spellDisplayName(row))}</strong>` +
    parts.map(part => `<span title="${escapeHtml(CAST_SHORTHAND_TITLES[part] || "")}">${escapeHtml(part)}</span>`).join("");
}

// Only the saves a target makes ("make a Wisdom saving throw", "Wisdom save or take"), not "advantage on Wisdom saving throws".
function spellSaveAbility(text) {
  const match = String(text).match(/(?:makes?|must make|succeeds? on|succeed on)\s+(?:an?\s+)?(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s+sav|(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s+save\s+or\b/i);
  return match ? match[1] || match[2] : "";
}

const CAST_SHORTHAND_TITLES = { A: "Action", B: "Bonus action", R: "Reaction", C: "Concentration" };

function castingShorthand(time) {
  const text = String(time || "").toLowerCase();
  if (!text) return "";
  if (text.includes("bonus")) return "B";
  if (text.includes("reaction")) return "R";
  if (text.includes("action")) return "A";
  return text.replace(/(\d+)\s*minutes?/, "$1 min").replace(/(\d+)\s*hours?/, "$1 hr");
}

function ensureSubclassSpells() {
  const grants = lookupBySubclass(SUBCLASS_SPELLS) || {};
  const entitled = new Set();
  Object.entries(grants).forEach(([grantLevel, indexes]) => {
    if (character.level >= Number(grantLevel)) indexes.forEach(index => entitled.add(index));
  });
  const granted = new Set(character.autoSpells || []);
  let changed = false;
  granted.forEach(index => {
    if (entitled.has(index)) return;
    granted.delete(index);
    // Only rows the grant created leave; a copy the player added stays with its own prepared flag.
    character.spells = character.spells.filter(row => row.index !== index || !row.auto);
    changed = true;
  });
  const known = new Set(character.spells.map(row => row.index).filter(Boolean));
  entitled.forEach(index => {
    if (granted.has(index) && known.has(index)) return;
    const spellInfo = allSpells.find(item => item.index === index);
    if (!spellInfo) return;
    granted.add(index);
    changed = true;
    if (!known.has(index)) {
      character.spells.push({ id: crypto.randomUUID(), index, level: spellInfo.level, prepared: spellInfo.level > 0, auto: true });
      known.add(index);
    }
  });
  if (changed) {
    character.autoSpells = Array.from(granted);
    persist();
  }
}

function ensureItemSpells() {
  const wanted = new Map();
  (character.equipment || []).forEach(item => {
    if (item.grantSpell) wanted.set(item.id, item.grantSpell);
  });
  let changed = false;
  character.spells = character.spells.filter(row => {
    if (!row.itemId) return true;
    if (wanted.get(row.itemId) === row.index) {
      wanted.delete(row.itemId);
      return true;
    }
    changed = true;
    return false;
  });
  wanted.forEach((index, itemId) => {
    const spellInfo = allSpells.find(item => item.index === index);
    if (!spellInfo) return;
    character.spells.push({ id: crypto.randomUUID(), index, level: spellInfo.level, prepared: false, itemId });
    changed = true;
  });
  if (changed) persist();
}

function itemForSpellRow(row) {
  return row.itemId ? (character.equipment || []).find(item => item.id === row.itemId) : null;
}

function renderSpells() {
  ensureSubclassSpells();
  ensureItemSpells();
  const cls = currentClass();
  const ability = cls.spellAbility;
  const spellMod = ABILITIES.some(([id]) => id === ability) ? mod(ability) : 0;
  const knownCaster = cls.preparedFormula === "known";
  const preparedLimit = preparedLimitFor(cls);
  const preparedUsed = knownCaster ? knownSpellCount() : preparedSpellCount();
  document.querySelector("#preparedLabel").textContent = knownCaster ? "Known" : "Prepared";
  document.querySelector("#spellRows").classList.toggle("known-caster", knownCaster);
  const over = preparedUsed - preparedLimit;
  const warning = document.querySelector("#preparedWarning");
  warning.hidden = over <= 0;
  warning.textContent = over > 0 ? `${over} ${knownCaster ? "known" : "prepared"} spell${over === 1 ? "" : "s"} over your limit of ${preparedLimit}.` : "";
  document.querySelector("#spellAbility").textContent = ability === "none" ? "-" : ability.toUpperCase();
  document.querySelector("#spellDc").textContent = ability === "none" ? "-" : 8 + proficiencyBonus() + spellMod;
  document.querySelector("#spellAttack").textContent = ability === "none" ? "-" : formatMod(proficiencyBonus() + spellMod);
  document.querySelector("#preparedCount").textContent = `${preparedUsed} / ${preparedLimit}`;
  document.querySelector("#preparedCount").style.color = preparedUsed > preparedLimit ? "var(--accent)" : "inherit";
  setValue("concentrationInput", character.concentration || "");
  renderPrepSuggestions();
  renderSlots(cls);
  renderSpellRows();
  document.body.classList.toggle("is-caster", cls.casterType !== "none" || character.spells.some(spellRowHasSpell));
  renderCombatSpells(cls);
}

// The Combat tab lists only spells you can cast right now: cantrips, prepared, always-prepared, known, and item spells.
function renderCombatSpells(cls) {
  const preparedCaster = ["levelPlusMod", "halfLevelPlusMod"].includes(cls.preparedFormula);
  const ready = character.spells
    .filter(row => spellRowHasSpell(row))
    .map(row => ({ row, level: spellLevelForRow(row) }))
    .filter(({ row, level }) => level === 0 || row.itemId || !preparedCaster || row.prepared || spellAlwaysPrepared(row))
    .sort((a, b) => a.level - b.level || spellDisplayName(a.row).localeCompare(spellDisplayName(b.row)));
  document.querySelector("#combatSpells").innerHTML = ready.length ? ready.map(({ row, level }) => {
    const state = quickCastState(row, level);
    return `
      <div class="combat-spell" data-spell-id="${row.id}">
        <div>
          <strong>${escapeHtml(spellDisplayName(row))}</strong>
          <span class="spell-summary">${spellSummaryHtml(row)}</span>
        </div>
        ${state ? `<button type="button" class="secondary cast-spell" ${state.disabled ? "disabled" : ""} title="${escapeHtml(state.title)}">${escapeHtml(state.label)}</button>` : ""}
      </div>`;
  }).join("") : `<p class="empty-state">No spells ready. Pick and prepare spells in the Spells tab.</p>`;
}

function renderSlots(cls) {
  const slots = spellSlotsFor(cls, character.level);
  const slotGrid = document.querySelector("#slotGrid");
  if (!slots.length) {
    slotGrid.innerHTML = `<div class="slot"><span>Slots</span><strong>-</strong></div>`;
    return;
  }
  slotGrid.innerHTML = slots.map((count, index) => ({ count, level: index + 1 }))
    .filter(item => item.count > 0)
    .map(item => `
    <div class="slot slot-tracker">
      <span>${ordinal(item.level)}</span>
      <strong>${slotRemaining(item.level, item.count)} / ${item.count}</strong>
      <div>
        <button type="button" class="ghost" data-slot-level="${item.level}" data-slot-delta="-1">Use</button>
        <button type="button" class="ghost" data-slot-level="${item.level}" data-slot-delta="1">Restore</button>
      </div>
    </div>
  `).join("");
}

function slotRemaining(level, max) {
  const used = Number(character.spellSlotUsage?.[level] || 0);
  return Math.max(0, Number(max || 0) - used);
}

function handleSlotUsageClick(event) {
  const button = event.target.closest("[data-slot-level]");
  if (!button) return;
  const level = button.dataset.slotLevel;
  const delta = Number(button.dataset.slotDelta);
  const max = spellSlotsFor(currentClass(), character.level)[Number(level) - 1] || 0;
  const currentUsed = Number(character.spellSlotUsage[level] || 0);
  character.spellSlotUsage[level] = clamp(currentUsed - delta, 0, max);
  persistAndRender();
}

function handleSpellCastClick(event) {
  const button = event.target.closest(".cast-spell");
  if (!button) return;
  const row = spellRowForElement(button);
  if (row) castSpellRow(row);
}

function castSpellRow(row, force = false) {
  if (!spellRowHasSpell(row)) return;
  const name = spellDisplayName(row);
  const baseLevel = spellLevelForRow(row);
  const grantingItem = itemForSpellRow(row);
  const cls = currentClass();
  if (!grantingItem && baseLevel > 0 && ["levelPlusMod", "halfLevelPlusMod"].includes(cls.preparedFormula) && !row.prepared && !spellAlwaysPrepared(row)) {
    showToast(`<span class="toast-label">${escapeHtml(name)} isn't prepared</span><span>Tick Prepared on its row to cast it.</span>`);
    return;
  }
  const concentration = spellConcentrationLabel(row);
  if (!force && concentration && character.concentration && character.concentration !== concentration) {
    showToast(`<span class="toast-label">Concentrating on ${escapeHtml(character.concentration)}</span><span>Casting ${escapeHtml(concentration)} ends it.</span>`, {
      actions: [{ label: "Cast anyway", run: () => castSpellRow(row, true) }],
      duration: 10000
    });
    return;
  }
  let castLevel = baseLevel;
  let status = "Cantrip";
  if (grantingItem) {
    const uses = Number(grantingItem.grantUses || 0);
    if (uses && Number(grantingItem.grantUsed || 0) >= uses) return;
    if (uses) grantingItem.grantUsed = Number(grantingItem.grantUsed || 0) + 1;
    status = uses ? `${uses - grantingItem.grantUsed} of ${uses} ${grantingItem.name} use${uses === 1 ? "" : "s"} left` : `From ${grantingItem.name}`;
  } else if (baseLevel > 0) {
    castLevel = Number(row.castLevel || baseLevel);
    const max = spellSlotsFor(cls, character.level)[castLevel - 1] || 0;
    const used = Number(character.spellSlotUsage?.[castLevel] || 0);
    if (!max || used >= max) return;
    character.spellSlotUsage[castLevel] = used + 1;
    row.castLevel = castLevel;
    const left = max - used - 1;
    status = `${left} ${ordinal(castLevel)}-level slot${left === 1 ? "" : "s"} left`;
  }
  const previousConcentration = character.concentration;
  if (concentration) character.concentration = concentration;
  persistAndRender();
  const undo = () => {
    if (grantingItem) grantingItem.grantUsed = Math.max(0, Number(grantingItem.grantUsed || 0) - 1);
    else if (baseLevel > 0) character.spellSlotUsage[castLevel] = Math.max(0, Number(character.spellSlotUsage[castLevel] || 0) - 1);
    character.concentration = previousConcentration;
    persistAndRender();
    showToast(`<span class="toast-label">${escapeHtml(name)} cast undone</span>`);
  };
  const effect = spellEffectRoll(row, castLevel);
  const actions = [];
  if (effect?.attack) {
    actions.push({ label: `Roll attack (${formatMod(effect.attack.bonus)})${effect.attack.times > 1 ? ` ×${effect.attack.times}` : ""}`, run: () => rollSpellAttack(name, effect.attack.bonus) });
  }
  if (effect) actions.push({ label: `${effect.label} (${effect.formula})`, run: () => rollSpellEffect(name, effect) });
  actions.push({ label: "Undo", run: undo });
  showToast(`<span class="toast-label">Cast ${escapeHtml(name)}${castLevel > baseLevel ? ` at ${ordinal(castLevel)} level` : ""}</span><span>${escapeHtml(status)}${concentration ? " · concentrating" : ""}</span>`, { actions, duration: 10000 });
}

function rollSpellAttack(name, bonus) {
  const reason = conditionDisadvantage("attack");
  const mode = reason ? "disadvantage" : document.querySelector("#rollMode").value;
  rollFromInput(`${name} spell attack${reason ? ` (${reason})` : ""}`, `1d20${formatMod(bonus)}`, mode);
}

function rollSpellEffect(name, effect) {
  const followUp = effect.kind === "healing"
    ? result => [{ label: `Apply +${result.total} HP`, run: () => healBy(result.total) }]
    : [];
  rollFromInput(`${name} ${effect.kind}`, effect.formula, "normal", followUp);
}

const NUMBER_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5 };

// ponytail: reads dice, flat bonuses, darts/rays/beams, upcasting and cantrip scaling from SRD-style spell text
function spellEffectRoll(row, castLevel) {
  const detail = row.custom || spellDetails[row.index] || {};
  const text = [detail.desc].flat().filter(Boolean).join(" ");
  const higher = [detail.higher_level].flat().filter(Boolean).join(" ");
  const base = text.match(/\b(\d+)d(\d+)(?:\s*\+\s*(\d+)(?!d))?/);
  if (!base) return null;
  const sides = Number(base[2]);
  let count = Number(base[1]);
  let flat = Number(base[3] || 0);
  const baseLevel = spellLevelForRow(row);
  const upcast = Math.max(0, castLevel - baseLevel);
  const projectileMatch = text.match(/\b(two|three|four|five|\d+)\s+(?:glowing\s+)?(darts|rays|beams|bolts)\b/i);
  let projectiles = projectileMatch ? NUMBER_WORDS[projectileMatch[1].toLowerCase()] || Number(projectileMatch[1]) : 1;
  const noun = projectileMatch ? projectileMatch[2].toLowerCase() : "";
  if (projectileMatch && /one (?:more|additional) (dart|ray|beam|bolt)/i.test(higher)) projectiles += upcast;
  const perSlot = higher.match(/(\d+)d(\d+)\s+for each slot level above/i);
  if (perSlot && Number(perSlot[2]) === sides && upcast) count += Number(perSlot[1]) * upcast;
  const tiers = [5, 11, 17].filter(level => character.level >= level).length;
  let beams = 0;
  if (baseLevel === 0 && /more than one beam/i.test(`${text} ${higher}`)) beams = 1 + tiers;
  else if (baseLevel === 0 && /5th level/i.test(`${text} ${higher}`)) count *= 1 + tiers;
  const healing = /regains?\s+(a number of\s+)?hit points/i.test(text);
  const ability = currentClass().spellAbility;
  const modifier = /spellcasting ability modifier/i.test(text) && ABILITIES.some(([id]) => id === ability) ? mod(ability) : 0;
  const attack = /spell attack/i.test(text);
  const each = `${count}d${sides}${flat + modifier ? formatMod(flat + modifier) : ""}`;
  // Darts that always hit roll as one total; rays and beams roll per attack.
  const autoHit = projectiles > 1 && !attack;
  const formula = autoHit ? `${count * projectiles}d${sides}${flat * projectiles + modifier ? formatMod(flat * projectiles + modifier) : ""}` : each;
  const multiple = beams > 1 ? `${beams} beams` : projectiles > 1 && attack ? `${projectiles} ${noun}` : "";
  return {
    formula,
    chip: multiple ? `${each} ×${beams || projectiles}` : formula,
    kind: healing ? "healing" : "damage",
    label: healing ? "Roll healing" : multiple ? `Roll damage per ${noun.replace(/s$/, "") || "beam"}` : "Roll damage",
    attack: attack ? { bonus: proficiencyBonus() + (ABILITIES.some(([id]) => id === ability) ? mod(ability) : 0), times: beams || projectiles } : null
  };
}

function spellRowForElement(element) {
  const node = element.closest("[data-spell-id]");
  return node ? character.spells.find(row => row.id === node.dataset.spellId) : null;
}

function spellConcentrationLabel(row) {
  if (row.custom) return /concentration/i.test(`${row.custom.duration || ""} ${row.custom.desc || ""}`) ? row.custom.name || "Custom spell" : "";
  const detail = spellDetails[row.index];
  return detail?.concentration ? detail.name : "";
}

function renderSpellRows() {
  const root = document.querySelector("#spellRows");
  const template = document.querySelector("#spellRowTemplate");
  root.innerHTML = "";
  visibleSpellLevels().forEach(level => {
    const section = document.createElement("section");
    section.className = "spell-section";
    const rows = character.spells.filter(row => spellLevelForRow(row) === level);
    const cap = level === 0 ? cantripCap() : null;
    if (level === 0 && !cap && !rows.length) return;
    const chosen = rows.filter(row => spellRowHasSpell(row) && !spellAlwaysPrepared(row)).length;
    section.innerHTML = `
      <div class="spell-section-head">
        <div>
          <h3>${spellLevelLabel(level)}</h3>
          <span class="${cap !== null && chosen > cap ? "over-cap" : ""}">${cap ? `${chosen} / ${cap} known${chosen > cap ? ` · ${chosen - cap} over` : ""}` : `${chosen} selected`}</span>
        </div>
        <button type="button" class="ghost" data-add-spell-level="${level}">${icon("plus")}${level === 0 ? "Cantrip" : "Spell"}</button>
      </div>
      <div class="spell-section-body"></div>
    `;
    const body = section.querySelector(".spell-section-body");
    if (!rows.length) {
      body.innerHTML = `<p class="empty-state">No ${spellLevelLabel(level).toLowerCase()} selected.</p>`;
    }
    rows.forEach(row => {
      const node = template.content.firstElementChild.cloneNode(true);
      node.dataset.spellId = row.id;
      const select = node.querySelector(".spell-select");
      const prepared = node.querySelector(".prepared-toggle");
      const remove = node.querySelector(".remove-spell");
      fillSpellSelect(select, spellSelectValue(row), spellChoices(row.index, level));
      node.querySelector(".spell-summary").innerHTML = spellSummaryHtml(row);
      const expand = node.querySelector(".spell-expand");
      const syncExpand = () => {
        const open = expandedSpellRows.has(row.id);
        node.classList.toggle("is-expanded", open);
        expand.setAttribute("aria-expanded", String(open));
      };
      syncExpand();
      expand.addEventListener("click", () => {
        expandedSpellRows.has(row.id) ? expandedSpellRows.delete(row.id) : expandedSpellRows.add(row.id);
        syncExpand();
      });
      const always = spellAlwaysPrepared(row);
      const grantingItem = itemForSpellRow(row);
      const quick = node.querySelector(".quick-cast");
      const quickState = quickCastState(row, level);
      quick.style.visibility = quickState ? "visible" : "hidden";
      if (quickState) {
        quick.textContent = quickState.label;
        quick.disabled = quickState.disabled;
        quick.title = quickState.title;
      }
      prepared.checked = always || (level > 0 && row.prepared && !grantingItem);
      prepared.disabled = level === 0 || always || Boolean(grantingItem);
      if (level === 0) prepared.closest("label").classList.add("is-disabled");
      if (always) {
        const label = prepared.closest("label");
        label.classList.add("is-always");
        label.lastChild.textContent = row.racial ? ` From ${character.species || "species"}` : " Always prepared";
        remove.style.display = "none";
        select.disabled = true;
      }
      if (grantingItem) {
        const label = prepared.closest("label");
        label.classList.add("is-always");
        label.lastChild.textContent = ` From ${grantingItem.name || "item"}`;
        select.disabled = true;
        remove.style.display = "none";
      }
      select.addEventListener("change", () => {
        if (select.value === CUSTOM_SPELL_VALUE) {
          expandedSpellRows.add(row.id);
          row.index = "";
          row.custom = {
            name: row.custom?.name || "",
            level,
            castingTime: row.custom?.castingTime || "",
            range: row.custom?.range || "",
            duration: row.custom?.duration || "",
            components: row.custom?.components || "",
            desc: row.custom?.desc || ""
          };
        } else {
          row.index = select.value;
          delete row.custom;
        }
        row.level = level;
        row.prepared = level > 0 && row.prepared;
        persistAndRender();
        if (row.index) loadSpellDetail(row.index);
      });
      prepared.addEventListener("change", () => {
        row.prepared = prepared.checked;
        persistAndRender();
      });
      remove.addEventListener("click", () => {
        character.spells = character.spells.filter(item => item.id !== row.id);
        persistAndRender();
      });
      renderCustomSpellEditor(node, row, level);
      renderSpellCard(node.querySelector(".spell-card"), row);
      body.appendChild(node);
    });
    root.appendChild(section);
  });
}

function fillSpellSelect(select, currentValue, choices = spellChoices(currentValue)) {
  const sameLevel = choices.length > 0 && choices.every(item => item.level === choices[0].level);
  select.innerHTML = `<option value="">Choose spell...</option><option value="${CUSTOM_SPELL_VALUE}">Custom spell...</option>` + choices
    .map(item => `<option value="${escapeHtml(item.index)}">${escapeHtml(item.name)}${sameLevel ? "" : ` (${item.level === 0 ? "Cantrip" : ordinal(item.level)})`}</option>`)
    .join("");
  select.value = currentValue || "";
}

function spellChoices(currentIndex = "", level = null) {
  const cls = currentClass();
  const selected = new Set(character.spells.map(row => row.index).filter(Boolean));
  if (currentIndex) selected.delete(currentIndex);
  const includeAll = document.querySelector("#showAllSpells")?.checked;
  return allSpells
    .filter(item => currentIndex === item.index || !selected.has(item.index))
    .filter(item => currentIndex === item.index || includeAll || spellMatchesClass(item, cls))
    .filter(item => currentIndex === item.index || level === null || Number(level) === item.level)
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

function spellSelectValue(row) {
  return row.custom ? CUSTOM_SPELL_VALUE : row.index || "";
}

function spellRowHasSpell(row) {
  return Boolean(row.index || row.custom);
}

function spellLevelForRow(row) {
  if (row.custom && Number.isInteger(row.custom.level)) return row.custom.level;
  const spell = allSpells.find(item => item.index === row.index);
  if (spell && Number.isInteger(spell.level)) return spell.level;
  if (Number.isInteger(row.level)) return row.level;
  return 1;
}

function visibleSpellLevels() {
  const selectedLevels = character.spells.map(spellLevelForRow);
  const maxKnownLevel = Math.max(1, maxSpellLevelFor(currentClass(), character.level), ...selectedLevels);
  const levels = new Set([0, ...Array.from({ length: Math.min(9, maxKnownLevel) }, (_, index) => index + 1), ...selectedLevels]);
  return Array.from(levels).filter(level => level >= 0 && level <= 9).sort((a, b) => a - b);
}

function spellLevelLabel(level) {
  return level === 0 ? "Cantrips" : `${ordinal(level)} level`;
}

function spellMatchesClass(item, cls) {
  const sources = new Set(cls.spellSources || []);
  if (sources.has("artificer") && ARTIFICER_SPELLS.has(item.index)) return true;
  const grants = lookupBySubclass(SUBCLASS_SPELLS);
  if (grants && Object.values(grants).some(list => list.includes(item.index))) return true;
  if ((lookupBySubclass(EXPANDED_SUBCLASS_SPELLS) || []).includes(item.index)) return true;
  return (item.classes || []).some(classId => sources.has(classId));
}

function renderCustomSpellEditor(node, row, level) {
  const editor = node.querySelector(".custom-spell-fields");
  editor.classList.toggle("active", Boolean(row.custom));
  if (!row.custom) return;
  row.custom.level = level;
  const fields = {
    ".custom-spell-name": "name",
    ".custom-spell-casting": "castingTime",
    ".custom-spell-range": "range",
    ".custom-spell-duration": "duration",
    ".custom-spell-components": "components",
    ".custom-spell-desc": "desc"
  };
  Object.entries(fields).forEach(([selector, key]) => {
    const input = node.querySelector(selector);
    input.value = row.custom[key] || "";
    input.addEventListener("input", () => {
      row.custom[key] = input.value;
      row.custom.level = level;
      persist();
      renderSpellCard(node.querySelector(".spell-card"), row);
    });
  });
}

function renderSpellCard(card, rowOrIndex) {
  const row = typeof rowOrIndex === "object" ? rowOrIndex : { index: rowOrIndex };
  const baseLevel = spellLevelForRow(row);
  if (row.custom) {
    const custom = row.custom;
    card.innerHTML = `
      <strong>${escapeHtml(custom.name || "Custom spell")}</strong> ${spellLevelLabel(custom.level || row.level || 0)}
      <br>${escapeHtml(custom.castingTime || "Casting time")} · ${escapeHtml(custom.range || "Range")} · ${escapeHtml(custom.components || "Components")}
      <br>${escapeHtml(custom.duration || "Duration")}
      <br>${escapeHtml(truncate(custom.desc || "Enter the custom spell details above.", 320))}
      <br><span>Source: Custom / book copy</span>
      ${spellCastControls(row, baseLevel)}
    `;
    return;
  }
  const index = row.index;
  if (!index) {
    card.innerHTML = `<span>Select a spell to see casting details.</span>`;
    return;
  }
  const summary = allSpells.find(item => item.index === index);
  const detail = spellDetails[index];
  if (!detail) {
    card.innerHTML = `<strong>${escapeHtml(summary?.name || index)}</strong><br><span>Loading details...</span>`;
    loadSpellDetail(index);
    return;
  }
  const classes = (detail.classes || []).map(item => item.name || item).join(", ");
  const higher = [detail.higher_level].flat().filter(Boolean).join(" ");
  card.innerHTML = `
    <strong>${escapeHtml(detail.name)}</strong> ${detail.level === 0 ? "Cantrip" : ordinal(detail.level)}${detail.ritual ? " · Ritual" : ""}
    <br>${escapeHtml(detail.casting_time || "")} · ${escapeHtml(detail.range || "")} · ${escapeHtml((detail.components || []).join(", "))}${detail.material ? ` (${escapeHtml(detail.material)})` : ""}
    <br>${detail.concentration ? "Concentration · " : ""}${escapeHtml(detail.duration || "")}
    ${(detail.desc || []).map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join("")}
    ${higher ? `<p><strong>At higher levels.</strong> ${escapeHtml(higher)}</p>` : ""}
    <span>${detail.local ? "Original mechanical summary. Full text is in your sourcebook." : `Classes: ${escapeHtml(classes || "custom/homebrew")}`}</span>
    ${spellCastControls(row, detail.level ?? baseLevel)}
  `;
}

function clearConcentration() {
  character.concentration = "";
  persistAndRender();
}

function renderPrepSuggestions() {
  const mode = document.querySelector("#prepMode")?.value || "combat";
  const cls = currentClass();
  const limit = preparedLimitFor(cls);
  const have = new Set(character.spells.filter(row => row.prepared || spellAlwaysPrepared(row) || row.itemId).map(row => row.index));
  const known = allSpells.filter(spell => spellMatchesClass(spell, cls) && spell.level > 0 && spell.level <= maxSpellLevelFor(cls, character.level) && !have.has(spell.index));
  const preferred = PREP_SUGGESTIONS[mode] || [];
  const suggestions = [
    ...preferred.map(index => known.find(spell => spell.index === index)).filter(Boolean),
    ...known
  ];
  const unique = [];
  const seen = new Set();
  suggestions.forEach(spell => {
    if (!seen.has(spell.index) && unique.length < Math.max(3, limit || 5)) {
      seen.add(spell.index);
      unique.push(spell);
    }
  });
  document.querySelector("#prepSuggestions").innerHTML = unique.length
    ? unique.map(spell => `<button type="button" class="ghost" data-prep-add="${escapeHtml(spell.index)}" title="Add as a prepared spell">${icon("plus")}${escapeHtml(spell.name)}</button>`).join("")
    : `<span>No suggestions for this class yet.</span>`;
}

function spellCastControls(row, baseLevel = spellLevelForRow(row)) {
  if (!spellRowHasSpell(row)) return "";
  const grantingItem = itemForSpellRow(row);
  if (grantingItem) {
    const uses = Number(grantingItem.grantUses || 0);
    const left = uses ? Math.max(0, uses - Number(grantingItem.grantUsed || 0)) : Infinity;
    return `
      <div class="spell-cast-controls">
        <span>${escapeHtml(grantingItem.name || "Item")} · cast at base level, no slot</span>
        <button type="button" class="secondary cast-spell" ${uses && !left ? "disabled" : ""}>Cast</button>
        <em>${uses ? (left ? `${left} of ${uses} use${uses === 1 ? "" : "s"} left today` : "Spent. Recharges on a long rest.") : "At will"}</em>
      </div>
    `;
  }
  if (baseLevel === 0) {
    return `
      <div class="spell-cast-controls">
        <span>Cantrip</span>
        <button type="button" class="secondary cast-spell">Cast</button>
      </div>
    `;
  }
  const slots = spellSlotsFor(currentClass(), character.level);
  const options = castLevelOptions(baseLevel, slots);
  const selected = normalizeCastLevel(row, baseLevel, options);
  const remaining = slotRemaining(selected, slots[selected - 1] || 0);
  return `
    <div class="spell-cast-controls">
      <label>Cast at
        <select class="cast-level-select">
          ${options.map(level => `<option value="${level}" ${level === selected ? "selected" : ""}>${spellLevelLabel(level)} (${slotRemaining(level, slots[level - 1] || 0)} left)</option>`).join("")}
        </select>
      </label>
      <button type="button" class="secondary cast-spell" data-cast-level="${selected}" ${remaining <= 0 ? "disabled" : ""}>Cast</button>
      <em>${remaining > 0 ? `${remaining} slot${remaining === 1 ? "" : "s"} available` : "No slots left"}</em>
    </div>
  `;
}

function castLevelOptions(baseLevel, slots = spellSlotsFor(currentClass(), character.level)) {
  const options = slots
    .map((count, index) => ({ level: index + 1, count }))
    .filter(item => item.level >= baseLevel && item.count > 0)
    .map(item => item.level);
  return options.length ? options : [baseLevel];
}

function normalizeCastLevel(row, baseLevel, options) {
  const chosen = Number(row.castLevel || baseLevel);
  const selected = options.includes(chosen) ? chosen : options[0];
  row.castLevel = selected;
  return selected;
}

async function hydrateSpells() {
  const status = document.querySelector("#apiStatus");
  try {
    status.textContent = "Loading SRD spells...";
    const response = await fetch(`${API_BASE.replace("/api/2014", "")}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "{ spells(limit: 500) { index name level concentration ritual casting_time range duration material components desc higher_level classes { index name } } }" })
    });
    const payload = await response.json();
    const spells = payload?.data?.spells;
    if (!spells?.length) throw new Error("empty graphql response");
    applyHydratedSpells(spells);
  } catch (error) {
    hydrateSpellsRest();
  }
}

async function hydrateSpellsRest() {
  const status = document.querySelector("#apiStatus");
  try {
    const response = await fetch(`${API_BASE}/spells`);
    const data = await response.json();
    status.textContent = `Loading ${data.count} SRD spell records...`;
    const apiDetails = [];
    for (let start = 0; start < data.results.length; start += 40) {
      const chunk = data.results.slice(start, start + 40);
      const settled = await Promise.allSettled(chunk.map(item => fetch(`${API_BASE}/spells/${item.index}`).then(res => res.json())));
      settled.filter(result => result.status === "fulfilled").forEach(result => apiDetails.push(result.value));
    }
    if (!apiDetails.length) throw new Error("no spells loaded");
    applyHydratedSpells(apiDetails);
  } catch (error) {
    status.textContent = "Using bundled fallback spells. The live API was not reachable.";
  }
}

function applyHydratedSpells(details) {
  details.forEach(detail => {
    spellDetails[detail.index] = normalizeSpellDetail(detail);
  });
  const apiSpells = details.map(detail => ({
    index: detail.index,
    name: detail.name,
    level: detail.level,
    classes: (detail.classes || []).map(cls => cls.index)
  }));
  allSpells = mergeSpellLists([...apiSpells, ...LOCAL_SPELL_INDEX], FALLBACK_SPELLS);
  document.querySelector("#apiStatus").textContent = `Loaded ${allSpells.length} SRD spells from the 5e API.`;
  renderSpells();
}

async function loadSpellDetail(index) {
  if (!index || spellDetails[index]) return;
  try {
    const response = await fetch(`${API_BASE}/spells/${index}`);
    if (!response.ok) throw new Error(`spell ${index}: ${response.status}`);
    const detail = await response.json();
    spellDetails[index] = normalizeSpellDetail(detail);
    allSpells = allSpells.map(item => item.index === index ? {
      ...item,
      level: detail.level,
      classes: (detail.classes || []).map(cls => cls.index)
    } : item);
    renderSpells();
  } catch (error) {
    spellDetails[index] = allSpells.find(item => item.index === index) || { index, name: index, desc: [] };
    renderSpells();
  }
}

function normalizeSpellDetail(detail) {
  return {
    ...detail,
    classes: (detail.classes || []).map(cls => ({ ...cls, index: cls.index }))
  };
}

function mergeSpellLists(fallback, api) {
  const map = new Map();
  [...api, ...fallback].forEach(item => map.set(item.index, { ...map.get(item.index), ...item }));
  return Array.from(map.values());
}

function spellDisplayName(row) {
  if (row.custom) return row.custom.name || "Custom spell";
  return allSpells.find(spell => spell.index === row.index)?.name || String(row.index).replace(/-/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

function preparedSpellCount() {
  const always = new Set(character.autoSpells || []);
  return character.spells.filter(row => row.prepared && spellRowHasSpell(row) && spellLevelForRow(row) > 0 && !always.has(row.index)).length;
}

function spellAlwaysPrepared(row) {
  return Boolean(row.index) && (Boolean(row.racial) || (character.autoSpells || []).includes(row.index));
}

function knownSpellCount() {
  return character.spells.filter(row => spellRowHasSpell(row) && spellLevelForRow(row) > 0 && !spellAlwaysPrepared(row) && !row.itemId).length;
}

function quickCastState(row, level) {
  if (!spellRowHasSpell(row)) return null;
  const grantingItem = itemForSpellRow(row);
  if (grantingItem) {
    const uses = Number(grantingItem.grantUses || 0);
    const spent = uses && Number(grantingItem.grantUsed || 0) >= uses;
    return { label: "Cast", disabled: Boolean(spent), title: spent ? "Recharges on a long rest" : `From ${grantingItem.name}` };
  }
  if (level === 0) return { label: "Cast", disabled: false, title: "Cantrip" };
  const cls = currentClass();
  const preparedCaster = ["levelPlusMod", "halfLevelPlusMod"].includes(cls.preparedFormula);
  if (preparedCaster && !row.prepared && !spellAlwaysPrepared(row)) return { label: "Cast", disabled: true, title: "Prepare this spell to cast it" };
  const slots = spellSlotsFor(cls, character.level);
  const options = castLevelOptions(level, slots);
  let selected = normalizeCastLevel(row, level, options);
  if (slotRemaining(selected, slots[selected - 1] || 0) <= 0) {
    const open = options.find(option => slotRemaining(option, slots[option - 1] || 0) > 0);
    if (open) selected = row.castLevel = open;
  }
  const remaining = slotRemaining(selected, slots[selected - 1] || 0);
  return {
    label: `Cast ${ordinal(selected)}`,
    disabled: remaining <= 0,
    title: remaining > 0 ? `${remaining} ${ordinal(selected)}-level slot${remaining === 1 ? "" : "s"} left` : "No slots left at this level"
  };
}

function addSuggestedSpell(index) {
  const spell = allSpells.find(item => item.index === index);
  if (!spell) return;
  const existing = character.spells.find(row => row.index === index);
  if (existing) existing.prepared = true;
  else character.spells.push({ id: crypto.randomUUID(), index, level: spell.level, prepared: true });
  persistAndRender();
  loadSpellDetail(index);
  showToast(`<span class="toast-label">Prepared ${escapeHtml(spell.name)}</span><span>${preparedSpellCount()} of ${preparedLimitFor(currentClass())} prepared</span>`);
}
