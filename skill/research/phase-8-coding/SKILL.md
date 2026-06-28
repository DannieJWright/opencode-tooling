name: phase-8-coding-planner
description: Plan the implementation of the project with dedicated planner, coder, and reviewer sub-agents. The planner produces a master plan, the coder implements features, and the reviewer validates all work against Phase 7 best practices and anti-patterns. Phase 7 files serve as the primary RAG source.
---

# Phase 8: Coding Planner

## Purpose
Plan and optionally begin implementation of the project using the resolved technology stack. This phase spawns three types of sub-agents in a structured pipeline:

1. **Planner** — Produces a master implementation plan broken into features with individual plans
2. **Coder** — Implements features following the plan (optional, user-controlled)
3. **Reviewer** — Validates all code and plans against Phase 7 best practices and anti-patterns

**Phase 7 output is the primary RAG source** — all agents query `research/phase-7-final/` files for validated knowledge about the stack.

## Activation
- Triggered when `state/phase-marker.md` indicates Phase 8
- User says "phase 8", "coding phase", "implementation", or similar
- User explicitly requests code generation (default is planning-only)

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

Plan (and optionally implement) a `(PROJECT_DESCRIPTION)` using the resolved stack.

### Step 1: Planner Sub-Agent
Spawn a planner agent that produces:
- `research/phase-8-coding/plan/master-plan.md` — High-level implementation plan
- `research/phase-8-coding/plan/features/<feature>/plan.md` — Per-feature implementation plans
- `research/phase-8-coding/plan/features/<feature>/references.md` — Per-feature reference links

### Step 2: Reviewer Sub-Agent (Plan Review)
Before any coding, spawn a reviewer agent that validates the master plan against Phase 7 best practices and anti-patterns. If issues are found, the planner revises.

### Step 3: Coder Sub-Agents (Optional)
If the user requests implementation:
- Spawn one coder sub-agent per feature
- Each coder reads its feature plan and Phase 7 RAG source
- After each feature, a reviewer validates the implementation

---

## Subagent Rules

Apply these rules to **EVERY subagent** you spawn (be explicit in the subagent prompts):

1. **Query Phase 7 RAG source** — every agent must read `research/phase-7-final/` files for stack knowledge.
2. **Sequential execution** — spawn one subagent at a time. Never parallel. One tool call at a time.
3. **Narrow scope** — planners plan one level deep, coders implement one feature, reviewers validate one artifact.
4. **Write before return** — subagent must write files BEFORE returning.
5. **References mandatory** — include source references to Phase 7 files and external documentation.
6. **Tech stack context** — include the `(TECH_STACK)` to keep work focused on the resolved stack.
7. Return to the primary agent only the number of git line changes for output files, nothing else.

---

## Execution Order

### Phase 8A: Planning
1. Read `state/decision-matrix.md` and `state/constraint-chains.md` for stack context
2. **Spawn Planner sub-agent**:
   - Input: `state/decision-matrix.md`, `state/constraint-chains.md`, Phase 0 topics file path
   - RAG source: Phase 7 file paths (`research/phase-7-final/`)
   - Output: Master plan + per-feature plans
3. Wait for completion, verify plan files were written
4. **Spawn Reviewer sub-agent (Plan Review)**:
   - Input: Master plan file path, Phase 7 file paths
   - Task: Validate plan against best practices and anti-patterns
   - Output: Review report
5. If reviewer finds issues → spawn a second planner pass with reviewer feedback
6. If reviewer approves → proceed

### Phase 8B: Implementation (User-Controlled)
7. Ask the user: "Planning complete. Would you like me to begin implementing features?"
8. If user confirms:
   a. For each feature in the master plan:
      - **Spawn Coder sub-agent** with feature plan + Phase 7 RAG source
      - **Spawn Reviewer sub-agent** to validate the implementation against Phase 7
      - If reviewer finds issues → coder revises
      - If reviewer approves → commit the feature and proceed
   b. After all features: commit using conventional commits, report complete

---

## Planner Sub-Agent Prompt Template

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

Output files:
- research/phase-8-coding/plan/master-plan.md
- research/phase-8-coding/plan/features/<feature-name>/plan.md (one per feature)
- research/phase-8-coding/plan/features/<feature-name>/references.md (one per feature)

Your Task:
1. Break the project into logical, implementable features
2. For each feature, produce an implementation plan with:
   - File structure
   - Key modules/classes/functions
   - Dependencies on other features
   - Estimated complexity (Low / Medium / High)
   - Implementation order (what must be built first)
