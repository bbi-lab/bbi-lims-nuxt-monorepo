import { pgTable, smallint, uuid, varchar, boolean } from 'drizzle-orm/pg-core'
import { createSelectSchema } from 'drizzle-orm/zod'
import _ from 'lodash'
import { z, ZodObject } from 'zod'
import { ENUM_LOOKUPS } from './enum-lookups'
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm/table'

export type PlateType = 'pellet-storage' |
 'amp-primer-storage' |
 'lin-primer-storage' |
 'ha-primer-storage' |
 'ha-puc19-primer-storage' |
 'sg-rna-oligo-storage' |
 'sg-rna-oligo' |
 'sg-rna-plasmid-storage' |
 'sg-rna-plasmid' |
 'amp-pcr' |
 'lin-pcr' |
 'ha-pcr' |
 'preseq-1' |
 'preseq-2' |
 'preseq-3' |
 'dna-preseq-1' |
 'dna-preseq-2' |
 'dna-preseq-3' |
 'rna-rt-storage' |
 'rna-preseq-1' |
 'rna-preseq-2' |
 'rna-preseq-3' |
 'snv-lib-preseq-2' |
 'snv-lib-preseq-3' |
 'seq-index' |
 'clonal-ha' |
 'dna-preseq-1-primer-storage' |
 'dna-preseq-2-primer-storage' |
 'rna-rt-primer-storage' |
 'rna-preseq-1-primer-storage' |
 'rna-preseq-2-primer-storage' |
 'external-sample-indexing' |
 'ha-pcr-product-storage' |
 'ha-puc19-pcr-product-storage' |
 'ha-puc19-gibson-product-storage' |
 'ha-puc19-plasmid-storage' |
 'snv-lib-amp-product-storage' |
 'snv-lib-lin-product-storage' |
 'snv-lib-gibson-product-storage' |
 'snv-lib-plasmid-storage' |
 'snv-lib-golden-gate-product-storage'

export const plates = pgTable('plates', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  sizeX: smallint('size_x').notNull().default(12),
  sizeY: smallint('size_y').notNull().default(8),
  plateType: varchar('plate_type', { enum: Object.keys(ENUM_LOOKUPS.plates.plateType) as [PlateType, ...PlateType[]] }).notNull(),
  discarded: boolean('discarded').default(false),
  processed: boolean('processed').default(false),
})

const selectPlateSchema = createSelectSchema(plates)
const insertPlateSchema = selectPlateSchema.omit({id: true}).partial()
const updatePlateSchema = selectPlateSchema.omit({id: true}).partial()

export const schemas: Record<string, ZodObject<any>> = {
    selectPlateSchema,
    insertPlateSchema,
    updatePlateSchema,
}

export type Plate = InferSelectModel<typeof plates>
export type NewPlate = InferInsertModel<typeof plates>
export type UpdatePlate = z.infer<typeof updatePlateSchema>
