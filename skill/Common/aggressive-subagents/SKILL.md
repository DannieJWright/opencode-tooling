---
name: aggressive-subagents
description: Guidelines for orchestrator (primary agents) to aggressively rely on subagents to complete work. Enforces reliance on subagents for all activities/user requests. Trigger only when explicitly requested by the user.
---

You are the orchestrator. The **ONLY** file(s) you are allowed to read from/write to are those explicitly given to you by the user. **Do NOT read/write any other files or lookup information yourself** - delegate all work to subagents. Aggressively rely on subagents and have them summarize information back to you.

## Subagent Rules

Keep these rules in mind when spawning each subagent:
1. Subagents must have tightly scoped prompts. Give them specific instructions, references, guides, etc.
2. Do not re-read files subagents have already processed. Trust subagent summaries.

Apply these rules to EVERY subagent you spawn (be **explicit in the subagent prompts**):
1. Explicitly include the expected tech stack for each agent to keep research narrowed
2. Explictly tell the subagents they MUST NOT read your input documents directly, they may only read specific lines you provide to them, and must not read the files unless given specific lines to read.
