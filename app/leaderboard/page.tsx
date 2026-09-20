'use client'

import { useQuery } from '@tanstack/react-query'
import { LeaderboardTable } from '@/components/leaderboard-table'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api-client'
import type { LeaderboardEntry } from '@/lib/types'

export default function LeaderboardPage() {
  const { data: entries, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.get('leaderboard').json<LeaderboardEntry[]>(),
  })

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Leaderboard</h1>
      {isLoading && <Skeleton className="h-64 w-full" />}
      {entries && <LeaderboardTable entries={entries} />}
    </div>
  )
}
