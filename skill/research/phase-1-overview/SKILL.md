---
name: phase-1-overview
description: Broad overview research for each topic established in Phase 0. Uses subagent researchers to gather initial information, frameworks, and patterns with source references.
---

# Phase 1: Overview Research

## Purpose
Conduct broad research across all topics established in Phase 0. This phase gathers initial information — common frameworks, tools, architecture patterns, and known challenges — for each topic. Output is broad-stroke documentation per topic with valid source references.

**This is overview research only.** No deep implementation details — those come in Phase 2.

## Activation
- Triggered when `state/phase-marker.md` indicates Phase 1
- User says "phase 1", "overview research", or similar

---

## Pre-flight

**Before doing anything else, read `state/checkpoint.md`** to retrieve `PROJECT_DESCRIPTION` and `TECH_STACK`. These values are already persisted from Phase 0. Only ask the user directly if the checkpoint file is missing or lacks this information.

---

## Mission

Research a `(PROJECT_DESCRIPTION)` using `(TECH_STACK)` as context. Establish broad overview knowledge for each topic established in Phase 0 through subagent researchers.

You are the orchestrator. Read the topic list from `research/phase-0-targets/topics.md` — **do not research any other files or look up information yourself**. Delegate all research work to subagents.

**This is research only.** Do not implement code. Do not have subagents implement anything. Collect information and produce well-organized documentation for reuse during development.

---

## Input

**Read `research/phase-0-targets/topics.md`** to get the list of sections, subsections, and any initial references discovered in Phase 0. These initial references should be reused as starting points.

---

## Subagent Rules

Only spawn researcher subagents for the research. Apply these rules to **EVERY subagent** you spawn (be explicit in the subagent prompts):

1. **Sequential execution** — Spawn one subagent at a time. Wait for completion before spawning the next. Never spawn multiple agents in parallel.
2. **Single topic scope** — Each subagent researches one topic (one file). Limit tightly to prevent scope creep.
3. **Output files** — Subagent must write results to `research/phase-1-overview/` as a `.md` file named after the topic. The file must include the subagent's prompt at the top, then findings, then valid references used. Do not include full conversation or thought process — just prompt, reported results, and references.
4. **Write before return** — Subagent must write its research file BEFORE returning results back to you.
5. **Web research** — Subagents must perform ONE websearch/webfetch at a time. Never in parallel. Webfetch URLs must come from known valid sources or previous websearch results, never guessed.
6. **Research only** — Collect information about the expected tech stack and assigned topic. Broad strokes only, no fine implementation details.
7. **References** — Include only valid references in the documentation. URLs that resulted in failed webfetches must be excluded. Include URL links and brief notes on what each source covers.
8. **No decisions** — Agents should not decide between competing options. When multiple options exist, mention each, note whether native to the engine/framework, and note which is most recent.
9. **Subagents must NOT read ANY local documentation before research**. They cannot read any! Not a single file before completing their research.
10. **All information must come from the web!**
11. **Use Phase 0 references** — If the topic list includes initial references from Phase 0, use those as starting points.
12. Explicitly include the expected tech stack for each agent to keep research narrowed (`(TECH_STACK)`).
13. **Merge into existing file** — If the output file already exists from a prior run, merge findings into it instead of overriding. Subagents must NOT read their existing output file before doing research — research should be fresh without bias to the previous run. Changes should be seamlessly added, updating existing sections and references as appropriate.
14. Return to the primary agent only the number of git line changes for the subagent output file, nothing else.

---

## Execution Order

1. Read `research/phase-0-targets/topics.md` for the topic list
2. Start with Section 1, first topic
3. Spawn subagent with the topic and all subagent rules
4. Wait for completion, verify output file was written
5. Mark topic complete, proceed to next
6. After finishing all topics in a section, spawn a verification subagent to:
   - a. Verify all current section output files were updated (using `git diff --stat`)
   - b. If any topics were missed, report which topic(s) were missed so they can be re-done
   - c. If all topics were updated, commit changes using conventional commits, report section complete with git line change count. No summary or change details.
7. If the verification subagent found missed topics, restart at step 3 for each missed topic
8. Upon confirmation all topics for the current section were completed, continue to next section
9. Repeat through all sections

---

## Subagent Spawning

When spawning a subagent for a given topic, provide that subagent with:
- The topic description
- All subagent rules from above
- The tech stack context (`(TECH_STACK)`)
- The output file path to write to (`research/phase-1-overview/<topic>.md`)
- Any initial references from Phase 0 for that topic
- The subagent **must NOT read their output file until after research is completed**

---

## Post-Phase

After all topics are researched:
1. Trigger the checkpoint skill to save Phase 1 completion
2. Update checkpoint summary with research status
3. Prepare to transition to Phase 2 (deep research per subsection)

---

## Critical Rules

- **NEVER spawn subagents in parallel**
- **Overview only — no deep implementation details**
- **Every topic gets its own subagent and its own output file**
- **References are mandatory** — include valid URLs with notes
- **Checkpoint on completion** — save state before transitioning phases