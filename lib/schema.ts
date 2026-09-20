import { integer, pgEnum, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'

export const matchStatus = pgEnum('match_status', ['upcoming', 'in_progress', 'finished'])

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  image: text('image'),
  totalPoints: integer('total_points').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const matches = pgTable('matches', {
  id: uuid('id').defaultRandom().primaryKey(),
  homeTeam: text('home_team').notNull(),
  awayTeam: text('away_team').notNull(),
  kickoffTime: timestamp('kickoff_time', { withTimezone: true }).notNull(),
  homeScore: integer('home_score'),
  awayScore: integer('away_score'),
  status: matchStatus('status').notNull().default('upcoming'),
})

export const predictions = pgTable(
  'predictions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    matchId: uuid('match_id')
      .notNull()
      .references(() => matches.id),
    predictedHomeScore: integer('predicted_home_score').notNull(),
    predictedAwayScore: integer('predicted_away_score').notNull(),
    pointsEarned: integer('points_earned'),
  },
  (t) => [unique().on(t.userId, t.matchId)],
)
