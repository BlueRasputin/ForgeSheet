---
name: strict-rules
description: Universal coding rules and behavioral guidelines for every project. Use when writing, editing, or reviewing code in any repo, or when the user invokes /strict-rules. If the repo has its own project rules skill (`<project>-rules` in .claude/skills), apply both; the project skill wins on conflicts.
---

Enforce these rules on every code change. If a requested change would violate one, say which rule and propose a compliant alternative instead of writing the violation.

## 1. Think before coding

- Check for a project rules skill in `.claude/skills/` and follow it alongside these rules.
- State assumptions explicitly. If uncertain, ask rather than guess.
- When a request is ambiguous, present the interpretations instead of picking one silently.
- Push back when a simpler approach exists. Stop and name what's unclear when confused.

## 2. Simplicity first

- Minimum code that solves the problem. No features beyond what was asked.
- No abstractions for single-use code, no unrequested flexibility or configuration, no error handling for impossible scenarios.
- Match the stack already in use. No new frameworks, build steps, or dependencies without explicit approval.
- The test: would a senior engineer call this overcomplicated? If yes, simplify.

## 3. Surgical changes

- Touch only what the request needs. Every changed line should trace to it.
- Match the surrounding style (naming, idioms, formatting, comment density), even if you'd do it differently.
- Don't reformat, rename, refactor, or "improve" adjacent code. Mention unrelated dead code; don't delete it unless asked.
- Remove imports/variables/functions that your own change made unused. Never leave commented-out code.
- Comments only for non-obvious constraints, never to restate the code.

## 4. Safety at the boundaries

- Escape all user-provided or external strings rendered into HTML (or use the framework's safe rendering).
- Validate at trust boundaries: request bodies, path params, file contents, third-party API responses.
- Identity comes from the authenticated session/token, never from a client-supplied user id.
- Secrets live in gitignored env/config files. Never commit a key, token, or password.

## 5. Styling

- Use the project's existing design tokens. Never hardcode colors a theme should control.
- Every visual change must work in every theme the project ships. Check each before calling it done.

## 6. Goal-driven execution

- Turn tasks into verifiable goals: "fix the bug" → reproduce it in a test, then make it pass; "refactor X" → tests pass before and after.
- For multi-step work, state a brief plan: `step → verify: check`.
- If a change touches persisted data shape (DB schema, saved files, localStorage), auth, or theming, state the migration/compat impact in the summary.
