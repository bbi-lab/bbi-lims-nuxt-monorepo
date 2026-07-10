import { boolean, pgSchema, primaryKey, integer, text, timestamp, uuid, varchar, unique, index } from 'drizzle-orm/pg-core'
import { type InferSelectModel } from 'drizzle-orm'
import _ from 'lodash'

export const usersSchema = pgSchema("users");

// tables
export const users = usersSchema.table('users', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: text('email').notNull(),
  isAdmin: boolean('is_admin').notNull().default(false),
  password: text('password').notNull(),
  isVerified: boolean('is_verified').notNull().default(false),
  code: text('code').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  unique('users_email_unique').on(t.email),
])

export const preVerifiedUsers = usersSchema.table('pre_verified_users', {
  email: text('email').notNull(),
}, (t) => [
  unique('pre_verified_users_email_unique').on(t.email),
])

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

export const passwordResetTokens = usersSchema.table('password_reset_tokens', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('password_reset_tokens_token_hash_idx').on(t.tokenHash),
  index('password_reset_tokens_user_id_idx').on(t.userId),
])

export type User = InferSelectModel<typeof users>
export type UserGroup = InferSelectModel<typeof userGroups>
