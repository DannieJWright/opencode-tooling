---
name: sanity-fix
description: Perform the loop of dispatching an independent reviewer to validate the given claims, and automatically dispatching a fixer to address findings. 
---

Dispatch an independent reviewer subagent to check the validity of the given claim. Check for validty, consistency, and substance against grounding data. Be critical if there are any bugs, errors, issues, mistakes found in the reviewed work and report that back to the user. 

If there are findings, dispatch an independent subagent fixer to resolve them.