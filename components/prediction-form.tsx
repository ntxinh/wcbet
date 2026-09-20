'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api-client'
import type { Match } from '@/lib/types'

export function PredictionForm({ match }: { match: Match }) {
  const queryClient = useQueryClient()
  const [home, setHome] = useState(match.prediction?.predictedHomeScore?.toString() ?? '')
  const [away, setAway] = useState(match.prediction?.predictedAwayScore?.toString() ?? '')

  const mutation = useMutation({
    mutationFn: (scores: { homeScore: number; awayScore: number }) =>
      api.post('predictions', { json: { matchId: match.id, ...scores } }).json(),
    onMutate: async (scores) => {
      await queryClient.cancelQueries({ queryKey: ['matches'] })
      const prev = queryClient.getQueriesData<Match[]>({ queryKey: ['matches'] })
      queryClient.setQueriesData<Match[]>({ queryKey: ['matches'] }, (old) =>
        old?.map((m) =>
          m.id === match.id
            ? {
                ...m,
                prediction: {
                  predictedHomeScore: scores.homeScore,
                  predictedAwayScore: scores.awayScore,
                  pointsEarned: m.prediction?.pointsEarned ?? null,
                },
              }
            : m,
        ),
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      for (const [key, data] of ctx?.prev ?? []) queryClient.setQueryData(key, data)
      toast.error('Could not save prediction')
    },
    onSuccess: () => toast.success('Prediction saved'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['matches'] }),
  })

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const homeScore = Number(home)
    const awayScore = Number(away)
    if (home === '' || away === '' || !Number.isInteger(homeScore) || !Number.isInteger(awayScore))
      return
    mutation.mutate({ homeScore, awayScore })
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <Input
        data-testid="home-score"
        type="number"
        min={0}
        max={20}
        value={home}
        onChange={(e) => setHome(e.target.value)}
        className="w-16"
        aria-label="Home score"
      />
      <span className="text-muted-foreground">–</span>
      <Input
        data-testid="away-score"
        type="number"
        min={0}
        max={20}
        value={away}
        onChange={(e) => setAway(e.target.value)}
        className="w-16"
        aria-label="Away score"
      />
      <Button
        data-testid="save-prediction"
        type="submit"
        size="sm"
        disabled={mutation.isPending || home === '' || away === ''}
      >
        Save
      </Button>
    </form>
  )
}
