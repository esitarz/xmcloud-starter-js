---
name: ocp-code-review
description: >-
  Shared code-review rubric, risk-priority ordering, incremental methodology, and
  required output format for Devcenter OCP workflows. Use whenever reviewing code changes
  from a PR prompt, uncommitted changes, or an informal review request. Owns the
  review process and output contract; criteria come from repo conventions,
  scoped instructions, and org security guidance.
---

# Code Review (shared core)

This skill owns how to review and what the output looks like, not the rules
by themselves. Evaluate every change against criteria that already live elsewhere:

- Repository conventions and patterns in AGENTS.md and repo instructions.
- Matching scoped instruction files under .github/instructions/ocp/*.instructions.md when present.
- Security guidance in [org/security-review](../../../.github/instructions/org/security-review.instructions.md).

## Review rubric - evaluate every change for

- Security flaws, including hardcoded secrets, sensitive logging, injection risks, and missing authorization or ownership checks.
- Regression bugs or unintended behavioral changes.
- Async and performance issues, including blocking calls, missing async flow, and high-cost patterns.
- Test coverage gaps.
- Adherence to ticket, naming, and workflow conventions.
- Concurrency and race-condition risks.

## Risk-priority order (review in this order)

1. Startup and pipeline configuration
2. Authentication and middleware
3. Data and service models
4. Tests

## Incremental methodology

- Do not request full large diffs up front. List changed files, prioritize by risk, and inspect one file at a time.
- For each file, read changed hunks first, then the containing method or class, then directly referenced symbols.
- Keep scope tight to changed areas unless a dependency requires broader inspection.

## Workflow integration

- Read `.agents/skills/ocp-sdlc-router/SKILL.md` when a review is entered through an `/ocp-*` workflow.
- Use `.agents/skills/ocp-worktree-isolation/SKILL.md` for PR-review worktrees.
- Use `.agents/skills/ocp-jira-workflow/SKILL.md` for OCP ticket context and status transitions.

## Required output format

1. Findings ordered by severity, each with file or line evidence and impact.
2. Open questions or assumptions.
3. Testing gaps or validation still needed.
4. Brief change summary (secondary).

If no findings are present, state that explicitly and call out residual risks.
