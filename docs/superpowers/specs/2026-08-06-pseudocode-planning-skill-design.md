# pseudocode-planning Skill — Design

**Date:** 2026-08-06
**Status:** Approved

## Problem

`brainstorming` produces a spec. `writing-plans` produces a full implementation plan
containing real, runnable code for every step. Going straight from spec to full plan
forces decomposition, interface design, and concrete code authoring to happen in a
single pass. Decomposition mistakes get baked into code that then has to be rewritten.

## Solution

A new skill, `pseudocode-planning`, that sits between the two. It produces
`docs/pseudocode/<slug>.md`: an implementation-shaped document that locks in file
structure, task boundaries, interfaces, and behavior — expressed entirely as
pseudocode. `writing-plans` then translates it into real code, which becomes a
largely mechanical step.

## Placement

`skill/pseudocode-planning/SKILL.md` — top-level, discovered by
`opencode-remote-config` as skill name `pseudocode-planning`.

## Workflow

1. Locate input: spec under `docs/superpowers/specs/` if one exists; otherwise the
   agreed requirements in-session. **Soft gate** — the skill is usable for smaller
   changes with no spec. If requirements are too vague to name files, say so and
   suggest `brainstorming`.
2. Explore the codebase enough to name real files, modules, and existing patterns.
   **Input scoping:** the source spec is the single authoritative requirements
   document. Read source, test, and config files it references. Do not read other
   spec or plan documents unless the source spec cites them by path — stale prior
   plans describe superseded designs and contaminate the output.
3. Map file structure: exact paths, one responsibility each.
4. Decompose into tasks mirroring `writing-plans` structure, with pseudocode in
   place of real code.
5. Write `docs/pseudocode/<slug>.md`.
6. Self-review: spec coverage, placeholder scan, interface-name consistency.
7. **Stop.** Present to the user for approval. Terminal state is the approval gate.
   Do not auto-invoke `writing-plans`.

## Document Contract

```
# <Feature> Pseudocode Plan
**Source:** <spec path or "in-session requirements">
**Goal:** / **Architecture:** / **Tech Stack:**
## Global Constraints
## File Structure          (exact paths + one-line responsibility)
## Decided Code            (optional; verbatim user-supplied real code)
### Task N: <name>
  **Files:** Create / Modify / Test — exact paths
  **Interfaces:** Consumes / Produces — exact names and types
  **Behaviors to test:** pseudocode assertions
  **Logic:** pseudocode block
  **Open questions:** (or "none")
```

## Pseudocode Contract

Language-agnostic, indentation-structured. Uses real identifier names and real types
so translation is mechanical. Excludes imports, syntax boilerplate, and error-handling
ceremony — intent only. Verbatim real code appears only under `## Decided Code` or in a
block marked `<!-- decided: verbatim -->`.

## Tests

Each task lists behaviors as pseudocode assertions (`ASSERT parse(x) == y`), which
`writing-plans` converts into real failing tests. No TDD run/commit step sequence at
this stage — that belongs to the implementation plan.

## Explicitly Out of Scope for the Document

The execution-skill mandate header (`subagent-driven-development`, `deepwork`) belongs
to the final implementation plan produced by `writing-plans`, not to the pseudocode
intermediary.

## Skill Development Method

Per `writing-skills`, RED-GREEN-REFACTOR using `fixer` subagents against a real spec:
`C:\Users\Danni\Documents\Git\evo-ai\docs\superpowers\specs\2026-08-04-plugin-cli-pipeline-remediation-design.md`
in repo `C:\Users\Danni\Documents\Git\evo-ai\`.

The primary anticipated failure is **wrong output shape**, not discipline violation.
Per `writing-skills`' "Match the Form to the Failure", the skill is written as a
positive output contract/recipe rather than a prohibition list.

### RED baseline findings (no skill, real spec)

The baseline agent produced competent pseudocode but the wrong shape:

1. No Task-N decomposition — organized by source file/topic, not by independently
   testable deliverable.
2. No Interfaces blocks (Consumes/Produces with exact signatures).
3. Incomplete Files triples — some sections named no test file, the documentation
   section named no paths at all.
4. Behaviors expressed as a prose table, not pseudocode assertions.
5. No Global Constraints section with verbatim spec values.
6. Real shell/command code inlined without any marking.
7. No per-task Open Questions.
8. Over-reach: included a "Required Skills and Validation Gates" mandate section that
   belongs to the implementation plan.

The skill is written to close exactly these.

### GREEN / REFACTOR results

GREEN (fresh fixer, same spec, with the skill) produced the correct shape: six
deliverable-based tasks, all slots filled, input scoping held. Three wording defects
surfaced and were fixed in REFACTOR:

- "real types" contradicted "exclude type annotations beyond the names" — reworded to
  "identifiable, not compilable".
- `Create:`/`Modify:` had no permitted `none` value, and doc tasks had no valid `Test:`
  entry — both now explicit.
- Documentation tasks were contorted into fake `FUNCTION` wrappers — added the
  Non-Code Deliverables section with `DOCUMENT` structural outlines.

REFACTOR run confirmed all three closed. An independent `oracle` review then produced
no Critical findings and 2 Major + 5 Minor, all accepted and applied: description now
carries a distinguishing "pseudocode plan" trigger; the handoff message and a new
closing statement make task boundaries binding on `writing-plans`; Self-Review gained a
File-Structure↔Files cross-check; a `Delete:` slot, a pure-refactor assertion rule, and
a greenfield note were added; the prohibition-form "Every Slot Gets Content" section was
collapsed into the template, which already enforces the slots structurally.

A final regression run after trimming confirmed no shape regression and caught one
off-by-one ("six blocks" where the template has five).

**Known deviation:** the skill is ~1,100 words against `writing-skills`' <500 guidance.
The output contract template is load-bearing and accounts for roughly a third of it;
the remainder was trimmed once already. Accepted deliberately.
