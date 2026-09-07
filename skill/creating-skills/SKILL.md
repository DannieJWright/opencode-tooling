---
name: creating-skills
description: >
  Turns a prompt, workflow, or idea into a reusable AI agent skill — SKILL.md with
  proper YAML frontmatter, parameterized configuration, subagent templates, and
  progressive-disclosure resources. Use when the user says "create a skill",
  "make a skill", "turn this prompt into a skill", "convert to skill",
  "generalize this prompt", or "parameterize a workflow".
---

# Creating Skills

Generate reusable AI agent skills from specific prompts, workflows, or ideas. Generalizes concrete instructions into configurable templates and structures the output so it follows proven skill-design best practices: use-case-driven, trigger-precise frontmatter, actionable instructions, progressive disclosure, and testable behavior.

**Announce at start:** "I'm using the creating-skills skill."

## Resources (under `resources/`)

| File | Contains |
|---|---|
| `resources/requirements-interview.md` | The interview protocol: use-case-first definition, success criteria, and the clarifying questions that establish shared understanding before authoring. Load first in every run. |
| `resources/authoring-guide.md` | How to build the skill: frontmatter rules (WHAT + WHEN), naming/structure requirements, the progressive-disclosure multi-file pattern for generated skills, a design-pattern menu, specificity and error-handling best practices, plus parameterization and subagent-template authoring. Load when writing SKILL.md or its resources. |
| `resources/testing-validation.md` | How to prove it works: trigger tests (should/should-NOT-trigger), functional test cases, negative triggers, under/over-triggering signals with the iteration loop, and the final verification checklist. Load before declaring a skill done. |
| `resources/examples.md` | One complete prompt → SKILL.md walkthrough plus good/bad frontmatter and parameterization pairs. **Never load this directly** — consult it only when authoring-guide or testing-validation directs you to compare against an example. |

Supporting material lives in subdirectories of the skill folder: `resources/` for guidance read on demand (the files above), `scripts/` for deterministic code run as needed, and `assets/` for static output material — see `resources/authoring-guide.md`.

## Workflow

```dot
digraph workflow {
    rankdir=LR;
    A["Interview user (resources/requirements-interview.md)"] -> B{"Has source prompt?"};
    B ->|"no"| C["Capture 2-3 use cases + success criteria"];
    B ->|"yes"| D["Analyze source for specifics & delegation points"];
    C -> E;
    D -> E["Pick a design pattern (resources/authoring-guide.md)"];
    E -> F{"Needs generalization?"};
    F ->|"yes"| G["Extract configurable variables, parameterize"];
    F ->|"no"| H;
    G -> H{"Has subagents?"};
    H ->|"yes"| I["Define subagent prompt template"];
    H ->|"no"| J["Write SKILL.md + resources (resources/authoring-guide.md)"];
    I -> J;
    J -> K["Validate & test (resources/testing-validation.md)"];
}
```

### Execution Steps

1. **Interview** — Follow `resources/requirements-interview.md`. Establish the skill's purpose, 2–3 concrete use cases, trigger conditions, and success criteria before writing anything. If a brainstorming-style skill is available, invoke it to drive this exploration; otherwise run the interview protocol inline.
2. **Analyze source** — If a specific prompt was provided, identify hardcoded specifics (paths, tech stack, topic terms, user preferences) and subagent delegation points.
3. **Pick a pattern** — Using `resources/authoring-guide.md`, choose the design pattern that fits the use cases (sequential orchestration, iterative refinement, context-aware tool selection, or domain-specific intelligence). This shapes the structure you will write.
4. **Generalize & parameterize** — Extract hardcoded specifics into configurable variables and replace them with variable references (rules in `resources/authoring-guide.md`).
5. **Define subagents** — If the skill dispatches subagents, author their parameterized prompt templates (`resources/authoring-guide.md`), before writing SKILL.md so they are ready to include.
6. **Write the skill** — Generate SKILL.md and any resource files under `resources/` per `resources/authoring-guide.md`, applying progressive disclosure: keep SKILL.md lean and move detail into referenced resources (plus `scripts/` for deterministic code and `assets/` for static output material where useful).
7. **Validate & test** — Run `resources/testing-validation.md`: build trigger tests and functional cases, wire in negative triggers, then complete the verification checklist before deploying.

## Guardrails

- CRITICAL: Do not emit a generated skill's frontmatter until its description states BOTH what the skill does AND when to use it (with concrete trigger phrases). See `resources/authoring-guide.md`.
- CRITICAL: Do not declare a skill done until every item in the `resources/testing-validation.md` verification checklist passes.
- Keep SKILL.md lean; move detailed documentation into resource files under `resources/` rather than inlining it (progressive disclosure).
- The generated skill must be self-contained and portable — no local code imports, kebab-case naming that matches its folder.

## Deployment

After validating:
1. Place the skill as `<name>/SKILL.md` inside whatever skills directory the target environment discovers (e.g., `skill/<name>/`, `.opencode/skills/`, or a global config path), with any sibling resource files alongside it.
2. Verify the `name` field exactly matches the folder name (kebab-case).
3. Test by loading the skill and confirming the frontmatter parses and its resources are reachable relative to the skill's own folder.
