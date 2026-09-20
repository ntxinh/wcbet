import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { jsonError, requireUser } from '@/lib/api'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { matches, predictions } from '@/lib/schema'
import { isLocked } from '@/lib/scoring'

const bodySchema = z.object({
  matchId: z.string().uuid(),
  homeScore: z.number().int().min(0).max(20),
  awayScore: z.number().int().min(0).max(20),
})

export async function POST(req: Request) {
  const user = await requireUser(req)
  if (!user) return jsonError(401, 'Not authenticated')

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return jsonError(400, 'Invalid prediction')
  const { matchId, homeScore, awayScore } = parsed.data

  const [match] = await db.select().from(matches).where(eq(matches.id, matchId))
  if (!match) return jsonError(404, 'Match not found')
  if (isLocked(match.kickoffTime)) return jsonError(409, 'Match is locked')

  const [prediction] = await db
    .insert(predictions)
    .values({
      userId: user.id,
      matchId,
      predictedHomeScore: homeScore,
      predictedAwayScore: awayScore,
    })
    .onConflictDoUpdate({
      target: [predictions.userId, predictions.matchId],
      set: { predictedHomeScore: homeScore, predictedAwayScore: awayScore },
    })
    .returning()
  logger.info({ userId: user.id, matchId }, 'prediction saved')
  return Response.json(prediction)
}
