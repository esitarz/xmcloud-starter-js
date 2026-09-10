---
name: ocp-worktree-isolation
description: >-
  OCP Devcenter worktree isolation workflow for keeping unrelated local changes safe during
  planning/build work and for reviewing Azure DevOps pull requests in a detached worktree.
  Use with tools/create-worktree.ps1 and tools/remove-worktree.ps1.
user-invocable: false
---

# OCP Worktree Isolation

Use a sibling worktree when the current working tree contains unrelated changes or when a PR
review must not alter the main checkout. Worktree setup is mechanical; branch and review decisions
remain with the router and review prompts.

## Implementation Isolation

1. Confirm the work is unrelated to the current checkout.
2. Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\create-worktree.ps1 -Description "<short description>"
```

3. Read the returned JSON. Continue only when `status` is `created` or `reused`.
4. Work in the returned `path`; keep the original checkout untouched.
5. Remove the worktree after delivery:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\remove-worktree.ps1 -Path "<returned path>"
```

## Pull Request Review

Create a detached PR worktree with:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\create-worktree.ps1 -PullRequest <PR#>
```

Review only in the returned path and remove it afterward with `remove-worktree.ps1 -PullRequest <PR#>`.

## Safety Rules

- Never discard or overwrite the original working tree to create isolation.
- Stop on a helper result with `status: error` and report its message.
- Do not manually delete a worktree directory while Git still registers it.
- Do not push or commit from a detached PR-review worktree.
