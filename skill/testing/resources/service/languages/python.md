# Python Service Tests

Use the repository's HTTP/RPC client and test runner. Keep endpoint configuration in documented settings or fixtures rather than embedding URLs or credentials in test files.

- Construct uniquely named resources per test and retain their identifiers for cleanup.
- Use `try`/`finally` or fixture finalizers so cleanup runs after assertion failures.
- Fail early with a clear message when required canary/local configuration is missing.
- Keep authentication material in existing secure configuration paths; never write secrets into fixtures, source, snapshots, or failure output.
- Assert stable status codes and contract fields, with messages that name the operation and resource identifier for ambiguous failures.

Default location when no convention exists: `tests/services/<feature>/test_<endpoint>.py`.
