#!/usr/bin/env node
// Loads the browser modules in a bare vm context and asserts spell data,
// slot math, and character creation stay consistent. Run: node tools/check_data.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const modules = ["utils.js", "data.js", "expansions.js", "srd-spells.js", "srd-beasts.js", "srd-2024.js", "rules-spells.js", "rules-classes.js", "rules-subclasses.js", "rules-feats.js", "classes.js", "character.js", "spells.js", "sheet.js", "builder.js", "play.js", "equipment.js", "party.js", "rules-reference.js", "rules.js", "sync.js", "dice.js"]
  .map(file => fs.readFileSync(path.join(__dirname, "..", "js", file), "utf8"))
  .join("\n");

const checks = `
const CLASS_IDS = new Set(["artificer", "bard", "cleric", "druid", "paladin", "ranger", "sorcerer", "warlock", "wizard"]);
const seen = new Set();
LOCAL_SPELLS.forEach(spell => {
  assert(!seen.has(spell.index), "duplicate spell index: " + spell.index);
  seen.add(spell.index);
  assert(/^[a-z0-9-]+$/.test(spell.index), "bad slug: " + spell.index);
  assert(spell.name && spell.casting_time && spell.range && spell.duration, "missing fields: " + spell.index);
  assert(Number.isInteger(spell.level) && spell.level >= 0 && spell.level <= 9, "bad level: " + spell.index);
  assert(spell.desc[0].length > 20, "missing summary: " + spell.index);
  // Encode Thoughts is only on the Dimir guild list (GGR); Tasha's-first spells reach classes through the optional lists.
  assert(spell.classes.length || spell.optionalClasses?.length || spell.index === "encode-thoughts", "no classes: " + spell.index);
  spell.classes.forEach(cls => assert(CLASS_IDS.has(cls.index), "unknown class " + cls.index + " on " + spell.index));
  assert.strictEqual(spell.concentration, spell.duration.startsWith("Concentration"),
    "concentration flag disagrees with duration: " + spell.index);
});

assert.deepStrictEqual(spellSlotsFor(BUILT_IN_CLASSES.wizard, 3), [4, 2]);
assert.deepStrictEqual(spellSlotsFor(BUILT_IN_CLASSES.warlock, 5), [0, 0, 2]);
assert.deepStrictEqual(spellSlotsFor(BUILT_IN_CLASSES.paladin, 1), []);
assert.deepStrictEqual(spellSlotsFor(BUILT_IN_CLASSES.artificer, 1), [2]);
assert.strictEqual(spellSlotsFor(BUILT_IN_CLASSES.wizard, 20).reduce((a, b) => a + b, 0), 22);
assert.deepStrictEqual(spellSlotsFor(BUILT_IN_CLASSES.fighter, 20), []);

character.spellSlotUsage = { 1: 1 };
assert.strictEqual(slotRemaining(1, 4), 3);
assert.strictEqual(slotRemaining(2, 0), 0);
assert.deepStrictEqual(castLevelOptions(2, [4, 3, 2]), [2, 3]);
assert.deepStrictEqual(castLevelOptions(1, [0, 0, 2]), [3], "warlock pact slots must force upcast");
assert.deepStrictEqual(castLevelOptions(4, [2]), [4], "no matching slots falls back to base level");

Object.keys(CLASS_SAVES).forEach(id => assert(BUILT_IN_CLASSES[id], "CLASS_SAVES has unknown class: " + id));
SPECIES_PRESETS.forEach(([name, speed]) => assert(name && speed >= 25 && speed <= 40, "bad species row: " + name));

persistAndRender = () => {};
showToast = () => ({});
const previousId = character.sheetId;
openCreateDialog();
assert(characterLibrary[previousId], "opening the wizard must archive the current sheet");
[["name", " Test Hero "], ["species", "High Elf"], ["classId", "wizard"], ["background", "Sage"]]
  .forEach(([key, value]) => { creationDraft[key] = value; });
creationDraft.abilities = { str: 8, dex: 14, con: 15, int: 15, wis: 12, cha: 10 };
[renderCreateIdentity, renderCreateClass, renderCreateBackground, renderCreateAbilities, renderCreateReview]
  .forEach(render => assert(render().length > 50, "empty wizard step"));
for (let i = 0; i < CREATE_STEP_LABELS.length; i += 1) createStepNext();
assert.strictEqual(creationDraft, null, "wizard must finish after the last step");
assert.strictEqual(character.name, "Test Hero");
assert.strictEqual(character.classId, "wizard");
assert.strictEqual(character.hp, 8, "wizard HP should be d6 max + CON mod");
assert.strictEqual(character.maxHp, 8);
assert.strictEqual(character.ac, 13, "DEX 14 + High Elf +2 = 16, AC 13");
assert.strictEqual(character.hitDice, "1d6");
assert.deepStrictEqual(character.saveProficiencies, ["int", "wis"]);
assert.strictEqual(character.background, "Sage");
assert(character.proficientSkills.includes("arcana") && character.proficientSkills.includes("history"));
assert(character.features.includes("Background Feature: Researcher"));
assert(character.features.includes("Species: High Elf"), character.features);
assert.deepStrictEqual(character.spells, [], "new sheet must start with no spells");
assert.deepStrictEqual(character.equipment, [], "new sheet must start with no equipment");
assert(character.sheetId !== previousId, "new sheet must get its own id");
assert(characterLibrary[previousId], "old sheet must survive creation");

// --- rest/death/items checks ---
renderAll = () => {};
queueSyncUpload = () => {};
queueCloudSave = () => {};
Object.assign(character, { hp: 0, maxHp: 20, exhaustion: 0, deathSaveSuccesses: 0, deathSaveFailures: 0, stable: false, conditions: [], rollHistory: [] });
[5, 5, 12, 12, 12].forEach(roll => applyDeathSave(roll));
assert(character.stable && character.deathSaveFailures === 0 && character.deathSaveSuccesses === 0, "three successes: stable, both counts reset");
dealDamage(3);
assert(!character.stable && character.deathSaveFailures === 1 && !isDead(), "damage to a stable creature is one failure, not death");
character.deathSaveFailures = 0;
applyDeathSave(9, 10);
assert.strictEqual(character.deathSaveSuccesses, 1, "death save total with a save bonus counts, not the natural die");
Object.assign(character, { hp: 40, maxHp: 44, exhaustion: 4, deathSaveSuccesses: 0, stable: false });
persist();
assert.strictEqual(character.hp, 22, "exhaustion 4 halves max HP and clamps current HP");
assert.strictEqual(partyState({ ...character, exhaustion: 6 }), "dead", "exhaustion 6 is dead on party views");
character.exhaustion = 0;

character.multiclasses = [{ id: "mc1", classId: "barbarian", level: 9, subclassName: "", officialIndex: "", rules: "2014" }];
assert.deepStrictEqual(hitDicePools(), { 6: 1, 12: 9 });
character.hitDiceUsed = 3;
delete character.hitDiceSpent;
assert.deepStrictEqual(hitDiceSpent(), { 6: 0, 12: 3 }, "older sheets read as largest dice spent first");
setHitDiceSpent({ 6: 1, 12: 2 });
regainHitDice(2);
assert.deepStrictEqual(hitDiceSpent(), { 6: 1, 12: 0 });
assert.strictEqual(character.hitDiceUsed, 1);
character.multiclasses = [];
character.abilities.con = 8;
assert.strictEqual(hitDieHealing(-1), 0, "no minimum of 1 on a hit die");
character.planner.feats = ["Durable"];
assert.strictEqual(hitDieHealing(-1), 2, "Durable minimum 2");
character.abilities.con = 16;
assert.strictEqual(hitDieHealing(3), 6, "Durable minimum 2 x CON mod");
character.planner.feats = [];

Object.assign(character, { species: "", currency: { cp: 0, sp: 0, ep: 0, gp: 500, pp: 0 }, speed: 30, conditions: [] });
character.abilities.str = 10;
character.equipment = [{ id: "pack", name: "Crate", quantity: 1, weight: 100, container: "carried" }];
assert.strictEqual(carryingCapacity(), 150);
assert.strictEqual(equipmentWeight(), 110, "500 coins weigh 10 lb");
assert.strictEqual(encumbranceLevel(), "ok", "variant encumbrance is off by default");
character.optionalRules = { ...character.optionalRules, variantEncumbrance: true };
assert.strictEqual(encumbranceLevel(), "heavy", "over STR x 10 is heavily encumbered");
assert.strictEqual(effectiveSpeed(), 10);
assert(disadvantageSources("check", "dex").includes("heavily encumbered"));
character.optionalRules.variantEncumbrance = false;
character.species = "Goliath";
assert.strictEqual(carryingCapacity(), 300, "Powerful Build doubles capacity");
character.equipment = [{ id: "g", name: "Gauntlets of Ogre Power", quantity: 1, weight: 1, equipped: true, attuned: true, notes: ITEM_CATALOG.find(item => item.index === "gauntlets-of-ogre-power").notes }];
assert.strictEqual(mod("str"), 4, "gauntlets set STR 19");
character.equipment[0].attuned = false;
assert.strictEqual(mod("str"), 0, "unattuned gauntlets do nothing");
character.species = "";
character.equipment = [];

Object.assign(character, { classId: "artificer", level: 10 });
assert.strictEqual(attunementLimit(), 4, "artificer 10 attunes to 4 items");
character.level = 18;
assert.strictEqual(attunementLimit(), 6);
Object.assign(character, { classId: "wizard", level: 1 });
assert.strictEqual(attunementLimit(), 3);
assert(attunementRequirementProblem({ name: "Amulet", notes: "Requires attunement by a cleric or paladin. (TCE)" }), "a wizard can't attune a cleric item");
assert.strictEqual(attunementRequirementProblem({ name: "Grimoire", notes: "Requires attunement by a wizard. (TCE)" }), "");
assert.strictEqual(equipmentFromItemCard(ITEM_CATALOG.find(item => item.index === "cloak-of-protection")).attuned, false, "new items arrive unattuned");

assert.strictEqual(normalizeCharacter({ inspiration: 5, optionalRules: { stackingInspiration: false } }).inspiration, 1, "RAW: inspiration is on or off");
assert.strictEqual(normalizeCharacter({ inspiration: 5 }).inspiration, 5, "house rule (default): inspiration is a counter");
const passive = passivePerception(character);
character.conditions = ["Poisoned"];
assert.strictEqual(passivePerception(character), passive - 5, "disadvantage lowers passive Perception by 5");
character.conditions = [];
assert.strictEqual(potionHealing("Potion of Healing (Greater)"), "4d4+4");
const wand = { grantUsed: 7, notes: ITEM_CATALOG.find(item => item.index === "wand-of-magic-missiles").notes };
rechargeItem(wand);
assert(wand.grantUsed >= 0 && wand.grantUsed <= 5, "wand regains 1d6 + 1 charges, not all 7");

// --- features checks ---
${[["equipment.js", "function renderEquipment("], ["sheet.js", "function renderWildShape("], ["play.js", "function classFeatureTrackers("]]
  .filter(([, marker]) => !modules.includes(marker)).map(([file]) => fs.readFileSync(path.join(__dirname, "..", "js", file), "utf8")).join("\n")}
{
  renderAll = () => {};
  persist = () => {};
  const sheet = (classId, level, fields = {}) => {
    character = normalizeCharacter({ classId, level, subclassName: "", subclass: { mode: "official", officialIndex: "", type: "", sections: [] }, multiclasses: [], resources: [], actions: [], ...fields });
    ensureClassResources();
    return character;
  };
  const tracker = name => character.resources.find(item => item.name === name);
  const action = key => featureActions().find(item => item.source.feature === key);
  // Every subclass tracker is [name, number, short|long|manual].
  Object.entries(SUBCLASS_EXTRAS).forEach(([slugName, extra]) => (extra.trackers?.(20, 6) || []).forEach(row => {
    assert(row[0] && Number.isFinite(row[1]) && ["short", "long", "manual"].includes(row[2]), "bad tracker in " + slugName + ": " + JSON.stringify(row));
  }));
  // Overrides must point at real actionable subclass features.
  Object.keys(FEATURE_ACTION_OVERRIDES).forEach(key => {
    const [sub, name] = key.split(/:(.+)/);
    const row = SUBCLASS_FEATURES[sub]?.features.find(item => item[1] === name);
    assert(row && (FEATURE_TYPES[row[3]?.action] || row[3]?.cost), "override matches nothing: " + key);
  });
  // Archdruid: Wild Shape is free at 20; a secondary-class druid still gets the action.
  sheet("druid", 20, { subclass: { mode: "official", officialIndex: "moon", type: "", sections: [] } });
  assert.strictEqual(action("wild-shape").use.cost, null);
  assert.strictEqual(tracker("Wild Shape"), undefined);
  assert.strictEqual(action("moon-elemental-wild-shape").use.cost, null, "Archdruid: elemental form is free too");
  sheet("druid", 10, { subclass: { mode: "official", officialIndex: "moon", type: "", sections: [] } });
  assert.deepStrictEqual(action("moon-elemental-wild-shape").use.cost, ["Wild Shape", 2], "Elemental Wild Shape spends two uses");
  sheet("fighter", 5, { multiclasses: [{ id: "m1", classId: "druid", level: 2, subclassName: "" }] });
  assert.deepStrictEqual(action("wild-shape").use.cost, ["Wild Shape", 1]);
  // Divine Intervention: d100 at or under cleric level; automatic at 20, then locked for 7 days (manual reset).
  assert(divineInterventionSucceeds(100, 20) && divineInterventionSucceeds(10, 10) && !divineInterventionSucceeds(11, 10));
  sheet("cleric", 20);
  CLASS_FEATURE_USES.divine(action("divine-intervention"));
  assert.strictEqual(tracker("Divine Intervention").current, 0);
  assert.strictEqual(tracker("Divine Intervention").reset, "manual", "a success locks it until 7 days pass");
  takeRest("long", { food: true });
  assert.strictEqual(tracker("Divine Intervention").current, 0, "a long rest doesn't bring back a successful intervention");
  // Arcane Ward: 2 x wizard level + INT; it soaks damage before HP.
  sheet("wizard", 2, { abilities: { str: 10, dex: 10, con: 10, int: 16, wis: 10, cha: 10 }, subclass: { mode: "official", officialIndex: "abjuration", type: "", sections: [] }, hp: 10, maxHp: 10 });
  assert.strictEqual(arcaneWardMax(), 7);
  character.arcaneWard = { hp: 7, max: 7 };
  dealDamage(9);
  assert.strictEqual(character.arcaneWard.hp, 0);
  assert.strictEqual(character.hp, 8);
  // Sorcerous Restoration: +4 sorcery points on a short rest at 20.
  sheet("sorcerer", 20);
  tracker("Sorcery Points").current = 0;
  takeRest("short");
  assert.strictEqual(tracker("Sorcery Points").current, 4);
  // Wild Shape duration: a long rest ends a 1-hour form but not a druid 18's 9 hours.
  sheet("druid", 18);
  character.wildShape = { name: "Bear", hp: 30, max: 34, hoursLeft: 9, ac: 11, str: 19 };
  assert.strictEqual(calculatedArmorClass(), 11);
  assert.strictEqual(mod("str"), 4);
  character.hp = 10;
  takeRest("long", { food: true });
  assert.strictEqual(character.wildShape?.hoursLeft, 1);
  takeRest("short");
  assert.strictEqual(character.wildShape, null);
  // Soul of the Forge: +1 AC in heavy armor from Forge 6.
  sheet("cleric", 6, { subclass: { mode: "official", officialIndex: "forge", type: "", sections: [] }, equipment: [{ id: "a", name: "Plate", equipped: true, notes: "AC 18" }] });
  assert.strictEqual(calculatedArmorClass(), 19);
  // Trackers: Brand of Castigation, Spell-Storing Item, infused items (not a rest pool), Divine Sense can be 0.
  sheet("bloodhunter", 6);
  assert(tracker("Brand of Castigation"));
  sheet("artificer", 11, { abilities: { str: 10, dex: 10, con: 10, int: 18, wis: 10, cha: 10 } });
  assert.strictEqual(tracker("Spell-Storing Item").max, 8);
  assert.strictEqual(tracker("Infused Items").reset, "manual");
  assert.strictEqual(sheet("artificer", 1).resources.length, 0, "level-1 artificers have no infusions");
  sheet("paladin", 2, { abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 8 } });
  assert.strictEqual(tracker("Divine Sense").max, 0, "CHA 8: no Divine Sense uses");
  // Features panel: per-class level filtering (Fighter 5 / Barbarian 2).
  sheet("fighter", 5, { multiclasses: [{ id: "m1", classId: "barbarian", level: 2, subclassName: "" }] });
  const [fighterRows, barbarianRows] = classFeatureRows();
  const names = group => group.reached.map(row => row.name);
  assert(names(barbarianRows).includes("Rage") && names(barbarianRows).includes("Reckless Attack"));
  assert(!names(barbarianRows).includes("Fast Movement") && barbarianRows.next.level === 3);
  assert(names(fighterRows).includes("Extra Attack"));
  // Tasha's optional rows only with the rule on.
  sheet("cleric", 2);
  assert(names(classFeatureRows()[0]).includes("Harness Divine Power"));
  character.optionalRules = { ...OPTIONAL_RULE_DEFAULTS, tashas: false };
  assert(!names(classFeatureRows()[0]).includes("Harness Divine Power"));
}
// --- spellcasting checks ---
{
  persist = () => {};
  const sheet = (classId, level, abilities = {}, extra = {}) => {
    character = { ...defaultCharacter(), subclassName: "", subclass: { mode: "custom", officialIndex: "", type: "", sections: [] }, classId, level,
      abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10, ...abilities }, spells: [], resources: [], multiclasses: [], ...extra };
    return character;
  };
  const effect = (index, castLevel, row = {}) => spellEffectRoll({ id: index, index, ...row }, castLevel);
  const mc = (classId, level, more = {}) => ({ id: "mc-" + classId, classId, level, subclassName: "", ...more });

  // Multiclass spellcasting: each class keeps its own ability, DC and prepared limit (PHB p.164).
  sheet("wizard", 3, { int: 18, wis: 8 }, { multiclasses: [mc("cleric", 5)] });
  character.spells = [{ id: "s1", index: "fireball", prepared: true }, { id: "s2", index: "guiding-bolt", prepared: true }];
  ensureSpellOwners();
  assert.deepStrictEqual(character.spells.map(row => row.classKey), ["primary", "mc-cleric"], "rows default to the class whose list has the spell");
  const [wizLine, clericLine] = casterEntries().map(spellClassLine);
  assert.deepStrictEqual([wizLine.dc, wizLine.attack, wizLine.limit, wizLine.used], [15, 7, 7, 1], "wizard 3: INT DC 15, +7, 7 prepared");
  assert.deepStrictEqual([clericLine.dc, clericLine.attack, clericLine.limit, clericLine.used], [10, 2, 4, 1], "cleric 5 (WIS 8): DC 10, +2, 4 prepared");
  assert.strictEqual(spellStatsFor(character.spells[1]).dc, 10, "a cleric spell uses the cleric's DC");
  assert(!spellChoices("", 1, { classKey: "primary" }).some(item => item.index === "cure-wounds"), "wizard rows list wizard spells only");

  // Multiclass slots skip classes without Spellcasting yet: Paladin 5 / Ranger 1 uses the paladin table.
  sheet("paladin", 5, {}, { multiclasses: [mc("ranger", 1)] });
  assert.deepStrictEqual(characterSpellSlots(), [4, 2]);
  sheet("wizard", 1, {}, { multiclasses: [mc("sorcerer", 4)] });
  assert.deepStrictEqual(characterSpellSlots(), [4, 3, 2], "wizard 1 + sorcerer 4 = caster level 5");

  // Pact Magic beside Spellcasting is its own pool; Profane Soul adds a third of blood hunter levels.
  sheet("warlock", 5, { cha: 16 }, { multiclasses: [mc("sorcerer", 1)] });
  assert.deepStrictEqual(pactSlotPool(), { level: 3, max: 2, left: 2 });
  assert.deepStrictEqual(castOptions(1).map(option => option.pool + option.level), ["slots1", "pact3"]);
  assert.deepStrictEqual(spellSlotsFor({ casterType: "pactThird" }, 5), [1], "Profane Soul: one slot until 6th");
  sheet("bloodhunter", 9, {}, { subclassName: "Profane Soul", subclass: { mode: "official", officialIndex: "profane-soul", sections: [] }, multiclasses: [mc("warlock", 2)] });
  assert.deepStrictEqual(characterSpellSlots(), [0, 0, 2], "warlock 2 + blood hunter 9 / 3 = warlock 5 pact slots");
  sheet("artificer", 5, { int: 14 });
  assert.strictEqual(preparedLimitFor(currentClass(), 5), 4, "artificer prepares INT + half level rounded down");
  assert.strictEqual(knownSpellCap({ preparedFormula: "known", table: makeTable({ 1: ["", 2, 0], 3: ["", 1, 0] }) }, 3), 3, "custom known class sums new spells");

  // Rolls: structured SRD data first, overrides for the bad rows, text fallback for local spells.
  sheet("sorcerer", 11, { cha: 16 });
  assert.strictEqual(effect("chain-lightning", 6).formula, "10d8");
  assert.strictEqual(effect("chain-lightning", 8).label, "Roll damage (up to 6 targets)");
  assert.strictEqual(effect("chill-touch", 0).kind, "damage", "can't regain HP is not healing");
  assert.strictEqual(effect("chill-touch", 0).formula, "3d8");
  assert.strictEqual(effect("sleep", 1).kind, "pool");
  assert.strictEqual(effect("moonbeam", 4).formula, "4d10");
  assert.strictEqual(effect("flame-strike", 6).formula, "5d6+4d6", "Flame Strike upcasts one damage type");
  assert.strictEqual(effect("magic-missile", 2).formula, "4d4+4");
  assert.strictEqual(effect("catapult", 3).formula, "5d8", "summary upcast note is read");
  assert.strictEqual(effect("faithful-hound", 4).formula, "4d8", "no modifier on Faithful Hound's bite");
  assert.strictEqual(effect("toll-the-dead", 0).formula, "3d8", "local damage cantrips scale with character level");
  assert.strictEqual(effect("eldritch-blast", 0).attack.times, 3);
  assert.strictEqual(effect("time-stop", 9), null);
  assert.deepStrictEqual([effect("heal", 7).kind, effect("heal", 7).formula], ["healing", "80"]);
  assert.strictEqual(effect("aid", 3).kind, "maxhp");
  assert.strictEqual(effect("regenerate", 7).kind, "healing");
  sheet("cleric", 5, { wis: 16 });
  assert.strictEqual(effect("cure-wounds", 3).formula, "3d8+3", "Cure Wounds upcast to 3rd");
  sheet("cleric", 5, { wis: 16 }, { subclassName: "Life", subclass: { mode: "official", officialIndex: "life", sections: [] } });
  assert.strictEqual(effect("cure-wounds", 3).formula, "3d8+8", "Disciple of Life adds 2 + slot level");
  assert.strictEqual(effect("healing-word", 1).selfHeal, 0, "Blessed Healer starts at 6th");
  sheet("cleric", 17, { wis: 16 }, { subclassName: "Life", subclass: { mode: "official", officialIndex: "life", sections: [] } });
  assert.strictEqual(effect("cure-wounds", 1).formula, "14", "Supreme Healing maximizes the dice: 8 + 3 WIS + 3 Disciple");
  sheet("cleric", 8, { wis: 16 }, { subclassName: "Light", subclass: { mode: "official", officialIndex: "light", sections: [] } });
  assert.strictEqual(effect("sacred-flame", 0).formula, "2d8+3", "Potent Spellcasting adds WIS to cleric cantrips");
  assert.strictEqual(maximizeDice("2d6+3"), "15");
  assert.strictEqual(addFlat("1d4+3", 3), "1d4+6");

  // Species spells use the species' ability; subclass lists, Tasha's lists and genie kinds feed the class list.
  sheet("fighter", 3, { int: 16 }, { species: "High Elf" });
  assert.strictEqual(spellAbilityFor({ index: "fire-bolt", source: { kind: "species", ability: "" } }), "int");
  assert.strictEqual(speciesSpellAbility("Tiefling"), "cha");
  sheet("sorcerer", 3, {}, { subclassName: "Divine Soul", subclass: { mode: "official", officialIndex: "divine-soul", sections: [] }, classChoices: { divineSoulAffinity: "Good" } });
  assert(spellMatchesClass(allSpells.find(item => item.index === "spirit-guardians"), currentClass()), "Divine Soul learns cleric spells");
  assert(subclassGrantsFor(classEntries()[0]).includes("cure-wounds"), "Divine Soul affinity spell is granted");
  sheet("warlock", 5, {}, { subclassName: "Genie", subclass: { mode: "official", officialIndex: "genie", sections: [] }, classChoices: { genieKind: "efreeti" } });
  assert(spellMatchesClass(allSpells.find(item => item.index === "fireball"), currentClass()), "efreeti genie list");
  sheet("druid", 5, {}, { subclassName: "Land", subclass: { mode: "official", officialIndex: "land", sections: [] }, classChoices: { landTerrain: "arctic" } });
  assert(subclassGrantsFor(classEntries()[0]).includes("sleet-storm"), "Land circle spells follow the terrain");
  assert.strictEqual(entryCantripCap(classEntries()[0]), 4, "Land druid 5: 3 cantrips + 1 bonus");
  const tashaSpell = allSpells.find(item => (item.optionalClasses || []).length && !item.classes.includes(item.optionalClasses[0]));
  if (tashaSpell) {
    sheet(tashaSpell.optionalClasses[0], 20);
    assert(spellMatchesClass(tashaSpell, currentClass()), "Tasha's optional list is on by default");
    character.optionalRules = { ...OPTIONAL_RULE_DEFAULTS, tashas: false };
    assert(!spellMatchesClass(tashaSpell, currentClass()), "and off when the rule is off");
  }

  // Level-up picks: Mystic Arcanum is its own pick; known casters cap at 5th; EK school limit.
  sheet("warlock", 10);
  levelPlan = { target: "primary", subclass: "", choices: [] };
  assert(spellChoicesForLevelChoice("leveled", currentClass(), 11).every(item => item.level <= 5));
  assert(spellChoicesForLevelChoice("arcanum", currentClass(), 11).every(item => item.level === 6));
  sheet("fighter", 3, {}, { subclassName: "Eldritch Knight", subclass: { mode: "official", officialIndex: "eldritch-knight", sections: [] } });
  character.spells = [{ id: "e1", index: "charm-person", classKey: "primary" }];
  assert(spellChoicesForLevelChoice("leveled", currentClass(), 4).every(item => ["abjuration", "evocation"].includes(spellDetails[item.index]?.school?.index)), "EK picks off-school only at 3/8/14/20");
  levelPlan = null;

  // Casting: a multiclass pact slot pays for a spell and Twinned costs the slot's level.
  sheet("warlock", 5, { cha: 16 }, { multiclasses: [mc("sorcerer", 3)], spellSlotUsage: {} });
  ensureClassResources();
  character.spells = [{ id: "hx", index: "hex", classKey: "primary", castPool: "pact" }];
  assert.strictEqual(metamagicCost("Twinned", 3), 3);
  castSpellRow(character.spells[0], { metamagic: [] });
  assert.strictEqual(character.pactSlotUsage, 1, "pact slot spent");
  assert(arcanumFor({ index: "circle-of-death", classKey: "primary" }) === null, "no arcanum below warlock 11");
  sheet("fighter", 2, {}, { multiclasses: [mc("warlock", 11)] });
  ensureClassResources();
  assert(arcanumFor({ index: "circle-of-death", classKey: "mc-warlock" }), "Mystic Arcanum works for a secondary warlock");
  assert.strictEqual(spellDurationMinutes("Hex", 3), 480, "Hex at 3rd lasts 8 hours");
  assert.strictEqual(spellConcentrationLabel({ index: "bestow-curse" }, 5), "", "Bestow Curse at 5th needs no concentration");
  sheet("wizard", 5, {}, { equipment: [{ id: "p", name: "Plate", notes: "AC 18. Requires Strength 15.", equipped: true }], backgroundDetails: { armor: "" } });
  assert(untrainedArmorItem(), "plate without proficiency blocks casting");
  sheet("warlock", 5, {}, { equipment: [{ id: "r", name: "Rod of the Pact Keeper +2", notes: "+2 bonus to warlock spell attack rolls and spell save DCs. Requires attunement by a warlock.", equipped: true, attuned: true }] });
  assert.deepStrictEqual([itemSpellBonus("attack", "warlock"), itemSpellBonus("dc", "warlock"), itemSpellBonus("dc", "wizard")], [2, 2, 0]);
  sheet("druid", 18, {}, { wildShape: { name: "Bear", hp: 10, max: 30 } });
  character.spells = [{ id: "d", index: "cure-wounds", classKey: "primary" }, { id: "g", index: "goodberry", classKey: "primary" }];
  assert.strictEqual(beastFormCastingBlock(character.spells[0], spellDetails["cure-wounds"]), "", "Beast Spells at 18");
  assert(beastFormCastingBlock(character.spells[1], spellDetails.goodberry), "no material components in beast form");
  sheet("bard", 10, {}, { subclassName: "Lore", subclass: { mode: "official", officialIndex: "lore", sections: [] } });
  character.spells = [{ id: "b1", index: "fireball", classKey: "primary", secret: true }, { id: "b2", index: "counterspell", classKey: "primary", secret: "lore" }];
  assert.strictEqual(knownSpellCount("primary"), 1, "Additional Magical Secrets don't count as known");
  assert(spellChoices("", 3, { classKey: "primary", secret: true }).some(item => item.index === "counterspell" || item.index === "fly"), "Magical Secrets list every class");
}
// --- combat checks ---
{
  if (typeof prefs === "undefined") globalThis.prefs = {};
  prefs.diceMode = "digital";
  persist = () => {};
  globalThis.matchMedia = () => ({ matches: true });
  let toast = null;
  showToast = (html, options = {}) => { toast = { html, actions: options.actions || [] }; return {}; };
  const gear = (index, extra = {}) => {
    const card = ITEM_CATALOG.find(item => item.index === index);
    return { id: index + (extra.suffix || ""), name: card.name, notes: [card.type, card.rarity, card.notes].join(" - "), quantity: 1, equipped: true, container: "equipped", ...extra };
  };
  const hero = (over = {}) => {
    character = normalizeCharacter({ name: "T", classId: "fighter", level: 1, subclassName: "", subclass: { mode: "custom", officialIndex: "", sections: [] }, resources: [], classOptions: [], equipment: [], actions: [], conditions: [], spells: [], backgroundDetails: {}, abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }, ...over });
    ensureClassResources();
    return character;
  };
  const multi = (classId, level, officialIndex = "") => ({ id: classId + level, classId, level, subclassName: "", officialIndex });
  const rows = () => featureActions().map(action => action.source.feature);

  // Dice engine: GWF and other suffixes validate, damage floors at 0, Reliable Talent and Elven Accuracy.
  assert.strictEqual(formulaProblem("2d6r2+3"), "", "GWF formula must roll");
  assert(formulaProblem("1d6r6"), "a reroll as large as the die must be rejected");
  assert.strictEqual(formulaProblem("4d6kh3+d%"), "");
  assert.strictEqual(evaluateRoll("4d6kh3").dice.filter(die => !die.dropped).length, 3);
  assert.strictEqual(evaluateRoll("10d2m2").total, 20, "m2 makes every 1 a 2");
  assert.strictEqual(evaluateRoll("1d20+1", "normal", { 0: [3] }, { minD20: 10 }).total, 11, "Reliable Talent");
  assert.strictEqual(evaluateRoll("1d20", "advantage", { 0: [3, 5, 19] }, { elven: true }).total, 19, "Elven Accuracy keeps the best of three");
  hero();
  openRoll({ label: "dmg", formula: "1d4-9" });
  assert.strictEqual(rollRequest.result.total, 0, "damage can't go negative");

  // T1: martial features from a secondary class.
  hero({ classId: "fighter", level: 5, abilities: { str: 10, dex: 14, con: 16, int: 10, wis: 10, cha: 10 }, multiclasses: [multi("barbarian", 2)] });
  assert.strictEqual(calculatedArmorClass(), 15, "Barbarian Unarmored Defense as a second class");
  assert.strictEqual(advantageSource("save", "dex", ""), "Danger Sense");
  assert(rows().includes("rage") && rows().includes("reckless"));
  hero({ classId: "rogue", level: 3, multiclasses: [multi("fighter", 5)] });
  assert.strictEqual(extraAttacks(), 2);
  assert(rows().includes("second-wind") && rows().includes("action-surge"));
  hero({ classId: "fighter", level: 5, multiclasses: [multi("rogue", 3)] });
  assert(damageRiders({ weapon: true, finesse: true }).some(rider => rider.name.startsWith("Sneak Attack") && rider.formula === "2d6"));
  hero({ classId: "sorcerer", level: 5, multiclasses: [multi("paladin", 2)] });
  assert.strictEqual(smiteActions(false, { weapon: true, melee: true }).length, characterSpellSlots().filter(Boolean).length, "a smite for every open slot level");

  // Damage: rage resistance on the dropping hit, Uncanny Dodge stacks with resistance, typed resistance, queued concentration.
  hero({ classId: "barbarian", level: 11, hp: 15, maxHp: 100, raging: true });
  dealDamage(20);
  assert.strictEqual(character.hp, 0);
  assert(toast.actions.some(action => action.label === "Relentless Rage (CON save DC 10)"));
  halveLastDamage("Rage");
  assert.strictEqual(character.hp, 5, "resistance applies to the hit that would drop you");
  assert(character.raging, "halving the hit keeps the rage");
  hero({ classId: "rogue", level: 5, hp: 30, maxHp: 30, multiclasses: [multi("barbarian", 1)], raging: true });
  dealDamage(21);
  halveLastDamage("Uncanny Dodge");
  halveLastDamage("Rage");
  assert.strictEqual(character.hp, 25, "21 -> 10 (Uncanny Dodge) -> 5 (resistance)");
  hero({ species: "Tiefling", hp: 20, maxHp: 20, concentration: "Bless" });
  dealDamage(10, { type: "fire" });
  assert.strictEqual(character.hp, 15, "typed fire damage is halved for a tiefling");
  pendingConcentrationDcs = [];
  dealDamage(30, { mods: {} });
  hero({ hp: 50, maxHp: 50, concentration: "Bless" });
  pendingConcentrationDcs = [];
  dealDamage(30);
  dealDamage(8);
  assert.deepStrictEqual(pendingConcentrationDcs, [15, 10], "each hit queues its own concentration save");

  // Conditions: immunities drop disadvantage; armor penalties; STR requirement on speed.
  hero({ classId: "paladin", level: 10, hp: 10, conditions: ["Frightened"] });
  assert(!disadvantageSources("attack").includes("Frightened"), "Aura of Courage");
  hero({ classId: "fighter", level: 1, abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }, equipment: [gear("plate")] });
  assert.strictEqual(effectiveSpeed(), 20, "plate without STR 15");
  assert(disadvantageSources("check", "dex", "stealth").some(source => /Stealth/.test(source)));
  character.species = "Hill Dwarf";
  assert.strictEqual(effectiveSpeed(), 30, "dwarves ignore the STR requirement");
  hero({ classId: "wizard", level: 1, equipment: [gear("plate"), gear("greatsword")] });
  assert(disadvantageSources("attack", "str").some(source => /untrained/.test(source)), "untrained armor");
  assert.strictEqual(weaponActions(character.equipment[1])[0].attack, "+0", "no proficiency bonus with an unfamiliar weapon");

  // Weapons: thrown rows are ranged attacks, off-hand rows, GWF folds always-on riders with the reroll, monk armor gate.
  hero({ classId: "barbarian", level: 3, raging: true, abilities: { str: 16, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }, equipment: [gear("handaxe")] });
  const axe = weaponActions(character.equipment[0]);
  const thrown = axe.find(action => action.source.grip === "thrown");
  assert(thrown && !actionTraits(thrown).melee, "a thrown handaxe is a ranged attack");
  assert(!damageRiders({ ...actionTraits(thrown), weapon: true }).some(rider => rider.name === "Rage"), "no Rage damage on a throw");
  assert(!weaponTraits("light crossbow weapon - simple ranged weapon - 1d8 piercing, ammunition").light);
  hero({ classId: "rogue", level: 1, abilities: { str: 10, dex: 16, con: 10, int: 10, wis: 10, cha: 10 }, equipment: [gear("shortsword"), gear("shortsword", { suffix: "-2" })] });
  const offHand = weaponActions(character.equipment[1]).find(action => action.source.grip === "off-hand");
  assert(offHand && offHand.type === "Bonus Action" && offHand.damage.startsWith("1d6+0"), "off-hand attacks drop the ability modifier");
  hero({ classId: "paladin", level: 11, classChoices: { fightingStyles: ["Great Weapon Fighting"] }, abilities: { str: 16, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }, equipment: [gear("greatsword")] });
  const sword = weaponActions(character.equipment[0])[0];
  assert(sword.damage.startsWith("2d6r2+3"));
  damageFollowUps("Greatsword", actionDamageFormula(sword), 10, actionTraits(sword))[0].run();
  assert(rollRequest.formula.includes("+1d8r2"), "Improved Divine Smite is part of every hit and keeps the GWF reroll: " + rollRequest.formula);
  hero({ classId: "monk", level: 5, equipment: [gear("shortsword"), gear("shield")] });
  assert(!/Martial Arts/.test(weaponActions(character.equipment[0])[0].notes), "no Martial Arts with a shield");

  // Initiative, advantage sources, Primal Champion, superiority dice from feats, saves and riders.
  hero({ classId: "rogue", level: 3, subclass: { mode: "official", officialIndex: "swashbuckler", sections: [] }, abilities: { str: 10, dex: 14, con: 10, int: 10, wis: 10, cha: 16 } });
  assert.strictEqual(initiativeBonus(), 5, "Rakish Audacity adds CHA");
  hero({ classId: "barbarian", level: 7 });
  assert.strictEqual(advantageSource("check", "dex", "initiative"), "Feral Instinct");
  turnState().reckless = true;
  assert.strictEqual(rollModeFor("attack", "str", "str-melee").mode, "advantage", "Reckless Attack");
  hero({ classId: "barbarian", level: 20, maxHp: 100, hp: 100, abilities: { str: 20, dex: 10, con: 18, int: 10, wis: 10, cha: 10 } });
  applyPrimalChampion();
  assert.deepStrictEqual([character.abilities.str, character.abilities.con, character.maxHp], [24, 22, 140]);
  hero({ classId: "wizard", level: 4, planner: { feats: ["Martial Adept"], multiclass: [] } });
  assert(character.resources.some(item => item.name === "Superiority Dice" && item.max === 1) && resourceDie("Superiority Dice") === 6);
  hero({ classId: "paladin", level: 6, hp: 10, abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 16 } });
  assert.strictEqual(auraOfProtection(), 3);
  character.conditions = ["Unconscious"];
  assert.strictEqual(auraOfProtection(), 0, "the aura needs the paladin conscious");
  hero({ classId: "bloodhunter", level: 10, abilities: { str: 10, dex: 10, con: 10, int: 14, wis: 10, cha: 10 } });
  assert.strictEqual(saveBonus("str") - saveBonus("cha"), 2, "Dark Augmentation");
  hero({ classId: "cleric", level: 8, subclass: { mode: "official", officialIndex: "life", sections: [] }, optionalRules: { tashas: false } });
  assert(damageRiders({ weapon: true }).some(rider => rider.name === "Divine Strike (radiant)"));
  hero({ classId: "fighter", level: 1, abilities: { str: 14, dex: 10, con: 10, int: 10, wis: 10, cha: 10 } });
  assert.strictEqual(featureActions().find(action => action.source.feature === "unarmed-strike").damage, "3 bludgeoning", "unarmed strike is 1 + STR");
  hero({ classId: "warlock", level: 1, subclass: { mode: "official", officialIndex: "hexblade", sections: [] }, abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 16 }, equipment: [gear("shortsword"), gear("scimitar")] });
  assert.deepStrictEqual(character.equipment.map(item => weaponActions(item)[0].source.ability), ["cha", "str"], "Hex Warrior covers one chosen weapon");

  hero({ classId: "barbarian", level: 3, subclass: { mode: "official", officialIndex: "totem-warrior", sections: [] }, classChoices: { totems: { 3: "Bear" } }, raging: true });
  assert(resistanceSources("fire").includes("Rage (Bear)") && !resistanceSources("psychic").length, "Bear totem resists all but psychic");
  hero({ classId: "ranger", level: 10, classChoices: { favoredFoe: false, deftExplorer: true } });
  assert(!rows().includes("favored-foe") && rows().includes("tireless"), "Tasha's ranger features follow the sheet's picks");

  // Roll follow-ups: Halfling Lucky rerolls a natural 1 in place.
  hero({ species: "Lightfoot Halfling" });
  openRoll({ label: "Check", formula: "1d20+2", kind: "check", ability: "str" });
  rollRequest.result = evaluateRoll("1d20+2", "normal", { 0: [1] });
  rollRequest.view = { label: "Check", mode: "normal" };
  const lucky = d20FollowUps(rollRequest, rollRequest.result).find(action => /Halfling Lucky/.test(action.label));
  assert(lucky, "a halfling's natural 1 offers the reroll");
  lucky.run();
  assert.strictEqual(rollRequest.result.total, naturalD20(rollRequest.result) + 2);
}
// --- build checks ---
persist = () => {};
celebrate = () => {};
isRuleBroken = () => false;
const sheet = fields => normalizeCharacter({ name: "Probe", species: "", background: "", ...fields });
// Medium Armor Master: a fighter's "All armor" counts as medium armor proficiency.
character = sheet({ classId: "fighter", level: 4, backgroundDetails: { armor: "All armor, shields", weapons: "Simple weapons, martial weapons" } });
assert.strictEqual(featBlocked("Medium Armor Master"), "", "fighter can take Medium Armor Master");
assert.strictEqual(featBlocked("Heavy Armor Master"), "");
// Armor feat chain works because each feat writes its proficiency.
character = sheet({ classId: "wizard", level: 8, abilities: { str: 12, dex: 14, con: 14, int: 16, wis: 10, cha: 8 }, backgroundDetails: { armor: "", weapons: "Daggers" } });
assert(featBlocked("Moderately Armored").startsWith("needs"));
takeFeat({ name: "Lightly Armored", ability: "str" }, { kind: "planner" });
assert.strictEqual(featBlocked("Moderately Armored"), "");
takeFeat({ name: "Moderately Armored", ability: "dex" }, { kind: "planner" });
assert.strictEqual(featBlocked("Heavily Armored"), "");
takeFeat({ name: "Heavily Armored" }, { kind: "planner" });
assert.strictEqual(featBlocked("Heavy Armor Master"), "");
assert.strictEqual(character.abilities.str, 14, "Lightly +1 STR, Heavily +1 STR");
dropFeat("Heavily Armored");
assert(!/heavy/i.test(character.backgroundDetails.armor) && character.abilities.str === 13, "removing a feat undoes it");
// Spellcasting prerequisites look at every class entry and species spells; paladin 1 has no Spellcasting yet.
character = sheet({ classId: "fighter", level: 5, multiclasses: [{ id: "w", classId: "wizard", level: 1 }] });
assert.strictEqual(featBlocked("War Caster"), "");
character = sheet({ classId: "paladin", level: 1 });
assert(featBlocked("War Caster").startsWith("needs") && featBlocked("Metamagic Adept").startsWith("needs"));
character = sheet({ classId: "fighter", level: 1, species: "Tiefling", spells: [{ id: "t", index: "thaumaturgy", racial: true }] });
assert.strictEqual(featBlocked("War Caster"), "", "a racial cantrip counts as casting a spell");
assert(featBlocked("Metamagic Adept").startsWith("needs"), "but not as the Spellcasting feature");
// Species, level and feat-on-feat prerequisites.
assert(featBlocked("Drow High Magic", sheet({ species: "Half-Elf (Drow)" })).startsWith("needs"));
assert.strictEqual(featBlocked("Elven Accuracy", sheet({ species: "Drow" })), "");
assert(featBlocked("Fade Away", sheet({ species: "Autognome" })).startsWith("needs"));
assert(featBlocked("Orcish Fury", sheet({ species: "Orc" })).startsWith("needs"));
assert.strictEqual(featBlocked("Squat Nimbleness", sheet({ species: "Fairy" })), "");
assert(featBlocked("Ember of the Fire Giant", sheet({ level: 4, planner: { feats: ["Strike of the Giants (Frost)"] } })).startsWith("needs"));
assert.strictEqual(featBlocked("Ember of the Fire Giant", sheet({ level: 4, planner: { feats: ["Strike of the Giants (Fire)"] } })), "");
assert(featBlocked("Ember of the Fire Giant", sheet({ level: 3, planner: { feats: ["Strike of the Giants (Fire)"] } })).startsWith("needs"));
assert.strictEqual(featBlocked("Elemental Adept", sheet({ classId: "wizard", planner: { feats: ["Elemental Adept (Fire)"] } }), "Cold"), "", "Elemental Adept repeats with a new type");
assert.strictEqual(featBlocked("Elemental Adept", sheet({ classId: "wizard", planner: { feats: ["Elemental Adept (Fire)"] } }), "Fire"), "already taken");
assert.deepStrictEqual(featRule("Revenant Blade").ability, ["str", "dex"], "half-feat abilities come from FEAT_DETAILS");
assert(!FEAT_PRESETS.includes("Giant Foundling") && FEAT_PRESETS.includes("Righteous Heritor"));
// Variant Human: the species feat is not an ASI; a level-4 Variant Human still owes one.
openCreateDialog();
Object.assign(creationDraft, { name: "Vee", species: "Variant Human", classId: "fighter", background: "Soldier", level: 4 });
creationDraft.abilities = { str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 };
creationDraft.speciesFeat = { name: "Alert" };
[renderCreateIdentity, renderCreateClass, renderCreateBackground, renderCreateAbilities, renderCreateEquipment, renderCreateSpells, renderCreateReview]
  .forEach(render => assert(render().length > 50, "empty wizard step"));
for (let i = 0; i < CREATE_STEP_LABELS.length; i += 1) createStepNext();
assert(hasFeat("Alert") && character.planner.feats.length === 0 && character.bonusFeats[0].name === "Alert");
assert.strictEqual(levelChecklist().find(item => item.label === "ASIs and feats").done, false, "species feat is not an ASI");
assert(levelChecklist().some(item => item.label === "Class choices" && !item.done), "fighter owes a fighting style");
// Old sheets that stored the species feat in planner.feats are migrated.
const migrated = sheet({ species: "Variant Human", features: "Feat (Variant Human): Alert", planner: { feats: ["Alert", "Tough"] } });
assert.deepStrictEqual([migrated.planner.feats, migrated.bonusFeats.map(item => item.name)], [["Tough"], ["Alert"]]);
// Level-up: raising CON or taking Tough counts the new level too (fighter 3 -> 4, CON 15 -> 16: +8 average +4).
character = sheet({ classId: "fighter", level: 3, abilities: { str: 16, dex: 12, con: 15, int: 8, wis: 10, cha: 10 }, maxHp: 28, hp: 28 });
levelPlan = { target: "primary", subclass: "", choices: [], classChoices: structuredCloneSafe(character.classChoices), swap: {} };
commitLevelUp(levelTarget(), { hp: 8, asiMode: "asi", asiPicks: ["con", "str"] });
assert.strictEqual(character.maxHp, 40, "CON increase at level 4 adds +12, not +11");
character.level = 5;
levelPlan = { target: "primary", subclass: "", choices: [], classChoices: structuredCloneSafe(character.classChoices), swap: {} };
commitLevelUp(levelTarget(), { hp: 9, asiMode: "feat", featState: { name: "Tough" } });
assert.strictEqual(character.maxHp, 40 + 9 + 12, "Tough at level 6 adds 2 x 6");
// Custom feat: +2 initiative, +1 HP per level, a tracker; prerequisite text is shown, never enforced.
customFeats["custom-quick-wits"] = sanitizeCustomFeat({ id: "custom-quick-wits", name: "Quick Wits", prereq: { text: "INT 20" }, modifiers: { initiative: 2, ac: { bonus: 1, when: "unarmored" } }, hp: { perLevel: 1 }, resources: [{ name: "Quick Thought", max: "prof", reset: "short" }] });
character = sheet({ classId: "rogue", level: 4, abilities: { str: 8, dex: 16, con: 12, int: 10, wis: 10, cha: 10 }, maxHp: 27, hp: 27 });
const initBefore = initiativeBonus();
const acBefore = calculatedArmorClass();
assert.strictEqual(featBlocked("Quick Wits"), "");
assert(allFeatNames().includes("Quick Wits"));
takeFeat({ name: "Quick Wits" }, { kind: "planner", hp: true });
assert.strictEqual(initiativeBonus(), initBefore + 2);
assert.strictEqual(calculatedArmorClass(), acBefore + 1);
assert.strictEqual(character.maxHp, 31, "+1 HP for each of 4 levels");
assert.strictEqual(sheetExtraHp(), 1);
assert(grantTrackers(2).some(([name, max, reset]) => name === "Quick Thought" && max === 2 && reset === "short"));
assert.strictEqual(embeddedCustomContent(character).feats["custom-quick-wits"].name, "Quick Wits", "custom feats travel with the sheet");
assert.strictEqual(sanitizeCustomFeat({ name: "x", modifiers: { initiative: 999 }, hp: { perLevel: 40 } }).modifiers.initiative, 10, "shared feats are clamped");
// Invocations: Thirsting Blade needs warlock 5 and Pact of the Blade.
const thirsting = CLASS_OPTIONS.invocations.find(item => item.name === "Thirsting Blade");
const ctx = (warlock, pact) => ({ warlock, pact, knows: () => false, hexblade: false, invocations: [] });
assert.strictEqual(invocationBlocked(thirsting, ctx(4, "blade")), "needs warlock 5");
assert.strictEqual(invocationBlocked(thirsting, ctx(5, "chain")), "needs Pact of the Blade");
assert.strictEqual(invocationBlocked(thirsting, ctx(5, "blade")), "");
character = sheet({ classId: "warlock", level: 5, classChoices: { pactBoon: "chain" } });
const invocationSlots = classChoiceSlots().filter(slot => slot.key === "invocations");
assert.strictEqual(invocationSlots.length, 3, "warlock 5 knows 3 invocations");
assert.strictEqual(invocationSlots[0].options.find(item => item.value === "Thirsting Blade").why, "needs Pact of the Blade");
assert(classChoiceSlots().some(slot => slot.key === "pactBoon"));
character = sheet({ classId: "sorcerer", level: 10 });
assert.strictEqual(classChoiceSlots().filter(slot => slot.key === "metamagic").length, 3);
character = sheet({ classId: "fighter", level: 10, subclassName: "Champion", subclass: { officialIndex: "champion" }, fightingStyle: "Defense" });
assert.deepStrictEqual(classChoiceSlots().filter(slot => slot.key === "fightingStyles").map(slot => slot.index), [0, 1], "Champion 10 gets a second style");
assert.strictEqual(character.classChoices.fightingStyles[0], "Defense", "fightingStyle mirrors the first style");
// Martial Adept adds a die to a Battle Master's pool, or starts its own.
character = sheet({ classId: "fighter", level: 7, subclassName: "Battle Master", subclass: { officialIndex: "battle-master" }, planner: { feats: ["Martial Adept"] } });
assert(allClassTrackers().some(({ name, max }) => name === "Superiority Dice" && max === 6));
character = sheet({ classId: "rogue", level: 4, planner: { feats: ["Martial Adept", "Metamagic Adept"] } });
assert(allClassTrackers().some(({ name, max }) => name === "Superiority Dice" && max === 1));
assert(grantTrackers(2).some(([name, max]) => name === "Sorcery Points (Metamagic Adept)" && max === 2));
// Subclass training for any class entry, without duplicates ("Medium armor, shields").
character = sheet({ classId: "sorcerer", level: 3, backgroundDetails: { armor: "", weapons: "Daggers" }, multiclasses: [{ id: "hx", classId: "warlock", level: 1, subclassName: "Hexblade", officialIndex: "hexblade" }] });
applySubclassExtras({ ...character.multiclasses[0], key: "hx" });
applySubclassExtras({ ...character.multiclasses[0], key: "hx" });
assert.strictEqual(character.backgroundDetails.armor, "Medium armor, shields");
assert(/martial weapons/i.test(character.backgroundDetails.weapons));
// Draconic Resilience HP only for levels in the draconic sorcerer entry (J4).
character = sheet({ classId: "sorcerer", level: 1, subclassName: "Draconic", subclass: { officialIndex: "draconic" } });
assert.strictEqual(sheetExtraHp(), 1);
assert.strictEqual(sheetExtraHp("warlock", ""), 0);
// Custom classes never replace a built-in; a synced custom class opens as itself (J26, J27).
customClasses.warlock = { id: "warlock", name: "Evil Warlock", hitDie: 12, casterType: "none", table: makeTable({}) };
assert.strictEqual(getClasses().warlock.name, "Warlock");
delete customClasses.warlock;
assert.strictEqual(uniqueCustomId("Warlock", { ...BUILT_IN_CLASSES }), "custom-warlock");
character = sheet({ classId: "custom-witch", customContent: { classes: { "custom-witch": { id: "custom-witch", name: "Witch", hitDie: 6, casterType: "none", preparedFormula: "known", table: makeTable({ 1: ["Hexes", 3, 0], 2: ["", 1, 0] }) } } } });
assert.strictEqual(currentClass().name, "Witch");
assert.strictEqual(knownSpellCap(currentClass(), 2), 4, "custom known class counts its new-spell column");
character = sheet({ classId: "custom-gone" });
assert(/not on this device/.test(currentClass().name));
// Species: breath weapon, innate spells, bonus choices.
character = sheet({ classId: "fighter", level: 6, species: "Dragonborn", draconicAncestry: "Red", abilities: { str: 16, dex: 10, con: 14, int: 8, wis: 10, cha: 12 } });
assert.strictEqual(breathWeapon().damage, "3d6 fire");
assert(/DEX save DC 13/.test(breathWeapon().notes));
assert(grantTrackers(3).some(([name, max, reset]) => name === "Breath Weapon" && max === 1 && reset === "short"));
assert.deepStrictEqual(grantResistances(), ["fire"]);
character = sheet({ classId: "fighter", level: 5, species: "Tiefling" });
ensureGrantedSpells();
const rebuke = character.spells.find(row => row.index === "hellish-rebuke");
assert(rebuke && rebuke.source.ability === "cha" && rebuke.castAt === 2 && rebuke.free === "1/long");
assert(character.spells.some(row => row.index === "darkness"));
assert.deepStrictEqual(speciesBonusPlan({ species: "Changeling", abilities: {} }).steps, [1], "Changeling gets +1 to another ability");
assert.deepStrictEqual(speciesBonusPlan({ species: "Owlin", altBonuses: true }).steps, [1, 1, 1]);
assert.deepStrictEqual(speciesBonusPlan({ species: "Mountain Dwarf", customOrigin: true }).steps, [2, 2]);
assert.deepStrictEqual(speciesBonusPlan({ species: "Kobold", customOrigin: true }).fixed, { str: -2 });
assert(draftAbilityProblems({ species: "Human", abilities: { str: 20, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }, speciesAbilities: [], improvements: [] }).length === 2);
// Background and species choice text.
assert.deepStrictEqual(parseSkillToken("Arcana/Nature/Religion (pick one)").options, ["arcana", "nature", "religion"]);
assert.strictEqual(parseSkillToken("Two of Deception/Insight/Persuasion/Stealth").count, 2);
assert.strictEqual(parseGrantToken("Two languages").count, 2);
assert.deepStrictEqual(parseGrantToken("One type of gaming set").options, TOOL_GROUPS.gaming);
assert(parseGrantToken("Two of gaming set/musical instrument/thieves' tools").options.includes("Thieves' tools"));
assert.strictEqual(parseGrantToken("Vehicles (land)").fixed, "Vehicles (land)");
assert.deepStrictEqual(parseGrantToken("Elvish or Vedalken").options, ["Elvish", "Vedalken"]);
// Racial feats sources and starting tables.
assert(Object.keys(CLASS_STARTING_EQUIPMENT).every(id => BUILT_IN_CLASSES[id]));
Object.values(CLASS_STARTING_EQUIPMENT).flat(3).filter(token => !/^(pick|text):/.test(token)).forEach(token => {
  assert(ITEM_CATALOG.some(item => item.name === token.replace(/ x\\d+$/, "")), "starting item missing from catalog: " + token);
});
Object.values(SPECIES_MAGIC).flatMap(magic => magic.spells).forEach(([index]) => assert(LOCAL_SPELLS.some(spell => spell.index === index), "species spell missing: " + index));
Object.values(BACKGROUND_FEATS).forEach(name => assert(FEAT_PRESETS.includes(featBaseName(name)), "background feat missing: " + name));
assert.strictEqual(mergeList("Light armor, Medium armor, shields", ["Medium armor, shields"]), "Light armor, Medium armor, shields");
// --- end build checks ---
// --- merge round 2 checks ---
{
  // Overlap 1: one class-choice picker (build's slots) also carries the combat weapon picks; styles apply to weapon rows.
  character = sheet({ classId: "fighter", level: 1, equipment: [{ id: "bow", name: "Longbow", notes: "1d8 piercing, ammunition 150/600, heavy, two-handed. Martial ranged weapon.", equipped: true }] });
  assert.strictEqual(typeof sheetChoiceSlots, "undefined", "the combat-tab picker is gone");
  const styleSlot = classChoiceSlots().find(slot => slot.key === "fightingStyles");
  setClassChoice(character.classChoices, { dataset: { ccKey: "fightingStyles", ccIndex: String(styleSlot.index) }, value: "Archery" });
  assert(hasStyle("Archery") && /Archery \\+2/.test(weaponActions(character.equipment[0])[0].notes), "Archery from the picker reaches the longbow row");
  character = sheet({ classId: "warlock", level: 3, subclassName: "The Hexblade", subclass: { officialIndex: "hexblade" }, classChoices: { pactBoon: "blade" }, equipment: [{ id: "lsw", name: "Longsword", notes: "1d8 slashing, versatile 1d10. Martial melee weapon.", equipped: true }] });
  assert.deepStrictEqual(combatChoiceSlots().map(slot => slot.key), ["hexWarriorWeapon", "pactWeapon"]);
  character = sheet({ classId: "bloodhunter", level: 7, classChoices: { bloodHunterRites: ["Rite of the Flame"], bloodMaledicts: ["Blood Curse of Exposure"] } });
  assert.deepStrictEqual(character.classChoices.bloodHunterRites, ["Rite of the Flame"], "normalizeClassChoices keeps the rites other code reads");
  assert.strictEqual(classChoiceSlots().filter(slot => slot.key === "bloodHunterRites").length, 2);
  // Overlap 4: a reaction used through a CLASS_FEATURE_USES handler spends the round's reaction, only when paid for.
  ensureClassResources();
  const curse = featureActions().find(action => action.name === "Blood Curse of Exposure");
  assert(curse && curse.type === "Reaction" && curse.use.kind === "maledict");
  turnState().reaction = false;
  character.resources.find(item => item.name === "Blood Maledict").current = 0;
  useFeatureAction(curse);
  assert.strictEqual(turnState().reaction, false, "an unpaid reaction stays unspent");
  character.resources.find(item => item.name === "Blood Maledict").current = 1;
  useFeatureAction(curse);
  assert.strictEqual(turnState().reaction, true, "a maledict reaction marks the reaction used");
  // Overlap 2: feat and species rows share one format; outside class caps, own ability, free casts by row.free.
  character = sheet({ classId: "fighter", level: 1, spells: [], abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 16, cha: 10 } });
  takeFeat({ name: "Magic Initiate", variant: "Cleric", spells0: ["guidance", "sacred-flame"], spells1: ["bless"] }, { kind: "species", raiseAbility: false });
  const bless = character.spells.find(row => row.index === "bless");
  assert.deepStrictEqual([bless.source.kind, spellAbilityFor(bless), bless.free], ["feat", "wis", "1/long"]);
  assert.strictEqual(knownSpellCount("primary") + entryCantripCount(classEntries()[0]), 0, "feat spells aren't class spells");
  ensureSpellTrackers();
  assert(freeCastFor(bless)?.resource?.reset === "long", "Magic Initiate: one free cast per long rest");
  const legacy = normalizeCharacter({ species: "High Elf", spells: [{ id: "c", index: "fire-bolt", level: 0, racial: true }] }).spells[0];
  assert.deepStrictEqual([legacy.racial, legacy.source.kind], [undefined, "species"], "racial rows migrate to species rows");
  character = sheet({ classId: "fighter", level: 1, species: "Yuan-ti Pureblood" });
  ensureGrantedSpells();
  assert(freeCastFor(character.spells.find(row => row.index === "animal-friendship"))?.atWill, "free: will casts at will");
}
// --- end merge round 2 checks ---

// --- roll window modifier text ---
assert.strictEqual(rollModifierText({ formula: "1d8+2", breakdown: "CON" }), "+2 (CON)");
assert.strictEqual(rollModifierText({ formula: "1d20+0", ability: "dex" }), "");
assert.strictEqual(rollModifierText({ formula: "1d20" + formatMod(mod("wis") + proficiencyBonus()), ability: "wis" }),
  formatMod(mod("wis") + proficiencyBonus()) + " (WIS " + formatMod(mod("wis")) + ", proficiency " + formatMod(proficiencyBonus()) + ")");

// --- house rules: overheal into temp HP, inspiration counter ---
{
  const sheet = { hp: 18, maxHp: 20, tempHp: 2, optionalRules: { ...OPTIONAL_RULE_DEFAULTS } };
  const healed = applyHealing(sheet, 5);
  assert.strictEqual(sheet.hp, 20);
  assert.strictEqual(healed.temp, 3, "3 points past max become temp HP");
  assert.strictEqual(sheet.tempHp, 5, "overflow adds to existing temp HP");
  const raw = { hp: 18, maxHp: 20, tempHp: 0, optionalRules: { ...OPTIONAL_RULE_DEFAULTS, overhealTempHp: false } };
  applyHealing(raw, 5);
  assert.strictEqual(raw.tempHp, 0, "RAW: healing past max is lost");
  const saved = character;
  character = normalizeCharacter({ inspiration: 0 });
  gainInspiration();
  gainInspiration();
  assert.strictEqual(character.inspiration, 2);
  spendInspiration();
  assert.strictEqual(character.inspiration, 1);
  character = saved;
}

// --- custom content checks ---
{
  const saved = character;
  // Custom half pact caster: warlock row for half its level (rounded up), and the Mystic Arcanum levels it sets.
  const hexer = {
    id: "custom-hexer", name: "Hexer", hitDie: 8, casterType: "pactHalf", spellAbility: "cha", preparedFormula: "known", spellSources: [],
    table: makeTable({}), arcanumLevels: { 11: 6 }, resources: [parseResourceLine("Hex Points | level/2 | short | d6")],
    multiclass: { requires: [["cha"]], grants: { armor: "Light armor" } }, spellList: ["fireball"], skillChoices: { count: 3, from: ["arcana"] },
    subclasses: parseSubclassText("Subclass: Ember Pact\\n3: Ember Ward: Reaction, reduce fire damage.\\nSpells 3: shield\\nResource: Ember Ward | prof | long\\nArmor: Medium armor")
      .map(sub => ({ ...sub, id: "custom-hexer-ember-pact" }))
  };
  assert.deepStrictEqual(spellSlotsFor(hexer, 5), [0, 2], "half pact caster 5 = warlock 3: two 2nd-level slots");
  assert.deepStrictEqual(spellSlotsFor(hexer, 1), [], "half pact casters have no slots at 1st level");
  assert.strictEqual(maxSpellLevelFor(hexer, 11), 6, "configured arcanum at 11 reaches 6th-level spells");
  assert.strictEqual(maxSpellLevelFor(hexer, 10), 3);
  const trackers11 = classFeatureTrackers(hexer, 11, "", false);
  assert(trackers11.some(item => item.name === "Mystic Arcanum (6th)" && item.max === 1 && item.reset === "long"), "custom pact arcanum tracker");
  const hex = classFeatureTrackers(hexer, 7, "", false).find(item => item.name === "Hex Points");
  assert.deepStrictEqual(hex, { name: "Hex Points", max: 3, reset: "short", die: 6 }, "level/2 short-rest resource with a d6");
  assert(spellMatchesClass({ index: "fireball", level: 3, classes: ["wizard"] }, hexer), "custom class spell list is unioned in");
  // Custom subclass: its spell becomes an always-prepared row, its feature shows and spends its resource, its armor applies.
  customClasses[hexer.id] = hexer;
  character = normalizeCharacter({ classId: hexer.id, level: 3, abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 16 }, subclass: { mode: "official", officialIndex: "custom-hexer-ember-pact" } });
  getClasses();
  assert.deepStrictEqual(multiclassRequirementsFor(hexer.id), [["cha"]]);
  assert.strictEqual(multiclassProficienciesFor(hexer.id).armor, "Light armor");
  assert.strictEqual(subclassUnlockLevel(hexer.id), 3);
  assert.strictEqual(classSkillPicks(hexer), 3);
  assert.deepStrictEqual(CLASS_SKILL_CHOICES[hexer.id], ["arcana"]);
  applyOfficialSubclass("custom-hexer-ember-pact", false);
  assert(/medium armor/i.test(character.backgroundDetails.armor), "custom subclass armor applies");
  ensureSubclassSpells();
  assert(character.spells.some(row => row.index === "shield" && row.auto), "custom subclass grants its spell");
  assert(classFeatureRows()[0].reached.some(row => row.name === "Ember Ward"), "custom subclass feature in the Features panel");
  const rows = [];
  subclassFeatureActions({ level: 3, subclass: "custom-hexer-ember-pact", add: (key, row) => rows.push(row), prof: 2 });
  assert(rows.some(row => row.name === "Ember Ward" && row.use.cost[0] === "Ember Ward"), "custom subclass feature row spends its resource");
  delete customClasses[hexer.id];

  // Custom spell: explicit ritual, concentration, save and damage fields drive casting and upcasting.
  customSpells["custom-ember-bolt"] = sanitizeCustomSpell({ id: "custom-ember-bolt", name: "Ember Bolt", level: 1, classes: ["wizard"], ritual: true, concentration: true,
    castingTime: "1 action", duration: "1 minute", save: "dex", desc: "Fire leaps at a creature; no concentration needed here.", damage: { dice: "2d6", type: "fire", perSlot: "1d6" } });
  registerCustomSpells();
  character = normalizeCharacter({ classId: "wizard", level: 5, abilities: { str: 10, dex: 10, con: 10, int: 16, wis: 10, cha: 10 } });
  const row = { id: "ember", index: "custom-ember-bolt", level: 1, prepared: true, classKey: "primary" };
  character.spells = [row];
  assert(ritualCastable(row), "custom ritual spell is ritual-castable by a wizard");
  assert.strictEqual(spellConcentrationLabel(row), "Ember Bolt");
  assert.strictEqual(spellSaveFor(row), "Dexterity");
  assert.strictEqual(spellEffectRoll(row, 1).formula, "2d6");
  assert.strictEqual(spellEffectRoll(row, 3).formula, "4d6", "+1d6 per slot level above 1st");
  assert.deepStrictEqual(spellEffectRoll(row, 1).types, ["fire"]);
  assert(spellMatchesClass(allSpells.find(item => item.index === "custom-ember-bolt"), currentClass()), "library spell is offered to its class");
  customSpells["custom-ember-spark"] = sanitizeCustomSpell({ id: "custom-ember-spark", name: "Ember Spark", level: 0, classes: ["wizard"], attack: "ranged", damage: { dice: "1d10", type: "fire" } });
  customSpells["custom-ember-mend"] = sanitizeCustomSpell({ id: "custom-ember-mend", name: "Ember Mend", level: 1, classes: ["wizard"], healing: { dice: "1d8 + mod", perSlot: "1d8" } });
  registerCustomSpells();
  assert.strictEqual(spellEffectRoll({ index: "custom-ember-spark", classKey: "primary" }, 0).formula, "2d10", "custom damage cantrip grows at 5th level");
  assert(spellEffectRoll({ index: "custom-ember-spark", classKey: "primary" }, 0).attack, "explicit spell attack");
  const mend = spellEffectRoll({ index: "custom-ember-mend", classKey: "primary" }, 2);
  assert(mend.kind === "healing" && mend.formula === "2d8+3", "custom healing upcasts and adds the modifier: " + mend.formula);
  delete customSpells["custom-ember-spark"];
  delete customSpells["custom-ember-mend"];
  character.spellSlotUsage = {};
  castSpellRow(row, { slot: true }, 3);
  assert.strictEqual(Number(character.spellSlotUsage[3] || 0), 1, "upcast spends a 3rd-level slot");
  assert.strictEqual(character.concentration, "Ember Bolt");
  assert(embeddedCustomContent(character).spells["custom-ember-bolt"], "custom spell embedded in the sheet");

  // An old per-row custom spell moves into the library without losing anything; the same sheet twice makes one entry.
  const legacy = { spells: [{ id: "old", level: 2, prepared: true, custom: { name: "Old Fog", level: 2, castingTime: "1 action", range: "60 feet", duration: "Concentration, up to 1 hour", components: "V, S", desc: "A fog fills a sphere." } }] };
  const migrated = normalizeCharacter(JSON.parse(JSON.stringify(legacy)));
  const moved = migrated.spells[0];
  assert(!moved.custom && /^custom-/.test(moved.index) && moved.prepared && moved.level === 2, "row points at the library spell");
  const kept = customSpells[moved.index];
  assert(kept.name === "Old Fog" && kept.range === "60 feet" && kept.desc === "A fog fills a sphere." && kept.concentration && kept.components === "V, S");
  assert(migrated.customContent.spells[moved.index], "migrated spell embedded in the sheet");
  assert.strictEqual(normalizeCharacter(JSON.parse(JSON.stringify(legacy))).spells[0].index, moved.index, "same old spell, same library entry");
  delete customSpells[moved.index];
  delete customSpells["custom-ember-bolt"];
  registerCustomSpells();

  // Class builder: a blank skill count saves as 2, not 0.
  const query = document.querySelector;
  const fields = { builderSkillCount: "", builderSkillFrom: "Arcana, History", builderResources: "Hex Points | level/2 | short | d6" };
  document.querySelector = selector => ({ value: fields[selector.slice(1)] || "" });
  const extras = readBuilderExtras();
  assert.strictEqual(extras.skillChoices.count, 2, "blank skill count defaults to 2");
  assert.deepStrictEqual(extras.skillChoices.from, ["arcana", "history"]);
  assert.strictEqual(extras.subclassLevel, 3);
  fields.builderSkillCount = "0";
  assert.strictEqual(readBuilderExtras().skillChoices.count, 0, "an explicit 0 stays 0");
  document.querySelector = query;
  character = saved;
}

// --- r3matt checks ---
{
  const saved = character;
  const savedLibrary = characterLibrary;
  let toast = null;
  showToast = (html, options = {}) => { toast = { html, actions: options.actions || [] }; return {}; };
  prefs.diceMode = "digital";
  const hero = (over = {}) => {
    character = normalizeCharacter({ name: "T", classId: "fighter", level: 1, subclassName: "", subclass: { mode: "custom", officialIndex: "", sections: [] }, resources: [], classOptions: [], equipment: [], actions: [], conditions: [], spells: [], backgroundDetails: {}, abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 16, cha: 10 }, ...over });
    ensureClassResources();
    return character;
  };
  const sub = slug => ({ subclassName: slug, subclass: { mode: "official", officialIndex: slug, sections: [] } });
  const gear = index => {
    const card = ITEM_CATALOG.find(item => item.index === index);
    return { id: index, name: card.name, notes: [card.type, card.rarity, card.notes].join(" - "), quantity: 1, equipped: true, attuned: true, container: "equipped" };
  };
  const label = (list, pattern) => list.find(action => pattern.test(action.label));
  // M19/N3: the Arcane Grimoire's extra slot level reaches the Arcane Recovery picker.
  hero({ classId: "wizard", level: 4, abilities: { str: 10, dex: 10, con: 10, int: 16, wis: 10, cha: 10 }, equipment: [gear("arcane-grimoire")], spellSlotUsage: { 1: 2, 2: 1 } });
  useArcaneRecovery();
  assert(/up to 3 more levels/.test(toast.html), "Arcane Grimoire: budget 3 at wizard 4");
  // R12/N5: Blessed Strikes replaces Potent Spellcasting and rides on cantrips; N7: Blood Divine Strike, Moon Domain cantrips.
  const flame = () => spellEffectRoll({ index: "sacred-flame", level: 0, classKey: "primary" }, 0).formula;
  hero({ classId: "cleric", level: 8, ...sub("light") });
  assert.strictEqual(flame(), "2d8+3", "Potent Spellcasting");
  hero({ classId: "cleric", level: 8, ...sub("light"), combatChoices: { blessedStrikes: "Blessed Strikes" } });
  assert.strictEqual(flame(), "2d8", "Blessed Strikes replaces Potent Spellcasting");
  assert.deepStrictEqual(damageRiders({ cantrip: true }).map(rider => rider.name), ["Blessed Strikes (radiant)"]);
  assert.strictEqual(cantripRiderFollowUps("Sacred Flame").length, 1);
  cantripRiderFollowUps("Sacred Flame")[0].run();
  assert.strictEqual(cantripRiderFollowUps("Sacred Flame").length, 0, "Blessed Strikes once per turn");
  hero({ classId: "cleric", level: 8, ...sub("blood") });
  assert.deepStrictEqual(damageRiders({ weapon: true, melee: true }).map(rider => rider.name), ["Divine Strike (necrotic)"]);
  hero({ classId: "cleric", level: 8, ...sub("moon-domain") });
  assert.strictEqual(flame(), "2d8+3", "Moon Domain Empowered Cantrips");
  // N6: Blessed Healer pays out once per casting, however many allies the roll heals.
  hero({ classId: "cleric", level: 6, ...sub("life"), hp: 10, maxHp: 40 });
  characterLibrary = { a: { sheetId: "a", name: "A", hp: 1, maxHp: 30 }, b: { sheetId: "b", name: "B", hp: 1, maxHp: 30 } };
  rollSpellEffect("Mass Cure Wounds", { kind: "healing", formula: "10", multiplier: 1, bonus: 0, selfHeal: 7, mortalityMax: null, baseLevel: 5 });
  rollRequest.liveActions.filter(action => /^Heal [AB] /.test(action.label)).forEach(action => action.run());
  assert.strictEqual(character.hp, 17, "Blessed Healer once");
  characterLibrary = savedLibrary;
  // R14: Preserve Life stops at half the HP maximum; Balm of Peace heals at least 1.
  assert.strictEqual(preserveLifeRoom({ hp: 10, maxHp: 50 }, 30), 15);
  assert.strictEqual(preserveLifeRoom({ hp: 30, maxHp: 50 }, 30), 0);
  hero({ classId: "cleric", level: 6, ...sub("life"), hp: 10, maxHp: 50 });
  useFeatureAction(featureActions().find(action => /Preserve Life/.test(action.name)));
  assert(label(toast.actions, /^Heal me \\+15$/), "Preserve Life offers 15 at 10/50");
  CLASS_FEATURE_USES.give({ name: "Balm" }, { heal: true, min: 1, roll: "2d6-20" });
  assert(label(rollRequest.liveActions, /^Heal me \\+1$/), "Balm of Peace heals at least 1");
  // R14: Destructive Wrath maximizes a thunder spell.
  hero({ classId: "cleric", level: 2, ...sub("tempest"), spells: [{ id: "tw", index: "thunderwave", level: 1, prepared: true, classKey: "primary" }] });
  castSpellRow(character.spells[0], { slot: true }, 1);
  assert(label(toast.actions, /^Destructive Wrath: max damage \\(16\\)$/), "Destructive Wrath maximizes 2d8");
  // R20: Starry Form sets a constellation; Archer row, Chalice heal, Dragon floor on WIS checks.
  hero({ classId: "druid", level: 2, ...sub("stars") });
  useFeatureAction(featureActions().find(action => action.name === "Starry Form"));
  label(toast.actions, /^Archer$/).run();
  assert.strictEqual(starryForm(), "Archer");
  assert(featureActions().some(action => action.name === "Starry Form: Archer" && action.attack === "+5" && action.damage === "1d8+3 radiant"));
  character.starryForm = "Dragon";
  openRoll({ label: "Insight", formula: "1d20", kind: "check", ability: "wis" });
  assert.strictEqual(rollRequest.minD20, 10, "Starry Form Dragon floor");
  character.starryForm = "Chalice";
  rollSpellEffect("Cure Wounds", { kind: "healing", formula: "5", multiplier: 1, bonus: 0, selfHeal: 0, mortalityMax: null, baseLevel: 1 });
  assert(label(rollRequest.liveActions, /^Chalice: heal 1d8\\+3$/), "Chalice follow-up");
  // R21/R28, N10: Enhanced Bond variant, Alchemical Savant, Moon Sickle d4, Bloodwell Vial.
  hero({ classId: "druid", level: 6, ...sub("wildfire"), spells: [{ id: "cw", index: "cure-wounds", level: 1, prepared: true, classKey: "primary" }] });
  castSpellRow(character.spells[0], { slot: true }, 1);
  assert(label(toast.actions, /Enhanced Bond 1d8/), "Enhanced Bond option on a healing spell");
  hero({ classId: "artificer", level: 5, ...sub("alchemist"), abilities: { str: 10, dex: 10, con: 10, int: 16, wis: 10, cha: 10 } });
  assert.strictEqual(spellEffectRoll({ index: "cure-wounds", level: 1, classKey: "primary" }, 1).formula, "1d8+6", "Alchemical Savant adds INT");
  hero({ classId: "druid", level: 1, equipment: [gear("moon-sickle")] });
  assert.strictEqual(spellEffectRoll({ index: "cure-wounds", level: 1, classKey: "primary" }, 1).formula, "1d8+3+1d4", "Moon Sickle d4");
  hero({ classId: "sorcerer", level: 5, equipment: [gear("bloodwell-vial")] });
  sorceryPoints().current = 0;
  bloodwellActions()[0].run();
  assert.strictEqual(sorceryPoints().current, 5);
  assert.strictEqual(bloodwellActions().length, 0, "Bloodwell Vial once per dawn");
  character.equipment.forEach(rechargeItem);
  sorceryPoints().current = 0;
  assert.strictEqual(bloodwellActions().length, 1, "back after dawn");
  // N11: replacements show only when picked and hide what they replace.
  const names = () => classFeatureRows()[0].reached.map(row => row.name);
  hero({ classId: "cleric", level: 8, ...sub("life") });
  assert(names().includes("Divine Strike") && !names().includes("Blessed Strikes"));
  hero({ classId: "cleric", level: 8, ...sub("life"), combatChoices: { blessedStrikes: "Blessed Strikes" } });
  assert(!names().includes("Divine Strike") && names().includes("Blessed Strikes"));
  hero({ classId: "ranger", level: 10, ...sub("hunter") });
  assert(["Favored Enemy", "Natural Explorer", "Primeval Awareness", "Hide in Plain Sight"].every(name => names().includes(name)));
  assert(!["Favored Foe", "Deft Explorer: Canny", "Primal Awareness", "Nature's Veil"].some(name => names().includes(name)));
  assert(!character.resources.some(item => item.name === "Nature's Veil"), "no Nature's Veil tracker without the pick");
  hero({ classId: "ranger", level: 10, ...sub("hunter"), classChoices: { favoredFoe: true, naturesVeil: true, primalAwareness: true } });
  assert(names().includes("Favored Enemy and Natural Explorer Improvements"), "Natural Explorer half still applies");
  assert(!["Favored Enemy", "Hide in Plain Sight", "Primeval Awareness"].some(name => names().includes(name)));
  assert(featureActions().some(action => action.name === "Nature's Veil") && !featureActions().some(action => action.name === "Hide in Plain Sight"));
  character = saved;
}
// --- r3brennan checks ---
{
  const saved = character;
  const scores = { str: 16, dex: 10, con: 14, int: 8, wis: 16, cha: 10 };
  const card = index => equipmentFromItemCard(ITEM_CATALOG.find(item => item.index === index));
  // N4: a dart is finesse, so STR 16 / DEX 10 attacks with STR.
  character = sheet({ classId: "fighter", level: 1, abilities: scores });
  assert.strictEqual(weaponAction(card("dart")).attack, "+5", "dart uses STR when higher");
  // N5: GWM's -5/+10 needs proficiency with the heavy weapon.
  const realOpenRoll = openRoll;
  let request = null;
  openRoll = value => { request = value; };
  character = sheet({ classId: "wizard", level: 4, abilities: scores, planner: { multiclass: [], feats: ["Great Weapon Master"] }, equipment: [{ ...card("greatsword"), equipped: true }] });
  rollActionAttack(weaponActions(character.equipment[0])[0], "", true);
  assert.strictEqual(request.powerAttack, "", "no GWM chip without proficiency");
  character.classId = "fighter";
  rollActionAttack(weaponActions(character.equipment[0])[0], "", true);
  assert.strictEqual(request.powerAttack, "Great Weapon Master");
  openRoll = realOpenRoll;
  // B23 / N10: the net and the firearms have prices; firearms aren't "any martial weapon" starting picks.
  assert.deepStrictEqual(["net", "pistol", "musket"].map(index => ITEM_CATALOG.find(item => item.index === index).cost), ["1 gp", "250 gp", "500 gp"]);
  assert(gearPickOptions("martial").includes("Net") && !gearPickOptions("martial").includes("Pistol"));
  // N1: dragonmarked subraces keep the parent race's traits.
  character = sheet({ classId: "fighter", level: 1, species: "Mark of Healing" });
  assert(rollHints({ kind: "save", ability: "wis" }).some(hint => /^Brave/.test(hint)), "Mark of Healing is a halfling");
  character = sheet({ classId: "fighter", level: 1, species: "Mark of Warding" });
  assert(resistanceSources("poison").length && rollHints({ kind: "save", ability: "con" }).some(hint => /Dwarven Resilience/.test(hint)));
  assert(featRule("Prodigy").ok({ species: "Mark of Making" }) && !featRule("Prodigy").ok({ species: "Mark of Scribing" }));
  // N2: fighter 4 / rogue 4 checklist: hit dice per class, two ASIs, rogue expertise.
  character = sheet({ classId: "fighter", level: 4, abilities: scores, multiclasses: [{ id: "r", classId: "rogue", level: 4, subclassName: "" }] });
  character.hitDice = hitDiceText();
  const items = Object.fromEntries(levelChecklist().map(item => [item.label, item]));
  assert(items["Hit dice"].done, "4d10 + 4d8 is legal");
  assert(/^2 ability score improvements by level 8/.test(items["ASIs and feats"].detail));
  assert(/Choose 2 skills/.test(items.Expertise.detail));
  // N3: Pact of the Tome cantrips and Blessed Warrior cantrips are picks that become class spell rows.
  character = sheet({ classId: "warlock", level: 3, abilities: scores, classChoices: { pactBoon: "tome", tomeCantrips: ["guidance", "fire-bolt", "light"] } });
  assert.strictEqual(classChoiceSlots().filter(slot => slot.key === "tomeCantrips").length, 3);
  ensureSubclassSpells();
  assert.deepStrictEqual(character.spells.filter(row => row.auto && row.level === 0).map(row => row.index).sort(), ["fire-bolt", "guidance", "light"]);
  character.classChoices.pactBoon = "chain";
  ensureSubclassSpells();
  assert.deepStrictEqual(character.spells.filter(row => row.auto).map(row => row.index), ["find-familiar"], "swapping the boon swaps its spells");
  character = sheet({ classId: "paladin", level: 2, classChoices: { fightingStyles: ["Blessed Warrior"] } });
  const blessed = classChoiceSlots().filter(slot => slot.key === "blessedWarriorCantrips");
  assert(blessed.length === 2 && blessed[0].options.some(item => item.value === "sacred-flame") && !blessed[0].options.some(item => item.value === "fire-bolt"));
  // CO10: Kensei weapons (one melee, one ranged; longbow allowed, heavy/special not), Storm Herald environment, hemocraft DC.
  character = sheet({ classId: "monk", level: 6, subclassName: "Kensei", subclass: { officialIndex: "kensei" } });
  const kensei = classChoiceSlots().filter(slot => slot.key === "kenseiWeapons");
  assert.strictEqual(kensei.length, 3);
  assert(kensei[1].options.some(item => item.value === "Longbow") && !kensei[2].options.some(item => /Net|Greatsword/.test(item.value)));
  character.classChoices.kenseiWeapons = ["Longsword", "Longbow"];
  assert(kenseiWeapon({ name: "Longbow +1" }) && !kenseiWeapon({ name: "Shortbow" }));
  character = sheet({ classId: "barbarian", level: 3, subclassName: "Storm Herald", subclass: { officialIndex: "storm-herald" } });
  assert(classChoiceSlots().some(slot => slot.key === "stormEnvironment" && slot.options.length === 3));
  character = sheet({ classId: "bloodhunter", level: 1, abilities: { ...scores, int: 8 }, classChoices: { bloodMaledicts: ["Blood Curse of Binding"] } });
  ensureClassResources();
  assert(/DC 9\\./.test(featureActions().find(action => action.name === "Blood Curse of Binding")?.notes || ""), "no +1 floor on the hemocraft DC");
  assert.strictEqual(normalizeCharacter({ classChoices: { hemocraftAbility: "wis" } }).classChoices.hemocraftAbility, "wis", "the hemocraft ability pick survives a reload");
  // N6 / B21: class tool choices get selects; a tool from two sources gets a replacement.
  creationDraft = { ...blankCreationDraft(), classId: "bard" };
  assert.strictEqual(creationSlots().filter(slot => slot.group === "class" && slot.kind === "tool").length, 3, "bard: three instruments");
  creationDraft = { ...blankCreationDraft(), classId: "artificer", species: "Rock Gnome" };
  assert(creationSlots().some(slot => slot.id === "rep-tool-0" && /Tinker's tools/i.test(slot.label)), "gnome + artificer tinker's tools");
  creationDraft = { ...blankCreationDraft(), classId: "fighter", species: "Hill Dwarf", background: "Guild Artisan" };
  const artisan = creationSlots().find(slot => slot.id.startsWith("bg-tool"));
  creationDraft.picks = { "sp-tool-choice": "Smith's tools", [artisan.id]: "Smith's tools" };
  assert(creationSlots().some(slot => slot.id === "rep-tool-0"), "same artisan's tools from species and background");
  creationDraft = null;
  // C19 / C24 / C25: Telekinetic shove, Dwarven Fortitude, Iron Stomach, Dungeon Delver and Squat Nimbleness reminders.
  character = sheet({ classId: "fighter", level: 4, abilities: scores, planner: { multiclass: [], feats: ["Telekinetic", "Dwarven Fortitude", "Dungeon Delver", "Squat Nimbleness"] }, featGrants: { Telekinetic: { ability: "wis" } } });
  const rows = featureActions();
  assert(/DC 13/.test(rows.find(action => action.name === "Telekinetic shove")?.notes || ""), "Telekinetic DC 8 + 2 + WIS 3");
  assert.strictEqual(rows.find(action => action.name === "Dodge (Dwarven Fortitude)")?.use.kind, "hitDie");
  assert(rollHints({ kind: "save", ability: "dex" }).some(hint => /Dungeon Delver/.test(hint)));
  assert(rollHints({ kind: "check", ability: "str", context: "athletics" }).some(hint => /Squat Nimbleness/.test(hint)));
  character.planner.feats.push("Vigor of the Hill Giant");
  restPerks = { sheetId: character.sheetId, spentHitDice: true };
  assert(restPerkActions().some(action => /Iron Stomach \\(ate\\) \\+4/.test(action.label)), "CON 2 + PB 2");
  restPerks = null;
  // CO5: Beguiling Influence and Gift of the Depths.
  character = sheet({ classId: "warlock", level: 5, abilities: scores, classChoices: { invocations: ["Beguiling Influence", "Gift of the Depths"] } });
  assert.strictEqual(skillBonus("persuasion", "cha"), 3, "Beguiling Influence: proficient in Persuasion");
  assert(/swim 30 ft/.test(specialSensesHtml()), "Gift of the Depths swim speed");
  // CO11: the rules reference carries the counts.
  assert(RULES_REFERENCE.some(rule => /Invocations known: 2 at warlock 2/.test(JSON.stringify(rule))));
  character = saved;
}
// --- end r3brennan checks ---
// --- r3sam checks ---
{
  const saved = character;
  prefs.diceMode = "digital";
  persist = () => {};
  persistAndRender = () => {};
  showToast = () => ({});
  const queue = [];
  const realDie = rollDie;
  rollDie = sides => queue.length ? queue.shift() : realDie(sides);
  const gear = (index, extra = {}) => {
    const card = ITEM_CATALOG.find(item => item.index === index);
    return { id: index + (extra.suffix || ""), name: card.name, notes: [card.type, card.rarity, card.notes].join(" - "), quantity: 1, equipped: true, container: "equipped", ...extra };
  };
  const hero = (over = {}) => {
    character = normalizeCharacter({ name: "T", classId: "fighter", level: 1, subclassName: "", subclass: { mode: "custom", officialIndex: "", sections: [] }, resources: [], classOptions: [], equipment: [], actions: [], conditions: [], spells: [], backgroundDetails: {}, abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }, ...over });
    ensureClassResources();
    return character;
  };
  const sub = slug => ({ mode: "official", officialIndex: slug, sections: [] });
  const multi = (classId, level, officialIndex = "") => ({ id: classId + level, classId, level, subclassName: "", officialIndex });
  const follow = label => d20FollowUps(rollRequest, rollRequest.result).find(action => action.label.includes(label));
  const roll = (request, ...dice) => { openRoll(request); queue.push(...dice); performRoll(); return rollRequest.result; };
  const click = selector => ({ target: { closest: wanted => wanted === selector ? {} : null, matches: () => false } });

  // R1: Halfling Lucky on a death save re-runs the outcome (2 failures become 1 success).
  hero({ species: "Lightfoot Halfling", hp: 0, maxHp: 10 });
  rollDeathSave();
  queue.push(1);
  performRoll();
  assert.strictEqual(character.deathSaveFailures, 2);
  queue.push(15);
  follow("Halfling Lucky").run();
  assert(character.deathSaveFailures === 0 && character.deathSaveSuccesses === 1, "Halfling Lucky replaces the death save outcome");

  // R2: Indomitable on a failed concentration save replaces the first result.
  hero({ level: 9, concentration: "Bless", saveProficiencies: ["str", "con"] });
  pendingConcentrationDcs = [10];
  handleConcentrationPromptClick(click("[data-roll-concentration]"));
  queue.push(2);
  performRoll();
  assert.strictEqual(character.concentration, "");
  follow("Indomitable").run();
  queue.push(18);
  performRoll();
  assert.strictEqual(character.concentration, "Bless", "Indomitable's reroll keeps concentration");
  assert(!rollRequest.result || true);

  // R3/R4: Reliable Talent still floors the die Lucky keeps; Halfling Lucky still sees the raw 1.
  hero({ classId: "rogue", level: 11 });
  character.resources.push({ id: "luck", name: "Luck Points", current: 3, max: 3, reset: "long" });
  roll({ label: "Stealth", formula: "1d20+4", kind: "check", ability: "dex", minD20: 10 }, 3);
  assert.strictEqual(rollRequest.result.total, 14);
  queue.push(8);
  follow("Lucky:").run();
  assert.strictEqual(rollRequest.result.total, 14, "Lucky can't drop below the Reliable Talent floor");
  hero({ classId: "rogue", level: 11, species: "Lightfoot Halfling" });
  roll({ label: "Stealth", formula: "1d20+4", kind: "check", ability: "dex", minD20: 10 }, 1);
  assert(follow("Halfling Lucky"), "a floored natural 1 still offers Halfling Lucky");

  // R5: Portent is picked before the roll and replaces the d20; no post-roll Portent.
  hero({ classId: "wizard", level: 2, portentDice: [17, 4] });
  openRoll({ label: "WIS save", formula: "1d20+1", kind: "save", ability: "wis" });
  rollRequest.portent = { index: 0, value: 17 };
  queue.push(2);
  performRoll();
  assert.strictEqual(rollRequest.result.total, 18);
  assert.deepStrictEqual(character.portentDice, [4]);
  assert(!follow("Portent"), "no Portent after the roll");

  // R6: Stroke of Luck on a natural 1 still allows damage.
  hero({ classId: "rogue", level: 20, abilities: { str: 10, dex: 18, con: 10, int: 10, wis: 10, cha: 10 }, equipment: [gear("rapier")] });
  rollActionAttack(weaponAction(character.equipment[0]));
  queue.push(1);
  performRoll();
  follow("Stroke of Luck").run();
  assert(rollRequest.actions(rollRequest.result).some(action => action.label === "Roll damage"), "Stroke of Luck hit rolls damage");

  // R7: Roll again drops spent Inspiration and once-per-roll flags; no Roll again for death saves.
  hero({ inspiration: 1 });
  roll({ label: "Check", formula: "1d20", kind: "check", ability: "str", inspiration: true }, 5);
  rollRequest.used = new Set(["halfling"]);
  handleRollClick(click("[data-roll-again]"));
  assert(!rollRequest.inspiration && !rollRequest.used, "Roll again is a fresh roll");

  // R8: physical kh/kl and m terms take one value per die.
  assert.strictEqual(evaluateRoll("4d6kh3", "normal", { 0: [6, 5, 4, 1] }).total, 15);
  assert.strictEqual(evaluateRoll("2d6m2", "normal", { 0: [1, 1] }).total, 4);
  assert.strictEqual(evaluateRoll("2d6", "normal", { 0: [4, 5] }).total, 9, "physical damage dice are typed one per die (p9combat)");

  // R9: a proficient tool gets Reliable Talent; a skill's ability swap recomputes Indomitable Might.
  hero({ classId: "rogue", level: 11 });
  rollAbilityCheck("dex");
  handleRollChange({ target: { matches: selector => selector === "[data-roll-tool]", value: "Thieves' tools" } });
  assert.strictEqual(rollRequest.minD20, 10);
  hero({ classId: "barbarian", level: 18, abilities: { str: 20, dex: 10, con: 10, int: 10, wis: 10, cha: 10 } });
  rollSkillCheck("athletics");
  assert.strictEqual(rollRequest.floor.value, 20);
  handleRollChange({ target: { matches: selector => selector === "[data-roll-ability]", value: "con" } });
  assert.strictEqual(rollRequest.floor, null, "Athletics with CON isn't a Strength check");

  // R10: a held Bardic Inspiration die adds to the d20; Valor dice add to weapon damage.
  hero();
  character.resources.push({ id: "bi", name: "Bardic Inspiration from B (Valor)", current: 1, max: 1, reset: "manual", die: 8, inspirationFrom: "b" });
  roll({ label: "Hit", formula: "1d20+5", kind: "attack" }, 10);
  queue.push(6);
  follow("Bardic Inspiration (d8)").run();
  assert(rollRequest.result.total === 21 && character.resources.find(item => item.id === "bi").current === 0);
  character.resources.find(item => item.id === "bi").current = 1;
  assert(damageRollFollowUps("Sword", "1d8+3", { weapon: true, melee: true }, false).some(action => action.label.includes("Combat Inspiration")));

  // R11: the Inspiring Leader feat opens its own menu, not Bardic Inspiration.
  hero({ level: 4, planner: { feats: ["Inspiring Leader"] } });
  assert.strictEqual(featureActions().find(action => action.source.feature === "inspiring-leader").use.kind, "inspiringLeader");

  // R12: Sneak Attack comes back on an enemy's turn; Divine Fury doesn't.
  turnState().riders = ["sneak", "divine-fury"];
  enemyTurnRiders();
  assert.deepStrictEqual(turnState().riders, ["divine-fury"]);

  // R13 / N2: items that set STR count for heavy armor and Indomitable Might.
  hero({ abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }, speed: 30, equipment: [gear("gauntlets-of-ogre-power", { attuned: true }), gear("plate")] });
  assert.strictEqual(effectiveSpeed(), 30, "Gauntlets of Ogre Power meet plate's STR 15");
  hero({ classId: "barbarian", level: 18, abilities: { str: 16, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }, equipment: [gear("gauntlets-of-ogre-power", { attuned: true })] });
  assert.strictEqual(indomitableMight("str").value, 19);

  // R14: Thirsting Blade only for the pact weapon.
  hero({ classId: "warlock", level: 5, classChoices: { pactBoon: "blade", invocations: ["Thirsting Blade"] } });
  assert.strictEqual(extraAttacks(gear("longsword")), 1);

  // R15: a dedicated shortbow and a Kensei longbow are monk weapons; Kensei's Shot and Deft Strike ride on hits.
  hero({ classId: "monk", level: 5, abilities: { str: 10, dex: 16, con: 10, int: 10, wis: 10, cha: 10 }, equipment: [gear("shortbow")] });
  character.combatChoices = { dedicatedWeapon: "shortbow" };
  assert(weaponAction(character.equipment[0]).notes.includes("Martial Arts"), "dedicated shortbow");
  hero({ classId: "monk", level: 6, subclass: sub("kensei"), classChoices: { kenseiWeapons: ["Longbow"] }, abilities: { str: 10, dex: 16, con: 10, int: 10, wis: 10, cha: 10 }, equipment: [gear("longbow")] });
  assert(weaponAction(character.equipment[0]).notes.includes("Martial Arts"), "kensei longbow");
  effects()["Kensei's Shot"] = 1;
  const kenseiRiders = damageRiders(actionTraits(weaponAction(character.equipment[0]))).map(rider => rider.name);
  assert(kenseiRiders.includes("Kensei's Shot") && kenseiRiders.includes("Deft Strike (1 ki)"), kenseiRiders.join());

  // R16: another paladin's aura only adds what beats your own.
  hero({ sheetId: "me", classId: "paladin", level: 6, hp: 40, abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 14 } });
  characterLibrary.other = { sheetId: "other", name: "Pal", classId: "paladin", level: 6, hp: 40, abilities: { cha: 18 } };
  const aura = rollChips({ kind: "save", ability: "wis" }).filter(chip => chip.id.startsWith("aura"));
  assert(aura.length === 1 && aura[0].formula === "+2", "aura difference only");
  characterLibrary.other.abilities.cha = 14;
  assert(!rollChips({ kind: "save", ability: "wis" }).some(chip => chip.id.startsWith("aura")), "an equal aura adds nothing");
  delete characterLibrary.other;

  // R17: each Tasha's ranger replacement is its own pick.
  hero({ classId: "ranger", level: 10 });
  let ranger = featureActions().map(action => action.source.feature);
  assert(ranger.includes("hide-in-plain-sight") && ranger.includes("primeval-awareness") && !ranger.includes("natures-veil"));
  hero({ classId: "ranger", level: 10, classChoices: { naturesVeil: true } });
  ranger = featureActions().map(action => action.source.feature);
  assert(ranger.includes("natures-veil") && ranger.includes("primeval-awareness"));

  // R18 / B2 / C22 / B12 / M24: typed damage reads every resistance and immunity the sheet knows.
  hero({ species: "Dragonborn", draconicAncestry: "Red", hp: 50, maxHp: 50 });
  dealDamage(10, { type: "fire" });
  assert.strictEqual(character.hp, 45, "dragonborn ancestry resistance");
  hero({ planner: { feats: ["Scion of the Outer Planes (Evil)"] } });
  assert.deepStrictEqual(resistanceSources("necrotic"), ["Scion of the Outer Planes"]);
  hero({ planner: { feats: ["Planar Wanderer"] } });
  character.combatChoices = { planarWanderer: "cold" };
  assert.deepStrictEqual(resistanceSources("cold"), ["Planar Wanderer"]);
  hero({ species: "Autognome" });
  assert(resistanceSources("poison").length, "Autognome poison resistance");
  hero({ classId: "bloodhunter", level: 7, subclass: sub("lycan"), hybrid: true });
  assert(resistanceSources("slashing").includes("Hybrid Transformation") && advantageSource("save", "str", "") === "Hybrid Transformation");
  hero({ classId: "bloodhunter", level: 7, subclass: sub("mutant") });
  assert(damageImmunities("poison").includes("Strange Metabolism") && conditionImmunities().has("Poisoned"));
  hero({ classId: "monk", level: 10 });
  assert(damageImmunities("poison").includes("Purity of Body"));
  hero({ classId: "cleric", level: 17, subclass: sub("forge") });
  assert(resistanceSources("fire").includes("Soul of the Forge") && damageImmunities("fire").length);
  hero({ classId: "druid", level: 14, subclass: sub("spores") });
  assert(conditionImmunities().has("Blinded"));
  hero({ classId: "druid", level: 14, subclass: sub("stars"), starryForm: "Archer", effects: { "Starry Form": 100 } });
  assert(resistanceSources("piercing").includes("Full of Stars"));

  // M2: Unarmored Defense comes from the first barbarian or monk class only.
  hero({ classId: "barbarian", level: 1, multiclasses: [multi("monk", 1)], abilities: { str: 10, dex: 14, con: 16, int: 10, wis: 18, cha: 10 } });
  assert.strictEqual(calculatedArmorClass(), 15);

  // Data: no raw VERIFY text, Eternal Mountain Defense at 17th, Soulknife regains a die.
  assert(!JSON.stringify(SUBCLASS_FEATURES["four-elements"]).includes("VERIFY"));
  assert.strictEqual(CLASS_OPTIONS.elementalDisciplines.find(item => item.name === "Eternal Mountain Defense").level, 17);
  hero({ classId: "rogue", level: 3, subclass: sub("soulknife") });
  assert(character.resources.some(item => item.name === "Psionic Energy Recovery") && featureActions().some(action => action.source.feature === "psionic-recovery"));

  rollDie = realDie;
  character = saved;
}
// --- r3liam checks ---
{
  const saved = character;
  const savedToast = showToast, savedRoll = rollFromInput, savedLibrary = characterLibrary, savedSaveLibrary = saveCharacterLibrary;
  if (typeof prefs === "undefined") globalThis.prefs = {};
  persist = () => {};
  saveCharacterLibrary = () => {};
  let toasts = [];
  showToast = (html, options = {}) => { toasts.push({ html, actions: options.actions || [] }); return {}; };
  let rolled = null;
  rollFromInput = (label, formula, mode, actions) => { rolled = { label, formula, actions }; };
  const sheet = (classId, level, abilities = {}, extra = {}) => {
    character = { ...defaultCharacter(), sheetId: "r3-me", subclassName: "", subclass: { mode: "custom", officialIndex: "", type: "", sections: [] }, classId, level,
      abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10, ...abilities }, spells: [], resources: [], multiclasses: [], ...extra };
    characterLibrary = { [character.sheetId]: character };
    return character;
  };
  const sub = slug => ({ subclassName: slug, subclass: { mode: "official", officialIndex: slug, sections: [] } });
  const mc = (classId, level, more = {}) => ({ id: "mc-" + classId, classId, level, subclassName: "", ...more });
  const roll = (index, level) => spellEffectRoll({ id: index, index }, level);

  // L9 / R4 / R13: upcast text, overrides, structured fallback, darts with an attack roll, Tasha's-first class lists.
  sheet("wizard", 17, { int: 18 });
  assert.strictEqual(roll("arms-of-hadar", 3).chip, "4d6");
  assert(/4d6 cold/.test(roll("ice-knife", 3).note), "Ice Knife burst scales");
  assert.strictEqual(roll("elemental-weapon", 5).formula, "2d4");
  assert.strictEqual(roll("chaos-bolt", 3).formula, "2d8+3d6");
  assert.strictEqual(roll("destructive-wave", 5).formula, "5d6+5d6");
  assert.strictEqual(roll("jims-magic-missile", 1).chip, "2d4 ×3", "each dart is its own 2d4 attack");
  assert.strictEqual(roll("guardian-of-faith", 5).formula, "20", "no upcast: highest listed slot value");
  assert.strictEqual(roll("enhance-ability", 2).kind, "temp");
  assert(spellDetails["tashas-caustic-brew"].classes.some(cls => cls.index === "sorcerer") && !spellDetails["intellect-fortress"].optionalClasses);

  // R1: Agonizing Blast from the class-choice picker.
  sheet("warlock", 5, { cha: 18 }, { classChoices: { invocations: ["Agonizing Blast"] } });
  assert.strictEqual(roll("eldritch-blast", 0).chip, "1d10+4 ×2");
  // R12: a pure warlock casts at the pact level even when the card never rendered.
  character.spells = [{ id: "hx", index: "hex", classKey: "primary" }];
  castSpellRow(character.spells[0], { metamagic: [] });
  assert.deepStrictEqual(character.spellSlotUsage, { 3: 1 });
  // R3: Thirsting Blade only for the pact weapon.
  character.classChoices = { pactBoon: "blade", invocations: ["Thirsting Blade"] };
  character.combatChoices = { pactWeapon: "pw" };
  assert.strictEqual(extraAttacks({ id: "pw", name: "Longsword" }), 2);
  assert.strictEqual(extraAttacks({ id: "bow", name: "Longbow" }), 1);

  // R2: Eldritch Smite and Eldritch Master use the multiclass pact pool.
  sheet("paladin", 6, { cha: 18 }, { multiclasses: [mc("warlock", 5)], classChoices: { pactBoon: "blade", invocations: ["Eldritch Smite"] } });
  ensureClassResources();
  CLASS_FEATURE_USES.eldritchSmite();
  assert.strictEqual(character.pactSlotUsage, 1, "smite spends a pact slot");
  sheet("warlock", 20, { cha: 18 }, { multiclasses: [mc("sorcerer", 1)], pactSlotUsage: 4 });
  ensureClassResources();
  useFeatureAction(featureActions().find(action => action.name === "Eldritch Master"));
  assert.strictEqual(character.pactSlotUsage, 0, "Eldritch Master refills the pact pool");

  // R5: Metamagic only where it can change the spell.
  sheet("sorcerer", 10, { cha: 16 });
  ensureClassResources();
  const fits = (index, level) => metamagicChoices({ id: index, index }, level, []).map(option => option.short);
  assert(!fits("hold-person", 3).includes("Twinned") && fits("hold-person", 2).includes("Twinned"));
  assert(fits("chromatic-orb", 1).includes("Twinned") && !fits("scorching-ray", 2).includes("Twinned") && !fits("magic-missile", 1).includes("Twinned"));
  assert(!fits("haste", 3).includes("Careful") && !fits("haste", 3).includes("Seeking") && fits("fire-bolt", 0).includes("Seeking"));
  // R6: Metamagic Adept points are spent first and only on its picks.
  sheet("wizard", 5, { int: 16 }, { classChoices: { metamagic: ["Quickened Spell", "Subtle Spell"] },
    resources: [{ id: "ma", name: "Sorcery Points (Metamagic Adept)", current: 2, max: 2, reset: "long" }] });
  assert.deepStrictEqual(fits("fire-bolt", 0), ["Quickened", "Subtle"]);
  character.resources.push({ id: "sp", name: "Sorcery Points", current: 5, max: 5, reset: "long" });
  const refund = spendMetamagicPoints(3);
  assert.deepStrictEqual(character.resources.map(item => item.current), [0, 4]);
  refund();
  assert.deepStrictEqual(character.resources.map(item => item.current), [2, 5]);

  // R7: Pact of the Tome cantrips: any class's cantrips, not counted against cantrips known.
  sheet("warlock", 3, { cha: 16 }, { classChoices: { pactBoon: "tome" } });
  character.spells = [{ id: "t1", index: "sacred-flame", classKey: "primary", tome: true }];
  assert.strictEqual(entryCantripCount(classEntries()[0]), 0);
  const tomeChoices = spellChoices("", null, { id: "t2", index: "", tome: true, classKey: "primary" });
  assert(tomeChoices.every(item => item.level === 0) && tomeChoices.some(item => item.index === "guidance"));
  // R8: invocation spells: at will without a slot; Sign of Ill Omen once per long rest with a slot.
  sheet("warlock", 7, { cha: 18 }, { classChoices: { invocations: ["Armor of Shadows", "Sign of Ill Omen"] } });
  ensureInvocationSpells();
  ensureSpellTrackers();
  const row = index => character.spells.find(item => item.index === index);
  castSpellRow(row("mage-armor"), { metamagic: [] });
  assert.deepStrictEqual(character.spellSlotUsage, {}, "Armor of Shadows spends no slot");
  castSpellRow(row("bestow-curse"), { metamagic: [] });
  assert.deepStrictEqual(character.spellSlotUsage, { 4: 1 });
  toasts = [];
  castSpellRow(row("bestow-curse"), { metamagic: [] });
  assert(/is used/.test(toasts[0].html) && character.spellSlotUsage[4] === 1, "second Sign of Ill Omen waits for a long rest");

  // R9: Ritual Caster: the chosen class's rituals up to half the character level.
  sheet("fighter", 6, { int: 14 }, { planner: { feats: ["Ritual Caster (Wizard)"] } });
  const rituals = spellChoices("", null, { id: "rc", index: "", ritualBook: true, source: { kind: "feat", name: "Ritual Caster (Wizard)", ability: "int" } });
  assert(Math.max(...rituals.map(item => item.level)) === 3 && !rituals.some(item => item.index === "ceremony"));
  // R10: an Eldritch Knight's free off-school pick at 3rd is used once.
  sheet("fighter", 2, {}, sub("eldritch-knight"));
  levelPlan = { target: "primary", subclass: "eldritch-knight", choices: [{ index: "charm-person" }, { index: "" }] };
  assert(spellChoicesForLevelChoice("leveled", entryClass({ ...classEntries()[0], level: 3, officialIndex: "eldritch-knight" }), 3, levelPlan.choices[1])
    .every(item => ["abjuration", "evocation"].includes(spellDetails[item.index]?.school?.index)), "one off-school pick only");
  levelPlan = null;
  // R11: Signature Spells are tracked per spell row only.
  sheet("wizard", 20, { int: 20 });
  ensureClassResources();
  assert(!character.resources.some(item => /^Signature Spell [0-9]/.test(item.name)));

  // R14: Psionic Sorcery, Revelation in Flesh, Psychic Blades, Hexblade's Curse on a save spell.
  sheet("sorcerer", 14, { cha: 16 }, sub("aberrant-mind"));
  ensureClassResources();
  ensureSubclassSpells();
  castSpellRow(row("hunger-of-hadar"), { psionic: true, metamagic: [] });
  assert.strictEqual(sorceryPointTracker().current, 11, "3 SP instead of a slot");
  assert.deepStrictEqual(character.spellSlotUsage, {});
  toasts = [];
  useFeatureAction(featureActions().find(action => action.name === "Revelation in Flesh"));
  toasts[0].actions[1].run();
  assert.strictEqual(sorceryPointTracker().current, 9);
  sheet("rogue", 3, { dex: 16 }, sub("soulknife"));
  assert.strictEqual(featureActions().find(action => action.name === "Psychic Blade").damage, "1d6+3 psychic");
  sheet("warlock", 5, { cha: 16 }, { ...sub("hexblade"), effects: { "Hexblade's Curse": 10 } });
  rollSpellEffect("Fireball", { kind: "damage", formula: "8d6" });
  assert(rolled.actions({ total: 20 }).some(action => action.label === "Cursed target: +3"));

  // R15: a custom feat resource keeps its die.
  sheet("fighter", 4, { str: 16 }, { planner: { feats: ["R3 Sight"] } });
  customFeats["custom-r3-sight"] = sanitizeCustomFeat({ id: "custom-r3-sight", name: "R3 Sight", resources: [{ name: "R3 Sight", max: "prof", reset: "short", die: 6 }] });
  assert.strictEqual(grantTrackers().find(item => item[0] === "R3 Sight")?.[3], 6);
  delete customFeats["custom-r3-sight"];

  // A7: Circle of the Moon never gets the Moon Domain's spells.
  sheet("druid", 10, { wis: 16 }, sub("moon"));
  ensureSubclassSpells();
  assert.deepStrictEqual(character.autoSpells || [], []);
  assert.strictEqual(lookupBySubclass(SUBCLASS_SPELLS, "moon"), undefined);
  // N4 / M21: one hemocraft ability everywhere.
  sheet("bloodhunter", 10, { int: 12, wis: 18 }, sub("profane-soul"));
  assert.strictEqual(hemocraftDc(), 13);
  character.classChoices = { hemocraftAbility: "wis" };
  assert.strictEqual(hemocraftDc(), 16);
  assert.strictEqual(entryClass(classEntries()[0]).spellAbility, "wis");
  assert.strictEqual(saveBonus("str"), 4, "Dark Augmentation uses WIS too");

  // N12: Aid on a dying ally clears death saves; the same spell doesn't stack; Heroes' Feast outlasts a long rest.
  sheet("cleric", 5, { wis: 16 }, { hp: 30, maxHp: 30 });
  characterLibrary.ally = { ...defaultCharacter(), sheetId: "ally", name: "Ally", hp: 0, maxHp: 30, deathSaveSuccesses: 1, deathSaveFailures: 2, conditions: ["Unconscious"], autoUnconscious: true };
  raiseMaxHp(characterLibrary.ally, 5, "aid");
  const ally = characterLibrary.ally;
  assert(ally.hp === 5 && ally.deathSaveFailures === 0 && !ally.conditions.includes("Unconscious"));
  raiseMaxHp(character, 5, "aid");
  raiseMaxHp(character, 5, "aid");
  raiseMaxHp(character, 12, "heroes-feast");
  assert.strictEqual(character.maxHpBonus, 17);
  takeRest("long", { food: true });
  assert.strictEqual(character.maxHpBonus, 12, "Aid ends, the feast stays");
  // N13: Death Ward leaves you at 1 HP once; Beacon of Hope: advantage and maximized healing.
  character.hp = 10;
  character.effects = { "Death Ward": 4800 };
  dealDamage(30);
  assert(character.hp === 1 && !hasEffect("Death Ward"));
  character.effects = { "Beacon of Hope": 10 };
  assert.strictEqual(rollModeFor("save", "", "death").mode, "advantage");
  assert.strictEqual(rollModeFor("save", "wis").mode, "advantage");
  rollSpellEffect("Cure Wounds", { kind: "healing", formula: "1d8+3", multiplier: 1, bonus: 0, mortalityMax: null });
  assert(rolled.actions({ total: 4 }).some(action => action.label === "Heal me +11"));

  character = saved;
  characterLibrary = savedLibrary;
  saveCharacterLibrary = savedSaveLibrary;
  showToast = savedToast;
  rollFromInput = savedRoll;
}

// --- Beacon of Hope maximizes every healing roll ---
assert.strictEqual(beaconHealing({ effects: { "Beacon of Hope": 5 } }, { total: 7, formula: "1d10+5" }), 15);
assert.strictEqual(beaconHealing({ effects: {} }, { total: 7, formula: "1d10+5" }), 7);

// --- p8party checks ---
{
  const saved = character;
  const savedLibrary = characterLibrary;
  const savedToast = showToast;
  const savedSave = saveCharacterLibrary;
  if (typeof syncState === "undefined") globalThis.syncState = {};
  let toasts = [];
  showToast = (html, options = {}) => { toasts.push({ html, actions: options.actions || [] }); return {}; };
  saveCharacterLibrary = () => {};
  const sheet = (id, extra) => normalizeCharacter({ ...defaultCharacter(), sheetId: id, name: id, hp: 10, maxHp: 10, ...extra });
  const pc = sheet("pc", { equipment: [{ id: "cm", name: "Chain Mail", notes: "AC 16. Requires Strength 13. Disadvantage on Stealth.", equipped: true }] });
  const npc = sheet("npc", { inParty: false });
  const ally = sheet("ally", { concentration: "  ", initiative: { total: 3, at: 1 } });
  const down = sheet("down", { hp: 0, conditions: ["Unconscious"] });
  characterLibrary = { pc, npc, ally, down };
  character = pc;
  // Bug 1: non-party sheets stay out of group checks and heal lists.
  assert(!otherSheets().some(item => item.sheetId === "npc") && otherSheets().some(item => item.sheetId === "ally"));
  rollGroupCheck();
  assert(/of 2 passed/.test(toasts[0].html), toasts[0].html);
  // Bug 2: each member's own Stealth disadvantage applies in the group check.
  assert(/pc \\d+ \\(disadvantage\\)/.test(toasts[0].html), toasts[0].html);
  // Bug 3: initiative comes from the sheet, not the capped roll history; ending combat clears it.
  assert.strictEqual(latestInitiative(ally), 3);
  assert.strictEqual(latestInitiative({ initiative: { total: "<b>" } }), null);
  assert.strictEqual(latestInitiative({ rollHistory: [{ label: "Initiative", total: 12 }] }), 12);
  character.initiative = { total: 15, at: 1 };
  endCombatState();
  assert.strictEqual(latestInitiative(character), null);
  // Bugs 6 and 7: no empty concentration label; the card opens through a real button.
  renderPartyDashboard();
  const html = document.querySelector("#partyDashboard").innerHTML;
  assert(!/Concentrating on\\s*</.test(html) && !/Concentrating on  /.test(html), "empty concentration label");
  assert(/<button type="button" class="party-open"/.test(html) && /data-party-member="npc" >/.test(html));
  // Bug 4: Stabilize asks who helps; the dying sheet and non-party sheets aren't offered.
  toasts = [];
  partyStabilizeMenu("down");
  const labels = toasts[0].actions.map(action => action.label);
  assert(labels.some(label => /^ally \\(Medicine/.test(label)) && !labels.some(label => /^(down|npc) /.test(label)) && labels.some(label => /Mark stable/.test(label)), labels.join("|"));
  let tries = 0;
  while (!characterLibrary.down.stable && tries++ < 50) helperStabilize(ally, "down");
  assert(characterLibrary.down.stable, "a helper's DC 10 Medicine check stabilizes the target");
  character = saved;
  characterLibrary = savedLibrary;
  showToast = savedToast;
  saveCharacterLibrary = savedSave;
}
// --- p8combat checks ---
{
  const saved = character, savedLibrary = characterLibrary, savedToast = showToast, savedRoll = rollFromInput, savedSaveLibrary = saveCharacterLibrary;
  if (typeof prefs === "undefined") globalThis.prefs = {};
  const savedMode = prefs.diceMode;
  persist = () => {};
  saveCharacterLibrary = () => {};
  let toasts = [];
  showToast = (html, options = {}) => { toasts.push({ html, actions: options.actions || [] }); return {}; };
  const lastToast = () => toasts[toasts.length - 1];
  const gear = (index, extra = {}) => {
    const card = ITEM_CATALOG.find(item => item.index === index);
    return { id: index, name: card.name, notes: [card.type, card.rarity, card.notes].join(" - "), quantity: 1, equipped: true, container: "equipped", ...extra };
  };
  const hero = (over = {}) => {
    character = normalizeCharacter({ name: "T", sheetId: "p8-me", classId: "fighter", level: 1, subclassName: "", subclass: { mode: "custom", officialIndex: "", sections: [] }, resources: [], classOptions: [], equipment: [], actions: [], conditions: [], spells: [], backgroundDetails: {}, abilities: { str: 16, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }, ...over });
    characterLibrary = { [character.sheetId]: character };
    ensureClassResources();
    return character;
  };
  const rowFor = predicate => character.actions.find(predicate);

  // 1: the weapon row's plain Damage button adds Rage's +2.
  hero({ classId: "barbarian", level: 3, raging: true, equipment: [gear("greataxe")] });
  const axe = weaponActions(character.equipment[0])[0];
  const [label, formula] = plainDamageRoll(axe, actionDamageFormula(axe));
  assert(formula.endsWith("+2") && /with Rage/.test(label), formula);
  character.raging = false;
  assert(!plainDamageRoll(axe, actionDamageFormula(axe))[1].endsWith("+2"));

  // 2: the Frenzy row marks the rage; ending it adds a level of exhaustion.
  hero({ classId: "barbarian", level: 3, subclass: { mode: "official", officialIndex: "berserker", sections: [] }, subclassName: "berserker", exhaustion: 0 });
  CLASS_FEATURE_USES.frenzy();
  assert(!character.frenzied, "no frenzy without a rage");
  Object.assign(character, { raging: true, effects: { Rage: 10 } });
  CLASS_FEATURE_USES.frenzy();
  assert(character.frenzied);
  endRage();
  assert.strictEqual(character.exhaustion, 1);

  // 3/5: equipped weapons and ready spells get rows; unequipping or unpreparing removes them; removed rows stay gone.
  hero({ classId: "wizard", level: 3, abilities: { str: 10, dex: 14, con: 10, int: 16, wis: 10, cha: 10 }, equipment: [gear("dagger", { equipped: false, container: "carried" })],
    spells: [{ id: "s1", index: "magic-missile", prepared: true }, { id: "s2", index: "burning-hands", prepared: false }] });
  refreshGeneratedActions();
  assert(!rowFor(action => action.source?.weapon), "an unequipped dagger has no attack");
  assert(rowFor(action => action.source?.spell === "magic-missile") && !rowFor(action => action.source?.spell === "burning-hands"));
  character.equipment[0].equipped = true;
  character.spells[0].prepared = false;
  character.spells[1].prepared = true;
  refreshGeneratedActions();
  assert(rowFor(action => action.source?.weapon === "dagger" && !action.source.grip), "equipping adds the attack");
  assert(!rowFor(action => action.source?.spell === "magic-missile") && rowFor(action => action.source?.spell === "burning-hands"), "rows follow prepared spells");
  const dagger = rowFor(action => action.source?.weapon === "dagger" && !action.source.grip);
  handleActionClick({ target: { closest: selector => selector === ".action-row" ? { dataset: { actionId: dagger.id } } : selector === ".remove-action" ? {} : null } });
  refreshGeneratedActions();
  assert(!rowFor(action => action.id === dagger.id) && !rowFor(action => action.source?.weapon === "dagger" && !action.source.grip), "a removed row stays removed");
  character.equipment[0].equipped = false;
  character.equipment[0].container = "carried";
  refreshGeneratedActions();
  assert(!rowFor(action => action.source?.weapon), "unequipping removes the thrown row too");

  // 4: generated feature rows refresh their text after a level-up.
  hero({ classId: "fighter", level: 1 });
  ensureFeatureActions();
  character.level = 3;
  refreshGeneratedActions();
  assert.strictEqual(rowFor(action => action.source?.feature === "second-wind").notes, "Regain 1d10+3 HP.");

  // 6: a thrown attack spends one javelin once per roll; Undo puts it back once.
  hero({ classId: "barbarian", level: 1, equipment: [gear("javelin", { quantity: 4 })] });
  const javelin = weaponActions(character.equipment[0]).find(action => action.source.grip === "thrown");
  rollRequest = {};
  thrownWeaponSpent(character.equipment[0], javelin);
  const undoThrow = thrownWeaponSpent(character.equipment[0], javelin)[0];
  assert.strictEqual(character.equipment[0].quantity, 3, "re-rendering the result doesn't throw another");
  undoThrow.run();
  undoThrow.run();
  assert.strictEqual(character.equipment[0].quantity, 4);
  rollRequest = null;

  // 7/8: Next turn clears the bonus-action spell and says nothing about a reaction while paralyzed.
  hero({ turnCasts: { at: Date.now(), bonusSpell: true }, conditions: ["Paralyzed"], turn: { round: 2 } });
  nextTurn();
  assert.strictEqual(character.turnCasts, null);
  assert(!/reaction is back/.test(lastToast().html) && /paralyzed/.test(lastToast().html));

  // 9: Shield +5 until the next turn and uses the reaction; Barkskin is a floor of 16; spell AC effects stack.
  hero({ classId: "wizard", level: 1, ac: 12, spells: [{ id: "sh", index: "shield", prepared: true }] });
  character.spellSlotUsage = {};
  castSpellRow(character.spells[0]);
  assert.strictEqual(effectiveArmorClass(), 17);
  assert(turnState().reaction, "Shield spends the reaction");
  lastToast().actions.find(action => action.label === "Undo").run();
  lastToast();
  assert.strictEqual(effectiveArmorClass(), 12, "undo removes Shield");
  assert(!turnState().reaction);
  character.effects = { Barkskin: 600 };
  assert.strictEqual(effectiveArmorClass(), 16);
  character.effects = { Barkskin: 600, "Shield of Faith": 100, Shield: 1 };
  assert.strictEqual(effectiveArmorClass(), 19);

  // 14: casting Undo refunds the slot once.
  hero({ classId: "wizard", level: 3, spells: [{ id: "mm", index: "magic-missile", prepared: true }] });
  character.spellSlotUsage = {};
  castSpellRow(character.spells[0]);
  const undoCast = lastToast().actions.find(action => action.label === "Undo");
  undoCast.run();
  undoCast.run();
  assert.strictEqual(Number(character.spellSlotUsage[1] || 0), 0, "a second Undo does nothing");

  // 10: dice that aren't save damage say what they are.
  hero({ classId: "wizard", level: 5 });
  assert.strictEqual(spellEffectRoll({ id: "w", index: "web" }, 2).chip, "2d4 fire if burned");
  assert.strictEqual(spellEffectRoll({ id: "s", index: "sleep" }, 1).chip, "5d8 HP affected");

  // 11: Pass without Trace adds +10 to Stealth, switched on while you concentrate on it.
  hero({ concentration: "Pass without Trace" });
  const pass = rollChips({ kind: "check", ability: "dex", context: "stealth" }).find(chip => chip.id === "pass-without-trace");
  assert(pass && pass.on && pass.formula === "+10");
  assert(!rollChips({ kind: "check", ability: "dex", context: "athletics" }).some(chip => chip.id === "pass-without-trace"));

  // 12/13: a flat roll applies without asking for dice; the dialog's app-roll box is for that roll only.
  prefs.diceMode = "physical";
  hero();
  openRoll({ label: "Goodberry", formula: "1" });
  assert.strictEqual(rollRequest.result?.total, 1, "a flat number rolls itself");
  openRoll({ label: "Hit", formula: "1d20+3" });
  handleRollChange({ target: { checked: true, matches: selector => selector === "[data-roll-digital]" } });
  assert(!physicalRoll() && prefs.diceMode === "physical", "the setting stays physical");

  // 15/17: Bardic Inspiration is spent only when a target is picked; the toast says "holds".
  hero({ classId: "bard", level: 1, abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 16 } });
  characterLibrary.ally = { ...defaultCharacter(), sheetId: "ally", name: "Brak", resources: [] };
  const inspiration = character.resources.find(item => item.name === "Bardic Inspiration");
  CLASS_FEATURE_USES.inspire({ name: "Bardic Inspiration" }, { cost: ["Bardic Inspiration", 1], kind: "inspire" });
  assert.strictEqual(inspiration.current, 3, "nothing spent before picking");
  lastToast().actions.find(action => action.label === "Give to Brak").run();
  assert.strictEqual(inspiration.current, 2);
  assert(/Brak holds a d6/.test(lastToast().html));
  lastToast().actions[0].run();
  assert.strictEqual(inspiration.current, 3);
  assert(!characterLibrary.ally.resources.length, "undo takes the die back");

  // 16: the Arcane Recovery pip opens the slot picker instead of just spending.
  hero({ classId: "wizard", level: 4 });
  character.spellSlotUsage = { 2: 1 };
  const recovery = character.resources.find(item => item.name === "Arcane Recovery");
  handleSideResourceClick({ target: { closest: selector => selector === "[data-res-id]" ? { dataset: { resId: recovery.id } } : selector === "[data-res-pip]" ? { dataset: { resPip: "0" } } : null } });
  assert.strictEqual(recovery.current, 1);
  assert(lastToast().actions.some(action => action.label === "Recover a 2nd"));

  prefs.diceMode = savedMode;
  character = saved;
  characterLibrary = savedLibrary;
  showToast = savedToast;
  rollFromInput = savedRoll;
  saveCharacterLibrary = savedSaveLibrary;
}
// --- p8build checks ---
{
  const saved = { character, characterLibrary, showToast, rollFromInput, persist, persistAndRender, saveCharacterLibrary };
  persist = () => {};
  persistAndRender = () => {};
  saveCharacterLibrary = () => {};
  let toasts = [];
  showToast = (html, options = {}) => { toasts.push({ html, actions: options.actions || [] }); return {}; };
  let rolled = null;
  rollFromInput = (label, formula, mode, actions) => { rolled = { label, formula, actions }; };
  let broke = null;
  breakRule = (id, text, proceed) => { broke = id; return false; };
  const sheet = (classId, level, abilities = {}, extra = {}) => {
    character = { ...defaultCharacter(), sheetId: "p8-me", subclassName: "", subclass: { mode: "custom", officialIndex: "", type: "", sections: [] }, classId, level,
      abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10, ...abilities }, spells: [], resources: [], multiclasses: [], equipment: [], ...extra };
    characterLibrary = { [character.sheetId]: character };
    return character;
  };
  const sub = slug => ({ subclassName: slug, subclass: { mode: "official", officialIndex: slug, sections: [] } });
  const wizard = (fields, picks = {}) => {
    creationDraft = null;
    openCreateDialog();
    Object.assign(creationDraft, { name: "P8", backgroundChosen: true, ...fields });
    Object.assign(creationDraft.picks, picks);
    return creationDraft;
  };

  // 1 / 11 / 12: starting gear is worn and wielded; a blank weapon pick blocks the step; the gaming set is asked once.
  const fighter = wizard({ species: "Human", classId: "fighter", background: "Soldier", step: 4, gear: { mode: "equipment", options: {}, picks: {}, gold: null } }, { "bg-tool-0-0": "Dice set" });
  assert(draftGear().some(item => item.kind === "martial" && !item.name));
  createStepNext();
  assert.strictEqual(fighter.step, 4, "an unanswered martial weapon pick blocks the Equipment step");
  assert(draftGear().some(item => item.name === "Dice set"), "the Soldier's gaming set comes from the Background pick");
  assert(!renderCreateEquipment().includes("Gaming set"), "no second gaming set select");
  fighter.gear.picks["c0-1"] = "Longsword";
  draftGear().filter(item => item.kind && !item.name).forEach(item => { fighter.gear.picks[item.key] = "Longsword"; });
  fighter.step = CREATE_STEP_LABELS.length - 1;
  createStepNext();
  assert.strictEqual(creationDraft, null, "wizard finishes once every pick is made");
  const worn = character.equipment.filter(item => item.equipped);
  assert(worn.some(item => /longsword/i.test(item.name)), "starting weapons are equipped");
  assert.strictEqual(worn.filter(item => /mail|armor/i.test(item.name)).length, 1, "one suit of armor worn");
  assert(worn.filter(item => /shield/i.test(item.name)).length <= 1);
  // 10: bard instruments survive picking a background, and a picked instrument isn't offered twice.
  const bard = wizard({ species: "Human", classId: "bard" }, { "cls-tool-0-0": "Lute" });
  handleCreateStepClick({ target: { closest: selector => selector === "[data-create-option]" ? { dataset: { createOption: "background:Entertainer" } } : null } });
  assert.strictEqual(bard.picks["cls-tool-0-0"], "Lute", "class instrument picks survive choosing a background");
  const classStep = creationSlotsHtml("class");
  assert.strictEqual((classStep.match(/>Lute</g) || []).length, 1, "Lute offered only in the select that picked it");
  // 12: the review lists a replacement skill.
  wizard({ species: "Half-Orc", classId: "fighter", background: "Soldier" }, { "rep-skill-0": "persuasion" });
  assert(renderCreateReview().includes("Persuasion"), "replacement skill shows in the review");
  // 15: wizard cantrip picks skip the High Elf cantrip.
  const elf = wizard({ species: "High Elf", classId: "wizard", speciesCantrip: "prestidigitation" });
  assert(!renderCreateSpells().includes('value="prestidigitation"'), "species cantrip not offered again");
  creationDraft = null;

  // 2: a potion closed with Done isn't used up; drinking it is.
  sheet("fighter", 3, {}, { hp: 5, maxHp: 30 });
  character.equipment = [{ id: "pot", name: "Potion of Healing", quantity: 1, notes: "Potion" }];
  useConsumable("pot");
  assert.strictEqual(character.equipment[0].quantity, 1, "rolling a potion doesn't spend it");
  rolled.actions({ total: 7 })[0].run();
  assert(character.equipment[0].quantity === 0 && character.hp === 12, "Heal me drinks it");
  // 3: catalog adds stack.
  character.equipment = [{ id: "jav", name: "Javelin", quantity: 4 }];
  const catalogSelect = document.querySelector;
  document.querySelector = selector => selector === "#equipmentCatalogSelect" ? { value: "javelin" } : catalogSelect(selector);
  addCatalogEquipment();
  document.querySelector = catalogSelect;
  assert(character.equipment.length === 1 && character.equipment[0].quantity === 5, "same catalog item stacks");
  // 5: coin arithmetic.
  assert.strictEqual(coinValue("15+45", 3), 60);
  assert.strictEqual(coinValue("+45", 15), 60);
  assert.strictEqual(coinValue("-20", 15), 0);
  assert.strictEqual(coinValue("15+", 15), null, "half-typed input keeps the old value");
  // 6: a DM +1 shortsword card attacks like a shortsword with +1.
  const card = { name: "+1 Shortsword", type: "Weapon", magicBonus: 1, notes: \`\${ITEM_CATALOG.find(item => item.index === "shortsword").rarity}: 1d6 piercing, finesse, light. +1 to attack and damage rolls.\`, container: "equipped" };
  const blade = equipmentFromItemCard(card);
  assert.strictEqual(itemMagicBonus(blade), 1);
  assert(weaponActions({ ...blade, name: "Moonblade" }).length, "custom magic weapon makes an attack row");
  // 7: level-up HP tops out at the die + CON.
  sheet("fighter", 1, { con: 14 });
  assert.strictEqual(maxHitDieGain(BUILT_IN_CLASSES.fighter, { classId: "fighter", subclassName: "" }), 12);
  // 8: Lore 6 offers two any-list secrets; a full known list files the new spell there instead of a rule prompt.
  sheet("bard", 5, { cha: 16 }, sub("lore"));
  levelPlan = { target: "primary", subclass: "", choices: [] };
  assert(spellChoicesForLevelChoice("lore", BUILT_IN_CLASSES.bard, 6).some(item => item.index === "counterspell"), "Additional Magical Secrets reaches other lists");
  assert.strictEqual(levelFeatureText("Countercharm, college feature", "lore", 6), "Countercharm, Additional Magical Secrets");
  levelPlan = null;
  character.level = 6;
  character.spells = allSpells.filter(item => item.level === 1 && spellOnClassList(item, "bard")).slice(0, 9).map(item => ({ id: item.index, index: item.index, level: 1, classKey: "primary" }));
  let extra = null;
  broke = null;
  gateNewSpellRow(3, value => { extra = value; });
  assert(extra?.secret === "lore" && !broke, "an open Additional Magical Secrets pick isn't a rule break");
  // 9: expertise needs proficiency and respects the class count.
  sheet("bard", 3, {}, { proficientSkills: ["arcana", "history", "insight"], expertSkills: [] });
  toggleExpertise("stealth");
  assert(!character.expertSkills.includes("stealth") && !character.proficientSkills.includes("stealth"), "no expertise without proficiency");
  toggleExpertise("arcana");
  toggleExpertise("history");
  broke = null;
  toggleExpertise("insight");
  assert(broke === "expertise-limit" && character.expertSkills.length === 2, "bard 3 gets two");
  toggleExpertise("arcana");
  assert(character.proficientSkills.includes("arcana") && !character.expertSkills.includes("arcana"));
  // 13 / 14: Next names the ASI; a chosen subclass hides its placeholder rows.
  sheet("fighter", 3);
  assert.strictEqual(classFeatureRows()[0].next.name, "Ability Score Improvement");
  sheet("druid", 6, {}, sub("moon"));
  assert(!classFeatureRows()[0].reached.some(row => row.name === "Circle Feature"), "no placeholder beside the real Moon features");
  // 15: High Elf species cantrip row: wizard list only.
  sheet("fighter", 1, {}, { species: "High Elf" });
  const elfRow = { id: "e", index: "", level: 0, source: { kind: "species", name: "High Elf", ability: "" } };
  const elfOptions = spellChoices("", 0, elfRow).map(item => item.index);
  assert(elfOptions.includes("fire-bolt") && !elfOptions.includes("eldritch-blast") && !elfOptions.includes("guidance"));
  // 16: personality from the background's table.
  character.background = "Entertainer";
  generatePersonality();
  assert(BACKGROUND_PERSONALITY.Entertainer.traits.includes(character.backgroundDetails.trait));
  // 18 / 19 / 20: Savant halves copying; short purse refuses; a held scroll's spell can be copied.
  sheet("wizard", 3, { int: 16 }, sub("divination"));
  assert.deepStrictEqual(spellbookCopyCost("see-invisibility", 2), { gp: 50, hours: 2, savant: true });
  assert.strictEqual(spellbookCopyCost("misty-step", 2).gp, 100);
  character.currency.gp = 40;
  assert.strictEqual(paySpellbookCopy(50, "See Invisibility"), false);
  assert.strictEqual(character.currency.gp, 40, "a short purse isn't emptied");
  character.equipment = [{ id: "scroll", name: "Spell Scroll (See Invisibility)", quantity: 1, grantSpell: "see-invisibility" }];
  character.spells = [{ id: "s", index: "see-invisibility", level: 2, itemId: "scroll" }];
  assert(spellChoices("", 2, { id: "n", index: "", level: 2, classKey: "primary" }).some(item => item.index === "see-invisibility"), "scroll spell can go in the spellbook");
  toasts = [];
  offerSpellbookCopy({ id: "n", index: "see-invisibility", level: 2, classKey: "primary" }, 2);
  toasts[0].actions.find(action => /used up/.test(action.label)).run();
  assert(!character.equipment.length, "copying uses up the scroll");

  ({ character, characterLibrary, showToast, rollFromInput, persist, persistAndRender, saveCharacterLibrary } = saved);
}

// --- Expert Divination ---
{
  const saved = character, savedToast = showToast;
  let toast = null;
  showToast = (html, options = {}) => { toast = { html, actions: options.actions || [] }; return {}; };
  character = normalizeCharacter({ classId: "wizard", level: 6, subclassName: "Divination", subclass: { mode: "official", officialIndex: "divination", sections: [] },
    abilities: { str: 8, dex: 14, con: 14, int: 18, wis: 12, cha: 10 }, spellSlotUsage: { 1: 2 },
    spells: [{ id: "si", index: "see-invisibility", level: 2, prepared: true, classKey: "primary" }] });
  castSpellRow(character.spells[0], { concentration: true, metamagic: [], turn: true }, 2, "slots");
  const regain = (toast?.actions || []).find(action => /Expert Divination: regain a 1st-level slot/.test(action.label));
  assert(regain, "Expert Divination offers a lower slot after a 2nd-level divination spell");
  regain.run();
  assert.strictEqual(character.spellSlotUsage[1], 1);
  character = saved;
  showToast = savedToast;
}

// --- p9spells checks ---
{
  const saved = { character, characterLibrary, showToast, rollFromInput, openRoll, persist, persistAndRender, saveCharacterLibrary, healBy };
  let toasts = [];
  showToast = (html, options = {}) => { toasts.push({ html, actions: options.actions || [] }); return {}; };
  persist = () => {};
  persistAndRender = () => {};
  saveCharacterLibrary = () => {};
  const sub = slug => ({ subclassName: slug, subclass: { mode: "official", officialIndex: slug, sections: [] } });
  const make = (id, fields) => normalizeCharacter({ ...defaultCharacter(), sheetId: id, name: id, hp: 10, maxHp: 10, ...fields });

  // 20: Wild Shape picker honours CR and movement limits (Moon uses its own CR), and fills the form.
  character = make("dru", { classId: "druid", level: 2, abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 16, cha: 10 } });
  let beasts = wildShapeBeasts();
  assert(beasts.length && beasts.every(beast => beast.cr <= 0.25 && !beast.speed.swim && !beast.speed.fly), "druid 2: CR 1/4, no swim/fly");
  assert(beasts.some(beast => beast.index === "wolf") && !beasts.some(beast => beast.index === "crab"));
  character = make("moon", { classId: "druid", level: 5, ...sub("moon") });
  beasts = wildShapeBeasts("bear");
  assert(beasts.some(beast => beast.index === "brown-bear") && !beasts.some(beast => beast.index === "polar-bear"), "Moon 5: CR 1");
  assert(!wildShapeBeasts().some(beast => beast.speed.fly) && wildShapeBeasts().some(beast => beast.speed.swim), "druid 5: swim yes, fly no");
  character.wildShape = { name: "Beast form", hp: 0, max: 0 };
  applyBeastForm("brown-bear");
  assert.deepStrictEqual([character.wildShape.max, character.wildShape.hp, character.wildShape.ac, character.wildShape.str, character.wildShape.speed], [34, 34, 11, 19, 40]);
  assert.deepStrictEqual(beastAttacks(character.wildShape).map(item => [item.name, item.attack, item.damage]), [["Bite", "+5", "1d8+4 piercing"], ["Claws", "+5", "2d6+4 slashing"]]);
  assert.strictEqual(beastAttacks({ attacks: "Talons +3 1 slashing" }).length, 1, "flat damage parses");

  // 26: heal lists put downed allies first, then most missing; full HP stays listed but disabled.
  const healer = make("healer", { classId: "cleric", level: 1 });
  const full = make("full", {});
  const hurt = make("hurt", { hp: 7 });
  const scratched = make("scratched", { hp: 9 });
  const downed = make("downed", { hp: 0 });
  const outside = make("outside", { hp: 1, inParty: false });
  characterLibrary = { healer, full, hurt, scratched, downed, outside };
  character = healer;
  const heals = healButtons(4).slice(1);
  assert.deepStrictEqual(heals.map(item => item.label), ["Heal downed +4 (down)", "Heal hurt +4", "Heal scratched +4", "Heal full +4 (full HP)"]);
  assert.deepStrictEqual(heals.map(item => Boolean(item.disabled)), [false, false, false, true]);

  // 25: the bard gives Song of Rest to each ally once per rest.
  const bard = make("bard", { classId: "bard", level: 5, shortRestAt: 1000 });
  characterLibrary = { bard, hurt, downed, full };
  character = bard;
  hurt.songOfRestAt = 2000;
  toasts = [];
  let songRoll = null;
  rollFromInput = (label, formula, mode, actions, detail, onResult) => { songRoll = { formula, onResult }; };
  songOfRestMenu();
  const song = toasts[0].actions;
  assert(song.find(item => /^hurt/.test(item.label)).disabled && /had it this rest/.test(song.find(item => /^hurt/.test(item.label)).label));
  song.find(item => /^downed/.test(item.label)).run();
  assert.strictEqual(songRoll.formula, "1d6");
  songRoll.onResult({ total: 4, formula: "1d6" });
  assert.strictEqual(downed.hp, 4);
  assert(Number(downed.songOfRestAt) >= 1000, "marked as served this rest");

  // 24: tapping a portent die uses it.
  character = make("seer", { classId: "wizard", level: 2, ...sub("divination"), portentDice: [13, 6], resources: [{ id: "p", name: "Portent", current: 2, max: 2, reset: "long" }] });
  usePortentDie(0);
  assert.deepStrictEqual(character.portentDice, [6]);
  assert.strictEqual(character.resources[0].current, 1);

  // 21: goodberries: ten in the pack, eating heals 1, spoiled after 24 h and gone on a long rest.
  character = make("dru2", { classId: "druid", level: 3, hp: 5, maxHp: 20, equipment: [] });
  const extras = [];
  const previous = {};
  spellCastExtras({ index: "goodberry" }, previous, extras);
  const berries = character.equipment[0];
  assert.strictEqual(berries.quantity, 10);
  assert.deepStrictEqual(previous.equipment, [], "undo restores the pack without berries");
  healBy = amount => { character.hp += amount; return true; };
  eatGoodberry(berries);
  assert.strictEqual(berries.quantity, 9);
  assert.strictEqual(character.hp, 6);
  assert(!berriesSpoiled(berries) && berriesSpoiled(berries, berries.castAt + 24 * 3600 * 1000));
  berries.castAt -= 25 * 3600 * 1000;
  assert.strictEqual(takeGoodberry(berries), false, "spoiled berries can't be eaten");
  assert(/Spoiled/.test(equipmentItemActions(berries)));
  takeRest("long", { food: true });
  assert(!character.equipment.some(item => item.goodberry), "spoiled berries leave on a long rest");

  // 22: familiar: cast, pick a form, 0 HP = gone, recast brings it back; incense costs 10 gp.
  character = make("fam", { classId: "wizard", level: 1, currency: { cp: 0, sp: 0, ep: 0, gp: 15, pp: 0 } });
  assert.strictEqual(spellCastExtras({ index: "find-familiar" }, {}, [])[0].label, "Pay 10 gp for incense");
  assert(!familiarForms().some(([value]) => value === "Imp"), "imp is chain-only");
  setFamiliarForm("owl");
  assert.deepStrictEqual([character.familiar.hp, character.familiar.max], [1, 1]);
  changeFamiliarHp(-3);
  assert(character.familiar.gone && character.familiar.hp === 0);
  spellCastExtras({ index: "find-familiar" }, {}, []);
  assert(!character.familiar.gone && character.familiar.hp === 1 && character.familiar.form === "owl");
  payFamiliarIncense();
  payFamiliarIncense();
  assert.strictEqual(character.currency.gp, 5, "second payment refused");
  character.classChoices = { ...(character.classChoices || {}), pactBoon: "chain" };
  character.multiclasses = [{ classId: "warlock", level: 3 }];
  assert.strictEqual(familiarForms().filter(([value]) => CHAIN_FAMILIARS.includes(value)).length, 4, "Pact of the Chain adds imp, pseudodragon, quasit, sprite");

  // 23: copying from a scroll: DC 10 + level, pays on success, scroll gone either way; a re-run flips cleanly.
  character = make("scribe", { classId: "wizard", level: 3, abilities: { str: 10, dex: 10, con: 10, int: 16, wis: 10, cha: 10 }, currency: { cp: 0, sp: 0, ep: 0, gp: 120, pp: 0 },
    equipment: [{ id: "sc", name: "Spell Scroll (Misty Step)", quantity: 1, grantSpell: "misty-step" }], spells: [] });
  assert(canCopyScroll(character.equipment[0]));
  let request = null;
  openRoll = req => { request = req; };
  copyScrollIntoSpellbook(character.equipment[0]);
  assert(/DC 12/.test(request.label));
  assert(/Copied/.test(request.onResult({ total: 12 })));
  assert.strictEqual(character.currency.gp, 20);
  assert(character.spells.some(row => row.index === "misty-step" && !row.itemId));
  assert(!character.equipment.length, "scroll destroyed");
  request.onResult({ total: 11 });
  assert.strictEqual(character.currency.gp, 120, "a lowered roll refunds the copy");
  assert(!character.spells.some(row => row.index === "misty-step"));
  character.equipment = [{ id: "sc2", name: "Spell Scroll (Fireball)", quantity: 1, grantSpell: "fireball" }];
  request = null;
  toasts = [];
  copyScrollIntoSpellbook(character.equipment[0]);
  assert(!request && /3rd-level/.test(toasts[0].html), "level above your slots is refused before rolling");

  Object.assign(globalThis, saved);
  ({ character, characterLibrary, showToast, rollFromInput, openRoll, persist, persistAndRender, saveCharacterLibrary, healBy } = saved);
}

// --- p9build checks ---
{
  const saved = { character, characterLibrary, showToast, persist, persistAndRender };
  let toasts = [];
  showToast = (html, options = {}) => { toasts.push({ html, actions: options.actions || [] }); return {}; };
  persist = () => {};
  persistAndRender = () => {};
  const sheet = (classId, level, abilities = {}, extra = {}) => {
    character = normalizeCharacter({ ...defaultCharacter(), sheetId: "p9-me", subclassName: "", subclass: { mode: "custom", officialIndex: "", type: "", sections: [] }, classId, level,
      abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10, ...abilities }, spells: [], resources: [], multiclasses: [], equipment: [], proficientSkills: [], expertSkills: [], ...extra });
    characterLibrary = { [character.sheetId]: character };
    return character;
  };
  const plan = fields => { levelPlan = { target: "primary", newClassId: "", newRules: "2014", subclass: "", choices: [], asiPicks: ["str", "str"], feat: { name: "" }, classChoices: structuredCloneSafe(character.classChoices), ...fields }; return levelPlan; };

  // 13: the class levelled last is remembered and preselected.
  sheet("fighter", 3, { str: 15, con: 14 }, { multiclasses: [{ id: "mc1", classId: "barbarian", level: 2 }] });
  plan({ target: "mc1" });
  commitLevelUp(levelTarget(), { hp: 7 });
  assert.strictEqual(character.lastLevelClass, "mc1");
  openLevelDialog();
  assert.strictEqual(levelPlan.target, "mc1", "level-up dialog defaults to the class levelled last");
  character.lastLevelClass = "gone";
  openLevelDialog();
  assert.strictEqual(levelPlan.target, "primary", "a removed class falls back to the first class");
  levelPlan = null;

  // 14: Lore bard 3 picks Bonus Proficiencies and Expertise in the dialog; rogue 6 and Scout get theirs.
  sheet("bard", 2, { cha: 16 }, { proficientSkills: ["persuasion", "performance", "deception"] });
  plan({ subclass: "lore" });
  assert.deepStrictEqual(levelSkillGroups().map(group => [group.key, group.count]), [["lore", 3], ["expertise", 2]]);
  levelPlan.skillPicks = { lore: ["stealth", "perception", "arcana"], expertise: ["stealth", "persuasion"] };
  assert(levelSkillGroups().find(group => group.key === "expertise").options.includes("stealth"), "a skill picked this level can take expertise");
  commitLevelUp(levelTarget(), { hp: 5 });
  assert(["stealth", "perception", "arcana"].every(id => character.proficientSkills.includes(id)));
  assert.deepStrictEqual(character.expertSkills, ["stealth", "persuasion"]);
  sheet("rogue", 5, {}, { proficientSkills: ["stealth", "acrobatics", "insight", "perception"], expertSkills: ["stealth", "acrobatics"] });
  plan({});
  assert.deepStrictEqual(levelSkillGroups().map(group => [group.key, group.count]), [["expertise", 2]], "rogue 6: two more expertise");
  sheet("rogue", 2, {}, { proficientSkills: ["stealth"], expertSkills: ["stealth"] });
  plan({ subclass: "scout" });
  commitLevelUp(levelTarget(), { hp: 5 });
  assert(["nature", "survival"].every(id => character.proficientSkills.includes(id) && character.expertSkills.includes(id)), "Survivalist");
  sheet("cleric", 3);
  plan({});
  assert.strictEqual(levelSkillGroups().length, 0, "no skill picks for a cleric 4");
  assert.strictEqual(classExpertise("bard", 10) - classExpertise("bard", 9), 2);
  character.identityLocked = true;
  goToTarget("#skills");
  assert.strictEqual(character.identityLocked, false, "checklist Go for skills opens Edit mode");

  // 15: feature summaries, ASI result, and new spellbook spells prepared only when ticked.
  sheet("wizard", 1, { int: 16 });
  plan({ subclass: "divination" });
  const gained = levelFeaturesGained();
  assert(gained.some(row => row.name === "Portent" && row.summary) && gained.some(row => row.name === "Divination Savant"), "subclass features with summaries");
  assert.strictEqual(levelAsiResultText(["int", "int"]), "INT 16 → 18 (+4)");
  assert.strictEqual(levelAsiResultText(["int", "con"]), "CON 10 → 11 (+0) · INT 16 → 17 (+3)");
  levelPlan.choices = [{ id: "a", index: "shield", prepare: false }, { id: "b", index: "sleep", prepare: true }];
  commitLevelUp(levelTarget(), { hp: 4 });
  const byIndex = index => character.spells.find(row => row.index === index);
  assert(!byIndex("shield").prepared && byIndex("sleep").prepared, "only ticked spells are prepared");
  assert(!("prepare" in byIndex("sleep")), "the checkbox flag isn't stored");

  // 19: known casters get the swap step; prepared casters don't. Long rest offers re-preparing to prepared casters only.
  const createElement = document.createElement;
  const node = () => ({ querySelector: () => node(), querySelectorAll: () => [node(), node()], addEventListener() {}, appendChild() {}, insertAdjacentHTML() {} });
  document.createElement = node;
  sheet("sorcerer", 3, { cha: 16 }, { spells: [{ id: "k1", index: "shield", level: 1, classKey: "primary" }] });
  plan({});
  renderLevelSummaryAndChoices();
  assert(levelPlan.replace, "sorcerer level-up offers a known-spell swap");
  sheet("cleric", 3, { wis: 16 }, { spells: [{ id: "c1", index: "bless", level: 1, classKey: "primary" }] });
  plan({});
  renderLevelSummaryAndChoices();
  assert.strictEqual(levelPlan.replace, null, "no swap step for a prepared caster");
  document.createElement = createElement;
  levelPlan = null;
  toasts = [];
  takeRest("long", { food: true });
  assert(toasts.at(-1).actions.some(action => action.label === "Change prepared spells"));
  sheet("sorcerer", 3, { cha: 16 }, { hp: 10, maxHp: 20 });
  toasts = [];
  takeRest("long", { food: true });
  assert(!toasts.at(-1).actions.some(action => action.label === "Change prepared spells"), "known casters don't get the prompt");

  // 16: creation ability cards show the final score with the species bonus.
  creationDraft = { ...blankCreationDraft(), species: "High Elf", abilities: { str: 8, dex: 14, con: 13, int: 15, wis: 12, cha: 10 } };
  assert.strictEqual(createAbilityScoreText("dex"), "16 (14 + 2) · +3");
  assert.strictEqual(createAbilityScoreText("str"), \`8 · \${formatMod(-1)}\`, "no bonus: just the score");
  creationDraft = null;

  // 18: focus forms; a staff is a quarterstaff that attacks.
  const [staff] = resolveGear(["Arcane Focus"], "c1", { "c1-0": "Staff" });
  const staffRow = focusGearRow(staff).row;
  assert(staffRow.name === "Quarterstaff (arcane focus)" && weaponActions(staffRow).length, "staff focus is a quarterstaff");
  assert.strictEqual(focusGearRow(resolveGear(["Holy Symbol"], "b", { "b-0": "Amulet" })[0]).row.name, "Holy Symbol (amulet)");
  assert.strictEqual(focusGearRow(resolveGear(["Druidic Focus"], "c2", {})[0]).row.name, "Druidic Focus", "form left for later");

  // 17: Half-Orc traits as feature rows.
  sheet("barbarian", 1, {}, { species: "Half-Orc" });
  const traits = speciesTraitRows().map(row => row.name);
  ["Darkvision", "Relentless Endurance", "Savage Attacks", "Menacing"].forEach(name => assert(traits.includes(name), "Half-Orc trait " + name));
  assert(speciesTraitRows().every(row => row.summary), "PHB traits all have summaries");
  character.species = "Drow";
  assert(/120 feet/.test(speciesTraitRows().find(row => row.name === "Darkvision").summary));

  // 28: one equip control; old "Equipped" container rows migrate.
  const old = normalizeCharacter({ equipment: [{ id: "x", name: "Longsword", container: "equipped", equipped: false }] }).equipment[0];
  assert(old.equipped && old.container === "carried");
  const sent = equipmentFromItemCard({ name: "Cloak", container: "equipped" });
  assert(sent.equipped && sent.container === "carried");

  // 29: journal entries are cleaned, newest first, and searchable.
  const journal = normalizeCharacter({ journal: [{ id: "a", date: "2026-09-01", title: "Day 1: Ashen Ford", body: "x" }, { id: "b", date: "bad", title: 5 }, null] }).journal;
  assert(journal.length === 2 && journal[1].date === "" && journal[1].title === "5");
  character.journal = [{ id: "a", date: "2026-09-01", title: "Old" }, { id: "b", date: "2026-10-01", title: "New" }];
  assert.deepStrictEqual(sortedJournal().map(entry => entry.id), ["b", "a"]);
  addJournalEntry();
  assert.strictEqual(character.journal[0].date, localDateText());

  ({ character, characterLibrary, showToast, persist, persistAndRender } = saved);
}

// --- p9party checks ---
{
  const saved = character, savedLibrary = characterLibrary, savedToast = showToast, savedSave = saveCharacterLibrary, savedRender = renderAll;
  let toasts = [];
  showToast = (html, options = {}) => { toasts.push({ html, actions: options.actions || [] }); return {}; };
  saveCharacterLibrary = () => {};
  renderAll = () => {};
  const sheet = (id, extra) => normalizeCharacter({ ...defaultCharacter(), sheetId: id, name: id, hp: 20, maxHp: 20, ac: 12, conditions: [], ...extra });
  const dm = sheet("Matt", { ac: 15 });
  const tief = sheet("Tief", { species: "Tiefling", tempHp: 3, concentration: "Bless", ac: 18 });
  const druid = sheet("Druid", { wildShape: { name: "Wolf", hp: 5, max: 11 } });
  const down = sheet("Down", { hp: 0, conditions: ["Unconscious", "Prone"] });
  characterLibrary = { Matt: dm, Tief: tief, Druid: druid, Down: down };
  character = dm;
  // 32: party-card damage uses the target's resistance, temp HP and concentration; the log names who did it.
  damageOther("Tief", 10, "fire");
  assert.strictEqual(characterLibrary.Tief.hp, 18, "10 fire halved to 5 by Tiefling resistance, 3 soaked by temp HP");
  assert.strictEqual(characterLibrary.Tief.tempHp, 0);
  assert.deepStrictEqual(characterLibrary.Tief.pendingConcentration, [10], "concentration save owed after damage");
  assert.deepStrictEqual(concentrationSavesOwed(characterLibrary.Tief), [10]);
  assert.strictEqual(characterLibrary.Tief.activity[0].text, "Matt dealt you 5 fire damage (resisted)");
  // Wild Shape HP take the hit first; the overflow reaches the druid's own HP.
  damageOther("Druid", 8);
  assert.strictEqual(characterLibrary.Druid.wildShape, null);
  assert.strictEqual(characterLibrary.Druid.hp, 17);
  // At 0 HP: one death save failure; damage of the HP maximum or more is instant death.
  damageOther("Down", 4);
  assert.strictEqual(characterLibrary.Down.deathSaveFailures, 1);
  damageOther("Down", 20);
  assert(isDead(characterLibrary.Down), "massive damage at 0 HP kills");
  damageOther("Tief", 25);
  assert(characterLibrary.Tief.hp === 0 && characterLibrary.Tief.conditions.includes("Unconscious") && !characterLibrary.Tief.concentration, "drop to 0: unconscious, concentration ends");
  // Heal, Inspiration (no stacking by RAW) and conditions from the card.
  healOther("Tief", 7);
  assert.strictEqual(characterLibrary.Tief.activity[0].text, "Matt healed you 7 HP", characterLibrary.Tief.activity[0].text);
  characterLibrary.Druid.optionalRules = { ...characterLibrary.Druid.optionalRules, stackingInspiration: false };
  giveSheetInspiration("Druid");
  giveSheetInspiration("Druid");
  assert.strictEqual(characterLibrary.Druid.inspiration, 1);
  assert.strictEqual(characterLibrary.Druid.activity[0].text, "You gained Inspiration from Matt");
  toggleSheetCondition("Druid", "Prone");
  assert(characterLibrary.Druid.conditions.includes("Prone"));
  characterLibrary.Druid.conditionSaves = { Prone: { source: "Shove" } };
  toggleSheetCondition("Druid", "Prone");
  assert(!characterLibrary.Druid.conditions.includes("Prone") && !characterLibrary.Druid.conditionSaves.Prone);
  assert(characterLibrary.Druid.activity.length <= 20);
  // 33: entries that arrive from another tab toast on the open sheet; ones made here don't.
  character = characterLibrary.Druid;
  toasts = [];
  renderSheetActivity();
  assert.strictEqual(toasts.length, 0, "no toasts for the existing log");
  character = normalizeCharacter({ ...character, activity: [{ id: "x1", at: Date.now(), who: "DM", text: "DM healed you 3 HP" }, ...character.activity] });
  renderSheetActivity();
  assert(toasts.length === 1 && /DM healed you 3 HP/.test(toasts[0].html), "a new entry from elsewhere shows a toast");
  assert.strictEqual(sheetChangeText(sheetVitals({ hp: 5, inspiration: 0, conditions: [] }), { hp: 5, tempHp: 4, inspiration: 1, conditions: ["Prone"], equipment: [{ id: "p", name: "Potion" }] }, "DM"),
    "DM gave you 4 temp HP. You gained Inspiration from DM. DM applied Prone. DM sent you Potion");
  // 34: condition source tags, summary totals, the concentration queue travels with the sheet.
  assert.strictEqual(partyConditionTag({ conditionSaves: { Paralyzed: { source: "Hold Person", ability: "wis", dc: 14, when: "end" } } }, "Paralyzed"), " (Hold Person, WIS save DC 14, end of each turn)");
  assert.strictEqual(partyConditionTag({}, "Paralyzed"), "");
  const stats = partySummaryStats([dm, sheet("A", { ac: 10 }), sheet("B", { ac: 17, proficientSkills: ["perception"] })]);
  assert(stats.lowestAc === 10 && stats.lowestAcName === "A" && stats.averageAc === 14 && stats.bestPerceptionName === "B", JSON.stringify(stats));
  const passives = partyPassives(sheet("C", { proficientSkills: [], expertSkills: [], abilities: { str: 10, dex: 10, con: 10, int: 14, wis: 12, cha: 10 } }));
  assert(passives.investigation === 12 && passives.insight === 11 && passives.perception === 11, JSON.stringify(passives));
  character = sheet("Conc", { concentration: "Bless" });
  pendingConcentrationDcs = [12];
  pendingConcentrationOwner = character;
  assert.deepStrictEqual(concentrationQueue(), [12], "persist writes the open sheet's saves owed");
  character = sheet("Other", { concentration: "Haste", pendingConcentration: [15] });
  renderConcentrationPrompt();
  assert.deepStrictEqual(pendingConcentrationDcs, [15], "switching sheets adopts that sheet's queue");
  pendingConcentrationDcs = [];
  // 37: every bundled spell is searchable with its details; new rules entries are present.
  assert.strictEqual(spellLookupRules().length, LOCAL_SPELLS.length);
  const hold = spellLookupRules().find(entry => entry.title === "Hold Person");
  assert(/2nd-level enchantment/.test(hold.meta) && /Concentration, up to 1 minute/.test(hold.meta) && /Wizard/.test(hold.meta) && /paralyzed/.test(hold.body), hold.meta);
  ["Inspiration", "Passive Checks", "Group Checks", "Massive Damage", "Potions of Healing", "Escaping a Grapple", "Hiding and Unseen Attackers", "Help", "Ready", "Dash", "Disengage"]
    .forEach(title => assert(RULES_REFERENCE.some(entry => entry.title === title), "missing rule: " + title));
  // 38: the item-card recipient defaults to the viewed party member, else the first party member.
  const targets = [{ id: "local:npc", sheet: { sheetId: "npc", inParty: false } }, { id: "local:p1", sheet: { sheetId: "p1" } }, { id: "local:p2", sheet: { sheetId: "p2" } }];
  character = { sheetId: "p2" };
  itemCardRecipient = "";
  assert.strictEqual(preferredItemTarget(targets).id, "local:p2");
  character = { sheetId: "npc" };
  assert.strictEqual(preferredItemTarget(targets).id, "local:p1");
  itemCardRecipient = "npc";
  assert.strictEqual(preferredItemTarget(targets).id, "local:npc", "a party card's Send item picks that sheet");
  itemCardRecipient = "";
  character = saved;
  characterLibrary = savedLibrary;
  showToast = savedToast;
  saveCharacterLibrary = savedSave;
  renderAll = savedRender;
}

// --- p9combat checks ---
{
  const saved = { character, characterLibrary, showToast, openRoll, rollDie, persist, saveCharacterLibrary };
  if (typeof prefs === "undefined") globalThis.prefs = {};
  persist = () => {};
  saveCharacterLibrary = () => {};
  let toasts = [];
  showToast = (html, options = {}) => { toasts.push({ html, actions: options.actions || [], persist: Boolean(options.persist) }); return {}; };
  const lastToast = () => toasts[toasts.length - 1];
  let opened = null;
  openRoll = request => { opened = request; };
  const gear = (index, extra = {}) => {
    const card = ITEM_CATALOG.find(item => item.index === index);
    return { id: index, name: card.name, notes: [card.type, card.rarity, card.notes].join(" - "), quantity: 1, equipped: true, attuned: true, container: "equipped", ...extra };
  };
  const hero = (over = {}) => {
    character = normalizeCharacter({ name: "T", sheetId: "p9-me", classId: "fighter", level: 1, subclassName: "", subclass: { mode: "custom", officialIndex: "", sections: [] }, resources: [], classOptions: [], equipment: [], actions: [], conditions: [], spells: [], backgroundDetails: {}, abilities: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 16 }, ...over });
    characterLibrary = { [character.sheetId]: character };
    ensureClassResources();
    return character;
  };
  const click = (row, selector) => ({ target: { closest: sel => sel === ".action-row" ? { dataset: { actionId: row.id } } : sel === selector ? {} : null } });

  // 1: markers. Action Surge adds an action; a second bonus action warns; Next turn clears them.
  hero({ level: 2 });
  ensureFeatureActions();
  startCombat();
  const surge = character.actions.find(action => action.source?.feature === "action-surge");
  const wind = character.actions.find(action => action.source?.feature === "second-wind");
  handleActionClick(click(surge, ".use-action"));
  markTurnCost("Action");
  assert(/Action 1\\/2/.test(turnEconomyHtml(turnState())), "Action Surge makes it 1 of 2");
  markTurnCost("Action");
  assert(/data-used="true">Action 2\\/2/.test(turnEconomyHtml(turnState())));
  handleActionClick(click(wind, ".use-action"));
  assert.strictEqual(turnState().bonus, 1);
  const before = toasts.length;
  markTurnCost("Bonus Action");
  assert(toasts.slice(before).some(toast => /Second bonus action/.test(toast.html)), "a second bonus action warns");
  nextTurn();
  assert(!turnState().actions && !turnState().bonus && !turnState().extraActions, "Next turn clears the markers");
  // A bonus-action spell fills the Bonus marker (undo puts it back).
  hero({ classId: "cleric", level: 1, spells: [{ id: "hw", index: "healing-word", prepared: true }] });
  character.spellSlotUsage = {};
  startCombat();
  castSpellRow(character.spells[0], { metamagic: [] });
  assert.strictEqual(turnState().bonus, 1, "Healing Word is a bonus action");

  // 2: save ends. Hold Person -> Paralyzed, WIS DC 11 at the end of each turn.
  hero({ conditions: ["Paralyzed"], conditionSaves: { Paralyzed: { source: "Hold Person", ability: "wis", dc: 11, when: "end" } } });
  startCombat();
  assert.strictEqual(conditionTagText("Paralyzed"), "Hold Person, WIS DC 11, end of each turn");
  nextTurn();
  const resave = lastToast().actions.find(action => /WIS save DC 11 vs Paralyzed/.test(action.label));
  assert(resave && lastToast().persist, "Next turn offers the repeat save and waits");
  resave.run();
  assert(/DC 11/.test(opened.label) && opened.ability === "wis");
  opened.onResult({ total: 10 });
  assert(character.conditions.includes("Paralyzed"), "a 10 fails");
  opened.onResult({ total: 11 });
  assert(!character.conditions.includes("Paralyzed"), "an 11 ends it");
  // When damaged: the damage prompts it too.
  hero({ hp: 20, maxHp: 20, conditions: ["Incapacitated"], conditionSaves: { Incapacitated: { ability: "wis", dc: 13, when: "end-damage" } } });
  dealDamage(3);
  assert(toasts.some(toast => toast.actions.some(action => /^Damaged: WIS save DC 13 vs Incapacitated/.test(action.label))));
  // Re-adding a condition drops the old tag.
  handleConditionClick({ target: { closest: sel => sel === "[data-condition]" ? { dataset: { condition: "Incapacitated" } } : null } });
  handleConditionClick({ target: { closest: sel => sel === "[data-condition]" ? { dataset: { condition: "Incapacitated" } } : null } });
  assert(!conditionTag("Incapacitated"), "a fresh condition starts untagged");

  // 3: Next turn at 0 HP offers the death save.
  hero({ hp: 0, maxHp: 12, deathSaveFailures: 0, deathSaveSuccesses: 0, stable: false });
  startCombat();
  nextTurn();
  assert.strictEqual(lastToast().actions[0].label, "Roll death save");
  character.stable = true;
  nextTurn();
  assert(!lastToast().actions.some(action => action.label === "Roll death save"), "a stable character doesn't roll");

  // 5: damage while concentrating opens the save at once; the DC stays queued until the roll lands.
  hero({ hp: 30, maxHp: 30, concentration: "Bless" });
  document.querySelector("#rollDialog").open = false;
  pendingConcentrationDcs = [];
  opened = null;
  dealDamage(8);
  assert(/Concentration save \\(DC 10\\)/.test(opened?.label || ""), "the concentration roll opens");
  assert.deepStrictEqual(pendingConcentrationDcs, [10]);
  delete document.querySelector("#rollDialog").open;
  dealDamage(30 - 8 - 1);
  assert.deepStrictEqual(pendingConcentrationDcs, [10, 10], "a second hit with the window open queues");
  opened.onResult({ total: 12 });
  assert.deepStrictEqual(pendingConcentrationDcs, [10]);

  // 7: Champion crit range on the attack button.
  hero({ level: 3, subclass: { mode: "official", officialIndex: "champion", sections: [] }, subclassName: "champion", equipment: [gear("longsword")] });
  const sword = weaponActions(character.equipment[0])[0];
  const node = document.querySelector(".action-row");
  syncActionButtons(node, sword);
  assert.strictEqual(node.querySelector(".roll-attack").textContent, "Attack · crit 19–20");

  // 8: GWF rerolls are listed; extra crit dice are named; physical damage dice are typed per die.
  let faces = [1, 5, 6];
  rollDie = () => faces.shift();
  assert.deepStrictEqual(evaluateRoll("2d6r2").notes, ["Great Weapon Fighting: 1 → 5"]);
  rollDie = saved.rollDie;
  hero({ classId: "barbarian", level: 9, species: "Half-Orc" });
  const crit = damageRollDetail({ melee: true }, true, "1d12r2+3");
  assert(/\\+1d12 Savage Attacks/.test(crit) && /\\+1d12 Brutal Critical/.test(crit), crit);
  assert(physicalPerDie({ count: 2 }) && !physicalPerDie({ count: 20 }));
  assert.strictEqual(evaluateRoll("20d6", "normal", { 0: [70] }).total, 70, "big pools stay one total");

  // 9: Berserker Rage asks first; the card shows frenzy and rounds left.
  hero({ classId: "barbarian", level: 3, subclass: { mode: "official", officialIndex: "berserker", sections: [] }, subclassName: "berserker" });
  ensureFeatureActions();
  const rageRow = character.actions.find(action => action.source?.feature === "rage");
  useFeatureAction(rageRow);
  assert(!character.raging && lastToast().persist, "nothing happens before the choice");
  lastToast().actions.find(action => action.label === "Rage + Frenzy").run();
  assert(character.raging && character.frenzied);
  assert(/Frenzy/.test(rageCardHtml(turnState())) && /10 of 10 rounds left/.test(rageCardHtml(turnState())));

  // 10: advantage hints become chips that switch on advantage.
  hero({ species: "Rock Gnome" });
  const gnome = { kind: "save", ability: "int" };
  assert(/data-roll-hint="Gnome Cunning"/.test(advantageHintChips(gnome)));
  assert.strictEqual(advantageHintName({ kind: "save" }, "Frightened only gives disadvantage while the source of your fear is in sight."), "");
  assert.strictEqual(rollModeFor("save", "int", "", { advantageFrom: ["Gnome Cunning"] }).mode, "advantage");

  // 11: named parts instead of "other bonuses".
  hero({ classId: "bard", level: 2, abilities: { str: 10, dex: 14, con: 10, int: 10, wis: 10, cha: 16 } });
  assert.strictEqual(rollModifierText({ formula: "1d20" + formatMod(initiativeBonus()), kind: "check", ability: "dex", context: "initiative" }), "+3 (DEX +2, Jack of All Trades +1)");
  hero({ classId: "paladin", level: 6, saveProficiencies: ["wis", "cha"], equipment: [gear("cloak-of-protection")] });
  const wisSave = rollModifierText({ formula: "1d20" + formatMod(saveBonus("wis")), kind: "save", ability: "wis" });
  assert(/WIS \\+1, proficiency \\+3, Cloak of Protection \\+1, Aura of Protection \\+3\\)$/.test(wisSave), wisSave);

  // 12 + 4: the cast toast names the save, DC and rider, and waits because it offers rolls.
  hero({ classId: "bard", level: 5, abilities: { str: 10, dex: 14, con: 10, int: 10, wis: 10, cha: 18 }, spells: [{ id: "vm", index: "vicious-mockery", prepared: true }] });
  castSpellRow(character.spells[0], { metamagic: [] });
  assert(/WIS save DC 15; on a fail the target has disadvantage on its next attack roll/.test(lastToast().html), lastToast().html);
  assert(lastToast().persist, "the cast toast waits for its roll buttons");
  assert.strictEqual(spellCastReminder({ index: "fireball" }), "DEX save DC 15; half damage on a success");

  pendingConcentrationDcs = [];
  character = saved.character;
  characterLibrary = saved.characterLibrary;
  showToast = saved.showToast;
  openRoll = saved.openRoll;
  rollDie = saved.rollDie;
  persist = saved.persist;
  saveCharacterLibrary = saved.saveCharacterLibrary;
}

// 2024 rules (SRD 5.2): each class's slots, prepared spells and cantrips match its table; ASIs and Epic Boons land
// on the table's levels; classes without a 2024 SRD table keep their 2014 tables.
Object.entries(SRD_2024_CLASSES).forEach(([id, srd]) => {
  const cls = class2024(BUILT_IN_CLASSES[id]);
  srd.levels.forEach(row => {
    const slots = Array.from({ length: 9 }, (_, index) => spellSlotsFor(cls, row.level)[index] || 0);
    assert.deepStrictEqual(slots, Array.from({ length: 9 }, (_, index) => row.slots[index] || 0), id + " " + row.level + " slots");
    if (row.slots.some(Boolean)) {
      const limit = cls.preparedFormula === "known" ? knownSpellCap(cls, row.level) : preparedLimitFor(cls, row.level);
      assert.strictEqual(limit, row.prepared, id + " " + row.level + " prepared spells");
      assert.strictEqual(cantripCap(cls, row.level), row.cantrips, id + " " + row.level + " cantrips");
    }
  });
  assert(cls.asiLevels.includes(19) && cls.epicBoonLevels.includes(19), id + " Epic Boon at 19");
});
assert.deepStrictEqual([...asiLevelsFor(class2024(BUILT_IN_CLASSES.fighter))].sort((a, b) => a - b), [4, 6, 8, 12, 14, 16, 19]);
assert.strictEqual(class2024(BUILT_IN_CLASSES.artificer), null, "no 2024 SRD artificer");
assert.strictEqual(editionClass(BUILT_IN_CLASSES.artificer, "2024"), BUILT_IN_CLASSES.artificer);
assert.strictEqual(FEAT_DETAILS["Boon of Fate (2024)"].abilityMax, 30);
assert.deepStrictEqual(FEAT_DETAILS["Grappler (2024)"].ability, ["str", "dex"]);
assert.strictEqual(featBaseName("Alert (2024)"), "Alert (2024)", "a 2024 feat isn't a variant of the 2014 feat");

console.log("OK: " + LOCAL_SPELLS.length + " local spells, slot math and creation wizard checks passed");
`;

// Any DOM lookup returns an element whose unknown properties are no-op functions or nested stubs.
const stubElement = new Proxy({ innerHTML: "", textContent: "", value: "", disabled: false, dataset: {}, style: {} }, {
  get: (target, key) => key in target ? target[key] : key === Symbol.iterator ? [][Symbol.iterator] : stubFn
});
const stubFn = new Proxy(function () { return stubElement; }, { get: () => stubFn });
vm.runInContext(modules + checks, vm.createContext({
  localStorage: { getItem: () => null, setItem: () => {} },
  document: { querySelector: () => stubElement, querySelectorAll: () => [], createElement: () => stubElement, body: stubElement, documentElement: stubElement },
  window: { addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }) },
  crypto: require("crypto"),
  assert: require("assert"),
  console
}), { filename: "check_data" });
