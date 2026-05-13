import { pgTable, smallint, uuid, varchar, boolean, unique } from 'drizzle-orm/pg-core'
import { plateTypes } from './plateTypes'

export const plates = pgTable('plates', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  sizeX: smallint('size_x').notNull().default(12),
  sizeY: smallint('size_y').notNull().default(8),
  plateType: varchar('plate_type', { length: 100 }).notNull().references(() => plateTypes.value),
  discarded: boolean('discarded').default(false),
  processed: boolean('processed').default(false),
}, (t) => [
  unique('plates_name_unique').on(t.name),
])
