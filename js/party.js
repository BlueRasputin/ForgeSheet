let partySort = "hp";

// The latest initiative lives on the sheet (rollInitiativeCheck); roll history is capped at 25, so it's only a
// fallback for sheets saved before that field existed.
function latestInitiative(item) {
  const stored = item.initiative && Number(item.initiative.total);
  if (Number.isFinite(stored)) return stored;
  if (item.initiative === null) return null;
  const old = Number((item.rollHistory || []).find(roll => /^Initiative/.test(roll.label))?.total);
  return Number.isFinite(old) ? old : null;
}

// Sheets count as party members unless unticked on the Party tab (NPCs, spare sheets).
function inParty(item) {
  return item?.inParty !== false;
}

function concentrationName(item) {
  return typeof item?.concentration === "string" ? item.concentration.trim() : "";
}

// Run fn with another sheet borrowed as the open character, so its own bonuses and conditions apply.
function asSheet(item, fn) {
  const open = character;
  character = item.sheetId === open.sheetId ? open : normalizeCharacter(item);
  try {
    return fn();
  } finally {
    character = open;
  }
}

function partyState(item) {
  const hp = Number(item.hp);
  if (isDead(item)) return "dead";
  if (hp <= 0 && (item.stable || Number(item.deathSaveSuccesses) >= 3)) return "stable";
  if (hp <= 0) return "down";
  const ratio = effectiveMaxHp(item) ? hp / effectiveMaxHp(item) : 1;
  return ratio <= 0.25 ? "critical" : ratio <= 0.5 ? "bloodied" : "healthy";
}

