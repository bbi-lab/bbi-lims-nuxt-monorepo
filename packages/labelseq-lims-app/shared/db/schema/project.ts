import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core'
import { restrictionEnzymes } from './reagents'

export const projects = pgTable('projects', {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: varchar('description', { length: 500 }),
    restrictionEnzymeId: uuid('restriction_enzyme_id').references(() => restrictionEnzymes.id),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
})
