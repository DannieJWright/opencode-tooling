---
name: creating-skills
description: >
  Use when creating a new AI agent skill from a prompt, workflow, or idea.
  Triggers: "create a skill", "make a skill", "turn this prompt into a skill",
  "convert to skill", "generalize this prompt", "parameterize a workflow",
  or any task requiring generating a reusable SKILL.md document with configurable variables.
---

# Creating Skills

Generate reusable AI agent skills from specific prompts, workflows, or ideas. Generalizes concrete instructions into configurable templates.

## Overview

Takes a specific prompt or workflow and transforms it into a generic, reusable skill document. The process extracts hardcoded specifics into configurable variables, parameterizes user-specific details, and structures the output according to skill conventions.

## Workflow

```dot
digraph workflow {
    rankdir=LR;
    A["Invoke brainstorming"] -> B["Gather skill requirements"];
    B -> C{"Has source prompt?"};
    C ->|"no"| D["Ask user for skill purpose, scope, triggers"];
    C ->|"yes"| E["Analyze prompt"];
    D -> E;
    E -> F{"Needs generalization?"};
    F ->|"yes"| G["Extract configurable variables"];
    F ->|"no"| J{"Has subagents?"};
    G -> I["Parameterize all hardcoded values"];
    I -> J;
    J ->|"yes"| K["Define subagent prompt template"];
    J ->|"no"| H["Write SKILL.md"];
    K -> H;
    H -> L["Verify & deploy"];
}
```

### Execution Steps

1. **Invoke brainstorming** — Use brainstorming skill to understand scope, purpose, and design
2. **Gather requirements** — Collect skill purpose, target use cases, triggering conditions, and subagent roles
3. **Analyze source** — If a specific prompt was provided, identify all hardcoded specifics and subagent delegation points
4. **Extract variables** — Pull file paths, tech stack, topic details into configurable variables
5. **Parameterize** — Replace all hardcoded values with variable references
6. **Document formats** — Define input/output file formats
7. **Define subagents** — If the skill spawns subagents, write their parameterized prompt templates using the configurable variables
8. **Write skill** — Generate the complete SKILL.md
9. **Verify** — Confirm the generated skill follows conventions

## Step 1: Invoke Brainstorming

Always invoke the brainstorming skill before creating a skill. This ensures proper design exploration.

If no brainstorming-style skill is available, ask clarifying questions inline:
- What problem does this skill solve?
- When should an agent trigger it?
- What are the success criteria?

## Step 2: Gather Skill Requirements

If the user has not provided a source prompt or sufficient context, ask these questions one at a time:

1. **Purpose**: What does this skill help an agent do?
2. **Scope**: What specific scenarios should it handle?
3. **Triggers**: What situations should activate this skill?
4. **Inputs**: Does it consume any inputs (files/details/webpages/etc)? If so, what format?
5. **Outputs**: Does it produce any output (files/details/webpages/etc)? If so, what format?
6. **Subagents**: Does it dispatch subagents? If so, what are their roles?

## Step 3: Analyze Source Prompt

When a specific prompt is provided for conversion, scan for:

- File paths (absolute, relative, or hardcoded names)
- Technology references (frameworks, languages, tools)
- Topic-specific details (project names, domain terms)
- User-specific preferences (naming conventions, style choices)
- Output format expectations (structure, sections, ordering)
- Conditions or decision points
- Use of subagents (associated tasks, when to delegate, subagent prompt format)

## Step 4: Extract Configurable Variables

Create a configuration table containing all extracted variables.

### Variable Classification

| Classification | Behavior |
|----------------|----------|
| `Default: <value>` | Auto-uses value, user may override |
| `Example: <value>` | Requires user to supply before proceeding |

### Table Structure

Place this near the top of the generated skill, after the overview:

```markdown
## Configuration

Set these before starting:

| Variable | Purpose | Default/Example |
|----------|---------|-----------------|
| (`VAR_NAME`) | What this controls | Default: `value` |
| (`VAR_NAME`) | What this controls | Example: `value` if user must decide |
```

### Naming Convention

- Use (`CONSTANT_CASE`) for variable names - upper-snakecase surrounded by backticks which are surrounded by parenthesis
- Prefix with domain context if multiple related variables exist
- Examples: (`INPUT_FILE`), (`OUTPUT_DIR`), (`TECH_STACK`), (`ANALYSIS_DEPTH`)

