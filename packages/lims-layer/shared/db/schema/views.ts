import { pgView, uuid, varchar, smallint, boolean } from 'drizzle-orm/pg-core'
import { plates } from './plate'
import { plateTypes } from './plateTypes'
import { wells, wellContents, wellContentSources } from './well'
import { eq, sql } from 'drizzle-orm'

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
}).as(sql`select
    ${plates.id},
    ${plates.name},
    ${plates.sizeX},
    ${plates.sizeY},
    ${plates.plateType},
    ${plates.discarded},
    ${plates.processed},
    ${plateTypes.label} as plate_type_label,
    count(distinct(${wells.id})) as wells_count,
    count(distinct(${wellContents.wellId})) as wells_with_content_count,
    count(distinct(${wellContentSources.sourceWellId})) as wells_processed_count
    from ${plates}
    join ${wells} on ${eq(plates.id, wells.plateId)}
    left join ${plateTypes} on ${eq(plateTypes.value, plates.plateType)}
    left join ${wellContentSources} on ${eq(wells.id, wellContentSources.sourceWellId)}
    left join ${wellContents} on ${eq(wells.id, wellContents.wellId)}
    group by ${plates.id}, ${plateTypes.label}`
)
