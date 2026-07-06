---
name: user-story-sentinel
description: Evaluate a requested user story or change before implementation by using the repo map to locate affected behavior, docs, tests, entrypoints, model states, and unknowns. Use when a developer provides a story, feature request, bugfix, refactor request, or PR plan and the repo may contain legacy, undocumented, or insufficiently tested behavior.
---

# User Story Sentinel

## Overview

Gate story work until the affected behavior is understood enough to change
safely. Prefer documenting observed behavior, adding characterization tests, and
asking targeted validation questions over implementing from guesses.

## Workflow

1. Read `.codex/repo-map/index.md`. If missing, stop and run
   `repo-knowledge-bootstrap`.
2. Read `references/readiness-gate.md`.
3. Locate likely affected domains, files, entrypoints, model states, external
   surfaces, and existing tests.
4. Compare the story against current docs, tests, and unknowns.
5. Classify readiness using one readiness state.
6. If blocked, produce a preparation plan: docs to draft, characterization tests
   to add, evidence to inspect, and human validation questions.
7. Do not implement the requested behavior until the gate is
   `READY_TO_IMPLEMENT` or the user explicitly overrides the gate.

## Output

Return:

- readiness state;
- affected areas and evidence paths;
- existing docs/tests found;
- missing characterization tests;
- unknowns and assumptions;
- human validation questions;
- next safe action.

## Resources

- `references/readiness-gate.md`: readiness states.
- `references/characterization-test-policy.md`: how to preserve current
  behavior before change.
- `references/human-validation-policy.md`: when and how to ask for validation.
