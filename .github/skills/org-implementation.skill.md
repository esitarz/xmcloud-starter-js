---
description: Use before writing implementation code for a feature or fix. Enforces upfront thinking — plan first, grill out thin requirements, build test-first, and verify with the repo's own lint/test commands. Use when a developer is about to start building, says "let's implement", "start coding", or jumps toward code before planning.
---

# Implementation

Front-load the thinking. Most wasted effort comes from coding before the requirements, plan, and tests are clear. Walk these gates in order. Don't skip ahead to code.

## 1. Resolve requirements before planning

If the requirements are thin, ambiguous, or design-level (a choice between approaches, a new component, a behavior change), **delegate to the grill-me skill** and stop until the design is resolved. Don't guess.

Trivial, well-understood work (a one-line fix, a rename) skips this — say so and move on.

## 2. Plan before code

Produce a TodoWrite checklist before touching implementation code:

- One todo per discrete, verifiable step.
- Order them; note dependencies between steps.
- Keep each step small enough to test.

Confirm the plan with the developer before writing code. This is the upfront-thinking gate — do not write implementation code until the plan exists.

## 3. Build test-first (default)

Default to writing the failing test first, then the code that makes it pass, one todo at a time.

- Copy the shape of the repo's existing tests — same framework, same layout, same naming.
- **Greenfield exception:** if there are no existing tests to follow and no test harness set up, test-first is harder and may not be reasonable yet. Say so, propose the lightest way to get a first test in place, and let the developer decide rather than forcing it.

## 4. Verify before handing off

Discover and run the repo's own lint and test commands — never hardcode a language's commands. Discover in this order:

1. Repo-specific instructions (`copilot-instructions.md`, `.github/instructions/`, `CONTRIBUTING.md`).
2. Common manifests — `Makefile` targets, `package.json` scripts, `go.mod`/`pyproject.toml`/`Cargo.toml`, etc.
3. If none found, **ask the developer** for the lint/test command. Don't fabricate one.

**Surface the result — don't block.** Report what ran and whether it passed. If checks fail, are missing, or weren't run, say so plainly and let the developer decide whether to proceed. Never claim success without having run the checks.

## Repo overrides

These are org-default gates. If this repo defines its own development process (in `copilot-instructions.md` or `.github/instructions/`), follow that where it conflicts.
