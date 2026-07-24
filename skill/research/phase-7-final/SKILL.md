name: phase-7-final-researcher
description: Gather best practices, anti-patterns, and cross-cutting concerns for the final technology stack. Produces three research files that become the primary RAG source for all Phase 8 coding agents (planner, coder, reviewer).
---

# Phase 7: Final Research

## Purpose
After the reality check in Phase 6 validates the technology stack, conduct final broad research to capture **best practices, anti-patterns, and cross-cutting concerns** for the resolved stack. This produces three comprehensive files that serve as the **primary RAG source** for all Phase 8 coding agents (planner, coder, reviewer). The coding phase agents query Phase 7 output via RAG to ground their work in validated knowledge.

**This is synthesis research, not deep-dive.** Phase 5 went deep per section; Phase 7 goes broad across the entire stack to capture patterns that span multiple sections.

## Activation
- Triggered when `state/phase-marker.md` indicates Phase 7
- User says "phase 7", "final research", or similar

---

## Pre-flight

**Before doing anything else, read `state/checkpoint.md`** to retrieve `PROJECT_DESCRIPTION` and `TECH_STACK`.

---

## Input

1. **Read `state/checkpoint.md`** — Get condensed context and resolved decisions
2. **Read `state/decision-matrix.md`** — Get the final list of resolved technologies
3. **Read `state/constraint-chains.md`** — Understand the full constraint cascade

**CRITICAL: The orchestrator must NOT read Phase 4 or Phase 5 files itself.** The decision matrix and constraint chains provide the condensed context. Sub-agents may need to reference Phase 5 deep dive files for specific integration patterns — pass file paths.

---

## Mission

Research three categories of cross-cutting knowledge for the `(PROJECT_DESCRIPTION)` stack:

### 1. Best Practices (`best-practices.md`)
Proven patterns, architectural recommendations, and "do this right" guidance for the chosen stack. Focus on patterns that span multiple sections (not section-specific advice).

### 2. Anti-Patterns (`anti-patterns.md`)
Common mistakes, pitfalls, and "don't do this" warnings specific to the chosen stack. Include real-world failure modes discovered in community discussions, blog posts, and post-mortems.

### 3. Cross-Cutting Concerns (`cross-cutting.md`)
Security, performance, testing, CI/CD, deployment, monitoring, logging, error handling, and other concerns that apply across all sections of the project.

You are the orchestrator. Spawn three sub-agents (one per category) to conduct the research.

---

## Subagent Rules

Apply these rules to **EVERY subagent** you spawn (be explicit in the subagent prompts):

1. **Cross-cutting focus only** — research patterns that span multiple sections of the stack, not section-specific advice (Phase 5 already covered that).
2. **Sequential execution** — spawn one subagent at a time. Never parallel. One tool call at a time.
3. **Read the decision matrix** — each subagent must read `state/decision-matrix.md` to know the resolved stack.
4. **May reference Phase 5 files** — subagents MAY read relevant Phase 5 deep dive files for integration context, but should not duplicate that research.
5. **Comprehensive but focused** — cover all relevant areas for the category without drifting into general programming advice.
6. **Output to dedicated files** — write to `research/phase-7-final/best-practices.md`, `anti-patterns.md`, or `cross-cutting.md`.
7. **Write before return** — subagent must write files BEFORE returning.
8. **References mandatory** — include URL references to documentation, blog posts, conference talks, and real-world case studies.
9. **RAG-optimized format** — write in clear, structured markdown with headers, bullet points, and explicit technology names so Phase 8 agents can easily query via RAG.
10. **Tech stack context** — include the `(TECH_STACK)` to keep research tightly focused on the resolved stack.
11. Return to the primary agent only the number of git line changes for the subagent output file, nothing else.

---

## Execution Order

1. Read `state/decision-matrix.md` and `state/constraint-chains.md` for the resolved stack context
2. **Spawn Sub-agent 1: Best Practices**
   - Task: Research best practices for the resolved stack
   - Output: `research/phase-7-final/best-practices.md`
   - Context: `state/decision-matrix.md`, `state/constraint-chains.md`, relevant Phase 5 file paths
3. Wait for completion, verify file was written
4. **Spawn Sub-agent 2: Anti-Patterns**
   - Task: Research anti-patterns for the resolved stack
   - Output: `research/phase-7-final/anti-patterns.md`
   - Context: Same as above
5. Wait for completion, verify file was written
6. **Spawn Sub-agent 3: Cross-Cutting Concerns**
   - Task: Research cross-cutting concerns (security, testing, CI/CD, etc.)
   - Output: `research/phase-7-final/cross-cutting.md`
   - Context: Same as above
7. Wait for completion, verify file was written
8. Spawn a verification subagent to:
   - a. Verify all three files were written and contain substantive content
   - b. If any file is too thin (<500 words), report which needs re-doing
   - c. If all good, commit using conventional commits and report complete with line change count
9. If any file needs re-doing, spawn a replacement subagent for that category
10. Upon confirmation all files are complete, proceed to post-phase

---

## Subagent Prompt Templates