function renderPartyDashboard() {
  const ratio = item => effectiveMaxHp(item) ? Number(item.hp) / effectiveMaxHp(item) : 1;
  const sorters = {
    hp: (a, b) => ratio(a) - ratio(b),
    init: (a, b) => (latestInitiative(b) ?? -99) - (latestInitiative(a) ?? -99),
    name: () => 0
  };
  const characters = Object.values(characterLibrary).map(normalizeCharacter)
    .sort((a, b) => inParty(b) - inParty(a) || sorters[partySort](a, b) || (a.name || "").localeCompare(b.name || ""));
  const members = characters.filter(inParty);
  document.querySelectorAll("[data-party-sort]").forEach(button => button.classList.toggle("active", button.dataset.partySort === partySort));
  const where = syncState?.connected ? "" : " on this device";
  document.querySelector("#partyCount").textContent = `${members.length} in party · ${characters.length} character${characters.length === 1 ? "" : "s"}${where}`;
  renderPartySummary(members);
  const groupSkill = document.querySelector("#groupCheckSkill");
  if (groupSkill && !groupSkill.options.length) fillSelect(groupSkill, SKILLS.map(([id, name]) => [id, name]));
  const root = document.querySelector("#partyDashboard");
  // Re-rendering must not snap an open actions menu shut.
  const openMenu = root.querySelector(".party-menu[open]")?.closest("[data-party-sheet]")?.dataset.partySheet;
  root.innerHTML = characters.map(item => {
    const cls = getClasses()[item.classId]?.name || "Custom class";
    const state = partyState(item);
    const percent = Math.round(clamp(ratio(item), 0, 1) * 100);
    const initiative = latestInitiative(item);
    const badges = [
      state === "dead" ? "Dead" : state === "stable" ? "Stable at 0 HP" : state === "down" ? `Dying: ${item.deathSaveSuccesses || 0} saved, ${item.deathSaveFailures || 0} failed` : "",
      concentrationName(item) ? `Concentrating on ${concentrationName(item)}` : "",
      concentrationSavesOwed(item).length ? `CON save owed: DC ${concentrationSavesOwed(item).join(", DC ")}` : "",
      Number(item.tempHp) ? `+${item.tempHp} temp` : "",
      item.wildShape ? `${item.wildShape.name || "Beast form"} ${Number(item.wildShape.hp || 0)}/${Number(item.wildShape.max || 0)}` : "",
      Number(item.exhaustion) ? `Exhaustion ${item.exhaustion}` : ""
    ].filter(Boolean);
    const conditions = (item.conditions || []).filter(condition => condition !== "Unconscious" || state === "healthy");
    const name = item.name || "Unnamed";
    const current = item.sheetId === character.sheetId;
    const passives = partyPassives(item);
    return `<article class="party-card ${current ? "is-current" : ""} ${inParty(item) ? "" : "is-out"}" data-state="${state}" data-party-sheet="${escapeHtml(item.sheetId)}">
      <div class="party-card-head">
        <button type="button" class="party-open" ${current ? `aria-current="true" title="Open now"` : `aria-label="Open ${escapeHtml(name)}"`}><strong>${escapeHtml(name)}</strong></button>
        ${initiative !== null ? `<span class="party-init" title="Latest initiative roll">Init ${initiative}</span>` : ""}
      </div>
      <span class="party-class">${escapeHtml(classLabel(item))}${item.subclassName ? ` · ${escapeHtml(item.subclassName)}` : ""}</span>
      <div class="party-hp"><b>${escapeHtml(String(item.hp ?? "-"))}</b>/${effectiveMaxHp(item) || "-"} HP · AC ${escapeHtml(String(item.ac ? effectiveArmorClass(item) : "-"))}</div>
      <div class="party-passives">Passive Perception ${passives.perception} · Insight ${passives.insight} · Investigation ${passives.investigation}</div>
      <div class="party-hp-bar" aria-hidden="true"><span style="width:${percent}%"></span></div>
      ${badges.length ? `<p class="party-badges">${badges.map(escapeHtml).join(" · ")}</p>` : ""}
      ${conditions.length ? `<p class="party-conditions">${conditions.map(condition => escapeHtml(condition + partyConditionTag(item, condition))).join(", ")}</p>` : ""}
      ${state === "down" ? `<button type="button" class="secondary" data-party-stabilize="${escapeHtml(item.sheetId)}" aria-label="Stabilize ${escapeHtml(name)}: choose who helps">Stabilize…</button>` : ""}
      <div class="party-card-foot">
        <label class="party-member"><input type="checkbox" data-party-member="${escapeHtml(item.sheetId)}" ${inParty(item) ? "checked" : ""}> In party</label>
        ${partyMenuHtml(item, openMenu === item.sheetId)}
      </div>
    </article>`;
  }).join("");
}

function renderPartySummary(characters) {
  const stats = partySummaryStats(characters);
  const list = items => items.length ? items.map(escapeHtml).join(", ") : "None";
  document.querySelector("#partySummary").innerHTML = `
    <article><span>Down</span><strong>${stats.down.length}</strong><small>${list(stats.down.map(item => `${item.name} (${partyState(item)})`))}</small></article>
    <article><span>Concentrating</span><strong>${stats.concentrating.length}</strong><small>${list(stats.concentrating.map(item => `${item.name}: ${concentrationName(item)}${concentrationSavesOwed(item).length ? " (save owed)" : ""}`))}</small></article>
    <article><span>Party HP</span><strong>${stats.hp} / ${stats.maxHp || "-"}</strong>${stats.tempHp ? `<small>+${stats.tempHp} temp</small>` : ""}</article>
    <article><span>AC</span><strong>${stats.lowestAc ?? "-"} lowest · ${stats.averageAc ?? "-"} avg</strong>${stats.lowestAcName ? `<small>Lowest: ${escapeHtml(stats.lowestAcName)}</small>` : ""}</article>
    <article><span>Highest Passive Perception</span><strong>${stats.bestPerception ?? "-"}</strong>${stats.bestPerceptionName ? `<small>${escapeHtml(stats.bestPerceptionName)}</small>` : ""}</article>
  `;
}

