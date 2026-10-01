# ForgeSheet — Critical Role review findings (working doc)

Eight persona reviewers ran the app at localhost:8080. Five completed; Sam (bard/chaos),
Brennan (onboarding/paladin), Ashley (cleric) were cut off by a session usage limit and
should be re-run. This file preserves all findings so work can continue in any session.

## Consensus top issues (multiple independent confirmations)

1. **Multi-tab data loss** — library saves are whole-map last-writer-wins; no `storage`
   event handling. Characters silently vanish. Fix: merge library by character id (+updatedAt)
   on write. (Matt, Liam, Taliesin, Sam-partial, Ashley-partial all hit it)
2. **Skill rows broken by expertise star** — `.skill-row` grid is 3 columns
   (styles.css ~1687) but rows now have 4 children; mod chips wrap/overlap next row.
   Fix: 4-column template `18px 1fr auto auto`. (Matt, Laura, Liam)
3. **Roll results invisible** — roll buttons (attacks bottom of Actions tab ~3000px deep)
   render results only into #rollHistory ~1900px away. Fix: floating roll toast; history as archive.
   (Laura, Travis, my combat study)
4. **Cast button hidden behind caret** — cast controls only exist in expanded spell card
   (regression from summary-chip redesign). Fix: Cast button + level on collapsed row.
   (Liam, Travis-implied, my combat study)
5. **Direct level edit leaves HP/hit-dice stale** — bypasses Level Up math; checklist HP
   floor formula far too low for big hit dice (d12 L8 floor shown 23, real avg 93).
   Fix: route level edits through recompute or prompt; fix minHp math. (Laura, Liam, Travis)
6. **Rest buttons: no confirmation, no feedback** — Long Rest instantly wipes state; only
   feedback is an off-screen timestamp. Fix: toast "Recovered X HP · Rage 4/4 · conditions
   cleared" + confirm (or undo). Minor RAW bug: long rest restores ALL hit dice, should be half.
   (Matt, Travis)
7. **Starting Level field invisible in create wizard** — exists on Class step but below the
   dialog fold; 2 of 3 reviewers concluded it didn't exist. Also no subclass step.
   Fix: move beside step title; add subclass picker for level ≥3. (Laura, Liam, Taliesin)
8. **Combat dashboard is static prose occupying prime space** — four explainer cards above
   all interactive combat tools; attacks render dead last. Fix: reorder (attacks/resources
   first), collapse explainers. (Laura, Travis, combat study)

## Combat time-to-locate study (1440×900)

Fast (keep): initiative 1 click · damage/heal 2 actions · concentration auto-prompt (excellent)
· death saves visible · rests 1 click (but see feedback issue).
Slow: weapon attack = tab + 2100px scroll (8–12s); roll result = scroll-hunt back up (5-8s or
missed); cast = tab + scroll + caret + Cast (4 steps); resource spend = scroll + click + retype
(no −/+ buttons); conditions 600px deep. At 960px width everything except rests is below fold;
attacks 4900px deep.
Fixes: roll toast · cast-on-row · Actions tab reorder · resource −/+ pips · sticky summary band.

## Matt Mercer (DM) — campaign/DM tools

- [BUG high] Connect Sync duplicates active character on failed connect (sync.js:271 writes
  new sheetId + persists before validating). Default syncSettings.sheetId to character's.
- [BUG high] Copy Player Link silently demotes DM role to player (copySyncLink mutates
  syncSettings.role). Build URL from arg without mutating.
- [FLOW med] Choosing DM role doesn't re-render → DM tools stay hidden (handler never calls
  renderSyncPanel).
- [FLOW med] Party tab shows local junk as "the party" with no offline note; should use
  syncState.dmSheets when connected + explanatory empty state.
- [FLOW med] Campaign tab offline UX: "Not connected.", active copy-link buttons with empty
  code, Disconnect shown while disconnected. Add offline callout, disable until connected.
- [FLOW med] Clipboard failure swallowed (no catch); show link as fallback text.
- [BUG med] Rules reference missing Cover and Death Saving Throws entries.
- [FLOW med] DM item cards buried at bottom of Campaign tab; "sent — local" vs remote unlabeled.
- [FORMAT med] Campaign panel half-empty layout; New Code looks like plain text.
- [FORMAT low] Topbar: 12 buttons; two unexplained Imports; redundant Save; white Reset
  between Save and Short Rest invites misclicks. Group into menus; Reset → danger style near library.
- [FLOW low] Short rest looks like a no-op for non-warlocks; offer hit-die dialog listing refreshes.

## Laura Bailey (Gloom Stalker ranger 5)

- Verified good: subclass auto-grants (Disguise Self/Rope Trick always-prepared), slots 4/2,
  passive perception w/ expertise, Hunter's Mark present.
- [FLOW high] "Prepared 0/2" circular for known casters (limit = row count). Show
  "Known N / cap" from class table; drop prepare checkboxes for known casters.
- [BUG med] Subclass free-text slug matching fails silently ("Gloomstalker" grants nothing).
  Use datalist/select from official list.
- [FLOW med] Generate Actions: ignores weapon items (crossbow produced no attack), duplicates
  Hunter's Mark (known + item copy). Include weapons; dedupe by name.
