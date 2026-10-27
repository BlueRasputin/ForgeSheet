// Hover help: pause on (or keyboard-focus, or long-press) anything on the sheet to see what it means.
// One delegated listener; each kind of element has a resolver that returns { title, body }.
// The box is a manual popover, so it shows above open dialogs too.
const TIP_DELAY = 350;
let tipTimer = null;
let tipTarget = null;

const ABILITY_TIPS = {
  str: "Physical power. Strength checks (Athletics), attack and damage with most melee weapons, Strength saves against being shoved, grappled or held, and how much you can carry.",
  dex: "Agility and reflexes. Dexterity checks (Acrobatics, Sleight of Hand, Stealth), ranged and finesse weapon attacks, initiative, AC in light or no armor, and Dexterity saves to dodge area effects.",
  con: "Health and stamina. Adds to your hit points every level, and Constitution saves hold your concentration on a spell and resist poison, disease and exhaustion.",
  int: "Reasoning and memory. Intelligence checks (Arcana, History, Investigation, Nature, Religion); the spellcasting ability of wizards, artificers, Eldritch Knights and Arcane Tricksters.",
  wis: "Awareness and intuition. Wisdom checks (Animal Handling, Insight, Medicine, Perception, Survival), passive Perception, and Wisdom saves against charm and fear; clerics, druids and rangers cast with it.",
  cha: "Force of personality. Charisma checks (Deception, Intimidation, Performance, Persuasion); bards, paladins, sorcerers and warlocks cast with it."
};

const SKILL_TIPS = {
  acrobatics: "Staying on your feet in tricky situations: balancing, tumbling, flips, and escaping a grapple by slipping free.",
  animalHandling: "Calming, controlling or reading the intentions of animals, and keeping a mount steady.",
  arcana: "Knowledge of spells, magic items, magical traditions, the planes and their creatures.",
  athletics: "Climbing, jumping, swimming, and grappling or shoving another creature.",
  deception: "Hiding the truth convincingly: lies, disguises, misdirection.",
  history: "Recalling historical events, legendary people, ancient kingdoms, wars and lost civilizations.",
  insight: "Reading a creature's true intentions: spotting a lie or predicting what someone will do.",
  intimidation: "Influencing someone through threats, hostile actions or a show of force.",
  investigation: "Searching for clues and working out what they mean: hidden doors, weak points, how a trap works.",
  medicine: "Stabilizing a dying companion and diagnosing illness.",
  nature: "Knowledge of terrain, plants, animals, weather and natural cycles.",
  perception: "Noticing things with your senses: spotting, hearing or otherwise detecting something.",
  performance: "Delighting an audience with music, dance, acting or storytelling.",
  persuasion: "Influencing someone with tact, good nature or reasoned argument.",
  religion: "Knowledge of deities, rites, prayers, religious hierarchies and holy symbols.",
  sleightOfHand: "Manual trickery: picking a pocket, palming an object, planting something on someone.",
  stealth: "Moving quietly and unseen: sneaking past guards or hiding.",
  survival: "Tracking, hunting, navigating the wild, and avoiding natural hazards."
};

// The curated rules entry for a title in the character's edition (rules-reference.js), if there is one.
function tipRule(title) {
  const edition = classEntries()[0]?.rules || "2014";
  const match = list => list.find(entry => entry.title.toLowerCase() === title.toLowerCase());
  return (edition === "2024" ? match(RULES_2024) : null) || match(RULES_2014) || match(RULES_REFERENCE) || null;
}

function ruleTip(title, fallback) {
  const entry = tipRule(title);
  return { title, body: entry?.body || fallback, edition: entry?.edition };
}

// A spell row's text: the 2024 SRD version when the class it belongs to uses 2024 and the SRD has it.
function spellTip(row) {
  if (!row || !spellRowHasSpell(row)) return null;
  const entry = classEntries().find(item => item.key === spellRowKey(row));
  const srd2024 = entry?.rules === "2024" ? SRD_2024_SPELLS.find(spell => spell.index === row.index) : null;
  if (srd2024) {
    return {
      title: srd2024.name,
      meta: [srd2024.level ? `Level ${srd2024.level} ${srd2024.school}` : `${srd2024.school} cantrip`, srd2024.casting_time, srd2024.range, srd2024.duration].join(" · "),
      body: srd2024.text.replace(/\*\*/g, ""),
      edition: "2024"
    };
  }
  const detail = row.custom || spellDetails[row.index] || {};
  const level = spellLevelForRow(row);
  return {
    title: spellDisplayName(row),
    meta: [level ? `${ordinal(level)} level` : "Cantrip", detail.casting_time || detail.castingTime, detail.range, detail.duration].filter(Boolean).join(" · "),
    body: [detail.desc].flat().filter(Boolean).join(" ") || "No description yet. Open the Spells tab to add one."
  };
}

