# PHB-Informed ForgeSheet Backlog

This file is based on a copyright-safe companion index of the local Player's Handbook PDF. The database stores page anchors, controlled keywords, compact original summaries, and app hooks. It does not store PHB body text.

Database: `data/phb_reference.sqlite`  
Builder: `tools/build_phb_reference.py`

## Highest-Value Next Additions

1. Class progression data editor
   - Let players or the DM define level rows for each class.
   - Track feature grants, spell slots, spell preparation changes, resources, proficiencies, and subclass unlocks.
   - This would make custom classes and unofficial subclasses much easier to support.

2. True multiclass model
   - Store class levels as separate entries instead of one class plus one total level.
   - Calculate total level, proficiency bonus, hit dice, spellcasting progression, and feature sources from that stack.
   - Add prerequisite warnings and a level-up target selector.

3. Roll buttons everywhere
   - Add roll controls for skills, saves, attacks, death saves, hit dice, tools, initiative, and custom actions.
   - Save a roll log that can be shared with DM mode.
   - Let the player add situational modifiers before rolling.

4. Spellcasting rules engine
   - Separate known spells, prepared spells, always-prepared spells, pact slots, cantrips, rituals, and free casts.
   - Add concentration conflict prompts.
   - Add component and material reminder fields.

5. Equipment cards with equipped state
   - Track carried, equipped, attuned, containered, and consumed states.
   - Generate AC and attack rows from equipped armor, shields, and weapons.
   - Keep encumbrance math tied to carried items only.

6. Resource recovery rules
   - Let every custom resource define how it recovers: short rest, long rest, dawn, turn start, combat start, or manual only.
   - Connect class features, spell-like casts, wild shape, infusions, metamagic, and invocations to those resources.

7. Condition-aware reminders
   - Keep condition cards in the Play tab.
   - Surface reminders near affected rolls, movement, actions, and concentration checks when a condition is active.

## Good Builder Improvements

- Add a final character review screen before saving or sharing.
- Add import warnings when the PDF parser is unsure about proficiencies.
- Add "needs DM approval" flags for custom classes, custom spells, custom feats, and homebrew items.
- Add a source field to every feature, spell, item, and rule note.
- Add missing-choice warnings for level-up choices, prepared spells, expertise-like selections, fighting styles, invocations, infusions, metamagic, and subclass picks.

## Campaign And DM Tools

- Add a DM campaign roster with party passive scores, AC, current HP, conditions, languages, and tools.
- Add encounter notes linked to players and NPCs.
- Add item parcel sending with pending/accepted states.
- Add private DM notes per player sheet.
- Add level-up notifications and prepared-spell-change notifications.

## Data Model Suggestions

- `characters`: identity, settings, active theme, sync metadata.
- `character_classes`: character id, class id, level, hit die, spellcasting type.
- `features`: source type, source id, level, name, summary, action type, resource id.
- `resources`: max formula, current value, recovery rule, display group.
- `spells`: known/prepared/always-prepared state, source, cast history, free-cast rules.
- `items`: catalog id or custom id, quantity, weight, equipped, carried, attuned, container.
- `roll_log`: actor, roll type, formula, result, timestamp, visibility.
- `source_index`: source document, page, category, keywords, local note.

## Implementation Order

1. Upgrade the character model for multiclassing.
2. Add class progression table editing.
3. Connect level-up automation to the progression table.
4. Expand spellcasting with pact slots, rituals, free casts, and concentration prompts.
5. Upgrade equipment to generate AC and attacks.
6. Add roll buttons and a DM-visible roll log.
7. Add recovery rules to resources and rests.
8. Improve PDF/text import with confidence warnings and manual review.

## Notes

- Keep the reference database as an index, not a copy of the book.
- Use page anchors to send the user back to their legally owned PDF for full wording.
- Prefer short app-specific summaries and structured mechanics over long quoted rules text.
