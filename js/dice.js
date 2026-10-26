// Every roll goes through one modal: physical dice (type what you rolled) by default, or app rolls with an animation.
let rollRequest = null;
let rollSequence = 0;
// "carry" actions (the next Flurry strike, the next Scorching Ray) stay offered through the damage rolls that follow.
let carryOver = null;

function parseFormula(formula) {
  const cleaned = String(formula || "1d20").replace(/\s+/g, "").toLowerCase();
  const terms = (cleaned.match(/[+-]?[^+-]+/g) || ["1d20"]).map(token => {
    const sign = token.startsWith("-") ? -1 : 1;
    const body = token.replace(/^[+-]/, "");
    // NdS with optional suffixes: rN rerolls results of N or lower once (Great Weapon Fighting), mN makes any face
    // below N count as N (Elemental Adept), khN/klN keeps the highest/lowest N. d% is a d100.
    const dice = body.match(/^(\d*)d(\d+|%)(?:r(\d+))?(?:m(\d+))?(?:k([hl])(\d+))?$/);
    return dice
      ? { sign, body, count: Number(dice[1] || 1), sides: dice[2] === "%" ? 100 : Number(dice[2]), reroll: Number(dice[3] || 0), min: Number(dice[4] || 0), keep: dice[5] ? { high: dice[5] === "h", n: Number(dice[6]) } : null }
      : { sign, body, value: Number(body || 0) };
  });
  return { cleaned: cleaned || "1d20", terms };
}

// A lone 1d20 term is the one advantage and disadvantage apply to.
function isD20Term(term) {
  return term.count === 1 && term.sides === 20 && !term.keep;
}

// physical: { [termIndex]: [values] } typed by the player; otherwise the app rolls.
// options.minD20: Reliable Talent's floor on the d20. options.elven: Elven Accuracy rolls a third die with advantage.
// options.portent: a Portent die chosen before the roll replaces the d20 (no advantage or disadvantage).
// result.natural is the kept d20's face before Reliable Talent raises it (Halfling Lucky still sees the 1).
function evaluateRoll(formula, mode = "normal", physical = null, options = {}) {
  const { cleaned, terms } = parseFormula(formula);
  const parts = [];
  const dice = [];
  const notes = [];
  const d20Index = terms.findIndex(isD20Term);
  let total = 0;
  let natural = null;
  terms.forEach((term, index) => {
    if (!term.sides) {
      if (!Number.isFinite(term.value)) throw new Error(`Can't read "${term.body}" in ${cleaned}`);
      total += term.value * term.sign;
      parts.push(String(term.value * term.sign));
      return;
    }
    const fixed = index === d20Index && options.portent;
    const multi = !fixed && isD20Term(term) && mode !== "normal";
    const count = multi ? (options.elven && mode === "advantage" ? 3 : 2) : term.count;
    // Physical keep/min terms are typed one die at a box, so the keep and the minimum apply here too.
    // Great Weapon Fighting's rerolls are listed ("2 → 5") so the table sees what was rerolled.
    const rerolled = [];
    const values = fixed ? [options.portent] : physical ? physical[index].map(value => Math.max(value, term.min)) : Array.from({ length: count }, () => {
      const first = rollDie(term.sides);
      const value = Math.max(first <= term.reroll ? rollDie(term.sides) : first, term.min);
      if (first <= term.reroll) rerolled.push(`${first} → ${value}`);
      return value;
    });
    if (rerolled.length) notes.push(`${term.reroll === 2 ? "Great Weapon Fighting" : "Rerolled"}: ${rerolled.join(", ")}`);
    let kept;
    if (multi) {
      kept = [mode === "advantage" ? Math.max(...values) : Math.min(...values)];
      const keptIndex = values.indexOf(kept[0]);
      values.forEach((value, n) => dice.push({ sides: 20, value, dropped: n !== keptIndex }));
    } else if (physical && !fixed && !physicalPerDie(term)) {
      // A multi-die term is typed as one total.
      kept = [values[0]];
      dice.push({ sides: term.sides, value: values[0], count: term.count });
    } else if (term.keep) {
      kept = [...values].sort((a, b) => term.keep.high ? b - a : a - b).slice(0, term.keep.n);
      const pool = [...kept];
      values.forEach(value => {
        const at = pool.indexOf(value);
        if (at >= 0) pool.splice(at, 1);
        dice.push({ sides: term.sides, value, dropped: at < 0 });
      });
    } else {
      kept = values;
      values.forEach(value => dice.push({ sides: term.sides, value }));
    }
    if (index === d20Index) natural = kept[0];
    if (isD20Term(term) && options.minD20 && kept[0] < options.minD20) {
      notes.push(`${options.minLabel || "Reliable Talent"}: the ${kept[0]} counts as ${options.minD20}`);
      kept = [options.minD20];
    }
    total += kept.reduce((sum, value) => sum + value, 0) * term.sign;
    parts.push(`${term.sign < 0 ? "-" : ""}${term.body}[${kept.join(",")}]`);
  });
  return { formula: cleaned, parts, total, dice, notes, natural };
}

