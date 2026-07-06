# Domain Signal Detection

Look for signals that help future agents locate important behavior quickly.

High-value signals:

- Classes or files named `*Service`, `*UseCase`, `*Repository`, `*Controller`,
  `*Worker`, `*Policy`, `*Rule`, `*Model`, `*Entity`, `*DTO`, `*Event`.
- Enums and union types, especially status-like values.
- Constants containing state names, worker names, queue names, event names,
  feature names, routes, roles, permissions, media types, model names, or
  storage paths.
- Database table names, migration DDL, schema definitions, indexes, foreign
  keys, and seed data.
- Event topics, SSE event names, Kafka/Rabbit/queue identifiers, outbox tables,
  and pub/sub handlers.
- API route handlers, frontend routes, CLI commands, cron jobs, workers, and
  background processors.

Classify signals as:

- `model`: entity, aggregate, DTO, schema, value object, persisted shape.
- `state`: enum, status, lifecycle marker, queue state, job state.
- `entrypoint`: external call into the system.
- `side-effect`: DB write, event publish, file-system write, external API,
  model inference, shell command.
- `coordination`: scheduler, pipeline, queue, worker orchestration.
