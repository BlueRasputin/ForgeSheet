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
