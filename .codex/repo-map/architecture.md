# Architecture

## Observed Layers

- fact/high: `server/src/domain/entities` contains entities such as `Asset`, `MediaFile`, `User`, `Session`, `Face`, and `WorkerExecution`.
- fact/high: `server/src/application/use_cases` contains use cases including `ImportMediaUseCase`, `IndexMediaUseCase`, `GetAssetsUseCase`, `LoginUseCase`, and user/admin actions.
- fact/high: `server/src/application/workers` contains background task runners such as `ImportTaskRunner`, `IndexTaskRunner`, media derivative runners, AI runners, and face runners.
- fact/high: `server/src/adapters/in/http` contains HTTP controllers and auth helpers.
- fact/high: `server/src/adapters/out/database` contains SQLite repositories, mappers, schema initialization, unit of work, and outbox dispatch.
- fact/high: `server/src/adapters/out/services` contains local side-effect adapters for media processing, Ollama, face detection, vector memory, avatars, and event bus.

## Import Pipeline Shape

- fact/high: `server/src/index.ts` constructs `CommandLineMediaProcessingService`, `ImportMediaUseCase`, `ImportTaskRunner`, `IndexTaskRunner`, and `PipelineCoordinatorService`.
- fact/high: `ImportTaskRunner` uses `import-worker` as its worker ID and processes files found under its configured import directory.
- fact/high: `ImportMediaUseCase` does not expose an HTTP API directly; it operates on a filesystem `sourcePath`.
- hypothesis/medium: A mobile-upload feature can fit the current design by writing completed uploads into `IMPORT_DIR` and letting `import-worker` process them.

## Mixed Concerns

- risk/medium: `server/src/index.ts` currently contains route registration, environment parsing, object composition, worker registration, health checks, SSE, and static hosting in one file.
- risk/medium: Avatar upload currently uses `multer` inside `AuthController`; a larger media upload surface should probably receive its own controller and storage service to avoid mixing profile-avatar and library-ingest responsibilities.
