import { pgTable, pgEnum, timestamp, uuid, varchar, smallint, text, unique } from 'drizzle-orm/pg-core'

export const reagents = pgTable('reagents', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  name: varchar('name', {length: 255}).notNull().unique(),
  soluteUnit: text('solute_unit', {enum: ['cells', 'ng', 'µg', 'mg', 'g'] }),
  volumeUnit: text('volume_unit', {enum: ['nL', 'µL', 'mL', 'L'] }),
  description: text('description'),
})
