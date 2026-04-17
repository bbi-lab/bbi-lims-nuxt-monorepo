
import z from 'zod'
import { schemas } from '../db/zod/zodSchemas'

export type NewUser = z.infer<typeof schemas.users.insert>
export type LoginUser = z.infer<typeof schemas.users.login>
export type ChangePassword = z.infer<typeof schemas.users.changePassword>
export type UpdateUser = z.infer<typeof schemas.users.update>
export type AdminUpdateUser = z.infer<typeof schemas.users.adminUpdate>
export type NewUserGroup = z.infer<typeof schemas.userGroups.insert>
export type UpdateUserGroup = z.infer<typeof schemas.userGroups.update>
