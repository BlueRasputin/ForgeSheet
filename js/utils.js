function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function mergeLines(existing, lines) {
  const current = String(existing || "").split("\n").map(line => line.trim()).filter(Boolean);
  const seen = new Set(current.map(line => line.toLowerCase()));
  lines.filter(Boolean).forEach(line => {
    if (!seen.has(line.toLowerCase())) {
      current.push(line);
      seen.add(line.toLowerCase());
    }
  });
  return current.join("\n");
}

function formatMod(value) {
  return value >= 0 ? `+${value}` : String(value);
}

function formatWeight(value) {
  const rounded = Math.round(Number(value || 0) * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0$/, "");
}

function ordinal(number) {
  const names = ["", "1st", "2nd", "3rd"];
  return names[number] || `${number}th`;
}

function fillSelect(select, options) {
  const value = select.value;
  select.innerHTML = options.map(([id, label]) => `<option value="${id}">${label}</option>`).join("");
  if (options.some(([id]) => id === value)) select.value = value;
}

function setValue(idOrSelector, value) {
  const element = idOrSelector.startsWith?.("[") ? document.querySelector(idOrSelector) : document.querySelector(`#${idOrSelector}`);
  if (!element || element === document.activeElement) return;
  if (element.value !== String(value ?? "")) element.value = value ?? "";
}

function truncate(text, length) {
  if (!text) return "";
  return text.length > length ? `${text.slice(0, length - 1)}...` : text;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function clamp(value, min, max = Infinity) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

let toastTimer = null;

function showToast(html, { actions = [], duration = 6000, tone = "" } = {}) {
  let toast = document.querySelector("#appToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "appToast";
    toast.className = "app-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
    toast.addEventListener("mouseenter", () => clearTimeout(toastTimer));
    toast.addEventListener("mouseleave", () => {
      toastTimer = setTimeout(hideToast, 2500);
    });
  }
  toast.dataset.tone = tone;
  toast.innerHTML = `
    <div class="app-toast-body">${html}</div>
    ${actions.map((action, index) => `<button type="button" class="secondary" data-toast-action="${index}">${escapeHtml(action.label)}</button>`).join("")}
    <button type="button" class="ghost app-toast-close" aria-label="Dismiss">×</button>
  `;
  toast.onclick = event => {
    const button = event.target.closest("[data-toast-action]");
    if (button || event.target.closest(".app-toast-close")) hideToast();
    if (button) actions[Number(button.dataset.toastAction)].run();
  };
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, duration);
}

function hideToast() {
  document.querySelector("#appToast")?.classList.remove("is-visible");
}

// "Oath of Devotion", "Life Domain", "Gloomstalker" and "gloom-stalker" all resolve to the same table key.
function normalizedSubclassKey(text) {
  return slug(String(text || ""))
    .replace(/^(order|oath|circle|college|school|way|path|domain|patron)-of-/, "")
    .replace(/^the-/, "")
    .replace(/-(domain|oath|circle|college|school|patron|order)$/, "")
    .replace(/-/g, "");
}

function lookupBySubclass(table, name = character.subclassName) {
  const key = normalizedSubclassKey(name);
  if (!key) return undefined;
  const match = Object.keys(table).find(candidate => candidate.replace(/-/g, "") === key);
  return match ? table[match] : undefined;
}
