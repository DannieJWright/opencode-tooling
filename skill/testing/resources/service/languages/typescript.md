# TypeScript and JavaScript Service Tests

Use the repository's transport client and E2E configuration. Do not introduce a second HTTP client or test runner without a broader setup decision.

- Read base URLs and credentials from documented test configuration; do not hardcode or log secrets.
- Create unique resource names/IDs and clean them up with `try`/`finally` or runner teardown hooks.
- Make setup and cleanup idempotent so interrupted runs can be safely repeated.
- Assert stable response status, body contract, and externally visible state. Include operation and resource context in non-trivial assertion messages.
- Skip or fail with an explicit configuration error when the approved local/canary environment is not available; never silently target a guessed environment.

Default location when no convention exists: `tests/services/<feature>/<endpoint>.test.ts`. Apply the same guidance to `.test.js` files.
