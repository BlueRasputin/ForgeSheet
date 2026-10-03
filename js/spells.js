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
  // Grant tiers give 1st- through 5th-level spells in order, so the level is known even before the spell list loads.
  const tierLevel = {};
  Object.keys(grants).map(Number).sort((a, b) => a - b).forEach((grantLevel, tier) => {
    grants[grantLevel].forEach(index => { tierLevel[index] = tier + 1; });
  });
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
    const level = allSpells.find(item => item.index === index)?.level ?? tierLevel[index] ?? 1;
    granted.add(index);
    changed = true;
    if (!known.has(index)) {
      character.spells.push({ id: crypto.randomUUID(), index, level, prepared: level > 0, auto: true });
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
  const slots = characterSpellSlots();
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
  const max = characterSpellSlots()[Number(level) - 1] || 0;
  const currentUsed = Number(character.spellSlotUsage[level] || 0);
  character.spellSlotUsage[level] = clamp(currentUsed - delta, Math.min(0, currentUsed), max);
  persistAndRender();
}

function handleSpellCastClick(event) {
  const button = event.target.closest(".cast-spell");
  if (!button) return;
  const row = spellRowForElement(button);
  if (row) castSpellRow(row);
}

// Casting asks before anything surprising: acting while incapacitated, casting in beast form,
// replacing or restarting concentration, or using a higher slot because the chosen level is spent.
function castSpellRow(row, confirmed = {}, overrideLevel = null) {
  if (!spellRowHasSpell(row)) return;
  const name = spellDisplayName(row);
  const baseLevel = spellLevelForRow(row);
  const grantingItem = itemForSpellRow(row);
  const cls = currentClass();
  const retry = flag => castSpellRow(row, { ...confirmed, [flag]: true }, overrideLevel);
  const ritual = ritualCastable(row);
  // Wizards can ritual-cast any ritual in their spellbook without preparing it (PHB p.114).
  const ritualOnly = !grantingItem && baseLevel > 0 && ["levelPlusMod", "halfLevelPlusMod"].includes(cls.preparedFormula) && !row.prepared && !spellAlwaysPrepared(row);
  if (ritualOnly && !(ritual && cls.id === "wizard")) {
    showToast(`<span class="toast-label">${escapeHtml(name)} isn't prepared</span><span>Tick Prepared on its row to cast it.</span>`);
    return;
  }
  if (!confirmed.incapacitated && blockedByIncapacitation(() => retry("incapacitated"))) return;
  if (!confirmed.rage && character.raging) {
    showToast(`<span class="toast-label">You're raging</span><span>You can't cast spells or concentrate on them while raging.</span>`, {
      tone: "fumble",
      actions: [{ label: "End rage and cast", run: () => { character.raging = false; retry("rage"); } }]
    });
    return;
  }
  if (ritual && !grantingItem && !confirmed.ritual && !confirmed.slot) {
    showToast(`<span class="toast-label">${escapeHtml(name)} is a ritual</span><span>As a ritual it takes 10 minutes longer and spends no slot.</span>`, {
      actions: [
        { label: "Cast as ritual", run: () => retry("ritual") },
        ...(ritualOnly ? [] : [{ label: "Spend a slot", run: () => retry("slot") }])
      ],
      duration: 12000
    });
    return;
  }
  if (!confirmed.wildShape && character.wildShape) {
    showToast(`<span class="toast-label">You're in beast form</span><span>Beasts can't cast spells (druids gain Beast Spells at 18th level).</span>`, {
      actions: [{ label: "Cast anyway", run: () => retry("wildShape") }]
    });
    return;
  }
  const concentration = spellConcentrationLabel(row);
  if (!confirmed.concentration && concentration && character.concentration) {
    const same = character.concentration === concentration;
    showToast(`<span class="toast-label">${same ? `Already concentrating on ${escapeHtml(concentration)}` : `Concentrating on ${escapeHtml(character.concentration)}`}</span><span>${same ? "Casting it again spends another slot and restarts the spell." : `Casting ${escapeHtml(concentration)} ends it.`}</span>`, {
      actions: [{ label: same ? "Cast again" : "Cast anyway", run: () => retry("concentration") }],
      duration: 10000
    });
    return;
  }
  let castLevel = baseLevel;
  let status = "Cantrip";
  const arcanum = !grantingItem && arcanumFor(row);
  if (confirmed.ritual) {
    status = "Ritual: 10 minutes longer, no slot spent";
  } else if (arcanum) {
    if (Number(arcanum.current) <= 0) {
      showToast(`<span class="toast-label">${escapeHtml(arcanum.name)} used</span><span>It recharges on a long rest.</span>`, { tone: "fumble" });
      return;
    }
    arcanum.current = Number(arcanum.current) - 1;
    status = `${arcanum.name}: recharges on a long rest`;
  } else if (grantingItem) {
    const uses = Number(grantingItem.grantUses || 0);
    if (uses && Number(grantingItem.grantUsed || 0) >= uses) {
      showToast(`<span class="toast-label">${escapeHtml(grantingItem.name)} is spent</span><span>It recharges on a long rest.</span>`);
      return;
    }
    if (uses) grantingItem.grantUsed = Number(grantingItem.grantUsed || 0) + 1;
    status = uses ? `${uses - grantingItem.grantUsed} of ${uses} ${grantingItem.name} use${uses === 1 ? "" : "s"} left` : `From ${grantingItem.name}`;
  } else if (baseLevel > 0) {
    const slots = characterSpellSlots();
    castLevel = overrideLevel || Number(row.castLevel || baseLevel);
    if (slotRemaining(castLevel, slots[castLevel - 1] || 0) <= 0) {
      const open = nearestOpenSlot(baseLevel, castLevel, slots);
      if (open) {
        showToast(`<span class="toast-label">No ${ordinal(castLevel)}-level slots left</span><span>Cast ${escapeHtml(name)} with a ${ordinal(open)}-level slot instead?</span>`, {
          actions: [{ label: `Cast at ${ordinal(open)} level`, run: () => castSpellRow(row, confirmed, open) }],
          duration: 10000
        });
      } else {
        showToast(`<span class="toast-label">No spell slots left</span><span>Nothing at ${ordinal(baseLevel)} level or higher. Rest to recover slots.</span>`, { tone: "fumble" });
      }
      return;
    }
    const max = slots[castLevel - 1] || 0;
    const used = Number(character.spellSlotUsage?.[castLevel] || 0);
    character.spellSlotUsage[castLevel] = used + 1;
    const left = max - used - 1;
    status = `${left} ${ordinal(castLevel)}-level slot${left === 1 ? "" : "s"} left`;
  }
  const previous = { concentration: character.concentration, tempHp: character.tempHp, agathys: character.agathys || 0, mageArmor: Boolean(character.mageArmor) };
  if (concentration) character.concentration = concentration;
  if (row.index === "mage-armor") character.mageArmor = true;
  character.lastCastLevel = Math.max(1, castLevel);
  const grant = spellTempHpGrant(row, castLevel);
  if (grant) {
    character.tempHp = Math.max(Number(character.tempHp || 0), grant.amount);
    if (grant.retaliation) character.agathys = grant.retaliation;
  }
  persistAndRender();
  const undo = () => {
    if (confirmed.ritual) {
      // Nothing was spent.
    } else if (arcanum) arcanum.current = Number(arcanum.current) + 1;
    else if (grantingItem) grantingItem.grantUsed = Math.max(0, Number(grantingItem.grantUsed || 0) - 1);
    else if (baseLevel > 0) character.spellSlotUsage[castLevel] = Math.max(0, Number(character.spellSlotUsage[castLevel] || 0) - 1);
    Object.assign(character, previous);
    persistAndRender();
    showToast(`<span class="toast-label">${escapeHtml(name)} cast undone</span>`);
  };
  const effect = spellEffectRoll(row, castLevel);
  const actions = [];
  if (effect?.attack) {
    const times = effect.attack.times > 1 ? ` ×${effect.attack.times}` : "";
    actions.push({ label: `Roll attack${times} (${formatMod(effect.attack.bonus)})`, run: () => rollSpellAttack(name, effect) });
  } else if (effect) {
    actions.push({ label: `${effect.label} (${effect.formula})`, run: () => rollSpellEffect(name, effect) });
  }
  actions.push({ label: "Undo", run: undo });
  const extra = grant ? ` · +${grant.amount} temp HP${grant.retaliation ? `, melee attackers take ${grant.retaliation} cold` : ""}` : "";
  showToast(`<span class="toast-label">Cast ${escapeHtml(name)}${castLevel > baseLevel ? ` at ${ordinal(castLevel)} level` : ""}</span><span>${escapeHtml(status)}${concentration ? " · concentrating" : ""}${escapeHtml(extra)}</span>`, { actions, duration: 10000 });
}

