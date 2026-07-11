# External Surfaces

## Filesystem

- fact/high: `IMPORT_DIR` defaults to `./library/import`.
- fact/high: `ORIGINALS_DIR` defaults to `./library/originals`.
- fact/high: `ARCHIVE_DIR` defaults to `./library/archive`.
- fact/high: `THUMBNAILS_DIR` defaults to `./library/storage/thumbnails`.
- fact/high: `SIDECARS_DIR` defaults to `./library/storage/sidecars`.
- fact/high: `/health` creates/access-checks required directories if needed.

## Auth

- fact/high: `server/src/adapters/in/http/auth.ts` accepts either `Authorization: Bearer <token>` or `bn_session`.
- fact/high: `docs/security.md` documents Bearer auth for API fetches and cookie auth for browser-loaded media, avatars, and SSE.

## Local Binaries And Services

- fact/high: `CommandLineMediaProcessingService` is constructed for import/index/media processing.
- fact/high: `FACE_PYTHON_BIN` defaults to `python3`.
- fact/high: `OllamaService` uses `OLLAMA_URL`, `OLLAMA_VISION_MODEL`, `OLLAMA_TEXT_MODEL`, concurrency variables, and `OLLAMA_KEEP_ALIVE`.
- fact/high: `QDRANT_URL` toggles between `QdrantVectorMemoryService` and `NoopVectorMemoryService`.

## Environment

- fact/high: `.env.example` documents `COOKIE_SECURE=false` for LAN/plain HTTP deployments and recommends HTTPS with secure cookies for production.
- fact/high: `.env.example` keeps `IMPORT_SCHEDULER_ENABLED=false` and `INDEX_SCHEDULER_ENABLED=false` by default.
- risk/medium: A mobile app uploading over LAN should use HTTPS or a deliberately accepted local-trust setup before storing long-lived tokens.
