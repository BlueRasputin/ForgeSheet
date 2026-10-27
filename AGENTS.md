# ForgeSheet: rules for coding agents

ForgeSheet is a D&D 5e character sheet that runs entirely in the browser: vanilla HTML, CSS and JavaScript with no
build step, deployed as static files (Vercel) with optional Firebase sign-in, cloud saves and campaign sync.

This file is the single source of the project rules. Gemini CLI reads it through `GEMINI.md`; Jules, Codex and other
agents read it directly; Claude Code reads it through `.claude/skills/forgesheet-rules`. Edit the rules here only.

Enforce these rules on every change. If a requested change would break one, say which rule and propose a compliant
alternative instead of writing the violation.

## Commands

- Run locally: `python3 tools/serve.py 8080`, then open http://localhost:8080 (opening `index.html` from disk also
  works, but Google sign-in needs a server origin).
- Check data and core math: `node tools/check_data.js`. It must print `OK: ...` before any change is done.
- Rebuild bundled open rules data (only when updating it): `node tools/build_srd_spells.js`,
  `node tools/build_srd_beasts.js`, `node tools/build_srd_2024.js`.
- Deploy: `vercel --prod` (hosting), `firebase deploy --only firestore:rules` (database rules).

## Stack

- Vanilla JavaScript, HTML and CSS only. No frameworks, no build step, no npm dependencies in the app.
- JavaScript lives in domain modules under `js/`, loaded as plain `<script>` tags in dependency order at the bottom of
  `index.html`. No static `import`/`export`: the app must also work from `file://`. The only dynamic `import()` calls
  load pinned CDN modules (Firebase, pdf.js) through URL constants in `js/data.js`.
- Load order (each file may only call, at load time, functions from itself or earlier files; runtime calls can go in
  any direction):
  - Data: `utils`, `data`, `expansions`, `srd-spells`, `srd-beasts`, `srd-2024`, `rules-spells`, `rules-classes`,
    `rules-subclasses`, `rules-feats`.
  - Engine and screens: `classes`, `character`, `layout`, `spells`, `sheet`, `builder`, `play`, `equipment`, `party`,
    `rules-reference`, `rules`, `import`, `sync`, `settings`, `dice`, `export`, `tooltips`.
  - Startup: `main` (last).
- New code goes in the module whose domain it belongs to. Create a new module only for a genuinely new domain, add its
  script tag in dependency order, and add it to the module list in `tools/check_data.js`.
- External scripts only through the existing pinned-CDN pattern (versioned URL constants in `js/data.js`), and only
  with the user's explicit approval.
- Bump the `?v=` query on a changed script or stylesheet tag in `index.html` so browsers pick up the new file.

## JavaScript

- Match the existing style: `const`/`let` (never `var`), template literals, arrow functions for callbacks, named
  `function` declarations for top-level functions.
- Every user-provided, imported, synced or character-data string rendered into HTML goes through `escapeHtml()`. No
  exceptions. Data from Firestore, imported files and PDFs is untrusted: normalize it (see `normalizeCharacter()`).
- Character state lives in the `character` object (`js/character.js`) and persists through `persist()` /
  `persistAndRender()`. Never write character data to `localStorage` directly.
- Device-only preferences (theme, colors, dice mode, easy mode in `js/settings.js`; AI keys) use their own small
  load/save helpers in their module, wrapped in try/catch. Player API keys never sync to the cloud or go into exports.
- New character fields must be added in BOTH `defaultCharacter()` and `normalizeCharacter()` in `js/character.js`, so
  old saved characters keep loading.
- DOM lookups use `document.querySelector`. Event listeners are bound once in `bindEvents()` (`js/main.js`); dynamic
  rows use event delegation on their container, not per-row listeners.
- Rendering is one-way: `render*()` functions read state and write the DOM. Never read state back out of the DOM.
- Class rules go through the multiclass-aware helpers (`classEntries()`, `entryClass()`, `classLevel()`,
  `totalLevel()`), not `currentClass()` / `character.level` alone, so a feature works whether its class came first or
  later. `entryClass()` returns a class's 2024 version when that class is set to the 2024 rules.

## Rules content

- Two editions are supported side by side: the 2014 rules (default) and the 2024 revision, chosen per class. Label every
  rule with its edition and never present one edition's rule as the other's.
- Rules text in the app is original wording: summaries in plain language with exact numbers. Never copy sentences from
  the books. Open SRD text (SRD 5.1 for 2014, SRD 5.2 for 2024, both CC-BY-4.0) may be bundled as generated data with
  the attribution kept in `README.md` and the Rules reference dialog.
- Verify rules against a source (the SRD, or the user's own book) rather than memory, and cite the book and page.
- Optional and house rules are opt-in per character (the homebrew prompt and Settings), never silent defaults.

## CSS

- Use the existing custom properties: `--bg`, `--surface`, `--inset`, `--field`, `--line`, `--line-strong`, `--ink`,
  `--ink-soft`, `--muted`, `--accent`, `--accent-strong`, `--on-accent`, `--good`, `--warn`, `--bad` and the derived
  `--accent-soft` / `--accent-line`. Never hardcode a color a theme should control.
- Every visual change must work in all four themes, `beyond` (default), `light`, `dark` and `retro`, and with the
  player's custom accent and background colors. Check each before calling it done.
- Shapes: `--r-chip` 8px, `--r-control` 12px, `--r-card` 20px. Buttons, tabs and chips are pills.
- Respect `prefers-reduced-motion`; motion goes inside `@media (prefers-reduced-motion: no-preference)`.

## General

- Think before coding: state assumptions, ask when a request is ambiguous, push back when a simpler approach exists.
- Minimum code that solves the problem. No speculative features, abstractions for one caller, or unrequested options.
- Surgical changes: touch only what the request needs, match the surrounding style, don't reformat or rename
  unrelated code. Mention unrelated dead code instead of deleting it; remove what your own change made unused.
- No commented-out code. Comments only for non-obvious constraints and rules sources, never to restate the code.
- Validate at trust boundaries (Firestore data, imports, API responses). Secrets stay out of git; the Firebase web
  config in `js/data.js` is public by design, and `firestore.rules` is what protects the data.
- Verify before calling work done: run `node tools/check_data.js`, exercise the change in a browser, and say plainly
  what was and wasn't tested.
- If a change touches the saved-character shape, persistence, theming or the Firestore data shape (including the
  versioned `partyStatus` contract in `INTEGRATION.md`), state the migration and compatibility impact in the summary.