- [FLOW med] Item-granted spell duplicates known spell row; both inflate prepared denominator.
  Merge or exclude item rows from counter.
- [FORMAT med] Equipment rows ~330px; unlabeled number fields; grant-spell select (394 options)
  always visible. Labels + "Magic item…" disclosure + Remove right-aligned.
- [BUG low] No bows/ammunition in 14-item catalog.
- [FORMAT low] Roll history: Reroll header dominates; should be one-line "Stealth · 1d20[19]+6 = 25 ↻".
- [FORMAT low] Summary chips run together ("1stANo save1d6"); add gaps, explain A/B.
- [FLOW low] Checklist modal auto-opens over brand-new sheet; pulse the badge instead.

## Liam O'Brien (wizard 13, spellbook at scale)

- Verified good: slots/DC/attack/prepared limit/upcast slot consumption/class-level filtering.
- [BUG high] Print: collapsed rows print with no spell names (name only in hidden select).
  Print-visible name span.
- [BUG high] Second concentration cast silently replaces first; confirm before overwrite.
- [FLOW high] Bulk entry ~3 clicks/spell, no search (18 spells ≈ 55-70 interactions).
  Search-as-you-type combobox + add-multiple mode.
- [BUG high] Over-prepared: color-only signal (WCAG 1.4.1 fail), auto-prepares past limit.
  Stop auto-prepare at limit + inline "N over limit" text.
- [FLOW high] Spellcasting header + prepared counter scroll away; make sticky.
- [FLOW med] Sheet search returns truncated text dump; make matches clickable (jump + filter).
- [FORMAT med] Print zoom 0.24 unreadable; cap ~0.55 + paginate with break-inside: avoid.
- [FORMAT med] No Concentration/Ritual chips on collapsed rows (have data; add C/R badges).
- [FLOW low] Arcane Recovery dumb counter; make "Recover N slot levels" helper by slot grid.
- [FORMAT low] Spell select truncates names; drop redundant "(3rd)" suffix in level sections.
- [FORMAT low] Empty row text collides with Prepared checkbox; hide controls until spell chosen;
  GC empty rows.
- [FORMAT low] Tab aria names hijacked by "To do:" titles; use aria-description instead.
- [FORMAT low] Slot grid: ragged 3-col layout, Use/Restore pairs bulky → one-line clickable pips.
- [FORMAT low] ~800px dead whitespace at 960px width.

## Taliesin Jaffe (Blood Hunter 6 / custom content)

- Verified good: BH class/glyph/saves/table/Blood Maledict tracker; custom class + custom spell
  builders work end-to-end; custom spell editor layout praised.
- [BUG high] Profane Soul offered in dropdown but grants no pact magic. Fix: pact-third override
  (warlock slots at ceil(level/3): L6 → 2×1st, INT, warlock list).
- [BUG med] creationDraft never nulled when create dialog closed via X → later "Save Class"
  writes into dead draft, silently no-ops. Null draft on dialog close event.
- [BUG med] Dynamic note sections excluded from sheet search haystacks.
- [BUG med] Advancement timeline mislabels pact slots ("Slots 1:2" for 3rd-level) — map index
  before filtering zeros (builder.js:107).
- [FLOW med] Non-SRD official subclasses show "Description will appear…" forever; fallback text.
- [FLOW med] Subclass template inserts guidance prose as content; use placeholders + create real
  resource rows.
- [FORMAT med] Custom class table is raw CSV textarea; commas in feature names break columns.
- [FLOW low] Custom "Pact magic" always full progression; add caster-level multiplier.
- [FLOW low] Official vs custom subclass model muddy; lock name in official mode.
- [FORMAT low] Martial class tables show caster columns ("Prepared 0" reads as data); em-dash them.
- [FORMAT low] Builder checklist Go buttons land on unrelated tabs; use scroll-to targets.

## Travis Willingham (Berserker 8, combat)

- Verified good: Generate Actions computes +8 from custom equipped weapon; temp-HP-first damage;
  hit-die spend automation; condition propagation; background skill grants.
- [BUG critical] Generated attacks have NO damage roll — damage field repeats "1d20+8".
  Parse damage die from item notes + STR mod; add Damage roll button per action.
- [BUG med] Death saves never reset on healing above 0 (applyHeal resets only from exactly 0 —
  heal via hit die left 1/1). Clear whenever HP rises above 0.
- [BUG med] Nothing happens at 0 HP: no Unconscious/dying state, no death-save CTA, HP stays
  plain black. Auto-flag dying; make dashboard card a Roll button; color HP by state.
- [FLOW med] Rage invisible as a state; add toggle chip in header tied to resource.
- [FLOW med] Level Up dialog shows spell noise for martials; hide for casterType none.
- [FORMAT med] Spells tab full caster UI for non-casters; collapse to stub.
- [FORMAT med] Current HP visually junior to ability tiles; make it the biggest number with
  green/amber/red states.
- [FORMAT low] Action rows are permanent edit-forms; read-mode cards with edit toggle; hit dice
  shows "1d12" vs Rest's "8/8" (should be 8d12); merge redundant ATTACKS textarea.
