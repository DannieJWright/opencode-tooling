// Test: recent-sessions plugin - formatRelativeTime, getResumeCmd, execute path
//
// Dynamically imports the real functions from the ESM plugin file.
// Uses fixed timestamps for deterministic test results.

import assert from "node:assert"
import { resolve, dirname } from "node:path"
import { pathToFileURL, fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))

// ---- Dynamic import of real plugin functions ----
const pluginPath = resolve(__dirname, "..", "plugin", "recent-sessions.js")
let formatRelativeTime, getResumeCmd, resolveDbPath, getFallbackDbPath, checkSchema, querySessions, readSessions
try {
	const plugin = await import(pathToFileURL(pluginPath).href)
	formatRelativeTime = plugin.formatRelativeTime
	getResumeCmd = plugin.getResumeCmd
	resolveDbPath = plugin.resolveDbPath
	getFallbackDbPath = plugin.getFallbackDbPath
	checkSchema = plugin.checkSchema
	querySessions = plugin.querySessions
	readSessions = plugin.readSessions
} catch (e) {
	console.error(`[FATAL] Could not import plugin: ${e.message}`)
	process.exit(1)
}

let passed = 0
let failed = 0

// --- resolveDbPath / getFallbackDbPath ---
console.log("\n--- resolveDbPath / getFallbackDbPath ---")

ok("getFallbackDbPath: returns correct path", () => {
	assert.ok(getFallbackDbPath({ home: "/home/test" }).endsWith("opencode.db"))
})

await okAsync("resolveDbPath: uses CLI output (trimmed)", async () => {
	const path = await resolveDbPath({ exec: async () => "C:\\real\\opencode.db\n" })
	assert.strictEqual(path, "C:\\real\\opencode.db")
})

await okAsync("resolveDbPath: falls back to platform convention when CLI throws", async () => {
	const path = await resolveDbPath({
		exec: async () => { throw new Error("cli unavailable") },
		home: "/home/test",
	})
	assert.ok(path.endsWith("opencode.db"))
})

