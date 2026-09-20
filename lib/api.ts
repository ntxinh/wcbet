import { eq } from 'drizzle-orm'
import { db } from './db'
import { users } from './schema'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function uuidOrNull(value: string | null) {
  return value && UUID_RE.test(value) ? value : null
}

export function jsonError(status: number, error: string) {
  return Response.json({ error }, { status })
}

export async function requireUser(req: Request) {
  const userId = uuidOrNull(req.headers.get('x-user-id'))
  if (!userId) return null
  const [user] = await db.select().from(users).where(eq(users.id, userId))
  return user ?? null
}
