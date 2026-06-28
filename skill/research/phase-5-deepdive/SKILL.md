name: phase-5-deepdive
description: Deep-dive research into the chosen technology stack after Phase 4 decisions are classified. Produces implementation-focused research files per section that feed Phase 7 final research and become the basis for Phase 6 reality checks.
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

**Before doing anything else, read `state/checkpoint.md`** to retrieve `PROJECT_DESCRIPTION` and `TECH_STACK`. These values are already persisted from earlier phases. Only ask the user directly if the checkpoint file is missing or lacks this information.

---

## Input

1. **Read `research/phase-0-targets/topics.md`** — Get the section/subsection structure
2. **Read `state/checkpoint.md`** — Get condensed context and resolved decisions
3. **Read `state/decision-matrix.md`** — Get the list of Immutable and resolved decisions to focus research on the chosen stack (not abandoned options)
4. **If re-entering from Phase 6**: Read `state/loop-history.md` for context on what gaps need filling

**CRITICAL: The orchestrator must NOT read the Phase 4 raw decision files themselves.** The decision matrix (`state/decision-matrix.md`) contains the condensed status. Pass file paths to sub-agents so they can reference Phase 4 decisions independently.

---

## Mission

Research the resolved technology stack deeply per section for a `(PROJECT_DESCRIPTION)`. Each sub-agent focuses on ONE section, researching implementation details, API patterns, integration points, and known issues for the **specific technologies chosen** (not hypothetical alternatives).

You are the orchestrator. Spawn one sub-agent per section to handle the deep dive.

---

## Subagent Rules

Apply these rules to **EVERY subagent** you spawn (be explicit in the subagent prompts):

1. **Research the chosen stack only** — focus on the technologies resolved in Phase 4. Do not research abandoned alternatives unless a comparison is needed for a specific integration point.
2. **Sequential execution** — spawn one subagent at a time. Never parallel. One tool call at a time.
3. **Single section scope** — each subagent handles ONE section's deep dive research.
4. **Read Phase 4 decision files** — subagent MUST read the relevant Phase 4 decision files from `research/phase-4-decisions/` to understand what was chosen and why.
5. **Implementation-focused** — research APIs, configuration patterns, known gotchas, version compatibility, ecosystem maturity, and integration with adjacent technologies in the stack.
6. **Output deep dive files** — write to `research/phase-5-deepdive/<section>.<subsection>-<desc>.md`.
7. **Write before return** — subagent must write files BEFORE returning.
8. **Merge into existing** — if deep dive files exist from a prior run, update them with new findings.
9. **References mandatory** — include URL references to documentation, blog posts, GitHub issues, and release notes.
10. **Tech stack context** — include the `(TECH_STACK)` to keep research tightly focused.
11. Return to the primary agent only the number of git line changes for the subagent output file, nothing else.

---

## Execution Order

1. Read `research/phase-0-targets/topics.md` for the section/subsection structure
2. Read `state/decision-matrix.md` for resolved decisions (Immutable + user-resolved Open items)
3. Start with Section 1
4. Spawn **one** subagent with:
   - The section topic
   - Relevant Phase 4 decision **file paths** to read (`research/phase-4-decisions/<section>.*.md`)
   - `TECH_STACK` context (resolved decisions from matrix)
   - All subagent rules
   - Output file path(s) for that section's deep dive files
5. Wait for completion, verify deep dive files were written
6. Mark section complete, proceed to next
7. After all sections, spawn a verification subagent to:
   - a. Verify all deep dive files were written (check `research/phase-5-deepdive/`)
   - b. If any sections were missed, report which so they can be re-done
   - c. If all updated, commit using conventional commits and report complete with line change count
8. If verification found missed sections, restart at step 4 for each missed section
9. Upon confirmation all sections were completed, proceed to post-phase

---

## Subagent Prompt Template

```
You are a deep-dive research agent for a [TECH_STACK] project.

Project: [PROJECT_DESCRIPTION]
Section: [section description]

Phase 4 decision files to read (to understand what was chosen):
- research/phase-4-decisions/01.a-enemy-pathing.md
- research/phase-4-decisions/01.b-enemy-steering.md
- [etc., list all Phase 4 decision file paths for this section]

Output files: research/phase-5-deepdive/01.a-enemy-pathing.md, 01.b-enemy-steering.md, etc.

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
- Read Phase 4 decision files first to understand choices
- Write to output files before returning
- If files exist, merge new findings seamlessly
- Include URL references to documentation, issues, and blog posts

Return your research in this format:

# Deep Dive: [Section - Topic]

## Technologies Resolved
[Brief list of chosen technologies from Phase 4]

## API Overview
[Key APIs, functions, classes, or modules relevant to this section]

## Configuration Patterns
[How these technologies are configured in practice]

## Known Issues & Gotchas
[Pitfalls, version problems, workarounds discovered in research]

## Integration Points
[How this section's tech connects to other stack components]

## Ecosystem Notes
[Maturity level, community activity, alternatives worth watching]

## References
[URLs with brief notes]
```

---

## Post-Phase

After all deep dive research is complete:
1. Trigger the checkpoint skill to save Phase 5 completion
2. Update checkpoint summary with deep dive status per section
3. Prepare to transition to Phase 6 (reality evaluator — cross-check decisions against deep dive findings)

---

## Re-entry from Phase 6

When Phase 6 reality check uncovers knowledge gaps:
1. Read `state/loop-history.md` for context on which specific gaps need filling
2. Spawn sub-agents only for the sections with identified gaps
3. Deep-dive files are updated in-place with new findings
4. After updates, return to Phase 6 to re-evaluate

---

## Critical Rules

- **NEVER spawn subagents in parallel**
- **Research the CHOSEN stack** — Phase 4 narrowed the options, so research must be focused on resolved decisions
- **Every section gets its own subagent** with implementation-focused research
- **URL references mandatory** — all findings must be traceable to documentation or credible sources
- **Checkpoint on completion** — save state before transitioning phases
- **Context protection** — The orchestrator MUST NOT read Phase 4 raw decision files. Use `state/decision-matrix.md` (condensed) and pass file paths to sub-agents.
- **Deep dive feeds Phase 7** — output files are the foundation for Phase 7 best practices and anti-patterns research
