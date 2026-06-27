---
name: phase-0-establisher
description: Discover what needs to be researched before research begins. Gathers user goals through interactive questioning, searches the web for related topics, and iterates to converge on a comprehensive topic list for Phase 1 research.
---

# Phase 0: Establisher Skill

## Purpose
Discover what needs to be researched before research begins. This skill gathers user goals through interactive questioning, searches the web for related topics and frameworks, and iterates between the two to converge on a comprehensive list of topics for Phase 1 research.

**This is the hardest skill** — it requires open-ended exploration without knowing the domain upfront.

## Activation
- First phase of any new project
- User says "start a new project", "establish topics", "phase 0", or similar
- Triggered when `state/phase-marker.md` indicates Phase 0 or the file is absent.

---

## Process

### Step 1: Gather User Goals

Start by asking the user about their project. Use open-ended but structured questions:

1. **What are you building?** — Core purpose and target users
2. **What are the key features?** — Major capabilities
3. **Any constraints?** — Language, platform, tools, or technologies that must or must not be used
4. **What do you already know?** — Familiarity with the domain
5. **What are you unsure about?** — Areas needing guidance

**Iterate**: Based on answers, ask follow-up questions to clarify. 2-3 rounds of follow-ups is usually enough before moving to research.

### Step 2: Initial Topic Discovery

Using the user's answers, identify broad topic areas that need research. Common categories include:

- **Architecture** — System design, component boundaries
- **Tech Stack** — Languages, frameworks, databases, tools
- **Design Patterns** — Common patterns relevant to the domain
- **Infrastructure** — Hosting, deployment, scaling
- **Testing** — Testing strategies and frameworks
- **Security** — Authentication, authorization, data protection
- **Domain-Specific** — Anything unique to the project type

Search the web for each broad category to discover:
- Popular frameworks and tools in this domain
- Common architecture patterns used
- Known challenges and best practices
- Related technologies worth considering

### Step 3: Research → Question Iteration

This is the core loop:

1. **Research** a discovered topic area
2. **Identify** new subtopics, frameworks, or patterns that emerged
3. **Ask the user** about relevant findings that need clarification
   - "I found X and Y are common in this domain. Do either sound relevant?"
   - "Z is a common challenge — should we research approaches for this?"
4. **Refine** the topic list based on feedback
5. **Repeat** until the user signals the topic list is comprehensive

**Termination signal**: The user says the list is complete, "that covers it", or similar.

### Step 4: Structure the Output

Organize discovered topics into a structured hierarchy:

```
## Topics for Research

### Section 1: [Topic Area]
- Subsection a: [Specific topic]
- Subsection b: [Specific topic]
- Subsection c: [Specific topic]

### Section 2: [Topic Area]
- Subsection a: [Specific topic]
- Subsection b: [Specific topic]

...
```

For each topic, include:
- **Brief description** — What this topic covers (1-2 sentences)
- **Why it matters** — Relevance to the project
- **Known constraints** — If the user specified immutables for this topic

### Step 5: Save Output

Write the structured topic list to `research/phase-0-targets/topics.md`.

### Step 6: Checkpoint

Trigger the checkpoint skill to:
- Save Phase 0 completion
- Transition marker to Phase 1
- Update checkpoint summary

---

## Web Research Strategy

Use `web_search` or `duckduckgo` for topic discovery:

- Search for "[domain] architecture patterns 2026"
- Search for "[domain] tech stack comparison 2026"
- Search for "[domain] common frameworks 2026"
- Search for "[domain] best practices 2025 2026"
- Search for "[domain] recent updates 2025 2026"

Look for:
- Framework comparison articles
- Architecture decision records
- Community recommendations
- Technology surveys
- Recent feature changes in newest/latest versions

---

## Critical Rules

- **Ask the user early, research second** — don't dive into web research without understanding the project goals first
- **Iterate, don't monologue** — research, report findings, ask clarifying questions, repeat
- **Don't over-research in Phase 0** — the goal is to DISCOVER topics, not research them deeply. That happens in Phases 1-2
- **Flag immutables as you find them** — if the user says "I must use Rust", note it immediately as a known constraint
- **Keep the topic list manageable** — 8-15 major topics with 3-7 subsections each is usually sufficient to start
- **Save progress incrementally** — if the conversation gets long, save the partial topic list to disk before continuing

---

## Output File Location

```
research/phase-0-targets/topics.md
```
