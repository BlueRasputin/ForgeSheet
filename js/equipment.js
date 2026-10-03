function renderEquipment() {
  const root = document.querySelector("#equipmentRows");
  const template = document.querySelector("#equipmentRowTemplate");
  renderEquipmentCatalog();
  root.innerHTML = "";
  const items = character.equipment || [];
  if (!items.length) {
    root.innerHTML = `<p class="empty-state">No equipment tracked yet.</p>`;
  } else {
    items.forEach(item => {
      const node = template.content.firstElementChild.cloneNode(true);
      node.dataset.equipmentId = item.id;
      node.querySelector(".equipment-name").value = item.name || "";
      node.querySelector(".equipment-qty").value = item.quantity ?? 1;
      node.querySelector(".equipment-weight").value = item.weight ?? 0;
      node.querySelector(".equipment-container").value = item.container || "carried";
      node.querySelector(".equipment-equipped").checked = Boolean(item.equipped);
      node.querySelector(".equipment-attuned").checked = Boolean(item.attuned);
      node.querySelector(".equipment-notes").value = item.notes || "";
      const grantSelect = node.querySelector(".equipment-grant-spell");
      grantSelect.innerHTML = `<option value="">No spell</option>` + allSpells
        .slice().sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
        .map(spell => `<option value="${spell.index}">${escapeHtml(spell.name)} (${spell.level === 0 ? "Cantrip" : ordinal(spell.level)})</option>`).join("");
      grantSelect.value = item.grantSpell || "";
      node.querySelector(".equipment-spell").open = Boolean(item.grantSpell);
      node.querySelector(".equipment-grant-uses").value = item.grantUses || "";
      root.appendChild(node);
    });
  }
  renderEncumbrance();
  renderCurrency();
}

function renderEncumbrance() {
  const total = equipmentWeight();
  const capacity = carryingCapacity();
  const heavy = Math.round(capacity * 0.67);
  const attuned = (character.equipment || []).filter(item => item.attuned).length;
  const percent = capacity ? Math.min(100, Math.round((total / capacity) * 100)) : 0;
  const status = total > capacity ? "Over capacity" : total >= heavy ? "Heavy load" : "Comfortable";
  document.querySelector("#encumbranceSummary").textContent = `${formatWeight(total)} / ${capacity} lb · ${status} · ${attuned}/3 attuned`;
  document.querySelector("#encumbranceFill").style.width = `${percent}%`;
  document.querySelector("#encumbranceFill").dataset.state = total > capacity ? "over" : total >= heavy ? "heavy" : "ok";
}

function renderCurrency() {
  const coins = character.currency || {};
  setValue("coinCp", coins.cp || 0);
  setValue("coinSp", coins.sp || 0);
  setValue("coinEp", coins.ep || 0);
  setValue("coinGp", coins.gp || 0);
  setValue("coinPp", coins.pp || 0);
  const gp = (Number(coins.cp || 0) / 100) + (Number(coins.sp || 0) / 10) + (Number(coins.ep || 0) / 2) + Number(coins.gp || 0) + (Number(coins.pp || 0) * 10);
  document.querySelector("#coinSummary").textContent = `${formatWeight(gp)} gp`;
}

function addEquipment() {
  character.equipment.push({ id: crypto.randomUUID(), name: "New Item", quantity: 1, weight: 0, equipped: false, attuned: false, notes: "" });
  persistAndRender();
}

function renderEquipmentCatalog() {
  const select = document.querySelector("#equipmentCatalogSelect");
  if (!select) return;
  const current = select.value;
  fillSelect(select, ITEM_CATALOG.map(item => [item.index, `${item.name} (${item.type})`]));
  if (ITEM_CATALOG.some(item => item.index === current)) select.value = current;
}

function addCatalogEquipment() {
  const item = ITEM_CATALOG.find(entry => entry.index === document.querySelector("#equipmentCatalogSelect").value);
  if (!item) return;
  character.equipment.push(equipmentFromItemCard(item));
  persistAndRender();
}

function handleEquipmentInput(event) {
  const row = event.target.closest(".equipment-row");
  if (!row) return;
  const item = character.equipment.find(entry => entry.id === row.dataset.equipmentId);
  if (!item) return;
  if (event.target.classList.contains("equipment-name")) item.name = event.target.value;
  if (event.target.classList.contains("equipment-qty")) item.quantity = clamp(Number(event.target.value), 0, 999);
  if (event.target.classList.contains("equipment-weight")) item.weight = Math.max(0, Number(event.target.value) || 0);
  if (event.target.classList.contains("equipment-container")) item.container = event.target.value;
  if (event.target.classList.contains("equipment-equipped") || event.target.classList.contains("equipment-container")) {
    if (event.target.classList.contains("equipment-equipped")) {
      item.equipped = event.target.checked;
      if (item.equipped) item.container = "equipped";
    }
    persistAndRender();
    return;
  }
  if (event.target.classList.contains("equipment-attuned")) {
    const attuned = character.equipment.filter(entry => entry.attuned && entry !== item).length;
    // DMG p.138: a creature can be attuned to no more than three magic items at a time.
    if (event.target.checked && attuned >= 3 && !isRuleBroken("attunement-limit")) {
      event.target.checked = false;
      breakRule("attunement-limit", "You're already attuned to 3 magic items, the most a creature can be attuned to at once. End an attunement first, or allow more.", () => {
        item.attuned = true;
        persistAndRender();
      });
      return;
    }
    item.attuned = event.target.checked;
  }
  if (event.target.classList.contains("equipment-notes")) item.notes = event.target.value;
  if (event.target.classList.contains("equipment-grant-spell")) {
    item.grantSpell = event.target.value;
    item.grantUsed = 0;
    persistAndRender();
    return;
  }
  if (event.target.classList.contains("equipment-grant-uses")) {
    item.grantUses = clamp(Number(event.target.value), 0, 99);
    persistAndRender();
    return;
  }
  persist();
  renderEncumbrance();
}

function handleEquipmentClick(event) {
  const button = event.target.closest(".remove-equipment");
  if (!button) return;
  const row = button.closest(".equipment-row");
  character.equipment = character.equipment.filter(item => item.id !== row.dataset.equipmentId);
  persistAndRender();
}

function equipmentFromItemCard(item) {
  return {
    id: crypto.randomUUID(),
    name: item.name,
    quantity: item.quantity || 1,
    weight: Number(item.weight || 0),
    // The bag itself weighs 15 lb wherever it is; only what's inside it stops counting.
    container: item.container || "carried",
    equipped: item.container === "equipped",
    attuned: /attunement/i.test(item.notes || ""),
    notes: [item.type, item.rarity, item.notes].filter(Boolean).join(" - ")
  };
}

function carryingCapacity(source = character) {
  return Math.max(0, Number(source.abilities?.str || 10) * 15);
}

function equipmentWeight(source = character) {
  return (source.equipment || []).reduce((sum, item) => {
    if (["bagOfHolding", "mount", "home"].includes(item.container)) return sum;
    return sum + (Number(item.quantity || 0) * Number(item.weight || 0));
  }, 0);
}
