# External Surfaces

## Framework And Tool Signals

- Dockerfile
  Type: container
  Confidence: high
  Evidence:
  - server/Dockerfile

- SQLite via better-sqlite3
  Type: database
  Confidence: high
  Evidence:
  - server/package.json

- Multer
  Type: file-upload
  Confidence: high
  Evidence:
  - server/package.json

- Vite
  Type: frontend-build
  Confidence: high
  Evidence:
  - client/package.json

- React
  Type: frontend
  Confidence: high
  Evidence:
  - client/package.json

- Express
  Type: http
  Confidence: high
  Evidence:
  - server/package.json

- TypeScript
  Type: language
  Confidence: high
  Evidence:
  - client/package.json
  - server/package.json
  - shared/package.json

- Oxlint
  Type: lint
  Confidence: high
  Evidence:
  - client/package.json

- fluent-ffmpeg
  Type: media-processing
  Confidence: high
  Evidence:
  - server/package.json

- Docker Compose
  Type: runtime
  Confidence: high
  Evidence:
  - docker-compose.yml

- Playwright
  Type: test
  Confidence: high
  Evidence:
  - client/package.json

## Services, Environment, And Side Effects

- SQLite via better-sqlite3
  Type: database
  Confidence: high
  Evidence:
  - server/package.json

- ai_network
  Type: docker-service
  Confidence: medium
  Evidence:
  - docker-compose.yml

- api
  Type: docker-service
  Confidence: medium
  Evidence:
  - docker-compose.yml

- client
  Type: docker-service
  Confidence: medium
  Evidence:
  - docker-compose.yml

- ADMIN_PASS
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- ADMIN_USER
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- ALLOW_PUBLIC_REGISTRATION
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/adapters/in/http/AuthController.ts

- API_URL
  Type: environment-variable
  Confidence: high
  Evidence:
  - client/vite.config.ts

- ARCHIVE_DIR
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- COOKIE_SECURE
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/adapters/in/http/auth.ts

- DATABASE_PATH
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- DESCRIPTION_INTERVAL_MS
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- ENABLE_TEST_ENDPOINTS
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- FACE_CLUSTER_INTERVAL_MS
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- FACE_CLUSTER_THRESHOLD
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- FACE_INTERVAL_MS
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- FACE_PYTHON_BIN
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- IMPORT_DIR
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- IMPORT_INTERVAL_MS
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- IMPORT_SCHEDULER_ENABLED
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- INDEX_INTERVAL_MS
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- INDEX_SCHEDULER_ENABLED
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- NODE_ENV
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/adapters/in/http/auth.ts

- NSFW_INTERVAL_MS
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- NSFW_THRESHOLD
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- OLLAMA_KEEP_ALIVE
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- OLLAMA_TEXT_CONCURRENCY
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- OLLAMA_TEXT_MODEL
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- OLLAMA_URL
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- OLLAMA_VISION_CONCURRENCY
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- OLLAMA_VISION_MODEL
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- ORIGINALS_DIR
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- PARTNER_PASS
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- PARTNER_USER
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- PORT
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- QDRANT_URL
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- SIDECARS_DIR
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- STORAGE_DIR
  Type: environment-variable
  Confidence: high
  Evidence:
  - server/src/index.ts

- TAGS_INTERVAL_MS
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- THUMBNAIL_INTERVAL_MS
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- THUMBNAILS_DIR
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- TITLE_INTERVAL_MS
  Type: environment-variable
  Confidence: high
  Evidence:
  - .env.example
  - server/src/index.ts

- Outbound HTTP usage
  Type: external-http
  Confidence: medium
  Evidence:
  - .venv-face/lib/python3.12/site-packages/pip/_vendor/urllib3/contrib/emscripten/emscripten_fetch_worker.js
  - client/src/App.tsx
  - client/src/components/AdminPeoplePanel.tsx
  - client/src/context/AuthContext.tsx
  - client/src/lab/liquid-glass/LiquidGlassLab.tsx
  - client/src/services/api/HttpAuthService.ts
  - client/src/services/api/HttpPipelineService.ts
  - server/src/adapters/out/services/QdrantVectorMemoryService.ts

- File-system access
  Type: file-system
  Confidence: medium
  Evidence:
  - server/src/adapters/in/http/AuthController.ts
  - server/src/adapters/out/database/SqliteDatabase.ts
  - server/src/adapters/out/services/CommandLineMediaProcessingService.ts
  - server/src/adapters/out/services/OllamaService.ts
  - server/src/adapters/out/services/XmlSidecarService.ts
  - server/src/application/services/PipelineCoordinatorService.ts
  - server/src/application/use_cases/ImportMediaUseCase.ts
  - server/src/application/use_cases/PurgeMediaUseCase.ts
  - server/src/application/use_cases/RegisterUseCase.ts
  - server/src/application/use_cases/UpdateAvatarUseCase.ts
  - server/src/application/workers/FaceTaskRunner.ts
  - server/src/application/workers/ImportTaskRunner.ts
  - server/src/application/workers/MediaDerivativeTaskRunners.ts
  - server/src/index.ts
  - server/tests/OllamaService.test.ts
  - server/tests/helpers/media-fixtures.ts
  - server/tests/integration/import-pipeline.test.ts
  - server/tests/integration/index-worker.test.ts
  - server/tests/integration/pipeline-resets.test.ts

- Multer
  Type: file-upload
  Confidence: high
  Evidence:
  - server/package.json

- fluent-ffmpeg
  Type: media-processing
  Confidence: high
  Evidence:
  - server/package.json
