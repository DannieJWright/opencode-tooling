name: phase-6-reality-evaluator
description: Cross-check Phase 4 decisions against Phase 5 deep dive findings to find conflicts, feasibility issues, and gaps. Updates Phase 4 raw decision files when problems are found, then regenerates derived state files.
---

# Phase 6: Reality Evaluator

## Purpose
Cross-check every Phase 4 decision against the Phase 5 deep dive research findings. Find conflicts where the chosen technology stack has incompatibilities, where decisions are infeasible in practice, or where critical gaps exist. When a conflict is found, update the Phase 4 raw decision files with new evidence. After all updates, regenerate the derived state files (`state/decision-matrix.md` and `state/constraint-chains.md`) from the updated raw data.

**This is validation, not research.** The agent compares existing decisions against existing deep-dive findings — it does not conduct new web searches unless a specific gap requires a quick targeted lookup.

## Activation
- Triggered when `state/phase-marker.md` indicates Phase 6
- User says "phase 6", "reality check", "validate decisions", or similar

---

## Pre-flight

**Before doing anything else, read `state/checkpoint.md`** to retrieve `PROJECT_DESCRIPTION` and `TECH_STACK`.

---

## Input

1. **Read `research/phase-0-targets/topics.md`** — Get the section/subsection structure
2. **Read `state/checkpoint.md`** — Get condensed context
3. **Read `state/decision-matrix.md`** — Get the list of all decisions and their status
4. **Read `state/constraint-chains.md`** — Understand existing constraint cascades

**CRITICAL: The orchestrator must NOT read Phase 4 raw decision files or Phase 5 deep dive files itself.** Pass file paths to sub-agents so they perform the cross-checking independently.

---

## Mission

Cross-check each section's Phase 4 decisions against Phase 5 deep dive findings for a `(PROJECT_DESCRIPTION)`. Look for:

1. **Incompatibilities** — The chosen technologies don't work well together (e.g., library version conflicts, missing bindings, API mismatches)
2. **Feasibility issues** — A decision assumed a capability that the deep dive shows is limited or broken
3. **Missing integrations** — No clear way to connect two chosen components
4. **Overlooked gotchas** — Phase 5 found a critical issue that Phase 4 didn't account for
5. **Constraint cascade failures** — An immutable's derived chain leads to a dead end

When a conflict is found, update the relevant Phase 4 raw decision file with new evidence and potentially reclassify the decision.

You are the orchestrator. Spawn one sub-agent per section to handle the cross-checking.

---

## Subagent Rules

Apply these rules to **EVERY subagent** you spawn (be explicit in the subagent prompts):

1. **Cross-check, do not re-decide** — compare decisions against findings. Do not make new decisions unless evidence forces reclassification.
2. **Sequential execution** — spawn one subagent at a time. Never parallel. One tool call at a time.
3. **Single section scope** — each subagent cross-checks ONE section's decisions against that section's deep dive.
4. **Read BOTH Phase 4 and Phase 5 files** — subagent MUST read the Phase 4 decision files AND Phase 5 deep dive files for its assigned section.
5. **Targeted research only** — if a specific gap requires a quick lookup (e.g., confirming a version compatibility), do ONE targeted web search. Do not do broad exploration.
6. **Update Phase 4 raw files when conflicts found** — modify `research/phase-4-decisions/<section>.*.md` files with new evidence, updated reasoning, and reclassified items.
7. **Write before return** — subagent must write any updated files BEFORE returning.
8. **Preserve user decisions** — if the user already resolved an Open item, do not undo it without strong evidence.
9. **Report conflicts clearly** — list every conflict found with severity (Critical / Warning / Info).
10. **Tech stack context** — include the `(TECH_STACK)` to keep evaluation focused.
11. Return to the primary agent only the conflict report and line change counts for any updated files, nothing else.

---

## Execution Order

1. Read `research/phase-0-targets/topics.md` for the section/subsection structure
2. Read `state/decision-matrix.md` and `state/constraint-chains.md` for context
3. Start with Section 1
4. Spawn **one** subagent with:
   - The section topic
   - Relevant Phase 4 decision **file paths** (`research/phase-4-decisions/<section>.*.md`)
   - Relevant Phase 5 deep dive **file paths** (`research/phase-5-deepdive/<section>.*.md`)
   - `TECH_STACK` context
   - All subagent rules
   - Conflict report format