// Physical rolls: each die gets its own box (kh/kl and m terms need it; damage dice can then be rerolled one by one).
// ponytail: more than 12 dice (Meteor Swarm, a big Sneak Attack crit) are typed as one total to keep the dialog usable.
function physicalPerDie(term) {
  return term.count > 1 && Boolean(term.keep || term.min || term.count <= 12);
}

function rollFormula(formula, mode = "normal") {
  return evaluateRoll(formula, mode);
}

function rollDie(sides) {
  // crypto gives an unbiased die; Math.random would also do, but this costs nothing.
  const buffer = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / sides) * sides;
  do crypto.getRandomValues(buffer); while (buffer[0] >= limit);
  return (buffer[0] % sides) + 1;
}

// Physical or app dice for this roll: the dialog's "Let the app roll this one" box overrides the Settings choice
// for one roll only (request.digital), so the saved preference never changes behind the player's back.
function physicalRoll(request = rollRequest) {
  return !(request?.digital ?? prefs.diceMode === "digital");
}

// request: { label, formula, mode, kind, ability, context, actions, detail, onResult }
function openRoll(request) {
  // Generated formulas skip the custom-roll check, so catch a malformed one here instead of rolling NaN.
  const problem = formulaProblem(request.formula || "1d20");
  if (problem) {
    showToast(`<span class="toast-label">Can't roll "${escapeHtml(request.formula)}"</span><span>${problem}</span>`, { tone: "fumble" });
    return;
  }
  rollSequence += 1;
  const carry = request.carry || carryOver || [];
  carryOver = null;
  rollRequest = { advantage: request.mode === "advantage", disadvantage: request.mode === "disadvantage", ...request, carry, result: null };
  // Bless, cover, -5/+10 and similar per-roll bonuses (play.js); Elven Accuracy for non-STR/CON attacks.
  rollRequest.chips = request.chips || rollChips(rollRequest);
  rollRequest.elven = request.elven ?? (request.kind === "attack" && hasFeat("Elven Accuracy") && !["str", "con"].includes(request.ability));
  // Starry Form Dragon (TCE p.38): INT/WIS checks and concentration saves treat a d20 of 9 or lower as 10.
  if (starryForm() === "Dragon" && ((request.kind === "check" && ["int", "wis"].includes(request.ability)) || (request.kind === "save" && request.context === "concentration")) && !(request.minD20 >= 10)) {
    rollRequest.minD20 = 10;
    rollRequest.minLabel = "Starry Form (Dragon)";
  }
  const dialog = document.querySelector("#rollDialog");
  renderRollSetup();
  if (!dialog.open) dialog.showModal();
  const { terms } = parseFormula(rollFormulaFor(rollRequest));
  const d20 = terms.some(isD20Term);
  // App rolls with nothing to decide (damage, healing) roll straight away, and so does a flat number (Goodberry's 1).
  if ((!physicalRoll() && !d20) || !terms.some(term => term.sides)) performRoll();
  else dialog.querySelector("#rollGo, .roll-input")?.focus();
}

