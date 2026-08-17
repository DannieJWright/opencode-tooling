---
name: worktree
description: Create a Git worktree for a subject with the create_worktree tool and return its canonical absolute path on the OpenCode server.
---

Require a non-empty subject. If none was provided, ask the user for one before using any tool.

Call `create_worktree` exactly once with the subject supplied by the user. 
  - If the user provided a single word branch name, use pass that value as the new branch name.
  - If the user provided a description or summary, then create a short (1-4 word) slug from that description.

After `create_worktree` succeeds, return `Ubuntu absolute path: ` followed immediately by the tool output as in a fenced code block. The tool output is the canonical absolute path on the OpenCode server. Do not reconstruct, shorten, rewrite, or otherwise replace it.

If `create_worktree` fails, report its error and do not claim success.
