import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from './env'
import * as schema from './schema'

const globalForPg = globalThis as unknown as { pgClient?: postgres.Sql }
const client = globalForPg.pgClient ?? postgres(env.DATABASE_URL, { ssl: 'require' })
if (process.env.NODE_ENV !== 'production') globalForPg.pgClient = client
export const db = drizzle(client, { schema })
