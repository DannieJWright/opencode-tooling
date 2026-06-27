---
name: phase-2-summaries
description: >
  Use when planning a project by researching multiple topics via sequential subagents.
  Triggers: "lets make the phase 2 summary docs", "research phase 2"
---

# Research Orchestration

Orchestrate subagent researchers that sequentially study topics from a guide document, producing a single checklist-based plan file for a fresh agent session to implement step-by-step.

## Overview

You are an orchestrator. You read a guide document listing research topics, spawn one subagent per subpoint, and collect their findings into a plan document. Each subpoint becomes a checked-off section in the plan with implementation details, references, and key findings.

## Configuration

Set these before starting:

| Variable | Purpose | Example |
|----------|---------|---------|
| `GUIDE_DOC` | Path to the guide document | `docs/research/guide.md` |
| `PLAN_FILE` | Path to the output plan | `docs/implementation-plan.md` |
| `TECH_STACK` | Project context to narrow research | `Unity C# 2D game` |

## Guide Document Format

The guide document should have numbered sections, each with subsections and references:

```markdown
## Section N: Topic Title

### N.a Subtopic
- Local references: `file.md`, `file.md#L10-L20`
- Associated URLs: https://example.com

### N.b Another Subtopic
- Local references: ...
```

## Subagent Rules

Include these rules in every subagent prompt:

1. **Research only** — no implementation, no code, no plans. Collect information.
2. **Single topic scope** — research only the assigned subpoint. Tight scope.
3. **Sequential web research** — fetch one URL at a time. Never parallel. URLs from known valid sources only.
4. **No decisions** — when multiple options exist, mention each. Note whether native to the platform. Note which is most recent (legacy vs new systems). Do not pick a winner.
5. **References only** — include only valid references. Exclude any URLs that failed to fetch.
6. **Expand beyond local docs** — guide document references are a starting point, not the sole source. Supplement with web research.
7. **Report structure** — return findings in the exact format specified in the prompt. No fluff.

## Plan File Format

The orchestrator maintains a single plan file. Structure:

```markdown
# [Project Name] Implementation Plan

> Plan generated through research orchestration. Each section was researched independently.
> This plan is ready for a fresh agent session to execute step-by-step.

## Section 1: [Topic]

- [ ] 1.a [Subpoint name]
- [ ] 1.b [Subpoint name]

**Key Findings:**
[Research findings from subagents]

**References:**
[Valid references]

## Section 2: [Topic]

- [ ] 2.a [Subpoint name]
...
```

As each subagent completes, the orchestrator:
1. Replaces `- [ ]` with `- [x]` for that subpoint
2. Appends the subagent's findings and references to that section
3. Rewrites the full plan file atomically

## Workflow

```dot
digraph workflow {
    rankdir=LR;
    A["Read GUIDE_DOC"] -> B["Get next subpoint"];
    B -> C{"Subpoints left?"};
    C ->|"yes"| D["Spawn subagent (sequential)"];
    D -> E["Update PLAN_FILE with results"];
    E -> F{"Section complete?"};
    F ->|"yes"| G["STOP — report progress"];
    G -> H["Wait for confirmation"];
    H -> B;
    F ->|"no"| B;
    C ->|"no"| I["Plan complete"];
}
```

### Execution Steps

1. Read `GUIDE_DOC`
2. Initialize `PLAN_FILE` with full checklist (all `- [ ]`)
3. Get next unchecked subpoint
4. Spawn **one** subagent with:
   - The subpoint topic
   - References from `GUIDE_DOC` for that section
   - `TECH_STACK` context
   - All subagent rules
   - Explicit output format request
5. Wait for completion
6. Update `PLAN_FILE`: mark subpoint `- [x]`, append findings and references
7. If all subpoints in a section done — **STOP and report progress**. Do not continue without confirmation.
8. On confirmation, proceed to next section

## Subagent Prompt Template

```
You are a research agent for a [TECH_STACK] project.

Topic: [subpoint description]

Research references:
[local file references from guide.md for this section]
[associated URLs from guide.md for this section]

Rules:
- Research only — no implementation, no code, no plans
- One web fetch at a time — no parallel web requests
- No decisions — mention options, don't pick
- Include only valid references (exclude failed URLs)
- Guide references are a starting point — supplement with web research

Return your findings in this exact format:

### Key Findings
[What this component needs, what systems exist, architecture notes]

### Technical Considerations
[Platform-native options, legacy vs current APIs, trade-offs]

### References
[Valid file references with line numbers, valid URLs only]
```

## Plan File Header

When initializing the plan file, include:

```markdown
# [TECH_STACK] Implementation Plan

> Plan generated through research orchestration on [date].
> Each section was researched independently. This plan is ready for a fresh agent session to execute step-by-step.
> Check off each item as it is implemented.
```

## Checkpoints

After completing all subpoints in a section, stop and report:
- Which subpoints completed
- Current state of the plan file
- Any issues encountered

Do not proceed to the next section without user confirmation.

## Handoff

When all sections complete, the plan file is ready for handoff. A fresh agent reads the plan and implements each checked section in order, checking off `- [x]` items as done.
