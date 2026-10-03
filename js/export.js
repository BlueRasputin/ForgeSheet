// Plain-text sheet shared by the PDF export and the AI prompt.
const JSPDF_URL = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
const PDF_DATA_PREFIX = "forgesheet-json:";

function rulesEditionLine() {
  return classEntries().map(entry => `${getClasses()[entry.classId]?.name || entry.classId}: ${entry.rules} rules`).join("; ");
}

function characterSheetSections() {
  const cls = currentClass();
  const lines = list => list.filter(Boolean);
  const caster = characterSpellSlots().some(Boolean) || character.spells.some(spellRowHasSpell);
  const slots = characterSpellSlots().map((count, index) => count ? `${ordinal(index + 1)}: ${slotRemaining(index + 1, count)}/${count}` : "").filter(Boolean).join(", ");
  const spellLine = row => {
    const level = spellLevelForRow(row);
    const tag = spellAlwaysPrepared(row) ? " (always prepared)" : row.itemId ? " (from item)" : level > 0 && row.prepared ? " (prepared)" : "";
    return `${spellDisplayName(row)}${tag}`;
  };
  const spellsByLevel = [...new Set(character.spells.filter(spellRowHasSpell).map(spellLevelForRow))].sort((a, b) => a - b)
    .map(level => `${spellLevelLabel(level)}: ${character.spells.filter(row => spellRowHasSpell(row) && spellLevelForRow(row) === level).map(spellLine).join(", ")}`);
  return [
    ["Identity", lines([
      `Name: ${character.name || "Unnamed"}`,
      `Class: ${classLabel()} (total level ${totalLevel()})${character.subclassName ? `, ${character.subclass?.type || "subclass"}: ${character.subclassName}` : ""}`,
      ...(character.multiclasses || []).filter(entry => entry.subclassName).map(entry => `${getClasses()[entry.classId]?.name} subclass: ${entry.subclassName}`),
      `Rules: ${rulesEditionLine()}`,
      character.species && `Species: ${character.species}`,
      character.background && `Background: ${character.background}`,
      character.alignment && `Alignment: ${character.alignment}`
    ])],
    ["Combat", lines([
      `HP ${character.hp}/${effectiveMaxHp()}${Number(character.tempHp) ? ` (+${character.tempHp} temp)` : ""} · AC ${character.ac} · Speed ${effectiveSpeed()} ft · Initiative ${formatMod(initiativeBonus())} · Proficiency ${formatMod(proficiencyBonus())}`,
      `Hit dice: ${hitDiceText()} (${character.hitDiceUsed || 0} spent)`,
      character.conditions?.length && `Conditions: ${character.conditions.join(", ")}`,
      Number(character.exhaustion) && `Exhaustion: ${character.exhaustion}`,
      character.concentration && `Concentrating on: ${character.concentration}`
    ])],
    ["Ability scores", ABILITIES.map(([id, name]) => `${name} ${character.abilities[id]} (${formatMod(mod(id))}), save ${formatMod(saveBonus(id))}${character.saveProficiencies.includes(id) ? " proficient" : ""}`)],
    ["Skills", SKILLS.map(([id, name, ability]) => {
      const tag = (character.expertSkills || []).includes(id) ? " (expertise)" : character.proficientSkills.includes(id) ? " (proficient)" : "";
      return `${name} ${formatMod(skillBonus(id, ability))}${tag}`;
    })],
    ["Passives", [`Perception ${passiveScore("perception")}, Investigation ${passiveScore("investigation")}, Insight ${passiveScore("insight")}`]],
    ["Proficiencies and languages", lines([
      character.backgroundDetails.armor && `Armor: ${character.backgroundDetails.armor}`,
      character.backgroundDetails.weapons && `Weapons: ${character.backgroundDetails.weapons}`,
      character.backgroundDetails.tools && `Tools: ${character.backgroundDetails.tools}`,
      character.backgroundDetails.languages && `Languages: ${character.backgroundDetails.languages}`
    ])],
    ["Feats and ability score improvements", (character.planner?.feats || []).length ? [character.planner.feats.join(", ")] : ["None yet"]],
    ["Class resources", (character.resources || []).map(item => `${item.name}: ${item.current}/${item.max}${item.reset !== "manual" ? `, refills on a ${item.reset} rest` : ""}`)],
    ["Spellcasting", caster ? lines([
      cls.spellAbility !== "none" && `Ability ${String(cls.spellAbility).toUpperCase()}, save DC ${document.querySelector("#spellDc")?.textContent}, attack ${document.querySelector("#spellAttack")?.textContent}`,
      slots && `Slots: ${slots}`,
      cls.preparedFormula !== "none" && `${cls.preparedFormula === "known" ? "Spells known" : "Prepared spells"}: limit ${preparedLimitFor(cls)}`,
      ...spellsByLevel
    ]) : []],
    ["Actions", (character.actions || []).map(action => `${action.name} (${action.type})${action.attack ? `, ${action.attack}` : ""}${action.damage ? `, ${action.damage}` : ""}`)],
    ["Equipment", lines([
      ...(character.equipment || []).map(item => `${item.name}${Number(item.quantity) > 1 ? ` ×${item.quantity}` : ""}${item.equipped || item.container === "equipped" ? " (equipped)" : ""}${item.attuned ? " (attuned)" : ""}${item.notes ? `: ${item.notes}` : ""}`),
      character.inventory && `Other: ${character.inventory}`,
      `Coins: ${["pp", "gp", "ep", "sp", "cp"].map(coin => `${character.currency[coin] || 0} ${coin}`).join(", ")}`
    ])],
    ["Features and traits", String(character.features || "").split("\n").filter(Boolean)],
    ["Class options", (character.classOptions || []).filter(option => option.name).map(option => `${option.name} (${option.kind})${option.notes ? `: ${option.notes}` : ""}`)],
    ["Homebrew rules in use", Object.values(character.homebrewRules || {}).map(rule => rule.label)],
    ["Personality", lines([
      character.backgroundDetails.trait && `Trait: ${character.backgroundDetails.trait}`,
      character.backgroundDetails.ideal && `Ideal: ${character.backgroundDetails.ideal}`,
      character.backgroundDetails.bond && `Bond: ${character.backgroundDetails.bond}`,
      character.backgroundDetails.flaw && `Flaw: ${character.backgroundDetails.flaw}`
    ])],
    ["Notes", lines([character.notes, ...(character.noteSections || []).map(section => section.body && `${section.title}: ${section.body}`)])]
  ].filter(([, body]) => body.length);
}

