import { nullableDateSchema } from '../helpers/schemas'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { genes } from '../schema/gene'
import { plates } from '../schema/plate'
import { wellContents, wellContentSources, wells } from '../schema/well'

const selectGeneSchema = createSelectSchema(genes)
const updateGeneSchema = createSelectSchema(genes, {
    startPosition: z.bigint({ coerce: true }),
    endPosition: z.bigint({ coerce: true }),
    ncbiGeneId: z.bigint({ coerce: true }),
    proteinLength: z.bigint({ coerce: true }),
}).omit({id: true}).partial()

const selectPlateSchema = createSelectSchema(plates)
const insertPlateSchema = selectPlateSchema.omit({id: true}).partial()
const updatePlateSchema = insertPlateSchema

const selectWellsSchema = createSelectSchema(wells)
const insertWellsSchema = selectWellsSchema.omit({id: true}).partial()
const updateWellsSchema = insertWellsSchema.omit({plateId: true, x: true, y: true})

const selectWellContentsSchema = createSelectSchema(wellContents)
const insertWellContentsSchema = selectWellContentsSchema.omit({id: true}).partial()
const updateWellContentsSchema = insertWellContentsSchema

const selectWellContentSourcesSchema = createSelectSchema(wellContentSources, {createdAt: nullableDateSchema})
const insertWellContentSourcesSchema = selectWellContentSourcesSchema.omit({id: true}).partial()
const updateWellContentSourcesSchema = insertWellContentSourcesSchema


export const schemas = {
    // tables
    genes: {
        select: selectGeneSchema,
        update: updateGeneSchema,
    },
    plates: {
        select: selectPlateSchema,
        insert: insertPlateSchema,
        update: updatePlateSchema,
    },
    wells: {
        select: selectWellsSchema,
        insert: insertWellsSchema,
        update: updateWellsSchema,
    },
    wellContents: {
        select: selectWellContentsSchema,
        insert: insertWellContentsSchema,
        update: updateWellContentsSchema,
    },
    wellContentSources: {
        select: selectWellContentSourcesSchema,
        insert: insertWellContentSourcesSchema,
        update: updateWellContentSourcesSchema,
    },
}
