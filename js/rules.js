// Player-facing rules the table asks about often (original summaries of the 2014 PHB and DMG).
RULES_REFERENCE.push(
  rule("core", "Inspiration", "The DM hands out inspiration for playing your character well (traits, ideals, bonds, flaws). You either have it or you don't: it doesn't stack unless your table turns on the stacking house rule. Spend it for advantage on one attack roll, saving throw or ability check. You can also give your inspiration to another player's character who earned it."),
  rule("core", "Passive Checks", "No roll: the total is 10 + every modifier you'd add to that check. Advantage adds 5 and disadvantage subtracts 5. The DM uses them to see what you notice without asking (passive Perception for hidden threats, Investigation for clues, Insight against a lie), or for a task you repeat over and over. Observant adds 5 to passive Perception and Investigation."),
  rule("core", "Group Checks", "When the party does something together (sneaking past a guard post, climbing a cliff, finding the way), everyone in the group makes the check. If at least half of them meet the DC, the whole group succeeds; otherwise the group fails."),
  rule("combat", "Massive Damage", "Instant death: if damage takes you to 0 HP and the damage left over is at least your HP maximum, you die. Example: 20 HP maximum, 8 HP left, hit for 30: 22 left over, so you die. Already at 0 HP, a hit that equals or beats your HP maximum also kills you; a smaller hit is one failed death save (two if it's a critical)."),
  rule("equipment", "Potions of Healing", "Drinking a potion, or giving one to another creature, takes an action. Healing by rarity: Potion of Healing (common) 2d4 + 2; Greater Healing (uncommon) 4d4 + 4; Superior Healing (rare) 8d4 + 8; Supreme Healing (very rare) 10d4 + 20. A creature at 0 HP that regains any hit points wakes up."),
  rule("combat", "Escaping a Grapple", "On your turn, use your action: your Strength (Athletics) or Dexterity (Acrobatics) check against the grappler's Strength (Athletics). Win and you're free. The grapple also ends if the grappler becomes incapacitated, or if something carries you out of its reach. A creature dragging or carrying someone it grapples moves at half speed, unless the grappled one is at least two sizes smaller."),
  rule("combat", "Hiding and Unseen Attackers", "You can only hide from creatures that can't see you clearly: you need heavy obscurement, darkness, total cover or the like. Roll Dexterity (Stealth); a creature looking for you rolls Wisdom (Perception) against it, and others use their passive Perception. Making noise or stepping into view gives you away. Attacking a creature that can't see you gives you advantage, and if you were hidden, the attack reveals where you are whether it hits or misses. Attacking a target you can't see is at disadvantage, and if you guess the wrong square the attack misses.")
);

let lookupSpellRules = null;

// Every bundled spell, whether or not the open sheet knows it.
function spellLookupRules() {
  if (lookupSpellRules) return lookupSpellRules;
  const titleCase = id => id.charAt(0).toUpperCase() + id.slice(1);
  lookupSpellRules = LOCAL_SPELLS.map(spell => {
    const school = spell.school?.name || "";
    const optional = (spell.optionalClasses || []).map(titleCase);
    const meta = [
      spell.level ? `${ordinal(spell.level)}-level ${school.toLowerCase()}`.trim() : `${school} cantrip`.trim(),
      spell.ritual ? "ritual" : "",
      `Casting time: ${spell.casting_time}`,
      `Range: ${spell.range}`,
      `Components: ${(spell.components || []).join(", ")}${spell.material ? ` (${spell.material})` : ""}`,
      `Duration: ${spell.duration}`,
      `Classes: ${(spell.classes || []).map(cls => cls.name).join(", ") || "None"}${optional.length ? `; optional (Tasha's): ${optional.join(", ")}` : ""}`
    ].filter(Boolean).join(" · ");
    const higher = (spell.higher_level || []).join(" ");
    return { category: "spell", title: spell.name, meta, body: `${(spell.desc || []).join(" ")}${higher ? ` At higher levels: ${higher}` : ""}` };
  });
  return lookupSpellRules;
}

function renderRulesReference() {
  const query = document.querySelector("#rulesSearch")?.value.trim().toLowerCase() || "";
  const category = document.querySelector("#rulesCategory")?.value || "all";
  const bundled = new Set(LOCAL_SPELLS.map(spell => spell.index));
  // Custom spells on this sheet; bundled ones come from the full lookup below.
  const spellRules = character.spells
    .filter(row => spellRowHasSpell(row) && !bundled.has(row.index))
    .map(row => {
      const name = spellDisplayName(row);
      const details = spellDetails[row.index]?.desc?.join(" ");
      return rule("spell", name, details || "Known or prepared spell. Open the Spells tab for full editable details.");
    });
  const moduleRules = (character.classOptions || [])
    .filter(option => option.name || option.notes)
    .map(option => rule("class", option.name || "Class option", `${option.kind || "custom"} · ${option.notes || "No notes yet."}`));
  // The full spell list joins once you search or pick Spells, so the opening list stays short.
  const entries = [...RULES_REFERENCE, ...spellRules, ...moduleRules, ...(query || category === "spell" ? spellLookupRules() : [])];
  const rank = entry => entry.title.toLowerCase() === query ? 0 : entry.title.toLowerCase().startsWith(query) ? 1 : entry.title.toLowerCase().includes(query) ? 2 : 3;
  const filtered = entries
    .filter(entry => category === "all" || entry.category === category)
    .filter(entry => !query || `${entry.title} ${entry.meta || ""} ${entry.body} ${entry.category}`.toLowerCase().includes(query))
    .sort((a, b) => (query ? rank(a) - rank(b) : 0));
  // ponytail: first 60 cards only; a longer list needs paging or virtual scroll.
  const shown = filtered.slice(0, 60);
  document.querySelector("#rulesCount").textContent = `${filtered.length > shown.length ? `${shown.length} of ` : ""}${filtered.length} entr${filtered.length === 1 ? "y" : "ies"}`;
  document.querySelector("#rulesResults").innerHTML = shown.length
    ? shown.map(entry => `
      <article class="rule-card">
        <span>${escapeHtml(ruleCategoryLabel(entry.category))}</span>
        <strong>${escapeHtml(entry.title)}</strong>
        ${entry.meta ? `<em class="rule-meta">${escapeHtml(entry.meta)}</em>` : ""}
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
    combat: "Combat",
    rest: "Rest",
    equipment: "Equipment",
    class: "Class",
    spell: "Spell"
  }[category] || category;
}

function conditionRule(condition) {
  return RULES_REFERENCE.find(entry => entry.category === "condition" && entry.title === condition)?.body || "Open Rules in the top bar for condition details.";
}
