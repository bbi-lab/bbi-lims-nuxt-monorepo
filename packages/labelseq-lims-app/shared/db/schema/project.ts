import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core'

export const projects = pgTable('projects', {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: varchar('description', { length: 500 }),
    restrictionEnzyme: varchar('restriction_enzyme', { length: 10, enum: ['sap1', 'paqc1'] }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
})
