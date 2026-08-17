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
assert.match(markdown, /realpath.*git rev-parse --git-common-dir/)
assert.match(markdown, /git worktree add -b/)
assert.match(markdown, /realpath "\$destination"/)
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
common_dir=$(realpath "$(git rev-parse --git-common-dir)")
root=$(dirname "$common_dir")
worktrees_dir="$root/.worktrees"
destination="$worktrees_dir/$slug"
git check-ref-format --branch "$slug" >/dev/null
if git show-ref --verify --quiet "refs/heads/$slug"; then exit 1; fi
if [[ -e "$destination" || -L "$destination" ]]; then exit 1; fi
mkdir -p "$worktrees_dir"
worktrees_dir=$(realpath "$worktrees_dir")
destination="$worktrees_dir/$slug"
git worktree add -b "$slug" "$destination" HEAD >&2
realpath "$destination"
`
const slug = "single-shell-test"
const output = await Bun.$`bash -lc ${scriptFor(slug)}`.cwd(repo).text()
const expected = join(repo, ".worktrees", slug)

assert.equal(output.trim(), expected)
assert.equal(resolve(output.trim()), output.trim(), "Output must be an absolute path")
assert.equal(await Bun.file(join(output.trim(), "README.md")).text(), "test\n", "Printed path must be the created directory")
assert.equal((await run(["branch", "--show-current"], expected)).text().trim(), slug)
assert.equal((await run(["worktree", "list", "--porcelain"])).text().includes(`worktree ${output.trim()}\n`), true, "Git must register the printed path")

const nestedSlug = "nested-worktree-test"
const nestedOutput = await Bun.$`bash -lc ${scriptFor(nestedSlug)}`.cwd(expected).text()
const nestedExpected = join(repo, ".worktrees", nestedSlug)

assert.equal(nestedOutput.trim(), nestedExpected, "Invocation inside a worktree must use the main repository root")
assert.equal((await run(["branch", "--show-current"], nestedExpected)).text().trim(), nestedSlug)

await assert.rejects(Bun.$`bash -lc ${scriptFor(slug)}`.cwd(repo).quiet(), "Existing branches and paths must not be reused")

console.log("worktree command tests passed")
