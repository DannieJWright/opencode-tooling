# opencode-tooling

A collection of OpenCode plugins, tools, and skills distributed via [`@jgordijn/opencode-remote-config`](https://github.com/jgordijn/opencode-remote-config).

## Repository Purpose

This repository provides OpenCode extensions that are synced to the user's environment through the remote-config plugin. All content is discovered automatically from the standard top-level directories.

## Conventional Commits

All commits **must** follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

- Format: `<type>(<scope>): <description>`
- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`, `perf`, `revert`
- Scope is optional and should correspond to the affected plugin, skill, or tool name
- Examples:
  - `feat(compaction-plan-refresh): add session status filter`
  - `fix: correct tool schema validation`
  - `chore: update dependency versions`

## Remote Config Pathing

All files must reside in the standard top-level directories recognized by `opencode-remote-config`. The plugin scans these directories on sync and installs content to the user's OpenCode configuration.

### Required Directory Structure

```
opencode-tooling/
├── plugin/          # or plugins/
│   └── my-plugin.js
├── skill/           # or skills/
│   └── my-skill/
│       └── SKILL.md
├── agent/           # or agents/
│   └── my-agent.md
├── command/         # or commands/
│   └── my-command.md
└── manifest.json    # optional: lists instruction .md files
```

### Naming Conventions

| Type     | Location                  | Resulting Name        |
|----------|---------------------------|-----------------------|
| Plugin   | `plugin/foo.js`           | `foo`                 |
| Plugin   | `plugin/nested/bar.js`    | `nested-bar`          |
| Skill    | `skill/my-skill/`         | `my-skill`            |
| Skill    | `skill/a/b/skill/`        | `a-b-skill`           |
| Agent    | `agent/reviewer.md`       | `reviewer`            |
| Agent    | `agent/deep/expert.md`    | `deep/expert`         |
| Command  | `command/deploy.md`       | `deploy`              |

- Plugins and skills: nested directory separators become hyphens
- Agents: nested directory separators are preserved as slashes
- All files must be self-contained; local imports (`./`, `../`) are not supported
- Hidden files/directories (starting with `.`) are skipped
- Max 100 files per type, 256KB per file, 10 levels of nesting

### Install Locations

Remote content is installed to the user's system as follows:

- Skills: `~/.config/opencode/skill/_plugins/<repo-name>/<skill-name>/`
- Plugins: `~/.config/opencode/plugin/_remote_<repo-name>_<plugin-name>.ext`
- Agents and commands: injected via the `config` hook at startup
- Local content always takes precedence over remote content with the same name

### Configuration

Users register this repository in `~/.config/opencode/remote-config.json` or `.opencode/remote-config.json`:

```json
{
  "installMethod": "copy",
  "repositories": [
    {
      "url": "git@github.com:DannieJWright/opencode-tooling.git",
      "ref": "main"
    }
  ]
}
```

> **Important:** `"installMethod": "copy"` is required. The plugins in this repository use npm package imports (e.g., `@opencode-ai/plugin`), which fail when installed via symlinks.

Reference: [opencode-remote-config README](https://github.com/jgordijn/opencode-remote-config)

## Plugin Development

### Format

Plugins are `.js` or `.ts` files placed in `plugin/` or `plugins/`. Each file exports an async plugin function:

```js
export default async ({ client, project, directory, worktree, $ }) => {
  return {
    // hooks
  }
}
```

### Rules

- **Self-contained**: No local imports (`./`, `../`). Only npm packages and Node.js built-ins.
- **Export**: Must export a valid plugin function (default or named export).
- **Types**: Import from `@opencode-ai/plugin` for type safety.
- **Runtime**: Plugins execute in Bun, giving access to `Bun.$` shell API.

### Plugin Input

```ts
type PluginInput = {
  client: ReturnType<typeof createOpencodeClient>
  project: Project
  directory: string       // current project directory
  worktree: string        // project worktree root
  serverUrl: URL
  $: BunShell
}
```

### Available Hooks

Return an object with any of the following hooks:

| Hook | Purpose |
|------|---------|
| `event(input)` | Receives all bus events (`session.compacted`, `file.edited`, etc.) |
| `config(cfg)` | Mutate the merged config on init |
| `tool` | Object mapping tool names to `ToolDefinition`s |
| `auth` | Custom authentication provider |
| `provider` | Custom model provider |
| `"chat.message"` | Intercept outgoing chat messages |
| `"chat.params"` | Modify model parameters (temperature, topP, etc.) |
| `"chat.headers"` | Modify request headers |
| `"tool.execute.before"` | Mutate tool arguments before execution |
| `"tool.execute.after"` | Mutate tool output after execution |
| `"tool.definition"` | Modify tool descriptions/parameters |
| `"command.execute.before"` | Intercept command execution |
| `"shell.env"` | Inject environment variables for shell commands |
| `"permission.ask"` | Auto-respond to permission prompts |
| `"experimental.chat.messages.transform"` | Transform message history |
| `"experimental.chat.system.transform"` | Transform system prompts |
| `"experimental.session.compacting"` | Inject context during compaction |
| `"experimental.compaction.autocontinue"` | Control auto-continue after compaction |
| `"experimental.text.complete"` | Intercept text completion |

### Notable Events

- `session.created`, `session.compacted`, `session.deleted`, `session.idle`, `session.status`, `session.updated`, `session.diff`, `session.error`
- `file.edited`, `file.watcher.updated`
- `message.part.removed`, `message.part.updated`, `message.removed`, `message.updated`
- `tool.execute.before`, `tool.execute.after`
- `permission.asked`, `permission.replied`
- `todo.updated`, `command.executed`, `server.connected`
- `installation.updated`

Reference: [Plugins Docs](https://opencode.ai/docs/plugins/) | [Plugin Source](https://github.com/anomalyco/opencode/tree/dev/packages/plugin/src/index.ts)

## Custom Tool Development

### Format

Tools are defined via the `tool()` helper from `@opencode-ai/plugin`:

```js
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "What this tool does",
  args: {
    name: tool.schema.string().describe("parameter description"),
    count: tool.schema.number().optional(),
  },
  async execute(args, context) {
    return `Result: ${args.name}`
  },
})
```

### ToolContext

```ts
type ToolContext = {
  sessionID: string
  messageID: string
  agent: string
  directory: string
  worktree: string
  abort: AbortSignal
  metadata(input: { title?: string; metadata?: Record<string, any> }): void
  ask(input: AskInput): Promise<void>
}
```

### ToolResult

Return a `string` or an object:

```ts
type ToolResult = string | {
  title?: string
  output: string
  metadata?: Record<string, any>
  attachments?: ToolAttachment[]
}
```

### Rules

- Use `tool.schema` (Zod) for argument validation
- Custom tools override built-in tools with the same name
- Multiple exports from one file create `<filename>_<exportname>` tools

Reference: [Custom Tools Docs](https://opencode.ai/docs/custom-tools/) | [Tool Source](https://github.com/anomalyco/opencode/tree/dev/packages/plugin/src/tool.ts)

## Skill Development

### Format

Skills are `SKILL.md` files inside a directory under `skill/` or `skills/`:

```
skill/my-skill/SKILL.md
```

### Frontmatter

```yaml
---
name: my-skill
description: What this skill does and when to trigger it
license: MIT
compatibility: opencode
metadata:
  audience: developers
