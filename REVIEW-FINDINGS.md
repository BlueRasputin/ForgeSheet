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

## Still to do

- Re-run Sam (chaos/input abuse), Brennan (onboarding + formatting critique + mobile), Ashley
  (cleric domains at 9, healing flow, away-player test) after usage-limit reset.
- Consolidate + prioritize with user; implement fixes (quick wins first: skill grid, roll toast,
  cast-on-row, library merge, death-save reset, generated damage rolls).
- Test characters from reviews still in app localStorage (Grog, Vex, Caleb, Mollymauk, etc.) —
  clean up via library Delete when done.
