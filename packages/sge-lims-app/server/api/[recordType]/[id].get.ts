import _ from 'lodash'

export default defineEventHandler(async (event) => {
    const { recordType, id } = event.context.params as { recordType: string, id: string }
    if (recordType != _.kebabCase(recordType)) {
        throw createError({
            statusCode: 400,
            statusMessage: `Invalid record type: ${recordType}. Record type must be kebab-case.`,
        })
    }

    const db = useSgeDrizzle()
    const queryParams = getQuery(event) as QueryParams
    const selectParams = queryToSelectParams(queryParams) as SelectParams

    try {
        const queryBuilder = _.get(db.query, _.camelCase(recordType))

        let selectedRecord
        if (queryBuilder) {
            const table = _.get(queryBuilder, 'table')
            selectedRecord = await selectRecord(queryBuilder, table, id, selectParams.with, selectParams.columns)
        } else {
            const view = _.get(sgeSchema, _.camelCase(recordType))
            if (!view) {
              throw new Error(`Record type ${recordType} not found in queryBuilder or schema`)
            }
            selectedRecord = await selectRecordFromView(view, id)
        }
        return selectedRecord
    } catch (e: any) {
        throw createError({ statusCode: 400, statusMessage: e.message })
    }
})
