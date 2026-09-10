# UI Tests

## Purpose

UI tests are browser-based end-to-end tests of real user flows against explicitly configured local or canary resources. They validate critical journeys across rendered UI, client behavior, backend integration, and user-visible state.

Use the page object model (POM): page objects represent a screen or coherent UI area and expose behavior-focused actions and state queries. Test files orchestrate pages and make journey-level assertions; they should not embed repeated selectors or low-level browser mechanics.

## Preconditions

Discover the repository's browser runner, browser lifecycle, base URL, authentication approach, data policy, approved local/canary environment, and cleanup mechanism. Never invent URLs, accounts, selectors, credentials, or test data. Ask a focused question if required configuration is missing.

## Expectations

- Cover a small set of valuable, successful user journeys. Test most field validation, error handling, and edge cases in unit or integration tests.
- Use stable `data-testid` attributes provided by the application for meaningful interaction targets. Request or add narrowly scoped test IDs when existing accessible role/name selectors are not stable enough.
- Encapsulate selectors and reusable interactions in page objects. Keep assertions in tests unless a page state query improves readability.
- Create unique test data and clean it up after every run, including after failures.
- Wait for meaningful UI state rather than arbitrary sleeps.
- Keep page objects task-oriented: `signIn`, `submitOrder`, `expectConfirmation`, not generic selector wrappers.

## Location

Preserve the repository convention. If none exists, use `tests/ui/<feature>/<flow>.test.<ext>` and place page objects in the closest established support location, or `tests/ui/pages/` for a new repository.

## Language Routing

Load exactly one language resource after selecting this layer:

| Language | Resource |
|---|---|
| Python | `languages/python.md` |
| TypeScript or JavaScript | `languages/typescript.md` |
