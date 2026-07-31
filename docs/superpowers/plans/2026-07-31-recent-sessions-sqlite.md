# Pivot `recent_sessions` to Direct SQLite Database Access — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pivot the `recent_sessions` plugin tool from `client.session.list()` to direct read-only access of the OpenCode SQLite database via `bun:sqlite`, returning all root sessions from all working directories ordered by most recently active.

**Architecture:** The plugin resolves the database path (`opencode db path` CLI with a platform-convention fallback), opens it read-only via `bun:sqlite`, validates the schema against the required `session` columns via `pragma_table_info`, runs one parameterized query, and formats the results with the existing (unchanged) markdown table code. All DB failures degrade gracefully: a retry-once pass, then a fallback to `client.session.list({ query: { scope: "project" } })` with a note that output is project-scoped.

**Tech Stack:** Bun 1.3.14+ runtime (`bun:sqlite` built-in — no new npm dependency), `@opencode-ai/plugin` (existing, `^1.18.9`), node:os/node:path built-ins. Tests: existing custom `ok()`/`okAsync()` harness run via `bun`.

---

## Required Skills

> The agent executing this plan **MUST** invoke the `subagent-driven-development` skill for implementation execution.
>
> For large, high-risk, or multi-phase efforts, the agent **MUST** also invoke the `deepwork` skill.
>
> Do **NOT** read the content of these skills — just invoke them and follow their defined workflow. The skill descriptions in the system prompt tell you when each applies.

> **⚠️ BEFORE IMPLEMENTATION:** You must invoke the `subagent-driven-development` skill (and `deepwork` if this is a large effort). This is not optional. Do not skip this step.

---

## Global Constraints

Exact values copied verbatim from the spec (`docs/superpowers/specs/2026-07-31-recent-sessions-sqlite-design.md`). Every task's requirements implicitly include this section.

- **Self-containment:** `bun:sqlite` is a Bun runtime built-in. No new npm dependencies. No local imports (`./`, `../`).
- **Read-only access:** Open the DB with `new Database(dbPath, { readonly: true })`. Never write to the database.
- **Root sessions only:** `parent_id IS NULL` in the SQL `WHERE` clause.
- **Archived excluded by default:** `time_archived IS NULL` filter; the filter is removed entirely when `includeArchived` is `true`.
- **All projects included:** No `project_id` or `directory` filter — sessions from every project/directory.
- **Sorted by recency:** `ORDER BY time_updated DESC`. `time_updated` is NOT NULL with reliable values (Drizzle `$onUpdate(() => Date.now())`); the previous `COALESCE(time_updated, time_created)` was dead code — use `time_updated` directly.
- **Parameters:** `count` number, default `10`, clamped to `1–50`; `includeArchived` boolean, default `false`.
- **Tool description:** "List recent OpenCode sessions across all working directories, showing title, directory, and last activity time" (unchanged).
- **Output format (unchanged):** header `| # | Title | Working Directory | Last Active | ISO Timestamp | Resume |`, separator `|---|-------|-------------------|-------------|---------------|--------|`, per-row `| N | title | \`dir\` | relativeTime | \`isoTime\` | \`resumeCmd\` |` with `|` escaped as `\|` and fallbacks `"(untitled)"` / `"(no directory)"`.
- **Keep unchanged:** `formatRelativeTime(msTimestamp, now = Date.now())`, `getResumeCmd(sessionId)`, and markdown table formatting behavior.
- **DB path resolution:** primary `opencode db path` via `Bun.$` (CLI, `instance: false`, no server required); fallback `path.join(xdgData, 'opencode', 'opencode.db')`. No glob, no directory traversal, exact filename only (`opencode.db` stable channel / `opencode-<channel>.db` internal).
- **Error messages (verbatim):**
  | Scenario | Message |
  |----------|---------|
  | DB path not found | `No OpenCode database found at <path>. Run opencode once to initialize.` |
  | Schema mismatch (missing required columns) | `OpenCode database schema incompatible. Showing project-scoped sessions instead.` (triggers fallback) |
  | DB read/lock error (after retry) | `Failed to read session database: <reason>. Showing project-scoped sessions instead.` (triggers fallback) |
  | Empty results | `No recent sessions found.` |
