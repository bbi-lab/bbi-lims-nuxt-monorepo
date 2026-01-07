import type { InferSelectModel } from 'drizzle-orm'
import { boolean, pgSchema, primaryKey, integer, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { createSelectSchema } from 'drizzle-zod'
import type { ZodObject } from 'zod'
import { z } from 'zod'
import _ from 'lodash'
import { dateSchema } from '../helpers/schemas'

export const usersSchema = pgSchema("users");

// tables
export const users = usersSchema.table('users', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: text('email').notNull().unique(),
  isAdmin: boolean('is_admin').notNull().default(false),
  password: text('password').notNull(),
  isVerified: boolean('is_verified').notNull().default(false),
  code: text('code').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const preVerifiedUsers = usersSchema.table('pre_verified_users', {
  email: text('email').notNull().unique(),
})

export const userGroups = usersSchema.table('user_groups', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1 }),
  name: varchar('name', { length: 255 }).notNull(),
})

export const userGroupMemberships = usersSchema.table('user_group_memberships', {
  userId: uuid('user_id').notNull().references(() => users.id),
  userGroupId: integer('user_group_id').notNull().references(() => userGroups.id),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.userGroupId] }),
}))

// schemas
const selectUserSchema = createSelectSchema(users, {
  email: (schema) => schema.email(),
})

// const verifyUserSchema = selectUserSchema.pick({
//     email: true,
//     code: true,
// })

const loginSchema = selectUserSchema.pick({
    email: true,
    password: true,
})

const refreshTokensSchema = z.object({
  headers: z.object({
    authorization: z.string(),
  }),
})

const updateUserSchema = selectUserSchema.pick({
    name: true,
    email: true,
    password: true,
}).partial()

const newUserSchema = selectUserSchema.pick({
    name: true,
    email: true,
    password: true,
})

const adminUpdateUserSchema = selectUserSchema.extend({
  createdAt: dateSchema,
  updatedAt: dateSchema,
  userGroupMemberships: z.array(createSelectSchema(userGroupMemberships))
}).omit({
    id: true,
    password: true,
    code: true
})

const changePasswordSchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string(),
})

export const schemas: Record<string, ZodObject> = {
  selectUserSchema: selectUserSchema.extend({
    createdAt: dateSchema,
    updatedAt: dateSchema}).omit({password: true, code: true}),
  adminUpdateUserSchema,
  newUserSchema,
  updateUserSchema,
  refreshTokensSchema,
  loginSchema,
  changePasswordSchema,
}

const selectUserGroupSchema = createSelectSchema(userGroups)
const newUserGroupSchema = selectUserGroupSchema.pick({name: true})
const updateUserGroupSchema = selectUserGroupSchema.pick({name: true})

export const userGroupSchemas: Record<string, ZodObject> = {
  selectUserGroupSchema,
  newUserGroupSchema,
  updateUserGroupSchema,
}

// types
export type User = InferSelectModel<typeof users>
export type NewUser = z.infer<typeof newUserSchema>
export type LoginUser = z.infer<typeof loginSchema>
export type ChangePassword = z.infer<typeof changePasswordSchema>
export type UpdateUser = z.infer<typeof updateUserSchema>
export type AdminUpdateUser = z.infer<typeof adminUpdateUserSchema>
export type UserGroup = InferSelectModel<typeof userGroups>
export type NewUserGroup = z.infer<typeof newUserGroupSchema>
export type UpdateUserGroup = z.infer<typeof updateUserGroupSchema>
