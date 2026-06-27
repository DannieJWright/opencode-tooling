---
name: phase-2-initial-research
description: Deep research per section/subsection. Produces granular research files with implementation details, source references, and technical findings for each subsection.
---

# Phase 2: Initial Deep Topic Research

## Purpose
Conduct deep, focused research for each subsection identified in Phase 0 and Phase 1. This phase produces granular research files containing implementation details, technical patterns, framework options, and validated source references. These files are the raw material for Phase 3 summaries and Phase 4 decisions.

**This is deep research.** Unlike Phase 1's broad overview, this phase digs into implementation-level details for each subsection.

## Activation
- Triggered when `state/phase-marker.md` indicates Phase 2
- User says "phase 2", "deep research", or similar

---

## Pre-flight

**Before doing anything else, ask the user for these values.** Do not proceed until all are provided.

| Variable | Description | Default |
|---|---|---|
| `PROJECT_DESCRIPTION` | What is the project? (e.g. "2D turn-based gladiator fighting game") | N/A |
| `TECH_STACK` | What tech stack? (e.g. "Unity game engine using C#") | N/A |

---

## Mission

Research each subsection deeply for a `(PROJECT_DESCRIPTION)` using `(TECH_STACK)` as context. Produce one granular research file per subsection.

You are the orchestrator. Read the topic list from `research/phase-0-targets/topics.md` and the overview files from `research/phase-1-overview/` — **do not research yourself**. Delegate all deep research to subagents.

**This is research only.** Do not implement code. Do not have subagents implement anything.

---

## Input

1. **Read `research/phase-0-targets/topics.md`** — Get the list of sections, subsections, and initial references
2. **Read Phase 1 overview files from `research/phase-1-overview/`** — Get broad context per topic
3. **Read `state/checkpoint.md`** — Get condensed context from checkpoint

---

## Subagent Rules

Apply these rules to **EVERY subagent** you spawn (be explicit in the subagent prompts):

1. **Research only** — no implementation, no code, no plans. Collect information.
2. **Single topic scope** — research only the assigned subsection. Tight scope.
3. **Sequential web research** — fetch one URL at a time. Never parallel. URLs from known valid sources only.
4. **No decisions** — when multiple options exist, mention each. Note whether native to the platform. Note which is most recent. Do not pick a winner.
5. **References mandatory** — include only valid references. Exclude any URLs that failed to fetch. Every factual claim should have a source.
6. **Expand beyond existing docs** — Phase 1 overview and Phase 0 references are starting points, not the sole source. Supplement heavily with web research.
7. **Deep implementation details** — unlike Phase 1, this phase digs into how things work, not just what exists. Cover architecture patterns, API surface area, configuration, trade-offs.
8. **Output file format** — subagent must write to `research/phase-2-initial-research/<section>.<subsection>-<short-desc>.md`. File structure:
   - Subagent prompt at the top
   - Research findings (detailed, with subsections)
   - Valid references (URLs with brief notes, file references with line numbers)
   - No full conversation or thought process
9. **Write before return** — subagent must write its research file BEFORE returning.
10. **Merge into existing** — if the file exists from a prior run, merge findings in seamlessly. Do NOT read the existing file before researching — keep research fresh. After research, merge the new findings with existing content, updating sections and references.
11. **Tech stack context** — include the `(TECH_STACK)` explicitly to keep research narrowed.
12. Return to the primary agent only the number of git line changes for the subagent output file, nothing else.

---

## Execution Order

1. Read `research/phase-0-targets/topics.md` for the subsection list
2. Read Phase 1 overview files for context
3. Start with Section 1, subsection a
4. Spawn **one** subagent with:
   - The subsection topic
   - Phase 1 overview context for that topic
   - Phase 0 initial references for that topic
   - `TECH_STACK` context
   - All subagent rules
   - Output file path (`research/phase-2-initial-research/<section>.<subsection>-<desc>.md`)
5. Wait for completion, verify output file was written
6. Mark subsection complete, proceed to next
7. After finishing all subsections in a section, spawn a verification subagent to:
   - a. Verify all current section output files were updated (using git stats)
   - b. If any subsections were missed, report which so they can be re-done
   - c. If all updated, commit using conventional commits and report section complete with line change count
8. If verification found missed subsections, restart at step 4 for each missed subsection
9. Upon confirmation all subsections for the current section were completed, continue to next section
10. Repeat through all sections

---

## Subagent Prompt Template

```
You are a research agent for a [TECH_STACK] project.

Topic: [subsection description]
Output file: research/phase-2-initial-research/<section>.<subsection>-<desc>.md

Context from Phase 1 overview:
[Paste relevant Phase 1 findings for this topic]

Initial references from Phase 0:
[URLs and sources discovered in Phase 0]

Rules:
- Research only — no implementation, no code, no plans
- One web fetch at a time — no parallel web requests
- No decisions — mention options, don't pick
- Include only valid references (exclude failed URLs)
- Deep implementation details — how things work, not just what exists
- Use Phase 1 and Phase 0 references as starting points, supplement with web research
- Write to the output file before returning
- If file exists, merge findings seamlessly (do not read existing file before researching)

Return your findings in this format:

### Key Findings
[Architecture patterns, API details, implementation approaches, configuration]

### Technical Considerations
[Platform-native options, legacy vs current APIs, trade-offs, constraints]

### References
[Valid URLs with notes, file references with line numbers]
```

---

## Post-Phase

After all subsections are researched:
1. Trigger the checkpoint skill to save Phase 2 completion
2. Update checkpoint summary with research status
3. Prepare to transition to Phase 3 (condense subsection files into per-section summaries)

---

## Critical Rules

- **NEVER spawn subagents in parallel**
- **Deep research — implementation details, not just overviews**
- **Every subsection gets its own subagent and its own output file**
- **References are mandatory** — every claim should have a source
- **Checkpoint on completion** — save state before transitioning phases