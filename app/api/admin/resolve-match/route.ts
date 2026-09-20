import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { jsonError } from '@/lib/api'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { resolveMatch } from '@/lib/resolve'
import { matches } from '@/lib/schema'

const bodySchema = z.object({
  matchId: z.string().uuid(),
  homeScore: z.number().int().min(0).max(20),
  awayScore: z.number().int().min(0).max(20),
})

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return jsonError(400, 'Invalid body')
  const { matchId, homeScore, awayScore } = parsed.data
  const [existing] = await db
    .select({ id: matches.id })
    .from(matches)
    .where(eq(matches.id, matchId))
  if (!existing) return jsonError(404, 'Match not found')
  try {
    const match = await resolveMatch(matchId, homeScore, awayScore)
    logger.info({ matchId: match.id }, 'match resolved')
    return Response.json(match)
  } catch (err) {
    logger.error({ err }, 'resolve failed')
    return jsonError(500, 'Internal error')
  }
}
