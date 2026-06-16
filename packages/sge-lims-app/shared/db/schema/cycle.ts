import { pgTable, uuid, varchar, timestamp, unique } from 'drizzle-orm/pg-core'
import _ from 'lodash'

export const cycles = pgTable('cycles', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  startedOn: timestamp('started_on').defaultNow(),
  endedOn: timestamp('ended_on'),
})
