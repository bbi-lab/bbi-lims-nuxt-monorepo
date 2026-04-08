import { createSelectSchema } from 'drizzle-zod'
import _ from 'lodash'
import { users, userGroups, userGroupMemberships } from '../schema/user'
import type { PgTable, TableConfig } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm/relations'
import { genes } from '../../../shared/db/schema/gene'
import { plates } from '../../../shared/db/schema/plate'
import { wellables, wellContents, wellContentSources, wells } from '../../../shared/db/schema/well'

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
export const userGroupMembershipsRelations = relationsConfigToRelations(userGroupMemberships, userGroupMembershipsRelationsConfig)

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
export const userGroupsRelations = relationsConfigToRelations(userGroups, userGroupsRelationsConfig)

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
export const usersRelations = relationsConfigToRelations(users, usersRelationsConfig)


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

const genesRelationsConfig: RelationsConfig = {}
export const genesRelations = relationsConfigToRelations(genes, genesRelationsConfig)

const wellContentsRelationsConfig: RelationsConfig = {
    one:{
        well: {
            fields: [wellContents.wellId],
            referenceTable: wells,
            references: [wells.id],
        },
        wellable: {
            fields: [wellContents.wellableId],
            referenceTable: wellables,
            references: [wellables.id],
        },
    },
    many: {
        wellContentSources: {
            table: wellContentSources,
            schema: createSelectSchema(wellContentSources),
            fields: [wellContentSources.wellContentId],
        },
    },
}
export const wellContentsRelations = relationsConfigToRelations(wellContents, wellContentsRelationsConfig)

const wellablesRelationsConfig: RelationsConfig = {
    many: {
        wellContents: {
            table: wellContents,
            schema: createSelectSchema(wellContents),
            fields: [wellContents.wellableId],
        },
    }
}
export const wellablesRelations = relationsConfigToRelations(wellables, wellablesRelationsConfig)

const wellContentSourcesRelationsConfig: RelationsConfig = {
    one: {
        wellContent: {
            fields: [wellContentSources.wellContentId],
            referenceTable: wellContents,
            references: [wellContents.id],
        },
        sourceWell: {
            fields: [wellContentSources.sourceWellId],
            referenceTable: wells,
            references: [wells.id],
        },
        createdBy: {
            fields: [wellContentSources.createdBy],
            referenceTable: users,
            references: [users.id],
        },
    },
}
export const wellContentSourcesRelations = relationsConfigToRelations(wellContentSources, wellContentSourcesRelationsConfig)

const wellsRelationsConfig: RelationsConfig = {
    one:{
        plate: {
            fields: [wells.plateId],
            referenceTable: plates,
            references: [plates.id],
        },
    },
    many: {
        wellContents: {
            fields: [wellContents.wellId],
            table: wellContents,
            schema: createSelectSchema(wellContents),
        }
    }
}
export const wellsRelations = relationsConfigToRelations(wells, wellsRelationsConfig)

const platesRelationsConfig: RelationsConfig = {
    many: {
        wells: {
            table: wells,
            schema: createSelectSchema(wells),
            fields: [wells.plateId],
        }
    }
}
export const platesRelations = relationsConfigToRelations(plates, platesRelationsConfig)


export const relationsConfigs: { [tableName: string] : RelationsConfig } = {
    genes: genesRelationsConfig,
    plates: platesRelationsConfig,
    wells: wellsRelationsConfig,
    wellContents: wellContentsRelationsConfig,
    wellables: wellablesRelationsConfig,
    wellContentSources: wellContentSourcesRelationsConfig,
}
