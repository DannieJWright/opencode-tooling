---
description: Review current changes and commit them
agent: build
subtask: true
model: github-copilot/gpt-5.6-luna
---

Review the current workspace changes and commit them.

Before committing:

1. Inspect the workspace and repository guidance to determine the commit-message format expected by this repository. Treat the workspace where this command was invoked as authoritative; do not assume the format used by the repository that provides this command.
2. If the repository does not define a commit-message format, use Conventional Commits.
3. Review all current changes, including staged and unstaged changes, and understand their purpose.
4. Do not modify or include files unrelated to the current changes.

Commit the appropriate changes with a concise, accurate message that follows the discovered format. If there are no changes to commit, report that clearly and do not create an empty commit.
