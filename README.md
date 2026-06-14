# Quiniela Admin

Back-office for the quiniela (FIFA World Cup 2026 prediction pool). React + Vite +
Material UI + TanStack Query. Served at **`iaales.lat/admin`**; talks to the Go REST API
(`../quiniela-rest-api`) admin endpoints under `/api/v1/admin/*`.

## Develop

```bash
cp .env.example .env          # set VITE_API_BASE_URL (e.g. http://localhost:8000/api/v1)
npm install
npm run dev                   # http://localhost:5174/admin/
```

`npm run build` produces `dist/` (Vite `base: '/admin/'`). `npm run lint` type-checks.

## Auth

Admins are a separate identity from quiniela users — no Google sign-in. Login is email +
password against `/api/v1/admin/auth/login`; access requires the `ADMINISTRATOR` role,
re-checked server-side on every request. A freshly seeded admin has **no password** and must
set one via **Forgot password → email code → reset**.

## Features

- **Usuarios** — list with login type, payment status/methods/contact, whether they have
  predictions, and a bracket-consistency badge. Detail view shows profile, full
  consistency findings (R32 derivation + R16→final propagation), and an editable payment panel.
- **Partidos** — all games; edit a score manually or sync it from the live-score API.
- **Métodos de pago** — CRUD for the payment-method lookup.

## Deploy (CI)

`.github/workflows/deploy-web.yml` builds on push to `main` and rsyncs `dist/` to
`/var/www/iaales.lat/admin/` over SSH, mirroring the Flutter web deploy.

Required GitHub **secrets**: `SSH_PRIVATE_KEY`, `SSH_USER`, `SSH_HOST`.
Optional GitHub **variable**: `VITE_API_BASE_URL` (defaults to `https://iaales.lat/api/v1`).

### nginx (one-time, server-side)

Add this `location` block to the `iaales.lat` server block so the SPA is served under the
subpath with client-side routing fallback:

```nginx
location /admin/ {
    alias /var/www/iaales.lat/admin/;
    try_files $uri $uri/ /admin/index.html;
}
```

## Backend one-off: seed the administrator

Provisions `iharob@gmail.com` with the `ADMINISTRATOR` role and **no** password. Both
methods are idempotent; pick the one that fits the environment.

**Local / dev** (Go toolchain + DB access):

```bash
cd ../quiniela-rest-api && go run ./cmd/seed-admin
```

**Production** (single distroless binary — no Go toolchain; run the equivalent SQL inside the
postgres container, where the deploy already ships `model/seed-admin.sql`):

```bash
cd /opt/quiniela
set -a; . ./.env; set +a
docker compose exec -T postgres \
  psql -v ON_ERROR_STOP=1 -U "$DATABASE_USER" -d "$DATABASE_NAME" < model/seed-admin.sql
```

Then open `/admin`, use **Forgot password** to receive the code by email, and set the password.
