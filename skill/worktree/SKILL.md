---
name: worktree
description: Create a Git worktree for a subject with the create_worktree tool and return its canonical absolute path on the OpenCode server.
---

Require a non-empty subject. If none was provided, ask the user for one before using any tool.

Call `create_worktree` exactly once with the complete subject exactly as supplied by the user. Do not shorten, summarize, reinterpret, or slugify the subject yourself. Do not call the shell or any other tool.

After `create_worktree` succeeds, return `Ubuntu absolute path: ` followed immediately by the tool output as normal plain text. Do not use a fenced code block or inline code because WhisperCode horizontally scrolls code and can hide the beginning of long paths. The tool output is the canonical absolute path on the OpenCode server. Do not reconstruct, shorten, rewrite, or otherwise replace it.

If `create_worktree` fails, report its error and do not claim success.