// Party totals at a glance for the summary tiles.
function partySummaryStats(characters) {
  const acOf = item => Number(item.ac) ? effectiveArmorClass(item) : null;
  const withAc = characters.filter(item => acOf(item) !== null);
  const lowest = withAc.reduce((low, item) => !low || acOf(item) < acOf(low) ? item : low, null);
  const perceptions = characters.map(item => [item, partyPassives(item).perception]);
  const best = perceptions.reduce((top, entry) => !top || entry[1] > top[1] ? entry : top, null);
  return {
    down: characters.filter(item => ["down", "dead", "stable"].includes(partyState(item))),
    concentrating: characters.filter(concentrationName),
    hp: Math.round(characters.reduce((sum, item) => sum + Number(item.hp || 0), 0)),
    maxHp: Math.round(characters.reduce((sum, item) => sum + effectiveMaxHp(item), 0)),
    tempHp: characters.reduce((sum, item) => sum + Number(item.tempHp || 0), 0),
    lowestAc: lowest ? acOf(lowest) : null,
    lowestAcName: lowest?.name || "",
    averageAc: withAc.length ? Math.round(withAc.reduce((sum, item) => sum + acOf(item), 0) / withAc.length * 10) / 10 : null,
    bestPerception: best ? best[1] : null,
    bestPerceptionName: best?.[0].name || ""
  };
}

// Passive Perception, Insight and Investigation (PHB p.175), worked out on the member's own sheet.
function partyPassives(item) {
  return asSheet(item, () => ({ perception: passiveScore("perception"), insight: passiveScore("insight"), investigation: passiveScore("investigation") }));
}

function concentrationSavesOwed(item) {
  if (!concentrationName(item)) return [];
  const list = item.sheetId === character.sheetId && typeof pendingConcentrationDcs !== "undefined" && pendingConcentrationOwner === character ? pendingConcentrationDcs : item.pendingConcentration;
  return (Array.isArray(list) ? list : []).map(Number).filter(Number.isFinite);
}

// " (Hold Person, WIS save DC 14, end of each turn)" from the sheet's save-ends tag (character.conditionSaves).
function partyConditionTag(item, condition) {
  const detail = item.conditionSaves?.[condition];
  if (!detail || typeof detail !== "object") return "";
  const save = detail.dc ? `${detail.ability ? `${String(detail.ability).toUpperCase()} ` : ""}save DC ${Number(detail.dc)}` : "";
  const parts = [detail.source ? String(detail.source) : "", save, CONDITION_SAVE_TIMES[detail.when] || ""].filter(Boolean);
  return parts.length ? ` (${parts.join(", ")})` : "";
}

// ---- Party card actions: change another sheet without switching to it ----

function isDmSeat() {
  return typeof syncSettings !== "undefined" && syncSettings.role === "dm";
}

// Who did it, as the changed sheet's activity log shows it.
function actorName() {
  return isDmSeat() ? "DM" : character.name || "Someone";
}

function partyMenuHtml(item, open) {
  const id = escapeHtml(item.sheetId);
  const name = escapeHtml(item.name || "Unnamed");
  const active = new Set(item.conditions || []);
  return `<details class="party-menu" ${open ? "open" : ""}>
    <summary aria-label="Actions for ${name}"><i class="ph-light ph-dots-three" aria-hidden="true"></i>Actions</summary>
    <div class="party-actions">
      <div class="party-action-row">
        <input type="number" min="1" max="999" step="1" inputmode="numeric" data-party-amount aria-label="Amount for ${name}" placeholder="HP">
        <select data-party-type aria-label="Damage type"><option value="">Any type</option>${DAMAGE_TYPES.map(type => `<option value="${type}">${type}</option>`).join("")}</select>
        <button type="button" class="secondary" data-party-act="damage" data-sheet="${id}">Damage</button>
        <button type="button" class="secondary" data-party-act="heal" data-sheet="${id}">Heal</button>
      </div>
      <div class="party-action-row">
        <select data-party-condition aria-label="Condition for ${name}">${CONDITIONS.filter(condition => condition !== "Concentrating").map(condition => `<option value="${condition}">${active.has(condition) ? "Remove" : "Add"} ${condition}</option>`).join("")}</select>
        <button type="button" class="secondary" data-party-act="condition" data-sheet="${id}">Apply</button>
      </div>
      <div class="party-action-row">
        <button type="button" class="ghost" data-party-act="inspiration" data-sheet="${id}">Give Inspiration</button>
        <button type="button" class="ghost" data-party-act="item" data-sheet="${id}">Send item</button>
      </div>
    </div>
  </details>`;
}

