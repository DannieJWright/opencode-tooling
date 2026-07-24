---
name: phase-3-summaries
description: Condense all Phase 2 subsection research files into one summary document per section. Preserves source references for traceability while reducing context window load for decision-making.
---

# Phase 3: Summary Condensation

## Purpose
Take the granular research files produced in Phase 2 (one per subsection) and condense ALL subsections within a section into a SINGLE summary file per section. This reduces context window load for Phase 4 decision-making while preserving traceability through source references.

**This is NOT research.** This is summarization and condensation of existing Phase 2 research.

## Activation
- Triggered when `state/phase-marker.md` indicates Phase 3
- User says "phase 3", "summarize research", or similar

---

## Pre-flight

**Before doing anything else, read `state/checkpoint.md`** to retrieve `PROJECT_DESCRIPTION` and `TECH_STACK`. These values are already persisted from earlier phases. Only ask the user directly if the checkpoint file is missing or lacks this information.

---

## Mission

Condense Phase 2 deep research into per-section summaries for a `(PROJECT_DESCRIPTION)`. Each section's multiple subsection files become one condensed document that captures the important findings while preserving source traceability.

You are the orchestrator. Spawn one subagent per section to handle the condensation.

**This is condensation only.** Do not research new information. Do not have subagents do web searches.

---

## Input

1. **Read `research/phase-0-targets/topics.md`** — Get the list of sections and their subsections
2. **Read `state/checkpoint.md`** — Get condensed context from checkpoint

**CRITICAL: The orchestrator must NOT read the Phase 2 deep research files itself.** Pass the file paths to sub-agents so they read and condense the research independently. This preserves the orchestrator's context window.

---

## Subagent Rules

Apply these rules to **EVERY subagent** you spawn (be explicit in the subagent prompts):

1. **Condense, do not research** — no new web searches, no new information. Summarize what's already in Phase 2 files.
2. **Single section scope** — each subagent handles ONE section and ALL its subsections.
3. **Read all subsection files for the assigned section** — read every `research/phase-2-initial-research/<section>.*.md` file for that section.
4. **Output file format** — subagent must write to `research/phase-3-summaries/<section>-<topic>.md`. File structure:
   - Section title with brief description
   - Condensed findings per subsection (boiled down to key points, not full detail)
   - Source references linking back to Phase 2 files (with subsection identifiers)
   - Valid URL references from Phase 2 research (preserved, not duplicated)
   - Key options and alternatives identified (without deciding between them)
5. **Write before return** — subagent must write its summary file BEFORE returning.
6. **Preserve traceability** — every condensed finding must reference which Phase 2 subsection file it came from.
7. **Condense aggressively** — the goal is to reduce context window load. Cut verbose explanations, keep key facts, options, and references.
8. **No decisions** — do not make choices between options. Present options as Phase 2 identified them.
9. **Merge into existing** — if the summary file exists from a prior run, merge findings in seamlessly.
10. **Tech stack context** — include the `(TECH_STACK)` to keep summaries focused.
11. Return to the primary agent only the number of git line changes for the subagent output file, nothing else.

---

## Execution Order

1. Read `research/phase-0-targets/topics.md` for the section/subsection structure
2. Start with Section 1
3. Spawn **one** subagent with:
   - The section topic
   - List of all subsection **file paths** to read (`research/phase-2-initial-research/<section>.*.md`)
   - `TECH_STACK` context
   - All subagent rules
   - Output file path (`research/phase-3-summaries/<section>-<topic>.md`)
4. Wait for completion, verify output file was written
5. Mark section complete, proceed to next
6. After finishing all sections, spawn a verification subagent to:
   - a. Verify all section summary files were written (check `research/phase-3-summaries/`)
   - b. If any sections were missed, report which so they can be re-done
   - c. If all updated, commit using conventional commits and report complete with line change count
7. If verification found missed sections, restart at step 3 for each missed section
8. Upon confirmation all sections were completed, proceed to post-phase

---

## Subagent Prompt Template

```
You are a condensation agent for a [TECH_STACK] project.

Section: [section description]

Source files to read (Phase 2 deep research):
- research/phase-2-initial-research/01.a-enemy-pathing.md
- research/phase-2-initial-research/01.b-enemy-steering.md
- [etc., list all subsection file paths for this section]

Output file: research/phase-3-summaries/01-ai-systems.md

Rules:
- Condense only — no new research, no web searches
- Read all source files, then condense into one summary
- Preserve source references (file paths + URL links)
- Cut verbose explanations, keep key facts, options, and alternatives
- Do not make decisions between options
- Write to the output file before returning
- If file exists, merge findings seamlessly

Return your summary in this format:

# Section [N]: [Topic Title]

## Overview
[Brief 2-3 sentence description of what this section covers]

## Key Findings by Subsection

### [Subsection Name] (Source: 01.a-enemy-pathing.md)
[Condensed key findings — bullet points, not paragraphs]
- Key fact or option
- Another key finding
- [Reference: URL](link) — brief note

### [Next Subsection] (Source: 01.b-enemy-steering.md)
[Condensed key findings]
- ...

## Options Identified
[Options and alternatives found in research, without deciding between them]

## Preserved References
[URLs and file references from Phase 2 research, organized by topic]
```

---

## Post-Phase

After all section summaries are produced:
1. Trigger the checkpoint skill to save Phase 3 completion
2. Update checkpoint summary with research status
3. Prepare to transition to Phase 4 (decision-making using condensed summaries)

---

## Critical Rules

- **NEVER spawn subagents in parallel**
- **Condensation only — no new research**
- **Every section gets its own subagent and one summary file**
- **Source traceability is mandatory** — every finding must reference its Phase 2 source
- **Preserve URL references** — keep all valid URLs from Phase 2 for future validation
- **Checkpoint on completion** — save state before transitioning phases
- **Context protection** — The orchestrator MUST NOT read Phase 2 deep research files. Pass file paths to sub-agents instead.