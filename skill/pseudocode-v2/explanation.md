# Explanation — Drafting a Pseudocode Document from a Spec

This is the drafting contract. Follow it end-to-end whenever you generate a pseudocode document. The goal: a fresh agent session (or human) can implement the described system 1:1 without re-asking questions, and every line of behavior traces back to the spec or to an explicitly locked decision.

## 1. Purpose & Inputs

**Input:** an agreed spec / requirements document (with section numbers, field notes, edge-case tables, ideally an acceptance checklist). If no such document exists, stop — this skill consumes specs; it does not write them.

**Output:** one pseudocode document in the **implementation language**, saved next to its spec as `<spec-filename>.pseudocode.md` (e.g., `SPEC.md` → `SPEC.pseudocode.md`; a longer spec name keeps multi-spec directories unambiguous). If the directory already holds an established convention that conflicts, follow it and note the deviation.

## 2. Non-Negotiables

1. **Near-compilable skeleton.** Model shapes are written as real language constructs (dataclass / struct / interface) with every field typed; every function and method has a fully-typed signature including return type. Method *bodies* are pseudocode lines or explanatory comments — clear enough to transcribe without re-designing, not so complete they duplicate the eventual code.
2. **Language-native.** Write in whatever language the implementation will use (from the spec; otherwise ask). Rules below are stated abstractly; per-language translations live in the dedicated files under `examples/` (routed via `examples.md`, see §7). Never write "generic pseudocode" when a native construct exists.
3. **Explicit over implicit — everywhere.** Types on every signature (no bare parameters except `self`/equivalents); labeled arguments at call sites (keyword args / named fields — the language-idiom equivalent, see §7); no magic constants (all literals live in one config/constants piece or enums); errors are named types that map 1:1 to exit codes or error paths.
4. **One clock.** Exactly one place reads wall-clock time; every other function receives the current time as an explicit parameter. This is what makes the whole design testable without time-mocking libraries — say so in the document's principles section.
5. **Provenance on everything interpretive.** Anywhere the doc resolves a spec ambiguity or fills a silence, it must be flagged and cited (spec §N or "round-N answer" from the clarification pass). No silent choices.

## 3. Pre-Drafting Clarification Pass (MANDATORY — pause and ask)

Do not start drafting until this is done. The user has chosen **pause-and-ask**: ambiguities are resolved with them *before* the document exists, so the finished doc contains zero open questions.

1. Read the spec fully. Build a working list of:
   - **Ambiguities** — places where two reasonable behaviors both fit the text (e.g., "archive completed work" without saying when or to which file).
   - **Silences** — details the pseudocode must pin down but the spec never mentions (tie-break order, null handling, boundary semantics like end-of-day vs end-of-week, what happens on corrupt data).
   - **Missing acceptance section** — if the spec has no acceptance checklist, draft a short one from its requirements; it becomes required input for the traceability table (§4.9), so it must be confirmed with the user.
2. Present everything as **batched structured questions**: 3–6 per round, each option carrying a recommendation (first) plus a one-line tradeoff note. Prefer multiple-choice over open-ended; offer free-form escape via the question mechanism. One round is typical for small specs; two for large ones.
3. Tag every answer with provenance: "round-1 answer", "round-2 answer". These tags are what locked-decision notes cite later (§4.6).
4. Only when all blocking items are answered (or explicitly deferred by the user), draft. Record any deferrals as open issues in the orientation note, not silently.

## 4. Document Skeleton (all sections required)

Every pseudocode document contains these sections, in this order:

```
# <name> — Pseudocode Implementation Plan
Companion to <SPEC.md>. One-paragraph scope statement.

**For the implementing agent:** orientation note (§4.1)

## 0. Design Principles & Conventions          (§4.2)
## 1. File Layout + Prerequisites              (§4.3)
## 2..N   One section per piece                (§4.4, §4.5, §6)
         (each: shape/signatures → behavior → locked notes → expected tests)
## N+1. Test Suite Summary & Execution          (§4.8)
## N+2. Acceptance Mapping to Spec Checklist    (§4.9)
## N+3. Implementation Order                   (§4.10)
```

### 4.1 Orientation note (fresh-agent self-containment)
A short bolded block at the top: read the spec first, then this doc; **list every locked decision by name** so nothing gets re-litigated; state what to implement and in what order; name follow-up deliverables that are explicitly out of scope for this document (e.g., wrapper scripts, skill docs). A fresh session must need no other context.

