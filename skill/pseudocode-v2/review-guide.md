# Review Guide — Validating a Pseudocode Document Against Its Spec

Use this when reviewing an existing pseudocode document — **always from a fresh session**: typically as an independent subagent reviewer spawned by the authoring agent, or upon explicit user request. Never run this review in the same context that wrote the document: author-side self-review pollutes context and lets the doc lean on unstated assumptions instead of standing on its own — one of the core expectations of this skill's output.

Before checking anything, load `explanation.md` if it is not already in your context — a fresh reviewer has no other source for the required structure and contract these checklists audit against; you cannot review what you have not read. Then run all four checks below against **the pseudocode doc together with its spec**. When calibrating what "good" looks like for format or depth, consult `examples.md`, which routes to the per-language reference matching the document's implementation language (e.g., `examples/python.md` carries annotated excerpts from a real, well-received document).

Collect findings as you go and **do not modify the document under review** — your output is the finding report; applying fixes belongs to the authoring session or an explicitly requested follow-up.

## Check 1 — Spec Fidelity (requirement coverage)

Goal: no requirement, constraint, or edge case from the spec is left homeless in the pseudocode.

Procedure:
1. Walk the spec **section by section** (numbered sections, field notes, rules lists, edge-case tables). For each item write a one-line claim ("spec §4: tiers use Mon–Sun weeks").
2. Find its home in the pseudocode doc — a piece section, a locked-decision note, or an expected-test bullet. Cite where you found it.
3. Classify misses:
   - **Missing behavior** (a spec'd action has no corresponding function/command anywhere) → severity HIGH.
   - **Unpinned constraint** (behavior exists but the spec's boundary/edge detail — ordering ties, null handling, rejection cases — is absent from both code and tests) → severity MEDIUM.
   - **Contradiction** (doc says X, spec says Y) → severity HIGH; quote both lines.
4. Also verify every CLI command / public entry point named in the spec appears with matching argument names, defaults, and exit/error behavior.

## Check 2 — Test Coverage Traceability

Goal: the doc's tests provably cover what the spec demands, at the stated depth.

Procedure:
1. Reuse the claim list from Check 1. For each constraint/edge case confirm **at least one expected-test bullet** names it (given → expect form). A behavior with no test bullet is a MEDIUM finding even if the code looks right.
2. Date/time logic must have an **anchor table of concrete, real dates** hitting boundaries (week edges, month/year rollover, leap years where relevant); anchors that are "some Monday" rather than actual verified dates are MEDIUM findings.
3. The acceptance-mapping table must be **complete**: every spec acceptance criterion row maps to named test file(s)/case descriptions; orphan criteria or rows pointing at nonexistent tests → HIGH.
4. The summary table (test file → piece) should roughly match the per-piece bullet counts; large discrepancies suggest a section was edited without updating the tables → MEDIUM.

## Check 3 — Cross-Reference & Stale-Term Consistency

Goal: nothing in the doc points at something that no longer exists or says something different elsewhere.

Procedure:
1. **Spec references:** every "spec §N" / section citation must resolve to a spec section that actually supports the claim as written. A cite that's off-by-one or describes behavior the spec doesn't state → MEDIUM (fix the cite or flag the doc).
2. **Stale-term sweep:** build a stale-term list from every locked-decision note — each decision implies an older phrasing that should no longer appear anywhere in *either* document (e.g., after switching monthly→weekly archival, grep both docs for "first day of current month", old flag names, renamed parameters). Any hit outside the decision note itself describing the change → MEDIUM.
3. **Internal consistency:** field/key ordering claims match across all schema examples; enum values in code blocks match their named lists; flags documented in one section behave as described where used in another (CLI handlers vs tables).
4. **Code-block discipline:** scan every pseudocode block for violations of the doc's own stated conventions (untyped parameters, unlabeled call args, raw literals outside the config piece) — these are also Check 4 findings; record them once under whichever check fits best.

## Check 4 — Design-Principle & Structure Compliance

Goal: the doc follows its *own* principles and this skill's required structure (explanation.md §2–§5).

Procedure:
1. Take the doc's "Design Principles & Conventions" list as an audit checklist; verify each principle is actually obeyed inside the pseudocode blocks, not merely declared. A declared-but-violated principle → MEDIUM per occurrence (quote the violation line).
2. Verify **all required sections are present** in order: orientation note naming every locked decision · design principles · file layout + prerequisites (with verified tooling) · one section per piece with shape/signatures/tests · test summary + run command · acceptance mapping · implementation order ending in throwaway-data smoke testing. A missing mandatory section → HIGH.
3. Locked-decision notes must each carry a **provenance tag** (spec § / round-N answer) and a consequence sentence; untagged or consequence-free decisions → MEDIUM.
4. Orientation note completeness: can a fresh session act on it alone? Missing locked-decisions list or missing out-of-scope follow-ups → MEDIUM.

## Finding Format & Verdict

Report findings grouped by check, each as:

```
- [HIGH|MEDIUM] <doc section> — <what's wrong / what's missing> (spec ref) · suggested fix in ≤1 line
```

End with a verdict line: **READY FOR HUMAN REVIEW** (no findings) or **N blocking findings — all HIGH must resolve before presentation**. If you were spawned by an authoring agent, return this report as-is; that session applies the fixes (at minimum every HIGH), and any HIGH resolution triggers one more review pass over the corrected document. Never silently carry unresolved findings into human review.
