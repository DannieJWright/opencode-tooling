# Reviewing Model Organization

Read this when reviewing a diff that touches model definitions or the engines consuming them, or when running a dedicated refactor of scattered-model tech debt. It validates that `explanation.md`'s expectations are met and catches unnecessary hardcoding.

## Step 0 — Build the ownership map

Before judging anything:

1. Identify the domain types in scope (entities, document sections/item types).
2. For each type, list every file whose *functional* code knows about it — schema, statuses, labels/aliases, parse/format logic, persistence mapping. Grep for its vocabulary and field names; read matches to separate functional use from comments/docs/fixtures.

Output: a table of `type → files that know about it`. Any file outside the type's owner module is a candidate finding (subject to the exception list below). If you cannot find a single clear owner for a type, that is itself finding A1.

## Checklist A — Organization expectations met

- **A1 One owner.** Each type has exactly one authoritative module holding its full definition (schema + vocabulary + statuses + parse/format + persistence mapping).
- **A2 Co-location.** Status/value enums and display vocabulary live with the model, not in a shared constants file that other types also import or duplicate.
- **A3 Parse/format ownership.** Decoding and encoding for the type are implemented in the model module, or delegated through a generic walker parameterized by the model's descriptor. Engines contain no per-type parsing logic.
- **A4 Persistence mapping read from the model.** Engines look up kind/column mappings via the aggregation layer instead of hardcoding them per type (exception: literal DDL/migrations).
- **A5 No parallel lists.** There is exactly one place aggregating types/lookups, models never import it, and no second hand-maintained table of the same facts exists anywhere.
- **A6 Parent delegates to child.** Parents contain no reimplementation of a child's parse/format; delegation goes through child modules or generic walkers. No per-type if/switch chains where a descriptor field could drive behavior.
- **A7 Add-type cost test.** Mentally walk "add one plain type" on the current layout: declare → register in ordered list → parent schema field → extend that model's parse/format/persistence. Pass = 1–3 files touched; anything more is a finding naming each avoidable file.

## Checklist B — No unnecessary hardcoding

Build the needle list **from the owner modules themselves** (section/field names, singular labels, aliases, status values, reference prefixes, persistence kinds), then:

- **B1 Call-site vocabulary.** Grep every needle outside its owning module. Any functional occurrence is a finding; report each with `file:line`.
- **B2 Per-type branching in engines.** if/switch chains over types or statuses inside parsers, serializers, repositories, or routes that a descriptor field could drive instead.
- **B3 Duplicated derived patterns.** Multiple regexes/matchers/patterns hand-copied from one source (e.g., several `PREFIX-\d+` matchers built independently) where one shared derivation point should exist.
- **B4 Inline error vocabulary.** User-facing or parse-error messages that spell type names, labels, or headings instead of building them from model values.
- **B5 Repeated persistence kinds/columns.** The same storage-kind, column name, or table string appearing in more than one functional module.

**Exception list (not findings):** literal DDL and migration statements; test fixtures and golden files; documentation and comments; strings that are genuinely engine-owned (route paths, HTTP status codes). When a match is ambiguous, report it as "verify" rather than pass or fail silently.

## Finding format

Group by file. Each finding:

```
file:line — <A#/B#> — what is spelled/duplicated here and where its owner lives — remediation direction
```

If two or more findings share a pattern (e.g., several B1 hits from the same parallel table), summarize them as one structural finding naming the table to delete. When you need the concrete target shape for a remediation, read `examples.md` in this skill directory now and ground the recommendation in its before/after mappings — do not describe the fix from memory.

## Refactor mode (dedicated tech-debt sessions)

Use when the task is explicitly "reorganize scattered model knowledge," not an incidental review. Sequence distilled from the planner-mcp `model-refactor` branch:

1. **Pin current behavior first** so every move stays verifiable — characterization coverage at the affected boundaries before anything moves.
2. **Extract shared helpers.** The chokepoint modules (single AST access point, one derivation point for all matchers/patterns, error construction from model values) come first; engines switch to them immediately.
3. **Introduce model modules one type at a time** — descriptor/contract plus that type's parse/format/persistence moved in from the engine, with the owner file now spelling its vocabulary exactly once.
4. **Introduce aggregation and flip engines to read it.** Delete each parallel table as soon as the registry replaces it; never leave two sources of the same fact coexisting without an explicit migration note.
5. **Document the system** — layout tree, current-types table, contracts, add-type/add-field walkthroughs — in the same change set, not after.

Work type-by-type and keep the build green between types so a regression isolates to one move.

## Acceptance criteria

All of Checklist A passes; B1–B5 have zero findings outside the exception list; the add-type cost test reports ≤ 3 files for a plain type; and (in refactor mode) no parallel table survives that the aggregation layer replaces. Report any acceptance gap as an open item, not a pass with notes.
