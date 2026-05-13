import { defineRelations } from 'drizzle-orm'
import { users, userGroups, userGroupMemberships, passwordResetTokens } from '../schema/user'
import { genes } from '../../../shared/db/schema/gene'
import { plates } from '../../../shared/db/schema/plate'
import { plateTypes } from '../../../shared/db/schema/plateTypes'
import { wellables, wellContents, wellContentSources, wells } from '../../../shared/db/schema/well'

export const relations = defineRelations({
  users,
  userGroups,
  userGroupMemberships,
  passwordResetTokens,
  genes,
  plates,
  plateTypes,
  wells,
  wellContents,
  wellables,
  wellContentSources,
}, (r) => ({
  users: {
    userGroupMemberships: r.many.userGroupMemberships(),
  },
  userGroups: {
    userGroupMemberships: r.many.userGroupMemberships(),
  },
  userGroupMemberships: {
    userGroup: r.one.userGroups({
      from: r.userGroupMemberships.userGroupId,
      to: r.userGroups.id,
    }),
    user: r.one.users({
      from: r.userGroupMemberships.userId,
      to: r.users.id,
    }),
  },
  plates: {
    wells: r.many.wells(),
    plateTypeRef: r.one.plateTypes({
      from: r.plates.plateType,
      to: r.plateTypes.value,
    }),
  },
  plateTypes: {
    plates: r.many.plates(),
  },
  wells: {
    plate: r.one.plates({
      from: r.wells.plateId,
      to: r.plates.id,
    }),
    wellContents: r.many.wellContents(),
  },
  wellContents: {
    well: r.one.wells({
      from: r.wellContents.wellId,
      to: r.wells.id,
    }),
    wellable: r.one.wellables({
      from: r.wellContents.wellableId,
      to: r.wellables.id,
    }),
    wellContentSources: r.many.wellContentSources(),
  },
  wellables: {
    wellContents: r.many.wellContents(),
  },
  wellContentSources: {
    wellContent: r.one.wellContents({
      from: r.wellContentSources.wellContentId,
      to: r.wellContents.id,
    }),
    sourceWell: r.one.wells({
      from: r.wellContentSources.sourceWellId,
      to: r.wells.id,
    }),
    createdByUser: r.one.users({
      from: r.wellContentSources.createdBy,
      to: r.users.id,
    }),
  },
}))
