# Setup

## Prerequisites

- **mise** — installs the pinned toolchain (`mise.toml`: node 22, pnpm 9). Get it at https://mise.jdx.dev
- A Postgres `DATABASE_URL` (the project uses a shared **Aiven** instance — ask for the URL; `sslmode=require` is needed)

## Install

```bash
mise install        # node 22 + pnpm 9
pnpm install
```

## Environment

```bash
cp .env.example .env
```

Edit `.env` and set the real Aiven URL:

```
DATABASE_URL=postgresql://user:pass@host:5432/wcbet?sslmode=require
```

`lib/env.ts` zod-validates env at boot — the app refuses to start without a valid `DATABASE_URL`.

> **Warning — shared DB.** This URL points at a shared remote database. `pnpm db:seed` **deletes every row** in `predictions`, `matches`, `users` before reseeding. Never drop/truncate tables or run destructive migrations.

## Database

```bash
pnpm db:migrate     # apply drizzle/*.sql migrations
pnpm db:seed        # wipe + reseed demo users, matches, predictions
```

The seed creates 5 users (Alice–Erin), 3 finished matches, 1 live, 6 upcoming — including **`E2E United` vs `Test FC`** (kickoff 2099), which the Playwright test depends on. Don't remove it.

## Run

```bash
pnpm dev            # http://localhost:3000 — Turbopack
```

- `/matches` — predict scores (name dialog prompts for identity on first visit)
- `/leaderboard` — points table
- `/api/docs` — interactive API reference

## Tests

```bash
pnpm test           # vitest — tests/unit (scoring rules)
pnpm test:e2e       # playwright — tests/e2e
pnpm lint           # biome check .
pnpm exec tsc --noEmit
```

**Playwright notes**

- Requires a **seeded DB** — the test predicts on the `E2E United` card; run `pnpm db:seed` first.
- Uses port **3100**, not 3000 (`playwright.config.ts` assumes 3000 is taken by other dev servers). It auto-starts `pnpm dev --port 3100` and reuses an already-running server.
- First run may need `pnpm exec playwright install` for browser binaries.

## Troubleshooting

- `envSchema.parse` throws on boot → `.env` missing or `DATABASE_URL` malformed.
- DB connection errors → check `sslmode=require` is in the URL; Aiven rejects non-SSL.
- Port 3100 busy during e2e → stop the other server or let `reuseExistingServer` reuse it.
