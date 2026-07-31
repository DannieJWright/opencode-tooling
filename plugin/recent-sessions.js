import { tool } from "@opencode-ai/plugin"

export default async ({ client }) => {
	return {
		tool: {
			recent_sessions: tool({
				description: "List recent OpenCode sessions across all working directories, showing title, directory, and last activity time",
				args: {
					count: tool.schema.number().optional().describe("Number of recent sessions to show (default: 10, max: 50)"),
				},
				async execute({ count = 10 }, _ctx) {
					const limit = Math.min(Math.max(1, count), 50)

					// Fetch all sessions (defensive unwrap: SDK 1.18.x returns { data, error, ... },
					// older SDKs return a raw array — both shapes must work)
					let sessions
					try {
						const result = await client.session.list()
						sessions = Array.isArray(result) ? result : result?.data
					} catch (err) {
						return `Failed to list sessions: ${err.message || err}`
					}

					// Guard against null/undefined/non-array responses
					if (!Array.isArray(sessions)) return "No sessions available."

					// Filter out sub-sessions and sort by last activity
					const rootSessions = sessions
						.filter(s => !s.parentID)
						.sort((a, b) => (b.time?.updated || b.time?.created || 0) - (a.time?.updated || a.time?.created || 0))

					const recent = rootSessions.slice(0, limit)

					if (recent.length === 0) {
						return "No recent sessions found."
					}

					const rows = recent.map((s, i) => {
						const time = s.time?.updated || s.time?.created || 0
						const relativeTime = formatRelativeTime(time)
						const isoTime = new Date(time).toISOString()
						const title = (s.title || "(untitled)").replace(/\|/g, "\\|")
						const dir = (s.directory || "(no directory)").replace(/\|/g, "\\|")
						return `| ${i + 1} | ${title} | \`${dir}\` | ${relativeTime} | \`${isoTime}\` | \`${getResumeCmd(s.id)}\` |`
					})

					const header = `| # | Title | Working Directory | Last Active | ISO Timestamp | Resume |`
					const separator = `|---|-------|-------------------|-------------|---------------|--------|`

					return [header, separator, ...rows].join("\n")
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
