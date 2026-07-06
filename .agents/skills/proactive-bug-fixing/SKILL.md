---
name: proactive-bug-fixing
description: Use this skill whenever fixing a bug, resolving an exception, or encountering broken tests. It enforces the zero-broken-windows policy (fixing collateral bugs on the fly) and requires writing automated regression tests before applying bug fixes.
---

# Proactive Bug Fixing & Regression Testing

## Goal
To enforce a "Zero Broken Windows" policy by immediately fixing collateral bugs found during work, and ensuring every bug fix has an automated regression test to prevent future occurrences.

## When to use this skill
- Whenever you encounter a bug, runtime exception, or failing test while working on another task.
- Whenever the user explicitly asks you to fix a bug or resolve a crash.
- During any bug-fixing phase.

## When NOT to use this skill
- During ordinary feature development or design styling where no bugs or regressions are being addressed.

## Core Rules (Must Follow)
- **MUST** adopt a proactive attitude: if you find a minor bug, crash, or lint error while working on something else, do not ignore it—**fix it immediately**.
- **MUST** write an automated test reproducing the failure *before* applying the fix, or immediately after (Test-Driven Bug Fixing).
- **NEVER** close a bug-fixing task or declare it completed without committing its corresponding automated regression test.
- **MUST** run the test execution script **[run_changed_tests.sh](./scripts/run_changed_tests.sh)** to run tests affected by git changes.
- **MUST** isolate backend regression tests using in-memory databases (e.g., `:memory:` in SQLite) to avoid contaminating development databases.

---

## Detailed Workflows & Examples
- **[Bug Regression Test Template](./examples/node-regression-test-template.md)**: A boilerplate for writing database-isolated tests using Node.js's native test runner and assert libraries.
