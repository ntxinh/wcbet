<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# CupClash — agent guide

World Cup score-prediction app. Users pick a name (no password), predict exact scores on upcoming matches, and earn points on a leaderboard.

## Stack

- Next.js 16 (App Router, `--turbopack` dev) + React 19 + TypeScript `strict`
- Tailwind CSS v4 (`@tailwindcss/postcss`) + shadcn-style components on **Base-UI** (`@base-ui/react`), not Radix
- Drizzle ORM → Postgres (Aiven, `ssl: 'require'`) via `postgres` driver
- TanStack Query v5 + ky (client data layer), Zustand (session + UI state)
- zod v4 for all input/env validation
- pino logging + `@vercel/otel` tracing (`instrumentation.ts`)
- Scalar API reference at `/api/docs` (spec: `/api/openapi.json`, source: `lib/openapi.ts`)
- Vitest (`tests/unit`), Playwright (`tests/e2e`), Biome (lint+format), mise (node 22 + pnpm 9)

## Commands

```bash
pnpm dev          # next dev --turbopack (port 3000)
pnpm lint         # biome check .
pnpm format       # biome check --write .
pnpm test         # vitest run (tests/unit)
pnpm test:e2e     # playwright test (spawns dev server on port 3100)
pnpm db:generate  # drizzle-kit generate → drizzle/*.sql
pnpm db:migrate   # drizzle-kit migrate
pnpm db:seed      # tsx scripts/seed.ts — DESTRUCTIVE, wipes all rows
pnpm exec tsc --noEmit   # typecheck
```

## Layout

```
app/                 App Router pages + API routes
  api/users/         POST — name-only login (upsert by name)
  api/matches/       GET — match list, optional ?status=, joins caller's prediction via x-user-id
  api/predictions/   POST — upsert prediction, 409 once kickoff passed
  api/leaderboard/   GET — users ordered by total_points
  api/admin/resolve-match/  POST — set final score, score all predictions
  api/docs/          Scalar UI; api/openapi.json/ serves lib/openapi.ts spec
  matches/ leaderboard/    pages (client components + TanStack Query)
components/          match-card, prediction-form, name-dialog, leaderboard-table, ui/ (Base-UI)
lib/                 schema.ts (drizzle tables), scoring.ts (3/1/0 + lock), resolve.ts (tx),
                     db.ts, api.ts (requireUser/uuidOrNull), api-client.ts (ky + x-user-id hook),
                     openapi.ts, env.ts (zod env), logger.ts (pino), types.ts
store/               user.ts (zustand persist 'cupclash-user'), filters.ts (status tab)
scripts/seed.ts      wipes + reseeds users/matches/predictions
tests/unit/          vitest (scoring.test.ts)
tests/e2e/           playwright (predict.spec.ts)
drizzle/             generated migrations + meta
```

## Conventions

- **Biome, not ESLint/Prettier.** `pnpm lint` = `biome check .`; single quotes, no semicolons, 2-space, 100 cols, organize-imports on. Run `pnpm format` before committing.
- **`@/` alias** maps to repo root (`tsconfig` paths). Always `@/lib/...`, never deep relative imports.
- **zod-validate every input**: request bodies (`safeParse` → 400), query params, env (`lib/env.ts` throws at boot). No `as` casts on untrusted data.
- **Identity = `x-user-id` header** carrying the user's uuid. Client sets it via a ky `beforeRequest` hook reading the zustand store. Server: `requireUser(req)` → user row or 401. There is no password/session — treat the header as self-asserted (see DESIGN.md trust ceiling).
- **Scoring 3/1/0** (`lib/scoring.ts`): exact score → 3, correct outcome (home/draw/away) → 1, else 0.
- **Lock at kickoff**: `isLocked(kickoffTime)` = `now >= kickoff`. Predictions route returns 409 after that; upsert (`onConflictDoUpdate` on `(user_id, match_id)`) means re-submitting edits the same row until lock.
- **Resolution is one transaction** (`lib/resolve.ts`): set score+status → score each prediction → recompute `total_points` as `sum(points_earned)`. Idempotent — safe to re-resolve.
- API errors: `Response.json({ error }, { status })` via `jsonError`. Success: `Response.json(row)`.
- New UI primitives: shadcn-style files in `components/ui/` wrapping `@base-ui/react` — match existing files, don't add Radix.

## Gotchas

- **Shared remote Aiven DB.** `DATABASE_URL` in `.env` points at a shared instance — NEVER drop/truncate tables or run destructive migrations. `pnpm db:seed` deletes all rows in `predictions`, `matches`, `users`; only run it when you intend a full reseed.
- **`E2E United` seed match is load-bearing.** `tests/e2e/predict.spec.ts` looks for a card containing "E2E United" (kickoff 2099, never locks). Removing that fixture from `scripts/seed.ts` breaks playwright.
- **Playwright needs a seeded DB** and uses port **3100** (3000 is assumed taken). `webServer` auto-starts `pnpm dev --port 3100`, `reuseExistingServer: true`.
- **Base-UI, not Radix.** Dialog/Tabs/etc. come from `@base-ui/react` — different prop API (`disablePointerDismissal`, `showCloseButton`). Don't `npm i radix`.
- `AGENTS.md` top block is auto-written by `next dev` — leave it; editing/removing it just re-creates a diff.
- `x-user-id` is spoofable by design (name-only identity). Don't build features that assume it's proof of identity.
