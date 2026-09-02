# Examples: Scattered Model Knowledge → Per-Model Organization

Read only via `review-guide.md` — when grounding a remediation or structuring a refactor's end state. Each case maps its smells to the review-guide checklist IDs so you can trace every move back to an expectation.

## Case 1 (canonical, real): planner-mcp plan-format models

A Markdown document format with nested types: `Plan` → `Component` → six item sections (Requirements, Constraints, Decisions, Knowledge Gaps, Notes, Open Questions), plus `ActionItem` with three subsections. Before the refactor, knowledge about these ten section types was spread across three feature files; after, each type's knowledge lives in exactly one model module under `plans/models/`.

### What the bad organization looked like

The codec monolith (`markdown.ts`, 436 lines) carried a hardcoded section list **and** a parallel correspondence table of the same facts:

```ts
const sections = [
  "Requirements",
  "Constraints",
  "Decisions",
  "Knowledge Gaps",
  "Notes",
  "Open Questions",
] as const;

const referenceTypes: Array<{ key: ComponentItemKey; label: string; aliases: string[] }> = [
  { key: "requirements",   label: "Requirement",     aliases: ["requirements?", "reqs?", "r"] },
  { key: "constraints",    label: "Constraint",      aliases: ["constraints?", "cons?", "c"] },
  { key: "decisions",      label: "Decision",        aliases: ["decisions?", "decs?", "d"] },
  { key: "knowledgeGaps",  label: "Knowledge Gap",   aliases: ["knowledge\\s+gaps?", ...] },
  // ... four more, hand-maintained in lockstep with `sections` and the Zod schemas
];
```

The parser dispatched per type by spelling flags inline — status-bearing types passed extra arguments, one type got a bespoke function, another an ad-hoc regex at the call site:

```ts
requirements: parseItems(markdown, nodes, requirementsStart, requirementsEnd, false) as TextItem[],
constraints: parseItems(markdown, nodes, constraintsStart, constraintsEnd, false) as TextItem[],
decisions: parseItems(markdown, nodes, decisionsStart, decisionsEnd, true, 4, decisionStatuses) as Component["decisions"],
knowledgeGaps: parseKnowledgeGaps(markdown, nodes, gapsStart, gapsEnd),
notes: parseItems(markdown, nodes, notesStart, notesEnd, false) as TextItem[],
questions: questions.map((question) => ({ ...question, details: question.details.replace(/^>\s?/, "") })),
```

The repository kept its **own** correspondence table mapping persistence kinds back to schema field names:

```ts
const itemFields = {
  requirement: "requirements",
  constraint: "constraints",
  decision: "decisions",
  knowledge_gap: "knowledgeGaps",
  note: "notes",
  question: "questions",
} as const;
```

and per-kind persistence branches (`["requirement", component.requirements], ["constraint", ...]`). Meanwhile `domain.ts` held only Zod schemas — the types were defined in one file while everything that *operated on them* lived elsewhere, so adding a section meant editing at least three files across four concerns.

Smells → checklist: parallel tables (**A5**, **B1**), per-type call-site spelling and flags (**B2**), kind strings repeated across modules (**B4**/**B5**). The decay was real: the old heading matcher had drifted into accepting `COMPONENT` where the schema rejected it — exactly what hand-maintained parallel tables do over time.

### What the good organization looks like

Each type owns one module holding its full descriptor and behavior contract (`models/decision.ts`, 60 lines):

```ts
export const decisionStatuses = ["Open", "Decided", "Closed"] as const;
export const decisionSchema = textItemSchema.extend({ status: z.enum(decisionStatuses) });

export const decisionModel: ItemModel = { schema, fromParsed, format, toRow, fromRow }; // behavior for this type only

export const decisionsSection = {
  shape: "headingItems", key: "decisions", heading: "Decisions", singularLabel: "Decision",
  aliases: ["decisions?", "decs?", "d"], referenceRole: "renumber", statuses: decisionStatuses,
  dbKind: "decision", required: true, /* ... */ patchFields: ["Status", "Delete", "Handle"],
  model: decisionModel,
} satisfies HeadingItemsSection<"decisions">;
```

Engines became orchestrators that read the aggregation layer — no vocabulary spelled anywhere else in `src/`:

```ts
// models/normalize.ts — renumbering and prose-rewrite driven entirely by descriptors
for (const section of referenceSections()) {
  const items = (component as Record<string, Indexed[]>)[section.key]!;
  // ...per-section alias regexes are built from section.aliases — no hand-written per-type patterns
}

