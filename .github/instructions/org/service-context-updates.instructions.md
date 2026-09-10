---
owner: "@platform-team"
applyTo: "**"
enforcement: recommended
---

> **Org recommendation.** Org-wide defaults. If repo conventions conflict, follow repo-specific guidance.

# Service Context Update Policy

- Every PR MUST be evaluated for whether `.github/service-context.md` needs updating. Not optional.

## When to Update

Update `.github/service-context.md` if PR includes any of:

- New API endpoints, or changes to existing ones
- Data model changes (new fields, renamed entities, schema changes)
- Business rules added or modified
- Architecture changes (new dependencies, infrastructure, messaging patterns)
- Authentication or authorization changes
- New integrations or external service dependencies

## When to Skip

Skip if PR contains only:

- Bug fixes that don't change behavior or contracts
- Refactors with no external-facing changes
- Test-only changes
- Documentation or tooling changes

## How to Check

1. **Review the diff** — do changed files touch API controllers/routes, data models, configuration, or business logic?
2. **Scan current service context** — is affected area already documented in `.github/service-context.md`?
3. **If uncertain, ask developer:**
   > "Does this PR change any APIs, data models, business rules, or architecture? If so, `.github/service-context.md` should be updated in this PR so documentation stays in sync with the code."

## How to Update

1. Open `.github/service-context.md`, update relevant sections
2. Commit: `TICKET-ID Update service context`
3. Include in the PR — reviewer verifies docs match code

- **Why in the PR?** Docs updated separately from code get forgotten. Bundling = reviewer sees both, docs accurate when code ships.
- **Merge conflicts:** Service context is markdown — conflicts rare/trivial (usually two people adding to different sections). Minor conflicts preferable to stale docs.

## PR Checklist Item

Every PR description MUST include one of these checked boxes:

```markdown
## Service Context
- [ ] No service context update needed
- [ ] `.github/service-context.md` updated (APIs, data models, business rules, or architecture changed)
```
