# TypeScript and JavaScript Integration Tests

Use the repository's runner, dependency-injection, and mock patterns. Mock resource boundaries, not the production logic being evaluated.

- Build the application slice using real internal collaborators where practical, with controlled adapters at network, persistence, clock, and process boundaries.
- Use deterministic fixtures and fixed time. Do not read `Date.now()` or process environment implicitly when testing time/configuration behavior.
- Prefer asserting output contracts and state changes over internal mock implementation details.
- Reset module state, test doubles, and in-memory stores between tests.
- Add assertion context for complex objects, response payloads, and collections when failures would be unclear.

Default location when no convention exists: `tests/integration/<feature>/<functionality>.test.ts`. Apply the same guidance to `.test.js` files.
