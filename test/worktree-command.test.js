import assert from "node:assert/strict"
import { mkdtemp, readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(fileURLToPath(new URL("..", import.meta.url)))
const markdown = await readFile(join(root, "skill", "worktree", "SKILL.md"), "utf8")

assert.match(markdown, /name: worktree/)
assert.match(markdown, /description: Create a Git worktree for a subject in one shell call and return its absolute path on the OpenCode server/)
assert.match(markdown, /Make exactly one shell tool call/)
assert.match(markdown, /git rev-parse --path-format=absolute --git-common-dir/)
assert.match(markdown, /git worktree add -b/)
assert.match(markdown, /absolute path on the OpenCode server/)

const repo = await mkdtemp(join(tmpdir(), "worktree-command-"))
const run = (args, cwd = repo) => Bun.$`git ${args}`.cwd(cwd).quiet()

await run(["init", "-q"])
await run(["config", "user.email", "test@example.com"])
await run(["config", "user.name", "Test User"])
await Bun.write(join(repo, "README.md"), "test\n")
await run(["add", "README.md"])
await run(["commit", "-qm", "initial"])

const scriptFor = (slug) => `
set -euo pipefail
slug="${slug}"
common_dir=$(git rev-parse --path-format=absolute --git-common-dir)
root=$(dirname "$common_dir")
destination="$root/.worktrees/$slug"
git check-ref-format --branch "$slug" >/dev/null
if git show-ref --verify --quiet "refs/heads/$slug"; then exit 1; fi
if [[ -e "$destination" || -L "$destination" ]]; then exit 1; fi
mkdir -p "$root/.worktrees"
git worktree add -b "$slug" "$destination" HEAD >&2
printf "%s\\n" "$destination"
`
const slug = "single-shell-test"
const output = await Bun.$`bash -lc ${scriptFor(slug)}`.cwd(repo).text()
const expected = join(repo, ".worktrees", slug)

assert.equal(output.trim(), expected)
assert.equal(resolve(output.trim()), output.trim(), "Output must be an absolute path")
assert.equal((await run(["branch", "--show-current"], expected)).text().trim(), slug)

const nestedSlug = "nested-worktree-test"
const nestedOutput = await Bun.$`bash -lc ${scriptFor(nestedSlug)}`.cwd(expected).text()
const nestedExpected = join(repo, ".worktrees", nestedSlug)

assert.equal(nestedOutput.trim(), nestedExpected, "Invocation inside a worktree must use the main repository root")
assert.equal((await run(["branch", "--show-current"], nestedExpected)).text().trim(), nestedSlug)

await assert.rejects(Bun.$`bash -lc ${scriptFor(slug)}`.cwd(repo).quiet(), "Existing branches and paths must not be reused")

console.log("worktree command tests passed")
