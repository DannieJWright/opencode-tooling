# Examples

Reference examples for authoring and testing decisions. Load this only when `authoring-guide.md` or `testing-validation.md` directs you to compare against an example — do not preload it.

## 1. Frontmatter: good vs bad

```yaml
# BAD — triggers only, no "what it does"; vague
name: data-helper
description: Helps with projects and data stuff when asked.

# BAD — workflow-only, over-generalizes; too technical for triggering
name: project-entity-model
description: Implements the Project entity model with hierarchical relationships.

# GOOD — [What it does] + [When to use it (trigger phrases)] + [Key capabilities]
name: figma-handoff
description: Analyzes Figma design files and generates developer handoff documentation with component specs, tokens, and asset links. Use when a user uploads .fig files or asks for "design specs", "component documentation", or "design-to-code handoff".
```

Note the negative-trigger technique in a description that competes with sibling skills:
```yaml
description: Advanced statistical analysis for CSV datasets — regression, clustering, hypothesis testing. Use for modeling and inference on tabular data. Do NOT use for simple exploration or charting (use `data-viz` instead).
```

## 2. Parameterization before / after

Source prompt (specific):
> "Read the guide at docs/research/guide.md. The project is a Unity C# 2D game called Starfall. Write tests in Tests/StarfallTests.cs and keep them under 50 lines each."

Parameterized:
> "Read the guide at (`GUIDE_DOC`). The project context is (`TECH_STACK`) for (`PROJECT_NAME`). Write tests into (`TEST_FILE`); keep each test under (`MAX_TEST_LINES`) lines."

Configuration table produced:
```markdown
| Variable | Purpose | Default/Example |
|----------|---------|-----------------|
| (`GUIDE_DOC`) | Source guide to read first | Example: `docs/research/guide.md` |
| (`TECH_STACK`) | Engine/language of the project | Example: `Unity C# 2D` |
| (`PROJECT_NAME`) | Project's name | Example: `Starfall` |
| (`TEST_FILE`) | Where tests are written | Default: `Tests/<Project>Tests.cs` |
| (`MAX_TEST_LINES`) | Per-test length cap | Default: `50` |
```

Anti-pattern to avoid — hardcoded specifics left inline even though a variable exists:
```markdown
<!-- BAD --> The project uses React with TypeScript.          (tech stack hardcoded)
<!-- GOOD --> The project uses (`TECH_STACK`).                  (value lives in the table)
```

## 3. Full prompt → SKILL.md walkthrough

**Source prompt:** "Review my Unity C# scripts for common mistakes: missing [SerializeField] on private fields I want to tune, allocations inside Update(), and not pooling objects that get created/destroyed often."

Use cases captured (from the interview):
1. *Trigger:* "review this script" / "check my Unity code". *Steps:* read file → scan for anti-patterns → report findings. *Result:* a prioritized list of issues with line references.
2. *Trigger:* given a folder path, "audit all scripts here". Same steps across files; result is one consolidated report.

Design pattern: **domain-specific intelligence** (embeds Unity performance knowledge) — so the structure leads with the checklist of domain rules and an Error/Cause/Solution section for false positives. Small enough to stay single-file.

Resulting SKILL.md:
```markdown
---
name: unity-csharp-review
description: Reviews Unity C# scripts for common performance mistakes — missing [SerializeField], allocations in Update(), and un-pooled create/destroy churn. Use when a user says "review this script", "check my Unity code", or asks to audit Unity/C# files for performance issues.
---

# Unity C# Review

## Overview
Reviews Unity C# scripts against a fixed set of performance anti-patterns and reports findings with line references, ordered by impact.

## When to Use
- A user points at one script or a folder and asks for a review/audit of Unity C#.
Do NOT use for general (non-Unity) C# linting or gameplay-balance feedback.

## Configuration
| Variable | Purpose | Default/Example |
|----------|---------|-----------------|
| (`TARGET`) | Script path or folder to review | Example: `Assets/Scripts/` |

## Instructions
### Step 1: Locate targets
Resolve (`TARGET`). If it is a folder, enumerate all `*.cs` files.

CRITICAL: Only flag findings you can cite by file and line — no speculative issues.

### Step 2: Check for anti-patterns
Scan each script for: missing `[SerializeField]` on tunable private fields; allocations (new, LINQ, string ops) inside `Update()`/`LateUpdate()`; objects created/destroyed frequently without pooling.

## Examples
Example 1 — "review this script" on `PlayerController.cs`:
Result → "Line 42: `new Vector3[]` allocated in Update(); hoist to a field. Line 88: private `moveSpeed` should be `[SerializeField]`."

## Common Issues
### False positive: pooled object flagged as churn
Cause: pooling exists but is behind an interface the scan can't see.
Solution: Open the referenced manager; if a pool is used, drop the finding and note why.
```

Trigger test lists this skill would generate (see `testing-validation.md`):
- Should trigger: "review this script", "check my Unity code for performance problems", "audit all C# in Assets/Scripts".
- Should NOT trigger: "help me write a new MonoBehaviour from scratch", "explain LINQ allocations" (no review request).
