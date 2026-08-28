function renderRulesReference() {
  const query = document.querySelector("#rulesSearch")?.value.trim().toLowerCase() || "";
  const category = document.querySelector("#rulesCategory")?.value || "all";
  const spellRules = character.spells
    .filter(spellRowHasSpell)
    .map(row => {
      const name = spellDisplayName(row);
      const details = row.custom ? row.custom.desc : spellDetails[row.index]?.desc?.join(" ");
      return rule("spell", name, details || "Known or prepared spell. Open the Spells tab for full editable details.");
    });
  const moduleRules = (character.classOptions || [])
    .filter(option => option.name || option.notes)
    .map(option => rule("class", option.name || "Class option", `${option.kind || "custom"} · ${option.notes || "No notes yet."}`));
  const entries = [...RULES_REFERENCE, ...spellRules, ...moduleRules];
  const filtered = entries
    .filter(entry => category === "all" || entry.category === category)
    .filter(entry => !query || `${entry.title} ${entry.body} ${entry.category}`.toLowerCase().includes(query));
  document.querySelector("#rulesCount").textContent = `${filtered.length} entr${filtered.length === 1 ? "y" : "ies"}`;
  document.querySelector("#rulesResults").innerHTML = filtered.length
    ? filtered.map(entry => `
      <article class="rule-card">
        <span>${escapeHtml(ruleCategoryLabel(entry.category))}</span>
        <strong>${escapeHtml(entry.title)}</strong>
        <p>${escapeHtml(entry.body)}</p>
      </article>
    `).join("")
    : `<p class="empty-state">No matching rules.</p>`;
}

function ruleCategoryLabel(category) {
  return {
    core: "Core",
    condition: "Condition",
    action: "Action",
    rest: "Rest",
    equipment: "Equipment",
    class: "Class",
    spell: "Spell"
  }[category] || category;
}

function conditionRule(condition) {
  return RULES_REFERENCE.find(entry => entry.category === "condition" && entry.title === condition)?.body || "Open Rules in the top bar for condition details.";
}
