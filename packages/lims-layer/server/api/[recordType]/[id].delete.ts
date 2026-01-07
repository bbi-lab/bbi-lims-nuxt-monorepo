import _ from 'lodash'
import { parseDeleteError } from '../../utils/restApi'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { recordType, id } = event.context.params as {recordType: string, id: string}
    if (recordType != _.kebabCase(recordType)) {
        throw createError({
            statusCode: 400,
            statusMessage: `Invalid record type: ${recordType}. Record type parameter must be kebab-case.`
        })
    }

    try {
         // requires relevant schema to have been passed on drizzle db init
        const table = _.get(db, ['query', _.camelCase(recordType), 'table'])

        if (!table) throw createError({
            statusCode: 500,
            statusMessage: `Could not find table, check to make sure ${_.camelCase(recordType)} is included in drizzle db schemas`
        })

        const deletedRecord = await db.delete(table)
            .where(eq(table.id, id))
            .returning()

        return deletedRecord[0]

    } catch (e: unknown) {
        await parseDeleteError(e)
        throw createError({
            statusCode: 400,
            statusMessage: e.statusMessage || e.message,
        })
    }
})