// Warlock Mystic Arcanum: one spell each of 6th-9th level, cast once per long rest without a slot.
function arcanumFor(row) {
  const level = spellLevelForRow(row);
  if (currentClass().id !== "warlock" || level < 6) return null;
  return character.resources.find(item => item.name === `Mystic Arcanum (${ordinal(level)})`) || null;
}

// Classes with Ritual Casting can cast a ritual-tagged spell without a slot (bard, cleric, druid, wizard, artificer;
// warlocks with Book of Ancient Secrets).
function ritualCastable(row) {
  const spell = allSpells.find(item => item.index === row.index) || {};
  const detail = row.custom || spellDetails[row.index] || spell;
  if (!detail.ritual && !spell.ritual && !/ritual/i.test(detail.casting_time || "")) return false;
  const id = currentClass().id;
  if (["bard", "cleric", "druid", "wizard", "artificer"].includes(id)) return true;
  return id === "warlock" && /book of ancient secrets/i.test(`${character.features || ""} ${(character.classOptions || []).map(item => item.name).join(" ")}`);
}

// The closest level with a free slot: higher first (an upcast), then down to the spell's own level.
function nearestOpenSlot(baseLevel, from, slots) {
  for (let level = from + 1; level <= slots.length; level += 1) {
    if (slotRemaining(level, slots[level - 1] || 0) > 0) return level;
  }
  for (let level = from - 1; level >= baseLevel; level -= 1) {
    if (slotRemaining(level, slots[level - 1] || 0) > 0) return level;
  }
  return null;
}

