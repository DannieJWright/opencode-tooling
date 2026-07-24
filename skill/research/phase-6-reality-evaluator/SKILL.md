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
- Re-entered from Phase 5 after targeted deep-dive research fills a gap

---

## Pre-flight

**Before doing anything else, read `state/checkpoint.md`** to retrieve `(PROJECT_DESCRIPTION)` and `(TECH_STACK)`.

---

## Input

1. **Read `research/phase-0-targets/topics.md`** — Get the section/subsection structure
2. **Read `state/checkpoint.md`** — Get condensed context
3. **Read `state/decision-matrix.md`** — Get the list of all decisions and their status
4. **Read `state/constraint-chains.md`** — Understand existing constraint cascades

**CRITICAL: The orchestrator must NOT read Phase 4 raw decision files or Phase 5 deep dive files itself.** Pass file paths to sub-agents so they perform the cross-checking independently.

---

## Mission

Cross-check each subsection's Phase 4 decisions against Phase 5 deep dive findings for a `(PROJECT_DESCRIPTION)`. Look for:

1. **Incompatibilities** — The chosen technologies don't work well together (e.g., library version conflicts, missing bindings, API mismatches)
2. **Feasibility issues** — A decision assumed a capability that the deep dive shows is limited or broken
3. **Missing integrations** — No clear way to connect two chosen components
4. **Overlooked gotchas** — Phase 5 found a critical issue that Phase 4 didn't account for
5. **Constraint cascade failures** — An immutable's derived chain leads to a dead end

When a conflict is found, update the relevant Phase 4 raw decision file with new evidence and potentially reclassify the decision.

You are the orchestrator. Spawn one sub-agent per subsection to handle the cross-checking.

---

## Subagent Rules

Apply these rules to **EVERY subagent** you spawn (be explicit in the subagent prompts):

1. **Cross-check, do not re-decide** — compare decisions against findings. Do not make new decisions unless evidence forces reclassification.
2. **Sequential execution** — spawn one subagent at a time. Never parallel. One tool call at a time.
3. **Single subsection scope** — each subagent cross-checks ONE subsection's decisions against that subsection's deep dive.
4. **Read BOTH Phase 4 and Phase 5 files** — subagent MUST read the Phase 4 decision file AND Phase 5 deep dive file for its assigned subsection.
5. **Targeted research only** — if a specific gap requires a quick lookup (e.g., confirming a version compatibility), do ONE targeted web search. Do not do broad exploration.
6. **Update Phase 4 raw files when conflicts found** — modify `research/phase-4-decisions/<section>.<subsection>-<desc>.md` files with new evidence, updated reasoning, and reclassified items.
7. **Write before return** — subagent must write any updated files BEFORE returning.
8. **Preserve user decisions** — if the user already resolved an Open item, do not undo it without strong evidence.
9. **Report conflicts clearly** — list every conflict found with severity (Critical / Warning / Info).
10. **Tech stack context** — include the `(TECH_STACK)` to keep evaluation focused.
11. Return to the primary agent only the conflict report and line change counts for any updated files, nothing else.

---

## Execution Order

1. Read `research/phase-0-targets/topics.md` for the section/subsection structure
2. Read `state/decision-matrix.md` and `state/constraint-chains.md` for context
3. Start with Section 1, first subsection
4. Spawn **one** cross-check subagent with:
   - The subsection topic
   - Relevant Phase 4 decision **file path** (`research/phase-4-decisions/<section>.<subsection>-<desc>.md`)
   - Relevant Phase 5 deep dive **file path** (`research/phase-5-deepdive/<section>.<subsection>-<desc>.md`)
   - `(TECH_STACK)` context
   - All subagent rules
   - Conflict report format
5. Wait for completion, verify conflict report received
6. If conflicts were found, verify Phase 4 file was updated
7. Mark subsection complete, proceed to next subsection
8. After finishing all subsections, spawn a **verification sub-agent** to:
   - a. Verify all subsections were processed (check that every subsection from `topics.md` has a corresponding cross-check result)
   - b. Verify any Phase 4 file modifications were actually written (using `git diff --stat`)
   - c. If any subsections were missed or modifications are missing, report which so they can be re-done
   - d. If all verified, report complete
9. If verification found missed subsections, restart at Step 4 for each missed subsection
10. After verification passes, evaluate the results and branch:

### Branch A — No Conflicts Found
If no conflicts were found across all subsections:
- Phase 6 complete — proceed to Phase 7

### Branch B — Conflicts Resolved, No Gaps
If conflicts were found AND resolved (Phase 4 files updated, state files regenerated):
- Log loop entry in `state/loop-history.md`
- Proceed to Phase 7

