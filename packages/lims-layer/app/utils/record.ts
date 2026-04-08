import type { DBQueryConfig } from 'drizzle-orm'
import _ from 'lodash'
import type { TableNames } from '../../shared/types/drizzle'

const { showLoginModal } = useLayout()

export const RecordService = {
    async getRecord(baseUrl: string, id: string, withClause: Object | undefined, expandEnums: boolean = false) {
        const fetchOptions = {query: {expandEnums}}
        if (withClause) _.set(fetchOptions, ['query', 'with'], withClause)
        try {
            const record = await $fetch(`${baseUrl}/${id}`, fetchOptions)
            return record
        } catch (error: any) {
            if (error.data?.statusCode == 401 && error.data?.statusMessage == 'TOKEN EXPIRED') {
                showLoginModal()
            } else {
                throw error
            }
        }
    },

    async getRecordTyped<FetchType>(tableName: TableNames, id: string, withClause: DBQueryConfig["with"], columns: DBQueryConfig["columns"]) {
        const fetchOptions = {query: {with: withClause, columns }}
        const record = await useFetch<FetchType>(`/api/${tableName}/${id}`, fetchOptions)
        return record.data as FetchType
    },

    async getRecordsByIds(baseUrl: string, ids: string[], withClause?: Object, expandEnums: boolean = false) {
        const fetchOptions = {query: {expandEnums, where: {"in": [{"var": "id"}, ids]}}}
        if (withClause) _.set(fetchOptions, ['query', 'with'], withClause)
        // use search POST endpoint with request body to avoid URL length issues with large ids array
        const records = await $fetch(`${baseUrl}/search`, {method: 'POST', body: fetchOptions}) as any[]
        return records
    },

    async getRecords(baseUrl: string, withClause?: Object, where?: Object, expandEnums: boolean = false) {
        const fetchOptions = {query: {expandEnums}}
        if (withClause) _.set(fetchOptions, ['query', 'with'], withClause)
        if (where) _.set(fetchOptions, ['query', 'where'], where)
        try {
            const records =  await $fetch(`${baseUrl}`, fetchOptions) as any[]
            return records
        } catch (error: any) {
            if (error.data?.statusCode == 401 && error.data?.statusMessage == 'TOKEN EXPIRED') {
                showLoginModal()
            } else {
                throw error
            }
        }
    },

    async getSchema(schemaBaseUrl: string, schemaName: string, recordId?: string) {
        const query = recordId ? `?id=${recordId}` : ''
        try {
            const schema = await $fetch(`${schemaBaseUrl}/${schemaName}${query}`)
            return schema
        } catch (error: any) {
            if (error.data?.statusCode == 401 && error.data?.statusMessage == 'TOKEN EXPIRED') {
                showLoginModal()
            } else {
                throw error
            }
        }
    },

    async updateRecord(baseUrl: string, record: any, withClause?: Object) {
        const {id, ...values} = record
        try {
            const updatedRecords = await $fetch(`${baseUrl}/${id}`, {method: 'PUT', body: values})
            if (!_.isEmpty(withClause)) {
                const fetchOptions = {query: {with: withClause}}
                const record = await $fetch(`${baseUrl}/${id}`, fetchOptions)
                return record
            } else {
                return updatedRecords
            }
        } catch (error: any) {
            if (error.data?.statusCode == 401 && error.data?.statusMessage == 'TOKEN EXPIRED') {
                showLoginModal()
            } else {
                throw error
            }
        }
    },

    async updateRecords(baseUrl: string, ids: string[], values: Object, withClause?: Object) {
        try {
            const updatedRecords = await $fetch(baseUrl, {method: 'PUT', body: {ids, values}})
            if (!_.isEmpty(withClause) && !_.isEmpty(updatedRecords)) {
                const whereClause = {"in": [{"var": "id"}, ids]}
                const fetchOptions = {query: {with: withClause, where: whereClause}}
                const records = await $fetch(baseUrl, fetchOptions)
                return records
            } else {
                return updatedRecords
            }
        } catch (error: any) {
            if (error.data?.statusCode == 401 && error.data?.statusMessage == 'TOKEN EXPIRED') {
                showLoginModal()
            } else {
                throw error
            }
        }
    },

    async addRecord(baseUrl: string, record: any) {
        const {id, ...values} = record
        try {
            const newRecords = await $fetch(`${baseUrl}`, {method: 'POST', body: [values]})
            return _.get(newRecords, 0)
        } catch (error: any) {
            if (error.data?.statusCode == 401 && error.data?.statusMessage == 'TOKEN EXPIRED') {
                showLoginModal()
            } else {
                throw error
            }
        }
    },

    async addRecords(baseUrl: string, records: any) {
        const recordsCopy = _.map(records, (x) => _.omit(x, 'id'))
        try {
            const newRecords = await $fetch(`${baseUrl}`, {method: 'POST', body: recordsCopy})
            return newRecords
        } catch (error: any) {
            if (error.data?.statusCode == 401 && error.data?.statusMessage == 'TOKEN EXPIRED') {
                showLoginModal()
            } else {
                throw error
            }
        }
    },

    async deleteRecord(baseUrl: string, id: string) {
        try {
            const deletedRecord = await $fetch(`${baseUrl}/${id}`, {method: 'DELETE'})
            return deletedRecord
        } catch (error: any) {
            if (error.data?.statusCode == 401 && error.data?.statusMessage == 'TOKEN EXPIRED') {
                showLoginModal()
            } else {
                throw error
            }
        }
    },

    async deleteRecords(baseUrl: string, records: any) {
        try {
            const deletedRecords = []
            for (const {id} of records) {
                const data = await $fetch(`${baseUrl}/${id}`,  {method: 'DELETE'})
                deletedRecords.push(data)
            }
            return deletedRecords
        } catch (error: any) {
            if (error.data?.statusCode == 401 && error.data?.statusMessage == 'TOKEN EXPIRED') {
                showLoginModal()
            } else {
                throw error
            }
        }
    },
}