function handlePartyAction(button) {
  const sheetId = button.dataset.sheet;
  const card = button.closest("[data-party-sheet]");
  const target = characterLibrary[sheetId];
  if (!target) return;
  const act = button.dataset.partyAct;
  if (act === "damage" || act === "heal") {
    const input = card.querySelector("[data-party-amount]");
    const amount = Math.round(Number(input.value));
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast(`<span class="toast-label">Enter an amount</span><span>Type the HP first, then press ${act === "damage" ? "Damage" : "Heal"}.</span>`);
      input.focus();
      return;
    }
    const type = card.querySelector("[data-party-type]").value;
    if (act === "damage") damageOther(sheetId, Math.min(amount, 999), type);
    else healOther(sheetId, Math.min(amount, 999));
    return;
  }
  if (act === "condition") return toggleSheetCondition(sheetId, card.querySelector("[data-party-condition]").value);
  if (act === "inspiration") return giveSheetInspiration(sheetId);
  if (act === "item") return openItemCards(sheetId);
}

// PHB p.125: you have inspiration or you don't, unless that sheet uses the stacking house rule.
function giveSheetInspiration(sheetId) {
  const target = characterLibrary[sheetId];
  const name = target?.name || "That character";
  if (!target) return;
  if (Number(target.inspiration) && !optionalRule("stackingInspiration", target)) {
    showToast(`<span class="toast-label">${escapeHtml(name)} already has Inspiration</span><span>It doesn't stack.</span>`);
    return;
  }
  const sheet = updateSheet(sheetId, item => { item.inspiration = Math.min(99, Number(item.inspiration || 0) + 1); }, `You gained Inspiration from ${actorName()}`);
  showToast(`<span class="toast-label">${escapeHtml(name)} gains Inspiration</span>${Number(sheet.inspiration) > 1 ? `<span>${sheet.inspiration} in all.</span>` : ""}`, { tone: "crit" });
}

function toggleSheetCondition(sheetId, condition, force = false) {
  const target = characterLibrary[sheetId];
  if (!target || !CONDITIONS.includes(condition)) return;
  const name = target.name || "That character";
  const has = (target.conditions || []).includes(condition);
  const immune = !has && !force && asSheet(target, () => conditionImmunities().get(condition));
  if (immune) {
    showToast(`<span class="toast-label">${escapeHtml(name)} is immune to ${escapeHtml(condition)}</span><span>${escapeHtml(String(immune))}</span>`, {
      actions: [{ label: "Add anyway", run: () => toggleSheetCondition(sheetId, condition, true) }]
    });
    return;
  }
  updateSheet(sheetId, item => {
    item.conditions = has ? (item.conditions || []).filter(entry => entry !== condition) : [...(item.conditions || []), condition];
    if (has && item.conditionSaves) delete item.conditionSaves[condition];
  }, has ? `${actorName()} removed ${condition}` : `${actorName()} applied ${condition}`);
  showToast(`<span class="toast-label">${escapeHtml(name)}: ${escapeHtml(condition)} ${has ? "removed" : "added"}</span>`);
}

// ---- Activity log: changes someone else made to a sheet ----

