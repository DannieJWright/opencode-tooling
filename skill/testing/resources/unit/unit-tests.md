# Unit Tests

## Purpose

Unit tests prove isolated, deterministic behavior without infrastructure, time, network access, file systems, databases, processes, service calls, or other external resources. A unit is a behavior boundary, not necessarily a source file or class.

Test pure functions, model/value-object behavior, transformations, validation rules, calculations, parsers with supplied input, and state transitions. If executing the code would require a mock to avoid a resource interaction, it is not a unit-test target as-is. Prefer testing a pure extracted decision or transformation; otherwise use the integration layer.

## Expectations

- Test observable behavior rather than private implementation details.
- Cover representative valid inputs, expected errors, invalid inputs, and meaningful boundaries.
- Keep each test independent, deterministic, fast, and free from shared mutable state.
- Use existing application model types, value objects, and factories for structured test data. Do not duplicate production type definitions or use untyped literal objects/dictionaries when a model already defines the shape.
- Use explicit input and expected output values that make the business rule clear. Literal scalars are appropriate when the test targets scalar behavior.
- Name tests as a behavior: `returns_zero_for_an_empty_cart` or `rejects_an_expired_token`.
- Include a failure message for compound, collection, domain-object, or otherwise ambiguous comparisons. The message should identify the expectation and relevant input, not restate the assertion.

## Serialization Round Trips

When serialization and deserialization are paired inverse operations for a model, test their happy path together with one round trip. Construct the example using the existing application model type, then assert that deserializing the serialized model produces the original value.

```ts
const example: MyType = { foo: "foo", bar: 2 }

expect(fromYaml(toYaml(example))).toEqual(example)
```

Add focused tests separately for format-specific error handling, compatibility behavior, lossy conversions, or serialization details that the round trip cannot reveal.

## Language Routing

Load exactly one language resource after selecting this layer:

| Language | Resource |
|---|---|
| Python | `languages/python.md` |
| TypeScript or JavaScript | `languages/typescript.md` |

## Location

Preserve the repository convention. If none exists, use `tests/unit/<feature>/<associated-type>.test.<ext>` or the runner's idiomatic equivalent, such as `tests/unit/orders/money.test.ts` or `tests/unit/orders/test_money.py`.

## Boundary Check

Before adding a unit test, answer yes to every question:

- Can this behavior run without a mock, fake server, database, clock, file system, or environment-dependent value?
- Is the result fully determined by the supplied input and explicit state?
- Would failure identify a rule in this unit rather than an integration failure?

If any answer is no, use integration guidance instead.
