import { schemas } from '../../../db/zod/zodSchemas'
import { relationsConfigs } from '../../../db/relations/relations'
import _ from 'lodash'
import type { ZodObject } from 'zod'
import type { RelationsConfig } from '../../../utils/db'
import { refineJsonSchema, zodToSafeTypeJSONSchema } from '../../../utils/jsonSchema'
import type { EnumLookup } from '../../../../shared/types/enumLookups'
import { appConstants } from '../../../../shared/constants'

export default defineEventHandler(async (event) => {
    const { recordType, schema } = event.context.params as {recordType: string, schema: string}
    const { id } = getQuery(event) as {id: string}

    try {
        const currentSchema = _.get(schemas, [_.camelCase(recordType), _.camelCase(schema)]) as ZodObject

        // generate JSON Schema from Zod object
        // and convert unrepresentable types like date and bigint (see https://zod.dev/json-schema#unrepresentable)
        // TODO - using "unrepresentable: 'any'" here prevents errors for all unrepresentable types but we only want that for the types covered in override
        // Ideally, other types if encountered should would still throw an error. See related issue: https://github.com/colinhacks/zod/issues/5234
        const jsonSchema = zodToSafeTypeJSONSchema(currentSchema)

        const relationsConfig = _.get(relationsConfigs, _.camelCase(recordType)) as RelationsConfig
        const enumLookups = _.get(appConstants.enumLookups, _.camelCase(recordType), {}) as EnumLookup

        if (relationsConfig) await refineJsonSchema(jsonSchema, relationsConfig, id, enumLookups)

        return jsonSchema

    } catch (e: any) {
        throw createError({
            statusCode: 400,
            statusMessage: e.message
        })
    }
})
