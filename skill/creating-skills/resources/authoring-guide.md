# Authoring Guide

How to build the generated skill: its frontmatter, structure, progressive-disclosure layout, design pattern, and instruction style. Load this when writing SKILL.md or any sibling resource file. When a rule is hard to apply in practice, compare against `examples.md` (only via this reference).

## 1. Frontmatter rules

The YAML frontmatter is how the agent decides whether to load the skill — get it right.

```yaml
---
name: your-skill-name          # kebab-case; MUST equal the folder name
description: >                 # [What it does] + [When to use it] + [Key capabilities]
  <One line on what it produces or accomplishes>. Use when <concrete trigger
  phrases a user would actually say>, <another phrasing>, or mentions <file type / domain term>.
---
```

**`name` (required)**
- kebab-case only: `notion-project-setup`. No spaces, no underscores, no capitals.
- Must exactly match the folder name (`skill/<name>/`).
- Do not use reserved words — a skill whose name contains "claude" or "anthropic" is rejected.

**`description` (required)**
- MUST contain BOTH: what the skill does **and** when to use it (trigger conditions). Triggers-only descriptions under-trigger; workflow-only descriptions over-generalize.
- Structure: `[What it does] + [When to use it] + [Key capabilities]`.
- Include specific trigger phrases users would actually say; mention relevant file types or domain terms.
- Under **1024 characters**. No XML angle brackets (`<` `>`) anywhere in the frontmatter (security restriction).

**Optional fields** — add only when they help:
```yaml
license: MIT                       # for open-source skills
compatibility: opencode            # environment/product requirements, system packages, network needs
metadata:
  author: <name>
  version: 1.0.0
```

Good vs bad descriptions: see `examples.md` (frontmatter section) when in doubt.

## 2. Naming & file-structure requirements

Apply these to the generated skill's folder:
- The main file is exactly `SKILL.md` — case-sensitive, no variations (`skill.md`, `SKILL.MD`).
- Folder name is kebab-case and equals the `name` field.
- Do **not** put a `README.md` inside the skill folder; all documentation lives in SKILL.md or its resource files. (A repo-level README for human visitors is separate.)

## 3. Progressive disclosure (multi-file layout)

Skills load in three levels: frontmatter (always), SKILL.md body (when relevant), and linked resource files (only when needed). Use this to keep token usage low while staying complete.

- **Keep SKILL.md lean** — under ~5,000 words. It holds the core instructions and a map; detail moves out.
- **Split into sibling resource `.md` files** in the same folder when content is large or only needed for specific phases. Each generated skill must be self-contained: its resources live alongside `SKILL.md` and are referenced by relative name within the skill — never point a generated skill at material outside its own folder (no links to other skills, docs, or paths it does not bundle).
- **Add a Resources table near the top of SKILL.md** mapping each path to what it contains, so the agent knows what exists and when to open it:

  ```markdown
  ## Resources (in this skill)
  | Path | Contains |
  |---|---|
  | `resources/authoring-guide.md` | Detailed how-to rules and techniques for producing output — load during the work. |
  | `resources/testing-validation.md` | Checklists, test cases, and the final verification gate — load before finishing. |
  ```

- **Add delegation rules / guardrails** so the agent loads only what the current task needs and never preloads: "Read `X` before doing Y; do not load more than one resource per phase." Guard against "just in case" loading.
- **Reference resources explicitly in instructions**: e.g. "Before writing queries, consult `resources/api-patterns.md` for rate-limiting and pagination patterns."

### Example multi-file layout

A generated skill keeps `SKILL.md` at its root and nests supporting material in subdirectories: `resources/` for guidance to read, `scripts/` for deterministic code to run, and `assets/` for static output material. Everything below is loaded or run on demand — never preloaded into context:

```
your-skill-name/
├── SKILL.md                      # Lean core: frontmatter, overview, Resources table, workflow steps, guardrails (first thing loaded)
├── resources/                    # Documentation & reference material — prose guidance read only when a phase needs it
│   ├── requirements-interview.md # Input-gathering / scope protocol: use cases, success criteria, clarifying questions. Load first in a run.
│   ├── authoring-guide.md        # Detailed how-to rules for producing output: formats, naming, step-by-step guidance, best practices. Load during the work.
│   ├── testing-validation.md     # Checklists + test cases (should/should-NOT-trigger, Given/When/Then) and the final verification gate. Load before finishing.
│   └── examples.md               # Complete worked examples + good/bad pairs. Load only when told to compare against an example; never preload.
├── scripts/                      # Executable code for deterministic work — run as needed, not read into context as prose
│   ├── validate.py               # Deterministic gate: checks output format/structure before the skill finishes (code is reliable where prose isn't).
│   └── fetch_data.sh             # Gathers or normalizes input data referenced by the workflow.
└── assets/                       # Static files copied into generated output — templates, skeletons, fonts; used in results, not read for guidance
    └── report-template.md        # Structure skeleton filled in when producing a report.
```

The Resources table near the top of SKILL.md maps each path to its purpose so the agent knows what exists and when to open it:

| Path | Purpose |
|---|---|
| `resources/requirements-interview.md` | How to gather inputs and define scope before acting — use cases, success criteria, clarifying questions. Load first in a run. |
| `resources/authoring-guide.md` | The detailed rules and techniques for producing output — formats, naming requirements, step-by-step guidance. Load during the work. |
| `resources/testing-validation.md` | Checklists, test cases, signals to watch for, and the final verification gate. Load before declaring done. |
| `resources/examples.md` | Complete worked examples plus good/bad pairs; load only when comparing against an example is called for. |
| `scripts/validate.py` | Deterministic validation of output format — run as a must-pass gate instead of relying on prose checks. |
| `assets/report-template.md` | Static skeleton filled in when producing a report; part of the output, not loaded into context.

