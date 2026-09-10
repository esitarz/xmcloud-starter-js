---
owner: "@platform-team"
applyTo: "**"
enforcement: required
---

# Org AI Governance

AI instructions/agents/prompts synced from central `sitecore.ai.sdlc` repo.

## Where Files Come From

| Location | Contents | Managed by |
|----------|----------|------------|
| `.github/instructions/org/` | Org-wide instruction files | Central sync — wipe-and-replace each sync |
| `.github/agents/org-*.agent.md` | Org-wide agents | Central sync — stale files removed each sync |
| `.github/prompts/org-*.prompt.md` | Org-wide prompts | Central sync — stale files removed each sync |
| `.github/instructions/` (non-`org/`) | Repo-specific instructions | This repo's team |
| `.github/agents/` (no `org-` prefix) | Repo-specific agents | This repo's team |
| `.github/prompts/` (no `org-` prefix) | Repo-specific prompts | This repo's team |
| `.github/copilot-instructions.md` | Repo-wide always-on rules | This repo's team — never overwritten by sync |

## Instruction Precedence

All matching instruction files combined. On conflict apply this order:

1. **`enforcement: required` org instructions** — always followed; repo-specific cannot override.
2. **Repo-specific instructions** (`.github/instructions/` outside `org/`, or `.github/copilot-instructions.md`) — precede recommended org instructions.
3. **`enforcement: recommended` org instructions** — org defaults; yield to repo-specific on conflict.

## Adding Repo-Specific Rules

- Add `.instructions.md` files to `.github/instructions/` (not inside `org/`)
- Or document in `.github/copilot-instructions.md`
- Override a `recommended` org instruction: state repo's convention; AI follows it
- Cannot override `required` org instructions