// The flat part of a roll and where it comes from ("+5 (WIS +2, proficiency +3)"), so nobody adds it twice.
function rollModifierText(request) {
  const flat = parseFormula(request.formula).terms.filter(term => !term.sides).reduce((sum, term) => sum + term.value * term.sign, 0);
  if (!flat) return "";
  if (request.breakdown) return `${formatMod(flat)} (${request.breakdown})`;
  if (!ABILITIES.some(([id]) => id === request.ability)) return formatMod(flat);
  const base = mod(request.ability);
  const parts = rollBonusParts(request);
  const rest = flat - base - parts.reduce((sum, [, value]) => sum + value, 0);
  const prof = proficiencyBonus();
  if (rest) parts.push([parts.length ? "other bonuses" : rest === prof ? "proficiency" : rest === 2 * prof ? "expertise" : "other bonuses", rest]);
  return `${formatMod(flat)} (${[`${request.ability.toUpperCase()} ${formatMod(base)}`, ...parts.map(([label, value]) => `${label} ${formatMod(value)}`)].join(", ")})`;
}

// The named flat bonuses on a save or check: proficiency or expertise, Jack of All Trades / Remarkable Athlete, Alert,
// Cloak of Protection and other items, Aura of Protection. Whatever these don't explain shows as "other bonuses".
function rollBonusParts({ kind, ability, context, tool }) {
  const parts = [];
  const add = (label, value) => { if (value) parts.push([label, value]); };
  const prof = proficiencyBonus();
  if (kind === "save") {
    if (saveProficient(ability)) add("proficiency", prof);
    uniqueActiveItems().forEach(item => add(item.name, Number(String(item.notes || "").match(/\+(\d+)[^.]*saving throws/i)?.[1] || 0)));
    add(classLevel("artificer") >= 20 ? "Soul of Artifice" : "Durable Magic", featureSaveBonus());
    add("Aura of Protection", auraOfProtection());
    add("Dark Augmentation", darkAugmentation(ability));
    if (context === "concentration") add("Bladesong", concentrationFeatureBonus());
  }
  if (kind === "check") {
    const skill = SKILLS.some(([id]) => id === context) ? context : "";
    const trained = skill ? skillBonus(skill, ability) - mod(ability) : tool ? prof : 0;
    if (trained === 2 * prof) add("expertise", trained);
    else if (trained === prof) add("proficiency", prof);
    else add(remarkableAthlete(ability) > jackOfAllTrades() ? "Remarkable Athlete" : "Jack of All Trades", untrainedBonus(ability));
    if (context === "initiative") {
      add("Alert", hasFeat("Alert") ? 5 : 0);
      const named = [[subclassLevel("gloom-stalker") >= 3, "Dread Ambusher"], [subclassLevel("swashbuckler") >= 3, "Rakish Audacity"], [subclassLevel("war-magic") >= 2, "Tactical Wit"], [/harengon/i.test(character.species || ""), "Hare-Trigger"]];
      add(named.filter(([on]) => on).map(([, name]) => name).join(" + "), initiativeFeatureBonus());
      add("feat", customFeatModifier("initiative"));
    }
  }
  return parts;
}

// The roll's formula with the chips the player switched on, plus anything typed into Extra bonus (an ally's aura +3).
function rollFormulaFor(request) {
  const bonus = request.bonus ? `${/^[+-]/.test(request.bonus) ? "" : "+"}${request.bonus}` : "";
  return `${request.formula}${(request.chips || []).filter(chip => chip.on && chip.formula).map(chip => chip.formula).join("")}${bonus}`;
}

function currentRollMode() {
  const request = rollRequest;
  if (request.portent) return { mode: "normal", note: `Portent: the d20 is ${request.portent.value}` };
  if (request.kind) return rollModeFor(request.kind, request.ability, request.context, request);
  if (request.advantage && request.disadvantage) return { mode: "normal", note: "advantage and disadvantage cancel out" };
  return { mode: request.advantage ? "advantage" : request.disadvantage ? "disadvantage" : "normal", note: "" };
}

function dieShape(sides) {
  const shapes = {
    4: `<polygon points="50,6 95,90 5,90"/>`,
    6: `<rect x="10" y="10" width="80" height="80" rx="12"/>`,
    8: `<polygon points="50,3 95,50 50,97 5,50"/><path d="M5,50 L95,50" class="facet"/>`,
    10: `<polygon points="50,3 94,42 50,97 6,42"/><path d="M6,42 L50,58 L94,42 M50,58 L50,97" class="facet"/>`,
    12: `<polygon points="50,3 96,36 78,94 22,94 4,36"/><polygon points="50,24 74,42 65,72 35,72 26,42" class="facet"/>`,
    20: `<polygon points="50,2 94,26 94,74 50,98 6,74 6,26"/><polygon points="50,20 80,70 20,70" class="facet"/><path d="M50,2 L50,20 M94,26 L80,70 M94,74 L80,70 M50,98 L80,70 M50,98 L20,70 M6,74 L20,70 M6,26 L20,70 M94,26 L50,20 M6,26 L50,20" class="facet"/>`
  };
  return shapes[sides] || `<circle cx="50" cy="50" r="46"/>`;
}

