# TypeScript Reference (pseudocode-v2)

Per-language companion to `explanation.md`. The abstract drafting rules live in that document (§2–§6); below is how each translates into **TypeScript**. There are no full annotated real-document excerpts for this language yet — calibrate structure and depth against the excerpts in `python.md` (the patterns there are language-agnostic).

## Idiom Translations

- **Model shape (near-compilable skeleton):** an `interface` for the contract or concrete class (or plain types + functions where stateless). Every property typed; optionals stated explicitly and their *domain* meaning commented — distinguish `undefined` from a meaningful null.
  ```ts
  interface TodoItem {
    id: string;
    dueDate: Date | null; // null == "eventually"
  }
  ```
- **Typed signatures everywhere:** strict mode on; annotate parameters and return types explicitly even where inference would succeed — the plan must read correctly without compiling.
- **Labeled arguments at call sites:** object literals are inherently labeled, so keep them: `store.add({ item })`, `new TodoItem({ id, status, ... })`. Long positional argument lists (beyond ~2) are a review finding; group into an options object instead.
- **Named errors → exit codes:** typed thrown classes (`class UsageError extends Error {}`) with one top-level catch that maps to `process.exit(code)`; handlers never call `process.exit` themselves.
  ```ts
  try { await run(argv); }
  catch (e) { if (e instanceof NotFoundError) process.exit(1); /* ... */ }
  ```
- **Single clock read:** `new Date()` / `Date.now()` appears only at the entry point; inject a timestamp via parameter or constructor into everything downstream — tests then need no fake-clock library.
- **No magic constants:** one `const object Config = { ... } as const` plus string-literal union types for enums (`type Status = "todo" | "in-progress" | "done"`); each constant commented by why it exists. Raw literals elsewhere are a finding.
