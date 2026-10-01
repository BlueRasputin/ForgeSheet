# ForgeSheet redesign audit

Audit of the whole UI against the redesign checklist, followed by the rules the rebuild follows.

**Design read:** an overhaul of a dense tabletop character sheet for players at the table and DMs. It should feel like a crafted instrument panel: quiet neutrals, one accent per theme, numbers that line up, and feedback-only motion.

**Dials:** VARIANCE 4, MOTION 4, DENSITY 7. This is a working tool used mid-combat, so the layout stays predictable and packed. Personality comes from type, surfaces and detail, not from asymmetry.

**Scope note:** design-taste-frontend is written for landing pages and portfolios, not dashboards. Only the parts that apply to a dense app were used: type, color discipline, shape lock, states, iconography, content rules and motion restraint. The stack stays vanilla HTML, CSS and JS with no build step, because the redesign skill forbids migrating stacks.

## Findings

### Typography
- **No fonts were actually loaded.** The stylesheet named Roboto Condensed, Inter and Helvetica, but none were served, so every machine fell back to whatever it had installed.
- **Three families were mixed.** Georgia serif headings, a condensed sans fallback for labels, and a system sans for body text. Fantasy and Retro themes swapped in Georgia and Trebuchet on top of that.
- **All-caps labels everywhere.** There were 12 `text-transform: uppercase` rules covering labels, tabs, `h2`, stat tiles, table headers and the eyebrow.
- **Title Case on every heading and button**, for example "Proficiencies & Training", "Spend Hit Die" and "Apply Detected Fields".
- **Numbers were proportional.** HP, AC, modifiers and slot counts jittered as values changed. No tabular figures.
- **Labels were too small to read at the table.** Sizes ran from 0.58rem to 0.66rem on sense, ability and stat captions.
- **Only weights 600 and 700 were used**, so there was no medium step for hierarchy.

### Color and surfaces
- **About five accents per theme.** `--accent`, `--blue`, `--green`, `--gold` and `--frame` all competed. "Secondary" buttons were blue next to red primary buttons, and the current-turn outline and initiative text were also blue.
- **Hardcoded hex values bypassed the tokens:**
  - bloodied amber `#b7791f`
  - encumbrance `#2f9e72`, `#d09322` and `#b94141`
  - the import warning's yellow
  - the Beyond topbar's black
  - text on accents, which used either `#fdf6e8` or `#fff7df`
- **One stray dark band.** Beyond had a near-black top bar on an otherwise light page, which looked like an accident.
- **Shadows were generic.** They used black at low opacity rather than tinted shadows, and Retro used a different light direction.
- **Flat backgrounds** with no texture.

### Layout
- **No shape rule.** Several radius systems were mixed:
  - notched clip-path frames on stat and ability tiles
  - 10px cards after the formatting pass
  - 6px rows and buttons
  - 2px cards in the creation wizard
  - pill chips
- **Clip-path frames** relied on stacked `::before` and `::after` layers with `z-index: 1` on every child. That made the tiles fragile and fought the focus rings.
- **The manager band floated on the page background with no surface.** On Retro's dark page its labels became unreadable.
- **The ability box's notch at the bottom** clipped the score input at narrow widths.

### Interactivity and states
- **Focus rings existed, but were hidden on stat tiles** (`outline: none`) and on most custom controls.
- **Hover feedback came only from the border color.** There was no surface shift, and ghost buttons showed nothing on touch.
- **Empty states were bare grey sentences**, for example "No roll history yet." and "No characters yet".
- **The spell row caret was a text glyph** that JS swapped between ▸ and ▾ with no transition.

### Content
- **Em dashes appeared in visible strings:**
  - "Martial — no spell slots"
  - "Species: X — …"
  - "Natural 20 — back up with 1 HP"
  - "Spent — recharges on a long rest"
  - "Expertise active — double proficiency"
  - spell summaries
  - sync messages
- **Mixed symbols stood in for words**, for example `2✓ 1✗` on party cards and `◉` for concentration.
- **Title Case throughout**, as noted under Typography.

### Components
- **Every button was either filled (red or blue) or a bordered box.** There was no quiet tertiary style, and "secondary" was simply a second accent.
- **Every inner row (actions, resources, equipment, spells) was a bordered card inside a bordered card**, so borders doubled up on every panel.

