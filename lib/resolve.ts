import type { matches } from './schema'

export type Match = typeof matches.$inferSelect

// Stub — Task 3 implements scoring + status update.
export async function resolveMatch(
  _matchId: string,
  _homeScore: number,
  _awayScore: number,
): Promise<Match> {
  throw new Error('not implemented')
}
