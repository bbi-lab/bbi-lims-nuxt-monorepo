import { createSelectSchema } from 'drizzle-zod'
import _ from 'lodash'
import { users, userGroups, userGroupMemberships } from './user'
import type { PgTable, TableConfig } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm/relations'

// relations config
// defines M:M between users and groups
export const userGroupMembershipsRelationsConfig: RelationsConfig = {
    one:{
      userGroup: {
        referenceTable: userGroups,
        fields: [userGroupMemberships.userGroupId],
        references: [userGroups.id],
      },
      user: {
        referenceTable: users,
        fields: [userGroupMemberships.userId],
        references: [users.id],
      }
    },
    many:{}
  }

  export const userGroupsRelationsConfig: RelationsConfig = {
    one:{},
    many:{
      userGroupMemberships: {
        table: userGroupMemberships,
        schema: createSelectSchema(userGroupMemberships),
        fields: [userGroupMemberships.userId],
        relationsConfig: userGroupMembershipsRelationsConfig
      }
    }
  }

  export const usersRelationsConfig: RelationsConfig = {
    one:{},
    many: {
      userGroupMemberships: {
        table: userGroupMemberships,
        schema: createSelectSchema(userGroupMemberships),
        fields: [userGroupMemberships.userId],
        relationsConfig: userGroupMembershipsRelationsConfig
      }
    }
  }

  export function relationsConfigToRelations(table: PgTable<TableConfig>, relationsConfig: RelationsConfig) {
    return relations(table, ({ one, many }) => (
      {
          ..._.mapValues(relationsConfig.one || {}, (x) => {
              return one(x.referenceTable, {
                fields: x.fields,
                references: x.references,
              })
          }),
          ..._.mapValues(relationsConfig.many || {}, (x) => {
              if (x.relationName) {
                  return many(x.table, {relationName: x.relationName})
              } else {
                  return many(x.table)
              }
          }),
          ..._.mapValues(relationsConfig.oneToOne || {}, (x) => {
                return one(x.table)
          }),
      }
  ))
}

// relations
export const usersRelations = relationsConfigToRelations(users, usersRelationsConfig)
export const userGroupsRelations = relationsConfigToRelations(userGroups, userGroupsRelationsConfig)
export const userGroupMembershipsRelations = relationsConfigToRelations(userGroupMemberships, userGroupMembershipsRelationsConfig)
