import { pgTable, uuid, varchar, timestamp, boolean } from 'drizzle-orm/pg-core'
import { restrictionEnzymes } from './reagents'

export const projects = pgTable('projects', {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    description: varchar('description', { length: 500 }),
    restrictionEnzymeId: uuid('restriction_enzyme_id').references(() => restrictionEnzymes.id),
    // When true, capseq sequences (constant oligo sequences) are prepended/appended to the
    // project's gblock sequences (the sequences flanking a tile that complete the superblock).
    applyCapseqToGblocks: boolean('apply_capseq_to_gblocks').default(false),
    createdAt: timestamp('created_at').$defaultFn(() => new Date()),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
})
