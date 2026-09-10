---
description: Guided build entry point for OCP Devcenter. Loads the shared router with a build hint.
---

# /ocp-build - Build

This is a forgiving entry point into the shared OCP Devcenter SDLC router.

1. Read `.agents/skills/ocp-sdlc-router/SKILL.md`.
2. Run the router's Step 1 state detection with entry hint `build`.
3. If no artifact exists, advise `/ocp-plan` and stop.
4. If the spec is draft or thin, route back through planning and the readiness gate.
5. After routing confirms the true stage is build, transition the OCP ticket to `Active Development`; transition to `Awaiting Review` is handled only on ready-for-review PR.
6. Apply the dirty-tree pre-flight, confirm the branch, and run `tools/sync-branch.ps1` for an existing branch.
7. Read and follow `.github/agents/org-dev-workflow.agent.md` inline for implementation.

When implementation is committed, report:

> Implementation committed on `<branch>`. When done, run `/ocp-ship`.
