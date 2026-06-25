---
name: phase-3-decisions
description: >
  Generate and maintain the research decisions register for the 2D gladiator
  fighting game project. Reads summary documents from docs/research/summaries/,
  extracts all conflicting technical/design choices, catalogs mandatory requirements,
  and writes a cumulative decisions document at docs/research/decisions.md with
  tracked decision state, source references, and cross-decision dependency
  analysis. Trigger: "generate decisions doc", "research decisions", "decisions
  register", "decision matrix", "design decisions", "update decisions",
  "catalog decisions from summaries".
---

## Purpose

Produce a single cumulative decisions document cataloging every technical and design choice that must be resolved before implementing the 2D gladiator fighting game. This is the bridge between research summaries and actual implementation planning.

## Workflow

### Step 1 — Read Source Summaries

Read ALL files under `docs/research/summaries/`. Process them in numerical order (01-summary.md through N-summary.md). Each summary covers a research chapter (architecture, combat, UI, AI, etc.).

Track: decision categories, conflicting options per category, framework alternatives, design pattern choices, architecture trade-offs, and any "mandatory" recommendations with no viable alternatives.

### Step 2 — Extract Decision Categories

Group decisions by domain. Standard categories (expand as summaries dictate):

- **Mandatory Requirements** — no viable alternatives, automatic constraints
- **Architecture** — rendering pipeline, 3-layer model depth, event system, data flow
- **Combat System** — FSM, command pattern, turn model, damage pipeline, status effects, buffs/debuffs
- **Entity Design** — stats model, sprite rendering, hitbox patterns
- **Scene Management** — bootstrap, scene loading, transitions
- **UI** — runtime system, animations, data binding, layout
- **Feedback Systems** — particles, audio, screen shake
- **Arena Environment** — tilemap, lighting, per-arena config
- **Progression & Balance** — XP curves, stat scaling, skill trees, difficulty
- **Persistence** — serialization, storage, save architecture
- **Tutorial & Onboarding** — tutorial approach, skip/replay
- **AI** — decision architecture, phase management, difficulty scaling
- **Input System** — workflow, architecture, action maps
- **Production Readiness** — localization, CI/CD, build targets, sprite atlases

### Step 3 — Write Document Structure

Output file: `docs/research/decisions.md`

Follow this exact structure:

```markdown
# Research Decisions — 2D Gladiator Fighting Game (Unity 2026, C#)

> Cumulative decision register derived from `docs/research/summaries/01-summary.md` through `docs/research/summaries/N-summary.md`.
> Each item lists conflicting options from source documents, reasoning for preferred choice, and current decision state.

---

## Table of Contents

- [Mandatory Requirements](#mandatory-requirements)
- [Category headings alphabetically]

---

## Mandatory Requirements

### Requirements with no viable alternatives — automatic constraints for this project.

- [x] **Requirement Title** — description. *(source-file(s))*
```

### Step 4 — Write Decision Items

Each decision follows this format:

```markdown
### Prefix-NN: Decision Name

**Options:**
- **Option A** — description and trade-offs
- **Option B** — description and trade-offs

**Sources:** `XX-summary` (specific section), `YY-summary` (related section)

> **Preferred:** The recommended option. Reasoning: why this choice wins over alternatives, what trade-offs are accepted.

**Decision:** UNDECIDED
```

- Use unique prefix per category: `Arch-`, `Comb-`, `Ent-`, `Scn-`, `UI-`, `Fb-`, `Aren-`, `Prog-`, `Per-`, `Tut-`, `AI-`, `In-`, `Prod-`
- Use `-` horizontal rule between decision items
- Number sequentially within each category (01, 02, ...)
- **UNDECIDED** is the default state for every item — decisions are made later by the user

### Step 5 — Cross-Decision Dependencies

After all categories, add a dependency matrix:

```markdown
## Cross-Decision Dependencies

> Items below list decisions that affect multiple categories. Resolving one item constrains or influences others.

| Decision | Affects | Notes |
|----------|---------|-------|
```

Identify items where a choice in one category constrains options in another. Example: Arch-03 (Event System) affects all combat communication and UI data flow.

### Step 6 — Decisions List Summary

Append a summary table at bottom:

```markdown
## Decisions List Summary

| ID | Category | Decision | Status |
|----|----------|----------|--------|
| *(Mandatory ×N)* | Requirements | *(See Mandatory Requirements section above)* | ✅ Fixed |
| Arch-01 | Architecture | ... | ⬜ UNDECIDED |
...

**Total: N mandatory requirements + N decisions = N tracked items.**

---

*Last updated: YYYY-MM-DD*
*Source documents: 01-summary.md through N-summary.md*
```

### Step 7 — Verification

After writing, verify:
1. Every decision item has a `**Decision:** UNDECIDED` line
2. Every decision item references at least one source summary file in `**Sources:**`
3. Summary table counts match actual items in document
4. No decision item has more than 2 blank lines between sections
5. Mandatory requirements use `- [x]` checkboxes; undecided items use no checkbox

## Grounding Rules

- **Always** read current summaries before generating. The skill does not memorize decisions.
- **Always** reference source files. Every decision must cite which summary(s) introduced the options.
- **Prefer** options consistent across summaries. When summaries agree, state as preferred.
- **Flag** genuine disagreements between summaries explicitly.
- **Do not** make decisions. Set all to UNDECIDED. Provide recommendations with reasoning, but the decision register is advisory.
- **Check** for existing `decisions.md`. If it exists, do NOT blindly overwrite. Compare structure, preserve any user-made decisions, only update/add new items from summaries that differ.
- **Mandatory requirements** are items explicitly stated as mandatory/automatic by the research (e.g., "SOs are immutable", "ECS/DOTS: not used"). These are locked, not undecided.

## Update Mode

When re-running (summaries changed):

1. Read existing `decisions.md`
2. Read all summaries
3. Diff decision IDs — identify new items, removed items, changed options
4. Preserve existing decision states (UNDECIDED or user-set values)
5. Only update recommendation text and source references
6. Add new category sections only if summaries introduce genuinely new topics