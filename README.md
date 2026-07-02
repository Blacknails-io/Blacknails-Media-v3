# Blacknails Media v3

Blacknails Media v3 is a private local-first media library for importing, indexing, browsing, and enriching photos/videos with local AI.

## Requirements

- Node.js 22 for local development, or Docker for server deployment.
- npm workspaces.
- SQLite via `better-sqlite3`.
- ffmpeg/exiftool for media processing.
- Optional: Ollama for descriptions, tags, titles, NSFW and face workflows.

## Install

```bash
npm install
cp .env.example .env
```

## Build and Test

```bash
npm run build --workspace=@blacknails/shared
npm run build --workspace=blacknails-media-v3-server
npm run build --workspace=blacknails-media-v3-client
npm run test --workspace=blacknails-media-v3-server
```

If `better-sqlite3` was built with a different Node ABI, rebuild it:

```bash
npm rebuild better-sqlite3
```

## Run Locally

API/server:

```bash
npm run dev --workspace=blacknails-media-v3-server
```

Client dev server:

```bash
npm run dev --workspace=blacknails-media-v3-client
```

The production server can serve `client/dist` from the backend when the client has been built.

## Docker

```bash
docker compose up -d --build
```

The compose file exposes the API container on host port `3003` and mounts `data/` plus `library/` subdirectories.

## First Admin User

Set `ADMIN_USER` and `ADMIN_PASS` before first boot. The server seeds that account as `ADMIN` if it does not already exist.

Optional `PARTNER_USER` and `PARTNER_PASS` seed a restricted `VIEWER` account. There is no runtime `PARTNER` role in the alpha; implemented roles are `ADMIN`, `STANDARD`, and `VIEWER`.

See `docs/deployment.md` and `docs/security.md` for operational notes.
