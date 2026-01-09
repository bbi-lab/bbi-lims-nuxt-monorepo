import { schemas } from '../../../db/schema/user'
import { usersRelationsConfig } from '../../../db/relations/relations'
import _ from 'lodash'

export default defineEventHandler(async (event) => {
    const { schema } = event.context.params as {schema: string}
    const { id } = getQuery(event) as {id: string}

    try {
        const currentSchema = schemas[_.camelCase(schema)]

        // generate JSON Schema from Zod object
        const jsonSchema = zodToSafeTypeJSONSchema(currentSchema)

        // refine JSON Schema based on relations
        // including ID from query params to set as default in related records
        await refineJsonSchema(jsonSchema, usersRelationsConfig, id)

        return jsonSchema
    } catch (e: any) {
        throw createError({
            statusCode: 400,
            statusMessage: e.message
        })
    }
})
