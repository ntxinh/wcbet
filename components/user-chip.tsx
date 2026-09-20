'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/store/user'

export function UserChip() {
  const user = useUserStore((s) => s.user)
  const clearUser = useUserStore((s) => s.clearUser)
  const queryClient = useQueryClient()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted || !user) return null

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        clearUser()
        queryClient.invalidateQueries({ queryKey: ['matches'] })
      }}
      title="Switch user"
      className="gap-2"
    >
      <Avatar className="size-6">
        <AvatarFallback className="text-[0.65rem]">{initials}</AvatarFallback>
      </Avatar>
      <span className="max-w-24 truncate">{user.name}</span>
    </Button>
  )
}
