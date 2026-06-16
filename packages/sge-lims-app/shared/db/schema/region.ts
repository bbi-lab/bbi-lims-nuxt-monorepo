import { pgTable, uuid, varchar, integer, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm/sql'
import _ from 'lodash'
import {genes} from 'lims-layer/shared/db/schema/gene'

export const regions = pgTable('regions', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  geneId: uuid('gene_id').references(() => genes.id).notNull(),
  ampliconStart: integer('amplicon_start'),
  ampliconEnd: integer('amplicon_end'),
  ampliconSequence: varchar('amplicon_sequence', {length: 255}),
  snvLibraryStart: integer('snv_library_start'),
  snvLibraryEnd: integer('snv_library_end'),
}, (t) => [
  uniqueIndex('unique_region_name_gene_id').on(sql`lower(trim(${t.name}))`, t.geneId),
])
