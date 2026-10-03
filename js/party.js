let partySort = "hp";

function latestInitiative(item) {
  return (item.rollHistory || []).find(roll => /^Initiative/.test(roll.label))?.total ?? null;
}

function partyState(item) {
  const hp = Number(item.hp);
  if (hp <= 0 && Number(item.deathSaveFailures) >= 3) return "dead";
  if (hp <= 0 && Number(item.deathSaveSuccesses) >= 3) return "stable";
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
    .sort((a, b) => sorters[partySort](a, b) || (a.name || "").localeCompare(b.name || ""));
  document.querySelectorAll("[data-party-sort]").forEach(button => button.classList.toggle("active", button.dataset.partySort === partySort));
  const where = syncState?.connected ? "" : " on this device";
  document.querySelector("#partyCount").textContent = `${characters.length} character${characters.length === 1 ? "" : "s"}${where}`;
  renderPartySummary(characters);
  const root = document.querySelector("#partyDashboard");
  root.innerHTML = characters.map(item => {
    const cls = getClasses()[item.classId]?.name || "Custom class";
    const state = partyState(item);
    const percent = Math.round(clamp(ratio(item), 0, 1) * 100);
    const initiative = latestInitiative(item);
    const badges = [
      state === "dead" ? "Dead" : state === "stable" ? "Stable at 0 HP" : state === "down" ? `Dying: ${item.deathSaveSuccesses || 0} saved, ${item.deathSaveFailures || 0} failed` : "",
      item.concentration ? `Concentrating on ${item.concentration}` : "",
      Number(item.tempHp) ? `+${item.tempHp} temp` : ""
    ].filter(Boolean);
    const conditions = (item.conditions || []).filter(condition => condition !== "Unconscious" || state === "healthy");
    return `<article class="party-card ${item.sheetId === character.sheetId ? "is-current" : ""}" data-state="${state}" data-party-sheet="${escapeHtml(item.sheetId)}" title="Open ${escapeHtml(item.name || "this character")}">
      <div class="party-card-head">
        <strong>${escapeHtml(item.name || "Unnamed")}</strong>
        ${initiative !== null ? `<span class="party-init" title="Latest initiative roll">Init ${initiative}</span>` : ""}
      </div>
      <span class="party-class">${escapeHtml(classLabel(item))}${item.subclassName ? ` · ${escapeHtml(item.subclassName)}` : ""}</span>
      <div class="party-hp"><b>${escapeHtml(String(item.hp ?? "-"))}</b>/${effectiveMaxHp(item) || "-"} HP · AC ${escapeHtml(String(item.ac || "-"))} · Passive ${passivePerception(item)}</div>
      <div class="party-hp-bar" aria-hidden="true"><span style="width:${percent}%"></span></div>
      ${badges.length ? `<p class="party-badges">${badges.map(escapeHtml).join(" · ")}</p>` : ""}
      ${conditions.length ? `<p class="party-conditions">${escapeHtml(conditions.join(", "))}</p>` : ""}
    </article>`;
  }).join("");
}

function renderPartySummary(characters) {
  const down = characters.filter(item => ["down", "dead", "stable"].includes(partyState(item)));
  const concentrating = characters.filter(item => item.concentration);
  const totalHp = characters.reduce((sum, item) => sum + Number(item.hp || 0), 0);
  const maxHp = characters.reduce((sum, item) => sum + effectiveMaxHp(item), 0);
  const list = items => items.length ? items.map(escapeHtml).join(", ") : "None";
  document.querySelector("#partySummary").innerHTML = `
    <article><span>Down</span><strong>${down.length}</strong><small>${list(down.map(item => `${item.name} (${partyState(item)})`))}</small></article>
    <article><span>Concentrating</span><strong>${concentrating.length}</strong><small>${list(concentrating.map(item => `${item.name}: ${item.concentration}`))}</small></article>
    <article><span>Party HP</span><strong>${Math.round(totalHp)} / ${Math.round(maxHp) || "-"}</strong></article>
    <article><span>Highest Passive</span><strong>${characters.length ? Math.max(...characters.map(passivePerception)) : "-"}</strong></article>
  `;
}
