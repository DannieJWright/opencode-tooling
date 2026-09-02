# Examples Router (pseudocode-v2)

This file is a **router**, not a reference. It identifies the implementation language and points at exactly one per-language file under `examples/`. Do not preload any language file before routing, and never load more than one per task.

## Routing procedure

1. **Identify the implementation language** — from the spec, or (when reviewing) from the pseudocode document itself; if neither names one, use what was settled in the pre-drafting clarification pass (`explanation.md` §3). Ask the user only if it is still unknown.
2. **Load only the matching file:**

| Implementation language | File | Contains |
|---|---|---|
| Python | `examples/python.md` | Idiom translations **plus** annotated excerpts from a real, well-received pseudocode document (Python was that project's implementation language; every *practice* shown is language-agnostic). |
| Go | `examples/go.md` | Idiom translations. |
| TypeScript | `examples/typescript.md` | Idiom translations. |
| Rust | `examples/rust.md` | Idiom translations. |

3. **Language not covered?** Apply the abstract rules in `explanation.md` §2–§6 directly using that language's native idioms — no reference file is required for a task to proceed, and creating one is outside this skill's scope; do not modify anything under `examples/`.

## When each phase uses this router

- **Drafting** (`explanation.md`): consult when translating a rule into target-language constructs — model shapes, typed signatures, labeled calls, error→exit-code mapping, clock injection, constants placement.
- **Reviewing** (`review-guide.md`): consult to calibrate what "good" looks like for format and depth in the document's language; `python.md`'s annotated excerpts are the reference standard either way, since the patterns are language-agnostic.
