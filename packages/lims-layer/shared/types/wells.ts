import type { wells, wellContents } from '../db/schema/well'
import type { schemas } from '../db/zod/zodSchemas'
import type { InferSelectModel } from 'drizzle-orm'
import type { z } from 'zod'

export type Well = InferSelectModel<typeof wells>
export type NewWell = z.infer<typeof schemas.wells.insert>

export type WellContent = InferSelectModel<typeof wellContents>
export type NewWellContent = z.infer<typeof schemas.wellContents.insert>

export type WellWithContents = Well & {
    wellContents: WellContent & {
        wellable: object
    }[]
}
