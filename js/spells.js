let allSpells = mergeSpellLists(FALLBACK_SPELLS, LOCAL_SPELL_INDEX);
let spellDetails = Object.fromEntries(LOCAL_SPELLS.map(detail => [detail.index, detail]));
const expandedSpellRows = new Set();

function spellSummaryHtml(row) {
  if (!spellRowHasSpell(row)) return `<span class="muted">Pick a spell to see its summary.</span>`;
  const level = spellLevelForRow(row);
  const detail = row.custom || spellDetails[row.index] || {};
  const text = [detail.desc].flat().filter(Boolean).join(" ");
  // ponytail: save type and damage dice scraped from the description with regexes; matches SRD phrasing, misses exotic wording
  const save = text.match(/(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s+sav/i)?.[1];
  const attack = /spell attack/i.test(text);
  const dice = text.match(/\b\d+d\d+\b/)?.[0];
  const cast = castingShorthand(row.custom ? row.custom.castingTime : detail.casting_time);
  const parts = [
    level === 0 ? "Cantrip" : ordinal(level),
    cast,
    save ? `${save.slice(0, 3).toUpperCase()} save` : attack ? "Spell attack" : "No save",
    dice || ""
  ].filter(Boolean);
  return parts.map(part => `<span title="${escapeHtml(CAST_SHORTHAND_TITLES[part] || "")}">${escapeHtml(part)}</span>`).join("");
}

const CAST_SHORTHAND_TITLES = { A: "Action", B: "Bonus action", R: "Reaction" };

function castingShorthand(time) {
  const text = String(time || "").toLowerCase();
  if (!text) return "";
  if (text.includes("bonus")) return "B";
  if (text.includes("reaction")) return "R";
  if (text.includes("action")) return "A";
  return text.replace(/(\d+)\s*minutes?/, "$1 min").replace(/(\d+)\s*hours?/, "$1 hr");
}

function ensureSubclassSpells() {
  const grants = SUBCLASS_SPELLS[slug(character.subclassName || "")] || {};
  const entitled = new Set();
  Object.entries(grants).forEach(([grantLevel, indexes]) => {
    if (character.level >= Number(grantLevel)) indexes.forEach(index => entitled.add(index));
  });
  const granted = new Set(character.autoSpells || []);
  let changed = false;
  granted.forEach(index => {
    if (entitled.has(index)) return;
    granted.delete(index);
    character.spells = character.spells.filter(row => row.index !== index);
    changed = true;
  });
  const known = new Set(character.spells.map(row => row.index).filter(Boolean));
  entitled.forEach(index => {
    if (granted.has(index)) return;
    const spellInfo = allSpells.find(item => item.index === index);
    if (!spellInfo) return;
    granted.add(index);
    changed = true;
    if (!known.has(index)) {
      character.spells.push({ id: crypto.randomUUID(), index, level: spellInfo.level, prepared: spellInfo.level > 0 });
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
  const preparedLimit = preparedLimitFor(cls);
  const preparedUsed = preparedSpellCount();
  document.querySelector("#spellAbility").textContent = ability === "none" ? "-" : ability.toUpperCase();
  document.querySelector("#spellDc").textContent = ability === "none" ? "-" : 8 + proficiencyBonus() + spellMod;
  document.querySelector("#spellAttack").textContent = ability === "none" ? "-" : formatMod(proficiencyBonus() + spellMod);
  document.querySelector("#preparedCount").textContent = `${preparedUsed} / ${preparedLimit}`;
  document.querySelector("#preparedCount").style.color = preparedUsed > preparedLimit ? "var(--accent)" : "inherit";
  setValue("concentrationInput", character.concentration || "");
  renderPrepSuggestions();
  renderSlots(cls);
  renderSpellRows();
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
  if (!row || !spellRowHasSpell(row)) return;
  const grantingItem = itemForSpellRow(row);
  if (grantingItem) {
    const uses = Number(grantingItem.grantUses || 0);
    if (uses && Number(grantingItem.grantUsed || 0) >= uses) return;
    if (uses) grantingItem.grantUsed = Number(grantingItem.grantUsed || 0) + 1;
    const itemConcentration = spellConcentrationLabel(row);
    if (itemConcentration) character.concentration = itemConcentration;
    persistAndRender();
    return;
  }
  const baseLevel = spellLevelForRow(row);
  if (baseLevel === 0) {
    const cantripConcentration = spellConcentrationLabel(row);
    if (cantripConcentration) {
      character.concentration = cantripConcentration;
      persistAndRender();
    }
    return;
  }
  const castLevel = Number(row.castLevel || button.dataset.castLevel || baseLevel);
  const slots = spellSlotsFor(currentClass(), character.level);
  const max = slots[castLevel - 1] || 0;
  const used = Number(character.spellSlotUsage?.[castLevel] || 0);
  if (!max || used >= max) return;
  character.spellSlotUsage[castLevel] = used + 1;
  row.castLevel = castLevel;
  const concentration = spellConcentrationLabel(row);
  if (concentration) character.concentration = concentration;
  persistAndRender();
}

function spellRowForElement(element) {
  const node = element.closest(".spell-row");
  return node ? character.spells.find(row => row.id === node.dataset.spellId) : null;
}

function spellConcentrationLabel(row) {
  if (row.custom?.desc?.toLowerCase().includes("concentration")) return row.custom.name || "Custom spell";
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
    section.innerHTML = `
      <div class="spell-section-head">
        <div>
          <h3>${spellLevelLabel(level)}</h3>
          <span>${rows.filter(spellRowHasSpell).length} selected</span>
        </div>
        <button type="button" class="ghost" data-add-spell-level="${level}">Add ${level === 0 ? "Cantrip" : "Spell"}</button>
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
        expand.textContent = open ? "▾" : "▸";
      };
      syncExpand();
      expand.addEventListener("click", () => {
        expandedSpellRows.has(row.id) ? expandedSpellRows.delete(row.id) : expandedSpellRows.add(row.id);
        syncExpand();
      });
      const always = spellAlwaysPrepared(row);
      const grantingItem = itemForSpellRow(row);
      prepared.checked = always || (level > 0 && row.prepared && !grantingItem);
      prepared.disabled = level === 0 || always || Boolean(grantingItem);
      if (level === 0) prepared.closest("label").classList.add("is-disabled");
      if (always) {
        const label = prepared.closest("label");
        label.classList.add("is-always");
        label.lastChild.textContent = " Always prepared";
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
  select.innerHTML = `<option value="">Choose spell...</option><option value="${CUSTOM_SPELL_VALUE}">Custom spell...</option>` + choices
    .map(item => `<option value="${item.index}">${item.name} (${item.level === 0 ? "Cantrip" : ordinal(item.level)})</option>`)
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
  return level === 0 ? "Cantrips" : `${ordinal(level)} Level`;
}

function spellMatchesClass(item, cls) {
  const sources = new Set(cls.spellSources || []);
  if (sources.has("artificer") && ARTIFICER_SPELLS.has(item.index)) return true;
  const subclassSlug = slug(character.subclassName || "");
  const grants = SUBCLASS_SPELLS[subclassSlug];
  if (grants && Object.values(grants).some(list => list.includes(item.index))) return true;
  if ((EXPANDED_SUBCLASS_SPELLS[subclassSlug] || []).includes(item.index)) return true;
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
    card.innerHTML = `<strong>${summary?.name || index}</strong><br><span>Loading details...</span>`;
    loadSpellDetail(index);
    return;
  }
  const classes = (detail.classes || []).map(item => item.name || item).join(", ");
  card.innerHTML = `
    <strong>${detail.name}</strong> ${detail.level === 0 ? "Cantrip" : ordinal(detail.level)}
    <br>${detail.casting_time || ""} · ${detail.range || ""} · ${(detail.components || []).join(", ")}
    <br>${detail.concentration ? "Concentration · " : ""}${detail.duration || ""}
    <br>${truncate((detail.desc || []).join(" "), 260)}
    <br><span>${detail.local ? "Original mechanical summary — full text in your sourcebook" : `API classes: ${classes || "custom/homebrew"}`}</span>
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
  const known = allSpells.filter(spell => spellMatchesClass(spell, cls) && spell.level > 0 && spell.level <= maxSpellLevelFor(cls, character.level));
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
    ? unique.map(spell => `<span>${escapeHtml(spell.name)}</span>`).join("")
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
        <em>${uses ? (left ? `${left} of ${uses} use${uses === 1 ? "" : "s"} left today` : "Spent — recharges on a long rest") : "At will"}</em>
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
      body: JSON.stringify({ query: "{ spells(limit: 500) { index name level concentration casting_time range duration material components desc higher_level classes { index name } } }" })
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
  return allSpells.find(spell => spell.index === row.index)?.name || row.index;
}

function preparedSpellCount() {
  const always = new Set(character.autoSpells || []);
  return character.spells.filter(row => row.prepared && spellRowHasSpell(row) && spellLevelForRow(row) > 0 && !always.has(row.index)).length;
}

function spellAlwaysPrepared(row) {
  return Boolean(row.index) && (character.autoSpells || []).includes(row.index);
}
