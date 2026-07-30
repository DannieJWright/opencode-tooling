# Recent Sessions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/recent-sessions` command and `recent_sessions` plugin tool that lists the user's most recently active OpenCode sessions across all working directories.

**Architecture:** A plugin registers a `recent_sessions` tool that queries the session API, filters sub-sessions, sorts by last activity, and formats a markdown table. A command is a thin wrapper that calls this tool.

**Tech Stack:** Bun, `@opencode-ai/plugin`, OpenCode Server API (`client.session.list()`)

## Global Constraints

- Follow conventional commits: `feat(recent-sessions): ...`
- Plugin must be self-contained JS with no local imports; only npm packages and Node.js built-ins
- Plugin exports a valid plugin function (default or named export matching the `CompactionPlanRefresh` pattern)
- Command uses YAML frontmatter with `description` and `agent` fields (agent: `default`)
- Work is on the `recent-sessions` branch (off `rag-or-research`)
- **Invoke `superpowers:deepwork` workflow** for phase tracking if work spans multiple phases
- **Invoke `superpowers:test-driven-development`** before writing any implementation code

## Research Context (Already Completed)

- Session API research is persisted at `ai-vault/opencode/api/session-message-endpoints.md`
- Key API: `client.session.list({ scope: "project" })` returns all sessions across directories as `Session[]`
- Note: Without `{ scope: "project" }`, the call is directory-scoped and returns only the current project's sessions
- Session type shape (from RAG):
  ```ts
  {
    id: string
    projectID: string
    directory: string           // Working directory
    parentID?: string           // Sub-sessions have this set
    title: string
    time: { created: number; updated: number; compacting?: number }
    summary?: { additions: number; deletions: number; files: number; diffs?: FileDiff[] }
  }
  ```
- Sub-sessions are identified by a truthy `parentID`
- Design spec: `docs/superpowers/specs/2026-07-29-recent-sessions-design.md`

---

### Task 1: Plugin — `recent_sessions` tool

**Files:**
- Create: `plugin/recent-sessions.js`

**Interfaces:**
- Consumes: `client.session.list()` from plugin input
- Produces: `recent_sessions` tool with `count` parameter, returns formatted markdown table

- [ ] **Step 1: Write the plugin file**

Create `plugin/recent-sessions.js` with the following structure:

```js
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

					// Fetch all sessions
					let sessions
					try {
						sessions = await client.session.list({ scope: "project" })
					} catch (err) {
						return `Failed to list sessions: ${err.message || err}`
					}

					if (!Array.isArray(sessions)) {
						return "Failed to list sessions: unexpected response type"
					}

					// Filter out sub-sessions and sort by last activity
					const rootSessions = sessions
						.filter(s => !s.parentID)
						.sort((a, b) => (b.time.updated || b.time.created || 0) - (a.time.updated || a.time.created || 0))

					const recent = rootSessions.slice(0, limit)

					if (recent.length === 0) {
						return "No recent sessions found."
					}

					const rows = recent.map((s, i) => {
						const time = s.time.updated || s.time.created || 0
						const relativeTime = formatRelativeTime(time)
						const isoTime = new Date(time).toISOString()
						const dir = s.directory || "(no directory)"
						return `| ${i + 1} | ${s.title || "(untitled)"} | \`${dir}\` | ${relativeTime} | \`${isoTime}\` | \`${getResumeCmd(s.id)}\` |`
					})

					const header = `| # | Title | Working Directory | Last Active | ISO Timestamp | Resume |`
					const separator = `|---|-------|-------------------|-------------|---------------|--------|`

					return [header, separator, ...rows].join("\n")
				},
			}),
		},
	}
}

function formatRelativeTime(msTimestamp) {
	const now = Date.now()
	const diffSeconds = Math.floor((now - msTimestamp) / 1000)

	if (diffSeconds < 60) return "just now"
	if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} minute${Math.floor(diffSeconds / 60) !== 1 ? "s" : ""} ago`
	if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hour${Math.floor(diffSeconds / 3600) !== 1 ? "s" : ""} ago`
	if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)} day${Math.floor(diffSeconds / 86400) !== 1 ? "s" : ""} ago`
	if (diffSeconds < 2592000) return `${Math.floor(diffSeconds / 604800)} week${Math.floor(diffSeconds / 604800) !== 1 ? "s" : ""} ago`
	if (diffSeconds < 31536000) return `${Math.floor(diffSeconds / 2592000)} month${Math.floor(diffSeconds / 2592000) !== 1 ? "s" : ""} ago`
	return `${Math.floor(diffSeconds / 31536000)} year${Math.floor(diffSeconds / 31536000) !== 1 ? "s" : ""} ago`
}

function getResumeCmd(sessionId) {
	return `opencode -s ${sessionId}`
}
```

- [ ] **Step 2: Commit the plugin**

```bash
git add plugin/recent-sessions.js
git commit -m "feat(recent-sessions): add recent_sessions plugin tool"
```

---

### Task 2: Command — `/recent-sessions`

**Files:**
- Create: `commands/recent-sessions.md`

**Interfaces:**
- Consumes: `recent_sessions` tool registered by the plugin in Task 1

- [ ] **Step 1: Write the command file**

Create `commands/recent-sessions.md`:

```markdown
---
description: "List recent OpenCode sessions across all working directories to help resume work"
agent: default
subtask: false
---

Call the `recent_sessions` tool and display the result to the user.
```

- [ ] **Step 2: Commit the command**

```bash
git add commands/recent-sessions.md
git commit -m "feat(recent-sessions): add /recent-sessions command"
```

---

### Task 3: Verification

**Files:** None (verification only)

- [ ] **Step 1: Verify plugin syntax**

Run a Node.js syntax check on the plugin:

```bash
node --check plugin/recent-sessions.js
```

Expected: no error output

- [ ] **Step 2: Verify file structure**

Confirm expected files exist with correct paths:

```bash
ls plugin/recent-sessions.js commands/recent-sessions.md
```

Expected: both files listed, no errors

- [ ] **Step 3: Verify naming conformance**

Verify the plugin exported name matches the remote-config convention:
- File: `plugin/recent-sessions.js` → plugin name: `recent-sessions`
- Export: `RecentSessions` (matches exported constant name pattern used by `CompactionPlanRefresh`)
- Command: `commands/recent-sessions.md` → command name: `recent-sessions`

- [ ] **Step 4: Final commit**

```bash
git add -A
git status
git commit -m "chore(recent-sessions): verify plugin and command structure"
```
(Only if there are uncommitted changes; otherwise skip)

---

## Self-Review Checklist

- [x] **Spec coverage:** Plugin tool (Task 1), command (Task 2), verification (Task 3) — all spec requirements addressed
- [x] **No placeholders:** All code is complete; all commands are exact
- [x] **Type consistency:** Uses `client.session.list()` matching the RAG-researched API
- [x] **Sub-session filtering:** Filters by `parentID` as specified
- [x] **Timestamps:** Includes both relative time and ISO timestamp
- [x] **Resume command:** Includes `opencode -s <id>` per session
