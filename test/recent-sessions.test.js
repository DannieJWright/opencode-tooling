// Test: recent-sessions plugin - formatRelativeTime, getResumeCmd, execute path
//
// Dynamically imports the real functions from the ESM plugin file.
// Uses fixed timestamps for deterministic test results.

import assert from "node:assert"
import { resolve, dirname, posix, win32 } from "node:path"
import { pathToFileURL, fileURLToPath } from "node:url"
import { platform } from "node:os"

const __dirname = dirname(fileURLToPath(import.meta.url))

// ---- Dynamic import of real plugin functions ----
const pluginPath = resolve(__dirname, "..", "plugin", "recent-sessions.js")
let formatRelativeTime, getResumeCmd, resolveDbPath, getFallbackDbPath
try {
	const plugin = await import(pathToFileURL(pluginPath).href)
	formatRelativeTime = plugin.formatRelativeTime
	getResumeCmd = plugin.getResumeCmd
	resolveDbPath = plugin.resolveDbPath
	getFallbackDbPath = plugin.getFallbackDbPath
} catch (e) {
	console.error(`[FATAL] Could not import plugin: ${e.message}`)
	process.exit(1)
}

let passed = 0
let failed = 0

// --- resolveDbPath / getFallbackDbPath ---
console.log("\n--- resolveDbPath / getFallbackDbPath ---")

const isWin = platform() === "win32"
const pJoin = isWin ? win32 : posix

ok("getFallbackDbPath: windows-style home", () => {
	assert.strictEqual(getFallbackDbPath({ home: "C:\\Users\\Test" }), "C:\\Users\\Test\\.local\\share\\opencode\\opencode.db")
})

ok("getFallbackDbPath: posix-style home", () => {
	assert.strictEqual(getFallbackDbPath({ home: "/home/test" }), pJoin.join("/home/test", ".local", "share", "opencode", "opencode.db"))
})

await okAsync("resolveDbPath: uses CLI output (trimmed)", async () => {
	const path = await resolveDbPath({ exec: async () => "C:\\real\\opencode.db\n" })
	assert.strictEqual(path, "C:\\real\\opencode.db")
})

await okAsync("resolveDbPath: falls back to platform convention when CLI throws", async () => {
	const path = await resolveDbPath({
		exec: async () => {
			throw new Error("cli unavailable")
		},
		home: "/home/test",
	})
	assert.strictEqual(path, pJoin.join("/home/test", ".local", "share", "opencode", "opencode.db"))
})

await okAsync("resolveDbPath: falls back when CLI returns empty", async () => {
	const path = await resolveDbPath({ exec: async () => "   ", home: "C:\\Users\\Test" })
	assert.strictEqual(path, "C:\\Users\\Test\\.local\\share\\opencode\\opencode.db")
})

// ---- Test helpers ----
function ok(label, fn) {
	try {
		fn()
		passed++
		console.log(`  ✓ ${label}`)
	} catch (e) {
		failed++
		console.error(`  ✗ ${label}\n    ${e.message}`)
	}
}

async function okAsync(label, asyncFn) {
	try {
		await asyncFn()
		passed++
		console.log(`  ✓ ${label}`)
	} catch (e) {
		failed++
		console.error(`  ✗ ${label}\n    ${e.message}`)
	}
}

// Fixed reference timestamp for deterministic tests
const NOW = 1_000_000_000_000

// --- formatRelativeTime ---
console.log("\n--- formatRelativeTime ---")

ok("just now (< 60s)", () => {
	assert.strictEqual(formatRelativeTime(NOW - 0, NOW), "just now")
})

ok("1 minute ago", () => {
	assert.strictEqual(formatRelativeTime(NOW - 60_000, NOW), "1 minute ago")
})

ok("2 minutes ago", () => {
	assert.strictEqual(formatRelativeTime(NOW - 120_000, NOW), "2 minutes ago")
})

ok("59 minutes ago (upper boundary of minutes)", () => {
	assert.strictEqual(formatRelativeTime(NOW - 59 * 60_000, NOW), "59 minutes ago")
})

ok("1 hour ago", () => {
	assert.strictEqual(formatRelativeTime(NOW - 3600_000, NOW), "1 hour ago")
})

ok("3 hours ago", () => {
	assert.strictEqual(formatRelativeTime(NOW - 3 * 3600_000, NOW), "3 hours ago")
})

ok("23 hours ago (upper boundary of hours)", () => {
	assert.strictEqual(formatRelativeTime(NOW - 23 * 3600_000, NOW), "23 hours ago")
})

ok("1 day ago", () => {
	assert.strictEqual(formatRelativeTime(NOW - 86400_000, NOW), "1 day ago")
})

ok("5 days ago", () => {
	assert.strictEqual(formatRelativeTime(NOW - 5 * 86400_000, NOW), "5 days ago")
})

ok("6 days ago (upper boundary of days)", () => {
	assert.strictEqual(formatRelativeTime(NOW - 6 * 86400_000, NOW), "6 days ago")
})

ok("1 week ago", () => {
	assert.strictEqual(formatRelativeTime(NOW - 7 * 86400_000, NOW), "1 week ago")
})

