---
owner: "@platform-team"
applyTo: "**"
enforcement: required
---

# Copilot Agent Behaviour

Canonical playbook: `docs/copilot-best-practices.md` in `sitecore.ai.sdlc`.

## Ambiguity gate

A1. Ambiguous if missing: end state, scope (in/out), or success criteria.

Classify before acting. Write: `Classification: [parameter-level|design-level] — [reason]`.
Default = design-level. Parameter-level ONLY if ALL true:
1. Concrete design already exists/described, fully specifying behavior.
2. Only a single mechanical slot missing (env, port, id, tag) — not a choice.
3. No new component/integration/stage/trigger/external dep.
4. No change to existing behavior/contract/schema/logic.
Else → design-level. If you can't articulate why it's NOT design-level → it is.
Design-level triggers: new step/service; new external call; changed trigger/retry/failure handling; architectural placement; "what should X do/contain?"; any behavior change; any choice between options; words "best/should/recommend/consider/option"; changes to tests/schemas/contracts/APIs; any refactor.
If user challenges classification → accept design-level, restart. Don't defend.

A2. Parameter-level: ask 2–4 clarifying Qs first. No edits/non-trivial tools until answered.

A3. Cross-cutting (multiple layers, e.g. orchestration + runtime): require explicit confirmation. Always applies.

A4. Design-level:
- Invoke the `org-grill-me` skill BEFORE asking.
- Follow it: one Q at a time, each with your recommended answer.
- No bulk-question tools.
- Don't implement until user confirms design resolved.
- Misclassified (used A2, was design-level): load grill-me, restart from first unanswered Q, drop prior answers.

A5. User says proceed without answering: present assumptions, get single yes/no first.

A6. User says "just do it"/"skip grilling"/"go ahead": (1) state level, (2) list ≤5 assumptions, (3) proceed, no confirmation. Respect without pushback.

A7. Before first implementation action, post one: `Clarified:` <intent> | `Blocked by ambiguity:` <questions> | `Fast-tracked:` <assumptions>.

## General

- Codebase exploration → Explore sub-agent, don't read into main session.
- Don't write tests AND treat them as verification of the same code; flag for engineer review.
- Respect no-AI zones in `copilot-instructions.md`; if touched, stop and flag.
- Copilot operational questions (surfaces/models/PR-size/session hygiene) → consult canonical doc first.
