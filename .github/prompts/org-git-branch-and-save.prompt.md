---
description: Standard procedure for branching, committing, and pushing files. Use this whenever you need to save work to git.
---

# Git Branch and Save

Use this procedure any time you need to save files to a branch. Apply slug rules ([slug-generation.prompt.md](slug-generation.prompt.md)) to the branch name before running any git commands.

## Step 1 — Detect the Default Branch

Always detect dynamically — never hardcode `main`, `master`, or `dev`:

```bash
DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name)
```

If `gh` CLI is not available, ask the user what their default branch is.

## Step 2 — Check for an Existing Branch

Before creating a new branch, check whether one already exists for this work:

- If the user is already on a relevant branch, **stay on it**.
- If a remote branch exists but isn't checked out locally, check it out: `git checkout <branch-name>`.
- Only create a new branch if none exists yet.

## Step 3 — Ask How to Save

Present the user with these options:

> "How would you like to save?
>
> 1. **Commit and push** — I'll branch, commit, and push to the remote.
> 2. **Commit only** — I'll branch and commit locally, but won't push yet.
> 3. **Local only** — I'll just write the file(s) to disk, no git.
> 4. **Chat only** — Leave the content here for copy-paste. No file writes. *(Only offer this option when the output is not a required file artifact.)*"

## Step 4 — Execute

### Option 1: Commit and push

```bash
git checkout $DEFAULT_BRANCH && git pull
git checkout -b <branch-name>
# write files here
git add <paths> && git commit -m "<TICKET-ID> <description>"
git push -u origin <branch-name>
```

Confirm:
> "Saved and pushed to `<file-path>` on branch `<branch-name>`."

### Option 2: Commit only

```bash
git checkout $DEFAULT_BRANCH && git pull
git checkout -b <branch-name>
# write files here
git add <paths> && git commit -m "<TICKET-ID> <description>"
```

Confirm:
> "Committed to branch `<branch-name>` (not pushed). I can push when you're ready."

### Option 3: Local only

Write the file(s) to disk. No git operations.

Confirm:
> "Saved locally to `<file-path>` (not committed). I can commit it when you're ready."

## Important Rules

- **Never commit or push directly to the default branch.** All writes go to a feature branch.
- If the user later asks to commit a locally-saved file, create the feature branch first.
- Commit messages must follow the format in `workflow-standards.instructions.md`: `TICKET-ID Short description`.
- For spec and proposal files, the branch prefix follows the convention of the agent running this procedure (e.g., `specs/proposal-<slug>`, `specs/refinement-<slug>`, `feature/<ticket-id>-<slug>`).
