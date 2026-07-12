---
name: strict-rules
description: Strict coding rules for this repo. Use when writing, editing, or reviewing any code in this project, or when the user invokes /strict-rules.
---

Enforce these rules on every code change. If a requested change would violate one, say which rule and propose a compliant alternative instead of writing the violation.

## Stack

- Vanilla JavaScript, HTML, and CSS only. No frameworks, no build step, no npm dependencies.
- JavaScript lives in domain modules under `js/`, loaded as plain `<script>` tags in dependency order in `index.html` (no `import`/`export` — the app must work over `file://`). Each file owns one domain: `utils`, `data`, `classes`, `character`, `layout`, `spells`, `sheet`, `builder`, `play`, `equipment`, `party`, `rules`, `import`, `sync`, `main`.
- New code goes in the module whose domain it belongs to. Only create a new module for a genuinely new domain (e.g. a new tab), and add its script tag in dependency order.
- Load-order rule: code that runs at file load (top-level `let x = loadX()` initializers, constant tables built by factories) may only call functions defined in its own file or an earlier-loaded one. Runtime calls can go in any direction.
- External scripts only via the existing CDN-pinned pattern (versioned URL constants in `js/data.js`), and only with the user's explicit approval.

## JavaScript

- Match the existing style: `const`/`let` (never `var`), template literals, arrow functions for callbacks, named `function` declarations for top-level functions.
- All user-provided or character-data strings rendered into HTML go through `escapeHtml()`. No exceptions.
- State lives in the `character` object (`js/character.js`) and persists through `persist()` / `persistAndRender()`. Never write to `localStorage` directly outside the established helpers.
- New character fields must be added in BOTH `defaultCharacter()` and `normalizeCharacter()` in `js/character.js` so old saved characters don't break.
- DOM lookups use `document.querySelector`. Event listeners are bound once in `bindEvents()`; dynamic rows use event delegation on the container, not per-row listeners.
- Rendering is one-way: `render*()` functions read state and write DOM. Never read state back out of the DOM.

## CSS

- Use the existing CSS custom properties (`--ink`, `--panel`, `--accent`, ...) — never hardcode colors that a theme should control.
- Every visual addition must work in all three themes: `light`, `dark`, `retro`. Check each before calling it done.
- Match existing values: `border-radius: 2px`, `var(--panel-soft)` backgrounds, `1px solid var(--line)` borders.

## General

- No dead code, no commented-out code, no speculative abstractions. If it has one caller, inline it.
- No comments that restate the code. Comments only for non-obvious constraints.
- Keep diffs minimal: don't reformat, rename, or "clean up" lines the change doesn't require.
- If a change touches saved-character shape, theme handling, or persistence, state the migration/compat impact explicitly in the summary.
