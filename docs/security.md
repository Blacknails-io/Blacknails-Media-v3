# Security Notes

## Authentication

Sessions are stored in SQLite. The backend accepts either:

- `Authorization: Bearer <token>` for API fetches.
- `bn_session` cookie for browser-loaded media, avatars, and Server-Sent Events.

The login endpoint sets `bn_session` with `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` when `NODE_ENV=production` or `COOKIE_SECURE=true`. Logout clears the cookie via `POST /api/auth/logout`.

## Roles

Implemented roles are:

- `ADMIN`: access to user management, pipeline controls, protected people mutations, and all viewer capabilities.
- `STANDARD`: reserved for future non-admin workflows.
- `VIEWER`: can authenticate and read protected gallery/media/people data.

The alpha plan mentioned `PARTNER`, but the current runtime does not implement that role. `PARTNER_USER` / `PARTNER_PASS` seed a `VIEWER` account for restricted sharing.

Role values are validated in application use cases before persistence.

## Protected Routes

These require a valid session:

- `/api/assets`
- `/api/media/originals/*`
- `/api/media/storage/*`
- `/static/users/*`
- `/api/events/stream`
- `/api/people*`
- `/api/admin*`

`/health` remains public for uptime checks. `/api/auth/login` is public by design. `/api/auth/register` is blocked unless `ALLOW_PUBLIC_REGISTRATION=true`.

## Operational Defaults

- Keep `ENABLE_TEST_ENDPOINTS=false` outside test/dev work.
- Keep `ALLOW_PUBLIC_REGISTRATION=false` for personal deployments.
- Use HTTPS and set `COOKIE_SECURE=true` behind Nginx.
- Do not expose `data/`, `library/`, thumbnails, sidecars, or originals directly from Nginx; serve them through the backend so auth applies.
