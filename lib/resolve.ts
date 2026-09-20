import { eq, sql } from 'drizzle-orm'
import { db } from './db'
import { matches, predictions } from './schema'
import { scorePrediction } from './scoring'

export type MatchRow = typeof matches.$inferSelect

export async function resolveMatch(
  matchId: string,
  homeScore: number,
  awayScore: number,
): Promise<MatchRow> {
  return db.transaction(async (tx) => {
    const [match] = await tx
      .update(matches)
      .set({ homeScore, awayScore, status: 'finished' })
      .where(eq(matches.id, matchId))
      .returning()
    if (!match) throw new Error(`match not found: ${matchId}`)

    const preds = await tx.select().from(predictions).where(eq(predictions.matchId, matchId))
    const userIds = new Set<string>()
    for (const p of preds) {
      const points = scorePrediction(
        { home: p.predictedHomeScore, away: p.predictedAwayScore },
        { home: homeScore, away: awayScore },
      )
      await tx.update(predictions).set({ pointsEarned: points }).where(eq(predictions.id, p.id))
      userIds.add(p.userId)
    }

    // recompute totals — idempotent, safe to re-resolve a match
    for (const userId of userIds) {
      await tx.execute(
        sql`update users set total_points = (
          select coalesce(sum(points_earned), 0) from predictions where user_id = ${userId}
        ) where id = ${userId}`,
      )
    }
    return match
  })
}
