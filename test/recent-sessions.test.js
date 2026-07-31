// Test: recent-sessions plugin - formatRelativeTime, getResumeCmd, execute path
//
// Dynamically imports the real functions from the ESM plugin file.
// Uses fixed timestamps for deterministic test results.

import assert from "node:assert"
import { resolve, dirname, join as pathJoin, posix, win32 } from "node:path"
import { pathToFileURL, fileURLToPath } from "node:url"
import { mkdtempSync } from "node:fs"
import { platform, tmpdir } from "node:os"
import { Database } from "bun:sqlite"

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

// ---- Execute-path tests (SQLite-backed) ----

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

// API-shape fixtures (above) feed the fallback path (project-scoped API listing).
// DB-shape fixtures (below) use the real session-table column names.
const dbSessionA = { id: "ses_alpha", title: "Alpha Session", directory: "C:\\proj\\alpha", time_created: 1700000000000, time_updated: 1700000100000, parent_id: null, time_archived: null }
const dbSessionB = { id: "ses_beta", title: "Beta Session", directory: "C:\\proj\\beta", time_created: 1700000000000, time_updated: 1700000200000, parent_id: null, time_archived: null }
const dbArchived = { id: "ses_arch", title: "Archived Session", directory: "C:\\proj\\arch", time_created: 1700000000000, time_updated: 1700000300000, parent_id: null, time_archived: 1700000400000 }
const dbSubSession = { id: "ses_child", title: "Child Sub-session", directory: "C:\\proj\\alpha", time_created: 1700000000000, time_updated: 1700000500000, parent_id: "ses_alpha", time_archived: null }

const SESSION_TABLE_SQL = `CREATE TABLE session (
	id TEXT PRIMARY KEY,
	title TEXT NOT NULL,
	directory TEXT NOT NULL,
	time_created INTEGER NOT NULL,
	time_updated INTEGER NOT NULL,
	parent_id TEXT,
	time_archived INTEGER
)`

function createSeedDb(rows) {
	const dir = mkdtempSync(pathJoin(tmpdir(), "rs-test-"))
	const dbPath = pathJoin(dir, "test.db")
	const db = new Database(dbPath)
	db.run(SESSION_TABLE_SQL)
	const insert = db.prepare(
		"INSERT INTO session (id, title, directory, time_created, time_updated, parent_id, time_archived) VALUES (?, ?, ?, ?, ?, ?, ?)"
	)
	for (const r of rows) insert.run(r.id, r.title, r.directory, r.time_created, r.time_updated, r.parent_id ?? null, r.time_archived ?? null)
	db.close()
	return dbPath
}

function createSchemaMismatchDb() {
	const dir = mkdtempSync(pathJoin(tmpdir(), "rs-bad-"))
	const dbPath = pathJoin(dir, "test.db")
	const db = new Database(dbPath)
	db.run("CREATE TABLE session (id TEXT PRIMARY KEY, title TEXT NOT NULL)")
	db.close()
	return dbPath
}

const mustNotFallbackClient = {
	session: {
		list: async () => {
			throw new Error("fallback client should not be called")
		},
	},
}

