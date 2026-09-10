---
name: ocp-sdlc-router
description: >-
  Shared SDLC router for OCP Devcenter /ocp-help, /ocp-plan, /ocp-build, and /ocp-ship prompts.
  Detects the true stage from local branch, working-tree, spec, and OCP ticket signals, then routes
  to the correct existing planning, build, review, Jira, and worktree surfaces.
user-invocable: false
---

# OCP SDLC Router

This skill is the single home for stage detection and routing behind the OCP Devcenter entry-point
prompts. Each prompt supplies an entry hint (`help`, `plan`, `build`, or `ship`), but the hint is not
the current stage. Detect local state first, then route to the true stage.

## Operating Rules

- Keep the entry prompts thin; do not duplicate routing logic in them.
- Step 1 is local-only. Do not call Jira, Azure DevOps, or other network tools during detection.
- Use `OCP-NNN` as the ticket pattern. A branch or spec ticket is a hint until the subject is confirmed.
- Stop and report the exact symptom on any command or MCP failure. Do not silently retry or improvise.
- Read and follow existing surfaces instead of copying their instructions:
  - `.github/agents/org-product-planning.agent.md`
  - `.github/agents/org-dev-workflow.agent.md`
  - `.github/prompts/org-spec-lifecycle.prompt.md`
  - `.github/prompts/org-git-branch-and-save.prompt.md`
  - `.github/prompts/org-jira-ticket-creation.prompt.md`
  - `.github/prompts/ocm-review-uncommitted.prompt.md`
  - `.agents/skills/ocm-jira-workflow/SKILL.md`
  - `.agents/skills/ocm-worktree-isolation/SKILL.md`

## Output discipline (apply throughout - highest priority)

- No narration around tool calls. The harness already shows tool activity; restating it is noise.
  Never write an "I'll.../Now I'm.../Next I'll..." sentence before or after a tool call.
- Step 1 specifically: emit exactly one line - `Checking current state...` - then produce zero
  output until the multiple-choice options are presented. The only exception is a genuine blocker
  that stops you getting there.
- After Step 1, speak only for a gate/question the user must answer, or a handoff banner.
- Present mutually exclusive choices (route choice, dirty-tree pre-flight, ship options) through
  the ask-questions tool so they render as clickable options. Fall back to a numbered list only
  when no such tool is available.

## Jira / MCP minimalism (apply throughout - highest priority)

The spec is the source of truth for what to build, not the Jira ticket. Once a spec exists, the AI
never needs to read the ticket to understand the work. Touch the Atlassian/Jira MCP for exactly
three reasons; anything else is a wasted round-trip:

1. Create a ticket (plan route) - via `ocm-jira-workflow`.
2. Transition a ticket's status (build/ship) - matched by target status name.
3. Read a ticket once as the sole requirements source - only when no spec exists (a bare-ticket
   `/ocm-build` or `/ocm-ship`).

Hard rules:

- Never call `getJiraIssue` merely to validate a hinted ticket ID or cross-check it against a spec.
  If a spec is present, skip the ticket read entirely.
- Never echo a ticket's summary or description back to the user - they can open Jira.
- Transition confirmations are one line, e.g. `OCM-NNN -> In Development`.

## Step 1 - Detect State

Gather local signals without network calls (see Output discipline above for what to say).

1. Determine whether the user has supplied a clear subject in the current conversation.
2. Check editor or attachment context for an active Devcenter spec.
3. Run `powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\get-sdlc-state.ps1`.
4. If the script is unavailable, use these local fallbacks:
   - `git branch --show-current`
   - `git status --short`
  - `git rev-list --count origin/development..HEAD`
   - a scan of top-level `specs/*.md`, excluding `specs/archive/`

The state collector should return these normalized signals:

```json
{
  "branch": "<branch or null>",
  "isDefaultBranch": true,
  "branchTicket": "OCP-123 or null",
  "ticketId": "OCP-123 or null",
  "dirty": false,
  "changedFileCount": 0,
  "commitsAheadOfDefaultBranch": 0,
  "unarchivedSpecs": [
    {
      "path": "specs/OCP-123-example.md",
      "status": "draft",
      "ticket": "OCP-123",
      "author": "<author or null>",
      "modified": "<ISO 8601 timestamp>"
    }
  ]
}
```

