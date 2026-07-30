---
name: deep-topic-research
description: Use when a broad research topic needs deep, multi-dimensional coverage via sequential focused sessions. Triggers: "research thoroughly", "comprehensive research on X", topics spanning multiple domains, "what are the opinions on X", subjects requiring iterative knowledge building across distinct angles.
---

# Deep Topic Research

## Overview

Achieve deep, synthesis-ready research by decomposing a broad topic into sequential, narrowly-focused sub-topic sessions. Each session builds on prior results — later queries are shaped by earlier findings, producing layered understanding a single query cannot achieve.

## When to Use

- Topic requires investigating multiple angles, factors, or perspectives to answer well
- User requests "deep", "thorough", "comprehensive" research
- Topic spans multiple domains, or has meaningful dimensions beyond the obvious one
- **NOT for** narrow, single-dimension lookup — use a direct search instead

## System Constraints

- **Sequential only** — sessions MUST run one at a time, waiting for each result before launching the next
- **No nesting** — research sessions cannot spawn their own subagents; keep queries self-contained
- **Full context between sessions** — the orchestrator holds all prior results and feeds relevant context forward
- A session is one focused research operation (web search, documentation lookup, expert query, etc.) — an atomic unit of investigation

## Core Workflow

```
Decompose → Session 1 (foundational) → read result → refine angle →
Session 2 (builds on 1) → read result → refine angle →
... → Session N (final angle) → Synthesize all → Unified answer
```

### 1. Decompose into Orthogonal Dimensions

Break the topic into 3-5 sub-topics that are each **narrow enough for one focused session** but together **cover the full scope**. Each dimension should answer a distinct question. Weak decomposition produces overlapping or redundant sessions.

**Quality check for decomposition:**
- Each sub-topic answers a different question
- No two sessions overlap significantly
- Together they cover the user's full intent
- Ordering allows earlier results to inform later queries

**Session count guide:**
- Fewer than 3: verify you're not under-investigating a broad topic
- 3 sessions: well-scoped topic with clear dimensions
- 4-5 sessions: genuinely broad topic with multiple independent angles
- More than 5: likely over-decomposed; consolidate related dimensions

### 2. Execute Focused Session Queries

Each session query must be **narrowly scoped** yet **richly detailed**. Demand quantitative evidence, benchmarks, and specific comparisons — not just opinions or vague best practices. If session results lack substantive evidence, **reformulate and retry** before proceeding to the next session. Do not carry weak results forward.

**Good session query includes:**
- Specific angle or dimension being investigated
- Request for quantitative data (benchmarks, percentages, dollar amounts)
- Request for concrete examples or expert recommendations
- Reference to prior findings (sessions 2+): "Based on finding X from prior session, now research Y"

**Bad session query:**
- Too broad — repeats the original topic
- Asks only for "opinions" without demanding evidence
- Ignores prior results and acts like session 1

### 3. Sequential Refinement (Sessions 2+)

This is the core advantage of the sequential approach. Each later session should be shaped by what earlier sessions discovered:

- **Narrow scope** based on what prior sessions revealed
- **Pursue surprising findings** — if session 1 revealed an unexpected angle, investigate it deeper
- **Resolve open questions** — if session 1 raised "but what about X?", session 2 answers it
- **Escalate specificity** — foundation → implications → concrete tradeoffs
- When referencing prior findings, include a **1-2 sentence distillation** of the relevant prior result — not the full log. Example: *"Session 1 found pattern A dominates in large teams. Now investigate whether A holds for small teams."*
- **Session quality gate:** Before proceeding, verify the session returned at least one substantive finding relevant to its dimension. If results are thin or off-topic, reformulate and retry. Do not carry garbage forward.

### 4. Synthesize into Unified Answer

The final synthesis is **not** a summary of each session. It is a **coherent answer to the original question** that:

- Resolves contradictions between sessions (e.g. "session A says X but session B found the opposite — the real answer is Y because of Z")
- Ranks findings by importance or confidence
- Presents a ranked numbered summary with quantitative evidence
- Concludes with an actionable recommendation or practical takeaway
- Credits sources where applicable
- Acknowledges blind spots — dimensions where evidence was thin or contradictory and cannot be resolved

## Example Decomposition

**Input:** "Research frontier AI model usage patterns for development"

**Decomposed into 4 sequential sessions:**
1. Architectural patterns for frontier model roles in dev workflows (foundational)
2. Cost tradeoffs: planning vs direct execution (builds on 1 — now quantify)
3. Orchestration patterns and harness design (builds on 1+2 — how do systems solve it)
4. Optimal reasoning budget for coding tasks (builds on all — where should compute go)

**Synthesis:** Unified answer resolving contradictions, ranked findings, actionable architecture recommendation.

## Common Mistakes

| Mistake | Result | Fix |
|---------|--------|-----|
| Single broad query | Shallow coverage, surface-level answers | Decompose first |
| Parallel sessions | No iterative refinement, redundant angles | Sequential only |
| Sessions ignore prior results | Misses the point of sequential design | Reference prior findings explicitly |
| Synthesis = list of summaries | No integration, no insight | Resolve contradictions, give recommendation |
| Over-decomposed (>5 sessions) | Diminishing returns, context overhead | Consolidate related dimensions |
| Session queries lack evidence demands | Opinions without substantiation | Request benchmarks, numbers, comparisons |