### 4.2 Design principles & conventions
Numbered rules that *bind the implementation*, derived from the spec + clarification answers + user preferences captured in-session. Typical members: single wall-clock read; no magic constants; pure logic separated from I/O (name which pieces are pure); named error types → exit codes; a precision/unit convention for any quantity the domain measures (e.g., minute-resolution datetimes); typing style; labeled-argument convention. These are contract, not advice — the review guide audits pseudocode against them.

### 4.3 File layout + prerequisites
Where each piece lives inside the target file(s)/module tree (an indented map). Then **prerequisites verified by execution**: runtime version, required libraries actually importable/installed, test runner availability with its install command if missing. Never assume tooling exists — check it in-session and record what you found.

### 4.4 Per-piece sections
One section per class/module/struct (plus one for config/constants/enums/errors collectively or separately). Each contains:

- **Model shape** written as the native construct, every field typed, with inline comments stating *semantics* of optionals (`None == "eventually"`, `null in YAML stays null`), not just types.
- **Typed signatures** for every method/function — parameters AND return type; bodies as pseudocode lines or spec-citing comments.
- **Behavior notes** only where the body can't say it (invariants, ordering guarantees). Keep prose out of code blocks except as comments.

### 4.5 Expected tests per piece
Immediately after each piece's code block: `**Expected tests (`<test-file>`)**` followed by bullets in **given → expect** form ("input/anchor → outcome"). Requirements:
- Cover the happy path, every rejection/error path named for that piece, and corruption/malformed input where I/O is involved.
- Date/time logic gets a concrete **anchor table** (real dates chosen to hit boundaries — see §6).
- Sort/filter/ordering rules get tie-case fixtures spelled out exactly.
- Bullets are specific enough to transcribe into test cases 1:1; no "test edge cases" hand-waving.

### 4.6 Locked-decision / interpretation notes
Wherever a piece encodes a choice from the clarification pass or a resolved ambiguity, add an **"Interpretation notes (locked here for implementation)"** block after the code. Each bullet: the decision in one sentence, its **provenance tag** (`spec §7 step 4`, `round-3 answer`), and the *consequence* phrased concretely ("a mid-week sync therefore never sweeps..."). These are the load-bearing sentences for future maintenance — write them to be quoted.

### 4.7 Config/constants piece
All literals, formats, key names, enum values in one place, each with a comment citing why it exists (spec reference or round answer). A grep for raw date strings / magic keys elsewhere in the doc should return nothing.

### 4.8 Test suite summary & execution
A table: test file → piece under test → approximate case count; then the exact command to run the suite and the test conventions (throwaway dirs, injected time — never mocked wall clock).

### 4.9 Acceptance mapping
A table tying **each acceptance criterion in the spec** to the named tests covering it. If any criterion has no test yet, that is a finding to fix before presenting the doc. (If the spec lacked an acceptance section, this table uses the one confirmed during the clarification pass.)

### 4.10 Implementation order
Numbered build sequence respecting dependencies (config/enums → models → pure logic → I/O → CLI wiring), each step naming the test files that must go green before the next begins. The final step is a **smoke test against throwaway data** (e.g., a scratch `--root` dir) *before* ever touching real workspace files, and it names any follow-up deliverables as separate later steps.

## 5. Output conventions recap
- Filename: `<spec-filename>.pseudocode.md`, same directory as the spec.
- Language: the implementation language; state it in the orientation note if not obvious from the code blocks.
- Depth: near-compilable (§2.1) — a reader should never need to guess a type, an error path, or a boundary condition.

## 6. Date & Anchor Verification (drafting hygiene)

Any concrete date, weekday label, week range, month length, or command output written into anchors or examples **must be computed in-session first** (`python3 -c "import datetime; ..."` or the target language's equivalent) and pasted from verified values — never written from memory. Weekday labels on anchor dates are a classic failure mode: verify every one. The review guide spot-checks this, but it is cheaper to get right while drafting.

## 7. Language-Specific References

The rules in §2–§6 are stated language-neutrally; per-language translations live in dedicated reference files under `examples/`. When you need target-language idioms or annotated examples, consult the router at `examples.md` — it identifies the implementation language and points at exactly one file to load. Do not preload a language file before routing, and do not modify anything under `examples/` as part of drafting or reviewing: maintaining those references is outside this skill's scope.
