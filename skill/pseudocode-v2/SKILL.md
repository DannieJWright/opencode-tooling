---
name: pseudocode-v2
description: Use when an agreed spec or requirements document exists and the next step is a detailed, test-annotated pseudocode implementation plan before writing real code; or when reviewing such a pseudocode document for spec fidelity and completeness. Triggers: "pseudocode this", "draft an implementation plan from the spec", "scaffold the design with expected tests per piece", "review the pseudocode doc against the spec".
---

# Pseudocode Planning (v2)

## Overview

Turns an agreed spec into a near-compilable, language-native pseudocode document that a fresh agent session can implement 1:1 — explicit model shapes, fully-typed signatures, per-piece expected tests with concrete anchors, locked decisions with provenance back to the spec, and traceability from every spec acceptance criterion to named tests. This skill keeps all specifics in resources next to it so only what the current task needs enters context.

**Announce at start:** "I'm using the pseudocode-v2 skill."

## Resources (in this directory)

| File | Contains |
|---|---|
| `explanation.md` | The full drafting contract: pre-drafting clarification pass, required document structure, fidelity rules, locked-decision conventions, test-expectation formats, and routing to per-language references. |
| `review-guide.md` | Checklists validating a pseudocode doc against its spec: requirement coverage, test traceability, cross-reference/stale-term consistency, design-principle compliance; finding format for the review report. |
| `examples.md` | Router to per-language references: identifies the implementation language and points at exactly one file under `examples/`. Never preload a language file without going through it. |
| `examples/<language>.md` | Per-language idiom translations of the drafting rules; `python.md` additionally carries annotated excerpts from a real, well-received pseudocode document (Python was that project's implementation language — every *practice* shown is language-agnostic). |

## Delegation rules

Match the current task to exactly one context below. Load only the listed resource(s); never preload, and do not load more than one resource per phase unless a single turn explicitly spans both phases.

1. **Generating a pseudocode document from a spec**:
   Read `explanation.md` first and follow it end-to-end — including its mandatory pre-drafting clarification pass (the skill pauses and asks the user before drafting whenever the spec is ambiguous or silent). When you need target-language idioms, consult `examples.md`, which routes to the single matching per-language file. After the draft is written, spawn a single subagent to perform an independent review using `review-guide.md` against your output doc with respect to the original spec doc and fix findings before presenting it for human review. Inform the subagent to invoke this skill for the purpose of reviewing the documentation — it enters through context 2 below in its own fresh session; do not duplicate its work or review your own draft, since authoring-side self-review pollutes context and lets the document lean on unstated assumptions instead of standing on its own.

2. **Reviewing an existing pseudocode document** — a fresh session: typically the independent subagent spawned in context 1, or upon explicit user request; never the authoring session itself:
   Load `explanation.md` first if it is not already in context: a fresh reviewer has no other source for the required structure and contract your checklists audit against — you cannot review what you have not read. Then read `review-guide.md` and run its checklists against the doc together with its spec; follow wherever it directs you to consult `examples.md`, which routes to the per-language reference matching the document's implementation language.

## Guardrails

- This file deliberately contains no format or content rules. If you are about to state one from memory, stop and read the resource that owns it.
- Per-language files under `examples/` are loaded only after going through the `examples.md` router — at most one language file per task, in either phase (drafting consults it for idiom translation; reviewing consults it for calibration). Never preload.
- The output document must be written in whatever language the implementation will use (named by the spec, or clarified with the user during the clarification pass) — this skill's rules are language-agnostic; per-language translations live under `examples/`, reached only through the `examples.md` router.
