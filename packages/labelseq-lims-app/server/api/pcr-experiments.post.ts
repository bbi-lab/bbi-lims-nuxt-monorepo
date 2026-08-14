import _ from 'lodash'
import { schemas } from '#shared/db/zod/zodSchemas'
import { pcrExperiments } from '#shared/db/schema/pcrExperiments'

// Each PCR type runs on its own plate type. The plate rows must exist in `plate_types`
// (plates.plate_type is an FK) — see the add_pcr_experiments migration.
const PLATE_TYPES_BY_PCR_TYPE = {
    'pcr-1': 'pcr-1-plate',
    'pcr-2': 'pcr-2-plate',
    'pcr-rt': 'pcr-rt-plate',
} as const

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)
        if (body.length !== 1) {
            throw createError({
                statusCode: 400,
                statusMessage: `Invalid request body. Expected a single object.`,
            })
        }

        const record = _.mapValues(body[0], (value) => _.isString(value) && _.isEmpty(value) ? null : value)
        const parsedRecord = schemas.pcrExperiments.insert.parse(record)

        const db = useAppDrizzle()
        const result = await db.transaction(async (tx) => {
            // A PCR experiment always gets its own 8x12 (96-well) plate, named after
            // the experiment and typed by the experiment's PCR type.
            const plate = await insertPlate({
                name: parsedRecord.name,
                sizeX: 12,
                sizeY: 8,
                plateType: PLATE_TYPES_BY_PCR_TYPE[parsedRecord.pcrType],
            }, tx as any)

            if (!plate) {
                throw createError({ statusCode: 500, statusMessage: 'Failed to create plate for PCR experiment.' })
            }

            const [newRecord] = await tx
                .insert(pcrExperiments)
                .values({
                    ...parsedRecord,
                    // undefined (not null) so the started_on default of now() applies
                    // when the form leaves the date blank.
                    startedOn: parsedRecord.startedOn ?? undefined,
                    plateId: plate.id,
                })
                .returning()

            if (!newRecord) {
                throw createError({ statusCode: 500, statusMessage: 'Failed to create PCR experiment.' })
            }

            return { ...newRecord, plate }
        })

        return [result]
    } catch (e: unknown) {
        const { error, data } = parsePutPostError(e)

        throw createError({
            statusCode: 400,
            statusMessage: error.message,
            data
        })
    }
})
