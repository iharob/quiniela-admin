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

In `../quiniela-rest-api`, after applying the schema/migration:

```bash
go run ./cmd/seed-admin           # provisions iharob@gmail.com with role ADMINISTRATOR (no password)
```

Then open `/admin`, use **Forgot password** to receive the code by email, and set the password.
