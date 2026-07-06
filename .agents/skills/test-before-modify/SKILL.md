---
name: test-before-modify
description: Use this skill before creating or modifying any class or module in the codebase. It ensures the agent designs, writes, and executes unit tests for the changes before writing the implementation code.
---

# Test Before Modify

## Goal
To guarantee that all code modifications, refactorings, or new classes are fully covered by unit/integration tests by designing and implementing the test cases before or alongside writing the implementation code.

## When to use this skill
- Before creating any new class, function, or module in the codebase.
- Before modifying or refactoring any existing logic.
- Whenever a bug fix or new feature implementation is requested.

## When NOT to use this skill
- When modifying files that do not contain execution logic (e.g., `.md` documentation, configuration files like `package.json`, or environment files).
- For purely exploratory, investigatory, or read-only tasks.
- If the user explicitly instructs to skip writing tests.

## Core Rules (Must Follow)
- **MUST** write or modify unit tests *before* writing or modifying any class or business logic.
- **MUST** use Node's native test runner (`node:test`) and assertion library (`node:assert`).
- **MUST** place test files under `server/tests/` matching the target file path, ending in `.test.ts`.
- **MUST** run the test suite with `npm run test` (in the `server/` directory) and verify everything passes.
- **NEVER** query live databases or external APIs; always mock repositories and services.

## Detailed Workflows & Examples
- **[TDD Step-by-Step Instructions](./references/instructions.md)**: Detailed instructions on planning, writing, and validating tests.
- **[TDD Examples](./examples/tdd-examples.md)**: Concrete comparisons showing the thought process, failing test creation, and implementation code.


