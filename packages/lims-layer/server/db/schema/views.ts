import { appConstants } from '../../../shared/constants'
import _ from 'lodash'
import { pgView, uuid, varchar, smallint, boolean } from 'drizzle-orm/pg-core'
import { plates } from './plate'
import { wells, wellContents, wellContentSources } from './well'
import { eq, sql } from 'drizzle-orm'

// create a CTE for plate types from enumLookups to use in view
const plateTypesAsSqlValues = _.map(appConstants.enumLookups.plates.plateType, (value, key) => {
  return `('${key}', '${value.label}', '${value.desc}')`
})
const plateTypesCte = `with plate_types(plate_type_value, plate_type_label, plate_type_desc) AS (VALUES ${plateTypesAsSqlValues.join(', ')})`

export const viewPlatesWithWellCounts = pgView('view_plates_with_well_counts', {
  id: uuid('id'),
  name: varchar('name', { length: 255 }),
  sizeX: smallint('size_x'),
  sizeY: smallint('size_y'),
  plateType: varchar('plate_type'),
  discarded: boolean('discarded'),
  processed: boolean('processed'),
  plateTypeLabel: varchar('plate_type_label'),
  wellsCount: smallint('wells_count'),
  wellsWithContentCount: smallint('wells_with_content_count'),
  wellsProcessedCount: smallint('wells_processed_count'),
}).as(sql`${sql.raw(plateTypesCte)} select
    ${plates.id},
    ${plates.name},
    ${plates.sizeX},
    ${plates.sizeY},
    ${plates.plateType},
    ${plates.discarded},
    ${plates.processed},
    (select distinct on (plate_type_value) plate_type_label from plate_types where plate_type_value = ${plates.plateType}) as plate_type_label,
    count(distinct(${wells.id})) as wells_count,
    count(distinct(${wellContents.wellId})) as wells_with_content_count,
    count(distinct(${wellContentSources.sourceWellId})) as wells_processed_count
    from ${plates}
    join ${wells} on ${eq(plates.id, wells.plateId)}
    left join ${wellContentSources} on ${eq(wells.id, wellContentSources.sourceWellId)}
    left join ${wellContents} on ${eq(wells.id, wellContents.wellId)}
    group by ${plates.id}`
)
