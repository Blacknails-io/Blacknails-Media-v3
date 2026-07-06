# Repo Map Contract

Write `.codex/repo-map/` as a technical orientation map for future model
sessions.

Required files:

- `index.md`: technical orientation and links to the rest.
- `architecture.md`: observed layers, module boundaries, and mixed concerns.
- `entrypoints.md`: REST routes, CLIs, workers, jobs, frontend roots, scripts,
  Docker entrypoints, consumers, and server boot files.
- `domain-model.md`: model classes, important types, enums, states, event names,
  tables, schemas, DTOs, and domain-like constants.
- `external-surfaces.md`: databases, queues, event buses, HTTP APIs, object
  storage, local binaries, environment variables, file-system surfaces, and
  Docker services.
- `tests.md`: test frameworks, commands, test locations, covered areas, and
  visible gaps.
- `risks-and-unknowns.md`: risky modules, mixed layers, unvalidated behavior,
  missing docs, fragile tests, and questions for humans.
- `manifest.json`: machine-readable summary, generated timestamp, and source
  counts.

Rules:

- Prefer evidence over explanation.
- Use repo-relative paths.
- Include confidence where behavior is not mechanically obvious.
- Distinguish current observed behavior from intended behavior.
- Do not generate confirmed functional documentation during bootstrap.