// The class or subclass feature behind a resource pool ("Channel Divinity", "Ki Points" -> Monk's Focus / Ki).
const RESOURCE_FEATURE_NAMES = { "Ki Points": ["Ki", "Monk's Focus"], "Superiority Dice": ["Combat Superiority"], "Sorcery Points": ["Font of Magic"], "Lay on Hands (HP pool)": ["Lay On Hands", "Lay on Hands"], "Psionic Energy Dice": ["Psionic Power"], "Favored Enemy (Hunter's Mark)": ["Favored Enemy"] };

function featureTextFor(name) {
  const base = name.replace(/\s*\(.*\)$/, "");
  const wanted = [name, base, ...(RESOURCE_FEATURE_NAMES[name] || [])].map(item => item.toLowerCase());
  for (const entry of classEntries()) {
    const cls = entryClass(entry);
    const slug = subclassIndexFor(entry);
    const rows = cls.srd2024
      ? [...cls.srd2024.levels.flatMap(level => level.features.map(feature => [feature.name, feature.text])), ...(srdSubclass2024(cls, slug)?.features || []).map(feature => [feature.name, feature.text])]
      : [...(CLASS_FEATURE_DETAILS[entry.classId] || []).map(([, featureName, summary]) => [featureName, summary]), ...(SUBCLASS_FEATURES[slug]?.features || []).map(([, featureName, summary]) => [featureName, summary])];
    const found = rows.find(([featureName]) => wanted.includes(featureName.toLowerCase().replace(/\s*\(.*\)$/, "")));
    if (found) return { text: found[1], edition: cls.srd2024 ? "2024" : "" };
  }
  return null;
}

function resourceTip(resource) {
  if (!resource) return null;
  const feature = featureTextFor(resource.name);
  const refill = { short: "Refills on a short or long rest.", long: "Refills on a long rest.", shortOne: "One use comes back on a short rest; all of them on a long rest.", manual: "Restore it by hand when it comes back." }[resource.reset] || "";
  return { title: resource.label || resource.name, body: [feature?.text, refill].filter(Boolean).join(" "), edition: feature?.edition };
}

const inspirationTip = () => classEntries()[0]?.rules === "2024"
  ? { title: "Heroic Inspiration", body: "When you have it, you can spend it to reroll any one die right after rolling it, and use the new roll. You either have it or you don't.", edition: "2024" }
  : { title: "Inspiration", body: "The DM awards it for playing your character well. Spend it for advantage on one attack roll, saving throw or ability check. You either have it or you don't.", edition: "2014" };