async function runExecuteTests() {
	const mod = await import(pathToFileURL(pluginPath).href)
	const pluginFn = mod.default

	// --- SQLite-backed success path ---
	console.log("\n--- execute: SQLite-backed read path ---")

	await okAsync("DB read: root-only, sorted by recency, archived excluded", async () => {
		const dbPath = createSeedDb([dbSubSession, dbSessionA, dbSessionB])
		const result = await pluginFn({ client: mustNotFallbackClient }, { dbPathResolver: async () => dbPath })
		const output = await result.tool.recent_sessions.execute({ count: 10 }, {})

		assert.ok(output.includes("| # | Title | Working Directory | Last Active | ISO Timestamp | Resume |"), "Output should contain the markdown table header")
		assert.ok(output.includes("| 1 | Beta Session |"), "Most recent root session should be first")
		assert.ok(output.includes("| 2 | Alpha Session |"), "Second root session should follow")
		assert.ok(!output.includes("Child Sub-session"), "Output should NOT contain sub-session 'Child Sub-session'")
		assert.ok(!output.includes("Archived Session"), "Output should NOT contain archived sessions by default")
	})

	await okAsync("DB read: includeArchived includes archived sessions", async () => {
		const dbPath = createSeedDb([dbSubSession, dbSessionA, dbSessionB, dbArchived])
		const result = await pluginFn({ client: mustNotFallbackClient }, { dbPathResolver: async () => dbPath })
		const output = await result.tool.recent_sessions.execute({ count: 10, includeArchived: true }, {})

		assert.ok(output.includes("| 1 | Archived Session |"), "Archived session (time_updated 1700000300000) should be first when included")
		assert.ok(output.includes("Beta Session"), "Output should contain 'Beta Session'")
		assert.ok(output.includes("Alpha Session"), "Output should contain 'Alpha Session'")
		assert.ok(!output.includes("Child Sub-session"), "Sub-session must remain excluded")
	})

	await okAsync("DB read: count parameter limits rows", async () => {
		const dbPath = createSeedDb([dbSubSession, dbSessionA, dbSessionB])
		const result = await pluginFn({ client: mustNotFallbackClient }, { dbPathResolver: async () => dbPath })
		const output = await result.tool.recent_sessions.execute({ count: 1 }, {})

		assert.ok(output.includes("| 1 | Beta Session |"), "Most recent session should be present")
		assert.ok(!output.includes("| 2 |"), "No second row when count=1")
		assert.ok(!output.includes("Alpha Session"), "Alpha should be omitted when count=1")
	})

	await okAsync("DB read: count above max clamps to 50 rows", async () => {
		const sixtySessions = Array.from({ length: 60 }, (_, i) => ({
			id: "ses_" + i,
			title: "Session " + i,
			directory: "C:\\proj\\x",
			time_created: 1700000000000 + i * 1000,
			time_updated: 1700000000000 + i * 1000,
			parent_id: null,
			time_archived: null,
		}))
		const dbPath = createSeedDb(sixtySessions)
		const result = await pluginFn({ client: mustNotFallbackClient }, { dbPathResolver: async () => dbPath })
		const output = await result.tool.recent_sessions.execute({ count: 100 }, {})

		assert.ok(output.includes("| 50 |"), "Row 50 should be present (max clamp boundary)")
		assert.ok(!output.includes("| 51 |"), "Row 51 should NOT be present (count clamped to 50)")
	})

	await okAsync("DB read: count below min clamps to 1 row", async () => {
		const dbPath = createSeedDb([dbSessionA, dbSessionB])
		const result = await pluginFn({ client: mustNotFallbackClient }, { dbPathResolver: async () => dbPath })
		const output = await result.tool.recent_sessions.execute({ count: 0 }, {})

		assert.ok(output.includes("| 1 | Beta Session |"), "Most recent session (Beta) should be present")
		assert.ok(!output.includes("| 2 |"), "No second row when count=0 (clamped to 1)")
		assert.ok(!output.includes("Alpha Session"), "Alpha should be omitted when count=0")
	})

	await okAsync("DB read: empty table returns 'No recent sessions found.'", async () => {
		const dbPath = createSeedDb([])
		const result = await pluginFn({ client: mustNotFallbackClient }, { dbPathResolver: async () => dbPath })
		const output = await result.tool.recent_sessions.execute({ count: 10 }, {})

		assert.strictEqual(output, "No recent sessions found.")
	})

	// --- Fallback paths ---
	console.log("\n--- execute: fallback paths ---")

	await okAsync("DB missing: graceful message + project-scoped fallback (wrapper shape)", async () => {
		let capturedOptions
		const client = {
			session: {
				list: async (options) => {
					capturedOptions = options
					return { data: [subSession, sessionA, sessionB], error: undefined }
				},
			},
		}
		const missingPath = pathJoin(tmpdir(), "rs-missing-" + Date.now(), "opencode.db")
		const result = await pluginFn({ client }, { dbPathResolver: async () => missingPath })
		const output = await result.tool.recent_sessions.execute({ count: 10 }, {})

		assert.ok(output.includes(`No OpenCode database found at ${missingPath}`), "Message should include the missing DB path")
		assert.ok(output.includes("Run opencode once to initialize."), "Message should include the init hint")
		assert.deepStrictEqual(capturedOptions.query, { scope: "project" }, "Fallback should pass { query: { scope: 'project' } }")
		assert.ok(output.includes("| # | Title | Working Directory | Last Active | ISO Timestamp | Resume |"), "Fallback should include the table header")
		assert.ok(output.includes("Beta Session"), "Fallback table should contain root sessions from the API")
		assert.ok(!output.includes("Child Sub-session"), "Fallback table should exclude sub-sessions")
	})

	await okAsync("DB missing: project-scoped fallback (raw array shape)", async () => {
		const client = {
			session: {
				list: async () => [subSession, sessionA, sessionB],
			},
		}
		const missingPath = pathJoin(tmpdir(), "rs-missing-" + Date.now(), "opencode.db")
		const result = await pluginFn({ client }, { dbPathResolver: async () => missingPath })
		const output = await result.tool.recent_sessions.execute({ count: 10 }, {})

		assert.ok(output.includes("| # | Title | Working Directory | Last Active | ISO Timestamp | Resume |"), "Raw-array fallback should include the table header")
		assert.ok(output.includes("Alpha Session"), "Raw-array fallback should contain root sessions")
		assert.ok(!output.includes("Child Sub-session"), "Raw-array fallback should exclude sub-sessions")
	})

	await okAsync("DB schema mismatch: message + project-scoped fallback", async () => {
		let capturedOptions
		const client = {
			session: {
				list: async (options) => {
					capturedOptions = options
					return { data: [sessionA, sessionB], error: undefined }
				},
			},
		}
		const badPath = createSchemaMismatchDb()
		const result = await pluginFn({ client }, { dbPathResolver: async () => badPath })
		const output = await result.tool.recent_sessions.execute({ count: 10 }, {})

		assert.ok(output.includes("OpenCode database schema incompatible. Showing project-scoped sessions instead."), "Message should announce schema mismatch")
		assert.deepStrictEqual(capturedOptions.query, { scope: "project" }, "Fallback should pass { query: { scope: 'project' } }")
		assert.ok(output.includes("Alpha Session"), "Fallback table should contain API sessions")
	})

	await okAsync("DB read error: retries once and recovers", async () => {
		let constructAttempts = 0
		class FlakyDatabase {
			constructor(path, opts) {
				constructAttempts++
				if (constructAttempts === 1) {
					const err = new Error("database is locked")
					err.code = "SQLITE_BUSY"
					throw err
				}
				this.db = new Database(path, opts)
			}
			query(sql) {
				return this.db.query(sql)
			}
			close() {
				this.db.close()
			}
		}
		const dbPath = createSeedDb([dbSubSession, dbSessionA, dbSessionB])
		const result = await pluginFn({ client: mustNotFallbackClient }, { dbPathResolver: async () => dbPath, DatabaseImpl: FlakyDatabase })
		const output = await result.tool.recent_sessions.execute({ count: 10 }, {})

		assert.strictEqual(constructAttempts, 2, "Read should be retried exactly once")
		assert.ok(output.includes("| 1 | Beta Session |"), "Recovered read should produce the table")
		assert.ok(!output.includes("Showing project-scoped sessions instead."), "No fallback note after successful retry")
	})

	await okAsync("DB read error: retry exhausted -> message + project-scoped fallback", async () => {
		let constructAttempts = 0
		class NeverDatabase {
			constructor() {
				constructAttempts++
				const err = new Error("database is locked")
				err.code = "SQLITE_BUSY"
				throw err
			}
			query() {
				throw new Error("unreachable")
			}
			close() {}
		}
		let capturedOptions
		const client = {
			session: {
				list: async (options) => {
					capturedOptions = options
					return { data: [sessionA, sessionB], error: undefined }
				},
			},
		}
		const dbPath = createSeedDb([dbSessionA, dbSessionB])
		const result = await pluginFn({ client }, { dbPathResolver: async () => dbPath, DatabaseImpl: NeverDatabase })
		const output = await result.tool.recent_sessions.execute({ count: 10 }, {})

		assert.strictEqual(constructAttempts, 2, "Read should be retried exactly once before falling back")
		assert.ok(output.includes("Failed to read session database: database is locked. Showing project-scoped sessions instead."), "Message should announce read failure and fallback")
		assert.deepStrictEqual(capturedOptions.query, { scope: "project" }, "Fallback should pass { query: { scope: 'project' } }")
	})
}

// --- Summary (after all tests including async) ---
await runExecuteTests()
console.log(`\n${passed} passed, ${failed} failed.\n`)
process.exit(failed > 0 ? 1 : 0)