- **All DB access** (open, validate, query, close) wrapped in try/catch. On failure: fall back to `client.session.list({ query: { scope: "project" } })` noting reduced scope.
- **Schema validation:** `SELECT COUNT(*) FROM pragma_table_info('session') WHERE name IN ('id','title','directory','time_created','time_updated','parent_id','time_archived')`; count must be 7, else schema mismatch → fallback.
- **Retry:** if a DB read throws (e.g. `SQLITE_BUSY` — possible only after OpenCode's ~5 s `busy_timeout`), retry once with a fresh connection, then fall back.
- **Conventional commits:** `feat(recent-sessions): <description>`.
- **Test runner:** tests MUST run with `bun` (`bun test/recent-sessions.test.js`). After this change `node` can no longer import the plugin (it resolves `bun:sqlite`).

---

## Grounded Facts (verified — do not re-research)

All grounding was verified against the real environment on 2026-07-31 (worktree `recent-sessions`, Bun 1.3.14, OpenCode 1.18.10) and authoritative sources. The executor can rely on these; re-verifying is optional.

### Real environment (this machine)
- `opencode db path` prints `C:\Users\Danni\.local\share\opencode\opencode.db` and exits 0, standalone, no server.
- `Bun.$`opencode db path`.text()` returns `"C:\\Users\\Danni\\.local\\share\\opencode\\opencode.db\n"` — **trailing newline must be trimmed**.
- `os.homedir()` returns `C:\Users\Danni`; the fallback `join(homedir(), ".local", "share", "opencode", "opencode.db")` exactly equals the real DB path.
- Real DB (`opencode.db`, 534 MB) has `opencode.db-wal` and `opencode.db-shm` files present. `journal_mode = wal`, `synchronous = 2` (NORMAL). (`busy_timeout` is per-connection; a fresh read-only connection reports 0 — OpenCode's own connection uses 5000.)
- Real `session` table: 29 columns. Required 7 verified present: `id` TEXT PK, `parent_id` TEXT nullable, `directory` TEXT NOT NULL, `title` TEXT NOT NULL, `time_created` INTEGER NOT NULL, `time_updated` INTEGER NOT NULL, `time_archived` INTEGER nullable.
- The spec's exact query was executed against the real DB: returns correct rows, 165 root non-archived sessions, 655 sub-sessions, 0 archived.

### bun:sqlite runtime behaviors (verified by execution on Bun 1.3.14)
- `new Database(path, { readonly: true })` on a **missing file throws** `SQLITE_CANTOPEN` (`errno: 14`, `code: "SQLITE_CANTOPEN"`, message `unable to open database file`) — this is the natural DB-not-found signal.
- Positional `?` binding works variadic (`stmt.all(2, 2)`) and as an array (`stmt.all([2, 2])`).
- Querying a missing table throws; `SELECT COUNT(*) FROM pragma_table_info('nope')` returns `{ c: 0 }` (schema validation sound).
- `db.close()` is sync and idempotent (double-close safe).
- `:memory:` in readonly mode is rejected — never used; all tests use real temp files.

### External API facts (verified against sources by @librarian — see `C:\Users\Danni\Documents\Git\ai-vault\opencode\core\bun-sqlite-opencode-db-api.md`)
- `Database` constructor second arg is `options?: number | DatabaseOptions`; option name is lowercase **`readonly`** (also `create`, `readwrite`, `safeIntegers`, `strict`). Source: oven-sh/bun `packages/bun-types/sqlite.d.ts`.
- `db.query(sql)` returns a cached `Statement` with `.all()`, `.get()`, `.run()`. Source: https://bun.com/docs/runtime/sqlite.
- `opencode db path` has `instance: false` (no server required), prints the path and nothing else. Source: https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/cli/cmd/db.ts.
- OpenCode opens its DB with `PRAGMA journal_mode = WAL`, `synchronous = NORMAL`, `busy_timeout = 5000`. Source: https://github.com/anomalyco/opencode/blob/dev/packages/core/src/database/database.ts.
- `time_updated` is set via Drizzle lifecycle `$onUpdate(() => Date.now())` (not a SQL DEFAULT) — NOT NULL and reliably populated. Source: https://github.com/anomalyco/opencode/blob/dev/packages/core/src/session/sql.ts.
- Windows data dir `%USERPROFILE%\.local\share\opencode`; DB filename `opencode.db` (stable) / `opencode-<channel>.db` (internal). Sources: https://github.com/anomalyco/opencode/blob/dev/packages/core/src/global.ts, `.../database/database.ts`.

### Current repo state (verified by reading files)
- `plugin/recent-sessions.js` — 72 lines, tab-indented, ESM. Default export plugin fn; named exports `formatRelativeTime`, `getResumeCmd`. Current execute calls `client.session.list({ query: { scope: "project" } })`, unwraps `{ data }` or raw array, filters `!s.parentID`, sorts by `time.updated || time.created`, builds the markdown table. `limit = Math.min(Math.max(1, count), 50)` already exists.
- `test/recent-sessions.test.js` — 267 lines, tab-indented. **Custom harness** (`ok()`/`okAsync()` + `node:assert`, `process.exit(failed > 0 ? 1 : 0)`), ESM dynamic import of the real plugin via `pathToFileURL`. 21 tests today: 16 `formatRelativeTime`, 2 `getResumeCmd`, 3 execute-path (scope param, wrapper shape, raw array). Run with `bun test/recent-sessions.test.js`.
- `commands/recent-sessions.md` — 6 lines; calls the `recent_sessions` tool. **No changes needed.**
- `package.json` — `{ "type": "module", "dependencies": { "@opencode-ai/plugin": "^1.18.9" } }`. No scripts, no devDependencies.
- No other plugin in the repo uses `bun:sqlite` or `opencode db path` yet — this is the first.

---

## Codebase State (fresh-session context)

| Path | Role |
|------|------|
| `plugin/recent-sessions.js` | The plugin being pivoted. Modify. |
| `test/recent-sessions.test.js` | Custom-harness test suite. Modify (add Task 1 tests; replace execute-path section in Task 2). |
| `commands/recent-sessions.md` | Command wrapper. Unchanged (verify only). |
| `docs/superpowers/specs/2026-07-31-recent-sessions-sqlite-design.md` | The approved spec this plan implements. |

Environment requirements: Bun ≥ 1.3.14 (`bun --version`), `opencode` CLI on PATH (`opencode db path` must work), `@opencode-ai/plugin` installed (`node_modules` present). All commands run from the worktree root `C:\Users\Danni\Documents\Git\opencode-tooling\.worktrees\recent-sessions`.

Verification criteria (global): `bun test/recent-sessions.test.js` exits 0 with `32 passed, 0 failed`; the Task 3 smoke test prints a real 5-row markdown table; `git status` shows only the intended files.

---

## Task 1: DB Path Resolution Helpers (`getFallbackDbPath`, `resolveDbPath`)

**Files:**
- Modify: `plugin/recent-sessions.js` — add `node:os`/`node:path` imports, `runDbPathCommand()`, and the two exported helpers (lines 1–2 area; helpers inserted after the import block, before the default export).
- Modify: `test/recent-sessions.test.js` — extend the plugin import block (lines 13–22) and add the new test section.

**Interfaces:**
- Produces (consumed by Task 2):
  - `getFallbackDbPath({ home = homedir() } = {}) → string` — platform-convention path `join(home, ".local", "share", "opencode", "opencode.db")`.
  - `resolveDbPath({ exec = runDbPathCommand, home = homedir() } = {}) → Promise<string | null>` — runs the CLI (trimmed); on throw/empty falls back to `getFallbackDbPath`; returns `null` only if even the fallback throws (defensive, effectively unreachable).

- [ ] **Step 1: Write the failing tests**

Extend the import block in `test/recent-sessions.test.js` (lines 13–22):

```js
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
```

Insert the new test section immediately after the import block (before the `// ---- Test helpers ----` section at line 24):

```js
// --- resolveDbPath / getFallbackDbPath ---
console.log("\n--- resolveDbPath / getFallbackDbPath ---")

ok("getFallbackDbPath: windows-style home", () => {
	assert.strictEqual(getFallbackDbPath({ home: "C:\\Users\\Test" }), "C:\\Users\\Test\\.local\\share\\opencode\\opencode.db")
})

ok("getFallbackDbPath: posix-style home", () => {
	assert.strictEqual(getFallbackDbPath({ home: "/home/test" }), "/home/test/.local/share/opencode/opencode.db")
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
	assert.strictEqual(path, "/home/test/.local/share/opencode/opencode.db")
})

await okAsync("resolveDbPath: falls back when CLI returns empty", async () => {
	const path = await resolveDbPath({ exec: async () => "   ", home: "C:\\Users\\Test" })
	assert.strictEqual(path, "C:\\Users\\Test\\.local\\share\\opencode\\opencode.db")
})
```

> Note: `ok`/`okAsync` are defined later in the file, but because these are function declarations hoisted to the top-level scope and the section runs at module top level after import, this works — the existing file already relies on the same pattern (e.g. `await runExecuteTests()` at the bottom).

- [ ] **Step 2: Run the tests to verify they fail**

Run: `bun test/recent-sessions.test.js`
Expected: `5 passed, 5 failed` (21 pre-existing pass; the 5 new tests fail with `getFallbackDbPath is not a function` / `resolveDbPath is not a function`). Exit code 1.

- [ ] **Step 3: Write the minimal implementation**

Add to `plugin/recent-sessions.js`, immediately after the import block (line 2) and before the default export (line 3). Preserve the file's existing **tab** indentation:

```js
import { homedir } from "node:os"
import { join } from "node:path"

async function runDbPathCommand() {
	const text = await Bun.$`opencode db path`.text()
	return String(text ?? "").trim()
}

export function getFallbackDbPath({ home = homedir() } = {}) {
	return join(home, ".local", "share", "opencode", "opencode.db")
}

export async function resolveDbPath({ exec = runDbPathCommand, home = homedir() } = {}) {
	try {
		const raw = await exec()
		const path = String(raw ?? "").trim()
		if (path) return path
	} catch {
		// CLI unavailable — fall through to platform convention
	}
	try {
		return getFallbackDbPath({ home })
	} catch {
		return null
	}
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bun test/recent-sessions.test.js`
Expected: `26 passed, 0 failed` (21 existing + 5 new). Exit code 0.

- [ ] **Step 5: Commit**

```bash
git add plugin/recent-sessions.js test/recent-sessions.test.js
git commit -m "feat(recent-sessions): add sqlite db path resolution helpers"
```

---

## Task 2: SQLite Read Path with `includeArchived`, Schema Validation, Retry, and Fallback

**Files:**
- Modify: `plugin/recent-sessions.js` — full rewrite (complete new file below). Keep `formatRelativeTime` and `getResumeCmd` byte-identical.
- Modify: `test/recent-sessions.test.js` — replace the execute-path section (current lines 131–262) with the new SQLite-backed section, and extend the top imports.

**Interfaces:**
- Consumes: `getFallbackDbPath`/`resolveDbPath` (Task 1), `Database` from `bun:sqlite`, `client` from the plugin input.
- Produces (the finished tool contract):
  - Plugin factory: `export default async ({ client }, { dbPathResolver = resolveDbPath, DatabaseImpl = Database } = {})` — the second parameter is the **test seam** (ignored by the OpenCode plugin loader).
  - Tool `recent_sessions`: args `count` (number, optional), `includeArchived` (boolean, optional); returns a markdown table string.
  - Outcome contract of `readSessions(dbPath, DatabaseImpl, limit, includeArchived)`:
    - `{ rows: [...] }` — success, DB-row shape `{ id, title, directory, time_updated, time_created }`
    - `{ error: "missing", path }` — constructor threw `SQLITE_CANTOPEN`
    - `{ error: "schema" }` — required columns not all present
    - throws — any other read failure (caller retries once, then maps to `{ error: "read", reason }`)

- [ ] **Step 1: Write the failing tests (replace the execute-path section)**

In `test/recent-sessions.test.js`, extend the top imports (lines 6–8):

```js
import assert from "node:assert"
import { resolve, dirname, join as pathJoin } from "node:path"
import { pathToFileURL, fileURLToPath } from "node:url"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { Database } from "bun:sqlite"
```

Delete the entire current execute-path section — from the `// ---- Execute-path tests (mocked client) ----` comment (line 131) through the end of `runExecuteTests()` (line 262) — and replace it with:

```js
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
```

> Expected failures against the OLD plugin (this step's red phase): the success-path tests fail because the old execute calls the client API (`mustNotFallbackClient` throws); the fallback tests fail because the old code never emits the new messages. All 9 new tests must fail; the 21 existing tests (16 + 2 + 5 from Task 1) still pass.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `bun test/recent-sessions.test.js`
Expected: `21 passed, 9 failed` (the old 3 execute tests are gone — removed by the section replacement — and the 9 new ones fail). Exit code 1.

- [ ] **Step 3: Write the implementation (full new plugin file)**

Replace the entire contents of `plugin/recent-sessions.js` with the following. Preserve **tab** indentation (matching the original file). `formatRelativeTime` and `getResumeCmd` are byte-identical to the current versions:

```js
import { tool } from "@opencode-ai/plugin"
import { Database } from "bun:sqlite"
import { homedir } from "node:os"
import { join } from "node:path"

const SESSION_COLUMNS = ["id", "title", "directory", "time_created", "time_updated", "parent_id", "time_archived"]

// --- Database path resolution ---

async function runDbPathCommand() {
	const text = await Bun.$`opencode db path`.text()
	return String(text ?? "").trim()
}

export function getFallbackDbPath({ home = homedir() } = {}) {
	return join(home, ".local", "share", "opencode", "opencode.db")
}

export async function resolveDbPath({ exec = runDbPathCommand, home = homedir() } = {}) {
	try {
		const raw = await exec()
		const path = String(raw ?? "").trim()
		if (path) return path
	} catch {
		// CLI unavailable — fall through to platform convention
	}
	try {
		return getFallbackDbPath({ home })
	} catch {
		return null
	}
}

// --- Session read helpers ---

function checkSchema(db) {
	const row = db
		.query(
			"SELECT COUNT(*) AS c FROM pragma_table_info('session') WHERE name IN ('id','title','directory','time_created','time_updated','parent_id','time_archived')"
		)
		.get()
	return row.c === SESSION_COLUMNS.length
}

function querySessions(db, limit, includeArchived) {
	// includeArchived is a boolean tool arg — the filter string is built from a
	// constant boolean, never from user input, so there is no injection risk.
	const archivedFilter = includeArchived ? "" : "AND time_archived IS NULL"
	return db
		.query(
			`SELECT id, title, directory, time_updated, time_created FROM session
			 WHERE parent_id IS NULL ${archivedFilter}
			 ORDER BY time_updated DESC
			 LIMIT ?`
		)
		.all(limit)
}

function readSessions(dbPath, DatabaseImpl, limit, includeArchived) {
	let db
	try {
		db = new DatabaseImpl(dbPath, { readonly: true })
	} catch (err) {
		if (err?.code === "SQLITE_CANTOPEN") return { error: "missing", path: dbPath }
		throw err
	}
	try {
		if (!checkSchema(db)) return { error: "schema" }
		return { rows: querySessions(db, limit, includeArchived) }
	} finally {
		db.close()
	}
}

// --- Output formatting (behavior unchanged from previous implementation) ---

function getSessionTime(s) {
	return s.time_updated ?? s.time?.updated ?? s.time?.created ?? 0
}

function formatTable(sessions, limit) {
	const recent = sessions
		.filter(s => !(s.parent_id ?? s.parentID))
		.sort((a, b) => getSessionTime(b) - getSessionTime(a))
		.slice(0, limit)

	if (recent.length === 0) return null

	const rows = recent.map((s, i) => {
		const time = getSessionTime(s)
		const relativeTime = formatRelativeTime(time)
		const isoTime = new Date(time).toISOString()
		const title = (s.title || "(untitled)").replace(/\|/g, "\\|")
		const dir = (s.directory || "(no directory)").replace(/\|/g, "\\|")
		return `| ${i + 1} | ${title} | \`${dir}\` | ${relativeTime} | \`${isoTime}\` | \`${getResumeCmd(s.id)}\` |`
	})

	const header = `| # | Title | Working Directory | Last Active | ISO Timestamp | Resume |`
	const separator = `|---|-------|-------------------|-------------|---------------|--------|`

	return [header, separator, ...rows].join("\n")
}

