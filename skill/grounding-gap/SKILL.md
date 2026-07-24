---
name: grounding-gap
description: On-demand skill to detect gaps between RAG-grounded knowledge and inherent AI knowledge, then update grounding documentation to close them. Use when the user asks to check what was answered from inherent knowledge vs documented research, or to fill research doc gaps from a conversation.
---

# Grounding Gap Check

## Purpose

When answering questions from grounded RAG data, the AI may supplement findings with its own inherent knowledge not present in the documentation. This skill detects those gaps, proposes updates to the grounding docs, and re-ingests changes so future sessions benefit.

## When to Use

On-demand only. Trigger when the user explicitly asks to check for knowledge gaps or document conversation findings. Do NOT auto-trigger after every RAG answer.

## Process

### 1. Review the conversation

Scan the back-and-forth. Identify every answer that combined RAG-grounded material with the AI's own inherent knowledge.

### 2. Classify each knowledge contribution

For each substantive claim, label it:
- **[DOC]** — Directly from the grounding material (RAG result)
- **[AI]** — From the AI's inherent knowledge, not documented anywhere in the research

### 3. Assess each [AI] item

Ask: *Is this substantive enough to document?* Skip if it's:
- Pure example (concrete numbers used for illustration)
- Common sense (trivial engineering trade-offs)
- Obvious restatement of documented material

Keep if it's:
- Design rationale not captured in the docs
- Integration patterns between systems that live in different files
- Strategic reasoning for architectural choices
- Concrete flow examples showing how subsystems interact
- Counterplay mechanics, edge cases, or balancing implications

### 4. Propose the documentation update

For each kept [AI] item, write what goes in, where it goes, and why. Format as:

```
📄 File: <path>
📍 Section: <target section or new section name>
📝 Summary: <2-3 lines of what will be added>
❓ Gap: <why this wasn't in the docs before>
```

### 5. Ask permission

Present the full diff summary to the user:

```
Grounding Gap Report
====================

Conversation topic: <brief topic>
Items from RAG only: <count>
Items from AI inherent knowledge: <count>
Items proposed for documentation: <count>

Proposed changes:
<list from step 4>

Skip these? Edit first? Proceed?
```

### 6. Apply + re-ingest

On approval:
1. Edit the target doc
2. Re-ingest via `local-rag_ingest_file`
3. Verify with `local-rag_query_documents` that the new content ranks for a relevant search query

## Formatting Rules

When writing doc updates, match existing conventions:
- Use the same heading structure, code block style, and reference format
- If adding a new section, use the document's existing naming pattern
- Cross-reference related docs using the same `Local File References` style
- Don't rewrite existing sections — append new material

## Anti-Patterns

- DON'T document every example — examples belong in the prompt, not the research doc
- DON'T overwrite existing findings with different wording that means the same thing
- DON'T add external library references — the doc should stay grounded in the project's actual decisions
- DON'T bypass the re-ingest step — if you skip it, the new content is live in git but invisible to search
- DON'T document AI hallucinations — only add genuinely substantive insights that fill real gaps

## Example

User asks: "How does the buff system fit the damage pipeline?"

AI answers, then user says: "check for grounding gaps from this back-and-forth"

Skill runs:
1. Reviews conversation, finds +35% collapse analysis was [AI], not [DOC]
2. Classifies 6 design-rationale points as substantive [AI]
3. Proposes adding "Why Separate Attacker Buffs from Target Debuffs" section to `02.f-buff-debuff-system.md`
4. User approves
5. Edits file, re-ingests, verifies search ranks the new section