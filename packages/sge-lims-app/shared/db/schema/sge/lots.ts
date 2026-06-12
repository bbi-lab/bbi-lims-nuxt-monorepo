import { pgTable, timestamp, uuid, varchar, smallint, text, numeric, boolean, unique } from 'drizzle-orm/pg-core'
import { reagents } from './reagents'

export const lots = pgTable('lots', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  lotNumber: varchar('lot_number', { length: 50 }).notNull().unique(),
  reagent: uuid('reagent_id').references(() => reagents.id).notNull(),
  inHouse: boolean('in_house'),
  status: text('status', {
    enum: [
      'current',
      'needs_testing',
      'rejected',
      'tested',
      'used'
    ]}
  ),
  concentration: numeric('concentration'),
  startingVolume: numeric('starting_volume'),
  remainingVolume: numeric('remaining_volume'),
  preparedOn: timestamp('prepared_on'),
  storedOn: timestamp('stored_on'),
  startedUseOn: timestamp('started_use_on'),
  endedUseOn: timestamp('ended_use_on'),
  expiresOn: timestamp('expires_on'),
  notes: text('notes'),
})