function dieSvg(sides, value, extra = "") {
  return `<svg class="die ${extra}" viewBox="0 0 100 100" aria-hidden="true"><g class="die-body">${dieShape(sides)}</g><text x="50" y="${sides === 4 ? 70 : 60}" text-anchor="middle">${value}</text></svg>`;
}

function renderRollSetup() {
  const request = rollRequest;
  const formula = rollFormulaFor(request);
  const { terms } = parseFormula(formula);
  const d20 = terms.some(isD20Term);
  const { mode, note } = d20 ? currentRollMode() : { mode: "normal", note: "" };
  const physical = physicalRoll(request);
  document.querySelector("#rollTitle").textContent = request.label;
  const modeText = { advantage: "Advantage: roll two d20s, keep the higher", disadvantage: "Disadvantage: roll two d20s, keep the lower", normal: "Roll one d20" }[mode];
  const inputs = terms.map((term, index) => {
    if (!term.sides || (request.portent && index === terms.findIndex(isD20Term))) return "";
    const perDie = physicalPerDie(term);
    const twice = isD20Term(term) && mode !== "normal" ? (request.elven && mode === "advantage" ? 3 : 2) : perDie ? term.count : 1;
    return Array.from({ length: twice }, (_, n) => `
      <label class="roll-input-field">${term.count > 1 && !perDie ? `Total of your ${term.count}d${term.sides}` : `d${term.sides}${twice > 1 ? ` #${n + 1}` : ""}`}
        <input class="roll-input" type="number" inputmode="numeric" min="${perDie ? 1 : term.count}" max="${perDie ? term.sides : term.count * term.sides}" data-term="${index}" data-slot="${n}" required>
      </label>`).join("");
  }).join("");
  const preview = terms.filter(term => term.sides).flatMap(term => Array.from({ length: Math.min(term.count, 4) * (isD20Term(term) && mode !== "normal" ? 2 : 1) }, () => dieSvg(term.sides, term.sides === 20 ? 20 : "?", "is-idle"))).slice(0, 8).join("");
  document.querySelector("#rollBody").innerHTML = `
    <p class="roll-formula">${escapeHtml(formula)}${request.detail ? ` · ${escapeHtml(request.detail)}` : ""}</p>
    ${rollModifierText(request) ? `<p class="roll-hint">Adds ${escapeHtml(rollModifierText(request))} for you${physical ? ": enter only the die you rolled" : ""}.</p>` : ""}
    <div class="dice-tray">${preview}</div>
    ${d20 ? `
      <div class="roll-adv">
        <div class="roll-adv-toggles" role="group" aria-label="Advantage and disadvantage">
          <button type="button" class="adv-toggle" data-roll-toggle="advantage" aria-pressed="${Boolean(request.advantage)}">Advantage</button>
          <button type="button" class="adv-toggle" data-roll-toggle="disadvantage" aria-pressed="${Boolean(request.disadvantage)}">Disadvantage</button>
        </div>
        <p class="roll-mode" data-mode="${mode}">${escapeHtml(request.elven && mode === "advantage" ? "Advantage with Elven Accuracy: roll three d20s, keep the highest" : modeText)}${note ? `<small>${escapeHtml(note)}</small>` : ""}</p>
      </div>
      ${rollExtrasHtml(request)}` : ""}
    ${request.chips.length ? `<div class="roll-adv-toggles roll-chips" role="group" aria-label="Bonuses">${request.chips.map((chip, index) => `<button type="button" class="adv-toggle" data-roll-chip="${index}" aria-pressed="${Boolean(chip.on)}">${escapeHtml(chip.label)}</button>`).join("")}</div>` : ""}
    ${physical && terms.some(term => term.reroll) ? `<p class="roll-hint">Reroll each die that shows ${terms.find(term => term.reroll).reroll === 1 ? "a 1" : `${terms.find(term => term.reroll).reroll} or lower`} once and enter the new number.</p>` : ""}
    ${advantageHintChips(request)}
    ${rollHints(request).filter(hint => !advantageHintName(request, hint)).map(hint => `<p class="roll-hint">${escapeHtml(hint)}</p>`).join("")}
    ${physical ? `<div class="roll-inputs">${inputs}</div><p class="roll-error" hidden></p>` : ""}
    <label class="inline-check roll-digital"><input type="checkbox" data-roll-digital ${physical ? "" : "checked"}> Let the app roll this one</label>
    <div class="roll-buttons">
      <button type="button" class="ghost" data-roll-close>Cancel</button>
      <button type="button" class="primary" id="rollGo">${physical ? "Use my roll" : "Roll"}</button>
    </div>
  `;
}

