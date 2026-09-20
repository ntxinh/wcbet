import { format } from 'date-fns'
import { PredictionForm } from '@/components/prediction-form'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { isLocked } from '@/lib/scoring'
import type { Match } from '@/lib/types'

const statusBadge = {
  upcoming: <Badge variant="secondary">Upcoming</Badge>,
  in_progress: <Badge className="animate-pulse">Live</Badge>,
  finished: <Badge variant="outline">Finished</Badge>,
} as const

export function MatchCard({ match }: { match: Match }) {
  const locked = isLocked(new Date(match.kickoffTime))

  return (
    <Card data-testid="match-card">
      <CardHeader>
        <CardTitle className="text-base">
          {match.homeTeam} vs {match.awayTeam}
        </CardTitle>
        {statusBadge[match.status]}
        {locked && <Badge variant="outline">Locked</Badge>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <p className="text-muted-foreground">
          {format(new Date(match.kickoffTime), 'EEE d MMM, HH:mm')}
        </p>
        {match.homeScore != null && match.awayScore != null && (
          <p className="font-semibold">
            Final: {match.homeScore} – {match.awayScore}
          </p>
        )}
        {match.prediction && (
          <p>
            Your prediction: {match.prediction.predictedHomeScore} –{' '}
            {match.prediction.predictedAwayScore}
            {match.prediction.pointsEarned != null && (
              <span className="text-muted-foreground"> ({match.prediction.pointsEarned} pts)</span>
            )}
          </p>
        )}
        {!locked && <PredictionForm match={match} />}
      </CardContent>
    </Card>
  )
}
