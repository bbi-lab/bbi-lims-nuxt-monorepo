import { pgTable, smallint, uuid, varchar, boolean } from 'drizzle-orm/pg-core'
import { createSelectSchema } from 'drizzle-zod'
import _ from 'lodash'
import type { z, ZodObject } from 'zod'
import type { InferSelectModel } from 'drizzle-orm'
import type { PlateType } from '../../../shared/types/plates'
import { appConstants } from '../../../shared/constants'

export const plates = pgTable('plates', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  sizeX: smallint('size_x').notNull().default(12),
  sizeY: smallint('size_y').notNull().default(8),
  plateType: varchar('plate_type', { enum: Object.keys(appConstants.enumLookups.plates.plateType) as [PlateType, ...PlateType[]] }).notNull(),
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
export type NewPlate = z.infer<typeof insertPlateSchema>
export type UpdatePlate = z.infer<typeof updatePlateSchema>
