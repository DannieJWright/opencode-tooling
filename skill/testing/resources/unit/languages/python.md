# Python Unit Tests

Use the repository's existing runner and assertion style. For a new Python repository, prefer `pytest` conventions: `test_*.py` files, plain `test_...` functions, and `pytest.raises` for expected exceptions.

- Keep imports pointed at the production unit, not test helpers that hide the input or assertion.
- Prefer direct assertions for simple values; supply an assertion message for non-trivial comparisons, for example `assert actual == expected, "discount must be applied before tax"`.
- For an expected exception, assert the exception type and match stable, meaningful message text only when that text is part of the contract.
- Do not use `monkeypatch`, mocks, temporary files, clocks, or environment variables in unit tests. Their need indicates an integration test or a missing pure seam.

Default location when no convention exists: `tests/unit/<feature>/test_<associated_type>.py`.