async function listProjectScoped(client, limit) {
	try {
		const result = await client.session.list({ query: { scope: "project" } })
		const sessions = Array.isArray(result) ? result : result?.data
		if (!Array.isArray(sessions)) return null
		return formatTable(sessions, limit)
	} catch {
		return null
	}
}

function withNote(note, table) {
	return table ? `${note}\n\n${table}` : note
}

// --- Tool ---

export default async ({ client }, { dbPathResolver = resolveDbPath, DatabaseImpl = Database } = {}) => {
	return {
		tool: {
			recent_sessions: tool({
				description: "List recent OpenCode sessions across all working directories, showing title, directory, and last activity time",
				args: {
					count: tool.schema.number().optional().describe("Number of recent sessions to show (default: 10, max: 50)"),
					includeArchived: tool.schema.boolean().optional().describe("Include archived sessions in results (default: false)"),
				},
				async execute(args = {}, _ctx) {
					const { count = 10, includeArchived = false } = args
					const limit = Math.min(Math.max(1, count), 50)

					let dbPath = null
					try {
						dbPath = await dbPathResolver()
					} catch {
						dbPath = null
					}

					if (dbPath) {
						let outcome
						for (let attempt = 0; attempt < 2; attempt++) {
							try {
								outcome = readSessions(dbPath, DatabaseImpl, limit, includeArchived)
								if (outcome.error) break
								return formatTable(outcome.rows, limit) ?? "No recent sessions found."
							} catch (err) {
								outcome = { error: "read", reason: err.message || String(err) }
							}
						}
						if (outcome.error === "missing") {
							return withNote(
								`No OpenCode database found at ${outcome.path}. Run opencode once to initialize.`,
								await listProjectScoped(client, limit)
							)
						}
						if (outcome.error === "schema") {
							return withNote(
								"OpenCode database schema incompatible. Showing project-scoped sessions instead.",
								await listProjectScoped(client, limit)
							)
						}
						if (outcome.error === "read") {
							return withNote(
								`Failed to read session database: ${outcome.reason}. Showing project-scoped sessions instead.`,
								await listProjectScoped(client, limit)
							)
						}
					}

					return withNote("No OpenCode database found. Run opencode once to initialize.", await listProjectScoped(client, limit))
				},
			}),
		},
	}
}

