# Entrypoints

## Server

- fact/high: `server/src/index.ts` is the server boot file and listens on `PORT` or `3000`.
- fact/high: `server/package.json` exposes `npm run build -w server`, `npm run test -w server`, `npm run start -w server`, and `npm run dev -w server`.
- fact/high: `server/src/index.ts` initializes SQLite through `initializeDatabase(DB_PATH)`.

## HTTP Routes

- fact/high: `POST /api/auth/login` returns the login result and sets the `bn_session` cookie in `server/src/adapters/in/http/AuthController.ts`.
- fact/high: `GET /api/auth/me` requires a valid session via `requireUser`.
- fact/high: `POST /api/auth/me/avatar` accepts a single `avatar` upload using `multer`.
- fact/high: `GET /api/assets`, `/api/people*`, `/api/media/originals/*`, `/api/media/storage/*`, `/static/users/*`, `/api/events/stream`, and `/api/admin*` are protected by `requireUser` or `requireAdmin` in `server/src/index.ts`.
- fact/high: `/health` is public and checks SQLite plus filesystem access to required directories.

## Workers

- fact/high: `ImportTaskRunner` id is `import-worker`, label is `Import Files`, provides `original_files`, and recursively scans the import directory.
- fact/high: `IndexTaskRunner` is registered after import in `server/src/index.ts`.
- fact/high: Import and index schedulers are controlled by `IMPORT_SCHEDULER_ENABLED` and `INDEX_SCHEDULER_ENABLED`.

## Client

- fact/high: `client/src/main.tsx` and `client/src/App.tsx` are present as frontend roots.
- risk/high: The current worktree shows many client files deleted or moved; client orientation should be refreshed before UI work.