// Each attack (beam, ray) is its own d20 with its own damage button; crits double the dice.
function rollSpellAttack(name, effect, confirmed = false, index = 1) {
  if (!confirmed && blockedByIncapacitation(() => rollSpellAttack(name, effect, true, index))) return;
  const times = Math.max(1, Number(effect.attack.times || 1));
  openRoll({
    label: `${name} spell attack${times > 1 ? ` ${index} of ${times}` : ""}`,
    formula: `1d20${formatMod(effect.attack.bonus)}`,
    kind: "attack",
    actions: result => damageFollowUps(name, effect.perHit, naturalD20(result)),
    carry: index < times ? [{ label: `Next attack (${index + 1} of ${times})`, run: () => rollSpellAttack(name, effect, true, index + 1) }] : []
  });
}

function rollSpellEffect(name, effect) {
  if (effect.kind === "healing") {
    rollFromInput(`${name} healing`, effect.formula, "normal", result => [
      { label: `Heal me +${result.total}`, run: () => healBy(result.total) },
      ...Object.values(characterLibrary)
        .filter(other => other.sheetId !== character.sheetId && Number(other.hp || 0) < effectiveMaxHp(other) && !(Number(other.hp) <= 0 && Number(other.deathSaveFailures) >= 3))
        .map(other => ({ label: `Heal ${other.name || "unnamed"} +${result.total}`, run: () => healOther(other.sheetId, result.total) }))
    ]);
    return;
  }
  if (effect.kind === "temp") {
    rollFromInput(`${name} temporary HP`, effect.formula, "normal", result => [{ label: `Gain ${result.total} temp HP`, run: () => gainTempHp(result.total) }]);
    return;
  }
  const what = { pool: "HP affected", rider: "extra damage on a hit" }[effect.kind] || effect.kind;
  rollFromInput(`${name} ${what}`, effect.formula, "normal");
}

// Flat temporary hit points granted on casting (Armor of Agathys and similar), scaled by slot level.
function spellTempHpGrant(row, castLevel) {
  const detail = row.custom || spellDetails[row.index] || {};
  const text = [detail.desc].flat().filter(Boolean).join(" ");
  const higher = [detail.higher_level].flat().filter(Boolean).join(" ");
  const base = text.match(/(?:gain|grants?)\s+(\d+)\s+temporary hit points/i);
  if (!base) return null;
  const upcast = Math.max(0, castLevel - spellLevelForRow(row));
  const per = Number(`${text} ${higher}`.match(/increase by (\d+) (?:for each|per) slot level above/i)?.[1] || 0);
  const cold = text.match(/takes (\d+) cold damage/i);
  return {
    amount: Number(base[1]) + per * upcast,
    retaliation: cold ? Number(cold[1]) + per * upcast : 0
  };
}

