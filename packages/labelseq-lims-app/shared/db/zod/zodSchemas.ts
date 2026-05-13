import { dateSchema, nullableDateSchema } from '../helpers/schemas'
import { createSelectSchema } from 'drizzle-orm/zod'
import { nullable, z } from 'zod'
import { projects } from '../schema/project'
import { restrictionEnzymes } from '../schema/reagents'

const selectProjectSchema = createSelectSchema(projects)
const insertProjectSchema = selectProjectSchema.omit({id: true, createdAt: true, updatedAt: true}).partial()
const updateProjectSchema = insertProjectSchema

const selectRestrictionEnzymeSchema = createSelectSchema(restrictionEnzymes)
const insertRestrictionEnzymeSchema = selectRestrictionEnzymeSchema.omit({
    id: true,
    recogSeq: true,
    recogSeqRevComp: true,
    recogSeqPlusOneRevComp: true,
}).partial()
const updateRestrictionEnzymeSchema = insertRestrictionEnzymeSchema


// Freeze all schema shapes to prevent accidental mutation of shared module-level objects.
// Zod methods like .extend(), .omit(), .partial() return new objects and are unaffected.
function freezeSchemas<T extends Record<string, Record<string, z.ZodTypeAny>>>(obj: T): T {
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
})