function characterSheetText() {
  return characterSheetSections().map(([title, body]) => `## ${title}\n${body.map(line => `- ${line}`).join("\n")}`).join("\n\n");
}

// ---- AI prompt ----
function aiPromptText(question = "") {
  const editions = [...new Set(classEntries().map(entry => entry.rules))];
  const mixed = editions.length > 1;
  return `You are an expert Dungeons & Dragons 5th edition rules advisor and character-build coach. Help me plan this character.

Rules to follow:
- ${mixed ? `This character mixes editions on purpose: ${rulesEditionLine()}. Use the 2014 Player's Handbook for 2014 classes and the 2024 Player's Handbook for 2024 classes, and say which edition each rule comes from.` : `Use the ${editions[0]} Player's Handbook rules. Don't mix in rules from the other edition unless I ask, and point it out if a suggestion only works in the other edition.`}
- Respect the homebrew rules listed on the sheet; everything else is official rules.
- When I ask about leveling up, list what my next level gives (hit points, features, subclass choices, spells, ability score improvement or feat) and the reasonable choices, with a short pro and con for each. Include multiclass options with their ability score prerequisites.
- Name the book and page when you can, and say so when you're not sure of a rule rather than guessing.
- Keep answers practical for play at the table.

My character sheet (ForgeSheet export, ${new Date().toLocaleDateString()}):

${characterSheetText()}

${question ? `My question: ${question}` : "My question: What should I take at my next level, and what should I plan for the levels after that?"}`;
}

function openAiPrompt() {
  renderAiPrompt();
  document.querySelector("#aiPromptDialog").showModal();
}

function renderAiPrompt() {
  document.querySelector("#aiPromptText").value = aiPromptText(document.querySelector("#aiPromptQuestion").value.trim());
}

