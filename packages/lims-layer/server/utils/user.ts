import crypto from 'node:crypto'
import { users, userGroups, userGroupMemberships, preVerifiedUsers, passwordResetTokens } from '../db/schema/user'
import { db } from './db'
import argon2 from 'argon2'
import { eq, inArray, and, gt } from 'drizzle-orm'
import _ from 'lodash'
import { applySelectParamsToRecords, type SelectParams } from './restApi'

export async function getAllUsers(selectParams: SelectParams) {
  const allUsers = await db.query.users.findMany({
    columns: selectParams.columns,
    with: selectParams.with,
  })
  return applySelectParamsToRecords(selectParams, allUsers)
}

export async function getUserGroups(selectParams?: SelectParams) {
  if (selectParams) {
    const allUserGroups = await db.query.userGroups.findMany({
      columns: selectParams.columns,
      with: selectParams.with,
    })
    return applySelectParamsToRecords(selectParams, allUserGroups)
  } else {
    return await db.select().from(userGroups)
  }
}

export async function addUserGroups(records: NewUserGroup[]) {
  const newUserGroups = await db
    .insert(userGroups)
    .values(records)
    .returning()

  return newUserGroups
}

export async function updateUserGroup(id: number, values: UpdateUserGroup) {
  const [updatedUserGroup] = await db
    .update(userGroups)
    .set(values)
    .where(eq(userGroups.id, id))
    .returning()

  return updatedUserGroup
}

export async function selectUserGroup(id: number) {
  const selectedUserGroup = await db.query.userGroups.findFirst(
    {
      where: eq(userGroups.id, id)
    }
  )
  return selectedUserGroup
}

export async function deleteUserGroup(id: number) {
  const [deletedUserGroup] = await db
    .delete(userGroups)
    .where(eq(userGroups.id, id))
    .returning({ id: userGroups.id })

  return deletedUserGroup
}


export async function getUserById(userId: string, withClause?: any, columns?: any) {
  const [user] = await db.query.users.findMany(
    {
      where: eq(users.id, userId),
      with: withClause,
      columns,
      limit: 1
    }
  )
  return user
}

export async function getUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return user
}

export async function addUser(user: NewUser) {
  const { password, ...userDetails } = user
  const code = crypto.randomBytes(32).toString('hex')
  const hashedPassword = await argon2.hash(password!)

  const isPreVerified = await db.select().from(preVerifiedUsers).where(eq(preVerifiedUsers.email, _.get(userDetails, 'email', '').toLowerCase())).limit(1)

  const [newUser] = await db
    .insert(users)
    .values({
      ...userDetails,
      isVerified: isPreVerified.length == 1,
      password: hashedPassword,
      code,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      code: users.code,
      isVerified: users.isVerified,
      isAdmin: users.isAdmin,
    })

  if (!newUser) {
    throw createError({
        statusCode: 400,
        statusMessage: 'Failed to add user'
    })
  }

  return { user: newUser, code }
}

export async function verifyUser(email: string, code: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)

  if (!user)
    throw createError({
        statusCode: 404,
        statusMessage: 'USER_NOT_FOUND'
    })

  if (user.isVerified) {
    throw createError({
        statusCode: 409,
        statusMessage: 'USER_ALREADY_VERIFIED'
    })
  }

  const isVerified = await argon2.verify(user.code, code)

  if (!isVerified) {
    throw createError({
        statusCode: 401,
        statusMessage: 'UNAUTHORIZED'
    })
  }

  const [updatedUser] = await db
    .update(users)
    .set({ isVerified })
    .where(eq(users.email, email))
    .returning({ id: users.id })

  if (!updatedUser) {
    throw createError({
        statusCode: 409,
        statusMessage: 'INTERNAL_ERROR'
    })
  }
}

export async function getAllVerifiedUsersInfo() {
  return await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(eq(users.isVerified, true))
}

export async function deleteUser(id: string) {
  const user = await getUserById(id)

  if (!user)
    throw createError({
        statusCode: 404,
        statusMessage: 'USER_NOT_FOUND'
    })

  // wrapping in a transaction to delete on multiple tables and rollback if any fail
  const result = await db.transaction(async (tx) => {
    // delete group membership before deleting user
    await tx.delete(userGroupMemberships).where(eq(userGroupMemberships.userId, id))

    const [deletedUser] = await tx.delete(users).where(eq(users.id, id)).returning({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    return deletedUser
  })

  return result
}

export async function changePassword(userId: string, password: string) {

  const hashedPassword = await argon2.hash(password)
  const [updatedUser] = await db
    .update(users)
    .set({password: hashedPassword})
    .where(eq(users.id, userId))
    .returning()

  if (!updatedUser) {
    throw createError({
        statusCode: 404,
        statusMessage: 'USER_NOT_FOUND'
    })
  }

  return updatedUser
}

export async function adminUpdateUser(userId: string, values: AdminUpdateUser) {
  if (values.email) {
    const existingUser = await getUserByEmail(values.email)

    if (existingUser?.id != userId) {
        throw createError({
            statusCode: 409,
            statusMessage: 'Email already in use'
        })
    }
  }

  const existingGroupMemberships = await db.select().from(userGroupMemberships).where(eq(userGroupMemberships.userId, userId))
  const relatedRecordsToDelete = _.differenceBy(existingGroupMemberships, values.userGroupMemberships, 'userGroupId')
  const relatedRecordsToAdd = _.differenceBy(values.userGroupMemberships, existingGroupMemberships, 'userGroupId')

  const updatedUser = await db.transaction(async (tx) => {
    if (relatedRecordsToAdd?.length > 0)
      await tx.insert(userGroupMemberships).values(relatedRecordsToAdd.map((m) => ({ ...m, userId })))
    if (relatedRecordsToDelete?.length > 0)
      await tx.delete(userGroupMemberships).where(inArray(userGroupMemberships.userGroupId, _.map(relatedRecordsToDelete, (x) => x.userGroupId)))

    const [updatedUser] = await tx
      .update(users)
      .set(_.omit(values, ['userGroupMemberships']))
      .where(eq(users.id, userId))
      .returning()

    return updatedUser
  })

  if (!updatedUser) {
    throw createError({
        statusCode: 404,
        statusMessage: 'USER_NOT_FOUND'
    })
  }

  return updatedUser
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  // Delete any existing tokens for this user before creating a new one
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId))

  const rawToken = crypto.randomBytes(32).toString('base64url')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await db.insert(passwordResetTokens).values({ userId, tokenHash, expiresAt })

  return rawToken
}

export async function getValidPasswordResetToken(rawToken: string) {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const now = new Date()

  const [tokenRow] = await db
    .select()
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.tokenHash, tokenHash), gt(passwordResetTokens.expiresAt, now)))
    .limit(1)

  return tokenRow ?? null
}

export async function deletePasswordResetToken(id: string) {
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, id))
}
