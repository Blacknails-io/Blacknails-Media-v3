---
name: user-story-sentinel
description: Evaluate a requested user story or change before implementation by using the repo map to locate affected behavior, docs, tests, entrypoints, and unknowns. Use when a developer provides a story, feature request, bugfix, or refactor plan.
---

# User Story Sentinel

## Goal
To gate user story implementation until the affected behavior, domains, and tests are understood well enough to proceed safely without breaking legacy features.

## When to use this skill
- Whenever a new feature request, bugfix story, refactoring task, or PR plan is assigned.
- Before writing any implementation code on complex or undocumented areas of the codebase.

## When NOT to use this skill
- For minor, standalone tweaks (like fixing simple typos or modifying CSS animations).

## Core Rules (Must Follow)
- **MUST** locate the target domain files, entrypoints, model states, database schemas, and existing tests using `.codex/repo-map/index.md` (run `repo-knowledge-bootstrap` first if missing).
- **MUST** classify task readiness into a single readiness state (e.g., `READY_TO_IMPLEMENT` or `PREPARATION_NEEDED`) before editing source files.
- **NEVER** write implementation code while the readiness state is blocked (requires preparation) unless explicitly overridden by the user.
- **MUST** create a preparation plan outlining human validation questions, evidence to inspect, and characterization tests to draft if the gate is blocked.

---

## Detailed Workflows & Examples
- **[Readiness Gate Checklist](./references/readiness-gate.md)**: Details on readiness states, gates, and requirements.
- **[Characterization Test Policy](./references/characterization-test-policy.md)**: Guidelines on how to write tests that lock down existing behavior before applying changes.
- **[Human Validation Policy](./references/human-validation-policy.md)**: Framework on when and how to ask the developer for architectural clarifications.
