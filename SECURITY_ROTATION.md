# Security Rotation Checklist

This checklist hardens the project after any secret-exposure risk (lost
laptop, accidental commit, agent transcripts containing `.env`, contributor
offboarding, ...). The repository is configured so that real `.env` files are
gitignored, but values held on disk are not protected by `.gitignore` and must
be rotated whenever exposure is suspected.

## When to rotate

Rotate immediately if any of the following is true:

- `backend/.env` contents were shared in chat/screenshots/AI agent transcripts.
- A laptop or developer account with workspace access was lost / compromised.
- A contributor with access leaves the team.
- A new environment is being promoted to production for the first time.

## 1) Rotate the Laravel app key

```bash
cd backend
php artisan key:generate --force
```

`APP_KEY` is used to sign cookies and encrypt session payloads. Rotating it
invalidates any existing encrypted state (acceptable: this app is JWT-based
and stateless, sessions are not used).

## 2) Rotate the JWT secret

```bash
cd backend
php artisan jwt:secret --force
```

`JWT_SECRET` signs every access token. After rotation **all currently issued
JWTs become invalid** - users will be forced to log in again. This is the
intended behaviour.

## 3) Rotate the proxy shared secret

```bash
# Pick any high-entropy value; 64 hex chars is plenty.
openssl rand -hex 32
```

Update **both** sides with the new value:

- `backend/.env`            -> `BACKEND_PROXY_SECRET=<new value>`
- `frontend/.env*` (Next.js runtime) -> `BACKEND_PROXY_SECRET=<new value>`

Both sides must hold the same value or every API call will be rejected with
`403`. The bootstrap guard now refuses to boot without this secret in any
non-`local`/non-`testing` environment.

## 4) Invalidate old auth sessions/tokens

- Deploy new secrets.
- Force re-login for users; communicate the impact if needed.
- Verify old tokens are rejected (`/api/auth/me` should return `401`).

## 5) Workspace hygiene

- Keep real values **only** in your runtime secret manager / server env.
- Local development `.env` files must stay outside backups / public archives.
- `.env.example` files are the only env templates allowed in the repo and must
  contain placeholder values exclusively.

## 6) Post-rotation smoke checks

Run end-to-end against staging or a clean local:

- `POST /api/auth/register`, then `POST /api/auth/login`
- Authenticated calls: `GET /api/auth/me`, `GET /api/cart`, `POST /api/orders`
- Admin calls: `POST /api/products` with an admin JWT (factory state
  `User::factory()->admin()`)
- Cart and order rate limits respond `429` after 30/min and 10/min respectively.

If any of the above behaves unexpectedly, the rotation was incomplete -
re-check that **frontend and backend** received the new secrets and were
restarted.
