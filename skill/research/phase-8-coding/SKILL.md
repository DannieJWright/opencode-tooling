name: phase-8-coding-planner
description: Generate a comprehensive implementation plan for the resolved technology stack. Produces a master plan with per-feature plans that bake in coder and reviewer responsibilities, best practices, and anti-patterns from Phase 7. Phase 7 files serve as the primary RAG source for all planning decisions.
---

# Phase 8: Implementation Planning

## Purpose
Generate a comprehensive implementation plan for the resolved technology stack. This phase does **NOT implement any code**. Instead it produces detailed planning artifacts that a future coding phase can execute against. The plan bakes in coder responsibilities, reviewer checkpoints, Phase 7 best practices, and anti-patterns so that when implementation eventually happens, the coder and reviewer agents have clear guidance already embedded in the plan files.

**Phase 7 output is the primary RAG source** — all planning agents query `research/phase-7-final/` files for validated knowledge about the stack.

## Activation
- Triggered when `state/phase-marker.md` indicates Phase 8
- User says "phase 8", "implementation plan", "coding plan", or similar

---

## Pre-flight

**Before doing anything else, read `state/checkpoint.md`** to retrieve `PROJECT_DESCRIPTION` and `TECH_STACK`.

---

## Input

1. **Read `state/checkpoint.md`** — Get condensed context
2. **Read `state/decision-matrix.md`** — Get the final resolved technology stack
3. **Read `state/constraint-chains.md`** — Understand constraint cascades

**CRITICAL: The orchestrator must NOT read Phase 7 files or Phase 4/5 files itself.** Phase 7 files are the RAG source for sub-agents — pass file paths so sub-agents query them independently.

---

## Mission

Generate a comprehensive implementation plan for a `(PROJECT_DESCRIPTION)` using the resolved stack. This is **planning only — no code is written**. The plan files serve as the execution blueprint for a future implementation session.

### Planning Outputs

1. **Master Plan** (`research/phase-8-coding/plan/master-plan.md`)
   - Technology stack recap
   - Feature dependency graph
   - Recommended implementation order
   - Risk assessment per feature
   - Testing strategy overview
   - Coder and reviewer workflow guidance

2. **Per-Feature Plans** (`research/phase-8-coding/plan/features/<feature>/plan.md`)
   - Feature scope and breakdown
   - Proposed file structure with paths
   - Key components (modules, classes, functions)
   - Dependencies on other features
   - Estimated complexity (Low / Medium / High)
   - Implementation steps ordered for a coder agent
   - Reviewer checkpoints embedded in the steps
   - Best practices to follow (from Phase 7)
   - Anti-patterns to avoid (from Phase 7)

3. **Per-Feature References** (`research/phase-8-coding/plan/features/<feature>/references.md`)
   - Documentation links for technologies used in this feature
   - Phase 7 source references (which best-practice or anti-pattern section applies)
   - Phase 5 deep-dive file references for stack details
   - External examples, tutorials, and gotchas

You are the orchestrator. Spawn sub-agents to generate the planning artifacts.

---

## Subagent Rules

Apply these rules to **EVERY subagent** you spawn (be explicit in the subagent prompts):

1. **Query Phase 7 RAG source** — every agent must read `research/phase-7-final/` files for stack knowledge.
2. **Sequential execution** — spawn one subagent at a time. Never parallel. One tool call at a time.
3. **Narrow scope** — master planner produces the master plan + feature list. Feature planners produce one feature plan + references. Reviewer validates plans against Phase 7.
4. **Write before return** — subagent must write files BEFORE returning.
5. **References mandatory** — include source references to Phase 7 files and external documentation.
6. **Tech stack context** — include the `(TECH_STACK)` to keep planning focused on the resolved stack.
7. **No code** — produce planning artifacts only. Do not write implementation code.
8. Return to the primary agent only the number of git line changes for output files, nothing else.

---

## Execution Order

### Step 1: Master Plan Generation
1. Read `state/decision-matrix.md` and `state/constraint-chains.md` for stack context
2. Read `research/phase-0-targets/topics.md` for project scope
3. **Spawn Master Planner sub-agent:**
   - Input: `state/decision-matrix.md`, `state/constraint-chains.md`, `research/phase-0-targets/topics.md`
   - RAG source: Phase 7 file paths (`research/phase-7-final/`)
   - Output: `research/phase-8-coding/plan/master-plan.md`
   - Task: Produce the master plan with feature breakdown, dependency graph, implementation order, risk assessment, and coder/reviewer workflow guidance
4. Wait for completion, verify master plan was written

