---
name: deep-topic-research
description: Use when a broad research topic needs to be broken into sequential, focused sub-topic sessions to achieve deep, comprehensive coverage. Triggers: multi-dimensional topics, "research X thoroughly/broadly", topics spanning multiple domains or requiring iterative building of knowledge.
---

# Deep Topic Research

## Overview

Achieve deep, synthesis-ready research on broad topics by breaking them into sequential, narrowly-focused sub-topic sessions. Each session builds on prior results to refine the next query.

## When to Use

- Topic spans 2+ distinct domains or dimensions
- User requests "deep", "thorough", or "comprehensive" research
- Topic naturally decomposes (e.g. "best practices + tools + benchmarks + trends")
- **NOT for** narrow, single-dimension lookup questions

## Core Workflow

1. **Decompose** the topic into 3-5 focused sub-topics, each narrow enough for one session
2. **Sequence** sessions: foundational/broad sub-topic first, increasingly specific
3. For each session: **wait for result → read prior output → design next query using new context**
4. **Synthesize** all session results into a single coherent answer

## Rules

- **Sequential only** — never run sessions in parallel
- **Each session must be narrowly scoped** — one dimension per session
- **Each query must reference prior results** — "based on finding X, now research Y"
- **Final synthesis is mandatory** — combine all findings, resolve contradictions, present unified answer

## Example Decomposition

**Input:** "Research frontier AI model usage patterns for development"
**Decompose into sessions:**
1. Architectural patterns for frontier model roles in dev workflows
2. Cost tradeoffs: planning vs direct execution
3. Orchestration patterns and harness design
4. Optimal reasoning/thinking budget for coding tasks
**Then:** Synthesize all four results into one unified answer

## Common Mistakes

- Single broad query → shallow coverage
- Parallel sessions → loss of iterative refinement
- No synthesis → fragmented output
