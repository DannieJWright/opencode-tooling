# Service Tests

## Purpose

Service tests are endpoint-level end-to-end tests. They exercise real HTTP, RPC, queue, or similar externally reachable interfaces against explicitly configured canary or local resources. They validate critical user-facing service flows through the actual transport, authentication, serialization, and resource integration path.

They are not tests for a project's internal "service layer". Test internal service-layer code using integration tests when resource boundaries are controlled.

## Preconditions

Before creating or running a service test, discover documented local or canary configuration: base URL, authentication mechanism, required feature flags, test data policy, resource isolation strategy, and cleanup capability. Never fabricate any of these. If unavailable, ask a focused question or provide non-runnable scaffolding with the missing configuration documented.

## Expectations

- Keep tests few and focused on high-value successful endpoint flows.
- Prefer unit and integration tests for validation errors, malformed inputs, and most negative paths.
- Generate unique, namespaced test data. Never rely on ordering or pre-existing mutable data.
- Clean up created data in a `finally`/teardown path so failures do not leak resources.
- Make retries safe: repeated execution must not corrupt shared state or produce false passes.
- Avoid asserting volatile implementation details. Assert stable externally visible status, contract, and resulting state.
- Do not run destructive actions against a shared environment unless the repository explicitly provides a safe isolated test target.
- Use the application's defined request and response model types when constructing requests or asserting responses. Do not use literal object/dictionary shapes when the application already provides those data structures.
- Use the application's serialization and deserialization functions at the request/response boundary whenever they are applicable. Do not implement parallel conversion logic in the test.

## Location

Preserve the repository convention. If none exists, use `tests/services/<feature>/<endpoint>.test.<ext>`, for example `tests/services/billing/create-invoice.test.ts`.

## Language Routing

Load exactly one language resource after selecting this layer:

| Language | Resource |
|---|---|
| Python | `languages/python.md` |
| TypeScript or JavaScript | `languages/typescript.md` |