### Step 2: Per-Feature Plan Generation
5. Read the master plan's feature list from `research/phase-8-coding/plan/master-plan.md`
6. For each feature in the master plan:
   - **Spawn Feature Planner sub-agent:**
     - Input: Master plan file path, feature name from master plan
     - RAG source: Phase 7 file paths
     - Output: `research/phase-8-coding/plan/features/<feature>/plan.md` AND `research/phase-8-coding/plan/features/<feature>/references.md`
     - Task: Produce detailed feature plan with coder steps, reviewer checkpoints, and Phase 7 guidance baked in
   - Wait for completion, verify both files were written
   - Mark feature complete, proceed to next feature

### Step 3: Plan Review
7. **Spawn Reviewer sub-agent (Plan Review):**
   - Input: Master plan file path, all feature plan file paths
   - RAG source: Phase 7 file paths
   - Task: Validate all plans against Phase 7 best practices and anti-patterns
   - Output: Review report
8. If reviewer finds issues:
   - Report findings to user
   - Identify which feature plans need revision
   - For each feature needing revision: spawn a revision sub-agent with the reviewer feedback
   - After revisions, re-run the reviewer
9. If reviewer approves all plans → proceed

### Step 4: Verification
10. Spawn a **verification sub-agent** to:
    - a. Verify master plan exists and contains substantive content
    - b. Verify each feature from the master plan has both `plan.md` and `references.md`
    - c. Verify all files were actually written (check directory structure)
    - d. If any files are missing or too thin, report which need re-doing
    - e. If all verified, commit using conventional commits and report complete with line change count

---

## Master Planner Sub-Agent Prompt Template

```
You are an implementation planner for a [TECH_STACK] project.

Project: [PROJECT_DESCRIPTION]

Stack context (read first):
- state/decision-matrix.md
- state/constraint-chains.md

Project scope (read for feature breakdown):
- research/phase-0-targets/topics.md

RAG source — query for stack knowledge (read as needed):
- research/phase-7-final/best-practices.md
- research/phase-7-final/anti-patterns.md
- research/phase-7-final/cross-cutting.md

Output file: research/phase-8-coding/plan/master-plan.md

Your Task:
1. Break the project into logical, implementable features
2. Produce a master implementation plan with:
   - Technology stack recap
   - Feature dependency graph
   - Recommended implementation order
   - Risk assessment per feature
   - Testing strategy overview
   - Coder and reviewer workflow guidance
3. Do NOT write any implementation code — produce only planning artifacts

Rules:
- Query Phase 7 RAG files for architectural patterns and conventions
- Sequential tool calls — one at a time
- Write the master plan file before returning
- Structure the plan for easy handoff to feature planner agents
- Include coder and reviewer workflow guidance so future implementation sessions know how to execute

Master Plan format:

# Master Implementation Plan — [PROJECT_DESCRIPTION]

## Technology Stack
[Brief recap from decision matrix]

## Feature Dependency Graph
[What depends on what — use a text-based graph]

## Recommended Implementation Order
1. [Feature] — [why first]
2. [Feature] — [why second]

## Feature List
[Numbered list of all features with one-line descriptions — this drives the feature planner agents]

## Risk Assessment
[High-risk features and mitigation strategies]

## Testing Strategy
[Unit, integration, E2E overview]

## Coder Workflow Guidance
[How a future coder agent should use these plans — step by step]

## Reviewer Workflow Guidance
[How a future reviewer agent should validate implementation — checkpoints and criteria]

## References
[Phase 7 source references and key documentation]
```

## Feature Planner Sub-Agent Prompt Template

