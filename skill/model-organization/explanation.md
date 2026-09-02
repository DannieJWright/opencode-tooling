# Organizing Model Functionality

Read this when a plan, spec, or pseudocode introduces or changes domain models — entities or document/format types. It defines where model knowledge belongs so the proposal can be checked against it before implementation starts.

## Core principle: one owner per type

Everything the system knows about a domain type lives in exactly **one** module. "Knows" means: its shape/schema, its vocabulary (names, labels, aliases), its allowed statuses/values, how it is parsed/decoded, how it is formatted/encoded, its type-specific validation, and its persistence mapping.

The test: reading the model's file alone must answer "what does this type look like on the wire / in storage / to a user?" If answering that requires opening three feature files, the organization is wrong — fix the layout before writing code.

## What belongs in the model file

- The schema or shape definition (type structure, field constraints).
- Status/value enums and any per-type allowed-value lists.
- Display vocabulary: section/field names, singular labels, reference aliases, human-readable names.
- Parse/decode for this type — how its representation becomes a domain value.
- Format/encode for this type — how the domain value becomes its representation (excluding surrounding structure owned by parents).
- Type-specific validation rules (e.g., "a Resolved gap must have findings").
- Persistence mapping: to-row/from-row style conversion between the domain value and stored form, including which storage kind/columns it uses.

Exception: physical infrastructure may stay literal in engines — DDL statements, migrations, connection setup — but the *logical* mapping (which type maps to which kind/column) must be declared by the model and read from there.

## What does NOT belong in a model file

- Cross-type workflow orchestration (that is engine territory).
- Routing, transport, or transaction mechanics.
- Knowledge of other types beyond delegating calls ("parse this child" — not "here's how children work").
- A second copy of vocabulary that another module already declares.

## The four layers and their dependency direction

```
engines  →  aggregation (registry)  →  models  →  shared helpers
(routes, codecs, patch/merge logic,        (one-way: models never      (generic mechanisms;
 persistence drivers, serializers)         import the registry)        no model vocabulary)
```

1. **Models** declare. Each type's file is self-contained and depends only on shared helpers and its children.
2. **Shared helpers** are generic mechanism modules — one chokepoint per cross-cutting concern: the only module that touches a parser AST, all reference/pattern matchers derived from a single prefix constant, error messages built *from* model values rather than spelling them. Shared code contains no type vocabulary.
3. **Aggregation/registry** collects descriptors and provides lookups. Rules: models never import it (one-way imports prevent cycles); aggregates are computed on demand, not captured at module load, so a type registered later is visible to every consumer; there is exactly one place to look things up — no hand-maintained parallel lists of the same facts anywhere else.
4. **Engines** orchestrate. They read descriptors and delegate per-type behavior; they contain workflow (routing, merging, persistence transactions) but no type vocabulary and no per-type branching that data could drive instead.

## Parent-child delegation rule

A parent model never reimplements a child's parsing or formatting. It delegates to the child's module or to a **generic walker** — one implementation handling N types by reading each child's descriptor (e.g., "parse heading items" used for every section shape). If you find yourself writing `if type === X ... else if type === Y` inside a parent, that branch is a missing descriptor field.

## The add-type cost test

When a plan proposes adding a new type (or a new field to an existing one), walk this procedure and count the files touched:

1. Declare it in its model file — schema, vocabulary, statuses, parse/format, persistence mapping.
2. Register it in the ordered list that parents/engines iterate (document order or priority).
3. Add the parent's schema field for it.
4. Extend only *that* type's parse/format/persistence — nothing else changes.

Expected footprint: **1–3 files** for a plain type; more only if the type introduces a genuinely new shape that needs a new generic walker in shared helpers. If your plan requires touching several engine files to add one type, stop and redesign the layout first — that is the exact failure this skill exists to prevent, and it predicts every future edit will be N× as expensive.

## Smells (summary)

Full detection procedures live in `review-guide.md`. The smells at a glance:

- **Parallel correspondence tables** — a second hand-maintained list of types/labels/aliases beside the models.
- **Call-site vocabulary** — section names, labels, status values, or reference prefixes spelled as string literals outside their owning model file.
- **Per-type branching in engines** — if/switch chains over types where a descriptor field could drive the behavior.
- **Duplicated derived patterns** — several regexes/matchers hand-copied from one source instead of derived from it.
- **Inline error vocabulary** — user-facing messages that hardcode type names instead of building them from model values.
- **Repeated persistence kinds** — the same storage-kind or column strings appearing in more than one module.

## Documenting the model system

An organization only pays off if a newcomer can follow it without archaeology. Pair the code with a short document (the planner-mcp case uses `docs/MODELS.md`) covering: the layout tree, the current types and their owners, each layer's contract, step-by-step walkthroughs for "add a type" and "add a field", and the rules above. Update it in the same change that changes the model system; when code and doc disagree, treat it as a finding.
