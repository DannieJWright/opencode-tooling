---
name: recent-sessions-sqlite-pivot
description: Design spec for pivoting recent_sessions plugin from API to direct SQLite database access
---

# Spec: Pivot `recent_sessions` to Direct SQLite Database Access

## Overview

Pivot the `recent_sessions` plugin tool from using `client.session.list()` to reading the OpenCode SQLite database directly via `bun:sqlite`. This returns **all** root sessions from **all** working directories, ordered by most recently active.

**Why pivot:** The OpenCode server API's `scope` parameter tops out at `project` — `client.session.list({ query: { scope: "project" } })` returns at most project-scoped sessions. The tool's core requirement is to show ALL of the user's recent sessions across ALL projects/directories. Direct read-only access to the local `opencode.db` is the only way to enumerate the complete global session set. The API approach may serve as a fallback if DB access fails (see Schema Validation / Error Handling).

**Self-containment:** `bun:sqlite` is a Bun runtime built-in (like `Bun.$`, already used by plugins) and does not require an npm dependency — consistent with the AGENTS.md self-containment rule.

## Architecture

### Data Source: OpenCode SQLite Database

**Path Resolution:**
1. **Primary:** Shell out to `opencode db path` (CLI command, `instance: false`, runs standalone with NO server required — safe via `Bun.$`). This prints the exact database file path.
2. **Fallback (hard-coded platform conventions, documented only):** If the CLI is unavailable, fall back to `path.join(xdgData, 'opencode', 'opencode.db')`, where `xdgData` resolves to the platform-specific data directory. The directory may contain `opencode.db-wal`, `opencode.db-shm`, and other files — the exact filename `opencode.db` (stable channel) or `opencode-<channel>.db` (internal) is used directly; no glob or directory traversal.

Platform-specific xdg data directories (for the fallback path):
- **Windows:** `%USERPROFILE%\.local\share\opencode\`
- **macOS/Linux:** `~/.local/share/opencode/`

**DB Path Resolution Helper:** `resolveDbPath()` — attempts `opencode db path` via `Bun.$`, falls back to platform convention path. Returns `null` if neither succeeds. No directory traversal or globbing.

### SQL Query

Single parameterized query against the `session` table:

```sql
SELECT id, title, directory, time_updated, time_created FROM session
WHERE parent_id IS NULL
  AND time_archived IS NULL
ORDER BY time_updated DESC
LIMIT ?
```

Note: `time_updated` is `NOT NULL` (integer) with a `Date.now()` on-update default in the current schema, so the previous `COALESCE(time_updated, time_created)` was dead code. Using `time_updated` directly.

When `includeArchived` is `true`, the `time_archived IS NULL` filter is removed.

### Session Schema Reference

Source of truth: [OpenCode session.schema.ts](https://github.com/anomalyco/opencode/blob/dev/packages/core/src/session/sql.ts)

| Column | Type | Used By |
|--------|------|---------|
| `id` | TEXT PK | Resume command |
| `title` | TEXT | Display title |
| `directory` | TEXT | Working directory column |
| `time_updated` | INTEGER (Unix ms) | Sort key, timestamp display |
| `time_created` | INTEGER (Unix ms) | Preserved in schema; not used for sorting |
| `parent_id` | TEXT NULL | Filter: `NULL` = root session |
| `time_archived` | INTEGER NULL | Filter: `NULL` = not archived |

### Artifact: Plugin (`plugin/recent-sessions.js`)

Reads the SQLite database directly instead of calling the client API.

**Key changes from current implementation:**
1. Replace `client.session.list()` with `bun:sqlite` `Database` class: `new Database(dbPath, { readonly: true })`
2. Add `resolveDbPath()` helper for cross-platform DB path resolution
3. Add `includeArchived` boolean parameter (default: `false`)
4. Add defensive schema validation via `PRAGMA table_info(session)` before querying
5. Keep `formatRelativeTime()`, `getResumeCmd()`, and markdown table formatting unchanged
6. Wrap all DB access in try/catch with graceful fallback to `client.session.list({ query: { scope: "project" } })` on failure

**Key code structure:**
```js
import { tool } from "@opencode-ai/plugin"
import { Database } from "bun:sqlite"

