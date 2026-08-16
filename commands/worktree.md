---
description: Create a Git worktree for a subject and print its path
agent: build
---

Create a Git worktree for this subject:

$ARGUMENTS

Follow these requirements:

1. Require a non-empty subject. If none was provided, ask the user for one before running any command.
2. Turn the subject into a short, descriptive, lowercase kebab-case slug using only `a-z`, `0-9`, and `-`. Do not use the entire subject when a few words convey it.
3. Find the main repository root from Git's common directory so this command also works when invoked inside an existing worktree.
4. Create the worktree at `<main-repository-root>/.worktrees/<slug>` and create a new branch named `<slug>` from the currently checked-out commit.
5. Before creating it, verify that neither the destination path nor branch already exists. Do not overwrite, delete, or reuse either one; report the collision and stop.
6. Create the `.worktrees` directory if necessary, then create the worktree with `git worktree add -b`.
7. If creation succeeds, resolve the worktree's absolute path and print it on its own in a fenced code block for easy copy and paste. If creation fails, report the error and do not claim success.
