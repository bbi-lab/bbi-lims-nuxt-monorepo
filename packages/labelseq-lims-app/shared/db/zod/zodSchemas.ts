// import { dateSchema, nullableDateSchema } from '../helpers/schemas'
import { createSelectSchema } from 'drizzle-orm/zod'
import { z } from 'zod'
import { projects } from '../schema/project'
import { restrictionEnzymes } from '../schema/reagents'
import { labelseqIndexPrimers, nexteraIndexPrimers, retrieverPrimers } from '../schema/primers'
import { superblocks, tiles, tileVariants } from '../schema/tiles'
import { refseqTranscripts } from '../schema/transcripts'

const selectProjectSchema = createSelectSchema(projects)
const insertProjectSchema = selectProjectSchema.omit({id: true, createdAt: true, updatedAt: true}).partial()
const updateProjectSchema = insertProjectSchema

const selectRestrictionEnzymeSchema = createSelectSchema(restrictionEnzymes)
const insertRestrictionEnzymeSchema = selectRestrictionEnzymeSchema.omit({
    id: true,
    recogSeq: true,
    recogSeqRevComp: true,
    recogSeqPlusOverhangRevComp: true,
}).partial()
const updateRestrictionEnzymeSchema = insertRestrictionEnzymeSchema

const selectRetrieverPrimerSchema = createSelectSchema(retrieverPrimers)
const insertRetrieverPrimerSchema = selectRetrieverPrimerSchema.omit({ id: true, seqRevComp: true }).partial()
const updateRetrieverPrimerSchema = insertRetrieverPrimerSchema

const selectLabelseqIndexPrimerSchema = createSelectSchema(labelseqIndexPrimers)
const insertLabelseqIndexPrimerSchema = selectLabelseqIndexPrimerSchema.omit({ id: true, indexSeqRevComp: true }).partial()
const updateLabelseqIndexPrimerSchema = insertLabelseqIndexPrimerSchema

const selectNexteraIndexPrimerSchema = createSelectSchema(nexteraIndexPrimers)
const insertNexteraIndexPrimerSchema = selectNexteraIndexPrimerSchema.omit({ id: true, indexSeqRevComp: true }).partial()
const updateNexteraIndexPrimerSchema = insertNexteraIndexPrimerSchema

const selectSuperblocksSchema = createSelectSchema(superblocks)
const insertSuperblocksSchema = selectSuperblocksSchema.omit({ id: true }).partial()
const updateSuperblocksSchema = insertSuperblocksSchema

const selectTilesSchema = createSelectSchema(tiles)
const insertTilesSchema = selectTilesSchema.omit({ id: true }).partial()
const updateTilesSchema = insertTilesSchema

const selectTileVariantsSchema = createSelectSchema(tileVariants)
const insertTileVariantsSchema = selectTileVariantsSchema.omit({ id: true }).partial()
const updateTileVariantsSchema = insertTileVariantsSchema

const selectRefseqTranscriptsSchema = createSelectSchema(refseqTranscripts)
const insertRefseqTranscriptsSchema = selectRefseqTranscriptsSchema.omit({ id: true }).partial()
// make seq readonly for update schema since we don't want it to be updated directly (it should only be set on insert or via refseq update process)
const updateRefseqTranscriptsSchema = insertRefseqTranscriptsSchema.extend({
    geneId: insertRefseqTranscriptsSchema.shape.geneId.readonly(),
    seq: insertRefseqTranscriptsSchema.shape.seq.readonly(),
})

// Freeze all schema shapes to prevent accidental mutation of shared module-level objects.
// Zod methods like .extend(), .omit(), .partial() return new objects and are unaffected.
function freezeSchemas<T extends Record<string, Record<string, z.ZodType>>>(obj: T): T {
    for (const group of Object.values(obj)) {
        for (const schema of Object.values(group)) {
            if ('shape' in schema) Object.freeze(schema.shape)
            Object.freeze(schema)
        }
        Object.freeze(group)
    }
    return Object.freeze(obj)
}

export const schemas = freezeSchemas({
    // tables
    projects: {
        select: selectProjectSchema,
        insert: insertProjectSchema,
        update: updateProjectSchema,
    },
    restrictionEnzymes: {
        select: selectRestrictionEnzymeSchema,
        insert: insertRestrictionEnzymeSchema,
        update: updateRestrictionEnzymeSchema,
    },
    retrieverPrimers: {
        select: selectRetrieverPrimerSchema,
        insert: insertRetrieverPrimerSchema,
        update: updateRetrieverPrimerSchema,
    },
    labelseqIndexPrimers: {
        select: selectLabelseqIndexPrimerSchema,
        insert: insertLabelseqIndexPrimerSchema,
        update: updateLabelseqIndexPrimerSchema,
    },
    nexteraIndexPrimers: {
        select: selectNexteraIndexPrimerSchema,
        insert: insertNexteraIndexPrimerSchema,
        update: updateNexteraIndexPrimerSchema,
    },
    superblocks: {
        select: selectSuperblocksSchema,
        insert: insertSuperblocksSchema,
        update: updateSuperblocksSchema,
    },
    tiles: {
        select: selectTilesSchema,
        insert: insertTilesSchema,
        update: updateTilesSchema,
    },
    tileVariants: {
        select: selectTileVariantsSchema,
        insert: insertTileVariantsSchema,
        update: updateTileVariantsSchema,
    },
    refseqTranscripts: {
        select: selectRefseqTranscriptsSchema,
        insert: insertRefseqTranscriptsSchema,
        update: updateRefseqTranscriptsSchema,
    },
})