Use as many or as few files and subdirectories as the content justifies: each file should be loadable independently and cover a distinct concern rather than splitting arbitrarily. Reserve `resources/` for guidance to read, `scripts/` for deterministic code to run, and `assets/` for static output material.

Single-file is fine when the skill is genuinely small — progressive disclosure is about not bloating context, not forcing extra files.

## 4. Pick a design pattern

Match the use cases to one (or a blend) of these; it determines structure:

| Pattern | Use when | Key techniques |
|---|---|---|
| **Sequential workflow orchestration** | Multi-step process in a fixed order | Explicit step ordering, dependencies between steps, validation at each stage, rollback on failure |
| **Iterative refinement** | Output quality improves with iteration (drafts, reports) | Explicit quality criteria, a refine→re-validate loop, validation scripts, and a clear stop condition |
| **Context-aware tool selection** | Same outcome, different tools by context | A decision tree with clear criteria, fallback options, transparency about the choice |
| **Domain-specific intelligence** | The skill adds specialized knowledge beyond raw tool access | Domain expertise embedded in logic, checks/compliance before action, comprehensive documentation |

## 5. Recommended SKILL.md body structure

A baseline template — a floor, not a ceiling. Add sections that fit the domain (Rules/Constraints, Decision Flow, Tips) where they help clarity.

```markdown
# Skill Name

## Overview
[Core principle in 1–2 sentences]

## Resources (under `resources/`)     <!-- only if multi-file; see §3 -->
| Path | Contains |
|---|---|
| `resources/<file>.md` | What it contains and when to load it. |

## Configuration                        <!-- only if parameterized; see §6 -->
[Variable table + expansion explanation]

## When to Use
[Triggering conditions, incl. what it should NOT be used for]

## Instructions
### Step 1: [First major step]
[Concrete, actionable steps — put critical constraints up top with ## Important / CRITICAL:]
...

## Examples                              <!-- concrete input→output; from use cases -->
Example 1: [common scenario] ... Result: ...

## Output Format (if applicable)        <!-- structure + append/overwrite rules -->

## Subagent Prompt Template (if applicable)   <!-- see §7 -->

## Common Issues                         <!-- Error / Cause / Solution; see §8 -->
```

Keep critical instructions at the top of their section and repeat them if they are easy to miss — buried or vague instructions get skipped.

## 6. Parameterization & configuration variables

When generalizing a specific prompt, pull hardcoded specifics into configurable variables so one skill serves many contexts.

### Variable classification

| Classification | Behavior |
|---|---|
| `Default: <value>` | Auto-uses the value; user may override |
| `Example: <value>` | No default — MUST be obtained from context (ask if ambiguous) before proceeding |

### Table structure

Place near the top of the generated skill, after the overview. It must carry the explanation that tells the invoking agent how to resolve values:

```markdown
## Configuration

These configurable values are for you (the AI agent). They act as placeholders within your input — keep them in mind throughout. Values marked "Default" should be used by default unless the user requests otherwise; values marked "Example" have no default and MUST be obtained from the context of your prompt based on their stated purpose (ask the user if there is ambiguity).

| Variable | Purpose | Default/Example |
|----------|---------|-----------------|
| (`VAR_NAME`) | What this controls | Default: `value` |
| (`VAR_NAME`) | What this controls | Example: `value` if user must decide |
```

### Naming convention
- Use (`CONSTANT_CASE`) — upper-snake-case in backticks, wrapped in parentheses.
- Prefix with domain context when multiple related variables exist.
- Examples: (`INPUT_FILE`), (`OUTPUT_DIR`), (`TECH_STACK`), (`ANALYSIS_DEPTH`).

### Parameterize specifics
Replace hardcoded values with variable references; keep structural instructions (format, ordering) as literal text.

```
Before: Read the guide at docs/research/guide.md. The project is a Unity C# 2D game.
After:  Read the guide at (`GUIDE_DOC`). The project context is (`TECH_STACK`).
```

Rules: replace file paths with path variables; technology mentions with (`TECH_STACK`) or a domain variable; project names with (`PROJECT_NAME`); style preferences with configurable options. Do **not** leave any project-specific references inline (define them as variables instead).

## 7. Subagent prompt templates

If the skill dispatches subagents, author each template *before* writing SKILL.md so it is ready to embed. Include a `## Subagent Prompt Template` section with instructions to replace `(VAR)` with configuration values:

```markdown
[parameterized prompt text]

Configuration:
[only the variables this subagent needs, in the same table format as §6]

Rules:
- [subagent rules, mirrored from parent-skill constraints]

Return findings in this exact format:
[explicit output-format specification]
```

Inject all configuration variables a subagent needs using parenthesized names (`VAR`). Specify an explicit return format so results come back parseable.

## 8. Specificity, error handling & troubleshooting

**Be specific and actionable.** Vague instructions ("validate the data before proceeding") get ignored or done inconsistently. Prefer concrete commands, checklists, and named checks:
```
Bad:   Make sure to validate things properly.
Good:  CRITICAL: Before calling create_project, verify — project name is non-empty; at least one team member is assigned; start date is not in the past.
```

**Prefer deterministic code for must-pass validation.** For critical checks, bundle a script (`scripts/validate.py`) rather than relying on language interpretation — code is deterministic, prose isn't. Reference it explicitly with expected output and common failure causes.

**Include error handling / troubleshooting as standard**, not optional — use an Error/Cause/Solution shape so failures are recoverable:
```markdown
## Common Issues
### [Error message or symptom]
Cause: ...
Solution: 1. ... 2. ...
```
