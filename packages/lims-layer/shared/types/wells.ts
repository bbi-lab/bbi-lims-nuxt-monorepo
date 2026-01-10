import type { Well, WellContent } from '../../server/db/schema/well'

export type WellWithContents = Well & {
    wellContents: WellContent & {
        wellable: object
    }[]
}
