---
description: The full lifecycle for spec files — from initial proposal through active development to archival. Use this as the reference for how specs are named, stored, finalized, and retired.
---

# Spec Lifecycle

Spec files live under `specs/` at the repo root. They evolve across sessions — git history is the version trail, not file copies.

## Status Values

| Status | Meaning |
|--------|---------|
| `draft` | Under discussion, not yet confirmed for implementation |
| `ready` | Confirmed, development can begin |
| `in-progress` | Implementation has started |
| `completed` | All work delivered |
| `archived` | Moved to `specs/archive/` — implementation merged, spec is now a historical record |

## File Organization

```
specs/
  <initiative-slug>/          # Topics grouped under an initiative
    _overview.md              # Initiative-level summary
    <topic-slug>.md           # Living topic spec
    <topic-slug>.stories.md   # All stories for this topic

  <topic-slug>.md             # Standalone spec (no initiative)
  <topic-slug>.stories.md     # Stories for a standalone spec

  archive/                    # Completed work
    <initiative-slug>/
    <topic-slug>.md
```

## Spec Frontmatter

```yaml
---
topic: <topic-slug>
initiative: <initiative-slug>   # omit for standalone specs
status: draft
author: <author name>
created: <YYYY-MM-DD>
sessions:
  - date: <YYYY-MM-DD>
    slug: <session-slug>
    attendees: [<names>]
---
```

## Phase 1 — Create (Draft)

A new spec starts as `status: draft`. The file path and branch name use slugs per [slug-generation.prompt.md](slug-generation.prompt.md).

**For a product-planning proposal** (spec not yet tied to a Jira ticket):
- File: `specs/proposal-<slug>.md`
- Branch: `specs/proposal-<slug>`
- No `ticket:` frontmatter field yet
- Save using [git-branch-and-save.prompt.md](git-branch-and-save.prompt.md)

**For a refinement-session spec** (created from a transcript):
- File: `specs/<initiative>/<topic-slug>.md` (or `specs/<topic-slug>.md` if standalone)
- Branch: `specs/refinement-<session-slug>`
- Save using [git-branch-and-save.prompt.md](git-branch-and-save.prompt.md)

## Phase 2 — Finalize (ready)

When a Jira ticket is created for the spec:

1. **For a proposal file**, rename it:
   - `git mv specs/proposal-<slug>.md specs/<TICKET-ID>-<slug>.md`
   - Update frontmatter: add `ticket: <TICKET-ID>`, change `status: draft` → `status: ready`
   - Commit: `git add specs/ && git commit -m "<TICKET-ID> Finalize spec for <slug>"`
   - Push if on a pushed branch

2. **For a refinement spec**, update in place:
   - Add `ticket: <TICKET-ID>` (or update story `**Ticket:**` fields in `.stories.md`)
   - Change `status: draft` → `status: ready` once all stories are ticketed
   - Commit: `git add specs/ && git commit -m "<TICKET-ID> Finalize spec with ticket IDs for <session-slug>"`

**Spec content is never changed during finalization** — all requirements, examples, open questions, and notes carry through intact.

## Phase 3 — Active Development (in-progress)

Update `status: in-progress` when development begins. No file moves. The spec is the developer's primary reference alongside the Jira ticket.

**Specs must be self-contained:** anyone reading only the spec should understand the work completely, without needing the original conversation or Jira ticket. When updating, capture:
- Decisions made (what was chosen and why)
- Alternatives rejected
- Edge cases discovered during implementation
- Open questions and their resolutions

## Phase 4 — Archive (archived)

When the implementing PR is merged, archive the spec **in the same PR**:

**For initiative-scoped specs:**
- `git mv specs/<initiative>/<topic-slug>.md specs/archive/<initiative>/<topic-slug>.md`
- Move the companion `.stories.md` alongside
- Update `status: archived` in frontmatter
- If this is the last topic in the initiative, also move `_overview.md`

**For standalone or proposal-based specs:**
- `git mv specs/<TICKET-ID>-<slug>.md specs/archive/`
- Update `status: archived` in frontmatter
- Commit: `TICKET-ID Archive spec`

**Why archive, not delete?** The spec contains rationale, rejected alternatives, and edge-case decisions not captured in Jira or code. Archiving preserves institutional memory — "why did we build it this way?" has real value.

**Why in the PR?** The spec may have been updated during implementation. Bundling the archive with the code keeps everything reviewable together and ensures the archive reflects the final state.

This keeps `specs/` focused on current work. `specs/archive/` is searchable history.

## Spec Discovery

When looking for an existing spec for a given topic, check in this order:

1. **Frontmatter `topic:` match** — scan `specs/*/` and `specs/` root for `.md` files (exclude `_overview.md`, `*.stories.md`, and anything under `specs/archive/`) whose `topic` frontmatter matches.
2. **Filename match** — check whether `<topic-slug>.md` exists anywhere under `specs/`.
3. **Content fallback** — grep spec titles (`# <Title>`) for topic keywords.

If no match is found, create a new spec. Never write to `docs/specs/` — that path is legacy.