ok("3 weeks ago", () => {
	assert.strictEqual(formatRelativeTime(NOW - 21 * 86400_000, NOW), "3 weeks ago")
})

ok("4 weeks ago (upper boundary of weeks)", () => {
	assert.strictEqual(formatRelativeTime(NOW - 4 * 7 * 86400_000, NOW), "4 weeks ago")
})

ok("1 month ago (30+ days)", () => {
	assert.strictEqual(formatRelativeTime(NOW - 30 * 86400_000, NOW), "1 month ago")
})

ok("2 months ago", () => {
	assert.strictEqual(formatRelativeTime(NOW - 62 * 86400_000, NOW), "2 months ago")
})

ok("0 seconds (exact now)", () => {
	assert.strictEqual(formatRelativeTime(NOW, NOW), "just now")
})

// --- getResumeCmd ---
console.log("\n--- getResumeCmd ---")

ok("returns correct opencode command", () => {
	assert.strictEqual(getResumeCmd("abc123"), "opencode -s abc123")
})

ok("handles longer session IDs", () => {
	assert.strictEqual(getResumeCmd("session-uuid-42"), "opencode -s session-uuid-42")
})

// ---- Execute-path tests (mocked client) ----

const sessionA = {
	id: "ses_alpha",
	title: "Alpha Session",
	directory: "C:\\proj\\alpha",
	parentID: undefined,
	time: { created: 1700000000000, updated: 1700000100000 },
}

const sessionB = {
	id: "ses_beta",
	title: "Beta Session",
	directory: "C:\\proj\\beta",
	parentID: undefined,
	time: { created: 1700000000000, updated: 1700000200000 },
}

const subSession = {
	id: "ses_child",
	title: "Child Sub-session",
	directory: "C:\\proj\\alpha",
	parentID: "ses_alpha",
	time: { created: 1700000000000, updated: 1700000300000 },
}

async function runExecuteTests() {
	const mod = await import(pathToFileURL(pluginPath).href)
	const pluginFn = mod.default

	// --- Scope parameter verification ---
	console.log("\n--- execute: scope parameter verification ---")

	await okAsync("passes scope: project query parameter for cross-directory listing", async () => {
		let capturedOptions
		const mockClient = {
			session: {
				list: async (options) => {
					capturedOptions = options
					return { data: [sessionA], error: undefined }
				},
			},
		}
		const result = await pluginFn({ client: mockClient })
		const def = result.tool.recent_sessions
		await def.execute({ count: 10 }, {})

		assert.ok(capturedOptions, "list() should receive an options object")
		assert.deepStrictEqual(
			capturedOptions.query,
			{ scope: "project" },
			"Should pass { query: { scope: 'project' } } for cross-directory session listing"
		)
	})

	// --- Wrapper-shape client (SDK 1.18.10+ behavior) ---
	console.log("\n--- execute: wrapper-shape client (SDK 1.18.10+) ---")

	await okAsync("wrapper shape returns markdown table with root sessions", async () => {
		const mockClient = {
			session: {
				list: async () => ({
					data: [subSession, sessionA, sessionB],
					error: undefined,
					request: {},
					response: {},
				}),
			},
		}
		const result = await pluginFn({ client: mockClient })
		const def = result.tool.recent_sessions
		const output = await def.execute({ count: 10 }, {})

		assert.notStrictEqual(
			output,
			"No sessions available.",
			"Should NOT return 'No sessions available.' for wrapper-shape response"
		)
		assert.ok(
			output.includes("| # | Title | Working Directory | Last Active | ISO Timestamp | Resume |"),
			"Output should contain the markdown table header"
		)
		assert.ok(
			output.includes("Alpha Session"),
			"Output should contain 'Alpha Session'"
		)
		assert.ok(
			output.includes("Beta Session"),
			"Output should contain 'Beta Session'"
		)
		assert.ok(
			!output.includes("Child Sub-session"),
			"Output should NOT contain sub-session 'Child Sub-session'"
		)
	})

	// --- Raw-array client (legacy SDK behavior) ---
	console.log("\n--- execute: raw-array client (legacy SDK) ---")

	await okAsync("raw-array returns markdown table with root sessions", async () => {
		const mockClient = {
			session: {
				list: async () => [subSession, sessionA, sessionB],
			},
		}
		const result = await pluginFn({ client: mockClient })
		const def = result.tool.recent_sessions
		const output = await def.execute({ count: 10 }, {})

		assert.notStrictEqual(
			output,
			"No sessions available.",
			"Should NOT return 'No sessions available.' for raw-array response"
		)
		assert.ok(
			output.includes("| # | Title | Working Directory | Last Active | ISO Timestamp | Resume |"),
			"Output should contain the markdown table header"
		)
		assert.ok(
			output.includes("Alpha Session"),
			"Output should contain 'Alpha Session'"
		)
		assert.ok(
			output.includes("Beta Session"),
			"Output should contain 'Beta Session'"
		)
		assert.ok(
			!output.includes("Child Sub-session"),
			"Output should NOT contain sub-session 'Child Sub-session'"
		)
	})
}

// --- Summary (after all tests including async) ---
await runExecuteTests()
console.log(`\n${passed} passed, ${failed} failed.\n`)
process.exit(failed > 0 ? 1 : 0)