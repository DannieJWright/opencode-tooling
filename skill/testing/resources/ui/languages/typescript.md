# TypeScript and JavaScript UI Tests

Use the repository's browser automation framework and its native page-object patterns. Playwright is common, but do not assume it when the repository uses another supported runner.

- Define page objects around screens/areas with task-oriented methods and state queries.
- Use stable accessibility locators or `data-testid` attributes. Avoid generated classes, DOM traversal, positional selectors, and arbitrary timeouts.
- Keep base URL, credentials, and canary/local selection in documented E2E configuration; do not expose secrets in test source or logs.
- Use `try`/`finally`, runner fixtures, or teardown hooks to delete data created by the test even after browser or assertion failures.
- Assert user-visible results after reliable state transitions, not internal implementation behavior.

Default location when no convention exists: `tests/ui/<feature>/<flow>.test.ts`, with page objects in `tests/ui/pages/`. Apply the same guidance to `.test.js` files.