await okAsync("resolveDbPath: falls back when CLI returns empty", async () => {
	const path = await resolveDbPath({ exec: async () => "   ", home: "/home/test" })
	assert.ok(path.endsWith("opencode.db"))
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

// --- Defensive export guards ---
console.log("\n--- Defensive export guards ---")

ok("checkSchema(undefined) returns false", () => {
	assert.strictEqual(checkSchema(undefined), false)
})

ok("checkSchema(null) returns false", () => {
	assert.strictEqual(checkSchema(null), false)
})

ok("checkSchema({}) returns false — no .query", () => {
	assert.strictEqual(checkSchema({}), false)
})

ok("checkSchema({ query: null }) returns false — query is not a function", () => {
	assert.strictEqual(checkSchema({ query: null }), false)
})

ok("checkSchema({ query: () => null }) returns false — query returns null (no .get)", () => {
	assert.strictEqual(checkSchema({ query: () => null }), false)
})

ok("checkSchema({ query: () => ({}) }) returns false — query returns object without .get", () => {
	assert.strictEqual(checkSchema({ query: () => ({}) }), false)
})

ok("querySessions(undefined) returns []", () => {
	assert.deepStrictEqual(querySessions(undefined), [])
})

ok("querySessions(null) returns []", () => {
	assert.deepStrictEqual(querySessions(null), [])
})

ok("querySessions({}) returns [] — no .query", () => {
	assert.deepStrictEqual(querySessions({}), [])
})

ok("querySessions({ query: null }) returns [] — query is not a function", () => {
	assert.deepStrictEqual(querySessions({ query: null }), [])
})

ok("querySessions({ query: () => null }) returns [] — query returns null (no .all)", () => {
	assert.deepStrictEqual(querySessions({ query: () => null }), [])
})

ok("querySessions({ query: () => ({}) }) returns [] — query returns object without .all", () => {
	assert.deepStrictEqual(querySessions({ query: () => ({}) }), [])
})

ok("readSessions with undefined DatabaseImpl returns error object", () => {
	const result = readSessions("/some/path", undefined, 10, false)
	assert.strictEqual(result.error, "missing")
})

ok("readSessions with null DatabaseImpl returns error object", () => {
	const result = readSessions("/some/path", null, 10, false)
	assert.strictEqual(result.error, "missing")
})

ok("readSessions with string DatabaseImpl returns error object — truthy but not a function", () => {
	const result = readSessions("/some/path", "not-a-constructor", 10, false)
	assert.strictEqual(result.error, "missing")
})

ok("readSessions with plain object DatabaseImpl returns error object — truthy but not a constructor", () => {
	const result = readSessions("/some/path", {}, 10, false)
	assert.strictEqual(result.error, "missing")
})

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

// ---- Session fixtures (experimental API shape — DB column names) ----

const globalSessionA = {
	id: "ses_alpha",
	title: "Alpha Session",
	directory: "/proj/alpha",
	time_created: 1700000000000,
	time_updated: 1700000100000,
	parent_id: null,
	time_archived: null,
}

const globalSessionB = {
	id: "ses_beta",
	title: "Beta Session",
	directory: "/proj/beta",
	time_created: 1700000000000,
	time_updated: 1700000200000,
	parent_id: null,
	time_archived: null,
}

const globalArchived = {
	id: "ses_arch",
	title: "Archived Session",
	directory: "/proj/arch",
	time_created: 1700000000000,
	time_updated: 1700000300000,
	parent_id: null,
	time_archived: 1700000400000,
}

const globalSubSession = {
	id: "ses_child",
	title: "Child Sub-session",
	directory: "/proj/alpha",
	time_created: 1700000000000,
	time_updated: 1700000500000,
	parent_id: "ses_alpha",
	time_archived: null,
}

// Project-scoped fallback fixtures (old API shape — still used by listProjectScoped)
const projectSessionA = {
	id: "ses_alpha",
	title: "Alpha Session",
	directory: "/proj/alpha",
	parentID: undefined,
	time: { created: 1700000000000, updated: 1700000100000 },
}

const projectSessionB = {
	id: "ses_beta",
	title: "Beta Session",
	directory: "/proj/beta",
	parentID: undefined,
	time: { created: 1700000000000, updated: 1700000200000 },
}

const projectSubSession = {
	id: "ses_child",
	title: "Child Sub-session",
	directory: "/proj/alpha",
	parentID: "ses_alpha",
	time: { created: 1700000000000, updated: 1700000300000 },
}

// ---- Execute-path tests (experimental API-backed) ----

async function runExecuteTests() {
	const mod = await import(pathToFileURL(pluginPath).href)
	const pluginFn = mod.default

	// --- Experimental API success path ---
	console.log("\n--- execute: experimental API read path ---")

	await okAsync("API read: root-only, sorted by recency, archived excluded", async () => {
		const result = await pluginFn({}, {
			experimentalFetch: async () => [globalSubSession, globalSessionA, globalSessionB],
		})
		const output = await result.tool.recent_sessions.execute({ count: 10 }, {})

		assert.ok(output.includes("| # | Title | Working Directory | Last Active | ISO Timestamp | Resume |"), "Output should contain the markdown table header")
		assert.ok(output.includes("| 1 | Beta Session |"), "Most recent root session should be first")
		assert.ok(output.includes("| 2 | Alpha Session |"), "Second root session should follow")
		assert.ok(!output.includes("Child Sub-session"), "Output should NOT contain sub-session 'Child Sub-session'")
		assert.ok(!output.includes("Archived Session"), "Output should NOT contain archived sessions by default")
	})

	await okAsync("API read: includeArchived includes archived sessions", async () => {
		const result = await pluginFn({}, {
			experimentalFetch: async (_limit, includeArchived) => {
				const base = [globalSubSession, globalSessionA, globalSessionB]
				return includeArchived ? [...base, globalArchived] : base
			},
		})
		const output = await result.tool.recent_sessions.execute({ count: 10, includeArchived: true }, {})

		assert.ok(output.includes("| 1 | Archived Session |"), "Archived session (time_updated 1700000300000) should be first when included")
		assert.ok(output.includes("Beta Session"), "Output should contain 'Beta Session'")
		assert.ok(output.includes("Alpha Session"), "Output should contain 'Alpha Session'")
		assert.ok(!output.includes("Child Sub-session"), "Sub-session must remain excluded")
	})

	await okAsync("API read: count parameter limits rows", async () => {
		const result = await pluginFn({}, {
			experimentalFetch: async () => [globalSubSession, globalSessionA, globalSessionB],
		})
		const output = await result.tool.recent_sessions.execute({ count: 1 }, {})

		assert.ok(output.includes("| 1 | Beta Session |"), "Most recent session should be present")
		assert.ok(!output.includes("| 2 |"), "No second row when count=1")
		assert.ok(!output.includes("Alpha Session"), "Alpha should be omitted when count=1")
	})

	await okAsync("API read: count above max clamps to 50 rows", async () => {
		const fiftyOneSessions = Array.from({ length: 60 }, (_, i) => ({
			id: `ses_${i}`,
			title: `Session ${i}`,
			directory: "/proj/x",
			time_created: 1700000000000 + i * 1000,
			time_updated: 1700000000000 + i * 1000,
			parent_id: null,
			time_archived: null,
		}))
		const result = await pluginFn({}, {
			experimentalFetch: async () => fiftyOneSessions,
		})
		const output = await result.tool.recent_sessions.execute({ count: 100 }, {})

		assert.ok(output.includes("| 50 |"), "Row 50 should be present (max clamp boundary)")
		assert.ok(!output.includes("| 51 |"), "Row 51 should NOT be present (count clamped to 50)")
	})

	await okAsync("API read: count below min clamps to 1 row", async () => {
		const result = await pluginFn({}, {
			experimentalFetch: async () => [globalSessionA, globalSessionB],
		})
		const output = await result.tool.recent_sessions.execute({ count: 0 }, {})

		assert.ok(output.includes("| 1 | Beta Session |"), "Most recent session (Beta) should be present")
		assert.ok(!output.includes("| 2 |"), "No second row when count=0 (clamped to 1)")
		assert.ok(!output.includes("Alpha Session"), "Alpha should be omitted when count=0")
	})

	await okAsync("API read: empty result returns 'No recent sessions found.'", async () => {
		const result = await pluginFn({}, {
			experimentalFetch: async () => [],
		})
		const output = await result.tool.recent_sessions.execute({ count: 10 }, {})

		assert.strictEqual(output, "No recent sessions found.")
	})

	// --- Fallback paths ---
	console.log("\n--- execute: fallback paths ---")

	await okAsync("API failure: graceful message + project-scoped fallback (wrapper shape)", async () => {
		let capturedOptions
		const client = {
			session: {
				list: async (options) => {
					capturedOptions = options
					return { data: [projectSubSession, projectSessionA, projectSessionB], error: undefined }
				},
			},
		}
		const result = await pluginFn({ client }, {
			experimentalFetch: async () => { throw new Error("experimental endpoint unavailable") },
		})
		const output = await result.tool.recent_sessions.execute({ count: 10 }, {})

		assert.ok(output.includes("Could not fetch global sessions."), "Message should announce experimental API failure")
		assert.ok(output.includes("Showing project-scoped sessions instead."), "Message should announce fallback")
		assert.deepStrictEqual(capturedOptions.query, { scope: "project" }, "Fallback should pass { query: { scope: 'project' } }")
		assert.ok(output.includes("| # | Title | Working Directory | Last Active | ISO Timestamp | Resume |"), "Fallback should include the table header")
		assert.ok(output.includes("Beta Session"), "Fallback table should contain root sessions from the API")
		assert.ok(!output.includes("Child Sub-session"), "Fallback table should exclude sub-sessions")
	})

	await okAsync("API failure: project-scoped fallback (raw array shape)", async () => {
		const client = {
			session: {
				list: async () => [projectSubSession, projectSessionA, projectSessionB],
			},
		}
		const result = await pluginFn({ client }, {
			experimentalFetch: async () => { throw new Error("endpoint unreachable") },
		})
		const output = await result.tool.recent_sessions.execute({ count: 10 }, {})

		assert.ok(output.includes("| # | Title | Working Directory | Last Active | ISO Timestamp | Resume |"), "Raw-array fallback should include the table header")
		assert.ok(output.includes("Alpha Session"), "Raw-array fallback should contain root sessions")
		assert.ok(!output.includes("Child Sub-session"), "Raw-array fallback should exclude sub-sessions")
	})

	await okAsync("Both API failure + project-scoped failure: graceful message", async () => {
		const client = {
			session: {
				list: async () => { throw new Error("project API also unavailable") },
			},
		}
		const result = await pluginFn({ client }, {
			experimentalFetch: async () => { throw new Error("experimental endpoint unavailable") },
		})
		const output = await result.tool.recent_sessions.execute({ count: 10 }, {})

		assert.ok(output.includes("Could not fetch global sessions."), "Should mention the primary failure")
		assert.ok(!output.includes("| # |"), "No table when all paths fail")
	})

	await okAsync("Primary success: fallback client should not be called", async () => {
		let fallbackCalled = false
		const client = {
			session: {
				list: async () => {
					fallbackCalled = true
					return { data: [projectSessionA, projectSessionB] }
				},
			},
		}
		const result = await pluginFn({ client }, {
			experimentalFetch: async () => [globalSessionA, globalSessionB],
		})
		const output = await result.tool.recent_sessions.execute({ count: 10 }, {})

		assert.ok(output.includes("Beta Session"), "Should contain sessions from primary path")
		assert.ok(!fallbackCalled, "Fallback client should NOT be called when primary succeeds")
		assert.ok(!output.includes("Showing project-scoped sessions instead."), "No fallback note when primary succeeds")
	})
}

// --- Summary (after all tests including async) ---
await runExecuteTests()
console.log(`\n${passed} passed, ${failed} failed.\n`)
process.exit(failed > 0 ? 1 : 0)