### Best Practices Agent
```
You are a best-practices research agent for a [TECH_STACK] project.

Project: [PROJECT_DESCRIPTION]

Resolved stack (read for context):
- state/decision-matrix.md
- state/constraint-chains.md

Output file: research/phase-7-final/best-practices.md

Research Focus:
- Architectural patterns proven to work with this stack
- Code organization and project structure conventions
- API design patterns specific to the chosen frameworks
- Data access patterns (ORM, query builders, raw SQL guidelines)
- State management patterns across the full stack
- Error handling conventions
- Configuration management best practices
- Environment management patterns
- Documentation standards within this ecosystem

Rules:
- Research ONLY the resolved stack
- Sequential tool calls — one at a time
- Focus on cross-cutting patterns, not section-specific advice
- Write to output file before returning
- Structure for RAG: clear headers, bullet points, explicit tech names
- Include URL references

Return your research in this format:

# Best Practices — [TECH_STACK]

## Architecture
[Patterns and recommendations]

## Code Organization
[Project structure conventions]

## API Design
[Framework-specific patterns]

## Data Access
[ORM/query patterns]

## State Management
[Cross-cutting state patterns]

## Error Handling
[Conventions and patterns]

## Configuration
[Config management practices]

## References
[URLs with brief notes]
```

### Anti-Patterns Agent
```
You are an anti-patterns research agent for a [TECH_STACK] project.

Project: [PROJECT_DESCRIPTION]

Resolved stack (read for context):
- state/decision-matrix.md
- state/constraint-chains.md

Output file: research/phase-7-final/anti-patterns.md

Research Focus:
- Common mistakes developers make with this stack
- Known failure modes from production incidents
- Performance anti-patterns (N+1 queries, memory leaks, blocking calls)
- Security anti-patterns (injection, XSS, auth bypasses)
- Testing anti-patterns (fragile tests, slow suites, no integration tests)
- Deployment anti-patterns (manual steps, no rollback, config drift)
- Scaling anti-patterns (tight coupling, shared mutable state, no caching)
- Real-world post-mortems and community warnings

Rules:
- Research ONLY the resolved stack
- Sequential tool calls — one at a time
- Focus on patterns that span multiple sections
- Write to output file before returning
- Structure for RAG: clear headers, bullet points, explicit tech names
- Include URL references to post-mortems, blog posts, and issues

Return your research in this format:

# Anti-Patterns — [TECH_STACK]

## Architecture Anti-Patterns
[Mistakes to avoid]

## Performance Anti-Patterns
[What to watch for]

## Security Anti-Patterns
[Common vulnerabilities]

## Testing Anti-Patterns
[What makes tests brittle or useless]

## Deployment Anti-Patterns
[Operations pitfalls]

## Real-World Failures
[Post-mortems and case studies]

## References
[URLs with brief notes]
```

### Cross-Cutting Concerns Agent
```
You are a cross-cutting concerns research agent for a [TECH_STACK] project.

Project: [PROJECT_DESCRIPTION]

Resolved stack (read for context):
- state/decision-matrix.md
- state/constraint-chains.md

Output file: research/phase-7-final/cross-cutting.md

Research Focus:
- Security: authentication, authorization, data protection, secrets management
- Testing: unit, integration, E2E, test infrastructure, CI test runners
- CI/CD: build pipelines, deployment automation, rollback strategies
- Monitoring: logging, metrics, tracing, alerting
- Performance: profiling, load testing, caching strategies
- Observability: distributed tracing, health checks, status pages
- Internationalization and accessibility
- Data migration strategies and backup procedures
- Environment parity (dev/staging/prod consistency)

Rules:
- Research ONLY the resolved stack
- Sequential tool calls — one at a time
- Cover ALL categories even if brief — completeness matters for RAG
- Write to output file before returning
- Structure for RAG: clear headers, bullet points, explicit tech names
- Include URL references

Return your research in this format:

# Cross-Cutting Concerns — [TECH_STACK]

## Security
[Auth, authz, secrets, data protection]

## Testing Strategy
[Unit, integration, E2E, CI test runners]

## CI/CD Pipeline
[Build, deploy, rollback]

## Monitoring & Observability
[Logging, metrics, tracing, alerting]

## Performance
[Profiling, caching, load testing]

## Data Management
[Migrations, backups, retention]

## Environment Management
[Dev/staging/prod parity]

## References
[URLs with brief notes]
```

---

## Post-Phase

After all three research files are complete:
1. Trigger the checkpoint skill to save Phase 7 completion
2. Update checkpoint summary noting Phase 7 files are the primary RAG source for Phase 8
3. Prepare to transition to Phase 8 (coding planner)

---

## Critical Rules

- **NEVER spawn subagents in parallel**
- **Cross-cutting focus** — patterns that span the full stack, not section-specific advice
- **Three dedicated output files** — best-practices, anti-patterns, cross-cutting
- **RAG-optimized format** — structured for easy querying by Phase 8 agents
- **References mandatory** — all findings traceable to credible sources
- **Checkpoint on completion** — save state before transitioning phases
- **Context protection** — The orchestrator MUST NOT read heavy research files. Use condensed state files and pass file paths to sub-agents.
- **Phase 7 is the primary RAG source** — Phase 8 planner, coder, and reviewer agents will query these files