export function formatRelativeTime(msTimestamp, now = Date.now()) {
	const diffSeconds = Math.max(0, Math.floor((now - msTimestamp) / 1000))

	if (diffSeconds < 60) return "just now"
	if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} minute${Math.floor(diffSeconds / 60) !== 1 ? "s" : ""} ago`
	if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hour${Math.floor(diffSeconds / 3600) !== 1 ? "s" : ""} ago`
	if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)} day${Math.floor(diffSeconds / 86400) !== 1 ? "s" : ""} ago`
	if (diffSeconds < 2592000) return `${Math.floor(diffSeconds / 604800)} week${Math.floor(diffSeconds / 604800) !== 1 ? "s" : ""} ago`
	return `${Math.floor(diffSeconds / 2592000)} month${Math.floor(diffSeconds / 2592000) !== 1 ? "s" : ""} ago`
}

export function getResumeCmd(sessionId) {
	return `opencode -s ${sessionId}`
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bun test/recent-sessions.test.js`
Expected: `32 passed, 0 failed`. Exit code 0.

- [ ] **Step 5: Commit**

```bash
git add plugin/recent-sessions.js test/recent-sessions.test.js
git commit -m "feat(recent-sessions): read sessions from sqlite database with api fallback"
```

---

## Task 3: End-to-End Verification

