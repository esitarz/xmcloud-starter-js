---
description: Standard procedure for creating a Jira ticket — either directly via the Atlassian MCP or by generating a copy-pasteable summary. Use this whenever work has been scoped and is ready for ticketing.
---

# Jira Ticket Creation

Use this procedure when a spec or story is ready to be turned into a Jira ticket. See `jira-integration.instructions.md` for auth details and available MCP tools.

## Step 1 — Offer Two Paths

> "Ready to create the Jira ticket! How would you like to do it?
>
> 1. **Create it directly** — I'll create the ticket in Jira via the Atlassian MCP and return the ticket ID.
> 2. **Copy-paste** — I'll generate a summary you can paste into Jira yourself."

## Path 1: Create Directly via MCP

1. **Confirm the project key** — infer from the ticket IDs visible in recent branch names (`git branch -a | grep -oE '[A-Z][A-Z0-9]+-[0-9]+' | sort | uniq -c | sort -nr | head -1`), or ask the user. Wait for explicit confirmation before creating anything.
2. **Determine the issue type** from context: `Story`, `Bug`, `Task`, or `Spike`.
3. **Show the ticket content** and ask for confirmation:
   > "I'll create a **[Story]** in project **PROJ** with this content: [show title + description + AC]. Confirm?"
4. **Create the ticket** using `createJiraIssue`:
   ```
   createJiraIssue({
     projectKey: "PROJ",
     issueType: "Story",
     summary: "<title>",
     description: "<description>",
     parentKey: "<epic-key>"  // only if linking to an existing epic
   })
   ```
5. **Report the ticket ID** and proceed to finalize the spec or story file with that ID.

> "Created **PROJ-123**: [title]. I'll update the spec/story with this ticket ID now."

**If the MCP server is unavailable** or the first call fails, announce the failure and fall back to Path 2:
> "Atlassian Rovo MCP is unavailable. Falling back to copy-paste — please create the ticket and return with the ID."

## Path 2: Copy-Paste Summary

Generate a formatted summary the user can paste directly into Jira:

```
**Title:** [Concise title]

**Description:**
[1–2 paragraph summary of the problem and proposed solution]

**Acceptance Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

**Spec:** [path to spec file]
```

Then say:
> "Copy this into Jira, create the ticket, and come back with the ticket ID. I'll update the spec with the ticket reference."

## Ticket Hierarchy (for batches of stories)

When creating multiple tickets at once, ask where they should live before choosing a path:

> "Where should these stories live in Jira?
>
> 1. **Under an existing epic** — give me the epic key (e.g. `PROJ-100`).
> 2. **Top-level stories** — no parent.
> 3. **New epic** — I'll create an epic first, then add the stories under it."

Only offer option 3 if there are 5 or more stories.

If the user picks option 1, capture the epic key for use in all ticket creation calls as `parentKey`.

If the user picks option 3 and using Path 1:
- Create the epic first: `createJiraIssue({ issueType: "Epic", summary: "<confirmed title>" })`
- If epic creation fails, fall back to top-level stories — do not block story creation on epic failure
- Use the returned epic key as `parentKey` for all story tickets

For Path 2 with a new epic, include the instruction in the copy-paste output:
> "First create an epic titled '<Epic Title>' in `<PROJECT-KEY>`, then create these stories as its children."

## Finalize After Ticket Creation

Once ticket IDs are known (either from MCP or from the user returning with IDs):

- Update the spec or story file with the ticket ID (per the lifecycle in [spec-lifecycle.prompt.md](spec-lifecycle.prompt.md))
- Commit the update: `TICKET-ID Update spec/story with ticket reference`

## Rules

- **Never create tickets without explicit user confirmation.** Always show the content first.
- **Batch limit:** when processing more than 10 tickets, process in batches of 10 and ask to continue.
- **Partial failure:** if auto-creation fails partway through, commit successful updates only, leave the rest as `TBD`, report which failed and why — do not retry in a loop.
