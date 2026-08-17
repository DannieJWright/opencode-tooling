import { tool } from "@opencode-ai/plugin"
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, realpathSync } from "node:fs"
import { dirname, isAbsolute, join, resolve } from "node:path"

function slugify(subject) {
	return subject
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
}

function git(args, cwd) {
	const result = spawnSync("git", args, { cwd, encoding: "utf8" })
	if (result.status !== 0) throw new Error((result.stderr || result.stdout || `git ${args.join(" ")} failed`).trim())
	return result.stdout.trim()
}

async function createWorktree(subject, directory) {
	const slug = slugify(subject)
	if (!slug) throw new Error("The subject must contain at least one letter or number.")

	const commonDirValue = git(["rev-parse", "--git-common-dir"], directory)
	const commonDir = realpathSync(isAbsolute(commonDirValue) ? commonDirValue : resolve(directory, commonDirValue))
	const root = dirname(commonDir)
	const destination = join(root, ".worktrees", slug)

	git(["check-ref-format", "--branch", slug], directory)
	const branchExists = spawnSync("git", ["show-ref", "--verify", "--quiet", `refs/heads/${slug}`], { cwd: directory }).status === 0
	if (branchExists) throw new Error(`Branch already exists: ${slug}`)

	if (existsSync(destination)) throw new Error(`Worktree path already exists: ${destination}`)

	mkdirSync(dirname(destination), { recursive: true })
	git(["worktree", "add", "-b", slug, destination, "HEAD"], directory)
	const canonicalPath = realpathSync(destination)
	const registeredPaths = git(["worktree", "list", "--porcelain"], directory)
		.split("\n")
		.filter((line) => line.startsWith("worktree "))
		.map((line) => line.slice("worktree ".length))
	if (!registeredPaths.includes(canonicalPath)) throw new Error(`Git did not register the created worktree at ${canonicalPath}`)

	return canonicalPath
}

export default async () => ({
	tool: {
		create_worktree: tool({
			description: "Create a Git worktree from a subject and return its canonical absolute path on the OpenCode server",
			args: {
				subject: tool.schema.string().min(1).describe("Subject used to derive the branch and worktree name"),
			},
			async execute({ subject }, context) {
				return createWorktree(subject, context.directory)
			},
		}),
	},
})
