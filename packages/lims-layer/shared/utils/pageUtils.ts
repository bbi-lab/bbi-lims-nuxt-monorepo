import { wellCoordinateToChar } from '../lib/plate-diagram'
import _ from 'lodash'

export const isNumeric = (val: any): boolean => typeof val === 'string' && val.trim() !== '' && Number.isFinite(Number(val))

export const combinedWellLocations = <T extends boolean>(x: any, options: {asDict?: T, excludePlateIds?: string[], includePlateIds?: string[]} = {}): T extends true ? Record<string, string> : string => {
    const wellContents = x?.wellable?.wellContents || []

    // Group well contents by plate
    const contentsByPlate = _.groupBy(wellContents, (wellContent) => wellContent.well.plate.id)

    // filter based on include/exclude plate ids if provided
    const filteredContentsByPlate = _.pickBy(contentsByPlate, (contents, plateId) => {
        if (options.includePlateIds) {
            return options.includePlateIds.includes(plateId)
        }
        if (options.excludePlateIds) {
            return !options.excludePlateIds.includes(plateId)
        }
        return true
    })

    const result: Record<string, string> = {}

    _.forEach(filteredContentsByPlate, (plateWellContents, plateId) => {
        const plateName = plateWellContents[0]?.well?.plate?.name || `Plate ${plateId}`

        // Extract well coordinates for this plate
        const wellCoordinates = _.map(plateWellContents, (wellContent) => {
            return {x: wellContent.well.x, y: wellContent.well.y}
        })

        // Group by X coordinate and find Y ranges
        const contentsGroupedByX = _.groupBy(wellCoordinates, 'x')
        const yRanges = _.mapValues(contentsGroupedByX, (coordinates) => {
            const sortedByY = _.sortBy(coordinates, 'y')
            const consecutiveYRanges = _.reduce(sortedByY, (acc, coordinate) => {
                if (acc.length === 0 || _.get(acc[acc.length - 1], 'maxY', 0) + 1 < coordinate.y) {
                    acc.push({ x: coordinate.x, minY: coordinate.y, maxY: coordinate.y })
                } else {
                    const lastItem = acc[acc.length - 1]
                    if (lastItem) {
                        lastItem.maxY = Math.max(lastItem.maxY, coordinate.y)
                    }
                }
                return acc
            }, [] as Array<{ x: number; minY: number; maxY: number }>)
            return consecutiveYRanges
        })

        // Format well coordinate ranges for this plate
        const wellLocationString = _.map(_.flatten(_.values(yRanges)), (val) => {
            return val.minY == val.maxY ? `${wellCoordinateToChar(val.minY)}${val.x}` : `${wellCoordinateToChar(val.minY)}${val.x}-${wellCoordinateToChar(val.maxY)}${val.x}`
        }).join(', ')

        result[plateName] = wellLocationString
    })

    return (options.asDict ? result : _.join(_.map(result, (val, key) => `${key}: ${val}`), '; ')) as any
}
