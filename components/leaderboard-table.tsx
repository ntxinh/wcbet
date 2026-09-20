import { Crown } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { LeaderboardEntry } from '@/lib/types'

export function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">#</TableHead>
          <TableHead>Player</TableHead>
          <TableHead className="text-right">Points</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((e, i) => (
          <TableRow key={e.id}>
            <TableCell>{i === 0 ? <Crown className="size-4 text-yellow-500" /> : i + 1}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Avatar className="size-7">
                  {e.image && <AvatarImage src={e.image} alt={e.name} />}
                  <AvatarFallback className="text-xs">
                    {e.name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {e.name}
              </div>
            </TableCell>
            <TableCell className="text-right font-semibold">{e.totalPoints}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
