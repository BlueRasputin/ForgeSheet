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
    // NdS with an optional rN suffix: reroll results of N or lower once (Great Weapon Fighting).
    const dice = body.match(/^(\d*)d(\d+)(?:r(\d+))?$/);
    return dice
      ? { sign, body, count: clamp(Number(dice[1] || 1), 1, 100), sides: clamp(Number(dice[2]), 2, 1000), reroll: Number(dice[3] || 0) }
      : { sign, body, value: Number(body || 0) };
  });
  return { cleaned: cleaned || "1d20", terms };
}

// A lone 1d20 term is the one advantage and disadvantage apply to.
function isD20Term(term) {
  return term.count === 1 && term.sides === 20;
}

// physical: { [termIndex]: [values] } typed by the player; otherwise the app rolls.
function evaluateRoll(formula, mode = "normal", physical = null) {
  const { cleaned, terms } = parseFormula(formula);
  const parts = [];
  const dice = [];
  let total = 0;
  terms.forEach((term, index) => {
    if (!term.sides) {
      total += term.value * term.sign;
      parts.push(String(term.value * term.sign));
      return;
    }
    const twoD20 = isD20Term(term) && mode !== "normal";
    let kept;
    if (physical) {
      const values = physical[index];
      kept = twoD20 ? [mode === "advantage" ? Math.max(...values) : Math.min(...values)] : [values[0]];
      if (twoD20) {
        dice.push({ sides: 20, value: values[0], dropped: values[0] !== kept[0] }, { sides: 20, value: values[1], dropped: values[0] === kept[0] });
      } else {
        dice.push({ sides: term.sides, value: values[0], count: term.count });
      }
    } else {
      const rolls = Array.from({ length: term.count }, () => {
        const first = rollDie(term.sides);
        return first <= term.reroll ? rollDie(term.sides) : first;
      });
      if (twoD20) {
        const second = rollDie(20);
        kept = [mode === "advantage" ? Math.max(rolls[0], second) : Math.min(rolls[0], second)];
        dice.push({ sides: 20, value: rolls[0], dropped: rolls[0] !== kept[0] }, { sides: 20, value: second, dropped: rolls[0] === kept[0] });
      } else {
        kept = rolls;
        rolls.forEach(value => dice.push({ sides: term.sides, value }));
      }
    }
    total += kept.reduce((sum, value) => sum + value, 0) * term.sign;
    parts.push(`${term.sign < 0 ? "-" : ""}${term.body}[${kept.join(",")}]`);
  });
  return { formula: cleaned, parts, total, dice };
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

// request: { label, formula, mode, kind, ability, context, actions, detail, onResult }
function openRoll(request) {
  rollSequence += 1;
  const carry = request.carry || carryOver || [];
  carryOver = null;
  rollRequest = { advantage: request.mode === "advantage", disadvantage: request.mode === "disadvantage", ...request, carry, result: null };
  const dialog = document.querySelector("#rollDialog");
  renderRollSetup();
  if (!dialog.open) dialog.showModal();
  const d20 = parseFormula(request.formula).terms.some(isD20Term);
  // App rolls with nothing to decide (damage, healing) roll straight away.
  if (prefs.diceMode === "digital" && !d20) performRoll();
  else dialog.querySelector("#rollGo, .roll-input")?.focus();
}

function currentRollMode() {
  const request = rollRequest;
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
  const { terms } = parseFormula(request.formula);
  const d20 = terms.some(isD20Term);
  const { mode, note } = d20 ? currentRollMode() : { mode: "normal", note: "" };
  const physical = prefs.diceMode === "physical";
  document.querySelector("#rollTitle").textContent = request.label;
  const modeText = { advantage: "Advantage: roll two d20s, keep the higher", disadvantage: "Disadvantage: roll two d20s, keep the lower", normal: "Roll one d20" }[mode];
  const inputs = terms.map((term, index) => {
    if (!term.sides) return "";
    const twice = isD20Term(term) && mode !== "normal" ? 2 : 1;
    return Array.from({ length: twice }, (_, n) => `
      <label class="roll-input-field">${term.count > 1 ? `Total of your ${term.count}d${term.sides}` : `d${term.sides}${twice > 1 ? ` #${n + 1}` : ""}`}
        <input class="roll-input" type="number" inputmode="numeric" min="${term.count}" max="${term.count * term.sides}" data-term="${index}" data-slot="${n}" required>
      </label>`).join("");
  }).join("");
  const preview = terms.filter(term => term.sides).flatMap(term => Array.from({ length: Math.min(term.count, 4) * (isD20Term(term) && mode !== "normal" ? 2 : 1) }, () => dieSvg(term.sides, term.sides === 20 ? 20 : "?", "is-idle"))).slice(0, 8).join("");
  document.querySelector("#rollBody").innerHTML = `
    <p class="roll-formula">${escapeHtml(request.formula)}${request.detail ? ` · ${escapeHtml(request.detail)}` : ""}</p>
    <div class="dice-tray">${preview}</div>
    ${d20 ? `
      <div class="roll-adv">
        <div class="roll-adv-toggles" role="group" aria-label="Advantage and disadvantage">
          <button type="button" class="adv-toggle" data-roll-toggle="advantage" aria-pressed="${Boolean(request.advantage)}">Advantage</button>
          <button type="button" class="adv-toggle" data-roll-toggle="disadvantage" aria-pressed="${Boolean(request.disadvantage)}">Disadvantage</button>
        </div>
        <p class="roll-mode" data-mode="${mode}">${escapeHtml(modeText)}${note ? `<small>${escapeHtml(note)}</small>` : ""}</p>
      </div>` : ""}
    ${physical ? `<div class="roll-inputs">${inputs}</div><p class="roll-error" hidden></p>` : ""}
    <label class="inline-check roll-digital"><input type="checkbox" data-roll-digital ${physical ? "" : "checked"}> Let the app roll for me</label>
    <div class="roll-buttons">
      <button type="button" class="ghost" data-roll-close>Cancel</button>
      <button type="button" class="primary" id="rollGo">${physical ? "Use my roll" : "Roll"}</button>
    </div>
  `;
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
  const d20 = parseFormula(request.formula).terms.some(isD20Term);
  const { mode, note } = d20 ? currentRollMode() : { mode: request.mode || "normal", note: "" };
  let result;
  if (prefs.diceMode === "physical") {
    const { values, problem } = readPhysicalRoll();
    if (problem) {
      const error = document.querySelector("#rollBody .roll-error");
      error.hidden = false;
      error.textContent = problem;
      return;
    }
    result = evaluateRoll(request.formula, mode, values);
  } else {
    result = evaluateRoll(request.formula, mode);
  }
  request.result = result;
  const label = note ? `${request.label} (${note})` : request.label;
  character.rollHistory = [{ label, formula: result.formula, mode, total: result.total, parts: result.parts }, ...(character.rollHistory || [])].slice(0, 25);
  persistAndRender();
  const sequence = rollSequence;
  // onResult may return a sentence for the modal ("Held", "+7 HP"), or start a new roll in this same modal.
  const outcome = request.onResult?.(result);
  if (sequence === rollSequence) renderRollResult(label, mode, result, prefs.diceMode === "digital", typeof outcome === "string" ? outcome : "");
}

function renderRollResult(label, mode, result, animate, outcome = "") {
  const request = rollRequest;
  const natural = naturalD20(result);
  const crit = natural !== null && natural >= (request.critOn || 20);
  const tone = crit ? "crit" : natural === 1 ? "fumble" : "";
  const own = typeof request.actions === "function" ? request.actions(result) : (request.actions || []);
  const actions = [...own, ...request.carry];
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
      ${crit ? `<strong class="roll-flag">Critical!</strong>` : natural === 1 ? `<strong class="roll-flag">Natural 1</strong>` : ""}
      ${outcome ? `<p class="roll-outcome">${escapeHtml(outcome)}</p>` : ""}
      ${request.detail ? `<small>${escapeHtml(request.detail)}</small>` : ""}
    </div>
    <div class="roll-followups">
      ${actions.map((action, index) => `<button type="button" class="secondary" data-roll-action="${index}">${escapeHtml(action.label)}</button>`).join("")}
    </div>
    <div class="roll-buttons">
      <button type="button" class="ghost" data-roll-again>Roll again</button>
      <button type="button" class="primary" data-roll-close>Done</button>
    </div>
  `;
  if (animate && !matchMedia("(prefers-reduced-motion: reduce)").matches) tumbleDice(result.dice.slice(0, 8));
  document.querySelector("#rollBody [data-roll-action], #rollBody [data-roll-close]")?.focus();
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
    openRoll({ ...request, result: null, carry: request.carry });
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

function handleRollChange(event) {
  if (event.target.matches("[data-roll-digital]")) {
    prefs.diceMode = event.target.checked ? "digital" : "physical";
    savePrefs();
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