// Situational advantage from the roll hints ("Gnome Cunning: advantage if this save is against magic") becomes a
// one-tap chip on saves and checks; it adds its name to the roll's advantage sources.
function advantageHintName(request, hint) {
  if (!["save", "check"].includes(request.kind) || /disadvantage/i.test(hint)) return "";
  return hint.match(/^([^:]+): advantage\b/i)?.[1] || (/^Advantage\b/.test(hint) ? "Species trait" : "");
}

function advantageHintChips(request) {
  const hints = rollHints(request).filter(hint => advantageHintName(request, hint));
  if (!hints.length) return "";
  return `<div class="roll-adv-toggles roll-chips" role="group" aria-label="Situational advantage">${hints.map(hint => {
    const name = advantageHintName(request, hint);
    return `<button type="button" class="adv-toggle" data-roll-hint="${escapeHtml(name)}" aria-pressed="${(request.advantageFrom || []).includes(name)}">${escapeHtml(hint.replace(/\.$/, ""))}</button>`;
  }).join("")}</div>`;
}

function readPhysicalRoll() {
  const values = {};
  let problem = "";
  document.querySelectorAll("#rollBody .roll-input").forEach(input => {
    const value = Number(input.value);
    const min = Number(input.min);
    const max = Number(input.max);
    if (input.value === "" || !Number.isInteger(value) || value < min || value > max) problem = `Enter whole numbers from ${min} to ${max}.`;
    (values[input.dataset.term] ||= [])[Number(input.dataset.slot)] = value;
  });
  return { values, problem };
}

function performRoll() {
  const request = rollRequest;
  if (!request || request.result) return;
  const formula = rollFormulaFor(request);
  const d20 = parseFormula(formula).terms.some(isD20Term);
  const { mode, note } = d20 ? currentRollMode() : { mode: request.mode || "normal", note: "" };
  const options = { minD20: request.minD20, minLabel: request.minLabel, elven: request.elven, portent: request.portent?.value };
  let result;
  if (physicalRoll(request)) {
    const { values, problem } = readPhysicalRoll();
    if (problem) {
      const error = document.querySelector("#rollBody .roll-error");
      error.hidden = false;
      error.textContent = problem;
      return;
    }
    result = evaluateRoll(formula, mode, values, options);
  } else {
    result = evaluateRoll(formula, mode, null, options);
  }
  // Damage and healing never go below 0; Indomitable Might and similar set a floor on the total.
  if (!d20 && result.total < 0) {
    result.total = 0;
    result.notes.push("A total below 0 counts as 0");
  }
  if (request.portent) {
    character.portentDice = (character.portentDice || []).filter((_, index) => index !== request.portent.index);
    const tracker = character.resources.find(item => item.name === "Portent");
    if (tracker) tracker.current = character.portentDice.length;
    result.notes.push(`Portent: the d20 is ${request.portent.value}`);
  }
  result.unfloored = result.total;
  if (request.floor && result.total < request.floor.value) {
    result.notes.push(`${request.floor.note}: total raised to ${request.floor.value}`);
    result.total = request.floor.value;
  }
  request.result = result;
  if (request.inspiration && character.inspiration) character.inspiration = Number(character.inspiration) - 1;
  const label = note ? `${request.label} (${note})` : request.label;
  request.view = { label, mode };
  character.rollHistory = [{ label, formula: result.formula, mode, total: result.total, parts: result.parts }, ...(character.rollHistory || [])].slice(0, 25);
  persistAndRender();
  const sequence = rollSequence;
  // A reroll (Indomitable, Diamond Soul) replaces the first roll: undo what that roll's onResult did first.
  if (request.replaces) restoreVitals(request.replaces);
  // The vitals before onResult, so an edit to the d20 (Lucky, Bardic Inspiration) can re-run the outcome.
  if (request.onResult) request.before = vitalsSnapshot();
  // onResult may return a sentence for the modal ("Held", "+7 HP"), or start a new roll in this same modal.
  const outcome = request.onResult?.(result);
  request.outcome = typeof outcome === "string" ? outcome : "";
  if (sequence === rollSequence) renderRollResult(label, mode, result, !physicalRoll(request), request.outcome);
}

