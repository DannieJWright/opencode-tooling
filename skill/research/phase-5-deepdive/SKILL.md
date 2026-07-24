name: phase-5-deepdive
description: Deep-dive research into the chosen technology stack after Phase 4 decisions are classified. Produces implementation-focused research files per subsection that feed Phase 7 final research and become the basis for Phase 6 reality checks.
---

# Phase 5: Deep Dive Research

## Purpose
After decisions are classified in Phase 4, research the **chosen technology stack deeply** — implementation details, APIs, known pitfalls, ecosystem maturity, and integration patterns. This is focused, opinionated research (unlike the broad exploration of Phases 1–2) because the decisions have narrowed the field. Output feeds Phase 7 (final research) and Phase 6 (reality evaluator).

**This is targeted research, not summarization.** The agent actively searches for deep technical details about the specific technologies selected.

## Activation
- Triggered when `state/phase-marker.md` indicates Phase 5
- User says "phase 5", "deep dive", or similar
- Re-entered if Phase 6 reality check uncovers significant gaps in stack knowledge

---

## Pre-flight

**Before doing anything else, read `state/checkpoint.md`** to retrieve `(PROJECT_DESCRIPTION)` and `(TECH_STACK)`. These values are already persisted from earlier phases. Only ask the user directly if the checkpoint file is missing or lacks this information.

---

## Input

1. **Read `research/phase-0-targets/topics.md`** — Get the section/subsection structure
2. **Read `state/checkpoint.md`** — Get condensed context and resolved decisions

**CRITICAL: The orchestrator must NOT read Phase 4 raw decision files, Phase 3 summary files, or any heavy research files itself.** The orchestrator uses context-collector sub-agents to gather the necessary context per subsection (decision info + references) without loading those files directly. This preserves the orchestrator's context window.

---

## Mission

Research the resolved technology stack deeply per subsection for a `(PROJECT_DESCRIPTION)`. Each subsection is researched independently, with the orchestrator delegating context collection and research to sub-agents.

You are the orchestrator. For each subsection:
1. Spawn a **context collector** sub-agent to gather decision info and references from local files for the current subsection being researched
2. Use the collected context to spawn the **deep-dive research** sub-agent
3. Loop through all subsections one at a time once the previous subsection is completed

---

## Subagent Rules

Apply these rules to **EVERY subagent** you spawn (be explicit in the subagent prompts):

1. **Sequential execution** — spawn one subagent at a time. Never parallel. One tool call at a time.
2. **Single subsection scope** — each subagent handles ONE subsection.
3. **Write before return** — subagent must write files BEFORE returning.
4. **Merge into existing** — if output files exist from a prior run, the subagent must update them with new findings.
5. **References mandatory** — include URL references to documentation, blog posts, GitHub issues, and release notes. Only include valid references that contributed to the research.
6. **Tech stack context** — include the `(TECH_STACK)` explicitly in the subagent prompt to keep research tightly focused.
7. Return to the primary agent only the number of git line changes (for research sub-agents) or the collected context data (for context collectors), nothing else.

---

## Execution Order

1. Read `research/phase-0-targets/topics.md` for the section/subsection structure
2. Read `state/checkpoint.md` for condensed context
3. Start with Section 1, first subsection
4. **Step A — Spawn Context Collector Sub-Agent:**
   - Give it: the subsection identifier (e.g., "01.a-enemy-pathing"), the Phase 3 summary file path for that section (`research/phase-3-summaries/<section>-<topic>.md`), and access to `state/decision-matrix.md`
   - Task: Read the decision matrix to find what was decided for this subsection. Read the Phase 3 summary to find known references for this subsection. Collect and return only the decision info and references.
   - The orchestrator receives the collected context back.
5. **Step B — Spawn Deep-Dive Research Sub-Agent:**
   - Give it: the subsection topic, the collected decision info and references from Step A, `(TECH_STACK)` context, all subagent rules, and the output file path
   - Task: Research the chosen stack deeply for this subsection.
   - Output: `research/phase-5-deepdive/<section>.<subsection>-<desc>.md`
6. Wait for completion, verify deep-dive file was written/updated. Do NOT read the file directly.
7. Mark the subsection as complete and determine what the next subsection will be. Then proceed to next subsection
8. After finishing all subsections, spawn a **verification sub-agent** to:
   - a. Verify all deep-dive files were written (check `research/phase-5-deepdive/`)
   - b. If any subsections were missed, report which so they can be re-done
   - c. If all are updated, commit using conventional commits and report complete with git line change count
9. If verification found missed subsections, restart at Step A for each missed subsection
10. Upon confirmation all subsections were completed (by running from step 8), proceed to post-phase

---

## Context Collector Sub-Agent Prompt Template

