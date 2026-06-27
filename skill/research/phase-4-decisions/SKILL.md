---
name: phase-4-decisions
description: Analyze research summaries to classify decisions as Immutable, Derived, or Open. Produces raw decision documents with reasoning and references, then generates condensed state files for quick reference.
---

# Phase 4: Decision Making

## Purpose
Take the condensed research summaries from Phase 3 and classify every decision item into categories: **Immutable** (fixed by constraint), **Derived** (follows from immutables), or **Open** (needs a conscious choice). Produce raw decision documents with full reasoning and references, then generate condensed state files derived from that raw data.

**This is classification and documentation, not final decision-making.** The agent categorizes and documents; the user makes final choices on open items.

## Activation
- Triggered when `state/phase-marker.md` indicates Phase 4
- User says "phase 4", "decisions", "classify decisions", or similar
- Re-entered from Phase 6 when reality check requires re-evaluation

---

## Pre-flight

**Before doing anything else, ask the user for these values.** Do not proceed until all are provided.

| Variable | Description | Default |
|---|---|---|
| `PROJECT_DESCRIPTION` | What is the project? (e.g. "2D turn-based gladiator fighting game") | N/A |
| `TECH_STACK` | What tech stack? (e.g. "Unity game engine using C#") | N/A |

---

## Input

1. **Read `research/phase-0-targets/topics.md`** — Get the section/subsection structure
2. **Read Phase 3 summary files from `research/phase-3-summaries/`** — These are the condensed research sources
3. **Read `state/checkpoint.md`** — Get condensed context from checkpoint
4. **If re-entering from Phase 6**: Read `state/loop-history.md` and any updated Phase 4 decision files

---

## Process

### Step 1: Extract Decision Items

Read each Phase 3 summary and extract every decision item — technical choices, architecture patterns, framework options, design trade-offs.

### Step 2: Classify Each Decision

For each extracted item, classify into one category:

**IMMUTABLE** — Fixed by external constraints, user requirement, or platform mandate. Cannot change.
- Examples: "Must use Unity" → "Must use C#", regulatory requirements, existing infrastructure
- Include reasoning: WHY is it immutable?

**DERIVED** — Logically follows from an immutable choice. Not a free decision.
- Examples: If Unity is immutable → .NET ecosystem is derived → NuGet for packages is derived
- Include the immutable item that derives it

**OPEN** — Multiple valid options exist, needs conscious choice.
- Examples: Which state management library? Which testing framework? Which architecture pattern?
- List the known options from research

### Step 3: Write Raw Decision Documents

For each decision item, write a raw decision file to `research/phase-4-decisions/<section>.<subsection>-<desc>.md`. Each file includes:

- Decision description
- Classification (Immutable / Derived / Open)
- Options and alternatives (from research)
- Reasoning for classification
- Source references (Phase 3 summary file + URL references)
- User notes or preferences (if provided)

### Step 4: Generate State Files

After all raw decision files are written, generate derived state files:

**`state/decision-matrix.md`** — Condensed table:
| # | Decision Item | Section | Status | Options | Source Ref |
|---|--------------|---------|--------|---------|------------|

**`state/constraint-chains.md`** — Traced implications showing how immutables cascade into derived items.

### Step 5: Report to User

Present a summary of classification results:
- Count of Immutable, Derived, and Open items
- List of Open decisions that need user input
- Any items where research was insufficient for classification

---

## Subagent Rules

Apply these rules to **EVERY subagent** you spawn (be explicit in the subagent prompts):

1. **Classify, do not decide** — the agent classifies items and documents reasoning. The user makes final choices on Open items.
2. **Sequential execution** — spawn one subagent at a time. Never parallel.
3. **Single section scope** — each subagent handles ONE section's decisions.
4. **Read Phase 3 summaries** — subagent reads the Phase 3 summary for its assigned section.
5. **Output raw decision files** — write to `research/phase-4-decisions/<section>.<subsection>-<desc>.md`.
6. **Write before return** — subagent must write files BEFORE returning.
7. **Merge into existing** — if decision files exist from a prior run, update them with new classifications. Preserve any user-made decisions.
8. **References mandatory** — include source references to Phase 3 summaries and URL references.
9. **Tech stack context** — include the `(TECH_STACK)` to keep decisions focused.
10. Return to the primary agent only the number of git line changes for the subagent output file, nothing else.

---

## Execution Order

1. Read Phase 3 summaries for all sections
2. Start with Section 1
3. Spawn **one** subagent with:
   - The file path for the Phase 3 summary for that section 
   - `TECH_STACK` context
   - Classification rules (Immutable / Derived / Open)
   - All subagent rules
   - Output file path(s) for that section's decision files
4. Wait for completion, verify decision files were written
5. Mark section complete, proceed to next
6. After all sections, generate state files:
   - `state/decision-matrix.md` (condensed table from raw decision files)
   - `state/constraint-chains.md` (traced implications)
7. Commit using conventional commits
8. Report classification summary to user

---

## Raw Decision File Format

```markdown
# Decision: [Decision Name]

## Classification
**Status:** IMMUTABLE | DERIVED | OPEN

## Options
- **Option A** — description and trade-offs
- **Option B** — description and trade-offs

## Reasoning
[Why this classification. For Immutable: what mandates it. For Derived: what it derives from. For Open: what criteria should guide the choice.]

## Sources
- Phase 3 summary: `01-ai-systems.md` (specific section)
- URL: https://... (brief note)

## User Notes
[Any user-provided preferences or constraints for this decision]
```

---

## State File Generation

### `state/decision-matrix.md`
```markdown
# Decision Matrix

| # | Decision | Section | Status | Options | Source Ref |
|---|----------|---------|--------|---------|------------|
| 1 | Language | 01 | 🔒 Immutable | Rust | User requirement |
| 2 | Database | 01 | ✅ Resolved | PostgreSQL | Decision #1 cascade |
| 3 | Auth | 02 | ❓ Open | JWT / Session | 02-ui-summary.md |
```

### `state/constraint-chains.md`
```markdown
# Constraint Chains

## Chain 1: Language Choice (Rust - Immutable)
→ Async runtime needed (tokio / async-std)
→ Crate ecosystem for packages
→ Serialization: serde

## Chain 2: Database (PostgreSQL - Derived)
→ ORM: must support PostgreSQL
→ Migration tool: must work with PostgreSQL
→ Caching: consider PostgreSQL built-in caching
```

---

## Post-Phase

After all decisions are classified and documented:
1. Trigger the checkpoint skill to save current Phase 4 status
2. Update checkpoint summary with decision status
3. Present Open decisions to user for resolution
4. Prepare to transition to Phase 5 (deep dive on chosen stack)

---

## Re-entry from Phase 6

When Phase 6 reality check requires re-evaluation:
1. Read `state/loop-history.md` for context on why we're re-entering
2. Read updated Phase 4 raw decision files (Phase 6 may have modified them)
3. Regenerate state files from updated raw data
4. Continue classification for any new or changed items

---

## Critical Rules

- **NEVER spawn subagents in parallel**
- **Classify, do not decide** — document options and reasoning, let user choose
- **Raw data stays detailed** — decision files include full reasoning and references
- **State files are derived and condensed** — generated from raw decision files, not manually edited
- **Checkpoint on completion** — save state before transitioning phases
- **Re-entry is explicit** — when coming from Phase 6, read loop history first