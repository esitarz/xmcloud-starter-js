---
description: Guided planning entry point for OCP Devcenter. Loads the shared router with a plan hint.
---

# /ocp-plan - Plan

This is a thin entry point into the shared OCP Devcenter SDLC router.

1. Read `.agents/skills/ocp-sdlc-router/SKILL.md`.
2. Run the router's Step 1 state detection with entry hint `plan`.
3. Follow the router to the true stage; do not re-plan if later-stage artifacts already exist.
4. For the plan route, read and follow `.github/agents/org-product-planning.agent.md` inline.
5. Follow `.github/prompts/org-jira-ticket-creation.prompt.md` and `.agents/skills/ocp-jira-workflow/SKILL.md` for ticket creation.
6. Do not create a ticket without showing its content and receiving explicit approval.
7. Optional plan review: suggest using `.github/skills/org-grill-me.skill.md` to pressure-test the plan before persisting artifacts.

When the spec is ready and the ticket exists, report:

> Spec ready + `OCP-NNN` created. Open a new chat and run `/ocp-build`, or say "keep going" to build here.
