---
description: "Review an Azure DevOps pull request in OCP Devcenter. Usage: /ocp-review-pr <PR#>. Handles ADO metadata, Jira context, worktree setup, incremental diffing, AI-assisted label checks, and posting workflow; then applies the shared ocp-code-review skill."
---

# /ocp-review-pr <PR#>

Deterministic entry point for reviewing an Azure DevOps PR. This prompt owns the PR-only mechanics; the review rubric, risk ordering, methodology, and output format live in the ocp-code-review skill.

Read and apply `.agents/skills/ocp-code-review/SKILL.md` during the review. Read
`.agents/skills/ocp-worktree-isolation/SKILL.md` for worktree setup and cleanup.

## Prerequisites

- Agent mode is required because this workflow runs terminal commands.
- origin must point to the main repo, not a fork.
- Use a git worktree for review isolation.

## Repo coordinates (use directly, do not rediscover)

- Project: Devcenter (id 2b8bb105-9a5c-41b8-9219-384eb43f287a)
- Repository: Devcenter (id 1d7cb40e-1f75-4dbf-ba23-893085fec4bd)

Only if a call returns not-found, fall back to listing projects and repositories.

## 1) Fetch PR metadata

Use Azure DevOps pull request tooling to fetch:
- Source and target branches
- Changed files
- Labels
- Linked work items

If metadata tooling is unavailable, state the limitation and continue with a git-derived review.

## 2) Detect Jira context

Scan branch name, PR title, and commit messages for Jira keys using pattern [A-Z]+-\d+.
For detected keys, fetch summary/status and compare acceptance criteria against the diff.

## 3) Set up worktree

Use the helper to ensure PR refs are fetchable, then create or reuse a worktree for the PR:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\create-worktree.ps1 -PullRequest <PR#>
```

Read the JSON result and operate inside its returned `path`. Stop on `status: error`.

## 4) Diff incrementally

Always diff against the target branch returned by PR metadata.

```powershell
git diff origin/<target-branch>..HEAD --name-status
git diff origin/<target-branch>..HEAD -- path/to/file
```

Review one file at a time in risk-priority order from the shared skill.

## 5) Apply shared review skill

Read and apply .agents/skills/ocp-code-review/SKILL.md.

## 6) AI-assisted label check

If AI-assisted is missing, flag that it should be added per workflow standards.

## 7) Posting workflow

Always ask for approval before posting to ADO.
Prefer line-anchored comments for concrete findings and one summary comment for cross-cutting notes.

## 8) Cleanup

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\remove-worktree.ps1 -PullRequest <PR#>
```
