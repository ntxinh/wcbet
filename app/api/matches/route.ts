import { and, asc, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { uuidOrNull } from '@/lib/api'
import { db } from '@/lib/db'
import { matches, predictions } from '@/lib/schema'

const statusSchema = z.enum(['upcoming', 'in_progress', 'finished']).optional()

export async function GET(req: Request) {
  const url = new URL(req.url)
  const status = statusSchema.safeParse(url.searchParams.get('status') ?? undefined)
  if (!status.success) return Response.json({ error: 'Invalid status' }, { status: 400 })
  const userId = uuidOrNull(req.headers.get('x-user-id'))
  const rows = await db
    .select({
      id: matches.id,
      homeTeam: matches.homeTeam,
      awayTeam: matches.awayTeam,
      kickoffTime: matches.kickoffTime,
      homeScore: matches.homeScore,
      awayScore: matches.awayScore,
      status: matches.status,
      prediction: {
        predictedHomeScore: predictions.predictedHomeScore,
        predictedAwayScore: predictions.predictedAwayScore,
        pointsEarned: predictions.pointsEarned,
      },
    })
    .from(matches)
    .leftJoin(
      predictions,
      and(
        eq(predictions.matchId, matches.id),
        userId ? eq(predictions.userId, userId) : isNull(predictions.userId),
      ),
    )
    .where(status.data ? eq(matches.status, status.data) : undefined)
    .orderBy(asc(matches.kickoffTime))

  // leftJoin yields prediction object with all-null fields when absent — normalize to null
  return Response.json(
    rows.map((r) => ({
      ...r,
      prediction: r.prediction?.predictedHomeScore == null ? null : r.prediction,
    })),
  )
}