// A follow-up that changes the d20 already rolled (Lucky, Portent, Focused Aim) updates the shown result in place.
// d20s: every d20 now on the table, keptIndex: the one that counts. bonus: a flat change to the total.
function reviseRollResult(d20s, keptIndex, note, bonus = 0) {
  const request = rollRequest;
  const result = request?.result;
  if (!result) return;
  let total = result.unfloored ?? result.total;
  const notes = [note];
  if (d20s) {
    // Reliable Talent still floors whichever die is kept.
    const raw = d20s[keptIndex];
    const kept = Math.max(raw, request.minD20 || 0);
    if (kept > raw) notes.push(`Reliable Talent: the ${raw} counts as ${kept}`);
    total += kept - (Number(String(result.parts[0]).match(/^1d20\[(\d+)\]$/)?.[1]) || 0);
    result.natural = raw;
    result.dice = [...d20s.map((value, index) => ({ sides: 20, value, dropped: index !== keptIndex })), ...result.dice.filter(die => die.sides !== 20)];
    result.parts[0] = `1d20[${kept}]`;
  }
  total += bonus;
  result.unfloored = total;
  result.total = request.floor ? Math.max(total, request.floor.value) : total;
  result.notes = [...(result.notes || []), ...notes];
  character.rollHistory[0] = { ...character.rollHistory[0], total: result.total, parts: result.parts };
  // A death or concentration save re-runs its outcome from the vitals it started with.
  if (request.onResult && request.before) {
    restoreVitals(request.before);
    const outcome = request.onResult(result);
    request.outcome = typeof outcome === "string" ? outcome : "";
  }
  persistAndRender();
  // A new sequence keeps the modal open after the follow-up runs.
  rollSequence += 1;
  renderRollResult(request.view.label, request.view.mode, result, false, request.outcome || "");
}

function renderRollResult(label, mode, result, animate, outcome = "") {
  const request = rollRequest;
  const natural = naturalD20(result);
  // Only attack rolls crit on a natural 20 (PHB p.194); checks and saves just show the natural roll.
  const crit = request.kind === "attack" && natural !== null && natural >= (request.critOn || 20);
  const tone = crit || natural === 20 ? "crit" : natural === 1 ? "fumble" : "";
  const own = typeof request.actions === "function" ? request.actions(result) : (request.actions || []);
  const actions = [...own, ...d20FollowUps(request, result), ...request.carry];
  request.liveActions = actions;
  const shown = result.dice.slice(0, 8);
  document.querySelector("#rollTitle").textContent = label;
  document.querySelector("#rollBody").innerHTML = `
    <div class="dice-tray ${animate ? "is-rolling" : ""}" data-tone="${tone}">
      ${shown.map((die, index) => dieSvg(die.sides, die.count > 1 ? die.value : die.value, die.dropped ? "is-dropped" : "")).join("")}
      ${result.dice.length > shown.length ? `<span class="dice-more">+${result.dice.length - shown.length}</span>` : ""}
    </div>
    <div class="roll-result" data-tone="${tone}">
      <b class="roll-total">${result.total}</b>
      <span>${escapeHtml(result.parts.join(" + "))}${mode !== "normal" ? ` · ${mode}` : ""}</span>
      ${crit ? `<strong class="roll-flag">Critical!</strong>` : natural === 20 ? `<strong class="roll-flag">Natural 20</strong>` : natural === 1 ? `<strong class="roll-flag">Natural 1</strong>` : ""}
      ${(result.notes || []).map(text => `<small>${escapeHtml(text)}</small>`).join("")}
      ${outcome ? `<p class="roll-outcome">${escapeHtml(outcome)}</p>` : ""}
      ${request.detail ? `<small>${escapeHtml(request.detail)}</small>` : ""}
    </div>
    <div class="roll-followups">
      ${actions.map((action, index) => `<button type="button" class="secondary" data-roll-action="${index}"${action.disabled ? " disabled" : ""}>${escapeHtml(action.label)}</button>`).join("")}
    </div>
    <div class="roll-buttons">
      ${request.onResult ? "" : `<button type="button" class="ghost" data-roll-again>Roll again</button>`}
      <button type="button" class="primary" data-roll-close>Done</button>
    </div>
  `;
  if (animate && !matchMedia("(prefers-reduced-motion: reduce)").matches) tumbleDice(result.dice.slice(0, 8));
  document.querySelector("#rollBody [data-roll-action]:not(:disabled), #rollBody [data-roll-close]")?.focus();
}

