import { pgTable, uuid, timestamp, varchar, unique } from 'drizzle-orm/pg-core'
import _ from 'lodash'

export const projects = pgTable('projects', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  startedOn: timestamp('started_on').defaultNow(),
})
