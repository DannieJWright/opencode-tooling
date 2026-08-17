---
name: worktree
description: Create a Git worktree for a subject in one shell call and return its absolute path on the OpenCode server.
---

Create a Git worktree for the user's subject.

Follow these requirements exactly:

1. Require a non-empty subject. If none was provided, ask the user for one before running any command.
2. Turn the subject into a short, descriptive, lowercase kebab-case slug using only `a-z`, `0-9`, and `-`. Do not use the entire subject when a few words convey it.
3. Do not run any discovery, validation, or setup commands separately.
4. Make exactly one shell tool call. In that call, run the script below after replacing `<slug>` with the slug. Do not make another shell tool call before or after it.

```bash
bash -lc '
set -euo pipefail
slug="<slug>"
common_dir=$(realpath "$(git rev-parse --git-common-dir)")
root=$(dirname "$common_dir")
worktrees_dir="$root/.worktrees"
destination="$worktrees_dir/$slug"

git check-ref-format --branch "$slug" >/dev/null
if git show-ref --verify --quiet "refs/heads/$slug"; then
  printf "Branch already exists: %s\n" "$slug" >&2
  exit 1
fi
if [[ -e "$destination" || -L "$destination" ]]; then
  printf "Worktree path already exists: %s\n" "$destination" >&2
  exit 1
fi

mkdir -p "$worktrees_dir"
worktrees_dir=$(realpath "$worktrees_dir")
destination="$worktrees_dir/$slug"
git worktree add -b "$slug" "$destination" HEAD >&2
realpath "$destination"
'
```

5. Return the script's final stdout line as the result. It is the absolute path on the OpenCode server. Do not shorten it, make it relative, or substitute a client-device path.
6. If the shell call fails, report its error and do not claim success.
