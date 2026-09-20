import { asc, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'

export async function GET() {
  const rows = await db
    .select({ id: users.id, name: users.name, image: users.image, totalPoints: users.totalPoints })
    .from(users)
    .orderBy(desc(users.totalPoints), asc(users.name))
  return Response.json(rows)
}
