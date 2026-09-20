export interface Prediction {
  predictedHomeScore: number
  predictedAwayScore: number
  pointsEarned: number | null
}

export interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  kickoffTime: string
  homeScore: number | null
  awayScore: number | null
  status: 'upcoming' | 'in_progress' | 'finished'
  prediction: Prediction | null
}

export interface LeaderboardEntry {
  id: string
  name: string
  image: string | null
  totalPoints: number
}
