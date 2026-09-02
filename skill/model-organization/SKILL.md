---
name: model-organization
description: Use when creating plans/specs/pseudocode that introduce or change domain models; reviewing changes that touch model definitions or the engines consuming them (parsers, formatters/serializers, repositories, routes); or refactoring scattered model knowledge into per-model modules.
---

# Model Organization

## Overview

Each domain model owns exactly one authoritative module containing everything the system knows about that type — its shape, vocabulary, statuses, parsing, formatting, and persistence mapping. Feature engines orchestrate workflows and read model definitions; they never re-declare them. This skill keeps all specifics in resources next to it so only what the current task needs enters context.

**Announce at start:** "I'm using the model-organization skill."

## Resources (in this directory)

| File | Contains |
|---|---|
| `explanation.md` | The ownership expectations: what belongs in a model file, what engines may contain, shared-helper and aggregation patterns, parent-child delegation, the add-type cost test. |
| `review-guide.md` | Checklists validating that the expectations are met and detecting unnecessary hardcoding; finding format; refactor sequence for dedicated tech-debt sessions. |
| `examples.md` | Before/after case studies: the planner-mcp monolith refactor (real) and a generic scattered-entity consolidation. **Never load this directly** — only via `review-guide.md`. |

## Delegation rules

Match the current task to exactly one context below. Load only the listed resource(s); never preload, and do not load more than one resource per phase unless a single turn explicitly spans planning and reviewing.

1. **Creating a plan / spec / pseudocode** that introduces or changes domain models or document/format types:
   Read `explanation.md` before proposing file layout, module boundaries, or where new type behavior will live. Do not load the review guide or examples in this phase.

2. **Code reviewing work**, when the diff touches model definitions (schemas, descriptors, enums/statuses) or engines that consume them (parsers, formatters/serializers, repositories, routes):
   Read `review-guide.md` and run its checklists against the changed code, following wherever it directs you to consult further resources. If the diff touches none of these files, load nothing.

3. **Dedicated refactor** of scattered-model tech debt (model knowledge spread across multiple feature files):
   Read `review-guide.md` in its refactor mode and follow that sequence, including wherever it directs you to consult further resources.

## Guardrails

- This file deliberately contains no organization rules. If you are about to state an ownership rule from memory, stop and read the resource that owns it.
- `examples.md` is reachable only through `review-guide.md`; a planning-phase task never reads it.
- "Just in case" loading defeats this skill's purpose — resources stay out of context until their trigger fires.