// The faces flicker through random numbers while the CSS tumble runs, then settle on the real values.
function tumbleDice(dice) {
  const faces = [...document.querySelectorAll("#rollBody .dice-tray .die text")];
  const tray = document.querySelector("#rollBody .dice-tray");
  const result = document.querySelector("#rollBody .roll-result");
  result.classList.add("is-hidden");
  let ticks = 0;
  const timer = setInterval(() => {
    ticks += 1;
    faces.forEach((face, index) => { face.textContent = rollDie(dice[index].sides); });
    if (ticks < 12) return;
    clearInterval(timer);
    faces.forEach((face, index) => { face.textContent = dice[index].value; });
    tray.classList.remove("is-rolling");
    tray.classList.add("is-landed");
    result.classList.remove("is-hidden");
  }, 65);
}

function handleRollClick(event) {
  const request = rollRequest;
  if (!request) return;
  const chip = event.target.closest("[data-roll-chip]");
  if (chip) {
    toggleRollChip(request, request.chips[Number(chip.dataset.rollChip)]);
    renderRollSetup();
    return;
  }
  const hint = event.target.closest("[data-roll-hint]");
  if (hint) {
    const name = hint.dataset.rollHint;
    const from = request.advantageFrom || [];
    request.advantageFrom = from.includes(name) ? from.filter(item => item !== name) : [...from, name];
    renderRollSetup();
    return;
  }
  const portent = event.target.closest("[data-roll-portent]");
  if (portent) {
    const index = Number(portent.dataset.rollPortent);
    request.portent = request.portent?.index === index ? null : { index, value: character.portentDice[index] };
    renderRollSetup();
    return;
  }
  const toggle = event.target.closest("[data-roll-toggle]");
  if (toggle) {
    request[toggle.dataset.rollToggle] = !request[toggle.dataset.rollToggle];
    renderRollSetup();
    return;
  }
  if (event.target.closest("#rollGo")) {
    performRoll();
    return;
  }
  if (event.target.closest("[data-roll-again]")) {
    // A fresh roll: Inspiration, Portent and the once-per-roll rerolls aren't carried over.
    openRoll({ ...request, result: null, inspiration: false, portent: null, used: undefined, view: null, focusedAim: 0, forcedHit: false, carry: request.carry });
    return;
  }
  const action = event.target.closest("[data-roll-action]");
  if (action) {
    const sequence = rollSequence;
    const chosen = request.liveActions[Number(action.dataset.rollAction)];
    carryOver = request.carry.includes(chosen) ? null : request.carry;
    chosen?.run();
    carryOver = null;
    // A follow-up that rolls (damage after a hit) reuses the modal; anything else closes it.
    if (sequence === rollSequence) document.querySelector("#rollDialog").close();
    return;
  }
  if (event.target.closest("[data-roll-close]")) document.querySelector("#rollDialog").close();
}