Use the following as a template for the prompt to provide to the **context collector sub-agents**. Be sure to explicitly replace the placeholders (e.g. `[TECH_STACK]`, `<section>-<topic>`, etc) in the actual prompt provided to the subagents.

```markdown
You are a context collector agent for a [TECH_STACK] project.

Project: [PROJECT_DESCRIPTION]
Subsection to collect context for: [subsection identifier, e.g. "01.a-enemy-pathing"]

Files to read:
- state/decision-matrix.md (to find the decision for this subsection)
- research/phase-3-summaries/<section>-<topic>.md (to find references for this subsection)

Rules:
- Read both files sequentially — one at a time
- Return only the collected context data — no research, no web searches
- Keep it concise — this context will be passed to the research sub-agent

Your Task:
1. Read the decision matrix and find what was decided for this subsection. What technologies were chosen? What was the classification (Immutable/Derived/Open)?
2. Read the Phase 3 summary file for the section containing this subsection. Extract any URL references or source links associated with this subsection's topic area.
3. Return ONLY the collected context in this exact format:

# Context for [Subsection Name]

## Decision Status
- Classification: [Immutable/Derived/Open]
- Chosen Technologies: [list what was decided]
- Reasoning: [brief note on why this was chosen, if available]

## Known References
- [URL 1] — [brief note]
- [URL 2] — [brief note]
- [Phase 2 source file: 01.a-enemy-pathing.md] (if referenced in Phase 3 summary)

## Research Focus Areas
[What should be researched deeply — derived from the decision status and technologies chosen]
```

---

## Deep-Dive Research Sub-Agent Prompt Template

Use the following as a template for the prompt to provide to the **context collector sub-agents**. Be sure to explicitly replace the placeholders (e.g. `[TECH_STACK]`, `<section>-<topic>`, etc) in the actual prompt provided to the subagents.

```markdown
You are a deep-dive research agent for a [TECH_STACK] project.

Project: [PROJECT_DESCRIPTION]
Subsection: [subsection description]

Collected Context (from context collector):
---
[Insert the context data returned by the context collector]
---

Output file: research/phase-5-deepdive/<section>.<subsection>-<desc>.md

Research Focus:
- API surface area and key functions/classes for the chosen libraries
- Configuration patterns and best practices
- Known gotchas, version incompatibilities, and migration issues
- Integration patterns with other technologies in the stack
- Ecosystem maturity and community support level
- Performance characteristics and scalability limits
- Security considerations specific to the chosen stack

Rules:
- Research ONLY the chosen stack — skip abandoned alternatives
- Sequential tool calls — one at a time
- Use the collected context and references as starting points
- Supplement heavily with web research beyond the provided references
- Write to the output file before returning
- If file exists, merge new findings seamlessly
- Include URL references to documentation, issues, and blog posts
- Only return the git line changes for your output file to the primary agent

Save your research findings in this format:

# Deep Dive: [Subsection - Topic]

## Technologies Resolved
[Brief list of chosen technologies from the collected decision context]

## API Overview
[Key APIs, functions, classes, or modules relevant to this subsection]

## Configuration Patterns
[How these technologies are configured in practice]

## Known Issues & Gotchas
[Pitfalls, version problems, workarounds discovered in research]

## Integration Points
[How this subsection's tech connects to other stack components]

## Ecosystem Notes
[Maturity level, community activity, alternatives worth watching]

## References
[URLs with brief notes]
```

---

## Post-Phase

After all deep-dive research is complete:
1. Trigger the checkpoint skill to save Phase 5 completion
2. Update checkpoint summary with deep-dive status per subsection
3. Prepare to transition to Phase 6 (reality evaluator — cross-check decisions against deep-dive findings)

---

## Re-entry from Phase 6

When Phase 6 reality check uncovers knowledge gaps:
1. Read `state/loop-history.md` for context on which specific gaps need filling
2. For each subsection with a gap, repeat Step A → Step B (context collector → research sub-agent)
3. Deep-dive files are updated in-place with new findings
4. After updates, return to Phase 6 to re-evaluate

---

## Critical Rules

- **NEVER spawn subagents in parallel**
- **Research the CHOSEN stack** — Phase 4 narrowed the options, so research must be focused on resolved decisions
- **Every subsection gets its own context collector + research sub-agent pair**
- **URL references mandatory** — all findings must be traceable to documentation or credible sources
- **Checkpoint on completion** — save state before transitioning phases
- **Context protection** — The orchestrator MUST NOT read Phase 4 raw decision files, Phase 3 summaries, or any heavy research files. Use context-collector sub-agents to gather subsection context.
- **Deep-dive feeds Phase 7** — output files are the foundation for Phase 7 best practices and anti-patterns research