export default async function ({ client }) {
  return {
    tool: {
      recent_sessions: tool({
        description: "List recent OpenCode sessions across all working directories",
        args: {
          count: tool.schema.number().optional().describe("Number of recent sessions to show (default: 10, max: 50)"),
          includeArchived: tool.schema.boolean().optional().describe("Include archived sessions in results (default: false)"),
        },
        async execute({ count = 10, includeArchived = false }, _ctx) {
          try {
            // 1. Resolve DB path via resolveDbPath()
            // 2. Open DB with new Database(dbPath, { readonly: true })
            // 3. Validate schema via PRAGMA table_info(session)
            // 4. Run parameterized query with db.query(sql).all()
            // 5. Format results as markdown table
            // 6. Close DB connection
          } catch (err) {
            // Fallback: client.session.list({ query: { scope: "project" } })
            // Note reduced scope in output
          }
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
- **Sorted by recency:** `ORDER BY time_updated DESC`

## Schema Validation

Before querying session data, the plugin validates database schema compatibility:

1. Run `SELECT COUNT(*) FROM pragma_table_info('session') WHERE name IN ('id','title','directory','time_created','time_updated','parent_id','time_archived')` — `pragma_table_info` is a SQLite table-valued function (valid since SQLite 3.16; verified on Bun 1.3.14 / SQLite 3.53).
2. If the count is less than 7 (any required column missing), treat as schema mismatch — fall back to `client.session.list({ query: { scope: "project" } })` with reduced-scope note
3. All DB access (open, validate, query, close) wrapped in try/catch

## Error Handling

All database access is wrapped in try/catch. Before querying, a schema validation step checks that required columns exist via `PRAGMA table_info(session)`. If validation fails, DB access throws, or the database is unavailable, the tool degrades gracefully by falling back to `client.session.list({ query: { scope: "project" } })` — noting in its output that results are limited to the current project scope.

OpenCode opens its DB with `PRAGMA journal_mode = WAL`, `synchronous = NORMAL`, `busy_timeout = 5000`. WAL allows concurrent readers; a second-process read-only connection (`new Database(dbPath, { readonly: true })`) is safe. If SQLITE_BUSY still occurs (possible only after the ~5s busy_timeout), retry once then fall back.

| Scenario | Message |
|----------|---------|
| DB path not found | `"No OpenCode database found at <path>. Run opencode once to initialize."` |
| Schema mismatch (missing required columns) | `"OpenCode database schema incompatible. Showing project-scoped sessions instead."` (triggers fallback) |
| DB read/lock error (after retry) | `"Failed to read session database: <reason>. Showing project-scoped sessions instead."` (triggers fallback) |
| Empty results | `"No recent sessions found."` |

## Testing Strategy

- **`formatRelativeTime`** — existing tests remain valid (deterministic, parameterized)
- **`getResumeCmd`** — existing tests remain valid
- **`resolveDbPath`** — new tests: mock filesystem paths, verify cross-platform resolution
- **Execute path** — new tests: mock `Database` from `bun:sqlite` to return known session data, verify filtering (root only, archived excluded), sorting, and table output
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

## References / Grounding

- Bun `bun:sqlite` API: https://bun.com/docs/runtime/sqlite
- Bun version bundled by OpenCode (1.3.14): https://github.com/anomalyco/opencode/blob/dev/package.json
- Path resolution (`xdgData` + `"opencode"`): https://github.com/anomalyco/opencode/tree/dev/packages/core/src/global.ts
- xdg-basedir on Windows (`%USERPROFILE%\.local\share\`): https://github.com/sindresorhus/xdg-basedir
- DB filename (`opencode.db` / `opencode-<channel>.db`): https://github.com/anomalyco/opencode/tree/dev/packages/core/src/database/database.ts
- OpenCode pragmas (WAL, synchronous=NORMAL, busy_timeout=5000): https://github.com/anomalyco/opencode/tree/dev/packages/core/src/database/database.ts
- `opencode db path` CLI (`instance: false`): https://github.com/anomalyco/opencode/tree/dev/packages/opencode/src/cli/cmd/db.ts
- Session schema + columns: https://github.com/anomalyco/opencode/tree/dev/packages/core/src/database/migration.gen.ts
- Full research writeup: `C:\Users\Danni\Documents\Git\ai-vault\opencode\core\opencode-sqlite-plugin-access.md`
