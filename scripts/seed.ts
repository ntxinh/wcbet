import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { resolveMatch } from '@/lib/resolve'
import { matches, predictions, users } from '@/lib/schema'

const DAY = 24 * 60 * 60 * 1000
const now = Date.now()

async function main() {
  await db.delete(predictions)
  await db.delete(matches)
  await db.delete(users)

  const userRows = await db
    .insert(users)
    .values([
      { name: 'Alice' },
      { name: 'Bob' },
      { name: 'Carol' },
      { name: 'Dave' },
      { name: 'Erin' },
    ])
    .returning()

  const fixtures = [
    // finished
    {
      homeTeam: 'Brazil',
      awayTeam: 'Germany',
      kickoffTime: new Date(now - 7 * DAY),
      status: 'finished' as const,
      homeScore: 2,
      awayScore: 1,
    },
    {
      homeTeam: 'France',
      awayTeam: 'Argentina',
      kickoffTime: new Date(now - 6 * DAY),
      status: 'finished' as const,
      homeScore: 0,
      awayScore: 0,
    },
    {
      homeTeam: 'Spain',
      awayTeam: 'England',
      kickoffTime: new Date(now - 5 * DAY),
      status: 'finished' as const,
      homeScore: 1,
      awayScore: 3,
    },
    // in progress
    {
      homeTeam: 'Japan',
      awayTeam: 'Mexico',
      kickoffTime: new Date(now - 3600_000),
      status: 'in_progress' as const,
    },
    // upcoming
    {
      homeTeam: 'USA',
      awayTeam: 'Canada',
      kickoffTime: new Date(now + 2 * DAY),
      status: 'upcoming' as const,
    },
    {
      homeTeam: 'Italy',
      awayTeam: 'Netherlands',
      kickoffTime: new Date(now + 3 * DAY),
      status: 'upcoming' as const,
    },
    {
      homeTeam: 'Portugal',
      awayTeam: 'Uruguay',
      kickoffTime: new Date(now + 4 * DAY),
      status: 'upcoming' as const,
    },
    {
      homeTeam: 'Morocco',
      awayTeam: 'Senegal',
      kickoffTime: new Date(now + 5 * DAY),
      status: 'upcoming' as const,
    },
    {
      homeTeam: 'Korea',
      awayTeam: 'Australia',
      kickoffTime: new Date(now + 6 * DAY),
      status: 'upcoming' as const,
    },
    // REQUIRED by e2e — do not remove
    {
      homeTeam: 'E2E United',
      awayTeam: 'Test FC',
      kickoffTime: new Date('2099-06-01T18:00:00Z'),
      status: 'upcoming' as const,
    },
  ]

  for (const f of fixtures) {
    const { homeScore, awayScore, ...rest } = f
    const [m] = await db
      .insert(matches)
      .values({ ...rest, status: 'upcoming' })
      .returning()
    // predictions from first 3 users on every match
    for (const u of userRows.slice(0, 3)) {
      await db.insert(predictions).values({
        userId: u.id,
        matchId: m.id,
        predictedHomeScore: (u.name.length + 1) % 4,
        predictedAwayScore: u.name.length % 3,
      })
    }
    if (f.status === 'finished' && homeScore !== undefined) {
      await resolveMatch(m.id, homeScore, awayScore as number)
    } else if (f.status === 'in_progress') {
      await db.update(matches).set({ status: 'in_progress' }).where(eq(matches.id, m.id))
    }
  }
  console.log('seeded:', userRows.length, 'users,', fixtures.length, 'matches')
  process.exit(0)
}

main()
