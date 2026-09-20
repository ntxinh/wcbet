'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NameDialog } from '@/components/name-dialog'
import { ThemeToggle } from '@/components/theme-toggle'
import { UserChip } from '@/components/user-chip'
import { cn } from '@/lib/utils'

const links = [
  { href: '/matches', label: 'Matches' },
  { href: '/leaderboard', label: 'Leaderboard' },
]

export function Header() {
  const pathname = usePathname()
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-4 px-4">
        <Link href="/matches" className="font-semibold">
          ⚽ CupClash
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'text-muted-foreground hover:text-foreground',
                pathname.startsWith(l.href) && 'text-foreground underline underline-offset-4',
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <UserChip />
          <ThemeToggle />
        </div>
      </div>
      <NameDialog />
    </header>
  )
}
