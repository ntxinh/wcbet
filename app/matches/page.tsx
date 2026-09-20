'use client'

import { useQuery } from '@tanstack/react-query'
import { MatchCard } from '@/components/match-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api-client'
import type { Match } from '@/lib/types'
import { type StatusFilter, useFilterStore } from '@/store/filters'

const tabs: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'in_progress', label: 'Live' },
  { value: 'finished', label: 'Finished' },
]

export default function MatchesPage() {
  const status = useFilterStore((s) => s.status)
  const setStatus = useFilterStore((s) => s.setStatus)

  const {
    data: matches,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['matches', status],
    queryFn: () =>
      api.get('matches', { searchParams: status === 'all' ? {} : { status } }).json<Match[]>(),
  })

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
        <TabsList>
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="grid gap-4">
        {isLoading && ['s1', 's2', 's3'].map((k) => <Skeleton key={k} className="h-40 w-full" />)}
        {isError && <p className="text-muted-foreground text-sm">Failed to load matches.</p>}
        {matches?.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
        {matches?.length === 0 && (
          <p className="text-muted-foreground text-sm">No matches in this view.</p>
        )}
      </div>
    </div>
  )
}
