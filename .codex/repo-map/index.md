# Repo Map

Generated: 2026-07-11T16:21:14Z

Scope: technical orientation for the current Blacknails Media v3 checkout, focused on the backend import pipeline and HTTP/API surfaces relevant to mobile media sync.

## Files

- [architecture.md](architecture.md): observed layers and boundaries.
- [entrypoints.md](entrypoints.md): HTTP routes, workers, scripts, and server boot.
- [domain-model.md](domain-model.md): domain entities, SQLite tables, states, and media metadata.
- [external-surfaces.md](external-surfaces.md): filesystem, auth, binaries, AI services, and environment variables.
- [tests.md](tests.md): available test commands and covered areas.
- [risks-and-unknowns.md](risks-and-unknowns.md): risks, unknowns, and validation questions.

## High-Value Facts

- fact/high: The backend is a Node/Express service composed in `server/src/index.ts`; it wires SQLite, repositories, use cases, controllers, workers, protected media static routes, SSE, and optional frontend static hosting.
- fact/high: The project is a npm workspace with `shared`, `server`, and `client` packages (`package.json`).
- fact/high: Authentication accepts `Authorization: Bearer <token>` or the `bn_session` cookie through `server/src/adapters/in/http/auth.ts`.
- fact/high: The current ingest path is filesystem-first: `IMPORT_DIR` defaults to `./library/import`, `ImportTaskRunner` scans that folder recursively, and `ImportMediaUseCase` imports allowed image/video files into `ORIGINALS_DIR`.
- fact/high: `ImportMediaUseCase` computes a SHA-1 file hash, rejects unsupported extensions, skips duplicate hashes, and creates `media_files` rows with `sourceDevice: 'import-folder'`.
- fact/high: Integration tests cover import/index behavior, duplicate skipping, unsupported-file rejection, copy mode, and worker IDs in `server/tests/integration/import-pipeline.test.ts`.