// Minutes a spell lasts, from its duration text ("Concentration, up to 1 hour"), or null when unknown.
function spellDurationMinutes(spellName) {
  const row = (character.spells || []).find(entry => spellDisplayName(entry) === spellName);
  const detail = row?.custom || (row && spellDetails[row.index]) || Object.values(spellDetails).find(entry => entry.name === spellName);
  const duration = String(detail?.duration || "");
  const match = duration.match(/(\d+)\s*(round|minute|hour|day)/i);
  if (!match) return null;
  const unit = { round: 0.1, minute: 1, hour: 60, day: 1440 }[match[2].toLowerCase()];
  return Number(match[1]) * unit;
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
  // "4d6 fire damage and 4d6 radiant damage" (Flame Strike, Ice Storm): two dice groups in one effect.
  const pair = text.match(/\b\d+d\d+\s+\w+\s+damage\s+and\s+(\d+)d(\d+)\s+\w+\s+damage/i);
  let second = pair ? { count: Number(pair[1]), sides: Number(pair[2]) } : null;
  // "1d6 for each slot level above", "per slot level above", "1d8 for every two slot levels above" (Spiritual Weapon).
  const perSlot = higher.match(/(\d+)d(\d+)\s+(?:for each|per|for every)\s+(two\s+)?slot levels? above/i);
  if (perSlot && upcast) {
    const steps = perSlot[3] ? Math.floor(upcast / 2) : upcast;
    if (Number(perSlot[2]) === sides) count += Number(perSlot[1]) * steps;
    else if (second && Number(perSlot[2]) === second.sides) second = { ...second, count: second.count + Number(perSlot[1]) * steps };
  }
  const tiers = [5, 11, 17].filter(level => totalLevel() >= level).length;
  let beams = 0;
  if (baseLevel === 0 && /more than one beam/i.test(`${text} ${higher}`)) beams = 1 + tiers;
  else if (baseLevel === 0 && /5th level|5th\/11th|damage scales/i.test(`${text} ${higher}`)) count *= 1 + tiers;
  const healing = /regains?\s+(a number of\s+)?hit points/i.test(text);
  const pool = /the total is how many hit points/i.test(text);
  const tempHp = !healing && /temporary hit points/i.test(text);
  // Damage that rides on later hits ("an extra 1d6", "+1d6 necrotic"), not upcast scaling ("+1d8 per slot level").
  const rider = !healing && /\b(?:extra|additional)\s+\d+d\d+|\+\d+d\d+(?!\s*per\b)/i.test(text);
  const ability = currentClass().spellAbility;
  // Agonizing Blast adds Charisma to each Eldritch Blast beam when the invocation is recorded.
  const agonizing = row.index === "eldritch-blast" && /agonizing blast/i.test(`${character.features || ""} ${(character.classOptions || []).map(option => `${option.name} ${option.notes || ""}`).join(" ")}`);
  const modifier = agonizing ? mod("cha") : /spellcasting (?:ability )?modifier/i.test(text) && ABILITIES.some(([id]) => id === ability) ? mod(ability) : 0;
  const attack = /spell attack/i.test(text);
  const each = `${count}d${sides}${second ? `+${second.count}d${second.sides}` : ""}${flat + modifier ? formatMod(flat + modifier) : ""}`;
  // Darts that always hit roll as one total; rays and beams roll per attack.
  const autoHit = projectiles > 1 && !attack;
  const formula = autoHit ? `${count * projectiles}d${sides}${flat * projectiles + modifier ? formatMod(flat * projectiles + modifier) : ""}` : each;
  const multiple = beams > 1 ? `${beams} beams` : projectiles > 1 && attack ? `${projectiles} ${noun}` : "";
  const kind = healing ? "healing" : pool ? "pool" : tempHp ? "temp" : rider ? "rider" : "damage";
  return {
    formula,
    perHit: each,
    chip: multiple ? `${each} ×${beams || projectiles}` : formula,
    kind,
    label: { healing: "Roll healing", pool: "Roll HP affected", temp: "Roll temp HP", rider: "Roll extra damage on a hit" }[kind] || (multiple ? `Roll damage per ${noun.replace(/s$/, "") || "beam"}` : "Roll damage"),
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
        if (prepared.checked && !canPrepareAnother()) {
          prepared.checked = false;
          gatePrepare(() => { row.prepared = true; persistAndRender(); });
          return;
        }
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
  const maxKnownLevel = Math.max(1, characterMaxSpellLevel(), ...selectedLevels);
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
  const slots = characterSpellSlots();
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

function castLevelOptions(baseLevel, slots = characterSpellSlots()) {
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
  return character.spells.filter(row => spellRowHasSpell(row) && spellLevelForRow(row) > 0 && !spellAlwaysPrepared(row) && !row.itemId && !arcanumFor(row)).length;
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
  const arcanum = arcanumFor(row);
  if (arcanum) return { label: "Cast", disabled: Number(arcanum.current) <= 0, title: Number(arcanum.current) > 0 ? `${arcanum.name}: once per long rest` : "Recharges on a long rest" };
  const cls = currentClass();
  const preparedCaster = ["levelPlusMod", "halfLevelPlusMod"].includes(cls.preparedFormula);
  if (preparedCaster && !row.prepared && !spellAlwaysPrepared(row)) {
    return cls.id === "wizard" && ritualCastable(row)
      ? { label: "Ritual", disabled: false, title: "Unprepared: cast it as a ritual from your spellbook" }
      : { label: "Cast", disabled: true, title: "Prepare this spell to cast it" };
  }
  const slots = characterSpellSlots();
  const options = castLevelOptions(level, slots);
  const selected = options.includes(Number(row.castLevel || level)) ? Number(row.castLevel || level) : options[0];
  const remaining = slotRemaining(selected, slots[selected - 1] || 0);
  if (remaining > 0) {
    return { label: `Cast ${ordinal(selected)}`, disabled: false, title: `${remaining} ${ordinal(selected)}-level slot${remaining === 1 ? "" : "s"} left` };
  }
  const open = nearestOpenSlot(level, selected, slots);
  return open
    ? { label: `Cast ${ordinal(selected)}`, disabled: false, title: `No ${ordinal(selected)}-level slots left. You'll be asked before using a ${ordinal(open)}-level slot.` }
    : { label: `Cast ${ordinal(selected)}`, disabled: true, title: "No slots left at this level or higher" };
}

// Prepared casters (cleric, druid, paladin, wizard, artificer) prepare up to a class limit after each long rest.
function isPreparedCaster(cls = currentClass()) {
  return ["levelPlusMod", "halfLevelPlusMod"].includes(cls.preparedFormula);
}

function canPrepareAnother() {
  return !isPreparedCaster() || isRuleBroken("prepared-limit") || preparedSpellCount() < preparedLimitFor(currentClass());
}

function gatePrepare(proceed) {
  const cls = currentClass();
  const limit = preparedLimitFor(cls);
  const formula = cls.preparedFormula === "levelPlusMod" ? `${cls.name} level + ${String(cls.spellAbility).toUpperCase()} modifier` : `half your ${cls.name} level + ${String(cls.spellAbility).toUpperCase()} modifier`;
  breakRule("prepared-limit", `You're already at your maximum of ${limit} prepared spells (${formula}). Always-prepared spells from your subclass don't count toward it.`, proceed);
}

// Adding a spell row past the cantrip or spells-known cap asks first.
function gateNewSpellRow(level, proceed) {
  const cls = currentClass();
  if (level === 0) {
    const cap = cantripCap(cls);
    const chosen = character.spells.filter(row => spellRowHasSpell(row) && spellLevelForRow(row) === 0 && !spellAlwaysPrepared(row)).length;
    if (cap && chosen >= cap) return breakRule("cantrip-limit", `You already know ${chosen} of the ${cap} cantrips a level ${character.level} ${cls.name} gets.`, proceed);
  } else if (cls.preparedFormula === "known") {
    const cap = knownSpellCap(cls);
    if (cap !== null && knownSpellCount() >= cap) return breakRule("known-limit", `You already know ${knownSpellCount()} of the ${cap} spells a level ${character.level} ${cls.name} knows. Swap one out on level up instead, or allow extra spells.`, proceed);
  }
  proceed();
  return true;
}

function addSuggestedSpell(index) {
  const spell = allSpells.find(item => item.index === index);
  if (!spell) return;
  if (!canPrepareAnother() && !character.spells.find(row => row.index === index && row.prepared)) {
    gatePrepare(() => addSuggestedSpell(index));
    return;
  }
  const existing = character.spells.find(row => row.index === index);
  if (existing) existing.prepared = true;
  else character.spells.push({ id: crypto.randomUUID(), index, level: spell.level, prepared: true });
  persistAndRender();
  loadSpellDetail(index);
  showToast(`<span class="toast-label">Prepared ${escapeHtml(spell.name)}</span><span>${preparedSpellCount()} of ${preparedLimitFor(currentClass())} prepared</span>`);
}
