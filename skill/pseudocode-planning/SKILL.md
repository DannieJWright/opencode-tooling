---
name: pseudocode-planning
description: Use when a spec or agreed requirements exist and the next step is a pseudocode plan, before writing a full implementation plan containing real code.
---

# Pseudocode Planning

## Overview

Produce a pseudocode plan at `docs/pseudocode/<slug>.md` that locks in file structure,
task boundaries, interfaces, and behavior — without authoring real implementation code.
This sits between `brainstorming` (produces the spec) and `writing-plans` (produces the
implementation plan), making that translation largely mechanical.

**Announce at start:** "I'm using the pseudocode-planning skill to create the pseudocode plan."

## Input Scoping

The source spec — or, absent a spec, the requirements agreed in this session — is the
single authoritative requirements document. No spec file is required; this skill also
works for smaller changes. If requirements are too vague to name concrete files, say so
and recommend `brainstorming` first.

Read source, test, and config files the spec references, plus enough of the codebase to
name real paths and existing patterns. For a greenfield spec there is nothing to read.

Read another spec or plan document **only if the source spec cites it by path**. Prior
documents in `docs/superpowers/plans/`, `docs/superpowers/specs/`, and `docs/pseudocode/` describe superseded
designs; reading them — or surfacing them through a broad content search — contaminates
the output. Scope searches to source, test, and config paths.

## What the Output Is

The document is a contract with these parts, in this order. Produce every part.

````markdown
# <Feature> Pseudocode Plan

**Source:** `docs/superpowers/specs/<file>.md` (or "in-session requirements")

**Goal:** [one sentence]

**Architecture:** [2-3 sentences]

**Tech Stack:** [key technologies]

## Global Constraints

[Project-wide requirements from the spec — version floors, dependency limits, naming
rules, platform requirements — one line each, values copied verbatim from the spec.
Every task implicitly includes these.]

## File Structure

- `exact/path/to/file.ts` — one-line responsibility

## Decided Code

[Optional. Real code the user supplied or already decided, verbatim, with a one-line
note on where it belongs. Omit this section entirely if there is none.]

---

### Task 1: <name>

**Files:**
- Create: `exact/path/to/file.ts`               (or `none`)
- Modify: `exact/path/to/existing.ts:123-145`   (or `none`)
- Delete: `exact/path/to/dead.ts`               (or `none`)
- Test: `tests/exact/path/file.test.ts` — or, for a non-code deliverable, the exact
  command or file comparison that verifies it

**Interfaces:**
- Consumes: [exact names and types this task uses from earlier tasks]
- Produces: [exact function names, parameter and return types later tasks rely on]

**Behaviors to test:**

```text
GIVEN <setup>
WHEN  <action>
THEN  ASSERT <exact expected value>
```

**Logic:**

```text
FUNCTION exactName(param: Type) -> ReturnType:
    ...
```

**Open questions:** none
````

Every block is required. When one has no content, write `none` — never omit it, and
never write "TBD", "decide later", or "similar to Task N". An unresolved design question
goes in **Open questions**, never as a comment inside Logic.

## Task Boundaries

A task is the smallest unit that carries its own test cycle and could be independently
rejected by a reviewer. Fold setup, configuration, and documentation into the task whose
deliverable needs them.

Organize by deliverable, not by source file or topic. One file touched by three unrelated
deliverables belongs in three tasks; three files changed for one deliverable belong in one.

For a task that changes no observable behavior — a pure refactor or a deletion — assert
the behavior that must survive it.

## The Pseudocode Contract

Language-agnostic and indentation-structured, using **real identifier names and real
types** so translation is mechanical.

Include control flow, data shapes, algorithm steps, exact names, parameter and return
types, and exact expected values in assertions. Exclude imports, syntax boilerplate,
decorators, framework ceremony, and error-handling ritual carrying no design decision.
Write types as plain names (`config: Config -> Promise<string[]>`), not the target
language's annotation syntax — identifiable, not compilable.

```text
FUNCTION discoverDefaultRoots(defaultsDir: AbsolutePath) -> AbsolutePath[]:
    IF defaultsDir does not exist:
        RETURN []
    entries = direct children of defaultsDir with directory metadata
    RETURN absolute paths of entries that are directories
```

Real, runnable code appears in exactly two places: `## Decided Code`, and blocks preceded
by `<!-- decided: verbatim -->`. Everything else is pseudocode.

Naming a command, path, or config key inline is not writing code — write `bun run
typecheck` or `emitDirs.agent` freely in prose, assertions, and pseudocode. The rule
governs code blocks that could be copied and executed as-is.

## Non-Code Deliverables

A task delivering documentation, configuration, frontmatter, or a fixture still fills
every block. Do not invent a `FUNCTION` wrapper — that is a fake interface. Instead:

- **Interfaces** — the facts the file must state, and what consumes them.
- **Behaviors to test** — GIVEN the file, WHEN compared against its source of truth,
  THEN ASSERT the specific claims it must contain.
- **Logic** — the required content as a structural outline:

```text
DOCUMENT README.md
  SECTION "Module naming":
    STATE later roots override earlier roots for the same module path
    REMOVE first-root-wins wording
```

## Scope of the Document

The document ends at the task list. It does not contain execution-skill mandates
(`subagent-driven-development`, `deepwork`), validation-gate sections, or step-by-step
TDD run/commit sequences — those belong to the implementation plan `writing-plans`
produces from the behaviors-to-test blocks.

## Self-Review

Check the finished document against the spec with fresh eyes:

1. **Coverage:** every spec requirement maps to a task. Add tasks for gaps.
2. **Slot scan:** every task has all five blocks filled — Files, Interfaces, Behaviors
   to test, Logic, Open questions.
3. **File map:** `## File Structure` and the union of all `Files:` entries match.
4. **Interface consistency:** a later task's `Consumes` matches an earlier task's
   `Produces` exactly.
5. **Shape scan:** every code block is pseudocode unless marked decided.

Fix inline and move on.

## Terminal State

Save the document, then **stop**:

> "Pseudocode plan saved to `docs/pseudocode/<slug>.md`. Please review it. Once you
> approve, I'll run the writing-plans skill against it and the spec, preserving this
> document's task numbering, `Files:`, and `Interfaces:` blocks as fixed inputs."

The decomposition here is the decision. `writing-plans` translates it into real code; it
does not redraw task boundaries or rename interfaces.

Wait for approval. Do not invoke `writing-plans` yourself.

## Common Mistakes

| Mistake | Fix |
|---|---|
| Sections named after source files (`## CLI Import`) | Sections are `### Task N: <deliverables>` |
| Test cases in a prose matrix table | GIVEN/WHEN/THEN assertions per task |
| A runnable code block that isn't marked decided | Pseudocode |
| Constraints scattered through prose | Collected verbatim under `## Global Constraints` |
| Reading neighboring plans "for context" | Only the source spec and the code it cites |
| Adding validation-gate / required-skill sections | Belongs to the implementation plan |
| `FUNCTION updateReadme()` for a docs task | Structural outline — see Non-Code Deliverables |
