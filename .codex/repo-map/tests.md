# Tests

## Commands

- fact/high: `server/package.json` defines `npm run test -w server` as `node --import tsx --test 'tests/**/*.test.ts'`.
- fact/high: `server/package.json` defines `npm run build -w server` as `rimraf dist && tsc`.

## Existing Coverage

- fact/high: `server/tests/integration/import-pipeline.test.ts` covers importing photos/videos, indexer linking, unsupported rejection, duplicate skipping, copy mode, worker pending item reporting, and per-item events.
- fact/high: `server/tests/helpers/test-environment.ts` creates temporary import/originals/archive/storage dirs and wires `ImportMediaUseCase`, `ImportTaskRunner`, `IndexTaskRunner`, repositories, and a recording event bus.
- fact/high: `server/tests/unit/auth-session-cookie.test.ts` covers cookie and Bearer authentication behavior.
- fact/high: `server/tests/integration/index-worker.test.ts` seeds `OriginalFile` rows and exercises indexing behavior.

## Gaps For Mobile Sync

- unknown/high: No existing tests were found for a mobile media upload endpoint because that endpoint does not exist.
- unknown/high: No existing tests were found for resumable/chunked upload semantics.
- unknown/medium: No existing tests were found for recording a real device identifier into `media_files.source_device` during import.
