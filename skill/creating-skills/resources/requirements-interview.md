# Requirements Interview

Establish shared understanding of the intended skill *before* authoring anything. The goal is to leave this step with concrete use cases, crisp trigger conditions, and measurable success criteria — not a vague sense of "what it should do."

## Driving the interview

- If a brainstorming-style skill is available in the environment, invoke it to drive this exploration; let it handle open-ended design questions.
- Otherwise run the protocol below inline: ask clarifying questions one at a time (not as a wall of text), and prefer multiple-choice or concrete options over open questions so the user can answer quickly.
- Do not move on until you can state, in your own words back to the user, what the skill does and when it fires. If you cannot, keep interviewing.

## 1. Core intent

Collect these before anything else:

| Question | Why it matters |
|---|---|
| **Purpose** — What does this help an agent do? | Becomes the "what it does" half of the description. |
| **Scope** — Which specific scenarios in / out of scope? | Drives trigger phrases and negative triggers. |
| **Inputs** — Files, data, webpages, prior context it consumes? Formats? | Defines configuration variables and input-format docs. |
| **Outputs** — What it produces (files, text, decisions)? Format, location, append vs overwrite? | Defines output-format docs and success criteria. |
| **Subagents** — Does it delegate to subagents? Their roles? | Determines whether a subagent prompt template is needed. |
| **Tools/MCP** — Built-in tools or MCP servers required? Any environment needs (packages, network)? | Drives the `compatibility`/environment notes and workflow steps. |

## 2. Use cases first

Before writing instructions, capture **2–3 concrete use cases**. A good use case has all four parts:

```
Use Case: <short name>
Trigger: "What the user would actually say" (a realistic phrasing)
Steps:   1. ...  2. ...  3. ...     (the multi-step workflow it enables)
Result:  What a completed run looks like to the user
```

Ask yourself per use case: what does the user want to accomplish, which tools are needed, and what domain knowledge or best practices must be embedded? These use cases become the skill's Examples section and its trigger phrases.

## 3. Define success criteria

Agree on how "working" is judged so testing (see `testing-validation.md`) has targets. Capture both kinds:

**Quantitative** (aspirational, not precise thresholds):
- Triggers on ~90% of relevant queries — measured by running 10–20 test queries that should trigger it and counting auto-load vs manual invocation.
- Completes the workflow in N tool calls / under T tokens — compare with vs without the skill.
- Zero failed tool/MCP calls per run.

**Qualitative:**
- Users don't need to prompt for next steps (few redirects/clarifications during testing).
- Workflows complete without user correction across 3–5 repeat runs (consistent structure and quality).
- A new user can accomplish the task on first try with minimal guidance.

Translate these into **quality checklists / validation gates** that get embedded in the generated skill so it checks its own output before finishing.

## Exit criteria for this step

- [ ] Purpose, scope, inputs, outputs stated clearly enough to echo back
- [ ] 2–3 use cases captured with Trigger + Steps + Result
- [ ] At least one quantitative and one qualitative success criterion agreed
- [ ] Subagent delegation decision made (yes/no, roles if yes)
- [ ] Required tools/environment noted