3. The master plan should include:
   - Feature dependency graph
   - Recommended implementation order
   - Risk assessment per feature
   - Testing strategy overview

Rules:
- Query Phase 7 RAG files for architectural patterns and conventions
- Sequential tool calls — one at a time
- Write ALL files before returning
- Structure plans for easy handoff to coder agents
- Include file paths and module names where possible

Master Plan format:

# Master Implementation Plan — [PROJECT_DESCRIPTION]

## Technology Stack
[Brief recap from decision matrix]

## Feature Dependency Graph
[What depends on what — use a text-based graph]

## Recommended Implementation Order
1. [Feature] — [why first]
2. [Feature] — [why second]

## Risk Assessment
[High-risk features and mitigation strategies]

## Testing Strategy
[Unit, integration, E2E overview]

Per-feature plan format:

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

## Implementation Steps
1. [Step 1]
2. [Step 2]

## Testing Notes
[What needs to be tested]
```

## Reviewer Sub-Agent Prompt Template

```
You are a code reviewer for a [TECH_STACK] project.

Project: [PROJECT_DESCRIPTION]

RAG source — validate against these files (read first):
- research/phase-7-final/best-practices.md
- research/phase-7-final/anti-patterns.md
- research/phase-7-final/cross-cutting.md

Stack context:
- state/decision-matrix.md

Artifact to review: [plan file path or code file path]

Your Task:
1. Read the Phase 7 RAG source files
2. Read the artifact to review
3. Check for:
   - Violations of best practices
   - Presence of known anti-patterns
   - Missing cross-cutting concerns (security, testing, error handling)
   - Architectural misalignment with the resolved stack
   - Incomplete error handling or edge cases
4. Report findings with severity (Critical / Warning / Info)
5. Provide specific actionable fixes for each finding

Return ONLY this review report:

# Review: [Artifact Name]

## Overall Assessment
[Pass / Needs Revision / Critical Issues]

## Findings

### [Severity] — [Finding Title]
- Issue: [what's wrong]
- Reference: [which Phase 7 section covers this]
- Fix: [how to address it]

### [Severity] — [Next Finding]
...

## Summary
[X Critical, Y Warning, Z Info findings]
[If Pass: artifact approved for next phase]
[If Needs Revision: list what must change]
```

## Coder Sub-Agent Prompt Template

```
You are a feature implementation agent for a [TECH_STACK] project.

Project: [PROJECT_DESCRIPTION]

Feature plan to implement (read first):
- research/phase-8-coding/plan/features/<feature-name>/plan.md

RAG source — query for stack knowledge (read as needed):
- research/phase-7-final/best-practices.md
- research/phase-7-final/anti-patterns.md
- research/phase-7-final/cross-cutting.md

Stack context:
- state/decision-matrix.md

Output: [feature implementation files — specify paths]

Your Task:
1. Read the feature plan
2. Query Phase 7 RAG source for patterns and conventions
3. Implement the feature following the plan
4. Follow best practices and avoid anti-patterns from Phase 7
5. Write all implementation files before returning

Rules:
- Sequential tool calls — one at a time
- Write ALL implementation files before returning
- Follow the feature plan structure
- Include comments referencing Phase 7 best practices where relevant
- Handle errors and edge cases
- Do not implement features outside the plan scope
```

---

## Optional: Real Code Browsing

The planner agent can optionally browse a real code repository (if the user provides one) to ground decisions in reality. This is passed as an additional input to the planner:

- Repository path or URL
- Focus areas to inspect (e.g., "check how error handling is done", "review the project structure")
- Browse one directory at a time, sequentially

---

## Post-Phase

After Phase 8 is complete:
1. Trigger the checkpoint skill to save Phase 8 completion
2. Update checkpoint summary with implementation status
3. Report to user:
   - Master plan location
   - Per-feature plan locations
   - Reviewer assessment summary
   - If code was generated: locations of implementation files

---

## Critical Rules

- **NEVER spawn subagents in parallel**
- **Planning is mandatory, coding is optional** — always produce plans first; only code if the user explicitly requests
- **Phase 7 is the RAG source** — all agents query `research/phase-7-final/` for stack knowledge
- **Reviewer must validate before coding** — no implementation proceeds without a clean review
- **Every coder pass gets a review pass** — implementation and validation are paired
- **Checkpoint on completion** — save state before concluding
- **Context protection** — The orchestrator MUST NOT read Phase 7 files or heavy research files. Pass file paths to sub-agents.
- **Conventional commits required** — all git operations use Conventional Commit format
