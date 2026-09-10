# Integration Tests

## Purpose

Integration tests prove internal behavior across application boundaries while external resources remain controlled. They commonly exercise routing, use-case orchestration, a service layer, repositories/adapters, serialization, and API contracts with mocked, fake, in-memory, or otherwise deterministic dependencies.

They do not call a real deployed endpoint, browser, database, external service, or system clock. The objective is reproducible internal confidence: confirm that collaborating components exchange the correct data and handle dependency outcomes correctly.

## Expectations

- Define the boundary under control and use a deterministic fake or mock only at that boundary.
- Test public behavior and contracts, not mock call counts unless the interaction itself is the contract.
- Cover successful flows, dependency failures, validation failures, authorization/absence cases, and meaningful boundaries.
- Keep fixtures focused and local to the feature; reset state between tests.
- Do not use `Date.now()` or ambient system time. Inject a fixed clock if time behavior is relevant.
- Ensure mocks return realistic shapes so the test represents production contracts.
- Use application-defined request, response, and domain model types for structured test data. Do not recreate their shapes with literal objects/dictionaries when those types already exist.
- When production serialization or deserialization functions are part of the exercised boundary, use those functions with the defined request/response models. Do not recreate conversion logic in test setup or assertions.

## Location

Preserve the repository convention. If none exists, use `tests/integration/<feature>/<associated-functionality>.test.<ext>`, for example `tests/integration/orders/create-order.test.ts`.

## Layer Boundary

An integration test may exercise an internal class named `Service`, but that does not make it a service E2E test. Use service tests only when the test sends requests through a real endpoint to configured real resources.

## Language Routing

Load exactly one language resource after selecting this layer:

| Language | Resource |
|---|---|
| Python | `languages/python.md` |
| TypeScript or JavaScript | `languages/typescript.md` |
