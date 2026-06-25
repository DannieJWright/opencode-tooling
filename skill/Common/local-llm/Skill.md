---
name: local-llm
description: Guidelines for working with locally-running LLMs that have constrained VRAM and context windows. Enforces sequential execution, narrow subagent scope, and frequent persistence to prevent context overflow. Trigger when using local models, working with limited context, or spawning subagents that must be memory-efficient.
---

## Why

Local LLMs have limited context windows and VRAM. Parallel tool calls, bloated subagent prompts, and unpersisted work all accelerate context exhaustion. These rules extend conversation longevity.


## Required User Input

Here are some requirements that should be obtained from the user before continuing with exectution if not already given:
- Should the subagents write their findings to files before returning to the primary agent? If so, where should the subagent output files live?
- Should you (the primary agent) batch the work to frequently stop for human intervention? If so, how should the work be split up?

## Core Rules

### 1. Sequential Execution

- Spawn **one** subagent at a time. Wait for completion before spawning the next. Never spawn multiple subagents in parallel.
- Make **one** tool call at a time when doing exploratory work (web fetches, file reads, greps). Do not batch speculative calls.
- Web fetches: fetch **one** URL at a time. Never in parallel. Only fetch URLs from known valid sources or prior search results, never guessed. Use websearch when exact urls are unknown.

### 2. Sequential Inheritance

**Every subagent prompt must explicitly include these same rules** (sequential tool calls). Make it part of the subagent's instructions, not an assumption.

### 3. Narrow Scope

- Each subagent handles **one** focused topic. Limit tightly to prevent scope creep.
- Prefer providing the subagents with exact references as input if relevent 
  - For file references, prefer exact line ranges
  - For web information, prefer valid urls

### 4. No Duplicate Work

- The orchestrator (parent agent) should read only a minimal guide or checklist. All heavy lifting delegates to subagents.
- Do not re-read files subagents have already processed. Trust subagent summaries.

### 5. Write Before Return

If the user required subagents to write their findings to output files before returning, then explicitly include the following in the subagent's prompts:
- Subagents must persist their output to disk BEFORE returning results to the parent.
- The path to the output file location, with a relevant filename for the agent.
- Output files should include: the subagent's exact prompt, concise findings, and valid references used. No full conversation logs or thought traces.

### 6. Stop Checkpoints

If the user requested the work to be batched:
- After completing a logical batch of work (e.g. finishing items in a section), stop and report progress to the user.
- Do not continue to the next batch without user confirmation.

## Subagent Prompt Template

When spawning a subagent, include:

Critical Rules (local LLM efficiency)
1. Sequential only — one tool call at a time. No parallel calls. One web fetch at a time.
2. Narrow scope — stay on topic. Don't expand beyond the assigned task.
3. Include only valid, verified references in your output (for research tasks).

If the user requested subagents to save output to a file:
4. Write output to disk BEFORE returning results.


```
<Prompt> (exact prompt/specific topic or subpoint)
<Output> (Write results to: output/path/file-name)
<Output Format>: (prompt at top, findings, valid references at bottom.)
<Rules> (subagent rules that must be strictly followed)
```

## When to Use

- When working with a local LLM
- Specified by user to use this skill
