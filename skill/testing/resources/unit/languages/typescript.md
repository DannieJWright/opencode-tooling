# TypeScript and JavaScript Unit Tests

Use the repository's existing runner and assertion APIs. For a new TypeScript or JavaScript repository, use the already selected test framework rather than introducing one solely for a single test.

- Test exported behavior directly with explicit inputs and expected outputs.
- Prefer framework-native assertions. Add a message to compound or ambiguous comparisons when the framework supports it, or make the expectation clear through local variables and test naming.
- Assert thrown errors by type or stable contract, not incidental stack traces or full implementation messages.
- Do not use spies, mocks, fake timers, environment mutation, network interception, or file system setup in unit tests. Move such behavior to integration tests or extract a pure unit.

Default location when no convention exists: `tests/unit/<feature>/<associated-type>.test.ts`. Apply the same guidance to `.test.js` files.