// [selector, resolver]. The first selector whose closest match contains the pointer wins, so specific ones go first.
const TIP_RESOLVERS = [
  ["[data-spell-id]", el => spellTip(character.spells.find(row => row.id === el.dataset.spellId))],
  ["[data-res-id]", el => resourceTip(character.resources.find(item => item.id === el.dataset.resId))],
  ["[data-condition]", el => ({ title: el.dataset.condition, body: el.dataset.condition === "Concentrating" ? "You're maintaining a concentration spell. Taking damage calls for a Constitution save (DC 10 or half the damage, whichever is higher); becoming incapacitated or casting another concentration spell ends it." : conditionRule(el.dataset.condition) })],
  [".ability-save", el => ruleTip("Saving Throws", "A d20 + this ability's modifier (+ your proficiency bonus if you're proficient) to resist a spell, trap, poison or other danger.")],
  ["[data-roll-ability], .ability-box", el => {
    const id = el.closest(".ability-box")?.querySelector("[data-ability]")?.dataset.ability;
    return id ? { title: ABILITIES.find(([key]) => key === id)?.[1] || id, body: `${ABILITY_TIPS[id]} The big number is the modifier you add to the d20: (score − 10) ÷ 2, rounded down.` } : null;
  }],
  [".skill-row", el => {
    const id = el.querySelector("[data-skill]")?.dataset.skill;
    const [, name, ability] = SKILLS.find(([key]) => key === id) || [];
    return name ? { title: `${name} (${ability.toUpperCase()})`, body: `${SKILL_TIPS[id] || ""} Roll a d20 + your ${ability.toUpperCase()} modifier, plus your proficiency bonus if the circle is filled (double it with the star for expertise).` } : null;
  }],
  [".sense-row", el => {
    const label = el.querySelector("span")?.textContent || "Passive score";
    return { title: label, body: "10 + every bonus you'd add to that check, with no roll. The DM compares it to a hidden DC to decide what you notice without asking. Advantage adds 5 and disadvantage subtracts 5." };
  }],
  [".ac-tile", () => ruleTip("Armor Class", "How hard you are to hit. An attack hits when its roll equals or beats your AC. It comes from your armor (or 10 + DEX without armor), a shield, and any magic or class features.")],
  ["#rollInitiative", () => ruleTip("Initiative", "Decides turn order in combat: a Dexterity check rolled when the fight starts. Tap to roll it.")],
  ["#speedInput, .stat-tile:has(#speedInput)", () => ({ title: "Speed", body: "How many feet you can move on your turn. Difficult terrain costs double, and some conditions and exhaustion lower it." })],
  ["#conditionsTile", () => ({ title: "Conditions", body: "Effects like Poisoned or Prone that change what you can do. Tap to open the list and turn them on or off." })],
  ["#inspirationTile", inspirationTip],
  [".stat-tile:has(#profBonus)", () => ruleTip("Proficiency Bonus", "Added to attacks with weapons you're proficient with, spell attacks and save DCs, and checks and saves you're proficient in. It grows with your total character level: +2 at 1st, up to +6 at 17th.")],
  [".death-saves-block", () => ruleTip("Death Saving Throws", "At 0 hit points, roll a d20 at the start of each turn: 10 or higher is a success, lower is a failure. Three successes and you're stable; three failures and you die. A natural 20 brings you back with 1 HP; a natural 1 counts as two failures.")],
  [".hp-hitdice", () => ({ title: "Hit dice", body: "During a short rest you can spend hit dice to heal: roll each and add your CON modifier. A long rest gives back half your total hit dice (at least one)." })],
  [".hp-box", () => ruleTip("Hit Points", "How much damage you can take. Temporary hit points are lost first and don't stack. At 0 you fall unconscious and start making death saving throws.")],
  [".slot-tracker", el => ({ title: "Spell slots", body: "Casting a spell of 1st level or higher uses a slot of that level or higher; a higher slot can strengthen some spells. Slots come back on a long rest (Pact Magic slots on a short rest). Cantrips use no slot." })],
  [".equipment-row", el => {
    const item = (character.equipment || []).find(entry => entry.id === el.dataset.equipmentId);
    if (!item) return null;
    const properties = ["finesse", "heavy", "light", "loading", "reach", "thrown", "two-handed", "versatile", "ammunition"]
      .filter(property => new RegExp(`\\b${property}\\b`, "i").test(item.notes || ""))
      .map(property => tipRule(property.charAt(0).toUpperCase() + property.slice(1))?.body).filter(Boolean);
    return { title: item.name || "Item", body: [item.notes, ...properties].filter(Boolean).join(" ") || "No notes yet." };
  }],
  [".action-row", el => {
    const action = character.actions.find(item => item.id === el.dataset.actionId);
    if (!action) return null;
    const cost = { Action: "Uses your action.", "Bonus Action": "Uses your bonus action.", Reaction: "Uses your reaction (one per round, refreshed at the start of your turn).", Free: "Free: no action needed." }[action.type] || "";
    return { title: action.name || "Action", body: [cost, action.notes].filter(Boolean).join(" ") };
  }],
  ["#spellDc", () => ruleTip("Spell Save DC", "The number a target's saving throw must meet or beat to resist your spell: 8 + your proficiency bonus + your spellcasting ability modifier.")],
  ["#spellAttack", () => ruleTip("Spell Attack", "Added to the d20 when a spell calls for a spell attack: your proficiency bonus + your spellcasting ability modifier.")]
];

function resolveTip(target) {
  for (const [selector, resolve] of TIP_RESOLVERS) {
    let el;
    try {
      el = target.closest(selector);
    } catch {
      continue;
    }
    // Hover help is for the sheet; the AI, roll and settings dialogs explain themselves.
    if (!el || el.closest("#rollDialog, #aiDialog, #settingsDialog, #homebrewDialog")) continue;
    const tip = resolve(el);
    if (tip?.body) return { el, tip };
  }
  return null;
}