async function copyAiPrompt() {
  const area = document.querySelector("#aiPromptText");
  const button = document.querySelector("#copyAiPrompt");
  try {
    await navigator.clipboard.writeText(area.value);
    button.textContent = "Copied";
  } catch {
    // Clipboard blocked: select the text so Ctrl/Cmd+C works.
    area.focus();
    area.select();
    button.textContent = "Press Ctrl/Cmd+C";
  }
  setTimeout(() => { button.textContent = "Copy prompt"; }, 2500);
}

function downloadAiPrompt() {
  downloadFile(`${slug(character.name || "character")}-ai-prompt.txt`, document.querySelector("#aiPromptText").value, "text/plain");
}

// ---- PDF ----
let jsPdfLoading = null;

function loadJsPdf() {
  if (window.jspdf) return Promise.resolve(window.jspdf);
  jsPdfLoading ||= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = JSPDF_URL;
    script.onload = () => resolve(window.jspdf);
    script.onerror = () => {
      jsPdfLoading = null;
      reject(new Error("jsPDF failed to load"));
    };
    document.head.appendChild(script);
  });
  return jsPdfLoading;
}

// UTF-8 safe base64, so names with accents survive the round trip.
function toBase64(text) {
  let binary = "";
  new TextEncoder().encode(text).forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function fromBase64(text) {
  return new TextDecoder().decode(Uint8Array.from(atob(text), char => char.charCodeAt(0)));
}

// The full character JSON rides in the PDF's metadata, so importing this PDF restores it exactly.
async function exportCharacterPdf() {
  let jspdf;
  try {
    jspdf = await loadJsPdf();
  } catch {
    showToast(`<span class="toast-label">Couldn't build the PDF</span><span>The PDF library didn't load. Check your connection, or use Print → Save as PDF.</span>`, { tone: "fumble" });
    return;
  }
  const doc = new jspdf.jsPDF({ unit: "pt", format: "letter" });
  const margin = 48;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  const bottom = doc.internal.pageSize.getHeight() - margin;
  let y = margin;
  const ensure = height => {
    if (y + height > bottom) {
      doc.addPage();
      y = margin;
    }
  };
  // The standard PDF fonts are Latin-1 only; swap typographic characters they can't draw.
  const safe = text => String(text).replace(/[·•]/g, "-").replace(/×/g, "x").replace(/[“”]/g, "\"").replace(/[‘’]/g, "'").replace(/[^\x20-\xff\n]/g, "");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(safe(character.name || "Character"), margin, y + 14);
  y += 26;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(safe(`${classLabel()} - ${rulesEditionLine()} - ForgeSheet ${new Date().toLocaleDateString()}`), margin, y + 8);
  doc.setTextColor(20);
  y += 22;
  characterSheetSections().slice(1).forEach(([title, body]) => {
    ensure(34);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(safe(title), margin, y + 10);
    doc.setDrawColor(200);
    doc.line(margin, y + 14, margin + width, y + 14);
    y += 22;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    body.forEach(line => {
      doc.splitTextToSize(safe(line), width - 10).forEach((wrapped, index) => {
        ensure(13);
        doc.text(`${index ? "  " : "- "}${wrapped}`, margin + 4, y + 9);
        y += 12.5;
      });
    });
    y += 8;
  });
  doc.setProperties({
    title: `${character.name || "Character"} (ForgeSheet)`,
    subject: "ForgeSheet character sheet. Import this PDF in ForgeSheet to restore the full character.",
    creator: "ForgeSheet",
    keywords: PDF_DATA_PREFIX + toBase64(JSON.stringify({ character }))
  });
  doc.save(`${slug(character.name || "character")}.pdf`);
}

// Returns the character data embedded by exportCharacterPdf, or null for any other PDF.
async function embeddedForgeSheetData(pdf) {
  try {
    const { info } = await pdf.getMetadata();
    const keywords = String(info?.Keywords || "");
    return keywords.startsWith(PDF_DATA_PREFIX) ? JSON.parse(fromBase64(keywords.slice(PDF_DATA_PREFIX.length))) : null;
  } catch {
    return null;
  }
}
