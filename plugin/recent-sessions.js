import { tool } from "@opencode-ai/plugin"
import { homedir } from "node:os"
import { join } from "node:path"

// --- Database path resolution (kept for backward compatibility / testing) ---

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

// --- Session read helpers (SQLite direct access — kept for backward compat / testing) ---

const SESSION_COLUMNS = ["id", "title", "directory", "time_created", "time_updated", "parent_id", "time_archived"]

export function checkSchema(db) {
	if (!db?.query) return false
	const result = db.query(
		"SELECT COUNT(*) AS c FROM pragma_table_info('session') WHERE name IN ('id','title','directory','time_created','time_updated','parent_id','time_archived')"
	)
	if (!result?.get) return false
	const row = result.get()
	return row.c === SESSION_COLUMNS.length
}

export function querySessions(db, limit, includeArchived) {
	if (!db?.query) return []
	const archivedFilter = includeArchived ? "" : "AND time_archived IS NULL"
	const result = db.query(
		`SELECT id, title, directory, time_updated, time_created FROM session
		 WHERE parent_id IS NULL ${archivedFilter}
		 ORDER BY time_updated DESC
		 LIMIT ?`
	)
	if (!result?.all) return []
	return result.all(limit)
}

export function readSessions(dbPath, DatabaseImpl, limit, includeArchived) {
	if (typeof DatabaseImpl !== "function") return { error: "missing", path: dbPath ?? "" }
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

// --- Experimental API session fetch ---

async function fetchGlobalSessions(client, serverUrl, limit, includeArchived) {
	const url = new URL("/experimental/session", serverUrl)
	url.searchParams.set("limit", String(Math.min(limit, 100)))
	url.searchParams.set("archived", String(includeArchived))

	const response = await fetch(url.toString())
	if (!response.ok) throw new Error(`experimental session endpoint failed: ${response.status}`)

	const data = await response.json()
	const sessions = Array.isArray(data) ? data : data?.data ?? []
	if (!Array.isArray(sessions) || sessions.length === 0) return null
	return sessions
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

export default async ({ client, serverUrl }, { experimentalFetch = (limit, includeArchived) => fetchGlobalSessions(client, serverUrl, limit, includeArchived) } = {}) => {
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

					// Primary: fetch from the experimental session endpoint (global sessions, no project filter)
					let apiError = false
					try {
						const sessions = await experimentalFetch(limit, includeArchived)
						if (sessions && sessions.length > 0) {
							const table = formatTable(sessions, limit)
							return table ?? "No recent sessions found."
						}
						// Empty result (not an error) — no sessions exist
						return "No recent sessions found."
					} catch {
						apiError = true
					}

					if (apiError) {
						// Fallback: project-scoped sessions
						return withNote(
							"Could not fetch global sessions. Showing project-scoped sessions instead.",
							await listProjectScoped(client, limit)
						)
					}
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
