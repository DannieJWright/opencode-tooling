import assert from "node:assert/strict"
import { mkdtemp, readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import plugin from "../plugin/worktree.js"

const root = resolve(fileURLToPath(new URL("..", import.meta.url)))
const skill = await readFile(join(root, "skill", "worktree", "SKILL.md"), "utf8")

assert.match(skill, /Call `create_worktree` exactly once/)
assert.match(skill, /complete subject exactly as supplied/)
assert.match(skill, /Ubuntu absolute path:/)
assert.match(skill, /Do not use a fenced code block or inline code/)
assert.doesNotMatch(skill, /git worktree add/)

const repo = await mkdtemp(join(tmpdir(), "worktree-tool-"))
const run = (args, cwd = repo) => Bun.$`git ${args}`.cwd(cwd).quiet()
await run(["init", "-q"])
await run(["config", "user.email", "test@example.com"])
await run(["config", "user.name", "Test User"])
await Bun.write(join(repo, "README.md"), "test\n")
await run(["add", "README.md"])
await run(["commit", "-qm", "initial"])

const hooks = await plugin()
const output = await hooks.tool.create_worktree.execute({ subject: "Bar Food" }, { directory: repo })
const expected = join(repo, ".worktrees", "bar-food")
assert.equal(output, expected)
assert.equal(resolve(output), output)
assert.equal(await Bun.file(join(output, "README.md")).text(), "test\n")
assert.match((await run(["worktree", "list", "--porcelain"])).text(), new RegExp(`worktree ${output.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n`))

const toolOutput = await hooks.tool.create_worktree.execute({ subject: "Nested Test" }, { directory: output })
assert.equal(toolOutput, join(repo, ".worktrees", "nested-test"))

await assert.rejects(hooks.tool.create_worktree.execute({ subject: "Bar Food" }, { directory: repo }), /Branch already exists/)
const fullSubjectOutput = await hooks.tool.create_worktree.execute({ subject: "fuck bro suck dick" }, { directory: repo })
assert.equal(fullSubjectOutput, join(repo, ".worktrees", "fuck-bro-suck-dick"))
console.log("worktree tool tests passed")
