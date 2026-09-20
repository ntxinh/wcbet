'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api-client'
import { type SessionUser, useUserStore } from '@/store/user'

export function NameDialog() {
  const user = useUserStore((s) => s.user)
  const setUser = useUserStore((s) => s.setUser)
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [pending, setPending] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const open = mounted && !user

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setPending(true)
    try {
      const created = await api.post('users', { json: { name: trimmed } }).json<SessionUser>()
      setUser(created)
      queryClient.invalidateQueries({ queryKey: ['matches'] })
      toast.success(`Welcome, ${created.name}`)
    } catch {
      toast.error('Could not sign in — try again')
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}} disablePointerDismissal>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Welcome to CupClash</DialogTitle>
          <DialogDescription>Pick a name to start predicting.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <Input
            data-testid="name-input"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            autoFocus
          />
          <Button data-testid="name-submit" type="submit" disabled={pending || !name.trim()}>
            Start predicting
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
