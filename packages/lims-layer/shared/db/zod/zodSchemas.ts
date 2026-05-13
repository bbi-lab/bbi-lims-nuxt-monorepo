import { dateSchema, nullableDateSchema } from '../helpers/schemas'
import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod'
import { z } from 'zod'
import { genes } from '../schema/gene'
import { plates } from '../schema/plate'
import { plateTypes } from '../schema/plateTypes'
import { wellContents, wellContentSources, wells } from '../schema/well'
import { viewPlatesWithWellCounts } from '../schema/views'

const selectUserSchema = z.object({
  id: z.string().readonly(),
  name: z.string(),
  email: z.email(),
  isAdmin: z.boolean(),
  isVerified: z.boolean(),
})

const newUserSchema = selectUserSchema.pick({
    name: true,
    email: true,
}).extend({
    password: z.string(),
})

const updateUserSchema = newUserSchema.partial()

const selectUserGroupMemberships = z.object({
    userId: z.string(),
    userGroupId: z.number(),
})

const adminUpdateUserSchema = selectUserSchema.omit({id: true}).extend({
  userGroupMemberships: z.array(z.object({ userGroupId: z.number() }))
})

const changePasswordSchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string(),
})

const requestPasswordResetSchema = z.object({
  email: z.email(),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string(),
})

const loginSchema = z.object({
    email: z.email(),
    password: z.string(),
})

const refreshTokensSchema = z.object({
  headers: z.object({
    authorization: z.string(),
  }),
})

const selectGeneSchema = createSelectSchema(genes)
const updateGeneSchema = createSelectSchema(genes, {
    startPosition: z.bigint({ coerce: true }),
    endPosition: z.bigint({ coerce: true }),
    ncbiGeneId: z.bigint({ coerce: true }),
    proteinLength: z.bigint({ coerce: true }),
}).omit({id: true}).partial()

const selectPlateTypeSchema = createSelectSchema(plateTypes)
const insertPlateTypeSchema = createInsertSchema(plateTypes)
const updatePlateTypeSchema = insertPlateTypeSchema.partial()

const selectPlateSchema = createSelectSchema(plates)
const insertPlateSchema = selectPlateSchema.omit({id: true}).partial()
const updatePlateSchema = createSelectSchema(plates, {
    sizeX: z.number().int().readonly(),
    sizeY: z.number().int().readonly(),
}).omit({id: true}).partial()

const selectWellsSchema = createSelectSchema(wells)
const insertWellsSchema = selectWellsSchema.omit({id: true})
const updateWellsSchema = insertWellsSchema.omit({plateId: true, x: true, y: true})

const selectWellContentsSchema = createSelectSchema(wellContents)
const insertWellContentsSchema = selectWellContentsSchema.omit({id: true})
const updateWellContentsSchema = insertWellContentsSchema

const selectWellContentSourcesSchema = createSelectSchema(wellContentSources, {createdAt: nullableDateSchema})
const insertWellContentSourcesSchema = selectWellContentSourcesSchema.omit({id: true}).partial()
const updateWellContentSourcesSchema = insertWellContentSourcesSchema

// views
const selectViewPlatesWithWellCountsSchema = createSelectSchema(viewPlatesWithWellCounts)

// user groups
const insertUserGroupSchema = z.object({ name: z.string() })
const updateUserGroupSchema = z.object({ name: z.string() })
const selectUserGroupSchema = z.object({
    id: z.number().readonly(),
    name: z.string(),
})

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
    users: {
        select: selectUserSchema,
        insert: newUserSchema,
        update: updateUserSchema,
        adminUpdate: adminUpdateUserSchema,
        changePassword: changePasswordSchema,
        requestPasswordReset: requestPasswordResetSchema,
        resetPassword: resetPasswordSchema,
        login: loginSchema,
        refreshTokens: refreshTokensSchema,
        selectGroupMemberships: selectUserGroupMemberships,
    },
    genes: {
        select: selectGeneSchema,
        update: updateGeneSchema,
    },
    userGroups: {
        insert: insertUserGroupSchema,
        update: updateUserGroupSchema,
        select: selectUserGroupSchema,
    },
    plateTypes: {
        select: selectPlateTypeSchema,
        insert: insertPlateTypeSchema,
        update: updatePlateTypeSchema,
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
    // views
    viewPlatesWithWellCounts: {
        select: selectViewPlatesWithWellCountsSchema,
    },
})
