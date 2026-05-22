import _ from 'lodash'

type QueryParamValue = string | null | (string | null)[]
type QueryParams = Record<string, QueryParamValue>

const ARRAY_NOTATION_REGEX = /^(.+?)\[\]\.(.+)$/

/**
 * Converts URL query parameters into a JSONLogic where clause.
 *
 * Supported query param formats:
 * - Simple equality: `?key=value` → `{"==": [{"var": "key"}, "value"]}`
 * - Multiple values (same key): `?key=v1&key=v2` → `{"in": [{"var": "key"}, ["v1", "v2"]]}`
 * - Array element match: `?arrayField[].nestedKey=value`
 *     → `{"some": [{"var": "arrayField"}, {"==": [{"var": "nestedKey"}, "value"]}]}`
 * - Array element match (multiple values): `?arrayField[].nestedKey=v1&arrayField[].nestedKey=v2`
 *     → `{"some": [{"var": "arrayField"}, {"in": [{"var": "nestedKey"}, ["v1", "v2"]]}]}`
 *
 * Multiple distinct filters are combined with "and".
 * Returns undefined if no valid filters can be constructed.
 */
export function queryParamsToJsonLogic(queryParams: QueryParams): object | object[] | undefined {
    if (_.isEmpty(queryParams)) return undefined

    const filters: object[] = []

    _.forEach(queryParams, (val, key) => {
        if (val === null || val === undefined) return

        const arrayMatch = key.match(ARRAY_NOTATION_REGEX)

        if (arrayMatch) {
            const [, arrayField, nestedKey] = arrayMatch
            if (Array.isArray(val)) {
                const values = val.filter((v): v is string => v !== null)
                if (values.length > 0) {
                    filters.push({
                        "some": [{"var": arrayField}, {"in": [{"var": nestedKey}, values]}]
                    })
                }
            } else {
                filters.push({
                    "some": [{"var": arrayField}, {"==": [{"var": nestedKey}, val]}]
                })
            }
        } else {
            if (Array.isArray(val)) {
                const values = val.filter((v): v is string => v !== null)
                if (values.length === 1) {
                    filters.push({"==": [{"var": key}, values[0]]})
                } else if (values.length > 1) {
                    filters.push({"in": [{"var": key}, values]})
                }
            } else {
                filters.push({"==": [{"var": key}, val]})
            }
        }
    })

    if (filters.length === 0) return undefined
    return filters.length > 1 ? {"and": filters} : filters
}

/**
 * Extracts simple (non-array-notation) query parameters for use as readonly form values.
 * Strips out array notation params (e.g. `arrayField[].nestedKey`) since they don't
 * correspond to direct form fields.
 */
export function getSimpleQueryParams(queryParams: QueryParams): Record<string, any> {
    return _.pickBy(queryParams, (_val, key) => !ARRAY_NOTATION_REGEX.test(key)) as Record<string, any>
}
