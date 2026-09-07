---
name: remember-this
description: Save durable information to OpenViking memories or resources. Use when a user says "remember this", "save this", "store this conversation", or asks to preserve a decision, solution, plan, document, URL, repository, or file for later recall. Do not use for retrieving information; use the recall skill instead.
---

# Remember This

Save useful information deliberately. Preserve durable facts, decisions, preferences, and solutions rather than transient chat details.

## Scope

Use this skill for explicit requests to retain information in OpenViking. Do not save credentials, API keys, tokens, or other secrets anywhere in OpenViking. Do not delete or overwrite an existing item unless the user explicitly asks.

## Determine What To Save

1. Interpret the user's request against the recent conversation.
2. If they identify a scope, save only that scope. For example, "this conversation" means its relevant resolution and context; "the bug fix" means the diagnosis, change, and verification; "those commands" means the recently discussed commands.
3. If they do not identify a scope, infer the likely resolution for a short conversation, bug investigation, or fix. For a plan or document, preserve the complete finished artifact.
4. If more than one plausible topic or scope remains, ask a focused question before saving. Do not guess.
5. For normal memories, synthesize concise, durable content: include the context, stable fact or decision, rationale when useful, and any constraints needed for future reuse. Exclude incidental back-and-forth.

## Determine Where To Save

1. Read the workspace `MEMORY-MAP.md` before choosing a destination. If it does not exist, create the routing map described by the installed `openviking-memory-routing` guidance, tell the user, and ask for a destination when the topic is not clearly mapped.
2. Inspect existing related information with `openviking_search` and, for shared content, inspect the relevant `viking://resources/<topic>/README.md` mapping index when it exists.
3. Follow the local map:
   - `private`: call `openviking_remember`. It is automatically scoped to the current identity. Never attempt another identity's private URI.
   - `shared`: call `openviking_write` below `viking://resources/<topic>/`; never write a loose file at the resources root. For a new topic, create or update `viking://resources/<topic>/README.md` with an index of its files. Shared content must be non-sensitive.
   - `ask`, unmapped, or ambiguous: ask whether the information belongs in the current identity's private memory or shared resources. Do not save until answered.
4. If the user explicitly provides a destination or URI, validate it against the map, privacy rules, and the current item's sensitivity. If it conflicts, explain the conflict and ask for confirmation; do not silently reroute it.
5. Use `openviking_write` for a detailed plan, document, or reference that benefits from structured retrieval. Use a descriptive kebab-case filename ending in `.md` and preserve the complete artifact.

## Ingest Sources

When the user explicitly asks to save an external URL, Git repository, or local file as a source, use `openviking_add_resource` rather than reducing it to a conversational summary. Apply the same routing and sensitivity checks first. Use the resulting target URI in the final response.

## Save And Report

1. Call exactly the selected OpenViking save tool after all required clarification is resolved.
2. If a tool fails, report the error and do not claim that information was saved.
3. On success, state what was saved, whether it is a memory, written resource, or ingested resource, and the exact resulting `viking://` URI or destination returned by the tool.

## Examples

- "Remember how we fixed the cache bug." Save a synthesized durable diagnosis, fix, and verification result using the mapped destination.
- "Save this deployment plan in shared resources." Validate the shared destination, write the complete plan beneath an appropriate topic directory, and update its mapping index.
- "Remember this repository for later." Validate routing and ingest the repository with `openviking_add_resource`.

## Common Issues

### The topic has no map entry
Cause: No safe destination has been established.
Solution: Ask the user to choose private memory or non-sensitive shared resources; do not infer a destination.

### The requested content contains a secret
Cause: Secrets are not permitted in either OpenViking destination.
Solution: Decline to save the secret and offer to save a redacted, non-sensitive reference if useful.

### A shared resource write has no topic directory
Cause: The shared root must contain topic directories only.
Solution: Create a topic directory and its `README.md` mapping index before writing the resource.