### Iconography
- **Icons were hand-drawn inline SVGs** for the identity edit and done buttons.
- **Unicode stood in for icons:**
  - ▸ ▾ for carets
  - ★ for expertise
  - ↻ for reroll
  - ◉ for concentration
  - ✓ ○ ✗ for checklist and death-save marks
  - × and x for close
  - − and + for steppers
- **Emoji were used as class, species and background glyphs** in the creation wizard. They looked different on every operating system.
- **There was no favicon.**

### Code quality
- **The stylesheet was about 4,200 lines of layered overrides.** Later blocks re-declared earlier ones, for example `.tracker-row` three times, `.sheet-main .tabs` sticky and then static, and `.mod-chip:hover` twice.
- **5 `!important` rules** and **ad-hoc z-index values** (1, 2, 3, 30, 70, 1000) with no scale.
- **Theme blocks overrode component internals by selector** instead of only swapping tokens.

### Strategic omissions
- **No meta description, no favicon and no theme-color meta tag.**
- **No skip link.** Keyboard users had to tab through about 40 header controls to reach the sheet.
- **Saved themes ignored the system's light or dark preference** on first visit.

## Rebuild rules

- **Type:**
  - Geist for everything, with weights 400, 500, 600 and 700.
  - Geist Mono only for dice formulas and roll breakdowns.
  - Tabular figures everywhere.
  - Sentence case everywhere.
- **Color:**
  - Each theme defines the same tokens: page, surface, inset, line, ink, muted, one accent, and status colors for good, warning and bad.
  - Status colors appear only for HP state, death saves, encumbrance and warnings, never as decoration.
  - "Secondary" buttons are a tint of the accent, not a second hue.
- **Shape:** controls 8px, rows 8px, sections and dialogs 12px, chips fully round. No clip-path frames.
- **Surfaces:**
  - Sections are hairline-bordered surfaces with no shadow.
  - Only floating layers get tinted shadows: the sticky combat strip, menus, dialogs and toasts.
  - Inner rows are inset fills without borders.
- **Icons:** Phosphor regular, one family, replacing every emoji, unicode symbol and hand-drawn SVG.
- **Motion:**
  - 160 to 200ms ease-out on color and transform.
  - Pressed buttons scale to 0.98.
  - Panels, dialogs and toasts enter with a short fade and rise.
  - Everything is off under reduced motion.
- **Z-index scale:** base 1, sticky 20, menu 40, toast 60.
- **Kept as-is:**
  - Every ID and class the JS depends on.
  - The body states: `data-theme`, `role-dm`, `split-view`, `custom-bg` and `print-compact`.
  - The one-page print layout and the sticky combat strip.
  - The container queries on spell rows and ability tiles.
  - The 981 to 1279px two-column layout and the phone reflow at 980px and below.

## Structure, round 2 (reference-driven)

**References:**
- **Tidy 5e Sheets, "Quadrone" layout:**
  - a hero with the portrait, keeping HP and vitals together
  - a sidebar for skills
  - separate play and edit modes
- **D&D Beyond-style layout:**
  - a header banner and a row of ability cards
  - a skills column next to a tabbed box

**Structure:**
- **Top nav:** a floating pill holding the character switcher, search, Builder / Party / Campaign, Rest, Checklist, Level up and the Menu.
- **Character hero:** a gapless 12-column grid with `grid-auto-flow: dense`.
  - Row 1: the portrait (2 columns, spanning both rows), identity (4) and six stat tiles (6).
  - Row 2: the portrait continues (2) next to six ability cards with their saves (10).
- **Sticky sidebar:** HP with Damage and Heal, the concentration and dying prompts, skills and passives.
- **Tabs:** Combat, Spells (casters only), Inventory, Roleplay and Features.
- **Play mode by default.** Build values read as text: scores, proficiencies, AC, speed, max HP, and the action and resource definitions. The add and remove buttons are hidden.
  - Proficiencies show as dots.
  - **Edit sheet** unlocks all of it, and the hero gets an accent ring while you edit.
  - Live state stays editable in both modes: HP, temp HP, resource counts, slots, inventory and notes.
- **Phones:** one column in play order: name, HP, stat tiles, then abilities, skills and passives (collapsed), then the tabs.

**Not adopted from gpt-taste:** the hero / story page flow, scroll-pinned GSAP sections and stock photography. Those suit a landing page, not a sheet used during play. The motion that was kept is feedback only: tiles lift on hover, panels fade in with a stagger, and everything is off under reduced motion.
