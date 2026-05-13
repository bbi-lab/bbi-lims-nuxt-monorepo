import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core'

export const plateTypes = pgTable('plate_types', {
  value: varchar('value', { length: 100 }).notNull().primaryKey(),
  label: varchar('label', { length: 255 }).notNull(),
  desc: varchar('desc', { length: 500 }),
})
