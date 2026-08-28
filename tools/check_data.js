#!/usr/bin/env node
// Loads the browser modules in a bare vm context and asserts spell data,
// slot math, and character creation stay consistent. Run: node tools/check_data.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const modules = ["utils.js", "data.js", "classes.js", "character.js", "spells.js", "builder.js"]
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
  assert(spell.classes.length > 0, "no classes: " + spell.index);
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
SPECIES_PRESETS.forEach(([name, speed]) => assert(name && speed >= 25 && speed <= 35, "bad species row: " + name));

persistAndRender = () => {};
const previousId = character.sheetId;
openCreateDialog();
assert(characterLibrary[previousId], "opening the wizard must archive the current sheet");
[["name", " Test Hero "], ["species", "Elf"], ["classId", "wizard"], ["background", "Sage"]]
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
assert.strictEqual(character.ac, 12);
assert.strictEqual(character.hitDice, "1d6");
assert.deepStrictEqual(character.saveProficiencies, ["int", "wis"]);
assert.strictEqual(character.background, "Sage");
assert(character.proficientSkills.includes("arcana") && character.proficientSkills.includes("history"));
assert(character.features.includes("Background Feature: Researcher"));
assert(character.features.includes("Species: Elf"));
assert.deepStrictEqual(character.spells, [], "new sheet must start with no spells");
assert.deepStrictEqual(character.equipment, [], "new sheet must start with no equipment");
assert(character.sheetId !== previousId, "new sheet must get its own id");
assert(characterLibrary[previousId], "old sheet must survive creation");

console.log("OK: " + LOCAL_SPELLS.length + " local spells, slot math and creation wizard checks passed");
`;

const stubElement = { innerHTML: "", textContent: "", value: "", disabled: false, close() {}, showModal() {} };
vm.runInContext(modules + checks, vm.createContext({
  localStorage: { getItem: () => null, setItem: () => {} },
  document: { querySelector: () => stubElement },
  crypto: require("crypto"),
  assert: require("assert"),
  console
}), { filename: "check_data" });
