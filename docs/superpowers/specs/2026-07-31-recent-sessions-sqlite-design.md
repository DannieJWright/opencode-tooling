---
name: recent-sessions-sqlite-pivot
description: Design spec for pivoting recent_sessions plugin from API to direct SQLite database access
---

# Spec: Pivot `recent_sessions` to Direct SQLite Database Access

## Overview

Pivot the `recent_sessions` plugin tool from using `client.session.list()` (which doesn't return all user sessions across projects) to reading the OpenCode SQLite database directly via `Bun.sqlite`. This returns **all** root sessions from **all** working directories, ordered by most recently active.

**Why pivot:** The OpenCode server API (`client.session.list()`) is directory-scoped and doesn't provide a way to list sessions across all projects/directories. Even with `{ scope: "project" }` or `{ query: { scope: "project" } }`, results are incomplete.

## Architecture

### Data Source: OpenCode SQLite Database

**Location:** Resolved via platform-specific XDG data directory conventions:
- **Windows:** `%USERPROFILE%\.local\share\opencode\`
- **macOS/Linux:** `~/.local/share/opencode/`

The plugin scans this directory for a `.db` file (OpenCode's SQLite database).

**DB Path Resolution Helper:** `resolveDbPath()` — traverses the opencode data directory for any `.db` file. Returns `null` if not found.

### SQL Query

Single parameterized query against the `session` table:

```sql
SELECT id, title, directory, time_updated, time_created FROM session
WHERE parent_id IS NULL
  AND time_archived IS NULL
ORDER BY COALESCE(time_updated, time_created) DESC
LIMIT ?
```

When `includeArchived` is `true`, the `time_archived IS NULL` filter is removed.

### Session Schema Reference

Source of truth: [OpenCode session.schema.ts](https://github.com/anomalyco/opencode/blob/dev/packages/core/src/session/sql.ts)

| Column | Type | Used By |
|--------|------|---------|
| `id` | TEXT PK | Resume command |
| `title` | TEXT | Display title |
| `directory` | TEXT | Working directory column |
| `time_updated` | INTEGER (Unix ms) | Sort key, timestamp display |
| `time_created` | INTEGER (Unix ms) | Fallback sort key |
| `parent_id` | TEXT NULL | Filter: `NULL` = root session |
| `time_archived` | INTEGER NULL | Filter: `NULL` = not archived |

### Artifact: Plugin (`plugin/recent-sessions.js`)

Reads the SQLite database directly instead of calling the client API.

**Key changes from current implementation:**
1. Replace `client.session.list()` with `Bun.sqlite(dbPath).query(sql).get(limit)`
2. Add `resolveDbPath()` helper for cross-platform DB path resolution
3. Add `includeArchived` boolean parameter (default: `false`)
4. Keep `formatRelativeTime()`, `getResumeCmd()`, and markdown table formatting unchanged

**Key code structure:**
```js
import { tool } from "@opencode-ai/plugin"

export default async () => {
  return {
    tool: {
      recent_sessions: tool({
        description: "List recent OpenCode sessions across all working directories",
        args: {
          count: tool.schema.number().optional().describe("Number of recent sessions to show (default: 10, max: 50)"),
          includeArchived: tool.schema.boolean().optional().describe("Include archived sessions in results (default: false)"),
        },
        async execute({ count = 10, includeArchived = false }, _ctx) {
          // 1. Resolve DB path via resolveDbPath()
          // 2. Open DB with Bun.sqlite(), run parameterized query
          // 3. Format results as markdown table
          // 4. Close DB connection
        },
      }),
    },
  }
}
```

### Artifact: Command (`commands/recent-sessions.md`)

**No changes needed.** The command continues to call the `recent_sessions` tool and display the result.

### Unchanged Functions

- `formatRelativeTime(msTimestamp, now)` — timestamp formatting (exported, tested)
- `getResumeCmd(sessionId)` — resume command generation (exported, tested)
- Markdown table formatting (header, separator, row mapping)

## Tool Definition

**Description:** "List recent OpenCode sessions across all working directories, showing title, directory, and last activity time"

**Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `count` | number | 10 | Sessions to show (1-50, clamped) |
| `includeArchived` | boolean | false | Include archived sessions |

**Returns:** Markdown table string

**Output format per row (unchanged):**
| # | Title | Working Directory | Last Active | ISO Timestamp | Resume |

## Session Filtering

- **Sub-sessions excluded:** `parent_id IS NULL` filters to root sessions only
- **Archived excluded by default:** `time_archived IS NULL` filters archived sessions. Omit this filter when `includeArchived` is `true`.
- **All projects included:** No `project_id` or `directory` filter — returns sessions from every project/directory
- **Sorted by recency:** `ORDER BY COALESCE(time_updated, time_created) DESC`

## Error Handling

Three distinct error paths:

| Scenario | Message |
|----------|---------|
| DB path not found | `"No OpenCode database found at <path>. Run opencode once to initialize."` |
| DB read/lock error | `"Failed to read session database: <reason>. Another process may be using it."` |
| Empty results | `"No recent sessions found."` |

## Testing Strategy

- **`formatRelativeTime`** — existing tests remain valid (deterministic, parameterized)
- **`getResumeCmd`** — existing tests remain valid
- **`resolveDbPath`** — new tests: mock filesystem paths, verify cross-platform resolution
- **Execute path** — new tests: mock `Bun.sqlite` to return known session data, verify filtering (root only, archived excluded), sorting, and table output
- **Error paths** — new tests: mock missing DB, mock locked DB, verify error messages

## Success Criteria

1. Running `/recent-sessions` displays a formatted table of recent sessions from **all** projects/directories
2. Sub-sessions (child sessions with `parent_id` set) are excluded
3. Archived sessions are excluded by default, included when `includeArchived: true`
4. Sessions are sorted by most recently active first
5. Each row includes: title, working directory, relative + ISO timestamp, resume command
6. `count` parameter controls how many sessions are shown
7. Graceful error message when OpenCode database is not found

## Not in Scope

- Session content summarization
- Filtering by directory or date range
- Search/filter by keyword
- Interactive selection
- Writing to the database (read-only access)
