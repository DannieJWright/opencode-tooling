---
name: checkpoint
description: Manage persistent state across sessions to survive compaction. Handles loading state on session start and saving state on phase transitions or user request. Cross-cutting skill that loads with every other skill.
---

# Checkpoint Skill

## Purpose
Manage persistent state across sessions to survive compaction. This skill handles loading state on session start and saving state on phase transitions or user request. **Cross-cutting** — loads with every other research skill.

## Activation
- **On session start**: Automatically load checkpoint state
- **On phase transition**: Save full checkpoint
- **On user request**: User says "checkpoint", "save state", or similar

---

## On Session Start (Load)

1. **Read `state/phase-marker.md`** — Determine current phase and reason for entry
2. **Read `state/checkpoint.md`** — Quick context restore summary
3. **Read `state/loop-history.md`** — If active loop entries exist, read them to understand why we revisited this phase
4. **Read `state/decision-matrix.md`** — Current decision status if in Phase 4+
5. **Read `state/constraint-chains.md`** — Current constraints if in Phase 4+
6. **Load the appropriate phase skill** based on current phase marker
7. **Report to user**: "Loaded checkpoint — currently in Phase X. [If looping: Reason: Y]"

---

## On Phase Transition (Save)

1. **Update `state/phase-marker.md`**:
   - Current phase number and name
   - Status (Active, Complete, Blocked)
   - Entry reason
   - Progress summary
   - Next action

2. **Update `state/checkpoint.md`**:
   - Condensed project summary
   - Key immutable facts
   - Key decisions made
   - Pending decisions
   - Research status per phase

3. **If entering Phase 4+**:
   - Generate or update `state/decision-matrix.md` from Phase 4 raw decision files
   - Generate or update `state/constraint-chains.md` from current decisions

4. **If looping back to a prior phase**:
   - Append entry to `state/loop-history.md` with:
     - Date
     - Source phase
     - Target phase
     - Reason for loop
     - Required action
     - Status

5. **Confirm to user**: "Checkpoint saved — transitioning to Phase X."

---

## On User Request (Save)

Same as phase transition, but:
- Explicitly confirm: "Checkpoint saved. You can safely swap sessions."

---

## State File Locations

```
state/
├── phase-marker.md        # Current phase + entry reason
├── checkpoint.md          # Condensed context summary
├── decision-matrix.md     # Condensed decision table (Phase 4+)
├── constraint-chains.md   # Traced implications (Phase 4+)
└── loop-history.md        # Phase re-entry reasons
```

---

## Critical Rules

- **Always save before concluding work** — never leave state files stale
- **Derived state files are regenerated from raw data** — decision-matrix and constraint-chains are always derived from `research/phase-4-decisions/` files, never manually edited
- **Keep checkpoint.md concise** — it's a quick context restore, not a full summary. Target 1000-2000 words
- **If context is filling up**: Save checkpoint and suggest session swap
