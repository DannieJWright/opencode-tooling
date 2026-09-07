---
name: recall
description: Retrieve relevant OpenViking memories and resources. Use when a user says "recall", "look up what you remember", "find saved information", or asks for a previously saved decision, plan, document, URL, repository, or fact. Do not use for saving new information; use the remember-this skill instead.
---

# Recall

Retrieve the most useful OpenViking context directly, then present a source-cited answer that fits the user's requested level of detail.

## Determine The Query And Scope

1. Use the user's explicit question, terms, or described topic as the search query.
2. If no query is provided, derive a focused query from the current conversation's active topic. Do not ask first when the conversation has enough context.
3. Interpret natural-language scope hints:
   - "my memory", "private memory", or identity memory: search the current identity's accessible memory scope only.
   - "shared resources", "the vault resources", or a named topic: search the matching `viking://resources/` scope.
   - A specific `viking://` URI: search or read that URI directly when it is accessible.
   - No scope: search both the current identity's accessible scope and shared resources.
4. Never probe another identity's private URI. If the user asks for information likely held by another identity, explain the isolation boundary and suggest asking its owner to share non-sensitive information under `viking://resources/<topic>/`.

## Search And Read

1. Use `openviking_search` in `list` mode to retrieve ranked candidates. Supply `target_uri` only when a precise accessible scope or URI is known; otherwise search the accessible default scope.
2. Search with query expansion enabled unless the user supplied exact terms that must remain literal. Prefer a focused query over broad, unrelated searches.
3. Read the most relevant returned source with `openviking_read` when its abstract cannot answer the question, when the user asks for details, or when exact wording matters.
4. For a requested file or directory layout, use `openviking_list`, `openviking_glob`, or `openviking_grep` as appropriate before reading source files.
5. Treat search results as evidence, not proof. Do not invent information absent from the retrieved sources.

## Respond

1. Default to a concise synthesis of the relevant results. Expand into source detail when the user asks for it or the task requires exact content.
2. Cite the relevant `viking://` URI for every sourced claim or result. Clearly label uncertainty, conflicts, or weak matches.
3. If nothing relevant is found, say so plainly. Include the query and scope searched, then suggest a concrete way to refine or broaden the request.
4. Do not expose private content beyond the accessible current identity. Summarize only what the retrieved source authorizes the current session to access.

## Examples

- "Recall the cache bug fix." Search the active identity and shared resources, read the top source if needed, then summarize the fix with its URI.
- "What do I remember about our deployment plan?" Search the current identity memory scope and cite the results.
- "Recall the shared OpenViking routing documentation." Limit the search to `viking://resources/`, then provide a concise sourced answer or read the requested document.

## Common Issues

### No relevant result was returned
Cause: The query is too narrow, too vague, or the information was never saved in the searched scope.
Solution: State the query and scope used, then suggest related terms, a broader scope, or the exact topic/URI.

### The requested item belongs to another identity
Cause: OpenViking enforces identity isolation.
Solution: Do not probe foreign paths. Ask that identity's owner to retrieve it, or have them publish non-sensitive material to shared resources.

### A result is too brief to answer safely
Cause: A search abstract omitted important context.
Solution: Read the cited item with `openviking_read` before synthesizing the answer.
