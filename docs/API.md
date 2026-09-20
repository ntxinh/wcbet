# CupClash API

Interactive version: **`/api/docs`** (Scalar, spec at `/api/openapi.json`).

Base: `/api`. All bodies/responses are JSON. Errors are `{ "error": "..." }` with a 4xx status.

Identity: send `x-user-id: <uuid>` (from `POST /api/users`) on authenticated calls.

---

## POST /api/users

Name-only login. Upserts a user by unique name — same name returns the same user.

**Body**

```json
{ "name": "Alice" }
```

`name`: string, trimmed, 1–30 chars.

**Responses**

- `200` → `{ "id": "uuid", "name": "Alice" }`
- `400` → `{ "error": "Invalid name" }`

```bash
curl -X POST http://localhost:3000/api/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"Alice"}'
```

---

## GET /api/matches

List matches, kickoff-ascending. Optional `?status=upcoming|in_progress|finished` filter.

**Headers**: `x-user-id` optional — when present and valid, each match carries the caller's `prediction` (or `null`).

**Responses**

- `200` →

```json
[
  {
    "id": "uuid",
    "homeTeam": "USA",
    "awayTeam": "Canada",
    "kickoffTime": "2026-09-23T18:00:00.000Z",
    "homeScore": null,
    "awayScore": null,
    "status": "upcoming",
    "prediction": {
      "predictedHomeScore": 2,
      "predictedAwayScore": 1,
      "pointsEarned": null
    }
  }
]
```

`prediction` is `null` when the caller hasn't predicted (or no/invalid `x-user-id`).

- `400` → `{ "error": "Invalid status" }`

```bash
curl 'http://localhost:3000/api/matches?status=upcoming' \
  -H 'x-user-id: 11111111-2222-3333-4444-555555555555'
```

---

## POST /api/predictions

Create or update the caller's prediction for a match. One row per `(user, match)` — re-posting edits it until kickoff.

**Headers**: `x-user-id` required.

**Body**

```json
{ "matchId": "uuid", "homeScore": 2, "awayScore": 1 }
```

`homeScore`/`awayScore`: integers 0–20.

**Responses**

- `200` → the prediction row (`id`, `userId`, `matchId`, `predictedHomeScore`, `predictedAwayScore`, `pointsEarned`)
- `400` → `{ "error": "Invalid prediction" }`
- `401` → `{ "error": "Not authenticated" }` (missing/unknown `x-user-id`)
- `404` → `{ "error": "Match not found" }`
- `409` → `{ "error": "Match is locked" }` (kickoff has passed)

```bash
curl -X POST http://localhost:3000/api/predictions \
  -H 'Content-Type: application/json' \
  -H 'x-user-id: 11111111-2222-3333-4444-555555555555' \
  -d '{"matchId":"<match-uuid>","homeScore":2,"awayScore":1}'
```

---

## GET /api/leaderboard

All users by points.

**Responses**

- `200` →

```json
[
  { "id": "uuid", "name": "Alice", "image": null, "totalPoints": 7 }
]
```

Ordered by `totalPoints` desc, then `name` asc.

```bash
curl http://localhost:3000/api/leaderboard
```

---

## POST /api/admin/resolve-match

Set a match's final score and score every prediction in one transaction (3/1/0, recomputes `total_points`). Idempotent — safe to re-resolve with a corrected score. **No auth** — trusted-caller only.

**Body**

```json
{ "matchId": "uuid", "homeScore": 2, "awayScore": 1 }
```

**Responses**

- `200` → the updated match row (`status: "finished"`)
- `400` → `{ "error": "Invalid body" }`
- `404` → `{ "error": "Match not found" }`

```bash
curl -X POST http://localhost:3000/api/admin/resolve-match \
  -H 'Content-Type: application/json' \
  -d '{"matchId":"<match-uuid>","homeScore":2,"awayScore":1}'
```

---

## GET /api/openapi.json · GET /api/docs

Hand-written OpenAPI 3.1 spec (`lib/openapi.ts`) and the Scalar UI rendering it.
