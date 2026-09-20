import { z } from 'zod'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { users } from '@/lib/schema'

const bodySchema = z.object({ name: z.string().trim().min(1).max(30) })

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Invalid name' }, { status: 400 })
  const [user] = await db
    .insert(users)
    .values({ name: parsed.data.name })
    .onConflictDoUpdate({ target: users.name, set: { name: parsed.data.name } })
    .returning({ id: users.id, name: users.name })
  logger.info({ userId: user.id }, 'user logged in')
  return Response.json(user)
}
