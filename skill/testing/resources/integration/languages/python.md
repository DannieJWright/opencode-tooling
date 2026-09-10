# Python Integration Tests

Use the repository's test stack. With `pytest`, fixtures are appropriate for explicit dependency construction and per-test cleanup.

- Construct the system under test with fakes, stubs, or mocks at resource boundaries.
- Use `unittest.mock` or `pytest`'s existing mocking support only for those boundaries; assert behavior and returned contracts first.
- Inject fixed clocks, IDs, and configuration rather than reading ambient time or environment state.
- Reset in-memory stores and mocks for each test. Avoid module-global state.
- Use descriptive assertion messages for non-trivial domain or payload comparisons.

Default location when no convention exists: `tests/integration/<feature>/test_<functionality>.py`.