function sheetVitals(sheet) {
  return {
    hp: Number(sheet.hp || 0),
    shape: Number(sheet.wildShape?.hp || 0),
    temp: Number(sheet.tempHp || 0),
    inspiration: Number(sheet.inspiration || 0),
    conditions: [...(sheet.conditions || [])],
    stable: Boolean(sheet.stable),
    items: (sheet.equipment || []).map(item => item.id)
  };
}

function sheetChangeText(before, sheet, who) {
  const after = sheetVitals(sheet);
  const healed = after.hp + after.shape - before.hp - before.shape;
  const lost = before.hp + before.shape + before.temp - after.hp - after.shape - after.temp;
  const added = after.conditions.filter(condition => !before.conditions.includes(condition));
  // Waking at 0 HP drops Unconscious on its own; the healing line already says it.
  const removed = before.conditions.filter(condition => !after.conditions.includes(condition) && !(condition === "Unconscious" && before.hp <= 0 && after.hp > 0));
  const items = (sheet.equipment || []).filter(item => !before.items.includes(item.id)).map(item => item.name || "an item");
  return [
    healed > 0 ? `${who} healed you ${healed} HP` : lost > 0 ? `${who} dealt you ${lost} damage` : "",
    after.temp > before.temp ? `${who} gave you ${after.temp - before.temp} temp HP` : "",
    after.inspiration > before.inspiration ? `You gained Inspiration from ${who}` : "",
    after.inspiration < before.inspiration ? `${who} used your Inspiration` : "",
    after.stable && !before.stable ? `${who} stabilized you` : "",
    added.length ? `${who} applied ${added.join(", ")}` : "",
    removed.length ? `${who} removed ${removed.join(", ")}` : "",
    items.length ? `${who} sent you ${items.join(", ")}` : ""
  ].filter(Boolean).join(". ");
}

// Records a change made from someone else's seat on the changed sheet (newest first, last 20).
function logSheetChange(sheet, before, note = "") {
  if (sheet.sheetId === character.sheetId && !isDmSeat()) return;
  const text = note || sheetChangeText(before, sheet, actorName());
  if (text) addActivity(sheet, text);
}

let activitySeen = null;

function addActivity(sheet, text) {
  const entry = { id: crypto.randomUUID(), at: Date.now(), who: actorName(), text };
  sheet.activity = [entry, ...(Array.isArray(sheet.activity) ? sheet.activity : [])].slice(0, 20);
  // This seat made the change and already has its own toast.
  if (activitySeen?.sheetId === sheet.sheetId) activitySeen.ids.add(entry.id);
  return sheet;
}

// The open sheet's log; entries that arrived from another tab or device since the last render also show as toasts.
function renderSheetActivity() {
  const entries = (Array.isArray(character.activity) ? character.activity : []).filter(entry => entry && typeof entry === "object");
  if (activitySeen?.sheetId === character.sheetId) {
    entries.filter(entry => !activitySeen.ids.has(entry.id)).reverse()
      .forEach(entry => showToast(`<span class="toast-label">${escapeHtml(String(entry.text || "Your sheet changed"))}</span>`, { duration: 9000 }));
  }
  activitySeen = { sheetId: character.sheetId, ids: new Set(entries.map(entry => entry.id)) };
  const section = document.querySelector("#activitySection");
  if (!section) return;
  section.hidden = !entries.length;
  document.querySelector("#activityCount").textContent = String(entries.length);
  document.querySelector("#sheetActivity").innerHTML = entries.map(entry => `
    <li><span>${escapeHtml(String(entry.text || ""))}</span><time datetime="${new Date(Number(entry.at) || 0).toISOString()}">${escapeHtml(new Date(Number(entry.at) || 0).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }))}</time></li>
  `).join("");
}

