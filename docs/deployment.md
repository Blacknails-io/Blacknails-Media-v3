# Deployment

## Local Development

Install dependencies and run the server/client separately:

```bash
npm install
npm run build --workspace=@blacknails/shared
npm run dev --workspace=blacknails-media-v3-server
npm run dev --workspace=blacknails-media-v3-client
```

The backend defaults to `PORT=3000`. The client dev server proxies through browser-relative `/api/*` paths in normal local use.

## Production Build

```bash
npm run build --workspace=@blacknails/shared
npm run build --workspace=blacknails-media-v3-server
npm run build --workspace=blacknails-media-v3-client
npm run start --workspace=blacknails-media-v3-server
```

When `client/dist` exists, the backend serves the React app and API from the same origin.

## Docker Compose

```bash
docker compose up -d --build
```

Current compose notes:

- API container: `blacknails-media-v3-api`.
- Container port: `3000`.
- Host port: `3003`.
- Mounted persistent paths: `data/`, `library/import`, `library/originals`, `library/archive`, `library/storage`.
- External network: `ai_network`.
- Ollama target in compose: `http://ollama-rocm:11434`.

## Nginx

For `https://media.blacknails.io`, proxy to the backend origin that serves both API and built frontend. With the current compose file, that is usually `http://127.0.0.1:3003` from the host.

Minimum proxy expectations:

- Preserve `Host`, `X-Forwarded-Proto`, `X-Forwarded-For`.
- Do not strip `Set-Cookie`.
- Allow Server-Sent Events on `/api/events/stream` without buffering.
- Use HTTPS in front of the app so `COOKIE_SECURE=true` cookies are accepted by browsers.

## First Boot Checklist

1. Copy `.env.example` to the deployment environment.
2. Set a strong `ADMIN_USER` and `ADMIN_PASS` before the first start.
3. Keep `ALLOW_PUBLIC_REGISTRATION=false` unless explicitly testing registration.
4. Confirm `DATABASE_PATH` and all library paths point at persistent storage.
5. Build client before relying on backend static hosting.
6. Verify `/health` through Nginx and then log in through the public URL.
