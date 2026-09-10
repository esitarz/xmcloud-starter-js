---
description: Guided ship entry point for OCP Devcenter. Loads the shared router with a ship hint.
---

# /ocp-ship - Ship

This is the explicit ship entry point into the shared OCP Devcenter SDLC router.

1. Read `.agents/skills/ocp-sdlc-router/SKILL.md`.
2. Run the router's Step 1 state detection with entry hint `ship`.
3. Read and execute `.github/prompts/ocp-review-uncommitted.prompt.md`; present findings before shipping.
4. Run `tools/sync-branch.ps1` and stop on conflict or error.
5. Read and follow `.github/agents/org-dev-workflow.agent.md` inline.
6. Obtain separate approval for the commit message and Azure DevOps PR title/description.
7. Archive the spec through `.github/prompts/org-spec-lifecycle.prompt.md` and evaluate service-context updates.
8. Push and create the Azure DevOps PR with the `AI-assisted` label.
9. Transition the OCP ticket to `Awaiting Review` only when PR is ready for review.
