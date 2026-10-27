// Every spell is bundled (SRD 5.1 in srd-spells.js, the rest in data/expansions/rules-spells), so nothing loads over the network.
const allSpells = LOCAL_SPELL_INDEX;
let spellDetails = Object.fromEntries(LOCAL_SPELLS.map(detail => [detail.index, detail]));
const expandedSpellRows = new Set();

function spellSummaryHtml(row) {
  if (!spellRowHasSpell(row)) return `<span class="muted">Pick a spell to see its summary.</span>`;
  const level = spellLevelForRow(row);
  const detail = spellDetails[row.index] || {};
  const text = [detail.desc].flat().filter(Boolean).join(" ");
  const save = spellSaveFor(row);
  const fixedDc = SPELL_ROLL_OVERRIDES[row.index]?.fixedDc;
  // Custom spells say what they do in their own fields; only official text is read for clues.
  const attack = Boolean(detail.attack_type) || (!detail.custom && /spell attack/i.test(text));
  const dice = spellEffectRoll(row, level)?.chip || (SPELL_ROLL_OVERRIDES[row.index]?.none || detail.custom ? "" : text.match(/\b\d+d\d+\b/)?.[0]);
  const cast = castingShorthand(detail.casting_time);
  const concentration = detail.concentration;
  const parts = [
    level === 0 ? "Cantrip" : ordinal(level),
    cast,
    fixedDc ? `DC ${fixedDc} ${save.slice(0, 3).toUpperCase()} (you)` : save ? `${save.slice(0, 3).toUpperCase()} save` : attack ? "Spell attack" : "No save",
    dice || "",
    concentration ? "C" : "",
    detail.ritual ? "R" : ""
  ].filter(Boolean);
  return `<strong class="spell-print-name">${escapeHtml(spellDisplayName(row))}</strong>` +
    parts.map(part => `<span title="${escapeHtml(CAST_SHORTHAND_TITLES[part] || "")}">${escapeHtml(part)}</span>`).join("");
}

