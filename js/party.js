function renderPartyDashboard() {
  const characters = Object.values(characterLibrary).map(normalizeCharacter).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  document.querySelector("#partyCount").textContent = `${characters.length} character${characters.length === 1 ? "" : "s"}`;
  renderPartySummary(characters);
  const root = document.querySelector("#partyDashboard");
  root.innerHTML = characters.map(item => {
    const cls = getClasses()[item.classId]?.name || "Class";
    const passive = passivePerception(item);
    const equipment = equipmentWeight(item);
    const capacity = carryingCapacity(item);
    const modules = (item.classOptions || []).filter(option => option.name).slice(0, 3).map(option => option.name).join(", ");
    return `<article class="party-card"><strong>${escapeHtml(item.name || "Unnamed")}</strong><span>${escapeHtml(cls)} ${item.level || 1}${item.subclassName ? ` · ${escapeHtml(item.subclassName)}` : ""}</span><div><b>AC</b> ${item.ac || "-"} <b>HP</b> ${item.hp || "-"} / ${item.maxHp || item.hp || "-"} <b>Passive</b> ${passive}</div><div><b>Load</b> ${formatWeight(equipment)} / ${capacity} lb <b>Options</b> ${escapeHtml(modules || "-")}</div><p>${escapeHtml((item.conditions || []).join(", ") || "No conditions")}</p></article>`;
  }).join("");
}

function renderPartySummary(characters) {
  const totalHp = characters.reduce((sum, item) => sum + Number(item.hp || 0), 0);
  const maxHp = characters.reduce((sum, item) => sum + Number(item.maxHp || item.hp || 0), 0);
  const avgAc = characters.length ? Math.round(characters.reduce((sum, item) => sum + Number(item.ac || 0), 0) / characters.length) : 0;
  const conditions = characters.reduce((sum, item) => sum + (item.conditions || []).length, 0);
  document.querySelector("#partySummary").innerHTML = `
    <article><span>Total HP</span><strong>${totalHp} / ${maxHp || "-"}</strong></article>
    <article><span>Average AC</span><strong>${avgAc || "-"}</strong></article>
    <article><span>Active Conditions</span><strong>${conditions}</strong></article>
    <article><span>Highest Passive</span><strong>${characters.length ? Math.max(...characters.map(passivePerception)) : "-"}</strong></article>
  `;
}
