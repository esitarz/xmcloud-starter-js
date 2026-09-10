---
description: Rules for deriving slugs used in file names and branch names. Apply these rules every time you generate a slug from a user-supplied string, title, or label.
---

# Slug Generation

A **slug** is the identifier used in file names, directory names, and branch names. Apply these rules every time you derive a slug — from a story title, area name, session label, spec title, or any user-supplied string.

## Rules

1. **Character set:** `[a-z0-9-]` only.
2. **Derive from the source string:**
   - Lowercase the entire string
   - Replace all whitespace with `-`
   - Strip every character that is not an ASCII letter, digit, or `-`
   - Collapse runs of `-` to a single `-`
   - Trim leading and trailing `-`
3. **Length:** truncate to 50 characters maximum. Re-trim trailing `-` after truncation.
4. **Reject** any slug that:
   - Is empty after transformation
   - Is equal to `.` or `..`
   - Was derived from a source string that originally contained `\` or null bytes

   If rejection occurs, **stop and ask the user for a replacement** — never fall back to a generated or transliterated value silently.

5. **Collision:** if the derived slug collides with an existing file or branch name, append `-2`, `-3`, and so on. Inform the user when this happens.

## Examples

| Source string | Slug |
|---------------|------|
| `User Authentication` | `user-authentication` |
| `API Retry Logic (v2)` | `api-retry-logic-v2` |
| `Fix: 500 error on /checkout` | `fix-500-error-on-checkout` |
| `résumé upload` | `rsum-upload` *(non-ASCII stripped — ask user to confirm or replace)* |
| `a/b test` | `ab-test` |

## Branch Name Conventions

Branch names are built from slugs. The calling agent determines the prefix:

| Context | Branch format |
|---------|--------------|
| Feature work | `feature/<ticket-id>-<slug>` |
| Bug fix | `fix/<ticket-id>-<slug>` |
| Spec proposal (product-planning) | `specs/proposal-<slug>` |
| Refinement session | `specs/refinement-<session-slug>` |
| Pre-read prep | `specs/prep-<slug>` |
| Architecture promotion | `promote/<initiative-or-spec-slug>` |

The slug portion of every branch name must satisfy all rules above.

## Paths Are Never Written Without a Valid Slug

Do not write a file path or create a git branch until the slug has been run through these rules. If you are uncertain whether a string is safe, apply the rules and show the result to the user before writing.
