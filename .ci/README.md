# `.ci/` — local CI (workflows moved out of `.github/`)

These workflow YAMLs used to live in `.github/workflows/`. They were moved here so
**GitHub Actions no longer runs them** (no Actions minutes / billing). The YAMLs are kept
verbatim as the source of truth.

CI is intended to run **locally in Docker** via **`cihere`** — a standalone local runner
(its own repo at `../cihere`, installed on `$PATH`). See `../quiniela/.ci/` for a worked
example (`runner.yaml` + `images/` + secret wiring).

## Workflows here

| File | What it does |
|------|--------------|
| `workflows/deploy-web.yml` | `npm ci` + lint + `npm run build`, then SSH-deploys `dist/` to the droplet at `/var/www/iaales.lat/admin` |

## Status

- ✅ Moved out of `.github/` → GitHub no longer executes this workflow.
- ⚠️ **Auto-deploy-on-push to iaales.lat/admin is therefore OFF.** Build (`npm run build`) and
  rsync `dist/` to the server by hand until the local runner is wired up.
- ⏳ `runner.yaml` + `images/` for this repo's toolchain (Node 22 / Vite) are **not yet
  authored**, so the pipeline is not runnable under `cihere` yet. The deploy job also uses the
  SSH/rsync `run:` steps, which need support added to `cihere` first.

## Next steps to run locally

1. Add `runner.yaml` (image, `runs-on`→image map, secret sources, per-`uses:` action policy).
2. Add `images/<name>/Dockerfile` with Node 22.
3. `cihere run deploy-web --event push --ref refs/heads/main`

See `../quiniela/.ci/README.md` for the full pattern.
