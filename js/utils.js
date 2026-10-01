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
  select.innerHTML = options.map(([id, label]) => `<option value="${escapeHtml(id)}">${escapeHtml(label)}</option>`).join("");
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

// Toasts stack (newest at the bottom, max 3) so a result or an Undo isn't replaced by the next toast.
function showToast(html, { actions = [], duration = 6000, tone = "" } = {}) {
  let stack = document.querySelector("#toastStack");
  if (!stack) {
    stack = document.createElement("div");
    stack.id = "toastStack";
    stack.className = "toast-stack";
    stack.setAttribute("role", "status");
    stack.setAttribute("aria-live", "polite");
    document.body.appendChild(stack);
  }
  const toast = document.createElement("div");
  toast.className = "app-toast";
  toast.dataset.tone = tone;
  toast.innerHTML = `
    <div class="app-toast-body">${html}</div>
    ${actions.map((action, index) => `<button type="button" class="secondary" data-toast-action="${index}">${escapeHtml(action.label)}</button>`).join("")}
    <button type="button" class="ghost app-toast-close" aria-label="Dismiss">×</button>
  `;
  let timer = null;
  const close = () => {
    clearTimeout(timer);
    toast.classList.remove("is-visible");
    setTimeout(() => toast.remove(), 200);
  };
  const arm = ms => {
    clearTimeout(timer);
    timer = setTimeout(close, ms);
  };
  toast.addEventListener("mouseenter", () => clearTimeout(timer));
  toast.addEventListener("mouseleave", () => arm(2500));
  toast.addEventListener("click", event => {
    const button = event.target.closest("[data-toast-action]");
    if (button || event.target.closest(".app-toast-close")) close();
    if (button) actions[Number(button.dataset.toastAction)].run();
  });
  stack.appendChild(toast);
  while (stack.children.length > 3) stack.firstElementChild.remove();
  requestAnimationFrame(() => toast.classList.add("is-visible"));
  arm(duration);
  return toast;
}

function hideToast() {
  document.querySelectorAll("#toastStack .app-toast").forEach(toast => toast.remove());
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
