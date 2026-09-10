---
owner: "@platform-team"
applyTo: "**"
enforcement: recommended
---

> **Org recommendation.** Org-wide defaults. If repo conventions conflict, follow repo-specific guidance.

# Coding Standards

## Code Style

- Follow existing codebase patterns
- Clarity over cleverness
- Name descriptively; readers understand without comments

## Error Handling

- Never swallow errors silently
- Log errors with context (operation that failed, relevant IDs)
- Return meaningful error messages to users; don't expose internals

## Testing

- New features require tests
- Bug fixes require a test that would have caught the bug
- Test behavior, not implementation details

## When Generating Code

- Match surrounding code style
- No new dependencies without explicit approval
- Prefer standard library over external packages
- Include error handling from the start

## Commit Messages

Include a Jira ticket ID in every commit on ticketed work:

```
PROJ-123 Short description of change

Optional longer description explaining why, not what.
```

**Format:** `TICKET-ID Description` (e.g., `PROJ-123 Add user authentication`)

**Exception:** Commits that *only* modify proposal files (`specs/proposal-*.md`) need no ticket ID — proposals are pre-approval ideation, no ticket yet.

See `workflow-standards.instructions.md` for full commit, PR, labeling, and spec archival policies.