**Files:**
- Verify: `commands/recent-sessions.md` (must remain unchanged)
- Create (ephemeral, NOT committed): `test/smoke-recent-sessions.js`

**Interfaces:** Consumes the finished Task 2 plugin. Produces verification evidence only.

- [ ] **Step 1: Run the full test suite**

Run: `bun test/recent-sessions.test.js`
Expected: `32 passed, 0 failed`, exit code 0.

- [ ] **Step 2: Confirm the command file is untouched**

Run: `git status --short commands/recent-sessions.md`
Expected: empty output (no modifications). If it changed, restore it — the command artifact must not change.

- [ ] **Step 3: Smoke-test the real-DB path end to end**

Create `test/smoke-recent-sessions.js` (ephemeral — delete after, do NOT commit):

```js
// Ephemeral smoke test — proves the real-DB read path end to end.
// Run: bun test/smoke-recent-sessions.js
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

const mod = await import(pathToFileURL(resolve("plugin/recent-sessions.js")).href)
const dbPath = await mod.resolveDbPath()
console.log("Resolved DB path:", dbPath)

const { default: pluginFn } = mod
const client = { session: { list: async () => ({ data: [], error: undefined }) } }
const { tool } = await pluginFn({ client })
const output = await tool.recent_sessions.execute({ count: 5 }, {})
console.log(output)
```