// d20 roll extras: spend Inspiration, an extra bonus, a different ability for a skill (PHB p.175), or a tool.
function rollExtrasHtml(request) {
  const skill = SKILLS.find(([id]) => id === rollSkillId(request));
  const tools = request.context === "ability" ? toolProficiencies() : [];
  return `
    <div class="roll-extras">
      ${character.inspiration && ["attack", "save", "check"].includes(request.kind) ? `<button type="button" class="adv-toggle" data-roll-toggle="inspiration" aria-pressed="${Boolean(request.inspiration)}">Use Inspiration (advantage)</button>` : ""}
      ${["attack", "save", "check"].includes(request.kind) ? (character.portentDice || []).map((value, index) => `<button type="button" class="adv-toggle" data-roll-portent="${index}" aria-pressed="${request.portent?.index === index}">Portent: use ${value}</button>`).join("") : ""}
      ${skill ? `<label>Ability <select data-roll-ability>${ABILITIES.map(([id, name]) => `<option value="${id}" ${id === request.ability ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}</select></label>` : ""}
      ${tools.length ? `<label>Tool <select data-roll-tool><option value="">None</option>${tools.map(tool => `<option ${tool === request.tool ? "selected" : ""}>${escapeHtml(tool)}</option>`).join("")}</select></label>` : ""}
      <label>Extra bonus <input data-roll-bonus value="${escapeHtml(request.bonus || "")}" placeholder="1d4" size="5" autocomplete="off"></label>
    </div>`;
}

// Skill checks carry the skill id as their context.
function rollSkillId(request) {
  return request.kind === "check" && SKILLS.some(([id]) => id === request.context) ? request.context : "";
}

// Tool proficiencies written on the sheet ("Thieves' tools, Herbalism kit").
function toolProficiencies() {
  return String(character.backgroundDetails?.tools || "").split(/[,;\n]/).map(text => text.trim()).filter(Boolean);
}

function handleRollChange(event) {
  const request = rollRequest;
  if (request && event.target.matches("[data-roll-bonus]")) {
    const bonus = event.target.value.replace(/\s+/g, "");
    request.bonus = /^[+-]?(\d*d\d+|\d+)$/i.test(bonus) && !formulaProblem(bonus.replace(/^[+-]/, "")) ? bonus : "";
    // Typed dice need their own boxes; otherwise keep the dialog in place so the Roll click still lands.
    if (physicalRoll(request)) renderRollSetup();
    else document.querySelector("#rollBody .roll-formula").textContent = rollFormulaFor(request);
    return;
  }
  if (request && event.target.matches("[data-roll-ability]")) {
    const ability = event.target.value;
    const skill = rollSkillId(request);
    const name = SKILLS.find(([id]) => id === skill)?.[1] || skill;
    Object.assign(request, { ability, formula: `1d20${formatMod(skillBonus(skill, ability))}`, label: `${name} (${ability.toUpperCase()}) check`, floor: indomitableMight(ability) });
    renderRollSetup();
    return;
  }
  if (request && event.target.matches("[data-roll-tool]")) {
    // A tool you're proficient with adds your proficiency bonus instead of Jack of All Trades / Remarkable Athlete.
    const tool = event.target.value;
    const name = ABILITIES.find(([id]) => id === request.ability)?.[1] || request.ability;
    // Reliable Talent covers any proficient check, tools included (PHB p.96).
    Object.assign(request, { tool, formula: `1d20${formatMod(mod(request.ability) + (tool ? proficiencyBonus() : untrainedBonus(request.ability)))}`, label: tool ? `${tool} (${name}) check` : `${name} check`, minD20: tool && classLevel("rogue") >= 11 ? 10 : 0 });
    renderRollSetup();
    return;
  }
  if (request && event.target.matches("[data-roll-digital]")) {
    request.digital = event.target.checked;
    renderRollSetup();
  }
}

function handleRollKeydown(event) {
  if (event.key === "Enter" && event.target.matches(".roll-input")) {
    event.preventDefault();
    performRoll();
  }
}

// ---- Confetti (level up) ----
function celebrate() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = document.createElement("canvas");
  canvas.className = "confetti";
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  document.body.appendChild(canvas);
  const context = canvas.getContext("2d");
  const colors = [getComputedStyle(document.body).getPropertyValue("--accent").trim() || "#c2412d", "#f4c542", "#4fb3d9", "#7bd389", "#e86fb1"];
  const pieces = Array.from({ length: 160 }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 200,
    y: innerHeight / 3,
    vx: (Math.random() - 0.5) * 16,
    vy: -Math.random() * 14 - 4,
    size: 5 + Math.random() * 6,
    spin: Math.random() * Math.PI,
    color: colors[Math.floor(Math.random() * colors.length)]
  }));
  const start = performance.now();
  const frame = now => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(piece => {
      piece.vy += 0.35;
      piece.vx *= 0.99;
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.spin += 0.2;
      context.save();
      context.translate(piece.x, piece.y);
      context.rotate(piece.spin);
      context.fillStyle = piece.color;
      context.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2);
      context.restore();
    });
    if (now - start < 3200) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}
