'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

const order = ['light', 'dark', 'system'] as const

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const next = order[(order.indexOf(theme as (typeof order)[number]) + 1) % order.length] ?? 'light'

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(next)}
      disabled={!mounted}
    >
      {mounted && theme === 'dark' ? (
        <Moon />
      ) : mounted && theme === 'system' ? (
        <Monitor />
      ) : (
        <Sun />
      )}
    </Button>
  )
}
