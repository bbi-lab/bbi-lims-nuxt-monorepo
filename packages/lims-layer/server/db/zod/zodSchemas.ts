import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { genes } from '../schema/gene'

const selectGeneSchema = createSelectSchema(genes)
const updateGeneSchema = createSelectSchema(genes, {
    startPosition: z.bigint({ coerce: true }),
    endPosition: z.bigint({ coerce: true }),
    ncbiGeneId: z.bigint({ coerce: true }),
    proteinLength: z.bigint({ coerce: true }),
}).omit({id: true}).partial()

export const schemas = {
    // tables
    genes: {
        select: selectGeneSchema,
        update: updateGeneSchema,
    },
}
