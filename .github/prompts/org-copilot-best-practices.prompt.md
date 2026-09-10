---
description: Surface the org's Copilot operational best practices on demand. Use when an engineer asks how to use Copilot effectively, when to pick a particular surface or model, how to size a PR, or any "what's our practice for X" question about Copilot itself.
---

# Copilot Best Practices

The canonical guidance lives at:

[`docs/copilot-best-practices.md`](https://github.com/Sitecore-Internal/sitecore.ai.sdlc/blob/master/docs/copilot-best-practices.md) in `sitecore.ai.sdlc`.

## Step 1 — Fetch the canonical doc

Read the canonical doc above before answering. If you cannot fetch it (offline, permissions), say so explicitly and answer from the synced summary in `.github/instructions/org/copilot-best-practices.instructions.md` — flagging that the summary is a stub and the full doc has the reasoning and conditions.

## Step 2 — Match the user's question to the right section

The doc has nine sections:

1. The mental model (token economics, context window, error compounding)
2. Get grilled before you build (universal pre-work discipline; GrillMe, peer, self)
3. Choose the right model (Sonnet / Haiku / Opus / Auto)
4. Session discipline (grill → Explore → rewind → compact)
5. Set up your repo (instructions, LSP, prompts, MCP)
6. PR size: two camps, one decision rule
7. Pick the right surface (VS Code / CLI / `@copilot` / Coding Agent)
8. Safety and guardrails (with a checklist)
9. What's still moving

Identify which section answers the user's question. Quote the relevant rule, then give the reasoning from the section body.

**Special case for §2:** If the user wants to *actively be grilled* on a plan (not just read about the discipline), delegate to `/org-grill-me` and stop. That prompt operationalises the grilling procedure; this one only describes it.

## Step 3 — Be honest about staleness

The doc carries a "Last reviewed" date at the top and a "What's still moving" section. If the user's question touches anything in §9 (token billing, Chronicle, auto-routing intent, Fleet/Rubber-Duck mode, cross-repo drift), surface that the answer may have changed and recommend they verify via the AI Teams channel or the latest doc revision.

## Step 4 — When the doc doesn't answer

If the question is genuinely outside the doc's scope, say so. Don't fabricate Sitecore-specific practice. Recommend the user raise the gap as a PR against the canonical doc — that's the maintenance model.
