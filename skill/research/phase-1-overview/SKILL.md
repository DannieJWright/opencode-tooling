## Pre-flight

**Before doing anything else, ask the user for these values.** Do not proceed until all are provided.

| Variable | Description | Default |
|---|---|---|
| `PROJECT_DESCRIPTION` | What is the project? (e.g. "2D turn-based gladiator fighting game") | N/A |
| `TECH_STACK` | What tech stack? (e.g. "Unity game engine using C#") | N/A |
| `GUIDE_PATH` | Path to the overview/guide document (step-by-step guide) | `docs/research/big-picture/guide.md` | 
| `OUTPUT_DIR` | Directory where subagent output files live | `docs/research/big-picture/` |

## Mission

Plan a `(PROJECT_DESCRIPTION)` using `(TECH_STACK)`. Establish the "big pieces" needed for the project through subagent researchers.

You are the orchestrator. The ONLY file you are allowed to read from is the "guide" document at `(GUIDE_PATH)`, **do not read any other files or lookup information yourself** - delegate all work to subagents. Aggressively rely on subagents and have them summarize information back to you.

**This is research only.** Do not implement code. Do not have subagents implement anything. Collect information and produce well-organized documentation for reuse during development.

## Tech Stack

All research targets: `(TECH_STACK)`

## Subagent Rules

Only spawn @Librarian subagents for the research. Apply these rules to EVERY subagent you spawn (be explicit in the subagent prompts):

1. **Sequential execution** - Spawn one subagent at a time. Wait for completion before spawning the next. Never spawn multiple agents in parallel.
2. **Single topic scope** - Each subagent researches one checklist subpoint. Limit tightly to prevent scope creep.
3. **Output files** - Subagent must write results to `(OUTPUT_DIR)` as a `.md` file named after the subpoint (e.g. `01.a-three-layer-model.md`). The file must include the subagent's prompt at the top, then findings, then valid references used. Do not include full conversation or thought process - just prompt, reported results, and references. Additionally, include valid associated references that were used in the findings (file refernces with lines as well as url links).
4. **Write before return** - Subagent must write its research file BEFORE returning results back to you.
5. **Web research** - Subagents must perform ONE websearch/webfetch at a time. Never in parallel. Webfetch URLs must come from known valid sources or previous websearch results, never guessed.
6. **Research only** - No implementation plans. Collect information about the expected tech stack and assigned topic. Broad strokes only, no fine implementation details.
7. **References** - Include only valid references in the documentation. URLs that resulted in failed webfetches must be excluded.
8. **No decisions** - Agents should not decide between competing options. When multiple options exist, mention each, note whether native to the engine/framework, and note which is most recent (e.g. legacy vs new systems).
9. **Subagents must NOT read ANY local documentation before research**. They cannot read ANY! NONE! Not a single file before completing their research.
10. **All information must come from the web!!**
11. Explicitly include the expected tech stack for each agent to keep research narrowed (`(TECH_STACK)`).
12. Explictly tell the subagents they MUST NOT read from existing files.
13. Merge their findings into the existing file for their topic (if it exists) instead of overriding it. **The subagents must NOT read their existing output file before doing research**, their research should be fresh without bias to the previous run. Make sure the changes are not marked as "new" or anything like that, they should be seamlessly added to the existing body of work, updating existing sections, adding new sections and references as appropriate.
14. Perform "websearch"es for their assigned topic with the tech stack in mind.
15. Return to the primary agent only the number of git line changes for the subagent output file, nothing else.

## Research Checklist

Work through these subpoints sequentially. Each gets its own subagent.

## Execution Order

1. Start with Section 1, subpoint 1.a
2. Spawn subagent with the topic and all subagent rules
3. Wait for completion, verify output file was written
4. Mark subpoint complete, proceed to next
5. After finishing all subpoints in a section, spawn a new subagent to:
    a. Verify all the current section's output files were updated (using git stats).
    b. If any subsections were missed, return to the primary agent which subsection(s) were missed so they can be re-done.
    c. If all subsections were updated, commit the changes using conventional commits, then return to the primary agent that the section is complete and the number of file lines that were changed via git stats. Do not return anything else (no summary, change details, etc).
6. If the reviewer subagent found any subsections were not updated, restart at step 2 for each of the missed subsections.
7. Upon confirmation all subsections for the current section were completed, continue to next section
8. Repeat through all the sections.

## Guide Document Reference

**CRITICAL: NEVER SPAWN SUBAGENTS IN PARALLEL!**

When spawning a subagent for a given subpoint, provide that subagent with:
- The subpoint topic description
- All subagent rules from above
- The tech stack context
- The output file path to write to
- The subagent **must NOT read their output file until after their research is completed**.
