---
owner: "@platform-team"
applyTo: "**"
enforcement: recommended
---

> **Org recommendation.** These are org-wide defaults. If this repository has its own conventions that conflict, follow the repo-specific guidance.

# Workflow Standards

Policies for commits, PRs, AI-assisted labeling, spec lifecycle. Apply to every agent and workflow.

## Commit Format

- Ticketed-work commits MUST begin with Jira ticket ID. Format:

```
PROJ-123 Short description of what changed

Optional longer description explaining:
- Why this change was made
- Any important context
- Breaking changes if applicable
```

- Exception: commits that *only* modify proposal files (`specs/proposal-*.md`) do not require a ticket ID.
- Derive ticket ID: check branch name first (e.g. `feature/PROJ-123-user-auth`); if absent, ask developer.

## Pull Request Policy

### Title Format

```
PROJ-123: Short description of the feature or fix
```

### Description Template

```markdown
## Summary
[Brief description of what this PR does]

## Jira Ticket
[PROJ-123](https://sitecore.atlassian.net/browse/PROJ-123)

## Changes
- [Change 1]
- [Change 2]

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed

## Service Context
- [ ] No service context update needed
- [ ] `.github/service-context.md` updated (APIs, data models, business rules, or architecture changed)

## Spec Reference
[Link to spec if applicable: `/specs/PROJ-123-feature-name.md`]
```

### Requirements

- Keep PRs focused on a single concern.
- Include Jira ticket ID in PR title.
- Every PR created with AI assistance MUST include `AI-assisted` label (see below).

## AI-Assisted Labeling (Required for LinearB Tracking)

- Any PR where AI tools used at any stage MUST have `AI-assisted` label. Required for LinearB metrics per company policy.
- Counts as AI-assisted:
  - AI suggested lines of code or improvements
  - AI analyzed code for bugs, security issues, or performance
  - AI helped generate the PR description
  - AI assisted with code review or refactoring
  - AI helped with adherence to coding standards
- Manually reviewing/modifying AI suggestions still counts as AI-assisted.
- Exception: do NOT apply label on public/open source repositories.
- GitHub CLI: include `--label "AI-assisted"` in every `gh pr create`:
```
gh pr create --title "PROJ-123: Description" --body "..." --label "AI-assisted"
```
- If using GitStream: repo may show checkbox comment (`- [ ] AI-assisted`). Check box if applicable; GitStream auto-applies label.
- Label setup: `AI-assisted` label must exist before PR creation. If missing, create via Issues → Labels → New label before `gh pr create`.

## Spec Lookup

- When working a Jira ticket, check `/specs/` for spec file matching ticket ID (e.g. `PROJ-123-feature-name.md`). Use as context.

## Spec Archival Policy

When a PR is merged, archive that ticket's spec in the same PR:

1. Move to `/specs/archive/`: `git mv specs/PROJ-123-feature.md specs/archive/`
2. Update `status` to `completed` in frontmatter
3. Commit: `PROJ-123 Archive spec`

- Archive (not delete): spec holds rationale, rejected alternatives, edge-case decisions not in Jira/code; preserves institutional memory.
- Archive in the PR: spec may have changed during implementation; bundling keeps it reviewable with code.
- Keeps `/specs/` on current work, `/specs/archive/` as searchable history.