// repository.ts — persistence mapping looked up instead of re-declared
import { dbKindIndex } from "./models/registry.js";
const sectionsByKind = dbKindIndex();
```

Ownership after: each of the ten section headings, labels, prefixes, and kinds is spelled in exactly one file — `component.ts` (Requirements, Constraints, Notes, Open Questions), `decision.ts` (Decisions), `knowledgeGap.ts` (Knowledge Gaps + Findings subsection), `actionItem.ts` (Acceptance Criteria, Trigger Sources, Assignees).

### Cost of adding a type: before vs after

| | Before | After |
|---|---|---|
| Add a plain item section | Edit schemas in `domain.ts`; extend `sections[]`, the `referenceTypes` table, parse dispatch, and rendering in `markdown.ts`; add kind mapping + branches in `repository.ts` (≥3 files, 4 concerns) | One factory call in the model file, one entry in the ordered section list, one parent schema field (1–2 files); a runtime-registered section is picked up by parsing, formatting, renumbering, patch merging, persistence, and retrieval with zero other edits — proven by an extensibility test that performs exactly this procedure |
| Failure mode if missed | Parallel tables drift (the `COMPONENT` incident) | A second table of the same facts *is* the finding (A5/B1); there is one place to look |

## Case 2 (generic, synthetic): an Order entity spread across four modules

Same shape of debt in a plain service codebase — no document format involved.

### Before: `Order` knowledge in four files

```ts
// lib/order-statuses.ts          — the enum lives here...
export const ORDER_STATUSES = ["pending", "paid", "refunding", "closed"] as const;

// api/serializers.ts             ...but labels are re-decided per status at call sites (B2, B4)
function orderLabel(order: Order): string {
  switch (order.status) {
    case "pending":   return "Pending payment";
    case "paid":      return "Paid — awaiting shipment";
    case "refunding": return "Refund in progress";
    default:          return order.status;
  }
}

// services/billing.ts            ...and a second, narrower list of the same facts (A5, B1)
const PAYABLE = ["pending", "paid"];   // drifts from ORDER_STATUSES over time

// db/order-repo.ts               ...plus persistence mapping spelled again (B5)
export function saveOrder(o: Order) { insert("orders", { status_col: o.status, ... }); }
```

Adding a fifth status meant editing `order-statuses.ts`, the serializer switch, billing's ad-hoc list, and the repo — with nothing forcing the others to notice.

### After: one owner, engines delegate

```ts
// models/order.ts — everything about Order in one module
export const orderStatuses = ["pending", "paid", "refunding", "closed"] as const;
export type OrderStatus = (typeof orderStatuses)[number];

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pending payment", paid: "Paid — awaiting shipment",
  refunding: "Refund in progress", closed: "Closed",
};

export const orderModel = {
  schema: z.object({ id: z.string(), status: z.enum(orderStatuses), totalCents: z.number() }),
  label: (o: Order) => statusLabels[o.status],
  isPayable: (s: OrderStatus) => s === "pending" || s === "paid",   // rule lives with the type
  toRow: (o: Order) => ({ id: o.id, status_col: o.status, total_cents: o.totalCents }),
  fromRow: (r: Row): Order => ({ id: r.id, status: r.status_col, totalCents: r.total_cents }),
};
```

```ts
// api/serializers.ts — orchestrates; no status knowledge remains here
export function serializeOrder(o: Order) { return { ...o, label: orderModel.label(o) }; }

// services/billing.ts
if (orderModel.isPayable(order.status)) charge(order);
```

Smell → resolution map: `B2/B4` serializer switch → statusLabels owned by the model; `A5/B1` billing's parallel list → an intent-named predicate on the model (`isPayable`, which also makes the *rule* reviewable in one place instead of a bare constant); `B5` repo mapping → `toRow/fromRow`. Resulting property: adding a status is a one-file edit (enum + label entry), and any module that needs status semantics calls the model rather than re-deriving it.

## Using these cases

When writing a remediation, copy the *structure*, not the code: identify the owner module that should exist, list each scattered fact with its current location and checklist ID, state where it moves, then name what gets deleted (the parallel tables are the payoff — deleting them is part of the fix). If the target project's types have no natural "descriptor" shape yet, Case 2 shows the minimum viable owner: schema + enums + vocabulary map + parse/format + row mapping in one file.