5. Wait for completion, verify conflict report received
6. If conflicts were found, verify Phase 4 files were updated
7. Mark section complete, proceed to next
8. After all sections:
   - a. If NO conflicts found across all sections → Phase 6 complete, proceed to Phase 7
   - b. If conflicts found and Phase 4 files updated → regenerate state files, log loop entry, proceed to post-phase
9. Upon completion, proceed to post-phase

---

## Subagent Prompt Template

```
You are a reality-check agent for a [TECH_STACK] project.

Project: [PROJECT_DESCRIPTION]
Section: [section description]

Phase 4 decision files to read (the decisions to validate):
- research/phase-4-decisions/01.a-enemy-pathing.md
- research/phase-4-decisions/01.b-enemy-steering.md

Phase 5 deep dive files to read (the findings to compare against):
- research/phase-5-deepdive/01.a-enemy-pathing.md
- research/phase-5-deepdive/01.b-enemy-steering.md

Your Task:
Read BOTH sets of files. Compare every Phase 4 decision against Phase 5 findings. Look for:

1. INCOMPATIBILITIES — chosen technologies don't work together
2. FEASIBILITY ISSUES — a decision assumed broken/limited capabilities
3. MISSING INTEGRATIONS — no clear path to connect two components
4. OVERLOOKED GOTCHAS — critical issues Phase 4 didn't consider
5. CONSTRAINT CASCADE FAILURES — immutable chains hitting dead ends

When you find a conflict:
- Update the relevant Phase 4 decision file with new evidence
- Add a "Reality Check" section to the decision file
- If evidence is strong, reclassify the decision (e.g., Open → needs re-evaluation)
- NEVER undo a user-resolved decision without Critical-level evidence

After all checks, return ONLY this conflict report:

# Reality Check: [Section]

## Conflicts Found

### [Severity: Critical/Warning/Info] — [Conflict Title]
- Decision: [which decision is affected]
- Finding: [what Phase 5 revealed]
- Impact: [what breaks or needs changing]
- Action Taken: [what was updated in Phase 4 file]
- Files Updated: [list of modified Phase 4 files]

## No Issues Found
[List any decisions that passed validation cleanly]

## Targeted Research Needed
[Any specific gaps that require user input or additional research]
```

---

## State File Regeneration

After all cross-checks are complete AND Phase 4 files were updated:

1. **Regenerate `state/decision-matrix.md`** from the updated Phase 4 raw decision files
   - This ensures the matrix reflects any reclassifications or new evidence
2. **Regenerate `state/constraint-chains.md`** from the updated Phase 4 raw decision files
   - This ensures constraint cascades reflect any broken chains or new immutables
3. **Append to `state/loop-history.md`** with:
   - Date
   - Source phase: Phase 6
   - Target phase: Phase 4 (updated) → Phase 7 (next)
   - Reason: Reality check conflicts found and resolved
   - Summary of conflicts found and actions taken
   - Status: Resolved

---

## Post-Phase

After all cross-checks and state file updates are complete:
1. Trigger the checkpoint skill to save Phase 6 completion
2. Report conflict summary to user:
   - Total conflicts found by severity
   - Phase 4 files modified
   - State files regenerated
   - Any items still requiring user input
3. If no conflicts were found: "All decisions validated against deep dive research. Proceeding to Phase 7."
4. If conflicts were resolved: "X conflicts found and resolved. Phase 4 updated, state files regenerated. Proceeding to Phase 7."
5. If conflicts remain unresolved: "X conflicts require user input before proceeding. Here are the open items..."

---

## Critical Rules

- **NEVER spawn subagents in parallel**
- **Cross-check existing data, do not re-research** — compare Phase 4 against Phase 5
- **Targeted research only for specific gaps** — one web search per gap maximum
- **Update Phase 4 raw files, not state files** — state files are regenerated from raw data
- **State files are ALWAYS regenerated after Phase 4 updates** — decision-matrix and constraint-chains must reflect current state
- **Preserve user-resolved decisions** — only override with Critical-level evidence
- **Checkpoint on completion** — save state before transitioning phases
- **Context protection** — The orchestrator MUST NOT read Phase 4 or Phase 5 files. Pass file paths to sub-agents.
- **Loop history is mandatory when conflicts found** — record why Phase 4 was updated