Run: `bun test/smoke-recent-sessions.js`
Expected: prints `Resolved DB path: C:\Users\Danni\.local\share\opencode\opencode.db` followed by a 5-row markdown table of REAL sessions (header `| # | Title | Working Directory | Last Active | ISO Timestamp | Resume |`), most recent first. On 2026-07-31 the top row was a session titled "Spec to plan conversion, human review" — any real session titles are acceptable as long as the table renders with 5 rows and no error note.

- [ ] **Step 4: Clean up and verify final state**

```bash
rm test/smoke-recent-sessions.js
git status --short
```

Expected: only `plugin/recent-sessions.js` and `test/recent-sessions.test.js` modified (both already committed in Tasks 1–2; `git status` clean). No commit needed for this task.

---

## Plan Decisions for Review

Intentional interpretations made while converting the spec — flag if any are wrong:

1. **DB-not-found also falls back.** The spec's message table lists "DB path not found" without an explicit "(triggers fallback)", but the Error Handling section says all DB failures degrade to the project-scoped fallback. This plan appends the fallback table after the not-found message (message line + blank line + table).
2. **Retry covers all read errors, not only `SQLITE_BUSY`.** The retry-once loop retries any thrown DB read error once with a fresh connection, then falls back. `SQLITE_CANTOPEN` (missing file) and schema mismatch short-circuit without retry.
3. **Tests require `bun`.** The plugin now imports `bun:sqlite`, so `node test/recent-sessions.test.js` can no longer work. The plan pins the command to `bun`.
4. **Single `xdgData` convention.** Both spec rows resolve to `<home>/.local/share` — verified identical on this Windows machine (`C:\Users\Danni\.local\share\opencode\opencode.db`), so `getFallbackDbPath` has no platform branch. `XDG_DATA_HOME` env override is intentionally NOT honored (out of spec scope).
5. **Fallback client failure yields note-only output.** If the API fallback also fails, the note line is returned without a table (`withNote` with `null` table).
6. **`resolveDbPath`'s `null` return is defensive.** The platform-convention fallback effectively always succeeds, so `null` is unreachable in practice; the `try/catch` preserving the spec's "returns null if neither succeeds" contract is untested by design (documented, not a placeholder).
7. **Test seam via plugin-factory second parameter.** `({ client }, { dbPathResolver, DatabaseImpl } = {})` is ignored by the OpenCode plugin loader and lets the custom harness inject paths/Database without mocking the `bun:sqlite` C++ binding. All real-DB tests use genuine `bun:sqlite` against seeded temp files.

