import z from "zod"
import {getAllVerifiedUsersInfo} from './user'
import { users } from '../db/schema/user'
import _ from 'lodash'

export function zodToSafeTypeJSONSchema(zodSchema: z.ZodObject<z.core.$ZodLooseShape, z.core.$strip>) {
  return z.toJSONSchema(zodSchema, {
    unrepresentable: "any",
    override: (ctx) => {
        const def = ctx.zodSchema._zod.def
        if(def.type ==="date"){
            ctx.jsonSchema.type = "string"
            ctx.jsonSchema.format = "date-time"
        } else if(def.type ==="bigint"){
            ctx.jsonSchema.type = "integer"
            ctx.jsonSchema.format = "int64"
        }
    }
  })
}

export async function refineJsonSchema(jsonSchema: z.core.ZodStandardJSONSchemaPayload<z.ZodObject<z.core.$ZodLooseShape, z.core.$strip>>, relationsConfig: RelationsConfig, defaultId?: string) {
    // define JSON schema property as coded list of users, to be applied to JSON schema
    const usersInfo = await getAllVerifiedUsersInfo()
    const usersJsonSchemaProperty = {
      type: 'string',
      oneOf: [{ const: null, title: '(none)' }, ..._.map(usersInfo, (x) => { return { const: x.id, title: x.name } })],
    }

    // iterate over properties and replace one-to-many relations with corresponding JsonSchema property
    const properties = Object.keys(_.get(jsonSchema, 'properties', {}))
    for (const property of properties) {
      if (relationsConfig.one && Object.keys(relationsConfig.one).includes(property)) {
        if (_.get(relationsConfig.one, [property, 'referenceTable']) === users) {
          _.set(jsonSchema, ['properties', property], usersJsonSchemaProperty)
        }
      }
    }

    // iterate over many-to-many relations and add each to JSON schema as a new array property
    if (relationsConfig.many) {
      for (const [key, val] of Object.entries(relationsConfig.many)) {
        // const items = await await db.select().from(val.table)

        // get full schema of many-to-many table
        const itemsZodSchema = val.schema
        const itemsJsonSchema = zodToSafeTypeJSONSchema(itemsZodSchema)

        // set foreign key value as default to be used for new items added to array
        // TODO - add support for composite foreign keys
        const foreignKeyField = val.fields[0]
        const foreignKeyPropertyName = _.camelCase(foreignKeyField.name)
        if (defaultId && foreignKeyPropertyName) {
          _.set(itemsJsonSchema, ['properties', foreignKeyPropertyName, 'default'], defaultId)
        }

        if (!_.isEmpty(val.relationsConfig?.one)) {
          // get first nested "one" relation that doesn't point back to the primary table
          const itemsRelationName = _.findKey(val.relationsConfig.one, (x) => x.fields != val.fields)

          if (itemsRelationName) {
            const itemsRelationConfig = val.relationsConfig.one[itemsRelationName]
            if (itemsRelationConfig && itemsRelationConfig.fields?.[0]) {
              const itemsRelationsConfigField = itemsRelationConfig.fields[0]

              // get related records
              const relatedRecords = await db.select().from(itemsRelationConfig.referenceTable)

              // convert to JsonSchema property
              // TODO - needs to handle string IDs and alternative fields for title, composite fields
              const relatedRecordsJsonSchemaProperty = {
                type: 'number',
                oneOf: _.map(relatedRecords, (x) => { return { const: x.id, title: x.name } }),
              }

              // TODO - this will only be true as long as column name in drizzle table defintion is camel-case version of column name in the database
              const propNameToReplace = _.camelCase(itemsRelationsConfigField.name)
              _.set(itemsJsonSchema, ['properties', propNameToReplace], relatedRecordsJsonSchemaProperty)
            }
          } else {
            throw createError({statusCode: 500})
          }
        }

        const jsonSchemaArrayProperty = {
          type: 'array',
          items: itemsJsonSchema
        }
        _.set(jsonSchema, ['properties', key], jsonSchemaArrayProperty)
      }
    }
}
