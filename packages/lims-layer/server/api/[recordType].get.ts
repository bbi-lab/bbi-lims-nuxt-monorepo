import _ from 'lodash'

export default defineEventHandler(async (event) => {
    const { recordType } = event.context.params as {recordType: string}
    if (recordType != _.kebabCase(recordType)) {
        throw createError({
            statusCode: 400,
            statusMessage: `Invalid record type: ${recordType}. Record type must be kebab-case.`
        })
    }

    const db = useDrizzle()

    try {
        const queryParams = getQuery(event) as QueryParams & { flat?: string }
        const selectParams = queryToSelectParams(queryParams) as SelectParams

        // `flat=true` forces the plain SQL view path (selectRecordsFromView →
        // jsonLogicToSql) instead of the relational query builder. This matches the
        // translator used by the /count endpoint and enables cast-based substring
        // filtering on any column type (enum, integer). Used by SmartTable's lazy mode.
        const flat = String(queryParams.flat) === 'true'
        // requires relevant schema to have been passed on drizzle db init
        const queryBuilder = flat ? undefined : _.get(db.query, _.camelCase(recordType))
        if (queryBuilder) {
            return await selectRecords(queryBuilder, selectParams)
        } else {
            // if the recordType is not found in the queryBuilder, then assume it's a view
            const view = _.get(schema, _.camelCase(recordType))
            if (!view) {
                throw new Error(`Record type ${recordType} not found in queryBuilder or schema`)
            }
            return await selectRecordsFromView(view, selectParams)
        }
    } catch (e: any) {
        throw createError({
            statusCode: 400,
            statusMessage: e.message
        })
    }
})
