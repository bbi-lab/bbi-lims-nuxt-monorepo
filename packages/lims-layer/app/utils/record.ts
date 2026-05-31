import _ from 'lodash'
import type { TableNames } from '../../shared/types/drizzle'

// Cast to bypass TypeScript's route-inference on dynamic baseUrl strings
const _fetch = $fetch as any

export const RecordService = {
    async getRecord(baseUrl: string, id: string, withClause: Object | undefined) {
        const fetchOptions = withClause ? {query: {with: withClause}} : undefined
        try {
            const record = await _fetch(`${baseUrl}/${id}`, fetchOptions)
            return record
        } catch (error: any) {
            if (error.data?.statusCode == 401 && error.data?.statusMessage == 'TOKEN EXPIRED') {
                useLayout().showLoginModal()
            } else {
                throw error
            }
        }
    },

    async getRecordTyped<FetchType>(tableName: TableNames, id: string, withClause: any, columns: any) {
        const fetchOptions = {query: {with: withClause, columns }}
        const record = await useFetch<FetchType>(`/api/${tableName as string}/${id}` as any, fetchOptions)
        return record.data as FetchType
    },

    async getRecordsByIds(baseUrl: string, ids: string[], withClause?: Object) {
        const fetchOptions = {query: {where: {"in": [{"var": "id"}, ids]}}}
        if (withClause) _.set(fetchOptions, ['query', 'with'], withClause)
        // use search POST endpoint with request body to avoid URL length issues with large ids array
        const records = await _fetch(`${baseUrl}/search`, {method: 'POST', body: fetchOptions}) as any[]
        return records
    },

    async getRecords(baseUrl: string, withClause?: Object, where?: Object) {
        const fetchOptions = {query: {with: withClause, where}}
        try {
            const records =  await _fetch(`${baseUrl}`, fetchOptions) as any[]
            return records
        } catch (error: any) {
            if (error.data?.statusCode == 401 && error.data?.statusMessage == 'TOKEN EXPIRED') {
                useLayout().showLoginModal()
            } else {
                throw error
            }
        }
    },

    async updateRecord(baseUrl: string, record: any, withClause?: Object) {
        const {id, ...values} = record
        try {
            const updatedRecords = await _fetch(`${baseUrl}/${id}`, {method: 'PUT', body: values})
            if (!_.isEmpty(withClause)) {
                const fetchOptions = {query: {with: withClause}}
                const record = await _fetch(`${baseUrl}/${id}`, fetchOptions)
                return record
            } else {
                return updatedRecords
            }
        } catch (error: any) {
            if (error.data?.statusCode == 401 && error.data?.statusMessage == 'TOKEN EXPIRED') {
                useLayout().showLoginModal()
            } else {
                throw error
            }
        }
    },

    async updateRecords(baseUrl: string, ids: string[], values: Object, withClause?: Object) {
        try {
            const updatedRecords = await _fetch(baseUrl, {method: 'PUT', body: {ids, values}})
            if (!_.isEmpty(withClause) && !_.isEmpty(updatedRecords)) {
                const whereClause = {"in": [{"var": "id"}, ids]}
                const fetchOptions = {query: {with: withClause, where: whereClause}}
                const records = await _fetch(baseUrl, fetchOptions)
                return records
            } else {
                return updatedRecords
            }
        } catch (error: any) {
            if (error.data?.statusCode == 401 && error.data?.statusMessage == 'TOKEN EXPIRED') {
                useLayout().showLoginModal()
            } else {
                throw error
            }
        }
    },

    async addRecord(baseUrl: string, record: any) {
        const {id, ...values} = record
        try {
            const newRecords = await _fetch(`${baseUrl}`, {method: 'POST', body: [values]})
            return _.get(newRecords, 0)
        } catch (error: any) {
            if (error.data?.statusCode == 401 && error.data?.statusMessage == 'TOKEN EXPIRED') {
                useLayout().showLoginModal()
            } else {
                throw error
            }
        }
    },

    async addRecords(baseUrl: string, records: any) {
        const recordsCopy = _.map(records, (x) => _.omit(x, 'id'))
        try {
            const newRecords = await _fetch(`${baseUrl}`, {method: 'POST', body: recordsCopy})
            return newRecords
        } catch (error: any) {
            if (error.data?.statusCode == 401 && error.data?.statusMessage == 'TOKEN EXPIRED') {
                useLayout().showLoginModal()
            } else {
                throw error
            }
        }
    },

    async deleteRecord(baseUrl: string, id: string) {
        try {
            const deletedRecord = await _fetch(`${baseUrl}/${id}`, {method: 'DELETE'})
            return deletedRecord
        } catch (error: any) {
            if (error.data?.statusCode == 401 && error.data?.statusMessage == 'TOKEN EXPIRED') {
                useLayout().showLoginModal()
            } else {
                throw error
            }
        }
    },

    async deleteRecords(baseUrl: string, records: any) {
        try {
            const deletedRecords = []
            for (const {id} of records) {
                const data = await _fetch(`${baseUrl}/${id}`,  {method: 'DELETE'})
                deletedRecords.push(data)
            }
            return deletedRecords
        } catch (error: any) {
            if (error.data?.statusCode == 401 && error.data?.statusMessage == 'TOKEN EXPIRED') {
                useLayout().showLoginModal()
            } else {
                throw error
            }
        }
    },
}
