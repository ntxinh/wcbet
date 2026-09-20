import { z } from 'zod'
import { jsonError } from '@/lib/api'
import { logger } from '@/lib/logger'
import { resolveMatch } from '@/lib/resolve'

const bodySchema = z.object({
  matchId: z.string().uuid(),
  homeScore: z.number().int().min(0).max(20),
  awayScore: z.number().int().min(0).max(20),
})

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return jsonError(400, 'Invalid body')
  try {
    const match = await resolveMatch(
      parsed.data.matchId,
      parsed.data.homeScore,
      parsed.data.awayScore,
    )
    logger.info({ matchId: match.id }, 'match resolved')
    return Response.json(match)
  } catch {
    return jsonError(404, 'Match not found')
  }
}
