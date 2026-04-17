import { boolean, pgSchema, primaryKey, integer, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import _ from 'lodash'

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
