---
name: testing
description: >
  Guides repository-aware test setup, structure, implementation, fixes, and reviews
  across unit, integration, service, and UI layers. Use when asked to "set up tests",
  "add tests", "write unit tests", "fix a failing test", "test an endpoint", "add
  Playwright tests", "review test coverage", or organize a test suite. Do not use for
  generic debugging without a testing request or for dependency security audits.
---

# Testing

## Overview

Select the narrowest testing layer that proves the requested behavior, then follow the repository's established structure and tools. Prefer unit tests, use integration tests for internal orchestration with controlled boundaries, and reserve real-environment service and UI tests for a small number of critical user journeys.

**Announce at start:** "I'm using the testing skill."

## Resources

| Path | Load when |
|---|---|
| `resources/unit/unit-tests.md` | Designing, writing, fixing, or reviewing isolated behavior tests. |
| `resources/integration/integration-tests.md` | Testing internal behavior that crosses controlled or mocked boundaries. |
| `resources/service/service-tests.md` | Testing real HTTP, RPC, queue, or endpoint flows in a configured canary or local environment. |
| `resources/ui/ui-tests.md` | Testing real browser user journeys. |

## Configuration

These values are for the active agent. Defaults apply unless repository context or the user specifies otherwise. Example values must be discovered from repository documentation or requested when ambiguous.

| Variable | Purpose | Default/Example |
|---|---|---|
| (`TEST_ROOT`) | Test-directory convention | Default: preserve the repository's convention; otherwise `tests/` |
| (`TEST_LAYER`) | Layer selected for the requested behavior | Example: `unit`, `integration`, `service`, or `ui` |
| (`TEST_COMMAND`) | Smallest relevant verification command | Example: repository-defined targeted test command |
| (`E2E_ENVIRONMENT`) | Real environment used by service or UI tests | Example: documented `canary` or `local`; never infer credentials or URLs |

## Layer Selection

Classify by the behavior under test, not by the name of the production code:

| Layer | Use it for | Do not use it for |
|---|---|---|
| Unit | A deterministic function, model, value object, or utility with no infrastructure or external resource interaction. | Code that needs mocks or a running resource to execute. |
| Integration | Internal routing, orchestration, service logic, persistence adapters, or API contracts while dependencies are controlled, mocked, or in-memory. | A real deployed endpoint or browser journey. |
| Service | Real endpoint-level E2E flows through HTTP, RPC, queues, or similar interfaces against configured local or canary resources. | A project's internal class named "service" when no real endpoint is exercised. |
| UI | Real browser-based E2E user flows against configured local or canary resources. | Component-only rendering tests unless the project explicitly classifies them as UI tests. |

If multiple layers are plausible, choose the lowest layer that can establish confidence. A defect discovered in service or UI testing normally needs a unit or integration regression test as well, unless the issue is exclusively environment or browser integration behavior.

## Workflow

1. Inspect the repository before proposing structure or tooling. Identify languages, package/build manifests, existing test directories, test commands, CI configuration, test utilities, and environment documentation.
2. Preserve established naming, runners, fixtures, and layout. In a new or unstructured repository, place tests under `tests/unit/`, `tests/integration/`, `tests/services/`, or `tests/ui/`, grouped by feature and then associated type, behavior, endpoint, or flow.
3. Select (`TEST_LAYER`), state the reason briefly, and load only its layer resource. The layer resource selects the applicable language resource. Do not preload unrelated layers or language resources.
4. Cover meaningful expected behavior and expected failures or boundaries in unit and integration tests. Keep service and UI tests focused on critical successful flows; test most negative behavior below E2E.
5. Use application-defined model types, value objects, request/response types, and factories when they exist. Do not duplicate production models in test code or replace defined models with ad hoc literal object, dictionary, or primitive-shaped data. Literal scalar values remain appropriate as inputs and expected values when the test is specifically about that scalar behavior.
6. Give each test a behavior-oriented description. Add an assertion message when a comparison would otherwise be unclear or a failure needs context; do not add redundant messages to self-evident assertions.
7. Ensure the project documents the canonical locations for fixtures, test resources, and reusable test utilities in the repository `README.md` or applicable `AGENTS.md`. When that guidance is absent or stale, add or update it as part of test setup or material test-structure changes. Preserve existing documentation conventions and avoid duplicating the same guidance in both files.
8. For service or UI work, verify (`E2E_ENVIRONMENT`) and required configuration before writing runnable tests. Never invent URLs, credentials, fixtures, resource names, or cleanup capabilities. Ask one focused question or provide configuration guidance when they are absent.
9. Run (`TEST_COMMAND`) for the affected test or layer. If it cannot run because of a missing environment, dependency, or credential, report the exact blocker and do not claim verification passed.

## Test Distribution

Most tests should be unit tests. Integration tests should be the next largest group. Service and UI E2E tests should be intentionally sparse because they are slower, require real resources, and are more failure-prone. Optimize for confidence per test, not for matching a fixed percentage.

## Completion Checklist

- The selected layer matches the resource interactions exercised by the test.
- The test lives in the repository convention, or the default layer layout was used and stated.
- Test names describe observable behavior.
- Existing application model types are used rather than redefined in tests or replaced by ad hoc object/dictionary shapes.
- Unit and integration tests cover applicable happy paths plus failures or boundaries.
- Service and UI tests are idempotent, isolate their data, and clean up even after failures.
- The project documents fixture, test-resource, and reusable-test-utility locations in `README.md` or `AGENTS.md`.
- Assertions include useful context where ambiguity warrants it.
- The smallest relevant test command ran successfully, or its specific blocker is reported.

## Common Issues

### Existing tests use a different directory layout
Cause: The repository predates this skill or follows framework conventions.
Solution: Preserve the established layout. Recommend the default `tests/` layer layout only for new or unstructured codebases; do not migrate unrelated tests without a request.

### A real E2E test lacks an endpoint or credentials
Cause: Canary/local configuration has not been documented or supplied.
Solution: Do not guess values. Ask for the documented environment configuration or add only the test scaffolding and clearly state what configuration remains.

### A unit test needs mocks
Cause: The behavior crosses a boundary and is not isolated.
Solution: Move the test to integration, or extract a pure deterministic unit from the production code if that improves the design.
