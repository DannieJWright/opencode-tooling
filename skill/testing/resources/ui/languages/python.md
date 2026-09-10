# Python UI Tests

Use the repository's browser automation stack, such as existing Playwright or Selenium configuration. Do not add browser tooling for a single test without confirming the project's chosen framework.

- Model each screen or coherent UI region as a page object with behavior-level methods and stable locators.
- Prefer existing role/name locators or `data-testid` values; do not rely on CSS structure, generated classes, or timing sleeps.
- Use runner fixtures for browser/context lifecycle and ensure cleanup also removes application data created by the flow.
- Store local/canary URLs and authentication in documented configuration, never in source or output.
- Make user-visible assertions explicit and include context for non-trivial UI state comparisons.

Default location when no convention exists: `tests/ui/<feature>/test_<flow>.py`, with page objects in `tests/ui/pages/`.