// Only the saves a target makes ("make a Wisdom saving throw", "Wisdom save or take", "fails a Dexterity saving throw",
// "a saving throw of Wisdom"), not "advantage on Wisdom saving throws".
function spellSaveAbility(text) {
  const match = String(text).match(/(?:makes?|must make|succeeds? on|succeed on|fails? an?)\s+(?:an?\s+)?(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s+sav|(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s+save\s+or\b|saving throw of (Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)/i);
  return match ? match[1] || match[2] || match[3] : "";
}

const SAVE_NAMES = { str: "Strength", dex: "Dexterity", con: "Constitution", int: "Intelligence", wis: "Wisdom", cha: "Charisma" };

// The SRD's structured save first (Earthquake's own effects use DEX), then the text.
function spellSaveFor(row) {
  const detail = spellDetails[row.index] || {};
  return SPELL_ROLL_OVERRIDES[row.index]?.save || SAVE_NAMES[detail.dc?.dc_type?.index] || (detail.custom ? "" : spellSaveAbility([detail.desc].flat().filter(Boolean).join(" ")));
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

// Always-prepared/known spells from every class entry's subclass at that class's level (PHB p.164), Circle of the Land
// terrain spells, subclass bonus cantrips (Light, Grave, Spirits) and the Divine Soul affinity spell.
const DIVINE_AFFINITY_SPELLS = { good: "cure-wounds", evil: "inflict-wounds", law: "bless", chaos: "bane", neutrality: "protection-from-evil-and-good" };

function subclassGrantsFor(entry) {
  const slug = subclassIndexFor(entry);
  if (!slug) return [];
  const grants = [];
  const add = (table, levelOk) => Object.entries(table || {}).forEach(([grantLevel, indexes]) => {
    if (levelOk(Number(grantLevel))) indexes.forEach(index => grants.push(index));
  });
  add(lookupBySubclass(SUBCLASS_SPELLS, slug), grantLevel => entry.level >= grantLevel);
  if (slug === "land" && entry.classId === "druid") add(LAND_CIRCLE_SPELLS[character.classChoices?.landTerrain], grantLevel => entry.level >= grantLevel);
  const extras = lookupBySubclass(SUBCLASS_EXTRAS, slug);
  if (extras && (!extras.classId || extras.classId === entry.classId)) (extras.cantrips || []).forEach(index => grants.push(index));
  const affinity = String(character.classChoices?.divineSoulAffinity || "").toLowerCase();
  if (slug === "divine-soul" && DIVINE_AFFINITY_SPELLS[affinity]) grants.push(DIVINE_AFFINITY_SPELLS[affinity]);
  return grants;
}

// Spells a class option teaches, as spells of that class: Pact of the Tome's three cantrips and Pact of the Chain's
// find familiar (PHB p.107-108), Blessed Warrior / Druidic Warrior cantrips (TCE p.53, p.57).
function optionGrantsFor(entry) {
  const choices = character.classChoices || {};
  const picks = key => (choices[key] || []).filter(Boolean);
  const styles = choices.fightingStyles || [];
  if (entry.classId === "warlock" && entry.level >= 3) return choices.pactBoon === "tome" ? picks("tomeCantrips") : choices.pactBoon === "chain" ? ["find-familiar"] : [];
  if (entry.classId === "paladin" && entry.level >= 2 && styles.includes("Blessed Warrior")) return picks("blessedWarriorCantrips");
  if (entry.classId === "ranger" && entry.level >= 2 && styles.includes("Druidic Warrior")) return picks("druidicWarriorCantrips");
  return [];
}

function ensureSubclassSpells() {
  const entitled = new Map();
  classEntries().forEach(entry => [...subclassGrantsFor(entry), ...optionGrantsFor(entry)].forEach(index => { if (!entitled.has(index)) entitled.set(index, entry.key); }));
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
  entitled.forEach((classKey, index) => {
    if (granted.has(index) && known.has(index)) return;
    // The spell list gives the real level (cantrip grants and Fey Wanderer's 11th-level key sit among leveled tiers).
    const level = allSpells.find(item => item.index === index)?.level ?? 1;
    granted.add(index);
    changed = true;
    if (!known.has(index)) {
      character.spells.push({ id: crypto.randomUUID(), index, level, prepared: level > 0, auto: true, classKey });
      known.add(index);
    }
  });
  if (changed) {
    character.autoSpells = Array.from(granted);
    persist();
  }
}

// Invocations that cast a spell (PHB p.110-111, XGE p.56-57, TCE p.71). "will": at will, no slot.
// "slot": once per long rest, paid with a warlock slot. "1/long": once per long rest without a slot.
const INVOCATION_SPELLS = {
  "Armor of Shadows": ["mage-armor", "will"], "Ascendant Step": ["levitate", "will"], "Beast Speech": ["speak-with-animals", "will"],
  "Chains of Carceri": ["hold-monster", "will"], "Eldritch Sight": ["detect-magic", "will"], "Fiendish Vigor": ["false-life", "will"],
  "Mask of Many Faces": ["disguise-self", "will"], "Master of Myriad Forms": ["alter-self", "will"], "Misty Visions": ["silent-image", "will"],
  "Otherworldly Leap": ["jump", "will"], "Shroud of Shadow": ["invisibility", "will"], "Visions of Distant Realms": ["arcane-eye", "will"],
  "Whispers of the Grave": ["speak-with-dead", "will"],
  "Bewitching Whispers": ["compulsion", "slot"], "Dreadful Word": ["confusion", "slot"], "Minions of Chaos": ["conjure-elemental", "slot"],
  "Mire the Mind": ["slow", "slot"], "Sculptor of Flesh": ["polymorph", "slot"], "Sign of Ill Omen": ["bestow-curse", "slot"],
  "Thief of Five Fates": ["bane", "slot"],
  "Gift of the Depths": ["water-breathing", "1/long"], "Trickster's Escape": ["freedom-of-movement", "1/long"], "Undying Servitude": ["animate-dead", "1/long"]
};

function ensureInvocationSpells() {
  const warlock = classEntries().find(entry => entry.classId === "warlock");
  const wanted = warlock ? classChoiceNames("invocations").filter(name => INVOCATION_SPELLS[name]) : [];
  const before = character.spells.length;
  character.spells = character.spells.filter(row => row.source?.kind !== "invocation" || wanted.includes(row.source.name));
  let changed = character.spells.length !== before;
  wanted.forEach(name => {
    if (character.spells.some(row => row.source?.kind === "invocation" && row.source.name === name)) return;
    const [index, free] = INVOCATION_SPELLS[name];
    const level = allSpells.find(item => item.index === index)?.level ?? 1;
    character.spells.push({ id: crypto.randomUUID(), index, level, prepared: false, free, source: { kind: "invocation", name, ability: "cha" }, ...(free === "slot" ? { castPool: "pact" } : {}) });
    changed = true;
  });
  if (changed) persist();
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
  ensureInvocationSpells();
  ensureItemSpells();
  ensureSpellOwners();
  ensureSpellTrackers();
  const cls = currentClass();
  // Multiclass: one line per casting class (PHB p.164); a single caster keeps the compact header.
  const casters = casterEntries();
  const lines = (casters.length ? casters : [classEntries()[0]]).map(entry => spellClassLine(entry));
  const head = lines[0];
  const multi = lines.length > 1;
  document.querySelector("#preparedLabel").textContent = multi ? "Prepared / known" : head.known ? "Known" : "Prepared";
  document.querySelector("#spellRows").classList.toggle("known-caster", !multi && head.known);
  const overs = lines.filter(line => line.used > line.limit).map(line => `${line.used - line.limit} ${line.known ? "known" : "prepared"} ${line.name} spell${line.used - line.limit === 1 ? "" : "s"} over your limit of ${line.limit}.`);
  const warning = document.querySelector("#preparedWarning");
  const notes = [...overs, ...spellListWarnings()];
  warning.hidden = !notes.length;
  warning.textContent = notes.join(" ");
  const join = pick => [...new Set(lines.map(pick))].join(" · ");
  document.querySelector("#spellAbility").textContent = join(line => line.ability === "none" ? "-" : line.ability.toUpperCase());
  document.querySelector("#spellDc").textContent = join(line => line.ability === "none" ? "-" : `${line.dc}${multi ? ` ${line.ability.toUpperCase()}` : ""}`);
  document.querySelector("#spellAttack").textContent = join(line => line.ability === "none" ? "-" : `${formatMod(line.attack)}${multi ? ` ${line.ability.toUpperCase()}` : ""}`);
  // Multiclass: the big number is the total; each class's own count is in the lines below it.
  const sum = pick => lines.reduce((total, line) => total + pick(line), 0);
  document.querySelector("#preparedCount").textContent = `${sum(line => line.used)} / ${sum(line => line.limit)}`;
  document.querySelector("#preparedCount").style.color = lines.some(line => line.used > line.limit) ? "var(--accent)" : "inherit";
  renderSpellClassStats(multi ? lines : []);
  setValue("concentrationInput", character.concentration || "");
  renderPrepSuggestions();
  renderSlots(cls);
  renderSpellRows();
  document.body.classList.toggle("is-caster", casters.length > 0 || cls.casterType !== "none" || character.spells.some(spellRowHasSpell));
  renderCombatSpells();
}

// The Combat tab lists only spells you can cast right now: cantrips, prepared, always-prepared, known, and item spells.
function renderCombatSpells() {
  const ready = character.spells
    .filter(row => spellRowHasSpell(row))
    .map(row => ({ row, level: spellLevelForRow(row) }))
    .filter(({ row, level }) => level === 0 || row.itemId || !spellRowNeedsPreparing(row) || row.prepared || spellAlwaysPrepared(row) || row.ritualBook)
    .sort((a, b) => a.level - b.level || spellDisplayName(a.row).localeCompare(spellDisplayName(b.row)));
  document.querySelector("#combatSpells").innerHTML = ready.length ? ready.map(({ row, level }) => {
    const state = quickCastState(row, level);
    return `
      <div class="combat-spell" data-spell-id="${row.id}">
        <div>
          <strong>${escapeHtml(spellDisplayName(row))}</strong>
          <span class="spell-summary">${spellSummaryHtml(row)}</span>
        </div>
        ${state ? `<button type="button" class="secondary cast-spell" ${state.disabled ? "disabled" : ""} title="${escapeHtml(state.title)}" aria-label="${escapeHtml(`${state.label} ${spellDisplayName(row)}`)}">${escapeHtml(state.label)}</button>` : ""}
      </div>`;
  }).join("") : `<p class="empty-state">No spells ready. Pick and prepare spells in the Spells tab.</p>`;
}

function renderSlots() {
  const slots = characterSpellSlots();
  const pact = pactSlotPool();
  const slotGrid = document.querySelector("#slotGrid");
  // A slot made with Flexible Casting shows even at a level you have no slots of (PHB p.101).
  const levels = slots.map((count, index) => ({ count, level: index + 1 }))
    .concat(Object.keys(character.spellSlotUsage || {}).map(Number).filter(level => level > slots.length && level <= 5).map(level => ({ count: 0, level })))
    .filter(item => item.count > 0 || slotRemaining(item.level, item.count) > 0);
  if (!levels.length && !pact) {
    slotGrid.innerHTML = `<div class="slot"><span>Slots</span><strong>-</strong></div>`;
    return;
  }
  slotGrid.innerHTML = levels.map(item => `
    <div class="slot slot-tracker">
      <span>${ordinal(item.level)}</span>
      <strong>${slotRemaining(item.level, item.count)} / ${item.count}</strong>
      <div>
        <button type="button" class="ghost" data-slot-level="${item.level}" data-slot-delta="-1">Use</button>
        <button type="button" class="ghost" data-slot-level="${item.level}" data-slot-delta="1">Restore</button>
      </div>
    </div>
  `).join("") + (pact ? `
    <div class="slot slot-tracker" title="Pact Magic slots come back on a short rest">
      <span>Pact ${ordinal(pact.level)}</span>
      <strong>${pact.left} / ${pact.max}</strong>
      <div>
        <button type="button" class="ghost" data-slot-level="pact" data-slot-delta="-1">Use</button>
        <button type="button" class="ghost" data-slot-level="pact" data-slot-delta="1">Restore</button>
      </div>
    </div>` : "");
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
  if (level === "pact") {
    const pact = pactSlotPool();
    if (pact) character.pactSlotUsage = clamp(Number(character.pactSlotUsage || 0) - delta, 0, pact.max);
    persistAndRender();
    return;
  }
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

// Casting asks before anything surprising: acting while incapacitated, casting in beast form or untrained armor,
// a second spell after a bonus-action spell, replacing or restarting concentration, or using a higher slot.
function castSpellRow(row, confirmed = {}, overrideLevel = null, overridePool = null) {
  if (!spellRowHasSpell(row)) return;
  const name = spellDisplayName(row);
  const detail = spellDetails[row.index] || {};
  const baseLevel = spellLevelForRow(row);
  const grantingItem = itemForSpellRow(row);
  const cls = spellRowClass(row);
  const retry = (flag, value = true) => castSpellRow(row, { ...confirmed, [flag]: value }, overrideLevel, overridePool);
  const ritual = ritualCastable(row);
  const needsPrep = !grantingItem && baseLevel > 0 && spellRowNeedsPreparing(row) && !row.prepared && !spellAlwaysPrepared(row);
  // Wizards can ritual-cast any ritual in their spellbook without preparing it (PHB p.114); ritual-book rows only as rituals.
  const ritualOnly = Boolean(row.ritualBook) || needsPrep;
  if (needsPrep && !(ritual && cls?.id === "wizard")) {
    showToast(`<span class="toast-label">${escapeHtml(name)} isn't prepared</span><span>Tick Prepared on its row to cast it.</span>`);
    return;
  }
  if (!confirmed.incapacitated && blockedByIncapacitation(() => retry("incapacitated"))) return;
  // A reaction spell (Shield, Counterspell, Feather Fall) spends the round's reaction (PHB p.190).
  const reactionSpell = castingShorthand(detail.casting_time) === "R";
  if (!confirmed.reaction && reactionSpell && reactionSpent(() => retry("reaction"))) return;
  // PHB p.144: no spellcasting in armor you aren't proficient with.
  const untrained = untrainedArmorItem();
  if (untrained && !confirmed.armor && !isRuleBroken("armor-casting")) {
    breakRule("armor-casting", `You can't cast spells while wearing ${untrained.name}, which you aren't proficient with (PHB p.144).`, () => retry("armor"));
    return;
  }
  if (!confirmed.rage && character.raging) {
    showToast(`<span class="toast-label">You're raging</span><span>You can't cast spells or concentrate on them while raging.</span>`, {
      persist: true,
      tone: "fumble",
      actions: [{ label: "End rage and cast", run: () => { endRage(); retry("rage"); } }]
    });
    return;
  }
  if (ritual && !grantingItem && !confirmed.ritual && !confirmed.slot) {
    const time = castingShorthand(detail.casting_time);
    const total = time === "A" ? "1 action + 10 minutes" : /min|hr/.test(time) ? `${time} + 10 min` : "10 minutes longer";
    showToast(`<span class="toast-label">${escapeHtml(name)} is a ritual</span><span>As a ritual it takes ${escapeHtml(total)} and spends no slot.</span>`, {
      actions: [
        { label: "Cast as ritual", run: () => retry("ritual") },
        ...(ritualOnly ? [] : [{ label: "Spend a slot", run: () => retry("slot") }])
      ],
      persist: true
    });
    return;
  }
  if (!confirmed.wildShape && character.wildShape) {
    const block = beastFormCastingBlock(row, detail);
    if (block) {
      showToast(`<span class="toast-label">You're in beast form</span><span>${escapeHtml(block)}</span>`, {
        persist: true,
        actions: [{ label: "Cast anyway", run: () => retry("wildShape") }]
      });
      return;
    }
  }
  // Mystic Arcanum, item charges, free casts and slots are worked out before metamagic so Twinned is priced right.
  const slots = characterSpellSlots();
  const pact = pactSlotPool();
  const arcanum = !grantingItem && arcanumFor(row);
  const free = !grantingItem && !arcanum && !confirmed.ritual && baseLevel > 0 ? freeCastFor(row) : null;
  // The card's level/pool pick, worked out even when the card never rendered (a pure warlock casts at its pact level).
  const option = baseLevel > 0 && !overridePool ? selectedCastOption(row, castOptions(baseLevel)) : null;
  let pool = overridePool || (option?.pool === "pact" ? "pact" : "slots");
  let castLevel = baseLevel;
  if (baseLevel > 0 && !arcanum && !confirmed.ritual) {
    castLevel = pool === "pact" ? pact.level : overrideLevel || (free?.atWill ? baseLevel : option?.level) || Number(row.castLevel || baseLevel);
    if (free?.atWill && castLevel === baseLevel) pool = "free";
  }
  if (free && !free.atWill && !confirmed.free && !confirmed.slot && Number(free.resource.current) > 0) {
    showToast(`<span class="toast-label">${escapeHtml(name)}: free cast available</span><span>${escapeHtml(free.label)}: ${free.resource.current} left, cast at ${ordinal(free.level || baseLevel)} level without a slot.</span>`, {
      actions: [{ label: "Cast free", run: () => retry("free") }, { label: "Spend a slot", run: () => retry("slot") }],
      persist: true
    });
    return;
  }
  if (confirmed.free && free && !free.atWill) {
    pool = "free";
    castLevel = free.level || baseLevel;
  }
  // Psionic Sorcery (Aberrant Mind 6, TCE p.67): a psionic spell for sorcery points equal to its level, no V/S.
  const psionic = baseLevel > 0 && !arcanum && !grantingItem && pool !== "free" && subclassLevel("aberrant-mind") >= 6
    && Object.values(SUBCLASS_SPELLS["aberrant-mind"] || {}).some(list => list.includes(row.index)) ? sorceryPointTracker() : null;
  if (psionic && Number(psionic.current) >= baseLevel && !confirmed.psionic && !confirmed.slot && !confirmed.ritual) {
    showToast(`<span class="toast-label">${escapeHtml(name)}: Psionic Sorcery</span><span>Cast it at ${ordinal(baseLevel)} level for ${baseLevel} sorcery points (${psionic.current} left), with no verbal or somatic components.</span>`, {
      actions: [{ label: `Cast with ${baseLevel} SP`, run: () => retry("psionic") }, { label: "Spend a slot", run: () => retry("slot") }],
      persist: true
    });
    return;
  }
  if (confirmed.psionic && psionic) {
    pool = "psionic";
    castLevel = baseLevel;
  }
  // Sign of Ill Omen and the like: a warlock slot, once per long rest.
  const invocationUse = row.free === "slot" && row.source?.kind === "invocation" ? character.resources.find(item => item.spellRowId === row.id) : null;
  if (invocationUse && Number(invocationUse.current) < 1 && !confirmed.invocation) {
    showToast(`<span class="toast-label">${escapeHtml(row.source.name)} is used</span><span>It comes back on a long rest.</span>`, {
      persist: true,
      tone: "fumble",
      actions: [{ label: "Cast anyway", run: () => retry("invocation") }]
    });
    return;
  }
  // Metamagic is chosen as you cast (PHB p.102): one option per spell, plus Empowered or Seeking.
  if (!confirmed.metamagic && baseLevel >= 0 && metamagicChoices(row, castLevel, []).length) {
    promptMetamagic(row, castLevel, [], picked => retry("metamagic", picked));
    return;
  }
  const metamagic = Array.isArray(confirmed.metamagic) ? confirmed.metamagic : [];
  // PHB p.202: after a bonus-action spell, the only other spell that turn is a cantrip with a casting time of 1 action.
  const time = castingShorthand(detail.casting_time);
  const bonusSpell = time === "B" || metamagic.includes("Quickened");
  const actionCantrip = baseLevel === 0 && time === "A" && !bonusSpell;
  const turn = character.turnCasts && Date.now() - Number(character.turnCasts.at || 0) < 5 * 60 * 1000 ? character.turnCasts : null;
  if (!confirmed.turn && turn && ((turn.bonusSpell && !actionCantrip) || (bonusSpell && turn.otherSpell))) {
    showToast(`<span class="toast-label">Bonus-action spell this turn</span><span>After casting a spell as a bonus action, the only other spell you can cast that turn is a 1-action cantrip (PHB p.202).</span>`, {
      tone: "fumble",
      actions: [{ label: "It's a new turn", run: () => { character.turnCasts = null; retry("turn"); } }, { label: "Cast anyway", run: () => retry("turn") }],
      persist: true
    });
    return;
  }
  const concentration = spellConcentrationLabel(row, castLevel);
  if (!confirmed.concentration && concentration && character.concentration) {
    const same = character.concentration === concentration;
    showToast(`<span class="toast-label">${same ? `Already concentrating on ${escapeHtml(concentration)}` : `Concentrating on ${escapeHtml(character.concentration)}`}</span><span>${same ? "Casting it again spends another slot and restarts the spell." : `Casting ${escapeHtml(concentration)} ends it.`}</span>`, {
      actions: [{ label: same ? "Cast again" : "Cast anyway", run: () => retry("concentration") }],
      persist: true
    });
    return;
  }
  let itemCost = 1;
  let status = baseLevel === 0 ? "Cantrip" : "";
  const spent = { pool: "", level: 0, resource: null, points: 0 };
  if (confirmed.ritual) {
    status = "Ritual: 10 minutes longer, no slot spent";
  } else if (arcanum) {
    if (Number(arcanum.current) <= 0) {
      showToast(`<span class="toast-label">${escapeHtml(arcanum.name)} used</span><span>It recharges on a long rest.</span>`, { tone: "fumble" });
      return;
    }
    arcanum.current = Number(arcanum.current) - 1;
    spent.resource = arcanum;
    status = `${arcanum.name}: recharges on a long rest`;
  } else if (grantingItem) {
    const uses = Number(grantingItem.grantUses || 0);
    // Wand of Magic Missiles: 1 charge per spell level, up to a cap (DMG p.211).
    const perLevel = Number(String(grantingItem.notes || "").match(/1 charge per spell level \(1st[^0-9]*(\d)/i)?.[1] || 0);
    const left = uses ? uses - Number(grantingItem.grantUsed || 0) : Infinity;
    if (perLevel && !overrideLevel && left > 0) {
      const levels = Array.from({ length: Math.min(perLevel, left) - baseLevel + 1 }, (_, index) => baseLevel + index).filter(level => level >= 1);
      showToast(`<span class="toast-label">${escapeHtml(grantingItem.name)}: ${left} charge${left === 1 ? "" : "s"}</span><span>One charge per spell level.</span>`, {
        persist: true,
        actions: levels.map(level => ({ label: `${ordinal(level)} level (${level} charge${level === 1 ? "" : "s"})`, run: () => castSpellRow(row, confirmed, level) }))
      });
      return;
    }
    itemCost = perLevel ? overrideLevel : 1;
    if (uses && itemCost > left) {
      showToast(`<span class="toast-label">${escapeHtml(grantingItem.name)} is spent</span><span>It recharges at dawn.</span>`);
      return;
    }
    // DMG p.200: a scroll's spell must be on your class list; above your highest level, check DC 10 + spell level.
    if (/spell scroll/i.test(grantingItem.name || "") && !confirmed.scroll) {
      const item = allSpells.find(spell => spell.index === row.index);
      const onList = casterEntries().some(entry => spellMatchesClass(item || {}, entryClass(entry), entry));
      if (!onList) {
        showToast(`<span class="toast-label">Not on your class list</span><span>You can only read a spell scroll whose spell is on one of your class spell lists (DMG p.200).</span>`, { persist: true, tone: "fumble", actions: [{ label: "Read it anyway", run: () => retry("scroll") }] });
        return;
      }
      if (baseLevel > characterMaxSpellLevel()) {
        const ability = entryClass(casterEntries()[0] || classEntries()[0]).spellAbility;
        showToast(`<span class="toast-label">${escapeHtml(name)} is above your level</span><span>Make a ${escapeHtml(String(ability).toUpperCase())} check, DC ${10 + baseLevel}, to cast it from the scroll. On a failure the scroll crumbles.</span>`, {
          actions: [
            { label: "Roll the check", run: () => rollFromInput(`${name} scroll check (DC ${10 + baseLevel})`, `1d20${formatMod(ABILITIES.some(([id]) => id === ability) ? mod(ability) : 0)}`) },
            { label: "It succeeded: cast", run: () => retry("scroll") }
          ],
          persist: true
        });
        return;
      }
    }
    if (perLevel) castLevel = overrideLevel;
    if (uses) grantingItem.grantUsed = Number(grantingItem.grantUsed || 0) + itemCost;
    status = uses ? `${uses - grantingItem.grantUsed} of ${uses} ${grantingItem.name} charge${uses === 1 ? "" : "s"} left` : `From ${grantingItem.name}`;
    if (uses && grantingItem.grantUsed >= uses && /last charge/i.test(grantingItem.notes || "")) status += ". Last charge: roll a d20, on a 1 it's destroyed";
  } else if (pool === "psionic") {
    psionic.current = Number(psionic.current) - baseLevel;
    spent.psionic = baseLevel;
    status = `Psionic Sorcery: ${baseLevel} SP, ${psionic.current} left`;
  } else if (pool === "free") {
    if (free.resource) {
      free.resource.current = Number(free.resource.current) - 1;
      spent.resource = free.resource;
      status = `${free.label}: ${free.resource.current} left`;
    } else {
      status = `${free.label}: no slot`;
    }
  } else if (baseLevel > 0) {
    const left = pool === "pact" ? pact.left : slotRemaining(castLevel, slots[castLevel - 1] || 0);
    if (left <= 0 || (pool === "pact" && pact.level < baseLevel)) {
      const open = nearestOpenSlot(baseLevel, castLevel, slots);
      const pactOpen = pool !== "pact" && pact && pact.left > 0 && pact.level >= baseLevel;
      const choices = [
        ...(open ? [{ label: `Cast at ${ordinal(open)} level`, run: () => castSpellRow(row, confirmed, open, "slots") }] : []),
        ...(pactOpen ? [{ label: `Use a pact slot (${ordinal(pact.level)})`, run: () => castSpellRow(row, confirmed, pact.level, "pact") }] : [])
      ];
      if (choices.length) {
        showToast(`<span class="toast-label">No ${pool === "pact" ? "pact" : `${ordinal(castLevel)}-level`} slots left</span><span>Cast ${escapeHtml(name)} with another slot instead?</span>`, { actions: choices, persist: true });
      } else {
        showToast(`<span class="toast-label">No spell slots left</span><span>Nothing at ${ordinal(baseLevel)} level or higher. Rest to recover slots.</span>`, { tone: "fumble" });
      }
      return;
    }
    if (pool === "pact") {
      character.pactSlotUsage = Number(character.pactSlotUsage || 0) + 1;
      status = `${pact.left - 1} pact slot${pact.left - 1 === 1 ? "" : "s"} left`;
    } else {
      character.spellSlotUsage[castLevel] = Number(character.spellSlotUsage?.[castLevel] || 0) + 1;
      status = `${left - 1} ${ordinal(castLevel)}-level slot${left - 1 === 1 ? "" : "s"} left`;
    }
    spent.pool = pool;
    spent.level = castLevel;
    if (invocationUse && Number(invocationUse.current) > 0) {
      invocationUse.current = Number(invocationUse.current) - 1;
      spent.invocation = invocationUse;
    }
  }
  const metamagicCost = metamagic.reduce((sum, option) => sum + metamagicCost(option, castLevel), 0);
  if (metamagicCost && metamagicPools().length) {
    spent.points = spendMetamagicPoints(metamagicCost);
    status += ` · ${metamagic.join(" + ")} (${metamagicCost} SP, ${metamagicPointsLeft()} left)`;
  }
  const previous = {
    concentration: character.concentration, concentrationLevel: character.concentrationLevel, tempHp: character.tempHp, agathys: character.agathys || 0,
    mageArmor: Boolean(character.mageArmor), turnCasts: character.turnCasts || null, turn: { ...turnState() }, effects: { ...effects() }
  };
  if (concentration) {
    character.concentration = concentration;
    character.concentrationLevel = castLevel;
  }
  if (row.index === "mage-armor") character.mageArmor = true;
  if (reactionSpell) turnState().reaction = true;
  // The Action / Bonus markers in the turn bar (a ritual's 10 minutes is outside combat's turns).
  if (!confirmed.ritual) markTurnCost(bonusSpell ? "Bonus Action" : time === "A" ? "Action" : "");
  // Shield (PHB p.275): +5 AC until the start of your next turn; Next turn ends it.
  if (row.index === "shield") effects().Shield = 1;
  character.lastCastLevel = Math.max(1, castLevel);
  const fresh = turn && !confirmed.turn ? turn : { at: Date.now(), bonusSpell: false, otherSpell: false };
  character.turnCasts = { ...fresh, bonusSpell: fresh.bonusSpell || bonusSpell, otherSpell: fresh.otherSpell || (!bonusSpell && !actionCantrip) };
  const extras = [];
  if (row.index === "shield") extras.push(`AC ${effectiveArmorClass()} until your next turn`);
  const grant = spellTempHpGrant(row, castLevel);
  if (grant) {
    character.tempHp = Math.max(Number(character.tempHp || 0), grant.amount);
    if (grant.retaliation) character.agathys = grant.retaliation;
    extras.push(`+${grant.amount} temp HP${grant.retaliation ? `, melee attackers take ${grant.retaliation} cold` : ""}`);
  }
  // Arcane Ward (Abjuration 2): casting an abjuration spell of 1st level or higher heals the ward 2 x the slot level.
  const ward = arcaneWardTracker();
  const wardBefore = ward ? Number(ward.current) : 0;
  if (ward && castLevel >= 1 && detail.school?.index === "abjuration" && !confirmed.ritual) {
    ward.current = Math.min(Number(ward.max), wardBefore + 2 * castLevel);
    extras.push(`Arcane Ward ${ward.current}/${ward.max}`);
  }
  extras.push(...componentNotes(detail));
  const castExtras = spellCastExtras(row, previous, extras);
  persistAndRender();
  let undone = false;
  const undo = () => {
    if (undone) return;
    undone = true;
    if (spent.resource) spent.resource.current = Number(spent.resource.current) + 1;
    else if (grantingItem) grantingItem.grantUsed = Math.max(0, Number(grantingItem.grantUsed || 0) - itemCost);
    else if (spent.pool === "pact") character.pactSlotUsage = Math.max(0, Number(character.pactSlotUsage || 0) - 1);
    else if (spent.pool === "slots") character.spellSlotUsage[spent.level] = Number(character.spellSlotUsage[spent.level] || 0) - 1;
    if (spent.points) spent.points();
    if (spent.invocation) spent.invocation.current = Number(spent.invocation.current) + 1;
    if (spent.psionic) psionic.current = Math.min(Number(psionic.max), Number(psionic.current) + spent.psionic);
    if (ward) ward.current = wardBefore;
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
    actions.push({ label: `${effect.label} (${effect.chip})`, run: () => rollSpellEffect(name, effect) });
    if (effect.alt) actions.push({ label: `Roll ${effect.alt} (${effect.altWhen})`, run: () => rollFromInput(`${name} damage`, effect.alt, "normal") });
  }
  // Death Ward and Beacon of Hope mark their targets; play.js reads the marks (dealDamage, advantageSource, healing).
  const marked = SPELL_TARGET_EFFECTS[row.index];
  if (marked) [character, ...otherSheets()].forEach(sheet => actions.push({
    label: `${marked[0]}: ${sheet === character ? "me" : sheet.name || "unnamed"}`,
    run: () => updateSheet(sheet.sheetId, target => { target.effects = { ...(target.effects || {}), [marked[0]]: marked[1] }; })
  }));
  const affinity = effect && effect.kind === "damage" ? elementalAffinity(effect) : 0;
  if (affinity) actions.push({ label: `Damage +${affinity} (Elemental Affinity)`, run: () => rollFromInput(`${name} damage + Elemental Affinity`, addFlat(effect.perHit, affinity), "normal") });
  // School of Evocation (PHB p.117): Sculpt Spells (2), Potent Cantrip (6), Overchannel (14, wizard spells of 1st-5th level).
  const evoker = cls?.id === "wizard" ? subclassLevel("evocation") : 0;
  const saves = Boolean(spellSaveFor(row));
  if (evoker >= 2 && saves && detail.school?.index === "evocation") extras.push(`Sculpt Spells: up to ${1 + castLevel} creatures you choose succeed and take no damage`);
  if (evoker >= 6 && saves && baseLevel === 0 && effect?.kind === "damage") extras.push("Potent Cantrip: half damage on a successful save");
  if (evoker >= 14 && effect?.kind === "damage" && castLevel >= 1 && castLevel <= 5) {
    const safe = character.resources.find(item => item.name === "Overchannel (safe use)");
    actions.splice(actions.length - 1, 0, Number(safe?.current) > 0
      ? { label: `Overchannel: max damage (${maximizeDice(effect.perHit)})`, run: () => { safe.current = Number(safe.current) - 1; persistAndRender(); showToast(`<span class="toast-label">${escapeHtml(name)} overchanneled</span><span>${maximizeDice(effect.perHit)} damage, no roll.</span>`, { tone: "crit" }); } }
      // ponytail: a third use adds another 1d12 per level; that escalation isn't counted.
      : { label: `Overchannel again (take ${2 * castLevel}d12 necrotic)`, run: () => rollFromInput(`${name} Overchannel backlash`, `${2 * castLevel}d12`, "normal", result => [{ label: `Take ${result.total} necrotic`, run: () => dealDamage(result.total, { label: `Overchannel: took ${result.total} necrotic` }) }], `${name} deals ${maximizeDice(effect.perHit)} damage.`) });
  }
  // Elemental Adept: chosen damage type ignores resistance, and 1s on its damage dice count as 2s (PHB p.166).
  if (hasFeat("Elemental Adept") && effect?.types?.some(type => ["acid", "cold", "fire", "lightning", "thunder"].includes(type))) extras.push("Elemental Adept: 1s count as 2s on your chosen type");
  if (row.index === "spare-the-dying" && subclassLevel("grave")) extras.push("Circle of Mortality: bonus action, 30 ft range");
  const component = consumedComponentItem(detail);
  if (component) actions.push({ label: `Remove ${component.name} from inventory`, run: () => { character.equipment = character.equipment.filter(item => item.id !== component.id); persistAndRender(); } });
  // DMG p.200: a spell scroll crumbles once its spell is cast.
  if (grantingItem && /spell scroll/i.test(grantingItem.name || "")) actions.push({ label: "Remove the used scroll", run: () => { character.equipment = character.equipment.filter(item => item.id !== grantingItem.id); persistAndRender(); } });
  // Enhanced Bond (Wildfire 6, TCE p.40): +1d8 to one fire damage or healing roll while the spirit is summoned.
  const types = effect ? spellDamageTypes(effect, detail) : [];
  if (subclassLevel("wildfire") >= 6 && effect && !effect.full && ((effect.kind === "healing") || (effect.kind === "damage" && types.includes("fire"))) && !(effect.attack?.times > 1)) {
    const bonded = { ...effect, formula: `${effect.formula}+1d8`, perHit: `${effect.perHit}+1d8` };
    actions.push(effect.attack
      ? { label: "Roll attack + Enhanced Bond 1d8 (spirit summoned)", run: () => rollSpellAttack(name, bonded) }
      : { label: `${effect.label} + Enhanced Bond 1d8 (spirit summoned)`, run: () => rollSpellEffect(name, bonded) });
  }
  // Destructive Wrath (Tempest 2, PHB p.62): spend Channel Divinity to deal maximum lightning or thunder damage.
  const divinity = character.resources.find(item => item.name === "Channel Divinity");
  if (effect?.kind === "damage" && subclassLevel("tempest") >= 2 && Number(divinity?.current) > 0 && types.some(type => ["lightning", "thunder"].includes(type))) {
    actions.push({ label: `Destructive Wrath: max damage (${maximizeDice(effect.perHit)})`, run: () => {
      divinity.current = Number(divinity.current) - 1;
      persistAndRender();
      showToast(`<span class="toast-label">${escapeHtml(name)}: Destructive Wrath</span><span>${maximizeDice(effect.perHit)} damage, no roll. Channel Divinity ${divinity.current}/${divinity.max}.</span>`, { tone: "crit", actions: [{ label: "Undo", run: () => { divinity.current = Math.min(Number(divinity.max), Number(divinity.current) + 1); persistAndRender(); } }] });
    } });
  }
  // Expert Divination (Divination 6, PHB p.116): a divination spell of 2nd level or higher cast with a slot regains one
  // expended slot of a lower level, 5th at most.
  if (subclassLevel("divination") >= 6 && detail.school?.index === "divination" && castLevel >= 2 && ["slots", "pact"].includes(spent.pool)) {
    const slots = characterSpellSlots();
    for (let level = Math.min(castLevel - 1, 5); level >= 1; level -= 1) {
      if (slots[level - 1] && Number(character.spellSlotUsage?.[level] || 0) > 0) {
        actions.push({ label: `Expert Divination: regain a ${ordinal(level)}-level slot`, run: () => { character.spellSlotUsage[level] = Number(character.spellSlotUsage[level]) - 1; persistAndRender(); } });
      }
    }
  }
  actions.push(...castExtras, { label: "Undo", run: undo });
  if (effect?.note) extras.push(effect.note);
  if (effect?.uses) extras.push(`heals up to ${effect.uses} times`);
  const reminder = spellCastReminder(row);
  if (reminder) extras.unshift(reminder);
  const extra = extras.length ? ` · ${extras.join(" · ")}` : "";
  // Anything beyond Undo (roll damage, pick a target) is a choice, so the toast waits for it.
  showToast(`<span class="toast-label">Cast ${escapeHtml(name)}${castLevel > baseLevel ? ` at ${ordinal(castLevel)} level` : ""}</span><span>${escapeHtml(status)}${concentration ? " · concentrating" : ""}${escapeHtml(extra)}</span>`, { actions, duration: 10000, persist: actions.length > 1 });
}

// The cast toast's reminder: the target's save and DC, and the spell's key rider in short original wording.
// Spells not listed here fall back to their data (save-for-half damage).
const SPELL_RIDERS = {
  "vicious-mockery": "on a fail the target has disadvantage on its next attack roll before the end of its next turn",
  bane: "on a fail a target subtracts 1d4 from its attack rolls and saving throws (3 targets, +1 per slot level above 1st)",
  bless: "3 targets (+1 per slot level above 1st) add 1d4 to attack rolls and saving throws; switch on Bless in the roll window",
  "faerie-fire": "on a fail, attack rolls against the target have advantage and it can't benefit from being invisible",
  hex: "+1d6 necrotic each time you hit the target; it has disadvantage on checks with the ability you pick; when it drops to 0 HP, move the curse with a bonus action",
  "hunters-mark": "+1d6 each time you hit the target with a weapon attack; advantage on Perception and Survival checks to find it; when it drops to 0 HP, move the mark with a bonus action",
  "hold-person": "on a fail the humanoid is paralyzed; it repeats the save at the end of each of its turns (+1 target per slot level above 2nd)",
  slow: "on a fail: half speed, -2 AC and DEX saves, no reactions, an action or a bonus action (not both), one attack; it repeats the save at the end of each of its turns",
  web: "on a fail the creature is restrained; it can use its action on a STR check against your DC to get free",
  entangle: "on a fail the creature is restrained; it can use its action on a STR check against your DC to get free",
  command: "on a fail the target obeys your one-word command on its next turn (no effect on undead, a target that doesn't understand you, or a directly harmful command)",
  sleep: "no save; creatures fall asleep in order of lowest current HP until the rolled total runs out (undead and creatures immune to charm are unaffected)",
  "hideous-laughter": "on a fail the target falls prone and is incapacitated; it repeats the save at the end of each of its turns and when it takes damage (with advantage then)",
  "ray-of-frost": "on a hit the target's speed drops by 10 ft until the start of your next turn",
  "chill-touch": "on a hit the target can't regain HP until the start of your next turn; an undead target also has disadvantage on attacks against you until then",
  "shocking-grasp": "advantage on the attack if the target wears metal armor; on a hit it can't take reactions until the start of its next turn"
};

function spellCastReminder(row) {
  const detail = spellDetails[row.index] || {};
  const save = spellSaveFor(row);
  // A fixed DC (Contact Other Plane) is a save the caster makes.
  const fixedDc = SPELL_ROLL_OVERRIDES[row.index]?.fixedDc;
  const rider = SPELL_RIDERS[row.index] || (detail.dc?.dc_success === "half" ? "half damage on a success" : "");
  return [save ? `${save.slice(0, 3).toUpperCase()} save DC ${fixedDc || spellStatsFor(row).dc}${fixedDc ? " (you)" : ""}` : "", rider].filter(Boolean).join("; ");
}

// Warlock Mystic Arcanum: one spell each of 6th-9th level, cast once per long rest without a slot (warlock spells only).
// A custom pact class gets the spell levels its builder sets.
function arcanumFor(row) {
  const level = spellLevelForRow(row);
  if (level < 6 || !Object.values(arcanumLevelsFor(spellRowClass(row))).includes(level)) return null;
  return character.resources.find(item => item.name === `Mystic Arcanum (${ordinal(level)})`) || null;
}

// Ritual Casting belongs to the class the spell was learned through (bard, cleric, druid, wizard, artificer).
// Warlocks ritual-cast only the spells in a Book of Shadows (Book of Ancient Secrets), like Ritual Caster's book.
function ritualCastable(row) {
  const spell = allSpells.find(item => item.index === row.index) || {};
  const detail = spellDetails[row.index] || spell;
  if (!detail.ritual && !spell.ritual && !/ritual/i.test(detail.casting_time || "")) return false;
  if (row.ritualBook) return true;
  return ["bard", "cleric", "druid", "wizard", "artificer"].includes(spellRowClass(row)?.id);
}

// The closest level with a free slot: higher first (an upcast), then down to the spell's own level.
function nearestOpenSlot(baseLevel, from, slots) {
  for (let level = from + 1; level <= Math.max(slots.length, 5); level += 1) {
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
    actions: result => [
      ...damageFollowUps(name, effect.perHit, naturalD20(result), { cantrip: effect.baseLevel === 0 }),
      // Vampiric Touch and similar: you regain half the necrotic damage dealt.
      ...(effect.healFraction ? [{ label: "Heal me half the damage", run: () => rollFromInput(`${name} damage`, effect.perHit, "normal", damage => [{ label: `Heal me +${Math.floor(damage.total * effect.healFraction)}`, run: () => healBy(Math.floor(damage.total * effect.healFraction)) }]) }] : [])
    ],
    carry: index < times ? [{ label: `Next attack (${index + 1} of ${times})`, run: () => rollSpellAttack(name, effect, true, index + 1) }] : []
  });
}

function rollSpellEffect(name, effect) {
  if (effect.kind === "healing") {
    const others = healTargets();
    // Blessed Healer (Life 6): healing someone else heals you 2 + the slot level, once per casting (PHB p.60).
    let refunded = false;
    // Starry Form Chalice (TCE p.38): a slot-cast healing spell also heals you or a creature within 30 ft.
    const chaliceRoll = `${subclassLevel("stars") >= 10 ? 2 : 1}d8${formatMod(mod("wis"))}`;
    const chalice = effect.baseLevel >= 1 && starryForm() === "Chalice" ? [{ label: `Chalice: heal ${chaliceRoll}`, run: () => rollFromInput("Starry Form: Chalice", chaliceRoll, "normal", result => healButtons(result.total)) }] : [];
    const healAlly = (other, amount) => healTargetAction(other, `Heal ${other.name || "unnamed"}${amount > 0 ? ` +${amount}` : ""}`, () => {
      healOther(other.sheetId, amount);
      if (effect.selfHeal && !refunded) { refunded = true; healBy(effect.selfHeal); }
    });
    if (effect.full) {
      showToast(`<span class="toast-label">${escapeHtml(name)}</span><span>The target regains all its hit points.</span>`, {
        actions: [
          { label: "Heal me to full", run: () => healBy(Math.max(0, effectiveMaxHp() - Number(character.hp || 0))) },
          ...others.map(other => healAlly(other, Math.max(0, effectiveMaxHp(other) - Number(other.hp || 0)))),
          ...chalice
        ],
        persist: true
      });
      return;
    }
    rollFromInput(`${name} healing`, effect.formula, "normal", result => {
      const amount = total => total * effect.multiplier + (effect.bonus || 0);
      // Circle of Mortality (Grave): a creature at 0 HP gets the dice's maximum.
      // Beacon of Hope (PHB p.217): its targets regain the most the dice can give.
      const beacon = target => Number(target.effects?.["Beacon of Hope"] || 0) > 0 && /^\d+$/.test(maximizeDice(effect.formula));
      const forTarget = target => effect.mortalityMax !== null && effect.mortalityMax !== undefined && Number(target.hp || 0) <= 0 ? amount(effect.mortalityMax)
        : beacon(target) ? amount(Number(maximizeDice(effect.formula))) : amount(result.total);
      return [
        ...(effect.multiplier > 1 ? [{ label: `Take ${result.total} necrotic`, run: () => dealDamage(result.total, { label: `${name}: took ${result.total} necrotic` }) }] : []),
        { label: `Heal me +${forTarget(character)}`, run: () => healBy(forTarget(character)) },
        ...others.map(other => healAlly(other, forTarget(other))),
        ...chalice
      ];
    });
    return;
  }
  if (effect.kind === "temp") {
    rollFromInput(`${name} temporary HP`, effect.formula, "normal", result => [{ label: `Gain ${result.total} temp HP`, run: () => gainTempHp(result.total) }]);
    return;
  }
  // Aid (until a long rest) and Heroes' Feast (24 hours) raise the HP maximum and current HP together.
  if (effect.kind === "maxhp") {
    rollFromInput(`${name} HP maximum`, effect.formula, "normal", result => [
      { label: `Me: +${result.total} max HP`, run: () => raiseMaxHp(character, result.total, slug(name)) },
      ...otherSheets().map(other => ({ label: `${other.name || "unnamed"}: +${result.total} max HP`, run: () => raiseMaxHp(other, result.total, slug(name)) }))
    ]);
    return;
  }
  const what = { pool: "HP affected", rider: "extra damage on a hit" }[effect.kind] || effect.kind;
  // Hexblade's Curse (XGE p.55): +proficiency bonus to any damage roll against the cursed target, save spells included.
  const curse = effect.kind === "damage" && typeof hexbladeCurseActive === "function" && hexbladeCurseActive() ? proficiencyBonus() : 0;
  rollFromInput(`${name} ${what}`, effect.formula, "normal", result => [
    ...(effect.healFraction ? [{ label: `Heal me +${Math.floor(result.total * effect.healFraction)}`, run: () => healBy(Math.floor(result.total * effect.healFraction)) }] : []),
    ...(effect.kind === "damage" && effect.baseLevel === 0 ? cantripRiderFollowUps(name) : []),
    ...(curse ? [{ label: `Cursed target: +${curse}`, run: () => reviseRollResult(null, 0, `Hexblade's Curse +${curse}`, curse) }] : [])
  ]);
}

// maxHpBonus is the total; maxHpBonuses keeps each spell's share. The same spell doesn't stack with itself, only the
// strongest casting counts (PHB p.205). Going through updateSheet clears death saves when a dying ally gets HP back.
// Effects a spell leaves on its targets, in rounds: Death Ward 8 hours, Beacon of Hope 1 minute.
const SPELL_TARGET_EFFECTS = { "death-ward": ["Death Ward", 4800], "beacon-of-hope": ["Beacon of Hope", 10], "shield-of-faith": ["Shield of Faith", 100], haste: ["Haste", 10], barkskin: ["Barkskin", 600] };

function raiseMaxHp(target, amount, source = "") {
  const own = target === character;
  const who = own ? "Your" : target.name ? `${target.name}'s` : "Their";
  const previous = Number(target.maxHpBonuses?.[source] || 0);
  const delta = source ? amount - previous : amount;
  if (delta <= 0) {
    showToast(`<span class="toast-label">${escapeHtml(who)} HP maximum unchanged</span><span>The same spell doesn't stack: the +${previous} already on them is as strong or stronger.</span>`);
    return;
  }
  const before = { maxHpBonus: target.maxHpBonus, maxHpBonuses: { ...(target.maxHpBonuses || {}) }, hp: target.hp };
  const updated = updateSheet(target.sheetId, sheet => {
    sheet.maxHpBonus = Number(sheet.maxHpBonus || 0) + delta;
    if (source) sheet.maxHpBonuses = { ...(sheet.maxHpBonuses || {}), [source]: amount };
    sheet.hp = Number(sheet.hp || 0) + delta;
  }) || target;
  showToast(`<span class="toast-label">${escapeHtml(who)} HP maximum +${delta}</span><span>${updated.hp}/${effectiveMaxHp(updated)} HP${source === "heroes-feast" ? " for 24 hours" : " until a long rest"}.</span>`, {
    actions: [{ label: "Undo", run: () => updateSheet(target.sheetId, sheet => Object.assign(sheet, before)) }]
  });
}

// Flat temporary hit points granted on casting (Armor of Agathys and similar), scaled by slot level.
function spellTempHpGrant(row, castLevel) {
  const detail = spellDetails[row.index] || {};
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

// Upcasting that changes the duration (minutes by slot level): Hex/Hunter's Mark 8 hours at 3rd, 24 at 5th;
// Bestow Curse 10 minutes at 4th, 8 hours at 5th, 24 at 7th, until dispelled at 9th.
const SPELL_DURATION_BY_LEVEL = {
  hex: { 3: 480, 5: 1440 },
  "hunters-mark": { 3: 480, 5: 1440 },
  "bestow-curse": { 4: 10, 5: 480, 7: 1440, 9: Infinity }
};

// Minutes a spell lasts, from its duration text ("Concentration, up to 1 hour"), or null when unknown.
function spellDurationMinutes(spellName, castLevel = spellName === character.concentration ? character.concentrationLevel : 0) {
  const row = (character.spells || []).find(entry => spellDisplayName(entry) === spellName);
  const detail = (row && spellDetails[row.index]) || Object.values(spellDetails).find(entry => entry.name === spellName);
  const longer = Object.entries(SPELL_DURATION_BY_LEVEL[row?.index || detail?.index] || {}).filter(([level]) => Number(castLevel) >= Number(level)).pop();
  if (longer) return longer[1];
  const duration = String(detail?.duration || "");
  const match = duration.match(/(\d+)\s*(round|minute|hour|day)/i);
  if (!match) return null;
  const unit = { round: 0.1, minute: 1, hour: 60, day: 1440 }[match[2].toLowerCase()];
  return Number(match[1]) * unit;
}

const NUMBER_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5 };

// Spells the roller can't read from the SRD's structured fields or from the summary text. kind: damage | healing |
// temp | maxhp | rider | pool; formula: dice, or (upcast, mod) => dice; none: the dice in the text aren't the spell's effect.
// tag: what the dice are, shown after them where the number alone would read as save-for-half damage.
const SPELL_ROLL_OVERRIDES = {
  // Web's dice only matter if the webs burn (2d4 fire); Heat Metal's damage has no save (the CON save is to keep holding).
  web: { kind: "damage", tag: "fire if burned", label: "Roll fire damage" },
  "heat-metal": { kind: "damage", tag: "fire, no save" },
  sleep: { kind: "pool" },
  "color-spray": { kind: "pool" },
  // One 10d8 roll; each target saves on its own. One more target per slot level above 6th.
  "chain-lightning": { kind: "damage", formula: "10d8", targets: upcast => 4 + upcast },
  "prismatic-spray": { kind: "damage", formula: "10d6", note: "Roll a d8 for each target's ray." },
  "arcane-hand": { kind: "damage", formula: upcast => `${4 + 2 * upcast}d8`, note: "Clenched Fist. Grasping Hand crush: 2d6 + spellcasting modifier (+2d6 per slot level above 5th)." },
  earthquake: { none: true, save: "Dexterity" },
  "time-stop": { none: true },
  "control-weather": { none: true },
  teleport: { none: true },
  wish: { none: true },
  // Ice Knife: the dart is 1d10 piercing; the 2d6 cold burst (+1d6 per slot above 1st) hits everything within 5 ft, hit or miss.
  "ice-knife": { kind: "damage", formula: "1d10", note: upcast => `Burst: ${2 + upcast}d6 cold, DEX save, within 5 ft of the target, hit or miss.` },
  "elemental-weapon": { kind: "rider", scaling: { 3: "1d4", 5: "2d4", 7: "3d4" } },
  "chaos-bolt": { kind: "damage", formula: upcast => `2d8+${1 + upcast}d6` },
  "destructive-wave": { kind: "damage", formula: "5d6+5d6", note: "5d6 thunder plus 5d6 radiant or necrotic." },
  "enhance-ability": { kind: "temp", formula: "2d6", note: "Bear's Endurance only." },
  "heroes-feast": { kind: "maxhp", formula: "2d10", note: "Each guest's HP maximum and current HP rise by this much for 24 hours." },
  aid: { kind: "maxhp" },
  "false-life": { kind: "temp" },
  "enlarge-reduce": { kind: "rider", formula: "1d4" },
  "vampiric-touch": { healFraction: 0.5 },
  enervation: { kind: "damage", healFraction: 0.5 },
  "life-transference": { kind: "healing", formula: upcast => `${4 + upcast}d8`, multiplier: 2, note: "You take this much necrotic damage; the target heals twice that." },
  regenerate: { kind: "healing", formula: "4d8+15" },
  "healing-spirit": { kind: "healing", formula: upcast => `${1 + upcast}d6`, uses: mod => Math.max(2, 1 + mod) },
  "aura-of-vitality": { kind: "healing", formula: "2d6" },
  "negative-energy-flood": { kind: "damage", formula: "5d12" },
  "tensers-transformation": { kind: "temp", formula: "50", note: "Weapon hits deal an extra 2d12 force while it lasts." },
  "spirit-shroud": { kind: "rider", formula: upcast => `${1 + Math.floor(upcast / 2)}d8` },
  heroism: { kind: "temp", formula: (upcast, mod) => String(Math.max(0, mod)), note: "Again at the start of each of the target's turns." },
  // Casting puts ten berries in the inventory (spellCastExtras); eating one heals 1.
  goodberry: { none: true },
  "power-word-heal": { kind: "healing", full: true },
  "toll-the-dead": { kind: "damage", alt: { sides: 12, when: "if it is missing HP" } },
  "steel-wind-strike": { kind: "damage", formula: "6d10", times: 5 },
  "contact-other-plane": { none: true, fixedDc: 15, save: "Intelligence" },
  "shadow-blade": { kind: "damage", scaling: { 2: "2d8", 3: "3d8", 5: "4d8", 7: "5d8" } },
  "green-flame-blade": { none: true },
  "booming-blade": { none: true },
  catapult: { kind: "damage" },
  "thunder-step": { kind: "damage" },
  "erupting-earth": { kind: "damage" },
  "ray-of-sickness": { kind: "damage" },
  "witch-bolt": { kind: "damage" }
};

// Damage cantrips whose dice don't grow with character level.
const NON_SCALING_CANTRIPS = new Set(["magic-stone"]);

function spellText(detail) {
  // "can't regain hit points" (Chill Touch, Spirit Shroud) must not read as healing.
  return [detail.desc].flat().filter(Boolean).join(" ").replace(/can(?:no|['’])t regain hit points/gi, "");
}

// The SRD's structured damage/healing for this cast level; formula is null when the table lacks the level.
function structuredSpellFormula(detail, castLevel, modifier) {
  // A slot-level table that stops below the cast level, on a spell with no upcast text, keeps its highest listed value.
  const atSlot = table => table[castLevel] ?? ([detail.higher_level].flat().filter(Boolean).length ? undefined
    : Object.entries(table).filter(([level]) => Number(level) <= castLevel).pop()?.[1]);
  const tidy = value => String(value).replace(/\s*\+\s*MOD/g, modifier ? formatMod(modifier) : "").replace(/\s+/g, "");
  if (detail.heal_at_slot_level) {
    const value = atSlot(detail.heal_at_slot_level);
    return { kind: "healing", formula: value ? tidy(value) : null };
  }
  const entries = (detail.damage || []).filter(entry => entry.damage_at_slot_level || entry.damage_at_character_level);
  if (!entries.length) return null;
  let choseHigher = false;
  const parts = entries.map(entry => {
    let value = entry.damage_at_slot_level ? atSlot(entry.damage_at_slot_level)
      : Object.entries(entry.damage_at_character_level).filter(([level]) => Number(level) <= totalLevel()).pop()?.[1];
    // Flame Strike: "4d6 OR 5d6" — one of the two damage types grows per slot level, not both.
    if (value && / OR /.test(value)) {
      const [low, high] = value.split(/\s+OR\s+/);
      value = choseHigher ? low : high;
      choseHigher = true;
    }
    return value ? tidy(value) : null;
  });
  return {
    kind: "damage",
    formula: parts.every(Boolean) ? parts.join("+") : null,
    types: entries.map(entry => entry.damage_type?.index).filter(Boolean)
  };
}

// Damage, healing or temp HP for casting a spell at castLevel. Structured SRD fields first, then overrides, then the text.
function spellEffectRoll(row, castLevel) {
  const detail = spellDetails[row.index] || {};
  const override = SPELL_ROLL_OVERRIDES[row.index] || {};
  if (override.none) return null;
  const baseLevel = spellLevelForRow(row);
  castLevel = Math.max(baseLevel, Number(castLevel) || baseLevel);
  if (override.full) return { kind: "healing", full: true, formula: "", perHit: "", chip: "all HP", label: "Restore all HP", castLevel, baseLevel, multiplier: 1, bonus: 0, selfHeal: 0, mortalityMax: null, healFraction: 0, uses: 0, alt: "", altWhen: "", types: [], note: "", attack: null };
  const upcast = castLevel - baseLevel;
  const stats = spellStatsFor(row);
  const abilityMod = stats.valid ? stats.mod : 0;
  const text = spellText(detail);
  const higher = [detail.higher_level].flat().filter(Boolean).join(" ");
  const tiers = [5, 11, 17].filter(level => totalLevel() >= level).length;
  // A custom spell's attack, save, damage and healing come only from its own fields (customSpellDetail), never the text.
  const attack = Boolean(detail.attack_type) || (!detail.custom && /spell attack/i.test(text));
  const structured = structuredSpellFormula(detail, castLevel, abilityMod);
  if (detail.custom && !structured?.formula) return null;
  let formula = null;
  let kind = override.kind || detail.effect || "";
  let projectiles = 1;
  let noun = "";
  if (override.scaling) {
    formula = Object.entries(override.scaling).filter(([level]) => Number(level) <= castLevel).pop()?.[1] || null;
  } else if (override.formula) {
    formula = typeof override.formula === "function" ? override.formula(upcast, abilityMod) : override.formula;
  } else if (structured?.formula) {
    formula = structured.formula;
  }
  // Rays and beams roll one attack each (Scorching Ray, Eldritch Blast); only Magic Missile's darts sum into one roll.
  const projectileMatch = text.match(/\b(two|three|four|five|\d+)\s+(?:glowing\s+)?(darts|rays|beams)\b/i);
  if (projectileMatch && (attack || /darts/i.test(projectileMatch[2])) && !override.formula && !detail.custom) {
    projectiles = NUMBER_WORDS[projectileMatch[1].toLowerCase()] || Number(projectileMatch[1]);
    noun = projectileMatch[2].toLowerCase();
    if (/one (?:more|additional) (dart|ray|beam)/i.test(`${higher} ${text}`)) projectiles += upcast;
  }
  if (!formula) {
    const beamCantrip = baseLevel === 0 && /more than one beam/i.test(`${text} ${higher}`);
    const parsed = textSpellFormula(text, higher, baseLevel, upcast, abilityMod, beamCantrip || NON_SCALING_CANTRIPS.has(row.index) ? 0 : tiers);
    if (!parsed) return null;
    formula = parsed.formula;
    // Darts that always hit: the structured table already sums them; the text gives one dart's dice.
    if (projectiles > 1 && noun === "darts" && !attack) formula = multiplyFormula(formula, projectiles);
  } else if (projectiles > 1 && noun === "darts") {
    // Magic Missile's structured "3d4 + 3" is already the total for all darts.
  }
  let beams = 0;
  if (baseLevel === 0 && /more than one beam/i.test(`${text} ${higher}`)) beams = 1 + tiers;
  if (!kind) {
    const healing = /(?:regains?|restores?)\s+(?:a number of\s+|\d+d\d+(?:\s*\+\s*\d+)?\s+|all (?:its |of its )?)?hit points|regains? hit points equal to|heal(?:s|ed)? (?:by|for)/i.test(text)
      && !/(?:you|caster) regains? hit points equal to half/i.test(text);
    kind = detail.custom ? structured.kind
      : structured?.kind === "healing" ? "healing"
      : /the total is how many hit points/i.test(text) ? "pool"
      : structured?.kind === "damage" && !/(?:weapon attacks?|your attacks?)[^.]*(?:extra|additional|\+)\s*\d+d\d+/i.test(text) ? "damage"
      : healing ? "healing"
      : /temporary hit points/i.test(text) && !/damage/i.test(text) ? "temp"
      // Damage that rides on later hits ("an extra 1d6 ... on a hit", "+1d6 fire" on your next hit), not a spell attack's own damage.
      : !attack && /\b(?:extra|additional)\s+\d+d\d+[^.]*\b(?:hit|attack)|(?:hit|attacks?)[^.]*(?:extra|additional|\+)\s*\d+d\d+/i.test(text) ? "rider"
      : "damage";
  }
  const casterLevel = entry => entry ? entry.level : 0;
  const owner = spellRowEntry(row);
  const ownerClass = owner ? entryClass(owner) : null;
  const ownerSub = owner ? subclassIndexFor(owner) : "";
  const notes = [typeof override.note === "function" ? override.note(upcast) : override.note || ""];
  let perBeam = 0;
  let flat = 0;
  // Agonizing Blast adds Charisma to each Eldritch Blast beam when the invocation is recorded.
  if (row.index === "eldritch-blast" && hasInvocation("Agonizing Blast")) perBeam += mod("cha");
  // Potent Spellcasting (cleric 8: Knowledge, Light, Arcana, Grave, Peace) or Moon Domain's Empowered Cantrips:
  // +WIS to cleric cantrip damage, read from the domain's own 8th-level row. Blessed Strikes replaces it (TCE p.30).
  const cantripBoost = (SUBCLASS_FEATURES[ownerSub]?.features || []).find(([level, featureName]) => level === 8 && /^(Potent Spellcasting|Empowered Cantrips)$/.test(featureName))?.[1];
  if (kind === "damage" && baseLevel === 0 && ownerClass?.id === "cleric" && casterLevel(owner) >= 8 && cantripBoost && !optionalFeatureTaken("blessedStrikes")) {
    perBeam += mod("wis");
    notes.push(cantripBoost);
  }
  // Empowered Evocation (Evocation wizard 10): +INT to one damage roll of a wizard evocation spell.
  if (kind === "damage" && ownerClass?.id === "wizard" && ownerSub === "evocation" && casterLevel(owner) >= 10 && detail.school?.index === "evocation") {
    flat += mod("int");
    notes.push("Empowered Evocation");
  }
  // Alchemical Savant (Alchemist 5, TCE p.14): +INT (min 1) to one healing, acid, fire, necrotic or poison roll of an
  // artificer spell cast through alchemist's supplies.
  if (ownerClass?.id === "artificer" && subclassLevel("alchemist") >= 5 && !override.full
    && (kind === "healing" || (kind === "damage" && spellDamageTypes(structured || {}, detail).some(type => ["acid", "fire", "necrotic", "poison"].includes(type))))) {
    flat += Math.max(1, mod("int"));
    notes.push("Alchemical Savant");
  }
  // Disciple of Life (Life 1): healing spells of 1st level or higher heal 2 + the slot level more. Supreme Healing (17): max dice.
  const life = subclassLevel("life");
  let bonus = 0;
  if (kind === "healing" && baseLevel >= 1 && life >= 1 && !override.full) {
    // Life Transference doubles the roll, so its bonus is added after doubling.
    if (override.multiplier > 1) bonus = 2 + castLevel;
    else flat += 2 + castLevel;
    notes.push(`Disciple of Life +${2 + castLevel}`);
  }
  // Elemental Adept / Flames of Phlegethos die rules ride on the first dice group.
  const dieRule = kind === "damage" ? spellDamageDieRule(text) : "";
  if (dieRule) formula = formula.replace(/\d+d\d+/, match => `${match}${dieRule}`);
  if (perBeam && !beams) flat += perBeam;
  formula = addFlat(formula, flat);
  const perHit = beams ? addFlat(formula, perBeam) : formula;
  // Circle of Mortality (Grave 1): dice healing a creature at 0 HP use their maximum.
  const maxAmount = kind === "healing" && /d/.test(formula) && /^\d+$/.test(maximizeDice(formula)) ? Number(maximizeDice(formula)) : null;
  if (kind === "healing" && life >= 17 && !(override.multiplier > 1)) {
    formula = maximizeDice(formula);
    notes.push("Supreme Healing");
  }
  // Moon Sickle (TCE p.133): a spell that restores HP restores 1d4 more while you hold it.
  if (kind === "healing" && !(override.multiplier > 1) && activeItemNamed(/moon sickle/i)) {
    formula = `${formula}+1d4`;
    notes.push("Moon Sickle +1d4");
  }
  const times = override.times || (beams > 1 ? beams : projectiles > 1 && attack ? projectiles : 1);
  const targets = override.targets ? override.targets(upcast) : 0;
  const multiple = times > 1 ? `${times} ${noun || (beams ? "beams" : "attacks")}` : "";
  const tag = override.tag || (kind === "pool" ? "HP affected" : "");
  const label = override.label || { healing: "Roll healing", pool: "Roll HP affected", temp: "Roll temp HP", rider: "Roll extra damage on a hit", maxhp: "Roll HP max increase" }[kind]
    || (targets ? `Roll damage (up to ${targets} targets)` : multiple ? `Roll damage per ${(noun || (beams ? "beam" : "attack")).replace(/s$/, "")}` : "Roll damage");
  return {
    formula: beams ? perHit : formula,
    perHit: beams ? perHit : formula,
    chip: (override.full ? "all HP" : times > 1 ? `${beams ? perHit : formula} ×${times}` : targets ? `${formula} ×${targets}` : formula) + (tag ? ` ${tag}` : ""),
    kind,
    label: override.full ? "Restore all HP" : label,
    castLevel,
    baseLevel,
    full: Boolean(override.full),
    multiplier: override.multiplier || 1,
    bonus,
    // Blessed Healer (Life 6): healing someone else with a 1st+ level spell heals you 2 + the slot level.
    selfHeal: kind === "healing" && baseLevel >= 1 && life >= 6 ? 2 + castLevel : 0,
    mortalityMax: kind === "healing" && subclassLevel("grave") >= 1 ? maxAmount : null,
    healFraction: override.healFraction || 0,
    uses: override.uses ? override.uses(abilityMod) : 0,
    alt: override.alt ? formula.replace(/d\d+/, `d${override.alt.sides}`) : "",
    altWhen: override.alt?.when || "",
    types: structured?.types || [],
    note: notes.filter(Boolean).join(" · "),
    attack: attack ? { bonus: stats.attack, times } : null
  };
}

// Damage types a spell deals: the SRD's structured types, else the "<type> damage" phrases in its text.
function spellDamageTypes(effect, detail) {
  if (effect?.types?.length) return effect.types;
  return [...spellText(detail).matchAll(/\b(acid|cold|fire|force|lightning|necrotic|poison|psychic|radiant|thunder) damage/gi)].map(match => match[1].toLowerCase());
}

// The text fallback: first dice group, flat bonus, the spellcasting modifier only when it follows those dice,
// per-slot upcasting from the higher-level text or a "(+1d8 per slot level above 1st)" note, and cantrip scaling.
function textSpellFormula(text, higher, baseLevel, upcast, abilityMod, tiers) {
  const base = text.match(/\b(\d+)d(\d+)(?:\s*\+\s*(\d+)(?!d))?/);
  if (!base) return null;
  const sides = Number(base[2]);
  let count = Number(base[1]);
  const flat = Number(base[3] || 0);
  // "4d6 fire damage and 4d6 radiant damage": two dice groups in one effect.
  const pair = text.match(/\b\d+d\d+\s+\w+\s+damage\s+and\s+(\d+)d(\d+)\s+\w+\s+damage/i);
  let second = pair ? { count: Number(pair[1]), sides: Number(pair[2]) } : null;
  // "1d6 for each slot level above", "per slot level above", "for every two slot levels above" (Spiritual Weapon).
  const perSlot = `${higher} ${text}`.match(/(\d+)d(\d+)\b[^.;()]*?\b(?:for each|per|for every)\s+(two\s+)?slot levels? above/i);
  if (perSlot && upcast) {
    const steps = perSlot[3] ? Math.floor(upcast / 2) : upcast;
    if (Number(perSlot[2]) === sides) count += Number(perSlot[1]) * steps;
    else if (second && Number(perSlot[2]) === second.sides) second = { ...second, count: second.count + Number(perSlot[1]) * steps };
  }
  // Damage cantrips gain a die at character levels 5, 11 and 17 (tiers is 0 for beam and non-scaling cantrips).
  if (baseLevel === 0) count *= 1 + tiers;
  const followsMod = new RegExp(`\\b${base[1]}d${base[2]}\\s*\\+\\s*(?:your\\s+)?spellcasting (?:ability )?modifier`, "i").test(text);
  const total = flat + (followsMod ? abilityMod : 0);
  return { formula: `${count}d${sides}${second ? `+${second.count}d${second.sides}` : ""}${total ? formatMod(total) : ""}` };
}

function multiplyFormula(formula, times) {
  return formula.replace(/(\d+)d(\d+)/g, (_, count, sides) => `${count * times}d${sides}`).replace(/([+-])(\d+)(?!d|\d)/g, (_, sign, value) => `${sign}${value * times}`);
}

function addFlat(formula, amount) {
  if (!amount) return formula;
  const match = formula.match(/^(.*?)([+-]\d+)$/);
  if (match && !/d/.test(match[2])) {
    const total = Number(match[2]) + amount;
    return `${match[1]}${total ? formatMod(total) : ""}`;
  }
  return /^\d+$/.test(formula) ? String(Number(formula) + amount) : `${formula}${formatMod(amount)}`;
}

function maximizeDice(formula) {
  const total = formula.replace(/(\d+)d(\d+)/g, (_, count, sides) => String(count * sides));
  return /^[\d+-]+$/.test(total) ? String(total.split(/(?=[+-])/).reduce((sum, part) => sum + Number(part), 0)) : total;
}

// The ward's HP live in character.arcaneWard ({ hp, max }) once it's up; this view lets casting and its undo treat it like a tracker.
function arcaneWardTracker() {
  const ward = subclassLevel("abjuration") >= 2 && character.arcaneWard;
  return ward ? { get current() { return Number(ward.hp); }, set current(value) { ward.hp = value; }, get max() { return Number(ward.max); } } : null;
}

function spellRowForElement(element) {
  const node = element.closest("[data-spell-id]");
  return node ? character.spells.find(row => row.id === node.dataset.spellId) : null;
}

function spellConcentrationLabel(row, castLevel = 0) {
  // Bestow Curse with a 5th-level or higher slot needs no concentration.
  if (row.index === "bestow-curse" && castLevel >= 5) return "";
  const detail = spellDetails[row.index];
  return detail?.concentration ? detail.name || "Custom spell" : "";
}

function renderSpellRows() {
  const root = document.querySelector("#spellRows");
  const template = document.querySelector("#spellRowTemplate");
  root.innerHTML = "";
  visibleSpellLevels().forEach(level => {
    const section = document.createElement("section");
    section.className = "spell-section";
    const rows = character.spells.filter(row => spellLevelForRow(row) === level);
    // Cantrips known are counted per class; species, feat, item and subclass cantrips don't count (PHB p.164).
    const casters = casterEntries();
    const cap = level === 0 ? casters.reduce((sum, entry) => sum + entryCantripCap(entry), 0) : null;
    if (level === 0 && !cap && !rows.length) return;
    const chosen = level === 0
      ? casters.reduce((sum, entry) => sum + entryCantripCount(entry), 0)
      : rows.filter(row => spellRowHasSpell(row) && !spellAlwaysPrepared(row)).length;
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
      fillSpellSelect(select, spellSelectValue(row), spellChoices(row.index, level, row));
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
        quick.setAttribute("aria-label", `${quickState.label} ${spellDisplayName(row)}`);
      }
      prepared.checked = always || (level > 0 && row.prepared && !grantingItem);
      prepared.disabled = level === 0 || always || Boolean(grantingItem);
      if (level === 0) prepared.closest("label").classList.add("is-disabled");
      // Spells from a known-spell class, a feat or a ritual book are never "prepared".
      if (!always && !grantingItem && level > 0 && !spellRowNeedsPreparing(row)) prepared.closest("label").style.display = "none";
      if (always) {
        const label = prepared.closest("label");
        label.classList.add("is-always");
        label.lastChild.textContent = row.source?.kind === "species" ? ` From ${character.species || "species"}` : row.signature ? " Signature spell" : " Always prepared";
        if (!row.signature) {
          remove.style.display = "none";
          select.disabled = true;
        }
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
          // A new library spell at this row's level; the editor under the row fills it in.
          expandedSpellRows.add(row.id);
          row.index = createCustomSpell(level).id;
          if (!row.classKey && !row.source && !row.itemId) row.classKey = defaultSpellEntry(row.index)?.key || "primary";
        } else {
          row.index = select.value;
          if (!row.classKey && !row.source && !row.itemId) row.classKey = defaultSpellEntry(row.index)?.key || "primary";
        }
        row.level = level;
        row.prepared = level > 0 && row.prepared;
        persistAndRender();
        offerSpellbookCopy(row, level);
      });
      prepared.addEventListener("change", () => {
        const key = spellRowKey(row);
        if (prepared.checked && !canPrepareAnother(key)) {
          prepared.checked = false;
          gatePrepare(() => { row.prepared = true; persistAndRender(); }, key);
          return;
        }
        row.prepared = prepared.checked;
        persistAndRender();
      });
      remove.addEventListener("click", () => {
        character.spells = character.spells.filter(item => item.id !== row.id);
        persistAndRender();
      });
      renderCustomSpellEditor(node, row);
      const card = node.querySelector(".spell-card");
      renderSpellCard(card, row);
      card.addEventListener("change", event => handleSpellCardChange(event, row));
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

// The spells a row may hold: its class's list (or every caster's list for a new row in a multiclass), up to the level
// that class can cast; any list for Magical Secrets and feat rows; rituals for a ritual book.
function spellChoices(currentIndex = "", level = null, row = null) {
  // A spell an item grants (a held scroll) can still be learned or copied into the spellbook (PHB p.114).
  const selected = new Set(character.spells.filter(item => !item.itemId).map(item => item.index).filter(Boolean));
  if (currentIndex) selected.delete(currentIndex);
  const includeAll = document.querySelector("#showAllSpells")?.checked === true;
  const owner = row?.classKey ? spellRowEntry(row) : null;
  const entries = owner ? [owner] : casterEntries().length ? casterEntries() : [classEntries()[0]];
  const allowed = item => {
    if (row?.tome) return item.level === 0;
    // Ritual Caster (PHB p.169): the chosen class's rituals up to half your character level. Book of Ancient Secrets: any class, half your warlock level.
    if (row?.ritualBook && row.source) {
      const cls = SPELLCASTING_CLASSES[featVariant(row.source.name || takenFeatEntries().find(entry => featBaseName(entry) === "Ritual Caster") || "")]?.[0];
      return Boolean(spellDetails[item.index]?.ritual) && item.level <= Math.max(1, Math.ceil(totalLevel() / 2)) && (!cls || spellOnClassList(item, cls));
    }
    if (row?.ritualBook) return Boolean(spellDetails[item.index]?.ritual) && item.level <= Math.max(1, Math.ceil(classLevel("warlock") / 2));
    // A species cantrip pick comes from its own list (High Elf: the wizard list, PHB p.23).
    const speciesPick = row?.source?.kind === "species" && Number(row.level) === 0 ? speciesChoices(character.species) : null;
    if (speciesPick?.cantripFrom) return item.level === 0 && spellOnClassList(item, speciesPick.cantripFrom);
    if (speciesPick?.cantripList) return speciesPick.cantripList.includes(item.index);
    if (row?.source || includeAll) return true;
    if (row?.secret) return item.level <= maxSpellLevelFor(BUILT_IN_CLASSES.bard, classLevel("bard"));
    return entries.some(entry => {
      const cls = entryClass(entry);
      return spellMatchesClass(item, cls, entry) && (item.level === 0 || item.level <= Math.max(1, maxSpellLevelFor(cls, entry.level)));
    });
  };
  return allSpells
    .filter(item => currentIndex === item.index || !selected.has(item.index))
    .filter(item => currentIndex === item.index || allowed(item))
    .filter(item => currentIndex === item.index || level === null || Number(level) === item.level)
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

function spellSelectValue(row) {
  return row.index || "";
}

function spellRowHasSpell(row) {
  return Boolean(row.index);
}

function spellLevelForRow(row) {
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

// A class's own list, plus its subclass's always-prepared and expanded spells, extra lists (Divine Soul learns cleric
// spells), bonus-cantrip lists (Nature, Arcana, Death domains) and, with the Tasha's rule on, the optional additions.
function spellMatchesClass(item, cls, entry = classEntries().find(candidate => entryClass(candidate).id === cls.id) || classEntries()[0]) {
  const sources = new Set(cls.spellSources || []);
  const slug = subclassIndexFor(entry) || "";
  const extras = lookupBySubclass(SUBCLASS_EXTRAS, slug);
  if (extras && (!extras.classId || extras.classId === cls.id)) (extras.spellSources || []).forEach(source => sources.add(source));
  if (sources.has("artificer") && ARTIFICER_SPELLS.has(item.index)) return true;
  const grants = slug ? lookupBySubclass(SUBCLASS_SPELLS, slug) : null;
  if (grants && Object.values(grants).some(list => list.includes(item.index))) return true;
  if (slug === "land" && Object.values(LAND_CIRCLE_SPELLS[character.classChoices?.landTerrain] || {}).some(list => list.includes(item.index))) return true;
  const genie = slug === "genie" && character.classChoices?.genieKind ? `genie-${character.classChoices.genieKind.toLowerCase()}` : slug;
  if (slug && (EXPANDED_SUBCLASS_SPELLS[genie] || lookupBySubclass(EXPANDED_SUBCLASS_SPELLS, slug) || []).includes(item.index)) return true;
  if (item.level === 0 && SUBCLASS_BONUS_CANTRIPS[slug]?.matches(item)) return true;
  if (optionalRule("tashas") && (item.optionalClasses || []).some(classId => sources.has(classId))) return true;
  // A custom class's own extra spells; a custom spell tied to no class fits any caster.
  if ((cls.spellList || []).includes(item.index) || (item.custom && !item.classes.length)) return true;
  return (item.classes || []).some(classId => sources.has(classId));
}

// ---------------------------------------------------------------------------------------------
// Custom spells (J28): library records (classes.js customSpells) become API-shaped details here, so casting, rituals,
// concentration, saves and damage read the same structured fields as SRD spells.
// ---------------------------------------------------------------------------------------------
const CUSTOM_DICE = /^\d{1,2}d(?:4|6|8|10|12|20)(?:\s*\+\s*(?:\d{1,3}|mod))?$/i;
const CUSTOM_STEP = /^(?:\d{1,2}d(?:4|6|8|10|12|20)|\d{1,3})$/i;

// "2d6" + "1d6" twice = "4d6"; a different die or a flat number is added on ("2d6 + 2d8", "1d8 + MOD + 10").
function scaleDice(base, per, times) {
  if (!per || !times) return base;
  const [, count, sides] = per.match(/^(\d+)d(\d+)$/i) || [];
  const lead = base.match(/^(\d+)d(\d+)/);
  if (sides && lead && lead[2] === sides) return base.replace(lead[0], `${Number(lead[1]) + Number(count) * times}d${sides}`);
  return `${base} + ${sides ? `${Number(count) * times}d${sides}` : Number(per) * times}`;
}

function customSpellDetail(spell) {
  const dice = value => CUSTOM_DICE.test(String(value || "").trim()) ? String(value).trim().replace(/\s*\+\s*mod$/i, " + MOD") : "";
  const step = value => CUSTOM_STEP.test(String(value || "").trim()) ? String(value).trim() : "";
  // By slot level from the spell's own up to 9th. Damage cantrips grow at character levels 5, 11 and 17 by their
  // per-slot step, or by their own first die when none is set.
  const bySlot = (base, per) => Object.fromEntries(Array.from({ length: 10 - spell.level }, (_, n) => [spell.level + n, scaleDice(base, per, n)]));
  const byCharacter = (base, per) => Object.fromEntries([1, 5, 11, 17].map((at, tier) => [at, scaleDice(base, per || base.match(/^\d+d\d+/)[0], tier)]));
  const damage = dice(spell.damage.dice);
  const healing = dice(spell.healing.dice);
  const school = spell.school;
  return {
    index: spell.id,
    name: spell.name || "Custom spell",
    level: spell.level,
    school: { index: school, name: school[0].toUpperCase() + school.slice(1) },
    classes: spell.classes.map(id => ({ index: id, name: BUILT_IN_CLASSES[id]?.name || id })),
    ritual: spell.ritual,
    concentration: spell.concentration,
    casting_time: spell.castingTime || "1 action",
    range: spell.range,
    components: spell.components.split(",").map(item => item.trim().toUpperCase()).filter(Boolean),
    material: spell.material,
    duration: spell.duration,
    desc: [spell.desc].filter(Boolean),
    higher_level: [spell.higherLevel].filter(Boolean),
    ...(spell.attack !== "none" ? { attack_type: spell.attack } : {}),
    ...(spell.save !== "none" ? { dc: { dc_type: { index: spell.save, name: spell.save.toUpperCase() } } } : {}),
    ...(damage ? { damage: [{ damage_type: { index: slug(spell.damage.type), name: spell.damage.type }, [spell.level ? "damage_at_slot_level" : "damage_at_character_level"]: (spell.level ? bySlot : byCharacter)(damage, step(spell.damage.perSlot)) }] } : {}),
    ...(healing ? { heal_at_slot_level: bySlot(healing, step(spell.healing.perSlot)) } : {}),
    source: "Homebrew",
    custom: true
  };
}

// The device library wins over a copy embedded in a synced or DM-opened sheet with the same id.
function registerCustomSpells() {
  const embedded = [character, ...Object.values(characterLibrary || {})].flatMap(item => Object.values(item?.customContent?.spells || {}));
  const spells = { ...Object.fromEntries(embedded.map(sanitizeCustomSpell).filter(Boolean).map(spell => [spell.id, spell])), ...customSpells };
  Object.keys(spellDetails).forEach(index => { if (spellDetails[index].custom && !spells[index]) delete spellDetails[index]; });
  for (let index = allSpells.length - 1; index >= 0; index -= 1) {
    if (allSpells[index].custom) allSpells.splice(index, 1);
  }
  Object.values(spells).forEach(spell => {
    const detail = customSpellDetail(spell);
    spellDetails[spell.id] = detail;
    allSpells.push({ index: spell.id, name: detail.name, level: spell.level, classes: spell.classes, ritual: spell.ritual, custom: true });
  });
}

registerCustomSpells();

function createCustomSpell(level) {
  const spell = sanitizeCustomSpell({ id: uniqueCustomId(`spell ${crypto.randomUUID().slice(0, 4)}`, customSpells), level });
  customSpells[spell.id] = spell;
  saveCustomSpells();
  registerCustomSpells();
  if (typeof saveSpellToCloud === "function") saveSpellToCloud(spell);
  return spell;
}

// The editor under a row holding one of this device's custom spells. Typing saves as you go; changing the level
// moves the row to its new section.
function renderCustomSpellEditor(node, row) {
  const editor = node.querySelector(".custom-spell-fields");
  const spell = customSpells[row.index];
  editor.classList.toggle("active", Boolean(spell));
  if (!spell) return;
  const value = key => key.split(".").reduce((item, part) => item?.[part], spell);
  const input = (label, key, placeholder, wide = false) => `<label${wide ? ` class="wide"` : ""}>${label} <input data-spell-field="${key}" value="${escapeHtml(Array.isArray(value(key)) ? value(key).join(", ") : value(key) || "")}" placeholder="${escapeHtml(placeholder)}" autocomplete="off"></label>`;
  const area = (label, key, placeholder) => `<label class="wide">${label} <textarea data-spell-field="${key}" rows="3" placeholder="${escapeHtml(placeholder)}">${escapeHtml(value(key) || "")}</textarea></label>`;
  const choose = (label, key, options) => `<label>${label} <select data-spell-field="${key}">${options.map(([id, text]) => `<option value="${id}" ${String(value(key)) === String(id) ? "selected" : ""}>${escapeHtml(text)}</option>`).join("")}</select></label>`;
  const check = (label, key) => `<label class="inline-check"><input type="checkbox" data-spell-field="${key}" ${spell[key] ? "checked" : ""}> ${label}</label>`;
  editor.innerHTML = [
    input("Name", "name", "Spell name"),
    choose("Level", "level", Array.from({ length: 10 }, (_, level) => [level, level ? `${ordinal(level)} level` : "Cantrip"])),
    choose("School", "school", SPELL_SCHOOLS.map(id => [id, id[0].toUpperCase() + id.slice(1)])),
    input("Classes", "classes", "wizard, sorcerer"),
    input("Casting time", "castingTime", "1 action"),
    input("Range", "range", "60 feet"),
    input("Components", "components", "V, S, M"),
    input("Material", "material", "a pinch of ash"),
    input("Duration", "duration", "Concentration, up to 1 minute"),
    `<div class="button-row">${check("Ritual", "ritual")}${check("Concentration", "concentration")}</div>`,
    choose("Attack", "attack", [["none", "None"], ["melee", "Melee spell attack"], ["ranged", "Ranged spell attack"]]),
    choose("Save", "save", [["none", "None"], ...ABILITIES]),
    input("Damage dice", "damage.dice", "2d6"),
    input("Damage type", "damage.type", "fire"),
    input("Damage per slot above", "damage.perSlot", "1d6"),
    input("Healing dice", "healing.dice", "1d8 + mod"),
    input("Healing per slot above", "healing.perSlot", "1d8"),
    area("Description", "desc", "What the spell does, in your own words."),
    area("At higher levels", "higherLevel", "Damage +1d6 for each slot level above 1st."),
    `<div class="button-row wide"><button class="ghost" type="button" data-spell-share>Share this spell</button></div>`
  ].join("");
  const write = field => {
    const key = field.dataset.spellField;
    const raw = field.type === "checkbox" ? field.checked : field.value;
    if (key.includes(".")) {
      const [group, part] = key.split(".");
      spell[group] = { ...spell[group], [part]: raw };
    } else spell[key] = key === "level" ? Number(raw) : key === "classes" ? String(raw).split(",").map(item => slug(item.trim())).filter(Boolean) : raw;
    saveCustomSpells();
    registerCustomSpells();
  };
  editor.oninput = event => {
    if (!event.target.dataset.spellField || event.target.type === "checkbox" || event.target.tagName === "SELECT") return;
    write(event.target);
    persist();
    renderSpellCard(node.querySelector(".spell-card"), row);
  };
  editor.onchange = event => {
    if (!event.target.dataset.spellField) return;
    write(event.target);
    if (typeof saveSpellToCloud === "function") saveSpellToCloud(spell);
    if (event.target.dataset.spellField === "level") {
      row.level = spell.level;
      persistAndRender();
      return;
    }
    persist();
    renderSpellCard(node.querySelector(".spell-card"), row);
  };
  editor.onclick = event => {
    if (event.target.closest("[data-spell-share]") && typeof shareContent === "function") shareContent("spell", spell);
  };
}

function renderSpellCard(card, rowOrIndex) {
  const row = typeof rowOrIndex === "object" ? rowOrIndex : { index: rowOrIndex };
  const baseLevel = spellLevelForRow(row);
  const index = row.index;
  if (!index) {
    card.innerHTML = `<span>Select a spell to see casting details.</span>`;
    return;
  }
  const summary = allSpells.find(item => item.index === index);
  const detail = spellDetails[index];
  if (!detail) {
    card.innerHTML = `<strong>${escapeHtml(summary?.name || index)}</strong>`;
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
    <span>${detail.custom ? `Homebrew${classes ? ` · Classes: ${escapeHtml(classes)}` : ""}` : detail.local ? "Original mechanical summary. Full text is in your sourcebook." : `Classes: ${escapeHtml(classes || "custom/homebrew")}`}</span>
    ${spellSourceControls(row)}
    ${spellCastControls(row, detail.level ?? baseLevel)}
  `;
}

function clearConcentration() {
  character.concentration = "";
  persistAndRender();
}

function renderPrepSuggestions() {
  const mode = document.querySelector("#prepMode")?.value || "combat";
  // Suggestions follow the first class that prepares spells.
  const entry = casterEntries().find(candidate => isPreparedCaster(entryClass(candidate))) || casterEntries()[0] || classEntries()[0];
  const cls = entryClass(entry);
  const limit = preparedLimitFor(cls, entry.level);
  const have = new Set(character.spells.filter(row => row.prepared || spellAlwaysPrepared(row) || row.itemId).map(row => row.index));
  const known = allSpells.filter(spell => spellMatchesClass(spell, cls, entry) && spell.level > 0 && spell.level <= maxSpellLevelFor(cls, entry.level) && !have.has(spell.index));
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
  if (baseLevel === 0 || row.ritualBook) {
    return `
      <div class="spell-cast-controls">
        <span>${baseLevel === 0 ? "Cantrip" : "Ritual only, no slot"}</span>
        <button type="button" class="secondary cast-spell">Cast</button>
      </div>
    `;
  }
  const options = castOptions(baseLevel);
  const selected = selectedCastOption(row, options);
  const optionText = option => option.pool === "pact" ? `${spellLevelLabel(option.level)} pact slot (${option.left} left)` : `${spellLevelLabel(option.level)} (${option.left} left)`;
  return `
    <div class="spell-cast-controls">
      <label>Cast at
        <select class="cast-level-select">
          ${options.map(option => `<option value="${option.level}" data-pool="${option.pool}" ${option === selected ? "selected" : ""}>${escapeHtml(optionText(option))}</option>`).join("")}
        </select>
      </label>
      <button type="button" class="secondary cast-spell" data-cast-level="${selected.level}" ${selected.left <= 0 ? "disabled" : ""}>Cast</button>
      <em>${selected.left > 0 ? `${selected.left} slot${selected.left === 1 ? "" : "s"} available` : "No slots left"}</em>
    </div>
  `;
}

// Slots a leveled spell can use: Spellcasting slots of its level or higher (including Flexible Casting slots),
// and the Pact Magic pool when it is at least the spell's level.
function castOptions(baseLevel) {
  const slots = characterSpellSlots();
  const options = castLevelOptions(baseLevel, slots).map(level => ({ level, pool: "slots", left: slotRemaining(level, slots[level - 1] || 0) }));
  const pact = pactSlotPool();
  if (pact && pact.level >= baseLevel) options.push({ level: pact.level, pool: "pact", left: pact.left });
  return options;
}

function selectedCastOption(row, options) {
  const level = Number(row.castLevel || 0);
  // Warlock spells default to the pact pool; either pool can pay for any of your spells (PHB p.164).
  const pool = row.castPool === "pact" || (!row.castPool && isPactCaster(spellRowClass(row) || {})) ? "pact" : "slots";
  const selected = options.find(option => option.pool === pool && (pool === "pact" || option.level === level)) || options[0];
  row.castLevel = selected.level;
  row.castPool = selected.pool;
  return selected;
}

function castLevelOptions(baseLevel, slots = characterSpellSlots()) {
  const options = Array.from({ length: Math.max(slots.length, 5) }, (_, index) => ({ level: index + 1, count: slots[index] || 0 }))
    .filter(item => item.level >= baseLevel && (item.count > 0 || slotRemaining(item.level, item.count) > 0))
    .map(item => item.level);
  return options.length ? options : [baseLevel];
}

function spellDisplayName(row) {
  return allSpells.find(spell => spell.index === row.index)?.name || String(row.index).replace(/-/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

// Prepared and known spells are counted per class entry (PHB p.164); "primary" when no key is given.
function preparedSpellCount(key = "primary") {
  return character.spells.filter(row => row.prepared && spellRowHasSpell(row) && spellLevelForRow(row) > 0 && !spellAlwaysPrepared(row) && spellRowKey(row) === key).length;
}

function spellAlwaysPrepared(row) {
  return Boolean(row.index) && (row.source?.kind === "species" || Boolean(row.signature) || (character.autoSpells || []).includes(row.index));
}

// Additional Magical Secrets (Lore 6), ritual-book entries and Mystic Arcanum aren't spells known.
function knownSpellCount(key = "primary") {
  return character.spells.filter(row => spellRowHasSpell(row) && spellLevelForRow(row) > 0 && !spellAlwaysPrepared(row) && !row.itemId
    && !row.ritualBook && row.secret !== "lore" && !arcanumFor(row) && spellRowKey(row) === key).length;
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
  if (row.ritualBook) return { label: "Ritual", disabled: false, title: "Ritual book: cast only as a ritual" };
  const arcanum = arcanumFor(row);
  if (arcanum) return { label: "Cast", disabled: Number(arcanum.current) <= 0, title: Number(arcanum.current) > 0 ? `${arcanum.name}: once per long rest` : "Recharges on a long rest" };
  if (spellRowNeedsPreparing(row) && !row.prepared && !spellAlwaysPrepared(row)) {
    return spellRowClass(row)?.id === "wizard" && ritualCastable(row)
      ? { label: "Ritual", disabled: false, title: "Unprepared: cast it as a ritual from your spellbook" }
      : { label: "Cast", disabled: true, title: "Prepare this spell to cast it" };
  }
  const free = freeCastFor(row);
  if (free && (free.atWill || Number(free.resource?.current) > 0)) return { label: "Cast", disabled: false, title: free.atWill ? `${free.label}: at will at ${ordinal(level)} level` : `${free.label}: ${free.resource.current} free` };
  const options = castOptions(level);
  const selected = selectedCastOption(row, options);
  const label = `Cast ${ordinal(selected.level)}${selected.pool === "pact" ? " pact" : ""}`;
  if (selected.left > 0) {
    return { label, disabled: false, title: `${selected.left} ${ordinal(selected.level)}-level ${selected.pool === "pact" ? "pact " : ""}slot${selected.left === 1 ? "" : "s"} left` };
  }
  const open = nearestOpenSlot(level, selected.level, characterSpellSlots()) || options.some(option => option.left > 0);
  return open
    ? { label, disabled: false, title: `No ${ordinal(selected.level)}-level slots left. You'll be asked before using another slot.` }
    : { label, disabled: true, title: "No slots left at this level or higher" };
}

// Prepared casters (cleric, druid, paladin, wizard, artificer) prepare up to a class limit after each long rest.
function isPreparedCaster(cls = currentClass()) {
  return ["levelPlusMod", "halfLevelPlusMod", "table"].includes(cls.preparedFormula);
}

// A row needs preparing when the class it belongs to prepares spells (not species, feat, item or ritual-book rows).
function spellRowNeedsPreparing(row) {
  const cls = spellRowClass(row);
  return Boolean(cls) && !row.ritualBook && isPreparedCaster(cls);
}

function canPrepareAnother(key = "primary") {
  const entry = classEntries().find(candidate => candidate.key === key) || classEntries()[0];
  const cls = entryClass(entry);
  return !isPreparedCaster(cls) || isRuleBroken("prepared-limit") || preparedSpellCount(key) < preparedLimitFor(cls, entry.level);
}

function gatePrepare(proceed, key = "primary") {
  const entry = classEntries().find(candidate => candidate.key === key) || classEntries()[0];
  const cls = entryClass(entry);
  const limit = preparedLimitFor(cls, entry.level);
  const formula = cls.preparedFormula === "table" ? `the 2024 ${cls.name} table` : cls.preparedFormula === "levelPlusMod" ? `${cls.name} level + ${String(cls.spellAbility).toUpperCase()} modifier` : `half your ${cls.name} level + ${String(cls.spellAbility).toUpperCase()} modifier`;
  breakRule("prepared-limit", `You're already at your maximum of ${limit} prepared ${cls.name} spells (${formula}). Always-prepared spells from your subclass don't count toward it.`, proceed);
}

// Adding a spell row past the cantrip or spells-known cap asks first. Multiclass caps add up across classes;
// each class's own count shows in the Spellbook panel.
function gateNewSpellRow(level, proceed) {
  const casters = casterEntries();
  const describe = casters.map(entry => `${entryClass(entry).name} ${entry.level}`).join(" / ") || `level ${character.level} ${currentClass().name}`;
  if (level === 0) {
    const cap = casters.reduce((sum, entry) => sum + entryCantripCap(entry), 0) + (hasTomePact() ? 3 : 0);
    const chosen = casters.reduce((sum, entry) => sum + entryCantripCount(entry), 0) + tomeCantripCount();
    if (cap && chosen >= cap) return breakRule("cantrip-limit", `You already know ${chosen} of the ${cap} cantrips a ${describe} gets.`, proceed);
  } else {
    const knownEntries = casters.filter(entry => entryClass(entry).preparedFormula === "known" && knownSpellCap(entryClass(entry), entry.level) !== null);
    const preparedEntries = casters.filter(entry => entryClass(entry).preparedFormula !== "known");
    const cap = knownEntries.reduce((sum, entry) => sum + knownSpellCap(entryClass(entry), entry.level), 0);
    const count = knownEntries.reduce((sum, entry) => sum + knownSpellCount(entry.key), 0);
    // An open Additional Magical Secrets pick (Lore 6) doesn't count against spells known: file the spell there.
    if (knownEntries.length && count >= cap && openLoreSecrets() > 0) {
      proceed({ secret: "lore", classKey: classEntries().find(entry => entry.classId === "bard").key });
      showToast(`<span class="toast-label">Added as Additional Magical Secrets</span><span>It's a bard spell from any class's list and doesn't count against spells known.</span>`);
      return true;
    }
    if (knownEntries.length && !preparedEntries.length && count >= cap) return breakRule("known-limit", `You already know ${count} of the ${cap} spells a ${describe} knows. Swap one out on level up instead, or allow extra spells.`, proceed);
    // Mystic Arcanum: exactly one spell of each arcanum level (PHB p.108).
    const pact = casters.map(entryClass).find(cls => Object.values(arcanumLevelsFor(cls)).includes(level));
    if (pact && character.spells.some(row => spellRowHasSpell(row) && spellLevelForRow(row) === level && spellRowClass(row)?.id === pact.id)) {
      return breakRule("arcanum-limit", `Mystic Arcanum gives one ${ordinal(level)}-level ${pact.name.toLowerCase()} spell, and you already have it.`, proceed);
    }
  }
  proceed();
  return true;
}

function addSuggestedSpell(index) {
  const spell = allSpells.find(item => item.index === index);
  if (!spell) return;
  const entry = casterEntries().find(candidate => isPreparedCaster(entryClass(candidate))) || casterEntries()[0] || classEntries()[0];
  if (!canPrepareAnother(entry.key) && !character.spells.find(row => row.index === index && row.prepared)) {
    gatePrepare(() => addSuggestedSpell(index), entry.key);
    return;
  }
  const existing = character.spells.find(row => row.index === index);
  if (existing) existing.prepared = true;
  else character.spells.push({ id: crypto.randomUUID(), index, level: spell.level, prepared: true, classKey: entry.key });
  persistAndRender();
  showToast(`<span class="toast-label">Prepared ${escapeHtml(spell.name)}</span><span>${preparedSpellCount(entry.key)} of ${preparedLimitFor(entryClass(entry), entry.level)} prepared</span>`);
}

// ---------------------------------------------------------------------------------------------------------------
// Multiclass spellcasting (PHB p.164): each spell row belongs to one class entry (row.classKey) and is cast with that
// class's ability, list and limits. Species and feat rows (row.source) and item rows (row.itemId) stand outside every
// class and never count against known/prepared/cantrip caps. builder.js writes the same format:
//   { id, index, level, prepared: false, source: { kind: "species" | "feat", name, ability }, free, castAt }
// source.ability "" means the species' own ability (speciesSpellAbility). free: "" (slots only), "will", "1/long",
// "1/short" or "ritual" (with ritualBook). A feat row without free (older sheets, "Learned as") gets one free cast per
// long rest. castAt: the slot level a free cast uses (a tiefling's hellish rebuke at 2nd).
// ---------------------------------------------------------------------------------------------------------------

// Class entries that have the Spellcasting or Pact Magic feature at their current level.
function casterEntries() {
  return classEntries().filter(entry => {
    const cls = entryClass(entry);
    return cls.casterType !== "none" && (spellSlotsFor(cls, entry.level).some(Boolean) || cantripCap(cls, entry.level) > 0);
  });
}

function defaultSpellEntry(index) {
  const casters = casterEntries();
  const item = allSpells.find(spell => spell.index === index);
  return (item && casters.find(entry => spellMatchesClass(item, entryClass(entry), entry))) || casters[0] || null;
}

function spellRowEntry(row) {
  if (row.itemId || row.source) return null;
  const entries = classEntries();
  return entries.find(entry => entry.key === row.classKey) || defaultSpellEntry(row.index) || entries[0];
}

function spellRowKey(row) {
  return spellRowEntry(row)?.key || "";
}

function spellRowClass(row) {
  const entry = spellRowEntry(row);
  return entry ? entryClass(entry) : null;
}

// Older sheets have no classKey: give each row the first class whose list has the spell (the primary class first).
function ensureSpellOwners() {
  const keys = new Set(classEntries().map(entry => entry.key));
  character.spells.forEach(row => {
    if (row.itemId || row.source || !spellRowHasSpell(row)) return;
    if (row.classKey && keys.has(row.classKey)) return;
    row.classKey = defaultSpellEntry(row.index)?.key || "primary";
  });
}

// Racial spells use the ability their trait names (PHB p.23, 24, 37, 43 and the supplements).
function speciesSpellAbility(species = character.species) {
  const name = String(species || "");
  // The species' innate-spell ability (SPECIES_MAGIC), or the INT/WIS/CHA picked at creation for "choice" species.
  const magic = SPECIES_MAGIC[name]?.ability;
  if (magic === "choice" && character.speciesSpellAbility) return character.speciesSpellAbility;
  if (magic && magic !== "choice") return magic;
  // ponytail: Fairy and Astral Elf choose INT, WIS or CHA; this takes the best of the three instead of asking.
  if (/fairy|astral elf/i.test(name)) return ["int", "wis", "cha"].reduce((best, id) => mod(id) > mod(best) ? id : best, "int");
  if (/high|forest gnome|githyanki|duergar|deep gnome|svirfneblin/i.test(name)) return "int";
  if (/genasi/i.test(name)) return "con";
  if (/githzerai|pallid|lotusden|firbolg/i.test(name)) return "wis";
  return "cha";
}

function spellAbilityFor(row) {
  if (row.ability) return row.ability;
  if (row.source?.ability) return row.source.ability;
  if (row.source?.kind === "species") return speciesSpellAbility();
  const cls = spellRowClass(row) || entryClass(casterEntries()[0] || classEntries()[0]);
  return cls.spellAbility;
}

// Spell save DC and attack bonus for one ability, with magic-item bonuses (DMG: Rod of the Pact Keeper, Wand of the
// War Mage, Robe of the Archmagi; TCE class foci). Items that name classes only help those classes' spells.
function spellStats(ability, classId = "") {
  const valid = ABILITIES.some(([id]) => id === ability);
  const abilityMod = valid ? mod(ability) : 0;
  const prof = proficiencyBonus();
  return { ability, valid, mod: abilityMod, dc: 8 + prof + abilityMod + itemSpellBonus("dc", classId), attack: prof + abilityMod + itemSpellBonus("attack", classId) };
}

// DMG p.200 spell scroll save DC and attack bonus by spell level.
const SCROLL_STATS = [[13, 5], [13, 5], [13, 5], [15, 7], [15, 7], [17, 9], [17, 9], [18, 10], [18, 10], [19, 11]];

function spellStatsFor(row) {
  const item = itemForSpellRow(row);
  if (item && /spell scroll/i.test(item.name || "")) {
    const [dc, attack] = SCROLL_STATS[spellLevelForRow(row)] || SCROLL_STATS[0];
    return { ...spellStats(spellAbilityFor(row)), dc, attack };
  }
  // Wands and staffs with a fixed save DC or attack bonus in their notes ("save DC 15", "+7 to hit").
  const fixedDc = item && Number(String(item.notes || "").match(/\bDC\s*(\d+)/i)?.[1]);
  const fixedAttack = item && Number(String(item.notes || "").match(/\+(\d+)\s*to hit/i)?.[1]);
  const stats = spellStats(spellAbilityFor(row), spellRowClass(row)?.id || "");
  return { ...stats, dc: fixedDc || stats.dc, attack: fixedAttack || stats.attack };
}

function itemSpellBonus(kind, classId = "") {
  const pattern = kind === "dc" ? /\+(\d+)[^.;]*?(?:spell save DCs?|save DCs?|saving throw DCs?)/i : /\+(\d+)[^.;]*?spell attack/i;
  const classNames = Object.keys(BUILT_IN_CLASSES);
  // Two copies of one item don't stack (uniqueActiveItems, DMG p.252).
  return uniqueActiveItems()
    .reduce((sum, item) => {
      const sentence = String(item.notes || "").split(/(?<=\.)\s/).find(part => pattern.test(part));
      if (!sentence) return sum;
      const named = classNames.filter(id => new RegExp(`\\b${id}\\b`, "i").test(sentence.replace(/requires attunement.*$/i, "")));
      if (named.length && !named.includes(classId)) return sum;
      return sum + Number(sentence.match(pattern)[1]);
    }, 0);
}

// Subclasses that add cantrips beyond the class table: Nature (a druid cantrip), Arcana (two wizard cantrips),
// Death (a necromancy cantrip) at cleric 1, and Land (a druid cantrip) at druid 2. Light, Grave and Stars grant fixed ones.
const SUBCLASS_BONUS_CANTRIPS = {
  nature: { level: 1, count: 1, matches: item => (item.classes || []).includes("druid") },
  arcana: { level: 1, count: 2, matches: item => (item.classes || []).includes("wizard") },
  death: { level: 1, count: 1, matches: item => spellDetails[item.index]?.school?.index === "necromancy" },
  land: { level: 2, count: 1, matches: item => (item.classes || []).includes("druid") }
};

function entryCantripCap(entry) {
  const bonus = SUBCLASS_BONUS_CANTRIPS[subclassIndexFor(entry)];
  return cantripCap(entryClass(entry), entry.level) + (bonus && entry.level >= bonus.level ? bonus.count : 0);
}

function entryCantripCount(entry) {
  return character.spells.filter(row => spellRowHasSpell(row) && spellLevelForRow(row) === 0 && !spellAlwaysPrepared(row) && !row.itemId && !row.tome && spellRowKey(row) === entry.key).length;
}

// Pact of the Tome (PHB p.108): three cantrips from any class's list, on top of warlock cantrips known.
function hasTomePact() {
  return classLevel("warlock") >= 3 && (classChoiceNames("pactBoon").some(name => /tome/i.test(name)) || choiceWritten("Pact of the Tome"));
}

function tomeCantripCount() {
  return character.spells.filter(row => row.tome && spellRowHasSpell(row)).length;
}

function spellClassLine(entry) {
  const cls = entryClass(entry);
  const known = cls.preparedFormula === "known";
  const stats = spellStats(cls.spellAbility, cls.id);
  return {
    key: entry.key, name: cls.name, level: entry.level, ability: cls.spellAbility || "none", dc: stats.dc, attack: stats.attack, known,
    limit: preparedLimitFor(cls, entry.level), used: known ? knownSpellCount(entry.key) : preparedSpellCount(entry.key),
    cantrips: entryCantripCount(entry), cantripCap: entryCantripCap(entry)
  };
}

// Per-class casting lines (multiclass). Land terrain, genie kind and Divine Soul affinity are picked under Features → Class choices.
function renderSpellClassStats(lines) {
  const root = document.querySelector("#spellClassStats");
  if (!root) return;
  root.innerHTML = lines.map(line => `<p><strong>${escapeHtml(line.name)} ${line.level}</strong> ${line.ability.toUpperCase()} · DC ${line.dc} · ${formatMod(line.attack)} · ${line.known ? "known" : "prepared"} <span class="${line.used > line.limit ? "over-cap" : ""}">${line.used}/${line.limit}</span>${line.cantripCap ? ` · cantrips <span class="${line.cantrips > line.cantripCap ? "over-cap" : ""}">${line.cantrips}/${line.cantripCap}</span>` : ""}</p>`).join("");
}

// Additional Magical Secrets picks (Lore bard 6, two spells) not yet used.
function openLoreSecrets() {
  const bard = classEntries().find(entry => entry.classId === "bard");
  if (!bard || bard.level < 6 || subclassIndexFor(bard) !== "lore") return 0;
  return Math.max(0, 2 - character.spells.filter(row => row.secret === "lore").length);
}

// Rule checks the Spellbook panel shows: EK/AT school picks, Magical Secrets picks, cantrips per class.
function spellListWarnings() {
  const warnings = [];
  casterEntries().forEach(entry => {
    const cls = entryClass(entry);
    if (cls.schools) {
      // PHB p.75/p.98: one pick at each of 3rd, 8th, 14th and 20th may come from any school.
      const free = cls.freeSchoolLevels.filter(level => entry.level >= level).length;
      const off = character.spells.filter(row => spellRowKey(row) === entry.key && spellLevelForRow(row) > 0 && !spellAlwaysPrepared(row)
        && !cls.schools.includes(spellDetails[row.index]?.school?.index)).length;
      if (off > free) warnings.push(`${cls.name}: ${off} spells outside ${cls.schools.join(" and ")}; only ${free} may be.`);
    }
    if (casterEntries().length > 1 && entryCantripCount(entry) > entryCantripCap(entry)) warnings.push(`${cls.name}: ${entryCantripCount(entry) - entryCantripCap(entry)} cantrips over its ${entryCantripCap(entry)}.`);
  });
  const bard = classEntries().find(entry => entry.classId === "bard");
  if (bard) {
    // Magical Secrets: 2 spells at 10th, 14th and 18th; Lore's Additional Magical Secrets: 2 at 6th (PHB p.54-55).
    const secrets = character.spells.filter(row => row.secret === true).length;
    const allowed = 2 * [10, 14, 18].filter(level => bard.level >= level).length;
    if (secrets > allowed) warnings.push(`${secrets} Magical Secrets chosen; bard ${bard.level} gets ${allowed}.`);
    const lore = character.spells.filter(row => row.secret === "lore").length;
    const loreAllowed = subclassIndexFor(bard) === "lore" && bard.level >= 6 ? 2 : 0;
    if (lore > loreAllowed) warnings.push(`${lore} Additional Magical Secrets chosen; you get ${loreAllowed}.`);
  }
  if (tomeCantripCount() > 3) warnings.push(`${tomeCantripCount()} Pact of the Tome cantrips; the Book of Shadows holds three.`);
  const signatures = character.spells.filter(row => row.signature).length;
  if (signatures > 2) warnings.push(`${signatures} Signature Spells; the feature gives two.`);
  [1, 2].forEach(level => {
    if (character.spells.filter(row => row.mastery && spellLevelForRow(row) === level).length > 1) warnings.push(`Spell Mastery covers one ${ordinal(level)}-level spell.`);
  });
  return warnings;
}

// Where a row's spell comes from. Only shown when there is a choice: multiclass casters, Magical Secrets, a ritual
// book (Book of Ancient Secrets, Ritual Caster) or a spell-granting feat.
function spellSourceOptions(row) {
  const options = casterEntries().map(entry => [entry.key, `${entryClass(entry).name} ${entry.level}`]);
  const bard = classEntries().find(entry => entry.classId === "bard");
  if (bard && bard.level >= 10) options.push(["secret", "Magical Secrets (bard)"]);
  if (bard && bard.level >= 6 && subclassIndexFor(bard) === "lore") options.push(["lore-secret", "Additional Magical Secrets"]);
  const warlock = classEntries().find(entry => entry.classId === "warlock");
  const optionText = `${character.features || ""} ${(character.classOptions || []).map(item => item.name).join(" ")} ${(character.classChoices?.invocations || []).join(" ")}`;
  if (warlock && /book of ancient secrets/i.test(optionText)) options.push(["ritual-warlock", "Book of Shadows ritual"]);
  if (warlock && hasTomePact() && (!spellRowHasSpell(row) || spellLevelForRow(row) === 0)) options.push(["tome-cantrip", "Pact of the Tome cantrip"]);
  if (hasFeat("Ritual Caster")) ["int", "wis", "cha"].forEach(ability => options.push([`ritual-${ability}`, `Ritual Caster book (${ability.toUpperCase()})`]));
  if ((character.planner?.feats || []).some(feat => /initiate|touched|high magic|fey|spell sniper/i.test(feat)) || row.source) {
    ["int", "wis", "cha"].forEach(ability => options.push([`feat-${ability}`, `Feat spell (${ability.toUpperCase()})`]));
  }
  return options;
}

function spellSourceValue(row) {
  if (row.tome) return "tome-cantrip";
  if (row.secret) return row.secret === "lore" ? "lore-secret" : "secret";
  if (row.ritualBook) return row.source ? `ritual-${row.source.ability}` : "ritual-warlock";
  if (row.source) return `feat-${row.source.ability}`;
  return spellRowKey(row);
}

function setSpellSource(row, value) {
  // A feat row keeps its feat name and free-cast rule when only its ability changes.
  const previous = row.source;
  ["secret", "ritualBook", "source", "tome"].forEach(key => delete row[key]);
  const entryFor = classId => classEntries().find(entry => entry.classId === classId);
  if (value === "secret" || value === "lore-secret") {
    row.classKey = entryFor("bard")?.key || "primary";
    row.secret = value === "lore-secret" ? "lore" : true;
  } else if (value === "tome-cantrip") {
    row.classKey = entryFor("warlock")?.key || "primary";
    row.tome = true;
  } else if (value === "ritual-warlock") {
    row.classKey = entryFor("warlock")?.key || "primary";
    row.ritualBook = true;
    row.prepared = false;
  } else if (/^(ritual|feat)-/.test(value)) {
    row.source = { ...(previous || { kind: "feat" }), ability: value.split("-")[1] };
    if (value.startsWith("ritual")) row.ritualBook = true;
    row.prepared = false;
    delete row.classKey;
  } else {
    row.classKey = value;
  }
}

function spellSourceControls(row) {
  if (row.source?.kind === "species" || row.source?.kind === "invocation" || row.itemId || row.auto || (!spellRowHasSpell(row) && !hasTomePact())) return "";
  const options = spellSourceOptions(row);
  const wizard = spellRowClass(row)?.id === "wizard" ? classEntries().find(entry => entry.key === spellRowKey(row)) : null;
  const level = spellLevelForRow(row);
  const toggles = [
    // Spell Mastery (wizard 18): one 1st- and one 2nd-level spell at will at base level. Signature Spells (20): two 3rd-level.
    wizard && wizard.level >= 18 && (level === 1 || level === 2) ? `<label class="inline-check"><input type="checkbox" data-spell-flag="mastery" ${row.mastery ? "checked" : ""}> Spell Mastery (at will at ${ordinal(level)} level)</label>` : "",
    wizard && wizard.level >= 20 && level === 3 ? `<label class="inline-check"><input type="checkbox" data-spell-flag="signature" ${row.signature ? "checked" : ""}> Signature Spell (always prepared, once free per short rest)</label>` : ""
  ].filter(Boolean);
  if (options.length < 2 && !toggles.length) return "";
  return `<div class="spell-source">${options.length > 1 ? `<label>Learned as <select class="spell-owner-select">${options.map(([value, text]) => `<option value="${escapeHtml(value)}" ${spellSourceValue(row) === value ? "selected" : ""}>${escapeHtml(text)}</option>`).join("")}</select></label>` : ""}${toggles.join("")}</div>`;
}

function handleSpellCardChange(event, row) {
  if (event.target.classList.contains("spell-owner-select")) {
    setSpellSource(row, event.target.value);
    persistAndRender();
    return;
  }
  if (event.target.classList.contains("cast-level-select")) {
    // main.js stores the level; the pool (slot grid or pact) comes from the chosen option.
    row.castPool = event.target.selectedOptions?.[0]?.dataset.pool === "pact" ? "pact" : "slots";
    return;
  }
  const flag = event.target.dataset?.spellFlag;
  if (flag) {
    row[flag] = event.target.checked;
    if (flag === "signature" && row.signature) row.prepared = false;
    persistAndRender();
  }
}

// Row-linked uses: a feat's free leveled spell (once per long rest) and Signature Spells (once per short rest).
function ensureSpellTrackers() {
  const freeReset = row => row.signature ? "short" : !row.source || row.ritualBook ? "" : row.free === undefined ? (row.source.kind === "feat" ? "long" : "") : { "1/long": "long", "1/short": "short", slot: "long" }[row.free] || "";
  const trackerName = row => row.signature ? `Signature Spell: ${spellDisplayName(row)}` : row.source?.kind === "invocation" ? `${row.source.name}: ${spellDisplayName(row)}` : `Free cast: ${spellDisplayName(row)}`;
  const wanted = character.spells.filter(row => spellRowHasSpell(row) && spellLevelForRow(row) > 0 && freeReset(row))
    .map(row => ({ row, name: trackerName(row), reset: freeReset(row) }));
  let changed = false;
  character.resources = character.resources.filter(item => {
    if (!item.spellRowId) return true;
    const keep = wanted.some(want => want.row.id === item.spellRowId && want.name === item.name && want.reset === item.reset);
    if (!keep) changed = true;
    return keep;
  });
  wanted.forEach(want => {
    if (character.resources.some(item => item.spellRowId === want.row.id)) return;
    character.resources.push({ id: crypto.randomUUID(), name: want.name, current: 1, max: 1, reset: want.reset, auto: false, spellRowId: want.row.id });
    changed = true;
  });
  if (changed) persist();
}

// Subclass features that cast one spell without a slot (once per long rest unless noted).
const SPELL_FREE_CAST_TRACKERS = {
  "guiding-bolt": "Star Map Guiding Bolt",
  "summon-fey": "Fey Reinforcements (free Summon Fey)",
  "black-tentacles": "Grasping Tentacles (free cast)"
};

function freeCastFor(row) {
  const wizard = spellRowClass(row)?.id === "wizard" ? classLevel("wizard") : 0;
  if (row.mastery && wizard >= 18 && spellLevelForRow(row) <= 2) return { atWill: true, label: "Spell Mastery" };
  if (row.source && row.free === "will") return { atWill: true, label: "At will" };
  const linked = row.free !== "slot" && character.resources.find(item => item.spellRowId === row.id);
  if (linked) return { resource: linked, label: row.signature ? "Signature Spell" : "Free cast", level: row.signature ? 3 : Number(row.castAt || 0) };
  const name = SPELL_FREE_CAST_TRACKERS[row.index];
  const tracker = name && character.resources.find(item => item.name === name);
  return tracker ? { resource: tracker, label: name } : null;
}

// Wild Shape blocks casting until Beast Spells (druid 18: druid spells without material components)
// and Archdruid (20: material components only matter when they have a cost or are consumed). PHB p.67.
function beastFormCastingBlock(row, detail) {
  const druid = classLevel("druid");
  if (druid < 18) return "Beasts can't cast spells (druids gain Beast Spells at 18th level).";
  if (spellRowClass(row)?.id !== "druid") return "Beast Spells covers druid spells only.";
  if (druid >= 20) return /\d[\d,]*\s*gp|consume/i.test(detail.material || "") ? "Archdruid still needs a costly or consumed material component." : "";
  return (detail.components || []).includes("M") ? "Beast Spells can't provide material components in beast form." : "";
}

// Costly material components (PHB p.203): a pouch or focus can't stand in, and consumed ones must be replaced.
function componentNotes(detail) {
  const material = String(detail.material || "");
  const cost = material.match(/(?:worth|costing)(?: at least)? ([\d,]+)\s*gp/i);
  if (!cost) return [];
  return [`needs ${material.replace(/\.$/, "")}${/consume/i.test(material) ? " (consumed)" : ""}`];
}

// A consumed costly component that matches an inventory item ("diamond", "incense") can be crossed off.
function consumedComponentItem(detail) {
  const material = String(detail.material || "");
  if (!/consume/i.test(material) || !/\d[\d,]*\s*gp/i.test(material)) return null;
  const words = material.toLowerCase().match(/[a-z]{4,}/g) || [];
  return (character.equipment || []).find(item => words.some(word => !["worth", "least", "which", "spell", "consumes", "with"].includes(word) && String(item.name || "").toLowerCase().includes(word))) || null;
}

// PHB p.114: copying a spell into a spellbook takes 2 hours and 50 gp per spell level (level-up spells are free);
// a school's Savant halves both for that school (PHB p.115-119). Copying from a scroll uses it up (DMG p.200).
const SAVANT_SCHOOLS = ["abjuration", "conjuration", "divination", "enchantment", "evocation", "illusion", "necromancy", "transmutation"];

function spellbookCopyCost(index, level) {
  const school = spellDetails[index]?.school?.index || allSpells.find(item => item.index === index)?.school?.index || "";
  const savant = SAVANT_SCHOOLS.includes(school) && subclassLevel(school) >= 2;
  return { gp: savant ? 25 * level : 50 * level, hours: savant ? level : 2 * level, savant };
}

// Pays from gold; refuses (or asks to break the rule) when the purse is short, never going below 0.
function paySpellbookCopy(cost, name) {
  const gold = Number(character.currency?.gp || 0);
  if (gold >= cost) {
    character.currency.gp = gold - cost;
    persistAndRender();
    return true;
  }
  showToast(`<span class="toast-label">Not enough gold</span><span>Copying ${escapeHtml(name)} costs ${cost} gp; you have ${gold} gp. Change other coins into gold first, or copy it without paying.</span>`, {
    tone: "fumble",
    actions: [{ label: "Copy without paying", run: () => breakRule("spellbook-cost", `Copying ${name} costs ${cost} gp and you have ${gold} gp. Copy it anyway?`, () => {}) }],
    persist: true
  });
  return false;
}

function offerSpellbookCopy(row, level) {
  if (!level || spellRowClass(row)?.id !== "wizard" || !row.index) return;
  const { gp: cost, hours, savant } = spellbookCopyCost(row.index, level);
  const name = spellDisplayName(row);
  const scroll = (character.equipment || []).find(item => /scroll/i.test(item.name || "") && item.grantSpell === row.index && Number(item.quantity ?? 1) > 0);
  const useScroll = { label: `${scroll?.name || "Scroll"} used up`, run: () => {
    scroll.quantity = Number(scroll.quantity ?? 1) - 1;
    if (scroll.quantity <= 0) character.equipment = character.equipment.filter(item => item !== scroll);
    persistAndRender();
  } };
  showToast(`<span class="toast-label">Copy into your spellbook</span><span>${escapeHtml(name)}: ${hours} hour${hours === 1 ? "" : "s"} and ${cost} gp of inks${savant ? " (Savant: half)" : ""}, unless it came free with a level.${scroll ? ` Copying from ${escapeHtml(scroll.name)} destroys the scroll, whether or not the copy works.` : ""}</span>`, {
    actions: [
      { label: `Pay ${cost} gp`, run: () => { paySpellbookCopy(cost, name); } },
      ...(scroll ? [useScroll] : [])
    ],
    persist: true
  });
}

// Copying from a held spell scroll (DMG p.200): INT (Arcana) DC 10 + spell level. A success pays the usual copying cost
// and adds the spell; the scroll is destroyed either way.
function canCopyScroll(item) {
  return classLevel("wizard") > 0 && /scroll/i.test(item.name || "") && Boolean(item.grantSpell) && Number(item.quantity ?? 1) > 0;
}

function copyScrollIntoSpellbook(item) {
  const entry = classEntries().find(candidate => candidate.classId === "wizard");
  const spell = allSpells.find(candidate => candidate.index === item.grantSpell);
  if (!entry || !spell) return;
  const { gp, hours, savant } = spellbookCopyCost(spell.index, spell.level);
  const gold = Number(character.currency?.gp || 0);
  const problem = spell.level < 1 ? "Cantrips aren't copied into a spellbook."
    : !spellMatchesClass(spell, entryClass(entry), entry) ? `${spell.name} isn't a wizard spell.`
    : spell.level > maxSpellLevelFor(entryClass(entry), entry.level) ? `You need ${ordinal(spell.level)}-level wizard spell slots to copy it.`
    : character.spells.some(row => row.index === spell.index && !row.itemId && spellRowClass(row)?.id === "wizard") ? `${spell.name} is already in your spellbook.`
    : gold < gp ? `Copying it costs ${gp} gp; you have ${gold} gp.` : "";
  if (problem) {
    showToast(`<span class="toast-label">Can't copy ${escapeHtml(spell.name)}</span><span>${escapeHtml(problem)}</span>`, { tone: "fumble" });
    return;
  }
  const dc = 10 + spell.level;
  let scrollUsed = false;
  let added = null;
  // Lucky or Portent can change the d20 and re-run this, so it moves between outcomes instead of repeating them.
  openRoll({
    label: `Arcana: copy ${spell.name} (DC ${dc})`,
    formula: `1d20${formatMod(skillBonus("arcana", "int"))}`,
    kind: "check", ability: "int", context: "arcana",
    detail: `On a success: ${gp} gp and ${hours} hour${hours === 1 ? "" : "s"}${savant ? " (Savant: half)" : ""}. The scroll is destroyed either way.`,
    onResult: result => {
      if (!scrollUsed) {
        scrollUsed = true;
        item.quantity = Number(item.quantity ?? 1) - 1;
        if (item.quantity <= 0) character.equipment = character.equipment.filter(entry => entry !== item);
      }
      const success = result.total >= dc;
      if (success && !added) {
        character.currency.gp = Number(character.currency.gp || 0) - gp;
        added = { id: crypto.randomUUID(), index: spell.index, level: spell.level, prepared: false, classKey: entry.key };
        character.spells.push(added);
      } else if (!success && added) {
        character.currency.gp = Number(character.currency.gp || 0) + gp;
        character.spells = character.spells.filter(row => row !== added);
        added = null;
      }
      persistAndRender();
      return success ? `Copied: ${spell.name} is in your spellbook (${gp} gp paid). The scroll is gone.` : "The copy fails and the scroll is destroyed.";
    }
  });
}

// Find Familiar (PHB p.240) forms, plus the four Pact of the Chain adds (PHB p.107); those aren't SRD beasts, so their
// stats are typed in by hand.
const FAMILIAR_FORMS = ["bat", "cat", "crab", "frog", "hawk", "lizard", "octopus", "owl", "poisonous-snake", "quipper", "rat", "raven", "sea-horse", "spider", "weasel"];
const CHAIN_FAMILIARS = ["Imp", "Pseudodragon", "Quasit", "Sprite"];

function familiarForms() {
  const chain = classLevel("warlock") >= 3 && character.classChoices?.pactBoon === "chain";
  const beasts = FAMILIAR_FORMS.map(index => SRD_BEASTS.find(beast => beast.index === index)).filter(Boolean).map(beast => [beast.index, beast.name]);
  const special = CHAIN_FAMILIARS.filter(name => chain || character.familiar?.form === name).map(name => [name, name]);
  return [...beasts, ...special];
}

function familiarBeast(familiar = character.familiar) {
  return SRD_BEASTS.find(beast => beast.index === familiar?.form) || null;
}

function setFamiliarForm(form) {
  const familiar = character.familiar;
  if (!familiar) return;
  const beast = SRD_BEASTS.find(item => item.index === form);
  familiar.form = form;
  familiar.max = beast ? beast.hp : Number(familiar.max || 0);
  familiar.hp = familiar.max;
  persistAndRender();
}

// Damage to 0 HP makes the familiar disappear until the spell is cast again.
function changeFamiliarHp(amount) {
  const familiar = character.familiar;
  if (!familiar || familiar.gone || !amount) return;
  familiar.hp = clamp(Number(familiar.hp || 0) + amount, 0, Number(familiar.max || 0));
  if (familiar.hp <= 0) familiar.gone = true;
  persistAndRender();
  if (familiar.gone) showToast(`<span class="toast-label">Your familiar drops to 0 HP</span><span>It disappears. Cast Find Familiar again to bring it back.</span>`, { tone: "fumble" });
}

function setFamiliarDismissed(dismissed) {
  if (!character.familiar || character.familiar.gone) return;
  character.familiar.dismissed = dismissed;
  persistAndRender();
  showToast(dismissed
    ? `<span class="toast-label">Familiar dismissed</span><span>It waits in a pocket dimension until you call it back.</span>`
    : `<span class="toast-label">Familiar resummoned (action)</span><span>The same familiar appears in an unoccupied space within 30 ft of you.</span>`);
}

function payFamiliarIncense() {
  const gold = Number(character.currency?.gp || 0);
  if (gold < 10) {
    showToast(`<span class="toast-label">Not enough gold</span><span>The incense, charcoal and herbs cost 10 gp; you have ${gold} gp.</span>`, { tone: "fumble" });
    return;
  }
  character.currency.gp = gold - 10;
  persistAndRender();
  showToast(`<span class="toast-label">Paid 10 gp</span><span>${character.currency.gp} gp left.</span>`, { actions: [{ label: "Undo", run: () => { character.currency.gp = Number(character.currency.gp || 0) + 10; persistAndRender(); } }] });
}

// Side effects of casting a few spells. previous: what Undo restores. Returns extra buttons for the cast toast.
function spellCastExtras(row, previous, extras) {
  if (row.index === "goodberry") {
    previous.equipment = character.equipment;
    character.equipment = [...(character.equipment || []), goodberryItem()];
    extras.push("10 Goodberries added to your inventory");
    return [];
  }
  if (row.index === "find-familiar") {
    previous.familiar = character.familiar || null;
    const old = character.familiar;
    // Casting again brings a vanished familiar back at full HP, in the form you pick.
    character.familiar = old ? { ...old, hp: Number(old.max || 0), gone: false, dismissed: false } : { form: "", hp: 0, max: 0 };
    extras.push("Uses up 10 gp of charcoal, incense and herbs", "Choose its form in the Familiar card");
    return [{ label: "Pay 10 gp for incense", run: payFamiliarIncense }];
  }
  return [];
}

// Elemental Affinity (Draconic 6): +CHA to one damage roll of a spell dealing the ancestry's damage type.
function elementalAffinity(effect) {
  if (subclassLevel("draconic") < 6) return 0;
  const ancestry = character.classChoices?.draconicAncestry;
  const type = CLASS_OPTIONS.draconicAncestry.find(item => [item.dragon.toLowerCase(), item.damage].includes(String(ancestry || "").toLowerCase()))?.damage;
  if (type && effect.types.length && !effect.types.includes(type)) return 0;
  return Math.max(0, mod("cha"));
}

// Metamagic (PHB p.102, TCE p.66): the options the sorcerer knows (all when none are recorded), priced for this cast.
function sorceryPointTracker() {
  return character.resources.find(item => item.name === "Sorcery Points") || null;
}

// Metamagic Adept (TCE p.80): 2 extra points usable only for Metamagic. Listed first so they are spent first.
function metamagicPools() {
  return ["Sorcery Points (Metamagic Adept)", "Sorcery Points"].map(name => character.resources.find(item => item.name === name)).filter(Boolean);
}

function metamagicPointsLeft() {
  return metamagicPools().reduce((sum, item) => sum + Number(item.current || 0), 0);
}

// Takes cost from the pools in order; returns the refund function.
function spendMetamagicPoints(cost) {
  const taken = metamagicPools().map(item => {
    const take = Math.min(cost, Number(item.current || 0));
    item.current = Number(item.current || 0) - take;
    cost -= take;
    return [item, take];
  });
  return () => taken.forEach(([item, take]) => { item.current = Math.min(Number(item.max), Number(item.current) + take); });
}

function knownMetamagic() {
  const recorded = [...(character.classChoices?.metamagic || []), ...(character.classOptions || []).map(item => item.name)]
    .map(name => String(name).toLowerCase().replace(/\s*spell$/, "").trim());
  const all = CLASS_OPTIONS.metamagic.filter(option => !option.optional || optionalRule("tashas"));
  const known = all.filter(option => recorded.includes(option.name.toLowerCase().replace(/\s*spell$/, "")));
  // Without a sorcerer's Metamagic feature, only the Adept's recorded picks are known.
  return known.length || classLevel("sorcerer") < 3 ? known : all;
}

// Which Metamagic options can change this spell at this level (PHB p.102, TCE p.66).
function metamagicFits(short, row, castLevel) {
  const detail = spellDetails[row.index] || {};
  const text = spellText(detail);
  const effect = ["Twinned", "Transmuted", "Empowered"].includes(short) ? spellEffectRoll(row, castLevel) : null;
  if (short === "Twinned") {
    const higher = [detail.higher_level].flat().filter(Boolean).join(" ");
    return !/^self/i.test(detail.range || "") && !detail.area_of_effect
      && !/\b\d+-foot[- ](?:radius|cone|cube|line|sphere|cylinder|square)|\bradius\b|\beach creature|\b(?:two|three|four|five|\d+)\s+(?:glowing\s+)?(?:darts|rays|beams)\b/i.test(`${detail.range || ""} ${text}`)
      && !(effect?.attack?.times > 1)
      && !(castLevel > spellLevelForRow(row) && /\badditional (?:\w+ )?(?:creature|target|humanoid|beast)|\bone more (?:creature|target)/i.test(higher));
  }
  if (short === "Seeking") return Boolean(detail.attack_type) || /spell attack/i.test(text);
  if (short === "Careful" || short === "Heightened") return Boolean(spellSaveFor(row));
  if (short === "Transmuted") return /\b(?:acid|cold|fire|lightning|poison|thunder)\b/i.test(`${(effect?.types || []).join(" ")} ${text.match(/\b\w+ damage\b/gi)?.join(" ") || ""}`);
  if (short === "Empowered") return ["damage", "rider"].includes(effect?.kind);
  if (short === "Quickened") return castingShorthand(detail.casting_time) === "A";
  if (short === "Distant") return !/^self/i.test(detail.range || "");
  if (short === "Extended") return /\b\d+\s*(?:minute|hour|day)s?\b/i.test(detail.duration || "");
  return true;
}

function metamagicCost(name, castLevel) {
  const option = CLASS_OPTIONS.metamagic.find(item => item.name.startsWith(name));
  return option?.points === "spellLevel" ? Math.max(1, castLevel) : Number(option?.points || 0);
}

function metamagicChoices(row, castLevel, picked) {
  const adept = metamagicPools().some(item => item.name !== "Sorcery Points");
  if (!metamagicPools().length || (classLevel("sorcerer") < 3 && !adept)) return [];
  const spentSoFar = picked.reduce((sum, name) => sum + metamagicCost(name, castLevel), 0);
  const hasMain = picked.some(name => !CLASS_OPTIONS.metamagic.find(item => item.name.startsWith(name))?.stacks);
  return knownMetamagic()
    .map(option => ({ ...option, short: option.name.replace(/ Spell$/, "") }))
    .filter(option => !picked.includes(option.short) && (option.stacks || !hasMain))
    .filter(option => metamagicFits(option.short, row, castLevel))
    .filter(option => metamagicCost(option.short, castLevel) + spentSoFar <= metamagicPointsLeft());
}

function promptMetamagic(row, castLevel, picked, done) {
  const choices = metamagicChoices(row, castLevel, picked);
  if (!choices.length) {
    done(picked);
    return;
  }
  showToast(`<span class="toast-label">${picked.length ? `Add to ${escapeHtml(picked.join(" + "))}?` : "Metamagic?"}</span><span>${metamagicPointsLeft()} sorcery points. One option per spell, plus Empowered or Seeking.</span>`, {
    actions: [
      { label: picked.length ? "Cast" : "Cast without", run: () => done(picked) },
      ...choices.map(option => ({ label: `${option.short} (${metamagicCost(option.short, castLevel)})`, run: () => promptMetamagic(row, castLevel, [...picked, option.short], done) }))
    ],
    persist: true
  });
}