---
```

- `name`: required, lowercase hyphen-separated, 1-64 chars, matches directory name
- `description`: required, 1-1024 chars, third person, front-load trigger keywords
- `license`, `compatibility`, `metadata`: optional

### Naming Validation

Skill names must match `/^[a-z0-9]+(-[a-z0-9]+)*$/`.

### Discovery

Skills are discovered from:
- `.opencode/skills/` (project)
- `~/.config/opencode/skills/` (global)
- `~/.claude/skills/` and `~/.agents/skills/` (external, auto-loaded)
- Remote repos via `opencode-remote-config`

Reference: [Skills Docs](https://opencode.ai/docs/skills/)

## Agent Development

### Format

Agent files are `.md` with YAML frontmatter under `agent/` or `agents/`:

```yaml
---
description: When to use this agent
mode: subagent
model: anthropic/claude-sonnet-4-6
permission:
  edit: deny
---
Agent prompt and instructions...
```

### Frontmatter Fields

| Field | Type | Description |
|-------|------|-------------|
| `description` | string | When to use this agent |
| `mode` | `primary` \| `subagent` \| `all` | Agent mode |
| `model` | string | Default model |
| `permission` | object | Per-tool permissions |
| `temperature` | number | Model temperature |
| `color` | string | TUI color |
| `hidden` | boolean | Hide from autocomplete |
| `disable` | boolean | Disable the agent |

Reference: [Config Schema](https://opencode.ai/config.json)

## Command Development

### Format

Command files are `.md` with YAML frontmatter under `command/` or `commands/`:

```yaml
---
description: What this command does
agent: build
---
Command prompt template. $ARGUMENTS is replaced with user input.
```

Reference: [Config Schema](https://opencode.ai/config.json)

## API Reference

| Resource | URL |
|----------|-----|
| OpenCode Docs | https://opencode.ai/docs |
| Plugins | https://opencode.ai/docs/plugins/ |
| Tools | https://opencode.ai/docs/tools/ |
| Custom Tools | https://opencode.ai/docs/custom-tools/ |
| Skills | https://opencode.ai/docs/skills/ |
| SDK | https://opencode.ai/docs/sdk/ |
| Server API | https://opencode.ai/docs/server/ |
| Config Schema | https://opencode.ai/config.json |
| Plugin Package | https://www.npmjs.com/package/@opencode-ai/plugin |
| OpenCode Source | https://github.com/anomalyco/opencode |
| Remote Config Plugin | https://github.com/jgordijn/opencode-remote-config |

## Development Workflow

1. Create new content in the appropriate top-level directory (`plugin/`, `skill/`, etc.)
2. Ensure all files are self-contained with no local imports
3. Test locally by pointing `remote-config.json` at the repo via `file://` URL
4. Commit with conventional commit messages
5. Users pick up changes on next sync
