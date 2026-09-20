export interface Score {
  home: number
  away: number
}

type Outcome = 'home' | 'draw' | 'away'

function outcome(s: Score): Outcome {
  if (s.home > s.away) return 'home'
  if (s.home < s.away) return 'away'
  return 'draw'
}

export function scorePrediction(pred: Score, actual: Score): 0 | 1 | 3 {
  if (pred.home === actual.home && pred.away === actual.away) return 3
  return outcome(pred) === outcome(actual) ? 1 : 0
}

export function isLocked(kickoffTime: Date, now = new Date()): boolean {
  return now.getTime() >= kickoffTime.getTime()
}
