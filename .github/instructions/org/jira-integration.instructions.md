---
owner: "@platform-team"
applyTo: "**"
enforcement: recommended
---

> **Org recommendation.** Org-wide defaults. Repo-specific guidance overrides on conflict.

# Jira Integration via Atlassian MCP

- Agents with `atlassian/*` in tools list interact with Jira via Atlassian Rovo MCP server.

## Authentication

- MCP server uses **OAuth 2.1**; first use opens user browser for authorization.
- Operations respect user's Jira permissions; no project access = requests fail.
- MCP server auto-configured via `.vscode/mcp.json` (synced from central repo).

## Available Operations

| Tool | Purpose | Example |
|------|---------|---------|
| `getJiraIssue` | Fetch single issue by key | `getJiraIssue({ issueKey: "PROJ-123" })` |
| `searchJiraIssuesUsingJql` | Search issues with JQL | `searchJiraIssuesUsingJql({ jql: "..." })` |
| `addCommentToJiraIssue` | Add comment to issue | `addCommentToJiraIssue({ issueKey: "PROJ-123", body: "..." })` |
| `createJiraIssue` | Create new issue | `createJiraIssue({ projectKey: "PROJ", issueType: "Bug", summary: "..." })` |

## Common JQL Patterns

- **My bugs:** `assignee = currentUser() AND issuetype = Bug ORDER BY priority DESC`
- **My open issues:** `assignee = currentUser() AND status != Done ORDER BY updated DESC`
- **Project backlog:** `project = PROJ AND status = "To Do" ORDER BY priority DESC`
- **Recently created:** `project = PROJ AND created >= -7d ORDER BY created DESC`

## Jira Base URL

For links to Jira tickets in PR descriptions, commit messages, or docs, use:

```
https://sitecore.atlassian.net/browse/{TICKET-ID}
```

## Guidelines

- **Infer project key** from ticket ID user provides (e.g., `ONSI-123` → project `ONSI`).
- **No ticket creation without explicit user approval.** Show content first, ask for confirmation.
- **Batch limits:** processing multiple tickets, limit 10 per batch; ask to continue if more remain.