## Step 5: Parameterize Prompt

Replace all hardcoded specifics with variable references:

### Before (specific):
```
Read the guide at docs/research/guide.md. The project is a Unity C# 2D game.
```

### After (parameterized):
```
Read the guide at (`GUIDE_DOC`). The project context is (`TECH_STACK`).
```

### Rules:
- Replace file paths with path variables
- Replace technology mentions with (`TECH_STACK`) or a domain-specific variable
- Replace project names with (`PROJECT_NAME`) or equivalent
- Replace style preferences with configurable options
- Keep structural instructions (format, ordering) as literal text

## Step 6: Document File Formats

If the skill consumes or produces files, document their format in the generated skill.

### Input File Format Section

Include a section titled `## Input: [Variable Reference]` that describes:
- The expected structure with an example
- Key format requirements as a bullet list

### Output File Format Section

Include a section titled `## Output: [Variable Reference]` that describes:
- The generated file structure with an example
- Behavior: append vs overwrite, create-if-missing rules

## Step 7: Define Subagent Prompts

If the skill dispatches subagents, include a parameterized prompt template. **This must be done before Step 8 (Write SKILL.md) so the template is ready to include.**

### Template Structure

Include a `## Subagent Prompt Template` section with instructions to replace `(VAR_NAME)` with configuration values. The template should contain:

- Parameterized prompt text with parenthesized variables: (`VAR`)
- Configuration injection block listing all needed variables
- Subagent rules (mirrored from parent skill constraints)
- Explicit return format specification

Format
```markdown
[parameterized prompt text]

Configuration:
[relevant variables for subagent in same format as table from Step 4]

Rules:
- [list subagent rules]

Return findings in this exact format:
[output format specification]
```

### Variable Injection

Include all configuration variables that a subagent needs. Use parenthesized variable names (`VAR`) throughout the template - upper-snakecase surrounded with backticks which are surrounded with parenthesis.

## Step 8: Write SKILL.md

Generate the complete skill document following this structure:

```yaml
---
name: skill-name-hyphenated
description: Use when [specific triggering conditions and symptoms]
---
```

```markdown
# Skill Name

## Overview
[Core principle in 1-2 sentences]

## Configuration
[Variable table from Step 4]
[Variable explansion explaination from Step 4]

## When to Use
[Triggering conditions]

## Input Format (if applicable)
[From Step 6]

## Workflow
[Process flowchart or numbered steps]

## Output Format (if applicable)
[From Step 6]

## Subagent Prompt Template (if applicable)
[From Step 7]

## Common Mistakes
[Specific pitfalls]
```

### Frontmatter Rules

- `name`: lowercase hyphenated, only letters/numbers/hyphens
- `description`: start with "Use when..." — describe triggers only, NOT workflow
- Keep description under 500 characters when possible

## Step 9: Verify

### Generated Skill Checklist

- [ ] Frontmatter has `description` starting with "Use when..."
- [ ] Description describes triggers, NOT workflow
- [ ] Configuration table present with variable classification
- [ ] All hardcoded specifics are parameterized
- [ ] File formats documented (if applicable)
- [ ] Subagent template includes variable injection (if applicable)
- [ ] Variable names use (`CONSTANT_CASE`)
- [ ] No remaining project-specific references


## Anti-Patterns

### Hardcoded Paths
```markdown
<!-- ❌ BAD: hardcoded path inline -->
Always read from docs/plan.md

<!-- ✅ GOOD: use variable reference, define the default in the Configuration table -->
Read from (`PLAN_FILE`)
<!-- The Configuration table entry would specify: Default: `docs/plan.md` -->
```

### Over-Specific Descriptions
```yaml
<!-- ❌ BAD: describes workflow -->
description: Spawns subagents that research topics from a guide document
<!-- ✅ GOOD: describes triggers only -->
description: Use when planning a project by researching multiple topics via subagents
```

### Missing Variable for Obvious Config
```markdown
<!-- ❌ BAD: hardcoded tech stack inline -->
The project uses React with TypeScript

<!-- ✅ GOOD: use variable reference, define in Configuration table -->
The project uses (`TECH_STACK`)
<!-- The Configuration table entry would specify: Example: `React with TypeScript` -->
```

## Deployment

After generating a skill:
1. Place in `skill/<name>/SKILL.md` within the repository
2. Verify the naming matches the directory name
3. Test by loading the skill and confirming it parses correctly

