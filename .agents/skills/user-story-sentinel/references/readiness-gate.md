# Readiness Gate

Before implementation, classify the story as:

- `READY_TO_IMPLEMENT`: affected behavior has enough map context, tests, and
  validated assumptions.
- `NEEDS_REPO_MAP`: `.codex/repo-map` is missing or too stale for the touched
  area.
- `NEEDS_CHARACTERIZATION_TESTS`: current behavior is not covered by tests.
- `NEEDS_FUNCTIONAL_DOC_VALIDATION`: observed behavior must be validated by a
  human before treating it as intended.
- `BLOCKED_FOR_HUMAN_VALIDATION`: implementation would require guessing.

Prefer a small preparatory PR over direct implementation when behavior is
unclear.
