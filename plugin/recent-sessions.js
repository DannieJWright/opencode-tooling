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

					return withNote("No OpenCode database path resolved. Run opencode once to initialize.", await listProjectScoped(client, limit))
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