```
You are a feature planning agent for a [TECH_STACK] project.

Project: [PROJECT_DESCRIPTION]
Feature to plan: [feature name from master plan]

Master plan (read for context):
- research/phase-8-coding/plan/master-plan.md

RAG source — query for stack knowledge (read as needed):
- research/phase-7-final/best-practices.md
- research/phase-7-final/anti-patterns.md
- research/phase-7-final/cross-cutting.md

Output files:
- research/phase-8-coding/plan/features/<feature-name>/plan.md
- research/phase-8-coding/plan/features/<feature-name>/references.md

Your Task:
1. Read the master plan for overall context
2. Query Phase 7 RAG source for patterns, best practices, and anti-patterns
3. Produce a detailed feature plan with:
   - File structure
   - Key components
   - Dependencies
   - Implementation steps ordered for a coder agent
   - Reviewer checkpoints embedded in steps
   - Best practices to follow (from Phase 7)
   - Anti-patterns to avoid (from Phase 7)
4. Produce a references file with all relevant links
5. Do NOT write any implementation code — produce only planning artifacts

Rules:
- Sequential tool calls — one at a time
- Write BOTH files before returning
- Bake in coder and reviewer guidance so future implementation is clear
- Reference Phase 7 sources explicitly (e.g., "See Phase 7 best-practices.md § Error Handling")

Feature Plan format:

# Feature Plan: [Feature Name]

## Scope
[What this feature does]

## Files
[Proposed file structure with paths]

## Key Components
[Modules, classes, functions]

## Dependencies
[Other features this depends on]

## Complexity
[Low / Medium / High]

## Implementation Steps (for Coder Agent)
1. [Step 1 — what to build]
   - Reviewer Checkpoint: [what the reviewer should verify after this step]
   - Best Practice: [which Phase 7 best practice applies]
   - Anti-Pattern to Avoid: [which Phase 7 anti-pattern to watch for]
2. [Step 2]
   - Reviewer Checkpoint: ...
   - Best Practice: ...
   - Anti-Pattern to Avoid: ...

## Testing Notes
[What needs to be tested — unit, integration, edge cases]

## Reviewer Validation Criteria
[Specific criteria the reviewer agent should check when validating this feature]

References file format:

# References: [Feature Name]

## Phase 7 Sources
- best-practices.md § [section] — [applies to which step]
- anti-patterns.md § [section] — [applies to which step]
- cross-cutting.md § [section] — [applies to which step]

## Phase 5 Deep-Dive Sources
- research/phase-5-deepdive/[file].md — [relevant for which aspect]

## External Documentation
[URLs with brief notes on what each covers]
```

## Reviewer Sub-Agent Prompt Template

```
You are a plan reviewer for a [TECH_STACK] project.

Project: [PROJECT_DESCRIPTION]

RAG source — validate against these files (read first):
- research/phase-7-final/best-practices.md
- research/phase-7-final/anti-patterns.md
- research/phase-7-final/cross-cutting.md

Stack context:
- state/decision-matrix.md

Plans to review:
- research/phase-8-coding/plan/master-plan.md
- research/phase-8-coding/plan/features/<feature>/plan.md (each feature plan)

Your Task:
1. Read the Phase 7 RAG source files
2. Read the master plan and each feature plan
3. Check for:
   - Violations of best practices
   - Presence of known anti-patterns
   - Missing cross-cutting concerns (security, testing, error handling)
   - Architectural misalignment with the resolved stack
   - Incomplete error handling or edge cases in the plans
   - Missing reviewer checkpoints in feature plans
   - Missing Phase 7 references in feature plans
4. Report findings with severity (Critical / Warning / Info)
5. Provide specific actionable fixes for each finding

Return ONLY this review report:

# Plan Review: [Project Name]

## Overall Assessment
[Pass / Needs Revision / Critical Issues]

## Master Plan Findings

### [Severity] — [Finding Title]
- Issue: [what's wrong]
- Reference: [which Phase 7 section covers this]
- Fix: [how to address it]

## Feature Plan Findings

### [Feature] — [Severity] — [Finding Title]
- Issue: [what's wrong]
- Reference: [which Phase 7 section covers this]
- Fix: [how to address it]

## Summary
[X Critical, Y Warning, Z Info findings]
[If Pass: plans approved for future implementation]
[If Needs Revision: list what must change and which feature plans need revision]
```

---

## Optional: Real Code Browsing

The master planner agent can optionally browse a real code repository (if the user provides one) to ground planning decisions in reality. This is passed as an additional input to the master planner:

- Repository path or URL
- Focus areas to inspect (e.g., "check how error handling is done", "review the project structure")
- Browse one directory at a time, sequentially

---

## Post-Phase

After Phase 8 planning is complete:
1. Trigger the checkpoint skill to save Phase 8 completion
2. Update checkpoint summary noting the plan artifacts are ready for future implementation
3. Report to user:
   - Master plan location
   - Per-feature plan locations
   - Reviewer assessment summary
   - Note that implementation requires a future session/phase to execute the plans

---

## Critical Rules

- **NEVER spawn subagents in parallel**
- **PLANNING ONLY — no code is written in Phase 8**
- **Coder and reviewer guidance is baked INTO the plan files** — future implementation sessions use these plans
- **Phase 7 is the RAG source** — all agents query `research/phase-7-final/` for stack knowledge
- **Reviewer must validate plans** — no plans proceed without a clean review
- **Verification is mandatory** — verify all planned artifacts exist and are substantive
- **Checkpoint on completion** — save state before concluding
- **Context protection** — The orchestrator MUST NOT read Phase 7 files or heavy research files. Pass file paths to sub-agents.
- **Conventional commits required** — all git operations use Conventional Commit format
