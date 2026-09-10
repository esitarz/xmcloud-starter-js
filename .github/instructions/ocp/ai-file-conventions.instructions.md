\---

applyTo: ".github/\*\*/\*.md,.agents/\*\*/\*.md,AGENTS.md"

enforcement: recommended

\---



\# OCP AI file conventions (routing and authoring)



Decide where a new AI rule belongs and keep AI context lean.



\## 1. AI files are for the AI first



Optimize for model execution reliability, not prose style. Remove text that does

not change what the AI should do.



\## 2. Token discipline



Keep always-on context lean. Prefer AGENTS.md for core rules and move detail to

on-demand surfaces whenever possible.



\## 3. Route by trigger shape (first match wins)



1\. Fires on a path or glob? -> scoped instruction in `.github/instructions/ocp/\*.instructions.md`.

2\. Invoked by a slash command? -> prompt in `.github/prompts/ocp-\*.prompt.md`.

3\. Applies on nearly every turn? -> `AGENTS.md` (always-on, shared across tools).

4\. Otherwise (topic knowledge discovered from discussion) -> skill in `.agents/skills/\*`.



\## 4. Prompts and agents are rare



Prompts and custom agents are for explicit, repeatable workflows. Generic coding

work should remain in default agent mode unless a command-triggered workflow is

needed.



\## 5. Repo-specific naming and location



\- Skills: use an `ocp-` prefixed kebab-case folder name under `.agents/skills/`

&#x20; and match it in frontmatter `name`.

\- Instructions: repo-specific instructions live under `.github/instructions/ocp/`.

&#x20; The `org/` subfolder is centrally synced and must not be edited locally.

\- Prompts: use `ocp-` prefix for repo prompts in `.github/prompts/`.

\- Agents: use `ocp-` prefix for repo custom agents in `.github/agents/`.



\## 6. Never duplicate org guidance



Org files under `.github/instructions/org/`, and `org-\*` prompts and agents,

are centrally managed. Do not copy or restate them in repo files unless needed

to declare an explicit repo override for a recommended org rule.



\## 7. Single home per rule



Avoid duplicates across loaded surfaces.



\- Build rules belong in `AGENTS.md`, scoped instructions, and org instructions.

\- System behavior belongs in `.github/service-context.md`.



Prefer updating an existing matching file over creating a new one.



\## 8. Skill discovery depends on description



Put realistic trigger phrases in the skill `description` so the model can find

and load it when relevant.



\## 9. Explicit read hand-offs for required chains



If one prompt or skill must load another file, state the exact file to read in

the body. Do not rely on implicit discovery for required hand-offs.



\## 10. Keep one always-on convention source



Use root `AGENTS.md` as the shared always-on convention file. Do not reintroduce

a separate Cursor-only conventions file.



\## 11. Recommend the right primitive once



If a user asks for a specific AI-file primitive that does not fit the trigger,

recommend the better fit once. If the user reaffirms, proceed with their choice.



\## 12. Prefer deterministic tooling over prose for repeatable mechanics



When a rule describes a fixed multi-step mechanic (a git sequence, a state-detection

routine, a fetch-and-parse), prefer extracting it into a CLI tool or script

(`tools/\*.ps1`) that emits a structured result the AI reads, instead of spelling

every step out in prose the model re-derives each turn. Keep the judgment in the

AI file (the skill/prompt decides what to do with the result); the script only

gathers or acts. Keep a short raw-command fallback in the prose for when the

script is unavailable.



\- Favor a CLI/script over an MCP/tool-call chain when a local command can do the

&#x20; job, but MCP is correct when it is the only access path (Jira via Atlassian,

&#x20; PRs via Azure DevOps). Don't script around a required MCP.

\- Consider a script for any multi-step action before committing it to prose; if

&#x20; the steps are fixed and order-dependent, that's the signal to extract one.



\## 13. State the current design - never carry change history



AI files describe what is, not what changed. Git is the changelog. Drop any

"X was removed", "intentionally gone", "previously we...", "changed from...",

"no longer..." phrasing - it goes stale the moment it lands and wastes

always-on/loaded tokens. State the present rule directly.



\- Bad: "fuzzy branch-to-spec name matching was removed"

\- Good: "branch names are not otherwise matched against specs"