### Branch C — Knowledge Gaps Found (Loop Back to Phase 5)
If cross-checking revealed **knowledge gaps** rather than decision conflicts (e.g., Phase 5 deep-dive research was too thin, missing API details, insufficient ecosystem data):
- Do NOT proceed to Phase 7
- Log loop entry in `state/loop-history.md`:
  - Date
  - Source phase: Phase 6
  - Target phase: Phase 5
  - Reason: Knowledge gaps identified — Phase 5 deep-dive insufficient for specific subsections
  - List of subsections needing more research
  - Status: Pending Phase 5 re-entry
- Transition back to Phase 5 — Phase 5's "Re-entry from Phase 6" flow will target only the subsections with gaps
- After Phase 5 completes targeted research, re-enter Phase 6 to re-evaluate

---

## Subagent Prompt Template

```
You are a reality-check agent for a [TECH_STACK] project.

Project: [PROJECT_DESCRIPTION]
Subsection: [subsection description]

Phase 4 decision file to read (the decision to validate):
- research/phase-4-decisions/<section>.<subsection>-<desc>.md

Phase 5 deep dive file to read (the findings to compare against):
- research/phase-5-deepdive/<section>.<subsection>-<desc>.md

Your Task:
Read BOTH files. Compare every Phase 4 decision against Phase 5 findings. Look for:

1. INCOMPATIBILITIES — chosen technologies don't work together
2. FEASIBILITY ISSUES — a decision assumed broken/limited capabilities
3. MISSING INTEGRATIONS — no clear path to connect two components
4. OVERLOOKED GOTCHAS — critical issues Phase 4 didn't consider
5. CONSTRAINT CASCADE FAILURES — immutable chains hitting dead ends
6. KNOWLEDGE GAPS — Phase 5 research is too thin to validate this decision (missing API details, no ecosystem data, insufficient integration info)

When you find a conflict:
- Update the relevant Phase 4 decision file with new evidence
- Add a "Reality Check" section to the decision file
- If evidence is strong, reclassify the decision
- NEVER undo a user-resolved decision without Critical-level evidence

When you find a knowledge gap:
- Flag it clearly as a KNOWLEDGE GAP (not a conflict)
- Describe what information is missing from Phase 5
- Note that Phase 5 needs targeted research for this subsection

After all checks, return ONLY this conflict report:

# Reality Check: [Subsection Name]

## Conflicts Found

### [Severity: Critical/Warning/Info] — [Conflict Title]
- Decision: [which decision is affected]
- Finding: [what Phase 5 revealed]
- Impact: [what breaks or needs changing]
- Action Taken: [what was updated in Phase 4 file]
- Files Updated: [list of modified Phase 4 files]

## Knowledge Gaps

### [Gap Title]
- What's Missing: [what Phase 5 didn't cover]
- Why It Matters: [why this info is needed for validation]
- Recommendation: [Phase 5 needs targeted research on this subsection]

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
   - Target phase: Phase 4 (updated) → Phase 7 (next) or Phase 5 (if looping back)
   - Reason: Reality check conflicts found and resolved OR Knowledge gaps found — looping to Phase 5
   - Summary of conflicts found and actions taken
   - Status: Resolved or Pending Phase 5 re-entry

---

## Post-Phase

After all cross-checks, verification, and state file updates are complete:

1. **If Branch A (No Conflicts):**
   - "All decisions validated against deep-dive research. Zero conflicts found. Proceeding to Phase 7."
   - Trigger the checkpoint skill to save Phase 6 completion

2. **If Branch B (Conflicts Resolved):**
   - Report conflict summary to user:
     - Total conflicts found by severity
     - Phase 4 files modified
     - State files regenerated
     - Any items still requiring user input
   - "X conflicts found and resolved. Phase 4 updated, state files regenerated. Proceeding to Phase 7."
   - Trigger the checkpoint skill to save Phase 6 completion

3. **If Branch C (Knowledge Gaps — Loop to Phase 5):**
   - Report gap summary to user:
     - Total knowledge gaps found
     - Subsections needing more Phase 5 research
     - Specific gaps per subsection
   - "X knowledge gaps found. Looping back to Phase 5 for targeted deep-dive research on these subsections."
   - Trigger the checkpoint skill to save Phase 6 status and transition to Phase 5

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
- **Loop history is mandatory when changes occur** — record why Phase 4 was updated or why Phase 5 needs re-entry
- **Verification is mandatory** — verify all subsections were processed and all file modifications were written
