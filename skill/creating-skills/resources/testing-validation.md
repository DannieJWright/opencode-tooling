# Testing & Validation

Prove the generated skill works before declaring it done. Build tests from the use cases and success criteria captured in `requirements-interview.md`. Choose rigor to fit visibility: a small internal skill needs lighter testing than one used widely — but always run trigger tests and the final checklist below.

## 1. Triggering tests (does it load at the right times?)

Generate two lists directly from the use cases' trigger phrases:

**Should trigger:**
- The obvious task phrasing
- A paraphrased rewording of each real use case
- Phrasings that mention relevant file types / domain terms

**Should NOT trigger:**
- Unrelated topics
- Adjacent-but-different tasks (e.g. a sibling skill's job) — add these as **negative triggers** in the description, e.g. "Do NOT use for simple data exploration (use `data-viz` instead)."

Debugging under-triggering: ask the model "When would you use the `<skill>` skill?" It will quote the description back. If a should-trigger phrasing is missing from that description, it won't load — add trigger keywords/technical terms to the description.

## 2. Functional tests (does it produce correct output?)

Write Given/When/Then cases for each use case; verify valid outputs, successful tool/MCP calls, working error handling, and edge coverage.

```
Test: <name>
Given:  <inputs / starting state>
When:   the skill executes its workflow
Then:
  - <expected concrete outcome>
  - <no API/tool errors>
```

## 3. Performance comparison (does it beat baseline?)

Compare with vs without the skill on the same request and record against the success criteria from `requirements-interview.md`: tool-call count, tokens consumed, failed calls, and how many user corrections were needed. A skill that needs more back-and-forth than doing it by hand has not earned its keep.

## 4. Iterate on feedback

Skills are living documents. Watch for:
- **Under-triggering** — doesn't load when it should; users enable it manually or ask "when do I use this?" → add nuance and keywords (especially technical terms) to the description.
- **Over-triggering** — loads for irrelevant queries; users disable it; confused about purpose → be more specific, clarify scope, add negative triggers.

Re-run the trigger tests after each change. Iterate on a single hard case until it succeeds before expanding coverage.

## 5. Verification checklist (must all pass)

Run this before deploying. A complex skill may warrant extra self-review beyond these minimums.

**Frontmatter & structure**
- [ ] Folder is kebab-case and equals the `name` field exactly; no spaces/capitals/underscores
- [ ] No reserved words ("claude"/"anthropic") in the name
- [ ] Main file named exactly `SKILL.md` (case-sensitive)
- [ ] YAML frontmatter has `---` delimiters and parses cleanly
- [ ] Description states WHAT it does AND WHEN to use it, with concrete trigger phrases
- [ ] Description < 1024 chars; no XML angle brackets (`<` `>`) anywhere in the frontmatter
- [ ] No `README.md` inside the skill folder

**Content & parameterization**
- [ ] All hardcoded specifics are parameterized into a Configuration table (if applicable)
- [ ] Variable names use (`CONSTANT_CASE`); no remaining project-specific references inline
- [ ] File input/output formats documented where the skill consumes/produces files
- [ ] Subagent templates include variable injection and an explicit return format (if applicable)

**Design & testability**
- [ ] A design pattern was chosen and reflected in the structure (`authoring-guide.md` §4)
- [ ] Instructions are specific/actionable; critical constraints placed up top, not buried
- [ ] Error handling / Common Issues section present (Error/Cause/Solution)
- [ ] Progressive disclosure applied when SKILL.md would exceed ~5000 words — detail moved to referenced resources with a Resources table + guardrails

**Triggering & behavior**
- [ ] Should-trigger list all load the skill; should-NOT-trigger list do not
- [ ] Negative triggers present where adjacent skills/topics risk over-triggering
- [ ] At least one functional Given/When/Then case passes end-to-end with no tool errors
