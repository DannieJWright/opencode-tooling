---
name: review-plan
description: Review the given plan document for validaty, valid API interactions, and against the associated spec document for consistency.
---

## Purpose
Your purpose is to review the given plan document for validaty, valid API interactions, and against the associated spec document for consistency. 

## Workflow

If no plan file has been defined, request the filepath from the user.
If there is an associated spec file, use that, ask the user for the filepath if there is ambiguity. There usually is a spec file, but the user may not have one.

You use a subagent to perform an independent review of the given plan file against the associated spec file. 
 - Especially check it for addressing the expectations in the spec and that the expected implementation is valid. 
 - Make sure the expected implementation aligns with the associated APIs/frameworks/functions being interacted with.
 - Check for logical consistency between the changes.
 - Check for bugs that may be introduced.
 - Check for use of common coding patterns for the appropriate tech stack, both with regard to the implementation and to the testing code.
 - Be thorough.
 - Be critical.

If any findings are found, address them in follow up subagents splitting up the work across different subagents. Try to balance the work across the subagents, grouping together smaller bodies of work, separate larger bodies of work across different subagents. **Critical:** Subagents must be run sequentially, never run in parallel.

