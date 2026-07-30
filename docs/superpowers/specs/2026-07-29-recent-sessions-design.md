---
name: recent-sessions-spec
description: Design spec for /recent-sessions command and recent_sessions plugin tool
---

# Spec: `/recent-sessions` Command + `recent_sessions` Plugin Tool

## Overview

Adds a `/recent-sessions` command that displays the user's most recently active OpenCode sessions across all working directories. Helps users quickly find and resume work after reboots, idle periods, or context switches.

## Architecture

### Artifact 1: Plugin (`plugin/recent-sessions.js`)

Registers a `recent_sessions` tool via the `tool()` helper from `@opencode-ai/plugin`.

**Behavior:**
1. Calls `client.session.list()` to fetch all sessions
2. Filters out sub-sessions (sessions with a `parentID` field)
3. Sorts remaining sessions by `time.updated` descending
4. Takes top N (default: 10)
5. Formats as a markdown table with relative timestamps and ISO timestamps

**Tool definition:**
- **Description:** "List recent OpenCode sessions across all working directories"
- **Parameters:**
  - `count` — optional number, default 10, max 50
- **Returns:** Formatted markdown table

**Output format per row:**

| Columns | Content |
|---------|---------|
| `#` | 1-based index |
| `Title` | Session title (auto-generated or user-set) |
| `Working Directory` | Session `directory` field, formatted as inline code |
| `Last Active` | Relative time (e.g., "2 hours ago") with ISO timestamp on next line |
| `Resume` | `opencode -s <session-id>` command as inline code |

### Artifact 2: Command (`commands/recent-sessions.md`)

Minimal command that instructs the agent to call the `recent_sessions` tool and display the result.

**Frontmatter:**
- `description`: "List recent OpenCode sessions across all working directories to help resume work"
- `agent`: default
- `subtask`: false

## Session Filtering

- **Sub-sessions excluded**: Any session with a truthy `parentID` is a child session spawned by a subagent and is filtered out
- **All projects included**: No directory filtering — shows sessions regardless of working directory
- **All statuses included**: idle, busy, retry — all session states are shown

## Timestamp Formatting

- **Relative time** computed from `time.updated` (UNIX timestamp) to current time
- **ISO timestamp** displayed below the relative time for reference
- Examples: "2 hours ago\n`2026-07-29T14:30:00Z`"

## Success Criteria

1. Running `/recent-sessions` displays a formatted table of recent sessions
2. Sub-sessions (child sessions) are excluded from the list
3. Sessions are sorted by most recently active first
4. Each row includes: title, working directory, relative + ISO timestamp, resume command
5. The `count` parameter controls how many sessions are shown

## Not in Scope

- Session content summarization (would require per-session LLM calls)
- Filtering by directory or date range
- Search/filter by keyword
- Interactive selection