The collector gathers signals only. The router makes the stage decision.

## Subject Selection

Use this order when selecting the work subject:

1. Explicit `OCP-NNN` or clear task intent in the current conversation.
2. A spec in the active editor or attachment context.
3. A branch containing a literal `OCP-NNN`.
4. A best-guess choice from unarchived specs.
5. For a cold `/ocp-plan`, offer to start a new task.
6. For `/ocp-build` or `/ocp-ship` with no artifact, ask for an OCP ticket or short description.

Do not validate a ticket with Jira during this step.

## Stage Mapping

| Local artifacts | Route |
| --- | --- |
| No spec, ticket, or work branch | No artifacts; advise `/ocp-plan` |
| Proposal, draft, thin spec, or no ticket | Plan |
| Ready/in-progress spec and ticket, implementation unfinished | Build |
| Finished changes needing review, commit, or PR | Ship |

The detected stage overrides the entry hint. For example, `/ocp-plan` on an implementation branch
routes to build, and `/ocp-build` on a bare proposal routes back to plan.

## Step 2 - Dirty-Tree Pre-flight

Apply this before branch creation or commit operations on plan and build routes. Ship operates on the
current ticket's changes and is exempt.

- If the dirty changes belong to this task, continue.
- If they are unrelated, offer:
  1. Isolate with the `ocp-worktree-isolation` skill.
  2. Stash with `git stash push -u` and restore later.
  3. Discard only after explicit confirmation showing the exact files to be lost.

Never discard unfamiliar work by default.

## Step 3 - Route

### Plan

1. Read and follow `.github/agents/org-product-planning.agent.md` inline.
2. If the conversation contains a transcript, advise switching to Refinement to Specs.
3. Use `.github/prompts/org-jira-ticket-creation.prompt.md` and `.agents/skills/ocp-jira-workflow/SKILL.md` for ticket creation.
4. Show ticket content and obtain explicit approval before creating a Jira ticket.
5. Apply the spec readiness gate: requirements are concrete and testable, edge cases are listed, no unchecked open questions remain, and out-of-scope is stated.
6. Follow `.github/prompts/org-spec-lifecycle.prompt.md` to finalize the spec as `OCP-NNN-<slug>.md` with `status: ready`.

### Build

1. Recheck spec readiness; return to plan if the spec is thin or still draft.
2. After routing confirms the true stage is build, use `.agents/skills/ocp-jira-workflow/SKILL.md` to transition the ticket to `Active Development`.
3. Apply the dirty-tree pre-flight.
4. Confirm or create the ticketed branch using this convention: `<userid>/OCP-NNN-<slug>`.
5. Run `tools/sync-branch.ps1` for existing branches and stop on conflict or error.
6. Read and follow `.github/agents/org-dev-workflow.agent.md` inline.
7. Update the spec to `status: in-progress` when implementation begins.

### Ship

1. Read and execute `.github/prompts/ocp-review-uncommitted.prompt.md` and present findings before shipping.
2. Run `tools/sync-branch.ps1`; stop if it reports a conflict or error.
3. Read and follow `.github/agents/org-dev-workflow.agent.md` inline.
4. Follow `.github/prompts/org-spec-lifecycle.prompt.md` to archive the completed spec in the PR.
5. Apply `.github/instructions/org/service-context-updates.instructions.md` to determine whether service context needs updating.
6. Present and obtain approval for the commit message, then commit.
7. Present and obtain approval for the Azure DevOps PR title and description, then push and create the PR with the `AI-assisted` label.
8. Use `.agents/skills/ocp-jira-workflow/SKILL.md` to transition the ticket to `Awaiting Review` only when the PR is ready for review.
9. If transition to `Awaiting Review` is unavailable, stop and require human intervention before proceeding.

## Jira Transition

The OCP Jira skill owns transition mechanics. Match the target status by name, never by a hardcoded
transition ID:

- Build route confirmed: `Active Development`
- PR ready for review: `Awaiting Review`

If the target transition is unavailable or an MCP call fails, stop and report the exact symptom and
required action.

## Handoff Banners

Emit these only after the referenced artifacts are persisted:

- Plan to build: `Spec ready + OCP-NNN created. Open a new chat and run /ocp-build, or say keep going.`
- Build to ship: `Implementation committed on <branch>. When done, run /ocp-ship.`