- [BUG low] HP input clamps to 1 (can't type 0); Party card renders 0 HP as "- / 16" (falsy bug).
- [FLOW low] No greataxe in catalog; pull SRD equipment from the 5e API like spells.
- NOTE: his fresh L8 barbarian showed empty Resources until visiting Actions tab —
  ensureClassResources only runs in renderPlayTools; seed it in renderAll/persist path instead.

## Fix status (2026-09-30)

Fixed in be449c7, 5f3ed3f, 93ec3a7 and verified in the browser:

- All 8 consensus issues: multi-tab data loss (per-character merge + storage event), skill-row
  grid, roll results (toasts at the viewport edge), cast from collapsed row, level edits apply
  HP/hit dice, rests report + Undo, starting level beside the class step title, Actions tab
  reordered with the explainer collapsed
- Also: blank "New Character" minted on every fresh load; checklist HP floor math; 0 HP →
  Unconscious + dying banner with Roll Death Save; death saves reset on any healing; HP input
  accepts 0; party card 0 HP; Profane Soul pact magic; real spells-known caps ("Known N / cap");
  loose subclass matching + datalist; timeline pact slot labels; sync duplication, DM role
  demotion, role re-render, clipboard fallback; dead create-draft breaking Save Class; note
  sections searchable; Attack/Damage buttons with crit doubling; Generate Actions builds real
  weapon attacks and offensive spells, skips armor, no duplicates; resource −/+; compact
  condition chips; concentration-swap confirm; printed spell names; C/R chips; sticky
  spellcasting block; over-limit warning in words; HP state colors; File menu; rules + catalog
  gaps; checklist Go targets; martial level-up dialog; CSV commas; non-SRD subclass text;
  ASI banner covering the top bar; ability tiles overflowing at mid widths; action rows clipping

Still open (backlog):

- Spellbook at scale (Liam): search-as-you-type spell add, clickable sheet-search results,
  print zoom cap + pagination, Arcane Recovery helper, slot pips, select label truncation,
  empty-row text collision
- DM/campaign (Matt): Party tab should use synced sheets when connected; offline callout and
  disabled copy/disconnect buttons when not connected; DM item cards placement; panel layout
- Custom content (Taliesin): template guidance as placeholders, pact-magic caster multiplier
  for custom classes, official vs custom subclass model, em-dash caster columns for martials
- Combat (Travis): Rage on/off state chip, Spells tab stub for non-casters, read-mode action
  cards, SRD equipment from the API
- Create wizard: subclass step for level 3+ characters

## Round 2 (Sam, Brennan, Ashley against the fixed build)

Confirmed working live: multi-tab merge (away-player test passed), escaping across all player
input, number clamping, bard known-spell/Bardic Inspiration rules, domain spells, roll toasts,
rest Undo, dying banner.

Fixed in 4f84732, 12145e4, a5b82f1:

- Rules: damage at 0 HP = death save failure; massive damage = instant death; 0 HP and failed
  concentration saves end concentration; death saves only roll while dying
- Casting: one path for collapsed/expanded Cast (prepared check), in-app "Cast anyway" instead of
  confirm(), healing/damage roll with upcast dice; full spell text in the expanded card
- Rest Undo reverses only the rest's own changes; Level Up raises max HP
- Security: custom class names/features, API text, and select labels escaped (script injection)
- Cross-tab: per-tab active character (sessionStorage); other tabs' saves don't rebuild the sheet
- Layout: spell rows adapt to the list column (container query); sticky spell panel desktop-only
- Wizard output: per-level class features for casters, class proficiencies, PHB species bonuses,
  subclass picker on the Class step, class-aware Standard Array; checklist counts class skills and
  cantrips; Builder tab reuses the checklist
- Bard Jack of All Trades; AC from equipped armor ("Gear: 18" one-click); Party tab sorted by HP
  with bars, badges, click-to-switch; dice formula validation; cantrip caps
- 404 refetch loop for non-SRD subclasses (found while verifying)

Owner approved all five formatting changes; applied in a60c967 and f8bd14c (see below).

Brennan's top 5 formatting changes (applied):
1. Notched frame only in the header band, plain cards elsewhere
2. Page scroll with a sticky tab bar instead of the fixed-height shell with three inner scrollers
3. One type scale and three button roles (Level Up the only filled top-bar button)
4. Header tile labels wrap; bigger Inspiration stepper; HP controls in one row
5. Phone/tablet reflow: tabs before skills, single scrolling tab row, compact top bar

Still open: compact read-only inventory rows; Campaign tab "Advanced" config disclosure; Disciple
of Life bonus on healing; choose who's in the party; bard Expertise/Magical Secrets prompts and an
Entertainer background; level-up picker duplicate selection; banners shifting the tab bar.

## Combat trial re-run (after round 2 + formatting)

Same method as the original study: open the Actions tab at the top of the page and measure how
far each control sits below the fold (scroll px), with a level-5 Paladin carrying 5 actions.

| Combat beat | 1440×900 before | 1440×900 after | 1024×768 after |
|---|---|---|---|
| Initiative, damage/heal, rests | visible | visible | visible |
| Weapon attack | 2,156 px | visible | visible |
| See the roll result | off-screen (scroll-hunt) | toast, always visible | toast |
| Damage roll after attack | type formula | 1 tap in the toast | 1 tap |
| Cast a spell | tab + scroll + caret + Cast | tab + Cast (visible) | tab + Cast |
| Death save while dying | 881 px down the Actions tab | header banner, visible | visible |
| Resources / conditions | 605 px | 321–377 px | 608–663 px |
| Saving throw / skill check | visible | visible | visible / 9 px |

Resources sit lower when a character has many actions (5 here); with 2–3 they're ~200 px higher.
Phone: the tab bar and attacks come first and the tab bar stays pinned; saves and skills follow
the panel (1.5–2 screens down). The browser pane's phone emulation renders at 714 CSS px, so
exact phone numbers need a real device.

## Round 3: 10-player trial (Matt DM + 9 players, new characters, shared encounter)

Each player built a new character through a different path (level-1 + Level Up ×4, hand-typed
scores + step jumping, start at 7 + checklist-only, abandon/duplicate, wizard abuse on phone,
header-editor class/level edits, subclass switching, homebrew class from the wizard, text import)
and ran the same 3-round encounter, logging clicks/scroll/seconds. 10 shared-storage tabs: no data
loss. The pane's 9-tab cap blocked one tester until a slot was freed; Aabria tested the import
parser offline instead.

Fixed in 02aa939, 11de32e, b54981b, 11dbc9b (verified in the browser):
- Phone layout was 714px wide on a 375px screen (main column sized to the tab row) — buttons and
  every toast were off-screen; now 375px
- Combat scrolling (5 reports, 600–2,100px per cast/hit): pinned combat strip with HP, damage/heal,
  conditions, concentration; dying/concentration prompts float under it (no layout shift); toasts
  stack; the header Conditions tile opens conditions. Re-measured: 0px to take a hit while 2,472px
  deep in the spell list
- Dead characters: healing at 3 failed saves refused with explicit Revive; Party shows Dead/Stable
- Wizard: whole-number levels (1.5 made a 1.5d6 character), inputs show the value used, class
  required (no longer pre-filled), Enter only advances from the name, ticks follow data, drafts
  survive X with Start over, subclass picker under level, class skill picks from PHB lists, Review
  shows final scores/HP/subclass/skills, species grants (languages, skills, training, Wood/High Elf,
  Hill/Mountain Dwarf, Tiefling legacy), AC from gear incl. Unarmored Defense
- Leveling: subclass picker in Level Up, spell picks for AT/EK/Profane Soul, ASI controls that change
  scores, prepared limit respected, proficiency line, header level rejects >20 and rebuilds
  features, class change swaps saves/training/HP/features, repeatable ASIs, exact checklist
- Subclass extras: Battle Master dice, Hexblade training + Curse, AT Mage Hand, heavy/martial
  training for domains/oaths/colleges; typed subclass names link to the catalog; granted spells no
  longer delete the player's own copy on subclass switch; granted cantrips don't count
- Spell rolls: flat bonuses and projectiles (Magic Missile 3d4+3, Scorching Ray per ray, Eldritch
  Blast per beam), cantrip scaling everywhere, spell attack rolls, Apply healing, cast Undo;
  conditions/exhaustion impose disadvantage; generated actions stay current; Monk unarmed strike,
  Rogue Sneak Attack; 15 missing catalog spells (renames + local summaries)
- Rest Undo persists in the Rest panel; honest short-rest wording; equip re-renders AC
- Custom classes: no input wipe, live preview, edit existing, saves/training fields, merge-save across
  tabs, CSV commas; Import: any-class levels, alignment, skills/saves lines, weapon lines, max HP,
  whole-word spells; Party: grid, initiative, Down/Concentrating tiles, switching never re-saves;
  DM item tools refresh; Rules focus/ranking/Combat; in-page Delete/Reset confirms

Still open: searchable spell picker (spells take ~3 interactions each), initiative tracker / enemy HP
/ round counter for the DM, Arcane Recovery slot helper, school limits for Arcane Trickster and
Eldritch Knight, starting equipment packs, per-tab DM role.

## Round 4: layout usage study (2026-10-01)

Six testers each simulated a 3-hour session and tallied what they touched:

- Matt (DM)
- Travis (Berserker 6)
- Laura (Arcane Trickster 5)
- Liam (Evocation 9)
- Marisha (Open Hand 7, on a phone)
- Ashley (Life cleric 8)

**What the testers agreed on (all six):**

- **Sidebar instead of a top band.** Use a sticky left sidebar holding identity, HP with Damage and Heal, the stat tiles, abilities with their saves, passives and skills.
- **Combat tab:**
  - Casters need slots, save DC, concentration and Cast in the same place as their attacks. Liam and Ashley flipped tabs on almost every turn.
  - Martials need resources (ki, rage) near the top.
  - The Spells tab is not needed for non-casters.
- **Rarely used:** the add buttons, attack notes, the turn reference, the rest preview and death saves until 0 HP.
- **Biggest annoyances:**
  - Marisha (phone): skills and saves were buried below the whole tab panel.
  - Ashley: damage, the concentration save and the spell list were spread across three areas.

**Done:**

- Removed the sticky HP/AC strip.
- **Top bar:**
  - The character switcher and search moved into the top bar.
  - Builder, Party and Campaign are top-bar buttons.
  - Short and long rest share a Rest menu.
  - New, Duplicate, Delete, file actions, theme and side-by-side view sit in one Menu.
- **Sidebar:**
  - Added the sticky sidebar.
  - Saves are merged into the ability tiles.
  - The concentration and dying prompts sit directly under the HP box.
  - On phones, Abilities, Passive senses and Skills start collapsed, so the tabs fit in the first screen.
- **Tabs:** Combat, Spells (casters only), Inventory, Roleplay and Features.
- **Combat tab:**
  - Casters get a Spellcasting block first: DC, attack, slots, concentration, and every spell ready to cast with one-tap Cast.
  - Non-casters get resources first.
  - Resources are one line each.
  - Action rows read as text until hovered.
  - Hit dice, rest and death saves are folded away. That fold opens itself at 0 HP.
  - Turn reference and attack notes are folded away.
- **Roleplay tab:** personality, languages and proficiencies, and notes.

**Open ideas from the study (not built yet):**

- **Martial and rogue automation:**
  - A rage on/off toggle that applies +2 damage and resistance. Reckless Attack sets advantage.
  - A Sneak Attack toggle on weapon damage, limited to once per turn.
  - A Thieves' tools roll chip.
- **Turn tracking:** an Action / Bonus / Reaction used-this-turn strip.
- **Spellcasting:**
  - An Arcane Recovery slot picker.
  - Ritual casting without spending a slot.
  - Life cleric Disciple of Life added to healing rolls.
- **DM view:**
  - Merge Party and the Campaign roster into one view.
  - Show every player's passive Insight and Investigation and their save modifiers.
  - An initiative order with a Next turn button.
  - "Call a save", which highlights every player's modifier.

## Round 5: critical combat trial on the sidebar layout (2026-10-01, commit 74a805c)

Eight critical testers ran the same 4-round fight ("Ambush at the Drowned Chapel": a wight and 4 ghouls, paralysis save, necrotic DEX-save burst with concentration checks, Liam at 0 HP, life drain, short rest). They used positions measured in the browser plus the code. No changes were made; everything below is a proposal.

**Time spent per tester (4 rounds + short rest):**

| Tester | Device | Time | Notes |
|---|---|---|---|
| Liam, wizard 2 | laptop | 115s | |
| Laura, rogue 5 | laptop | 178s | |
| Sam, sorcerer 9 | laptop | 180s | |
| Ashley, druid 6 | laptop | 202s | |
| Travis (Grog), fighter 6 | laptop | 215s | |
| Marisha, monk 4 | phone | 325s | 38 taps' worth of scrolling |
| Taliesin, warlock 7 | laptop | 325s | |
| Matt, DM | laptop | 505s | everything repeated per character |

### Bugs (confirmed in code)
1. **Play mode still toggles proficiency** (Laura, Marisha).
   - Skill rows and the ability-card "Save" are `<label>` elements wrapping the checkbox, so clicking a skill or save name toggles proficiency even though the checkbox is styled `pointer-events: none`.
   - Laura clicked "Stealth" to Hide and silently lost Stealth expertise.
   - Fix: make the rows non-label elements, or disable `[data-skill]` / `[data-save]` while the sheet is locked.
2. **Enter in the HP amount field always deals damage** (Liam, Travis, Sam).
   - Typing a heal and pressing Enter hurts you; at 0 HP it adds a death-save failure.
   - There's no damage toast and no undo.
3. **Silent, sticky upcast** (Sam).
   - When base-level slots run out, `quickCastState` writes `row.castLevel` to the next open level during render.
   - Spamming Cast burned 3rd, then 4th, then 5th-level slots, and the spell stays "Cast 5th" after a long rest.
4. **Spell-attack toasts lose the damage roll** (Liam, Sam, Taliesin).
   - Any toast action closes the toast, so "Roll attack" removes "Roll damage".
   - Spell attacks get no crit doubling.
   - "Roll attack x2" (Eldritch Blast beams) rolls one d20.
5. **Healing a target heals the caster** (Ashley). The "Apply +X HP" button on Healing Word / Cure Wounds heals the open sheet, and at full HP it still reports "Healed 4".
6. **Toast stack drops actions** (Travis). The stack is capped at 3, so attack 1's "Roll damage" vanishes during Extra Attack + Action Surge.
7. **HP input edge cases** (Sam):
   - Current HP accepts values above max (it is clamped only at 999).
   - The heal toast reports the typed amount, not the amount applied.
   - Ordinary damage shows no feedback at all.
8. **Re-casting the concentration spell you already hold gives no warning** (Sam).
9. **Hex's cast toast offers "Roll damage (1d6)"** (Taliesin), though Hex deals no damage on casting.
10. **Sleep's pool roll is labelled "Roll damage"** (Liam).
11. **Arcane Recovery is ignored by the short-rest flow** (Liam).

### Rules gaps
- **Conditions only affect attack rolls** (Travis, Marisha, Laura, Matt):
  - Paralyzed, Stunned, Unconscious and Petrified should auto-fail STR/DEX saves.
  - Restrained should give disadvantage on DEX saves.
  - Paralyzed should warn on Attack.
  - The "repeat the save each turn" reminder is missing.
- **Advantage and disadvantage don't cancel** (Laura, Sam). Prone forces disadvantage even when Advantage is set.
- **Life drain / max-HP reduction has no home** (all 8). Max HP is locked in play mode, and Edit makes it a permanent build change that a long rest won't restore.
- **Dropping to 0 HP doesn't add Prone with Unconscious** (Liam), and there is no "Stand up (half speed)" step (Marisha, Laura).
- **Concentration never expires** before a long rest (Ashley).
- **Hexblade** (Taliesin):
  - Hex Warrior isn't modelled: pact weapon attacks use STR/DEX, not CHA.
  - Hex +1d6, Agonizing Blast and the Curse's +prof and crit-on-19 are never applied.
  - Armor of Agathys grants no temp HP and has no retaliation reminder.
- **Class kits are incomplete:**
  - Monk: Flurry, Patient Defense, Step of the Wind and Deflect Missiles are missing (Marisha).
  - Rogue: Sneak Attack, Cunning Action and Uncanny Dodge rows are missing, and Sneak Attack isn't doubled on a crit (Laura).
  - Fighter: Second Wind, Action Surge and Superiority Dice don't roll, and maneuvers show no DC (Travis).
  - Sorcerer: no Metamagic or Flexible Casting, and Clockwork Soul has no tracker (Sam).
  - Druid: Wild Shape has no beast HP pool (Ashley).
  - Monk speed doesn't add Unarmored Movement (Marisha).

### Layout and flow
- **The roll mode is one global select at the bottom of Combat, and it stays set** (Laura, Travis, Taliesin, Sam). Advantage requires scrolling down and back, and the next save or initiative silently inherits it.
  - Proposal: Adv/Norm/Dis toggles on attack buttons, save chips and toasts, resetting after each roll.
- **Skills and passives are below the fold at 1440x900** (Laura, Ashley, Sam, Liam, Travis): passives at y 857 to 983, the Skills header at y 942 to 1008, Insight at about y 1190.
  - Proposals:
    - passive Perception as a stat tile
    - a separately scrolling lower sidebar under a sticky HP and tiles block
    - search that rolls skills
- **Combat tab order** (Laura, Ashley, Sam, Taliesin):
  - Spell cards (up to 17) push Actions, Resources and Conditions below the fold.
  - Third-casters and hybrids want weapons first.
  - Empty Actions and Resources blocks still take space.
  - Proposals: order by class, hide empty blocks, group spell cards by level, mark concentration spells, put class resources beside the slots.
- **Concentration damage spells can't re-roll damage** without spending a slot (Ashley: Moonbeam, Spike Growth). Proposal: a "Roll damage" chip on the card for the spell you are concentrating on.
- **Duplicate controls** (Liam, Sam, Taliesin, Ashley):
  - Slot "Use" next to Cast invites double spending.
  - Fireball and Fire Bolt action rows roll without spending slots.
  - Hit dice Spend appears twice.
  - Concentration appears in up to four places.
- **Death saves at 0 HP** (Liam):
  - Roll death save is a ghost button next to an unconfirmed Reset.
  - The block grows the sidebar by about 100px mid-fight.
  - Proposals: primary Roll, Reset behind a confirmation, and the block replaces the HP fields instead of adding height.
- **The hit dice Spend button sits right under Damage/Heal** (Marisha), and is easy to tap by mistake with no confirmation.
- **Phone** (Marisha):
  - HP, ki and Attack are about 500 to 1000px apart.
  - The tabs aren't sticky.
  - Opened sidebar sections stay open and push Combat further down.
  - The Rest menu is only at the page top.
- **Edit mode carries over per sheet** (Matt, Marisha). Marisha and Grog Ironhide open in Edit, which shifts everything 190px. Proposal: open sheets in play mode, and make Edit more visible than a 3px ring.
- **The Initiative tile doesn't look clickable** (Taliesin).
- **Toast position** (Travis): the toast stack covers Conditions and the Dice roller. Proposal: bottom-right, and keep toasts that still have actions.

### DM tools (Matt)
- **The Party view only shows characters stored on this device.**
  - Synced player sheets appear only in the Campaign roster, which has no HP bars, sorting or conditions.
  - DM edits don't sync back.
- **No encounter or initiative tracker:**
  - Initiative is the latest roll from history, so it can be stale from a previous session.
  - No enemies, turn pointer, round counter or tie-break.
- **Roll toasts and history don't name the character.**
- **Conditions are the faintest text on party cards**, and setting one jumps to the Combat tab.
- **The "Most hurt" default sort reorders cards after every hit.**
- **No group actions.** Proposal: select cards, then group save (DC), damage full/half by result, and short rest.
- **Cards lack passive Insight, passive Investigation and save bonuses.**
- **Test characters** ("New Character", "Vex Orrin (BLM)", "Grog Ironhide") pollute party totals. Proposal: a "Hide from party" toggle.

### Fix status (2026-10-01)
All 11 bugs and every item under "Rules gaps" are fixed and verified in the browser against the testers' characters. Their data was restored after testing.

- **Play mode:** proficiency checkboxes are locked, and clicking a skill or save name rolls it.
- **Damage and healing:**
  - Enter no longer applies damage.
  - Every damage and heal gets a toast with Undo, and heals report the HP actually gained.
  - HP is capped at max.
  - Damage toasts offer "Lower max HP too" (reverted on a long rest, or with Restore).
  - Rogues 5+ get "Uncanny Dodge (halve)", once per hit.
- **Spellcasting:**
  - Cast never upcasts silently: it asks "Cast at 4th level?", and the upcast preference resets on a long rest.
  - Re-casting the spell you're concentrating on asks first.
  - Casting in beast form asks first.
  - Spell attacks roll every beam, each with its own damage and crit button.
  - Hex and Hunter's Mark read "Roll extra damage on a hit"; Sleep reads "Roll HP affected".
  - Healing spells offer "Heal me" plus one button per character below max HP on this device.
  - Temp-HP spells offer "Gain N temp HP".
  - Armor of Agathys grants its temp HP and reminds you of the cold retaliation when you're hit.
- **Toasts:** toasts that still have buttons aren't evicted by plain messages, and the newest toast is never dropped.
- **Rests:**
  - Short rest offers Arcane Recovery (highest slots first, within the half-level budget).
  - Short rest ends concentration on spells lasting an hour or less.
- **Conditions:**
  - Paralyzed, Stunned, Unconscious and Petrified auto-fail STR/DEX saves.
  - Restrained gives disadvantage on DEX saves.
  - Incapacitating conditions warn before attacks, casts and features ("Do it anyway").
  - Advantage and disadvantage cancel.
  - Condition cards have repeat-save buttons that offer "end the condition" on the result.
  - Prone has a Stand up button (half speed, and not while at 0 HP).
  - Dropping to 0 HP adds Prone.
- **Hexblade:**
  - Hex Warrior uses CHA for one-handed weapons.
  - The Curse adds a +prof damage button and crits on 19-20 while spent.
  - Hex adds a +1d6 damage button.
  - Agonizing Blast adds CHA per beam when the invocation is recorded.
- **Class features** now appear automatically as action rows with Use buttons that spend the resource:
  - Monk: Flurry of Blows (rolls both strikes), Patient Defense, Step of the Wind, Deflect Missiles, Stunning Strike. Speed adds Unarmored Movement in play mode.
  - Rogue: Sneak Attack as a damage add-on (doubled on crits), Cunning Action (with a Stealth roll), Uncanny Dodge.
  - Fighter: Second Wind (rolls and heals), Action Surge, Superiority Die (rolls, and shows the maneuver DC).
  - Sorcerer: Metamagic menu (Twinned priced at the last spell's level), Flexible Casting (create or burn slots), Clockwork Soul's Restore Balance tracker.
  - Druid: Wild Shape with a beast HP row that absorbs damage first and reverts with the overflow; Moon druids use a bonus action.

### What testers said worked
- Initiative, AC, HP, Damage/Heal and the first row of save chips are visible without scrolling on desktop; each is one click.
- The concentration prompt under HP computes the DC correctly and takes one click.
- Temp HP absorbs damage first; massive-damage death, death-save state, natural 1 and natural 20 are all handled.
- Prone automatically gives attack disadvantage and says why.
- Pact slots auto-select 4th level.
- The short-rest toast recharges resources and chains "Spend a hit die", with Undo.
- Passive Perception and Dying / Concentrating badges on party cards answer DM questions without opening sheets.

## Round 6: mechanics audit and 2014 expansion data (2026-10-01)

Four player agents audited the rules (martial, core, creation, spellcasting). A rules-lawyer agent then reviewed the fix diff and found 8 more problems, all fixed. Each fix was verified with scripted rolls in the browser, using backed-up and then restored localStorage.

**Combat**
- Weapon rows are generated per grip; versatile weapons get a two-handed row.
- Weapon math covers:
  - magic +N on attack and damage
  - finesse and ranged ability choice
  - Martial Arts die and DEX for monk weapons
  - Hex Warrior with any weapon lacking the two-handed property
  - fighting styles: Archery +2, Dueling +2, Great Weapon Fighting rerolls (`r2` dice syntax), Defense +1 in armor
  - the Extra Attack count, including Valor/Swords bards, Bladesingers, Battle Smiths and Armorers
- Crits and misses:
  - A natural 1 offers no damage.
  - Champion crit range (19 at 3rd, 18 at 15th) applies to weapon attacks only.
  - Hexblade's Curse offers 19-20 crits as a choice.
  - Brutal Critical adds extra dice on melee crits.
- Rage:
  - It is an action that toggles on and off.
  - It adds +2/+3/+4 damage on STR melee hits, halves B/P/S damage, and gives advantage on STR checks and saves.
  - It blocks spellcasting and concentration.
  - It is unlimited at 20th level.
- Damage riders and smites:
  - Sneak Attack applies only with finesse or ranged weapons.
  - Divine Smite spends a slot from the hit toast for 2d8 + 1d8 per slot level (max 5d8), doubled on a crit.
- Advantage and disadvantage cancel correctly across all sources. Advantage sources are Rage, Danger Sense, and War Caster on concentration saves.
- Speed: Fast Movement (not in heavy armor), Mobile, exhaustion 2 halves it, exhaustion 5 and grappled/restrained/paralyzed/stunned/unconscious/petrified set it to 0. The tooltip says why.
- Saves: Cloak and Ring of Protection (when attuned) and Aura of Protection (paladin 6+, minimum +1).
- Initiative: Alert +5, and Jack of All Trades or Remarkable Athlete.
- Damage at 0 HP keeps earlier death save successes. A long rest lowers exhaustion before refilling HP.

**Characters**
- HP:
  - At least 1 per level.
  - A CON change re-scores HP for every level, on the sheet and at level-up.
  - Tough (+2 per level, retroactive), Draconic Resilience and Hill Dwarf.
- Feats:
  - Prerequisites are enforced for PHB, Xanathar's racial and Tasha's feats. Unmet feats are disabled with a reason.
  - A feat can't be taken twice unless it's repeatable.
  - Half-feats ask which ability gets +1. Resilient adds the save proficiency.
  - Lucky tracks Luck Points.
- Creation:
  - Half-Elf (+1/+1, not CHA, plus 2 skills), Variant Human (+1/+1, a skill and a feat), Custom Lineage, and +2/+1 choice for later lineages.
  - High Elf cantrip and extra language.
  - Forest/Rock Gnome and Lightfoot/Stout Halfling subraces.
  - Point buy with a 27-point counter.
  - Species skills count as already owned.
  - A species search box.
- Checklist: expertise for rogues (2, then 4 at 6th) and bards (2 at 3rd, 4 at 10th), and species skills counted toward the skill total.
- Multiclass: the prerequisites of both the new class and the current class are checked. Blood Hunter needs STR or DEX 13 and INT 13.
- AC:
  - Mage Armor sets AC on cast and ends on a long rest.
  - Natural armor for Tortle, Lizardfolk, Loxodon and Locathah.
  - Padded, hide, ring mail and splint armor in the catalog.
  - The Bag of Holding itself weighs 15 lb.

**Spellcasting**
- Mystic Arcanum: 6th to 9th level warlock spells can be picked and are cast once per long rest without a slot. They don't count against spells known.
- Rituals:
  - Bards, clerics, druids, wizards and artificers can cast a ritual without a slot. So can warlocks with Book of Ancient Secrets.
  - Wizards can ritual-cast unprepared spellbook spells.
- Prepared counts: artificers round up; paladins round down and prepare nothing at 1st level.
- Spell parsing:
  - Two-dice spells (Flame Strike, Ice Storm) roll both groups and upcast the right one.
  - Spiritual Weapon scales every two slot levels.
  - Cantrip scaling and spellcasting-modifier wording from the local summaries are read correctly.
- Flexible Casting can create a slot above the normal maximum.
- Natural Recovery for Circle of the Land.
- Aberrant Mind and Clockwork Soul spell lists are corrected (Summon Aberration, Telekinesis at 9th, Summon Construct).
- Wild Shape shows the CR and movement limits for the druid's level and circle.
- New trackers: Arcane Shot, Fighting Spirit, Psionic Energy Dice, Giant's Might, Unleash Incarnation, Tides of Chaos, Bladesong, Star Map, Emboldening Bond, Stroke of Luck.

**Expansion data** (`js/expansions.js`, skips anything already defined)
- 87 species/lineages (Volo's, Mordenkainen's, SCAG, Eberron, Ravnica, Theros, Wildemount, Tasha's, Van Richten's, Spelljammer, Fizban's and others), each with its size.
- 63 backgrounds.
- 82 feats.
- 107 non-SRD spells (PHB extras, Xanathar's, Tasha's, Fizban's, Strixhaven, Wildemount dunamancy and others).
- 14 items.
- Totals in the app are now 98 species, 69 backgrounds, 104 feats and 511 spells, with no duplicates.

**Cartomancer**
- Each synced sheet now carries a versioned `partyStatus` object: HP and effective max, temp HP, AC, speed, initiative, state, death saves, conditions, exhaustion, concentration, passives, saves, spell DC, resources, slots and owner uid.
- The contract and a reader snippet are in `INTEGRATION.md`.
- The Cartomancer repository isn't reachable from this machine's GitHub account, so nothing has been wired on the Cartomancer side.

## Still to do

- Re-run Sam (chaos/input abuse), Brennan (onboarding + formatting critique + mobile), Ashley
  (cleric domains at 9, healing flow, away-player test) after usage-limit reset.
- Consolidate + prioritize with user; implement fixes (quick wins first: skill grid, roll toast,
  cast-on-row, library merge, death-save reset, generated damage rolls).
- Test characters from reviews still in app localStorage (Grog, Vex, Caleb, Mollymauk, etc.) —
  clean up via library Delete when done.