function tipBox() {
  let box = document.querySelector("#hoverTip");
  if (box) return box;
  box = document.createElement("div");
  box.id = "hoverTip";
  box.className = "hover-tip";
  box.setAttribute("role", "tooltip");
  box.setAttribute("popover", "manual");
  document.body.appendChild(box);
  return box;
}

function showTip(el, tip) {
  const box = tipBox();
  box.innerHTML = `
    <strong>${escapeHtml(tip.title)}${tip.edition ? ` <em class="edition-badge" data-edition="${escapeHtml(tip.edition)}">${escapeHtml(tip.edition)}</em>` : ""}</strong>
    ${tip.meta ? `<small>${escapeHtml(tip.meta)}</small>` : ""}
    <p>${escapeHtml(truncate(tip.body, 520))}</p>`;
  if (box.showPopover && !box.matches(":popover-open")) box.showPopover();
  box.hidden = false;
  const rect = el.getBoundingClientRect();
  const width = box.offsetWidth;
  const height = box.offsetHeight;
  const below = rect.bottom + 8 + height <= innerHeight;
  box.style.left = `${clamp(rect.left + rect.width / 2 - width / 2, 8, innerWidth - width - 8)}px`;
  box.style.top = `${below ? rect.bottom + 8 : Math.max(8, rect.top - height - 8)}px`;
  tipTarget = el;
  el.setAttribute("aria-describedby", "hoverTip");
  // The browser's own title tooltip would pop up on top of this one a moment later.
  if (el.title) {
    el.dataset.nativeTitle = el.title;
    el.removeAttribute("title");
  }
}

function hideTip() {
  clearTimeout(tipTimer);
  tipTimer = null;
  const box = document.querySelector("#hoverTip");
  if (box) {
    if (box.hidePopover && box.matches(":popover-open")) box.hidePopover();
    box.hidden = true;
  }
  if (tipTarget) {
    tipTarget.removeAttribute("aria-describedby");
    if (tipTarget.dataset.nativeTitle) {
      tipTarget.title = tipTarget.dataset.nativeTitle;
      delete tipTarget.dataset.nativeTitle;
    }
  }
  tipTarget = null;
}

function queueTip(target) {
  clearTimeout(tipTimer);
  const found = resolveTip(target);
  if (!found) {
    hideTip();
    return;
  }
  if (found.el === tipTarget) return;
  tipTimer = setTimeout(() => {
    tipTimer = null;
    showTip(found.el, found.tip);
  }, TIP_DELAY);
}

function bindHoverTips() {
  document.addEventListener("pointerover", event => {
    if (event.pointerType === "mouse") queueTip(event.target);
  });
  // After a scroll hides the box, resting the pointer again brings it back without leaving the item first.
  document.addEventListener("pointermove", event => {
    if (event.pointerType === "mouse" && !tipTarget && !tipTimer) queueTip(event.target);
  }, { passive: true });
  document.addEventListener("pointerout", event => {
    if (event.pointerType === "mouse" && tipTarget && !tipTarget.contains(event.relatedTarget)) hideTip();
    if (event.pointerType === "mouse" && !event.relatedTarget) hideTip();
  });
  // Touch: press and hold for half a second; the next touch anywhere closes it.
  let pressTimer = null;
  document.addEventListener("pointerdown", event => {
    if (event.pointerType !== "touch") return;
    if (tipTarget) hideTip();
    const found = resolveTip(event.target);
    if (found) pressTimer = setTimeout(() => showTip(found.el, found.tip), 500);
  });
  ["pointerup", "pointercancel", "pointermove"].forEach(type => document.addEventListener(type, event => {
    if (event.pointerType === "touch" && (type !== "pointermove" || Math.abs(event.movementX) + Math.abs(event.movementY) > 6)) clearTimeout(pressTimer);
  }));
  // Keyboard: focusing a button or tile explains it; typing into a field never does.
  document.addEventListener("focusin", event => {
    if (event.target.matches("input:not([type=checkbox]):not([type=radio]), textarea, select")) return;
    queueTip(event.target);
  });
  document.addEventListener("focusout", hideTip);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && tipTarget) hideTip();
  });
  document.addEventListener("scroll", hideTip, { passive: true, capture: true });
}