---

## Self-Review (spec coverage)

- **Spec §Data Source / Path Resolution** → Task 1 (`resolveDbPath`/`getFallbackDbPath`; CLI primary, platform fallback; no glob/traversal). ✓
- **Spec §SQL Query** (exact SQL, `LIMIT ?`, `time_updated` not COALESCE) → Task 2 `querySessions`. ✓
- **Spec §Session Schema Reference** (7 columns) → `checkSchema` + verified real schema. ✓
- **Spec §Artifact plugin** (readonly open, `includeArchived`, schema validation, unchanged helpers, try/catch fallback) → Task 2. ✓
- **Spec §Artifact command** (no changes) → Task 3 Step 2. ✓
- **Spec §Tool Definition** (description, count 1–50 clamped, includeArchived default false, output format) → Task 2. ✓
- **Spec §Session Filtering** (root-only, archived default excluded, all projects, recency sort) → Task 2 tests. ✓
- **Spec §Schema Validation** (pragma_table_info count 7, fallback on mismatch) → Task 2. ✓
- **Spec §Error Handling** (all scenarios + messages, retry once on BUSY) → Task 2 (Decision 1/2 for the two interpretive points). ✓
- **Spec §Testing Strategy** (existing tests valid; resolveDbPath tests; execute-path tests; error-path tests) → Tasks 1–2 (32 tests). ✓
- **Spec §Success Criteria** 1–7 → Task 2 tests + Task 3 smoke. ✓
- **Spec §Not in Scope** (no writes, no filters, no search) → none added. ✓
- **AGENTS.md** (TDD in plan ✓; subagent-driven-development + deepwork requirements ✓ in Required Skills block; conventional commits ✓ `feat(recent-sessions): ...`).
