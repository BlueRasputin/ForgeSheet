// Device preferences (dice, easy mode, colors) live in localStorage; rules choices live on each character.
let prefs = loadPrefs();

function loadPrefs() {
  const defaults = { diceMode: "physical", easyMode: false, accent: "", bg: "" };
  try {
    return { ...defaults, ...(JSON.parse(localStorage.getItem(PREFS_KEY)) || {}) };
  } catch {
    return defaults;
  }
}

function savePrefs() {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Private mode: preferences last for this visit only.
  }
}

// Picks black or white text for a custom button color using WCAG relative luminance.
function readableOn(hex) {
  const [r, g, b] = [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16) / 255)
    .map(channel => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.179 ? "#111111" : "#ffffff";
}

function applyAppearance() {
  const style = document.body.style;
  if (prefs.accent) {
    style.setProperty("--accent", prefs.accent);
    style.setProperty("--accent-strong", `color-mix(in srgb, ${prefs.accent} 82%, black)`);
    style.setProperty("--on-accent", readableOn(prefs.accent));
  } else {
    ["--accent", "--accent-strong", "--on-accent"].forEach(name => style.removeProperty(name));
  }
  if (prefs.bg) style.setProperty("--bg", prefs.bg);
  else style.removeProperty("--bg");
  document.body.classList.toggle("easy-mode", Boolean(prefs.easyMode));
}

function openSettings() {
  renderSettings();
  document.querySelector("#settingsDialog").showModal();
}

function renderSettings() {
  document.querySelectorAll('input[name="diceMode"]').forEach(input => { input.checked = input.value === prefs.diceMode; });
  document.querySelector("#easyModeToggle").checked = Boolean(prefs.easyMode);
  document.querySelector("#themeSelect").value = document.body.dataset.theme;
  const computed = getComputedStyle(document.body);
  document.querySelector("#accentColorInput").value = prefs.accent || toHexColor(computed.getPropertyValue("--accent"));
  document.querySelector("#bgColorInput").value = prefs.bg || toHexColor(computed.getPropertyValue("--bg"));
  document.querySelector("#rulesEditions").innerHTML = classEntries().map(entry => `
    <label>${escapeHtml(getClasses()[entry.classId]?.name || entry.classId)} rules
      <select data-rules-entry="${escapeHtml(entry.key)}">
        <option value="2014" ${entry.rules === "2014" ? "selected" : ""}>2014 Player's Handbook</option>
        <option value="2024" ${entry.rules === "2024" ? "selected" : ""}>2024 Player's Handbook</option>
      </select>
    </label>`).join("");
  const rules = Object.entries(character.homebrewRules || {});
  document.querySelector("#homebrewList").innerHTML = rules.length
    ? `<strong>Homebrew rules on ${escapeHtml(character.name || "this character")}</strong>${rules.map(([id, rule]) => `
      <div class="homebrew-item"><span>${escapeHtml(rule.label || id)}</span><button type="button" class="ghost" data-revoke-rule="${escapeHtml(id)}">Turn off</button></div>`).join("")}`
    : `<p class="muted">No homebrew rules on this character. When you do something the rules don't allow, you'll be asked first.</p>`;
}

// Theme tokens come back as "#c2412d" or "rgb(…)"; <input type="color"> only accepts #rrggbb.
function toHexColor(value) {
  const text = String(value).trim();
  if (/^#[0-9a-f]{6}$/i.test(text)) return text;
  const rgb = text.match(/\d+/g);
  return rgb ? `#${rgb.slice(0, 3).map(part => Number(part).toString(16).padStart(2, "0")).join("")}` : "#888888";
}

function handleSettingsInput(event) {
  const target = event.target;
  if (target.name === "diceMode") prefs.diceMode = target.value;
  if (target.id === "easyModeToggle") prefs.easyMode = target.checked;
  if (target.id === "accentColorInput") prefs.accent = target.value;
  if (target.id === "bgColorInput") prefs.bg = target.value;
  if (target.id === "themeSelect") {
    handleThemeSelect(event);
    // A new theme brings its own palette; keep only colors the player picked explicitly.
    renderSettings();
  }
  if (target.dataset.rulesEntry) {
    setRulesEdition(target.dataset.rulesEntry, target.value);
    return;
  }
  savePrefs();
  applyAppearance();
  if (target.id === "easyModeToggle") renderAll();
}

function handleSettingsClick(event) {
  if (event.target.closest("#resetAppearance")) {
    prefs.accent = "";
    prefs.bg = "";
    savePrefs();
    applyAppearance();
    renderSettings();
    return;
  }
  const revoke = event.target.closest("[data-revoke-rule]");
  if (revoke) {
    delete character.homebrewRules[revoke.dataset.revokeRule];
    persistAndRender();
    renderSettings();
  }
}

function setRulesEdition(key, edition) {
  if (key === "primary") character.rulesVersion = edition;
  else {
    const entry = (character.multiclasses || []).find(item => item.id === key);
    if (entry) entry.rules = edition;
  }
  persistAndRender();
}

// ---- Homebrew rule gate ----
// Anything the rules don't allow asks once per character; accepting records the house rule on that character only.
let pendingHomebrew = null;

function breakRule(ruleId, description, proceed) {
  if (character.homebrewRules?.[ruleId]) {
    proceed();
    return true;
  }
  pendingHomebrew = { ruleId, description, proceed, sheetId: character.sheetId };
  document.querySelector("#homebrewRule").textContent = description;
  document.querySelector("#homebrewCharacter").textContent = character.name || "this character";
  document.querySelector("#homebrewAccept").checked = false;
  document.querySelector("#homebrewConfirm").disabled = true;
  document.querySelector("#homebrewDialog").showModal();
  return false;
}

function isRuleBroken(ruleId) {
  return Boolean(character.homebrewRules?.[ruleId]);
}

function handleHomebrewClose(event) {
  const dialog = event.target;
  const pending = pendingHomebrew;
  pendingHomebrew = null;
  if (dialog.returnValue !== "confirm" || !pending || pending.sheetId !== character.sheetId) {
    renderAll();
    return;
  }
  character.homebrewRules = { ...(character.homebrewRules || {}), [pending.ruleId]: { label: HOMEBREW_RULES[pending.ruleId] || pending.description, at: Date.now() } };
  persist();
  pending.proceed();
}

// Plain-language names for the rules the sheet enforces, shown in Settings.
const HOMEBREW_RULES = {
  "prepared-limit": "Prepare more spells than the class allows",
  "known-limit": "Know more spells than the class allows",
  "cantrip-limit": "Know more cantrips than the class allows",
  "off-list-spells": "Learn spells from outside your class list",
  "ability-cap": "Raise an ability score above 20",
  "multiclass-prereq": "Multiclass without the ability score prerequisites",
  "feat-prereq": "Take a feat without its prerequisite",
  "attunement-limit": "Attune to more than 3 magic items",
  "level-cap": "Go past character level 20"
};