// Group check (PHB p.175): everyone rolls; the group succeeds if at least half of them meet the DC.
function rollGroupCheck() {
  const skill = document.querySelector("#groupCheckSkill")?.value || "stealth";
  const dc = clamp(Math.round(Number(document.querySelector("#groupCheckDc")?.value) || 10), 1, 40);
  const [, skillName, ability] = SKILLS.find(([id]) => id === skill) || [];
  const results = Object.values(characterLibrary).filter(item => inParty(item) && !isDead(item) && Number(item.hp) > 0).map(item => asSheet(item, () => {
    // The skill is the context, so per-skill sources (armor Stealth disadvantage, PHB p.145) apply as on the sheet.
    const { mode } = rollModeFor("check", ability, skill);
    const roll = evaluateRoll(`1d20${formatMod(skillBonus(skill, ability))}`, mode);
    return { name: item.name || "Unnamed", total: roll.total, mode };
  }));
  const passed = results.filter(result => result.total >= dc).length;
  const success = results.length > 0 && passed * 2 >= results.length;
  showToast(`<span class="toast-label">Group ${escapeHtml(skillName)} check, DC ${dc}: ${success ? "success" : "failure"}</span><span>${results.map(result => `${escapeHtml(result.name)} ${result.total}${result.mode !== "normal" ? ` (${result.mode})` : ""}${result.total >= dc ? " ✓" : " ✗"}`).join(" · ") || "No conscious party members."} ${passed} of ${results.length} passed.</span>`, { tone: success ? "crit" : "fumble", duration: 15000 });
}

function setPartyMember(sheetId, member) {
  updateSheet(sheetId, sheet => { sheet.inParty = member; });
  renderPartyDashboard();
}

// Party card "Stabilize" (PHB p.197): pick who does it, so the Medicine roll is the helper's, not whoever's sheet
// this tab has open.
function partyStabilizeMenu(sheetId) {
  const target = characterLibrary[sheetId];
  if (!target) return;
  const name = target.name || "Ally";
  const helpers = Object.values(characterLibrary).filter(item => item.sheetId !== sheetId && inParty(item) && Number(item.hp) > 0
    && !(item.conditions || []).some(condition => INCAPACITATING.includes(condition)));
  const markStable = () => {
    updateSheet(sheetId, stabilizeSheet);
    showToast(`<span class="toast-label">${escapeHtml(name)} is stable</span>`, { tone: "crit" });
  };
  showToast(`<span class="toast-label">Who stabilizes ${escapeHtml(name)}?</span><span>The helper uses an action within reach: Medicine DC 10 with their own bonus.</span>`, {
    persist: true,
    actions: [
      ...helpers.map(helper => ({
        label: `${helper.name || "Unnamed"} (Medicine ${formatMod(asSheet(helper, () => skillBonus("medicine", "wis")))})`,
        run: () => helper.sheetId === character.sheetId ? stabilizeMenu(sheetId) : helperStabilize(helper, sheetId)
      })),
      { label: "Mark stable (kit, spell or DM ruling)", run: markStable }
    ],
    duration: 15000
  });
}

// Another sheet's Medicine check, rolled with its own bonus and advantage/disadvantage sources.
function helperStabilize(helper, sheetId) {
  const name = characterLibrary[sheetId]?.name || "Ally";
  const { mode, total } = asSheet(helper, () => {
    const { mode } = rollModeFor("check", "wis", "medicine");
    return { mode, total: evaluateRoll(`1d20${formatMod(skillBonus("medicine", "wis"))}`, mode).total };
  });
  const success = total >= 10;
  if (success) updateSheet(sheetId, stabilizeSheet);
  showToast(`<span class="toast-label">${escapeHtml(helper.name || "Helper")}: Medicine ${total}${mode !== "normal" ? ` (${mode})` : ""} vs DC 10</span><span>${success ? `${escapeHtml(name)} is stable.` : `Failed: ${escapeHtml(name)} is still dying.`}</span>`, { tone: success ? "crit" : "fumble" });
}
