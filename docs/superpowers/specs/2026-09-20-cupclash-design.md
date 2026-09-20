# CupClash — Design Spec

World Cup betting & forecasting app for a group of friends: predict match scores, earn points, climb a leaderboard.

## Decisions (locked with user)

| Decision | Choice |
|---|---|
| Identity | Name-only login (no Auth.js). User types a name → server upserts a `users` row → client stores `{id, name}` in localStorage + Zustand. |
| Database | Aiven Postgres directly (`wcbet_aiven` usql connection, db `wcbet`). No local docker. |
| Package manager | pnpm (pinned via `packageManager` + mise) |
| Seed data | Dummy matches (~10, mixed status), ~5 users, sample predictions |

Trust ceiling: anyone can impersonate anyone via localStorage. Accepted for a private friends app. Auth.js can be added later.

## Stack

- Next.js 16 (App Router), TypeScript strict
- Tailwind CSS v4 + shadcn/ui (Radix)
- TanStack Query + ky (data fetching)
- Zustand (client state: user identity, match filters)
- Zod (env, API payloads)
- Drizzle ORM + drizzle-kit migrations → PostgreSQL
- pino (logging), `@vercel/otel` (tracing via `instrumentation.ts`)
- Vitest (unit), Playwright (e2e), Biome (lint/format), mise (node 22)

## Database schema (Drizzle)

```ts
users:       id (uuid pk), name (text unique), image (text nullable),
             total_points (int default 0), created_at (timestamptz)
matches:     id (uuid pk), home_team (text), away_team (text),
             kickoff_time (timestamptz), home_score (int nullable),
             away_score (int nullable),
             status (enum: 'upcoming' | 'in_progress' | 'finished')
predictions: id (uuid pk), user_id (fk→users), match_id (fk→matches),
             predicted_home_score (int), predicted_away_score (int),
             points_earned (int nullable),
             unique(user_id, match_id)
```

Note: `users.email` from the original brief is dropped — name-only identity makes email meaningless. `name` is unique instead (upsert key).

## Core logic

### Scoring — `lib/scoring.ts`

```ts
scorePrediction(pred: {home: number, away: number}, actual: {home: number, away: number}): 3 | 1 | 0
```

- 3 pts: exact score match
- 1 pt: correct outcome (home win / away win / draw), wrong score
- 0 pts: otherwise

### Locking — `lib/scoring.ts`

```ts
isLocked(kickoffTime: Date, now = new Date()): boolean  // now >= kickoffTime
```

Enforced server-side in `POST /api/predictions` (409 on locked). Mirrored client-side: inputs disabled + "Locked" badge.

### Match resolution — `lib/resolve.ts`

Single transaction:
1. Set `matches.home_score`, `away_score`, `status='finished'`
2. For each prediction on the match: compute `points_earned`
3. Recompute each affected user's `total_points = SUM(points_earned)` — idempotent, safe to re-resolve

## API (route handlers)

| Route | Behavior |
|---|---|
| `POST /api/users` | `{name}` → upsert by unique name, return `{id, name}` |
| `GET /api/matches?status=` | List matches, optional status filter. Includes caller's prediction when `x-user-id` header present. |
| `POST /api/predictions` | `x-user-id` header + zod body `{matchId, homeScore, awayScore}` (ints 0–20). Upsert on `(user_id, match_id)`. 409 if locked, 401 if no/unknown user. |
| `GET /api/leaderboard` | Users ordered by `total_points` desc, then name. |
| `POST /api/admin/resolve-match` | `{matchId, homeScore, awayScore}` → resolution transaction. Mock admin — no auth. |
| `GET /api/docs` | Scalar UI serving hand-written `lib/openapi.ts` spec. |

All errors: `{error: string}` with appropriate status. All routes logged via pino.

## Frontend

- **Providers** (`app/providers.tsx`): ThemeProvider (next-themes: light/dark/system), QueryClientProvider, user-store hydration from localStorage.
- **Layout**: header — "CupClash" title, nav (Matches, Leaderboard), theme toggle, user chip with switch-user. Dashboard container.
- **First visit**: name dialog → `POST /api/users` → store identity.
- **`/matches`**: match cards grouped by status (Zustand filter tabs: all/upcoming/live/finished). Upcoming + unlocked → two score inputs + Save (TanStack Query mutation, optimistic update, ky POST). Locked → badge + final score + user's prediction + points earned.
- **`/leaderboard`**: shadcn table — rank, name, points; crown icon on #1.
- **`/`** redirects to `/matches`.
- shadcn components: button, input, card, table, badge, avatar, dialog, sonner (toasts). Only what's used.

## Observability

- `lib/logger.ts`: pino, `pino-pretty` in dev.
- `instrumentation.ts`: `registerOTel({serviceName: 'cupclash'})` from `@vercel/otel`. No custom metrics pipeline.

## Testing

- **Vitest** (`tests/unit/`): `scoring.test.ts` — 3/1/0 cases + outcome edge cases (draw vs win); `isLocked` boundary (exactly at kickoff = locked). Pure functions, no DB.
- **Playwright** (`tests/e2e/`): one spec — enter name → dashboard → type scores on a seeded far-future match → submit → prediction persists. Runs against dev server + seeded Aiven DB; uses a dedicated seed match with kickoff year 2099.

## Repo files

`mise.toml` (node 22, pnpm), `biome.json` (strict lint+format, no ESLint/Prettier), `.editorconfig`, `AGENTS.md`, `DESIGN.md`, `docs/API.md`, `docs/SETUP.md`, `.env.example` (`DATABASE_URL`, validated by zod in `lib/env.ts`).

## Layout

```
app/            layout, page (redirect), providers, matches/, leaderboard/,
                api/{users,matches,predictions,leaderboard,admin/resolve-match,docs}
components/     header, theme-toggle, user-chip, name-dialog, match-card,
                prediction-form, leaderboard-table, ui/ (shadcn)
lib/            db.ts, schema.ts, scoring.ts, resolve.ts, logger.ts, env.ts,
                openapi.ts, api-client.ts (ky)
store/          user.ts, filters.ts
drizzle/        generated migrations
scripts/        seed.ts
tests/          unit/, e2e/
docs/           API.md, SETUP.md, superpowers/specs/
```

## Out of scope

Auth.js/OAuth, real WC2026 fixtures, email, admin auth, custom OTel metrics, deployment config.
