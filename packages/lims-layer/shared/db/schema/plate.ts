import { pgTable, smallint, uuid, varchar, boolean, unique } from 'drizzle-orm/pg-core'
import type { PlateType } from '../../types/plates'
import { appConstants } from '../../utils/constants'

export const plates = pgTable('plates', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  sizeX: smallint('size_x').notNull().default(12),
  sizeY: smallint('size_y').notNull().default(8),
  plateType: varchar('plate_type', { enum: Object.keys(appConstants.enumLookups.plates.plateType) as [PlateType, ...PlateType[]] }).notNull(),
  discarded: boolean('discarded').default(false),
  processed: boolean('processed').default(false),
}, (t) => [
  unique('plates_name_unique').on(t.name),
])
