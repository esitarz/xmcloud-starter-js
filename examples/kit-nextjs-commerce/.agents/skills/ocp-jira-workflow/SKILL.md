---
name: ocp-jira-workflow
description: >-
  OCP Devcenter Jira workflow for creating OCP tickets and transitioning them at SDLC boundaries.
  Use for OCP ticket creation or SDLC status transitions.
  Holds OCP-specific coordinates; generic auth, approval, and Jira mechanics remain in org guidance.
user-invocable: false
---

# OCP Jira Workflow

Generic OAuth, approval policy, Jira base URL, and create mechanics are owned by
[org/jira-integration](../../../.github/instructions/org/jira-integration.instructions.md) and
`.github/prompts/org-jira-ticket-creation.prompt.md`. This skill owns the OCP-specific payload and
SDLC transition target.

## Ticket Coordinates

- projectKey: `OCP`
- default issue type: `Task`
- bug issue type: `Bug`

## Ticket Creation

Use the OCP coordinates above with the generic org ticket procedure. Do not probe metadata unless
a create call fails with a metadata-related error. Never create a ticket without explicit user
approval and never hardcode an assignee or secret.

## SDLC Status Transition

The router uses this target status name:

| Event | Target status |
| --- | --- |
| Build route confirmed | `Active Development` |
| PR moved to ready for review | `Awaiting Review` |

For each transition:

1. Call `getTransitionsForJiraIssue` for the OCP ticket.
2. Find the transition whose target status name matches the event target (`Active Development` or `Awaiting Review`), case-insensitively.
3. Call `transitionJiraIssue` with that transition's ID.
4. Confirm the transition in one line: `OCP-NNN -> <Target Status>`.

Transition IDs are not stable and must not be hardcoded. If the target is already current, treat it
as a no-op. If the target transition is unavailable or any MCP call fails, stop and report the exact
symptom and required action. Human intervention is required before proceeding.

## Metadata Failure

If Jira rejects a field or ID because metadata has drifted, stop and report the exact failure. Then
revalidate the relevant metadata and update this skill's constants before retrying once.
