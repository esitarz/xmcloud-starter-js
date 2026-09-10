---
description: "Review the working tree's uncommitted changes with the same ocp-code-review lenses as a PR review. Usage: /ocp-review-uncommitted. No ADO or worktree setup, only local diff acquisition and the shared ocp-code-review skill."
---

# /ocp-review-uncommitted

Apply the same code-level review as a PR review to local uncommitted changes. This prompt owns only diff acquisition; the rubric, risk ordering, methodology, and output format live in the ocp-code-review skill.

When invoked through `/ocp-ship`, read `.agents/skills/ocp-sdlc-router/SKILL.md` and treat this review as the mandatory, non-blocking self-review gate before shipping.

## 1. Acquire the diff

```powershell
git status --short
git diff --stat
git diff -- path/to/file
git diff --staged -- path/to/file
```

- Review both staged and unstaged changes.
- Include untracked files the user intends to keep (shown as ?? in git status) and read them directly.
- No ADO calls, no worktree, and no auth flow are required.

## 2. Apply shared review skill

Read and apply .agents/skills/ocp-code-review/SKILL.md.

Use its rubric, risk-priority order, incremental methodology, and required output format.
For large change sets, review one file at a time.

## 3. Report

Produce the ocp-code-review output format:

1. Findings by severity with file or line evidence and impact.
2. Open questions or assumptions.
3. Testing gaps or validation still needed.
4. Brief summary.

If no findings exist, say so explicitly and note residual risks.
No ADO comments are posted from this prompt; deliver the review in chat.
