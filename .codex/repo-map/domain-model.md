# Domain Model

## Entities

- fact/high: `server/src/domain/entities/MediaFile.ts` defines `OriginalFile` with fields including `sourceDevice` and `importDate`.
- fact/high: `server/src/domain/entities/Asset.ts` defines media asset types used by the gallery and indexing pipeline.
- fact/high: `server/src/domain/entities/User.ts` defines roles consumed by auth and admin routes.

## SQLite Tables

- fact/high: `server/src/adapters/out/database/SqliteDatabase.ts` creates `assets`, `media_files`, `system_events`, `users`, `sessions`, `faces`, `persons`, and `worker_executions`.
- fact/high: `media_files.current_path` is unique and `file_hash` is stored for imported files.
- fact/high: `media_files.source_device` and `media_files.import_date` exist in the schema.
- fact/high: `assets` contains pipeline output columns such as `thumbnail_path`, `video_preview_path`, `ai_description`, `tags_json`, `title`, `faces_processed_at`, and `nsfw_processed_at`.

## Import Rules

- fact/high: `ImportMediaUseCase` allows `.jpg`, `.jpeg`, `.png`, `.webp`, `.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`, `.3gp`, and `.3g2`.
- fact/high: `ImportMediaUseCase` computes a SHA-1 hash from processed file content and skips duplicates by existing hash.
- fact/high: Imported originals are placed under `ORIGINALS_DIR/YYYY/MM` using a timestamp plus the first eight hash characters.
- fact/high: Current imported `OriginalFile` records use `sourceDevice: 'import-folder'`.

## Events And States

- fact/high: Import emits `ImportRejectedEvent`, `ImportFailedEvent`, `ImportDuplicateEvent`, and `MediaImportedEvent` from `server/src/application/events/SystemEvents.ts`.
- fact/high: `ImportTaskRunner` publishes worker lifecycle/per-item events with subsystem `IMPORT`.
